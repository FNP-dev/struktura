import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Brak konfiguracji Supabase. Sprawdź plik .env (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY).');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type AppRole = 'admin' | 'hr' | 'employee';

export interface Profile {
  id: string;
  role_key: AppRole;
  employee_id: string | null;
  display_name: string | null;
  created_at: string;
}
