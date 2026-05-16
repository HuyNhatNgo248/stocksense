import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  HeadersFunction,
  LoaderFunctionArgs,
  ShouldRevalidateFunction,
} from "react-router";
import { Await, useLoaderData } from "react-router";
import { Page } from "@shopify/polaris";
import { AppErrorBoundary } from "@/components/app-error-boundary";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { createApiClient } from "@/lib/api.server";
import type { Forecast } from "@/types/api";
import {
  AlertsList,
  AlertsListSkeleton,
} from "@/components/alerts/alerts-list";
import { ProductDetailPanel } from "@/components/dashboard/product-detail-panel";

export const PAGE_LIMIT = 5;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const api = createApiClient({
    shop: session.shop,
    accessToken: session.accessToken ?? "",
  });

  const settings = await api.settings.get();

  return {
    critical: api.forecasts.list({
      page: 1,
      limit: PAGE_LIMIT,
      status: "CRITICAL",
    }),
    reorder: api.forecasts.list({
      page: 1,
      limit: PAGE_LIMIT,
      status: "REORDER",
    }),
    reviewPeriodDays: settings.reviewPeriodDays,
  };
};

export default function AlertsPage() {
  const { critical, reorder, reviewPeriodDays } =
    useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const [selectedForecast, setSelectedForecast] = useState<Forecast | null>(
    null,
  );

  return (
    <Page title={t("alerts.title")} fullWidth>
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
          <Suspense fallback={<AlertsListSkeleton />}>
            <Await resolve={Promise.all([critical, reorder])}>
              {([c, r]) => (
                <AlertsList
                  critical={c}
                  reorder={r}
                  selectedId={selectedForecast?.id}
                  onSelect={setSelectedForecast}
                  reviewPeriodDays={reviewPeriodDays}
                />
              )}
            </Await>
          </Suspense>
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
  return <AppErrorBoundary heading="Alerts" />;
}

export const shouldRevalidate: ShouldRevalidateFunction = ({
  formAction,
  defaultShouldRevalidate,
}) => {
  if (formAction === "/app/velocity-history") return false;
  if (formAction === "/app/mark-ordered") return false;
  return defaultShouldRevalidate;
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
