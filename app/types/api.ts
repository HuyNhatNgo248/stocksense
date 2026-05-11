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
  daysOfStockRemaining: number;
  forecastAccuracy: number;
  status: ForecastStatus;
  calculatedAt: string;
  updatedAt: string;
  product: ForecastProduct;
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
  updatedAt: string;
}
