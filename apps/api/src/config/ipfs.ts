if (!process.env.LIGHTHOUSE_API_KEY) {
  throw new Error("LIGHTHOUSE_API_KEY is not set in environment variables");
}

export const LIGHTHOUSE_API_KEY = process.env.LIGHTHOUSE_API_KEY;
