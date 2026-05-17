import prisma from "@/db.server";

export async function isOnboardingCompleted(shop: string): Promise<boolean> {
  const row = await prisma.shopOnboarding.findUnique({
    where: { shop },
    select: { onboardingCompleted: true },
  });
  return row?.onboardingCompleted ?? false;
}

export async function markOnboardingCompleted(shop: string): Promise<void> {
  const now = new Date();
  await prisma.shopOnboarding.upsert({
    where: { shop },
    update: { onboardingCompleted: true, onboardingCompletedAt: now },
    create: {
      shop,
      onboardingCompleted: true,
      onboardingCompletedAt: now,
    },
  });
}
