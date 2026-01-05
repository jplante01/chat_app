import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';

// In test environment, use SERVICE_ROLE_KEY for database setup operations
// RLS policies are tested separately using authenticated clients in tests
// In production, use ANON_KEY with RLS enabled
const supabaseKey = import.meta.env.VITEST
  ? 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz' // SERVICE_ROLE_KEY for tests
  : import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  throw new Error('Missing Supabase anon key. Check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    // Increase timeout for slower connections
    timeout: 10000,
  },
  auth: {
    persistSession: true,
  },
});

export default supabase
        