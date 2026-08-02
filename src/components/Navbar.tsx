import React from 'react';
import { ShoppingBag, Sun, Moon, ShieldCheck, Sparkles, UserCheck, MapPin, Menu, Search, LogOut, Smartphone } from 'lucide-react';
import { StoreSettings, User } from '../types';

interface NavbarProps {
  settings: StoreSettings;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  cartCount: number;
  onOpenCart: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onOpenDistanceCalc: () => void;
  onOpenInstallPwa?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  darkMode,
  onToggleDarkMode,
  cartCount,
  onOpenCart,
  currentUser,
  onOpenAuth,
  onOpenAdmin,
  onOpenDistanceCalc,
  onOpenInstallPwa,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] py-1 px-4 text-center font-bold flex items-center justify-center gap-2 overflow-hidden">
        <Sparkles className="w-3.5 h-3.5 animate-pulse shrink-0" />
        <span className="truncate">
          Grosir & Eceran Parfum Laundry Batang • Free Delivery Batang Min. Belanja Rp {settings.freeDeliveryMinOrder.toLocaleString('id-ID')}
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Left Side: Brand Logo */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                {settings.appLogoUrl ? (
                  <img src={settings.appLogoUrl} alt={settings.storeName} className="w-full h-full object-cover" />
                ) : (
                  settings.storeName ? settings.storeName.charAt(0).toUpperCase() : 'P'
                )}
              </div>
              <div className="hidden sm:block">
                <h1 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white leading-none tracking-tight flex items-center gap-1.5">
                  {settings.storeName || 'PARFUM LAUNDRY BATANG'}
                </h1>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate max-w-[220px] mt-0.5">
                  {settings.tagline}
                </p>
              </div>
            </div>
          </div>

          {/* Center Search Bar */}
          <div className="flex-1 max-w-md mx-2">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="text"
                placeholder="Cari aroma atau varian laundry..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab !== 'catalog') setActiveTab('catalog');
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-full text-xs font-medium border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition-all outline-none"
              />
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            
            {/* Install PWA Button */}
            {onOpenInstallPwa && (
              <button
                onClick={onOpenInstallPwa}
                title="Install Aplikasi di HP"
                className="px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Smartphone className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="hidden sm:inline">Install App HP</span>
              </button>
            )}

            {/* Quick Distance Calc */}
            <button
              onClick={onOpenDistanceCalc}
              title="Cek Ongkir Jarak"
              className="p-2 sm:px-3 sm:py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 transition-colors"
            >
              <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden md:inline">Cek Ongkir</span>
            </button>

            {/* Dark Mode Switcher */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Ganti Mode Gelap/Terang"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors flex items-center gap-2 border border-indigo-100 dark:border-indigo-900"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Account Button (Login / Register / Profile) */}
            {currentUser ? (
              <button
                onClick={onOpenAuth}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all flex items-center gap-1.5 shadow-sm"
                title="Kelola Akun / Logout"
              >
                <UserCheck className="w-4 h-4" />
                <span className="hidden sm:inline truncate max-w-[90px]">{currentUser.name}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-indigo-600/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Masuk / Daftar</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
