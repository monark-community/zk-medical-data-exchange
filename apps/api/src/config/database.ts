import { createClient } from '@supabase/supabase-js';
import { Config } from './config.js';

export const db = createClient(Config.SUPABASE_URL, Config.SUPABASE_KEY);
