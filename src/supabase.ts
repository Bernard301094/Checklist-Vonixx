/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aogzdxwruaqgiaprmvuz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ3pkeHdydWFxZ2lhcHJtdnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjgxNzksImV4cCI6MjA5MjEwNDE3OX0.Gy8zfJKr_KsDUQqRf3WVPujBQYqfH-qcWiH46OCbpME';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }
});