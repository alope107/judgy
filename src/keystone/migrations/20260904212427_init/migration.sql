-- CreateTable
CREATE TABLE "SmokeTest" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmokeTest_pkey" PRIMARY KEY ("id")
);
