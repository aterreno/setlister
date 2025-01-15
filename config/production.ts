import type { Config } from "./index";

const productionConfig: Partial<Config> = {
  baseUrl: 'https://setlister.replit.app',
  auth: {
    callbackUrl: 'https://setlister.replit.app/api/auth/spotify/callback',
    successRedirect: 'https://setlister.replit.app',
    cookieDomain: '.replit.app'  // Changed back to .replit.app to work with Replit's domain
  },
  session: {
    secret: 'production-secret-key'
  }
};

export default productionConfig;