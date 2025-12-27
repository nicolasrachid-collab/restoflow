-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN "min_reservation_advance_hours" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN "max_reservation_advance_days" INTEGER NOT NULL DEFAULT 30;

