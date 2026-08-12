-- CreateTable
CREATE TABLE "ComplexTransactionSnapshot" (
    "id" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodDate" TIMESTAMP(3) NOT NULL,
    "complexName" TEXT NOT NULL,
    "avgPricePerPyeong" DOUBLE PRECISION,
    "avgPriceTotal" DOUBLE PRECISION,
    "medianPriceTotal" DOUBLE PRECISION,
    "transactionCount" INTEGER NOT NULL,
    "propertyType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "raw" JSONB,

    CONSTRAINT "ComplexTransactionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DartCorpCode" (
    "corpCode" TEXT NOT NULL,
    "corpName" TEXT NOT NULL,
    "stockCode" TEXT,
    "modifyDate" TEXT,

    CONSTRAINT "DartCorpCode_pkey" PRIMARY KEY ("corpCode")
);

-- CreateTable
CREATE TABLE "DartEmployeeCache" (
    "corpCode" TEXT NOT NULL,
    "employeeCount" INTEGER,
    "bsnsYear" TEXT NOT NULL,
    "reprtCode" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DartEmployeeCache_pkey" PRIMARY KEY ("corpCode")
);

-- CreateIndex
CREATE INDEX "ComplexTransactionSnapshot_districtId_capturedAt_idx" ON "ComplexTransactionSnapshot"("districtId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ComplexTransactionSnapshot_districtId_complexName_propertyT_key" ON "ComplexTransactionSnapshot"("districtId", "complexName", "propertyType", "periodDate");

-- CreateIndex
CREATE INDEX "DartCorpCode_corpName_idx" ON "DartCorpCode"("corpName");

-- AddForeignKey
ALTER TABLE "ComplexTransactionSnapshot" ADD CONSTRAINT "ComplexTransactionSnapshot_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
