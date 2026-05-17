import { useRef } from "react";
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
import { getShopLanguage } from "@/lib/preferences.server";

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

  const lang = await getShopLanguage(session.shop);

  return {
    // eslint-disable-next-line no-undef
    apiKey: process.env.SHOPIFY_APP_CLIENT_ID || "",
    lang,
  };
};

export default function App() {
  const { apiKey, lang } = useLoaderData<typeof loader>();
  const { t, i18n } = useTranslation();

  // SSR: align the singleton with this request's lang on every render
  // (i18n is a module-level singleton, so each request must rewrite it).
  if (typeof document === "undefined" && i18n.language !== lang) {
    i18n.changeLanguage(lang);
  }

  // Client: sync once on mount so initial paint matches the SSR HTML.
  // After that, useChangeLanguage owns i18n state — we don't want stale
  // loader data clobbering an in-flight user change.
  const hydrated = useRef(false);
  if (typeof document !== "undefined" && !hydrated.current) {
    if (i18n.language !== lang) i18n.changeLanguage(lang);
    hydrated.current = true;
  }

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
