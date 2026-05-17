import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { markOnboardingCompleted } from "@/lib/onboarding.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  await markOnboardingCompleted(session.shop);
  return { success: true as const };
};
