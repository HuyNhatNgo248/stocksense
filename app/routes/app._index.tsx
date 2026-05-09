import { Suspense } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Await, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { createApiClient } from "@/lib/api.server";
import {
  QuickStats,
  QuickStatsSkeleton,
} from "@/components/dashboard/quick-stats";
import {
  InventoryTable,
  InventoryTableSkeleton,
} from "@/components/dashboard/inventory-table";

const LIMIT = 20;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const api = createApiClient({
    shop: session.shop,
    accessToken: session.accessToken ?? "",
  });

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const status = url.searchParams.get("status") ?? undefined;
  const search = url.searchParams.get("search") ?? undefined;

  return {
    metrics: api.forecasts.metrics(),
    inventory: api.forecasts.list({ page, limit: LIMIT, status, search }),
  };
};

export default function Index() {
  const { metrics, inventory } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Dashboard" inlineSize="large">
      <s-stack gap="large">
        <s-box padding="small" background="base" borderRadius="base">
          <Suspense fallback={<QuickStatsSkeleton />}>
            <Await resolve={metrics}>{(m) => <QuickStats metrics={m} />}</Await>
          </Suspense>
        </s-box>

        <Suspense fallback={<InventoryTableSkeleton />}>
          <Await resolve={inventory}>
            {(inv) => <InventoryTable inventory={inv} />}
          </Await>
        </Suspense>
      </s-stack>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
