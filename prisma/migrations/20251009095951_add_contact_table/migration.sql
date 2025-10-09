-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contacts_createdAt_idx" ON "contacts"("createdAt");

-- CreateIndex
CREATE INDEX "contacts_email_idx" ON "contacts"("email");
