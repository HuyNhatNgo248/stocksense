import { useTranslation } from "react-i18next";
import { BlockStack, Page, ProgressBar, Text } from "@shopify/polaris";

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
  const { t } = useTranslation();
  const currentIndex = WIZARD_STEPS.indexOf(step);
  const progress = ((currentIndex + 1) / WIZARD_STEPS.length) * 100;

  return (
    <Page narrowWidth>
      <BlockStack gap="500">
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
