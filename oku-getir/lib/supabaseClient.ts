import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Supabase env doluysa true — hook'lar otomatik Supabase'e geçer */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let client: SupabaseClient | null = null;

/**
 * Tek bir Supabase istemcisi döndürür.
 * Env yoksa null — bu durumda hook'lar dummy-data.json kullanır.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!client) {
    client = createClient(supabaseUrl!, supabaseAnonKey!);
  }

  return client;
}
