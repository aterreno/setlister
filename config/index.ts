import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.string().transform(Number).default('5000'),

  // Auth Configuration
  SPOTIFY_CLIENT_ID: z.string(),
  SPOTIFY_CLIENT_SECRET: z.string(),
  AUTH_CALLBACK_URL: z.string().optional(),
  AUTH_SUCCESS_REDIRECT: z.string().optional(),
  SERVER_ORIGIN: z.string().optional(),
  COOKIE_DOMAIN: z.string().optional(),
  BASE_URL: z.string().optional(),

  // API Keys
  SETLIST_FM_API_KEY: z.string(),

  // Database Configuration
  DATABASE_URL: z.string(),
});

// Validates environment variables against the schema
const env = envSchema.parse(process.env);

// Base configuration that's shared between environments
const baseConfig = {
  port: env.PORT,
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
  spotify: {
    clientId: env.SPOTIFY_CLIENT_ID,
    clientSecret: env.SPOTIFY_CLIENT_SECRET,
  },
  setlistFm: {
    apiKey: env.SETLIST_FM_API_KEY,
  },
  database: {
    url: env.DATABASE_URL,
  },
};

// Environment-specific configuration
const envConfig = {
  development: {
    baseUrl: env.BASE_URL || 'http://localhost:5000',
    auth: {
      callbackUrl: env.AUTH_CALLBACK_URL || 'http://localhost:5000/api/auth/spotify/callback',
      successRedirect: env.AUTH_SUCCESS_REDIRECT || 'http://localhost:5000',
      cookieDomain: env.COOKIE_DOMAIN || 'localhost',
    },
    session: {
      secret: 'development-secret-key',
    },
  },
  production: {
    baseUrl: env.BASE_URL || 'https://localhost',
    auth: {
      callbackUrl: env.AUTH_CALLBACK_URL || 'https://localhost/api/auth/spotify/callback',
      successRedirect: env.AUTH_SUCCESS_REDIRECT || 'https://localhost',
      cookieDomain: env.COOKIE_DOMAIN || 'localhost',
    },
    session: {
      secret: 'production-secret-key',
    },
  },
};

// Combine base config with environment-specific config
export const config = {
  ...baseConfig,
  ...envConfig[env.NODE_ENV],
};

// Type definitions for the config
export type Config = typeof config;