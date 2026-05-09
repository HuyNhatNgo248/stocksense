"use client";

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
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

export function InventoryTable({ inventory }: InventoryTableProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: forecasts, page, totalPages, total, limit } = inventory;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const activeFilter: StatusFilter =
    (searchParams.get("status") as StatusFilter | null) ?? "All";

  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  useEffect(() => {
    const currentSearch = searchParams.get("search") ?? "";
    if (search === currentSearch) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      params.set("page", "1");
      if (search) {
        params.set("search", search);
      } else {
        params.delete("search");
      }
      navigate(`?${params.toString()}`);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, navigate, searchParams]);

  function setFilter(filter: StatusFilter) {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (filter === "All") {
      params.delete("status");
    } else {
      params.set("status", filter.toUpperCase());
    }
    navigate(`?${params.toString()}`);
  }

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(newPage));
    navigate(`?${params.toString()}`);
  }

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

        <div className="overflow-x-auto">
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
                disabled={page <= 1 ? true : undefined}
                onClick={() => goToPage(page - 1)}
              />
              <s-text color="subdued">
                Page {page} of {totalPages}
              </s-text>
              <s-button
                variant="tertiary"
                icon="chevron-right"
                accessibilityLabel="Next page"
                disabled={page >= totalPages ? true : undefined}
                onClick={() => goToPage(page + 1)}
              />
            </s-stack>
          </s-stack>
        </s-box>
      </s-stack>
    </s-box>
  );
}
