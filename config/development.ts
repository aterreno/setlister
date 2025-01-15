import type { Config } from "./index";

const developmentConfig: Partial<Config> = {
  spotifyAuth: {
    callbackURL: "http://localhost:5000/api/auth/spotify/callback",
    successRedirect: "http://localhost:5000"
  },
  server: {
    origin: "http://localhost:5000"
  }
};

export default developmentConfig;
