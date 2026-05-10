import { useState, useEffect } from "react";

const imageCache = new Map<string, string | null>();

export function useVariantImage(variantId: string) {
  const [imageUrl, setImageUrl] = useState<string | null>(
    () => imageCache.get(variantId) ?? null,
  );
  const [loading, setLoading] = useState(!imageCache.has(variantId));

  useEffect(() => {
    if (imageCache.has(variantId)) {
      setImageUrl(imageCache.get(variantId) ?? null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/app/variant-image?variantId=${encodeURIComponent(variantId)}`)
      .then((r) => r.json())
      .then((d: { url: string | null }) => {
        imageCache.set(variantId, d.url);
        setImageUrl(d.url);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [variantId]);

  return { imageUrl, loading };
}
