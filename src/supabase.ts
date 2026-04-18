import { createClient } from '@supabase/supabase-js';

// Get values from environment with trim to avoid hidden whitespace issues
// @ts-ignore
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
// @ts-ignore
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Validation and friendly warning if secrets are missing
// @ts-ignore
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error("ERRO: Configuração do Supabase não encontrada!");
  console.warn("Por favor, adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no menu 'Secrets' (ícone de engrenagem) para que o app funcione.");
}

// The client will still be initialized, but it will fail gracefully if keys are empty
// rather than having hardcoded values in the source code.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);
