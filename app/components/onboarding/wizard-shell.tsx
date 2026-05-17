import { useTranslation } from "react-i18next";
import {
  BlockStack,
  Box,
  InlineStack,
  Page,
  ProgressBar,
  Select,
  Text,
} from "@shopify/polaris";
import { setLanguage } from "@/i18n";

export const WIZARD_STEPS = [
  "welcome",
  "preferences",
  "syncing",
  "ready",
] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number];

export function WizardShell({
  step,
  children,
}: {
  step: WizardStep;
  children: React.ReactNode;
}) {
  const { t, i18n } = useTranslation();
  const currentIndex = WIZARD_STEPS.indexOf(step);
  const progress = ((currentIndex + 1) / WIZARD_STEPS.length) * 100;

  return (
    <Page narrowWidth>
      <InlineStack align="end">
        <Box minWidth="160px">
          <Select
            label="Language"
            labelHidden
            options={[
              { label: "日本語", value: "ja" },
              { label: "English", value: "en" },
            ]}
            value={i18n.language}
            onChange={setLanguage}
          />
        </Box>
      </InlineStack>

      <BlockStack gap="400">
        <BlockStack gap="200">
          <Text as="p" tone="subdued" variant="bodySm">
            {t("onboarding.shell.stepOfTotal", {
              current: currentIndex + 1,
              total: WIZARD_STEPS.length,
            })}
          </Text>
          <ProgressBar progress={progress} size="small" tone="primary" />
        </BlockStack>

        {children}
      </BlockStack>
    </Page>
  );
}
