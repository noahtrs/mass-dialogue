import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase environment variables. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY in your .env file.');
}

/**
 * IMPORTANT: This client uses the SUPABASE ANON KEY only.
 * The anon key is safe to expose in the browser because it relies on
 * Row-Level Security (RLS) policies in Supabase for access control.
 *
 * For write operations, the app should use the Express API server
 * (api/server.js) which uses the SERVICE_ROLE_KEY for privileged access.
 * See api/supabaseService.js for server-side operations.
 *
 * Real-time subscriptions are still used here for live updates,
 * but writes should go through the API endpoints.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
