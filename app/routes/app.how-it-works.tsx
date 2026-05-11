export default function HowItWorks() {
  return (
    <s-box padding="large">
      <s-stack gap="large">
        {/* Page header */}
        <s-stack gap="small-300">
          <s-heading variant="headingXl">How StockSense Works</s-heading>
          <s-text color="subdued">
            StockSense uses statistical forecasting to predict when you'll run
            out of stock and how much buffer to keep. Here's every calculation
            behind the numbers you see.
          </s-text>
        </s-stack>

        {/* Constants */}
        <Section title="Constants">
          <s-text color="subdued">
            Two constants drive every calculation. They're fixed unless you
            change your target service level.
          </s-text>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <Th>Constant</Th>
                  <Th>Value</Th>
                  <Th>Meaning</Th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <Td>
                    <Code>α (alpha)</Code>
                  </Td>
                  <Td>0.3</Td>
                  <Td>EWMA smoothing factor</Td>
                </tr>
                <tr>
                  <Td>
                    <Code>Z</Code>
                  </Td>
                  <Td>1.645</Td>
                  <Td>Service level z-score (95%)</Td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* 1. Sales Velocity */}
        <Section title="1. Sales Velocity (EWMA)" badge="units / day">
          <s-text>
            The current estimated daily sales rate for a SKU, weighted toward
            recent data. Older sales matter less — a spike from 3 weeks ago
            won't distort today's forecast.
          </s-text>
          <Formula>V_t = α × S_t + (1 − α) × V_&#8203;t−1</Formula>
          <VariableList
            rows={[
              ["V_t", "Velocity this period (units/day)"],
              ["S_t", "Actual sales observed this period"],
              ["V_t−1", "Velocity from the previous period"],
              ["α = 0.3", "30% weight on the latest observation, 70% on history"],
            ]}
          />
          <Insight>
            A sale yesterday counts for 30%, two days ago 21%, three days ago
            14.7% — weights decay geometrically. This makes the forecast
            responsive without overreacting to single-day noise.
          </Insight>
        </Section>

        {/* 2. Demand Variability */}
        <Section title="2. Demand Variability (σ)" badge="units / day">
          <s-text>
            How erratic daily demand is for a SKU. High σ means unpredictable
            sales — you need more buffer stock to stay safe.
          </s-text>
          <Formula>σ = √[ (1/n) × Σ(S_i − V̄)² ]</Formula>
          <VariableList
            rows={[
              ["σ", "Standard deviation of daily sales"],
              ["S_i", "Actual sales on day i"],
              ["V̄", "Mean sales over the lookback window (EWMA velocity)"],
              ["n", "Number of days in the lookback window"],
            ]}
          />
          <Insight>
            σ = 5 means sales typically land within ±5 units of the average on
            any given day. Large σ = more safety stock needed.
          </Insight>
        </Section>

        {/* 3. Safety Stock */}
        <Section title="3. Safety Stock" badge="units">
          <s-text>
            Buffer inventory held to absorb demand spikes or supplier delays
            during the replenishment lead time. This is the floor — dropping
            below it means active stockout risk.
          </s-text>
          <Formula>SS = Z × σ × √(lead_time)</Formula>
          <VariableList
            rows={[
              ["Z = 1.645", "Z-score for 95% service level"],
              ["σ", "Demand standard deviation (units/day)"],
              ["lead_time", "Supplier lead time (days)"],
            ]}
          />
          <Insight>
            Why √lead_time and not lead_time? Each day's demand is independent.
            Variances add linearly over L days (total variance = L × σ²), but
            safety stock uses standard deviation — converting back requires a
            square root. Doubling lead time increases safety stock by √2 ≈
            1.41×, not 2×.
          </Insight>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <Th>Service Level</Th>
                  <Th>Z-score</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["90%", "1.282"],
                  ["95%", "1.645 (StockSense default)"],
                  ["98%", "2.054"],
                  ["99%", "2.326"],
                ].map(([level, z]) => (
                  <tr key={level} className="border-b border-gray-100">
                    <Td>{level}</Td>
                    <Td>{z}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 4. Cycle Stock */}
        <Section title="4. Cycle Stock" badge="units">
          <s-text>
            Inventory needed to cover expected (average) demand during the lead
            time — before accounting for any uncertainty. Pure deterministic
            math, no statistics.
          </s-text>
          <Formula>CS = V × lead_time</Formula>
          <VariableList
            rows={[
              ["V", "Current EWMA velocity (units/day)"],
              ["lead_time", "Supplier lead time (days)"],
            ]}
          />
          <Insight>
            If you sell 10 units/day and your supplier takes 7 days, you need
            70 units on hand when you place the order just to cover normal
            expected demand while you wait.
          </Insight>
        </Section>

        {/* 5. Reorder Point */}
        <Section title="5. Reorder Point (ROP)" badge="units">
          <s-text>
            The inventory level at which a purchase order must be placed.
            When stock drops to or below this number, order immediately.
          </s-text>
          <Formula>ROP = (V × lead_time) + (Z × σ × √lead_time)</Formula>
          <VariableList
            rows={[
              ["V × lead_time", "Cycle stock — covers expected demand during lead time"],
              ["Z × σ × √lead_time", "Safety stock — covers unexpected demand spikes"],
            ]}
          />
          <Insight>
            By the time the shipment arrives, remaining stock will have dipped
            toward the safety stock floor. The new order restores the full
            operating level right on time.
          </Insight>
        </Section>

        {/* 6. Status Classification */}
        <Section title="6. Status Classification">
          <s-text>
            Every SKU is assigned one of three statuses based on where current
            stock sits relative to safety stock and ROP. Evaluated in order.
          </s-text>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <Th>Status</Th>
                  <Th>Condition</Th>
                  <Th>Meaning</Th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <Td>
                    <s-badge tone="critical">CRITICAL</s-badge>
                  </Td>
                  <Td>
                    <Code>stock ≤ SS</Code>
                  </Td>
                  <Td>
                    Below statistical buffer — stockout risk is active right now
                  </Td>
                </tr>
                <tr className="border-b border-gray-100">
                  <Td>
                    <s-badge tone="caution">REORDER</s-badge>
                  </Td>
                  <Td>
                    <Code>SS &lt; stock ≤ ROP</Code>
                  </Td>
                  <Td>
                    Order must be placed immediately or safety stock will be
                    consumed before arrival
                  </Td>
                </tr>
                <tr>
                  <Td>
                    <s-badge tone="success">OK</s-badge>
                  </Td>
                  <Td>
                    <Code>stock &gt; ROP</Code>
                  </Td>
                  <Td>
                    Sufficient inventory through the next replenishment cycle
                  </Td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* Quick reference */}
        <Section title="Quick Reference">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <Th>Concept</Th>
                  <Th>Formula</Th>
                  <Th>Unit</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["EWMA velocity", "α·S_t + (1−α)·V_t−1", "units/day"],
                  ["Demand σ", "√[ (1/n)·Σ(S_i − V̄)² ]", "units/day"],
                  ["Safety stock", "Z × σ × √L", "units"],
                  ["Cycle stock", "V × L", "units"],
                  ["Reorder point", "V·L + Z·σ·√L", "units"],
                  ["CRITICAL", "stock ≤ SS", "—"],
                  ["REORDER", "SS < stock ≤ ROP", "—"],
                  ["OK", "stock > ROP", "—"],
                ].map(([concept, formula, unit]) => (
                  <tr key={concept} className="border-b border-gray-100">
                    <Td>{concept}</Td>
                    <Td>
                      <Code>{formula}</Code>
                    </Td>
                    <Td className="text-gray-400">{unit}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <s-text color="subdued" className="mt-2">
            Defaults: α = 0.3 · Z = 1.645 (95% service level)
          </s-text>
        </Section>
      </s-stack>
    </s-box>
  );
}

// ── Small layout helpers ───────────────────────────────────────────────────────

function Section({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <s-box background="base" borderRadius="base" padding="large">
      <s-stack gap="base">
        <div className="flex items-center gap-2">
          <s-heading variant="headingMd">{title}</s-heading>
          {badge && (
            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              {badge}
            </span>
          )}
        </div>
        {children}
      </s-stack>
    </s-box>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-800">
      {children}
    </div>
  );
}

function VariableList({ rows }: { rows: [string, string][] }) {
  return (
    <ul className="mt-1 space-y-1">
      {rows.map(([variable, desc]) => (
        <li key={variable} className="flex gap-2 text-sm">
          <Code className="shrink-0">{variable}</Code>
          <span className="text-gray-600">— {desc}</span>
        </li>
      ))}
    </ul>
  );
}

function Insight({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 mt-1 p-3 bg-blue-50 border border-blue-100 rounded-lg">
      <span className="text-blue-400 mt-0.5 shrink-0">💡</span>
      <p className="text-sm text-blue-800">{children}</p>
    </div>
  );
}

function Code({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <code
      className={`font-mono text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded ${className ?? ""}`}
    >
      {children}
    </code>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-4">
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`py-2 pr-4 text-gray-700 align-top ${className ?? ""}`}>
      {children}
    </td>
  );
}
