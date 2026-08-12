-- AlterTable
ALTER TABLE "ComplexLocationCache" ADD COLUMN "nearestSubwayName" TEXT;
ALTER TABLE "ComplexLocationCache" ADD COLUMN "nearestSubwayDistanceM" DOUBLE PRECISION;

-- Clear existing rows so they get re-resolved with subway distance on the
-- next complex-transaction cron run — cheap since ComplexTransactionSnapshot
-- rows (the actual price data) are untouched, and the cron already treats a
-- missing cache entry the same as a first-time lookup.
DELETE FROM "ComplexLocationCache";
