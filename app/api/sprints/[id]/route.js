export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function PUT(req, { params }) {
  const body = await req.json();
  const sprint = await prisma.sprint.update({ where: { id: params.id }, data: body });
  return NextResponse.json(sprint);
}

export async function DELETE(_, { params }) {
  await prisma.sprint.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
