import type {
  HeadersFunction,
  LoaderFunctionArgs,
  ShouldRevalidateFunction,
} from "react-router";
import { Outlet, redirect, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useTranslation } from "react-i18next";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const apiUrl = process.env.API_URL ?? "";
  const res = await fetch(`${apiUrl}/api/auth/install?shop=${session.shop}`, {
    redirect: "manual",
  });

  if (res.status >= 300 && res.status < 400) {
    const oauthUrl = res.headers.get("location")!;
    const url = new URL(request.url);
    const exitParams = new URLSearchParams({
      shop: session.shop,
      host: url.searchParams.get("host") ?? "",
      exitIframe: oauthUrl,
    });
    return redirect(`/auth/exit-iframe?${exitParams}`);
  }

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_APP_CLIENT_ID || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
  const { t } = useTranslation();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">{t("nav.dashboard")}</s-link>
        <s-link href="/app/alerts">{t("nav.alerts")}</s-link>
        <s-link href="/app/how-it-works">{t("nav.howItWorks")}</s-link>
        <s-link href="/app/settings">{t("nav.settings")}</s-link>
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const shouldRevalidate: ShouldRevalidateFunction = ({
  formAction,
  defaultShouldRevalidate,
}) => {
  // Skip parent layout revalidation for in-app fetcher actions — they don't
  // change auth/install state and revalidating slows down side-panel UX.
  if (formAction === "/app/velocity-history") return false;
  if (formAction === "/app/mark-ordered") return false;
  if (formAction === "/app/update-lead-time") return false;
  if (formAction === "/app/variant-image") return false;
  return defaultShouldRevalidate;
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
