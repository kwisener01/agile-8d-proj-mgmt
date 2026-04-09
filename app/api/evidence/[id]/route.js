export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(_, { params }) {
  const item = await prisma.evidence.findUnique({ where: { id: params.id } });
  if (!item) return new NextResponse(null, { status: 404 });

  if (item.url.startsWith("/uploads/")) {
    // Local file — remove from public/uploads
    const localPath = path.join(process.cwd(), "public", item.url);
    try { await unlink(localPath); } catch (_) { /* already gone */ }
  } else if (process.env.BLOB_READ_WRITE_TOKEN) {
    // Vercel Blob
    try {
      const { del } = await import("@vercel/blob");
      await del(item.url);
    } catch (_) { /* blob may already be gone */ }
  }

  await prisma.evidence.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
