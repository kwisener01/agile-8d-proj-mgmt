export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { del } from "@vercel/blob";

export async function DELETE(_, { params }) {
  const item = await prisma.evidence.findUnique({ where: { id: params.id } });
  if (!item) return new NextResponse(null, { status: 404 });
  // Remove from Vercel Blob
  try { await del(item.url); } catch (_) { /* blob may already be gone */ }
  await prisma.evidence.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
