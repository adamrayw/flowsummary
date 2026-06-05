CREATE TABLE "Summary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT,
    "title" TEXT NOT NULL,
    "template" TEXT,
    "sourceText" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keyInsights" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "conclusion" TEXT NOT NULL,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Summary_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Summary_userId_updatedAt_idx" ON "Summary"("userId", "updatedAt");
