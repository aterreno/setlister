import type { Config } from "./index";

const productionConfig: Config = {
  baseUrl: 'https://setlister.replit.app',
  auth: {
    callbackUrl: 'https://setlister.replit.app/api/auth/spotify/callback',
    successRedirect: 'https://setlister.replit.app',
    cookieDomain: 'setlister.replit.app' 
  },
  session: {
    secret: 'production-secret-key',
  }
};

export default productionConfig;