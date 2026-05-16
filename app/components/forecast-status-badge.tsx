import { Badge } from "@shopify/polaris";
import type { ForecastStatus } from "@/lib/api.server";

const STATUS_TONE: Record<ForecastStatus, "critical" | "warning" | "success"> =
  {
    CRITICAL: "critical",
    REORDER: "warning",
    OK: "success",
  };

interface ForecastStatusBadgeProps {
  status: ForecastStatus;
}

export function ForecastStatusBadge({ status }: ForecastStatusBadgeProps) {
  return <Badge tone={STATUS_TONE[status]}>{status}</Badge>;
}
