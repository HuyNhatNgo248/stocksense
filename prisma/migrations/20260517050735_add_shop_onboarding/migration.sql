-- CreateTable
CREATE TABLE "ShopOnboarding" (
    "shop" TEXT NOT NULL PRIMARY KEY,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "onboardingCompletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
