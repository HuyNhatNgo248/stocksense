import { useTranslation } from "react-i18next";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Card,
  DataTable,
  InlineStack,
  Page,
  Text,
} from "@shopify/polaris";

const MONO_FONT: React.CSSProperties = {
  fontFamily: "var(--p-font-family-mono, ui-monospace, monospace)",
};

export default function HowItWorks() {
  const { t } = useTranslation();

  return (
    <Page title={t("howItWorks.title")} subtitle={t("howItWorks.subtitle")}>
      <BlockStack gap="500">
        <Section title={t("howItWorks.constants")}>
          <Text as="p" tone="subdued">
            Two constants drive every calculation. They&apos;re fixed unless you
            change your target service level.
          </Text>
          <DataTable
            columnContentTypes={["text", "text", "text"]}
            headings={["Constant", "Value", "Meaning"]}
            rows={[
              [<Code key="alpha">α (alpha)</Code>, "0.3", "EWMA smoothing factor"],
              [<Code key="z">Z</Code>, "1.645", "Service level z-score (95%)"],
            ]}
          />
        </Section>

        <Section
          title={t("howItWorks.sections.velocity")}
          badge="units / day"
        >
          <Text as="p">
            The current estimated daily sales rate for a SKU, weighted toward
            recent data. Older sales matter less — a spike from 3 weeks ago
            won&apos;t distort today&apos;s forecast.
          </Text>
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

        <Section
          title={t("howItWorks.sections.variability")}
          badge="units / day"
        >
          <Text as="p">
            How erratic daily demand is for a SKU. High σ means unpredictable
            sales — you need more buffer stock to stay safe.
          </Text>
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

        <Section title={t("howItWorks.sections.safetyStock")} badge="units">
          <Text as="p">
            Buffer inventory held to absorb demand spikes or supplier delays
            during the replenishment lead time. This is the floor — dropping
            below it means active stockout risk.
          </Text>
          <Formula>SS = Z × σ × √(lead_time)</Formula>
          <VariableList
            rows={[
              ["Z = 1.645", "Z-score for 95% service level"],
              ["σ", "Demand standard deviation (units/day)"],
              ["lead_time", "Supplier lead time (days)"],
            ]}
          />
          <Insight>
            Why √lead_time and not lead_time? Each day&apos;s demand is
            independent. Variances add linearly over L days (total variance =
            L × σ²), but safety stock uses standard deviation — converting back
            requires a square root. Doubling lead time increases safety stock
            by √2 ≈ 1.41×, not 2×.
          </Insight>
          <DataTable
            columnContentTypes={["text", "text"]}
            headings={["Service Level", "Z-score"]}
            rows={[
              ["90%", "1.282"],
              ["95%", "1.645 (StockSense default)"],
              ["98%", "2.054"],
              ["99%", "2.326"],
            ]}
          />
        </Section>

        <Section title={t("howItWorks.sections.cycleStock")} badge="units">
          <Text as="p">
            Inventory needed to cover expected (average) demand during the lead
            time — before accounting for any uncertainty. Pure deterministic
            math, no statistics.
          </Text>
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

        <Section title={t("howItWorks.sections.rop")} badge="units">
          <Text as="p">
            The inventory level at which a purchase order must be placed. When
            stock drops to or below this number, order immediately.
          </Text>
          <Formula>ROP = (V × lead_time) + (Z × σ × √lead_time)</Formula>
          <VariableList
            rows={[
              [
                "V × lead_time",
                "Cycle stock — covers expected demand during lead time",
              ],
              [
                "Z × σ × √lead_time",
                "Safety stock — covers unexpected demand spikes",
              ],
            ]}
          />
          <Insight>
            By the time the shipment arrives, remaining stock will have dipped
            toward the safety stock floor. The new order restores the full
            operating level right on time.
          </Insight>
        </Section>

        <Section title={t("howItWorks.sections.status")}>
          <Text as="p">
            Every SKU is assigned one of three statuses based on where current
            stock sits relative to safety stock and ROP. Evaluated in order.
          </Text>
          <DataTable
            columnContentTypes={["text", "text", "text"]}
            headings={["Status", "Condition", "Meaning"]}
            rows={[
              [
                <Badge key="crit" tone="critical">
                  CRITICAL
                </Badge>,
                <Code key="cc">stock ≤ SS</Code>,
                "Below statistical buffer — stockout risk is active right now",
              ],
              [
                <Badge key="reo" tone="warning">
                  REORDER
                </Badge>,
                <Code key="rc">SS &lt; stock ≤ ROP</Code>,
                "Order must be placed immediately or safety stock will be consumed before arrival",
              ],
              [
                <Badge key="ok" tone="success">
                  OK
                </Badge>,
                <Code key="oc">stock &gt; ROP</Code>,
                "Sufficient inventory through the next replenishment cycle",
              ],
            ]}
          />
        </Section>

        <Section title={t("howItWorks.quickReference")}>
          <DataTable
            columnContentTypes={["text", "text", "text"]}
            headings={["Concept", "Formula", "Unit"]}
            rows={[
              [
                "EWMA velocity",
                <Code key="r1">α·S_t + (1−α)·V_t−1</Code>,
                "units/day",
              ],
              [
                "Demand σ",
                <Code key="r2">√[ (1/n)·Σ(S_i − V̄)² ]</Code>,
                "units/day",
              ],
              ["Safety stock", <Code key="r3">Z × σ × √L</Code>, "units"],
              ["Cycle stock", <Code key="r4">V × L</Code>, "units"],
              ["Reorder point", <Code key="r5">V·L + Z·σ·√L</Code>, "units"],
              ["CRITICAL", <Code key="r6">stock ≤ SS</Code>, "—"],
              ["REORDER", <Code key="r7">SS &lt; stock ≤ ROP</Code>, "—"],
              ["OK", <Code key="r8">stock &gt; ROP</Code>, "—"],
            ]}
          />
          <Text as="p" tone="subdued">
            Defaults: α = 0.3 · Z = 1.645 (95% service level)
          </Text>
        </Section>
      </BlockStack>
    </Page>
  );
}

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
    <Card>
      <BlockStack gap="400">
        <InlineStack gap="200" blockAlign="center">
          <Text as="h2" variant="headingMd">
            {title}
          </Text>
          {badge && (
            <Box
              paddingInlineStart="200"
              paddingInlineEnd="200"
              paddingBlockStart="050"
              paddingBlockEnd="050"
              background="bg-surface-secondary"
              borderRadius="100"
            >
              <span style={{ ...MONO_FONT, fontSize: 12, color: "var(--p-color-text-subdued)" }}>
                {badge}
              </span>
            </Box>
          )}
        </InlineStack>
        {children}
      </BlockStack>
    </Card>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <Box
      padding="300"
      background="bg-surface-secondary"
      borderRadius="200"
      borderColor="border"
      borderWidth="025"
    >
      <span style={{ ...MONO_FONT, fontSize: 13 }}>{children}</span>
    </Box>
  );
}

function VariableList({ rows }: { rows: [string, string][] }) {
  return (
    <BlockStack gap="100">
      {rows.map(([variable, desc]) => (
        <InlineStack key={variable} gap="200" blockAlign="start" wrap={false}>
          <Code>{variable}</Code>
          <Text as="span" tone="subdued">
            — {desc}
          </Text>
        </InlineStack>
      ))}
    </BlockStack>
  );
}

function Insight({ children }: { children: React.ReactNode }) {
  return (
    <Banner tone="info">
      <p>{children}</p>
    </Banner>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        ...MONO_FONT,
        fontSize: 12,
        background: "var(--p-color-bg-surface-secondary)",
        padding: "2px 6px",
        borderRadius: 4,
        color: "var(--p-color-text)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
