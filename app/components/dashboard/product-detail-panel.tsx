import type { Forecast } from "@/lib/api.server";

interface ProductDetailPanelProps {
  forecast: Forecast;
  onClose: () => void;
}

const MOCK_TREND = [
  0.6, 0.7, 0.65, 0.8, 0.75, 0.9, 0.85, 0.7, 0.8, 0.95, 0.85, 0.9, 0.75, 0.8,
  0.85, 0.7, 0.65, 0.8, 0.9, 0.85, 0.8, 0.9, 0.95, 1.0, 0.9, 0.85, 0.9, 0.95,
  1.0, 0.95,
];

function Sparkline({ data }: { data: number[] }) {
  const w = 240;
  const h = 56;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const area = `0,${h} ${pts} ${w},${h}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      style={{ height: `${h}px` }}
    >
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sg)" />
      <polyline
        points={pts}
        fill="none"
        stroke="#6366f1"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

export function ProductDetailPanel({
  forecast,
  onClose,
}: ProductDetailPanelProps) {
  const { product } = forecast;
  const safetyStock = Math.round(forecast.safetyStock);
  const reorderPoint = Math.round(forecast.reorderPoint);
  const velocity = forecast.velocityPerDay.toFixed(2);
  const stddev = forecast.stddevDemand.toFixed(1);
  const leadTime = product.leadTimeDays;

  return (
    <s-box background="base" borderRadius="base" padding="base">
      <s-stack gap="base">
        {/* Header */}
        <div className="flex justify-between items-start gap-2">
          <s-stack gap="small-400">
            <s-heading>{product.title}</s-heading>
            <s-text color="subdued">{product.sku}</s-text>
          </s-stack>
          <s-button
            variant="tertiary"
            icon="x-circle"
            accessibilityLabel="Close panel"
            onClick={onClose}
          />
        </div>

        <s-divider />

        {/* Stock Metrics */}
        <s-stack gap="small-300">
          <SectionLabel>Stock Metrics</SectionLabel>
          <MetricRow
            label="Current stock"
            value={`${product.currentStock} units`}
          />
          <MetricRow label="Safety stock" value={`${safetyStock} units`} />
          <MetricRow label="Reorder point" value={`${reorderPoint} units`} />
          <MetricRow label="Lead time" value={`${leadTime} days`} />
          <MetricRow label="Avg velocity" value={`${velocity} units/day`} />
        </s-stack>

        <s-divider />

        {/* Forecast Formula */}
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
              ROP = {velocity}×{leadTime} + {safetyStock} = {reorderPoint}
            </div>
          </div>
        </s-stack>

        <s-divider />

        {/* 30-day trend */}
        <s-stack gap="small-300">
          <SectionLabel>30-Day Trend</SectionLabel>
          <div
            className="rounded-lg p-2"
            style={{
              background: "var(--s-color-bg-surface-secondary, #f6f6f7)",
            }}
          >
            <Sparkline data={MOCK_TREND} />
          </div>
        </s-stack>

        <s-divider />

        {/* Actions */}
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
      </s-stack>
    </s-box>
  );
}
