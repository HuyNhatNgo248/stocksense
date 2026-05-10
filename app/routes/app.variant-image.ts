import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const variantId = url.searchParams.get("variantId");
  if (!variantId) return Response.json({ url: null });

  const gid = variantId.startsWith("gid://")
    ? variantId
    : `gid://shopify/ProductVariant/${variantId}`;

  const res = await admin.graphql(
    `#graphql
    query GetVariantImage($id: ID!) {
      productVariant(id: $id) {
        image { url }
        product { featuredImage { url } }
      }
    }`,
    { variables: { id: gid } },
  );

  const json = await res.json();
  const variant = json.data?.productVariant;
  const imageUrl =
    variant?.image?.url ?? variant?.product?.featuredImage?.url ?? null;

  return Response.json({ url: imageUrl });
};
