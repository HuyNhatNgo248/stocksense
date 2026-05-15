import {
  Badge,
  BlockStack,
  Box,
  Card,
  Icon,
  InlineGrid,
  InlineStack,
  SkeletonBodyText,
  SkeletonDisplayText,
  Text,
} from "@shopify/polaris";
import {
  AlertCircleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
} from "@shopify/polaris-icons";
import { useTranslation } from "react-i18next";
import type { ForecastMetrics } from "@/lib/api.server";
import type { StatusFilter } from "@/components/dashboard/inventory-table";

const BUTTON_RESET: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 0,
  margin: 0,
  cursor: "pointer",
  display: "flex",
  width: "100%",
  textAlign: "left",
  font: "inherit",
  color: "inherit",
};

export function QuickStatsSkeleton() {
  return (
    <Card padding="0">
      <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="0">
        {[0, 1, 2, 3].map((i) => (
          <Box
            key={i}
            padding="400"
            borderInlineStartWidth={i === 0 ? undefined : "025"}
            borderColor="border"
          >
            <BlockStack gap="100" inlineAlign="start">
              <SkeletonDisplayText size="small" />
              <SkeletonBodyText lines={1} />
            </BlockStack>
          </Box>
        ))}
      </InlineGrid>
    </Card>
  );
}

interface QuickStatsProps {
  metrics: ForecastMetrics;
  onFilterChange?: (filter: StatusFilter) => void;
}

export function QuickStats({ metrics, onFilterChange }: QuickStatsProps) {
  const { t } = useTranslation();
  return (
    <Card padding="0">
      <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="0">
        <StatCell position={0} onFilter={() => onFilterChange?.("Critical")}>
          <StatContent
            title={t("dashboard.quickStats.critical")}
            value={String(metrics.critical)}
            delta={metrics.delta.criticalSinceYesterday}
            deltaLabel={t("dashboard.quickStats.sinceYesterday")}
            invertDelta
          />
        </StatCell>
        <StatCell position={1} onFilter={() => onFilterChange?.("Reorder")}>
          <StatContent
            title={t("dashboard.quickStats.reorderSoon")}
            value={String(metrics.reorder)}
            delta={metrics.delta.reorderSinceLastWeek}
            deltaLabel={t("dashboard.quickStats.thisWeek")}
            invertDelta
          />
        </StatCell>
        <StatCell position={2}>
          <StatContent
            title={t("dashboard.quickStats.totalSkus")}
            value={String(metrics.total)}
            delta={metrics.delta.skusAddedThisMonth}
            deltaLabel={t("dashboard.quickStats.thisMonth")}
          />
        </StatCell>
        <StatCell position={3}>
          <StatContent
            title={t("dashboard.quickStats.forecastAccuracy")}
            value={`${metrics.forecastAccuracy.toFixed(2)}%`}
            delta={metrics.delta.accuracyVsLastMonth}
            deltaLabel={t("dashboard.quickStats.vsLastMonth")}
            deltaSuffix="%"
          />
        </StatCell>
      </InlineGrid>
    </Card>
  );
}

function StatCell({
  position,
  onFilter,
  children,
}: {
  position: number;
  onFilter?: () => void;
  children: React.ReactNode;
}) {
  const cell = (
    <Box
      padding="400"
      borderInlineStartWidth={position === 0 ? undefined : "025"}
      borderColor="border"
      width="100%"
    >
      {children}
    </Box>
  );
  if (!onFilter) return cell;
  return (
    <button type="button" onClick={onFilter} style={BUTTON_RESET}>
      {cell}
    </button>
  );
}

interface StatContentProps {
  title: string;
  value: string;
  delta: number | null;
  deltaLabel: string;
  deltaSuffix?: string;
  invertDelta?: boolean;
}

function StatContent({
  title,
  value,
  delta,
  deltaLabel,
  deltaSuffix = "",
  invertDelta = false,
}: StatContentProps) {
  const isGood = delta === null ? null : invertDelta ? delta < 0 : delta > 0;
  const badgeTone =
    isGood === null ? undefined : isGood ? "success" : "critical";
  const badgeIcon =
    isGood === null ? undefined : isGood ? ArrowUpIcon : ArrowDownIcon;
  const sign = delta !== null && delta > 0 ? "+" : "";
  const showAlert = delta === null && Number(value) > 0;
  const showBadge = delta !== null && delta !== 0;

  return (
    <BlockStack gap="100" inlineAlign="start">
      <Text as="h3" variant="headingSm" tone="subdued">
        {title}
      </Text>
      <InlineStack gap="200" blockAlign="center" wrap={false}>
        <Text as="span" variant="headingLg" fontWeight="bold">
          {value}
        </Text>
        {showAlert && <Icon source={AlertCircleIcon} tone="critical" />}
        {showBadge && (
          <Badge tone={badgeTone} icon={badgeIcon}>
            {`${sign}${delta}${deltaSuffix} ${deltaLabel}`}
          </Badge>
        )}
      </InlineStack>
    </BlockStack>
  );
}
