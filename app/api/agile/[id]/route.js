export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function PUT(req, { params }) {
  const body = await req.json();
  const data = { ...body };
  if (data.tags) data.tags = JSON.stringify(data.tags);
  const item = await prisma.agileItem.update({ where: { id: params.id }, data });
  return NextResponse.json({ ...item, tags: JSON.parse(item.tags) });
}

export async function DELETE(_, { params }) {
  await prisma.agileItem.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
