import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const sprints = await prisma.sprint.findMany();
  return NextResponse.json(sprints);
}

export async function POST(req) {
  const body = await req.json();
  const sprint = await prisma.sprint.create({ data: body });
  return NextResponse.json(sprint, { status: 201 });
}
