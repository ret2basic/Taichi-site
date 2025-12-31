---
title: "Morpho Internals Part 3: Oracle"
slug: "morpho-internals-part-3-oracle"
excerpt: "A deep dive into Morpho's oracle surface area and MorphoChainlinkOracleV2: ERC4626 vault conversions, base/quote feed wiring, two-hop unit cancellation, and the 1e36 SCALE_FACTOR derivation."
author: "ret2basic.eth (reviewed by jesjupyter)"
date: "2025-12-31"
readTime: "30 min read"
category: "DeFi"
tags: ["Morpho", "Lending", "Source Code Walkthrough"]
featured: false
image: "/images/blog/Morpho.jpg"
---

Recall that there are two occurrences where `oracle.price()` gets invoked in Morpho.sol. The first occurrence is in `liquidate()`:

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

        {
            uint256 collateralPrice = IOracle(marketParams.oracle).price();

            require(!_isHealthy(marketParams, id, borrower, collateralPrice), ErrorsLib.HEALTHY_POSITION);
            ...
```

Note that fetching collateral price first and then calling the 4-parameter version of `_isHealthy()` is the same as calling the 3-parameter version of `_isHealthy()` directly:

```solidity
    function _isHealthy(MarketParams memory marketParams, Id id, address borrower) internal view returns (bool) {
        if (position[id][borrower].borrowShares == 0) return true;

        uint256 collateralPrice = IOracle(marketParams.oracle).price();

        return _isHealthy(marketParams, id, borrower, collateralPrice);
    }
```

`oracle.price()` is also invoked in `borrow()` and `withdrawCollateral()` implicitly since they call the 3-parameter version of `_isHealthy()`.

**In conclusion, the collateral price is fetched from the oracle whenever Morpho needs to determine if the position is still healthy. This is the only use case of the oracle.** This narrow integration surface is worth emphasizing: in Morpho, the oracle is not used for interest, accounting, or share math. It is only a read-only “relative price” that gets sampled at health-check boundaries.

## Factory and oracle.price()

Morpho provides a factory (MorphoChainlinkOracleV2Factory.sol) that allows users to deploy customized oracles themselves:

```solidity
    function createMorphoChainlinkOracleV2(
        IERC4626 baseVault,
        uint256 baseVaultConversionSample,
        AggregatorV3Interface baseFeed1,
        AggregatorV3Interface baseFeed2,
        uint256 baseTokenDecimals,
        IERC4626 quoteVault,
        uint256 quoteVaultConversionSample,
        AggregatorV3Interface quoteFeed1,
        AggregatorV3Interface quoteFeed2,
        uint256 quoteTokenDecimals,
        bytes32 salt
    ) external returns (IMorphoChainlinkOracleV2 oracle) {
        oracle = new MorphoChainlinkOracleV2{salt: salt}(
            baseVault,
            baseVaultConversionSample,
            baseFeed1,
            baseFeed2,
            baseTokenDecimals,
            quoteVault,
            quoteVaultConversionSample,
            quoteFeed1,
            quoteFeed2,
            quoteTokenDecimals
        );

        isMorphoChainlinkOracleV2[address(oracle)] = true;
    }
```

Into the oracle implementation, `price()` is the only function (besides constructor) in MorphoChainlinkOracleV2.sol:

```solidity
    function price() external view returns (uint256) {
        return SCALE_FACTOR.mulDiv(
            BASE_VAULT.getAssets(BASE_VAULT_CONVERSION_SAMPLE) * BASE_FEED_1.getPrice() * BASE_FEED_2.getPrice(),
            QUOTE_VAULT.getAssets(QUOTE_VAULT_CONVERSION_SAMPLE) * QUOTE_FEED_1.getPrice() * QUOTE_FEED_2.getPrice()
        );
    }
```

Despite the succinctness, this oracle design embeds enormous amount of info that is worth discussing, so don’t underestimate the complexity here.

Upon seeing this code, many question marks arise:

- Why does pricing involve vault?
- What is “base” and what is “quote”?
- Why there are 2 base feeds and 2 quote feeds? Why not 1? Why not 3 or more?
- What is `SCALE_FACTOR` and how does that work?

Let’s call these questions the “big 4” and answer them in order. This is the main quest of this article.

From a bird's-eye view, `price()` can be read as one ratio:

$$
\mathtt{price()}\;=\;\Big\lfloor\frac{\texttt{SCALE\_FACTOR}\cdot(\text{base leg})}{(\text{quote leg})}\Big\rfloor
$$

where:

- **base leg** = `BASE_VAULT.getAssets(sample) * BASE_FEED_1.getPrice() * BASE_FEED_2.getPrice()`
- **quote leg** = `QUOTE_VAULT.getAssets(sample) * QUOTE_FEED_1.getPrice() * QUOTE_FEED_2.getPrice()`

Everything else in the contract is just “wiring” those legs and precomputing `SCALE_FACTOR` so the output lands in Morpho’s expected format.

### A quick Chainlink refresher (what `getPrice()` actually returns)

Morpho’s Chainlink oracle does not talk to Chainlink feeds directly; it goes through `ChainlinkDataFeedLib`.

```solidity
library ChainlinkDataFeedLib {
    /// @dev Performs safety checks and returns the latest price of a `feed`.
    /// @dev When `feed` is the address zero, returns 1.
    /// @dev Notes on safety checks:
    /// - L2s are not supported.
    /// - Staleness is not checked because it's assumed that the Chainlink feed keeps its promises on this.
    /// - The price is not checked to be in the min/max bounds because it's assumed that the Chainlink feed keeps its
    /// promises on this.
    function getPrice(AggregatorV3Interface feed) internal view returns (uint256) {
        if (address(feed) == address(0)) return 1;

        (, int256 answer,,,) = feed.latestRoundData();
        require(answer >= 0, ErrorsLib.NEGATIVE_ANSWER);

        return uint256(answer);
    }

    /// @dev Returns the number of decimals of a `feed`.
    /// @dev When `feed` is the address zero, returns 0.
    function getDecimals(AggregatorV3Interface feed) internal view returns (uint256) {
        if (address(feed) == address(0)) return 0;

        return feed.decimals();
    }
}
```

Reading that library clarifies several behavioral details that are easy to miss:

- `feed.latestRoundData()` is called and only `answer` is used.
- Only `answer >= 0` is enforced. A zero answer is accepted and yields a zero price.
- Staleness (`updatedAt`) is ignored; the code assumes the feed is maintained according to Chainlink’s guarantees.
- When a feed address is `address(0)`, `getPrice()` returns 1 (a multiplicative no-op), and `getDecimals()` returns 0.

The “`address(0)` means 1” convention is the key that makes “0/1/2 feeds per leg” possible with a single code path.

## 0. What does `price()` return?

As per the [doc](https://docs.morpho.org/get-started/resources/contracts/oracles), Morpho expects `oracle.price()` to be:

![price_return_value.png](/images/blog/price_return_value.png)

This is exactly why Morpho stores it in a local variable named `collateralPrice`.

```solidity
// Morpho.sol
uint256 collateralPrice = IOracle(marketParams.oracle).price();
```

Morpho later consumes the oracle output by converting collateral → loan units using:

```solidity
// Morpho.sol
uint256 maxBorrow = collateral.mulDivDown(collateralPrice, ORACLE_PRICE_SCALE).wMulDown(lltv);
```

with `ORACLE_PRICE_SCALE = 1e36`. You can see the same conversion pattern in liquidation too:

```solidity
uint256 seizedAssetsQuoted = seizedAssets.mulDivUp(collateralPrice, ORACLE_PRICE_SCALE);
```

## 1. Why does pricing involve vault?

**Because Morpho can use ERC4626 vault shares as either collateral or loan token.**

Example: a collateral token might be an ERC4626 vault share token like [sDAI](https://etherscan.io/token/0x83f20f44975d03b1b09e64809b757c47f942beea#code), or a stablecoin yield vault share. In that case, the oracle must incorporate the conversion **shares → underlying assets**, because the external price feeds are usually expressed in terms of the underlying asset, not in “shares”.

![convertToAssets.png](/images/blog/convertToAssets.png)

That is exactly what `VaultLib.getAssets` does:

```solidity
library VaultLib {
    /// @dev Converts `shares` into the corresponding assets on the `vault`.
    /// @dev When `vault` is the address zero, returns 1.
    function getAssets(IERC4626 vault, uint256 shares) internal view returns (uint256) {
        if (address(vault) == address(0)) return 1;

        return vault.convertToAssets(shares);
    }
}
```

So the following code:

```solidity
BASE_VAULT.getAssets(BASE_VAULT_CONVERSION_SAMPLE)
```

means “how many underlying base-assets correspond to `BASE_VAULT_CONVERSION_SAMPLE` shares?”.

Here `BASE_VAULT_CONVERSION_SAMPLE` is typically just 1e18 as shown in the test case in MorphoChainlinkOracleV2FactoryTest.sol:

```solidity
        IMorphoChainlinkOracleV2 oracle = factory.createMorphoChainlinkOracleV2(
            sDaiVault, 1e18, daiEthFeed, feedZero, 18, vaultZero, 1, usdcEthFeed, feedZero, 6, salt
        );
```

Same for the quote side. When there is no vault, the factor is 1 and disappears.

## 2. What is “base” and what is “quote”?

The terminology base and quote come from traditional finance, see [here](https://corporatefinanceinstitute.com/resources/foreign-exchange/currency-pair/) for reference. Consider the following example:

> It is 2025, and Johnny plans to go to New York for vacation. He resides in Canada and only carries Canadian dollars. Thus, he goes to the currency exchange store and wishes to exchange his CAD to USD. The store clerk states that the quote is USD/CAD = 1.3. It means that $1 USD is equivalent to $1.3 CAD.
> 

In the currency pair USD/CAD, USD is the base currency and CAD is the quote currency. The same idea applies to the oracle, but in the oracle each `BASE_FEED` or `QUOTE_FEED` itself is a “currency pair”, say `BASE_FEED_1` = USDC/ETH, so you can think of `BASE_FEED / QUOTE_FEED` as “the pair of currency pairs”.

Back to the oracle’s context, if we denote:

- the collateral token denomination by $B_1$ (an asset/unit),
- the loan token denomination by $Q_1$ (an asset/unit),

then throughout this article we’ll use the following formula as the oracle’s pricing convention:

$$
\mathtt{price()} = 10^{36} \cdot \frac{pB_1 \cdot pB_2}{pQ_1 \cdot pQ_2}
$$

where $pB_1$, $pB_2$, $pQ_1$, and $pQ_2$ (written as `pB1`, `pB2`, `pQ1`, `pQ2` in the Solidity comment) are defined as follows:

```solidity
    // Let B1, B2, Q1, Q2, C be 5 assets, each respectively having dB1, dB2, dQ1, dQ2, dC decimals.
    // Let pB1 and pB2 be the base prices, and pQ1 and pQ2 the quote prices, so that:
    // - pB1 is the quantity of 1e(dB2) assets B2 that can be exchanged for 1e(dB1) assets B1.
    // - pB2 is the quantity of 1e(dC) assets C that can be exchanged for 1e(dB2) assets B2.
    // - pQ1 is the quantity of 1e(dQ2) assets Q2 that can be exchanged for 1e(dQ1) assets Q1.
    // - pQ2 is the quantity of 1e(dC) assets C that can be exchanged for 1e(dQ2) assets Q2.
```

### Unit cancellation intuition

For example:

- Base side: LINK/ETH and ETH/USD
- Quote side: DAI/USD

Then:

$$
\frac{(\text{LINK}/\text{ETH})\cdot(\text{ETH}/\text{USD})}{(\text{DAI}/\text{USD})}
= \frac{\text{LINK}/\text{USD}}{\text{DAI}/\text{USD}}
= \frac{\text{LINK}}{\text{DAI}}
$$

In this case one of the `QUOTE_FEED` is left as `address(0)` intentionally.

### Quick wiring recipes

Below are a few minimal patterns you’ll see in real deployments. Any unset feed/vault is `address(0)`, which behaves like multiplying by 1.

1. **Collateral priced directly in loan**
    - Wire the direct pair as the base feed, leave the quote feeds empty.
    - Example (collateral = wstETH, loan = WETH):
        - `BASE_FEED_1 = wstETH/WETH`, `BASE_FEED_2 = address(0)`
        - `QUOTE_FEED_1 = QUOTE_FEED_2 = address(0)`
2. **Token/USDC from Token/ETH and ETH/USD**
    - Base side turns Token into USD, quote side turns USDC into USD.
    - Example (collateral = Token, loan = USDC):
        - `BASE_FEED_1 = Token/ETH`, `BASE_FEED_2 = ETH/USD`
        - `QUOTE_FEED_1 = USDC/USD`, `QUOTE_FEED_2 = address(0)`
    - Unit check:
        
        $$
        \frac{(\text{Token}/\text{ETH})\cdot(\text{ETH}/\text{USD})}{(\text{USDC}/\text{USD})} = \frac{\text{Token}}{\text{USDC}}
        $$
        
3. **Add a shares→assets factor**
    - If collateral is vault shares, set `BASE_VAULT` and choose `BASE_VAULT_CONVERSION_SAMPLE` (often 1e18 shares).
    - If loan token is vault shares, set `QUOTE_VAULT` and choose `QUOTE_VAULT_CONVERSION_SAMPLE`.
    - Keep the Chainlink feeds describing the underlying asset pricing path.

### Inverting a feed

The oracle never computes a reciprocal like `1eX / price`. It only ever does:

$$
\text{price} \propto \frac{(\text{base leg})}{(\text{quote leg})}
$$

So the way you achieve an inversion is by putting a feed on the other side of the fraction.

**Example:** you have a `USDC/USD` feed, but you need `USD/USDC`. You can get it by setting the feed as quote feed instead of base feed:

$$
\frac{1}{\text{USDC/USD}} = \text{USD/USDC}
$$

## 3. Why there are 2 base feeds and 2 quote feeds? Why not 1? Why not 3 or more?

Two feeds is the practical sweet spot.

### Why not just one feed?

Sometimes there is no direct feed for the price you want.

Typical examples:

- You have Token/ETH and ETH/USD, but not Token/USD.
- You want a cross rate like Token1/Token2 (via USD).
- You need a wrapper step like Wrapped/Underlying and Underlying/USD.

Two feeds let you chain:

$$
(A/B)\cdot(B/C) = (A/C)
$$

### Why not allow 3+ feeds?

It’s a deliberate complexity limit:

- More feeds means more gas and more failure modes.
- More multiplications increase overflow risk (the contract explicitly assumes the pre-division products fit in 256 bits).
- In practice, “direct” or “via USD/ETH” covers most markets.

## 4. What is `SCALE_FACTOR` and how does that work?

`SCALE_FACTOR` is a precomputed constant that makes the returned integer have the right meaning and scaling.

At runtime, the oracle multiplies:

- vault conversions (in token smallest units), and
- Chainlink feed answers (which are integers scaled by the feed’s `decimals()`),

then divides base by quote.

But Morpho expects the oracle output (quoted in loan token $Q_1$ per collateral token $B_1$) to be scaled by $10^{36}$.

The constructor comment in `MorphoChainlinkOracleV2.sol` does the derivation in the general 2-hop case. Using the exact same symbols:

- Assets: $B_1, B_2, Q_1, Q_2, C$ with decimals $d_{B1}, d_{B2}, d_{Q1}, d_{Q2}, d_C$.
- Base prices: $pB1, pB2$.
- Quote prices: $pQ1, pQ2$.

First, convert each hop into “per-1-asset” form by applying decimal shifts, then multiply along each path. Morpho’s target is:

$$
\mathtt{price()}
= 10^{36}\cdot
\frac{(pB1\cdot 10^{d_{B2}-d_{B1}})\cdot(pB2\cdot 10^{d_C-d_{B2}})}{(pQ1\cdot 10^{d_{Q2}-d_{Q1}})\cdot(pQ2\cdot 10^{d_C-d_{Q2}})}
$$

Then simplify the exponent terms (this is exactly the step shown in the Solidity comment):

$$
\mathtt{price()}
= 10^{36}\cdot \frac{pB1\cdot 10^{-d_{B1}}\cdot pB2}{pQ1\cdot 10^{-d_{Q1}}\cdot pQ2}
$$

Now connect that target to what the contract computes at runtime.

Let $fp_{B1}, fp_{B2}, fp_{Q1}, fp_{Q2}$ be the feed precisions (i.e. `feed.decimals()`), so the feeds return:

$$
\text{feed values} = pB1\cdot 10^{fp_{B1}},\; pB2\cdot 10^{fp_{B2}},\; pQ1\cdot 10^{fp_{Q1}},\; pQ2\cdot 10^{fp_{Q2}}
$$

Ignoring vaults for one line, the runtime structure is:

$$
\mathtt{price()}
= \frac{(pB1\cdot 10^{fp_{B1}})\cdot(pB2\cdot 10^{fp_{B2}})\cdot \mathtt{SCALE\_FACTOR}}{(pQ1\cdot 10^{fp{Q1}})\cdot(pQ2\cdot 10^{fp_{Q2}})}
$$

So `SCALE_FACTOR` is chosen such that this equals the target $10^{36}\cdot \frac{pB1\cdot 10^{-d_{B1}}\cdot pB2}{pQ1\cdot 10^{-d_{Q1}}\cdot pQ2}$.

Solving for it (again, exactly matching the Solidity comment) gives:

$$
\mathtt{SCALE\_FACTOR}
= 10^{36}\cdot 10^{-d{B1}}\cdot 10^{d_{Q1}}\cdot 10^{-fp_{B1}}\cdot 10^{-fp_{B2}}\cdot 10^{fp_{Q1}}\cdot 10^{fp_{Q2}}
$$

Finally, incorporate the vault conversion samples.

Because the runtime multiplies by `QUOTE_VAULT_CONVERSION_SAMPLE`-scaled conversions and divides by `BASE_VAULT_CONVERSION_SAMPLE`-scaled conversions, `SCALE_FACTOR` includes the ratio:

$$
\frac{s_Q}{s_B} = \frac{\texttt{QUOTE\_VAULT\_CONVERSION\_SAMPLE}}{\texttt{BASE\_VAULT\_CONVERSION\_SAMPLE}}
$$

Putting everything together yields the compact exponent form used in the article and reflected in code:

$$
\mathtt{SCALE\_FACTOR}
= 10^{\;36 + d{Q1} + fp_{Q1} + fp_{Q2} - d_{B1} - fp_{B1} - fp_{B2}} \cdot \frac{s_Q}{s_B} 
$$

And the code implements exactly that:

```solidity
SCALE_FACTOR = 10 ** (
    36
    + quoteTokenDecimals
    + quoteFeed1.getDecimals()
    + quoteFeed2.getDecimals()
    - baseTokenDecimals
    - baseFeed1.getDecimals()
    - baseFeed2.getDecimals()
) * quoteVaultConversionSample / baseVaultConversionSample;
```

## An end-to-end example: wstETH collateral, USDC loan

In this example we configure the oracle so that it returns wstETH price (as collateral token) quoted in USDC (as loan token). Then Morpho converts collateral to loan units as:

$$
\text{loanAmount} = \Big\lfloor \frac{\text{collateralAmount}\cdot \texttt{price()}}{10^{36}} \Big\rfloor
$$

### **Step 1 — Choose feeds so units cancel to USDC/wstETH**

Pick a common unit $C = \text{USD}$.

- Base leg (collateral side):
    - `BASE_FEED_1 = wstETH/ETH` (how many ETH per wstETH)
    - `BASE_FEED_2 = ETH/USD` (how many USD per ETH)
    - Base leg: $(\text{wstETH}/\text{ETH})\cdot(\text{ETH}/\text{USD}) = \text{wstETH}/\text{USD}$
- Quote leg (loan side):
    - `QUOTE_FEED_1 = USDC/USD` (how many USD per USDC)
    - `QUOTE_FEED_2 = address(0)` (no-op)
    - Quote leg: $(\text{USDC}/\text{USD})$

Now divide base by quote:

$$
\frac{\text{wstETH}/\text{USD}}{\text{USDC}/\text{USD}} = \text{wstETH}/\text{USDC}
$$

Assume no vault shares here, then:

- `BASE_VAULT = QUOTE_VAULT = address(0)`
- `BASE_VAULT_CONVERSION_SAMPLE = QUOTE_VAULT_CONVERSION_SAMPLE = 1`

### **Step 2 — Plug in decimals**

- Token decimals:
    - `baseTokenDecimals = 18` (wstETH)
    - `quoteTokenDecimals = 6` (USDC)
- Feed decimals (typical values; always read them from the feed):
    - `wstETH/ETH`: 18
    - `ETH/USD`: 8
    - `USDC/USD`: 8
    - any `address(0)` feed has 0 decimals by definition (`getDecimals` returns 0)

So the constructor exponent becomes:

$$
36 + 6 + 8 + 0 - 18 - 18 - 8 = 6
$$

Therefore `SCALE_FACTOR = 10^6` (since vault samples are both 1).

### **Step 3 — Do a numeric sanity check**

Suppose the market is roughly:

- $1\ \text{wstETH} \approx 1.03\ \text{ETH}$
- $1\ \text{ETH} \approx 3000\ \text{USD}$
- $1\ \text{USDC} \approx 1\ \text{USD}$

In feed terms (i.e., scaled by feed decimals), that’s roughly:

- `wstETH/ETH.getPrice() \\approx 1.03 * 10^18`
- `ETH/USD.getPrice() \\approx 3000 * 10^8`
- `USDC/USD.getPrice() \\approx 1 * 10^8`

Then the oracle’s runtime computation is:

$$
\texttt{price()} = \Big\lfloor 10^6\cdot \frac{(1.03\cdot 10^{18})\cdot(3000\cdot 10^{8})}{(1\cdot 10^{8})} \Big\rfloor
= 3090\cdot 10^{24}
$$

Now validate the Morpho-side conversion on exactly 1 wstETH (which is $10^{18}$ smallest units):

$$
\Big\lfloor \frac{10^{18}\cdot (3090\cdot 10^{24})}{10^{36}} \Big\rfloor = 3090\cdot 10^{6}
$$

That equals 3090 USDC in USDC smallest units ($10^6$), which matches the intuitive spot price.
