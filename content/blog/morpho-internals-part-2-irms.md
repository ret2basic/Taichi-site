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

This post is much easier to follow if you lock in three “unit rules” up front:

1. **Borrow rates are per-second and WAD-scaled.** The IRM returns a per-second rate $r$ where $1e18$ represents 1.0.
    - Example: an annual rate of 4% is turned into a per-second WAD value by: $r = 0.04 / \text{secondsPerYear}$.
2. **WAD-scaled values don’t all have the same “unit”.** `utilization`, `err`, `speed`, and `linearAdaptation` are all stored as fixed-point WAD numbers, but they don’t all represent the same kind of quantity.
    - `utilization` and `err` are dimensionless fractions.
    - `speed` is “per second” (so that `speed * elapsed` is dimensionless).
3. **`AdaptiveCurveIrm` uses signed fixed-point math and rounds toward zero.** Because utilization can be above or below target, the “error” can be negative.
    - `wMulToZero(x, y) = (x * y) / 1e18` (rounds toward 0)
    - `wDivToZero(x, y) = (x * 1e18) / y` (rounds toward 0)

### Quick units cheat sheet

- `WAD`: $1e18$ scaling factor used for fixed-point decimals.
- $u$ / `utilization`: WAD-scaled fraction in $[0, 1]$.
- $e(u)$ / `err`: signed, WAD-scaled, in $[-1, +1]$ by construction.
- $k_d$ (docs) / `CURVE_STEEPNESS` (code): curve steepness (docs use $k_d = 4$).
- $k_p$ (docs) / `ADJUSTMENT_SPEED` (code): adjustment aggressiveness (docs use $k_p = 50$ per year).

**Anchor drift terms (this is where people usually get tripped up):**

- `ADJUSTMENT_SPEED = 50 ether / (365 days)` is already “per second” (WAD-scaled).
- `speed = ADJUSTMENT_SPEED.wMulToZero(err)` is also “per second” (WAD-scaled), because `err` is dimensionless.
- `elapsed` is measured in seconds.
- `linearAdaptation = speed * elapsed` is therefore dimensionless (but still represented as WAD-scaled fixed-point).

So, in real-number math, this corresponds to:

$$
\mathrm{linearAdaptation} \approx (k_p/\mathrm{secondsPerYear}) \cdot e(u) \cdot \Delta t
$$

The approximation is only about fixed-point rounding; conceptually it’s the same quantity.

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

### Mental model: curve + anchor

With that motivation in mind, it helps to view AdaptiveCurve as having **two layers**:

1. **Instantaneous layer (the curve):** given the current utilization $u$, compute a signed normalized error $e(u)$ (stored as `err`) and apply a curve to scale a base rate.
2. **Slow-moving layer (the anchor):** update the base rate over time based on persistent error.

`AdaptiveCurveIrm` stores one piece of per-market state:

- `rateAtTarget[id]`: the stored borrow rate at the target utilization (i.e., $r_{90\%}$). It sets the overall “height” of the curve.

Even if two markets are both at 90% utilization today, their `rateAtTarget` can differ if one has spent weeks above target and the other weeks below target.

### borrowRate() vs borrowRateView()

`borrowRate()` (non-view) computes an **average borrow rate over the elapsed interval** and updates `rateAtTarget`. `borrowRateView()` returns the same computed rate **without** updating state. Morpho calls `borrowRate()` during accrual / market creation; integrations call `borrowRateView()` for quoting.

### BorrowRateUpdate: why there are two rates

When Morpho calls `borrowRate()` it emits `BorrowRateUpdate(id, avgBorrowRate, rateAtTarget)`. It’s tempting to assume both numbers represent “the borrow rate”, but they serve different purposes:

- `avgBorrowRate`: the **average per-second borrow rate** over the last accrual interval. This is the rate Morpho plugs into $e^{rt}-1$ in `_accrueInterest()`.
- `rateAtTarget`: the **end-of-interval anchor** (the updated $r_{90\%}$) that will be used as the starting point next time.

That split is the whole reason the implementation has the slightly unusual signature `(avgRate, endRateAtTarget)`.

If you want to compare rates in human units, convert a per-second WAD rate $r$ to an annualized approximation:

- APR (small-rate approximation): $\text{APR} \approx r \cdot \text{secondsPerYear}$
- APY (continuous compounding): $\text{APY} = e^{r \cdot \text{secondsPerYear}} - 1$

#### Worked example (numbers from an on-chain BorrowRateUpdate log)

Suppose a `BorrowRateUpdate` log shows:

```
avgBorrowRate  = 2288292706
rateAtTarget   = 2288771456
```

These are WAD-scaled **per-second** rates, so first convert to “plain per-second” by dividing by $1e18$.

Using $\text{secondsPerYear} \approx 31{,}556{,}926$:

- Anchor APR $\approx \frac{2288771456}{1e18} \cdot 31{,}556{,}926 \approx 0.0722$ (≈ 7.22%)
- Average-rate APR $\approx \frac{2288292706}{1e18} \cdot 31{,}556{,}926 \approx 0.0722$ (very close, as expected for short intervals)

The important conceptual point is not the tiny numerical difference in this particular log, but *which number Morpho uses where*:

- `avgBorrowRate` is used to charge interest for the **past** interval.
- `rateAtTarget` is stored to seed the IRM’s anchor update for the **next** interval.

Concretely, whenever Morpho calls `borrowRate()`, the IRM updates its anchor rate approximately as:

$$
r_{90\%}^{\text{new}} \;=\; \text{clamp}\Bigl(r_{90\%}^{\text{old}} \cdot \exp\bigl((k_p/\text{secondsPerYear})\cdot e(u)\cdot \Delta t\bigr),\; \text{MIN},\; \text{MAX}\Bigr)
$$


(The clamp is the `.bound()` call in `_newRateAtTarget()`.)

In the Solidity implementation, $(k_p/\text{secondsPerYear})$ is represented by `ConstantsLib.ADJUSTMENT_SPEED` (per-second, WAD-scaled) and $e(u)$ is stored in `err`.

**Motivation:** if a market is chronically above target, the model ratchets the entire curve upward until liquidity returns; if it is chronically below target, it drifts the curve downward. Making the update proportional to $\Delta t$ keeps the economics closer to “per second” rather than “per call”, and matches Morpho’s “accrue over an interval” design.

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

Intuition: the "room" above target is small (only 10 percentage points from 90% to 100%), so the same absolute utilization deviation should be treated as a larger normalized error.

Design intent: bound $e(u)$ to $[-1, +1]$ (so drift is capped) while making “fully empty” and “fully utilized” equally extreme in normalized units.

A quick numeric feel with $u_{target}=0.9$:

- $u=1.00$ (100% utilized) $\Rightarrow e(u)=\frac{1.00-0.90}{0.10}=1.0$.
- $u=0.00$ (empty) $\Rightarrow e(u)=\frac{0.00-0.90}{0.90}=-1.0$.
- $u=0.95$ (only +5% above target) $\Rightarrow e(u)=\frac{0.05}{0.10}=0.5$.

This asymmetry is intentional: small moves above target represent a much more urgent liquidity risk than similar-sized moves below target.

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

When $u > 90\%$, `err > 0` so `rateAtTarget` increases; when $u < 90\%$, `err < 0` so `rateAtTarget` decreases.

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

Otherwise, the IRM computes `avgRateAtTarget` (the time-average of `rateAtTarget` over the elapsed period). It samples the anchor at start, midpoint, and end and combines them with trapezoidal-style weights.

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

You can summarize what’s happening as:

- Read `startRateAtTarget` from storage.
- Compute `endRateAtTarget = startRateAtTarget * exp(speed * elapsed)` (with clamping).
- Compute `midRateAtTarget` the same way using `elapsed/2`.
- Average them: `avgRateAtTarget = (start + end + 2*mid) / 4`.
- Return `curve(avgRateAtTarget, err)` and persist `endRateAtTarget`.

#### _newRateAtTarget(): exponential drift + clamping

`endRateAtTarget` and `midRateAtTarget` are computed by `_newRateAtTarget()`:

```solidity
    function _newRateAtTarget(int256 startRateAtTarget, int256 linearAdaptation) private pure returns (int256) {
        // Non negative because MIN_RATE_AT_TARGET > 0.
        return startRateAtTarget.wMulToZero(ExpLib.wExp(linearAdaptation))
            .bound(ConstantsLib.MIN_RATE_AT_TARGET, ConstantsLib.MAX_RATE_AT_TARGET);
    }
```

The code performs exponentiation on linear adaptation:

$$
\mathrm{endRateAtTarget} = \mathrm{startRateAtTarget} \times e^{\mathrm{linearAdaptation}} = \mathrm{startRateAtTarget} \times e^{\mathrm{speed} \cdot \Delta t}
$$

Where:

- `linearAdaptation = speed * time_elapsed`
- `ExpLib.wExp(linearAdaptation)` computes $e^{\mathrm{linearAdaptation}}$ in WAD-scaled fixed-point

Why exponentiation? The anchor is designed to drift **multiplicatively** over time: persistent positive error compounds upward; persistent negative error compounds downward. Across many accrual windows, the exponents add, so “being off-target for longer” has a stronger effect than “being off-target briefly”.

Intuitively: long stretches below target contribute a sustained negative exponent (anchor drifts down); long stretches above target contribute a sustained positive exponent (anchor drifts up).

In the end the code bounds the range of the result to a pre-defined interval `[MIN_RATE_AT_TARGET, MAX_RATE_AT_TARGET]`: if `rateAtTarget` goes outside the interval we clamp its value to minimum or maximum.

#### _curve(): turning error into an actual borrow rate

Once we have `avgRateAtTarget`, `_curve()` scales it up or down based on `err`. The contract comment gives:

$$
r = \begin{cases}\left(\left(1 - \frac{1}{k_d}\right) \cdot e(u) + 1\right) \cdot r_{90\%} & \text{if } u \leq u_{target} \\[10pt]\left((k_d - 1) \cdot e(u) + 1\right) \cdot r_{90\%} & \text{if } u > u_{target}\end{cases}
$$

where $k_d$ = `CURVE_STEEPNESS` = 4 (WAD-scaled) and $r_{90\%}$ corresponds to the stored `rateAtTarget`.

Both cases can be written as:

$$
r = (\text{coeff} \cdot e(u) + 1) \cdot r_{90\%}
$$

The curve is asymmetric: rates ramp up much faster when utilization is above target than they decay when utilization is below target.

#### Full derivation as in the long comment

This section is a faithful rewrite of the long comment inside `AdaptiveCurveIrm._borrowRate()`.

We use the same notation as the comment:

- $T$ is the elapsed time since the last Morpho update.
- $N$ is the number of trapezoids.
- `err` is treated as constant over the interval.
- $f(x)$ is the (time-evolving) **anchor** `rateAtTarget`.

**Step 1 — start from the definition (comment: `avg = 1/T * ∫ ...`).**

Morpho needs an **average borrow rate over** $[0, T]$. Over the interval, the model treats `err` as constant and lets the anchor drift exponentially, so the instantaneous rate is `curve(f(x), err)`.

$$
\mathrm{avg} = \frac{1}{T} \int_0^T \text{curve}(\text{startRateAtTarget} \cdot e^{\text{speed} \cdot x}, \text{err})\, dx
$$

Define the helper function exactly as in the comment:

$$
f(x) = \text{startRateAtTarget} \cdot e^{\text{speed} \cdot x}
$$

**Step 2 — apply the trapezoidal rule (comment: `avg ~= 1/T * Σ ...`).**

Split $[0, T]$ into $N$ equal sub-intervals of width $\Delta = T/N$. Trapezoidal rule approximates the integral by averaging the endpoints on each sub-interval:

$$
\mathrm{avg} \approx \frac{1}{T} \sum_{i=1}^{N}
\frac{\text{curve}(f(\tfrac{(i-1)T}{N}), \text{err}) + \text{curve}(f(\tfrac{iT}{N}), \text{err})}{2}
\cdot \frac{T}{N}
$$

**Step 3 — cancel the $T$’s (comment: `avg ~= Σ ... / (2 * N)`).**

The factor $(1/T) \cdot (T/N)$ becomes $1/N$:

$$
\mathrm{avg} \approx \sum_{i=1}^{N}
\frac{\text{curve}(f(\tfrac{(i-1)T}{N}), \text{err}) + \text{curve}(f(\tfrac{iT}{N}), \text{err})}{2N}
$$

**Step 4 — use linearity of `curve` in its first argument (comment: `As curve is linear ...`).**

For fixed `err`, `curve(rateAtTarget, err)` is linear in `rateAtTarget`.
That means averaging *curved* values equals curving the averaged anchors:

$$
\mathrm{avg} \approx \text{curve}\left(
\sum_{i=1}^{N} \frac{f(\tfrac{(i-1)T}{N}) + f(\tfrac{iT}{N})}{2N},
\mathrm{err}
\right)
$$

**Step 5 — simplify the trapezoid weights (comment: `[(f(0) + f(T))/2 + Σ ...] / N`).**

In a trapezoidal sum, interior points appear twice (once from the left trapezoid, once from the right), while endpoints appear once:

$$
\mathrm{avg} \approx \text{curve}\left(
\frac{\tfrac{f(0) + f(T)}{2} + \sum_{i=1}^{N-1} f(\tfrac{iT}{N})}{N},
\mathrm{err}
\right)
$$

**Step 6 — substitute endpoints (comment: `[(startRateAtTarget + endRateAtTarget)/2 + Σ ...] / N`).**

Since $f(0)=\text{startRateAtTarget}$ and $f(T)=\text{endRateAtTarget}$:

$$
\mathrm{avg} \approx \text{curve}\left(
\frac{\tfrac{\text{startRateAtTarget} + \text{endRateAtTarget}}{2} + \sum_{i=1}^{N-1} f(\tfrac{iT}{N})}{N},
\mathrm{err}
\right)
$$

**Step 7 — plug in $N=2$ (comment: `With N = 2: ...`).**

With $N=2$, there is exactly one interior sample at $x=T/2$:

$$
\mathrm{avg} \approx \text{curve}\left(
\frac{\tfrac{\text{startRateAtTarget} + \text{endRateAtTarget}}{2} + f(\tfrac{T}{2})}{2},
\mathrm{err}
\right)
$$

Using the definition of $f$ from above, $f(T/2)=\text{startRateAtTarget} \cdot e^{\text{speed} \cdot T/2}$, so:

$$
\mathrm{avg} \approx \text{curve}\left(
\frac{\tfrac{\text{startRateAtTarget} + \text{endRateAtTarget}}{2} + \text{startRateAtTarget} \cdot e^{\text{speed} \cdot T/2}}{2},
\mathrm{err}
\right)
$$

Distribute the denominators (exactly the last line of the comment):

$$
\mathrm{avg} \approx \text{curve}\left(
\frac{\text{startRateAtTarget} + \text{endRateAtTarget} + 2\cdot \text{startRateAtTarget} \cdot e^{\text{speed} \cdot T/2}}{4},
\mathrm{err}
\right)
$$

At the implementation level, the contract computes the midpoint term as `midRateAtTarget`:

```solidity
endRateAtTarget = _newRateAtTarget(startRateAtTarget, linearAdaptation);
int256 midRateAtTarget = _newRateAtTarget(startRateAtTarget, linearAdaptation / 2);
avgRateAtTarget = (startRateAtTarget + endRateAtTarget + 2 * midRateAtTarget) / 4;
```

Note: in the contract, `_newRateAtTarget(start, x)` computes `start * exp(x)` and then clamps to `[MIN_RATE_AT_TARGET, MAX_RATE_AT_TARGET]`. The comment’s `startRateAtTarget*exp(...)` is the unclamped expression; the clamp only changes the math if the bounds are hit.
