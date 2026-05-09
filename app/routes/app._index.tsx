import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { createApiClient } from "@/lib/api.server";
import { QuickStats } from "@/components/dashboard/quick-stats";
import { InventoryTable } from "@/components/dashboard/inventory-table";

const LIMIT = 20;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const api = createApiClient({
    shop: session.shop,
    accessToken: session.accessToken ?? "",
  });

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1");

  const [metrics, inventory] = await Promise.all([
    api.forecasts.metrics(),
    api.forecasts.list({ page, limit: LIMIT }),
  ]);

  return { metrics, inventory };
};

export default function Index() {
  const { metrics, inventory } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Dashboard" inlineSize="large">
      <s-stack gap="base">
        <s-box padding="small" background="base" borderRadius="base">
          <QuickStats metrics={metrics} />
        </s-box>

        <InventoryTable inventory={inventory} />
      </s-stack>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
