import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

let _client = null;

function getClient() {
  if (_client) return _client;
  if (process.env.TURSO_AUTH_TOKEN) {
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    _client = new PrismaClient({ adapter: new PrismaLibSQL(libsql) });
  } else {
    _client = new PrismaClient();
  }
  return _client;
}

// Proxy defers client creation until first use (avoids build-time init errors)
export const prisma = new Proxy(
  {},
  { get(_, prop) { return getClient()[prop]; } }
);
