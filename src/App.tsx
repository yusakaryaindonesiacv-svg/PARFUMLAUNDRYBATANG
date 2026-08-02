import React, { useState, useEffect } from 'react';
import { 
  getStorageData, 
  setStorageData, 
  initLocalStorage, 
  STORAGE_KEYS, 
  DEFAULT_PRODUCTS, 
  DEFAULT_CATEGORIES, 
  DEFAULT_COUPONS, 
  DEFAULT_CUSTOMERS, 
  DEFAULT_EXPENSES, 
  DEFAULT_ORDERS, 
  DEFAULT_BANNERS, 
  DEFAULT_SETTINGS,
  DEFAULT_USERS,
  getEffectivePermissions
} from './lib/storage';
import { Product, Category, CartItem, Coupon, Customer, Expense, Order, CarouselBanner, StoreSettings, User } from './types';
import { 
  fetchUsersFromSupabase, 
  fetchCategoriesFromSupabase, 
  fetchProductsFromSupabase, 
  fetchCustomersFromSupabase,
  fetchCouponsFromSupabase,
  fetchBannersFromSupabase,
  fetchExpensesFromSupabase,
  fetchOrdersFromSupabase,
  upsertUserToSupabase, 
  upsertCustomerToSupabase 
} from './lib/supabase';

// Components
import { Navbar } from './components/Navbar';
import { LeftSidebar } from './components/LeftSidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { BannerCarousel } from './components/BannerCarousel';
import { ProductCatalog } from './components/ProductCatalog';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { PosKasir } from './components/PosKasir';
import { OrderTracking } from './components/OrderTracking';
import { DistanceCalculatorModal } from './components/DistanceCalculatorModal';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { DeploymentGuideModal } from './components/DeploymentGuideModal';

export default function App() {
  // Initialize LocalStorage with default seeds on first load & fetch Supabase remote data if available
  useEffect(() => {
    initLocalStorage();

    // 1. Fetch Categories from Supabase
    fetchCategoriesFromSupabase().then(remoteCategories => {
      if (remoteCategories !== null) {
        setCategories(remoteCategories);
        setStorageData(STORAGE_KEYS.CATEGORIES, remoteCategories);
      }
    }).catch(err => console.warn('Supabase categories fetch error:', err));

    // 2. Fetch Products from Supabase
    fetchProductsFromSupabase().then(remoteProducts => {
      if (remoteProducts !== null) {
        setProducts(remoteProducts);
        setStorageData(STORAGE_KEYS.PRODUCTS, remoteProducts);
      }
    }).catch(err => console.warn('Supabase products fetch error:', err));

    // 3. Fetch Customers from Supabase
    fetchCustomersFromSupabase().then(remoteCustomers => {
      if (remoteCustomers !== null) {
        setCustomers(remoteCustomers);
        setStorageData(STORAGE_KEYS.CUSTOMERS, remoteCustomers);
      }
    }).catch(err => console.warn('Supabase customers fetch skipped:', err));

    // 4. Fetch Coupons from Supabase
    fetchCouponsFromSupabase().then(remoteCoupons => {
      if (remoteCoupons !== null) {
        setCoupons(remoteCoupons);
        setStorageData(STORAGE_KEYS.COUPONS, remoteCoupons);
      }
    }).catch(err => console.warn('Supabase coupons fetch skipped:', err));

    // 5. Fetch Banners from Supabase
    fetchBannersFromSupabase().then(remoteBanners => {
      if (remoteBanners !== null) {
        setBanners(remoteBanners);
        setStorageData(STORAGE_KEYS.BANNERS, remoteBanners);
      }
    }).catch(err => console.warn('Supabase banners fetch skipped:', err));

    // 6. Fetch Expenses from Supabase
    fetchExpensesFromSupabase().then(remoteExpenses => {
      if (remoteExpenses !== null) {
        setExpenses(remoteExpenses);
        setStorageData(STORAGE_KEYS.EXPENSES, remoteExpenses);
      }
    }).catch(err => console.warn('Supabase expenses fetch skipped:', err));

    // 7. Fetch Orders from Supabase
    fetchOrdersFromSupabase().then(remoteOrders => {
      if (remoteOrders !== null) {
        setOrders(remoteOrders);
        setStorageData(STORAGE_KEYS.ORDERS, remoteOrders);
      }
    }).catch(err => console.warn('Supabase orders fetch skipped:', err));

    // 8. Fetch registered users from Supabase
    fetchUsersFromSupabase().then(remoteUsers => {
      if (remoteUsers && remoteUsers.length > 0) {
        setUsers(prev => {
          const mergedMap = new Map<string, User>();
          prev.forEach(u => mergedMap.set(u.id, u));
          remoteUsers.forEach(ru => mergedMap.set(ru.id, ru));
          const next = Array.from(mergedMap.values());
          setStorageData(STORAGE_KEYS.USERS, next);
          return next;
        });
      }
    }).catch(err => console.warn('Supabase users fetch skipped:', err));
  }, []);

  // Application Global State
  const [settings, setSettings] = useState<StoreSettings>(() => getStorageData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS));
  const [darkMode, setDarkMode] = useState<boolean>(() => getStorageData(STORAGE_KEYS.DARK_MODE, false));
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStorageData(STORAGE_KEYS.CURRENT_USER, null));

  // Store Data States with support for cleared store state
  const isCleared = !!localStorage.getItem('plb_cleared_dummy_v1');
  const [products, setProducts] = useState<Product[]>(() => getStorageData(STORAGE_KEYS.PRODUCTS, isCleared ? [] : DEFAULT_PRODUCTS));
  const [categories, setCategories] = useState<Category[]>(() => getStorageData(STORAGE_KEYS.CATEGORIES, isCleared ? [] : DEFAULT_CATEGORIES));
  const [coupons, setCoupons] = useState<Coupon[]>(() => getStorageData(STORAGE_KEYS.COUPONS, isCleared ? [] : DEFAULT_COUPONS));
  const [customers, setCustomers] = useState<Customer[]>(() => getStorageData(STORAGE_KEYS.CUSTOMERS, isCleared ? [] : DEFAULT_CUSTOMERS));
  const [expenses, setExpenses] = useState<Expense[]>(() => getStorageData(STORAGE_KEYS.EXPENSES, isCleared ? [] : DEFAULT_EXPENSES));
  const [orders, setOrders] = useState<Order[]>(() => getStorageData(STORAGE_KEYS.ORDERS, isCleared ? [] : DEFAULT_ORDERS));
  const [banners, setBanners] = useState<CarouselBanner[]>(() => getStorageData(STORAGE_KEYS.BANNERS, isCleared ? [] : DEFAULT_BANNERS));
  const [users, setUsers] = useState<User[]>(() => getStorageData<User[]>(STORAGE_KEYS.USERS, DEFAULT_USERS));

  // UI Navigation & Cart States
  const [activeTab, setActiveTab] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(true);

  // Modals & Drawers States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isDistanceCalcOpen, setIsDistanceCalcOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isDeploymentGuideOpen, setIsDeploymentGuideOpen] = useState<boolean>(false);

  // PWA Deferred Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaBanner, setShowPwaBanner] = useState<boolean>(true);

  // Calculate effective permissions for active user
  const userPermissions = getEffectivePermissions(currentUser);

  // Auto fallback to home tab if activeTab is not permitted for current user
  useEffect(() => {
    if (activeTab === 'pos' && !userPermissions.canAccessPos) {
      setActiveTab('home');
    }
    if (activeTab === 'admin' && !userPermissions.canAccessAdmin) {
      setActiveTab('home');
    }
    if (activeTab === 'catalog' && !userPermissions.canAccessCatalog) {
      setActiveTab('home');
    }
    if (activeTab === 'tracking' && !userPermissions.canAccessTracking) {
      setActiveTab('home');
    }
  }, [activeTab, userPermissions]);

  // Sync state changes to localStorage
  useEffect(() => {
    setStorageData(STORAGE_KEYS.PRODUCTS, products);
  }, [products]);

  useEffect(() => {
    setStorageData(STORAGE_KEYS.CATEGORIES, categories);
  }, [categories]);

  useEffect(() => {
    setStorageData(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  useEffect(() => {
    setStorageData(STORAGE_KEYS.ORDERS, orders);
  }, [orders]);

  useEffect(() => {
    setStorageData(STORAGE_KEYS.CUSTOMERS, customers);
  }, [customers]);

  useEffect(() => {
    setStorageData(STORAGE_KEYS.EXPENSES, expenses);
  }, [expenses]);

  useEffect(() => {
    setStorageData(STORAGE_KEYS.COUPONS, coupons);
  }, [coupons]);

  useEffect(() => {
    setStorageData(STORAGE_KEYS.BANNERS, banners);
  }, [banners]);

  useEffect(() => {
    setStorageData(STORAGE_KEYS.CURRENT_USER, currentUser);
  }, [currentUser]);

  useEffect(() => {
    setStorageData(STORAGE_KEYS.USERS, users);
  }, [users]);

  // Login / Register handler ensuring user accounts are persisted permanently in local & Supabase
  const handleLoginUser = (user: User) => {
    setCurrentUser(user);
    setUsers(prevUsers => {
      const existingIndex = prevUsers.findIndex(
        u => u.id === user.id || 
             (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()) || 
             (u.phone && user.phone && u.phone === user.phone)
      );
      if (existingIndex >= 0) {
        const updated = [...prevUsers];
        updated[existingIndex] = { ...updated[existingIndex], ...user };
        return updated;
      } else {
        return [user, ...prevUsers];
      }
    });

    // Integrated to Supabase table
    upsertUserToSupabase(user).catch(err => console.warn('Sync user to Supabase:', err));

    // Sync CRM Customer Database if Pelanggan/Reseller
    if (user.role === 'pelanggan' || user.role === 'reseller') {
      setCustomers(prevCustomers => {
        const exists = prevCustomers.some(
          c => (c.email && user.email && c.email.toLowerCase() === user.email.toLowerCase()) ||
               (c.phone && user.phone && c.phone === user.phone)
        );
        if (!exists) {
          const newCustomer: Customer = {
            id: `cust-${Date.now()}`,
            name: user.name,
            phone: user.phone || '085712345678',
            email: user.email,
            address: user.address || 'Kec. Batang, Kab. Batang',
            membershipTier: user.role === 'reseller' ? 'Gold' : 'Bronze',
            points: 10,
            totalSpent: 0,
            debtBalance: 0,
            notes: 'Akun terdaftar via portal online',
            createdAt: new Date().toISOString().split('T')[0]
          };
          upsertCustomerToSupabase(newCustomer).catch(err => console.warn('Sync customer to Supabase:', err));
          return [newCustomer, ...prevCustomers];
        }
        return prevCustomers;
      });
    }
  };

  // Dark Mode Class Handling
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setStorageData(STORAGE_KEYS.DARK_MODE, darkMode);
  }, [darkMode]);

  // Dynamic favicon, title, and PWA Web Manifest generator for Mobile Install Icon
  useEffect(() => {
    if (settings.storeName) {
      document.title = settings.storeName;
    }

    // Favicon link
    let faviconLink = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }
    if (settings.appLogoUrl) {
      faviconLink.href = settings.appLogoUrl;
    }

    // Apple Touch Icon link (for iOS Safari Home Screen)
    let appleTouchIconLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (!appleTouchIconLink) {
      appleTouchIconLink = document.createElement('link');
      appleTouchIconLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleTouchIconLink);
    }
    if (settings.appLogoUrl) {
      appleTouchIconLink.href = settings.appLogoUrl;
    }

    // Web App Manifest link (for Android / PWA Home Screen Install Icon)
    const iconSrc = settings.appLogoUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%234f46e5"/><text x="50" y="65" font-size="50" font-weight="bold" text-anchor="middle" fill="white">P</text></svg>';
    
    const manifestData = {
      name: settings.storeName || 'Parfum Laundry Batang',
      short_name: settings.storeName ? (settings.storeName.length > 12 ? settings.storeName.substring(0, 12) : settings.storeName) : 'Parfum Laundry',
      description: settings.tagline || 'Aplikasi Kasir & Pemesanan Parfum Laundry',
      start_url: '/',
      display: 'standalone',
      background_color: '#0f172a',
      theme_color: '#4f46e5',
      icons: [
        {
          src: iconSrc,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: iconSrc,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    };

    const blob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' });
    const manifestObjectUrl = URL.createObjectURL(blob);

    let manifestLink = document.querySelector<HTMLLinkElement>("link[rel='manifest']");
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestObjectUrl;

    return () => {
      URL.revokeObjectURL(manifestObjectUrl);
    };
  }, [settings.appLogoUrl, settings.storeName, settings.tagline]);

  // Listen for PWA beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPWA = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted PWA installation');
        }
        setDeferredPrompt(null);
      });
    } else {
      alert('Aplikasi siap di-install! Di browser seluler, ketik "Tambahkan ke Layar Utama" (Add to Home Screen).');
    }
  };

  // Cart Operations
  const handleAddToCart = (newItem: CartItem) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.productId === newItem.productId && item.volumeId === newItem.volumeId
      );
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += newItem.quantity;
        return updated;
      }
      return [...prevCart, newItem];
    });
  };

  const handleUpdateCartQuantity = (productId: string, volumeId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.productId === productId && item.volumeId === volumeId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (productId: string, volumeId: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => !(item.productId === productId && item.volumeId === volumeId))
    );
  };

  const handleApplyCoupon = (code: string) => {
    const found = coupons.find((c) => c.code === code && c.isActive);
    if (!found) {
      return { success: false, message: 'Kode kupon diskon tidak valid atau kadaluarsa.' };
    }
    setAppliedCoupon(found);
    return { success: true, message: `Kupon ${found.code} berhasil digunakan!` };
  };

  // New Order Placed Handler (Online / Checkout)
  const handleOrderPlaced = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);

    // Automatically deduct stock and increment salesCount for purchased items
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const purchasedQty = newOrder.items
          .filter((item) => item.productId === p.id)
          .reduce((sum, item) => sum + item.quantity, 0);

        const updatedVolumes = p.volumes.map((v) => {
          const cartMatch = newOrder.items.find(
            (item) => item.productId === p.id && item.volumeId === v.id
          );
          if (cartMatch) {
            return { ...v, stock: Math.max(0, v.stock - cartMatch.quantity) };
          }
          return v;
        });
        return {
          ...p,
          salesCount: (p.salesCount || 0) + purchasedQty,
          volumes: updatedVolumes,
        };
      })
    );

    // Empty cart & reset coupon
    setCart([]);
    setAppliedCoupon(null);
  };

  // POS Sale Handler (Kasir)
  const handleCompletePosSale = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);

    // Deduct stock & increment salesCount for POS
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const purchasedQty = newOrder.items
          .filter((item) => item.productId === p.id)
          .reduce((sum, item) => sum + item.quantity, 0);

        const updatedVolumes = p.volumes.map((v) => {
          const cartMatch = newOrder.items.find(
            (item) => item.productId === p.id && item.volumeId === v.id
          );
          if (cartMatch) {
            return { ...v, stock: Math.max(0, v.stock - cartMatch.quantity) };
          }
          return v;
        });
        return {
          ...p,
          salesCount: (p.salesCount || 0) + purchasedQty,
          volumes: updatedVolumes,
        };
      })
    );
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-28 sm:pb-12 transition-colors">
      
      {/* Left Navigation Sidebar */}
      <LeftSidebar
        isOpen={isLeftSidebarOpen}
        onToggle={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => setCurrentUser(null)}
        onOpenDistanceCalc={() => setIsDistanceCalcOpen(true)}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        settings={settings}
      />

      {/* Main Content Layout Container (Shifted by Left Sidebar width on desktop) */}
      <div className={`transition-all duration-300 ease-in-out ${isLeftSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'}`}>
        
        {/* PWA Install Banner */}
        {showPwaBanner && (
          <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-4 py-2 text-xs flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold">📱 Mode Progressive Web App (PWA) Ready!</span>
              <span className="hidden md:inline text-purple-200">
                Install aplikasi ini di HP Anda untuk akses kasir POS offline cepat.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallPWA}
                className="px-3 py-1 bg-white text-indigo-700 rounded-lg font-bold text-[11px] shadow-sm hover:bg-slate-100"
              >
                Install App
              </button>
              <button
                onClick={() => setShowPwaBanner(false)}
                className="p-1 hover:bg-white/20 rounded-md text-white font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Main Header Navbar */}
        <Navbar
          settings={settings}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          cartCount={cartCount}
          onOpenCart={() => setIsCartOpen(true)}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenAdmin={() => setActiveTab('admin')}
          onOpenDistanceCalc={() => setIsDistanceCalcOpen(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onToggleSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          isSidebarOpen={isLeftSidebarOpen}
        />

        {/* MAIN VIEW CONTENT RENDERER BASED ON ACTIVE TAB */}
        <main>
          {activeTab === 'home' && (
            <>
              <BannerCarousel
                banners={banners}
                onCtaClick={(link) => {
                  if (link === '#catalog') setActiveTab('catalog');
                  if (link === '#distance') setIsDistanceCalcOpen(true);
                  if (link === '#crm') setActiveTab('admin');
                }}
              />
              <ProductCatalog
                products={products}
                categories={categories}
                orders={orders}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSelectProduct={(product) => setSelectedProduct(product)}
              />
            </>
          )}

          {activeTab === 'catalog' && (
            <ProductCatalog
              products={products}
              categories={categories}
              orders={orders}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSelectProduct={(product) => setSelectedProduct(product)}
            />
          )}

          {activeTab === 'pos' && userPermissions.canAccessPos && (
            <PosKasir
              products={products}
              customers={customers}
              settings={settings}
              onCompleteSale={handleCompletePosSale}
            />
          )}

          {activeTab === 'tracking' && userPermissions.canAccessTracking && (
            <OrderTracking orders={orders} />
          )}

          {activeTab === 'admin' && userPermissions.canAccessAdmin && (
            <AdminPanel
              products={products}
              setProducts={setProducts}
              categories={categories}
              setCategories={setCategories}
              orders={orders}
              setOrders={setOrders}
              customers={customers}
              setCustomers={setCustomers}
              expenses={expenses}
              setExpenses={setExpenses}
              coupons={coupons}
              setCoupons={setCoupons}
              banners={banners}
              setBanners={setBanners}
              settings={settings}
              setSettings={setSettings}
              users={users}
              setUsers={setUsers}
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              onOpenDeploymentGuide={() => setIsDeploymentGuideOpen(true)}
            />
          )}
        </main>

        {/* Global Footer */}
        <footer className="mt-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
          <p className="font-bold text-slate-800 dark:text-slate-200">
            {settings.storeName} — {settings.city}
          </p>
          <p className="mt-1 max-w-xl mx-auto text-[11px] leading-relaxed">
            {settings.address} • WhatsApp Order: {settings.phone}
          </p>
          <p className="mt-3 text-[10px] text-slate-400">
            © {new Date().getFullYear()} Parfum Laundry Batang. Integrated POS, CRM, Distance Shipping & Pakasir.
          </p>
        </footer>

      </div>

      {/* Sleek Mobile Bottom Navigation Bar (< sm:) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        currentUser={currentUser}
        onOpenAdmin={() => setActiveTab('admin')}
      />

      {/* MODALS & DRAWERS */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        coupons={coupons}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={() => setAppliedCoupon(null)}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        appliedCoupon={appliedCoupon}
        settings={settings}
        onOrderPlaced={handleOrderPlaced}
      />

      <DistanceCalculatorModal
        isOpen={isDistanceCalcOpen}
        onClose={() => setIsDistanceCalcOpen(false)}
        settings={settings}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        users={users}
        onLogin={handleLoginUser}
        onLogout={() => setCurrentUser(null)}
      />

      <DeploymentGuideModal
        isOpen={isDeploymentGuideOpen}
        onClose={() => setIsDeploymentGuideOpen(false)}
      />

    </div>
  );
}
