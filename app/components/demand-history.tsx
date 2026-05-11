import { useTranslation } from "react-i18next";
import type { VelocityHistory } from "@/types/api";

import { useVelocityHistory } from "@/hooks/use-velocity-history";

interface DemandHistoryModalProps {
  modalId: string;
  productTitle: string;
  variantId: string;
  data?: VelocityHistory | null;
  loading?: boolean;
}

export function DemandHistoryModal({
  modalId,
  productTitle,
  variantId,
  data: externalData,
  loading: externalLoading,
}: DemandHistoryModalProps) {
  const { data: fetched, loading: fetchLoading } = useVelocityHistory(
    externalData !== undefined ? "" : variantId,
  );

  const data = externalData !== undefined ? externalData : fetched;
  const loading =
    externalLoading !== undefined ? externalLoading : fetchLoading;

  return (
    <s-modal
      id={modalId}
      heading={`${productTitle} — Demand History`}
      accessibilityLabel="View demand history"
      size="large"
    >
      {loading || !data ? (
        <div className="h-48 w-full rounded animate-pulse bg-gray-200" />
      ) : (
        <s-table>
          <s-table-header-row>
            <s-table-header listSlot="primary">Date</s-table-header>
            <s-table-header listSlot="labeled" format="numeric">
              Units Sold
            </s-table-header>
            <s-table-header listSlot="labeled" format="numeric">
              EWMA Velocity
            </s-table-header>
          </s-table-header-row>
          <s-table-body>
            {data.map((row) => (
              <s-table-row key={row.date}>
                <s-table-cell>{row.date}</s-table-cell>
                <s-table-cell>{row.unitsSold ?? "—"}</s-table-cell>
                <s-table-cell>{row.ewmaVelocity.toFixed(2)}</s-table-cell>
              </s-table-row>
            ))}
          </s-table-body>
        </s-table>
      )}

      <s-button slot="secondary-actions" commandFor={modalId} command="--hide">
        Close
      </s-button>
    </s-modal>
  );
}

export function DemandHistoryButton({ modalId }: { modalId: string }) {
  const { t } = useTranslation();
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <s-button
      variant="secondary"
      icon={"page-list"}
      commandFor={modalId}
      command="--show"
    >
      {t("common.demandHistory")}
    </s-button>
  );
}
