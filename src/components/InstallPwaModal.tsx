import React, { useState, useEffect } from 'react';
import { Smartphone, Download, CheckCircle2, Share, MoreVertical, X, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { StoreSettings } from '../types';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onTriggerInstall: () => void;
  settings?: StoreSettings;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onTriggerInstall,
  settings
}) => {
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect if already running as standalone PWA
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://') ||
        localStorage.getItem('pwa_installed') === 'true';
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();
    // Detect device type to default tab
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setActiveTab('ios');
    } else {
      setActiveTab('android');
    }
  }, []);

  if (!isOpen) return null;

  const appName = settings?.storeName || 'Parfum Laundry Batang';
  const logoUrl = settings?.appLogoUrl;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 pr-8">
            <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-lg shrink-0 overflow-hidden flex items-center justify-center">
              {logoUrl ? (
                <img src={logoUrl} alt={appName} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-2xl">
                  {appName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-indigo-100 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> Web App Official
              </div>
              <h2 className="font-extrabold text-lg text-white leading-tight">{appName}</h2>
              <p className="text-xs text-indigo-100">Aplikasi Kasir POS & Pemesanan HP</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Status Banner */}
          {isStandalone ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-extrabold text-xs">Aplikasi Terpasang!</h4>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Anda sudah menggunakan aplikasi ini dalam mode layar penuh (PWA Standalone).
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                    Keuntungan Install di HP:
                  </span>
                </div>
              </div>
              <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 pl-1">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Akses cepat 1-klik langsung dari ikon Layar Utama HP</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Tampilan full screen tanpa terganggu URL bar browser</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Performa kasir POS lebih cepat & responsif</span>
                </li>
              </ul>
            </div>
          )}

          {/* Primary Action Button */}
          {!isStandalone && (
            <div className="space-y-2">
              <button
                onClick={onTriggerInstall}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98]"
              >
                <Download className="w-5 h-5 animate-bounce" />
                <span>Klik di Sini Untuk Install Langsung</span>
              </button>
              {deferredPrompt && (
                <p className="text-[10px] text-center text-emerald-600 dark:text-emerald-400 font-bold">
                  ✓ Perangkat Anda mendukung prompt install otomatis 1-klik!
                </p>
              )}
            </div>
          )}

          {/* Manual Instructions Tab Switcher */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Panduan Install Manual HP:
              </h3>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                <button
                  onClick={() => setActiveTab('android')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'android'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Android
                </button>
                <button
                  onClick={() => setActiveTab('ios')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'ios'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  iPhone (iOS)
                </button>
              </div>
            </div>

            {/* Android Tab Content */}
            {activeTab === 'android' && (
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">Buka Browser Chrome / Edge di Android</p>
                    <p className="text-[11px] text-slate-500">Buka halaman web toko ini di browser Android Anda.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      Ketik Menu Titik Tiga <MoreVertical className="w-4 h-4 text-indigo-600 inline" />
                    </p>
                    <p className="text-[11px] text-slate-500">Pilih tombol menu di pojok kanan atas browser Chrome.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      Pilih "Install Aplikasi" / "Tambahkan ke Layar Utama"
                    </p>
                    <p className="text-[11px] text-slate-500">Ikon aplikasi akan otomatis dibuat di beranda HP Anda.</p>
                  </div>
                </div>
              </div>
            )}

            {/* iOS Safari Tab Content */}
            {activeTab === 'ios' && (
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">Buka Browser Safari di iPhone</p>
                    <p className="text-[11px] text-slate-500">Pastikan Anda membuka tautan web ini menggunakan browser Safari.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      Tekan Tombol Bagikan <Share className="w-4 h-4 text-indigo-600 inline" />
                    </p>
                    <p className="text-[11px] text-slate-500">Ikon kotak berpindah di bagian bawah layar Safari.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      Gulir Kebawah & Pilih "Tambah ke Layar Utama" (Add to Home Screen)
                    </p>
                    <p className="text-[11px] text-slate-500">Aplikasi akan terpasang rapi seperti aplikasi App Store.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>PWA Fast & Offline Safe</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
