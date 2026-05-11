import type {
  AppSettings,
  ForecastListResponse,
  ForecastMetrics,
  ForecastProduct,
  VelocityHistory,
} from "@/types/api";

const BASE_URL = process.env.API_URL ?? "";

interface ApiClientOptions {
  shop: string;
  accessToken: string;
}

function createApiClient({ shop, accessToken }: ApiClientOptions) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "x-shopify-shop-domain": shop,
    "Content-Type": "application/json",
  };

  async function get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, { headers });
    if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
    return res.json() as Promise<T>;
  }

  async function put<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
    return res.json() as Promise<T>;
  }

  async function patch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
    return res.json() as Promise<T>;
  }

  return {
    inventory: {
      updateSettings: (variantId: string, data: { leadTimeDays: number }) =>
        patch<ForecastProduct>(`/api/inventory/${variantId}/settings`, data),
    },
    settings: {
      get: () => get<AppSettings>("/api/settings"),
      update: (
        data: Partial<
          Pick<
            AppSettings,
            | "ewmaAlpha"
            | "defaultLeadTimeDays"
            | "defaultServiceLevelZ"
            | "syncFrequencyHours"
          >
        >,
      ) => put<AppSettings>("/api/settings", data),
    },
    forecasts: {
      list: ({
        page = 1,
        limit = 20,
        status,
        search,
      }: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
      } = {}) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (status) params.set("status", status);
        if (search) params.set("search", search);
        return get<ForecastListResponse>(`/api/forecasts?${params.toString()}`);
      },

      metrics: () => get<ForecastMetrics>("/api/forecasts/metrics"),
      velocityHistory: (variantId: string) =>
        get<VelocityHistory>(`/api/forecasts/${variantId}/velocity-history`),
    },
  };
}

export type {
  AppSettings,
  Forecast,
  ForecastListResponse,
  ForecastMetrics,
  ForecastProduct,
  ForecastStatus,
  VelocityHistory,
  VelocityHistoryEntry,
} from "@/types/api";

export { createApiClient };
