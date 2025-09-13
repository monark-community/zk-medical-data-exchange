import type { SupabaseClient } from "@supabase/supabase-js";

// This is made to add custom properties to the Express Request object
declare global {
  // eslint-disable-next-line no-unused-vars
  namespace Express {
    // eslint-disable-next-line no-unused-vars
    interface Request {
      supabase: SupabaseClient;
    }
  }
}
