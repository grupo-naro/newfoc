-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "createdById" TEXT;

-- CreateIndex
CREATE INDEX "User_isAdmin_idx" ON "User"("isAdmin");

-- AddForeignKey
ALTER TABLE "User"
  ADD CONSTRAINT "User_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
