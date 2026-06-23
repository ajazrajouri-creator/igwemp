// ============================================================
// IGWEMP — Supabase Client Singleton
// Safe to run without .env configured (uses stub in dev mode)
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const DEV_PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const DEV_PLACEHOLDER_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjUwMDAwMDAwMH0.placeholder';

const isRealConfig =
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('placeholder');

if (!isRealConfig) {
  console.warn('[IGWEMP] Supabase not configured. Running in DEV/MOCK mode. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables for production use.');
}

export const supabase = createClient(
  isRealConfig ? supabaseUrl : DEV_PLACEHOLDER_URL,
  isRealConfig ? supabaseAnonKey : DEV_PLACEHOLDER_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export const isSupabaseConfigured = isRealConfig;
export default supabase;

