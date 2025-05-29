
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xqunsehvpdidinmqhvns.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxdW5zZWh2cGRpZGlubXFodm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMjE4NjcsImV4cCI6MjA2MzY5Nzg2N30.KfHj4K1sGGu7tqBkJRwCOAivSs1WxB6oKxNrfnTTYoc';

if (!supabaseUrl || !supabaseAnonKey) {
  // This check is more for development; in a bundled app, these would be present or build would fail.
  console.error('Supabase URL or Anon Key is missing. Please check your configuration. Application cannot start.');
  throw new Error('Supabase URL or Anon Key is missing.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
