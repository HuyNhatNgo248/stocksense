# StockSense — Core Concepts Reference

This document defines every mathematical concept used in StockSense. Use it as the authoritative reference for implementing forecasting, safety stock, reorder logic, and status classification.

---

## Constants (StockSense defaults)

| Constant | Value | Meaning |
| --- | --- | --- |
| `α` (alpha) | `0.3` | EWMA smoothing factor |
| `Z` | `1.645` | Service level z-score (95%) |

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
- `α = 0.3` — smoothing factor; how much weight to give the latest observation

**How it works:** Each new estimate is 30% the latest observation and 70% the accumulated history. Older observations decay geometrically — the weight on a sale k periods ago is `α × (1-α)^k`. At α=0.3: yesterday = 0.30, two days ago = 0.21, three days ago = 0.147, and so on.

**Implementation note:** Seed `V_0` with the simple average of the first 7–14 days of data before running EWMA forward.

**TypeScript utility:**

```ts
export function ewmaStep(prevVelocity: number, currentSales: number, alpha = 0.3): number {
  return alpha * currentSales + (1 - alpha) * prevVelocity;
}
```

---

## 2. Demand Variability — Standard Deviation (σ)

**What it is:** How erratic (unpredictable) daily demand is for a SKU.

**Formula:**

```text
σ = √[ (1/n) × Σ(S_i - V̄)² ]
```

**Components:**

- `σ` — standard deviation of daily sales (units/day)
- `S_i` — actual sales on day i
- `V̄` — mean sales over the lookback window (use EWMA velocity)
- `n` — number of days in the lookback window

**How it works:**

1. Compute each day's error from the mean: `S_i - V̄`
2. Square each error (negatives and positives become positive, large errors penalized more)
3. Average the squared errors → this is **variance** (units²)
4. Take the square root → back to real units (units/day)

**Intuition:** σ = 5 means on a typical day, sales land within roughly ±5 units of the mean. Large σ = volatile demand = more safety stock needed.

**TypeScript utility:**

```ts
export function demandStdDev(sales: number[], meanVelocity: number): number {
  if (sales.length === 0) return 0;
  const variance = sales.reduce((sum, s) => sum + (s - meanVelocity) ** 2, 0) / sales.length;
  return Math.sqrt(variance);
}
```

---

## 3. Safety Stock

**What it is:** The buffer inventory held to absorb demand spikes or supplier delays during the replenishment lead time. Protects against stockouts during the uncertain window between placing and receiving an order.

**Formula:**

```text
SS = Z × σ × √(lead_time)
```

**Components:**

- `SS` — safety stock (units)
- `Z = 1.645` — z-score for 95% service level
- `σ` — demand standard deviation (units/day)
- `lead_time` — supplier lead time (days)

**Why √(lead_time) and not just lead_time:**
Each day's demand is independent. When you add L independent random variables, their variances add:

```text
Total variance over L days = L × σ²
Total std dev over L days  = √(L × σ²) = σ × √L
```

The square root appears because variance adds linearly, but you need std dev (not variance) — and converting variance back to std dev requires a square root. Doubling lead time increases safety stock by √2 ≈ 1.41×, not 2×.

**What Z does:** Maps the desired service level to a statistical coverage multiple using the standard normal distribution. At Z=1.645, you cover 95% of all possible demand outcomes during the lead time window.

| Service Level | Z-score |
| --- | --- |
| 90% | 1.282 |
| 95% | 1.645 |
| 98% | 2.054 |
| 99% | 2.326 |

**TypeScript utility:**

```ts
export function safetyStock(z: number, sigma: number, leadTimeDays: number): number {
  return Math.round(z * sigma * Math.sqrt(leadTimeDays));
}
```

---

## 4. Cycle Stock

**What it is:** The inventory needed to cover expected (average) demand during the lead time — before accounting for any uncertainty.

**Formula:**

```text
CS = V × lead_time
```

**Components:**

- `CS` — cycle stock (units)
- `V` — current EWMA velocity (units/day)
- `lead_time` — supplier lead time (days)

**Intuition:** If you sell 10 units/day and your supplier takes 7 days, you need at least 70 units on hand when you place the order just to cover normal expected sales while you wait. This is purely deterministic — no statistics involved.

---

## 5. Reorder Point (ROP)

**What it is:** The inventory level at which a purchase order must be placed to ensure stock arrives before you run out, even under adverse demand conditions.

**Formula:**

```text
ROP = CS + SS
    = (V × lead_time) + (Z × σ × √lead_time)
```

**Components:**

- `V × lead_time` — covers expected demand during lead time (cycle stock)
- `Z × σ × √lead_time` — covers unexpected demand spikes (safety stock)

**How to use it:** When `current_stock` drops to or below `ROP`, place a purchase order immediately. By the time the shipment arrives (after `lead_time` days), remaining stock will have dipped toward the safety stock floor — and the new stock restores full operating level.

**TypeScript utility:**

```ts
export function reorderPoint(
  velocity: number,
  leadTimeDays: number,
  z: number,
  sigma: number
): number {
  const cycleStock = velocity * leadTimeDays;
  const ss = safetyStock(z, sigma, leadTimeDays);
  return Math.round(cycleStock + ss);
}
```

---

## 6. Inventory Status Classification

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

**TypeScript utility:**

```ts
export type StockStatus = 'CRITICAL' | 'REORDER' | 'OK';

export function classifyStatus(
  currentStock: number,
  ss: number,
  rop: number
): StockStatus {
  if (currentStock <= ss) return 'CRITICAL';
  if (currentStock <= rop) return 'REORDER';
  return 'OK';
}
```

---

## 7. Full Pipeline

```text
Shopify sales data (S_t)
        │
        ▼
  EWMA velocity (V_t)          Demand std dev (σ)
        │                              │
        ├──────────── × lead_time      ├──── × Z × √lead_time
        │                              │
        ▼                              ▼
   Cycle stock (CS)          Safety stock (SS)
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
```

---

## Quick Reference

| Concept | Formula | Unit |
| --- | --- | --- |
| EWMA velocity | `α·S_t + (1-α)·V_{t-1}` | units/day |
| Demand σ | `√[ (1/n)·Σ(S_i - V̄)² ]` | units/day |
| Safety stock | `Z × σ × √L` | units |
| Cycle stock | `V × L` | units |
| Reorder point | `V·L + Z·σ·√L` | units |
| CRITICAL | `stock ≤ SS` | — |
| REORDER | `SS < stock ≤ ROP` | — |
| OK | `stock > ROP` | — |

**Defaults:** α = 0.3 · Z = 1.645 (95% service level)
