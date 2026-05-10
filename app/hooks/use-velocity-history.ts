import { useState, useEffect } from "react";

import type { VelocityHistory } from "@/types/api";

export function useVelocityHistory(variantId: string) {
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
