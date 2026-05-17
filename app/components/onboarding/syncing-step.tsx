import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFetcher, useRevalidator } from "react-router";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Icon,
  InlineStack,
  Spinner,
  Text,
} from "@shopify/polaris";
import { CheckCircleIcon } from "@shopify/polaris-icons";
import type { BackfillStatus } from "@/types/api";

const POLL_INTERVAL_MS = 5000;
const MIN_RUNNING_DISPLAY_MS = 3000;

export function SyncingStep({
  backfillStatus,
  onBack,
}: {
  backfillStatus: BackfillStatus;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const revalidator = useRevalidator();
  const completeFetcher = useFetcher<{ success: boolean }>();

  // Hold the "running" UI for at least MIN_RUNNING_DISPLAY_MS even if backfill
  // is already done, so users see explicit progress feedback rather than a
  // success state appearing instantly.
  const [minDelayElapsed, setMinDelayElapsed] = useState(false);
  useEffect(() => {
    const id = setTimeout(
      () => setMinDelayElapsed(true),
      MIN_RUNNING_DISPLAY_MS,
    );
    return () => clearTimeout(id);
  }, []);

  const backfillActuallyRunning =
    backfillStatus !== "done" && backfillStatus !== "failed";
  const isFailed = backfillStatus === "failed";
  const isDone = backfillStatus === "done" && minDelayElapsed;
  const isCompleting = completeFetcher.state !== "idle";

  useEffect(() => {
    if (!backfillActuallyRunning) return;
    const id = setInterval(() => {
      if (revalidator.state === "idle") revalidator.revalidate();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [backfillActuallyRunning, revalidator]);

  const heading = isDone
    ? t("onboarding.syncing.headingDone")
    : isFailed
      ? t("onboarding.syncing.headingFailed")
      : t("onboarding.syncing.headingRunning");

  const subtitle = isDone
    ? t("onboarding.syncing.subtitleDone")
    : isFailed
      ? t("onboarding.syncing.subtitleFailed")
      : t("onboarding.syncing.subtitleRunning");

  return (
    <Card>
      <BlockStack gap="500">
        <BlockStack gap="200">
          <Text as="h2" variant="headingLg">
            {heading}
          </Text>
          <Text as="p" tone="subdued">
            {subtitle}
          </Text>
        </BlockStack>

        {isFailed && (
          <Banner
            tone="critical"
            action={{
              content: t("onboarding.syncing.retry"),
              onAction: () => revalidator.revalidate(),
              loading: revalidator.state !== "idle",
            }}
          >
            <p>{t("onboarding.syncing.subtitleFailed")}</p>
          </Banner>
        )}

        <BlockStack gap="200">
          <ChecklistRow
            label={t("onboarding.syncing.stepProducts")}
            state={isDone ? "done" : isFailed ? "failed" : "running"}
          />
          <ChecklistRow
            label={t("onboarding.syncing.stepOrders")}
            state={isDone ? "done" : isFailed ? "failed" : "running"}
          />
          <ChecklistRow
            label={t("onboarding.syncing.stepForecasts")}
            state={isDone ? "done" : isFailed ? "failed" : "running"}
          />
        </BlockStack>

        <InlineStack align="space-between">
          <Button onClick={onBack} disabled={isCompleting}>
            {t("onboarding.shell.back")}
          </Button>
          <completeFetcher.Form method="post" action="/app/onboarding-complete">
            <Button
              variant="primary"
              size="large"
              submit
              disabled={!isDone && !isFailed}
              loading={isCompleting}
            >
              {isCompleting
                ? t("onboarding.syncing.completing")
                : t("onboarding.syncing.continue")}
            </Button>
          </completeFetcher.Form>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

function ChecklistRow({
  label,
  state,
}: {
  label: string;
  state: "running" | "done" | "failed";
}) {
  return (
    <InlineStack gap="200" blockAlign="center" wrap={false}>
      <Box minWidth="20px" maxWidth="20px">
        {state === "running" && <Spinner size="small" accessibilityLabel="" />}
        {state === "done" && <Icon source={CheckCircleIcon} tone="success" />}
        {state === "failed" && <Icon source={CheckCircleIcon} tone="critical" />}
      </Box>
      <Text as="p" tone={state === "running" ? "subdued" : "base"}>
        {label}
      </Text>
    </InlineStack>
  );
}
