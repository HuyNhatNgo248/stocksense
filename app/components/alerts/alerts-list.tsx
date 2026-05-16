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
  IndexTable,
  InlineStack,
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
  CheckCircleIcon,
  MenuHorizontalIcon,
} from "@shopify/polaris-icons";
import { PAGE_LIMIT } from "@/routes/app.alerts";

import type {
  Forecast,
  ForecastListResponse,
  ForecastStatus,
} from "@/types/api";
import { useVariantImage } from "@/hooks/use-variant-image";
import { ForecastStatusBadge } from "@/components/forecast-status-badge";
import { ProductVariantLink } from "../product-variant-link";

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
    setMenuOpen(false);
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
          content: t("alerts.actions.unmark", {
            defaultValue: "Mark as not ordered",
          }),
          destructive: true,
          onAction: handleUnmark,
        },
      ]
    : [
        {
          content: t("alerts.actions.markOrdered", {
            defaultValue: "Mark as ordered",
          }),
          icon: CheckCircleIcon,
          onAction: handleMarkOrdered,
        },
      ];

  return (
    <>
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
            loading={isSubmitting}
          />
        }
      >
        <ActionList actionRole="menuitem" items={menuItems} />
      </Popover>

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

function AlertRow({
  forecast,
  position,
}: {
  forecast: Forecast;
  position: number;
}) {
  const { t } = useTranslation();
  const { product, status: forecastStatus } = forecast;
  const { imageUrl, loading: imageLoading } = useVariantImage(
    product.shopifyVariantId,
  );

  const [localExpectedArrival, setLocalExpectedArrival] = useState<
    string | null | undefined
  >(undefined);

  const expectedArrival =
    localExpectedArrival !== undefined
      ? localExpectedArrival
      : (forecast.markOrdered?.expectedArrivalDate ?? null);
  const isMarkedOrdered = !!expectedArrival;

  const daysLeft = Math.max(0, Math.floor(forecast.daysOfStockRemaining));
  const suggestedOrder = forecast.suggestedOrderQty;

  return (
    <IndexTable.Row id={forecast.id} position={position}>
      <IndexTable.Cell>
        <Box maxWidth="260px">
          <InlineStack gap="300" blockAlign="center" wrap={false}>
            <div style={{ flexShrink: 0 }}>
              {imageLoading ? (
                <SkeletonThumbnail size="small" />
              ) : imageUrl ? (
                <Thumbnail size="small" source={imageUrl} alt={product.title} />
              ) : (
                <SkeletonThumbnail size="small" />
              )}
            </div>
            <Box minWidth="0">
              <BlockStack gap="050">
                <ProductVariantLink
                  shopifyProductId={product.shopifyProductId}
                  shopifyVariantId={product.shopifyVariantId}
                >
                  <Text
                    as="span"
                    variant="bodyMd"
                    fontWeight="semibold"
                    truncate
                  >
                    {product.title}
                  </Text>
                </ProductVariantLink>
                <Text as="span" tone="subdued" variant="bodySm" truncate>
                  {product.sku}
                </Text>
              </BlockStack>
            </Box>
          </InlineStack>
        </Box>
      </IndexTable.Cell>

      <IndexTable.Cell>
        {isMarkedOrdered ? (
          <Badge tone="success">
            {t("alerts.row.orderedOn", {
              defaultValue: `Ordered · ${formatArrivalDate(expectedArrival!)}`,
              date: formatArrivalDate(expectedArrival!),
            })}
          </Badge>
        ) : (
          <ForecastStatusBadge status={forecastStatus} />
        )}
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text as="span" alignment="end" numeric>
          {product.currentStock}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text as="span" alignment="end" numeric>
          {daysLeft === 0 ? t("alerts.card.now") : `${daysLeft}d`}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text as="span" alignment="end" numeric>
          {suggestedOrder}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div onClick={(e) => e.stopPropagation()}>
          <AlertCardActions
            forecast={forecast}
            expectedArrival={expectedArrival}
            onMarkedChange={setLocalExpectedArrival}
          />
        </div>
      </IndexTable.Cell>
    </IndexTable.Row>
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

  // Sync local state with the loader's `initial` prop whenever it changes
  // (e.g., after revalidator.revalidate() from the page refresh button).
  // Without this, useState initializers only run on mount and the table
  // would keep showing stale data after a refresh.
  useEffect(() => {
    setForecasts(initial.data);
    setCurrentPage(initial.page);
    setTotalPages(initial.totalPages);
    setTotal(initial.total);
  }, [initial]);

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

      <Card padding="0">
        {forecasts.length === 0 ? (
          <Box padding="500">
            <InlineStack align="center">
              <Text as="span" tone="subdued">
                {emptyMessage}
              </Text>
            </InlineStack>
          </Box>
        ) : (
          <IndexTable
            resourceName={{
              singular: t("alerts.row.singular", { defaultValue: "alert" }),
              plural: t("alerts.row.plural", { defaultValue: "alerts" }),
            }}
            itemCount={forecasts.length}
            selectable={false}
            headings={[
              {
                title: t("alerts.row.product", { defaultValue: "Product" }),
              },
              {
                title: t("alerts.row.status", { defaultValue: "Status" }),
              },
              {
                title: t("alerts.row.stock", { defaultValue: "Stock" }),
                alignment: "end",
              },
              {
                title: t("alerts.row.stockout", {
                  defaultValue: "Stockout",
                }),
                alignment: "end",
              },
              {
                title: t("alerts.row.suggested", {
                  defaultValue: "Suggested order",
                }),
                alignment: "end",
              },
              { title: "" },
            ]}
          >
            {forecasts.map((f, idx) => (
              <AlertRow key={f.id} forecast={f} position={idx} />
            ))}
          </IndexTable>
        )}
      </Card>

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
