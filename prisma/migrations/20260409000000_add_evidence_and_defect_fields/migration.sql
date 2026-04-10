-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "defectId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT NOT NULL DEFAULT '',
    "phase" TEXT NOT NULL DEFAULT '',
    "uploadedAt" TEXT NOT NULL,
    CONSTRAINT "Evidence_defectId_fkey" FOREIGN KEY ("defectId") REFERENCES "Defect" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Defect" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "created" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "containment" TEXT NOT NULL DEFAULT '',
    "rootCause" TEXT NOT NULL DEFAULT '',
    "correctiveActions" TEXT NOT NULL DEFAULT '',
    "implementation" TEXT NOT NULL DEFAULT '',
    "preventiveActions" TEXT NOT NULL DEFAULT '',
    "recognition" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "bridged" BOOLEAN NOT NULL DEFAULT false,
    "isIsNot" TEXT NOT NULL DEFAULT '{}',
    "fiveW2H" TEXT NOT NULL DEFAULT '{}'
);
INSERT INTO "new_Defect" ("bridged", "containment", "created", "description", "dueDate", "id", "owner", "phase", "rootCause", "severity", "team", "title") SELECT "bridged", "containment", "created", "description", "dueDate", "id", "owner", "phase", "rootCause", "severity", "team", "title" FROM "Defect";
DROP TABLE "Defect";
ALTER TABLE "new_Defect" RENAME TO "Defect";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
