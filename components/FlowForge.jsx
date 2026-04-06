import { useState, useEffect } from "react";

const COLORS = {
  bg: "#0D0F14",
  surface: "#141720",
  card: "#1C2030",
  border: "#252A3A",
  accent: "#F97316",
  accentDim: "#7C3A12",
  teal: "#14B8A6",
  tealDim: "#0D4A44",
  purple: "#8B5CF6",
  purpleDim: "#3B2580",
  red: "#EF4444",
  redDim: "#5A1A1A",
  green: "#22C55E",
  greenDim: "#1A4A2A",
  yellow: "#EAB308",
  text: "#E2E8F0",
  textMuted: "#64748B",
  textDim: "#94A3B8",
};

const D_PHASES = [
  { id: "D0", label: "D0", name: "Emergency Response", color: "#EF4444" },
  { id: "D1", label: "D1", name: "Team Formation", color: "#F97316" },
  { id: "D2", label: "D2", name: "Problem Description", color: "#EAB308" },
  { id: "D3", label: "D3", name: "Containment", color: "#22C55E" },
  { id: "D4", label: "D4", name: "Root Cause Analysis", color: "#14B8A6" },
  { id: "D5", label: "D5", name: "Corrective Actions", color: "#3B82F6" },
  { id: "D6", label: "D6", name: "Implement & Validate", color: "#8B5CF6" },
  { id: "D7", label: "D7", name: "Prevent Recurrence", color: "#EC4899" },
  { id: "D8", label: "D8", name: "Team Recognition", color: "#F97316" },
];

const AGILE_COLS = ["Backlog", "In Sprint", "In Progress", "Review", "Done"];

const initialData = {
  agileItems: [
    { id: "A1", title: "Intake sensor calibration API", type: "Story", points: 8, assignee: "RK", col: "In Progress", priority: "High", tags: ["backend", "sensors"], linkedDefect: "8D-003" },
    { id: "A2", title: "Dashboard velocity widget", type: "Story", points: 5, assignee: "ML", col: "Review", priority: "Med", tags: ["frontend"], linkedDefect: null },
    { id: "A3", title: "GHL webhook retry logic", type: "Bug", points: 3, assignee: "KW", col: "In Sprint", priority: "High", tags: ["integration"], linkedDefect: "8D-001" },
    { id: "A4", title: "Export reports to PDF", type: "Story", points: 13, assignee: "RK", col: "Backlog", priority: "Low", tags: ["reports"], linkedDefect: null },
    { id: "A5", title: "Mobile push notifications", type: "Story", points: 8, assignee: "ML", col: "Backlog", priority: "Med", tags: ["mobile"], linkedDefect: null },
    { id: "A6", title: "Automated 8D → Agile bridge", type: "Feature", points: 21, assignee: "KW", col: "In Sprint", priority: "Critical", tags: ["core", "8D"], linkedDefect: null },
    { id: "A7", title: "Sprint burndown anomaly alert", type: "Bug", points: 2, assignee: "ML", col: "Done", priority: "Low", tags: ["analytics"], linkedDefect: null },
  ],
  defects: [
    {
      id: "8D-001", title: "Weld seam failure on batch #4471",
      severity: "S2", phase: "D4", owner: "KW", team: ["KW", "RK", "ML"],
      created: "2026-02-14", dueDate: "2026-03-10",
      containment: "Hold on affected lot. 100% inspection activated.",
      rootCause: "Electrode pressure drop caused by worn tip — confirmed via fishbone + 5-Why",
      description: "15 units returned from field. Weld seam cracking under torque spec.",
      linkedStory: "A3", bridged: true,
    },
    {
      id: "8D-002", title: "Torque spec deviation line 7",
      severity: "S1", phase: "D6", owner: "RK", team: ["RK", "KW"],
      created: "2026-01-20", dueDate: "2026-03-15",
      containment: "Rework process implemented. Line quarantined.",
      rootCause: "Calibration drift in torque wrench model TW-22. PM interval too long.",
      description: "Torque readings 12% below spec on 23 units across shift B.",
      linkedStory: null, bridged: false,
    },
    {
      id: "8D-003", title: "Sensor false-positive cascade",
      severity: "S2", phase: "D2", owner: "ML", team: ["ML", "KW"],
      created: "2026-02-28", dueDate: "2026-03-20",
      containment: "Software kill-switch deployed to production.",
      rootCause: "",
      description: "Intake sensor reporting 300% above threshold intermittently. 8 customer complaints.",
      linkedStory: "A1", bridged: true,
    },
    {
      id: "8D-004", title: "Assembly line stoppage — lubricant contamination",
      severity: "S3", phase: "D1", owner: "KW", team: ["KW"],
      created: "2026-03-03", dueDate: "2026-03-25",
      containment: "",
      rootCause: "",
      description: "Line 3 stopped 4 hrs. Lubricant cross-contamination suspected from supply change.",
      linkedStory: null, bridged: false,
    },
  ],
  sprints: [
    { id: "SP-12", name: "Sprint 12", start: "Feb 24", end: "Mar 7", velocity: 34, target: 40, status: "active" },
    { id: "SP-13", name: "Sprint 13", start: "Mar 10", end: "Mar 21", velocity: 0, target: 42, status: "planned" },
  ],
};

const severityColor = (s) => ({ S1: COLORS.red, S2: COLORS.accent, S3: COLORS.yellow, S4: COLORS.teal }[s] || COLORS.textMuted);
const priorityColor = (p) => ({ Critical: COLORS.red, High: COLORS.accent, Med: COLORS.yellow, Low: COLORS.teal }[p] || COLORS.textMuted);
const typeColor = (t) => ({ Bug: COLORS.red, Story: COLORS.teal, Feature: COLORS.purple }[t] || COLORS.textMuted);

export default function FlowForge() {
  const [view, setView] = useState("board"); // board | defects | bridge | pulse | sprints
  const [data, setData] = useState({ agileItems: [], defects: [], sprints: [] });
  const [loading, setLoading] = useState(true);
  const [selectedDefect, setSelectedDefect] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/agile").then((r) => r.json()),
      fetch("/api/defects").then((r) => r.json()),
      fetch("/api/sprints").then((r) => r.json()),
    ]).then(([agileItems, defects, sprints]) => {
      setData({ agileItems, defects, sprints });
      setLoading(false);
    });
  }, []);
  const [selectedCard, setSelectedCard] = useState(null);
  const [editingCard, setEditingCard] = useState(false);
  const [cardEditForm, setCardEditForm] = useState({});
  const [showNewCard, setShowNewCard] = useState(false);
  const [newCardForm, setNewCardForm] = useState({ title: "", type: "Story", points: 3, assignee: "", priority: "Med", col: "Backlog", tags: "" });
  const [showNewDefect, setShowNewDefect] = useState(false);
  const [newDefectForm, setNewDefectForm] = useState({ title: "", severity: "S2", owner: "", description: "", dueDate: "", team: "", containment: "", rootCause: "", correctiveActions: "", implementation: "", preventiveActions: "", recognition: "" });
  const [editingDefect, setEditingDefect] = useState(false);
  const [defectEditForm, setDefectEditForm] = useState({});
  const [showNewSprint, setShowNewSprint] = useState(false);
  const [newSprintForm, setNewSprintForm] = useState({ name: "", start: "", end: "", target: 40, status: "planned" });
  const [editingSprint, setEditingSprint] = useState(null);
  const [sprintEditForm, setSprintEditForm] = useState({});
  const [bridgeFilter, setBridgeFilter] = useState("all");
  const [inlineDefectFields, setInlineDefectFields] = useState({});
  const [expandedSprint, setExpandedSprint] = useState(null);
  const [linkingDefect, setLinkingDefect] = useState(null); // defect id being linked
  const [linkStoryPick, setLinkStoryPick] = useState("");
  const [autoCreateStory, setAutoCreateStory] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [sprintPlan, setSprintPlan] = useState(null);
  const [storyPrompt, setStoryPrompt] = useState("");
  const [rcaPanel, setRcaPanel] = useState(null); // { defectId, tool, result }
  const [addingToSprint, setAddingToSprint] = useState(null); // sprintId showing the add-story picker

  const callAI = async (action, payload) => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      return await res.json();
    } finally {
      setAiLoading(false);
    }
  };

  const moveCard = async (id, col) => {
    await fetch(`/api/agile/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ col }) });
    setData(d => ({ ...d, agileItems: d.agileItems.map(a => a.id === id ? { ...a, col } : a) }));
    setSelectedCard(c => c?.id === id ? { ...c, col } : c);
    if (col === "Done") {
      const card = data.agileItems.find(a => a.id === id);
      if (card?.linkedDefectId) {
        const defect = data.defects.find(d => d.id === card.linkedDefectId);
        if (defect && phaseIndex(defect.phase) < 8) {
          const newPhase = D_PHASES[phaseIndex(defect.phase) + 1].id;
          await fetch(`/api/defects/${defect.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phase: newPhase }) });
          setData(d => ({ ...d, defects: d.defects.map(def => def.id === defect.id ? { ...def, phase: newPhase } : def) }));
          setSelectedDefect(s => s?.id === defect.id ? { ...s, phase: newPhase } : s);
        }
      }
    }
  };

  const advancePhase = async (id, dir) => {
    const defect = data.defects.find(d => d.id === id);
    const newIdx = Math.max(0, Math.min(8, phaseIndex(defect.phase) + dir));
    const newPhase = D_PHASES[newIdx].id;
    await fetch(`/api/defects/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phase: newPhase }) });
    setData(d => ({ ...d, defects: d.defects.map(def => def.id === id ? { ...def, phase: newPhase } : def) }));
    setSelectedDefect(d => d?.id === id ? { ...d, phase: newPhase } : d);
  };

  const submitNewDefect = async () => {
    if (!newDefectForm.title) { alert("Title is required."); return; }
    if (!newDefectForm.owner) { alert("Owner is required."); return; }
    const id = `8D-${String(data.defects.length + 1).padStart(3, "0")}`;
    const teamArr = newDefectForm.team ? newDefectForm.team.split(",").map(t => t.trim()).filter(Boolean) : [newDefectForm.owner];
    const body = {
      id,
      title: newDefectForm.title,
      severity: newDefectForm.severity,
      owner: newDefectForm.owner,
      description: newDefectForm.description,
      dueDate: newDefectForm.dueDate,
      containment: newDefectForm.containment || "",
      rootCause: newDefectForm.rootCause || "",
      correctiveActions: newDefectForm.correctiveActions || "",
      implementation: newDefectForm.implementation || "",
      preventiveActions: newDefectForm.preventiveActions || "",
      recognition: newDefectForm.recognition || "",
      team: teamArr,
      phase: "D0",
      created: new Date().toISOString().split("T")[0],
      bridged: false,
    };
    const res = await fetch("/api/defects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { alert(`Save failed: ${res.status} — check the console for details.`); return; }
    const newDef = await res.json();
    let stateUpdate = { defects: [...data.defects, newDef] };
    if (autoCreateStory) {
      const storyId = `A${Date.now()}`;
      const priority = { S1: "Critical", S2: "High", S3: "Med", S4: "Low" }[body.severity] || "Med";
      const storyBody = { id: storyId, title: `Fix: ${body.title}`, type: "Bug", points: 3, assignee: body.owner, col: "Backlog", priority, tags: ["8D", "quality"], linkedDefectId: newDef.id };
      const storyRes = await fetch("/api/agile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(storyBody) });
      const newStory = await storyRes.json();
      await fetch(`/api/defects/${newDef.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bridged: true }) });
      stateUpdate.agileItems = [...data.agileItems, newStory];
      stateUpdate.defects = stateUpdate.defects.map(d => d.id === newDef.id ? { ...d, linkedStory: storyId, bridged: true } : d);
    }
    setData(d => ({ ...d, ...stateUpdate }));
    setShowNewDefect(false);
    setNewDefectForm({ title: "", severity: "S2", owner: "", description: "", dueDate: "", team: "", containment: "", rootCause: "", correctiveActions: "", implementation: "", preventiveActions: "", recognition: "" });
  };

  const createStoryFromDefect = async (defect) => {
    const id = `A${Date.now()}`;
    const priority = { S1: "Critical", S2: "High", S3: "Med", S4: "Low" }[defect.severity] || "Med";
    const body = { id, title: `Fix: ${defect.title}`, type: "Bug", points: 3, assignee: defect.owner, col: "Backlog", priority, tags: ["8D", "quality"], linkedDefectId: defect.id };
    const res = await fetch("/api/agile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const created = await res.json();
    await fetch(`/api/defects/${defect.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bridged: true }) });
    setData(d => ({
      ...d,
      agileItems: [...d.agileItems, created],
      defects: d.defects.map(def => def.id === defect.id ? { ...def, linkedStory: created.id, bridged: true } : def),
    }));
  };

  const linkExistingStory = async (defect, storyId) => {
    if (!storyId) return;
    await fetch(`/api/agile/${storyId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ linkedDefectId: defect.id }) });
    await fetch(`/api/defects/${defect.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bridged: true }) });
    setData(d => ({
      ...d,
      agileItems: d.agileItems.map(a => a.id === storyId ? { ...a, linkedDefectId: defect.id } : a),
      defects: d.defects.map(def => def.id === defect.id ? { ...def, linkedStory: storyId, bridged: true } : def),
    }));
    setLinkingDefect(null);
    setLinkStoryPick("");
  };

  const submitNewCard = async () => {
    if (!newCardForm.title || !newCardForm.assignee) return;
    const id = `A${Date.now()}`;
    const body = { ...newCardForm, id, points: Number(newCardForm.points), tags: newCardForm.tags.split(",").map(t => t.trim()).filter(Boolean) };
    const res = await fetch("/api/agile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const created = await res.json();
    setData(d => ({ ...d, agileItems: [...d.agileItems, created] }));
    setShowNewCard(false);
    setNewCardForm({ title: "", type: "Story", points: 3, assignee: "", priority: "Med", col: "Backlog", tags: "" });
  };

  const deleteCard = async (id) => {
    await fetch(`/api/agile/${id}`, { method: "DELETE" });
    setData(d => ({ ...d, agileItems: d.agileItems.filter(a => a.id !== id) }));
    setSelectedCard(null);
  };

  const saveCardEdit = async () => {
    const body = { ...cardEditForm, points: Number(cardEditForm.points), tags: typeof cardEditForm.tags === "string" ? cardEditForm.tags.split(",").map(t => t.trim()).filter(Boolean) : cardEditForm.tags };
    const res = await fetch(`/api/agile/${cardEditForm.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const updated = await res.json();
    setData(d => ({ ...d, agileItems: d.agileItems.map(a => a.id === updated.id ? updated : a) }));
    setSelectedCard(updated);
    setEditingCard(false);
  };

  const assignToSprint = async (storyId, sprintId) => {
    const sprint = data.sprints.find(s => s.id === sprintId);
    const item = data.agileItems.find(a => a.id === storyId);
    const colUpdate = sprint?.status === "active" && item?.col === "Backlog" ? { col: "In Sprint" } : {};
    const body = { ...item, sprintId: sprintId || null, ...colUpdate };
    const res = await fetch(`/api/agile/${storyId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const updated = await res.json();
    setData(d => ({ ...d, agileItems: d.agileItems.map(a => a.id === updated.id ? updated : a) }));
    return updated;
  };

  const deleteDefect = async (id) => {
    await fetch(`/api/defects/${id}`, { method: "DELETE" });
    setData(d => ({ ...d, defects: d.defects.filter(def => def.id !== id) }));
    setSelectedDefect(null);
  };

  const saveDefectEdit = async () => {
    const teamArr = typeof defectEditForm.team === "string"
      ? defectEditForm.team.split(",").map(t => t.trim()).filter(Boolean)
      : defectEditForm.team;
    const body = { ...defectEditForm, team: teamArr };
    const res = await fetch(`/api/defects/${defectEditForm.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const updated = await res.json();
    setData(d => ({ ...d, defects: d.defects.map(def => def.id === updated.id ? updated : def) }));
    setSelectedDefect(updated);
    setEditingDefect(false);
  };

  const saveInlineDefectField = async (defectId, key, value) => {
    const defect = data.defects.find(d => d.id === defectId);
    if (!defect) return;
    const body = { ...defect, [key]: value, team: defect.team };
    const res = await fetch(`/api/defects/${defectId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const updated = await res.json();
    setData(d => ({ ...d, defects: d.defects.map(def => def.id === updated.id ? updated : def) }));
    setSelectedDefect(updated);
  };

  const submitNewSprint = async () => {
    if (!newSprintForm.name || !newSprintForm.start || !newSprintForm.end) return;
    const id = `SP-${String(data.sprints.length + 1).padStart(2, "0")}`;
    const body = { ...newSprintForm, id, velocity: 0, target: Number(newSprintForm.target) };
    const res = await fetch("/api/sprints", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const created = await res.json();
    setData(d => ({ ...d, sprints: [...d.sprints, created] }));
    setShowNewSprint(false);
    setNewSprintForm({ name: "", start: "", end: "", target: 40, status: "planned" });
  };

  const saveSprintEdit = async () => {
    const body = { ...sprintEditForm, target: Number(sprintEditForm.target), velocity: Number(sprintEditForm.velocity) };
    const res = await fetch(`/api/sprints/${sprintEditForm.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const updated = await res.json();
    setData(d => ({ ...d, sprints: d.sprints.map(s => s.id === updated.id ? updated : s) }));
    setEditingSprint(null);
  };

  const deleteSprint = async (id) => {
    await fetch(`/api/sprints/${id}`, { method: "DELETE" });
    setData(d => ({ ...d, sprints: d.sprints.filter(s => s.id !== id) }));
    setEditingSprint(null);
  };

  const setSprintActive = async (id) => {
    const updates = data.sprints.map(s =>
      fetch(`/api/sprints/${s.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...s, status: s.id === id ? "active" : s.status === "active" ? "planned" : s.status }) })
    );
    await Promise.all(updates);
    setData(d => ({ ...d, sprints: d.sprints.map(s => ({ ...s, status: s.id === id ? "active" : s.status === "active" ? "planned" : s.status })) }));
  };

  const closeSprint = async (id) => {
    const res = await fetch(`/api/sprints/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "completed" }) });
    const updated = await res.json();
    setData(d => ({ ...d, sprints: d.sprints.map(s => s.id === updated.id ? updated : s) }));
  };

  const phaseIndex = (pid) => D_PHASES.findIndex(d => d.id === pid);

  const bridgeItems = data.defects
    .filter(d => d.linkedStory)
    .map(d => ({ defect: d, story: data.agileItems.find(a => a.id === d.linkedStory) }));

  const unlinkedDefects = data.defects.filter(d => !d.linkedStory);

  const printDashboard = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const activeSprint = data.sprints.find(s => s.status === "active");
    const colCounts = AGILE_COLS.reduce((acc, col) => { acc[col] = data.agileItems.filter(a => a.col === col).length; return acc; }, {});
    const sevCounts = ["S1","S2","S3","S4"].reduce((acc, s) => { acc[s] = data.defects.filter(d => d.severity === s).length; return acc; }, {});
    const openDefects = data.defects.filter(d => d.phase !== "D8");
    const sprintItems = activeSprint
      ? data.agileItems.filter(a => a.col !== "Backlog")
      : [];

    const row = (cells, header = false) =>
      `<tr>${cells.map(c => `<${header ? "th" : "td"}>${c}</${header ? "th" : "td"}>`).join("")}</tr>`;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>FlowForge Dashboard — ${dateStr}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #1a1a2e; background: #fff; padding: 32px 40px; }
  h1 { font-size: 28px; letter-spacing: 4px; text-transform: uppercase; color: #1a1a2e; }
  h2 { font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: #F97316; margin: 28px 0 10px; border-bottom: 2px solid #F97316; padding-bottom: 6px; }
  h3 { font-size: 11px; letter-spacing: 1px; color: #444; margin: 16px 0 8px; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #1a1a2e; }
  .header-meta { font-size: 10px; color: #666; text-align: right; line-height: 1.8; }
  .logo { display: flex; align-items: center; gap: 10px; }
  .logo-box { width: 36px; height: 36px; background: #F97316; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-size: 16px; letter-spacing: 1px; }
  .metrics { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 8px; }
  .metric { background: #f5f5f8; border-radius: 6px; padding: 12px 14px; border-left: 3px solid #F97316; }
  .metric-val { font-size: 22px; font-weight: 600; color: #1a1a2e; line-height: 1; }
  .metric-label { font-size: 9px; letter-spacing: 1px; color: #888; margin-top: 4px; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 4px; }
  th { background: #f0f0f5; padding: 7px 10px; text-align: left; font-size: 9px; letter-spacing: 1px; text-transform: uppercase; color: #555; font-weight: 600; border-bottom: 2px solid #ddd; }
  td { padding: 7px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .badge { display: inline-block; padding: 2px 7px; border-radius: 3px; font-size: 9px; font-weight: 600; letter-spacing: 0.5px; }
  .s1 { background: #fee2e2; color: #b91c1c; }
  .s2 { background: #ffedd5; color: #c2410c; }
  .s3 { background: #fef9c3; color: #a16207; }
  .s4 { background: #ccfbf1; color: #0f766e; }
  .col-done { background: #dcfce7; color: #166534; }
  .col-prog { background: #dbeafe; color: #1d4ed8; }
  .col-review { background: #fef9c3; color: #a16207; }
  .col-sprint { background: #ccfbf1; color: #0f766e; }
  .col-backlog { background: #f1f5f9; color: #475569; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .progress-bar { background: #e5e7eb; border-radius: 4px; height: 6px; margin-top: 6px; }
  .progress-fill { height: 100%; border-radius: 4px; background: #14B8A6; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 9px; color: #aaa; display: flex; justify-content: space-between; }
  @media print {
    body { padding: 20px 28px; }
    h2 { break-before: avoid; }
    table { break-inside: avoid; }
    .no-break { break-inside: avoid; }
  }
</style></head><body>

<div class="header">
  <div class="logo">
    <div class="logo-box">FF</div>
    <div>
      <h1>FlowForge</h1>
      <div style="font-size:10px;color:#888;letter-spacing:2px;margin-top:2px;">PROJECT DASHBOARD REPORT</div>
    </div>
  </div>
  <div class="header-meta">
    <div>${dateStr}</div>
    <div>${data.sprints.filter(s => s.status === "active").map(s => s.name + " · Active").join(", ") || "No active sprint"}</div>
    <div>${data.agileItems.length} stories · ${data.defects.length} defects tracked</div>
  </div>
</div>

<h2>Key Metrics</h2>
<div class="metrics">
  <div class="metric"><div class="metric-val">${data.agileItems.length}</div><div class="metric-label">Total Stories</div></div>
  <div class="metric"><div class="metric-val">${colCounts["Done"] ?? 0}</div><div class="metric-label">Completed</div></div>
  <div class="metric"><div class="metric-val">${openDefects.length}</div><div class="metric-label">Open Defects</div></div>
  <div class="metric"><div class="metric-val">${data.defects.filter(d => d.severity === "S1" || d.severity === "S2").length}</div><div class="metric-label">Critical (S1/S2)</div></div>
  <div class="metric"><div class="metric-val">${activeSprint ? Math.round((activeSprint.velocity / activeSprint.target) * 100) + "%" : "—"}</div><div class="metric-label">Sprint Velocity</div></div>
</div>

${activeSprint ? `
<h2>Active Sprint — ${activeSprint.name}</h2>
<div class="no-break">
  <div style="display:flex;gap:24px;margin-bottom:10px;font-size:10px;color:#555;">
    <span><b>Dates:</b> ${activeSprint.start} → ${activeSprint.end}</span>
    <span><b>Velocity:</b> ${activeSprint.velocity} / ${activeSprint.target} pts</span>
    <span><b>Stories in flight:</b> ${sprintItems.length}</span>
  </div>
  <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(Math.round((activeSprint.velocity / activeSprint.target) * 100), 100)}%"></div></div>
  <table style="margin-top:12px;">
    <thead>${row(["Type","Story","Assignee","Pts","Status","Priority","8D Link"], true)}</thead>
    <tbody>
      ${sprintItems.map(item => row([
        `<span class="badge col-sprint">${item.type}</span>`,
        item.title,
        `<b>${item.assignee}</b>`,
        item.points,
        `<span class="badge ${item.col === "Done" ? "col-done" : item.col === "In Progress" ? "col-prog" : item.col === "Review" ? "col-review" : "col-sprint"}">${item.col}</span>`,
        item.priority,
        item.linkedDefectId ? `<span class="badge s2">${item.linkedDefectId}</span>` : "—",
      ])).join("")}
    </tbody>
  </table>
</div>` : ""}

<h2>8D Defect Tracker</h2>
<div style="display:flex;gap:12px;margin-bottom:12px;">
  ${["S1","S2","S3","S4"].map(s => `<div class="metric" style="padding:8px 14px;border-left-color:${s==="S1"?"#ef4444":s==="S2"?"#f97316":s==="S3"?"#eab308":"#14b8a6"}"><div class="metric-val" style="font-size:18px;">${sevCounts[s]}</div><div class="metric-label">${s} Severity</div></div>`).join("")}
</div>
<table>
  <thead>${row(["ID","Title","Severity","Phase","Owner","Due Date","Root Cause"], true)}</thead>
  <tbody>
    ${data.defects.map(d => row([
      `<b>${d.id}</b>`,
      d.title,
      `<span class="badge ${d.severity.toLowerCase()}">${d.severity}</span>`,
      `<b>${d.phase}</b>`,
      d.owner,
      d.dueDate,
      d.rootCause ? d.rootCause.slice(0, 60) + (d.rootCause.length > 60 ? "…" : "") : "<i style='color:#aaa'>Pending</i>",
    ])).join("")}
  </tbody>
</table>

<h2>Agile Board Summary</h2>
<div class="two-col no-break">
  <div>
    <h3>Stories by Status</h3>
    <table>
      <thead>${row(["Column","Count","% of Total"], true)}</thead>
      <tbody>
        ${AGILE_COLS.map(col => row([
          `<span class="badge ${col==="Done"?"col-done":col==="In Progress"?"col-prog":col==="Review"?"col-review":col==="In Sprint"?"col-sprint":"col-backlog"}">${col}</span>`,
          colCounts[col] ?? 0,
          data.agileItems.length ? Math.round(((colCounts[col] ?? 0) / data.agileItems.length) * 100) + "%" : "—",
        ])).join("")}
      </tbody>
    </table>
  </div>
  <div>
    <h3>8D ↔ Agile Bridge</h3>
    <table>
      <thead>${row(["Defect","Story","Phase","Status"], true)}</thead>
      <tbody>
        ${data.defects.filter(d => d.linkedStory).map(d => {
          const story = data.agileItems.find(a => a.id === d.linkedStory);
          return row([`<b>${d.id}</b>`, story ? story.title.slice(0,28)+"…" : d.linkedStory, d.phase, `<span class="badge col-sprint">Linked</span>`]);
        }).join("")}
        ${data.defects.filter(d => d.linkedStory).length === 0 ? `<tr><td colspan="4" style="color:#aaa;font-style:italic;">No linked items</td></tr>` : ""}
      </tbody>
    </table>
  </div>
</div>

<h2>All Stories</h2>
<table>
  <thead>${row(["ID","Title","Type","Assignee","Pts","Priority","Status","Sprint","8D"], true)}</thead>
  <tbody>
    ${data.agileItems.map(item => {
      const sprint = data.sprints.find(s => s.id === item.sprintId);
      return row([
        item.id,
        item.title,
        `<span class="badge col-sprint">${item.type}</span>`,
        item.assignee,
        item.points,
        item.priority,
        `<span class="badge ${item.col==="Done"?"col-done":item.col==="In Progress"?"col-prog":item.col==="Review"?"col-review":item.col==="In Sprint"?"col-sprint":"col-backlog"}">${item.col}</span>`,
        sprint ? sprint.name : "—",
        item.linkedDefectId ?? "—",
      ]);
    }).join("")}
  </tbody>
</table>

<div class="footer">
  <span>FlowForge · Generated ${now.toISOString()}</span>
  <span>CONFIDENTIAL — INTERNAL USE ONLY</span>
</div>

<script>window.onload = function() { window.print(); }</script>
</body></html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };

  if (loading) {
    return (
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", background: COLORS.bg, minHeight: "100vh", color: COLORS.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, letterSpacing: 2 }}>
        LOADING...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", background: COLORS.bg, minHeight: "100vh", color: COLORS.text, display: "flex", flexDirection: "column" }}>
      {/* TOP NAV */}
      <div style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: "0 24px", display: "flex", alignItems: "center", height: 52, gap: 32, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: COLORS.accent, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: "#fff", letterSpacing: 1 }}>FF</span>
          </div>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, color: COLORS.text }}>FLOWFORGE</span>
          <span style={{ fontSize: 9, color: COLORS.textMuted, background: COLORS.border, padding: "2px 6px", borderRadius: 3, letterSpacing: 1 }}>BETA</span>
        </div>

        <div style={{ display: "flex", gap: 2, marginLeft: 16 }}>
          {[
            { id: "board", label: "AGILE BOARD" },
            { id: "defects", label: "8D TRACKER" },
            { id: "bridge", label: "BRIDGE" },
            { id: "pulse", label: "PULSE" },
            { id: "sprints", label: "SPRINTS" },
          ].map(n => (
            <button key={n.id} className="nav-btn" onClick={() => setView(n.id)}
              style={{ padding: "6px 14px", borderRadius: 4, fontSize: 11, letterSpacing: 1, fontWeight: 600, fontFamily: "inherit",
                background: view === n.id ? COLORS.accent : "transparent",
                color: view === n.id ? "#fff" : COLORS.textMuted,
                borderBottom: view === n.id ? "none" : `1px solid transparent`,
              }}>
              {n.label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <button className="nav-btn" onClick={() => setShowSearch(true)}
            style={{ padding: "5px 12px", fontSize: 10, background: COLORS.purpleDim, color: COLORS.purple, borderRadius: 4, fontFamily: "inherit", letterSpacing: 1 }}>
            ⌕ AI SEARCH
          </button>
          <button className="nav-btn" onClick={printDashboard}
            style={{ padding: "5px 12px", fontSize: 10, background: COLORS.greenDim, color: COLORS.green, borderRadius: 4, fontFamily: "inherit", letterSpacing: 1, border: `1px solid ${COLORS.green}33` }}>
            ↓ EXPORT
          </button>
          {data.sprints.filter(s => s.status === "active").map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.green }} />
              <span style={{ fontSize: 10, color: COLORS.textMuted }}>{s.name} · Active</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: -4 }}>
            {["KW", "RK", "ML"].map(a => (
              <div key={a} style={{ width: 28, height: 28, borderRadius: "50%", background: COLORS.border, border: `2px solid ${COLORS.surface}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: COLORS.accent }}>
                {a}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>

        {/* AGILE BOARD */}
        {view === "board" && (
          <div style={{ flex: 1, padding: "20px 24px", overflow: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: 2, lineHeight: 1 }}>AGILE BOARD</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>Sprint 12 · Feb 24 — Mar 7 · {data.agileItems.filter(a => a.col === "In Sprint" || a.col === "In Progress").length} items active</div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                {data.sprints[0] && <SprintBadge sprint={data.sprints[0]} />}
                <button onClick={() => setShowNewCard(true)} className="nav-btn"
                  style={{ background: COLORS.teal, color: "#fff", padding: "8px 16px", borderRadius: 6, fontSize: 11, letterSpacing: 1, fontWeight: 700, fontFamily: "inherit" }}>
                  + NEW STORY
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, minWidth: 900 }}>
              {AGILE_COLS.map(col => (
                <div key={col} style={{ background: COLORS.surface, borderRadius: 8, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: COLORS.textDim }}>{col.toUpperCase()}</span>
                    <span style={{ fontSize: 9, background: COLORS.border, padding: "1px 6px", borderRadius: 10, color: COLORS.textMuted }}>
                      {data.agileItems.filter(a => a.col === col).length}
                    </span>
                  </div>
                  <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8, minHeight: 200 }}>
                    {data.agileItems.filter(a => a.col === col).map(item => (
                      <AgileCard key={item.id} item={item} onClick={() => setSelectedCard(item)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8D TRACKER */}
        {view === "defects" && (
          <div style={{ flex: 1, padding: "20px 24px", overflow: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: 2, lineHeight: 1 }}>8D PROBLEM TRACKER</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>{data.defects.length} open defects · {data.defects.filter(d => d.phase === "D8").length} closed</div>
              </div>
              <button onClick={() => setShowNewDefect(true)} className="nav-btn"
                style={{ marginLeft: "auto", background: COLORS.accent, color: "#fff", padding: "8px 16px", borderRadius: 6, fontSize: 11, letterSpacing: 1, fontWeight: 700, fontFamily: "inherit" }}>
                + NEW 8D
              </button>
            </div>

            {/* Phase Progress Strip */}
            <div style={{ display: "flex", gap: 4, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
              {D_PHASES.map(p => {
                const count = data.defects.filter(d => d.phase === p.id).length;
                return (
                  <div key={p.id} className="phase-step" style={{ flex: 1, minWidth: 80, background: COLORS.surface, border: `1px solid ${count > 0 ? p.color : COLORS.border}`, borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: p.color, fontFamily: "'Bebas Neue'" }}>{p.label}</div>
                    <div style={{ fontSize: 8, color: COLORS.textMuted, marginTop: 1, lineHeight: 1.2 }}>{p.name}</div>
                    {count > 0 && <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: p.color }}>{count}</div>}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.defects.map(d => (
                <DefectRow key={d.id} defect={d} onClick={() => { setSelectedDefect(d); setInlineDefectFields({}); }} />
              ))}
            </div>
          </div>
        )}

        {/* BRIDGE VIEW */}
        {view === "bridge" && (
          <div style={{ flex: 1, padding: "20px 24px", overflow: "auto" }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: 2, lineHeight: 1 }}>THE BRIDGE</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>Connect 8D defects to Agile stories. Close the loop between quality and delivery.</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", gap: 0, marginBottom: 24 }}>
              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.accentDim}`, borderRadius: "8px 0 0 8px", padding: "10px 16px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.accent, letterSpacing: 1, marginBottom: 2 }}>8D DEFECTS</div>
                <div style={{ fontSize: 9, color: COLORS.textMuted }}>{data.defects.length} open problems</div>
              </div>
              <div style={{ background: COLORS.accentDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 18, color: COLORS.accent }}>⇄</span>
              </div>
              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.tealDim}`, borderRadius: "0 8px 8px 0", padding: "10px 16px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.teal, letterSpacing: 1, marginBottom: 2 }}>AGILE STORIES</div>
                <div style={{ fontSize: 9, color: COLORS.textMuted }}>{data.agileItems.length} items in backlog/sprint</div>
              </div>
            </div>

            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 2, color: COLORS.textMuted, marginBottom: 10 }}>ACTIVE BRIDGES</div>
            {bridgeItems.map(({ defect, story }) => (
              <BridgeLink key={defect.id} defect={defect} story={story} />
            ))}

            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 2, color: COLORS.textMuted, margin: "24px 0 10px" }}>UNLINKED DEFECTS — NEEDS AGILE ACTION</div>
            {unlinkedDefects.map(d => (
              <div key={d.id} style={{ background: COLORS.surface, border: `1px dashed ${COLORS.border}`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, color: severityColor(d.severity), fontWeight: 700 }}>{d.severity}</span>
                  <span style={{ fontSize: 11, color: COLORS.textMuted }}>{d.id}</span>
                  <span className="card-hover" style={{ fontSize: 12, flex: 1, cursor: "pointer" }} onClick={() => { setSelectedDefect(d); setInlineDefectFields({}); }}>{d.title}</span>
                  <button className="nav-btn" onClick={() => createStoryFromDefect(d)} style={{ fontSize: 10, background: COLORS.tealDim, color: COLORS.teal, padding: "4px 10px", borderRadius: 4, letterSpacing: 1, fontFamily: "inherit" }}>
                    CREATE STORY →
                  </button>
                  <button className="nav-btn" onClick={() => { setLinkingDefect(d.id); setLinkStoryPick(""); }}
                    style={{ fontSize: 10, background: COLORS.accentDim, color: COLORS.accent, padding: "4px 10px", borderRadius: 4, letterSpacing: 1, fontFamily: "inherit" }}>
                    LINK EXISTING
                  </button>
                </div>
                {linkingDefect === d.id && (
                  <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                    <select value={linkStoryPick} onChange={e => setLinkStoryPick(e.target.value)}
                      style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "6px 8px", color: COLORS.text, fontSize: 12, fontFamily: "inherit", outline: "none" }}>
                      <option value="">— pick a story —</option>
                      {data.agileItems.filter(a => !a.linkedDefectId).map(a => (
                        <option key={a.id} value={a.id}>{a.id} · {a.title}</option>
                      ))}
                    </select>
                    <button className="nav-btn" onClick={() => linkExistingStory(d, linkStoryPick)} disabled={!linkStoryPick}
                      style={{ padding: "6px 14px", background: linkStoryPick ? COLORS.accent : COLORS.border, color: linkStoryPick ? "#fff" : COLORS.textMuted, borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: "inherit", letterSpacing: 1 }}>
                      LINK
                    </button>
                    <button className="nav-btn" onClick={() => setLinkingDefect(null)}
                      style={{ padding: "6px 10px", background: COLORS.border, color: COLORS.textMuted, borderRadius: 4, fontSize: 11, fontFamily: "inherit" }}>
                      CANCEL
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PULSE / ANALYTICS */}
        {view === "pulse" && (
          <div style={{ flex: 1, padding: "20px 24px", overflow: "auto" }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: 2, lineHeight: 1 }}>TEAM PULSE</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>Cross-methodology health — Agile velocity + 8D resolution rate</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "SPRINT VELOCITY", value: "34", unit: "pts", sub: "Target 40", color: COLORS.teal },
                { label: "8D OPEN", value: "4", unit: "defects", sub: "2 S1-S2", color: COLORS.accent },
                { label: "BRIDGE RATE", value: "75%", unit: "", sub: "3 of 4 linked", color: COLORS.purple },
                { label: "CLOSURE TIME", value: "18", unit: "days avg", sub: "8D resolution", color: COLORS.green },
              ].map(m => (
                <div key={m.label} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "16px 18px" }}>
                  <div style={{ fontSize: 9, color: COLORS.textMuted, letterSpacing: 1, marginBottom: 8 }}>{m.label}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontFamily: "'Bebas Neue'", fontSize: 36, color: m.color, lineHeight: 1 }}>{m.value}</span>
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>{m.unit}</span>
                  </div>
                  <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 6 }}>{m.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: COLORS.textDim, marginBottom: 14 }}>8D PHASE DISTRIBUTION</div>
                {D_PHASES.slice(0, 8).map(p => {
                  const count = data.defects.filter(d => d.phase === p.id).length;
                  const pct = (count / data.defects.length) * 100;
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: p.color, width: 22, fontWeight: 700 }}>{p.id}</span>
                      <div style={{ flex: 1, height: 6, background: COLORS.border, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: p.color, borderRadius: 3, transition: "width 0.5s ease" }} />
                      </div>
                      <span style={{ fontSize: 9, color: COLORS.textMuted, width: 12 }}>{count}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: COLORS.textDim, marginBottom: 14 }}>SPRINT BURNDOWN SIMULATION</div>
                <BurndownChart />
              </div>
            </div>

            <div style={{ marginTop: 16, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: COLORS.textDim, marginBottom: 12 }}>DEFECT RECURRENCE RADAR</div>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { label: "Welding Process", count: 3, trend: "↑" },
                  { label: "Sensor Calibration", count: 2, trend: "→" },
                  { label: "Torque Spec", count: 2, trend: "↓" },
                  { label: "Lubricant System", count: 1, trend: "↑" },
                ].map(r => (
                  <div key={r.label} style={{ flex: 1, background: COLORS.card, borderRadius: 6, padding: "10px 12px", border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 4 }}>{r.label}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "'Bebas Neue'", fontSize: 24, color: r.count >= 3 ? COLORS.red : r.count === 2 ? COLORS.accent : COLORS.green }}>{r.count}x</span>
                      <span style={{ fontSize: 14, color: r.trend === "↑" ? COLORS.red : r.trend === "↓" ? COLORS.green : COLORS.yellow }}>{r.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* SPRINTS */}
        {view === "sprints" && (
          <div style={{ flex: 1, padding: "20px 24px", overflow: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: 2, lineHeight: 1 }}>SPRINT MANAGEMENT</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>{data.sprints.length} sprints · {data.sprints.filter(s => s.status === "active").length} active</div>
              </div>
              <button onClick={() => setShowNewSprint(true)} className="nav-btn"
                style={{ marginLeft: "auto", background: COLORS.teal, color: "#fff", padding: "8px 16px", borderRadius: 6, fontSize: 11, letterSpacing: 1, fontWeight: 700, fontFamily: "inherit" }}>
                + NEW SPRINT
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.sprints.map(sprint => {
                const pct = sprint.target > 0 ? Math.round((sprint.velocity / sprint.target) * 100) : 0;
                const statusColor = { active: COLORS.green, planned: COLORS.teal, completed: COLORS.textMuted }[sprint.status] || COLORS.textMuted;
                const isEditing = editingSprint === sprint.id;
                return (
                  <div key={sprint.id} style={{ background: COLORS.surface, border: `1px solid ${sprint.status === "active" ? COLORS.green + "44" : COLORS.border}`, borderRadius: 10, padding: "18px 20px" }}>
                    {isEditing ? (
                      <div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                          {[
                            { label: "NAME", key: "name", type: "text" },
                            { label: "START", key: "start", type: "text", placeholder: "Mar 10" },
                            { label: "END", key: "end", type: "text", placeholder: "Mar 21" },
                            { label: "TARGET PTS", key: "target", type: "number" },
                          ].map(({ label, key, type, placeholder }) => (
                            <div key={key}>
                              <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 5 }}>{label}</div>
                              <input type={type} placeholder={placeholder} value={sprintEditForm[key] ?? ""} onChange={e => setSprintEditForm(f => ({ ...f, [key]: e.target.value }))}
                                style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "6px 8px", color: COLORS.text, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                            </div>
                          ))}
                        </div>
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 5 }}>VELOCITY (ACTUAL PTS)</div>
                          <input type="number" value={sprintEditForm.velocity ?? 0} onChange={e => setSprintEditForm(f => ({ ...f, velocity: e.target.value }))}
                            style={{ width: 120, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "6px 8px", color: COLORS.text, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 5 }}>STATUS</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {["planned", "active", "completed"].map(s => (
                              <button key={s} className="nav-btn" onClick={() => setSprintEditForm(f => ({ ...f, status: s }))}
                                style={{ padding: "5px 14px", fontSize: 10, borderRadius: 4, fontFamily: "inherit", textTransform: "uppercase", letterSpacing: 1,
                                  background: sprintEditForm.status === s ? { planned: COLORS.teal, active: COLORS.green, completed: COLORS.border }[s] : COLORS.card,
                                  color: sprintEditForm.status === s ? "#fff" : COLORS.textMuted }}>{s}</button>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="nav-btn" onClick={saveSprintEdit} style={{ padding: "7px 18px", background: COLORS.teal, color: "#fff", borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit" }}>SAVE</button>
                          <button className="nav-btn" onClick={() => setEditingSprint(null)} style={{ padding: "7px 14px", background: COLORS.border, color: COLORS.textMuted, borderRadius: 6, fontSize: 11, fontFamily: "inherit" }}>CANCEL</button>
                          <button className="nav-btn" onClick={() => deleteSprint(sprint.id)} style={{ marginLeft: "auto", padding: "7px 14px", background: COLORS.redDim, color: COLORS.red, borderRadius: 6, fontSize: 11, fontFamily: "inherit", letterSpacing: 1 }}>DELETE</button>
                        </div>
                      </div>
                    ) : (() => {
                      const sprintItems = sprint.status === "active"
                        ? data.agileItems.filter(a => a.col !== "Backlog")
                        : data.agileItems.filter(a => a.sprintId === sprint.id);
                      const isExpanded = expandedSprint === sprint.id;
                      const colColor = { "In Sprint": COLORS.teal, "In Progress": COLORS.accent, "Review": COLORS.yellow, "Done": COLORS.green, "Backlog": COLORS.textMuted };
                      return (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                            <div style={{ minWidth: 60 }}>
                              <div style={{ fontSize: 9, color: COLORS.textMuted, letterSpacing: 1 }}>{sprint.id}</div>
                              <div style={{ fontSize: 8, marginTop: 2, padding: "2px 6px", borderRadius: 3, background: statusColor + "22", color: statusColor, display: "inline-block", letterSpacing: 1, textTransform: "uppercase" }}>{sprint.status}</div>
                            </div>
                            <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setExpandedSprint(isExpanded ? null : sprint.id)}>
                              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 2 }}>{sprint.name}</div>
                              <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 1 }}>{sprint.start} → {sprint.end} · <span style={{ color: COLORS.teal }}>{sprintItems.length} stories</span></div>
                            </div>
                            <div style={{ minWidth: 140 }}>
                              <div style={{ fontSize: 9, color: COLORS.textMuted, marginBottom: 5 }}>VELOCITY {sprint.velocity} / {sprint.target} pts ({pct}%)</div>
                              <div style={{ width: "100%", height: 5, background: COLORS.border, borderRadius: 3 }}>
                                <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: pct >= 80 ? COLORS.green : COLORS.teal, borderRadius: 3 }} />
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              {sprint.status === "planned" && (
                                <button className="nav-btn" onClick={() => setSprintActive(sprint.id)}
                                  style={{ padding: "5px 12px", fontSize: 9, background: COLORS.greenDim, color: COLORS.green, borderRadius: 4, fontFamily: "inherit", letterSpacing: 1 }}>SET ACTIVE</button>
                              )}
                              {sprint.status === "active" && (
                                <button className="nav-btn" onClick={() => closeSprint(sprint.id)}
                                  style={{ padding: "5px 12px", fontSize: 9, background: COLORS.border, color: COLORS.textMuted, borderRadius: 4, fontFamily: "inherit", letterSpacing: 1 }}>CLOSE</button>
                              )}
                              <button className="nav-btn" disabled={aiLoading}
                                onClick={async () => {
                                  const backlog = data.agileItems.filter(a => a.col === "Backlog");
                                  const result = await callAI("sprintPlan", { sprint, backlog });
                                  if (result && result.recommended) setSprintPlan({ sprintId: sprint.id, ...result });
                                }}
                                style={{ padding: "5px 12px", fontSize: 9, background: COLORS.purpleDim, color: COLORS.purple, borderRadius: 4, fontFamily: "inherit", letterSpacing: 1, opacity: aiLoading ? 0.5 : 1 }}>
                                {aiLoading ? "..." : "✦ AI PLAN"}
                              </button>
                              <button className="nav-btn" onClick={() => { setEditingSprint(sprint.id); setSprintEditForm({ ...sprint }); }}
                                style={{ padding: "5px 12px", fontSize: 9, background: COLORS.tealDim, color: COLORS.teal, borderRadius: 4, fontFamily: "inherit", letterSpacing: 1 }}>EDIT</button>
                              <button className="nav-btn" onClick={() => setExpandedSprint(isExpanded ? null : sprint.id)}
                                style={{ padding: "5px 10px", fontSize: 11, background: COLORS.border, color: COLORS.textMuted, borderRadius: 4, fontFamily: "inherit" }}>
                                {isExpanded ? "▲" : "▼"}
                              </button>
                            </div>
                          </div>
                          {isExpanded && (
                            <div style={{ marginTop: 16, borderTop: `1px solid ${COLORS.border}`, paddingTop: 14 }}>
                              {sprintItems.length === 0 ? (
                                <div style={{ fontSize: 11, color: COLORS.textMuted, textAlign: "center", padding: "12px 0" }}>No stories assigned to this sprint.</div>
                              ) : (
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                                  <thead>
                                    <tr style={{ color: COLORS.textMuted, fontSize: 9, letterSpacing: 1 }}>
                                      <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 600 }}>TYPE</th>
                                      <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 600 }}>STORY</th>
                                      <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 600 }}>ASSIGNEE</th>
                                      <th style={{ textAlign: "center", padding: "4px 8px", fontWeight: 600 }}>PTS</th>
                                      <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 600 }}>STATUS</th>
                                      <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 600 }}>PRIORITY</th>
                                      <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 600 }}>8D</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sprintItems.map(item => (
                                      <tr key={item.id} className="card-hover" onClick={() => { setSelectedCard(item); setEditingCard(false); }}
                                        style={{ cursor: "pointer", borderTop: `1px solid ${COLORS.border}` }}>
                                        <td style={{ padding: "8px 8px" }}>
                                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: typeColor(item.type) + "22", color: typeColor(item.type), fontWeight: 700 }}>{item.type}</span>
                                        </td>
                                        <td style={{ padding: "8px 8px", color: COLORS.text, maxWidth: 260 }}>
                                          <div style={{ fontWeight: 500 }}>{item.title}</div>
                                          <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 2 }}>{item.tags.join(", ")}</div>
                                        </td>
                                        <td style={{ padding: "8px 8px" }}>
                                          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.accent }}>{item.assignee}</span>
                                        </td>
                                        <td style={{ padding: "8px 8px", textAlign: "center", color: COLORS.textDim, fontWeight: 600 }}>{item.points}</td>
                                        <td style={{ padding: "8px 8px" }}>
                                          <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 3, background: (colColor[item.col] || COLORS.textMuted) + "22", color: colColor[item.col] || COLORS.textMuted }}>{item.col}</span>
                                        </td>
                                        <td style={{ padding: "8px 8px" }}>
                                          <span style={{ fontSize: 9, color: priorityColor(item.priority) }}>{item.priority}</span>
                                        </td>
                                        <td style={{ padding: "8px 8px" }}>
                                          {item.linkedDefectId && (
                                            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: COLORS.accentDim, color: COLORS.accent, fontWeight: 700 }}>{item.linkedDefectId}</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                {addingToSprint === sprint.id ? (
                                  <>
                                    <select defaultValue="" onChange={async e => {
                                      if (!e.target.value) return;
                                      await assignToSprint(e.target.value, sprint.id);
                                      setAddingToSprint(null);
                                    }} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.teal}44`, borderRadius: 4, padding: "5px 8px", color: COLORS.text, fontSize: 11, fontFamily: "inherit", outline: "none" }}>
                                      <option value="">— select a story to add —</option>
                                      {data.agileItems.filter(a => !a.sprintId && a.col === "Backlog").map(a => (
                                        <option key={a.id} value={a.id}>{a.id} · {a.title} ({a.points}p · {a.priority})</option>
                                      ))}
                                    </select>
                                    <button className="nav-btn" onClick={() => setAddingToSprint(null)}
                                      style={{ padding: "5px 10px", background: COLORS.border, color: COLORS.textMuted, borderRadius: 4, fontSize: 10, fontFamily: "inherit" }}>✕</button>
                                  </>
                                ) : (
                                  <button className="nav-btn" onClick={() => setAddingToSprint(sprint.id)}
                                    style={{ padding: "5px 14px", fontSize: 9, background: COLORS.tealDim, color: COLORS.teal, borderRadius: 4, fontFamily: "inherit", letterSpacing: 1, border: `1px solid ${COLORS.teal}33` }}>
                                    + ADD STORY
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* DEFECT DETAIL PANEL */}
      {selectedDefect && (
        <div style={{ position: "fixed", top: 0, right: 0, width: 480, height: "100vh", background: COLORS.surface, borderLeft: `1px solid ${COLORS.border}`, zIndex: 200, overflow: "auto", padding: 24 }} className="slide-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 9, color: COLORS.accent, letterSpacing: 1, marginBottom: 4 }}>8D DEFECT REPORT</div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: 2 }}>{selectedDefect.id}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {!editingDefect && (
                <>
                  <button className="nav-btn" disabled={aiLoading}
                    onClick={async () => {
                      const result = await callAI("generate8dReport", { defect: selectedDefect });
                      if (result && result.report) setAiReport({ defectId: selectedDefect.id, text: result.report });
                    }}
                    style={{ background: COLORS.purpleDim, color: COLORS.purple, padding: "4px 10px", borderRadius: 4, fontSize: 10, fontFamily: "inherit", letterSpacing: 1, opacity: aiLoading ? 0.5 : 1 }}>
                    {aiLoading ? "..." : "✦ REPORT"}
                  </button>
                  <button className="nav-btn" onClick={() => { setDefectEditForm({ ...selectedDefect, team: selectedDefect.team.join(", ") }); setEditingDefect(true); }}
                    style={{ background: COLORS.accentDim, color: COLORS.accent, padding: "4px 10px", borderRadius: 4, fontSize: 10, fontFamily: "inherit", letterSpacing: 1 }}>EDIT</button>
                </>
              )}
              <button className="nav-btn" onClick={() => { setSelectedDefect(null); setEditingDefect(false); setInlineDefectFields({}); }} style={{ background: COLORS.border, color: COLORS.textMuted, padding: "4px 10px", borderRadius: 4, fontSize: 12, fontFamily: "inherit" }}>✕</button>
            </div>
          </div>

          {editingDefect ? (
            <div>
              {[
                { label: "TITLE", key: "title", type: "text" },
                { label: "OWNER", key: "owner", type: "text" },
                { label: "DUE DATE", key: "dueDate", type: "date" },
                { label: "TEAM (comma-separated)", key: "team", type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 5 }}>{label}</div>
                  <input type={type} value={defectEditForm[key] ?? ""} onChange={e => setDefectEditForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "7px 10px", color: COLORS.text, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 5 }}>SEVERITY</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {["S1", "S2", "S3", "S4"].map(s => (
                    <button key={s} className="nav-btn" onClick={() => setDefectEditForm(f => ({ ...f, severity: s }))}
                      style={{ flex: 1, padding: "5px 0", fontSize: 11, fontWeight: 700, borderRadius: 4, fontFamily: "inherit", background: defectEditForm.severity === s ? severityColor(s) : COLORS.border, color: defectEditForm.severity === s ? "#fff" : COLORS.textMuted }}>{s}</button>
                  ))}
                </div>
              </div>
              {[
                { label: "DESCRIPTION", key: "description" },
                { label: "D3 — CONTAINMENT", key: "containment" },
                { label: "D4 — ROOT CAUSE", key: "rootCause" },
                { label: "D5 — CORRECTIVE ACTIONS", key: "correctiveActions" },
                { label: "D6 — IMPLEMENTATION & VALIDATION", key: "implementation" },
                { label: "D7 — PREVENT RECURRENCE", key: "preventiveActions" },
                { label: "D8 — TEAM RECOGNITION", key: "recognition" },
              ].map(({ label, key }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 5 }}>{label}</div>
                  <textarea rows={3} value={defectEditForm[key] ?? ""} onChange={e => setDefectEditForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "7px 10px", color: COLORS.text, fontSize: 12, fontFamily: "inherit", resize: "vertical", outline: "none" }} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button className="nav-btn" onClick={saveDefectEdit}
                  style={{ flex: 1, padding: "8px 0", background: COLORS.accent, color: "#fff", borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit" }}>SAVE</button>
                <button className="nav-btn" onClick={() => setEditingDefect(false)}
                  style={{ padding: "8px 14px", background: COLORS.border, color: COLORS.textMuted, borderRadius: 6, fontSize: 11, fontFamily: "inherit" }}>CANCEL</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>{selectedDefect.title}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.6, marginBottom: 16 }}>{selectedDefect.description}</div>

              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: severityColor(selectedDefect.severity) + "22", color: severityColor(selectedDefect.severity), fontWeight: 700 }}>{selectedDefect.severity}</span>
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: COLORS.border, color: COLORS.textDim }}>{selectedDefect.phase}</span>
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: COLORS.border, color: COLORS.textDim }}>Due: {selectedDefect.dueDate}</span>
              </div>

              {/* Phase Progress */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 8 }}>PHASE PROGRESS</div>
                <div style={{ display: "flex", gap: 2 }}>
                  {D_PHASES.map((p, i) => {
                    const current = phaseIndex(selectedDefect.phase);
                    const isDone = i <= current;
                    return (
                      <div key={p.id} style={{ flex: 1, height: 4, borderRadius: 2, background: isDone ? p.color : COLORS.border, transition: "background 0.3s" }} />
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 8, color: COLORS.textMuted }}>D0</span>
                  <span style={{ fontSize: 8, color: COLORS.textMuted }}>Current: {selectedDefect.phase}</span>
                  <span style={{ fontSize: 8, color: COLORS.textMuted }}>D8</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button className="nav-btn" disabled={phaseIndex(selectedDefect.phase) === 0}
                    onClick={() => advancePhase(selectedDefect.id, -1)}
                    style={{ flex: 1, padding: "6px 0", fontSize: 10, borderRadius: 4, background: COLORS.border, color: COLORS.textMuted, opacity: phaseIndex(selectedDefect.phase) === 0 ? 0.4 : 1, fontFamily: "inherit", letterSpacing: 1 }}>
                    ← PREV
                  </button>
                  <button className="nav-btn" disabled={phaseIndex(selectedDefect.phase) === 8}
                    onClick={() => advancePhase(selectedDefect.id, 1)}
                    style={{ flex: 1, padding: "6px 0", fontSize: 10, borderRadius: 4, background: COLORS.accent, color: "#fff", opacity: phaseIndex(selectedDefect.phase) === 8 ? 0.4 : 1, fontFamily: "inherit", letterSpacing: 1 }}>
                    NEXT PHASE →
                  </button>
                </div>
              </div>

              {[
                { label: "D3 — CONTAINMENT", key: "containment", color: COLORS.teal },
                { label: "D4 — ROOT CAUSE", key: "rootCause", color: COLORS.purple },
                { label: "D5 — CORRECTIVE ACTIONS", key: "correctiveActions", color: COLORS.accent },
                { label: "D6 — IMPLEMENTATION & VALIDATION", key: "implementation", color: COLORS.yellow },
                { label: "D7 — PREVENT RECURRENCE", key: "preventiveActions", color: COLORS.green },
                { label: "D8 — TEAM RECOGNITION", key: "recognition", color: COLORS.textDim },
              ].map(f => {
                const fieldKey = `${selectedDefect.id}_${f.key}`;
                const localVal = inlineDefectFields[fieldKey] ?? selectedDefect[f.key] ?? "";
                return (
                  <div key={f.key} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 9, letterSpacing: 1, color: f.color, marginBottom: 5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{f.label}</span>
                      {inlineDefectFields[fieldKey] !== undefined && inlineDefectFields[fieldKey] !== (selectedDefect[f.key] ?? "") && (
                        <span style={{ fontSize: 8, color: COLORS.textMuted }}>unsaved</span>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      value={localVal}
                      placeholder={`Enter ${f.label.toLowerCase()}…`}
                      onChange={e => setInlineDefectFields(s => ({ ...s, [fieldKey]: e.target.value }))}
                      onBlur={e => {
                        const val = e.target.value;
                        if (val !== (selectedDefect[f.key] ?? "")) {
                          saveInlineDefectField(selectedDefect.id, f.key, val);
                          setInlineDefectFields(s => { const n = { ...s }; delete n[fieldKey]; return n; });
                        }
                      }}
                      style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "7px 10px", color: COLORS.text, fontSize: 12, fontFamily: "inherit", resize: "vertical", outline: "none" }}
                    />
                  </div>
                );
              })}

              {/* RCA TOOLS */}
              <div style={{ marginTop: 8, marginBottom: 16, background: COLORS.card, border: `1px solid ${COLORS.purpleDim}`, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 9, color: COLORS.purple, letterSpacing: 1, fontWeight: 700 }}>D4 — ROOT CAUSE ANALYSIS TOOLS</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="nav-btn" disabled={aiLoading}
                      onClick={async () => {
                        if (rcaPanel?.defectId === selectedDefect.id && rcaPanel?.tool === "5why") { setRcaPanel(null); return; }
                        const result = await callAI("rca5why", { title: selectedDefect.title, description: selectedDefect.description, containment: selectedDefect.containment });
                        if (result && result.whys) setRcaPanel({ defectId: selectedDefect.id, tool: "5why", result });
                      }}
                      style={{ padding: "4px 10px", background: rcaPanel?.defectId === selectedDefect.id && rcaPanel?.tool === "5why" ? COLORS.purple : COLORS.purpleDim, color: "#fff", borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit", opacity: aiLoading ? 0.5 : 1 }}>
                      {aiLoading && rcaPanel === null ? "..." : "5-WHY"}
                    </button>
                    <button className="nav-btn" disabled={aiLoading}
                      onClick={async () => {
                        if (rcaPanel?.defectId === selectedDefect.id && rcaPanel?.tool === "fishbone") { setRcaPanel(null); return; }
                        const result = await callAI("rcaFishbone", { title: selectedDefect.title, description: selectedDefect.description, containment: selectedDefect.containment });
                        if (result && result.categories) setRcaPanel({ defectId: selectedDefect.id, tool: "fishbone", result });
                      }}
                      style={{ padding: "4px 10px", background: rcaPanel?.defectId === selectedDefect.id && rcaPanel?.tool === "fishbone" ? COLORS.purple : COLORS.purpleDim, color: "#fff", borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit", opacity: aiLoading ? 0.5 : 1 }}>
                      {aiLoading && rcaPanel === null ? "..." : "FISHBONE"}
                    </button>
                    <button className="nav-btn" disabled={aiLoading}
                      onClick={async () => {
                        if (rcaPanel?.defectId === selectedDefect.id && rcaPanel?.tool === "fta") { setRcaPanel(null); return; }
                        const result = await callAI("rcaFaultTree", { title: selectedDefect.title, description: selectedDefect.description, containment: selectedDefect.containment });
                        if (result && result.tree) setRcaPanel({ defectId: selectedDefect.id, tool: "fta", result });
                      }}
                      style={{ padding: "4px 10px", background: rcaPanel?.defectId === selectedDefect.id && rcaPanel?.tool === "fta" ? COLORS.teal : COLORS.tealDim, color: "#fff", borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit", opacity: aiLoading ? 0.5 : 1 }}>
                      {aiLoading && rcaPanel === null ? "..." : "FAULT TREE"}
                    </button>
                  </div>
                </div>

                {rcaPanel?.defectId === selectedDefect.id && rcaPanel?.tool === "5why" && (
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 12 }}>
                      <span style={{ color: COLORS.purple, fontWeight: 700 }}>PROBLEM: </span>{rcaPanel.result.problem}
                    </div>
                    {rcaPanel.result.whys.map((w, i) => (
                      <div key={i} style={{ marginBottom: 10, paddingLeft: i * 8, borderLeft: `2px solid ${COLORS.purple}${Math.round((255 - i * 40)).toString(16).padStart(2,"0")}` }}>
                        <div style={{ fontSize: 9, color: COLORS.purple, letterSpacing: 1, marginBottom: 3 }}>WHY #{i + 1}</div>
                        <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 3 }}>{w.why}</div>
                        <textarea
                          value={w.answer}
                          onChange={e => {
                            const updated = rcaPanel.result.whys.map((x, j) => j === i ? { ...x, answer: e.target.value } : x);
                            setRcaPanel(s => ({ ...s, result: { ...s.result, whys: updated } }));
                          }}
                          rows={2}
                          style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "5px 8px", color: COLORS.text, fontSize: 11, fontFamily: "inherit", resize: "vertical", outline: "none", lineHeight: 1.5, boxSizing: "border-box" }}
                        />
                      </div>
                    ))}
                    <div style={{ marginTop: 12, padding: "10px 12px", background: COLORS.purpleDim, borderRadius: 6, border: `1px solid ${COLORS.purple}44` }}>
                      <div style={{ fontSize: 9, color: COLORS.purple, letterSpacing: 1, marginBottom: 4 }}>ROOT CAUSE <span style={{ color: COLORS.textMuted, fontWeight: 400 }}>(editable)</span></div>
                      <textarea
                        value={rcaPanel.result.rootCause}
                        onChange={e => setRcaPanel(s => ({ ...s, result: { ...s.result, rootCause: e.target.value } }))}
                        rows={2}
                        style={{ width: "100%", background: "transparent", border: `1px solid ${COLORS.purple}44`, borderRadius: 4, padding: "5px 8px", color: COLORS.text, fontSize: 11, fontFamily: "inherit", resize: "vertical", outline: "none", lineHeight: 1.5, boxSizing: "border-box" }}
                      />
                    </div>
                    <button className="nav-btn"
                      onClick={() => saveInlineDefectField(selectedDefect.id, "rootCause", rcaPanel.result.rootCause)}
                      style={{ marginTop: 10, padding: "5px 12px", background: COLORS.tealDim, color: COLORS.teal, borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit", border: `1px solid ${COLORS.teal}44` }}>
                      APPLY TO D4 →
                    </button>
                  </div>
                )}

                {rcaPanel?.defectId === selectedDefect.id && rcaPanel?.tool === "fishbone" && (
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                      {Object.entries(rcaPanel.result.categories).map(([cat, causes]) => {
                        const isPrimary = cat === rcaPanel.result.primaryCategory;
                        return (
                          <div key={cat} style={{ background: isPrimary ? COLORS.purpleDim : COLORS.surface, border: `1px solid ${isPrimary ? COLORS.purple : COLORS.border}`, borderRadius: 6, padding: "8px 10px" }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: isPrimary ? COLORS.purple : COLORS.textMuted, letterSpacing: 1, marginBottom: 5 }}>
                              {isPrimary ? "★ " : ""}{cat.toUpperCase()}
                            </div>
                            {causes.length === 0
                              ? <div style={{ fontSize: 10, color: COLORS.border }}>—</div>
                              : causes.map((c, i) => (
                                  <div key={i} style={{ fontSize: 10, color: COLORS.textDim, lineHeight: 1.5 }}>• {c}</div>
                                ))}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ padding: "10px 12px", background: COLORS.purpleDim, borderRadius: 6, border: `1px solid ${COLORS.purple}44` }}>
                      <div style={{ fontSize: 9, color: COLORS.purple, letterSpacing: 1, marginBottom: 4 }}>LIKELY ROOT CAUSE — {rcaPanel.result.primaryCategory}</div>
                      <div style={{ fontSize: 11, color: COLORS.text, lineHeight: 1.5 }}>{rcaPanel.result.summary}</div>
                    </div>
                    <button className="nav-btn"
                      onClick={() => saveInlineDefectField(selectedDefect.id, "rootCause", rcaPanel.result.summary)}
                      style={{ marginTop: 10, padding: "5px 12px", background: COLORS.tealDim, color: COLORS.teal, borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit", border: `1px solid ${COLORS.teal}44` }}>
                      APPLY TO D4 →
                    </button>
                  </div>
                )}

                {rcaPanel?.defectId === selectedDefect.id && rcaPanel?.tool === "fta" && (() => {
                  const renderNode = (node, depth = 0) => (
                    <div key={node.label} style={{ marginLeft: depth * 16, marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                        {depth > 0 && <div style={{ width: 2, minWidth: 2, background: COLORS.teal, borderRadius: 1, alignSelf: "stretch", opacity: 0.4 }} />}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            {node.type === "basic"
                              ? <span style={{ fontSize: 8, padding: "1px 5px", background: COLORS.tealDim, color: COLORS.teal, borderRadius: 3, letterSpacing: 1, fontWeight: 700, whiteSpace: "nowrap" }}>BASIC</span>
                              : node.gate && <span style={{ fontSize: 8, padding: "1px 5px", background: node.gate === "AND" ? COLORS.accentDim : COLORS.purpleDim, color: node.gate === "AND" ? COLORS.accent : COLORS.purple, borderRadius: 3, letterSpacing: 1, fontWeight: 700, whiteSpace: "nowrap" }}>{node.gate}</span>
                            }
                            <span style={{ fontSize: 11, color: depth === 0 ? COLORS.text : COLORS.textDim, fontWeight: depth === 0 ? 700 : 400 }}>{node.label}</span>
                          </div>
                          {node.children && node.children.map(child => renderNode(child, depth + 1))}
                        </div>
                      </div>
                    </div>
                  );
                  return (
                    <div style={{ padding: "14px 16px" }}>
                      <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 10 }}>
                        <span style={{ color: COLORS.teal, fontWeight: 700 }}>TOP EVENT: </span>{rcaPanel.result.topEvent}
                      </div>
                      <div style={{ background: COLORS.surface, borderRadius: 6, padding: "10px 12px", marginBottom: 10, border: `1px solid ${COLORS.border}` }}>
                        {renderNode(rcaPanel.result.tree)}
                      </div>
                      {rcaPanel.result.criticalPath && (
                        <div style={{ marginBottom: 10, padding: "8px 10px", background: COLORS.accentDim, borderRadius: 6, border: `1px solid ${COLORS.accent}44` }}>
                          <div style={{ fontSize: 9, color: COLORS.accent, letterSpacing: 1, marginBottom: 3 }}>CRITICAL PATH</div>
                          <div style={{ fontSize: 10, color: COLORS.textDim, lineHeight: 1.5 }}>{rcaPanel.result.criticalPath}</div>
                        </div>
                      )}
                      <div style={{ padding: "10px 12px", background: COLORS.tealDim, borderRadius: 6, border: `1px solid ${COLORS.teal}44`, marginBottom: 10 }}>
                        <div style={{ fontSize: 9, color: COLORS.teal, letterSpacing: 1, marginBottom: 4 }}>ROOT CAUSE</div>
                        <div style={{ fontSize: 11, color: COLORS.text, lineHeight: 1.5 }}>{rcaPanel.result.rootCause}</div>
                      </div>
                      <button className="nav-btn"
                        onClick={() => saveInlineDefectField(selectedDefect.id, "rootCause", rcaPanel.result.rootCause)}
                        style={{ padding: "5px 12px", background: COLORS.tealDim, color: COLORS.teal, borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit", border: `1px solid ${COLORS.teal}44` }}>
                        APPLY TO D4 →
                      </button>
                    </div>
                  );
                })()}
              </div>

              <div style={{ marginTop: 16, background: COLORS.tealDim, border: `1px solid ${COLORS.teal}22`, borderRadius: 6, padding: "10px 14px" }}>
                <div style={{ fontSize: 9, color: COLORS.teal, letterSpacing: 1, marginBottom: 6 }}>LINKED AGILE STORY</div>
                {selectedDefect.linkedStory ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: COLORS.text }}>{data.agileItems.find(a => a.id === selectedDefect.linkedStory)?.title}</div>
                      <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 2 }}>{selectedDefect.linkedStory}</div>
                    </div>
                    <button className="nav-btn" onClick={async () => {
                      const storyId = selectedDefect.linkedStory;
                      await fetch(`/api/agile/${storyId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ linkedDefectId: null }) });
                      await fetch(`/api/defects/${selectedDefect.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bridged: false }) });
                      setData(d => ({
                        ...d,
                        agileItems: d.agileItems.map(a => a.id === storyId ? { ...a, linkedDefectId: null } : a),
                        defects: d.defects.map(def => def.id === selectedDefect.id ? { ...def, linkedStory: null, bridged: false } : def),
                      }));
                      setSelectedDefect(s => ({ ...s, linkedStory: null, bridged: false }));
                    }} style={{ fontSize: 9, padding: "3px 8px", background: COLORS.redDim, color: COLORS.red, borderRadius: 4, fontFamily: "inherit", letterSpacing: 1 }}>
                      UNLINK
                    </button>
                  </div>
                ) : (
                  <select defaultValue="" onChange={async e => {
                    const storyId = e.target.value;
                    if (!storyId) return;
                    await fetch(`/api/agile/${storyId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ linkedDefectId: selectedDefect.id }) });
                    await fetch(`/api/defects/${selectedDefect.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bridged: true }) });
                    setData(d => ({
                      ...d,
                      agileItems: d.agileItems.map(a => a.id === storyId ? { ...a, linkedDefectId: selectedDefect.id } : a),
                      defects: d.defects.map(def => def.id === selectedDefect.id ? { ...def, linkedStory: storyId, bridged: true } : def),
                    }));
                    setSelectedDefect(s => ({ ...s, linkedStory: storyId, bridged: true }));
                  }} style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.teal}44`, borderRadius: 4, padding: "5px 8px", color: COLORS.text, fontSize: 11, fontFamily: "inherit", outline: "none" }}>
                    <option value="">— link to an agile story —</option>
                    {data.agileItems.filter(a => !a.linkedDefectId).map(a => (
                      <option key={a.id} value={a.id}>{a.id} · {a.title}</option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ marginTop: 16, marginBottom: 24 }}>
                <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 8 }}>TEAM</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {selectedDefect.team.map(m => (
                    <div key={m} style={{ padding: "4px 10px", background: COLORS.border, borderRadius: 4, fontSize: 11, fontWeight: 700, color: COLORS.accent }}>{m}</div>
                  ))}
                </div>
              </div>

              <button className="nav-btn" onClick={() => deleteDefect(selectedDefect.id)}
                style={{ width: "100%", padding: "7px 0", background: COLORS.redDim, color: COLORS.red, borderRadius: 6, fontSize: 11, letterSpacing: 1, fontFamily: "inherit", fontWeight: 700 }}>
                DELETE DEFECT
              </button>
            </>
          )}
        </div>
      )}

      {/* NEW SPRINT FORM */}
      {showNewSprint && (
        <div style={{ position: "fixed", top: 0, right: 0, width: 400, height: "100vh", background: COLORS.surface, borderLeft: `1px solid ${COLORS.border}`, zIndex: 200, overflow: "auto", padding: 24 }} className="slide-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: 2 }}>NEW SPRINT</div>
            <button className="nav-btn" onClick={() => setShowNewSprint(false)} style={{ background: COLORS.border, color: COLORS.textMuted, padding: "4px 10px", borderRadius: 4, fontSize: 12, fontFamily: "inherit" }}>✕</button>
          </div>
          {[
            { label: "SPRINT NAME", key: "name", type: "text", placeholder: "Sprint 14" },
            { label: "START DATE", key: "start", type: "text", placeholder: "Apr 7" },
            { label: "END DATE", key: "end", type: "text", placeholder: "Apr 18" },
            { label: "VELOCITY TARGET (PTS)", key: "target", type: "number", placeholder: "40" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 6 }}>{label}</div>
              <input type={type} placeholder={placeholder} value={newSprintForm[key]}
                onChange={e => setNewSprintForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "8px 10px", color: COLORS.text, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
            </div>
          ))}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 6 }}>STATUS</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["planned", "active"].map(s => (
                <button key={s} className="nav-btn" onClick={() => setNewSprintForm(f => ({ ...f, status: s }))}
                  style={{ flex: 1, padding: "6px 0", fontSize: 11, borderRadius: 4, fontFamily: "inherit", textTransform: "uppercase", letterSpacing: 1,
                    background: newSprintForm.status === s ? (s === "active" ? COLORS.green : COLORS.teal) : COLORS.border,
                    color: newSprintForm.status === s ? "#fff" : COLORS.textMuted }}>{s}</button>
              ))}
            </div>
          </div>
          <button className="nav-btn" onClick={submitNewSprint}
            style={{ width: "100%", padding: "10px 0", background: COLORS.teal, color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit" }}>
            CREATE SPRINT
          </button>
        </div>
      )}

      {/* NEW AGILE CARD FORM */}
      {showNewCard && (
        <div style={{ position: "fixed", top: 0, right: 0, width: 420, height: "100vh", background: COLORS.surface, borderLeft: `1px solid ${COLORS.border}`, zIndex: 200, overflow: "auto", padding: 24 }} className="slide-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: 2 }}>NEW STORY</div>
            <button className="nav-btn" onClick={() => setShowNewCard(false)} style={{ background: COLORS.border, color: COLORS.textMuted, padding: "4px 10px", borderRadius: 4, fontSize: 12, fontFamily: "inherit" }}>✕</button>
          </div>
          <div style={{ marginBottom: 20, background: COLORS.purpleDim, border: `1px solid ${COLORS.purple}44`, borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 9, color: COLORS.purple, letterSpacing: 1, marginBottom: 8 }}>AI STORY GENERATOR</div>
            <textarea rows={2} placeholder="Describe what the story should do in plain English..." value={storyPrompt}
              onChange={e => setStoryPrompt(e.target.value)}
              style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "7px 10px", color: COLORS.text, fontSize: 12, fontFamily: "inherit", resize: "none", outline: "none", marginBottom: 8 }} />
            <button className="nav-btn" disabled={!storyPrompt.trim() || aiLoading}
              onClick={async () => {
                const result = await callAI("generateStory", { prompt: storyPrompt });
                if (result && result.title) {
                  setNewCardForm(f => ({
                    ...f,
                    title: result.title,
                    type: result.type || f.type,
                    points: result.points || f.points,
                    priority: result.priority || f.priority,
                    tags: Array.isArray(result.tags) ? result.tags.join(", ") : f.tags,
                  }));
                  setStoryPrompt("");
                }
              }}
              style={{ padding: "6px 14px", background: COLORS.purple, color: "#fff", borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit", opacity: !storyPrompt.trim() || aiLoading ? 0.5 : 1 }}>
              {aiLoading ? "GENERATING..." : "✦ GENERATE STORY"}
            </button>
          </div>
          {[
            { label: "TITLE", key: "title", type: "text", placeholder: "Story title..." },
            { label: "ASSIGNEE", key: "assignee", type: "text", placeholder: "Initials e.g. KW" },
            { label: "POINTS", key: "points", type: "number", placeholder: "3" },
            { label: "TAGS (comma-separated)", key: "tags", type: "text", placeholder: "frontend, api" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 6 }}>{label}</div>
              <input type={type} placeholder={placeholder} value={newCardForm[key]}
                onChange={e => setNewCardForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "8px 10px", color: COLORS.text, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
            </div>
          ))}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 6 }}>TYPE</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["Story", "Bug", "Feature"].map(t => (
                <button key={t} className="nav-btn" onClick={() => setNewCardForm(f => ({ ...f, type: t }))}
                  style={{ flex: 1, padding: "6px 0", fontSize: 11, fontWeight: 700, borderRadius: 4, fontFamily: "inherit", background: newCardForm.type === t ? typeColor(t) : COLORS.border, color: newCardForm.type === t ? "#fff" : COLORS.textMuted }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 6 }}>PRIORITY</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["Critical", "High", "Med", "Low"].map(p => (
                <button key={p} className="nav-btn" onClick={() => setNewCardForm(f => ({ ...f, priority: p }))}
                  style={{ flex: 1, padding: "6px 0", fontSize: 11, fontWeight: 700, borderRadius: 4, fontFamily: "inherit", background: newCardForm.priority === p ? priorityColor(p) : COLORS.border, color: newCardForm.priority === p ? "#fff" : COLORS.textMuted }}>{p}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 6 }}>START IN COLUMN</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {AGILE_COLS.map(c => (
                <button key={c} className="nav-btn" onClick={() => setNewCardForm(f => ({ ...f, col: c }))}
                  style={{ padding: "5px 10px", fontSize: 9, borderRadius: 4, fontFamily: "inherit", background: newCardForm.col === c ? COLORS.teal : COLORS.border, color: newCardForm.col === c ? "#fff" : COLORS.textMuted }}>{c}</button>
              ))}
            </div>
          </div>
          <button className="nav-btn" onClick={submitNewCard}
            style={{ width: "100%", padding: "10px 0", background: COLORS.teal, color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit" }}>
            CREATE STORY
          </button>
        </div>
      )}

      {/* NEW 8D FORM */}
      {showNewDefect && (
        <div style={{ position: "fixed", top: 0, right: 0, width: 440, height: "100vh", background: COLORS.surface, borderLeft: `1px solid ${COLORS.border}`, zIndex: 200, overflow: "auto", padding: 24 }} className="slide-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: 2 }}>NEW 8D REPORT</div>
            <button className="nav-btn" onClick={() => setShowNewDefect(false)} style={{ background: COLORS.border, color: COLORS.textMuted, padding: "4px 10px", borderRadius: 4, fontSize: 12, fontFamily: "inherit" }}>✕</button>
          </div>
          {[
            { label: "TITLE", key: "title", type: "text", placeholder: "Describe the problem..." },
            { label: "OWNER", key: "owner", type: "text", placeholder: "Initials e.g. KW" },
            { label: "TEAM (comma-separated)", key: "team", type: "text", placeholder: "KW, RK, ML" },
            { label: "DUE DATE", key: "dueDate", type: "date", placeholder: "" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 6 }}>{label}</div>
              <input type={type} placeholder={placeholder} value={newDefectForm[key]}
                onChange={e => setNewDefectForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "8px 10px", color: COLORS.text, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
            </div>
          ))}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 6 }}>SEVERITY</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["S1", "S2", "S3", "S4"].map(s => (
                <button key={s} className="nav-btn" onClick={() => setNewDefectForm(f => ({ ...f, severity: s }))}
                  style={{ flex: 1, padding: "6px 0", fontSize: 11, fontWeight: 700, borderRadius: 4, fontFamily: "inherit",
                    background: newDefectForm.severity === s ? severityColor(s) : COLORS.border,
                    color: newDefectForm.severity === s ? "#fff" : COLORS.textMuted }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 6 }}>DESCRIPTION</div>
            <textarea rows={3} placeholder="Detailed problem description..." value={newDefectForm.description}
              onChange={e => setNewDefectForm(f => ({ ...f, description: e.target.value }))}
              style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "8px 10px", color: COLORS.text, fontSize: 12, fontFamily: "inherit", resize: "vertical", outline: "none" }} />
          </div>
          <button className="nav-btn" disabled={!newDefectForm.title || !newDefectForm.description || aiLoading}
            onClick={async () => {
              const result = await callAI("fill8d", {
                title: newDefectForm.title,
                severity: newDefectForm.severity,
                description: newDefectForm.description,
              });
              if (result && result.containment) {
                setNewDefectForm(f => ({
                  ...f,
                  containment: result.containment || f.containment,
                  rootCause: result.rootCause || f.rootCause,
                  correctiveActions: result.correctiveActions || f.correctiveActions,
                  implementation: result.implementation || f.implementation,
                  preventiveActions: result.preventiveActions || f.preventiveActions,
                  recognition: result.recognition || f.recognition,
                }));
              }
            }}
            style={{ marginBottom: 16, width: "100%", padding: "8px 0", background: COLORS.tealDim, color: COLORS.teal, borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit", border: `1px solid ${COLORS.teal}44`, opacity: !newDefectForm.title || !newDefectForm.description || aiLoading ? 0.5 : 1 }}>
            {aiLoading ? "GENERATING..." : "✦ AI SUGGEST D3–D8"}
          </button>
          {[
            { label: "D3 — CONTAINMENT", key: "containment", placeholder: "Immediate containment actions taken..." },
            { label: "D4 — ROOT CAUSE", key: "rootCause", placeholder: "Known or suspected root cause..." },
            { label: "D5 — CORRECTIVE ACTIONS", key: "correctiveActions", placeholder: "Permanent corrective actions selected..." },
            { label: "D6 — IMPLEMENTATION & VALIDATION", key: "implementation", placeholder: "How corrective actions were implemented and validated..." },
            { label: "D7 — PREVENT RECURRENCE", key: "preventiveActions", placeholder: "Systemic changes to prevent recurrence..." },
            { label: "D8 — TEAM RECOGNITION", key: "recognition", placeholder: "Team acknowledgment and closure notes..." },
          ].map(({ label, key, placeholder }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 6 }}>{label}</div>
              <textarea rows={3} placeholder={placeholder} value={newDefectForm[key]}
                onChange={e => setNewDefectForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "8px 10px", color: COLORS.text, fontSize: 12, fontFamily: "inherit", resize: "vertical", outline: "none" }} />
            </div>
          ))}
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: COLORS.tealDim, borderRadius: 6, border: `1px solid ${COLORS.teal}33` }}>
            <input type="checkbox" id="autoStory" checked={autoCreateStory} onChange={e => setAutoCreateStory(e.target.checked)}
              style={{ accentColor: COLORS.teal, width: 14, height: 14, cursor: "pointer" }} />
            <label htmlFor="autoStory" style={{ fontSize: 11, color: COLORS.teal, letterSpacing: 0.5, cursor: "pointer", userSelect: "none" }}>
              Auto-create linked Agile story in Backlog
            </label>
          </div>
          <button className="nav-btn" onClick={submitNewDefect}
            style={{ width: "100%", padding: "10px 0", background: COLORS.accent, color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit" }}>
            CREATE 8D REPORT
          </button>
        </div>
      )}

      {/* AI REPORT OVERLAY */}
      {aiReport && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.purple}44`, borderRadius: 10, width: "100%", maxWidth: 700, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 9, color: COLORS.purple, letterSpacing: 1 }}>AI-GENERATED 8D REPORT</div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: 2, marginTop: 2 }}>{aiReport.defectId}</div>
              </div>
              <button className="nav-btn" onClick={() => setAiReport(null)}
                style={{ background: COLORS.border, color: COLORS.textMuted, padding: "4px 10px", borderRadius: 4, fontSize: 12, fontFamily: "inherit" }}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
              <pre style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.textDim, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                {aiReport.text}
              </pre>
            </div>
            <div style={{ padding: "12px 20px", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 8 }}>
              <button className="nav-btn" onClick={() => { navigator.clipboard?.writeText(aiReport.text); }}
                style={{ padding: "6px 14px", background: COLORS.purpleDim, color: COLORS.purple, borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit" }}>
                COPY TO CLIPBOARD
              </button>
              <button className="nav-btn" onClick={() => setAiReport(null)}
                style={{ padding: "6px 14px", background: COLORS.border, color: COLORS.textMuted, borderRadius: 4, fontSize: 10, fontFamily: "inherit" }}>
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI SEARCH OVERLAY */}
      {showSearch && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80 }}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.purple}44`, borderRadius: 10, width: "100%", maxWidth: 640, maxHeight: "70vh", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 16, color: COLORS.purple }}>⌕</span>
              <input autoFocus placeholder="Search stories, defects, anything..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={async e => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    const result = await callAI("search", { query: searchQuery, agileItems: data.agileItems, defects: data.defects });
                    if (result) setSearchResults(result);
                  }
                }}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: COLORS.text, fontFamily: "inherit" }} />
              <button className="nav-btn" disabled={!searchQuery.trim() || aiLoading}
                onClick={async () => {
                  const result = await callAI("search", { query: searchQuery, agileItems: data.agileItems, defects: data.defects });
                  if (result) setSearchResults(result);
                }}
                style={{ padding: "5px 12px", background: COLORS.purple, color: "#fff", borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit", opacity: !searchQuery.trim() || aiLoading ? 0.5 : 1 }}>
                {aiLoading ? "..." : "SEARCH"}
              </button>
              <button className="nav-btn" onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchResults(null); }}
                style={{ background: COLORS.border, color: COLORS.textMuted, padding: "4px 10px", borderRadius: 4, fontSize: 12, fontFamily: "inherit" }}>✕</button>
            </div>
            {searchResults && (
              <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
                <div style={{ fontSize: 11, color: COLORS.textDim, lineHeight: 1.6, marginBottom: 16, padding: "10px 14px", background: COLORS.card, borderRadius: 6 }}>
                  {searchResults.explanation}
                </div>
                {searchResults.itemIds?.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 9, color: COLORS.teal, letterSpacing: 1, marginBottom: 8 }}>MATCHING STORIES ({searchResults.itemIds.length})</div>
                    {searchResults.itemIds.map(id => {
                      const item = data.agileItems.find(a => a.id === id);
                      if (!item) return null;
                      return (
                        <div key={id} className="card-hover" onClick={() => { setSelectedCard(item); setShowSearch(false); }}
                          style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "10px 14px", marginBottom: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 9, color: typeColor(item.type), fontWeight: 700 }}>{item.type}</span>
                          <span style={{ fontSize: 9, color: COLORS.textMuted }}>{item.id}</span>
                          <span style={{ flex: 1, fontSize: 12 }}>{item.title}</span>
                          <span style={{ fontSize: 9, color: COLORS.textMuted }}>{item.col}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {searchResults.defectIds?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 9, color: COLORS.accent, letterSpacing: 1, marginBottom: 8 }}>MATCHING DEFECTS ({searchResults.defectIds.length})</div>
                    {searchResults.defectIds.map(id => {
                      const defect = data.defects.find(d => d.id === id);
                      if (!defect) return null;
                      return (
                        <div key={id} className="card-hover" onClick={() => { setSelectedDefect(defect); setShowSearch(false); setInlineDefectFields({}); }}
                          style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "10px 14px", marginBottom: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 9, color: severityColor(defect.severity), fontWeight: 700 }}>{defect.severity}</span>
                          <span style={{ fontSize: 9, color: COLORS.textMuted }}>{defect.id}</span>
                          <span style={{ flex: 1, fontSize: 12 }}>{defect.title}</span>
                          <span style={{ fontSize: 9, color: COLORS.textMuted }}>{defect.phase}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {!searchResults.itemIds?.length && !searchResults.defectIds?.length && (
                  <div style={{ fontSize: 12, color: COLORS.textMuted, textAlign: "center", padding: "20px 0" }}>No matching items found.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI SPRINT PLAN OVERLAY */}
      {sprintPlan && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.purple}44`, borderRadius: 10, width: "100%", maxWidth: 560, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 9, color: COLORS.purple, letterSpacing: 1 }}>AI SPRINT RECOMMENDATION</div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: 2, marginTop: 2 }}>
                  {data.sprints.find(s => s.id === sprintPlan.sprintId)?.name}
                </div>
              </div>
              <button className="nav-btn" onClick={() => setSprintPlan(null)}
                style={{ background: COLORS.border, color: COLORS.textMuted, padding: "4px 10px", borderRadius: 4, fontSize: 12, fontFamily: "inherit" }}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
              <div style={{ fontSize: 11, color: COLORS.textDim, lineHeight: 1.6, marginBottom: 16, padding: "10px 14px", background: COLORS.card, borderRadius: 6 }}>
                {sprintPlan.reasoning}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: COLORS.purple, letterSpacing: 1 }}>RECOMMENDED STORIES</div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 16, color: COLORS.teal }}>{sprintPlan.totalPoints} PTS</div>
              </div>
              {sprintPlan.recommended.map(id => {
                const item = data.agileItems.find(a => a.id === id);
                if (!item) return null;
                return (
                  <div key={id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "10px 14px", marginBottom: 6, display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 9, color: typeColor(item.type), fontWeight: 700 }}>{item.type}</span>
                    <span style={{ flex: 1, fontSize: 12 }}>{item.title}</span>
                    <span style={{ fontSize: 10, color: priorityColor(item.priority) }}>{item.priority}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.textDim }}>{item.points}p</span>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: "12px 20px", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 8 }}>
              <button className="nav-btn" onClick={async () => {
                for (const id of sprintPlan.recommended) {
                  await assignToSprint(id, sprintPlan.sprintId);
                }
                setSprintPlan(null);
              }} style={{ padding: "6px 16px", background: COLORS.teal, color: "#fff", borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit" }}>
                APPLY TO SPRINT →
              </button>
              <button className="nav-btn" onClick={() => setSprintPlan(null)}
                style={{ padding: "6px 14px", background: COLORS.border, color: COLORS.textMuted, borderRadius: 4, fontSize: 10, fontFamily: "inherit" }}>
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AGILE CARD DETAIL */}
      {selectedCard && (
        <div style={{ position: "fixed", top: 0, right: 0, width: 380, height: "100vh", background: COLORS.surface, borderLeft: `1px solid ${COLORS.border}`, zIndex: 200, padding: 24, overflow: "auto" }} className="slide-in">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 9, color: COLORS.teal, letterSpacing: 1, marginBottom: 4 }}>AGILE CARD</div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: 2 }}>{selectedCard.id}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {!editingCard && (
                <button className="nav-btn" onClick={() => { setCardEditForm({ ...selectedCard, tags: selectedCard.tags.join(", ") }); setEditingCard(true); }}
                  style={{ background: COLORS.tealDim, color: COLORS.teal, padding: "4px 10px", borderRadius: 4, fontSize: 10, fontFamily: "inherit", letterSpacing: 1 }}>EDIT</button>
              )}
              <button className="nav-btn" onClick={() => { setSelectedCard(null); setEditingCard(false); }} style={{ background: COLORS.border, color: COLORS.textMuted, padding: "4px 10px", borderRadius: 4, fontSize: 12, fontFamily: "inherit" }}>✕</button>
            </div>
          </div>

          {editingCard ? (
            <div>
              {[
                { label: "TITLE", key: "title", type: "text" },
                { label: "ASSIGNEE", key: "assignee", type: "text" },
                { label: "POINTS", key: "points", type: "number" },
                { label: "TAGS (comma-separated)", key: "tags", type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 5 }}>{label}</div>
                  <input type={type} value={cardEditForm[key] ?? ""} onChange={e => setCardEditForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "7px 10px", color: COLORS.text, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 5 }}>TYPE</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {["Story", "Bug", "Feature"].map(t => (
                    <button key={t} className="nav-btn" onClick={() => setCardEditForm(f => ({ ...f, type: t }))}
                      style={{ flex: 1, padding: "5px 0", fontSize: 10, borderRadius: 4, fontFamily: "inherit", background: cardEditForm.type === t ? typeColor(t) : COLORS.border, color: cardEditForm.type === t ? "#fff" : COLORS.textMuted }}>{t}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 5 }}>PRIORITY</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {["Critical", "High", "Med", "Low"].map(p => (
                    <button key={p} className="nav-btn" onClick={() => setCardEditForm(f => ({ ...f, priority: p }))}
                      style={{ flex: 1, padding: "5px 0", fontSize: 10, borderRadius: 4, fontFamily: "inherit", background: cardEditForm.priority === p ? priorityColor(p) : COLORS.border, color: cardEditForm.priority === p ? "#fff" : COLORS.textMuted }}>{p}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 5 }}>SPRINT</div>
                <select value={cardEditForm.sprintId ?? ""} onChange={e => setCardEditForm(f => ({ ...f, sprintId: e.target.value || null }))}
                  style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "7px 10px", color: COLORS.text, fontSize: 12, fontFamily: "inherit", outline: "none" }}>
                  <option value="">— Backlog (no sprint) —</option>
                  {data.sprints.filter(s => s.status !== "completed").map(s => (
                    <option key={s.id} value={s.id}>{s.name} · {s.status}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="nav-btn" onClick={saveCardEdit}
                  style={{ flex: 1, padding: "8px 0", background: COLORS.teal, color: "#fff", borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: 1, fontFamily: "inherit" }}>SAVE</button>
                <button className="nav-btn" onClick={() => setEditingCard(false)}
                  style={{ padding: "8px 14px", background: COLORS.border, color: COLORS.textMuted, borderRadius: 6, fontSize: 11, fontFamily: "inherit" }}>CANCEL</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{selectedCard.title}</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: typeColor(selectedCard.type) + "22", color: typeColor(selectedCard.type), fontWeight: 700 }}>{selectedCard.type}</span>
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: priorityColor(selectedCard.priority) + "22", color: priorityColor(selectedCard.priority) }}>{selectedCard.priority}</span>
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: COLORS.border, color: COLORS.textDim }}>{selectedCard.points} pts</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {selectedCard.tags.map(t => <span key={t} className="tag" style={{ background: COLORS.border, color: COLORS.textMuted }}>{t}</span>)}
              </div>
              <div style={{ background: COLORS.accentDim, border: `1px solid ${COLORS.accent}22`, borderRadius: 6, padding: "10px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 9, color: COLORS.accent, letterSpacing: 1, marginBottom: 6 }}>LINKED 8D DEFECT</div>
                {selectedCard.linkedDefectId ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: COLORS.text }}>{data.defects.find(d => d.id === selectedCard.linkedDefectId)?.title}</div>
                      <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 2 }}>{selectedCard.linkedDefectId}</div>
                    </div>
                    <button className="nav-btn" onClick={async () => {
                      const defectId = selectedCard.linkedDefectId;
                      await fetch(`/api/agile/${selectedCard.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ linkedDefectId: null }) });
                      await fetch(`/api/defects/${defectId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bridged: false }) });
                      setData(d => ({
                        ...d,
                        agileItems: d.agileItems.map(a => a.id === selectedCard.id ? { ...a, linkedDefectId: null } : a),
                        defects: d.defects.map(def => def.id === defectId ? { ...def, linkedStory: null, bridged: false } : def),
                      }));
                      setSelectedCard(c => ({ ...c, linkedDefectId: null }));
                    }} style={{ fontSize: 9, padding: "3px 8px", background: COLORS.redDim, color: COLORS.red, borderRadius: 4, fontFamily: "inherit", letterSpacing: 1 }}>
                      UNLINK
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 6 }}>
                    <select defaultValue="" onChange={async e => {
                      const defectId = e.target.value;
                      if (!defectId) return;
                      await fetch(`/api/agile/${selectedCard.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ linkedDefectId: defectId }) });
                      await fetch(`/api/defects/${defectId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bridged: true }) });
                      setData(d => ({
                        ...d,
                        agileItems: d.agileItems.map(a => a.id === selectedCard.id ? { ...a, linkedDefectId: defectId } : a),
                        defects: d.defects.map(def => def.id === defectId ? { ...def, linkedStory: selectedCard.id, bridged: true } : def),
                      }));
                      setSelectedCard(c => ({ ...c, linkedDefectId: defectId }));
                    }} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "5px 8px", color: COLORS.text, fontSize: 11, fontFamily: "inherit", outline: "none" }}>
                      <option value="">— link to an 8D defect —</option>
                      {data.defects.filter(d => !d.linkedStory).map(d => (
                        <option key={d.id} value={d.id}>{d.id} · {d.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 6 }}>ASSIGNEE</div>
                <div style={{ display: "inline-block", padding: "4px 12px", background: COLORS.border, borderRadius: 4, fontSize: 11, fontWeight: 700, color: COLORS.accent }}>{selectedCard.assignee}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 6 }}>STATUS</div>
                <div style={{ fontSize: 11, padding: "4px 12px", background: COLORS.tealDim, color: COLORS.teal, borderRadius: 4, display: "inline-block" }}>{selectedCard.col}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 6 }}>SPRINT</div>
                {selectedCard.sprintId ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 11, padding: "4px 12px", background: COLORS.purpleDim, color: COLORS.purple, borderRadius: 4 }}>
                      {data.sprints.find(s => s.id === selectedCard.sprintId)?.name ?? selectedCard.sprintId}
                    </div>
                    <button className="nav-btn" onClick={async () => {
                      const updated = await assignToSprint(selectedCard.id, null);
                      setSelectedCard(updated);
                    }} style={{ fontSize: 9, padding: "3px 8px", background: COLORS.redDim, color: COLORS.red, borderRadius: 4, fontFamily: "inherit", letterSpacing: 1 }}>UNASSIGN</button>
                  </div>
                ) : (
                  <select defaultValue="" onChange={async e => {
                    if (!e.target.value) return;
                    const updated = await assignToSprint(selectedCard.id, e.target.value);
                    setSelectedCard(updated);
                  }} style={{ width: "100%", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "5px 8px", color: COLORS.text, fontSize: 11, fontFamily: "inherit", outline: "none" }}>
                    <option value="">— assign to sprint —</option>
                    {data.sprints.filter(s => s.status !== "completed").map(s => (
                      <option key={s.id} value={s.id}>{s.name} · {s.status}</option>
                    ))}
                  </select>
                )}
              </div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 9, letterSpacing: 1, color: COLORS.textMuted, marginBottom: 6 }}>MOVE TO</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {AGILE_COLS.filter(c => c !== selectedCard.col).map(col => (
                    <button key={col} className="nav-btn" onClick={() => moveCard(selectedCard.id, col)}
                      style={{ fontSize: 9, padding: "4px 10px", borderRadius: 4, background: COLORS.border, color: COLORS.textDim, fontFamily: "inherit", letterSpacing: 0.5 }}>
                      {col}
                    </button>
                  ))}
                </div>
              </div>
              <button className="nav-btn" onClick={() => deleteCard(selectedCard.id)}
                style={{ width: "100%", padding: "7px 0", background: COLORS.redDim, color: COLORS.red, borderRadius: 6, fontSize: 11, letterSpacing: 1, fontFamily: "inherit", fontWeight: 700 }}>
                DELETE CARD
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AgileCard({ item, onClick }) {
  return (
    <div className="card-hover" onClick={onClick}
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "10px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 9, color: typeColor(item.type), fontWeight: 700 }}>{item.type.toUpperCase()}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {item.linkedDefectId && <span style={{ fontSize: 8, background: COLORS.accentDim, color: COLORS.accent, padding: "1px 4px", borderRadius: 2 }}>8D</span>}
          <span style={{ fontSize: 9, color: COLORS.textMuted }}>{item.points}p</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: COLORS.text, lineHeight: 1.4, marginBottom: 8 }}>{item.title}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {item.tags.slice(0, 2).map(t => <span key={t} className="tag" style={{ background: COLORS.border, color: COLORS.textMuted }}>{t}</span>)}
        </div>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: COLORS.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: priorityColor(item.priority) }}>
          {item.assignee}
        </div>
      </div>
    </div>
  );
}

function DefectRow({ defect, onClick }) {
  const phase = D_PHASES.find(p => p.id === defect.phase);
  return (
    <div className="card-hover" onClick={onClick}
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ textAlign: "center", minWidth: 36 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: severityColor(defect.severity) }}>{defect.severity}</div>
        <div style={{ fontSize: 8, color: COLORS.textMuted, marginTop: 1 }}>SEV</div>
      </div>
      <div style={{ minWidth: 70 }}>
        <div style={{ fontSize: 10, color: COLORS.textMuted }}>{defect.id}</div>
        <div style={{ fontSize: 9, color: phase?.color, fontWeight: 700, marginTop: 1 }}>{phase?.label} — {phase?.name}</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: COLORS.text }}>{defect.title}</div>
        <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 3 }}>Owner: {defect.owner} · Due: {defect.dueDate}</div>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {defect.linkedStory && (
          <span style={{ fontSize: 9, background: COLORS.tealDim, color: COLORS.teal, padding: "2px 7px", borderRadius: 3 }}>LINKED</span>
        )}
        <div style={{ display: "flex", gap: 2 }}>
          {D_PHASES.map((p, i) => (
            <div key={p.id} style={{ width: 5, height: 14, borderRadius: 2, background: phaseIndex(defect.phase) >= i ? p.color : COLORS.border }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function phaseIndex(pid) {
  return D_PHASES.findIndex(d => d.id === pid);
}

function BridgeLink({ defect, story }) {
  if (!story) return null;
  const phase = D_PHASES.find(p => p.id === defect.phase);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 1fr", gap: 0, marginBottom: 10, alignItems: "stretch" }}>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.accentDim}`, borderRadius: "8px 0 0 8px", padding: "12px 14px" }}>
        <div style={{ fontSize: 9, color: COLORS.accent, letterSpacing: 1, marginBottom: 4 }}>{defect.id} · {defect.severity}</div>
        <div style={{ fontSize: 11, color: COLORS.text }}>{defect.title}</div>
        <div style={{ marginTop: 6, fontSize: 9, color: phase?.color }}>{phase?.label} — {phase?.name}</div>
      </div>
      <div style={{ background: COLORS.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: COLORS.accent }}>⇄</div>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.tealDim}`, borderRadius: "0 8px 8px 0", padding: "12px 14px" }}>
        <div style={{ fontSize: 9, color: COLORS.teal, letterSpacing: 1, marginBottom: 4 }}>{story.id} · {story.type}</div>
        <div style={{ fontSize: 11, color: COLORS.text }}>{story.title}</div>
        <div style={{ marginTop: 6, fontSize: 9, color: COLORS.textMuted }}>{story.col} · {story.points} pts</div>
      </div>
    </div>
  );
}

function DetailBlock({ label, value, color }) {
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${color}22`, borderRadius: 6, padding: "10px 14px", marginBottom: 10 }}>
      <div style={{ fontSize: 9, color: color, letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: COLORS.textDim, lineHeight: 1.6 }}>{value}</div>
    </div>
  );
}

function SprintBadge({ sprint }) {
  const pct = Math.round((sprint.velocity / sprint.target) * 100);
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 16px", display: "flex", gap: 16, alignItems: "center" }}>
      <div>
        <div style={{ fontSize: 9, color: COLORS.textMuted, letterSpacing: 1 }}>{sprint.name}</div>
        <div style={{ fontSize: 9, color: COLORS.textDim }}>{sprint.start} → {sprint.end}</div>
      </div>
      <div>
        <div style={{ fontSize: 9, color: COLORS.textMuted, marginBottom: 4 }}>VELOCITY {sprint.velocity}/{sprint.target}</div>
        <div style={{ width: 80, height: 4, background: COLORS.border, borderRadius: 2 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: pct >= 80 ? COLORS.green : COLORS.accent, borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
}

function BurndownChart() {
  const ideal = [40, 35, 30, 24, 18, 12, 6, 0];
  const actual = [40, 38, 33, 27, 22, 18, null, null];
  const max = 40;
  const h = 120;
  const w = 280;
  const pts = (arr) => arr.map((v, i) => v != null ? `${(i / 7) * w},${h - (v / max) * h}` : null).filter(Boolean).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      <polyline points={pts(ideal)} fill="none" stroke={COLORS.border} strokeWidth="1.5" strokeDasharray="4 3" />
      <polyline points={pts(actual)} fill="none" stroke={COLORS.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {actual.map((v, i) => v != null && (
        <circle key={i} cx={(i / 7) * w} cy={h - (v / max) * h} r="3" fill={COLORS.teal} />
      ))}
      <text x="0" y={h - 2} fontSize="8" fill={COLORS.textMuted}>Day 1</text>
      <text x={w - 20} y={h - 2} fontSize="8" fill={COLORS.textMuted}>Day 7</text>
    </svg>
  );
}
