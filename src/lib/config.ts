/**
 * PERMANENT CONFIGURATION FOR CLOUD CONNECTIONS (SUPABASE & PAKASIR)
 *
 * Catatan untuk Developer / Admin:
 * Nilai di bawah ini akan digunakan sebagai koneksi permanen aplikasi.
 * Setiap perangkat baru (HP, Laptop, Tablet) yang membuka website ini akan
 * otomatis terhubung ke Supabase dan Pakasir tanpa perlu input ulang.
 * 
 * Anda bisa mengubah nilainya di bawah ini atau melalui Panel Admin.
 */

export const PERMANENT_CONFIG = {
  // 1. Supabase Cloud Database Configuration
  supabaseUrl: (import.meta as any).env?.VITE_SUPABASE_URL || '',
  supabaseAnonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '',

  // 2. Pakasir Payment Gateway Configuration
  pakasirProjectKey:
    (import.meta as any).env?.VITE_PAKASIR_PROJECT_KEY ||
    (import.meta as any).env?.VITE_PAKASIR_PROJECT_SLUG ||
    (import.meta as any).env?.PAKASIR_PROJECT_SLUG ||
    '',
  pakasirApiKey:
    (import.meta as any).env?.VITE_PAKASIR_API_KEY ||
    (import.meta as any).env?.PAKASIR_API_KEY ||
    '',
  pakasirApiUrl: 'https://app.pakasir.com/api',
};
