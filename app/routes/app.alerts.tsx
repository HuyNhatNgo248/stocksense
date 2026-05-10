import { Suspense } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Await, useLoaderData } from "react-router";
import { AppErrorBoundary } from "@/components/app-error-boundary";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { createApiClient } from "@/lib/api.server";
import {
  AlertsList,
  AlertsListSkeleton,
} from "@/components/alerts/alerts-list";

export const PAGE_LIMIT = 10;

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

  return (
    <s-page heading="Alerts">
      <Suspense fallback={<AlertsListSkeleton />}>
        <Await resolve={Promise.all([critical, reorder])}>
          {([c, r]) => <AlertsList critical={c} reorder={r} />}
        </Await>
      </Suspense>
    </s-page>
  );
}

export function ErrorBoundary() {
  return <AppErrorBoundary heading="Alerts" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
