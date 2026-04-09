export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function PUT(req, { params }) {
  const body = await req.json();
  const { id, linkedStory, agileItems, ...fields } = body;
  if (fields.team && typeof fields.team !== "string") fields.team = JSON.stringify(fields.team);
  if (fields.isIsNot !== undefined && typeof fields.isIsNot !== "string") fields.isIsNot = JSON.stringify(fields.isIsNot);
  if (fields.fiveW2H !== undefined && typeof fields.fiveW2H !== "string") fields.fiveW2H = JSON.stringify(fields.fiveW2H);
  const defect = await prisma.defect.update({ where: { id: params.id }, data: fields });
  return NextResponse.json({
    ...defect,
    team: JSON.parse(defect.team || "[]"),
    isIsNot: JSON.parse(defect.isIsNot || "{}"),
    fiveW2H: JSON.parse(defect.fiveW2H || "{}"),
  });
}

export async function DELETE(_, { params }) {
  await prisma.defect.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
