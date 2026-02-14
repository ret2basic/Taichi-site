---
title: "Morpho Internals Part 1: Morpho Blue"
slug: "morpho-internals-part-1-morpho-blue"
excerpt: "Deep dive into Morpho Blue's core contract—market creation, supply/borrow/collateral flows, liquidation math, and interest accrual mechanics."
author: "ret2basic.eth (reviewed by jesjupyter)"
date: "2025-12-24"
readTime: "30 min read"
category: "DeFi"
tags: ["Morpho", "Lending", "Source Code Walkthrough"]
featured: false
image: "/images/blog/Morpho.jpg"
---

Morpho Blue is a concise lending protocol implementation. This series dives deep into Morpho internals and each component will be discussed in a separate article. In part 1, we first walk through Morpho.sol following the order of user actions and in the end we discuss the interest accrual math.

## Action 1: Market Creation

Morpho Blue is a singleton contract: all markets live inside the same deployed contract rather than being separate market-specific contracts. As a result, creating a new market is just writing a new `MarketParams` entry into storage—cheap compared to deploying a new pool. This also explains why features like flashloans are shared at the protocol level: a single contract can access all supplied liquidity across markets in one transaction.

```solidity
    function createMarket(MarketParams memory marketParams) external {
        Id id = marketParams.id();
        require(isIrmEnabled[marketParams.irm], ErrorsLib.IRM_NOT_ENABLED);
        require(isLltvEnabled[marketParams.lltv], ErrorsLib.LLTV_NOT_ENABLED);
        require(market[id].lastUpdate == 0, ErrorsLib.MARKET_ALREADY_CREATED);

        // Safe "unchecked" cast.
        market[id].lastUpdate = uint128(block.timestamp);
        idToMarketParams[id] = marketParams;

        emit EventsLib.CreateMarket(id, marketParams);

        // Call to initialize the IRM in case it is stateful.
        if (marketParams.irm != address(0)) IIrm(marketParams.irm).borrowRate(marketParams, market[id]);
    }
```

### ID calculation

The code takes `MarketParams` from user and stores it in memory. The market ID (unique identifier representing which market we are working with) is computed as a hash of user input. This design avoids SLOAD in the future: if the code accepts market ID from user, it will need to perform `idToMarketParams[id]` lookup for each call, which is expensive. Instead, in this design the code lets user provide the entire `MarketParams` struct and only performs a keccak256 computation and use that hash as ID. If the user "lies" about an entry in the `MarketParams` struct, the ID will be completely different and very likely not registered, therefore the security isn’t compromised.

```solidity
Id id = marketParams.id();
...
idToMarketParams[id] = marketParams;
```

`MarketParams` type is handled by MarketParamsLib where it defines the algorithm for computing ID. It is just a simple keccak256 over the in-memory struct with a fixed byte length:

```solidity
library MarketParamsLib {
    /// @notice The length of the data used to compute the id of a market.
    /// @dev The length is 5 * 32 because `MarketParams` has 5 variables of 32 bytes each.
    uint256 internal constant MARKET_PARAMS_BYTES_LENGTH = 5 * 32;

    /// @notice Returns the id of the market `marketParams`.
    function id(MarketParams memory marketParams) internal pure returns (Id marketParamsId) {
        assembly ("memory-safe") {
            marketParamsId := keccak256(marketParams, MARKET_PARAMS_BYTES_LENGTH)
        }
    }
}
```

Note that `marketParams` resides in memory so each field in struct MarketParams occupies 32 bytes (there is no "compact" optimization as in storage), therefore the length is fixed 5 * 32 bytes. The struct is defined in interface IMorpho.sol:

```solidity
struct MarketParams {
    address loanToken;
    address collateralToken;
    address oracle;
    address irm;
    uint256 lltv;
}
```

You will see this pattern in all external functions of this contract.

### IRM initialization

In `createMarket()`, the very last line `if (marketParams.irm != address(0)) IIrm(marketParams.irm).borrowRate(marketParams, market[id]);` is for initializing the IRM. The actual source code of `borrowRate()` can be found under the morpho-blue-irm repo:

```solidity
    function borrowRate(MarketParams memory marketParams, Market memory market) external returns (uint256) {
        require(msg.sender == MORPHO, ErrorsLib.NOT_MORPHO);

        Id id = marketParams.id();

        (uint256 avgRate, int256 endRateAtTarget) = _borrowRate(id, market);

        rateAtTarget[id] = endRateAtTarget;

        // Safe "unchecked" cast because endRateAtTarget >= 0.
        emit BorrowRateUpdate(id, avgRate, uint256(endRateAtTarget));

        return avgRate;
    }
```

The initialization is setting `rateAtTarget[id]` to `ConstantsLib.INITIAL_RATE_AT_TARGET` . The logic is from `_borrowRate()`:

```solidity
        if (startRateAtTarget == 0) {
            // First interaction.
            avgRateAtTarget = ConstantsLib.INITIAL_RATE_AT_TARGET;
            endRateAtTarget = ConstantsLib.INITIAL_RATE_AT_TARGET;
        }
```

`INITIAL_RATE_AT_TARGET` is just 4% per year converted into a per-second rate by dividing by the number of seconds in a year (`365 days`).

```solidity
    /// @notice Initial rate at target per second (scaled by WAD).
    /// @dev Initial rate at target = 4% (rate between 1% and 16%).
    int256 public constant INITIAL_RATE_AT_TARGET = 0.04 ether / int256(365 days);
```

### An example market: wstETH/WETH

To get an intuitive understanding of what a market does, let’s use the [wstETH/WETH](https://app.morpho.org/ethereum/market/0xb8fc70e82bc5bb53e773626fcc6a23f7eefa036918d7ef216ecfb1950a94a85e/wsteth-weth) market (ID is 0xb8fc70e82bc5bb53e773626fcc6a23f7eefa036918d7ef216ecfb1950a94a85e) as an example.

In "Overview" tab, you will see a few basic facts about the market:

![Overview_Tab.png](/images/blog/Overview_Tab.png)

- **Collateral token** is wstETH, which is a yield-bearing token.
    - The native yield (the yield generated by wstETH itself) is 2.62% per year.
    - Borrowers have to deposit collateral in order to borrow the loan token from the same market. How much they can borrow depends on the "Liquidation LTV": borrowers can borrow up to 96.5% loan-to-value before the position becomes liquidatable, so they have to monitor the position to stay below this threshold.
    - Note that depositing collateral into the market doesn’t generate interest: it only gives you borrowing capacity.
- **Loan token** is WETH.
    - Suppliers deposit loan tokens to the market for generating interest (low-risk profit).
    - Again, depositing the loan token into the market does not give you borrowing capacity: "supplying" and "supplying collateral" are two different notions in Morpho.
- **Oracle price** is the price of 1 unit of collateral quoted in the loan token (i.e., collateral/loan), not a price denominated in USD.
- **Utilization** is 90.69% at this moment.
    - This means 90.69% of supplied loan token is currently being borrowed by borrowers (that portion of supplied loan isn’t sitting in the market).
    - Morpho’s "target utilization" is 90%. The interest rate is dynamic and the goal is to push current utilization (90.69%) towards target utilization (90%) so that most supplied loan tokens are borrowed (earning interest), while still keeping enough liquidity in the pool to avoid insufficient liquidity for withdrawals/borrows.

In "Advanced" tab, we see more information about the underlying components used by the market:

![Advanced_Tab.png](/images/blog/Advanced_Tab.png)

- Oracle also has a **"reference price"**. This is a backup oracle price used to sanity-check whether the main oracle returns a reasonable price.
- **IRM** (interest rate model) is the engine behind the scenes that pushes utilization towards target utilization, as we already discussed.
- Liquidation has concepts of **"penalty"** and **"bad debt"**.
    - Penalty is the portion that the borrower loses when a liquidator liquidates the position. The borrower’s penalty is the liquidator’s incentive. We will discuss this in depth in the LIF part of this article.
    - Bad debt occurs when a borrower’s position (collateral value) drops below what they borrowed. In that case the protocol becomes undercollateralized and suppliers end up absorbing a loss (the bad debt). We will cover this in greater detail since it is important for Morpho fork/integration audits.

## Action 2: Supply and Withdraw

Supply / withdraw flow is related to interest earning only and this supplied asset can’t be used as collateral for borrowing. Note that this design is different from other lending protocols such as Compound and Aave. The collateral related functions (`supplyCollateral()` and `withdrawCollateral()`) will be discussed in Action 3.

### Supply

```solidity
    function supply(
        MarketParams memory marketParams,
        uint256 assets,
        uint256 shares,
        address onBehalf,
        bytes calldata data
    ) external returns (uint256, uint256) {
        Id id = marketParams.id();
        require(market[id].lastUpdate != 0, ErrorsLib.MARKET_NOT_CREATED);
        require(UtilsLib.exactlyOneZero(assets, shares), ErrorsLib.INCONSISTENT_INPUT);
        require(onBehalf != address(0), ErrorsLib.ZERO_ADDRESS);

        _accrueInterest(marketParams, id);

        if (assets > 0) shares = assets.toSharesDown(market[id].totalSupplyAssets, market[id].totalSupplyShares);
        else assets = shares.toAssetsUp(market[id].totalSupplyAssets, market[id].totalSupplyShares);

        position[id][onBehalf].supplyShares += shares;
        market[id].totalSupplyShares += shares.toUint128();
        market[id].totalSupplyAssets += assets.toUint128();

        emit EventsLib.Supply(id, msg.sender, onBehalf, assets, shares);

        if (data.length > 0) IMorphoSupplyCallback(msg.sender).onMorphoSupply(assets, data);

        IERC20(marketParams.loanToken).safeTransferFrom(msg.sender, address(this), assets);

        return (assets, shares);
    }
```

User is expected to pass in `marketParams` for saving gas since reading from storage is expensive. The code computes id onchain so that malicious user can’t provide a non-existent `marketParams`.

`UtilsLib.exactlyOneZero()` is an assembly function that returns true iff one of the two inputs is 0 (just a simple XOR):

```solidity
    function exactlyOneZero(uint256 x, uint256 y) internal pure returns (bool z) {
        assembly {
            z := xor(iszero(x), iszero(y))
        }
    }
```

This check is needed because the code expects user to either supply by asset or supply by share, it won’t make sense to provide non-zero asset and share. This pattern is for merging two similar functionalities into one single function, otherwise we will have two functions like "supplyByAsset" and "supplyByShare".

`onBehalf` allows user to supply for some other address. This is the usual operator design for integration.

We will go over `_accrueInterest()` at the end of this article, ignore it for now.

Then the code either converts asset to share or share to asset depending on what user specified when calling the function. Both asset and share are needed for updating some state variables (supplyShares, totalSupplyShares, totalSupplyAssets). Here share is rounded down and asset is rounded up. In general, the contract picks rounding modes case-by-case to be conservative: mint fewer shares than the assets justify, burn more shares than the assets being withdrawn, require more shares when borrowing, and accept more assets when repaying. The gold rule is that rounding direction must favor protocol.

Next the code updates 3 state variables for reflecting the change:

- `position[id][onBehalf].supplyShares += shares;` ← User-level accounting of supplied shares of this user. The definition for struct Position is in IMorpho.sol:
    
    ```solidity
    struct Position {
        uint256 supplyShares;
        uint128 borrowShares;
        uint128 collateral;
    }
    ```
    
- `market[id].totalSupplyShares += shares.toUint128();` ← Market-level accounting of shares total
- `market[id].totalSupplyAssets += assets.toUint128();` ← Market-level accounting of assets total

Then there is an optional callback functionality. At last the code pulls supplied tokens from the user (the user has to approve ahead before calling `supply()`).

### Withdraw

`withdraw()` is just a mirror of `supply()` with one additional `_isSenderAuthorized()` check:

```solidity
    function withdraw(
        MarketParams memory marketParams,
        uint256 assets,
        uint256 shares,
        address onBehalf,
        address receiver
    ) external returns (uint256, uint256) {
        Id id = marketParams.id();
        require(market[id].lastUpdate != 0, ErrorsLib.MARKET_NOT_CREATED);
        require(UtilsLib.exactlyOneZero(assets, shares), ErrorsLib.INCONSISTENT_INPUT);
        require(receiver != address(0), ErrorsLib.ZERO_ADDRESS);
        // No need to verify that onBehalf != address(0) thanks to the following authorization check.
        require(_isSenderAuthorized(onBehalf), ErrorsLib.UNAUTHORIZED);

        _accrueInterest(marketParams, id);

        if (assets > 0) shares = assets.toSharesUp(market[id].totalSupplyAssets, market[id].totalSupplyShares);
        else assets = shares.toAssetsDown(market[id].totalSupplyAssets, market[id].totalSupplyShares);

        position[id][onBehalf].supplyShares -= shares;
        market[id].totalSupplyShares -= shares.toUint128();
        market[id].totalSupplyAssets -= assets.toUint128();

        require(market[id].totalBorrowAssets <= market[id].totalSupplyAssets, ErrorsLib.INSUFFICIENT_LIQUIDITY);

        emit EventsLib.Withdraw(id, msg.sender, onBehalf, receiver, assets, shares);

        IERC20(marketParams.loanToken).safeTransfer(receiver, assets);

        return (assets, shares);
    }
```

`supply()` doesn’t have this check because user can supply for any other user, but `withdraw()` must have this check for obvious reason:

```solidity
    function _isSenderAuthorized(address onBehalf) internal view returns (bool) {
        return msg.sender == onBehalf || isAuthorized[onBehalf][msg.sender];
    }
```

Authorization is set by `setAuthorization()` and `setAuthorizationWithSig()`, pretty much the same idea as ERC20 approval and permit.

After that the code performs a liquidity check: `market[id].totalBorrowAssets <= market[id].totalSupplyAssets` (you can’t withdraw assets currently borrowed) and transfers assets back to the user.

## Action 3: supplyCollateral and withdrawCollateral

As we mentioned earlier, `supply()` and `withdraw()` are related to the interest-earning functionality only, the tokens provided via `supply()` can’t be used as collateral. The collateral related functions are `supplyCollateral()` and `withdrawCollateral()`.

### supplyCollateral

```solidity
    function supplyCollateral(MarketParams memory marketParams, uint256 assets, address onBehalf, bytes calldata data)
        external
    {
        Id id = marketParams.id();
        require(market[id].lastUpdate != 0, ErrorsLib.MARKET_NOT_CREATED);
        require(assets != 0, ErrorsLib.ZERO_ASSETS);
        require(onBehalf != address(0), ErrorsLib.ZERO_ADDRESS);

        // Don't accrue interest because it's not required and it saves gas.

        position[id][onBehalf].collateral += assets.toUint128();

        emit EventsLib.SupplyCollateral(id, msg.sender, onBehalf, assets);

        if (data.length > 0) IMorphoSupplyCollateralCallback(msg.sender).onMorphoSupplyCollateral(assets, data);

        IERC20(marketParams.collateralToken).safeTransferFrom(msg.sender, address(this), assets);
    }
```

`position[id][onBehalf].collateral` is a field of struct Position defined in IMorpho.sol. Again, from this definition we can clearly see supply/borrow and collateral are handled separately and `collateral` is an independent accounting in storage:

```solidity
struct Position {
    uint256 supplyShares;
    uint128 borrowShares;
    uint128 collateral;
}
```

A natural question to ask is: why do most functions in Morpho.sol call `_accrueInterest(marketParams, id);`, but `supplyCollateral()` is the only exception? This is because `supplyCollateral()` essentially only performs `position[id][onBehalf].collateral += assets.toUint128();`, and this state variable update does not depend on interest accrual or any state variable that is updated during interest accrual.

### withdrawCollateral

`withdrawCollateral()` is a mirror of `supplyCollateral()` but with additional authorization check and health check:

```solidity
    function withdrawCollateral(MarketParams memory marketParams, uint256 assets, address onBehalf, address receiver)
        external
    {
        Id id = marketParams.id();
        require(market[id].lastUpdate != 0, ErrorsLib.MARKET_NOT_CREATED);
        require(assets != 0, ErrorsLib.ZERO_ASSETS);
        require(receiver != address(0), ErrorsLib.ZERO_ADDRESS);
        // No need to verify that onBehalf != address(0) thanks to the following authorization check.
        require(_isSenderAuthorized(onBehalf), ErrorsLib.UNAUTHORIZED);

        _accrueInterest(marketParams, id);

        position[id][onBehalf].collateral -= assets.toUint128();

        require(_isHealthy(marketParams, id, onBehalf), ErrorsLib.INSUFFICIENT_COLLATERAL);

        emit EventsLib.WithdrawCollateral(id, msg.sender, onBehalf, receiver, assets);

        IERC20(marketParams.collateralToken).safeTransfer(receiver, assets);
    }
```

Health check is needed here to avoid the situation where the user withdraws collateral and the position becomes liquidatable immediately.

`_isHealthy()` is an overloaded function; the outer level fetches the oracle price and forwards the price to the inner level:

```solidity
    function _isHealthy(MarketParams memory marketParams, Id id, address borrower) internal view returns (bool) {
        if (position[id][borrower].borrowShares == 0) return true;

        uint256 collateralPrice = IOracle(marketParams.oracle).price();

        return _isHealthy(marketParams, id, borrower, collateralPrice);
    }

    function _isHealthy(MarketParams memory marketParams, Id id, address borrower, uint256 collateralPrice)
        internal
        view
        returns (bool)
    {
        uint256 borrowed = uint256(position[id][borrower].borrowShares)
            .toAssetsUp(market[id].totalBorrowAssets, market[id].totalBorrowShares);
        uint256 maxBorrow = uint256(position[id][borrower].collateral).mulDivDown(collateralPrice, ORACLE_PRICE_SCALE)
            .wMulDown(marketParams.lltv);

        return maxBorrow >= borrowed;
    }
```

Here collateral price is the price of the collateral token denominated in the loan token. In other words it is collateral token : loan token ratio. More precisely, IOracle.sol says this price "Returns the price of 1 asset of collateral token quoted in 1 asset of loan token, scaled by 1e36." The price fetched from the oracle is used to compute max borrow amount for this user.

The mechanism of the oracle will be discussed in a future article.

The inner level of `_isHealthy()` computes the current asset amount that the user borrowed and the maximum that the user can borrow. If former value doesn’t exceed the later value then the position is still healthy. The formula used here is:

- `borrowed = "borrowShares converted to asset"`, rounding up ← this rounding direction favors protocol because more "borrowed" means more debt for the user
- `maxBorrow = collateral * collateralPrice * LLTV / ORACLE_PRICE_SCALE`, rounding down ← this rounding direction favors protocol too because less max borrow amount is a restriction put on user
    - LLTV stands for "[Liquidation Loan-To-Value](https://docs.morpho.org/build/borrow/concepts/ltv#liquidation-loan-to-value-lltv)" and it is a hardcoded value defined during market creation. [Doc](https://docs.morpho.org/curate/tutorials-market-v1/creating-market/#fill-all-attributes) mentions that governance had approved a list of LLTV values, so you must choose from this list when you create market:
        - 0%
        - 38.5%
        - 62.5%
        - 77.0%
        - 86.0%
        - 91.5%
        - 94.5%
        - 96.5%
        - 98.0%
    - Doc also defines theoretical concepts such as [LTV](https://docs.morpho.org/build/borrow/concepts/ltv#how-to-calculate-ltv) (Loan-To-Value) and [Health Factor](https://docs.morpho.org/build/borrow/concepts/ltv#health-factor), but these concepts are not directly computed in the code. The code only compares `maxBorrow ≥ borrowed`, which is mathematically equivalent to LTV and Health Factor calculation and this approach avoids some division math to avoid precision loss. Also division is expensive on EVM so there is a good reason to avoid it.

## Action 4: Borrow and Repay

Until this point you should be very familiar with the coding pattern of Morpho Blue. The borrow/repay flow is very similar to `withdrawCollateral()` and you should be able to understand the code instantaneously.

### Borrow

```solidity
    function borrow(
        MarketParams memory marketParams,
        uint256 assets,
        uint256 shares,
        address onBehalf,
        address receiver
    ) external returns (uint256, uint256) {
        Id id = marketParams.id();
        require(market[id].lastUpdate != 0, ErrorsLib.MARKET_NOT_CREATED);
        require(UtilsLib.exactlyOneZero(assets, shares), ErrorsLib.INCONSISTENT_INPUT);
        require(receiver != address(0), ErrorsLib.ZERO_ADDRESS);
        // No need to verify that onBehalf != address(0) thanks to the following authorization check.
        require(_isSenderAuthorized(onBehalf), ErrorsLib.UNAUTHORIZED);

        _accrueInterest(marketParams, id);

        if (assets > 0) shares = assets.toSharesUp(market[id].totalBorrowAssets, market[id].totalBorrowShares);
        else assets = shares.toAssetsDown(market[id].totalBorrowAssets, market[id].totalBorrowShares);

        position[id][onBehalf].borrowShares += shares.toUint128();
        market[id].totalBorrowShares += shares.toUint128();
        market[id].totalBorrowAssets += assets.toUint128();

        require(_isHealthy(marketParams, id, onBehalf), ErrorsLib.INSUFFICIENT_COLLATERAL);
        require(market[id].totalBorrowAssets <= market[id].totalSupplyAssets, ErrorsLib.INSUFFICIENT_LIQUIDITY);

        emit EventsLib.Borrow(id, msg.sender, onBehalf, receiver, assets, shares);

        IERC20(marketParams.loanToken).safeTransfer(receiver, assets);

        return (assets, shares);
    }
```

The only thing worth discussing here is the rounding direction:

- `shares = assets.toSharesUp(market[id].totalBorrowAssets, market[id].totalBorrowShares);` ← This is borrowed shares, so rounding up favors protocol (more borrowed shares means more debt for user).
- `assets = shares.toAssetsDown(market[id].totalBorrowAssets, market[id].totalBorrowShares);` ← `assets` is the token amount sent to `receiver`; rounding down favors the protocol (the borrower gets slightly fewer assets for a given number of shares).

Rest of the code such as the health check and liquidity check is pretty intuitive for a lending protocol.

### Repay

```solidity
    function repay(
        MarketParams memory marketParams,
        uint256 assets,
        uint256 shares,
        address onBehalf,
        bytes calldata data
    ) external returns (uint256, uint256) {
        Id id = marketParams.id();
        require(market[id].lastUpdate != 0, ErrorsLib.MARKET_NOT_CREATED);
        require(UtilsLib.exactlyOneZero(assets, shares), ErrorsLib.INCONSISTENT_INPUT);
        require(onBehalf != address(0), ErrorsLib.ZERO_ADDRESS);

        _accrueInterest(marketParams, id);

        if (assets > 0) shares = assets.toSharesDown(market[id].totalBorrowAssets, market[id].totalBorrowShares);
        else assets = shares.toAssetsUp(market[id].totalBorrowAssets, market[id].totalBorrowShares);

        position[id][onBehalf].borrowShares -= shares.toUint128();
        market[id].totalBorrowShares -= shares.toUint128();
        market[id].totalBorrowAssets = UtilsLib.zeroFloorSub(market[id].totalBorrowAssets, assets).toUint128();

        // `assets` may be greater than `totalBorrowAssets` by 1.
        emit EventsLib.Repay(id, msg.sender, onBehalf, assets, shares);

        if (data.length > 0) IMorphoRepayCallback(msg.sender).onMorphoRepay(assets, data);

        IERC20(marketParams.loanToken).safeTransferFrom(msg.sender, address(this), assets);

        return (assets, shares);
    }
```

The new thing here is `UtilsLib.zeroFloorSub()`. This util function returns `max(0, x - y)` but the algorithm isn’t immediately understandable:

```solidity
    function zeroFloorSub(uint256 x, uint256 y) internal pure returns (uint256 z) {
        assembly {
            z := mul(gt(x, y), sub(x, y))
        }
    }

```

Let’s write out all the possible cases:

- If x > y, `gt(x, y)` returns 1, `sub(x, y)` is a positive integer, `mul(gt(x, y), sub(x, y)) = x - y`.
- If x ≤ y, `gt(x, y)` returns 0, `sub(x, y)` underflows (wraps) in `uint256`, but `mul(0, <anything>) = 0`.
- Therefore this assembly returns either x - y or 0 but never returns anything negative.

Back to `repay()`, the line `market[id].totalBorrowAssets = UtilsLib.zeroFloorSub(market[id].totalBorrowAssets, assets).toUint128();` means computing `market[id].totalBorrowAssets - assets` but clamping the result to 0 if it would underflow. So basically here we allow the user to repay more than necessary and this clamp avoids an underflow.

## Action 5: Flashloan

No fee, no need to repay manually: the code sends you tokens, then pulls them back. This is probably the most minimalist flashloan you will ever see:

```solidity
    function flashLoan(address token, uint256 assets, bytes calldata data) external {
        require(assets != 0, ErrorsLib.ZERO_ASSETS);

        emit EventsLib.FlashLoan(msg.sender, token, assets);

        IERC20(token).safeTransfer(msg.sender, assets);

        IMorphoFlashLoanCallback(msg.sender).onMorphoFlashLoan(assets, data);

        IERC20(token).safeTransferFrom(msg.sender, address(this), assets);
    }
```

**WARNING:** The easy part of the codebase ends here. Action 6 and 7 are hardcore, be prepared.

## Action 6: Liquidation

The most crucial functions in this codebase are `liquidate()` and `_accrueInterest()`. Looking at `liquidate()`, the beginning of this function is the same as `supply()` where it expects a positive `seizedAssets` or `repaidShares` but not both:

```solidity
    function liquidate(
        MarketParams memory marketParams,
        address borrower,
        uint256 seizedAssets,
        uint256 repaidShares,
        bytes calldata data
    ) external returns (uint256, uint256) {
        Id id = marketParams.id();
        require(market[id].lastUpdate != 0, ErrorsLib.MARKET_NOT_CREATED);
        require(UtilsLib.exactlyOneZero(seizedAssets, repaidShares), ErrorsLib.INCONSISTENT_INPUT);

        _accrueInterest(marketParams, id);
```

Next you will see some code enclosed in curly braces `{ ... }` (this is for preventing "Stack Too Deep" error). Inside the block it performs the following computations:

- Fetch collateral price from oracle
- Perform health check to make sure the position isn’t healthy
- Compute liquidation incentive factor (LIF) ← will discuss this in depth in a moment
- Compute `seizedAssets` or `repaidShares` depending on whichever branch the user chose. This computation considers the LIF. In short, the amount of collateral that a liquidator can get is the debt being liquidated multiplied by the liquidation incentive factor.

```solidity
        {
            uint256 collateralPrice = IOracle(marketParams.oracle).price();

            require(!_isHealthy(marketParams, id, borrower, collateralPrice), ErrorsLib.HEALTHY_POSITION);

            // The liquidation incentive factor is min(maxLiquidationIncentiveFactor, 1/(1 - cursor*(1 - lltv))).
            uint256 liquidationIncentiveFactor = UtilsLib.min(
                MAX_LIQUIDATION_INCENTIVE_FACTOR,
                WAD.wDivDown(WAD - LIQUIDATION_CURSOR.wMulDown(WAD - marketParams.lltv))
            );

            if (seizedAssets > 0) {
                uint256 seizedAssetsQuoted = seizedAssets.mulDivUp(collateralPrice, ORACLE_PRICE_SCALE);

                repaidShares = seizedAssetsQuoted.wDivUp(liquidationIncentiveFactor)
                    .toSharesUp(market[id].totalBorrowAssets, market[id].totalBorrowShares);
            } else {
                seizedAssets = repaidShares.toAssetsDown(market[id].totalBorrowAssets, market[id].totalBorrowShares)
                    .wMulDown(liquidationIncentiveFactor).mulDivDown(ORACLE_PRICE_SCALE, collateralPrice);
            }
        }
        uint256 repaidAssets = repaidShares.toAssetsUp(market[id].totalBorrowAssets, market[id].totalBorrowShares);

        position[id][borrower].borrowShares -= repaidShares.toUint128();
        market[id].totalBorrowShares -= repaidShares.toUint128();
        market[id].totalBorrowAssets = UtilsLib.zeroFloorSub(market[id].totalBorrowAssets, repaidAssets).toUint128();

        position[id][borrower].collateral -= seizedAssets.toUint128();
```

Exiting the block, the code converts `repaidShares` to `repaidAssets` (rounding up since `repaidAssets` is the token amount pulled from the liquidator) and updates some state variables like always.

### Liquidation incentive factors (LIF)

**Doc:** https://docs.morpho.org/learn/concepts/liquidation/#liquidation-incentive-factor-lif

A liquidator only performs liquidation when it is profitable, and LIF exists to make liquidations economically viable. This incentive is paid by the borrower indirectly: Morpho adjusts the exchange rate between repaid debt and seized collateral by `liquidationIncentiveFactor`.

- If the liquidator specifies `seizedAssets`, the contract computes `repaidShares` by dividing the collateral value (quoted in loan token) by `liquidationIncentiveFactor`, so the liquidator repays less debt for the same collateral seized.
- If the liquidator specifies `repaidShares`, the contract computes `seizedAssets` by multiplying by `liquidationIncentiveFactor`, so the liquidator seizes more collateral for the same debt repaid.

Although not explicitly mentioned in the code, `liquidationIncentiveFactor - 1` is also called "liquidation penalty" in Morpho’s frontend.

```solidity
            if (seizedAssets > 0) {
                uint256 seizedAssetsQuoted = seizedAssets.mulDivUp(collateralPrice, ORACLE_PRICE_SCALE);

                repaidShares = seizedAssetsQuoted.wDivUp(liquidationIncentiveFactor)
                    .toSharesUp(market[id].totalBorrowAssets, market[id].totalBorrowShares);
            } else {
                seizedAssets = repaidShares.toAssetsDown(market[id].totalBorrowAssets, market[id].totalBorrowShares)
                    .wMulDown(liquidationIncentiveFactor).mulDivDown(ORACLE_PRICE_SCALE, collateralPrice);
            }
```

The formula for LIF is:

$$
LIF = \min\left(M, \frac{1}{\beta \ast LLTV + (1 - \beta)}\right), \text{ with } \beta = 0.3 \text{ and } M = 1.15
$$

Here $\beta = 0.3$ is called `LIQUIDATION_CURSOR` in code and $M = 1.15$ is called `MAX_LIQUIDATION_INCENTIVE_FACTOR` in code.

The following graph from the docs visualizes this relationship:

![LIF.png](/images/blog/LIF.png)

Just from the graph you can tell:

1. LIF is lower bounded by 1.00 and upper bounded by 1.15
2. It stays constant 1.15 until LLTV is around 0.55 then it starts to decrease linearly
3. Higher the LLTV, lower the LIF

Simply speaking, the formula shows that LIF is capped by $M$ and otherwise decreases as LLTV increases. In practice, more volatile / riskier collateral is usually assigned a lower LLTV: this makes positions become liquidatable earlier (more time to liquidate before collateral is exhausted) and, through the formula, yields a higher LIF (higher liquidator incentive). The goal is to encourage timely liquidations so that large price drops or execution/oracle delays are less likely to translate into realized bad debt.

### Bad debt

Bad Debt occurs when a borrower's collateral is completely seized (reduced to zero) during a liquidation, but they still have remaining debt (borrow shares). This happens when the value of the collateral drops so significantly that even seizing 100% of it is not enough to repay the entire loan plus the liquidation incentive. The remaining debt is "bad" because there is no collateral backing it anymore:

```solidity
        uint256 badDebtShares;
        uint256 badDebtAssets;
        if (position[id][borrower].collateral == 0) {
            badDebtShares = position[id][borrower].borrowShares;
            badDebtAssets = UtilsLib.min(
                market[id].totalBorrowAssets,
                badDebtShares.toAssetsUp(market[id].totalBorrowAssets, market[id].totalBorrowShares)
            );

            market[id].totalBorrowAssets -= badDebtAssets.toUint128();
            market[id].totalSupplyAssets -= badDebtAssets.toUint128();
            market[id].totalBorrowShares -= badDebtShares.toUint128();
            position[id][borrower].borrowShares = 0;
        }
```

When bad debt occurs, the code reduces 4 state variables:

- `market[id].totalBorrowAssets` is decreased ← eliminate bad debt from market-level accounting
- `market[id].totalSupplyAssets` is decreased ← this is crucial: it reduces share price for everyone
- `market[id].totalBorrowShares` is decreased ← eliminate bad debt from market-level accounting
- `position[id][borrower].borrowShares` is set to 0 ← eliminate bad debt from user-level accounting

The adjustment on `market[id].totalSupplyAssets` distributes the negative effect brought by bad debt to all suppliers who hold some shares in this system. The formula for share price is:

$$
Share Price = \frac{TotalSupplyAssets}{TotalSupplyShares}
$$

So when total supply assets goes down and total supply shares stays the same, share price is decreased, meaning each supplier suffered some loss.

At this stage we covered all user actions in this codebase. The only thing left is `_accrueInterest()` and the IRM, which is notably more difficult than the content we discussed earlier.

## Action 7: Interest accrual

The design of interest accrual is similar to Compound: almost all state-changing functions invoke `_accrueInterest()` (besides `supplyCollateral()`):

First, the code determines how many seconds have passed since the last time interest was accrued. It then calls the IRM contract associated with the market to get the current per-second borrow rate (scaled by WAD) (this part will be explained in Part 2 of this series).

```solidity
    // morpho-blue/src/Morpho.sol
    function _accrueInterest(MarketParams memory marketParams, Id id) internal {
        uint256 elapsed = block.timestamp - market[id].lastUpdate;
        if (elapsed == 0) return;

        if (marketParams.irm != address(0)) {
            uint256 borrowRate = IIrm(marketParams.irm).borrowRate(marketParams, market[id]);
```

### wTaylorCompounded

```solidity
           uint256 interest = market[id].totalBorrowAssets.wMulDown(borrowRate.wTaylorCompounded(elapsed));

```

Instead of simple interest (`rate * time`), the code uses continuous compounding: `MathLib.wTaylorCompounded()`:

```solidity
    /// @dev Returns the sum of the first three non-zero terms of a Taylor expansion of e^(nx) - 1, to approximate a
    /// continuous compound interest rate.
    function wTaylorCompounded(uint256 x, uint256 n) internal pure returns (uint256) {
        uint256 firstTerm = x * n;
        uint256 secondTerm = mulDivDown(firstTerm, firstTerm, 2 * WAD);
        uint256 thirdTerm = mulDivDown(secondTerm, firstTerm, 3 * WAD);

        return firstTerm + secondTerm + thirdTerm;
    }
```

As the comment says this is an approximation for a Taylor expansion of $e^{rt} - 1$. In the code, $r$ is the per-second borrow rate (WAD-scaled) returned by the IRM and $t$ is the elapsed time in seconds.

Recall from elementary math that discrete compounding can be written as $A = P\left(1 + \frac{R}{n}\right)^{nt}$ where $P$ is principal, $R$ is an annual interest rate, $n$ is the number of compounding periods per year and $t$ is time in years. Turning this discrete compounding into continuous compounding, we take the limit:

$$
\lim_{n \to \infty} \left(1 + \frac{r}{n}\right)^{nt} = e^{rt}
$$

This formula is derived from the definition $e = \lim_{k \to \infty} \left(1 + \frac{1}{k}\right)^k$ with a change of variable $k = \frac{n}{r}$, then exponentiate both sides with $rt$. With this limit, the total amount becomes $A = P \cdot e^{rt}$.

Calculating $e^{rt}$ directly on-chain is tough. The way Morpho does it is through an approximation of $e^{rt} - 1$ (minus one since we are computing interest only excluding the principal) using Taylor expansion, but only up to the precision of first 3 terms:

$$
e^x \approx 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \dots \\ e^x - 1 \approx x + \frac{x^2}{2!} + \frac{x^3}{3!} + \dots \\ e^{rt} - 1 \approx rt + \frac{(rt)^2}{2!} + \frac{(rt)^3}{3!} + \dots
$$

The last equation is what `wTaylorCompounded()` computes. Back to upper level code `_accrueInterest()`, the code computes:

$$
\text{Interest} = P \times (e^{rt} - 1) \approx P \times \left( rt + \frac{(rt)^2}{2} + \frac{(rt)^3}{6} \right)
$$

This approximation is accurate enough and saves gas. After computing interest, the code increments `market[id].totalBorrowAssets` and `market[id].totalSupplyAssets` to reflect the change due to interest accrual.

### Share system

```solidity
            market[id].totalBorrowAssets += interest.toUint128();
            market[id].totalSupplyAssets += interest.toUint128();
```

Although not entirely explicit, you should already notice that the interest is distributed through an ERC4626-style share system. Throughout the codebase, "assets" represent the actual token amount and "shares" represent a claim on a portion of the total assets in the pool.

When you supply assets, you receive shares (represented by an increment in `position[id][onBehalf].supplyShares`). When interest accrues, the Total Assets in the pool increase (because borrowers owe more), but the Total Shares remain constant (excluding new deposits/withdrawals). This means the value of each share increases over time. The formula is (as we already saw in bad debt section):

$$
SharePrice = \frac{TotalAssets}{TotalShares}
$$

In `_accrueInterest()`, `market[id].totalSupplyAssets` is the numerator in above formula, it goes up while total shares stays the same, so share price goes up.

It is worth mentioning that `market[id].totalBorrowAssets` is also incremented because accrued interest becomes new debt. When interest accrues:

- **For Borrowers:** The interest is added to their debt load. If the total debt was 100 and 1 unit of interest accrues, the total debt is now 101. This is why `totalBorrowAssets` increases. When borrowers call `repay()`, they will have to repay the interest portion too and `totalBorrowAssets` gets decremented.
- **For Suppliers:** That same interest is revenue. It increases the total pool of assets backing the supply shares. This is why `totalSupplyAssets` is also incremented on the next line. When suppliers call `withdraw()`, they will receive the interest portion too and `totalSupplyAssets` gets decremented.

### Fee handling

```solidity
            uint256 feeShares;
            if (market[id].fee != 0) {
                uint256 feeAmount = interest.wMulDown(market[id].fee);
                // The fee amount is subtracted from the total supply in this calculation to compensate for the fact
                // that total supply is already increased by the full interest (including the fee amount).
                feeShares =
                    feeAmount.toSharesDown(market[id].totalSupplyAssets - feeAmount, market[id].totalSupplyShares);
                position[id][feeRecipient].supplyShares += feeShares;
                market[id].totalSupplyShares += feeShares.toUint128();
            }
```

If the fee feature is turned on, the user-level accounting for `feeRecipient` would be incremented by `feeShares`. This design avoids having another entry in struct `Position` for tracking fees; it reuses the share system so the fee is handled more elegantly.