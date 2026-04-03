export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const items = await prisma.agileItem.findMany();
    return NextResponse.json(items.map((i) => ({ ...i, tags: JSON.parse(i.tags) })));
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  const body = await req.json();
  const item = await prisma.agileItem.create({
    data: { ...body, tags: JSON.stringify(body.tags ?? []) },
  });
  return NextResponse.json({ ...item, tags: JSON.parse(item.tags) }, { status: 201 });
}
