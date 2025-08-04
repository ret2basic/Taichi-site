---
title: "How Uniswap V3 handles liquidity better than V2"
slug: "understanding-liquidity-uniswap-v2-v3"
excerpt: "A deep dive into the mathematical principles behind liquidity provision in Uniswap V2 and V3, exploring how concentrated liquidity revolutionizes capital efficiency while maintaining protocol consistency."
author: "jesjupyter, ret2basic.eth"
date: "2025-08-05"
readTime: "30 min read"
category: "DeFi"
tags: ["Uniswap", "DeFi", "Liquidity", "AMM", "Smart Contracts", "Mathematics"]
featured: true
image: "/images/blog/uniswap-liquidity.jpg"
---

Everyone knows Uniswap V3 introduced concentrated liquidity mechanism to increase the efficiency of liquidity. In Uniswap V2, you provide liquidity against the entire curve, but only the middle part of the curve is utilized. In Uniswap V3, you provide liquidity to "commonly-visited buckets" as you wish, so the efficiency of liquidity is increased. For a visual approach you can read ["How Concentrated Liquidity in Uniswap V3 Works"](https://rareskills.io/post/uniswap-v3-concentrated-liquidity) by RareSkills.

This article takes a fundamentally different approach from typical Uniswap explanations. While most treatments focus on the surface-level benefits—"V2 has poor capital efficiency" and "V3 enables concentrated liquidity"—we dig into the engineering fundamentals that make these systems work or fail. The core insight is that traditional articles assume liquidity composability as a given, treating it as a natural property of AMMs. But this assumption actually breaks down in V2 due to two critical engineering problems: liquidity tracking inaccuracy (where $$totalSupply \neq \sqrt{k}$$) and liquidity composition failure (where price deviations create mathematical inconsistencies when combining positions).

From this engineering perspective, V3's innovations become much clearer. Rather than just "improving capital efficiency," V3 fundamentally solves the hidden assumption problem that other analyses take for granted. Through virtual liquidity and enforced price alignment, V3 creates the mathematical conditions necessary for liquidity to be truly composable—something that V2 only achieves under very specific circumstances. This article first proves why the liquidity composability assumption fails in V2, then demonstrates how V3's design choices specifically address these foundational issues to make the assumption valid again. It's essentially a proof of the hidden assumptions that underpin all modern AMM design.

## Core Principles

In a Uniswap pair (regardless V2 or V3), everyone can add liquidity with a few rules enforced:

- **Consistency**: Liquidity calculation should be the same for all participants for fairness
- **Non-harmful**: Providing liquidity should not negatively affect existing liquidity providers
- **Trackable**: Liquidity should be accurately trackable in the accounting system and expressible through state variables

## Uniswap V2

### Overview

In Uniswap V2, liquidity is represented by ERC20 LP tokens. Providing liquidity means you transfer two tokens (token0, token1) in the same ratio as in the pool, then within the same tx you mint LP tokens. The core logic lies in the `mint` function of the `UniswapV2Pair` contract:

```solidity
function mint(address to) external lock returns (uint liquidity) {
    (uint112 _reserve0, uint112 _reserve1,) = getReserves();
    uint balance0 = IERC20(token0).balanceOf(address(this));
    uint balance1 = IERC20(token1).balanceOf(address(this));
    uint amount0 = balance0.sub(_reserve0);
    uint amount1 = balance1.sub(_reserve1);

    bool feeOn = _mintFee(_reserve0, _reserve1);
    uint _totalSupply = totalSupply;
    
    if (_totalSupply == 0) {
        liquidity = Math.sqrt(amount0.mul(amount1)).sub(MINIMUM_LIQUIDITY);
        _mint(address(0), MINIMUM_LIQUIDITY);
    } else {
        liquidity = Math.min(
            amount0.mul(_totalSupply) / _reserve0, 
            amount1.mul(_totalSupply) / _reserve1
        );
    }
    
    require(liquidity > 0, 'UniswapV2: INSUFFICIENT_LIQUIDITY_MINTED');
    _mint(to, liquidity);
    _update(balance0, balance1, _reserve0, _reserve1);
    
    if (feeOn) kLast = uint(reserve0).mul(reserve1);
    emit Mint(msg.sender, amount0, amount1);
}
```

### Liquidity Calculation

At pool initialization, liquidity is computed as:

$$
\text{liquidity} \approx \sqrt{\text{amount0} \times \text{amount1}} - \text{MINIMUM\_LIQUIDITY}
$$

This is essentially proportional to $$\sqrt{k}$$, where $$k = x \times y$$ is the constant product, with $$x = \text{amount0}$$ and $$y = \text{amount1}$$.

**Key Insight**: If someone provides $$x$$ token0 and $$y$$ token1, we can say they are providing liquidity $$\sqrt{x \cdot y}$$.

### The LP Token Supply Problem

**Question**: Can we expect the total LP token supply to always equal $$\sqrt{k}$$ (the total "idealized" liquidity)?

**Answer**: No, and this reveals a fundamental design challenge.

#### The Theoretical Problem

**If we naively calculated everyone's liquidity as $$\sqrt{x \cdot y}$$ and simply added them up, we would face a mathematical inconsistency.**

Suppose the current total liquidity (in idealized terms) is $$K_0 = \sqrt{x_0 y_0}$$. When someone adds new liquidity ($$K_1 = \sqrt{x_1 y_1}$$), for the total supply to equal $$K_0 + K_1$$, we would need:

$$
(x_0 + x_1)(y_0 + y_1) = (K_0 + K_1)^2
$$

$$
\Rightarrow x_0 y_1 + x_1 y_0 = 2K_0 K_1 = 2\sqrt{x_0 x_1 y_0 y_1}
$$

This only holds if:
$$
x_0 y_1 = x_1 y_0
$$

which means the new liquidity is provided **at the same price** ($$x_0 / y_0 = x_1 / y_1$$).

#### Why This Matters

This reveals two critical issues that any liquidity protocol must solve:

1. **Non-harmful Principle**: A new provider's action should not negatively affect existing LPs
2. **Trackable Principle**: The protocol should maintain accurate state tracking

Let's examine what happens when these principles are violated:

**Example**: Alice deposits 10 token0 + 10 token1 at price 1.0, then Bob deposits 10 token0 + 40 token1 at price 4.0.

**Consequences**:
1. The price moves from 1.0 to 2.5
2. 1 LP token now corresponds to ≈0.67 token0 and 1.67 token1
3. **Alice effectively loses token0 exposure due to Bob's action**
4. Total LP supply = 30, but $$\sqrt{x_{\text{total}} \times y_{\text{total}}} \approx \sqrt{20 \times 50} \neq 30$$ → deviation occurs

This demonstrates why a naive approach fails both principles:
- Alice loses token0 exposure (violates Non-harmful Principle)
- totalSupply = 30 but $$\sqrt{x_{\text{total}} \times y_{\text{total}}} \neq 30$$ (violates Trackable Principle)

#### Case 2: With Uniswap V2's Protection Mechanism

Uniswap V2 solves the Non-harmful Principle by adjusting Bob's minted liquidity to align with the current pool price:

```solidity
liquidity = Math.min(
    amount0.mul(_totalSupply) / _reserve0, 
    amount1.mul(_totalSupply) / _reserve1
);
```

**Revisiting the example**:

- Alice deposits (10 token0, 10 token1), she gets 10 LP tokens
- Now `_totalSupply = 10`, `_reserve0 = 10`, `_reserve1 = 10`
- Bob deposits (10 token0, 40 token1). The LP tokens minetd is capped at `min(10 * 10 / 10, 40 * 10 / 10) = min(10, 40) = 10 LP tokens` (`amount0 = 10`, `amount1 = 40`)

**Consequences now**:

- Price moves from 1.0 to 2.5 (old price is `price = reserve1 / reserve0 = 10 / 10 = 1.0`, new price is `price = reserve1 / reserve0 = 50 / 20 = 2.5`)
- 1 LP token represents (1 token0, 2.5 token1), therefore Alice actually benefits from Bob's action since her 1 LP token was supposed to represent (1 token0, 1 token1).
- For Bob, he holds 10 LP tokens which represent (10 token0, 25 token1), so he lost 15 token1 comparing to his portfolio before providing liquidity
- Total LP supply = 20, but $$\sqrt{20 \times 50} \approx 31.622 \neq 20$$, deviation remains

For Bob, the shrink of his portfolio is a "penalty" for providing liquidity in a wrong ratio.

**Conclusion**: Uniswap V2 successfully addresses the Non-harmful Principle but still violates the Trackable Principle:

- ✅ **Non-harmful**: Bob's action no longer harms Alice (Bob pays a "penalty" for price deviation)
- ❌ **Trackable**: `totalSupply = 20` but $$\sqrt{20 \times 50} \neq 20$$ - the state variable cannot accurately track actual liquidity

This fundamental limitation motivates the change for a better solution in V3.

### Router-Level Price Alignment

The `router` contract makes an effort to mitigate this issue. In `UniswapV2Router02`, the `_addLiquidity` function attempts to adjust provided amounts to match the pool's current price ratio:

```solidity
if (reserveA == 0 && reserveB == 0) {
    (amountA, amountB) = (amountADesired, amountBDesired);
} else {
    uint amountBOptimal = UniswapV2Library.quote(amountADesired, reserveA, reserveB);
    if (amountBOptimal <= amountBDesired) {
        require(amountBOptimal >= amountBMin, 'UniswapV2Router: INSUFFICIENT_B_AMOUNT');
        (amountA, amountB) = (amountADesired, amountBOptimal);
    } else {
        uint amountAOptimal = UniswapV2Library.quote(amountBDesired, reserveB, reserveA);
        assert(amountAOptimal <= amountADesired);
        require(amountAOptimal >= amountAMin, 'UniswapV2Router: INSUFFICIENT_A_AMOUNT');
        (amountA, amountB) = (amountAOptimal, amountBDesired);
    }
}
```

**Logic**:
- If the pool is empty, desired amounts are used directly
- Otherwise, the router calculates the optimal counterpart amount based on current reserves/price
- If the user's desired ratio deviates from the current price, the router automatically adjusts amounts to align with the pool's price

### Swap Mechanics

Since we cannot accurately track liquidity through `totalSupply` (it does not correspond to actual liquidity $$\sqrt{k}$$), **it cannot be used in swap calculations**. Instead, swap validation strictly relies on pool reserves and the constant product formula.

Every swap is validated by ensuring the product of reserves does not decrease after accounting for fees:

```solidity
uint amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
uint amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
require(amount0In > 0 || amount1In > 0, 'UniswapV2: INSUFFICIENT_INPUT_AMOUNT');

uint balance0Adjusted = balance0.mul(1000).sub(amount0In.mul(3));
uint balance1Adjusted = balance1.mul(1000).sub(amount1In.mul(3));
require(
    balance0Adjusted.mul(balance1Adjusted) >= uint(_reserve0).mul(_reserve1).mul(1000**2), 
    'UniswapV2: K'
);
```

The protocol enforces:
$$
x' \times y' \geq x \times y
$$

The helper library derives swap amounts directly from current reserves:

```solidity
function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {
    require(amountIn > 0, 'UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT');
    require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
    
    uint amountInWithFee = amountIn.mul(997);
    uint numerator = amountInWithFee.mul(reserveOut);
    uint denominator = reserveIn.mul(1000).add(amountInWithFee);
    amountOut = numerator / denominator;
}
```

Again, this formula is derived directly from the constant product invariant and does not rely on LP token supply.

## Uniswap V3: Concentrated Liquidity

### Motivation

Uniswap V2 suffers from two main issues:

1. **Poor capital efficiency**: Liquidity is spread across the entire price range $$(0, \infty)$$, even though most of it is never used
2. **Trackable Principle violation**: The `totalSupply` cannot accurately track actual liquidity state

**Solution**: Uniswap V3 introduces **concentrated liquidity**, which:
- Allows LPs to allocate capital to specific price ranges (improving capital efficiency)
- Maintains accurate state tracking through the `liquidity` variable (solving the Trackable Principle)

### Key Questions

1. **How is liquidity calculated when adding liquidity to a specific price range?**
2. **How can different LPs add liquidity without affecting each other's positions?**
3. **How is the constant product (k) determined for a given price range?**
4. **How do swaps work under this new model?**

### What Does "Providing Liquidity Over a Range" Mean?

**Question**: What does it mean to provide liquidity over a range $$(p_0, p_1)$$?

**Answer**: When we say **Alice is providing 10 units of liquidity from price 10 to 100**, we mean she is allocating liquidity to a segment of the constant product curve $$X \cdot Y = L^2$$, but only **within the price range [10, 100]**.

This liquidity behaves as if she were supporting a virtual pool that maintains $$X \cdot Y = L^2 = 100$$ (since $$10^2 = 100$$), but only for trades where the price lies in the interval [10, 100]. Outside of this range, the liquidity is effectively **zero**—meaning she is not providing any capital for trades at those prices.

**Under this model**:
- At **price = 10**, Alice holds her liquidity entirely in **token0**
- As the price increases toward 100, her **token0** is gradually swapped into **token1**
- At **price = 100**, Alice holds only **token1**

So, her position behaves as a **customized liquidity band**, with a deterministic conversion between token0 and token1 across the range, mirroring the shape of the **Uniswap V3-style concentrated liquidity** curve. The key idea is that her liquidity contributes to the pool only within $$[p_0, p_1]$$, and follows the curve $$X \cdot Y = L^2$$ in that band.

**Virtual Liquidity/reserves: The Key Innovation**

In reality, the token0 and token1 Alice provided is **not** the full amount required to maintain the constant product curve across the entire price range, but only the amount required to maintain the curve within the price range [10, 100]. 

The missing liquidity outside this range is provided by **virtual liquidity** - liquidity that exists mathematically but is not backed by actual tokens. This virtual liquidity makes concentrated liquidity possible:

**Mathematical Representation**:
$$
(x_{\text{virtual}} + x_{\text{real}}) \times (y_{\text{virtual}} + y_{\text{real}}) = L^2
$$

Where:
- $$x_{\text{real}}, y_{\text{real}}$$: The actual tokens provided by Alice
- $$x_{\text{virtual}}, y_{\text{virtual}}$$: Virtual reserves that maintain the constant product curve

- **Inside the range [10, 100]**: Alice's real tokens provide actual liquidity
- **Outside the range**: Virtual liquidity maintains the constant product curve without requiring additional capital, but it will never be used.    

This is why V3 can achieve much higher capital efficiency - LPs only need to provide tokens for the price range they expect to be active, while the protocol handles the rest through virtual liquidity.


### Liquidity Calculation Method

In Uniswap V2, liquidity is simplified as:
$$
L = \sqrt{x \times y}
$$

This works because liquidity in V2 is provided **across the entire price range** $$(0, \infty)$$. However, in Uniswap V3, liquidity is concentrated within a specific price interval $$[p_0, p_1]$$.

#### General Liquidity Definition

Assume the constant product curve:
$$
X \times Y = L^2
$$

But liquidity is provided only within $$[p_0, p_1]$$, where:
- $$p = Y / X$$ (price of token0 in terms of token1, Y and X are the total reserves of token0 and token1, containing the virtual liquidity)
- $$L$$ is constant within this range and zero elsewhere

When providing $$\Delta x$$ token0 within the range $$[p_0, p_1]$$, we can express it in terms of liquidity $$L$$:

**Key Insight**: For the curve $$X \times Y = L^2$$, the difference in token0 amounts between two price points equals the token0 liquidity we want to add.

$$
X(p_{\text{start}}) - X(p_1) = \Delta x
$$

Since on the curve $$X \times Y = L^2$$, we have:
$$
X(p) = \frac{L}{\sqrt{p}}
$$

Therefore:
$$
\frac{L}{\sqrt{p_{\text{start}}}} - \frac{L}{\sqrt{p_1}} = \Delta x
$$

And thus:
$$
L_x = \frac{\Delta x}{\frac{1}{\sqrt{p_{\text{start}}}} - \frac{1}{\sqrt{p_1}}}
$$

Here, $$p_{\text{start}}$$ is:
- $$p_0$$, if the current price is below the lower bound $$p_0$$
- the current price $$p_{\text{current}} = Y/X$$, otherwise, note here Y,X are different from the liquidity we are providing, they are the total reserves of token0 and token1, containing the virtual liquidity.

Similarly, for $$\Delta y$$ token1:

**Key Insight**: The difference in token1 amounts between two price points equals the token1 liquidity we want to add.
$$
Y(p_{\text{start}}) - Y(p_0) = \Delta y
$$

Since:
$$
Y(p) = L \times \sqrt{p}
$$

We have:
$$
L \times \sqrt{p_{\text{start}}} - L \times \sqrt{p_0} = \Delta y
$$

And:
$$
L_y = \frac{\Delta y}{\sqrt{p_{\text{start}}} - \sqrt{p_0}}
$$

#### V2 as a Special Case

In Uniswap V2, liquidity is provided over the entire range, so there is no virtual liquidity, hence:
$$
p_0 = 0, \quad p_1 = \infty, \quad p_{\text{start}} = p_{\text{current}} = \frac{Y}{X} = \frac{\Delta y}{\Delta x}
$$

Substituting into the formulas:
$$
L_x = \frac{\Delta x}{\frac{1}{\sqrt{p_{\text{start}}}} - 0} = \Delta x \times \sqrt{p_{\text{start}}} = \sqrt{\Delta x \times \Delta y}
$$

And:
$$
L_y = \frac{\Delta y}{\sqrt{p_{\text{start}}} - 0} = \frac{\Delta y}{\sqrt{\Delta y/\Delta x}} = \sqrt{\Delta x \times \Delta y}
$$

Thus, V2 can be viewed as a special case of V3 where liquidity spans the full price range.

#### Why Calculate Both L_x and L_y?

We compute liquidity from both $$\Delta x$$ and $$\Delta y$$ to ensure consistency:
- Given $$(\Delta x, p_1)$$ (and possibly $$p_0$$), we calculate $$L_x$$
- Given $$(\Delta y, p_0)$$ (and possibly $$p_1$$), we calculate $$L_y$$

Both must match; otherwise, the provided token amounts are inconsistent with the selected price range.

**Key Concept: Bilateral Liquidity**

$$L_x$$ and $$L_y$$ represent **bilateral liquidity** - the liquidity calculated from token0 and token1 perspectives respectively. For a valid liquidity position:

$$
L_x = L_y = L
$$

This bilateral approach ensures that:
1. **Consistency**: Both token perspectives yield the same liquidity value
2. **Completeness**: The position is properly defined for both tokens
3. **Validation**: We can verify that the provided token amounts are consistent with the selected price range

If $$L_x \neq L_y$$, it means the provided token amounts don't match the expected ratio for the given price range.

### Core Mechanism: Same Price Level Addition

Let’s revisit the remaining questions:
> 2. **How can different LPs add liquidity without affecting each other’s positions?**
> 3. **How is the constant product (k) determined for a given price range?**
> 4. **How do swaps work under this new model?**


The remaining three questions can all be answered by a single key principle:

**For a given price range $$(p_0, p_1)$$, if every LP provides liquidity at the same price level within that range, then:**

1. **Liquidity positions remain independent** — one LP's action does not affect another LP's position
2. **The constant product `k` can be consistently defined** for that price range
3. **Swaps follow the same constant-product logic as in V2**, but restricted to the selected price range

### Price Level Enforcement

**Uniswap V3 ensures that all liquidity for a given price range is added at the same price level** — specifically, the price at which the liquidity becomes active.

When an LP adds liquidity in a range $$(p_0, p_1)$$ while the current market price $$p$$ is known, there are three cases:

#### Case 1: $$p < p_0$$
The price is currently below the range. The liquidity will only become active once the price **rises into** the range.

- Liquidity is priced **as if added at** $$p_0$$
- The LP supplies only **token0** as we discussed in the previous section that alice is providing liquidity from price 10 to 100, so at price 10, the position only holds token0.

#### Case 2: $$p_0 \leq p \leq p_1$$
The price is currently inside the range. Liquidity is added **at the current price**.

- The LP supplies **token0 and token1**, based on the distance to each bound
- This differs from V2, since the price is forced to be the current price

#### Case 3: $$p > p_1$$
The price is currently above the range. The liquidity becomes active only if the price **drops into** the range.

- Liquidity is priced **as if added at** $$p_1$$
- The LP supplies only **token1** as we discussed in the previous section that alice is providing liquidity from price 10 to 100, so at price 100, the position only holds token1.

In **cases 1 and 3**, although the liquidity is not immediately active, it is **pre-priced** using the boundary price — so when it does become active, it behaves exactly as if it was added at the price where activation occurs.

This mechanism ensures:
- **All LPs in the same price range are evaluated using the same entry price**
- **Liquidity math is deterministic and composable across LPs**
- **Swaps operate consistently**, since virtual reserves are derived from shared liquidity at each active price

### Implementation in Smart Contracts

This behavior is enforced in the `UniswapV3Pool` contract during liquidity updates:

```solidity
if (params.liquidityDelta != 0) {
    if (_slot0.tick < params.tickLower) {
        // Current tick is below the passed range
        amount0 = SqrtPriceMath.getAmount0Delta(
            TickMath.getSqrtRatioAtTick(params.tickLower),
            TickMath.getSqrtRatioAtTick(params.tickUpper),
            params.liquidityDelta
        );
    } else if (_slot0.tick < params.tickUpper) {
        // Current tick is inside the passed range
        uint128 liquidityBefore = liquidity;
        
        amount0 = SqrtPriceMath.getAmount0Delta(
            _slot0.sqrtPriceX96,
            TickMath.getSqrtRatioAtTick(params.tickUpper),
            params.liquidityDelta
        );
        amount1 = SqrtPriceMath.getAmount1Delta(
            TickMath.getSqrtRatioAtTick(params.tickLower),
            _slot0.sqrtPriceX96,
            params.liquidityDelta
        );
        
        liquidity = LiquidityMath.addDelta(liquidityBefore, params.liquidityDelta);
    } else {
        // Current tick is above the passed range
        amount1 = SqrtPriceMath.getAmount1Delta(
            TickMath.getSqrtRatioAtTick(params.tickLower),
            TickMath.getSqrtRatioAtTick(params.tickUpper),
            params.liquidityDelta
        );
    }
}
```

### Liquidity Position Independence

When the price is the same, the core liquidity invariant holds:
$$
(x_0 + x_1)(y_0 + y_1) = (K_0 + k_1)^2
$$

This ensures that liquidity positions are composable — meaning **Alice and Bob's liquidity contributions can be aggregated without interfering with each other**.

### Dynamic Liquidity Management

In Uniswap V3, liquidity is concentrated within custom price ranges. The **total active liquidity at any moment** depends on how much liquidity is currently "in range."

To efficiently compute this, V3 uses a **bidirectional prefix sum structure** based on ticks (discrete price intervals).

The core variable tracking **active liquidity** is:
```solidity
uint128 public override liquidity;
```

This liquidity value represents the **current active liquidity** (i.e., $$\sqrt{k}$$) for the current price range.

### Tick-Based Liquidity Tracking

When an LP adds or removes liquidity over a range $$(p_0, p_1)$$, Uniswap records how liquidity **should change** when the price crosses either boundary of the range ($$p_0$$ or $$p_1$$).

This is stored in `liquidityNet`, updated like so:
```solidity
info.liquidityNet = upper
    ? int256(info.liquidityNet).sub(liquidityDelta).toInt128()
    : int256(info.liquidityNet).add(liquidityDelta).toInt128();
```

This behaves like a **discrete prefix sum**:
- At the lower bound tick (corresponding to $$p_0$$), `+liquidityDelta` is added
- At the upper bound tick (corresponding to $$p_1$$), `-liquidityDelta` is recorded

When the price moves and crosses a tick/price boundary:
- If crossing into a range: liquidity is **added** to the pool
- If crossing out of a range: liquidity is **removed**

### Example: Liquidity Range Management

Suppose an LP adds **10 units of liquidity** between prices 10 and 100. Internally:
- At price(10)(or its corresponding tick), `liquidityNet += 10`
- At price(100)(or its corresponding tick), `liquidityNet -= 10`

When the price rises from 9 → 11 (crossing 10), Uniswap **adds 10 to liquidity**. When it later crosses 100, **10 is subtracted**.

This mechanism allows Uniswap V3 to:
- Efficiently update liquidity as price moves
- Support **fragmented liquidity ranges**
- Keep swaps accurate with dynamically adjusted virtual reserves

### Swap Execution

A Uniswap V3 swap can be regarded as a sequence of constant product ($$xy=K$$) swaps, each occurring within a range of constant liquidity.

As the price moves, once it crosses a tick/price boundary, the active liquidity is updated by applying the corresponding `liquidityNet` value from the tick map:

```solidity
int128 liquidityNet = ticks.cross(
    step.tickNext,
    (zeroForOne ? state.feeGrowthGlobalX128 : feeGrowthGlobal0X128),
    (zeroForOne ? feeGrowthGlobal1X128 : state.feeGrowthGlobalX128),
    cache.secondsPerLiquidityCumulativeX128,
    cache.tickCumulative,
    cache.blockTimestamp
);

if (zeroForOne) liquidityNet = -liquidityNet;
state.liquidity = LiquidityMath.addDelta(state.liquidity, liquidityNet);
```

This change reflects **LPs entering or exiting the price range**.

Therefore, the swap process effectively walks through a sequence of micro-pools, each with fixed liquidity and its own constant product curve, adjusting liquidity dynamically at each transition.

## Summary

| Aspect | V2 | V3 |
|--------|----|----|
| **Liquidity Distribution** | Uniform across $$(0, \infty)$$ | Concentrated in custom ranges |
| **Capital Efficiency** | Low | High |
| **Trackability** | `totalSupply` may deviate from $$\sqrt{k}$$ | `liquidity` accurately reflects active liquidity |
| **Price Alignment** | Router-level adjustment | Protocol-level enforcement |
| **Complexity** | Simple | Complex but more efficient |

The key innovation of V3 is that it maintains the mathematical consistency of V2 while dramatically improving capital efficiency through concentrated liquidity and precise price-level enforcement.
