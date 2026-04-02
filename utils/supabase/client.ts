import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function isSupabaseConfigured(): boolean {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export function createClerkSupabaseClient(getToken: () => Promise<string | null>): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    global: {
      fetch: async (input, init) => {
        const token = await getToken();
        const headers = new Headers(init?.headers);
        if (token) headers.set('Authorization', `Bearer ${token}`);
        return fetch(input, { ...init, headers });
      },
    },
  });
}
