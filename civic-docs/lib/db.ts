import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __civicPgPool: Pool | undefined;
}

export const pool =
  global.__civicPgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  global.__civicPgPool = pool;
}
