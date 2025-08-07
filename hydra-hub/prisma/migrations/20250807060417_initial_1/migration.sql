-- CreateEnum
CREATE TYPE "public"."StorageType" AS ENUM ('OBJECT', 'TABLE');

-- CreateTable
CREATE TABLE "public"."data_asset" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "storage_type" "public"."StorageType" NOT NULL,
    "storage_location" TEXT NOT NULL,
    "asset_type" TEXT NOT NULL,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_updated" TIMESTAMP(3) NOT NULL,
    "owner_uuid" TEXT NOT NULL,

    CONSTRAINT "data_asset_pkey" PRIMARY KEY ("id")
);
