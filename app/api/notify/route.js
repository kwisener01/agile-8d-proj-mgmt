export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Map initials → name + email. Update these with real addresses.
const TEAM = {
  KW: { name: "K. Wisener",  email: process.env.EMAIL_KW || "kw@example.com" },
  RK: { name: "R. K.",       email: process.env.EMAIL_RK || "rk@example.com" },
  ML: { name: "M. L.",       email: process.env.EMAIL_ML || "ml@example.com" },
};

const FROM = process.env.NOTIFY_FROM || "FlowForge <notifications@flowforge.app>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app";

function resolveEmails(initials = []) {
  return [...new Set(
    (Array.isArray(initials) ? initials : [initials])
      .map(i => TEAM[i]?.email)
      .filter(Boolean)
  )];
}

function severityColor(s) {
  return { S1: "#ef4444", S2: "#f97316", S3: "#eab308", S4: "#14b8a6" }[s] || "#888";
}

function baseTemplate(title, bodyHtml) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body { font-family: 'IBM Plex Mono', monospace, sans-serif; background:#f5f5f8; margin:0; padding:32px 0; }
  .card { background:#fff; max-width:560px; margin:0 auto; border-radius:8px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08); }
  .header { background:#1a1a2e; padding:20px 28px; display:flex; align-items:center; gap:12px; }
  .logo { width:36px; height:36px; background:#F97316; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:14px; text-align:center; line-height:36px; }
  .header-title { color:#fff; font-size:18px; letter-spacing:3px; font-weight:600; }
  .body { padding:24px 28px; font-size:13px; color:#333; line-height:1.7; }
  .badge { display:inline-block; padding:3px 10px; border-radius:4px; font-size:11px; font-weight:700; letter-spacing:0.5px; }
  .field { margin-bottom:14px; }
  .field-label { font-size:10px; letter-spacing:1px; color:#888; text-transform:uppercase; margin-bottom:4px; }
  .field-value { font-size:13px; color:#1a1a2e; font-weight:500; }
  .divider { border:none; border-top:1px solid #eee; margin:18px 0; }
  .cta { display:inline-block; padding:10px 22px; background:#F97316; color:#fff; border-radius:6px; text-decoration:none; font-weight:700; font-size:12px; letter-spacing:1px; margin-top:16px; }
  .footer { background:#f0f0f5; padding:14px 28px; font-size:10px; color:#aaa; text-align:center; }
</style></head><body>
<div class="card">
  <div class="header">
    <div class="logo">FF</div>
    <div class="header-title">FLOWFORGE</div>
  </div>
  <div class="body">
    <p style="font-size:15px;font-weight:700;color:#1a1a2e;margin-bottom:18px;">${title}</p>
    ${bodyHtml}
    <a href="${APP_URL}" class="cta">OPEN FLOWFORGE →</a>
  </div>
  <div class="footer">FlowForge · Automated notification · Do not reply to this email</div>
</div>
</body></html>`;
}

export async function POST(req) {
  const { type, ...payload } = await req.json();

  let subject, html, to;

  if (type === "new_defect") {
    const { defect } = payload;
    const team = Array.isArray(defect.team) ? defect.team : [defect.owner];
    to = resolveEmails([defect.owner, ...team]);
    subject = `[${defect.severity}] New 8D Defect: ${defect.title}`;
    html = baseTemplate("New 8D Defect Opened", `
      <div class="field"><div class="field-label">Defect ID</div><div class="field-value">${defect.id}</div></div>
      <div class="field"><div class="field-label">Title</div><div class="field-value">${defect.title}</div></div>
      <div class="field"><div class="field-label">Severity</div>
        <div class="field-value"><span class="badge" style="background:${severityColor(defect.severity)}22;color:${severityColor(defect.severity)}">${defect.severity}</span></div>
      </div>
      <div class="field"><div class="field-label">Description</div><div class="field-value">${defect.description || "—"}</div></div>
      <div class="field"><div class="field-label">Owner</div><div class="field-value">${defect.owner}</div></div>
      <div class="field"><div class="field-label">Due Date</div><div class="field-value">${defect.dueDate || "TBD"}</div></div>
      <hr class="divider">
      <p style="font-size:12px;color:#666;">You have been assigned to this defect. Please review and begin D1 team formation.</p>
    `);

  } else if (type === "containment_saved") {
    const { defect } = payload;
    const team = Array.isArray(defect.team) ? defect.team : [defect.owner];
    to = resolveEmails([defect.owner, ...team]);
    subject = `[ACTION REQUIRED] Containment Logged — ${defect.id}: ${defect.title}`;
    html = baseTemplate("D3 Containment Action Logged", `
      <div class="field"><div class="field-label">Defect</div><div class="field-value">${defect.id} — ${defect.title}</div></div>
      <div class="field"><div class="field-label">Severity</div>
        <div class="field-value"><span class="badge" style="background:${severityColor(defect.severity)}22;color:${severityColor(defect.severity)}">${defect.severity}</span></div>
      </div>
      <div class="field"><div class="field-label">Containment Action</div>
        <div class="field-value" style="background:#f5f5f8;padding:10px 14px;border-radius:6px;border-left:3px solid #F97316;">${defect.containment}</div>
      </div>
      <hr class="divider">
      <p style="font-size:12px;color:#666;">Containment has been recorded in FlowForge. Verify this action is implemented on the floor. Root cause analysis (D4) should begin immediately.</p>
    `);

  } else if (type === "phase_advanced") {
    const { defect, newPhase } = payload;
    const team = Array.isArray(defect.team) ? defect.team : [defect.owner];
    to = resolveEmails([defect.owner, ...team]);
    const phaseNames = { D0:"Emergency Response", D1:"Team Formation", D2:"Problem Description", D3:"Containment", D4:"Root Cause Analysis", D5:"Corrective Actions", D6:"Implement & Validate", D7:"Prevent Recurrence", D8:"Team Recognition" };
    subject = `[${defect.id}] Phase Advanced → ${newPhase}: ${phaseNames[newPhase] || newPhase}`;
    html = baseTemplate(`Phase Advanced to ${newPhase}`, `
      <div class="field"><div class="field-label">Defect</div><div class="field-value">${defect.id} — ${defect.title}</div></div>
      <div class="field"><div class="field-label">New Phase</div>
        <div class="field-value" style="font-size:16px;color:#F97316;font-weight:700;">${newPhase} — ${phaseNames[newPhase] || ""}</div>
      </div>
      <div class="field"><div class="field-label">Owner</div><div class="field-value">${defect.owner}</div></div>
      <hr class="divider">
      <p style="font-size:12px;color:#666;">The 8D defect has advanced to the next phase. Please review and complete the required actions for <b>${newPhase}</b>.</p>
    `);

  } else if (type === "story_assigned") {
    const { story, sprint } = payload;
    to = resolveEmails([story.assignee]);
    subject = `[Sprint Assignment] ${story.title}`;
    html = baseTemplate("Story Assigned to Sprint", `
      <div class="field"><div class="field-label">Story</div><div class="field-value">${story.id} — ${story.title}</div></div>
      <div class="field"><div class="field-label">Sprint</div><div class="field-value" style="color:#14B8A6;font-weight:700;">${sprint.name} (${sprint.start} → ${sprint.end})</div></div>
      <div class="field"><div class="field-label">Points</div><div class="field-value">${story.points} pts · ${story.priority} priority</div></div>
      <div class="field"><div class="field-label">Assignee</div><div class="field-value">${story.assignee}</div></div>
      ${story.linkedDefectId ? `<div class="field"><div class="field-label">Linked 8D Defect</div><div class="field-value" style="color:#F97316;">${story.linkedDefectId}</div></div>` : ""}
      <hr class="divider">
      <p style="font-size:12px;color:#666;">This story has been added to your sprint. Please review the acceptance criteria and update status as you progress.</p>
    `);

  } else {
    return NextResponse.json({ error: "Unknown notification type" }, { status: 400 });
  }

  if (!to || to.length === 0) {
    return NextResponse.json({ skipped: true, reason: "No resolved email addresses for recipients" });
  }

  try {
    const result = await resend.emails.send({ from: FROM, to, subject, html });
    return NextResponse.json({ ok: true, id: result.id, to });
  } catch (err) {
    console.error("Notify error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
