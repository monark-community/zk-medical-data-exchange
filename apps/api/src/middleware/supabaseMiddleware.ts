import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "../config/supabase";

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

export const supabaseMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  req.supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
    },
  });
  next();
};
