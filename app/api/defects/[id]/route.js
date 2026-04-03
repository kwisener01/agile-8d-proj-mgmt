export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function PUT(req, { params }) {
  const body = await req.json();
  const { id, linkedStory, agileItems, ...fields } = body;
  if (fields.team) fields.team = JSON.stringify(fields.team);
  const defect = await prisma.defect.update({ where: { id: params.id }, data: fields });
  return NextResponse.json({ ...defect, team: JSON.parse(defect.team) });
}

export async function DELETE(_, { params }) {
  await prisma.defect.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
