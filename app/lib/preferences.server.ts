import prisma from "@/db.server";

export const SUPPORTED_LANGUAGES = ["en", "ja"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = "ja";

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export async function getShopLanguage(
  shop: string,
): Promise<SupportedLanguage> {
  const row = await prisma.shopPreference.findUnique({
    where: { shop },
    select: { language: true },
  });
  const stored = row?.language;
  return stored && isSupportedLanguage(stored) ? stored : DEFAULT_LANGUAGE;
}

export async function setShopLanguage(
  shop: string,
  language: SupportedLanguage,
): Promise<void> {
  await prisma.shopPreference.upsert({
    where: { shop },
    update: { language },
    create: { shop, language },
  });
}
