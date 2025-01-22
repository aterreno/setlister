import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  spotifyId: text("spotify_id").unique().notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  spotifyId: text("spotify_id").notNull(),
  setlistId: text("setlist_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Make new columns nullable or with defaults to be backwards compatible
  shareId: text("share_id"), // Nullable for existing records
  isPublic: boolean("is_public").default(false),
  shares: integer("shares_count").default(0),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export const insertPlaylistSchema = createInsertSchema(playlists);
export const selectPlaylistSchema = createSelectSchema(playlists);
export type InsertPlaylist = typeof playlists.$inferInsert;
export type SelectPlaylist = typeof playlists.$inferSelect;
import { integer, pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: integer('id').primaryKey(),
  spotifyId: text('spotify_id').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  isPremium: boolean('is_premium').default(false),
  subscriptionEndsAt: timestamp('subscription_ends_at'),
  monthlyPlaylistLimit: integer('monthly_playlist_limit').default(3),
});
