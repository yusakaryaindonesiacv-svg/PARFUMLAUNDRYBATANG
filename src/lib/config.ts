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
  supabaseUrl:
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    'https://lwcksavogzbkostwlwtv.supabase.co',
  supabaseAnonKey:
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Y2tzYXZvZ3pia29zdHdsd3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDc1MjUsImV4cCI6MjEwMTIyMzUyNX0.OoIqlADsRxC1Bjj-UfYYrx_N4gkRAYG1PlPxO2bOwHs',

  // 2. Pakasir Payment Gateway Configuration
  pakasirProjectKey:
    (import.meta as any).env?.VITE_PAKASIR_PROJECT_KEY ||
    (import.meta as any).env?.VITE_PAKASIR_PROJECT_SLUG ||
    (import.meta as any).env?.PAKASIR_PROJECT_SLUG ||
    'parfum-laundry-batang',
  pakasirApiKey:
    (import.meta as any).env?.VITE_PAKASIR_API_KEY ||
    (import.meta as any).env?.PAKASIR_API_KEY ||
    '7IXNQUn8RzLNgpDRHacqWHpit6FTSBVj',
  pakasirApiUrl: 'https://app.pakasir.com/api',
};
