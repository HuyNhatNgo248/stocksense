"use client";

import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import type {
  Forecast,
  ForecastListResponse,
  ForecastStatus,
} from "@/lib/api.server";

interface InventoryTableProps {
  inventory: ForecastListResponse;
}

const STATUS_FILTERS = ["All", "Critical", "Reorder", "OK"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_TONE: Record<ForecastStatus, "critical" | "caution" | "success"> =
  {
    CRITICAL: "critical",
    REORDER: "caution",
    OK: "success",
  };

export function InventoryTableSkeleton() {
  return (
    <s-box padding="base" background="base" borderRadius="base">
      <s-stack gap="base">
        <div className="flex justify-between items-center animate-pulse">
          <div className="h-5 w-36 bg-gray-200 rounded" />
          <div className="h-8 w-56 bg-gray-200 rounded" />
        </div>
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-full bg-gray-200 rounded" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-4">
              <div className="h-4 bg-gray-200 rounded col-span-2" />
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </s-stack>
    </s-box>
  );
}

export function InventoryTable({ inventory }: InventoryTableProps) {
  const fetcher = useFetcher<ForecastListResponse>();
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("All");
  const [search, setSearch] = useState("");
  const [, setPage] = useState(inventory.page);

  const data = fetcher.data ?? inventory;
  const { data: forecasts, totalPages, total, limit } = data;
  const currentPage = data.page;
  const from = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);
  function load(newPage: number, filter: StatusFilter, q: string) {
    const params = new URLSearchParams({ page: String(newPage), limit: String(limit) });
    if (filter !== "All") params.set("status", filter.toUpperCase());
    if (q) params.set("search", q);
    fetcher.load(`/app/inventory?${params.toString()}`);
  }

  function setFilter(filter: StatusFilter) {
    setActiveFilter(filter);
    setPage(1);
    load(1, filter, search);
  }

  function goToPage(newPage: number) {
    setPage(newPage);
    load(newPage, activeFilter, search);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      const params = new URLSearchParams({ page: "1", limit: String(limit) });
      if (activeFilter !== "All") params.set("status", activeFilter.toUpperCase());
      if (search) params.set("search", search);
      fetcher.load(`/app/inventory?${params.toString()}`);
    }, 400);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <s-box padding="base" background="base" borderRadius="base">
      <s-stack gap="base">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <s-stack direction="inline" gap="base" alignItems="center">
            <s-heading>Inventory Status</s-heading>
            <s-stack direction="inline" gap="small-400">
              {STATUS_FILTERS.map((f) => (
                <s-button
                  key={f}
                  variant={activeFilter === f ? "secondary" : "tertiary"}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </s-button>
              ))}
            </s-stack>
          </s-stack>

          <div className="w-full sm:w-75">
            <s-search-field
              label="Search"
              labelAccessibilityVisibility="exclusive"
              placeholder="Search SKU or product..."
              value={search}
              onInput={(e: Event) =>
                setSearch((e.target as HTMLInputElement).value)
              }
            />
          </div>
        </div>

        <div className={`overflow-x-auto transition-opacity duration-150 ${fetcher.state !== "idle" ? "opacity-50 pointer-events-none" : ""}`}>
          <s-table>
            <s-table-header-row>
              <s-table-header listSlot="primary">Product</s-table-header>
              <s-table-header>SKU</s-table-header>
              <s-table-header>Status</s-table-header>
              <s-table-header format="numeric">Stock</s-table-header>
              <s-table-header format="numeric">Reorder Point</s-table-header>
              <s-table-header format="numeric">Safety Stock</s-table-header>
              <s-table-header format="numeric">Velocity/Day</s-table-header>
            </s-table-header-row>

            <s-table-body>
              {forecasts.map((forecast: Forecast) => (
                <s-table-row key={forecast.id}>
                  <s-table-cell>{forecast.product.title}</s-table-cell>
                  <s-table-cell>
                    <s-text color="subdued">{forecast.product.sku}</s-text>
                  </s-table-cell>
                  <s-table-cell>
                    <s-badge tone={STATUS_TONE[forecast.status]}>
                      {forecast.status}
                    </s-badge>
                  </s-table-cell>
                  <s-table-cell>{forecast.product.currentStock}</s-table-cell>
                  <s-table-cell>
                    {Math.round(forecast.reorderPoint)}
                  </s-table-cell>
                  <s-table-cell>
                    {Math.round(forecast.safetyStock)}
                  </s-table-cell>
                  <s-table-cell>
                    {forecast.velocityPerDay.toFixed(2)}
                  </s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        </div>

        <s-box padding="small" background="subdued" borderRadius="base">
          <s-stack
            direction="inline"
            alignItems="center"
            justifyContent="space-between"
          >
            <s-text color="subdued">
              Showing {from}–{to} of {total} records
            </s-text>
            <s-stack direction="inline" alignItems="center" gap="small-200">
              <s-button
                variant="tertiary"
                icon="chevron-left"
                accessibilityLabel="Previous page"
                disabled={currentPage <= 1 ? true : undefined}
                onClick={() => goToPage(currentPage - 1)}
              />
              <s-text color="subdued">
                Page {currentPage} of {totalPages}
              </s-text>
              <s-button
                variant="tertiary"
                icon="chevron-right"
                accessibilityLabel="Next page"
                disabled={currentPage >= totalPages ? true : undefined}
                onClick={() => goToPage(currentPage + 1)}
              />
            </s-stack>
          </s-stack>
        </s-box>
      </s-stack>
    </s-box>
  );
}
