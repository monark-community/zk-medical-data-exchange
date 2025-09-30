import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'test') {
  dotenv.config();
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (process.env.NODE_ENV === 'test') {
      return '';
    }
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function determineLocalMode(): boolean {
  if (process.env.IS_CI === "true") return true;
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
  PINATA_API_KEY: requireEnv('PINATA_API_KEY'),
  PINATA_SECRET_API_KEY: requireEnv('PINATA_SECRET_API_KEY')
};
