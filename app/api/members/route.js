export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const members = await prisma.member.findMany({ orderBy: { initials: "asc" } });
  return NextResponse.json(members);
}

export async function POST(req) {
  const body = await req.json();
  const initials = (body.initials || "").trim().toUpperCase();
  if (!initials) return NextResponse.json({ error: "Initials are required" }, { status: 400 });

  const existing = await prisma.member.findUnique({ where: { initials } });
  if (existing) return NextResponse.json({ error: `A member with initials "${initials}" already exists` }, { status: 409 });

  const all = await prisma.member.findMany({ select: { id: true } });
  const maxNum = all.reduce((m, x) => Math.max(m, parseInt(x.id.replace("MB-", "")) || 0), 0);
  const id = `MB-${String(maxNum + 1).padStart(3, "0")}`;

  const member = await prisma.member.create({
    data: {
      id,
      initials,
      name: (body.name || "").trim(),
      email: (body.email || "").trim(),
      role: (body.role || "").trim(),
    },
  });
  return NextResponse.json(member, { status: 201 });
}
