const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.agileItem.deleteMany();
  await prisma.defect.deleteMany();
  await prisma.sprint.deleteMany();

  // Sprints
  await prisma.sprint.createMany({
    data: [
      { id: "SP-12", name: "Sprint 12", start: "Feb 24", end: "Mar 7", velocity: 34, target: 40, status: "active" },
      { id: "SP-13", name: "Sprint 13", start: "Mar 10", end: "Mar 21", velocity: 0, target: 42, status: "planned" },
    ],
  });

  // Defects (no linkedStory foreign key — relation is on AgileItem side)
  await prisma.defect.createMany({
    data: [
      {
        id: "8D-001",
        title: "Weld seam failure on batch #4471",
        severity: "S2",
        phase: "D4",
        owner: "KW",
        team: JSON.stringify(["KW", "RK", "ML"]),
        created: "2026-02-14",
        dueDate: "2026-03-10",
        containment: "Hold on affected lot. 100% inspection activated.",
        rootCause: "Electrode pressure drop caused by worn tip — confirmed via fishbone + 5-Why",
        description: "15 units returned from field. Weld seam cracking under torque spec.",
        bridged: true,
      },
      {
        id: "8D-002",
        title: "Torque spec deviation line 7",
        severity: "S1",
        phase: "D6",
        owner: "RK",
        team: JSON.stringify(["RK", "KW"]),
        created: "2026-01-20",
        dueDate: "2026-03-15",
        containment: "Rework process implemented. Line quarantined.",
        rootCause: "Calibration drift in torque wrench model TW-22. PM interval too long.",
        description: "Torque readings 12% below spec on 23 units across shift B.",
        bridged: false,
      },
      {
        id: "8D-003",
        title: "Sensor false-positive cascade",
        severity: "S2",
        phase: "D2",
        owner: "ML",
        team: JSON.stringify(["ML", "KW"]),
        created: "2026-02-28",
        dueDate: "2026-03-20",
        containment: "Software kill-switch deployed to production.",
        rootCause: "",
        description: "Intake sensor reporting 300% above threshold intermittently. 8 customer complaints.",
        bridged: true,
      },
      {
        id: "8D-004",
        title: "Assembly line stoppage — lubricant contamination",
        severity: "S3",
        phase: "D1",
        owner: "KW",
        team: JSON.stringify(["KW"]),
        created: "2026-03-03",
        dueDate: "2026-03-25",
        containment: "",
        rootCause: "",
        description: "Line 3 stopped 4 hrs. Lubricant cross-contamination suspected from supply change.",
        bridged: false,
      },
    ],
  });

  // Agile items
  await prisma.agileItem.createMany({
    data: [
      { id: "A1", title: "Intake sensor calibration API", type: "Story", points: 8, assignee: "RK", col: "In Progress", priority: "High", tags: JSON.stringify(["backend", "sensors"]), linkedDefectId: "8D-003" },
      { id: "A2", title: "Dashboard velocity widget", type: "Story", points: 5, assignee: "ML", col: "Review", priority: "Med", tags: JSON.stringify(["frontend"]), linkedDefectId: null },
      { id: "A3", title: "GHL webhook retry logic", type: "Bug", points: 3, assignee: "KW", col: "In Sprint", priority: "High", tags: JSON.stringify(["integration"]), linkedDefectId: "8D-001" },
      { id: "A4", title: "Export reports to PDF", type: "Story", points: 13, assignee: "RK", col: "Backlog", priority: "Low", tags: JSON.stringify(["reports"]), linkedDefectId: null },
      { id: "A5", title: "Mobile push notifications", type: "Story", points: 8, assignee: "ML", col: "Backlog", priority: "Med", tags: JSON.stringify(["mobile"]), linkedDefectId: null },
      { id: "A6", title: "Automated 8D → Agile bridge", type: "Feature", points: 21, assignee: "KW", col: "In Sprint", priority: "Critical", tags: JSON.stringify(["core", "8D"]), linkedDefectId: null },
      { id: "A7", title: "Sprint burndown anomaly alert", type: "Bug", points: 2, assignee: "ML", col: "Done", priority: "Low", tags: JSON.stringify(["analytics"]), linkedDefectId: null },
    ],
  });

  console.log("Seeded database successfully.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
