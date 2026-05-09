import type { Forecast, ForecastMetrics } from "@/types/api";

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
      list: () => get<Forecast[]>("/api/forecasts"),
      metrics: () => get<ForecastMetrics>("/api/forecasts/metrics"),
    },
  };
}

export type {
  Forecast,
  ForecastMetrics,
  ForecastProduct,
  ForecastStatus,
} from "@/types/api";

export { createApiClient };
