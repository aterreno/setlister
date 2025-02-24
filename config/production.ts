import type { Config } from "./index";

const productionConfig: Partial<Config> = {
  baseUrl: 'https://localhost',
  auth: {
    callbackUrl: 'https://localhost/api/auth/spotify/callback',
    successRedirect: 'https://localhost',
    cookieDomain: '.localhost'  // Changed back to .replit.app to work with Replit's domain
  },
  session: {
    secret: 'production-secret-key'
  }
};

export default productionConfig;