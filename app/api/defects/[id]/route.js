export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function PUT(req, { params }) {
  const body = await req.json();
  const data = { ...body };
  if (data.team) data.team = JSON.stringify(data.team);
  const defect = await prisma.defect.update({ where: { id: params.id }, data });
  return NextResponse.json({ ...defect, team: JSON.parse(defect.team) });
}

export async function DELETE(_, { params }) {
  await prisma.defect.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
