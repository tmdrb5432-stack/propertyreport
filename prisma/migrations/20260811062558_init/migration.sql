-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameKo" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "radiusM" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TransitSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "districtId" TEXT NOT NULL,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subwayLines" JSONB NOT NULL,
    "subwayStationCount" INTEGER NOT NULL,
    "busStopCount" INTEGER NOT NULL,
    "transitScore" REAL NOT NULL,
    "source" TEXT NOT NULL,
    "raw" JSONB,
    CONSTRAINT "TransitSnapshot_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "districtId" TEXT NOT NULL,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyCount" INTEGER NOT NULL,
    "employeeCount" INTEGER,
    "notableCompanies" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "raw" JSONB,
    CONSTRAINT "CompanySnapshot_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransactionSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "districtId" TEXT NOT NULL,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodDate" DATETIME NOT NULL,
    "avgPricePerPyeong" REAL,
    "avgPriceTotal" REAL,
    "medianPriceTotal" REAL,
    "transactionCount" INTEGER NOT NULL,
    "propertyType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "raw" JSONB,
    CONSTRAINT "TransactionSnapshot_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AskingPriceSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "districtId" TEXT NOT NULL,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodDate" DATETIME NOT NULL,
    "avgAskingPricePerPyeong" REAL,
    "avgAskingPriceTotal" REAL,
    "listingCount" INTEGER NOT NULL,
    "propertyType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "raw" JSONB,
    CONSTRAINT "AskingPriceSnapshot_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MigrationSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "districtId" TEXT NOT NULL,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodMonth" TEXT NOT NULL,
    "inMigration" INTEGER NOT NULL,
    "outMigration" INTEGER NOT NULL,
    "netMigration" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "raw" JSONB,
    CONSTRAINT "MigrationSnapshot_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UpdateLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "districtId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "ranAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UpdateLog_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TransitSnapshot_districtId_capturedAt_idx" ON "TransitSnapshot"("districtId", "capturedAt");

-- CreateIndex
CREATE INDEX "CompanySnapshot_districtId_capturedAt_idx" ON "CompanySnapshot"("districtId", "capturedAt");

-- CreateIndex
CREATE INDEX "TransactionSnapshot_districtId_capturedAt_idx" ON "TransactionSnapshot"("districtId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionSnapshot_districtId_propertyType_periodDate_key" ON "TransactionSnapshot"("districtId", "propertyType", "periodDate");

-- CreateIndex
CREATE INDEX "AskingPriceSnapshot_districtId_capturedAt_idx" ON "AskingPriceSnapshot"("districtId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AskingPriceSnapshot_districtId_propertyType_periodDate_key" ON "AskingPriceSnapshot"("districtId", "propertyType", "periodDate");

-- CreateIndex
CREATE INDEX "MigrationSnapshot_districtId_capturedAt_idx" ON "MigrationSnapshot"("districtId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MigrationSnapshot_districtId_periodMonth_key" ON "MigrationSnapshot"("districtId", "periodMonth");

-- CreateIndex
CREATE INDEX "UpdateLog_districtId_metricType_ranAt_idx" ON "UpdateLog"("districtId", "metricType", "ranAt");
