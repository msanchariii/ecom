import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config();

async function markMigrationApplied() {
  const sql = neon(process.env.DATABASE_URL!);

  try {
    // Check if drizzle migrations table exists
    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES ('0000_soft_jigsaw', NOW())
      ON CONFLICT DO NOTHING
    `;

    console.log("✓ Migration marked as applied");
  } catch (error) {
    console.error("Error:", error);
  }
}

markMigrationApplied();
