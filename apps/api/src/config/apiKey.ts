if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}
export const API_KEY = process.env.API_KEY!;
