"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PAGE_LIMIT } from "@/routes/app.alerts";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/cn";

import type {
  Forecast,
  ForecastListResponse,
  ForecastStatus,
} from "@/types/api";
import {
  DemandHistoryButton,
  DemandHistoryModal,
} from "@/components/demand-history";
import { useVelocityHistory } from "@/hooks/use-velocity-history";
import { useVariantImage } from "@/hooks/use-variant-image";
import { DemandTrend } from "@/components/alerts/demand-trend";
import { Metric } from "@/components/alerts/metric";
import { ProductVariantLink } from "@/components/product-variant-link";

export function AlertsListSkeleton() {
  return (
    <s-stack gap="large">
      {[0, 1].map((s) => (
        <s-stack key={s} gap="base">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 border-l-4 border-l-gray-300 bg-white animate-pulse"
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex gap-3 items-center">
                  <div className="w-11 h-11 rounded-lg bg-gray-200" />
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-44 bg-gray-200 rounded" />
                    <div className="h-3 w-28 bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-24 bg-gray-200 rounded-full" />
                  <div className="h-8 w-36 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="border-t border-gray-100" />
              <div className="grid grid-cols-4 gap-6 p-4">
                {[0, 1, 2, 3].map((m) => (
                  <div key={m} className="flex flex-col gap-2">
                    <div className="h-2 w-20 bg-gray-100 rounded" />
                    <div className="h-7 w-16 bg-gray-200 rounded" />
                    <div className="h-2 w-24 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100" />
              <div className="flex items-center justify-between px-4 py-3">
                <div className="h-3 w-64 bg-gray-100 rounded" />
                <div className="h-8 w-36 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </s-stack>
      ))}
    </s-stack>
  );
}

function AlertCard({ forecast }: { forecast: Forecast }) {
  const { t } = useTranslation();
  const modalId = `history-modal-${forecast.id}`;
  const { product } = forecast;
  const isCritical = forecast.status === "CRITICAL";
  const { imageUrl, loading: imageLoading } = useVariantImage(
    product.shopifyVariantId,
  );
  const { data: velocityData, loading: velocityLoading } = useVelocityHistory(
    product.shopifyVariantId,
  );

  const daysLeft = Math.max(0, Math.floor(forecast.daysOfStockRemaining));
  const safetyStock = Math.round(forecast.safetyStock);
  const suggestedOrder =
    Math.round(forecast.velocityPerDay * product.leadTimeDays) + safetyStock;
  const coverageDays =
    forecast.velocityPerDay > 0
      ? Math.round(suggestedOrder / forecast.velocityPerDay)
      : 0;
  const urgentClass = isCritical ? "text-red-600" : "text-amber-600";

  return (
    <>
      <div
        className={cn(
          "bg-white rounded-xl border border-gray-200 border-l-4 overflow-hidden",
          isCritical ? "border-l-red-500" : "border-l-amber-400",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
              {imageLoading ? (
                <div className="w-full h-full bg-gray-200 animate-pulse" />
              ) : imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Icon icon="Package" size={20} className="text-gray-400" />
              )}
            </div>
            <div className="flex flex-col">
              <ProductVariantLink
                shopifyProductId={product.shopifyProductId}
                shopifyVariantId={product.shopifyVariantId}
              >
                <span className="font-semibold text-gray-900">
                  {product.title}
                </span>
              </ProductVariantLink>
              <span className="text-sm text-gray-500">{product.sku}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
                isCritical
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700",
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isCritical ? "bg-red-500" : "bg-amber-500",
                )}
              />
              {isCritical
                ? t("alerts.card.outOfStock")
                : t("alerts.card.reorderSoon")}
            </span>
            <DemandHistoryButton modalId={modalId} />
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-6 p-4">
          <Metric
            label={t("alerts.card.currentStock")}
            value={t("alerts.card.units", { n: product.currentStock })}
            valueClass={urgentClass}
          />
          <Metric
            label={t("alerts.card.stockout")}
            value={
              daysLeft === 0
                ? t("alerts.card.now")
                : t("alerts.card.days", { n: daysLeft })
            }
            valueClass={urgentClass}
            subtext={t("alerts.card.daysRemaining", { days: daysLeft })}
          />
          <Metric
            label={t("alerts.card.suggestedOrder")}
            value={t("alerts.card.units", { n: suggestedOrder })}
            valueClass="text-blue-600"
            subtext={
              coverageDays > 0
                ? t("alerts.card.daysCoverage", { days: coverageDays })
                : undefined
            }
          />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
              {t("alerts.card.demand30Days")}
            </span>
            <DemandTrend
              forecast={forecast}
              velocityData={velocityData}
              velocityLoading={velocityLoading}
            />
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-gray-500">
            {t("alerts.card.reorderPoint")}:{" "}
            <strong className="text-gray-700 font-semibold">
              {t("alerts.card.units", { n: Math.round(forecast.reorderPoint) })}
            </strong>{" "}
            · {t("alerts.card.leadTime")}:{" "}
            <strong className="text-gray-700 font-semibold">
              {t("alerts.card.days", { n: product.leadTimeDays })}
            </strong>
          </span>
        </div>
      </div>

      <DemandHistoryModal
        modalId={modalId}
        productTitle={product.title}
        variantId={product.shopifyVariantId}
        data={velocityData}
        loading={velocityLoading}
      />
    </>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

function AlertSection({
  title,
  tone,
  status,
  initial,
  emptyMessage,
}: {
  title: string;
  tone: "critical" | "caution";
  status: ForecastStatus;
  initial: ForecastListResponse;
  emptyMessage: string;
}) {
  const { t } = useTranslation();
  const [forecasts, setForecasts] = useState<Forecast[]>(initial.data);
  const [currentPage, setCurrentPage] = useState(initial.page);
  const [totalPages, setTotalPages] = useState(initial.totalPages);
  const [total, setTotal] = useState(initial.total);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    setLoading(true);
    try {
      const res = await fetch(
        `/app/inventory?status=${status}&page=${currentPage + 1}&limit=${PAGE_LIMIT}`,
      );
      const data: ForecastListResponse = await res.json();
      setForecasts((prev) => [...prev, ...data.data]);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }

  const hasMore = currentPage < totalPages;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold tracking-widest uppercase text-gray-500">
          {title}
        </span>
        <span
          className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full",
            tone === "critical"
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-700",
          )}
        >
          {t("alerts.items", { n: total })}
        </span>
      </div>

      {forecasts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-8 text-center">
          <span className="text-sm text-gray-400">{emptyMessage}</span>
        </div>
      ) : (
        <>
          {forecasts.map((f) => (
            <AlertCard key={f.id} forecast={f} />
          ))}
          {hasMore && (
            <div className="flex justify-center">
              <s-button
                variant="secondary"
                onClick={loadMore}
                loading={loading ? true : undefined}
              >
                {t("alerts.loadMore", { shown: forecasts.length, total })}
              </s-button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type FilterValue = "all" | "critical" | "reorder";

interface AlertsListProps {
  critical: ForecastListResponse;
  reorder: ForecastListResponse;
}

export function AlertsList({ critical, reorder }: AlertsListProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterValue>("all");
  const total = critical.total + reorder.total;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-900">
            {t("alerts.inventoryAlerts")}
          </span>
          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {total}
          </span>
        </div>

        <s-stack direction="inline" gap="small-400">
          <s-button
            variant={filter === "all" ? "secondary" : "tertiary"}
            onClick={() => setFilter("all")}
          >
            {t("alerts.filters.all")}
          </s-button>
          <s-button
            variant={filter === "critical" ? "secondary" : "tertiary"}
            onClick={() => setFilter("critical")}
          >
            {t("alerts.filters.critical")}
          </s-button>
          <s-button
            variant={filter === "reorder" ? "secondary" : "tertiary"}
            onClick={() => setFilter("reorder")}
          >
            {t("alerts.filters.reorder")}
          </s-button>
        </s-stack>
      </div>

      {filter !== "reorder" && (
        <AlertSection
          title={t("alerts.criticalSection")}
          tone="critical"
          status="CRITICAL"
          initial={critical}
          emptyMessage={t("alerts.noCritical")}
        />
      )}
      {filter !== "critical" && (
        <AlertSection
          title={t("alerts.reorderSection")}
          tone="caution"
          status="REORDER"
          initial={reorder}
          emptyMessage={t("alerts.noReorder")}
        />
      )}
    </div>
  );
}
