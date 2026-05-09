import type { ForecastMetrics } from "@/lib/api.server";

interface QuickStatsProps {
  metrics: ForecastMetrics;
}

export function QuickStats({ metrics }: QuickStatsProps) {
  return (
    <s-grid
      gridTemplateColumns="@container (inline-size <= 400px) 1fr, 1fr auto 1fr auto 1fr auto 1fr"
      gap="small"
    >
      <StatCard
        title="Critical"
        description="SKUs at or below safety stock with active stockout risk"
        value={String(metrics.critical)}
        delta={metrics.delta.criticalSinceYesterday}
        deltaLabel="since yesterday"
        invertDelta
      />
      <s-divider direction="block" />
      <StatCard
        title="Reorder Soon"
        description="SKUs between safety stock and reorder point that need a PO placed now"
        value={String(metrics.reorder)}
        delta={metrics.delta.reorderSinceLastWeek}
        deltaLabel="this week"
        invertDelta
      />
      <s-divider direction="block" />
      <StatCard
        title="Total SKUs"
        description="Total number of products being tracked and forecasted"
        value={String(metrics.total)}
        delta={metrics.delta.skusAddedThisMonth}
        deltaLabel="this month"
      />
      <s-divider direction="block" />
      <StatCard
        title="Forecast Accuracy"
        description="How closely EWMA velocity predictions match actual daily sales"
        value={`${metrics.forecastAccuracy.toFixed(2)}%`}
        delta={metrics.delta.accuracyVsLastMonth}
        deltaLabel="vs last month"
        deltaSuffix="%"
      />
    </s-grid>
  );
}

interface StatCardProps {
  title: string;
  description: string;
  value: string;
  delta: number | null;
  deltaLabel: string;
  deltaSuffix?: string;
  invertDelta?: boolean;
}

function StatCard({
  title,
  description,
  value,
  delta,
  deltaLabel,
  deltaSuffix = "",
  invertDelta = false,
}: StatCardProps) {
  const tooltipId = `${title}-tooltip`;
  const isGood = delta === null ? null : invertDelta ? delta < 0 : delta > 0;
  const badgeTone =
    isGood === null ? "neutral" : isGood ? "success" : "critical";
  const badgeIcon =
    isGood === null ? undefined : isGood ? "arrow-up" : "arrow-down";
  const sign = delta !== null && delta > 0 ? "+" : "";

  return (
    <s-clickable
      paddingBlock="small-400"
      paddingInline="small-100"
      borderRadius="base"
    >
      <s-tooltip id={tooltipId}>{description}</s-tooltip>
      <s-grid gap="small-300">
        <s-heading>{title}</s-heading>
        <s-stack direction="inline" gap="small-200" alignItems="center">
          <s-text interestFor={tooltipId}>{value}</s-text>
          {delta && (
            <s-badge tone={badgeTone} icon={badgeIcon}>
              {sign}
              {delta}
              {deltaSuffix} {deltaLabel}
            </s-badge>
          )}
        </s-stack>
      </s-grid>
    </s-clickable>
  );
}
