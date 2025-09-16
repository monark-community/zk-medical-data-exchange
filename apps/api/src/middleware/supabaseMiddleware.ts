import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

import type { SupabaseClient } from "@supabase/supabase-js";
import { Config } from "../config/config";

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
  req.supabase = createClient(Config.SUPABASE_URL, Config.SUPABASE_KEY, {
    auth: {
      persistSession: false,
    },
  });
  next();
};
