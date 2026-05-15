import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { createApiClient } from "@/lib/api.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const api = createApiClient({
    shop: session.shop,
    accessToken: session.accessToken ?? "",
  });

  const body = await request.json();

  if (body.intent === "unmark") {
    await api.forecasts.unmarkOrdered(body.variantId);
    return Response.json({ success: true });
  }

  await api.forecasts.markOrdered(body.variantId, body.expectedArrivalDate);
  return Response.json({ success: true });
};
