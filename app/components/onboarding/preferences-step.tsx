import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFetcher } from "react-router";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  InlineGrid,
  InlineStack,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import type { DefaultAppSettings } from "@/types/api";

const Z_LEVELS = [
  { z: 1.282, label: "90% — fewer stockouts, less buffer" },
  { z: 1.645, label: "95% — recommended" },
  { z: 2.054, label: "98% — high availability" },
  { z: 2.326, label: "99% — maximum buffer" },
] as const;

export function PreferencesStep({
  defaults,
  onBack,
}: {
  defaults: DefaultAppSettings;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const fetcher = useFetcher<{ success: boolean; error?: string }>();

  const [leadTime, setLeadTime] = useState(
    String(defaults.defaultLeadTimeDays),
  );
  const [z, setZ] = useState(String(defaults.defaultServiceLevelZ));
  const [alertsEnabled, setAlertsEnabled] = useState(defaults.alertsEnabled);
  const [alertEmail, setAlertEmail] = useState(defaults.alertEmail ?? "");

  const isSubmitting = fetcher.state !== "idle";
  const saveError =
    fetcher.data && !fetcher.data.success ? fetcher.data.error : null;

  const zOptions = Z_LEVELS.map((level) => ({
    label: level.label,
    value: String(level.z),
  }));

  return (
    <fetcher.Form method="post" action="/app/onboarding-complete">
      <BlockStack gap="500">
        <Card>
          <BlockStack gap="500">
            <BlockStack gap="200">
              <Text as="h2" variant="headingLg">
                {t("onboarding.preferences.heading")}
              </Text>
              <Text as="p" tone="subdued">
                {t("onboarding.preferences.subtitle")}
              </Text>
            </BlockStack>

            {saveError && (
              <Banner tone="critical">
                <p>{t("onboarding.preferences.saveError")}</p>
              </Banner>
            )}

            <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
              <TextField
                label={t("onboarding.preferences.leadTime.label")}
                value={leadTime}
                onChange={setLeadTime}
                type="number"
                min={1}
                autoComplete="off"
                helpText={t("onboarding.preferences.leadTime.help")}
              />
              <Select
                label={t("onboarding.preferences.serviceLevel.label")}
                options={zOptions}
                value={z}
                onChange={setZ}
                helpText={t("onboarding.preferences.serviceLevel.help")}
              />
            </InlineGrid>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">
                {t("onboarding.preferences.alerts.heading")}
              </Text>
              <Text as="p" tone="subdued" variant="bodySm">
                {t("onboarding.preferences.alerts.description")}
              </Text>
            </BlockStack>

            <Checkbox
              label={t("onboarding.preferences.alerts.enable")}
              checked={alertsEnabled}
              onChange={setAlertsEnabled}
            />

            {alertsEnabled && (
              <TextField
                label={t("onboarding.preferences.alerts.email")}
                type="email"
                value={alertEmail}
                onChange={setAlertEmail}
                placeholder="alerts@example.com"
                autoComplete="email"
                helpText={t("onboarding.preferences.alerts.emailHelp")}
              />
            )}
          </BlockStack>
        </Card>

        <Box>
          <Text as="p" tone="subdued" variant="bodySm">
            {t("onboarding.preferences.importNote")}
          </Text>
        </Box>

        <input type="hidden" name="alpha" value={defaults.ewmaAlpha} />
        <input type="hidden" name="z" value={z} />
        <input type="hidden" name="leadTime" value={leadTime} />
        <input
          type="hidden"
          name="syncFrequency"
          value={defaults.syncFrequencyHours}
        />
        <input
          type="hidden"
          name="reviewPeriod"
          value={defaults.reviewPeriodDays}
        />
        <input
          type="hidden"
          name="alertsEnabled"
          value={String(alertsEnabled)}
        />
        <input type="hidden" name="alertEmail" value={alertEmail} />

        <InlineStack align="space-between">
          <Button onClick={onBack} disabled={isSubmitting}>
            {t("onboarding.shell.back")}
          </Button>
          <Button variant="primary" size="large" submit loading={isSubmitting}>
            {t("onboarding.preferences.save")}
          </Button>
        </InlineStack>
      </BlockStack>
    </fetcher.Form>
  );
}
