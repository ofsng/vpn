import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabaseClient) {
  console.warn('[Supabase] URL veya Anon Key tanimli degil. Supabase entegrasyonu devre disi (env ekleyin).');
}

export const supabase = supabaseClient;
export const hasSupabase = !!supabaseClient;
