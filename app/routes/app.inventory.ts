import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { createApiClient } from "@/lib/api.server";

const LIMIT = 20;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const api = createApiClient({
    shop: session.shop,
    accessToken: session.accessToken ?? "",
  });

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const status = url.searchParams.get("status")?.toUpperCase() ?? undefined;
  const search = url.searchParams.get("search") ?? undefined;

  return api.forecasts.list({ page, limit: LIMIT, status, search });
};
