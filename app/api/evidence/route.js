export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const defectId = searchParams.get("defectId");

  if (!defectId) {
    // Return all evidence (used for eager load on startup)
    const items = await prisma.evidence.findMany({ orderBy: { uploadedAt: "desc" } });
    return NextResponse.json(items);
  }

  const items = await prisma.evidence.findMany({ where: { defectId }, orderBy: { uploadedAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req) {
  const body = await req.json();
  const all = await prisma.evidence.findMany({ select: { id: true } });
  const id = `EV-${String(all.length + 1).padStart(4, "0")}-${Date.now()}`;
  const item = await prisma.evidence.create({
    data: { id, defectId: body.defectId, url: body.url, caption: body.caption || "", phase: body.phase || "", uploadedAt: new Date().toISOString() },
  });
  return NextResponse.json(item, { status: 201 });
}
