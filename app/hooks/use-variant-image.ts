import { useState, useEffect } from "react";

export function useVariantImage(variantId: string) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/app/variant-image?variantId=${encodeURIComponent(variantId)}`)
      .then((r) => r.json())
      .then((d: { url: string | null }) => setImageUrl(d.url))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [variantId]);

  return { imageUrl, loading };
}
