
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import ws from "ws";

const runMigration = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  const db = drizzle({
    connection: process.env.DATABASE_URL,
    ws,
  });

  console.log("Running migrations...");
  
  await migrate(db, { migrationsFolder: "migrations" });
  
  console.log("Migrations completed!");
  process.exit(0);
};

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
