import { useTranslation } from "react-i18next";
import type { ForecastMetrics } from "@/lib/api.server";
import type { StatusFilter } from "@/components/dashboard/inventory-table";

export function QuickStatsSkeleton() {
  return (
    <div className="overflow-x-auto w-full">
      <div
        className="grid gap-4 animate-pulse"
        style={{
          gridTemplateColumns: "1fr auto 1fr auto 1fr auto 1fr",
          minInlineSize: "1000px",
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <>
            <div key={i} className="px-1 py-3 flex flex-col gap-3">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-6 w-12 bg-gray-200 rounded" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
            </div>
            {i < 3 && <div key={`d-${i}`} className="w-px bg-gray-200 mx-1" />}
          </>
        ))}
      </div>
    </div>
  );
}

interface QuickStatsProps {
  metrics: ForecastMetrics;
  onFilterChange?: (filter: StatusFilter) => void;
}

export function QuickStats({ metrics, onFilterChange }: QuickStatsProps) {
  const { t } = useTranslation();
  return (
    <div className="overflow-x-auto w-full">
      <s-grid
        gridTemplateColumns="1fr auto 1fr auto 1fr auto 1fr"
        gap="small"
        minInlineSize="700px"
      >
        <StatCard
          title={t("dashboard.quickStats.critical")}
          description={t("dashboard.quickStats.criticalDesc")}
          value={String(metrics.critical)}
          delta={metrics.delta.criticalSinceYesterday}
          deltaLabel={t("dashboard.quickStats.sinceYesterday")}
          invertDelta
          onFilter={() => onFilterChange?.("Critical")}
        />
        <s-divider direction="block" />
        <StatCard
          title={t("dashboard.quickStats.reorderSoon")}
          description={t("dashboard.quickStats.reorderDesc")}
          value={String(metrics.reorder)}
          delta={metrics.delta.reorderSinceLastWeek}
          deltaLabel={t("dashboard.quickStats.thisWeek")}
          invertDelta
          onFilter={() => onFilterChange?.("Reorder")}
        />
        <s-divider direction="block" />
        <StatCard
          title={t("dashboard.quickStats.totalSkus")}
          description={t("dashboard.quickStats.totalSkusDesc")}
          value={String(metrics.total)}
          delta={metrics.delta.skusAddedThisMonth}
          deltaLabel={t("dashboard.quickStats.thisMonth")}
        />
        <s-divider direction="block" />
        <StatCard
          title={t("dashboard.quickStats.forecastAccuracy")}
          description={t("dashboard.quickStats.forecastAccuracyDesc")}
          value={`${metrics.forecastAccuracy.toFixed(2)}%`}
          delta={metrics.delta.accuracyVsLastMonth}
          deltaLabel={t("dashboard.quickStats.vsLastMonth")}
          deltaSuffix="%"
        />
      </s-grid>
    </div>
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
  onFilter?: () => void;
}

function StatCard({
  title,
  description,
  value,
  delta,
  deltaLabel,
  deltaSuffix = "",
  invertDelta = false,
  onFilter,
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
      onClick={onFilter}
    >
      <s-tooltip id={tooltipId}>{description}</s-tooltip>
      <s-grid gap="small-300">
        <s-heading>{title}</s-heading>
        <s-stack direction="inline" gap="small-200" alignItems="center">
          <s-text interestFor={tooltipId}>{value}</s-text>

          {delta === null && Number(value) > 0 && (
            <s-icon tone="critical" type="alert-circle" />
          )}

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
