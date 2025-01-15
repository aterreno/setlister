import type { Config } from "./index";

const productionConfig: Partial<Config> = {
  spotifyAuth: {
    callbackURL: "https://setlister.replit.app/api/auth/spotify/callback",
    successRedirect: "https://setlister.replit.app"
  },
  server: {
    origin: "https://setlister.replit.app",
    cookieDomain: ".replit.app"
  }
};

export default productionConfig;
