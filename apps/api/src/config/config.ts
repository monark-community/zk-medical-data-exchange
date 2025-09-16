import * as dotenv from "dotenv";
dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const Config = {
  APP_API_KEY: requireEnv("APP_API_KEY"),
  IS_IN_TESTING_MODE: process.env.IS_TESTING === "true" || false,
  // Supabase
  SUPABASE_URL: requireEnv("SUPABASE_URL"),
  SUPABASE_KEY: requireEnv("SUPABASE_ANON_KEY"),
};
