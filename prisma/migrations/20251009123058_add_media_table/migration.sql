-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'OTHER');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('USER', 'COURSE', 'LESSON', 'ASSIGNMENT', 'POST', 'COMMENT', 'OTHER');

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "type" "MediaType" NOT NULL,
    "status" "MediaStatus" NOT NULL DEFAULT 'UPLOADING',
    "s3Key" VARCHAR(500) NOT NULL,
    "s3Bucket" VARCHAR(255) NOT NULL,
    "s3Region" VARCHAR(50) NOT NULL,
    "s3Url" VARCHAR(1000) NOT NULL,
    "entityType" "EntityType",
    "entityId" VARCHAR(255),
    "description" TEXT,
    "alt" VARCHAR(500),
    "duration" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "thumbnailUrl" VARCHAR(1000),
    "uploadedById" TEXT NOT NULL,
    "uploadedByIp" VARCHAR(45),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "media_s3Key_key" ON "media"("s3Key");

-- CreateIndex
CREATE INDEX "media_entityType_entityId_idx" ON "media"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "media_uploadedById_idx" ON "media"("uploadedById");

-- CreateIndex
CREATE INDEX "media_type_idx" ON "media"("type");

-- CreateIndex
CREATE INDEX "media_status_idx" ON "media"("status");

-- CreateIndex
CREATE INDEX "media_createdAt_idx" ON "media"("createdAt");

-- CreateIndex
CREATE INDEX "media_s3Key_idx" ON "media"("s3Key");
