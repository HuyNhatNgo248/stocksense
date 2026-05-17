"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import {
  BlockStack,
  Button,
  Card,
  Checkbox,
  Divider,
  InlineGrid,
  Page,
  RangeSlider,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { createApiClient } from "@/lib/api.server";
import { AppErrorBoundary } from "@/components/app-error-boundary";
import { useChangeLanguage } from "@/hooks/use-change-language";

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
  const [settings, alerts] = await Promise.all([
    api.settings.get(),
    api.settings.getAlerts(),
  ]);
  return { settings, alerts };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const api = createApiClient({
    shop: session.shop,
    accessToken: session.accessToken ?? "",
  });

  const form = await request.formData();

  const alertsEnabled = form.get("alertsEnabled") === "true";
  const alertEmail = ((form.get("alertEmail") as string) || "").trim();

  try {
    await api.settings.update({
      ewmaAlpha: Number(form.get("alpha")),
      defaultServiceLevelZ: Number(form.get("z")),
      defaultLeadTimeDays: Number(form.get("leadTime")),
      syncFrequencyHours: Number(form.get("syncFrequency")),
      reviewPeriodDays: Number(form.get("reviewPeriod")),
    });

    const alertsPayload: { alertsEnabled: boolean; alertEmail?: string } = {
      alertsEnabled,
    };
    if (alertEmail) alertsPayload.alertEmail = alertEmail;
    await api.settings.updateAlerts(alertsPayload);

    return { success: true as const };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Failed to save settings",
    };
  }
};

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { settings, alerts } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const changeLanguage = useChangeLanguage();

  const [alpha, setAlpha] = useState(settings.ewmaAlpha);
  const [zIndex, setZIndex] = useState(zToIndex(settings.defaultServiceLevelZ));
  const [leadTime, setLeadTime] = useState(
    String(settings.defaultLeadTimeDays),
  );
  const [syncFreq, setSyncFreq] = useState(settings.syncFrequencyHours);
  const [reviewPeriod, setReviewPeriod] = useState(
    String(settings.reviewPeriodDays),
  );
  const [alertsEnabled, setAlertsEnabled] = useState(alerts.alertsEnabled);
  const [alertEmail, setAlertEmail] = useState(alerts.alertEmail ?? "");
  const zLevel = Z_LEVELS[zIndex];

  const isSubmitting = navigation.state === "submitting";
  const hasChanges =
    alpha !== settings.ewmaAlpha ||
    zLevel.z !== settings.defaultServiceLevelZ ||
    Number(leadTime) !== settings.defaultLeadTimeDays ||
    syncFreq !== settings.syncFrequencyHours ||
    Number(reviewPeriod) !== settings.reviewPeriodDays ||
    alertsEnabled !== alerts.alertsEnabled ||
    alertEmail !== (alerts.alertEmail ?? "");

  useEffect(() => {
    if (actionData?.success) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).shopify?.toast.show(t("settings.saved"), {
        duration: 3000,
      });
    } else if (actionData && !actionData.success && actionData.error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).shopify?.toast.show(actionData.error, {
        duration: 4000,
        isError: true,
      });
    }
  }, [actionData, t]);

  const syncOptions = [
    { label: t("settings.syncOptions.1h"), value: "1" },
    { label: t("settings.syncOptions.6h"), value: "6" },
    { label: t("settings.syncOptions.12h"), value: "12" },
    { label: t("settings.syncOptions.24h"), value: "24" },
  ];

  const languageOptions = [
    { label: t("settings.languages.en"), value: "en" },
    { label: t("settings.languages.ja"), value: "ja" },
  ];

  return (
    <Page title={t("settings.title")}>
      <Form method="post">
        <BlockStack gap="500">
          <Card>
            <BlockStack gap="500">
              <Text as="h2" variant="headingMd">
                {t("settings.forecastParameters")}
              </Text>

              <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                <RangeSlider
                  label={t("settings.ewmaAlpha")}
                  value={alpha}
                  onChange={(v) => setAlpha(Number(v))}
                  min={0.05}
                  max={0.95}
                  step={0.05}
                  output
                  helpText={`α = ${alpha.toFixed(2)}`}
                />
                <RangeSlider
                  label={t("settings.serviceLevel")}
                  value={zIndex}
                  onChange={(v) => setZIndex(Number(v))}
                  min={0}
                  max={3}
                  step={1}
                  output
                  helpText={`Z = ${zLevel.z} (${zLevel.label})`}
                />
              </InlineGrid>

              <Divider />

              <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                <TextField
                  label={t("settings.defaultLeadTime")}
                  value={leadTime}
                  onChange={setLeadTime}
                  type="number"
                  min={1}
                  autoComplete="off"
                />
                <Select
                  label={t("settings.syncFrequency")}
                  options={syncOptions}
                  value={String(syncFreq)}
                  onChange={(v) => setSyncFreq(Number(v))}
                />
              </InlineGrid>

              <Divider />

              <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                <TextField
                  label={t("settings.reviewPeriod")}
                  value={reviewPeriod}
                  onChange={setReviewPeriod}
                  type="number"
                  min={1}
                  autoComplete="off"
                  helpText={t("settings.reviewPeriodHelp")}
                />
              </InlineGrid>

              <Divider />

              <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                <Select
                  label={t("settings.language")}
                  options={languageOptions}
                  value={i18n.language}
                  onChange={changeLanguage}
                />
              </InlineGrid>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">
                  {t("settings.emailAlerts.title", {
                    defaultValue: "Email alerts",
                  })}
                </Text>
                <Text as="p" tone="subdued" variant="bodySm">
                  {t("settings.emailAlerts.description")}
                </Text>
              </BlockStack>

              <Checkbox
                label={t("settings.emailAlerts.enable")}
                checked={alertsEnabled}
                onChange={setAlertsEnabled}
              />

              {alertsEnabled && (
                <TextField
                  label={t("settings.emailAlerts.email")}
                  type="email"
                  value={alertEmail}
                  onChange={setAlertEmail}
                  placeholder="alerts@example.com"
                  autoComplete="email"
                  helpText={t("settings.emailAlerts.emailHelp")}
                />
              )}
            </BlockStack>
          </Card>

          <input type="hidden" name="alpha" value={alpha} />
          <input type="hidden" name="z" value={zLevel.z} />
          <input type="hidden" name="leadTime" value={leadTime} />
          <input type="hidden" name="syncFrequency" value={syncFreq} />
          <input type="hidden" name="reviewPeriod" value={reviewPeriod} />
          <input
            type="hidden"
            name="alertsEnabled"
            value={String(alertsEnabled)}
          />
          <input type="hidden" name="alertEmail" value={alertEmail} />

          <InlineGrid columns={1}>
            <Button
              variant="primary"
              submit
              disabled={!hasChanges || isSubmitting}
              loading={isSubmitting}
            >
              {t("settings.save")}
            </Button>
          </InlineGrid>
        </BlockStack>
      </Form>
    </Page>
  );
}

export function ErrorBoundary() {
  return <AppErrorBoundary heading="Configuration" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
