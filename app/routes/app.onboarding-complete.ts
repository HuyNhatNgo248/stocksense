import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { createApiClient } from "@/lib/api.server";
import { markOnboardingCompleted } from "@/lib/onboarding.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const api = createApiClient({
    shop: session.shop,
    accessToken: session.accessToken ?? "",
  });

  const form = await request.formData();

  try {
    await api.settings.update({
      ewmaAlpha: Number(form.get("alpha")),
      defaultServiceLevelZ: Number(form.get("z")),
      defaultLeadTimeDays: Number(form.get("leadTime")),
      syncFrequencyHours: Number(form.get("syncFrequency")),
      reviewPeriodDays: Number(form.get("reviewPeriod")),
    });

    const alertsEnabled = form.get("alertsEnabled") === "true";
    const alertEmail = ((form.get("alertEmail") as string) || "").trim();
    const alertsPayload: { alertsEnabled: boolean; alertEmail?: string } = {
      alertsEnabled,
    };
    if (alertEmail) alertsPayload.alertEmail = alertEmail;
    await api.settings.updateAlerts(alertsPayload);

    await markOnboardingCompleted(session.shop);

    return { success: true as const };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Failed to save onboarding",
    };
  }
};
