-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Standing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
