import React from 'react';
import { Home, User as UserIcon, ShoppingBag, Receipt, ShieldCheck, Truck } from 'lucide-react';
import { User } from '../types';
import { getEffectivePermissions } from '../lib/storage';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  currentUser: User | null;
  onOpenAdmin: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  onOpenCart,
  currentUser,
  onOpenAdmin,
}) => {
  const permissions = getEffectivePermissions(currentUser);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-2 shadow-lg">
      <div className="flex items-center justify-around">
        
        {/* Beranda */}
        {permissions.canAccessHome && (
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
              activeTab === 'home'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'home' ? 'scale-110' : ''}`} />
            <span>Beranda</span>
          </button>
        )}

        {/* Dashboard Akun Saya */}
        <button
          onClick={() => setActiveTab('account')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            activeTab === 'account'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <UserIcon className={`w-5 h-5 ${activeTab === 'account' ? 'scale-110' : ''}`} />
          <span>Akun</span>
        </button>

        {/* Kasir POS (ONLY if allowed by role) */}
        {permissions.canAccessPos && (
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
              activeTab === 'pos'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <div className="p-1.5 rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-500/30 -mt-5 border-2 border-white dark:border-slate-900">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">Kasir POS</span>
          </button>
        )}

        {/* Keranjang */}
        <button
          onClick={onOpenCart}
          className="relative flex flex-col items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span>Keranjang</span>
        </button>

        {/* Cek Pesanan / Tracking */}
        {permissions.canAccessTracking && (
          <button
            onClick={() => setActiveTab('tracking')}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
              activeTab === 'tracking'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Truck className={`w-5 h-5 ${activeTab === 'tracking' ? 'scale-110' : ''}`} />
            <span>Lacak</span>
          </button>
        )}

        {/* Admin Panel (ONLY if allowed by role) */}
        {permissions.canAccessAdmin && (
          <button
            onClick={onOpenAdmin}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
              activeTab === 'admin'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <ShieldCheck className={`w-5 h-5 ${activeTab === 'admin' ? 'scale-110' : ''}`} />
            <span>Admin</span>
          </button>
        )}

      </div>
    </nav>
  );
};
