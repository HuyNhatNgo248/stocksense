export interface ForecastMetrics {
  total: number;
  critical: number;
  reorder: number;
  ok: number;
  forecastAccuracy: number;
  delta: {
    criticalSinceYesterday: number | null;
    reorderSinceLastWeek: number | null;
    skusAddedThisMonth: number | null;
    accuracyVsLastMonth: number | null;
  };
}

export type ForecastStatus = "OK" | "REORDER" | "CRITICAL";

export interface ForecastProduct {
  id: string;
  title: string;
  sku: string;
  currentStock: number;
  leadTimeDays: number;
  shopifyProductId: string;
  shopifyVariantId: string;
}

export interface Forecast {
  id: string;
  productId: string;
  velocityPerDay: number;
  stddevDemand: number;
  safetyStock: number;
  reorderPoint: number;
  suggestedOrderQty: number;
  daysOfStockRemaining: number;
  forecastAccuracy: number;
  status: ForecastStatus;
  calculatedAt: string;
  updatedAt: string;
  product: ForecastProduct;
  expectedArrivalDate?: string | null;
  markOrdered: {
    expectedArrivalDate: string;
    snoozedAt: string;
  } | null;
}

export interface ForecastListResponse {
  data: Forecast[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VelocityHistoryEntry {
  date: string;
  unitsSold: number | null;
  ewmaVelocity: number;
}

export type VelocityHistory = VelocityHistoryEntry[];

export interface AppSettings {
  id: string;
  shopId: string;
  ewmaAlpha: number;
  defaultLeadTimeDays: number;
  defaultServiceLevelZ: number;
  syncFrequencyHours: number;
  reviewPeriodDays: number;
  updatedAt: string;
}

export interface AlertSettings {
  alertsEnabled: boolean;
  alertEmail: string | null;
}

export type DefaultAppSettings = Omit<
  AppSettings,
  "id" | "shopId" | "updatedAt"
> &
  AlertSettings;

export type BackfillStatus =
  | "pending"
  | "running"
  | "done"
  | "failed"
  | "not_started";

export interface BackfillStatusResponse {
  status: BackfillStatus;
}
