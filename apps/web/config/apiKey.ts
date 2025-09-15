if (!process.env.NEXT_PUBLIC_API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}
export const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
