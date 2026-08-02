import React, { useState } from 'react';
import { X, User, ShieldCheck, Key, LogIn, UserPlus, LogOut, Sparkles, CheckCircle2, HelpCircle, Phone, Mail, Lock, MapPin } from 'lucide-react';
import { User as UserType } from '../types';
import { isPrimaryAdminEmail } from '../lib/storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  users: UserType[];
  onLogin: (user: UserType) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onLogin,
  onLogout,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'help'>('login');
  
  // Login Form States - Empty default email/phone as requested
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');

  const [regError, setRegError] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  // Helper validation for real Indonesian WhatsApp number
  const isValidIndonesianWhatsApp = (phone: string): boolean => {
    if (!phone) return false;
    const clean = phone.replace(/[^0-9]/g, '');
    if (!clean.startsWith('08') && !clean.startsWith('628')) {
      return false;
    }
    if (clean.length < 10 || clean.length > 14) {
      return false;
    }
    return true;
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!emailOrPhone.trim()) {
      setLoginError('Silakan masukkan email atau nomor WhatsApp terdaftar.');
      return;
    }

    const target = emailOrPhone.trim().toLowerCase();
    const cleanTargetPhone = target.replace(/[^0-9]/g, '');

    // Search in existing registered users list
    const existingUser = users.find(u => {
      const uEmail = u.email ? u.email.toLowerCase() : '';
      const uPhoneClean = u.phone ? u.phone.replace(/[^0-9]/g, '') : '';
      return (uEmail === target) || (cleanTargetPhone.length >= 10 && uPhoneClean === cleanTargetPhone);
    });

    if (!existingUser) {
      setLoginError('Akun belum terdaftar! Hanya user yang terdaftar yang bisa masuk ke aplikasi. Silakan mendaftar terlebih dahulu pada tab "Daftar Akun".');
      return;
    }

    if (existingUser.password && password && existingUser.password !== password) {
      setLoginError('Kata sandi yang Anda masukkan salah!');
      return;
    }

    if (existingUser.isActive === false) {
      setLoginError('Akun Anda sedang dinonaktifkan oleh Admin.');
      return;
    }

    let finalUser = { ...existingUser };
    if (isPrimaryAdminEmail(finalUser.email) && finalUser.role !== 'admin') {
      finalUser.role = 'admin';
    }

    onLogin(finalUser);
    onClose();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim()) {
      setRegError('Nama lengkap wajib diisi.');
      return;
    }

    if (!regPhone.trim() || !isValidIndonesianWhatsApp(regPhone)) {
      setRegError('Nomor WhatsApp harus berupa nomor HP/WA Indonesia yang aktif & real (contoh: 081234567890 atau 6281234567890, 10-14 digit)!');
      return;
    }

    if (!regPassword || regPassword.length < 4) {
      setRegError('Kata sandi minimal 4 karakter.');
      return;
    }

    const cleanRegPhone = regPhone.replace(/[^0-9]/g, '');
    const emailToUse = regEmail.trim() ? regEmail.trim().toLowerCase() : `${cleanRegPhone}@parfumlaundry.com`;

    // Check if phone or email already registered
    const alreadyExists = users.some(u => {
      const uEmail = u.email ? u.email.toLowerCase() : '';
      const uPhoneClean = u.phone ? u.phone.replace(/[^0-9]/g, '') : '';
      return (regEmail.trim() && uEmail === regEmail.trim().toLowerCase()) || (cleanRegPhone && uPhoneClean === cleanRegPhone);
    });

    if (alreadyExists) {
      setRegError('Nomor WhatsApp atau Email ini sudah terdaftar! Silakan langsung login.');
      return;
    }

    const isAdmin = isPrimaryAdminEmail(emailToUse) || emailToUse.includes('admin');

    const newUser: UserType = {
      id: `usr-${Date.now()}`,
      name: regName.trim(),
      email: emailToUse,
      phone: cleanRegPhone,
      password: regPassword,
      address: regAddress.trim() || 'Kab. Batang, Jawa Tengah',
      role: isAdmin ? 'admin' : 'pelanggan',
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setRegSuccessMsg(
      isAdmin
        ? `Pendaftaran berhasil & terintegrasi! Anda terdaftar sebagai ADMIN UTAMA.`
        : `Pendaftaran berhasil! Selamat datang, ${regName}. Akun Anda telah tersimpan dan terintegrasi.`
    );

    onLogin(newUser);

    setTimeout(() => {
      onClose();
      setRegSuccessMsg('');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header Modal */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-80">Sistem Akun & Autentikasi</span>
            <h2 className="text-lg font-black">Portal Akun Toko Batang</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile View if Logged In */}
        {currentUser ? (
          <div className="p-6 text-center space-y-5 text-xs">
            <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center font-black text-3xl border-4 border-indigo-500 shadow-md">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold rounded-full uppercase text-[10px] tracking-wider">
                ✓ Status: Terautentikasi ({currentUser.role})
              </span>
              <h3 className="font-black text-lg text-slate-900 dark:text-white mt-1">{currentUser.name}</h3>
              <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">{currentUser.email}</p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-1.5 text-[11px]">
              <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Hak Akses Fitur Aktif:</span>
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5 pl-1">
                {currentUser.role === 'admin' && (
                  <>
                    <li>Akses Penuh Management Stok & Harga</li>
                    <li>Laporan Keuangan Laba Rugi PDF / Excel</li>
                    <li>Sinkronisasi Supabase & Google Sheets</li>
                  </>
                )}
                {currentUser.role === 'kasir' && (
                  <>
                    <li>Akses Mesin Kasir POS & Cetak Nota Struk</li>
                    <li>Pencatatan Pelanggan CRM & Poin</li>
                  </>
                )}
                {currentUser.role === 'pelanggan' && (
                  <>
                    <li>Katalog Diskon Reseller Grosir</li>
                    <li>Tracking Pesanan Realtime via WA</li>
                  </>
                )}
              </ul>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar / Logout Akun</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Modal Navigation Tabs (Login / Daftar / Bantuan) */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  activeTab === 'login'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk / Login</span>
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  activeTab === 'register'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Daftar Akun</span>
              </button>
              <button
                onClick={() => setActiveTab('help')}
                className={`px-3 py-3 text-xs font-bold flex items-center justify-center gap-1 border-b-2 transition-all ${
                  activeTab === 'help'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Petunjuk Akses"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Petunjuk</span>
              </button>
            </div>

            {/* TAB 1: LOGIN FORM */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="p-6 space-y-4 text-xs">
                {loginError && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-semibold leading-relaxed animate-fade-in">
                    ⚠️ {loginError}
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email / No. WhatsApp Terdaftar:
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
                    <input
                      type="text"
                      required
                      placeholder="Masukkan email atau No HP terdaftar"
                      value={emailOrPhone}
                      onChange={(e) => {
                        setEmailOrPhone(e.target.value);
                        setLoginError('');
                      }}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kata Sandi / Passcode:
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                    <input
                      type="password"
                      placeholder="Masukkan kata sandi akun"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setLoginError('');
                      }}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Akun Sekarang</span>
                </button>
              </form>
            )}

            {/* TAB 2: REGISTER FORM */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="p-6 space-y-3.5 text-xs">
                {regError && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-semibold leading-relaxed animate-fade-in">
                    ⚠️ {regError}
                  </div>
                )}

                {regSuccessMsg ? (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center font-bold animate-fade-in">
                    ✓ {regSuccessMsg}
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nama Lengkap Anda:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Budi Santoso"
                        value={regName}
                        onChange={(e) => {
                          setRegName(e.target.value);
                          setRegError('');
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nomor WhatsApp Real / HP: <span className="text-rose-500 font-normal">(Aktif)</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Contoh: 081234567890 atau 6281234567890"
                        value={regPhone}
                        onChange={(e) => {
                          setRegPhone(e.target.value);
                          setRegError('');
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-medium"
                      />
                      <p className="text-[10px] text-slate-400 mt-0.5">Harus nomor WhatsApp aktif Indonesia (10 - 14 digit).</p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Email (Opsional):
                      </label>
                      <input
                        type="email"
                        placeholder="email@domain.com"
                        value={regEmail}
                        onChange={(e) => {
                          setRegEmail(e.target.value);
                          setRegError('');
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Buat Kata Sandi:
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Minimal 4 karakter"
                        value={regPassword}
                        onChange={(e) => {
                          setRegPassword(e.target.value);
                          setRegError('');
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all mt-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Daftar & Masuk Sekarang</span>
                    </button>
                  </>
                )}
              </form>
            )}

            {/* TAB 3: HELP & INSTRUCTIONS */}
            {activeTab === 'help' && (
              <div className="p-6 space-y-4 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  <h4 className="font-extrabold text-indigo-900 dark:text-indigo-200 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Panduan Akses & Autentikasi</span>
                  </h4>
                  <p className="text-[11px] leading-relaxed">
                    Sistem mendukung pendaftaran akun pelanggan, login staff kasir POS, dan akses admin toko.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl">
                    <span className="font-bold text-slate-900 dark:text-white block">1. Cara Login / Masuk:</span>
                    <p className="text-[11px] mt-0.5">Pilih tab "Masuk / Login", pilih role (Admin/Kasir/Pelanggan), lalu klik "Masuk Akun Sekarang".</p>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl">
                    <span className="font-bold text-slate-900 dark:text-white block">2. Cara Daftar Akun Baru:</span>
                    <p className="text-[11px] mt-0.5">Klik tab "Daftar Akun", isi Nama Lengkap, No WhatsApp & Sandi, lalu klik "Daftar & Masuk Sekarang".</p>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl">
                    <span className="font-bold text-slate-900 dark:text-white block">3. Cara Logout / Keluar:</span>
                    <p className="text-[11px] mt-0.5">Klik tombol profil Anda di Pojok Kiri Bawah / Atas Header, lalu klik tombol merah "Keluar / Logout Akun".</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
