export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function PUT(req, { params }) {
  const body = await req.json();
  const data = {};
  if (body.name !== undefined) data.name = (body.name || "").trim();
  if (body.email !== undefined) data.email = (body.email || "").trim();
  if (body.role !== undefined) data.role = (body.role || "").trim();
  if (body.initials !== undefined) {
    const initials = (body.initials || "").trim().toUpperCase();
    if (!initials) return NextResponse.json({ error: "Initials cannot be empty" }, { status: 400 });
    const clash = await prisma.member.findUnique({ where: { initials } });
    if (clash && clash.id !== params.id) {
      return NextResponse.json({ error: `A member with initials "${initials}" already exists` }, { status: 409 });
    }
    data.initials = initials;
  }
  const member = await prisma.member.update({ where: { id: params.id }, data });
  return NextResponse.json(member);
}

export async function DELETE(_, { params }) {
  await prisma.member.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
