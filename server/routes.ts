import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as SpotifyStrategy } from "passport-spotify";
import { nanoid } from 'nanoid';
import { and, eq } from "drizzle-orm";
import { db } from "@db";
import { users, playlists } from "@db/schema";
import MemoryStore from "memorystore";
import fetch from "node-fetch";
import { config } from "../config";

const MemoryStoreSession = MemoryStore(session);

export function registerRoutes(app: Express): Server {
  if (!config.spotify.clientId || !config.spotify.clientSecret) {
    throw new Error("Missing required Spotify environment variables");
  }

  console.log("Environment:", config.isDev ? "development" : "production");
  console.log("Using Spotify callback URL:", config.auth.callbackUrl);
  console.log("Cookie Domain:", config.auth.cookieDomain);
  console.log("Base URL:", config.baseUrl);

  // Session configuration with proper cookie settings
  app.use(session({
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: config.session.secret,
    resave: true,
    saveUninitialized: true,
    name: 'setlister.sid',
    proxy: true,
    cookie: {
      secure: config.isProd,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'none', // Changed to none for cross-site access
      domain: config.isProd ? 'setlister.replit.app' : 'localhost', // Use exact domain in prod
      path: '/'
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Add more detailed session debugging
  app.use((req, res, next) => {
    console.log('=== Session Debug ===');
    console.log('Session ID:', req.sessionID);
    console.log('Is Authenticated:', req.isAuthenticated());
    console.log('Session:', req.session);
    console.log('Cookies:', req.headers.cookie);
    console.log('===================');
    next();
  });

  // Spotify strategy configuration
  passport.use(new SpotifyStrategy({
    clientID: config.spotify.clientId,
    clientSecret: config.spotify.clientSecret,
    callbackURL: config.auth.callbackUrl,
    scope: ['playlist-modify-public', 'playlist-modify-private']
  }, async (accessToken, refreshToken, expires_in, profile, done) => {
    try {
      console.log("Spotify auth callback received for profile:", profile.id);

      const existingUser = await db.query.users.findFirst({
        where: eq(users.spotifyId, profile.id)
      });

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

      if (existingUser) {
        console.log("Updating existing user:", existingUser.id);
        await db.update(users).set({
          accessToken,
          refreshToken,
          expiresAt
        }).where(eq(users.id, existingUser.id));
        return done(null, existingUser);
      }

      console.log("Creating new user for Spotify ID:", profile.id);
      const [newUser] = await db.insert(users).values({
        spotifyId: profile.id,
        accessToken,
        refreshToken,
        expiresAt
      }).returning();

      return done(null, newUser);
    } catch (err) {
      console.error('Authentication error:', err);
      return done(err as Error);
    }
  }));

  passport.serializeUser((user: any, done) => {
    console.log("Serializing user:", user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log("Deserializing user:", id);
      const user = await db.query.users.findFirst({
        where: eq(users.id, id)
      });
      done(null, user);
    } catch (err) {
      console.error('Deserialization error:', err);
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
            'x-api-key': config.setlistFm.apiKey,
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

  // Routes
  app.get('/api/auth/spotify',
    (req, res, next) => {
      console.log('Starting Spotify authentication');
      next();
    },
    passport.authenticate('spotify')
  );

  app.get('/api/auth/spotify/callback',
    passport.authenticate('spotify', {
      failureRedirect: '/',
      successRedirect: config.auth.successRedirect
    })
  );

  app.get('/api/auth/user', (req, res) => {
    console.log('Auth status:', req.isAuthenticated());
    console.log('Session:', req.session);
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json(req.user);
  });

  app.post('/api/playlists', async (req, res) => {
    if (!req.isAuthenticated()) {
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

  // Generate share link for a playlist
  app.post('/api/playlists/:id/share', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const playlistId = parseInt(req.params.id);
      const [playlist] = await db.select()
        .from(playlists)
        .where(
          and(
            eq(playlists.id, playlistId),
            eq(playlists.userId, (req.user as any).id)
          )
        );

      if (!playlist) {
        return res.status(404).json({ error: 'Playlist not found' });
      }

      // Generate a unique share ID if not exists
      if (!playlist.shareId) {
        const shareId = nanoid(10); // Generate a short unique ID
        await db.update(playlists)
          .set({ 
            shareId, 
            isPublic: true,
            shares: (playlist.shares || 0) + 1 
          })
          .where(eq(playlists.id, playlistId));

        return res.json({ 
          shareUrl: `${config.baseUrl}/shared/${shareId}`,
          shareId 
        });
      }

      // Increment share count
      await db.update(playlists)
        .set({ shares: (playlist.shares || 0) + 1 })
        .where(eq(playlists.id, playlistId));

      return res.json({ 
        shareUrl: `${config.baseUrl}/shared/${playlist.shareId}`,
        shareId: playlist.shareId 
      });
    } catch (error) {
      console.error('Failed to share playlist:', error);
      res.status(500).json({ error: 'Failed to share playlist' });
    }
  });

  // Get shared playlist
  app.get('/api/shared/:shareId', async (req, res) => {
    try {
      const { shareId } = req.params;
      const [playlist] = await db.select()
        .from(playlists)
        .where(
          and(
            eq(playlists.shareId, shareId),
            eq(playlists.isPublic, true)
          )
        );

      if (!playlist) {
        return res.status(404).json({ error: 'Shared playlist not found' });
      }

      // Get the Spotify playlist details
      const user = await db.query.users.findFirst({
        where: eq(users.id, playlist.userId)
      });

      if (!user) {
        return res.status(404).json({ error: 'Playlist owner not found' });
      }

      const spotifyResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${playlist.spotifyId}`,
        {
          headers: {
            'Authorization': `Bearer ${user.accessToken}`
          }
        }
      );

      if (!spotifyResponse.ok) {
        return res.status(500).json({ error: 'Failed to fetch playlist details' });
      }

      const spotifyPlaylist = await spotifyResponse.json();

      return res.json({
        id: playlist.id,
        spotifyId: playlist.spotifyId,
        name: spotifyPlaylist.name,
        description: spotifyPlaylist.description,
        tracks: spotifyPlaylist.tracks.items,
        shareCount: playlist.shares
      });
    } catch (error) {
      console.error('Failed to get shared playlist:', error);
      res.status(500).json({ error: 'Failed to get shared playlist' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}