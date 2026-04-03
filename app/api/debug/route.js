export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ?? "NOT SET",
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? "SET (" + process.env.TURSO_AUTH_TOKEN.length + " chars)" : "NOT SET",
    DATABASE_URL: process.env.DATABASE_URL ?? "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
  });
}
