/*
  Warnings:

  - Added the required column `competitionId` to the `Standing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seasonId` to the `Standing` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Standing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "competitionId" TEXT NOT NULL DEFAULT 'wc2026',
    "seasonId" TEXT NOT NULL DEFAULT '285023',
    "groupId" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "teamCode" TEXT,
    "position" INTEGER NOT NULL,
    "played" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "draws" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "goalsFor" INTEGER NOT NULL,
    "goalsAgainst" INTEGER NOT NULL,
    "goalDifference" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Standing" ("draws", "goalDifference", "goalsAgainst", "goalsFor", "groupId", "groupName", "id", "losses", "played", "points", "position", "teamCode", "teamId", "teamName", "updatedAt", "wins") SELECT "draws", "goalDifference", "goalsAgainst", "goalsFor", "groupId", "groupName", "id", "losses", "played", "points", "position", "teamCode", "teamId", "teamName", "updatedAt", "wins" FROM "Standing";
DROP TABLE "Standing";
ALTER TABLE "new_Standing" RENAME TO "Standing";
CREATE UNIQUE INDEX "Standing_competitionId_seasonId_teamId_key" ON "Standing"("competitionId", "seasonId", "teamId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
