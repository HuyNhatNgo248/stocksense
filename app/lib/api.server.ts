import type { ForecastListResponse, ForecastMetrics } from "@/types/api";

const BASE_URL = process.env.API_URL ?? "";

interface ApiClientOptions {
  shop: string;
  accessToken: string;
}

function createApiClient({ shop, accessToken }: ApiClientOptions) {
  async function get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-shopify-shop-domain": shop,
      },
    });

    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${path}`);
    }

    return res.json() as Promise<T>;
  }

  return {
    forecasts: {
      list: ({
        page = 1,
        limit = 20,
      }: { page?: number; limit?: number } = {}) =>
        get<ForecastListResponse>(`/api/forecasts?page=${page}&limit=${limit}`),
      metrics: () => get<ForecastMetrics>("/api/forecasts/metrics"),
    },
  };
}

export type {
  Forecast,
  ForecastListResponse,
  ForecastMetrics,
  ForecastProduct,
  ForecastStatus,
} from "@/types/api";

export { createApiClient };
