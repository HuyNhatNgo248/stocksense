"use client";

import { useState, useMemo } from "react";
import type { Forecast, ForecastStatus } from "@/lib/api.server";

interface InventoryTableProps {
  forecasts: Forecast[];
}

const STATUS_FILTERS = ["All", "Critical", "Reorder", "OK"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_TONE: Record<ForecastStatus, "critical" | "caution" | "success"> =
  {
    CRITICAL: "critical",
    REORDER: "caution",
    OK: "success",
  };

export function InventoryTable({ forecasts }: InventoryTableProps) {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return forecasts.filter((f) => {
      const matchesFilter =
        activeFilter === "All" || f.status === activeFilter.toUpperCase();
      const matchesSearch =
        search === "" ||
        f.product.title.toLowerCase().includes(search.toLowerCase()) ||
        f.product.sku.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [forecasts, activeFilter, search]);

  return (
    <s-box padding="base" background="base" borderRadius="base">
      <s-stack gap="base">
        <s-stack
          direction="inline"
          alignItems="center"
          justifyContent="space-between"
        >
          <s-stack direction="inline" gap="base" alignItems="center">
            <s-heading>Inventory Status</s-heading>
            <s-stack direction="inline" gap="small-100">
              {STATUS_FILTERS.map((f) => (
                <s-button
                  key={f}
                  variant={activeFilter === f ? "secondary" : "tertiary"}
                  onClick={() => setActiveFilter(f)}
                >
                  {f}
                </s-button>
              ))}
            </s-stack>
          </s-stack>

          <s-box inlineSize="300px">
            <s-search-field
              label="Search"
              labelAccessibilityVisibility="exclusive"
              placeholder="Search SKU or product..."
              value={search}
              onInput={(e: Event) =>
                setSearch((e.target as HTMLInputElement).value)
              }
            />
          </s-box>
        </s-stack>

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
            {filtered.map((forecast) => (
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
                <s-table-cell>{Math.round(forecast.reorderPoint)}</s-table-cell>
                <s-table-cell>{Math.round(forecast.safetyStock)}</s-table-cell>
                <s-table-cell>
                  {forecast.velocityPerDay.toFixed(2)}
                </s-table-cell>
              </s-table-row>
            ))}
          </s-table-body>
        </s-table>
      </s-stack>
    </s-box>
  );
}
