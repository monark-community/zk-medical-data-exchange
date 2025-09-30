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

  // Blockchain Configuration
  SEPOLIA_PRIVATE_KEY: requireEnv("SEPOLIA_PRIVATE_KEY"),
  SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL,

  // Smart Contract Addresses
  // TODO: [LT] Remove the default values before deploying to production!
  STUDY_FACTORY_ADDRESS:
    process.env.STUDY_FACTORY_ADDRESS || "0x46209a88c172e06dd2c3eae2d2bca161e3306aef",
  ZK_VERIFIER_ADDRESS:
    process.env.ZK_VERIFIER_ADDRESS || "0x3c973b7ed28c26efcd6e733e722b1a5d3d488046",
};
