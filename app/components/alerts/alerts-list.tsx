"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActionList,
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  IndexFilters,
  IndexFiltersMode,
  InlineGrid,
  InlineStack,
  Popover,
  SkeletonBodyText,
  SkeletonDisplayText,
  SkeletonThumbnail,
  Text,
  Thumbnail,
  useSetIndexFiltersMode,
} from "@shopify/polaris";
import {
  ClockIcon,
  EditIcon,
  ExternalIcon,
  MenuHorizontalIcon,
} from "@shopify/polaris-icons";
import { PAGE_LIMIT } from "@/routes/app.alerts";

import type {
  Forecast,
  ForecastListResponse,
  ForecastStatus,
} from "@/types/api";
import { useVariantImage } from "@/hooks/use-variant-image";
import { ProductVariantLink } from "@/components/product-variant-link";

function extractNumericId(gid?: string | null): string | null {
  if (!gid) return null;
  return gid.split("/").pop() ?? gid;
}

function showToast(message: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).shopify?.toast.show(message, { duration: 2500 });
}

function AlertCardActions({ forecast }: { forecast: Forecast }) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { product } = forecast;

  const productId = extractNumericId(product.shopifyProductId);
  const variantId = extractNumericId(product.shopifyVariantId);
  const shopifyUrl = `shopify:admin/products/${productId}${
    variantId ? `/variants/${variantId}` : ""
  }`;

  function handleMarkOrdered() {
    // TODO: POST /app/alert/mark-ordered
    //   body: { variantId, expectedArrival: today + leadTimeDays }
    showToast(
      t("alerts.actions.markedOrdered", {
        defaultValue: "Marked as ordered (pending API)",
      }),
    );
  }

  function handleSnooze() {
    // TODO: POST /app/alert/snooze  body: { variantId, days: 7 }
    showToast(
      t("alerts.actions.snoozed", {
        defaultValue: "Snoozed for 7 days (pending API)",
      }),
    );
    setMenuOpen(false);
  }

  function handleUpdateLeadTime() {
    // TODO: open a lead-time editor (modal) wired to /app/update-lead-time
    showToast(
      t("alerts.actions.updateLeadTime", {
        defaultValue: "Open lead time editor (TODO)",
      }),
    );
    setMenuOpen(false);
  }

  return (
    <InlineStack gap="200" wrap={false}>
      <Button onClick={handleMarkOrdered}>
        {t("alerts.actions.markOrdered", { defaultValue: "Mark as ordered" })}
      </Button>
      <Popover
        active={menuOpen}
        onClose={() => setMenuOpen(false)}
        activator={
          <Button
            icon={MenuHorizontalIcon}
            accessibilityLabel={t("alerts.actions.more", {
              defaultValue: "More actions",
            })}
            onClick={() => setMenuOpen((v) => !v)}
          />
        }
      >
        <ActionList
          actionRole="menuitem"
          items={[
            {
              content: t("alerts.actions.snooze7Days", {
                defaultValue: "Snooze 7 days",
              }),
              icon: ClockIcon,
              onAction: handleSnooze,
            },
            {
              content: t("alerts.actions.updateLeadTime", {
                defaultValue: "Update lead time",
              }),
              icon: EditIcon,
              onAction: handleUpdateLeadTime,
            },
            {
              content: t("alerts.actions.viewOnShopify", {
                defaultValue: "View on Shopify",
              }),
              icon: ExternalIcon,
              url: shopifyUrl,
            },
          ]}
        />
      </Popover>
    </InlineStack>
  );
}

export function AlertsListSkeleton() {
  return (
    <BlockStack gap="500">
      {[0, 1].map((s) => (
        <BlockStack key={s} gap="300">
          <SkeletonDisplayText size="small" />
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <InlineStack gap="400" wrap={false} blockAlign="start">
                <SkeletonThumbnail size="large" />
                <Box minWidth="0" width="100%">
                  <BlockStack gap="300">
                    <SkeletonBodyText lines={3} />
                    <SkeletonBodyText lines={2} />
                  </BlockStack>
                </Box>
              </InlineStack>
            </Card>
          ))}
        </BlockStack>
      ))}
    </BlockStack>
  );
}

function MetricBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <BlockStack gap="100">
      <Text as="span" variant="bodySm" tone="subdued">
        {label}
      </Text>
      {children}
    </BlockStack>
  );
}

function AlertCard({ forecast }: { forecast: Forecast }) {
  const { t } = useTranslation();
  const { product } = forecast;
  const isCritical = forecast.status === "CRITICAL";
  const { imageUrl, loading: imageLoading } = useVariantImage(
    product.shopifyVariantId,
  );

  const daysLeft = Math.max(0, Math.floor(forecast.daysOfStockRemaining));
  const safetyStock = Math.round(forecast.safetyStock);
  const suggestedOrder =
    Math.round(forecast.velocityPerDay * product.leadTimeDays) + safetyStock;

  const statusBadgeTone = isCritical ? "critical" : "warning";
  const metricsBg = isCritical ? "bg-surface-critical" : "bg-surface-caution";

  return (
    <Card padding="0">
        <Box padding="400">
          <InlineStack gap="400" wrap={false} blockAlign="start">
            {imageLoading ? (
              <SkeletonThumbnail size="large" />
            ) : imageUrl ? (
              <Thumbnail size="large" source={imageUrl} alt={product.title} />
            ) : (
              <SkeletonThumbnail size="large" />
            )}
            <Box minWidth="0" width="100%">
              <InlineStack
                align="space-between"
                blockAlign="start"
                gap="200"
                wrap={false}
              >
                <Box minWidth="0">
                  <BlockStack gap="100">
                    <ProductVariantLink
                      shopifyProductId={product.shopifyProductId}
                      shopifyVariantId={product.shopifyVariantId}
                    >
                      <Text as="h3" variant="headingMd" truncate>
                        {product.title}
                      </Text>
                    </ProductVariantLink>
                    <Text as="span" tone="subdued" variant="bodySm" truncate>
                      SKU: {product.sku}
                      {"  ·  "}
                      {t("alerts.card.reorderPoint")}:{" "}
                      {t("alerts.card.units", {
                        n: Math.round(forecast.reorderPoint),
                      })}
                      {"  ·  "}
                      {t("alerts.card.leadTime")}:{" "}
                      {t("alerts.card.days", { n: product.leadTimeDays })}
                    </Text>
                    <InlineStack>
                      <Badge tone={statusBadgeTone}>
                        {isCritical
                          ? t("alerts.card.outOfStock")
                          : t("alerts.card.reorderSoon")}
                      </Badge>
                    </InlineStack>
                  </BlockStack>
                </Box>
                <AlertCardActions forecast={forecast} />
              </InlineStack>
            </Box>
          </InlineStack>
        </Box>

        <Box
          padding="400"
          background={metricsBg}
          borderBlockStartWidth="025"
          borderColor="border"
        >
          <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
            <MetricBlock label={t("alerts.card.currentStock")}>
              <Text as="p" variant="headingLg" fontWeight="bold">
                {t("alerts.card.units", { n: product.currentStock })}
              </Text>
            </MetricBlock>
            <MetricBlock label={t("alerts.card.stockout")}>
              <Text as="p" variant="headingLg" fontWeight="bold">
                {daysLeft === 0
                  ? t("alerts.card.now")
                  : t("alerts.card.days", { n: daysLeft })}
              </Text>
            </MetricBlock>
            <MetricBlock label={t("alerts.card.suggestedOrder")}>
              <Text as="p" variant="headingLg" fontWeight="bold">
                {t("alerts.card.units", { n: suggestedOrder })}
              </Text>
            </MetricBlock>
          </InlineGrid>
        </Box>
      </Card>
  );
}

function AlertSection({
  title,
  tone,
  status,
  initial,
  emptyMessage,
  search,
}: {
  title: string;
  tone: "critical" | "warning";
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
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const timer = setTimeout(() => loadPage(1, search, false), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const hasMore = currentPage < totalPages;

  return (
    <BlockStack gap="300">
      <InlineStack gap="200" blockAlign="center">
        <Text as="h2" variant="headingSm">
          {title}
        </Text>
        <Badge tone={tone}>{t("alerts.items", { n: total })}</Badge>
      </InlineStack>

      {forecasts.length === 0 ? (
        <Card>
          <Box padding="500">
            <InlineStack align="center">
              <Text as="span" tone="subdued">
                {emptyMessage}
              </Text>
            </InlineStack>
          </Box>
        </Card>
      ) : (
        <BlockStack gap="300">
          {forecasts.map((f) => (
            <AlertCard key={f.id} forecast={f} />
          ))}
          {hasMore && (
            <InlineStack align="center">
              <Button
                variant="secondary"
                onClick={() => loadPage(currentPage + 1, search, true)}
                loading={loading}
              >
                {t("alerts.loadMore", { shown: forecasts.length, total })}
              </Button>
            </InlineStack>
          )}
        </BlockStack>
      )}
    </BlockStack>
  );
}

type FilterValue = "all" | "critical" | "reorder";
const FILTER_TABS: FilterValue[] = ["all", "critical", "reorder"];

interface AlertsListProps {
  critical: ForecastListResponse;
  reorder: ForecastListResponse;
}

export function AlertsList({ critical, reorder }: AlertsListProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [search, setSearch] = useState("");
  const { mode, setMode } = useSetIndexFiltersMode();

  const tabs = FILTER_TABS.map((f, index) => ({
    id: f,
    content: t(`alerts.filters.${f}`),
    index,
    onAction: () => setFilter(f),
  }));

  return (
    <BlockStack gap="500">
      <Card padding="0">
        <IndexFilters
          queryValue={search}
          queryPlaceholder={t("alerts.searchPlaceholder")}
          onQueryChange={setSearch}
          onQueryClear={() => setSearch("")}
          tabs={tabs}
          selected={FILTER_TABS.indexOf(filter)}
          onSelect={(index) => setFilter(FILTER_TABS[index])}
          mode={mode}
          setMode={setMode}
          filters={[]}
          appliedFilters={[]}
          onClearAll={() => setSearch("")}
          canCreateNewView={false}
          cancelAction={{
            onAction: () => {
              setSearch("");
              setMode(IndexFiltersMode.Default);
            },
            disabled: false,
            loading: false,
          }}
        />
      </Card>

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
          tone="warning"
          status="REORDER"
          initial={reorder}
          emptyMessage={t("alerts.noReorder")}
          search={search}
        />
      )}
    </BlockStack>
  );
}
