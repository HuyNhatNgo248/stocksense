import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Await, useLoaderData, useRevalidator } from "react-router";
import { RefreshIcon } from "@shopify/polaris-icons";
import { Page } from "@shopify/polaris";
import { AppErrorBoundary } from "@/components/app-error-boundary";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { createApiClient } from "@/lib/api.server";
import {
  AlertsList,
  AlertsListSkeleton,
} from "@/components/alerts/alerts-list";

export const PAGE_LIMIT = 5;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const api = createApiClient({
    shop: session.shop,
    accessToken: session.accessToken ?? "",
  });

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
  };
};

export default function AlertsPage() {
  const { critical, reorder } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const revalidator = useRevalidator();

  return (
    <Page
      title={t("alerts.title")}
      secondaryActions={[
        {
          content: t("common.refresh"),
          icon: RefreshIcon,
          onAction: () => revalidator.revalidate(),
        },
      ]}
    >
      <Suspense fallback={<AlertsListSkeleton />}>
        <Await resolve={Promise.all([critical, reorder])}>
          {([c, r]) => <AlertsList critical={c} reorder={r} />}
        </Await>
      </Suspense>
    </Page>
  );
}

export function ErrorBoundary() {
  return <AppErrorBoundary heading="Alerts" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
