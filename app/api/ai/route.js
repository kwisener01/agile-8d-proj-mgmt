export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req) {
  const { action, ...payload } = await req.json();
  let prompt;
  let maxTokens = 1024;

  if (action === "fill8d") {
    const { title, severity, description } = payload;
    prompt = `You are an expert in 8D problem solving methodology used in manufacturing and engineering.

Given this defect report:
Title: ${title}
Severity: ${severity}
Description: ${description}

Generate concise, professional content for each 8D phase (D3 through D8). Be specific and actionable based on the problem described.

Return ONLY valid JSON with no markdown, no explanation, no code blocks:
{"containment":"...","rootCause":"...","correctiveActions":"...","implementation":"...","preventiveActions":"...","recognition":"..."}`;
  } else if (action === "generateStory") {
    const { prompt: userPrompt } = payload;
    prompt = `You are an expert agile product manager. Convert this brief description into a complete agile user story.

Input: ${userPrompt}

Generate a well-formed agile story. Choose type from: Story, Bug, Feature. Choose priority from: Critical, High, Med, Low. Points should follow Fibonacci: 1,2,3,5,8,13,21. Tags should be relevant technical keywords (2-4 tags).

Return ONLY valid JSON with no markdown, no explanation, no code blocks:
{"title":"...","type":"Story","points":3,"priority":"Med","tags":["tag1","tag2"],"acceptanceCriteria":["criterion1","criterion2","criterion3"]}`;
  } else if (action === "generate8dReport") {
    const { defect } = payload;
    maxTokens = 2048;
    prompt = `Generate a formal 8D Problem Solving Report document for the following defect.

Defect ID: ${defect.id}
Title: ${defect.title}
Severity: ${defect.severity}
Owner: ${defect.owner}
Team: ${Array.isArray(defect.team) ? defect.team.join(", ") : defect.team}
Created: ${defect.created}
Due Date: ${defect.dueDate}
Current Phase: ${defect.phase}
Description: ${defect.description}

D3 - Containment: ${defect.containment || "Not yet completed"}
D4 - Root Cause: ${defect.rootCause || "Not yet completed"}
D5 - Corrective Actions: ${defect.correctiveActions || "Not yet completed"}
D6 - Implementation & Validation: ${defect.implementation || "Not yet completed"}
D7 - Preventive Actions: ${defect.preventiveActions || "Not yet completed"}
D8 - Team Recognition: ${defect.recognition || "Not yet completed"}

Format this as a professional formal report with clear section headers, using plain text (no markdown). Include an executive summary, all 8 disciplines clearly labeled, and a conclusion. Be concise but thorough.`;
  } else if (action === "search") {
    const { query, agileItems, defects } = payload;
    prompt = `You are a search assistant for a project management tool. Find items matching the user's query.

Query: "${query}"

Agile Items:
${agileItems.map(i => `[${i.id}] ${i.title} | ${i.type} | ${i.priority} | ${i.col} | ${i.assignee} | Tags: ${i.tags.join(", ")}`).join("\n")}

Defects:
${defects.map(d => `[${d.id}] ${d.title} | ${d.severity} | ${d.phase} | Owner: ${d.owner} | ${d.description.slice(0, 80)}`).join("\n")}

Return the IDs of matching items and a brief explanation.
Return ONLY valid JSON with no markdown, no explanation, no code blocks:
{"itemIds":[],"defectIds":[],"explanation":"..."}`;
  } else if (action === "sprintPlan") {
    const { sprint, backlog } = payload;
    prompt = `You are an expert agile coach helping plan a sprint.

Sprint: ${sprint.name}
Dates: ${sprint.start} → ${sprint.end}
Target Velocity: ${sprint.target} points

Backlog items available:
${backlog.map(i => `[${i.id}] ${i.title} | ${i.type} | ${i.priority} | ${i.points}pts | ${i.assignee} | Tags: ${i.tags.join(", ")}${i.linkedDefectId ? " | 8D: " + i.linkedDefectId : ""}`).join("\n")}

Recommend the optimal set of stories for this sprint. Consider: priority (Critical > High > Med > Low), 8D-linked items should get preference, balance assignee workload, stay within the velocity target.

Return ONLY valid JSON with no markdown, no explanation, no code blocks:
{"recommended":["A1","A2"],"totalPoints":0,"reasoning":"..."}`;
  } else if (action === "rca5why") {
    const { title, description, containment } = payload;
    prompt = `You are an expert root cause analyst using the 5-Why methodology.

Problem: ${title}
Description: ${description}
${containment ? `Containment taken: ${containment}` : ""}

Perform a rigorous 5-Why analysis drilling from symptom to true systemic root cause. Each "why" must be a focused question based on the previous answer, not a restatement.

Return ONLY valid JSON with no markdown, no explanation, no code blocks:
{"problem":"...","whys":[{"why":"Why did X?","answer":"Because Y"},{"why":"Why did Y?","answer":"Because Z"},{"why":"...","answer":"..."},{"why":"...","answer":"..."},{"why":"...","answer":"..."}],"rootCause":"The true systemic root cause in one sentence"}`;
  } else if (action === "rcaFishbone") {
    const { title, description, containment } = payload;
    prompt = `You are an expert in Ishikawa/Fishbone root cause analysis.

Problem: ${title}
Description: ${description}
${containment ? `Containment taken: ${containment}` : ""}

Analyze this defect using the 6M fishbone categories. List 1-3 specific, plausible contributing causes per category based on the problem. Leave a category as empty array [] only if truly not applicable.

Return ONLY valid JSON with no markdown, no explanation, no code blocks:
{"categories":{"Man":["cause1"],"Machine":["cause1"],"Method":["cause1"],"Material":["cause1"],"Measurement":["cause1"],"Environment":["cause1"]},"primaryCategory":"Machine","summary":"Most likely root cause based on the fishbone analysis"}`;
  } else if (action === "rcaFaultTree") {
    const { title, description, containment } = payload;
    prompt = `You are an expert in Fault Tree Analysis (FTA) used in engineering and reliability analysis.

Problem: ${title}
Description: ${description}
${containment ? `Containment taken: ${containment}` : ""}

Build a Fault Tree Analysis starting from the top undesired event, decomposing it into intermediate causes and basic (root-level) failure events using AND/OR logic gates.
- OR gate: any one child cause is sufficient to produce the parent event
- AND gate: all child causes must occur together to produce the parent event
- Keep the tree to 2-3 levels deep with 2-4 children per node for clarity
- "type" for leaf nodes must be "basic"; for non-leaf nodes include a "gate" field ("OR" or "AND")

Return ONLY valid JSON with no markdown, no explanation, no code blocks:
{"topEvent":"The top undesired event","tree":{"label":"Top event description","gate":"OR","children":[{"label":"Intermediate cause A","gate":"AND","children":[{"label":"Basic failure cause 1","type":"basic"},{"label":"Basic failure cause 2","type":"basic"}]},{"label":"Basic failure cause 3","type":"basic"}]},"criticalPath":"The most critical failure chain from root to top event","rootCause":"Primary root cause identified by the fault tree"}`;
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  try {
    const msg = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });

    const text = msg.content[0].text.trim();

    if (action === "generate8dReport") {
      return NextResponse.json({ report: text });
    }

    // Strip any accidental markdown fences
    const clean = text.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();
    try {
      return NextResponse.json(JSON.parse(clean));
    } catch {
      return NextResponse.json({ raw: text, error: "Parse error" });
    }
  } catch (err) {
    console.error("AI route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
