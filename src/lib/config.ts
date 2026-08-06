/**
 * CONFIGURATION FOR CLOUD CONNECTIONS (SUPABASE & PAKASIR)
 *
 * Kredensial dibaca dari Environment Variables Vercel atau AI Studio Secrets:
 * - VITE_SUPABASE_URL / SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY
 * - VITE_PAKASIR_PROJECT_KEY / PAKASIR_PROJECT_KEY
 * - VITE_PAKASIR_API_KEY / PAKASIR_API_KEY
 */

export const PERMANENT_CONFIG = {
  // 1. Supabase Cloud Database Configuration from Env
  supabaseUrl:
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    (import.meta as any).env?.SUPABASE_URL ||
    '',
  supabaseAnonKey:
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    (import.meta as any).env?.SUPABASE_ANON_KEY ||
    '',

  // 2. Pakasir Payment Gateway Configuration from Env
  pakasirProjectKey:
    (import.meta as any).env?.VITE_PAKASIR_PROJECT_KEY ||
    (import.meta as any).env?.VITE_PAKASIR_PROJECT_SLUG ||
    (import.meta as any).env?.PAKASIR_PROJECT_SLUG ||
    (import.meta as any).env?.PAKASIR_PROJECT_KEY ||
    '',
  pakasirApiKey:
    (import.meta as any).env?.VITE_PAKASIR_API_KEY ||
    (import.meta as any).env?.PAKASIR_API_KEY ||
    '',
  pakasirApiUrl: 'https://app.pakasir.com/api',
};

