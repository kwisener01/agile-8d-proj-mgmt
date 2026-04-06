export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const sprints = await prisma.sprint.findMany();
  return NextResponse.json(sprints);
}

export async function POST(req) {
  const body = await req.json();
  // Generate ID server-side from actual DB state
  const all = await prisma.sprint.findMany({ select: { id: true } });
  const maxNum = all.reduce((m, s) => Math.max(m, parseInt(s.id.replace("SP-", "")) || 0), 0);
  const id = `SP-${String(maxNum + 1).padStart(2, "0")}`;
  const { id: _ignored, ...rest } = body;
  const sprint = await prisma.sprint.create({ data: { ...rest, id } });
  return NextResponse.json(sprint, { status: 201 });
}
