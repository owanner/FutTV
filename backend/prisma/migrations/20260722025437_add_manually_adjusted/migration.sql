-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competitionId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "groupId" TEXT,
    "groupName" TEXT,
    "stageName" TEXT,
    "homeTeam" TEXT,
    "homeFlag" TEXT,
    "awayTeam" TEXT,
    "awayFlag" TEXT,
    "homeCode" TEXT,
    "awayCode" TEXT,
    "date" DATETIME NOT NULL,
    "stadium" TEXT,
    "city" TEXT,
    "referee" TEXT,
    "attendance" TEXT,
    "status" INTEGER NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "manuallyAdjusted" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Match" ("attendance", "awayCode", "awayFlag", "awayScore", "awayTeam", "city", "competitionId", "createdAt", "date", "groupId", "groupName", "homeCode", "homeFlag", "homeScore", "homeTeam", "id", "referee", "seasonId", "stadium", "stageId", "stageName", "status") SELECT "attendance", "awayCode", "awayFlag", "awayScore", "awayTeam", "city", "competitionId", "createdAt", "date", "groupId", "groupName", "homeCode", "homeFlag", "homeScore", "homeTeam", "id", "referee", "seasonId", "stadium", "stageId", "stageName", "status" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
