"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFetcher } from "react-router";
import {
  Badge,
  BlockStack,
  Card,
  IndexFilters,
  IndexFiltersMode,
  IndexTable,
  SkeletonBodyText,
  SkeletonDisplayText,
  Text,
  useSetIndexFiltersMode,
} from "@shopify/polaris";
import type {
  Forecast,
  ForecastListResponse,
  ForecastStatus,
} from "@/lib/api.server";

interface InventoryTableProps {
  inventory: ForecastListResponse;
  selectedId?: string;
  onRowClick?: (forecast: Forecast) => void;
  externalFilter?: StatusFilter;
  onFilterChange?: (filter: StatusFilter) => void;
}

const STATUS_FILTERS = ["All", "Critical", "Reorder", "OK"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_TONE: Record<ForecastStatus, "critical" | "warning" | "success"> =
  {
    CRITICAL: "critical",
    REORDER: "warning",
    OK: "success",
  };

const FILTER_KEY: Record<StatusFilter, string> = {
  All: "dashboard.filters.all",
  Critical: "dashboard.filters.critical",
  Reorder: "dashboard.filters.reorder",
  OK: "dashboard.filters.ok",
};

export function InventoryTableSkeleton() {
  return (
    <Card>
      <BlockStack gap="400">
        <SkeletonDisplayText size="small" />
        <SkeletonBodyText lines={6} />
      </BlockStack>
    </Card>
  );
}

export function InventoryTable({
  inventory,
  onRowClick,
  externalFilter,
  onFilterChange,
}: InventoryTableProps) {
  const { t } = useTranslation();
  const fetcher = useFetcher<ForecastListResponse>();
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("All");
  const [search, setSearch] = useState("");
  const [, setPage] = useState(inventory.page);
  const { mode, setMode } = useSetIndexFiltersMode();

  const data = fetcher.data ?? inventory;
  const { data: forecasts, totalPages, total, limit } = data;
  const currentPage = data.page;
  const from = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);
  const isLoading = fetcher.state !== "idle";

  function load(newPage: number, filter: StatusFilter, q: string) {
    const params = new URLSearchParams({
      page: String(newPage),
      limit: String(limit),
    });
    if (filter !== "All") params.set("status", filter.toUpperCase());
    if (q) params.set("search", q);
    fetcher.load(`/app/inventory?${params.toString()}`);
  }

  function setFilter(filter: StatusFilter) {
    setActiveFilter(filter);
    onFilterChange?.(filter);
    setPage(1);
    load(1, filter, search);
  }

  function goToPage(newPage: number) {
    setPage(newPage);
    load(newPage, activeFilter, search);
  }

  useEffect(() => {
    if (!externalFilter || externalFilter === activeFilter) return;
    setActiveFilter(externalFilter);
    setPage(1);
    load(1, externalFilter, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      const params = new URLSearchParams({ page: "1", limit: String(limit) });
      if (activeFilter !== "All")
        params.set("status", activeFilter.toUpperCase());
      if (search) params.set("search", search);
      fetcher.load(`/app/inventory?${params.toString()}`);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const tabs = STATUS_FILTERS.map((f, index) => ({
    content: t(FILTER_KEY[f]),
    index,
    onAction: () => setFilter(f),
    id: f,
  }));

  const resourceName = {
    singular: t("dashboard.resourceName.singular", { defaultValue: "product" }),
    plural: t("dashboard.resourceName.plural", { defaultValue: "products" }),
  };

  const headings: React.ComponentProps<typeof IndexTable>["headings"] = [
    { title: t("dashboard.columns.product") },
    { title: t("dashboard.columns.sku") },
    { title: t("dashboard.columns.status") },
    { title: t("dashboard.columns.stock"), alignment: "end" },
    { title: t("dashboard.columns.reorderPoint"), alignment: "end" },
    { title: t("dashboard.columns.safetyStock"), alignment: "end" },
    { title: t("dashboard.columns.velocityDay"), alignment: "end" },
  ];

  const rowMarkup = forecasts.map((forecast: Forecast, index: number) => (
    <IndexTable.Row
      id={forecast.id}
      key={forecast.id}
      position={index}
      onClick={() => onRowClick?.(forecast)}
    >
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          {forecast.product.title}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text tone="subdued" as="span">
          {forecast.product.sku}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={STATUS_TONE[forecast.status]}>{forecast.status}</Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" alignment="end" numeric>
          {forecast.product.currentStock}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" alignment="end" numeric>
          {Math.round(forecast.reorderPoint)}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" alignment="end" numeric>
          {Math.round(forecast.safetyStock)}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" alignment="end" numeric>
          {forecast.velocityPerDay.toFixed(2)}
        </Text>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Card padding="0">
      <IndexFilters
        queryValue={search}
        queryPlaceholder={t("dashboard.searchPlaceholder")}
        onQueryChange={setSearch}
        onQueryClear={() => setSearch("")}
        tabs={tabs}
        selected={STATUS_FILTERS.indexOf(activeFilter)}
        onSelect={(index) => setFilter(STATUS_FILTERS[index])}
        mode={mode}
        setMode={setMode}
        filters={[]}
        appliedFilters={[]}
        onClearAll={() => setSearch("")}
        canCreateNewView={false}
        loading={isLoading}
        cancelAction={{
          onAction: () => {
            setSearch("");
            setMode(IndexFiltersMode.Default);
          },
          disabled: false,
          loading: false,
        }}
      />
      <IndexTable
        resourceName={resourceName}
        itemCount={total}
        headings={headings}
        selectable={false}
        pagination={{
          hasNext: currentPage < totalPages,
          hasPrevious: currentPage > 1,
          onNext: () => goToPage(currentPage + 1),
          onPrevious: () => goToPage(currentPage - 1),
          label: t("dashboard.showing", { from, to, total }),
        }}
      >
        {rowMarkup}
      </IndexTable>
    </Card>
  );
}
