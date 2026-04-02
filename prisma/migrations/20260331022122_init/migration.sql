-- CreateTable
CREATE TABLE "Sprint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "start" TEXT NOT NULL,
    "end" TEXT NOT NULL,
    "velocity" INTEGER NOT NULL DEFAULT 0,
    "target" INTEGER NOT NULL,
    "status" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AgileItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "assignee" TEXT NOT NULL,
    "col" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "linkedDefectId" TEXT,
    "sprintId" TEXT,
    CONSTRAINT "AgileItem_linkedDefectId_fkey" FOREIGN KEY ("linkedDefectId") REFERENCES "Defect" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AgileItem_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Defect" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "created" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "containment" TEXT NOT NULL,
    "rootCause" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bridged" BOOLEAN NOT NULL DEFAULT false
);
