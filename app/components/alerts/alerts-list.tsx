"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFetcher } from "react-router";
import {
  ActionList,
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  DatePicker,
  IndexFilters,
  IndexFiltersMode,
  InlineGrid,
  InlineStack,
  Link,
  Modal,
  Popover,
  SkeletonBodyText,
  SkeletonDisplayText,
  SkeletonThumbnail,
  Text,
  Thumbnail,
  useSetIndexFiltersMode,
} from "@shopify/polaris";
import {
  CalendarIcon,
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
import { ProductDetailPanel } from "@/components/dashboard/product-detail-panel";

function extractNumericId(gid?: string | null): string | null {
  if (!gid) return null;
  return gid.split("/").pop() ?? gid;
}

function showToast(message: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).shopify?.toast.show(message, { duration: 2500 });
}

function isoToDate(iso: string): Date {
  // Expected format is YYYY-MM-DD (per API). Parse as local midnight to avoid TZ drift.
  // Fall back to native Date parsing for any other ISO shape.
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return new Date(`${iso}T00:00:00`);
  }
  return new Date(iso);
}

function formatArrivalDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = isoToDate(iso);
  if (isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function dateToISO(d: Date): string {
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return dateToISO(d);
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function AlertCardActions({
  forecast,
  expectedArrival,
  onMarkedChange,
}: {
  forecast: Forecast;
  expectedArrival: string | null;
  onMarkedChange: (date: string | null) => void;
}) {
  const { t } = useTranslation();
  const fetcher = useFetcher<{ success: boolean }>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editDateOpen, setEditDateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfToday());
  const [{ month, year }, setMonth] = useState(() => {
    const d = startOfToday();
    return { month: d.getMonth(), year: d.getFullYear() };
  });

  const { product } = forecast;
  const variantId = product.shopifyVariantId;
  const productNumId = extractNumericId(product.shopifyProductId);
  const variantNumId = extractNumericId(variantId);
  const shopifyUrl = `shopify:admin/products/${productNumId}${
    variantNumId ? `/variants/${variantNumId}` : ""
  }`;

  const isMarked = !!expectedArrival;
  const isSubmitting = fetcher.state === "submitting";

  function submitMark(date: string) {
    onMarkedChange(date);
    fetcher.submit(
      { intent: "mark", variantId, expectedArrivalDate: date },
      {
        method: "post",
        action: "/app/mark-ordered",
        encType: "application/json",
      },
    );
  }

  function submitUnmark() {
    onMarkedChange(null);
    fetcher.submit(
      { intent: "unmark", variantId },
      {
        method: "post",
        action: "/app/mark-ordered",
        encType: "application/json",
      },
    );
  }

  function handleMarkOrdered() {
    const days = product.leadTimeDays > 0 ? product.leadTimeDays : 7;
    const iso = todayPlusDays(days);
    submitMark(iso);
    showToast(
      t("alerts.actions.markedOrdered", {
        defaultValue: `Marked as ordered · arriving ${formatArrivalDate(iso)}`,
        date: formatArrivalDate(iso),
      }),
    );
  }

  function handleUnmark() {
    submitUnmark();
    setMenuOpen(false);
    showToast(
      t("alerts.actions.unmarked", {
        defaultValue: "Removed from ordered",
      }),
    );
  }

  function handleOpenEditDate() {
    const initialIso =
      expectedArrival ?? todayPlusDays(product.leadTimeDays || 7);
    const parsed = isoToDate(initialIso);
    const initial = isNaN(parsed.getTime()) ? startOfToday() : parsed;
    setSelectedDate(initial);
    setMonth({ month: initial.getMonth(), year: initial.getFullYear() });
    setEditDateOpen(true);
    setMenuOpen(false);
  }

  function handleSaveDate() {
    const iso = dateToISO(selectedDate);
    submitMark(iso);
    setEditDateOpen(false);
    showToast(
      t("alerts.actions.dateUpdated", {
        defaultValue: `Arrival date updated to ${formatArrivalDate(iso)}`,
        date: formatArrivalDate(iso),
      }),
    );
  }

  function handleSnooze() {
    showToast(
      t("alerts.actions.snoozed", {
        defaultValue: "Snoozed for 7 days (pending API)",
      }),
    );
    setMenuOpen(false);
  }

  function handleUpdateLeadTime() {
    showToast(
      t("alerts.actions.updateLeadTime", {
        defaultValue: "Open lead time editor (TODO)",
      }),
    );
    setMenuOpen(false);
  }

  const menuItems = isMarked
    ? [
        {
          content: t("alerts.actions.editArrival", {
            defaultValue: "Edit arrival date",
          }),
          icon: CalendarIcon,
          onAction: handleOpenEditDate,
        },
        {
          content: t("alerts.actions.viewOnShopify", {
            defaultValue: "View on Shopify",
          }),
          icon: ExternalIcon,
          url: shopifyUrl,
        },
      ]
    : [
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
      ];

  return (
    <>
      <InlineStack gap="200" wrap={false}>
        {isMarked ? (
          <Button onClick={handleUnmark} loading={isSubmitting}>
            {t("alerts.actions.unmark", { defaultValue: "Unmark" })}
          </Button>
        ) : (
          <Button onClick={handleMarkOrdered} loading={isSubmitting}>
            {t("alerts.actions.markOrdered", {
              defaultValue: "Mark as ordered",
            })}
          </Button>
        )}
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
          <ActionList actionRole="menuitem" items={menuItems} />
        </Popover>
      </InlineStack>

      <Modal
        open={editDateOpen}
        onClose={() => setEditDateOpen(false)}
        title={t("alerts.actions.editArrival", {
          defaultValue: "Edit arrival date",
        })}
        primaryAction={{
          content: t("common.save", { defaultValue: "Save" }),
          onAction: handleSaveDate,
          loading: isSubmitting,
        }}
        secondaryActions={[
          {
            content: t("common.cancel", { defaultValue: "Cancel" }),
            onAction: () => setEditDateOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <DatePicker
              month={month}
              year={year}
              selected={selectedDate}
              onChange={({ start }) => setSelectedDate(start)}
              onMonthChange={(m, y) => setMonth({ month: m, year: y })}
              disableDatesBefore={startOfToday()}
            />
            <Text as="p" tone="subdued" variant="bodySm">
              {t("alerts.actions.arrivingOn", {
                defaultValue: `Arriving ${formatArrivalDate(dateToISO(selectedDate))}`,
                date: formatArrivalDate(dateToISO(selectedDate)),
              })}
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </>
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

function AlertCard({
  forecast,
  onSelect,
}: {
  forecast: Forecast;
  onSelect: (forecast: Forecast) => void;
}) {
  const { t } = useTranslation();
  const { product } = forecast;
  const isCritical = forecast.status === "CRITICAL";
  const { imageUrl, loading: imageLoading } = useVariantImage(
    product.shopifyVariantId,
  );

  // undefined = use server value; null = unmarked locally; string = marked locally
  const [localExpectedArrival, setLocalExpectedArrival] = useState<
    string | null | undefined
  >(undefined);

  const expectedArrival =
    localExpectedArrival !== undefined
      ? localExpectedArrival
      : (forecast.markOrdered?.expectedArrivalDate ?? null);
  const isMarkedOrdered = !!expectedArrival;

  const daysLeft = Math.max(0, Math.floor(forecast.daysOfStockRemaining));
  const safetyStock = Math.round(forecast.safetyStock);
  const suggestedOrder =
    Math.round(forecast.velocityPerDay * product.leadTimeDays) + safetyStock;

  const statusBadgeTone = isCritical ? "critical" : "warning";
  const metricsBg = isMarkedOrdered
    ? "bg-surface-secondary"
    : isCritical
      ? "bg-surface-critical"
      : "bg-surface-caution";

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
                  <Link onClick={() => onSelect(forecast)} removeUnderline>
                    <Text as="h3" variant="headingMd" truncate>
                      {product.title}
                    </Text>
                  </Link>
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
                    {isMarkedOrdered ? (
                      <Badge tone="success">
                        {t("alerts.card.orderedArriving", {
                          defaultValue: `Ordered · arriving ${formatArrivalDate(expectedArrival!)}`,
                          date: formatArrivalDate(expectedArrival!),
                        })}
                      </Badge>
                    ) : (
                      <Badge tone={statusBadgeTone}>
                        {isCritical
                          ? t("alerts.card.outOfStock")
                          : t("alerts.card.reorderSoon")}
                      </Badge>
                    )}
                  </InlineStack>
                </BlockStack>
              </Box>
              <AlertCardActions
                forecast={forecast}
                expectedArrival={expectedArrival}
                onMarkedChange={setLocalExpectedArrival}
              />
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
  onSelect,
}: {
  title: string;
  tone: "critical" | "warning";
  status: ForecastStatus;
  initial: ForecastListResponse;
  emptyMessage: string;
  search: string;
  onSelect: (forecast: Forecast) => void;
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
            <AlertCard key={f.id} forecast={f} onSelect={onSelect} />
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
  const [selectedForecast, setSelectedForecast] = useState<Forecast | null>(
    null,
  );
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

      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <BlockStack gap="500">
            {filter !== "reorder" && (
              <AlertSection
                title={t("alerts.criticalSection")}
                tone="critical"
                status="CRITICAL"
                initial={critical}
                emptyMessage={t("alerts.noCritical")}
                search={search}
                onSelect={setSelectedForecast}
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
                onSelect={setSelectedForecast}
              />
            )}
          </BlockStack>
        </div>
        <div
          style={{
            width: selectedForecast ? 320 : 0,
            flexShrink: 0,
            overflow: "hidden",
            transition: "width 300ms ease-in-out",
            position: "sticky",
            top: 0,
            alignSelf: "flex-start",
          }}
        >
          {selectedForecast && (
            <div
              style={{
                width: 320,
                maxHeight: "100vh",
                overflowY: "auto",
              }}
            >
              <ProductDetailPanel
                forecast={selectedForecast}
                onClose={() => setSelectedForecast(null)}
              />
            </div>
          )}
        </div>
      </div>
    </BlockStack>
  );
}
