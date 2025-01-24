
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

const runMigration = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  const db = drizzle({
    connection: process.env.DATABASE_URL,
    ws,
  });

  console.log("Running migrations...");
  
  try {
    // Drop existing tables if they exist
    await db.execute(`
      DO $$ 
      DECLARE 
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);
    
    console.log("Dropped existing tables");

    // Create tables from schema
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        spotify_id TEXT UNIQUE NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        is_premium BOOLEAN DEFAULT false,
        subscription_ends_at TIMESTAMP,
        monthly_playlist_limit INTEGER DEFAULT 3
      );

      CREATE TABLE IF NOT EXISTS playlists (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        spotify_id TEXT NOT NULL,
        setlist_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        share_id TEXT,
        is_public BOOLEAN DEFAULT false,
        shares_count INTEGER DEFAULT 0
      );
    `);
    
    console.log("Created new tables");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
  
  process.exit(0);
};

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
