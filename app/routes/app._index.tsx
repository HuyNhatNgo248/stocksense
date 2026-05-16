import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshIcon } from "@shopify/polaris-icons";
import type {
  HeadersFunction,
  LoaderFunctionArgs,
  ShouldRevalidateFunction,
} from "react-router";
import { Await, useLoaderData, useRevalidator } from "react-router";
import { BlockStack, Page } from "@shopify/polaris";
import { AppErrorBoundary } from "@/components/app-error-boundary";
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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const api = createApiClient({
    shop: session.shop,
    accessToken: session.accessToken ?? "",
  });

  return {
    metrics: api.forecasts.metrics(),
    inventory: api.forecasts.list({ page: 1 }),
  };
};

export default function Index() {
  const { metrics, inventory } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const [selectedForecast, setSelectedForecast] = useState<Forecast | null>(
    null,
  );
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("All");
  const revalidator = useRevalidator();

  return (
    <Page
      title={t("dashboard.title")}
      fullWidth
      secondaryActions={[
        {
          content: t("common.refresh"),
          icon: RefreshIcon,
          onAction: () => revalidator.revalidate(),
        },
      ]}
    >
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            transition: "all 300ms ease-in-out",
          }}
        >
          <BlockStack gap="500">
            <Suspense fallback={<QuickStatsSkeleton />}>
              <Await resolve={metrics}>
                {(m) => (
                  <QuickStats metrics={m} onFilterChange={setActiveFilter} />
                )}
              </Await>
            </Suspense>

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
          </BlockStack>
        </div>

        <div
          style={{
            width: selectedForecast ? 320 : 0,
            flexShrink: 0,
            overflow: "hidden",
            transition: "width 300ms ease-in-out",
            position: "sticky",
            top: 0,
            alignSelf: "flex-start",
          }}
        >
          {selectedForecast && (
            <div
              style={{
                width: 320,
                maxHeight: "100vh",
                overflowY: "auto",
              }}
            >
              <ProductDetailPanel
                forecast={selectedForecast}
                onClose={() => setSelectedForecast(null)}
              />
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}

export function ErrorBoundary() {
  return <AppErrorBoundary heading="Dashboard" />;
}

export const shouldRevalidate: ShouldRevalidateFunction = ({
  formAction,
  defaultShouldRevalidate,
}) => {
  if (formAction === "/app/velocity-history") return false;
  if (formAction === "/app/mark-ordered") return false;
  if (formAction === "/app/update-lead-time") return false;
  return defaultShouldRevalidate;
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
