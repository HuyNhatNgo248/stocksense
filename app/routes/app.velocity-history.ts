import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { createApiClient } from "@/lib/api.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const api = createApiClient({
    shop: session.shop,
    accessToken: session.accessToken ?? "",
  });

  const { variantId } = await request.json();
  const data = await api.forecasts.velocityHistory(variantId);
  return Response.json(data);
};
