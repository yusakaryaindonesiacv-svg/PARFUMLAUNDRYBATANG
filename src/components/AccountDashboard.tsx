import React, { useState } from 'react';
import { User as UserIcon, ShoppingBag, Award, MapPin, Phone, Mail, LogOut, LogIn, ChevronRight, Truck, CheckCircle2, Clock, Sparkles, AlertCircle, Edit3, Shield, Package, ArrowRight, RefreshCw } from 'lucide-react';
import { User, Order, Customer, StoreSettings } from '../types';

interface AccountDashboardProps {
  currentUser: User | null;
  orders: Order[];
  customers: Customer[];
  settings: StoreSettings;
  onOpenAuth: () => void;
  onLogout: () => void;
  setActiveTab: (tab: string) => void;
}

export const AccountDashboard: React.FC<AccountDashboardProps> = ({
  currentUser,
  orders,
  customers,
  settings,
  onOpenAuth,
  onLogout,
  setActiveTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'orders' | 'points'>('profile');

  // Find associated customer record for points & tier
  const customerRecord = currentUser
    ? customers.find(
        c =>
          (c.email && currentUser.email && c.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (c.phone && currentUser.phone && c.phone.replace(/[^0-9]/g, '') === currentUser.phone.replace(/[^0-9]/g, ''))
      )
    : null;

  // Filter user's order history
  const userOrders = currentUser
    ? orders.filter(o => {
        const uEmail = currentUser.email?.toLowerCase();
        const uPhone = currentUser.phone?.replace(/[^0-9]/g, '');
        const oPhone = o.customerPhone?.replace(/[^0-9]/g, '');
        return (
          (uPhone && oPhone && oPhone === uPhone) ||
          (uEmail && o.customerName?.toLowerCase().includes(currentUser.name.toLowerCase()))
        );
      })
    : orders.slice(0, 5); // Fallback to last orders if guest

  const totalPoints = customerRecord?.points || 0;
  const memberTier = customerRecord?.membershipTier || (currentUser?.role === 'reseller' ? 'VIP' : 'Bronze');
  const totalSpent = customerRecord?.totalSpent || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-20">
      
      {/* Top Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/30 flex items-center justify-center font-black text-3xl sm:text-4xl text-white shadow-inner">
              {currentUser ? currentUser.name.charAt(0).toUpperCase() : <UserIcon className="w-10 h-10" />}
            </div>
            {currentUser && (
              <span className="absolute bottom-1 right-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-indigo-700 shadow-sm">
                Online
              </span>
            )}
          </div>

          {/* Info Header */}
          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-extrabold uppercase tracking-wider text-indigo-100 border border-white/20">
                {currentUser ? `Role: ${currentUser.role}` : 'Tamu / Belum Login'}
              </span>
              {currentUser && (
                <span className="px-3 py-1 bg-amber-400 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Tier {memberTier}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {currentUser ? currentUser.name : 'Selamat Datang, Pelanggan'}
            </h1>

            <p className="text-xs text-indigo-100 flex items-center justify-center sm:justify-start gap-3">
              {currentUser?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {currentUser.phone}
                </span>
              )}
              {currentUser?.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {currentUser.email}
                </span>
              )}
              {!currentUser && (
                <span>Silakan login untuk menyimpan histori belanja & mengumpulkan poin.</span>
              )}
            </p>
          </div>

          {/* Action Header Button */}
          <div>
            {currentUser ? (
              <button
                onClick={onLogout}
                className="px-4 py-2.5 bg-rose-500/90 hover:bg-rose-600 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 border border-rose-400/30"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-black text-xs rounded-2xl shadow-xl transition-all flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk / Daftar</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-white/15 text-center">
          <div className="p-2 sm:p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
            <span className="block text-[10px] uppercase font-bold text-indigo-200">Total Poin</span>
            <span className="text-base sm:text-xl font-black text-amber-300">{totalPoints} Pts</span>
          </div>

          <div className="p-2 sm:p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
            <span className="block text-[10px] uppercase font-bold text-indigo-200">Total Pesanan</span>
            <span className="text-base sm:text-xl font-black text-white">{userOrders.length} Order</span>
          </div>

          <div className="p-2 sm:p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
            <span className="block text-[10px] uppercase font-bold text-indigo-200">Total Belanja</span>
            <span className="text-base sm:text-xl font-black text-emerald-300">
              Rp {totalSpent > 0 ? (totalSpent / 1000).toFixed(0) + 'k' : '0'}
            </span>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'profile'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Profil Akun</span>
        </button>

        <button
          onClick={() => setActiveSubTab('orders')}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'orders'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Pesanan Saya ({userOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('points')}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'points'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Poin & Reward</span>
        </button>
      </div>

      {/* TAB CONTENT 1: PROFIL AKUN */}
      {activeSubTab === 'profile' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-indigo-600" />
                <span>Detail Informasi Profil</span>
              </h3>
              <button
                onClick={onOpenAuth}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{currentUser ? 'Kelola Akun' : 'Login / Daftar'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Nama Lengkap</span>
                <p className="font-extrabold text-slate-800 dark:text-slate-100">
                  {currentUser?.name || 'Tamu / Pengunjung'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Nomor WhatsApp / HP</span>
                <p className="font-extrabold text-slate-800 dark:text-slate-100">
                  {currentUser?.phone || '-'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Email Terdaftar</span>
                <p className="font-extrabold text-slate-800 dark:text-slate-100">
                  {currentUser?.email || '-'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Peran / Role</span>
                <p className="font-extrabold text-indigo-600 dark:text-indigo-400 capitalize">
                  {currentUser?.role || 'Pelanggan'}
                </p>
              </div>

              <div className="sm:col-span-2 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-indigo-500" />
                  Alamat Pengiriman Utama
                </span>
                <p className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentUser?.address || 'Kabupaten Batang, Jawa Tengah'}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Akses Cepat */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Navigasi Akses Cepat</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <button
                onClick={() => setActiveTab('catalog')}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <span>Katalog Aroma & Produk</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setActiveTab('tracking')}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  <span>Lacak Status Pesanan</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href={`https://wa.me/${settings.phone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(settings.storeName)},%20saya%20ingin%20bertanya%20mengenai%20produk%20dan%20pesanan.`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between transition-colors text-emerald-800 dark:text-emerald-300 font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Hubungi CS WhatsApp Toko</span>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-500" />
              </a>

              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className="p-3.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between transition-colors text-indigo-900 dark:text-indigo-200 font-bold"
                >
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>Masuk Admin Panel</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-indigo-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: PESANAN SAYA */}
      {activeSubTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
              <span>Riwayat Transaksi & Pesanan</span>
            </h3>
            <button
              onClick={() => setActiveTab('tracking')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Lacak Nomor Resi</span>
            </button>
          </div>

          {userOrders.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">Belum Ada Riwayat Pesanan</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Pesanan Anda di Parfum Laundry Batang akan tersimpan otomatis di sini.
              </p>
              <button
                onClick={() => setActiveTab('catalog')}
                className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Mulai Belanja Katalog
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {userOrders.map((order) => {
                const statusBg =
                  order.orderStatus === 'DELIVERED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : order.orderStatus === 'CANCELLED'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';

                return (
                  <div
                    key={order.id}
                    className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                          {order.orderNumber}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{order.createdAt}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${statusBg}`}>
                          {order.orderStatus}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            order.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-1.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px] text-slate-700 dark:text-slate-300">
                          <span>
                            {item.quantity}x {item.productName} ({item.volumeName})
                          </span>
                          <span className="font-bold">
                            Rp {(item.unitPrice * item.quantity).toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center font-bold">
                      <span className="text-slate-500">Total Pembayaran:</span>
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                        Rp {order.totalAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: POIN & REWARD */}
      {activeSubTab === 'points' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 rounded-3xl p-6 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-amber-400 px-3 py-1 rounded-full">
                Sistem Poin Toko Batang
              </span>
              <Sparkles className="w-5 h-5 text-slate-900" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-950">Saldo Poin Hadiah Anda:</span>
              <h2 className="text-3xl font-black text-slate-900">{totalPoints} Point</h2>
            </div>

            <p className="text-xs text-amber-950/80 font-medium leading-relaxed">
              Dapatkan 1 poin setiap transaksi kelipatan Rp 10.000 di Parfum Laundry Batang. Poin dapat ditukarkan voucher diskon & merchandise eksklusif!
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Tingkat Kemitraan & Keuntungan Member</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-1">
                <span className="font-black text-amber-800 dark:text-amber-300 block text-xs">Member Bronze / Regular</span>
                <p className="text-[11px] text-amber-900/80 dark:text-amber-200">
                  Transakasi &lt; Rp 500.000. Poin standar & promo gratis ongkir lokal Batang.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-1">
                <span className="font-black text-indigo-800 dark:text-indigo-300 block text-xs">Member Silver / Gold</span>
                <p className="text-[11px] text-indigo-900/80 dark:text-indigo-200">
                  Transaksi &gt; Rp 500.000. Diskon kupon spesial & prioritas pengiriman.
                </p>
              </div>

              <div className="sm:col-span-2 p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-1">
                <span className="font-black text-purple-800 dark:text-purple-300 block text-xs">Reseller VIP Grosir</span>
                <p className="text-[11px] text-purple-900/80 dark:text-purple-200">
                  Harga khusus grosir jirigen & spray, gratis spanduk promosi, & fasilitasi pembayaran tempo / piutang.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
