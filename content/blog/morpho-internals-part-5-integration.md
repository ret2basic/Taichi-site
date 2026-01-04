---
title: "Morpho Internals Part 5: Integration Security Guide"
slug: "morpho-internals-part-5-integration"
excerpt: "A security-focused guide for integrating with Morpho: an expanded walkthrough of the official integration checklist, with concrete pitfalls and code-level explanations for core and MetaMorpho vault flows."
author: "ret2basic.eth (reviewed by jesjupyter)"
date: "2026-01-04"
readTime: "30 min read"
category: "DeFi"
tags: ["Morpho", "Lending", "Source Code Walkthrough"]
featured: false
image: "/images/blog/Morpho.jpg"
---

After the long journey from Part 1 to Part 4, we’ve gained a deep understanding of the Morpho ecosystem (markets, IRMs, oracles, vaults). That context makes the [official integration checklist](https://github.com/morpho-org/morpho-security/blob/main/integration-checklist.md) much easier to reason about. In Part 5 we expand the checklist, break down each entry, and explain it with relevant source code. Both developers and security researchers should benefit from this article.

## General Comments

### 1. Must implement ERC20 withdrawal functionality

> Make sure the contract calling Morpho's core contracts or Morpho's vaults has the capacity to withdraw ERC20 tokens from the contract. Otherwise, MORPHO rewards or underlying-protocol rewards could be stuck in the contract (forever...).

The following Morpho doc pages describe the rewards mechanism:

- https://docs.morpho.org/learn/concepts/rewards/
- https://docs.morpho.org/build/rewards/get-started
- https://docs.morpho.org/build/rewards/concepts/reward-campaigns
- https://docs.morpho.org/build/rewards/concepts/distribution-system

Rewards are generated passively when users:

- supplying assets to a market
- borrowing from a market
- or simply depositing collateral without borrowing

Morpho used to use [URD](https://github.com/morpho-org/universal-rewards-distributor/blob/main/src/UniversalRewardsDistributor.sol) for reward distribution, but it now uses [Merkl](https://merkl.xyz/). However, Morpho/Merkl do not magically “push” rewards into your contract—reward tokens can still end up held by your integration contract address:

- Merkl claiming is parameterized by a `user` address (the Merkle-proof “owner”): integrations fetch claim data for `user={address}` and then call the distributor’s `claim(...)` with that same `user` value.
- If your integration uses a contract as the position owner (vault/strategy/managed account), then Merkl rewards are attributed to that contract address and claiming will transfer ERC20 reward tokens to the contract.
- Without an escape hatch (a controlled ERC20 withdrawal/sweep), those reward tokens (and other “stray” tokens like airdrops or underlying protocol incentives) can be stuck forever.

In other words: you don’t need a withdrawal function because Morpho pushes rewards to you automatically; you need it because your contract may become the recipient of reward ERC20s.

### 2. Compound cETH special case

> On Compound the cETH contract token does not behave the same way as the other cTokens (e.g. there's no `underlying()` getter, the amount needs to be passed as `msg.value`, ...).

cETH code is [here](https://etherscan.io/token/0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5#code). You can use [cUSDC](https://etherscan.io/token/0x39aa39c021dfbae8fac545936693ac917d5e7563#code) as a contrast.

You only need to care about cETH if your integration (contract or off-chain code) is interacting with Compound markets where the underlying is native ETH, i.e. the market’s cToken is cETH. Typical scenarios:

- Your contract integrates Morpho’s Compound flavor and ends up needing to interact with the underlying cToken (directly or via a “Lens”/market-discovery layer) to:
    - detect the underlying asset (`underlying()`), or
    - supply/repay/borrow/redeem through cTokens in some path, or
    - do routing/quoting that assumes “every cToken has an underlying ERC20”.
- Any generic code that treats all cTokens uniformly (calls `underlying()`, uses `IERC20` approvals, assumes non-payable `mint/repay`) will break on cETH because:
    - cETH has no `underlying()` (it’s ETH),
    - `mint` / `repayBorrow` are payable and require the amount as `msg.value`,
    - withdrawals/redemptions send native ETH, so the receiver contract must be able to accept ETH.

## Morpho Core Protocol Integration

### 1. Closing positions without dust

> You can repay/withdraw the whole debt/supply by passing `type(uint256).max` as argument to avoid leaving dust on Morpho.

Morpho does not special-case `type(uint256).max` as “withdraw/repay everything.” Instead, close positions by passing the exact share balance (i.e., use the `shares` input). The interface notes this for withdraw/repay in morpho-blue/src/interfaces/IMorpho.sol.

```solidity
    /// @dev It is advised to use the `shares` input when withdrawing the full position to avoid reverts due to
    /// conversion roundings between shares and assets.
```

### 2. Positions are non-fungible

> Positions on Morpho are not fungible. This means that you will not receive an interest-bearing token as on Aave or Compound. Instead, Morpho stores your position in its own storage. To get a fungible position on top of Morpho, you'll need to use Morpho's ERC4626-based vaults.

This means that if you call `Morpho.supply()` directly, the position is linked to your address and cannot be split into transferable pieces. If you use a Morpho vault instead, the position is represented as vault shares, so it can be split into arbitrary amounts and transferred.

### 3. Supplying on behalf of another address

> On Morpho, it's allowed to supply on behalf of another address.

```solidity
    function supply(
        MarketParams memory marketParams,
        uint256 assets,
        uint256 shares,
        address onBehalf,
        bytes calldata data
    ) external returns (uint256, uint256) {...}
```

In Morpho, `onBehalf` means “whose position in Morpho’s storage gets updated,” not “who pays the tokens.” When you call `supply(marketParams, assets, shares, onBehalf, data)`, Morpho computes the number of supply shares and then credits `position[id][onBehalf].supplyShares += shares`. That’s the only place ownership is tracked—Morpho doesn’t mint a receipt token. The important part is that the ERC20 transfer is taken from the caller: it executes `IERC20(marketParams.loanToken).safeTransferFrom(msg.sender, address(this), assets)`. So a third party can pay the loan token and still credit supply shares to someone else by choosing `onBehalf` accordingly.

Withdrawals are different because they move assets out of Morpho, so they’re permissioned. In `withdraw(marketParams, assets, shares, onBehalf, receiver)`, Morpho first checks `_isSenderAuthorized(onBehalf)`. That helper returns true only if `msg.sender == onBehalf` or if `isAuthorized[onBehalf][msg.sender]` is set. If the check passes, Morpho debits the shares from the `onBehalf` account (`position[id][onBehalf].supplyShares -= shares`) and transfers the underlying loan token to `receiver` via `safeTransfer`. So if Alice supplied “on behalf of Bob,” the shares belong to Bob and only Bob (or someone Bob authorized) can withdraw them; Alice can’t later pull the assets back unless Bob explicitly authorizes her.

## Morpho ERC4626 Vaults (MetaMorpho) Integration

### Vaults only pipe assets into Morpho

> Vaults can only supply/withdraw assets into/from Morpho.
> 

A MetaMorpho vault does not have a strategy engine. It holds one ERC20 `asset()` and, when it wants to deploy or free liquidity, it only interacts with Morpho markets by supplying and withdrawing that same asset.

For an integration, this matters because you should not assume the vault can rebalance through swaps or sell other positions to satisfy withdrawals. If Morpho markets in the withdrawal queue are illiquid (high utilization), the vault can be temporarily unable to source enough cash, and withdrawals may revert with `NotEnoughLiquidity`. Your product should treat the vault as “Morpho lending exposure,” not as an AMM/LP/leveraged strategy.

It also changes what to review from a security perspective. Since the vault’s core external calls are Morpho and ERC20 transfers/approvals (not arbitrary routers/bridges), the big integration risks tend to be configuration and market risk: which markets are in the queues, how caps are set, and what the underlying Morpho market parameters are (oracle, LLTV, IRM).

Concretely, deposits route through `_supplyMorpho()`, which iterates `supplyQueue` and only calls `MORPHO.supply()`:

```solidity
function _supplyMorpho(uint256 assets) internal {
  for (uint256 i; i < supplyQueue.length; ++i) {
    Id id = supplyQueue[i];
    uint256 supplyCap = config[id].cap;
    if (supplyCap == 0) continue;
    MarketParams memory marketParams = _marketParams(id);
    MORPHO.accrueInterest(marketParams);
    Market memory market = MORPHO.market(id);
    uint256 supplyShares = MORPHO.supplyShares(id, address(this));
    uint256 supplyAssets = supplyShares.toAssetsUp(market.totalSupplyAssets, market.totalSupplyShares);
    uint256 toSupply = UtilsLib.min(supplyCap.zeroFloorSub(supplyAssets), assets);
    if (toSupply > 0) {
      try MORPHO.supply(marketParams, toSupply, 0, address(this), hex"") {
        assets -= toSupply;
      } catch {}
    }
    if (assets == 0) return;
  }
  if (assets != 0) revert ErrorsLib.AllCapsReached();
}
```

Withdrawals similarly go through `_withdrawMorpho()`, which iterates `withdrawQueue` and only calls `MORPHO.withdraw()`, bounded by available liquidity:

```solidity
function _withdrawMorpho(uint256 assets) internal {
  for (uint256 i; i < withdrawQueue.length; ++i) {
    Id id = withdrawQueue[i];
    MarketParams memory marketParams = _marketParams(id);
    (uint256 supplyAssets,, Market memory market) = _accruedSupplyBalance(marketParams, id);
    uint256 toWithdraw = UtilsLib.min(
      _withdrawable(marketParams, market.totalSupplyAssets, market.totalBorrowAssets, supplyAssets), assets
    );
    if (toWithdraw > 0) {
      try MORPHO.withdraw(marketParams, toWithdraw, 0, address(this), address(this)) {
        assets -= toWithdraw;
      } catch {}
    }
    if (assets == 0) return;
  }
  if (assets != 0) revert ErrorsLib.NotEnoughLiquidity();
}
```

### Handle ERC4626 `receiver` vs `owner` carefully

> ERC4626 has several arguments (`receiver` and `owner`), so make sure to initialize them with the right values. Otherwise, you risk sending tokens to the wrong address. Set `receiver == owner` when the caller is depositing for itself.

ERC4626 intentionally separates “where value goes” from “whose shares are being spent”. That flexibility is useful for managed accounts, vault wrappers, and routers — but it also makes it easy to accidentally point one of the addresses at the wrong party.

```solidity
    // ERC4626.sol
    function _withdraw(
        address caller,
        address receiver,
        address owner,
        uint256 assets,
        uint256 shares
    ) internal virtual {
        if (caller != owner) {
            _spendAllowance(owner, caller, shares);
        }

        _burn(owner, shares);
        _transferOut(receiver, assets);
    }
```

That has two important integration consequences.

First, you only get “withdraw on behalf of someone else” if the share owner (`owner`) previously approved the caller for at least `shares`. If you pass `owner = user` but your integration contract is the `caller`, the call will revert unless the user approved your contract’s share allowance.

Second, splitting `receiver` from `owner` is a footgun: it is valid to burn Alice’s shares (`owner = Alice`) and pay Bob (`receiver = Bob`). That is sometimes intended (explicit payout address, debt repayment, etc.), but it should never happen accidentally.

On the way in, the analogous pitfall is `deposit(assets, receiver)` / `mint(shares, receiver)`: the depositor provides assets, but the share owner after the call is `receiver`. Accidentally setting `receiver` to a router / operator / vault address means the user paid, but someone else owns the shares.

So the checklist’s default is correct: for self-directed UX, use `receiver == owner` on exits, and for entries use `receiver` as “the actual share owner”. Only split these when you have an explicit, reviewed reason — and if `caller != owner`, make the share allowance requirement part of the integration design.
