import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const defects = await prisma.defect.findMany({
    include: { agileItems: { select: { id: true } } },
  });
  return NextResponse.json(
    defects.map(({ agileItems, ...d }) => ({
      ...d,
      team: JSON.parse(d.team),
      linkedStory: agileItems[0]?.id ?? null,
    }))
  );
}

export async function POST(req) {
  const body = await req.json();
  const defect = await prisma.defect.create({
    data: { ...body, team: JSON.stringify(body.team ?? []) },
  });
  return NextResponse.json({ ...defect, team: JSON.parse(defect.team) }, { status: 201 });
}
