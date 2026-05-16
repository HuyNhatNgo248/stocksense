# StockSense — Core Concepts Reference

This document defines every mathematical concept used in StockSense. Use it as the authoritative reference for implementing forecasting, safety stock, reorder logic, and status classification.

---

## Constants (StockSense defaults)

| Constant | Value | Meaning |
| --- | --- | --- |
| `α` (alpha) | per-product (auto-tuned 0.1–0.5, fallback 0.3) | EWMA smoothing factor |
| `Z` | `1.645` | Service level z-score (95%) |
| `R` (review_period) | `30` days (configurable) | How often the merchant plans to reorder; drives suggested order quantity |
| Lookback window | `180 days` | Sales history used for all calculations |

---

## 1. Sales Velocity — EWMA

**What it is:** The current estimated daily sales rate for a SKU, weighted toward recent data.

**Formula:**

```text
V_t = α × S_t + (1 - α) × V_{t-1}
```

**Components:**

- `V_t` — velocity this period (units/day)
- `S_t` — actual sales observed this period (units)
- `V_{t-1}` — velocity from the previous period (units/day)
- `α` — smoothing factor; how much weight to give the latest observation

**How it works:** Each new estimate is `α` × the latest observation and `(1-α)` × accumulated history. Older observations decay geometrically — the weight on a sale k periods ago is `α × (1-α)^k`. At α=0.3: yesterday = 0.30, two days ago = 0.21, three days ago = 0.147, and so on.

**Implementation note:** Seed `V_0` with the simple average of the first 14 days of data before running EWMA forward.

**TypeScript utility:**

```ts
export function ewmaStep(prevVelocity: number, currentSales: number, alpha: number): number {
  return alpha * currentSales + (1 - alpha) * prevVelocity;
}
```

---

## 2. Alpha Auto-Tuning

**What it is:** Per-product grid search that picks the `α` minimising Mean Absolute Percentage Error (MAPE) on the product's own sales history, rather than using a single global constant.

**Candidates:** `[0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5]`

**Requires:** ≥ 28 days of history. Falls back to the shop's configured default otherwise.

**How it works:**

1. For each candidate α, run EWMA forward using the first 14 days as seed.
2. Compute MAPE on all subsequent non-zero-sale days.
3. Select the α with the lowest MAPE.

**Why it matters:** A slow-moving SKU (1–2 sales/week) benefits from a low α (0.1–0.2) that trusts history more; a rapidly growing product benefits from a high α (0.4–0.5) that reacts faster to recent trends. A fixed global α of 0.3 will overfit one and underfit the other.

---

## 3. Demand Variability — Exponentially Weighted Standard Deviation (σ)

**What it is:** How erratic (unpredictable) daily demand is for a SKU, with more weight on recent variation.

**Formula:**

```text
diff_t  = S_t - mean_{t-1}
mean_t  = α × S_t + (1-α) × mean_{t-1}
var_t   = (1-α) × (var_{t-1} + α × diff_t²)
σ       = √var_T
```

**Key differences from simple σ:**

- **Zero-sale days are excluded.** A day with zero sales may reflect a stockout or store closure, not genuine demand — including it would inflate σ and over-pad safety stock.
- **Exponential weighting.** Recent variance matters more than variance from 6 months ago. Safety stock tightens for products that have stabilised and widens for products becoming more volatile.

**Intuition:** σ = 5 means on a typical selling day, sales land within roughly ±5 units of the mean. Large σ = volatile demand = more safety stock needed.

---

## 4. Safety Stock

**What it is:** The buffer inventory held to absorb demand spikes or supplier delays during the replenishment lead time.

**Formula:**

```text
SS = Z × σ × √(lead_time)
```

**Components:**

- `SS` — safety stock (units)
- `Z = 1.645` — z-score for 95% service level
- `σ` — exponentially weighted demand standard deviation (units/day)
- `lead_time` — supplier lead time (days)

**Why √(lead_time) and not just lead_time:**
Each day's demand is independent. When you add L independent random variables, their variances add:

```text
Total variance over L days = L × σ²
Total std dev over L days  = √(L × σ²) = σ × √L
```

Doubling lead time increases safety stock by √2 ≈ 1.41×, not 2×.

**Service level reference:**

| Service Level | Z-score |
| --- | --- |
| 90% | 1.282 |
| 95% | 1.645 |
| 98% | 2.054 |
| 99% | 2.326 |

---

## 5. Cycle Stock & Day-of-Week Adjusted Lead Time Demand

**What it is:** The inventory needed to cover expected demand during the lead time window, adjusted for weekly sales patterns.

**Flat formula (no DOW data):**

```text
CS = V × lead_time
```

**DOW-adjusted formula (what StockSense actually uses):**

```text
CS = Σ_{i=1}^{lead_time} ( V × dow_multiplier[day_of_week(today + i)] )
```

**Day-of-week multipliers:**

```text
dow_multiplier[d] = avg_sales_on_weekday_d / overall_daily_avg
```

A Sunday with historically 40% of average traffic gets `dow_multiplier = 0.4`. If lead time spans 3 Sundays and 4 Mondays, the reorder point reflects that pattern rather than assuming every day is identical.

**Intuition:** A retailer that sells 3× more on weekends should hold more stock going into a Friday than a Monday. Flat `V × lead_time` systematically under-orders for high-traffic arrival windows.

---

## 6. Reorder Point (ROP)

**What it is:** The inventory level at which a purchase order must be placed to ensure stock arrives before running out, even under adverse demand conditions.

**Formula:**

```text
ROP = CS + SS
    = DOW-adjusted lead time demand + (Z × σ × √lead_time)
```

**How to use it:** When `current_stock` drops to or below `ROP`, place a purchase order immediately. By the time the shipment arrives, remaining stock will have dipped toward the safety stock floor — and the new stock restores full operating level.

---

## 6a. Suggested Order Quantity (Order-up-to / (s, S) policy)

**What it is:** When an alert fires (status is `CRITICAL` or `REORDER`), this is how many units the merchant should actually order — not just the threshold (ROP), but the quantity that brings inventory back to a sensible target after the shipment arrives.

**Formula:**

```text
target_stock     = V × (lead_time + review_period) + SS
suggested_order  = max(0, target_stock - current_stock)
```

**Components:**

- `V × lead_time` — demand while waiting for the order to arrive
- `V × review_period` — demand until the next reorder is placed
- `SS` — safety stock buffer to maintain at all times
- `− current_stock` — already on hand, only order the gap

**How it works:**

1. Compute `target_stock` — the level we want to "order up to" so post-arrival inventory lasts through `review_period` plus keeps a safety buffer.
2. Subtract what's already on the shelf so we only order the missing amount.
3. Clamp at zero — if current stock already exceeds the target, no order is suggested.

**Worked example:** `V = 5 units/day`, `L = 7 days`, `R = 30 days`, `SS = 12`, `current_stock = 30`.

- `target_stock = 5 × (7 + 30) + 12 = 197`
- `suggested_order = max(0, 197 − 30) = 167 units`
- 7 days later, ~35 units sell during lead time → on-hand becomes `30 − 35 + 167 = 162`
- That ~162-unit level then drains at 5/day → hits ROP (`47`) ~23 days later
- Total cycle ≈ 7 (lead) + 23 (runway) = 30 days ✓ — matches the configured review period

**TypeScript utility:**

```ts
export function suggestedOrderQty(
  velocity: number,
  leadTimeDays: number,
  reviewPeriodDays: number,
  safetyStock: number,
  currentStock: number,
): number {
  const targetStock =
    velocity * (leadTimeDays + reviewPeriodDays) + safetyStock;
  return Math.max(0, Math.round(targetStock - currentStock));
}
```

**Tuning `review_period`:** shorter = more frequent, smaller orders (lower carrying cost, more ordering overhead). Longer = fewer, larger orders (lower ordering overhead, higher carrying cost). 30 days is the default; merchants can override in Settings.

---

## 7. Inventory Status Classification

**What it is:** A three-tier signal assigned to every SKU based on where current stock sits relative to safety stock and ROP.

**Rules (evaluated in order):**

```text
if current_stock <= safety_stock   → CRITICAL
if current_stock <= ROP            → REORDER
else                               → OK
```

**Tier definitions:**

| Status | Condition | Meaning |
| --- | --- | --- |
| `CRITICAL` | `stock ≤ SS` | Below statistical buffer — stockout risk is active right now |
| `REORDER` | `SS < stock ≤ ROP` | Order must be placed immediately or safety stock will be consumed before arrival |
| `OK` | `stock > ROP` | Sufficient inventory through the next replenishment cycle |

---

## 8. Forecast Accuracy (MAPE-based)

**What it is:** A 0–100 score representing how closely the EWMA forecast tracked actual sales over the lookback window.

**Formula:**

```text
MAPE  = (1/n) × Σ |actual_t - forecast_t| / actual_t   (non-zero days only)
score = max(0, (1 - MAPE) × 100)
```

**Interpretation:** A score of 85 means the forecast was off by ~15% on average. Scores below 60 indicate the product has high unpredictability or insufficient history.

---

## 9. Mark as Ordered (Alert Snooze)

**What it is:** A merchant-controlled flag that suppresses an alert until the expected stock arrival date.

**Behaviour:**

- Stored per product as `{ expectedArrivalDate, snoozedAt }`.
- The daily email digest skips any product with an active snooze (`expectedArrivalDate ≥ today`).
- The forecasts API returns `markOrdered: { expectedArrivalDate, snoozedAt } | null` on every forecast row so the frontend can hide or dim the alert.
- Once `expectedArrivalDate` passes, the alert reappears automatically — if stock didn't arrive, it becomes a real alert again.

---

## 10. Full Pipeline

```text
Shopify sales data (S_t, 180-day window)
        │
        ├─── alpha auto-tune (grid search MAPE, per product)
        │
        ▼
  EWMA velocity (V_t)       Exp. weighted σ (zero days excluded)
        │                              │
        ├── DOW multipliers applied    ├──── × Z × √lead_time
        │   over lead time window      │
        ▼                              ▼
  DOW-adjusted CS              Safety stock (SS)
        │                              │
        └──────────────┬───────────────┘
                       ▼
               Reorder point (ROP)
                       │
        ┌──────────────┘
        │  + current stock (from Shopify inventory API)
        ▼
  Status classification
  CRITICAL / REORDER / OK
        │
        ▼
  Mark as Ordered? → suppress alert until expectedArrivalDate
```

---

## Quick Reference

| Concept | Formula | Unit |
| --- | --- | --- |
| EWMA velocity | `α·S_t + (1-α)·V_{t-1}` | units/day |
| Best alpha | grid search MAPE over [0.1…0.5] | — |
| Demand σ | exp. weighted, zero days excluded | units/day |
| Safety stock | `Z × σ × √L` | units |
| Cycle stock | `Σ V × dow_mult[d]` over lead time | units |
| Reorder point | `CS + SS` | units |
| Suggested order | `max(0, V·(L+R) + SS − stock)` | units |
| CRITICAL | `stock ≤ SS` | — |
| REORDER | `SS < stock ≤ ROP` | — |
| OK | `stock > ROP` | — |
| Accuracy | `max(0, (1 - MAPE) × 100)` | 0–100 |

**Defaults:** Z = 1.645 (95% service level) · Lookback = 180 days · Alpha fallback = 0.3 · R = 30 days (review period)
