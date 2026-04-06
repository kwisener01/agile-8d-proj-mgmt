export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const defects = await prisma.defect.findMany({
    include: { agileItems: { select: { id: true } } },
  });
  return NextResponse.json(
    defects.map(({ agileItems, ...d }) => ({
      ...d,
      team: JSON.parse(d.team),
      linkedStory: agileItems[0]?.id ?? null,
    }))
  );
}

export async function POST(req) {
  const body = await req.json();
  // Generate ID server-side from actual DB state to avoid stale client counts
  const all = await prisma.defect.findMany({ select: { id: true } });
  const maxNum = all.reduce((m, d) => Math.max(m, parseInt(d.id.replace("8D-", "")) || 0), 0);
  const id = `8D-${String(maxNum + 1).padStart(3, "0")}`;
  const { id: _ignored, ...rest } = body;
  const defect = await prisma.defect.create({
    data: { ...rest, id, team: JSON.stringify(rest.team ?? []) },
  });
  return NextResponse.json({ ...defect, team: JSON.parse(defect.team) }, { status: 201 });
}
