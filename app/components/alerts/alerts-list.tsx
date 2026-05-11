"use client";

import { useState } from "react";
import { PAGE_LIMIT } from "@/routes/app.alerts";
import { Icon } from "@/components/icon";

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
              className="rounded-lg border border-gray-200 border-l-4 border-l-gray-300 p-4 bg-white animate-pulse"
            >
              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex justify-between">
                    <div className="flex gap-2 items-center">
                      <div className="h-5 w-16 bg-gray-200 rounded-full" />
                      <div className="h-5 w-44 bg-gray-200 rounded" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-24 bg-gray-200 rounded" />
                      <div className="h-8 w-20 bg-gray-100 rounded" />
                    </div>
                  </div>
                  <div className="h-3 w-28 bg-gray-100 rounded" />
                  <div className="h-3 w-full bg-gray-100 rounded mt-1" />
                  <div className="flex gap-6 mt-2">
                    {[0, 1, 2, 3, 4, 5, 6].map((m) => (
                      <div key={m} className="flex flex-col gap-1">
                        <div className="h-2 w-12 bg-gray-100 rounded" />
                        <div className="h-4 w-10 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </s-stack>
      ))}
    </s-stack>
  );
}

function AlertCard({ forecast }: { forecast: Forecast }) {
  const modalId = `history-modal-${forecast.id}`;
  const { product } = forecast;
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

  return (
    <>
      <s-box background="base" borderRadius="base" padding="large">
        <s-stack gap="large">
          {/* Content */}
          <s-stack gap="small-300">
            <s-stack gap="small-200">
              <s-stack
                direction="inline"
                alignItems="start"
                justifyContent="space-between"
              >
                <s-stack direction="inline" gap="base" alignItems="start">
                  {imageLoading ? (
                    <div className="w-12 h-12 rounded bg-gray-200 animate-pulse shrink-0" />
                  ) : imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.title}
                      className="w-12 h-12 rounded object-cover shrink-0"
                    />
                  ) : null}
                  <s-stack gap="small-400">
                    <s-stack
                      direction="inline"
                      gap="small-300"
                      alignItems="center"
                    >
                      <ProductVariantLink
                        shopifyProductId={product.shopifyProductId}
                        shopifyVariantId={product.shopifyVariantId}
                      >
                        <s-heading>{product.title}</s-heading>
                      </ProductVariantLink>
                    </s-stack>
                    <s-text color="subdued">{product.sku}</s-text>
                  </s-stack>
                </s-stack>
                <s-stack direction="inline" gap="small-200">
                  <DemandHistoryButton modalId={modalId} />
                </s-stack>
              </s-stack>
            </s-stack>

            <s-divider />
          </s-stack>

          {/* Metrics + sparkline */}
          <div className="flex items-center gap-3">
            <div className="flex-1 overflow-x-hidden min-w-0">
              <s-grid
                gridTemplateColumns="1fr auto 1fr auto 1fr auto 1fr"
                gap="small"
              >
                <Metric
                  icon={
                    <Icon icon="Layers" className="text-red-500" size={18} />
                  }
                  classNames={{
                    icon: "bg-red-100",
                    value: "text-red-700",
                  }}
                  label="Current Stock"
                  value={`${product.currentStock} units`}
                />

                <s-divider direction="block" />
                <Metric
                  icon={
                    <Icon icon="Clock" className="text-blue-500" size={18} />
                  }
                  classNames={{
                    icon: "bg-blue-100",
                    value: "text-blue-700",
                  }}
                  label="Stockout In"
                  value={daysLeft === 0 ? "Now" : `${daysLeft}d`}
                />
                <s-divider direction="block" />
                <Metric
                  icon={
                    <Icon
                      icon="ShoppingCart"
                      className="text-blue-700"
                      size={18}
                    />
                  }
                  classNames={{
                    icon: "bg-blue-100",
                    value: "text-blue-700",
                  }}
                  label="Suggest Order"
                  value={`${suggestedOrder} units`}
                />
                <s-divider direction="block" />
                {/* Sparkline — always visible, anchored right */}
                <div className="shrink-0 flex flex-col gap-0.5">
                  <s-heading>Demand (Last 30 Days)</s-heading>
                  <DemandTrend
                    forecast={forecast}
                    velocityData={velocityData}
                    velocityLoading={velocityLoading}
                  />
                </div>
              </s-grid>
            </div>
          </div>
        </s-stack>
      </s-box>

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

// ── Section with pagination ───────────────────────────────────────────────────

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
    <s-stack gap="base">
      <s-stack direction="inline" gap="small-300" alignItems="center">
        <s-heading>{title}</s-heading>
        <s-badge tone={tone}>{total}</s-badge>
      </s-stack>

      {forecasts.length === 0 ? (
        <s-box background="base" borderRadius="base" padding="base">
          <s-text color="subdued">{emptyMessage}</s-text>
        </s-box>
      ) : (
        <>
          {forecasts.map((f) => (
            <AlertCard key={f.id} forecast={f} />
          ))}
          {hasMore && (
            <s-stack alignItems="center">
              <s-button
                variant="secondary"
                onClick={loadMore}
                loading={loading ? true : undefined}
              >
                Load more ({forecasts.length} of {total})
              </s-button>
            </s-stack>
          )}
        </>
      )}
    </s-stack>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface AlertsListProps {
  critical: ForecastListResponse;
  reorder: ForecastListResponse;
}

export function AlertsList({ critical, reorder }: AlertsListProps) {
  return (
    <s-stack gap="large">
      <AlertSection
        title="Critical — Immediate Action Required"
        tone="critical"
        status="CRITICAL"
        initial={critical}
        emptyMessage="No critical stock alerts right now."
      />
      <AlertSection
        title="Reorder Soon"
        tone="caution"
        status="REORDER"
        initial={reorder}
        emptyMessage="No products approaching reorder threshold."
      />
    </s-stack>
  );
}
