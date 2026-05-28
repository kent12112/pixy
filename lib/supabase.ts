import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import type { Database } from '@/types/database';
import { mockSupabase } from './supabase.mock';

// ─── Supabase Secure Storage (uses Expo SecureStore) ──────────────────────────

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// ─── Client ──────────────────────────────────────────────────────────────────
// Add your Supabase project URL and anon key to .env

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const isMockMode =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl === 'https://your-project.supabase.co';

if (isMockMode) {
  console.warn(
    '[Pixy] Running in MOCK mode — Supabase credentials not configured.\n' +
    'Copy .env.example to .env and fill in your Supabase project credentials to connect a real backend.'
  );
}

export const supabase = isMockMode
  ? mockSupabase
  : createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
