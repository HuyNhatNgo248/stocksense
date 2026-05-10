import { useState, useEffect } from "react";
import type { VelocityHistory } from "@/types/api";

function useVelocityHistory(variantId: string) {
  const [data, setData] = useState<VelocityHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/app/velocity-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId }),
    })
      .then((r) => r.json())
      .then((d: VelocityHistory) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [variantId]);

  return { data, loading };
}

export function DemandHistoryButton({ modalId }: { modalId: string }) {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <s-button
      variant="secondary"
      icon={"page-list"}
      commandFor={modalId}
      command="--show"
    >
      View Demand History
    </s-button>
  );
}

export function DemandHistoryModal({
  modalId,
  productTitle,
  variantId,
  data: externalData,
  loading: externalLoading,
}: {
  modalId: string;
  productTitle: string;
  variantId: string;
  data?: VelocityHistory | null;
  loading?: boolean;
}) {
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
