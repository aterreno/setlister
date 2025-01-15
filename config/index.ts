import { merge } from "lodash";
import developmentConfig from "./development";
import productionConfig from "./production";

export interface Config {
  spotifyAuth: {
    callbackURL: string;
    successRedirect: string;
  };
  server: {
    origin: string;
    cookieDomain?: string;
  };
}

const baseConfig: Config = {
  spotifyAuth: {
    callbackURL: "",
    successRedirect: "/"
  },
  server: {
    origin: ""
  }
};

function getConfig(): Config {
  const env = process.env.NODE_ENV || "development";
  const envConfig = env === "production" ? productionConfig : developmentConfig;
  return merge({}, baseConfig, envConfig);
}

export const config = getConfig();
