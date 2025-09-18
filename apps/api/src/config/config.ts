
import * as dotenv from "dotenv";
dotenv.config();

function requireEnv(name: string): string | undefined {
  if (process.env.IS_CI) return undefined;
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function determineLocalMode(): boolean {
  if (process.env.IS_CI) return true;
  return process.env.IS_LOCAL_MODE === "true";
}

export const Config = {
  IS_CI: process.env.IS_CI === "true",
  IS_LOCAL_MODE: determineLocalMode(),
  NODE_ENV: process.env.NODE_ENV || "development",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  APP_API_KEY: requireEnv("APP_API_KEY"),
  // Supabase
  SUPABASE_URL: requireEnv("SUPABASE_URL"),
  SUPABASE_KEY: requireEnv("SUPABASE_ANON_KEY"),
};
