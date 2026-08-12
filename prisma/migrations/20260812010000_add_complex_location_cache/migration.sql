-- CreateTable
CREATE TABLE "ComplexLocationCache" (
    "districtId" TEXT NOT NULL,
    "complexName" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplexLocationCache_pkey" PRIMARY KEY ("districtId","complexName")
);
