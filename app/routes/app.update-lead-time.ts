import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { createApiClient } from "@/lib/api.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const api = createApiClient({
    shop: session.shop,
    accessToken: session.accessToken ?? "",
  });

  const { variantId, leadTimeDays } = await request.json();
  const product = await api.inventory.updateSettings(variantId, {
    leadTimeDays,
  });
  return Response.json(product);
};
