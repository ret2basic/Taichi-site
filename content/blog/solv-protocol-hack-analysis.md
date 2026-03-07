---
title: "Solv Protocol Hack Analysis (March 2026): Callback-Driven Double Minting in an ERC-3525 Wrapper"
slug: "solv-protocol-hack-analysis-march-2026"
excerpt: "A source-level analysis of Solv's BitcoinReserveOffering showing how callback-based deposit handling and post-transfer minting combine to issue shares twice for the same underlying SFT value."
author: "ret2basic.eth"
date: "2026-03-07"
readTime: "10 min read"
category: "Hack Analysis"
tags: ["Solv Protocol", "Incorrect Accounting", "Hack Analysis", "ERC-3525"]
featured: false
image: "/images/blog/solv_protocol_hack_analysis.png"
---

## Intro

This article analyzes the March 2026 Solv protocol hack. The core bug is a simple double-accounting problem:

> `BitcoinReserveOffering` can issue wrapped ERC20 shares inside token-receiver callbacks and then issue the same amount again at the end of `mint()`. One deposit is therefore counted twice.

On callback-driven deposit paths, one deposit can therefore be counted twice.

## Executive summary

`BitcoinReserveOffering` wraps ERC-3525 value into an ERC20-like token through `mint(uint256 sftId_, uint256 amount_)`. The vulnerability is that some deposit branches trigger `onERC721Received()` or `onERC3525Received()` on the wrapper, and those callbacks already call `_mint(...)`. After the callback returns, `mint()` still calls `_mint(...)` again unconditionally. The result is that wrapped share supply can become larger than the underlying SFT value actually deposited, and `burn()` then lets the attacker redeem that inflated share balance for real SFT value.

## Background knowledge: ERC-3525

Before looking at the bug, it helps to understand what ERC-3525 is trying to model.

ERC-3525 is often described as a **semi-fungible token** standard. It sits somewhere between:

- ERC-721, where each token ID is unique and indivisible
- ERC-20, where balances are fungible quantities

An ERC-3525 token has **both**:

- a unique token ID, like an NFT
- a balance or value attached to that token ID

So instead of thinking in terms of "wallet balance only," you should think in terms of **positions**. Each position has an identity, and each position also carries some amount of value.

In practice, that makes ERC-3525 useful for representing things like:

- bond-like claims
- vesting positions
- tranche positions
- structured products
- other financial positions where identity and quantity both matter

### How ERC-3525 differs from ERC-1155

Readers might wonder how ERC-3525 differs from ERC-1155, since both try to cover cases that do not fit neatly into ERC-20 or ERC-721. The difference becomes much clearer if you look at the actual code.

In OpenZeppelin's ERC-1155 implementation, balances are stored by **token type ID and account**:

```solidity
mapping(uint256 id => mapping(address account => uint256)) private _balances;
```

And transfers update balances in exactly that shape:

```solidity
uint256 fromBalance = _balances[id][from];
...
_balances[id][from] = fromBalance - value;
...
_balances[id][to] += value;
```

So the ERC-1155 model is: "account `from` owns `value` units of token type `id`." The fungibility is at the token-type level. If Alice and Bob both hold token ID `7`, they are just holding balances of the same token type.

Solv's ERC-3525 implementation uses a different storage model. Instead of per-account balances by token type, it stores data **inside each token ID**:

```solidity
struct TokenData {
    uint256 id;
    uint256 slot;
    uint256 balance;
    address owner;
    address approved;
    address[] valueApprovals;
}
```

And the core getters reflect that directly:

```solidity
function balanceOf(uint256 tokenId_) public view virtual override returns (uint256) {
    _requireMinted(tokenId_);
    return _allTokens[_allTokensIndex[tokenId_]].balance;
}

function ownerOf(uint256 tokenId_) public view virtual override returns (address owner_) {
    _requireMinted(tokenId_);
    owner_ = _allTokens[_allTokensIndex[tokenId_]].owner;
}

function slotOf(uint256 tokenId_) public view virtual override returns (uint256) {
    _requireMinted(tokenId_);
    return _allTokens[_allTokensIndex[tokenId_]].slot;
}
```

This model is more like a position than a token.

Another important concept is the **slot**. A slot groups together positions of the same type. Two ERC-3525 token IDs can be different NFTs, but if they share the same slot, then value can move between them under the rules of that asset model.

`transferFrom()` function transfers value from one token ID to another token ID with the same slot:

```solidity
function transferFrom(
    uint256 fromTokenId_,
    uint256 toTokenId_,
    uint256 value_
) public payable virtual override {
    _spendAllowance(_msgSender(), fromTokenId_, value_);
    _transferValue(fromTokenId_, toTokenId_, value_);
}
```

Here `_transferValue(...)` mutates the balances of the two token IDs directly. The same-slot check happens here:

```solidity
TokenData storage fromTokenData = _allTokens[_allTokensIndex[fromTokenId_]];
TokenData storage toTokenData = _allTokens[_allTokensIndex[toTokenId_]];

require(fromTokenData.balance >= value_, "ERC3525: insufficient balance for transfer");
require(fromTokenData.slot == toTokenData.slot, "ERC3525: transfer to token with different slot");

fromTokenData.balance -= value_;
toTokenData.balance += value_;
```

There is also an address-based value transfer overload:

```solidity
function transferFrom(
    uint256 fromTokenId_,
    address to_,
    uint256 value_
) public payable virtual override returns (uint256 newTokenId) {
    _spendAllowance(_msgSender(), fromTokenId_, value_);

    newTokenId = _createDerivedTokenId(fromTokenId_);
    _mint(to_, newTokenId, ERC3525.slotOf(fromTokenId_), 0);
    _transferValue(fromTokenId_, newTokenId, value_);
}
```

So an ERC-3525 value transfer can create a new token ID for the recipient and then move value into it. That is fundamentally different from ERC-1155, where you just increment and decrement wallet balances for an existing token type.

### How transfers differ from ERC-20 and ERC-721

ERC-3525 introduces two transfer styles that matter for understanding this bug:

1. **Whole-token transfer**. This looks more like ERC-721. Ownership of the entire token ID moves from one account to another.
2. **Value transfer**. This moves only part of the value associated with a token ID, as we discussed above.

Depending on the function used, the transferred value can:

- be merged into another token ID
- or create or transfer into a token ID owned by the recipient

This is why the contract has to implement **both** receiver interfaces:

- `IERC721Receiver` for whole-token receipt
- `IERC3525Receiver` for value receipt

## How the wrapper is supposed to work

`BitcoinReserveOffering.sol` takes an ERC-3525 position, or some value from that position, and wraps it into a fungible ERC20-like token. In other words:

- the underlying asset is a semi-fungible position
- the wrapper turns deposited position value into fungible shares
- later, burning shares releases underlying position value back out

The wrapper keeps an internal held token ID, `holdingValueSftId`, which acts as the contract's main pooled position.

More specifically, `holdingValueSftId` is the token ID that the wrapper uses as its **main internal container of value**. Once the contract has received SFT value, later deposits can be merged into this held token ID instead of always creating or tracking separate positions.

You can see the intended wrapper design in the top-level `mint()` logic:

```solidity
uint256 sftBalance = IERC3525(wrappedSftAddress).balanceOf(sftId_);
if (amount_ == sftBalance) {
    ERC3525TransferHelper.doSafeTransferIn(wrappedSftAddress, msg.sender, sftId_);
} else if (amount_ < sftBalance) {
    if (holdingValueSftId == 0) {
        holdingValueSftId = ERC3525TransferHelper.doTransferIn(wrappedSftAddress, sftId_, amount_);
    } else {
        ERC3525TransferHelper.doTransfer(wrappedSftAddress, sftId_, holdingValueSftId, amount_);
    }
} else {
    revert("SftWrappedToken: mint amount exceeds sft balance");
}

uint256 value = amount_ * exchangeRate / (10 ** decimals());
_mint(msg.sender, value);
```

This code intends to:

- if the user deposits the whole SFT, transfer the whole token into the wrapper (the if branch). In `doSafeTransferIn()`, the transfered position triggers `onERC721Received` callback in the wrapper contract. See [here](https://github.com/solv-finance/erc-3525/blob/d80df770e34b0407b7e72551940f24f4334a289c/contracts/ERC3525.sol#L537).
- if the user deposits only part of the SFT's value, follow the else-if branch:
    - if `holdingValueSftId == 0`, the wrapper does not yet have a main held position, so `doTransferIn()` transfers the value into the wrapper contract and returns the new token ID that becomes `holdingValueSftId`. In `doTransferIn()`, it triggers one of the definitions of [`transferFrom()`](https://github.com/solv-finance/erc-3525/blob/d80df770e34b0407b7e72551940f24f4334a289c/contracts/ERC3525.sol#L162) and eventually triggers `onERC3525Received` callback in the wrapper contract.
    - if `holdingValueSftId != 0`, the wrapper already has a main held position, so `doTransfer(...)` merges the deposited value into that existing held token ID. Similarly, `doTransfer()` triggers another definition of [`transferFrom()`](https://github.com/solv-finance/erc-3525/blob/d80df770e34b0407b7e72551940f24f4334a289c/contracts/ERC3525.sol#L174) and triggers `onERC3525Received` callback too.
- then the code mints fungible ERC20 shares corresponding to the deposited value.

The expected flow is:

1. A user owns an ERC-3525 token ID in the correct slot.
2. The user deposits either the entire position or part of its value into the wrapper.
3. The wrapper takes custody of that value.
4. The wrapper mints ERC20 shares representing the deposited amount.
5. Later, the user burns shares to withdraw the corresponding amount of underlying SFT value.

### Why callbacks exist at all

The callbacks are not inherently a problem. They exist because the wrapper contract must be able to safely receive:

- a whole ERC-3525 token via ERC-721-style transfer semantics
- or ERC-3525 value via the ERC-3525 receiver flow

In a correct design, those callbacks would only:

- confirm that the received asset is acceptable
- update custody bookkeeping such as `holdingValueSftId`
- avoid performing duplicate economic accounting

The bug appears because this implementation lets callbacks participate in the economic accounting by calling `_mint(...)`, while `mint()` also performs its own post-transfer `_mint(...)`.

## The vulnerable `mint()` flow

The user-facing deposit entrypoint is:

```solidity
function mint(uint256 sftId_, uint256 amount_) external virtual override nonReentrant {
    require(wrappedSftSlot == IERC3525(wrappedSftAddress).slotOf(sftId_), "SftWrappedToken: slot does not match");
    require(msg.sender == IERC3525(wrappedSftAddress).ownerOf(sftId_), "SftWrappedToken: caller is not sft owner");
    require(amount_ > 0, "SftWrappedToken: mint amount cannot be 0");

    uint256 sftBalance = IERC3525(wrappedSftAddress).balanceOf(sftId_);
    if (amount_ == sftBalance) {
        ERC3525TransferHelper.doSafeTransferIn(wrappedSftAddress, msg.sender, sftId_);
    } else if (amount_ < sftBalance) {
        if (holdingValueSftId == 0) {
            holdingValueSftId = ERC3525TransferHelper.doTransferIn(wrappedSftAddress, sftId_, amount_);
        } else {
            ERC3525TransferHelper.doTransfer(wrappedSftAddress, sftId_, holdingValueSftId, amount_);
        }
    } else {
        revert("SftWrappedToken: mint amount exceeds sft balance");
    }

    // @audit-issue Double minting bug
    uint256 value = amount_ * exchangeRate / (10 ** decimals());
    _mint(msg.sender, value);
}
```

The last two lines would be fine if the earlier transfer paths were passive. They are not. Some of them trigger callbacks that mint shares before control returns to `mint()`.

## Path 1: full-balance deposit via `onERC721Received`

If the user deposits the entire SFT balance, `mint()` calls:

```solidity
ERC3525TransferHelper.doSafeTransferIn(wrappedSftAddress, msg.sender, sftId_);
```

The helper uses `safeTransferFrom`:

```solidity
function doSafeTransferIn(address underlying, address from, uint256 tokenId) internal {
    ERC721Interface token = ERC721Interface(underlying);
    token.safeTransferFrom(from, address(this), tokenId);
}
```

That transfer invokes `onERC721Received` on the wrapper:

```solidity
function onERC721Received(address, address from_, uint256 sftId_, bytes calldata)
    external
    virtual
    override
    onlyWrappedSft
    returns (bytes4)
{
    require(wrappedSftSlot == IERC3525(wrappedSftAddress).slotOf(sftId_), "SftWrappedToken: unreceivable slot");
    require(address(this) == IERC3525(wrappedSftAddress).ownerOf(sftId_), "SftWrappedToken: not owned sft id");

    if (from_ == address(this)) {
        return IERC721Receiver.onERC721Received.selector;
    }

    uint256 sftValue = IERC3525(wrappedSftAddress).balanceOf(sftId_);
    require(sftValue > 0, "SftWrappedToken: mint zero not allowed");

    if (holdingValueSftId == 0) {
        holdingValueSftId = sftId_;
    } else {
        ERC3525TransferHelper.doTransfer(wrappedSftAddress, sftId_, holdingValueSftId, sftValue);
        _holdingEmptySftIds.push(sftId_);
    }

    // @audit-issue Double minting bug
    uint256 value = sftValue * exchangeRate / (10 ** decimals());
    _mint(from_, value);
    return IERC721Receiver.onERC721Received.selector;
}
```

The callback already accounts for the deposit here:

```solidity
_mint(from_, value);
```

Then control returns to `mint()`, which still executes:

```solidity
uint256 value = amount_ * exchangeRate / (10 ** decimals());
_mint(msg.sender, value);
```

So the full-balance deposit path is a direct double mint.

## Path 2: first partial-value deposit via `onERC3525Received`

The contract also supports depositing only part of an SFT's value.

When `amount_ < sftBalance` and the wrapper has no existing `holdingValueSftId`, `mint()` does this:

```solidity
holdingValueSftId = ERC3525TransferHelper.doTransferIn(wrappedSftAddress, sftId_, amount_);
```

The helper transfers value to `address(this)`:

```solidity
function doTransferIn(address underlying, uint256 fromTokenId, uint256 value)
    internal
    returns (uint256 newTokenId)
{
    ERC3525Interface token = ERC3525Interface(underlying);
    return token.transferFrom(fromTokenId, address(this), value);
}
```

That triggers `onERC3525Received()` on the wrapper:

```solidity
function onERC3525Received(
    address,
    uint256 fromSftId_,
    uint256 sftId_,
    uint256 sftValue_,
    bytes calldata
) external virtual override onlyWrappedSft returns (bytes4) {
    address fromSftOwner = IERC3525(wrappedSftAddress).ownerOf(fromSftId_);

    if (fromSftOwner == address(this)) {
        return IERC3525Receiver.onERC3525Received.selector;
    }

    require(sftValue_ > 0, "SftWrappedToken: mint zero not allowed");
    if (holdingValueSftId == 0) {
        require(wrappedSftSlot == IERC3525(wrappedSftAddress).slotOf(sftId_), "SftWrappedToken: unreceivable slot");
        require(address(this) == IERC3525(wrappedSftAddress).ownerOf(sftId_), "SftWrappedToken: not owned sft id");
        holdingValueSftId = sftId_;
    } else {
        require(holdingValueSftId == sftId_, "SftWrappedToken: not holding value sft id");
    }

    // @audit-issue Double minting bug
    uint256 value = sftValue_ * exchangeRate / (10 ** decimals());
    _mint(fromSftOwner, value);

    return IERC3525Receiver.onERC3525Received.selector;
}
```

Again, the callback already issues shares:

```solidity
_mint(fromSftOwner, value);
```

Then the outer `mint()` returns from the helper and mints again for the same deposit. So the first partial-value deposit into an empty wrapper is also a callback-driven double-mint path.

## How `burn()` monetizes the bug

The redemption path is:

```solidity
function burn(uint256 amount_, uint256 sftId_) external virtual override nonReentrant returns (uint256 toSftId_) {
    require(amount_ > 0, "SftWrappedToken: burn amount cannot be 0");
    _burn(msg.sender, amount_);

    uint256 sftValue = amount_ * (10 ** decimals()) / exchangeRate;

    if (sftId_ == 0) {
        if (_holdingEmptySftIds.length == 0) {
            toSftId_ = ERC3525TransferHelper.doTransferOut(wrappedSftAddress, holdingValueSftId, msg.sender, sftValue);
        } else {
            toSftId_ = _holdingEmptySftIds[_holdingEmptySftIds.length - 1];
            _holdingEmptySftIds.pop();
            ERC3525TransferHelper.doTransfer(wrappedSftAddress, holdingValueSftId, toSftId_, sftValue);
            ERC3525TransferHelper.doTransferOut(wrappedSftAddress, msg.sender, toSftId_);
        }
    } else {
        require(wrappedSftSlot == IERC3525(wrappedSftAddress).slotOf(sftId_), "SftWrappedToken: slot does not match");
        require(msg.sender == IERC3525(wrappedSftAddress).ownerOf(sftId_), "SftWrappedToken: not sft owner");
        ERC3525TransferHelper.doTransfer(wrappedSftAddress, holdingValueSftId, sftId_, sftValue);
        toSftId_ = sftId_;
    }
}
```

The key step is:

```solidity
uint256 sftValue = amount_ * (10 ** decimals()) / exchangeRate;
```

If the attacker holds more wrapped shares than should exist, `burn()` lets them redeem more underlying SFT value than they legitimately deposited. Once supply is inflated, `burn()` becomes the extraction mechanism.

To extract profit, attacker loops the following actions for many times:

1. Call `mint()` with an underlying SFT position or some value from that position.
2. Receive too many wrapped ERC20 shares because the deposit is accounted for twice.
3. Call `burn()` to redeem those inflated shares back into underlying SFT value.
4. Reuse the recovered underlying value and repeat the process.

## Outro

This incident is a good reminder that many high-impact exploits do not come from exotic math or deep protocol complexity. Sometimes the loss comes from a basic invariant being broken across two code paths that each look reasonable in isolation. In this case, the key review question was simple: for one unit of deposited SFT value, how many times can share supply increase? Once the answer becomes "more than once," the wrapper is already broken.

This is exactly the kind of issue we look for at [Taichi Audit](https://taichiaudit.com/). A strong security review is not just about scanning for known bug patterns. It is about tracing full state transitions, writing down the real economic invariants, and checking whether callbacks, helper libraries, and edge-case branches violate them under realistic execution flow. Wrapper contracts, vaults, tokenized positions, and cross-standard integrations are especially easy to get wrong because the accounting logic is often spread across multiple entrypoints and receiver hooks.

If your protocol handles complex token standards such as ERC-3525, ERC-4626, ERC-1155, rebasing assets, or any custom accounting layer, this is the right place to be paranoid. These are exactly the situations where a small accounting mismatch can become a direct profit loop for an attacker.

Taichi Audit specializes in finding bugs at that boundary between code and economics. If you are building a protocol with non-trivial accounting flows, callback-based integrations, or custom asset wrappers, feel free to [reach out](https://docs.google.com/forms/d/14s22jxDEjYRs1syrSLUQa62FpB4qVLAgbRl6FaXtbBI/viewform?pli=1&ts=670e18d0&pli=1&edit_requested=true). Catching this class of bug before deployment is much cheaper than explaining it after an exploit.
