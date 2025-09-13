import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "../config/supabase";

export const supabaseMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  req.supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
    },
  });
  next();
};
