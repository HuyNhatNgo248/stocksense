-- CreateTable
CREATE TABLE "ShopPreference" (
    "shop" TEXT NOT NULL PRIMARY KEY,
    "language" TEXT NOT NULL DEFAULT 'ja',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
