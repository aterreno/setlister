
import { drizzle } from "drizzle-orm/neon-serverless";
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
  
  try {
    // Drop tables in correct order
    await db.execute(`
      DROP TABLE IF EXISTS playlists CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    
    console.log("Dropped existing tables");

    // Create tables in correct order with all required columns
    await db.execute(`
      CREATE TABLE users (
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

      CREATE TABLE playlists (
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
    
    console.log("Created new tables successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
  
  process.exit(0);
};

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
