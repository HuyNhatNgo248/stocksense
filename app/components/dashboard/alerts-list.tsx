"use client";

import { useState, useEffect } from "react";
import { PAGE_LIMIT } from "@/routes/app.alerts";

import type {
  Forecast,
  ForecastListResponse,
  ForecastStatus,
} from "@/types/api";

// ── Skeleton ──────────────────────────────────────────────────────────────────

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

// ── Metric item ───────────────────────────────────────────────────────────────

type TextTone =
  | "info"
  | "success"
  | "warning"
  | "critical"
  | "auto"
  | "neutral"
  | "caution";

function Metric({
  label,
  value,
  urgent,
  displayAsChip,
}: {
  label: string;
  value: string;
  urgent?: boolean;
  displayAsChip?: boolean;
}) {
  const tone: TextTone | undefined = urgent ? "critical" : undefined;

  return (
    <s-stack gap="small-100">
      <s-heading>{label}</s-heading>
      {displayAsChip ? (
        <s-chip>{value}</s-chip>
      ) : (
        <s-text tone={tone}>{value}</s-text>
      )}
    </s-stack>
  );
}

// ── Alert card ────────────────────────────────────────────────────────────────

function useVariantImage(variantId: string) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/app/variant-image?variantId=${encodeURIComponent(variantId)}`)
      .then((r) => r.json())
      .then((d: { url: string | null }) => setImageUrl(d.url))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [variantId]);

  return { imageUrl, loading };
}

function AlertCard({ forecast }: { forecast: Forecast }) {
  const { product } = forecast;
  const isCritical = forecast.status === "CRITICAL";
  const { imageUrl, loading: imageLoading } = useVariantImage(
    product.shopifyVariantId,
  );
  const daysLeft = Math.max(0, Math.floor(forecast.daysOfStockRemaining));
  const safetyStock = Math.round(forecast.safetyStock);
  const reorderPoint = Math.round(forecast.reorderPoint);
  const suggestedOrder =
    Math.round(forecast.velocityPerDay * product.leadTimeDays) + safetyStock;
  const stockVsRop =
    reorderPoint > 0
      ? Math.round((product.currentStock / reorderPoint) * 100)
      : 100;

  const summary = isCritical
    ? `Stock (${product.currentStock}) is below safety stock (${safetyStock}). Must reorder before the ${product.leadTimeDays}-day lead time expires.`
    : `Stock (${product.currentStock}) is approaching reorder point (${reorderPoint}). Order soon to avoid a stockout.`;

  const borderColor = isCritical
    ? "var(--s-color-icon-critical, #D72C0D)"
    : "var(--s-color-icon-caution, #FFC453)";

  return (
    <div
      className="rounded-lg overflow-hidden border-l-4"
      style={{ borderLeftColor: borderColor }}
    >
      <s-box background="base" borderRadius="base" padding="base">
        <s-stack gap="large">
          {/* Content */}
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
                    <s-heading>{product.title}</s-heading>
                    <s-badge tone={isCritical ? "critical" : "caution"}>
                      {isCritical ? "Critical" : "Reorder"}
                    </s-badge>
                  </s-stack>
                  <s-text color="subdued">{product.sku}</s-text>
                </s-stack>
              </s-stack>
              <s-stack direction="inline" gap="small-200">
                {/* <s-button variant="primary" icon="receipt">
                Create PO
              </s-button> */}
                <s-button variant="secondary">Dismiss</s-button>
              </s-stack>
            </s-stack>

            <s-text color="subdued">{summary}</s-text>
          </s-stack>

          {/* Metrics */}
          <s-stack direction="inline" gap="base">
            <Metric
              label="Current Stock"
              value={`${product.currentStock} units`}
              urgent={isCritical}
            />
            <s-divider direction="block" />
            <Metric label="Safety Stock" value={`${safetyStock} units`} />
            <s-divider direction="block" />
            <Metric label="Reorder Pt." value={`${reorderPoint} units`} />
            <s-divider direction="block" />
            <Metric label="Lead Time" value={`${product.leadTimeDays}d`} />
            <s-divider direction="block" />
            <Metric
              label="Velocity"
              value={`${forecast.velocityPerDay.toFixed(2)}/day`}
            />
            <s-divider direction="block" />
            <Metric
              label="Stockout In"
              value={daysLeft === 0 ? "Now" : `${daysLeft}d`}
              urgent={daysLeft <= 3}
            />
            <s-divider direction="block" />
            <Metric
              label="Stock vs ROP"
              value={`${stockVsRop}%`}
              urgent={stockVsRop < 30}
            />
            <s-divider direction="block" />

            <Metric
              label="Suggest Order"
              value={`${suggestedOrder} units`}
              displayAsChip
            />
          </s-stack>
        </s-stack>
      </s-box>
    </div>
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
