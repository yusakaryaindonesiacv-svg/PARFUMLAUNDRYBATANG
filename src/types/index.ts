export type ScentCategory = 'Floral' | 'Fresh' | 'Sweet' | 'Fruity' | 'Woody' | 'Baby/Powder';

export interface VolumeOption {
  id: string;
  name: string; // e.g. '250ml Spray', '1 Liter', '5 Liter Jirigen'
  volumeMl: number;
  price: number; // Retail price / Harga Diskon (Jual)
  originalPrice?: number; // Harga Coret / Normal Sebelum Diskon
  wholesalePrice: number; // Price per unit if qty >= wholesaleMinQty
  wholesaleMinQty: number; // e.g. 5 units
  cogs: number; // Modal / HPP
  stock: number;
}

export interface Product {
  id: string;
  code: string; // SKU / Barcode
  name: string; // e.g. 'Parfum Laundry Akasia Premium'
  category: string; // e.g. 'Parfum Waterbased', 'Parfum Alcoholbased', 'Deterjen Cair', 'Softener', 'Pelicin Setrika'
  scentFamily: ScentCategory;
  description: string;
  imageUrl: string;
  rating: number;
  isPopular?: boolean;
  originalPrice?: number; // Harga Coret Produk (opsional)
  salesCount?: number;
  volumes: VolumeOption[];
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  imageUrl: string;
  volumeId: string;
  volumeName: string;
  volumeMl: number;
  unitPrice: number;
  originalPrice: number;
  cogs: number;
  quantity: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // e.g. 10 (%) or 15000 (Rp)
  minPurchase: number;
  maxDiscount?: number;
  expiresAt: string;
  usageCount: number;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string; // e.g. '081234567890'
  email?: string;
  address: string;
  district?: string; // Kec. Batang, Warungasem, Bandar, Tulis, Limpung, dll.
  latitude?: number;
  longitude?: number;
  points: number;
  membershipTier: 'Bronze' | 'Silver' | 'Gold' | 'VIP';
  totalSpent: number;
  debtBalance: number; // Piutang pelanggan
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  category: 'Sewa' | 'Listrik & Air' | 'Gaji Karya' | 'Kemasan & Botol' | 'Bahan Baku' | 'Transportasi' | 'Lainnya';
  amount: number;
  date: string;
  notes?: string;
}

export interface CourierOption {
  code: string; // e.g. 'JNE', 'JNT', 'POS', 'LOKAL_BATANG'
  name: string;
  service: string; // e.g. 'Reguler', 'Express', 'Kurir Instan Batang'
  etd: string; // e.g. '1-2 Hari' or '1-3 Jam'
  cost: number;
}

export type PaymentMethod = 'CASH' | 'PAKASIR_QRIS' | 'PAKASIR_VA' | 'BANK_TRANSFER' | 'HUTANG' | 'COD';

export interface Order {
  id: string;
  orderNumber: string; // e.g. 'PLB-20260731-001'
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  shippingFee: number;
  shippingType: 'DISTANCE_LOCAL' | 'COURIER_NATIONAL' | 'TAKEAWAY';
  shippingDetail: string; // e.g. 'Kurir Lokal Batang (4.2 km)' or 'J&T Reguler'
  trackingNumber?: string;
  totalAmount: number;
  totalCogs: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  orderStatus: 'PENDING' | 'PROCESSED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  pakasirTransactionId?: string;
  notes?: string;
  isPosSale?: boolean;
  createdAt: string;
}

export interface CarouselBanner {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  imageUrlDesktop: string;
  imageUrlTablet: string;
  imageUrlMobile: string;
  badge?: string;
  order: number;
  isActive: boolean;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  topAnnouncementText?: string; // Running text banner above navbar header
  appLogoUrl?: string; // URL or Base64 data of app logo & mobile install icon
  phone: string;
  address: string;
  city: string; // Default: Batang, Jawa Tengah
  latitude: number; // -6.9048 (Batang Center)
  longitude: number; // 109.7303
  baseRatePerKm: number; // e.g. 2000
  minDeliveryFee: number; // e.g. 5000
  freeDeliveryMinOrder: number; // e.g. 200000
  
  // Pakasir Integration
  pakasirProjectKey: string;
  pakasirApiKey: string;
  pakasirApiUrl: string;
  
  // Google Sheets Integration
  googleSheetsWebappUrl: string;
  
  // Supabase Integration
  supabaseUrl: string;
  supabaseAnonKey: string;

  // National Courier API (Binderbyte / RajaOngkir Free Tier)
  binderbyteApiKey?: string;

  // Active Enabled National Couriers
  enabledNationalCouriers?: string[];
}

export type UserRole = 'admin' | 'kasir' | 'pelanggan' | 'reseller' | 'kurir';

export interface FeaturePermissions {
  canAccessHome: boolean;
  canAccessCatalog: boolean;
  canAccessPos: boolean;
  canAccessTracking: boolean;
  canAccessAdmin: boolean;
  canManageProducts: boolean;
  canManageCategories: boolean;
  canManagePricesAndCogs: boolean;
  canViewFinancialReports: boolean;
  canManageCoupons: boolean;
  canManageCustomersCRM: boolean;
  canManageUsersAndRoles: boolean;
  canSyncSupabaseAndSheets: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  role: UserRole;
  isActive?: boolean;
  customPermissions?: Partial<FeaturePermissions>;
  createdAt?: string;
}
