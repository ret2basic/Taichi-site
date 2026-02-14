---
title: "Morpho Internals Part 4: MetaMorpho"
slug: "morpho-internals-part-4-metamorpho"
excerpt: "How MetaMorpho wraps Morpho markets into a single ERC4626 vault with supply/withdraw queues, role-gated caps, and fee/timelock design."
author: "ret2basic.eth (reviewed by jesjupyter)"
date: "2026-01-02"
readTime: "30 min read"
category: "DeFi"
tags: ["Morpho", "Lending", "Source Code Walkthrough"]
featured: false
image: "/images/blog/Morpho.jpg"
---

MetaMorpho is Morpho's "asset management layer": an ERC4626 wrapper that turns many discrete Morpho markets into a single fungible share token, while preserving Morpho's core design (isolated markets, explicit risk configuration, permissionless user actions).

For lenders (suppliers), the smallest unit of interaction with Morpho is a vault. Morpho itself does not ship an "official" vault; instead, third parties create and manage different vaults to serve different risk/return preferences. That means a supplier doesn't just decide to use Morpho—they also choose which curator and vault to trust for market selection and risk parameters.

This part assumes you already understand Morpho markets at the level of:

- supply vs borrow shares, and why Morpho uses shares rather than tracking balances directly
- interest accrual updating `totalBorrowAssets` and `totalSupplyAssets`
- the liquidity constraint `totalBorrowAssets <= totalSupplyAssets`

We'll focus on what MetaMorpho adds on top of Morpho, and how it does it.

MetaMorpho is known as “vault v1”, and there is a recently developed vault v2. We will cover that in the next article.

## 1. Why MetaMorpho is needed for Morpho

Morpho is deliberately minimal: it gives you a set of markets, each identified by a `MarketParams` tuple (loan token, collateral token, oracle, IRM, LLTV). Users can:

- supply the loan token (be a lender)
- supply collateral to be eligible to be a borrower, and borrow the loan token

The contract that enforces this is `Morpho.sol`.

### The missing product primitive: pooled deposit with strategy-level allocation

If you're a sophisticated lender, you might want to supply across multiple markets (diversification, best rate, risk appetite). If you call `Morpho.supply()` directly, it means:

- holding multiple “positions” across markets (each with its own `supplyShares`)
- rebalancing yourself when rates move
- dealing with per-market caps, operational hazards, and governance constraints

MetaMorpho fills this gap by:

1. Wrapping Morpho supply positions inside an ERC4626 vault.
2. Exposing a single ERC20 share token → this is the only thing that you manage
3. Defining allocator-controlled queues that specify where deposits should go and from where withdrawals should come.
4. Adding a vault-level performance fee on interest earned.
5. Introducing governance roles (curator/allocator/guardian) with a timelock for risk parameter increases.

Think of MetaMorpho as “asset management for lenders” sitting on Morpho.

### What MetaMorpho is not

MetaMorpho is not a leverage vault, and it is not a borrowing interface. It never calls `Morpho.borrow()` or `Morpho.supplyCollateral()`. Depositing into MetaMorpho only makes you a lender across one or more Morpho markets. To see the distinction in Morpho:

```solidity
// Morpho.sol
function supply(MarketParams memory marketParams, uint256 assets, uint256 shares, address onBehalf, bytes calldata data)
	external returns (uint256, uint256)
{
	_accrueInterest(marketParams, id);
	if (assets > 0) shares = assets.toSharesDown(market[id].totalSupplyAssets, market[id].totalSupplyShares);
	// ...
	position[id][onBehalf].supplyShares += shares;
	market[id].totalSupplyShares += shares.toUint128();
	market[id].totalSupplyAssets += assets.toUint128();
	IERC20(marketParams.loanToken).safeTransferFrom(msg.sender, address(this), assets);
}
```

MetaMorpho exclusively plays the role of `onBehalf = address(this)` supplier.

## 2. Curator functions: submitCap() and submitMarketRemoval()

MetaMorpho splits responsibilities across roles:

- **Owner**: ultimate admin (sets curator, allocators, fee params, guardian, timelock)
- **Curator**: configures which markets the vault is allowed to allocate into (via caps)
- **Allocator**: chooses the operational allocation path (queues) and can rebalance between enabled markets
- **Guardian**: emergency brake for pending changes (revoke pending updates)

The curator's job is to answer: “Which markets are allowed, and what is our maximum exposure?” That is encoded as per-market supply caps:

```solidity
mapping(Id => MarketConfig) public config;

struct MarketConfig {
	uint184 cap;
	bool enabled;
	uint64 removableAt;
}
```

### `submitCap()`: enabling markets, managing exposure, timelocking increases

```solidity
function submitCap(MarketParams memory marketParams, uint256 newSupplyCap)
	external onlyCuratorRole
{
	Id id = marketParams.id();
	if (marketParams.loanToken != asset()) revert ErrorsLib.InconsistentAsset(id);
	if (MORPHO.lastUpdate(id) == 0) revert ErrorsLib.MarketNotCreated();
	if (pendingCap[id].validAt != 0) revert ErrorsLib.AlreadyPending();
	if (config[id].removableAt != 0) revert ErrorsLib.PendingRemoval();

	uint256 supplyCap = config[id].cap;
	if (newSupplyCap == supplyCap) revert ErrorsLib.AlreadySet();

	if (newSupplyCap < supplyCap) {
		_setCap(marketParams, id, newSupplyCap.toUint184());
	} else {
		pendingCap[id].update(newSupplyCap.toUint184(), timelock);
	}
}
```

The function does the following things before calling `_setCap()`:

1. **Check if vault underlying asset matches market loan token**: the market's `loanToken` must equal the vault's `asset()` (the ERC4626 underlying). MetaMorpho is a single-asset vault; it cannot allocate USDC deposits into a WETH loan-token market.
2. **Check if the market actually exists on Morpho**: it checks `MORPHO.lastUpdate(id) != 0` (equivalent to “market was created”).
3. **Risk asymmetry is encoded in timelocks**:
    - Decreasing cap is immediate (risk reduction should be fast) → in this branch, `_setCap()` is invoked and `if (!marketConfig.enabled)` branch is skipped. Only the following state updates will be performed:
        - `marketConfig.removableAt = 0`
        - `marketConfig.cap = supplyCap`
        - `delete pendingCap[id]`
    - Increasing cap is timelocked (risk expansion should be slow) → `pendingCap[id]` is updated and there is a timelock on it. After the timelock, anyone can call `acceptCap()` to invoke `_setCap()` on it. If the market was already enabled, `_setCap()` behaves the same way as in the decreasing cap case; otherwise, it will do more things as we will explain next.

**Enabling a market happens inside `_setCap()`:**

If `marketConfig.enabled == false` (the first time a market transitions from cap=0 to cap>0), MetaMorpho marks it enabled and inserts it into the **withdraw queue**:

```solidity
function _setCap(MarketParams memory marketParams, Id id, uint184 supplyCap) internal {
	MarketConfig storage marketConfig = config[id];

	if (supplyCap > 0) {
		if (!marketConfig.enabled) {
			withdrawQueue.push(id);
			if (withdrawQueue.length > ConstantsLib.MAX_QUEUE_LENGTH) revert ErrorsLib.MaxQueueLengthExceeded();
			marketConfig.enabled = true;

			// Take into account assets of the new market without applying a fee.
			_updateLastTotalAssets(
				lastTotalAssets + MORPHO.expectedSupplyAssets(marketParams, address(this))
			);
		}

		marketConfig.removableAt = 0;
	}

	marketConfig.cap = supplyCap;
	delete pendingCap[id];
}
```

This is subtle and important:

- **Withdraw queue is the canonical “active set.”** It must include all enabled markets; it cannot contain duplicates.
- When enabling a market, `lastTotalAssets` is updated to include whatever the vault already has supplied there, using `MORPHO.expectedSupplyAssets()`. This prevents charging a performance fee on pre-existing balance (e.g., if someone had supplied on behalf of the vault before the market was officially enabled).

**What `expectedSupplyAssets` does (and why `_setCap` uses it):**

`MORPHO.expectedSupplyAssets(marketParams, user)` is a view helper that returns the expected lender assets for `user` after applying the same interest-accrual math Morpho would apply, without touching state (only act as a simulation):

```solidity
    /// @notice Returns the expected supply assets balance of `user` on a market after having accrued interest.
    /// @dev Warning: Wrong for `feeRecipient` because their supply shares increase is not taken into account.
    function expectedSupplyAssets(IMorpho morpho, MarketParams memory marketParams, address user)
        internal
        view
        returns (uint256)
    {
        Id id = marketParams.id();
        uint256 supplyShares = morpho.supplyShares(id, user);
        (uint256 totalSupplyAssets, uint256 totalSupplyShares,,) = expectedMarketBalances(morpho, marketParams);

        return supplyShares.toAssetsDown(totalSupplyAssets, totalSupplyShares);
    }
```

### `submitMarketRemoval()`: a controlled “forced delisting” mechanism

Removing a market is dangerous for a vault because it can strand funds (if the market reverts or is illiquid), and it can impact share price.

MetaMorpho implements a two-step removal flow:

1. Set cap to 0 (curator) by calling `submitCap(..., newSupplyCap = 0)`. Because this is a cap decrease, `submitCap` calls `_setCap()` immediately, which writes `marketConfig.cap = 0` ⇒ `config[id].cap = 0` and there is no timelock for decreases.
2. Submit removal by calling `submitMarketRemoval()`, which sets a `removableAt` timestamp after `timelock`.

```solidity
function submitMarketRemoval(MarketParams memory marketParams) external onlyCuratorRole {
	Id id = marketParams.id();
	if (config[id].removableAt != 0) revert ErrorsLib.AlreadyPending();
	if (config[id].cap != 0) revert ErrorsLib.NonZeroCap();
	if (!config[id].enabled) revert ErrorsLib.MarketNotEnabled(id);
	if (pendingCap[id].validAt != 0) revert ErrorsLib.PendingCap(id);

	config[id].removableAt = uint64(block.timestamp + timelock);
}
```

The actual removal from the withdraw queue is performed later by the allocator through `updateWithdrawQueue()` ← this will be discussed in depth later so we omit the source code here.

## 3. Allocator functions: setSupplyQueue(), updateWithdrawQueue(), and reallocate()

The allocator's job is operational, not strategic:

- “Given the allowed markets and their caps, how should we route deposits and withdrawals?”
- “How do we rebalance across enabled markets without breaking invariants?”

MetaMorpho's answer is two queues.

### Two-queue design: supply routing vs withdrawal routing

MetaMorpho stores:

```solidity
Id[] public supplyQueue;
Id[] public withdrawQueue;
```

And the interface documents their intended semantics:

- `supplyQueue`: order of markets to attempt when supplying new deposits; **can contain duplicates**.
- `withdrawQueue`: order of markets to attempt when withdrawing; must contain all enabled markets and any market with non-zero supply; **must have no duplicates**.

This separation solves two different problems:

1. **Deposit routing** wants “best effort”: try markets in order until caps reached; if one market reverts, try next.
2. **Withdrawal routing** wants “total accounting”: `totalAssets()` must count all positions, and withdrawals must attempt to free liquidity from a known superset of markets.

### `setSupplyQueue()`: only include markets with a non-zero cap

```solidity
    function setSupplyQueue(Id[] calldata newSupplyQueue) external onlyAllocatorRole {
        uint256 length = newSupplyQueue.length;

        if (length > ConstantsLib.MAX_QUEUE_LENGTH) revert ErrorsLib.MaxQueueLengthExceeded();

        for (uint256 i; i < length; ++i) {
            if (config[newSupplyQueue[i]].cap == 0) revert ErrorsLib.UnauthorizedMarket(newSupplyQueue[i]);
        }

        supplyQueue = newSupplyQueue;
    }
```

Two practical consequences:

- You can't “accidentally” send deposits into a market that the curator has not enabled because of the check `if (config[newSupplyQueue[i]].cap == 0)`.
- Duplicates are allowed (they are not prevented). This is explicitly tolerated but discouraged; duplicates only increase gas and can make `maxDeposit`/`maxMint` less accurate (MetaMorpho warns about this), but duplicates don't cause any damage to the business logic itself.

### `updateWithdrawQueue()`: reorder + remove markets, never add new ones

Market removal flow is two-step:

- **Curator path:** zero the cap (via `submitCap(..., 0)`, immediate) and then schedule removal with `submitMarketRemoval()`. This sets `removableAt` after the timelock.
- **Allocator path:** after the timelock has elapsed, call `updateWithdrawQueue()` with indexes that omit the market you're removing. That function enforces: cap must be 0, no pending cap, and either zero supply or `removableAt` has passed before it deletes the config entry and writes the new queue.

So curator schedules; allocator executes the actual removal.

`updateWithdrawQueue()` takes `indexes`, which are indexes into the previous `withdrawQueue`. It constructs the new queue by reusing those elements. This is why `updateWithdrawQueue()` cannot introduce a new market: it only pulls existing entries via `Id id = withdrawQueue[prevIndex]` and never calls `push`.

```solidity
function updateWithdrawQueue(uint256[] calldata indexes) external onlyAllocatorRole {
	uint256 newLength = indexes.length;
	uint256 currLength = withdrawQueue.length;

	bool[] memory seen = new bool[](currLength);
	Id[] memory newWithdrawQueue = new Id[](newLength);

	for (uint256 i; i < newLength; ++i) {
		uint256 prevIndex = indexes[i];
		Id id = withdrawQueue[prevIndex];
		if (seen[prevIndex]) revert ErrorsLib.DuplicateMarket(id);
		seen[prevIndex] = true;
		newWithdrawQueue[i] = id;
	}

	for (uint256 i; i < currLength; ++i) {
		if (!seen[i]) {
			Id id = withdrawQueue[i];
			if (config[id].cap != 0) revert ErrorsLib.InvalidMarketRemovalNonZeroCap(id);
			if (pendingCap[id].validAt != 0) revert ErrorsLib.PendingCap(id);

			if (MORPHO.supplyShares(id, address(this)) != 0) {
				if (config[id].removableAt == 0) revert ErrorsLib.InvalidMarketRemovalNonZeroSupply(id);
				if (block.timestamp < config[id].removableAt) {
					revert ErrorsLib.InvalidMarketRemovalTimelockNotElapsed(id);
				}
			}

			delete config[id];
		}
	}

	withdrawQueue = newWithdrawQueue;
}
```

**Where new items in the `withdrawQueue` come from:** The only place a new market is added to `withdrawQueue` is when the curator *enables* a market by setting a positive cap for the first time. That happens inside `_setCap()`:

```solidity
if (!marketConfig.enabled) {
    withdrawQueue.push(id);
    if (withdrawQueue.length > ConstantsLib.MAX_QUEUE_LENGTH) revert ErrorsLib.MaxQueueLengthExceeded();
    marketConfig.enabled = true;
    // ...
}
```

So the flow is explicit: curator enables → `_setCap()` pushes, allocator later reorders/removes via `updateWithdrawQueue()`.

Here is a toy example of how the "seen" algorithm works:

**Setup**

- Old `withdrawQueue = [A, B, C, D]` (indices 0..3)
- Allocator wants to keep `[A, C, D]` and drop B, so it passes `indexes = [0, 2, 3]`.

**First loop (build the new queue):**

- `i = 0`, `prevIndex = 0` → new queue gets `withdrawQueue[0] = A`, set `seen[0] = true`
- `i = 1`, `prevIndex = 2` → new queue gets `withdrawQueue[2] = C`, set `seen[2] = true`
- `i = 2`, `prevIndex = 3` → new queue gets `withdrawQueue[3] = D`, set `seen[3] = true`

At this point, `seen = [true, false, true, true]`.

**Second loop (find removals):**

- `i = 0` → `seen[0]` is true, keep A
- `i = 1` → `seen[1]` is false, remove B after passing some checks
- `i = 2` → `seen[2]` is true, keep C
- `i = 3` → `seen[3]` is true, keep D

When solving leetcode chals, `seen` often means "visited before." Here `seen` means something different: "this old entry at this index will still exist in the new `withdrawQueue`." In other words, `seen` means "we won't remove this entry from the `withdrawQueue`." That's why it's indexed by the old queue positions, and why the second loop treats `!seen[i]` as a removal candidate.

#### Forced removal, `removableAt`, and why PPS can drop

The removal logic above enables a “forced delisting” path: a market can be removed from `withdrawQueue` **even if the vault still has `supplyShares` in that market**, as long as the curator first set the cap to 0 and scheduled removal, and the cooldown has elapsed.

Concretely:

1. The curator sets `cap = 0` (immediate, because it's a risk reduction).
2. The curator calls `submitMarketRemoval()` which sets `config[id].removableAt = block.timestamp + timelock`.
3. After the cooldown, the allocator can omit the market when calling `updateWithdrawQueue()`. If `MORPHO.supplyShares(id, address(this)) != 0`, the function allows removal as long as `removableAt` is set and has passed.

This is intentionally dangerous: it is a governance/ops escape hatch for “we no longer want this market in the vault's active set”, even if assets are still stranded there.

**Why this can decrease PPS (price per share).** MetaMorpho's accounting uses the withdraw queue as the set of markets to value:

```solidity
function totalAssets() public view override returns (uint256 assets) {
    for (uint256 i; i < withdrawQueue.length; ++i) {
        assets += MORPHO.expectedSupplyAssets(_marketParams(withdrawQueue[i]), address(this));
    }
}
```

So if a market is removed from `withdrawQueue` while the vault still has `supplyShares` there, those assets are no longer included in `totalAssets()`. Since ERC4626 share price is roughly $\text{pps} = \frac{\text{totalAssets}}{\text{totalSupply}}$, dropping assets from `totalAssets()` mechanically lowers PPS.

This is why `removableAt` exists: it gives the system time to unwind the position cleanly before a forced removal can “write off” that market from the vault's accounting.

**How allocators can prevent the loss: unwind before the cooldown ends.** During the `removableAt` window (after cap is set to 0, but before removal is executable), the allocator can call `reallocate()` to withdraw the vault's position from the soon-to-be-removed market and move it into other enabled markets.

In particular, `reallocate()` supports a “withdraw everything” target for a market by setting `allocation.assets == 0`:

- If `allocation.assets == 0`, the code withdraws all `supplyShares` from that market (by passing `shares = supplyShares` to `MORPHO.withdraw`).
- The withdrawn assets are then supplied into other markets in the same `reallocate()` call (net-zero invariant).

If the allocator succeeds in withdrawing down to `supplyShares == 0` before `removableAt`, then later `updateWithdrawQueue()` can remove the market *without* any PPS haircut, because there is no longer any unaccounted position left behind.

This mitigation is not magic: it only works if the market is withdrawable (liquid and not reverting) and there are other enabled markets with remaining caps to receive the assets.

### `reallocate()`: deterministic net-zero rebalance with caps

`reallocate()` moves assets between markets to reach a target allocation vector. This function iterates through all allocations where each entry is a `MarketAllocation` struct: 

```solidity
// metamorpho/src/interfaces/IMetaMorpho.sol
struct MarketAllocation {
    /// @notice The market to allocate.
    MarketParams marketParams;
    /// @notice The amount of assets to allocate.
    uint256 assets;
}

// morpho-blue/src/interfaces/IMorpho.sol
struct MarketParams {
    address loanToken;
    address collateralToken;
    address oracle;
    address irm;
    uint256 lltv;
}
```

Recall that Morpho.sol requires caller to specify the entire `MarketParams` struct and it computes market ID onchain, so `MarketAllocation` just specifies which market you are interacting with and how many assets you want to allocate to this market.

For each allocation in the array, the code first accrues interest and then computes `withdrawn` to figure out if allocator wants to withdraw from the market or supply to the market:

```solidity
            (uint256 supplyAssets, uint256 supplyShares,) = _accruedSupplyBalance(allocation.marketParams, id);
            uint256 withdrawn = supplyAssets.zeroFloorSub(allocation.assets);
```

`withdrawn` is computed with `zeroFloorSub`, which clamps negative results to 0. So `withdrawn == 0` simply means `allocation.assets >= supplyAssets` (the target is at least the current supply), and the code takes the supply path. The helper is implemented as:

```solidity
    function zeroFloorSub(uint256 x, uint256 y) internal pure returns (uint256 z) {
        assembly {
            z := mul(gt(x, y), sub(x, y))
        }
    }
```

This returns `max(0, x - y)` without ever underflowing.

`_accruedSupplyBalance()` is just a helper that calls `MORPHO.accrueInterest(marketParams)` and returns some info of that market:

```solidity
    /// @dev Accrues interest on Morpho Blue and returns the vault's assets & corresponding shares supplied on the
    /// market defined by `marketParams`, as well as the market's state.
    /// @dev Assumes that the inputs `marketParams` and `id` match.
    function _accruedSupplyBalance(MarketParams memory marketParams, Id id)
        internal
        returns (uint256 assets, uint256 shares, Market memory market)
    {
        MORPHO.accrueInterest(marketParams);

        market = MORPHO.market(id);
        shares = MORPHO.supplyShares(id, address(this));
        assets = shares.toAssetsDown(market.totalSupplyAssets, market.totalSupplyShares);
    }
```

If `withdrawn > 0` (allocator wants to withdraw from this market), the code handles a special case where `allocation.assets == 0` (withdraw all assets from a market) but there is a frontrunning donation. In that case the code calls `MORPHO.withdraw()` with `supplyShares` to withdraw all shares the vault holds for that market, so the frontrunning donation is withdrawn too. Recall that `MORPHO.withdraw()` can be called by specifying number of assets or number of shares, here we use number of shares since we don't know how much donation exists in a frontrunning context.

```solidity
            if (withdrawn > 0) {
                if (!config[id].enabled) revert ErrorsLib.MarketNotEnabled(id);

                // Guarantees that unknown frontrunning donations can be withdrawn, in order to disable a market.
                uint256 shares;
                if (allocation.assets == 0) {
                    shares = supplyShares;
                    withdrawn = 0;
                }

                (uint256 withdrawnAssets, uint256 withdrawnShares) =
                    MORPHO.withdraw(allocation.marketParams, withdrawn, shares, address(this), address(this));

                totalWithdrawn += withdrawnAssets;
            }
```

If `withdrawn == 0` (allocator wants to supply to this market), the code checks whether the post-supply assets would exceed `supplyCap`.

```solidity
            else {
                uint256 suppliedAssets = allocation.assets == type(uint256).max
                    ? totalWithdrawn.zeroFloorSub(totalSupplied)
                    : allocation.assets.zeroFloorSub(supplyAssets);

                if (suppliedAssets == 0) continue;

                uint256 supplyCap = config[id].cap;
                if (supplyCap == 0) revert ErrorsLib.UnauthorizedMarket(id);

                if (supplyAssets + suppliedAssets > supplyCap) revert ErrorsLib.SupplyCapExceeded(id);

                // The market's loan asset is guaranteed to be the vault's asset because it has a non-zero supply cap.
                (, uint256 suppliedShares) =
                    MORPHO.supply(allocation.marketParams, suppliedAssets, 0, address(this), hex"");

                totalSupplied += suppliedAssets;
            }
```

At the end of this function (exiting the for loop), there is a [one-line check](https://github.com/morpho-org/metamorpho/blob/37714d67104523f32f8e7e31cd2c7a0506f800aa/src/MetaMorpho.sol#L414):

```solidity
if (totalWithdrawn != totalSupplied) revert ErrorsLib.InconsistentReallocation(); 
```

Here we throw out an important question: What is this check doing? Why does it exist?

## 4. User deposit & withdrawal: how it works, and what the supplied asset is used for

MetaMorpho is built on top of ERC4626:

- Users deposit the vault's underlying `asset()`.
- They receive MetaMorpho shares (ERC20) representing a claim on the vault's total supplied assets across markets.
- They can later withdraw/redeem; the vault pulls liquidity from Morpho markets to satisfy redemptions.

### The critical point: deposits are used to supply as **loan token** (lend), not as collateral

MetaMorpho only ever supplies the loan token to Morpho markets via:

```solidity
MORPHO.supply(marketParams, toSupply, 0, address(this), hex"");
```

It never calls:

- `MORPHO.supplyCollateral(...)`
- `MORPHO.borrow(...)`

So depositors earn passive lending yield; they do not open borrow positions. (MetaMorpho shares could be used as collateral in external systems, but that's outside of MetaMorpho and Morpho.)

### ERC4626 conversions: how shares map to assets

MetaMorpho relies on OpenZeppelin ERC4626's “inflation attack” mitigation via a virtual offset. `DECIMALS_OFFSET` provides virtual offset so that the asset behaves like 18-decimal:

```solidity
DECIMALS_OFFSET = uint8(uint256(18).zeroFloorSub(IERC20Metadata(_asset).decimals()));
```

And uses these conversion formulas:

```solidity
function _convertToSharesWithTotals(uint256 assets, uint256 newTotalSupply, uint256 newTotalAssets, Math.Rounding r)
	internal view returns (uint256)
{
	return assets.mulDiv(newTotalSupply + 10 ** _decimalsOffset(), newTotalAssets + 1, r);
}

function _convertToAssetsWithTotals(uint256 shares, uint256 newTotalSupply, uint256 newTotalAssets, Math.Rounding r)
	internal view returns (uint256)
{
	return shares.mulDiv(newTotalAssets + 1, newTotalSupply + 10 ** _decimalsOffset(), r);
}
```

**However this approach doesn't protect 18-decimal assets** (no virtual offset is given since the decimal is already 18). This caveat is clearly documented in the comment of `deposit()` function:

```solidity
    /// @inheritdoc IERC4626
    /// @notice For tokens with 18 decimals, the protection against the inflation front-running attack is low. To
    /// protect against this attack, vault deployers should make an initial deposit of a non-trivial amount in the vault
    /// or depositors should check that the share price does not exceed a certain limit.
```

### Deposit path

```solidity
    function deposit(uint256 assets, address receiver) public override returns (uint256 shares) {
        uint256 newTotalAssets = _accrueFee();

        // Update `lastTotalAssets` to avoid an inconsistent state in a re-entrant context.
        // It is updated again in `_deposit`.
        lastTotalAssets = newTotalAssets;

        shares = _convertToSharesWithTotals(assets, totalSupply(), newTotalAssets, Math.Rounding.Floor);

        _deposit(_msgSender(), receiver, assets, shares);
    }

    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal override {
        super._deposit(caller, receiver, assets, shares);

        _supplyMorpho(assets);

        // `lastTotalAssets + assets` may be a little off from `totalAssets()`.
        _updateLastTotalAssets(lastTotalAssets + assets);
    }
```

Sequence:

1. Accrue vault-level performance fee first (ignore for now, more later).
2. Set `lastTotalAssets = newTotalAssets` to keep the vault's accounting consistent if a re-entrant call happens during `_deposit` (which can trigger external calls via token hooks). This makes any nested call see a post-fee baseline rather than a stale one; the value is updated again after the assets are supplied.
    - `deposit()` updates `lastTotalAssets` up front because the underlying asset transfer can re‑enter the vault if the token is ERC777 (via tokensToSend during `safeTransferFrom()`). See [ERC4626.sol](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/239795bea728c8dca4deb6c66856dd58a6991112/contracts/token/ERC20/extensions/ERC4626.sol#L290-L295) for more info. Without that pre‑update, any re‑entrant call would observe a stale, lower `lastTotalAssets`, making `totalInterest` look larger and over‑accrue fees, which dilutes the depositor unfairly. Setting `lastTotalAssets = newTotalAssets` first ensures fee math and share pricing stay consistent throughout the deposit flow even if a token hook fires.
3. Compute shares using totals that account for fee accrual.
4. Execute ERC4626 deposit: transfer `assets` into the vault, mint `shares`.
5. Route the deposited assets into Morpho markets via `_supplyMorpho()`.
6. Update `lastTotalAssets` optimistically.

### `_supplyMorpho()`: best-effort routing, caps, and skipping broken markets

`_supplyMorpho()` iterates each market in the supply queue and attempts to supply to the markets based on the order defined in the queue. It accrues interest per market before computing current `supplyAssets`.

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
            ...
        }
        ...
    }
```

Here `MORPHO.supplyShares()` is implemented in morpho-blue/src/libraries/periphery/MorphoLib.sol. It fetches how many shares the vault is supplying currently from Morpho's storage:

```solidity
    // MorphoLib.so
    function supplyShares(IMorpho morpho, Id id, address user) internal view returns (uint256) {
        bytes32[] memory slot = _array(MorphoStorageLib.positionSupplySharesSlot(id, user));
        return uint256(morpho.extSloads(slot)[0]);
    }
```

The share number is converted to asset number, rounding up. `supplyAssets = supplyShares.toAssetsUp(...)` overestimates current usage so that `remaining = cap - supplyAssets` is underestimated, making `toSupply` conservative. This prevents a cap overrun caused by rounding dust when converting shares → assets.

```solidity
            // `supplyAssets` needs to be rounded up for `toSupply` to be rounded down.
            uint256 supplyAssets = supplyShares.toAssetsUp(market.totalSupplyAssets, market.totalSupplyShares);
```

Then `_supplyMorpho()` computes the minimum between `supplyCap - supplyAssets` and user input `assets`, just in case user-specified `assets` exceeds the remaining cap. Then it wraps the `MORPHO.supply()` call in a try-catch (in case a market is down and would otherwise DoS everything), and the for loop terminates if the entire `assets` is supplied. Note that `toSupply` rounds down, as we explained earlier, and that prevents cap overrun:

```solidity
            uint256 toSupply = UtilsLib.min(supplyCap.zeroFloorSub(supplyAssets), assets);

            if (toSupply > 0) {
                // Using try/catch to skip markets that revert.
                try MORPHO.supply(marketParams, toSupply, 0, address(this), hex"") {
                    assets -= toSupply;
                } catch {}
            }

            if (assets == 0) return;
```

Outside the for loop, the code catches the case where user-specified `assets` are too large, all caps are exhausted, and there is still leftover that isn't supplied to any market:

```solidity
        if (assets != 0) revert ErrorsLib.AllCapsReached();
```

### Withdrawal path

ERC4626 withdrawal calls `_withdrawMorpho(assets)` to free liquidity first:

```solidity
    function withdraw(uint256 assets, address receiver, address owner) public override returns (uint256 shares) {
        uint256 newTotalAssets = _accrueFee();

        // Do not call expensive `maxWithdraw` and optimistically withdraw assets.

        shares = _convertToSharesWithTotals(assets, totalSupply(), newTotalAssets, Math.Rounding.Ceil);

        // `newTotalAssets - assets` may be a little off from `totalAssets()`.
        _updateLastTotalAssets(newTotalAssets.zeroFloorSub(assets));

        _withdraw(_msgSender(), receiver, owner, assets, shares);
    }
    
    function _withdraw(address caller, address receiver, address owner, uint256 assets, uint256 shares)
        internal
        override
    {
        _withdrawMorpho(assets);

        super._withdraw(caller, receiver, owner, assets, shares);
    }
```

The logic here mirrors the deposit flow. One thing to note is that, `_updateLastTotalAssets(newTotalAssets.zeroFloorSub(assets))` is set before `_withdraw()` because the asset transfer can trigger ERC777 tokensReceived re‑entrancy after the transfer. See [ERC4626.sol](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/239795bea728c8dca4deb6c66856dd58a6991112/contracts/token/ERC20/extensions/ERC4626.sol#L290-L295) for more info. If `lastTotalAssets` weren't pre‑reduced, a re‑entrant call during `_withdraw()` would see a stale, higher `lastTotalAssets`, compute a smaller `totalInterest`, and under‑accrue fees (benefiting the re‑entrant caller). Pre‑updating keeps fee accrual and share pricing consistent even if the asset's transfer hook re‑enters.

### `_withdrawMorpho()`: withdraw only what is actually liquid

Recall that withdrawals from Morpho must respect market liquidity. Market liquidity is `total supply - total borrowed`:

```solidity
// Morpho.sol
require(market[id].totalBorrowAssets <= market[id].totalSupplyAssets, ErrorsLib.INSUFFICIENT_LIQUIDITY);
```

MetaMorpho computes what is withdrawable per market as:

```solidity
    function _withdrawable(
        MarketParams memory marketParams,
        uint256 totalSupplyAssets,
        uint256 totalBorrowAssets,
        uint256 supplyAssets
    ) internal view returns (uint256) {
        // Inside a flashloan callback, liquidity on Morpho Blue may be limited to the singleton's balance.
        uint256 availableLiquidity = UtilsLib.min(
            totalSupplyAssets - totalBorrowAssets, ERC20(marketParams.loanToken).balanceOf(address(MORPHO))
        );

        return UtilsLib.min(supplyAssets, availableLiquidity);
    }
```

There are two constraints that limit how much we can withdraw:

1. “Book liquidity”: $\text{totalSupplyAssets} - \text{totalBorrowAssets}$
2. “Singleton cash”: actual ERC20 balance held by Morpho (flashloan edge cases)

Then it best-effort withdraws through the withdraw queue:

```solidity
function _withdrawMorpho(uint256 assets) internal {
	for (uint256 i; i < withdrawQueue.length; ++i) {
		Id id = withdrawQueue[i];
		MarketParams memory marketParams = _marketParams(id);
		(uint256 supplyAssets,, Market memory market) = _accruedSupplyBalance(marketParams, id);

		uint256 toWithdraw = UtilsLib.min(
			_withdrawable(marketParams, market.totalSupplyAssets, market.totalBorrowAssets, supplyAssets),
			assets
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

Just like deposits:

- It accrues interest per market before computing balances.
- It uses `try/catch` to skip markets that revert.
- It reverts only if, after trying all markets, it can't free enough assets.

## 5. How yield is calculated and accounted

MetaMorpho's yield is Morpho's lender yield.

### Where yield comes from in Morpho

In `Morpho.sol`, interest accrual increases total borrow and total supply assets:

```solidity
function _accrueInterest(MarketParams memory marketParams, Id id) internal {
	uint256 elapsed = block.timestamp - market[id].lastUpdate;
	if (elapsed == 0) return;

	if (marketParams.irm != address(0)) {
		uint256 borrowRate = IIrm(marketParams.irm).borrowRate(marketParams, market[id]);
		uint256 interest = market[id].totalBorrowAssets.wMulDown(borrowRate.wTaylorCompounded(elapsed));
		market[id].totalBorrowAssets += interest.toUint128();
		market[id].totalSupplyAssets += interest.toUint128();
		// ... fee minting omitted
	}

	market[id].lastUpdate = uint128(block.timestamp);
}
```

Lenders hold supply shares. Their share count does not change; instead, the exchange rate increases.

If a user has supply shares $s$, and the market has totals $(S_A, S_S)$ meaning:

- totalSupplyAssets = $S_A$
- totalSupplyShares = $S_S$

Then the lender's claim (down-rounded) is:

$$
\text{supplyAssets} = s\cdot\frac{S_A}{S_S}
$$

Interest increases $S_A$ while $S_S$ remains fixed for lenders (except protocol fee share minting), so assets-per-share grows.

### How MetaMorpho computes `totalAssets()`

MetaMorpho's `totalAssets()` sums the expected supply assets across all markets in `withdrawQueue`:

```solidity
    function totalAssets() public view override returns (uint256 assets) {
        for (uint256 i; i < withdrawQueue.length; ++i) {
            assets += MORPHO.expectedSupplyAssets(_marketParams(withdrawQueue[i]), address(this));
        }
    }
```

This uses `MorphoBalancesLib.expectedSupplyAssets()`, which virtually accrues interest without modifying state. Since `totalAssets()` is a view function, a simulation like `expectedSupplyAssets` is needed:

```solidity
    // morpho-blue/src/libraries/periphery/MorphoBalancesLib.sol
    function expectedMarketBalances(IMorpho morpho, MarketParams memory marketParams)
        internal
        view
        returns (uint256, uint256, uint256, uint256)
    {
        Id id = marketParams.id();
        Market memory market = morpho.market(id);

        uint256 elapsed = block.timestamp - market.lastUpdate;

        // Skipped if elapsed == 0 or totalBorrowAssets == 0 because interest would be null, or if irm == address(0).
        if (elapsed != 0 && market.totalBorrowAssets != 0 && marketParams.irm != address(0)) {
            uint256 borrowRate = IIrm(marketParams.irm).borrowRateView(marketParams, market);
            uint256 interest = market.totalBorrowAssets.wMulDown(borrowRate.wTaylorCompounded(elapsed));
            market.totalBorrowAssets += interest.toUint128();
            market.totalSupplyAssets += interest.toUint128();

            if (market.fee != 0) {
                uint256 feeAmount = interest.wMulDown(market.fee);
                // The fee amount is subtracted from the total supply in this calculation to compensate for the fact
                // that total supply is already updated.
                uint256 feeShares =
                    feeAmount.toSharesDown(market.totalSupplyAssets - feeAmount, market.totalSupplyShares);
                market.totalSupplyShares += feeShares.toUint128();
            }
        }

        return (market.totalSupplyAssets, market.totalSupplyShares, market.totalBorrowAssets, market.totalBorrowShares);
    }
```

### Share price evolution

The vault's share price is:

$$
\text{pps} = \frac{\text{totalAssets}}{\text{totalSupply}}
$$

As Morpho interest accrues, `totalAssets()` increases, so pps increases. ERC4626 conversions (with offset) approximate that pps.

## 6. Fee system

There are two fee layers relevant to a MetaMorpho depositor:

1. **Morpho market fee**: Morpho markets can mint supply shares to Morpho's `feeRecipient` during interest accrual.
2. **MetaMorpho vault fee**: MetaMorpho mints vault shares to its `feeRecipient` as a performance fee on vault-level interest.

They are independent.

### Morpho market fee (protocol-level fee)

In `Morpho._accrueInterest()`, if `market.fee != 0`, Morpho increases supply shares in the accounting, representing a portion of interest:

```solidity
uint256 feeAmount = interest.wMulDown(market[id].fee);
uint256 feeShares = feeAmount.toSharesDown(
	market[id].totalSupplyAssets - feeAmount,
	market[id].totalSupplyShares
);
position[id][feeRecipient].supplyShares += feeShares;
market[id].totalSupplyShares += feeShares.toUint128();
```

This dilutes lenders at the market level.

### MetaMorpho fee (vault-level fee)

MetaMorpho tracks `lastTotalAssets`, “the total assets when the fee was last accrued”.

Fee accrual is computed as:

```solidity
    function _accruedFeeShares() internal view returns (uint256 feeShares, uint256 newTotalAssets) {
        newTotalAssets = totalAssets();

        uint256 totalInterest = newTotalAssets.zeroFloorSub(lastTotalAssets);
        if (totalInterest != 0 && fee != 0) {
            // It is acknowledged that `feeAssets` may be rounded down to 0 if `totalInterest * fee < WAD`.
            uint256 feeAssets = totalInterest.mulDiv(fee, WAD);
            // The fee assets is subtracted from the total assets in this calculation to compensate for the fact
            // that total assets is already increased by the total interest (including the fee assets).
            feeShares =
                _convertToSharesWithTotals(feeAssets, totalSupply(), newTotalAssets - feeAssets, Math.Rounding.Floor);
        }
    }

    function _accrueFee() internal returns (uint256 newTotalAssets) {
        uint256 feeShares;
        (feeShares, newTotalAssets) = _accruedFeeShares();

        if (feeShares != 0) _mint(feeRecipient, feeShares);
    }
```

Let:

- $A_0 =$ `lastTotalAssets`
- $A_1 =$ `totalAssets()` now
- $f =$ fee rate in WAD (e.g. 0.1e18 for 10%)

Then:

$$
\text{interest} = \max(0, A_1 - A_0)
$$

$$
\text{feeAssets} = \text{interest}\cdot f
$$

MetaMorpho does not transfer assets out; instead it mints vault shares to `feeRecipient` (dilution). The conversion uses $(A_1 - \text{feeAssets})$ in the denominator to avoid double-counting the fact that assets already include the fee amount.

### When fees are accrued

MetaMorpho accrues fees on actions that would otherwise let users “skip” fee dilution:

- `deposit()`, `mint()`, `withdraw()`, `redeem()`
- `setFee()`, `setFeeRecipient()`

For fee parameter changes, MetaMorpho first accrues the fee using the previous configuration:

```solidity
_updateLastTotalAssets(_accrueFee());
```

### Timelock design for fee/guardian/timelock changes

MetaMorpho's timelock is used for parameters that increase risk:

- **Cap increases** are timelocked.
- **Timelock decreases** are timelocked; increases are immediate:

```solidity
if (newTimelock > timelock) {
	  _setTimelock(newTimelock);
} else {
	  pendingTimelock.update(uint184(newTimelock), timelock);
}
```

This ensures you can always move to a safer governance posture immediately.
