"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { createApiClient } from "@/lib/api.server";
import { AppErrorBoundary } from "@/components/app-error-boundary";
import { setLanguage } from "@/i18n";

const Z_LEVELS = [
  { z: 1.282, label: "90%" },
  { z: 1.645, label: "95%" },
  { z: 2.054, label: "98%" },
  { z: 2.326, label: "99%" },
] as const;

function zToIndex(z: number): number {
  const idx = Z_LEVELS.findIndex((l) => l.z === z);
  return idx >= 0 ? idx : 1;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const api = createApiClient({
    shop: session.shop,
    accessToken: session.accessToken ?? "",
  });
  const settings = await api.settings.get();
  return { settings };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const api = createApiClient({
    shop: session.shop,
    accessToken: session.accessToken ?? "",
  });

  const form = await request.formData();
  await api.settings.update({
    ewmaAlpha: Number(form.get("alpha")),
    defaultServiceLevelZ: Number(form.get("z")),
    defaultLeadTimeDays: Number(form.get("leadTime")),
    syncFrequencyHours: Number(form.get("syncFrequency")),
  });

  return { success: true };
};

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { settings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [alpha, setAlpha] = useState(settings.ewmaAlpha);
  const [zIndex, setZIndex] = useState(zToIndex(settings.defaultServiceLevelZ));
  const [leadTime, setLeadTime] = useState(String(settings.defaultLeadTimeDays));
  const [syncFreq, setSyncFreq] = useState(settings.syncFrequencyHours);
  const zLevel = Z_LEVELS[zIndex];

  useEffect(() => {
    if (actionData?.success) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).shopify?.toast.show(t("settings.saved"), { duration: 3000 });
    }
  }, [actionData, t]);

  return (
    <s-page heading={t("settings.title")}>
      <s-section heading={t("settings.forecastParameters")}>
        <s-stack gap="large">
          {/* Sliders */}
          <s-grid gridTemplateColumns="1fr 1fr" gap="large">
            <div className="flex flex-col gap-2">
              <label htmlFor="alpha-slider" className="text-sm text-gray-500">
                {t("settings.ewmaAlpha")}
              </label>
              <input
                id="alpha-slider"
                type="range"
                min={0.05}
                max={0.95}
                step={0.05}
                value={alpha}
                onChange={(e) => setAlpha(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <code className="text-sm font-mono text-gray-700">
                α = {alpha.toFixed(2)}
              </code>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="z-slider" className="text-sm text-gray-500">
                {t("settings.serviceLevel")}
              </label>
              <input
                id="z-slider"
                type="range"
                min={0}
                max={3}
                step={1}
                value={zIndex}
                onChange={(e) => setZIndex(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <code className="text-sm font-mono text-gray-700">
                Z = {zLevel.z} ({zLevel.label})
              </code>
            </div>
          </s-grid>

          <s-divider />

          {/* Lead time + sync frequency */}
          <s-grid gridTemplateColumns="1fr 1fr" gap="large">
            <s-text-field
              label={t("settings.defaultLeadTime")}
              value={leadTime}
              onInput={(e: Event) =>
                setLeadTime((e.target as HTMLInputElement).value)
              }
            />
            <s-select
              label={t("settings.syncFrequency")}
              onChange={(e: Event) =>
                setSyncFreq(Number((e.currentTarget as HTMLSelectElement).value))
              }
            >
              <s-option value="1" {...(syncFreq === 1 ? { defaultSelected: true } : {})}>
                {t("settings.syncOptions.1h")}
              </s-option>
              <s-option value="6" {...(syncFreq === 6 ? { defaultSelected: true } : {})}>
                {t("settings.syncOptions.6h")}
              </s-option>
              <s-option value="12" {...(syncFreq === 12 ? { defaultSelected: true } : {})}>
                {t("settings.syncOptions.12h")}
              </s-option>
              <s-option value="24" {...(syncFreq === 24 ? { defaultSelected: true } : {})}>
                {t("settings.syncOptions.24h")}
              </s-option>
            </s-select>
          </s-grid>

          <s-divider />

          {/* Language */}
          <s-grid gridTemplateColumns="1fr 1fr" gap="large">
            <s-select
              label={t("settings.language")}
              onChange={(e: Event) =>
                setLanguage((e.currentTarget as HTMLSelectElement).value)
              }
            >
              <s-option value="en" {...(i18n.language === "en" ? { defaultSelected: true } : {})}>
                {t("settings.languages.en")}
              </s-option>
              <s-option value="ja" {...(i18n.language === "ja" ? { defaultSelected: true } : {})}>
                {t("settings.languages.ja")}
              </s-option>
            </s-select>
          </s-grid>

          <Form method="post">
            <input type="hidden" name="alpha" value={alpha} />
            <input type="hidden" name="z" value={zLevel.z} />
            <input type="hidden" name="leadTime" value={leadTime} />
            <input type="hidden" name="syncFrequency" value={syncFreq} />
            <s-button variant="primary" type="submit">
              {t("settings.save")}
            </s-button>
          </Form>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return <AppErrorBoundary heading="Configuration" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
