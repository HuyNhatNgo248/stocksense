import { useEffect, useMemo } from "react";
import { useFetcher } from "react-router";
import {
  ComposedChart,
  Bar,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Forecast, VelocityHistory } from "@/lib/api.server";

interface ProductDetailPanelProps {
  forecast: Forecast;
  onClose: () => void;
}

// ── Primitives ────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
      {children}
    </p>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <s-text color="subdued">{label}</s-text>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

// ── Sections ──────────────────────────────────────────────────────────────────

function PanelHeader({
  title,
  sku,
  onClose,
}: {
  title: string;
  sku: string;
  onClose: () => void;
}) {
  return (
    <div className="flex justify-between items-start gap-2">
      <s-stack gap="small-400">
        <s-heading>{title}</s-heading>
        <s-text color="subdued">{sku}</s-text>
      </s-stack>
      <s-button
        variant="tertiary"
        icon="x"
        accessibilityLabel="Close panel"
        onClick={onClose}
      />
    </div>
  );
}

function StockMetrics({
  currentStock,
  safetyStock,
  reorderPoint,
  leadTime,
  velocity,
}: {
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  leadTime: number;
  velocity: string;
}) {
  return (
    <s-stack gap="small-300">
      <SectionLabel>Stock Metrics</SectionLabel>
      <MetricRow label="Current stock" value={`${currentStock} units`} />
      <MetricRow label="Safety stock" value={`${safetyStock} units`} />
      <MetricRow label="Reorder point" value={`${reorderPoint} units`} />
      <MetricRow label="Lead time" value={`${leadTime} days`} />
      <MetricRow label="Avg velocity" value={`${velocity} units/day`} />
    </s-stack>
  );
}

function ForecastFormula({
  velocity,
  stddev,
  leadTime,
  safetyStock,
  reorderPoint,
}: {
  velocity: string;
  stddev: string;
  leadTime: number;
  safetyStock: number;
  reorderPoint: number;
}) {
  return (
    <s-stack gap="small-300">
      <SectionLabel>Forecast Formula</SectionLabel>
      <div
        className="rounded-lg p-3 text-xs leading-relaxed font-mono"
        style={{
          background: "var(--s-color-bg-surface-secondary, #f6f6f7)",
          color: "#4f46e5",
        }}
      >
        <div>
          μ = {velocity}, σ = {stddev}, L = {leadTime}
        </div>
        <div>
          Safety = 1.645 × {stddev} × √{leadTime} = {safetyStock}
        </div>
        <div>
          ROP = {velocity} × {leadTime} + {safetyStock} = {reorderPoint}
        </div>
      </div>
    </s-stack>
  );
}

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}`;
}

function VelocityTrend({ data }: { data: VelocityHistory }) {
  const avg = useMemo(() => {
    const sold = data
      .filter((d) => d.unitsSold != null)
      .map((d) => d.unitsSold as number);
    return sold.length ? sold.reduce((a, b) => a + b, 0) / sold.length : 0;
  }, [data]);

  return (
    <div>
      <div className="flex gap-3 mb-2 flex-wrap text-[10px] text-gray-600">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-green-500" />
          Daily Sales
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 border-t-2 border-yellow-400" />
          EWMA
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 border-t-2 border-dashed border-blue-400" />
          Average (μ = {avg.toFixed(2)})
        </span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <ComposedChart
          data={data}
          margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 9 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 9 }} />
          <Tooltip
            contentStyle={{
              fontSize: 11,
              padding: "4px 8px",
              borderRadius: 4,
              border: "1px solid #e5e7eb",
            }}
            formatter={(value, name) => [
              value == null
                ? "—"
                : typeof value === "number"
                  ? value.toFixed(2)
                  : value,
              name === "ewmaVelocity"
                ? "EWMA"
                : name === "unitsSold"
                  ? "Daily Sales"
                  : String(name),
            ]}
            labelFormatter={(l) => (typeof l === "string" ? formatDate(l) : l)}
          />
          <Bar dataKey="unitsSold" fill="#22c55e" maxBarSize={10} />
          <Line
            type="monotone"
            dataKey="ewmaVelocity"
            stroke="#eab308"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
          <ReferenceLine
            y={avg}
            stroke="#60a5fa"
            strokeDasharray="4 3"
            strokeWidth={1.5}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrendSection({ variantId }: { variantId: string }) {
  const fetcher = useFetcher<VelocityHistory>();

  useEffect(() => {
    fetcher.submit(
      { variantId },
      {
        method: "post",
        action: "/app/velocity-history",
        encType: "application/json",
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantId]);

  return (
    <s-stack gap="small-300">
      <SectionLabel>30-Day Trend</SectionLabel>
      <div
        className="rounded-lg p-2"
        style={{ background: "var(--s-color-bg-surface-secondary, #f6f6f7)" }}
      >
        {fetcher.state !== "idle" || !fetcher.data ? (
          <div className="h-48 w-full rounded animate-pulse bg-gray-200" />
        ) : (
          <VelocityTrend data={fetcher.data} />
        )}
      </div>
    </s-stack>
  );
}

function PanelActions() {
  return (
    <s-stack gap="small-300">
      <SectionLabel>Actions</SectionLabel>
      <s-button variant="primary" icon="receipt">
        Create Purchase Order
      </s-button>
      <s-button variant="secondary" icon="info">
        Explain Calculation
      </s-button>
      <s-button variant="secondary" icon="chart-stacked">
        View Demand History
      </s-button>
    </s-stack>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function ProductDetailPanel({
  forecast,
  onClose,
}: ProductDetailPanelProps) {
  const { product } = forecast;
  const safetyStock = Math.round(forecast.safetyStock);
  const reorderPoint = Math.round(forecast.reorderPoint);
  const velocity = forecast.velocityPerDay.toFixed(2);
  const stddev = forecast.stddevDemand.toFixed(1);

  return (
    <s-box background="base" borderRadius="base" padding="base">
      <s-stack gap="base">
        <PanelHeader
          title={product.title}
          sku={product.sku}
          onClose={onClose}
        />
        <s-divider />
        <StockMetrics
          currentStock={product.currentStock}
          safetyStock={safetyStock}
          reorderPoint={reorderPoint}
          leadTime={product.leadTimeDays}
          velocity={velocity}
        />
        <s-divider />
        <ForecastFormula
          velocity={velocity}
          stddev={stddev}
          leadTime={product.leadTimeDays}
          safetyStock={safetyStock}
          reorderPoint={reorderPoint}
        />
        <s-divider />
        <TrendSection variantId={product.shopifyVariantId} />
        <s-divider />
        <PanelActions />
      </s-stack>
    </s-box>
  );
}
