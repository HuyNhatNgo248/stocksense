import { Suspense, useState } from "react";
import { cn } from "@/lib/cn";
import type {
  HeadersFunction,
  LoaderFunctionArgs,
  ShouldRevalidateFunction,
} from "react-router";
import { Await, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { createApiClient } from "@/lib/api.server";
import type { Forecast } from "@/lib/api.server";
import {
  QuickStats,
  QuickStatsSkeleton,
} from "@/components/dashboard/quick-stats";
import {
  InventoryTable,
  InventoryTableSkeleton,
  type StatusFilter,
} from "@/components/dashboard/inventory-table";
import { ProductDetailPanel } from "@/components/dashboard/product-detail-panel";

const LIMIT = 20;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const api = createApiClient({
    shop: session.shop,
    accessToken: session.accessToken ?? "",
  });

  return {
    metrics: api.forecasts.metrics(),
    inventory: api.forecasts.list({ page: 1, limit: LIMIT }),
  };
};

export default function Index() {
  const { metrics, inventory } = useLoaderData<typeof loader>();
  const [selectedForecast, setSelectedForecast] = useState<Forecast | null>(
    null,
  );
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("All");

  return (
    <s-page heading="Dashboard" inlineSize="large">
      <div className="flex gap-4 items-start">
        {/* Main content */}
        <div className="flex-1 min-w-0 transition-all duration-300">
          <s-stack gap="large">
            <s-box padding="small" background="base" borderRadius="base">
              <Suspense fallback={<QuickStatsSkeleton />}>
                <Await resolve={metrics}>
                  {(m) => (
                    <QuickStats
                      metrics={m}
                      onFilterChange={setActiveFilter}
                    />
                  )}
                </Await>
              </Suspense>
            </s-box>

            <Suspense fallback={<InventoryTableSkeleton />}>
              <Await resolve={inventory}>
                {(inv) => (
                  <InventoryTable
                    inventory={inv}
                    selectedId={selectedForecast?.id}
                    onRowClick={(f) =>
                      setSelectedForecast((prev) =>
                        prev?.id === f.id ? null : f,
                      )
                    }
                    externalFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                  />
                )}
              </Await>
            </Suspense>
          </s-stack>
        </div>

        {/* Detail panel — slides in/out */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden shrink-0 sticky top-0 self-start",
            selectedForecast ? "w-80" : "w-0",
          )}
        >
          {selectedForecast && (
            <div className="overflow-y-auto max-h-screen w-80">
              <ProductDetailPanel
                forecast={selectedForecast}
                onClose={() => setSelectedForecast(null)}
              />
            </div>
          )}
        </div>
      </div>
    </s-page>
  );
}

export const shouldRevalidate: ShouldRevalidateFunction = ({
  formAction,
  defaultShouldRevalidate,
}) => {
  if (formAction === "/app/velocity-history") return false;
  return defaultShouldRevalidate;
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
