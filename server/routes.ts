import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as SpotifyStrategy } from "passport-spotify";
import { and, eq } from "drizzle-orm";
import { db } from "@db";
import { users, playlists } from "@db/schema";
import MemoryStore from "memorystore";
import fetch from "node-fetch";

const MemoryStoreSession = MemoryStore(session);

export function registerRoutes(app: Express): Server {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET || !process.env.SPOTIFY_CALLBACK_URL) {
    throw new Error("Missing required Spotify environment variables");
  }

  app.use(session({
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET || "development-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new SpotifyStrategy({
    clientID: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    callbackURL: process.env.SPOTIFY_CALLBACK_URL,
    scope: ['playlist-modify-public', 'playlist-modify-private']
  }, async (accessToken, refreshToken, expires_in, profile, done) => {
    try {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.spotifyId, profile.id)
      });

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

      if (existingUser) {
        await db.update(users).set({
          accessToken,
          refreshToken,
          expiresAt
        }).where(eq(users.id, existingUser.id));
        return done(null, existingUser);
      }

      const [newUser] = await db.insert(users).values({
        spotifyId: profile.id,
        accessToken,
        refreshToken,
        expiresAt
      }).returning();

      return done(null, newUser);
    } catch (err) {
      return done(err as Error);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id)
      });
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Setlist.fm proxy endpoint
  app.get('/api/setlists/search', async (req, res) => {
    try {
      const artistName = req.query.artistName;
      if (!artistName) {
        return res.status(400).json({ error: 'Artist name is required' });
      }

      const response = await fetch(
        `https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(artistName as string)}`,
        {
          headers: {
            'x-api-key': process.env.VITE_SETLIST_FM_API_KEY || '',
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Setlist.fm API error: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Setlist.fm API error:', error);
      res.status(500).json({ error: 'Failed to fetch setlists' });
    }
  });

  app.get('/api/auth/spotify', passport.authenticate('spotify'));

  app.get('/api/auth/spotify/callback',
    passport.authenticate('spotify', { failureRedirect: '/' }),
    (_req, res) => res.redirect('/')
  );

  app.get('/api/auth/user', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json(req.user);
  });

  app.post('/api/playlists', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { spotifyId, setlistId } = req.body;

    try {
      const [playlist] = await db.insert(playlists).values({
        userId: (req.user as any).id,
        spotifyId,
        setlistId
      }).returning();

      res.json(playlist);
    } catch (err) {
      console.error('Failed to create playlist:', err);
      res.status(500).json({ error: 'Failed to create playlist' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}