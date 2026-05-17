import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  isSupportedLanguage,
  setShopLanguage,
} from "@/lib/preferences.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const form = await request.formData();
  const lang = String(form.get("lang") ?? "").trim();

  if (!isSupportedLanguage(lang)) {
    return { success: false as const, error: "Unsupported language" };
  }

  await setShopLanguage(session.shop, lang);
  return { success: true as const, language: lang };
};
