---
title: "Morpho Internals Part 2: IRMs"
slug: "morpho-internals-part-2-irms"
excerpt: "How Morpho Blue computes borrow rates: FixedRate warm-up and a deep dive on AdaptiveCurve with utilization-driven anchor updates."
author: "ret2basic.eth (reviewed by jesjupyter)"
date: "2025-12-25"
readTime: "1 hour read"
category: "DeFi"
tags: ["Morpho", "Lending", "Source Code Walkthrough"]
featured: true
image: "/images/blog/Morpho.jpg"
---

Recall that in part 1 we walked through `Morpho._accrueInterest()`:

```solidity
function _accrueInterest(MarketParams memory marketParams, Id id) internal {
    uint256 elapsed = block.timestamp - market[id].lastUpdate;
    if (elapsed == 0) return;

    if (marketParams.irm != address(0)) {
        uint256 borrowRate = IIrm(marketParams.irm).borrowRate(marketParams, market[id]);
        uint256 interest = market[id].totalBorrowAssets.wMulDown(borrowRate.wTaylorCompounded(elapsed));
        ...
     }
     ...
 }
```

The function calls `irm.borrowRate()` to fetch the market’s current borrow rate. That borrow rate becomes the $r$ in $e^{rt} - 1$ when computing interest.

In this part of the series we discuss how Morpho IRMs work and deep dive into `irm.borrowRate()`.

Morpho implements two IRMs in `morpho-blue-irm`: `AdaptiveCurveIrm` and `FixedRateIrm`. We will spend more time on `AdaptiveCurveIrm` because it is the “production” model used most often, but we start with `FixedRateIrm` as a warm-up.

One theme to keep in mind throughout this article: Morpho accrues interest over a time interval since the last update, so the “right” borrow rate to apply is the **average borrow rate over that interval**. `FixedRateIrm` makes that trivial (the rate is constant), while `AdaptiveCurveIrm` explicitly computes an average and updates internal state.

## Background: units and fixed-point math

Two details are easy to miss if you jump straight into the code:

1. **Rates are per-second and WAD-scaled.** A yearly rate like 4% is converted to a per-second rate by dividing by `365 days`. In the code, “WAD-scaled” means $1e18$ represents 1.0.
2. **`AdaptiveCurveIrm` uses signed fixed-point math.** Utilization can be above or below target, so the “error” is signed; Morpho uses `int256` math with helpers like:
- `wMulToZero(x, y) = (x * y) / 1e18` (rounds toward zero)
- `wDivToZero(x, y) = (x * 1e18) / y` (rounds toward zero)

### Quick units cheat sheet

- $u$ / `utilization`: WAD-scaled fraction in `[0, 1]`
- $e(u)$ / `err`: signed, WAD-scaled, exactly in `[-1, +1]` by construction (it saturates to ±1 when utilization is 0% or 100%)
- $k_d$ (docs) / `CURVE_STEEPNESS` (code): curve steepness. In docs $k_d = 4$.
- $k_p$ (docs) / `ADJUSTMENT_SPEED` (code): adjustment aggressiveness. In docs $k_p = 50$ (per year); in code `ADJUSTMENT_SPEED = 50 ether / (365 days)` (per second, WAD-scaled).
- `linearAdaptation = ADJUSTMENT_SPEED * err * elapsed`: dimensionless (still stored as WAD-scaled). In docs notation this corresponds to $(k_p/\text{secondsPerYear}) \cdot e(u) \cdot \Delta t$.

### borrowAPY and supplyAPY

The Morpho docs define APYs (annualized, compounding-aware) from the per-second `borrowRate` returned by the IRM:

- **Borrow APY:** $\text{borrowAPY} = e^{\text{borrowRate} \cdot \text{secondsPerYear}} - 1$
- **Supply APY:** $\text{supplyAPY} = \text{borrowAPY} \cdot u \cdot (1-\text{fee})$

Where `fee` is the per-market curator/protocol fee and $u$ is utilization.

Note that these two concepts aren’t implemented in the contract. The frontend UI derives borrowAPY and supplyAPY from `borrowRate`.

Also note: the AdaptiveCurve implementation bounds the anchor rate (`rateAtTarget`, i.e., $r_{90\%}$) between `MIN_RATE_AT_TARGET = 0.1%/year` and `MAX_RATE_AT_TARGET = 200%/year` (both expressed as per-second WAD rates in `ConstantsLib`).

## FixedRateIrm

**Code:** https://github.com/morpho-org/morpho-blue-irm/blob/main/src/fixed-rate-irm/FixedRateIrm.sol

Borrow rate is the interest rate per second that borrowers pay on their loans. `FixedRateIrm` is intentionally simple: governance (or whoever controls the IRM) sets a per-market borrow rate once, and Morpho reads it later.

One nuance from the actual implementation: `FixedRateIrm` does **not** implement access control on `setBorrowRate`—the rate is simply “write-once per market id”. In practice this still ends up being controlled by whoever is coordinating market creation (and by Morpho governance enabling the IRM address), but it’s worth knowing the contract itself does not enforce an owner.

```solidity
mapping(Id => uint256) public borrowRateStored;

function setBorrowRate(Id id, uint256 newBorrowRate) external {
    require(borrowRateStored[id] == 0, RATE_SET);
    require(newBorrowRate != 0, RATE_ZERO);
    require(newBorrowRate <= MAX_BORROW_RATE, RATE_TOO_HIGH);

    borrowRateStored[id] = newBorrowRate;
}
```

You may notice there are two getters, `borrowRateView()` and `borrowRate()`, with identical logic:

```solidity
function borrowRateView(MarketParams memory marketParams, Market memory) external view returns (uint256) {
    uint256 borrowRateCached = borrowRateStored[marketParams.id()];
    require(borrowRateCached != 0, RATE_NOT_SET);
    return borrowRateCached;
}

function borrowRate(MarketParams memory marketParams, Market memory) external view returns (uint256) {
    uint256 borrowRateCached = borrowRateStored[marketParams.id()];
    require(borrowRateCached != 0, RATE_NOT_SET);
    return borrowRateCached;
}
```

This is not “weird” once you look at the `IIrm` interface: Morpho calls `borrowRate()` in state-changing flows, while `borrowRateView()` is the view-only variant for off-chain quoting and integrations. In `FixedRateIrm`, both are `view` because the model has no internal state to update.

One important detail: `FixedRateIrm.borrowRate()` reverts if the rate is not set, so **rates must be set before market creation** if you want to use this IRM.

## AdaptiveCurveIrm

**Code:** https://github.com/morpho-org/morpho-blue-irm/blob/main/src/adaptive-curve-irm/AdaptiveCurveIrm.sol

**Doc:** https://docs.morpho.org/get-started/resources/contracts/irm

### Overview

At a high level, “adaptive” means continuously adjusting the interest rate to push utilization toward a target utilization.

$$
u(t) = \frac{\text{totalBorrowAssets}(t)}{\text{totalSupplyAssets}(t)}
$$

In Morpho, the numerator is `market[id].totalBorrowAssets` and the denominator is `market[id].totalSupplyAssets`. Those values are tracked in `Morpho.sol`; the IRM computes utilization from them.

There are two cases where we want to adjust the interest rate curve:

- When $u(t) > u_{target}$, demand is “too high”, so the IRM makes borrowing more expensive (to push borrowers to repay and to attract suppliers).
- When $u(t) < u_{target}$, demand is “too low”, so the IRM makes borrowing cheaper (to encourage borrowing).

Here $u_{target}$ is a constant defined in `ConstantsLib`: `TARGET_UTILIZATION = 0.9 ether` (90%, WAD-scaled).

**Why such a high target?** As the docs emphasize, Morpho markets do not use supplied assets as collateral, which removes the “must stay liquid at all times for liquidations” constraint common in pooled lending designs. This enables a more aggressive target utilization (90%) while still relying on the IRM to pull utilization back down when it gets too close to illiquidity.

### borrowRate() vs borrowRateView()

With that motivation in mind, let’s look into `AdaptiveCurveIrm.sol`. The entrypoint `borrowRate()` computes an **average borrow rate over the elapsed time** (since the last Morpho update) and also updates the IRM’s state.

`AdaptiveCurveIrm` maintains one piece of per-market state:

- `rateAtTarget[id]`: the per-market stored **interest rate** at the target utilization (i.e., $r_{90\%}$ in the docs). Concretely, it is the borrow rate the model would output when $u = u_{target} = 0.9$, and it sets the overall height of the curve.

It is not a fixed constant; it drifts over time depending on whether utilization tends to sit above or below target. For example:

| Market | Current utilization | History | `rateAtTarget` intuition |
| --- | --- | --- | --- |
| Market A | 90% | Was ~95% for weeks | Higher `rateAtTarget` |
| Market B | 90% | Was ~80% for weeks | Lower `rateAtTarget` |

Both scenarios have $u = 90\%$ but $r_{90\%}$ (i.e., `rateAtTarget`) is different.

### Mental model: an anchor rate that adapts over time

It helps to view AdaptiveCurve as having **two layers**:

1. **Instantaneous layer (the curve):** given the current utilization $u$, compute the signed normalized error $e(u)$ (stored as `err`) and apply the curve to $r_{90\%}$.
    - This reacts to where utilization is right now.
2. **Slow-moving layer (the anchor):** update $r_{90\%}$ (stored as `rateAtTarget[id]`) over time based on persistent error.
    - This reacts to whether the market has been above/below target for a while.

Concretely, whenever Morpho calls the non-view `borrowRate()` (during accrual / market creation), the IRM updates its anchor rate approximately as:

$$
r_{90\%}^{\text{new}} \;=\; \text{clamp}\Bigl(r_{90\%}^{\text{old}} \cdot \exp\bigl((k_p/\text{secondsPerYear})\cdot e(u)\cdot \Delta t\bigr),\; \text{MIN},\; \text{MAX}\Bigr)
$$

(The clamp is the `.bound()` method in `_newRateAtTarget()`)

In the Solidity implementation, $(k_p/\text{secondsPerYear})$ is represented by `ConstantsLib.ADJUSTMENT_SPEED` (per-second, WAD-scaled) and $e(u)$ is stored in `err`.

**Motivation:** if a market is chronically near-illiquid (utilization above target), the model wants to ratchet the entire curve upward over time until the market finds an equilibrium that restores liquidity. Conversely, if a market is chronically underutilized, it can lower the base level to encourage borrowing without overreacting to short-lived dips.

Why make this time-dependent (i.e., scale by $\Delta t$) instead of updating `rateAtTarget` purely as a function of the current utilization?

- **Persistent error should compound.** The design is intentionally multiplicative: if utilization stays away from target for longer, the anchor should keep drifting in the same direction. Intuitively, “off-target for longer” is stronger evidence that the current rate level is not clearing the market, so the model should apply a stronger correction.
- **Update frequency should not change the economics.** Morpho may call the IRM often (many actions) or rarely (quiet market). If the anchor moved by a fixed amount “per call”, the same market conditions would drift much faster in a busy market than in a quiet one. Multiplying by elapsed time makes the adjustment approximately “per second”, not “per call”.
- **The returned rate must be fair for the whole interval.** Morpho accrues interest over an elapsed interval; `borrowRate()` returns an average rate for that interval and updates the anchor to the end-of-interval value. If time didn’t enter the update, the model couldn’t consistently match “interest accrued over $\Delta t$” with “anchor updated over $\Delta t$”.

`borrowRateView()` returns the same computed rate **without** updating `rateAtTarget`. `borrowRate()` (non-view) is what Morpho calls during accrual and market creation and it updates `rateAtTarget` (and is gated by `require(msg.sender == MORPHO)` so only Morpho can call it).

```solidity
function borrowRate(MarketParams memory marketParams, Market memory market) external returns (uint256) {
    require(msg.sender == MORPHO, ErrorsLib.NOT_MORPHO);

    Id id = marketParams.id();

    (uint256 avgRate, int256 endRateAtTarget) = _borrowRate(id, market);

    rateAtTarget[id] = endRateAtTarget;
    
    return avgRate;
}
```

### _borrowRate(): computing the average rate

Going into `_borrowRate()`, the first thing is computing utilization (WAD-scaled):

```solidity
int256 utilization =
    int256(market.totalSupplyAssets > 0 ? market.totalBorrowAssets.wDivDown(market.totalSupplyAssets) : 0);
```

Next we measure how far utilization deviates from target. This is the signed error term $e(u)$ (stored as `err`), normalized to the range $[-1, +1]$:

```solidity
int256 errNormFactor = utilization > ConstantsLib.TARGET_UTILIZATION
    ? WAD - ConstantsLib.TARGET_UTILIZATION
    : ConstantsLib.TARGET_UTILIZATION;
int256 err = (utilization - ConstantsLib.TARGET_UTILIZATION).wDivToZero(errNormFactor);
```

The code implements the following piecewise definition (with $u := u(t)$ being the current utilization):

$$
e(u) =\begin{cases}\frac{u - u_{target}}{1 - u_{target}} & \text{if } u > u_{target} \\\frac{u - u_{target}}{u_{target}} & \text{if } u \leq u_{target}\end{cases}
$$

Intuition: the “room” above target is small (only 10 percentage points from 90% to 100%), so the same absolute utilization deviation should be treated as a larger normalized error.

![Error_function.png](/images/blog/Error_function.png)

When $u <= u_{target}$ the denominator is $u_{target}$; when $u > u_{target}$ the denominator is $1 - u_{target}$.

After computing `err`, the IRM reads the prior `rateAtTarget`:

```solidity
int256 startRateAtTarget = rateAtTarget[id];

int256 avgRateAtTarget;
int256 endRateAtTarget;

if (startRateAtTarget == 0) {
    // First interaction.
    avgRateAtTarget = ConstantsLib.INITIAL_RATE_AT_TARGET;
    endRateAtTarget = ConstantsLib.INITIAL_RATE_AT_TARGET;
}

```

The first interaction happens in `Morpho.createMarket()` (Morpho calls the IRM once to initialize it).

![BorrowRate.png](/images/blog/BorrowRate.png)

So on first interaction, both `avgRateAtTarget` and `endRateAtTarget` are set to `INITIAL_RATE_AT_TARGET`, which is 4%/year converted to a **per-second** WAD rate. The curve still applies the current `err`, so the very first returned borrow rate already reflects utilization; the anchor just has not drifted yet.

```solidity
/// @notice Initial rate at target per second (scaled by WAD).
/// @dev Initial rate at target = 4% (rate between 1% and 16%).
int256 public constant INITIAL_RATE_AT_TARGET = 0.04 ether / int256(365 days);

```

This means that at the very beginning, when utilization is at the 90% target, the model starts from a ~4% APR baseline. Future updates will move `rateAtTarget` up or down based on `err` and elapsed time.

Back to `_borrowRate()`. In the non-first-interaction branch, the model computes how much `rateAtTarget` should drift over the elapsed time:

```solidity
else {
    // The speed is assumed constant between two updates, but it is in fact not constant because of interest.
    // So the rate is always underestimated.
    int256 speed = ConstantsLib.ADJUSTMENT_SPEED.wMulToZero(err);
    // market.lastUpdate != 0 because it is not the first interaction with this market.
    // Safe "unchecked" cast because block.timestamp - market.lastUpdate <= block.timestamp <= type(int256).max.
    int256 elapsed = int256(block.timestamp - market.lastUpdate);
    int256 linearAdaptation = speed * elapsed;

```

`elapsed` is measured in seconds. `speed` is “per second” (WAD-scaled), so `linearAdaptation = speed * elapsed` is a dimensionless WAD-scaled number (this corresponds to $(k_p/\text{secondsPerYear}) \cdot e(u) \cdot \Delta t$ in the docs notation). The comment about “underestimated” reflects that `speed` is frozen even though interest accrual nudges utilization during the interval, so the true path can be slightly steeper.

![IIrm.png](/images/blog/IIrm.png)

Linear adaptation refers to how $r_{90\%}$ (stored as `rateAtTarget`) automatically adjusts over time based on the error. When $u > 90\%$, `err > 0` so `rateAtTarget` increases; when $u < 90\%$, `err < 0` so `rateAtTarget` decreases. In code terms:

$$
    \text{linearAdaptation} = \text{speed} \cdot \Delta t = \text{ADJUSTMENT\_SPEED} \cdot e(u) \cdot \Delta t
$$

`ADJUSTMENT_SPEED` is a constant that controls how aggressively the model reacts to error; it is set to `50 ether / (365 days)` (i.e., $k_p = 50$ per year, converted to per-second and WAD-scaled).

Visually we can see how $r_{90\%}$ (i.e., `rateAtTarget`) changes based on $u$ and elapsed time. Example when $u < 90\%$:

![Small_utilization.png](/images/blog/Small_utilization.png)

Example when $u > 90\%$:

![Large_utilization.png](/images/blog/Large_utilization.png)

Then the code handles a special case when `linearAdaptation == 0`:

```solidity
if (linearAdaptation == 0) {
    // If linearAdaptation == 0, avgRateAtTarget = endRateAtTarget = startRateAtTarget;
    avgRateAtTarget = startRateAtTarget;
    endRateAtTarget = startRateAtTarget;
}

```

This occurs when `err == 0` (exactly on target) or `elapsed == 0`. In either scenario, the time-averaged rate-at-target equals the start rate.

Otherwise, the IRM computes `avgRateAtTarget` (the time-average of `rateAtTarget` over the elapsed period) using the approximation in the comment. Note that `err` is also frozen for this interval; utilization can drift a bit as interest accrues, so the returned average is an approximation that stays consistent with how Morpho accrues interest.

```solidity
else {
    // Formula of the average rate that should be returned to Morpho Blue:
    // avg = 1/T * ∫_0^T curve(startRateAtTarget*exp(speed*x), err) dx
    // The integral is approximated with the trapezoidal rule:
    // avg ~= 1/T * Σ_i=1^N [curve(f((i-1) * T/N), err) + curve(f(i * T/N), err)] / 2 * T/N
    // Where f(x) = startRateAtTarget*exp(speed*x)
    // avg ~= Σ_i=1^N [curve(f((i-1) * T/N), err) + curve(f(i * T/N), err)] / (2 * N)
    // As curve is linear in its first argument:
    // avg ~= curve([Σ_i=1^N [f((i-1) * T/N) + f(i * T/N)] / (2 * N), err)
    // avg ~= curve([(f(0) + f(T))/2 + Σ_i=1^(N-1) f(i * T/N)] / N, err)
    // avg ~= curve([(startRateAtTarget + endRateAtTarget)/2 + Σ_i=1^(N-1) f(i * T/N)] / N, err)
    // With N = 2:
    // avg ~= curve([(startRateAtTarget + endRateAtTarget)/2 + startRateAtTarget*exp(speed*T/2)] / 2, err)
    // avg ~= curve([startRateAtTarget + endRateAtTarget + 2*startRateAtTarget*exp(speed*T/2)] / 4, err)
    endRateAtTarget = _newRateAtTarget(startRateAtTarget, linearAdaptation);
    int256 midRateAtTarget = _newRateAtTarget(startRateAtTarget, linearAdaptation / 2);
    avgRateAtTarget = (startRateAtTarget + endRateAtTarget + 2 * midRateAtTarget) / 4;
}

// Safe "unchecked" cast because avgRateAtTarget >= 0.
return (uint256(_curve(avgRateAtTarget, err)), endRateAtTarget);

```

Don’t get overwhelmed by the math in the comment. We can break the logic into small steps.

**Step 0: Understanding what this algorithm is doing**

Recall that **rate-at-target** is the base interest rate charged at exactly target utilization. The actual borrow rate is then obtained by applying `_curve(rateAtTarget, err)`, which scales the base rate up/down depending on `err`.

The algorithm used the following variables:

- `startRateAtTarget`
    - **What it is:** The rate-at-target at the beginning of the current time period (read from storage).
    - **When:** This is the value from the last update (`market.lastUpdate`).
- `endRateAtTarget`
    - **What it is:** The rate-at-target **at the end** of the current time period (i.e., **now**).
    - **Formula:** $\text{endRateAtTarget} = \text{startRateAtTarget} \times e^{\text{speed} \cdot \Delta t}$
    - **Purpose:** This will be saved to storage as the new `rateAtTarget[id]` for the next update.
- `midRateAtTarget`
    - **What it is:** The rate-at-target **at the midpoint** of the time period.
    - **Formula:** $\text{midRateAtTarget} = \text{startRateAtTarget} \times e^{\text{speed} \cdot \frac{\Delta t}{2}}$
    - **Purpose:** Used for the trapezoidal approximation—it's the interior sample point when $N = 2$.
- `avgRateAtTarget`
    - **What it is:** The time-weighted average of the rate-at-target over the elapsed period.
    - **Purpose:** This is the fair average base rate to charge for interest that accrued during the period. The borrow rate returned to Morpho is `_curve(avgRateAtTarget, err)`.

Visually:

```
Time:     lastUpdate ──────────────────────────────────► now
              │                    │                    │
              ▼                    ▼                    ▼
Rate:   startRateAtTarget    midRateAtTarget    endRateAtTarget
              │                    │                    │
              └──────────  avgRateAtTarget ─────────────┘
                  (weighted average based on all three)
```

**Step 1: Computing `endRateAtTarget`**

`endRateAtTarget` is computed by `_newRateAtTarget()`:

```solidity
    function _newRateAtTarget(int256 startRateAtTarget, int256 linearAdaptation) private pure returns (int256) {
        // Non negative because MIN_RATE_AT_TARGET > 0.
        return startRateAtTarget.wMulToZero(ExpLib.wExp(linearAdaptation))
            .bound(ConstantsLib.MIN_RATE_AT_TARGET, ConstantsLib.MAX_RATE_AT_TARGET);
    }
```

The code performs exponentiation on linear adaptation:

$$
\text{endRateAtTarget} = \text{startRateAtTarget} \times e^{\text{linearAdaptation}} = \text{startRateAtTarget} \times e^{\text{speed} \cdot \Delta t}
$$

Where:

- `linearAdaptation = speed * time_elapsed`
- `ExpLib.wExp(linearAdaptation)` computes $e^{\text{linearAdaptation}}$ in WAD-scaled fixed-point

Why exponentiation? Because the interest rate model is designed to adjust the `rateAtTarget` **multiplicatively** (or exponentially) over time, rather than additively. This is just a design choice that provides some benefits over the additive model. First, a multiplicative model reacts to the percentage change rather than the absolute number. This is crucial because "high" and "low" are relative:

- **At low rates (e.g., 2%):** An additive increase of +1% is a massive 50% hike in borrowing costs.
- **At high rates (e.g., 50%):** That same +1% increase is a negligible 2% change, which might not be enough to discourage borrowers during a liquidity crunch.

By using a multiplicative model, the protocol can increase the rate by (say) 10% relative to its current value.

- At 2%, it becomes 2.2% (a gentle nudge).
- At 50%, it becomes 55% (a strong signal). This keeps the mechanism effective across all ranges of interest rates.

Moreover, the primary job of an IRM is to ensure there is always liquidity available for withdrawals. If utilization stays too high for too long, the protocol needs to raise rates fast to force borrowers to repay. Exponential growth is slow at first but becomes incredibly fast over time. If the market stays illiquid, the rate will ramp up aggressively to find the equilibrium price where liquidity returns. An additive model might be too slow to react to extreme conditions.

In the end the code bounds the range of the result to a pre-defined interval `[MIN_RATE_AT_TARGET, MAX_RATE_AT_TARGET]`: if `rateAtTarget` goes outside the interval we clamp its value to minimum or maximum.

**Step 2: Computing `midRateAtTarget`**

`midRateAtTarget` is needed for computing `avgRateAtTarget`, so in this step we are just preparing for step 3. The way of calculating it is the same as what we had done in step 1, just substitute in $\frac{\Delta t}{2}$ (half the elapsed time):

$$
\text{midRateAtTarget} = \text{startRateAtTarget} \times e^{speed \cdot \frac{\Delta t}{2}}
$$

Why this variable is needed will be clear in step 3.

**Step 3: Computing `avgRateAtTarget`**

This step is what the long comment documents.

Before diving into the derivation, note that the in-code comment uses a slightly different notation than the docs (and also slightly different from the notation in this article):

- $T$: elapsed time since last update (`block.timestamp - market.lastUpdate`).
- Docs write utilization as $u(t)$ and error as $e(u)$; the code stores $u(t)$ in `utilization` and stores $e(u)$ in `err`.
- The docs use both $c=4$ (overview) and $k_d=4$ (formal definition); the code uses `CURVE_STEEPNESS`.
- The in-code comment writes `curve(rateAtTarget, err)` (a function of the anchor rate and the signed error), while the docs write $\text{curve}(u(t))$. These are equivalent because `err` is computed from $u(t)$ and its sign tells whether $u(t) \le u_{target}$ or $u(t) > u_{target}$.
- Docs sometimes call the exponential multiplier a “speed factor” (e.g., $\exp(k_p e(u)\Delta t)$). In the Solidity code, `speed = ADJUSTMENT_SPEED * err` is the exponent coefficient (per second), and the multiplier is computed later via `ExpLib.wExp(speed * elapsed)`.

As we discussed earlier, `_curve()` turns `avgRateAtTarget` into the actual borrow rate returned to Morpho. The contract comment gives:

$$
r = \begin{cases}\left(\left(1 - \frac{1}{k_d}\right) \cdot e(u) + 1\right) \cdot r_{90\%} & \text{if } u \leq u_{target} \\[10pt]\left((k_d - 1) \cdot e(u) + 1\right) \cdot r_{90\%} & \text{if } u > u_{target}\end{cases}
$$

where $k_d$ = `CURVE_STEEPNESS` = 4 (WAD-scaled) and $r_{90\%}$ corresponds to the stored `rateAtTarget`.

Both cases can be written as:

$$
r = (\text{coeff} \cdot e(u) + 1) \cdot r_{90\%}
$$

The curve is asymmetric: rates ramp up much faster when utilization is above target than they decay when utilization is below target.

Below is the full derivation in the comments translated into LaTeX for better readability. Notes are inserted below each step for better understanding.

Formula of the average rate that should be returned to Morpho Blue:

$$
\text{avg} = \frac{1}{T} \int_0^T \text{curve}(\text{startRateAtTarget} \cdot e^{\text{speed} \cdot x}, \text{err}) \, dx
$$

The integral is approximated with the **trapezoidal rule**:

$$
\text{avg} \approx \frac{1}{T} \sum_{i=1}^{N} \frac{\text{curve}(f(\frac{(i-1) \cdot T}{N}), \text{err}) + \text{curve}(f(\frac{i \cdot T}{N}), \text{err})}{2} \cdot \frac{T}{N}
$$

(**Note:** if you want a refresher on the trapezoidal rule: https://youtu.be/XMjlr_7IUl0?si=zcqbbNDag0F3Fqhn)

Where $f(x) = \text{startRateAtTarget} \cdot e^{\text{speed} \cdot x}$

Simplifying:

$$
\text{avg} \approx \sum_{i=1}^{N} \frac{\text{curve}(f(\frac{(i-1) \cdot T}{N}), \text{err}) + \text{curve}(f(\frac{i \cdot T}{N}), \text{err})}{2N}
$$

As **curve is linear in its first argument**:

$$
\text{avg} \approx \text{curve}\left(\sum_{i=1}^{N} \frac{f(\frac{(i-1) \cdot T}{N}) + f(\frac{i \cdot T}{N})}{2N}, \text{err}\right)
$$

$$
\text{avg} \approx \text{curve}\left(\frac{\frac{f(0) + f(T)}{2} + \sum_{i=1}^{N-1} f(\frac{i \cdot T}{N})}{N}, \text{err}\right)
$$

$$
\text{avg} \approx \text{curve}\left(\frac{\frac{\text{startRateAtTarget} + \text{endRateAtTarget}}{2} + \sum_{i=1}^{N-1} f(\frac{i \cdot T}{N})}{N}, \text{err}\right)
$$

With N = 2:

$$
\text{avg} \approx \text{curve}\left(\frac{\frac{\text{startRateAtTarget} + \text{endRateAtTarget}}{2} + \text{startRateAtTarget} \cdot e^{\text{speed} \cdot T/2}}{2}, \text{err}\right)
$$

$$
\text{avg} \approx \text{curve}\left(\frac{\text{startRateAtTarget} + \text{endRateAtTarget} + 2 \cdot \text{startRateAtTarget} \cdot e^{\text{speed} \cdot T/2}}{4}, \text{err}\right)
$$

This is exactly what the code computes, except it writes the midpoint term as `midRateAtTarget`:

```solidity
endRateAtTarget = _newRateAtTarget(startRateAtTarget, linearAdaptation);
int256 midRateAtTarget = _newRateAtTarget(startRateAtTarget, linearAdaptation / 2);
avgRateAtTarget = (startRateAtTarget + endRateAtTarget + 2 * midRateAtTarget) / 4;
```

### _curve(): turning error into an actual borrow rate

So far we have computed an average **rate-at-target**. The final borrow rate returned to Morpho is:

```solidity
return (uint256(_curve(avgRateAtTarget, err)), endRateAtTarget);
```

The curve is a linear function of `rateAtTarget` for a fixed `err`:

```solidity
// r = ((1-1/C)*err + 1) * rateAtTarget if err < 0
//     ((C-1)*err + 1) * rateAtTarget else.
```

Two important observations:

1. When $u \leq u_{target}$ (equivalently `err <= 0`), the slope is smaller: $1 - 1/k_d = 0.75$. Rates decay slowly.
2. When $u > u_{target}$ (equivalently `err > 0`), the slope is larger: $k_d - 1 = 3$. Rates ramp up quickly.

This asymmetry is intentional: when utilization is too high, Morpho needs to get liquidity back quickly, so it increases rates aggressively.

### _newRateAtTarget(): exponential drift + clamping

The helper `_newRateAtTarget()` implements:

$$
{\text{newRateAtTarget}} = \text{clamp}\bigl(\text{startRateAtTarget} \cdot e^{\text{linearAdaptation}},\; \text{MIN},\; \text{MAX}\bigr)
$$

where `ExpLib.wExp(linearAdaptation)` approximates $e^{x}$ in fixed-point, and `MIN_RATE_AT_TARGET` / `MAX_RATE_AT_TARGET` cap the output.

### What Morpho receives

`borrowRate()` returns a per-second, WAD-scaled rate (a number you can plug into `wTaylorCompounded(elapsed)` in Morpho). In addition, the non-view version updates `rateAtTarget[id]` so the next accrual continues from the “end” of this one.
