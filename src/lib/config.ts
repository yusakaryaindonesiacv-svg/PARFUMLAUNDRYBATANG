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
  supabaseUrl: (import.meta as any).env?.VITE_SUPABASE_URL || 'https://wlpbmx4tlehy45ax2jmzy5.supabase.co',
  supabaseAnonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '',

  // 2. Pakasir Payment Gateway Configuration
  pakasirProjectKey: (import.meta as any).env?.VITE_PAKASIR_PROJECT_KEY || 'DEMO-PAKASIR-BATANG',
  pakasirApiKey: (import.meta as any).env?.VITE_PAKASIR_API_KEY || 'demo_api_key_pakasir_123',
  pakasirApiUrl: 'https://app.pakasir.com/api',
};
