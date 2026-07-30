-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "customerName" TEXT,
    "priceSnapshot" INTEGER NOT NULL,
    "unsubscribeToken" TEXT NOT NULL,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_unsubscribeToken_key" ON "WaitlistEntry"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "WaitlistEntry_variantId_idx" ON "WaitlistEntry"("variantId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_notifiedAt_idx" ON "WaitlistEntry"("notifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_variantId_email_key" ON "WaitlistEntry"("variantId", "email");

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
