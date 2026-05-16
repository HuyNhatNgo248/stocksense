import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFetcher, useNavigate } from "react-router";
import {
  BlockStack,
  Box,
  Button,
  Card,
  Divider,
  InlineStack,
  Modal,
  SkeletonThumbnail,
  Spinner,
  Text,
  TextField,
  Thumbnail,
} from "@shopify/polaris";
import { EditIcon, InfoIcon, XIcon } from "@shopify/polaris-icons";
import type {
  Forecast,
  ForecastProduct,
  VelocityHistory,
} from "@/lib/api.server";
import { VelocityTrend } from "@/components/dashboard/velocity-trend";
import { useVariantImage } from "@/hooks/use-variant-image";
import {
  ProductVariantLink,
  type ProductVariantLinkProps,
} from "@/components/product-variant-link";
import {
  DemandHistoryButton,
  DemandHistoryModal,
} from "@/components/demand-history";

interface ProductDetailPanelProps {
  forecast: Forecast;
  onClose: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text as="h3" variant="headingXs" tone="subdued">
      {children}
    </Text>
  );
}

function MetricRow({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <InlineStack align="space-between" blockAlign="center" wrap={false}>
      <Text as="span" tone="subdued">
        {label}
      </Text>
      <InlineStack gap="100" blockAlign="center" wrap={false}>
        <Text as="span" variant="bodyMd" fontWeight="semibold">
          {value}
        </Text>
        {action}
      </InlineStack>
    </InlineStack>
  );
}

interface PanelHeaderProps extends Omit<ProductVariantLinkProps, "children"> {
  title: string;
  sku: string;
  variantId: string;
  onClose: () => void;
}

function PanelHeader({
  title,
  sku,
  variantId,
  onClose,
  shopifyProductId,
  shopifyVariantId,
}: PanelHeaderProps) {
  const { imageUrl, loading } = useVariantImage(variantId);

  return (
    <InlineStack
      align="space-between"
      blockAlign="start"
      gap="200"
      wrap={false}
    >
      <Box minWidth="0">
        <InlineStack gap="300" blockAlign="start" wrap={false}>
          {loading ? (
            <SkeletonThumbnail size="medium" />
          ) : imageUrl ? (
            <Thumbnail size="medium" source={imageUrl} alt={title} />
          ) : (
            <SkeletonThumbnail size="medium" />
          )}
          <Box minWidth="0">
            <BlockStack gap="100">
              <ProductVariantLink
                shopifyProductId={shopifyProductId}
                shopifyVariantId={shopifyVariantId}
              >
                <Text as="h2" variant="headingMd" truncate>
                  {title}
                </Text>
              </ProductVariantLink>
              <Text as="span" tone="subdued" truncate>
                {sku}
              </Text>
            </BlockStack>
          </Box>
        </InlineStack>
      </Box>
      <Button
        variant="tertiary"
        icon={XIcon}
        accessibilityLabel="Close panel"
        onClick={onClose}
      />
    </InlineStack>
  );
}

function StockMetrics({
  currentStock,
  safetyStock,
  reorderPoint,
  leadTime,
  velocity,
  onEditLeadTime,
}: {
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  leadTime: number;
  velocity: string;
  onEditLeadTime: () => void;
}) {
  const { t } = useTranslation();
  return (
    <BlockStack gap="300">
      <SectionLabel>{t("dashboard.panel.stockMetrics")}</SectionLabel>
      <MetricRow
        label={t("dashboard.panel.currentStock")}
        value={t("alerts.card.units", { n: currentStock })}
      />
      <MetricRow
        label={t("dashboard.panel.safetyStock")}
        value={t("alerts.card.units", { n: safetyStock })}
      />
      <MetricRow
        label={t("dashboard.panel.reorderPoint")}
        value={t("alerts.card.units", { n: reorderPoint })}
      />
      <MetricRow
        label={t("dashboard.panel.leadTime")}
        value={t("alerts.card.days", { n: leadTime })}
        action={
          <Button
            variant="tertiary"
            icon={EditIcon}
            accessibilityLabel={t("dashboard.panel.updateLeadTime")}
            onClick={onEditLeadTime}
          />
        }
      />
      <MetricRow
        label={t("dashboard.panel.avgVelocity")}
        value={`${velocity} ${t("dashboard.panel.unitsPerDay")}`}
      />
    </BlockStack>
  );
}

function ForecastFormula({
  velocity,
  stddev,
  leadTime,
  safetyStock,
  reorderPoint,
}: {
  velocity: string;
  stddev: string;
  leadTime: number;
  safetyStock: number;
  reorderPoint: number;
}) {
  const { t } = useTranslation();
  return (
    <BlockStack gap="300">
      <SectionLabel>{t("dashboard.panel.forecastFormula")}</SectionLabel>
      <Box padding="300" background="bg-surface-secondary" borderRadius="200">
        <BlockStack gap="100">
          <Text as="p" variant="bodySm">
            μ = {velocity}, σ = {stddev}, L = {leadTime}
          </Text>
          <Text as="p" variant="bodySm">
            Safety = 1.645 × {stddev} × √{leadTime} = {safetyStock}
          </Text>
          <Text as="p" variant="bodySm">
            ROP = {velocity} × {leadTime} + {safetyStock} = {reorderPoint}
          </Text>
        </BlockStack>
      </Box>
    </BlockStack>
  );
}

function TrendSection({ variantId }: { variantId: string }) {
  const { t } = useTranslation();
  const fetcher = useFetcher<VelocityHistory>();

  useEffect(() => {
    fetcher.submit(
      { variantId },
      {
        method: "post",
        action: "/app/velocity-history",
        encType: "application/json",
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantId]);

  const isLoading = fetcher.state !== "idle" || !fetcher.data;

  return (
    <BlockStack gap="300">
      <SectionLabel>{t("dashboard.panel.trend")}</SectionLabel>
      <Box padding="200" background="bg-surface-secondary" borderRadius="200">
        {isLoading ? (
          <Box padding="400" minHeight="192px">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 176,
              }}
            >
              <Spinner accessibilityLabel="Loading trend" size="small" />
            </div>
          </Box>
        ) : (
          <VelocityTrend data={fetcher.data!} />
        )}
      </Box>
    </BlockStack>
  );
}

function PanelActions({ modalId }: { modalId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <BlockStack gap="200">
      <SectionLabel>{t("dashboard.panel.actions")}</SectionLabel>
      <Button
        variant="secondary"
        icon={InfoIcon}
        onClick={() => navigate("/app/how-it-works")}
      >
        {t("common.explainCalculation")}
      </Button>
      <DemandHistoryButton modalId={modalId} />
    </BlockStack>
  );
}

function LeadTimeModal({
  open,
  onClose,
  variantId,
  currentLeadTime,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  variantId: string;
  currentLeadTime: number;
  onSuccess: (newLeadTime: number) => void;
}) {
  const { t } = useTranslation();
  const fetcher = useFetcher<ForecastProduct>();
  const [value, setValue] = useState(String(currentLeadTime));

  useEffect(() => {
    setValue(String(currentLeadTime));
  }, [currentLeadTime]);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.leadTimeDays !== undefined) {
      onSuccess(fetcher.data.leadTimeDays);
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).shopify?.toast.show(
        t("dashboard.panel.leadTimeUpdated"),
        { duration: 3000 },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state, fetcher.data]);

  function handleSave() {
    const days = Number(value);
    if (!days || days < 1) return;
    fetcher.submit(
      { variantId, leadTimeDays: days },
      {
        method: "post",
        action: "/app/update-lead-time",
        encType: "application/json",
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("dashboard.panel.updateLeadTime")}
      primaryAction={{
        content: t("common.save"),
        onAction: handleSave,
        loading: fetcher.state !== "idle",
      }}
      secondaryActions={[
        {
          content: t("common.cancel"),
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <TextField
          type="number"
          label={t("dashboard.panel.leadTimeDaysLabel")}
          value={value}
          onChange={setValue}
          min={1}
          autoComplete="off"
        />
      </Modal.Section>
    </Modal>
  );
}

export function ProductDetailPanel({
  forecast,
  onClose,
}: ProductDetailPanelProps) {
  const { product } = forecast;
  const modalId = `panel-history-${product.id}`;
  const safetyStock = Math.round(forecast.safetyStock);
  const reorderPoint = Math.round(forecast.reorderPoint);
  const velocity = forecast.velocityPerDay.toFixed(2);
  const stddev = forecast.stddevDemand.toFixed(1);
  const [leadTimeDays, setLeadTimeDays] = useState(product.leadTimeDays);
  const [isLeadTimeOpen, setIsLeadTimeOpen] = useState(false);

  useEffect(() => {
    setLeadTimeDays(product.leadTimeDays);
  }, [product.leadTimeDays]);

  return (
    <>
      <Card>
        <BlockStack gap="400">
          <PanelHeader
            title={product.title}
            sku={product.sku}
            variantId={product.shopifyVariantId}
            shopifyProductId={product.shopifyProductId}
            shopifyVariantId={product.shopifyVariantId}
            onClose={onClose}
          />
          <Divider />
          <StockMetrics
            currentStock={product.currentStock}
            safetyStock={safetyStock}
            reorderPoint={reorderPoint}
            leadTime={leadTimeDays}
            velocity={velocity}
            onEditLeadTime={() => setIsLeadTimeOpen(true)}
          />
          <Divider />
          <TrendSection variantId={product.shopifyVariantId} />
          <Divider />
          <ForecastFormula
            velocity={velocity}
            stddev={stddev}
            leadTime={leadTimeDays}
            safetyStock={safetyStock}
            reorderPoint={reorderPoint}
          />
          <Divider />
          <PanelActions modalId={modalId} />
        </BlockStack>
      </Card>
      <DemandHistoryModal
        modalId={modalId}
        productTitle={product.title}
        variantId={product.shopifyVariantId}
      />
      <LeadTimeModal
        open={isLeadTimeOpen}
        onClose={() => setIsLeadTimeOpen(false)}
        variantId={product.shopifyVariantId}
        currentLeadTime={leadTimeDays}
        onSuccess={setLeadTimeDays}
      />
    </>
  );
}
