import { Product, Category, Coupon, Customer, Expense, Order, CarouselBanner, StoreSettings, User, UserRole, FeaturePermissions } from '../types';
import { PERMANENT_CONFIG } from './config';

export { PERMANENT_CONFIG };

const STORAGE_KEYS = {
  PRODUCTS: 'plb_products_v1',
  CATEGORIES: 'plb_categories_v1',
  COUPONS: 'plb_coupons_v1',
  CUSTOMERS: 'plb_customers_v1',
  EXPENSES: 'plb_expenses_v1',
  ORDERS: 'plb_orders_v1',
  BANNERS: 'plb_banners_v1',
  SETTINGS: 'plb_settings_v1',
  CURRENT_USER: 'plb_user_v1',
  USERS: 'plb_users_list_v1',
  DARK_MODE: 'plb_darkmode_v1',
};

// Helper to get default permissions by role
export function getDefaultPermissionsForRole(role: UserRole): FeaturePermissions {
  switch (role) {
    case 'admin':
      return {
        canAccessHome: true,
        canAccessCatalog: true,
        canAccessPos: true,
        canAccessTracking: true,
        canAccessAdmin: true,
        canManageProducts: true,
        canManageCategories: true,
        canManagePricesAndCogs: true,
        canViewFinancialReports: true,
        canManageCoupons: true,
        canManageCustomersCRM: true,
        canManageUsersAndRoles: true,
        canSyncSupabaseAndSheets: true,
      };
    case 'kasir':
      return {
        canAccessHome: true,
        canAccessCatalog: true,
        canAccessPos: true,
        canAccessTracking: true,
        canAccessAdmin: false,
        canManageProducts: false,
        canManageCategories: false,
        canManagePricesAndCogs: false,
        canViewFinancialReports: false,
        canManageCoupons: false,
        canManageCustomersCRM: true,
        canManageUsersAndRoles: false,
        canSyncSupabaseAndSheets: false,
      };
    case 'reseller':
      return {
        canAccessHome: true,
        canAccessCatalog: true,
        canAccessPos: false,
        canAccessTracking: true,
        canAccessAdmin: false,
        canManageProducts: false,
        canManageCategories: false,
        canManagePricesAndCogs: false,
        canViewFinancialReports: false,
        canManageCoupons: false,
        canManageCustomersCRM: false,
        canManageUsersAndRoles: false,
        canSyncSupabaseAndSheets: false,
      };
    case 'kurir':
      return {
        canAccessHome: true,
        canAccessCatalog: true,
        canAccessPos: false,
        canAccessTracking: true,
        canAccessAdmin: false,
        canManageProducts: false,
        canManageCategories: false,
        canManagePricesAndCogs: false,
        canViewFinancialReports: false,
        canManageCoupons: false,
        canManageCustomersCRM: false,
        canManageUsersAndRoles: false,
        canSyncSupabaseAndSheets: false,
      };
    case 'pelanggan':
    default:
      return {
        canAccessHome: true,
        canAccessCatalog: true,
        canAccessPos: false,
        canAccessTracking: true,
        canAccessAdmin: false,
        canManageProducts: false,
        canManageCategories: false,
        canManagePricesAndCogs: false,
        canViewFinancialReports: false,
        canManageCoupons: false,
        canManageCustomersCRM: false,
        canManageUsersAndRoles: false,
        canSyncSupabaseAndSheets: false,
      };
  }
}

export function getEffectivePermissions(user: User | null | undefined): FeaturePermissions {
  if (!user) {
    return getDefaultPermissionsForRole('pelanggan');
  }
  const base = getDefaultPermissionsForRole(user.role || 'pelanggan');
  if (!user.customPermissions) return base;
  return { ...base, ...user.customPermissions };
}

export function isPrimaryAdminEmail(email?: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === 'yusakaryaindonesia.cv@gmail.com') return true;
  if (normalized === 'admin@parfumlaundrybatang.com') return true;
  if (normalized.startsWith('admin@')) return true;
  return false;
}

// Default Registered System Accounts
export const DEFAULT_USERS: User[] = [
  {
    id: 'usr-admin-owner',
    name: 'Yusa Karya Indonesia (Admin Utama)',
    email: 'yusakaryaindonesia.cv@gmail.com',
    role: 'admin',
    phone: '085742889900',
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'usr-admin-1',
    name: 'Admin Utama Batang',
    email: 'admin@parfumlaundrybatang.com',
    role: 'admin',
    phone: '085742889900',
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'usr-kasir-1',
    name: 'Mbak Dewi (Kasir Kalisalak)',
    email: 'kasir1@parfumlaundrybatang.com',
    role: 'kasir',
    phone: '085712341122',
    isActive: true,
    createdAt: '2026-02-10',
  },
  {
    id: 'usr-pelanggan-1',
    name: 'Ibu Hj. Siti Nurjanah',
    email: 'siti.nurjanah@gmail.com',
    role: 'pelanggan',
    phone: '085712345678',
    isActive: true,
    createdAt: '2026-03-15',
  },
  {
    id: 'usr-reseller-1',
    name: 'Laundry Bersih Jaya (Bpk. Agus)',
    email: 'bersihjaya.laundry@gmail.com',
    role: 'reseller',
    phone: '081234567891',
    isActive: true,
    createdAt: '2026-04-01',
  },
  {
    id: 'usr-kurir-1',
    name: 'Mas Joko Express Batang',
    email: 'joko.kurir@parfumlaundrybatang.com',
    role: 'kurir',
    phone: '082198765432',
    isActive: true,
    createdAt: '2026-05-20',
  }
];

// Default Initial Store Settings
export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'PARFUM LAUNDRY BATANG',
  tagline: 'Pusat Grosir & Eceran Fragrance Laundry Kualitas Super Tahan Lama',
  topAnnouncementText: 'Grosir & Eceran Parfum Laundry Batang • Free Delivery Batang Min. Belanja Rp 250.000 • Melayani Grosir & Eceran Fragrance Laundry Super Tahan Lama • Order Cepat Lewat Aplikasi HP',
  appLogoUrl: '',
  phone: '085742889900',
  address: 'Bleder, Tegalsari, Kandeman, Batang, Central Java, 51261, Indonesia',
  city: 'Batang',
  latitude: -6.915,
  longitude: 109.7532,
  baseRatePerKm: 2000,
  minDeliveryFee: 5000,
  freeDeliveryMinOrder: 250000,
  pakasirProjectKey: '',
  pakasirApiKey: '',
  pakasirApiUrl: 'https://app.pakasir.com/api',
  googleSheetsWebappUrl: '',
  supabaseUrl: '',
  supabaseAnonKey: '',
  enabledNationalCouriers: ['JNT', 'JNE', 'POS', 'SICEPAT', 'ANTERAJA', 'WAHANA', 'NINJA', 'LION'],
};

// Default Initial Categories
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Parfum Premium Waterbased', description: 'Ramah lingkungan, aman untuk kain sensitif' },
  { id: 'cat-2', name: 'Parfum Extra Strong Alcoholbased', description: 'Penyebaran wangi lebih kuat, cepat kering & anti apek' },
  { id: 'cat-3', name: 'Deterjen & Softener', description: 'Formula pembersih noda & pelembut ekstra' },
  { id: 'cat-4', name: 'Pelicin Setrika', description: 'Memudahkan penyetrikaan pakaian licin rapi' },
];

// Default Initial Products with Volume Variants & Wholesale Prices
export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    code: 'PLB-AKS',
    name: 'Parfum Laundry Akasia Premium',
    category: 'Parfum Premium Waterbased',
    scentFamily: 'Floral',
    description: 'Aroma paling populer di Batang & Pekalongan. Kombinasi wangi kayu manis, kayu cendana, dan kelopak bunga segar yang mewah.',
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    isPopular: true,
    originalPrice: 20000,
    salesCount: 480,
    createdAt: new Date().toISOString(),
    volumes: [
      { id: 'vol-1a', name: '250ml Botol Spray', volumeMl: 250, price: 15000, originalPrice: 20000, wholesalePrice: 12000, wholesaleMinQty: 5, cogs: 7000, stock: 45 },
      { id: 'vol-1b', name: '1 Liter Botol Refill', volumeMl: 1000, price: 42000, originalPrice: 52000, wholesalePrice: 35000, wholesaleMinQty: 3, cogs: 22000, stock: 30 },
      { id: 'vol-1c', name: '5 Liter Jirigen', volumeMl: 5000, price: 185000, originalPrice: 225000, wholesalePrice: 165000, wholesaleMinQty: 2, cogs: 98000, stock: 12 },
    ],
  },
  {
    id: 'prod-2',
    code: 'PLB-DNB',
    name: 'Parfum Laundry Downy Black Passion',
    category: 'Parfum Extra Strong Alcoholbased',
    scentFamily: 'Fresh',
    description: 'Aroma khas parfum mewah berkarakter segar, agak woody dan buah-buahan manis yang memikat.',
    imageUrl: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    isPopular: true,
    salesCount: 320,
    createdAt: new Date().toISOString(),
    volumes: [
      { id: 'vol-2a', name: '250ml Botol Spray', volumeMl: 250, price: 16000, wholesalePrice: 13000, wholesaleMinQty: 5, cogs: 7500, stock: 35 },
      { id: 'vol-2b', name: '1 Liter Botol Refill', volumeMl: 1000, price: 45000, wholesalePrice: 38000, wholesaleMinQty: 3, cogs: 24000, stock: 25 },
      { id: 'vol-2c', name: '5 Liter Jirigen', volumeMl: 5000, price: 195000, wholesalePrice: 175000, wholesaleMinQty: 2, cogs: 105000, stock: 8 },
    ],
  },
  {
    id: 'prod-3',
    code: 'PLB-PLX',
    name: 'Parfum Laundry Philux Elegant',
    category: 'Parfum Premium Waterbased',
    scentFamily: 'Woody',
    description: 'Aroma berkelas seperti sprei hotel bintang 5. Menghilangkan bau apek pakaian musim hujan.',
    imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    isPopular: true,
    salesCount: 290,
    createdAt: new Date().toISOString(),
    volumes: [
      { id: 'vol-3a', name: '250ml Botol Spray', volumeMl: 250, price: 15000, wholesalePrice: 12000, wholesaleMinQty: 5, cogs: 7000, stock: 50 },
      { id: 'vol-3b', name: '1 Liter Botol Refill', volumeMl: 1000, price: 42000, wholesalePrice: 35000, wholesaleMinQty: 3, cogs: 22000, stock: 20 },
      { id: 'vol-3c', name: '5 Liter Jirigen', volumeMl: 5000, price: 185000, wholesalePrice: 165000, wholesaleMinQty: 2, cogs: 98000, stock: 15 },
    ],
  },
  {
    id: 'prod-4',
    code: 'PLB-SNY',
    name: 'Parfum Laundry Snappy Fresh Citrus',
    category: 'Parfum Extra Strong Alcoholbased',
    scentFamily: 'Fruity',
    description: 'Kombinasi wangi sitrus dan bunga sakura yang tahan hingga 30 hari dalam lemari.',
    imageUrl: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    isPopular: false,
    salesCount: 165,
    createdAt: new Date().toISOString(),
    volumes: [
      { id: 'vol-4a', name: '250ml Botol Spray', volumeMl: 250, price: 15000, wholesalePrice: 12000, wholesaleMinQty: 5, cogs: 6800, stock: 40 },
      { id: 'vol-4b', name: '1 Liter Botol Refill', volumeMl: 1000, price: 40000, wholesalePrice: 34000, wholesaleMinQty: 3, cogs: 21000, stock: 18 },
      { id: 'vol-4c', name: '5 Liter Jirigen', volumeMl: 5000, price: 180000, wholesalePrice: 160000, wholesaleMinQty: 2, cogs: 95000, stock: 10 },
    ],
  },
  {
    id: 'prod-5',
    code: 'PLB-SKR',
    name: 'Parfum Laundry Sakura Blossom Soft',
    category: 'Parfum Premium Waterbased',
    scentFamily: 'Sweet',
    description: 'Aroma bunga sakura yang lembut, cocok untuk pakaian bayi dan hijab halus.',
    imageUrl: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    isPopular: false,
    salesCount: 210,
    createdAt: new Date().toISOString(),
    volumes: [
      { id: 'vol-5a', name: '250ml Botol Spray', volumeMl: 250, price: 15000, wholesalePrice: 12000, wholesaleMinQty: 5, cogs: 7000, stock: 28 },
      { id: 'vol-5b', name: '1 Liter Botol Refill', volumeMl: 1000, price: 42000, wholesalePrice: 35000, wholesaleMinQty: 3, cogs: 22000, stock: 14 },
      { id: 'vol-5c', name: '5 Liter Jirigen', volumeMl: 5000, price: 185000, wholesalePrice: 165000, wholesaleMinQty: 2, cogs: 98000, stock: 6 },
    ],
  },
  {
    id: 'prod-6',
    code: 'PLB-DET',
    name: 'Deterjen Cair Matik Anti Busa Berlebih',
    category: 'Deterjen & Softener',
    scentFamily: 'Fresh',
    description: 'Formula matik khusus mesin cuci bukaan depan & atas. Tidak merusak komponen mesin cuci.',
    imageUrl: 'https://images.unsplash.com/photo-1585830812416-a6c86bb14576?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    isPopular: true,
    salesCount: 510,
    createdAt: new Date().toISOString(),
    volumes: [
      { id: 'vol-6a', name: '1 Liter Refill', volumeMl: 1000, price: 18000, wholesalePrice: 15000, wholesaleMinQty: 5, cogs: 9000, stock: 60 },
      { id: 'vol-6b', name: '5 Liter Jirigen', volumeMl: 5000, price: 75000, wholesalePrice: 65000, wholesaleMinQty: 2, cogs: 40000, stock: 25 },
    ],
  },
  {
    id: 'prod-7',
    code: 'PLB-SOF',
    name: 'Softener Ultramewah Ultra Softener',
    category: 'Deterjen & Softener',
    scentFamily: 'Baby/Powder',
    description: 'Pelembut pakaian dengan mikro-kapsul wangi yang membalur serat kain jadi super lembut.',
    imageUrl: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    isPopular: false,
    salesCount: 340,
    createdAt: new Date().toISOString(),
    volumes: [
      { id: 'vol-7a', name: '1 Liter Refill', volumeMl: 1000, price: 20000, wholesalePrice: 17000, wholesaleMinQty: 5, cogs: 10000, stock: 40 },
      { id: 'vol-7b', name: '5 Liter Jirigen', volumeMl: 5000, price: 85000, wholesalePrice: 75000, wholesaleMinQty: 2, cogs: 45000, stock: 18 },
    ],
  },
  {
    id: 'prod-8',
    code: 'PLB-PLC',
    name: 'Pelicin Setrika Spray Easy Iron Aromatik',
    category: 'Pelicin Setrika',
    scentFamily: 'Fresh',
    description: 'Cairan pelicin setrika anti kusut dan anti lengket di tapak setrika.',
    imageUrl: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    isPopular: false,
    salesCount: 225,
    createdAt: new Date().toISOString(),
    volumes: [
      { id: 'vol-8a', name: '250ml Spray', volumeMl: 250, price: 10000, wholesalePrice: 8000, wholesaleMinQty: 5, cogs: 4500, stock: 50 },
      { id: 'vol-8b', name: '1 Liter Refill', volumeMl: 1000, price: 25000, wholesalePrice: 20000, wholesaleMinQty: 3, cogs: 12000, stock: 30 },
      { id: 'vol-8c', name: '5 Liter Jirigen', volumeMl: 5000, price: 100000, wholesalePrice: 88000, wholesaleMinQty: 2, cogs: 52000, stock: 12 },
    ],
  }
];

// Default Initial Coupons
export const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'coup-1',
    code: 'BATANGSUPER',
    discountType: 'percentage',
    discountValue: 10,
    minPurchase: 50000,
    maxDiscount: 20000,
    expiresAt: '2026-12-31',
    usageCount: 14,
    isActive: true,
  },
  {
    id: 'coup-2',
    code: 'GROSIR5L',
    discountType: 'fixed',
    discountValue: 15000,
    minPurchase: 150000,
    expiresAt: '2026-12-31',
    usageCount: 8,
    isActive: true,
  },
  {
    id: 'coup-3',
    code: 'ONGKIRFREE',
    discountType: 'fixed',
    discountValue: 10000,
    minPurchase: 100000,
    expiresAt: '2026-12-31',
    usageCount: 22,
    isActive: true,
  }
];

// Default Initial CRM Customers
export const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Laundry Bersih Jaya (Bpk. Agus)',
    phone: '081234567891',
    address: 'Jl. Pemuda No. 45, Kauman, Batang',
    district: 'Kec. Batang',
    latitude: -6.9020,
    longitude: 109.7280,
    points: 450,
    membershipTier: 'VIP',
    totalSpent: 4850000,
    debtBalance: 0,
    notes: 'Pelanggan rutin 5 literan tiap Senin',
    createdAt: '2026-01-10',
  },
  {
    id: 'cust-2',
    name: 'Ibu Hj. Siti Nurjanah',
    phone: '085712345678',
    address: 'Kendalpayak No. 12, Warungasem, Batang',
    district: 'Kec. Warungasem',
    latitude: -6.9300,
    longitude: 109.7150,
    points: 120,
    membershipTier: 'Gold',
    totalSpent: 1250000,
    debtBalance: 45000,
    notes: 'Suka aroma Akasia & Downy Black',
    createdAt: '2026-02-15',
  },
  {
    id: 'cust-3',
    name: 'Kandeman Fresh Laundry (Mbak Rina)',
    phone: '082198765432',
    address: 'Depan Pasar Kandeman, Batang',
    district: 'Kec. Kandeman',
    latitude: -6.8900,
    longitude: 109.7800,
    points: 280,
    membershipTier: 'Gold',
    totalSpent: 2900000,
    debtBalance: 0,
    notes: 'Order jirigen 5L campur deterjen',
    createdAt: '2026-03-01',
  }
];

// Default Initial Expenses (Operational)
export const DEFAULT_EXPENSES: Expense[] = [
  { id: 'exp-1', title: 'Sewa Ruko Toko Bulan Juli', category: 'Sewa', amount: 1500000, date: '2026-07-01', notes: 'Sewa Ruko Kalisalak Batang' },
  { id: 'exp-2', title: 'Listrik & Air Galon Juli', category: 'Listrik & Air', amount: 350000, date: '2026-07-05', notes: 'PLN & PDAM' },
  { id: 'exp-3', title: 'Beli Botol Spray 250ml 100pcs', category: 'Kemasan & Botol', amount: 250000, date: '2026-07-12', notes: 'Supplier botol plastik' },
  { id: 'exp-4', title: 'Gaji Operasional Kasir', category: 'Gaji Karya', amount: 1800000, date: '2026-07-25', notes: 'Gaji bulanan' },
];

// Default Banners (Tailored for Mobile, Tablet, Desktop)
export const DEFAULT_BANNERS: CarouselBanner[] = [
  {
    id: 'ban-1',
    title: 'PROMO SPESIAL WANGI BATANG',
    subtitle: 'Diskon Hingga 15% Untuk Pembelian Jirigen 5 Liter Akasia & Philux!',
    ctaText: 'Belanja Sekarang',
    ctaLink: '#catalog',
    badge: 'BEST SELLER',
    order: 1,
    isActive: true,
    imageUrlDesktop: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=1600&q=80',
    imageUrlTablet: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=1000&q=80',
    imageUrlMobile: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'ban-2',
    title: 'GRATIS ONGKIR LOKAL BATANG',
    subtitle: 'Pengiriman Cepat Kurir Instan Langsung Sampai Ke Tempat Anda',
    ctaText: 'Cek Biaya Jarak',
    ctaLink: '#distance',
    badge: 'BEBAS ONGKIR',
    order: 2,
    isActive: true,
    imageUrlDesktop: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=1600&q=80',
    imageUrlTablet: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=1000&q=80',
    imageUrlMobile: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'ban-3',
    title: 'HARGA GROSIR UNTUK USAHA LAUNDRY',
    subtitle: 'Dapatkan Harga Pabrik Kualitas Konsentrat Tinggi Tahan 30 Hari',
    ctaText: 'Daftar Mitra CRM',
    ctaLink: '#crm',
    badge: 'MITRA GROSIR',
    order: 3,
    isActive: true,
    imageUrlDesktop: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1600&q=80',
    imageUrlTablet: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1000&q=80',
    imageUrlMobile: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80',
  }
];

// Default Initial Orders for Profit & Loss / POS Analytics
export const DEFAULT_ORDERS: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'PLB-20260731-001',
    customerName: 'Laundry Bersih Jaya (Bpk. Agus)',
    customerPhone: '081234567891',
    customerAddress: 'Jl. Pemuda No. 45, Kauman, Batang',
    items: [
      {
        productId: 'prod-1',
        productName: 'Parfum Laundry Akasia Premium',
        imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
        volumeId: 'vol-1c',
        volumeName: '5 Liter Jirigen',
        volumeMl: 5000,
        unitPrice: 165000,
        originalPrice: 185000,
        cogs: 98000,
        quantity: 2,
      },
      {
        productId: 'prod-6',
        productName: 'Deterjen Cair Matik Anti Busa',
        imageUrl: 'https://images.unsplash.com/photo-1585830812416-a6c86bb14576?auto=format&fit=crop&w=800&q=80',
        volumeId: 'vol-6b',
        volumeName: '5 Liter Jirigen',
        volumeMl: 5000,
        unitPrice: 65000,
        originalPrice: 75000,
        cogs: 40000,
        quantity: 2,
      }
    ],
    subtotal: 460000,
    discountAmount: 15000,
    couponCode: 'GROSIR5L',
    shippingFee: 0,
    shippingType: 'DISTANCE_LOCAL',
    shippingDetail: 'Kurir Lokal Batang (Gratis Min Order)',
    totalAmount: 445000,
    totalCogs: 276000,
    paymentMethod: 'PAKASIR_QRIS',
    paymentStatus: 'PAID',
    orderStatus: 'DELIVERED',
    createdAt: '2026-07-31T10:15:00Z',
    isPosSale: false,
  },
  {
    id: 'ord-102',
    orderNumber: 'PLB-20260731-002',
    customerName: 'Pelanggan Kasir Tunai',
    customerPhone: '085700000000',
    customerAddress: 'Toko Parfum Laundry Batang (Walk-in)',
    items: [
      {
        productId: 'prod-2',
        productName: 'Parfum Laundry Downy Black',
        imageUrl: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80',
        volumeId: 'vol-2a',
        volumeName: '250ml Botol Spray',
        volumeMl: 250,
        unitPrice: 16000,
        originalPrice: 16000,
        cogs: 7500,
        quantity: 2,
      }
    ],
    subtotal: 32000,
    discountAmount: 0,
    shippingFee: 0,
    shippingType: 'TAKEAWAY',
    shippingDetail: 'Ambil Di Toko',
    totalAmount: 32000,
    totalCogs: 15000,
    paymentMethod: 'CASH',
    paymentStatus: 'PAID',
    orderStatus: 'DELIVERED',
    createdAt: '2026-07-31T14:20:00Z',
    isPosSale: true,
  }
];

// Helper function to resolve effective store settings with env fallbacks
export function getEffectiveStoreSettings(customSettings?: Partial<StoreSettings> | null): StoreSettings {
  const merged: StoreSettings = {
    ...DEFAULT_SETTINGS,
    ...(customSettings || {}),
  };

  const envSupabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (import.meta as any).env?.SUPABASE_URL || '';
  const envSupabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.SUPABASE_ANON_KEY || '';
  const envPakasirProject =
    (import.meta as any).env?.VITE_PAKASIR_PROJECT_KEY ||
    (import.meta as any).env?.VITE_PAKASIR_PROJECT_SLUG ||
    (import.meta as any).env?.PAKASIR_PROJECT_SLUG ||
    (import.meta as any).env?.PAKASIR_PROJECT_KEY ||
    '';
  const envPakasirApiKey =
    (import.meta as any).env?.VITE_PAKASIR_API_KEY ||
    (import.meta as any).env?.PAKASIR_API_KEY ||
    '';

  // Environment variables and PERMANENT_CONFIG take priority over legacy settings
  merged.supabaseUrl = envSupabaseUrl || PERMANENT_CONFIG.supabaseUrl || merged.supabaseUrl || '';
  merged.supabaseAnonKey = envSupabaseKey || PERMANENT_CONFIG.supabaseAnonKey || merged.supabaseAnonKey || '';
  merged.pakasirProjectKey = envPakasirProject || PERMANENT_CONFIG.pakasirProjectKey || merged.pakasirProjectKey || '';
  merged.pakasirApiKey = envPakasirApiKey || PERMANENT_CONFIG.pakasirApiKey || merged.pakasirApiKey || '';
  merged.pakasirApiUrl = 'https://app.pakasir.com/api';

  return merged;
}

// Helper Functions for LocalStorage Access
export function getStorageData<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (key === STORAGE_KEYS.SETTINGS) {
        return getEffectiveStoreSettings() as unknown as T;
      }
      return defaultValue;
    }
    const parsed = JSON.parse(raw) as T;
    if (key === STORAGE_KEYS.SETTINGS && parsed && typeof parsed === 'object') {
      return getEffectiveStoreSettings(parsed as unknown as StoreSettings) as unknown as T;
    }
    return parsed;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    if (key === STORAGE_KEYS.SETTINGS) {
      return getEffectiveStoreSettings() as unknown as T;
    }
    return defaultValue;
  }
}

export function setStorageData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

// Initializer to populate LocalStorage if empty
export function initLocalStorage(): void {
  const isInitialized = localStorage.getItem('plb_initialized_v2');
  const isCleared = localStorage.getItem('plb_cleared_dummy_v1') === 'true';

  if (!isInitialized) {
    setStorageData(STORAGE_KEYS.SETTINGS, getEffectiveStoreSettings());
    setStorageData(STORAGE_KEYS.CATEGORIES, isCleared ? [] : DEFAULT_CATEGORIES);
    setStorageData(STORAGE_KEYS.PRODUCTS, isCleared ? [] : DEFAULT_PRODUCTS);
    setStorageData(STORAGE_KEYS.COUPONS, isCleared ? [] : DEFAULT_COUPONS);
    setStorageData(STORAGE_KEYS.CUSTOMERS, isCleared ? [] : DEFAULT_CUSTOMERS);
    setStorageData(STORAGE_KEYS.EXPENSES, isCleared ? [] : DEFAULT_EXPENSES);
    setStorageData(STORAGE_KEYS.BANNERS, isCleared ? [] : DEFAULT_BANNERS);
    setStorageData(STORAGE_KEYS.ORDERS, isCleared ? [] : DEFAULT_ORDERS);
    setStorageData(STORAGE_KEYS.USERS, DEFAULT_USERS);
    setStorageData<User>(STORAGE_KEYS.CURRENT_USER, DEFAULT_USERS[0]);
    localStorage.setItem('plb_initialized_v2', 'true');
  } else {
    // Migration check for settings
    const existingSettings = getStorageData<StoreSettings | null>(STORAGE_KEYS.SETTINGS, null);
    const effective = getEffectiveStoreSettings(existingSettings);
    setStorageData(STORAGE_KEYS.SETTINGS, effective);
  }
}

export { STORAGE_KEYS };
