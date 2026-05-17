import { Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshIcon } from "@shopify/polaris-icons";
import type {
  HeadersFunction,
  LoaderFunctionArgs,
  ShouldRevalidateFunction,
} from "react-router";
import { Await, useLoaderData, useRevalidator } from "react-router";
import { BlockStack, Card, EmptyState, Page } from "@shopify/polaris";
import { AppErrorBoundary } from "@/components/app-error-boundary";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { createApiClient } from "@/lib/api.server";
import { isOnboardingCompleted } from "@/lib/onboarding.server";
import type { Forecast } from "@/lib/api.server";
import type { BackfillStatus } from "@/types/api";
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
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const api = createApiClient({
    shop: session.shop,
    accessToken: session.accessToken ?? "",
  });

  const onboarded = await isOnboardingCompleted(session.shop);

  if (!onboarded) {
    // At this point,the shop may not have been saved on the backend so do not get shop specific settings here.
    const [defaults, { status: backfillStatus }] = await Promise.all([
      api.settings.getDefault(),
      api.sync.backfillStatus(),
    ]);
    return { onboarded: false as const, defaults, backfillStatus };
  }

  const { status: backfillStatus } = await api.sync.backfillStatus();

  if (backfillStatus !== "done") {
    return { onboarded: true as const, ready: false as const, backfillStatus };
  }

  return {
    onboarded: true as const,
    ready: true as const,
    metrics: api.forecasts.metrics(),
    inventory: api.forecasts.list({ page: 1 }),
  };
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const [selectedForecast, setSelectedForecast] = useState<Forecast | null>(
    null,
  );
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("All");
  const revalidator = useRevalidator();

  if (!data.onboarded) {
    return (
      <OnboardingWizard
        defaults={data.defaults}
        backfillStatus={data.backfillStatus}
      />
    );
  }

  if (!data.ready) {
    return (
      <BackfillScreen
        status={data.backfillStatus}
        onRefresh={() => revalidator.revalidate()}
        isRefreshing={revalidator.state !== "idle"}
      />
    );
  }

  const { metrics, inventory } = data;

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

function BackfillScreen({
  status,
  onRefresh,
  isRefreshing,
}: {
  status: BackfillStatus;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const { t } = useTranslation();
  const revalidator = useRevalidator();

  // Auto-poll every 5s while sync is in progress, but stop on "failed"
  // (let the merchant retry manually instead of hammering a broken job).
  useEffect(() => {
    if (status === "failed") return;
    const id = setInterval(() => {
      if (revalidator.state === "idle") revalidator.revalidate();
    }, 5000);
    return () => clearInterval(id);
  }, [status, revalidator]);

  const isFailed = status === "failed";

  const heading = isFailed
    ? t("dashboard.backfill.failedHeading")
    : t("dashboard.backfill.heading");

  const description = isFailed
    ? t("dashboard.backfill.failedDescription")
    : t("dashboard.backfill.description");

  return (
    <Page title={t("dashboard.title")}>
      <Card>
        <EmptyState
          heading={heading}
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          action={{
            content: isFailed
              ? t("dashboard.backfill.retry")
              : t("common.refresh"),
            onAction: onRefresh,
            loading: isRefreshing,
          }}
        >
          <p>{description}</p>
        </EmptyState>
      </Card>
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
