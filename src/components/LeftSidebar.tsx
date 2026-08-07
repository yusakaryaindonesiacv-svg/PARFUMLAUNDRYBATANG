import React from 'react';
import { 
  Home, 
  ShoppingBag, 
  Calculator, 
  Truck, 
  ShieldCheck, 
  MapPin, 
  UserCheck, 
  LogOut, 
  LogIn, 
  ChevronLeft, 
  ChevronRight, 
  ShoppingBag as CartIcon,
  Smartphone,
  Download
} from 'lucide-react';
import { StoreSettings, User } from '../types';
import { getEffectivePermissions } from '../lib/storage';

interface LeftSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenDistanceCalc: () => void;
  onOpenInstallPwa?: () => void;
  cartCount: number;
  onOpenCart: () => void;
  settings: StoreSettings;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isOpen,
  onToggle,
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenDistanceCalc,
  onOpenInstallPwa,
  cartCount,
  onOpenCart,
  settings,
}) => {
  const permissions = getEffectivePermissions(currentUser);

  const allNavItems = [
    { id: 'home', label: 'Beranda Toko', icon: Home, badge: '', show: permissions.canAccessHome },
    { id: 'catalog', label: 'Katalog Produk', icon: ShoppingBag, badge: 'Lengkap', show: permissions.canAccessCatalog },
    { id: 'pos', label: 'Kasir POS Off/Online', icon: Calculator, badge: 'Kasir', show: permissions.canAccessPos },
    { id: 'tracking', label: 'Tracking Pesanan', icon: Truck, badge: 'Cek Resi', show: permissions.canAccessTracking },
    { id: 'admin', label: 'Panel Admin Store', icon: ShieldCheck, badge: 'Admin', show: true },
  ];

  const navItems = allNavItems.filter(item => item.show);

  return (
    <>
      {/* Mobile Backdrop Overlay when Left Sidebar is Open */}
      {isOpen && (
        <div 
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Main Left Navigation Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out flex flex-col justify-between shadow-2xl lg:shadow-none ${
          isOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        {/* Top Sidebar Header & Toggle */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
            <div 
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-3 cursor-pointer overflow-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md shrink-0 overflow-hidden">
                {settings.appLogoUrl ? (
                  <img src={settings.appLogoUrl} alt={settings.storeName} className="w-full h-full object-cover" />
                ) : (
                  settings.storeName ? settings.storeName.charAt(0).toUpperCase() : 'P'
                )}
              </div>
              {isOpen && (
                <div className="truncate">
                  <h2 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-white leading-tight truncate">
                    {settings.storeName || 'PARFUM LAUNDRY BATANG'}
                  </h2>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block tracking-wider truncate">
                    {settings.city ? `${settings.city.toUpperCase()} STORE` : 'ONLINE STORE'}
                  </span>
                </div>
              )}
            </div>

            {/* Toggle Button Inside Sidebar Header */}
            <button
              onClick={onToggle}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title={isOpen ? 'Sembunyikan Sidebar Navigation' : 'Tampilkan Navigasi Utama'}
            >
              {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation Links Menu List */}
          <nav className="p-3 space-y-1.5 mt-2">
            <div className={`px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ${!isOpen && 'hidden lg:block lg:text-center'}`}>
              {isOpen ? 'Navigasi Utama' : 'Menu'}
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    // On mobile, auto close drawer after selecting tab
                    if (window.innerWidth < 1024) onToggle();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-xs transition-all relative group ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white'
                  }`}
                  title={item.label}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-indigo-600'}`} />
                  
                  {isOpen ? (
                    <div className="flex-1 flex items-center justify-between text-left truncate">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          isActive 
                            ? 'bg-white/20 text-white' 
                            : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  ) : (
                    // Hover Tooltip when collapsed
                    <span className="hidden lg:group-hover:block absolute left-20 bg-slate-900 text-white text-xs px-2.5 py-1 rounded-lg whitespace-nowrap shadow-xl z-50">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Quick Tools Section */}
            <div className={`pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 space-y-1.5`}>
              <div className={`px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ${!isOpen && 'hidden lg:block lg:text-center'}`}>
                {isOpen ? 'Fitur Cepat' : 'Alat'}
              </div>

              {/* Distance Calculator Button */}
              <button
                onClick={() => {
                  onOpenDistanceCalc();
                  if (window.innerWidth < 1024) onToggle();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Cek Ongkir Jarak Batang"
              >
                <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                {isOpen && <span>Cek Ongkir Jarak</span>}
              </button>

              {/* Cart Drawer Opener */}
              <button
                onClick={() => {
                  onOpenCart();
                  if (window.innerWidth < 1024) onToggle();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
                title="Keranjang Belanja"
              >
                <div className="relative shrink-0">
                  <CartIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
                {isOpen && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>Keranjang</span>
                    {cartCount > 0 && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-bold">
                        {cartCount} Item
                      </span>
                    )}
                  </div>
                )}
              </button>

              {/* Install PWA Mobile App Button */}
              {onOpenInstallPwa && (
                <button
                  onClick={() => {
                    onOpenInstallPwa();
                    if (window.innerWidth < 1024) onToggle();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-extrabold text-xs text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/20 transition-all mt-1"
                  title="Install Aplikasi HP"
                >
                  <Smartphone className="w-5 h-5 text-amber-300 shrink-0" />
                  {isOpen && (
                    <div className="flex-1 flex items-center justify-between text-left">
                      <span>Install App HP</span>
                      <span className="px-1.5 py-0.5 bg-white/20 text-white rounded text-[9px]">PWA</span>
                    </div>
                  )}
                </button>
              )}
            </div>
          </nav>
        </div>

        {/* Bottom Section: Authentication / User Account Status & Logout */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {currentUser ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shrink-0">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                {isOpen && (
                  <div className="flex-1 truncate">
                    <p className="font-extrabold text-xs text-slate-800 dark:text-white truncate">
                      {currentUser.name}
                    </p>
                    <span className="inline-block px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-extrabold uppercase rounded-md mt-0.5">
                      {currentUser.role}
                    </span>
                  </div>
                )}
              </div>

              {/* Logout Button */}
              {isOpen ? (
                <button
                  onClick={() => {
                    onLogout();
                  }}
                  className="w-full mt-2 py-2.5 px-3 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-red-200 dark:border-red-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout / Keluar</span>
                </button>
              ) : (
                <button
                  onClick={onLogout}
                  className="w-full py-2.5 bg-red-100 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-200 transition-colors"
                  title="Logout / Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {isOpen ? (
                <div className="space-y-2">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-[11px] text-indigo-900 dark:text-indigo-200">
                    <p className="font-bold flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Belum Masuk Akun?</span>
                    </p>
                    <p className="text-[10px] opacity-80 mt-0.5">
                      Login untuk akses kasir POS, diskon reseller & riwayat belanja.
                    </p>
                  </div>
                  <button
                    onClick={onOpenAuth}
                    className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login / Daftar Baru</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-500 transition-colors"
                  title="Login / Daftar Akun"
                >
                  <LogIn className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
