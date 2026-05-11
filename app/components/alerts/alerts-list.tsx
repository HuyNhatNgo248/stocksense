"use client";

import { useEffect, useRef, useState } from "react";
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
              className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse"
            >
              <div className="flex gap-5">
                <div className="w-40 h-40 shrink-0 rounded-lg bg-gray-200" />
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-2">
                      <div className="h-5 w-56 bg-gray-200 rounded" />
                      <div className="h-3 w-32 bg-gray-100 rounded" />
                      <div className="h-6 w-24 bg-gray-200 rounded-full" />
                    </div>
                    <div className="h-8 w-36 bg-gray-100 rounded" />
                  </div>
                  <div className="border border-gray-200 rounded-lg grid grid-cols-4 divide-x divide-gray-200">
                    {[0, 1, 2, 3].map((m) => (
                      <div key={m} className="px-4 py-3 flex flex-col gap-2">
                        <div className="h-3 w-20 bg-gray-100 rounded" />
                        <div className="h-7 w-16 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                  <div className="h-3 w-64 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </s-stack>
      ))}
    </s-stack>
  );
}

function MetricCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4 flex flex-col gap-1.5">
      <span className="text-sm text-gray-500">{label}</span>
      {children}
    </div>
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
  const urgentClass = isCritical ? "text-red-600" : "text-amber-600";

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex gap-5">
          {/* Product image */}
          <div className="w-40 h-40 shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
            {imageLoading ? (
              <div className="w-full h-full bg-gray-200 animate-pulse" />
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Icon icon="Package" size={40} className="text-gray-300" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Title row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1 min-w-0">
                <ProductVariantLink
                  shopifyProductId={product.shopifyProductId}
                  shopifyVariantId={product.shopifyVariantId}
                >
                  <span className="font-bold text-gray-900 text-lg leading-tight">
                    {product.title}
                  </span>
                </ProductVariantLink>
                <span className="text-sm text-gray-500">SKU: {product.sku}</span>
                <span
                  className={cn(
                    "mt-1 self-start px-3 py-1 rounded-full text-sm font-semibold",
                    isCritical
                      ? "bg-red-100 text-red-600"
                      : "bg-amber-100 text-amber-600",
                  )}
                >
                  {isCritical
                    ? t("alerts.card.outOfStock")
                    : t("alerts.card.reorderSoon")}
                </span>
              </div>
              <div className="shrink-0">
                <DemandHistoryButton modalId={modalId} />
              </div>
            </div>

            {/* Metrics grid */}
            <div className="border border-gray-200 rounded-lg grid grid-cols-4 divide-x divide-gray-200">
              <MetricCell label={t("alerts.card.currentStock")}>
                <span className={cn("text-2xl font-bold", urgentClass)}>
                  {t("alerts.card.units", { n: product.currentStock })}
                </span>
              </MetricCell>
              <MetricCell label={t("alerts.card.stockout")}>
                <span className={cn("text-2xl font-bold", urgentClass)}>
                  {daysLeft === 0
                    ? t("alerts.card.now")
                    : t("alerts.card.days", { n: daysLeft })}
                </span>
              </MetricCell>
              <MetricCell label={t("alerts.card.suggestedOrder")}>
                <span className="text-2xl font-bold text-blue-600">
                  {t("alerts.card.units", { n: suggestedOrder })}
                </span>
              </MetricCell>
              <MetricCell label={t("alerts.card.demand30Days")}>
                <DemandTrend
                  forecast={forecast}
                  velocityData={velocityData}
                  velocityLoading={velocityLoading}
                />
              </MetricCell>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Icon icon="Info" size={15} className="shrink-0 text-gray-400" />
              <span>
                {t("alerts.card.reorderPoint")}:{" "}
                <strong className="font-semibold text-gray-700">
                  {t("alerts.card.units", { n: Math.round(forecast.reorderPoint) })}
                </strong>
                {" · "}
                {t("alerts.card.leadTime")}:{" "}
                <strong className="font-semibold text-gray-700">
                  {t("alerts.card.days", { n: product.leadTimeDays })}
                </strong>
              </span>
            </div>
          </div>
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
  search,
}: {
  title: string;
  tone: "critical" | "caution";
  status: ForecastStatus;
  initial: ForecastListResponse;
  emptyMessage: string;
  search: string;
}) {
  const { t } = useTranslation();
  const [forecasts, setForecasts] = useState<Forecast[]>(initial.data);
  const [currentPage, setCurrentPage] = useState(initial.page);
  const [totalPages, setTotalPages] = useState(initial.totalPages);
  const [total, setTotal] = useState(initial.total);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(false);

  async function loadPage(page: number, q: string, append: boolean) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status,
        page: String(page),
        limit: String(PAGE_LIMIT),
      });
      if (q) params.set("search", q);
      const res = await fetch(`/app/inventory?${params.toString()}`);
      const data: ForecastListResponse = await res.json();
      setForecasts(append ? (prev) => [...prev, ...data.data] : data.data);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const timer = setTimeout(() => loadPage(1, search, false), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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
                onClick={() => loadPage(currentPage + 1, search, true)}
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
  const [search, setSearch] = useState("");
  const total = critical.total + reorder.total;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
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

        <s-search-field
          label="Search"
          labelAccessibilityVisibility="exclusive"
          placeholder={t("alerts.searchPlaceholder")}
          value={search}
          onInput={(e: Event) =>
            setSearch((e.target as HTMLInputElement).value)
          }
        />
      </div>

      {filter !== "reorder" && (
        <AlertSection
          title={t("alerts.criticalSection")}
          tone="critical"
          status="CRITICAL"
          initial={critical}
          emptyMessage={t("alerts.noCritical")}
          search={search}
        />
      )}
      {filter !== "critical" && (
        <AlertSection
          title={t("alerts.reorderSection")}
          tone="caution"
          status="REORDER"
          initial={reorder}
          emptyMessage={t("alerts.noReorder")}
          search={search}
        />
      )}
    </div>
  );
}
