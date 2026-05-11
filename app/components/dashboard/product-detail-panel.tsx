import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFetcher } from "react-router";
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
    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
      {children}
    </p>
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
    <div className="flex justify-between items-center">
      <s-text color="subdued">{label}</s-text>
      <div className="flex items-center gap-1">
        <span className="text-sm font-semibold">{value}</span>
        {action}
      </div>
    </div>
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
    <div className="flex justify-between items-start gap-2">
      <div className="flex items-start gap-3 min-w-0">
        <div className="shrink-0 w-14 h-14 rounded overflow-hidden bg-gray-100">
          {loading ? (
            <div className="w-full h-full animate-pulse bg-gray-200" />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>
        <s-stack gap="small-400">
          <ProductVariantLink
            shopifyProductId={shopifyProductId}
            shopifyVariantId={shopifyVariantId}
          >
            <s-heading>{title}</s-heading>
          </ProductVariantLink>
          <s-text color="subdued">{sku}</s-text>
        </s-stack>
      </div>
      <s-button
        variant="tertiary"
        icon="x"
        accessibilityLabel="Close panel"
        onClick={onClose}
      />
    </div>
  );
}

function StockMetrics({
  currentStock,
  safetyStock,
  reorderPoint,
  leadTime,
  velocity,
  leadTimeModalId,
}: {
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  leadTime: number;
  velocity: string;
  leadTimeModalId: string;
}) {
  const { t } = useTranslation();
  return (
    <s-stack gap="small-300">
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
          <s-button
            variant="tertiary"
            icon="edit"
            accessibilityLabel={t("dashboard.panel.updateLeadTime")}
            commandFor={leadTimeModalId}
            command="--show"
          />
        }
      />
      <MetricRow
        label={t("dashboard.panel.avgVelocity")}
        value={`${velocity} ${t("dashboard.panel.unitsPerDay")}`}
      />
    </s-stack>
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
    <s-stack gap="small-300">
      <SectionLabel>{t("dashboard.panel.forecastFormula")}</SectionLabel>
      <div
        className="rounded-lg p-3 text-xs leading-relaxed font-mono"
        style={{
          background: "var(--s-color-bg-surface-secondary, #f6f6f7)",
          color: "#4f46e5",
        }}
      >
        <div>
          μ = {velocity}, σ = {stddev}, L = {leadTime}
        </div>
        <div>
          Safety = 1.645 × {stddev} × √{leadTime} = {safetyStock}
        </div>
        <div>
          ROP = {velocity} × {leadTime} + {safetyStock} = {reorderPoint}
        </div>
      </div>
    </s-stack>
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

  return (
    <s-stack gap="small-300">
      <SectionLabel>{t("dashboard.panel.trend")}</SectionLabel>
      <div
        className="rounded-lg p-2"
        style={{ background: "var(--s-color-bg-surface-secondary, #f6f6f7)" }}
      >
        {fetcher.state !== "idle" || !fetcher.data ? (
          <div className="h-48 w-full rounded animate-pulse bg-gray-200" />
        ) : (
          <VelocityTrend data={fetcher.data} />
        )}
      </div>
    </s-stack>
  );
}

function PanelActions({ modalId }: { modalId: string }) {
  const { t } = useTranslation();
  return (
    <s-stack gap="small-300">
      <SectionLabel>{t("dashboard.panel.actions")}</SectionLabel>
      <s-link href="/app/how-it-works">
        <s-button variant="secondary" icon="info">
          {t("common.explainCalculation")}
        </s-button>
      </s-link>
      <DemandHistoryButton modalId={modalId} />
    </s-stack>
  );
}

function LeadTimeModal({
  modalId,
  variantId,
  currentLeadTime,
  onSuccess,
}: {
  modalId: string;
  variantId: string;
  currentLeadTime: number;
  onSuccess: (newLeadTime: number) => void;
}) {
  const { t } = useTranslation();
  const fetcher = useFetcher<ForecastProduct>();
  const saveRef = useRef<HTMLElement>(null);
  const cancelRef = useRef<HTMLElement>(null);
  // useRef so the native event listener always reads the latest value
  const valueRef = useRef(String(currentLeadTime));
  const [value, setValue] = useState(String(currentLeadTime));

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    setValue(String(currentLeadTime));
    valueRef.current = String(currentLeadTime);
  }, [currentLeadTime]);

  // Native listener — s-modal renders outside the React root so synthetic
  // onClick on s-button children doesn't fire.
  useEffect(() => {
    const el = saveRef.current;
    if (!el) return;
    const handler = () => {
      const days = Number(valueRef.current);
      if (!days || days < 1) return;
      fetcher.submit(
        { variantId, leadTimeDays: days },
        {
          method: "post",
          action: "/app/update-lead-time",
          encType: "application/json",
        },
      );
    };
    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantId]);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.leadTimeDays !== undefined) {
      onSuccess(fetcher.data.leadTimeDays);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cancelRef.current as any)?.click();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).shopify?.toast.show(
        t("dashboard.panel.leadTimeUpdated"),
        { duration: 3000 },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state, fetcher.data]);

  return (
    <s-modal
      id={modalId}
      heading={t("dashboard.panel.updateLeadTime")}
      accessibilityLabel={t("dashboard.panel.updateLeadTime")}
    >
      <s-stack gap="base">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            {t("dashboard.panel.leadTimeDaysLabel")}
          </label>
          <input
            type="number"
            min={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <s-button
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={saveRef as any}
          variant="primary"
          loading={fetcher.state !== "idle" ? true : undefined}
        >
          {t("common.save")}
        </s-button>
      </s-stack>
      <s-button
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={cancelRef as any}
        slot={"secondary-actions" as Lowercase<string>}
        commandFor={modalId}
        command="--hide"
      >
        {t("common.cancel")}
      </s-button>
    </s-modal>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function ProductDetailPanel({
  forecast,
  onClose,
}: ProductDetailPanelProps) {
  const { product } = forecast;
  const modalId = `panel-history-${product.id}`;
  const leadTimeModalId = `lead-time-modal-${product.id}`;
  const safetyStock = Math.round(forecast.safetyStock);
  const reorderPoint = Math.round(forecast.reorderPoint);
  const velocity = forecast.velocityPerDay.toFixed(2);
  const stddev = forecast.stddevDemand.toFixed(1);
  const [leadTimeDays, setLeadTimeDays] = useState(product.leadTimeDays);

  useEffect(() => {
    setLeadTimeDays(product.leadTimeDays);
  }, [product.leadTimeDays]);

  return (
    <>
      <s-box background="base" borderRadius="base" padding="base">
        <s-stack gap="base">
          <PanelHeader
            title={product.title}
            sku={product.sku}
            variantId={product.shopifyVariantId}
            shopifyProductId={product.shopifyProductId}
            shopifyVariantId={product.shopifyVariantId}
            onClose={onClose}
          />
          <s-divider />
          <StockMetrics
            currentStock={product.currentStock}
            safetyStock={safetyStock}
            reorderPoint={reorderPoint}
            leadTime={leadTimeDays}
            velocity={velocity}
            leadTimeModalId={leadTimeModalId}
          />
          <s-divider />
          <TrendSection variantId={product.shopifyVariantId} />
          <s-divider />
          <ForecastFormula
            velocity={velocity}
            stddev={stddev}
            leadTime={leadTimeDays}
            safetyStock={safetyStock}
            reorderPoint={reorderPoint}
          />
          <s-divider />
          <PanelActions modalId={modalId} />
        </s-stack>
      </s-box>
      <DemandHistoryModal
        modalId={modalId}
        productTitle={product.title}
        variantId={product.shopifyVariantId}
      />
      <LeadTimeModal
        modalId={leadTimeModalId}
        variantId={product.shopifyVariantId}
        currentLeadTime={leadTimeDays}
        onSuccess={setLeadTimeDays}
      />
    </>
  );
}
