import React from 'react';
import { X, Globe, Database, FileSpreadsheet, CheckCircle2, Copy, ExternalLink, ShieldCheck } from 'lucide-react';
import { SUPABASE_SQL_SCHEMA } from '../lib/supabase';
import { GOOGLE_APPS_SCRIPT_CODE } from '../lib/sheets';

interface DeploymentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeploymentGuideModal: React.FC<DeploymentGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-80">Panduan Siap Pakai & Production</span>
            <h2 className="text-xl font-black">Panduan Deployment ke Vercel & Supabase</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          
          {/* SECTION 1: DEPLOYMENT KE VERCEL */}
          <div className="space-y-3 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">
              <Globe className="w-5 h-5" />
              <span>1. LANGKAH DEPLOYMENT APLIKASI KE VERCEL</span>
            </div>

            <ol className="list-decimal list-inside space-y-2 font-medium pl-1">
              <li>Upload repositori kode ini ke <strong>GitHub</strong> Anda.</li>
              <li>Buka dashboard Vercel di <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline">vercel.com</a> dan buat <strong>New Project</strong>.</li>
              <li>Pilih repositori GitHub Anda. Vercel akan secara otomatis mendeteksi framework <strong>Vite + React + Tailwind</strong>.</li>
              <li>Pada bagian <strong>Environment Variables</strong> di Vercel, tambahkan variabel berikut:
                <div className="my-2 p-3 bg-slate-900 text-indigo-300 rounded-xl font-mono text-[11px] space-y-1">
                  <p>VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co</p>
                  <p>VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</p>
                </div>
              </li>
              <li>Klik tombol <strong>Deploy</strong>. Aplikasi "Parfum Laundry Batang" akan langsung online dengan domain HTTPS gratis!</li>
            </ol>
          </div>

          {/* SECTION 2: SETUP DATABASE SUPABASE */}
          <div className="space-y-3 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
              <Database className="w-5 h-5" />
              <span>2. CARA INSIALISASI DATABASE SUPABASE</span>
            </div>

            <ol className="list-decimal list-inside space-y-2 font-medium pl-1">
              <li>Buat akun/proyek gratis di <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold underline">supabase.com</a>.</li>
              <li>Masuk ke menu <strong>SQL Editor</strong> di dashboard Supabase.</li>
              <li>Salin KODE SQL DDL di bawah ini, lalu tempelkan dan jalankan (Klik <strong>Run</strong>):</li>
            </ol>

            <div className="relative">
              <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[10px] max-h-48 overflow-y-auto">
                {SUPABASE_SQL_SCHEMA}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                  alert('Skema SQL Supabase tersalin ke clipboard!');
                }}
                className="absolute top-2 right-2 px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shadow"
              >
                <Copy className="w-3 h-3" /> Salin SQL
              </button>
            </div>
          </div>

          {/* SECTION 3: GOOGLE SHEETS SETUP */}
          <div className="space-y-3 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-extrabold text-sm">
              <FileSpreadsheet className="w-5 h-5" />
              <span>3. CARA AUTOMATISASI DATABASE GOOGLE SHEETS</span>
            </div>

            <p className="font-medium">
              Aplikasi ini memiliki fitur auto-create sheet dan sinkronisasi otomatis ke Google Sheets tanpa backend tambahan.
            </p>
            <ol className="list-decimal list-inside space-y-2 font-medium pl-1">
              <li>Buka Google Spreadsheet baru.</li>
              <li>Klik menu <strong>Extensions -&gt; Apps Script</strong>.</li>
              <li>Tempelkan kode Apps Script yang disediakan di Panel Admin menu Pengaturan.</li>
              <li>Deploy sebagai <strong>Web App</strong> dengan akses <strong>Anyone</strong>.</li>
              <li>Tempelkan URL Web App yang didapat ke Pengaturan Aplikasi Toko.</li>
            </ol>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md"
          >
            Tutup Panduan
          </button>
        </div>

      </div>
    </div>
  );
};
