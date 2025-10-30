-- CreateTable
CREATE TABLE "SwapHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requesterId" TEXT NOT NULL,
    "responderId" TEXT NOT NULL,
    "mySlotId" TEXT NOT NULL,
    "theirSlotId" TEXT NOT NULL,
    "mySlotTitle" TEXT NOT NULL,
    "theirSlotTitle" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "decidedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
