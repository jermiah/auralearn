import { createClient } from '@supabase/supabase-js';

// Helper to get environment variables
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://placeholder.supabase.co');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder');

/**
 * Anonymous Supabase client for unauthenticated operations
 * This client is specifically configured for student assessment submissions
 * where students are not logged in users.
 */
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'x-client-info': 'supabase-anon-client',
    },
  },
});

/**
 * Use this client for:
 * - Student assessment submissions (unauthenticated)
 * - Public data access
 * - Any operation that should work without authentication
 */
