export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function PUT(req, { params }) {
  const body = await req.json();
  const { id, ...fields } = body;
  if (fields.tags) fields.tags = JSON.stringify(fields.tags);
  const item = await prisma.agileItem.update({ where: { id: params.id }, data: fields });
  return NextResponse.json({ ...item, tags: JSON.parse(item.tags) });
}

export async function DELETE(_, { params }) {
  await prisma.agileItem.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
