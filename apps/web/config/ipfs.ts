if (!process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY) {
  throw new Error("NEXT_PUBLIC_LIGHTHOUSE_API_KEY is not set");
}

export const LIGHTHOUSE_API_KEY = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY;
