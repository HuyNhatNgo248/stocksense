import type { ReactNode } from "react";

function extractNumericId(gid?: string | null): string | null {
  if (!gid) return null;
  return gid.split("/").pop() ?? gid;
}

export interface ProductVariantLinkProps {
  shopifyProductId: string;
  shopifyVariantId?: string;
  children: ReactNode;
}

export function ProductVariantLink({
  shopifyProductId,
  shopifyVariantId,
  children,
}: ProductVariantLinkProps) {
  const productId = extractNumericId(shopifyProductId);
  const variantId = extractNumericId(shopifyVariantId);
  const href = `shopify:admin/products/${productId}/${variantId ? `variants/${variantId}` : ""}`;

  return <s-link href={href}>{children}</s-link>;
}
