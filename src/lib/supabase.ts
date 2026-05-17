import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseConfig) {
  console.warn('Supabase config is missing. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
}

// Persist the client on window so HMR reloads reuse it instead of creating
// a second instance that fights over the navigator.locks auth token.
declare global {
  interface Window { __supabaseClient?: SupabaseClient }
}

if (!window.__supabaseClient) {
  window.__supabaseClient = createClient(
    supabaseUrl || 'https://invalid.local',
    supabaseAnonKey || 'invalid',
  );
}

export const supabase = window.__supabaseClient;
