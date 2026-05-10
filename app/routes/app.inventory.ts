import type {
  LoaderFunctionArgs,
  ShouldRevalidateFunction,
} from "react-router";
import { authenticate } from "../shopify.server";
import { createApiClient } from "@/lib/api.server";

const PAGE_LIMIT = 20;

export const shouldRevalidate: ShouldRevalidateFunction = ({
  formAction,
  defaultShouldRevalidate,
}) => {
  if (formAction === "/app/velocity-history") return false;
  return defaultShouldRevalidate;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const api = createApiClient({
    shop: session.shop,
    accessToken: session.accessToken ?? "",
  });

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = parseInt(url.searchParams.get("limit") ?? `${PAGE_LIMIT}`);
  const status = url.searchParams.get("status")?.toUpperCase() ?? undefined;
  const search = url.searchParams.get("search") ?? undefined;

  const data = await api.forecasts.list({ page, limit, status, search });
  return Response.json(data);
};
