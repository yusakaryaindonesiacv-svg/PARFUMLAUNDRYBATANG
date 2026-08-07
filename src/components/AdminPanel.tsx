import React, { useState } from 'react';
import { Product, Category, Order, Customer, Expense, Coupon, CarouselBanner, StoreSettings, User, VolumeOption, UserRole, FeaturePermissions } from '../types';
import { 
  LayoutDashboard, Package, ShoppingCart, TrendingUp, Users, Ticket, 
  Image as ImageIcon, Settings, Download, Upload, Plus, Trash2, Edit2, 
  FileText, Check, Copy, RefreshCw, Database, FileSpreadsheet, ShieldCheck, Sparkles, X, Tag, Percent, Calendar, Layers,
  UserCheck, Key, Lock, Shield, ToggleLeft, ToggleRight, CheckCircle2, AlertCircle, Search, Filter,
  MapPin, Navigation, Globe, Store, Save, QrCode, Eye, Printer, MessageSquare, Truck, PhoneCall, ExternalLink,
  Clock, DollarSign, Send, CheckCircle, XCircle, AlertTriangle, PlusCircle, CloudUpload
} from 'lucide-react';
import { MapPicker } from './MapPicker';
import { ALL_NATIONAL_COURIERS } from '../lib/shipping';
import { formatRupiah, formatDateIndo, exportProductsToExcel, exportOrdersToExcel, exportProfitLossPDF, parseProductsExcel } from '../lib/excelPdf';
import { syncDataToGoogleSheets, GOOGLE_APPS_SCRIPT_CODE } from '../lib/sheets';
import { 
  testSupabaseConnection, 
  SUPABASE_SQL_SCHEMA, 
  upsertProductToSupabase, 
  deleteProductFromSupabase, 
  upsertCategoryToSupabase, 
  deleteCategoryFromSupabase, 
  upsertCustomerToSupabase,
  deleteCustomerFromSupabase,
  upsertCouponToSupabase,
  deleteCouponFromSupabase,
  upsertBannerToSupabase,
  deleteBannerFromSupabase,
  fetchCategoriesFromSupabase,
  fetchProductsFromSupabase,
  fetchCustomersFromSupabase,
  fetchCouponsFromSupabase,
  fetchBannersFromSupabase,
  fetchExpensesFromSupabase,
  fetchOrdersFromSupabase,
  upsertExpenseToSupabase,
  deleteAllSupabaseData,
  upsertUserToSupabase,
  deleteUserFromSupabase,
  upsertOrderToSupabase,
  deleteOrderFromSupabase,
  deleteExpenseFromSupabase,
  upsertSettingsToSupabase,
  syncAllDataToSupabase,
  clearSupabaseClientCache,
  uploadImageToSupabaseStorage
} from '../lib/supabase';
import { createPakasirTransaction } from '../lib/pakasir';
import { STORAGE_KEYS, setStorageData, getDefaultPermissionsForRole, getEffectivePermissions } from '../lib/storage';
import { compressImageFile } from '../lib/imageUtils';

interface AdminPanelProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  coupons: Coupon[];
  setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>;
  banners: CarouselBanner[];
  setBanners: React.Dispatch<React.SetStateAction<CarouselBanner[]>>;
  settings: StoreSettings;
  setSettings: React.Dispatch<React.SetStateAction<StoreSettings>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  onOpenDeploymentGuide: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  setProducts,
  categories,
  setCategories,
  orders,
  setOrders,
  customers,
  setCustomers,
  expenses,
  setExpenses,
  coupons,
  setCoupons,
  banners,
  setBanners,
  settings,
  setSettings,
  users,
  setUsers,
  currentUser,
  setCurrentUser,
  onOpenDeploymentGuide,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'products' | 'categories' | 'orders' | 'financials' | 'crm' | 'coupons' | 'banners' | 'users' | 'settings'>('dashboard');

  // New Expense State
  const [newExpenseTitle, setNewExpenseTitle] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState<Expense['category']>('Sewa');
  const [newExpenseAmount, setNewExpenseAmount] = useState(0);

  // Google Sheets, Supabase & Pakasir Sync status
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [pakasirTestResult, setPakasirTestResult] = useState<{ loading: boolean; success?: boolean; message: string; details?: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // --- MODAL & FORM STATES FOR CRUD ---
  // Product Form Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodCode, setProdCode] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [prodScentFamily, setProdScentFamily] = useState<Product['scentFamily']>('Floral');
  const [prodDescription, setProdDescription] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodOriginalPrice, setProdOriginalPrice] = useState<number>(0);
  const [prodIsPopular, setProdIsPopular] = useState(false);
  const [prodVolumes, setProdVolumes] = useState<VolumeOption[]>([]);

  // Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');

  // Coupon Modal State
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [coupCode, setCoupCode] = useState('');
  const [coupType, setCoupType] = useState<'percentage' | 'fixed'>('percentage');
  const [coupValue, setCoupValue] = useState(10);
  const [coupMinPurchase, setCoupMinPurchase] = useState(50000);
  const [coupExpiresAt, setCoupExpiresAt] = useState('2026-12-31');
  const [coupIsActive, setCoupIsActive] = useState(true);

  // Banner Modal State
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<CarouselBanner | null>(null);
  const [banTitle, setBanTitle] = useState('');
  const [banSubtitle, setBanSubtitle] = useState('');
  const [banBadge, setBanBadge] = useState('');
  const [banImgDesktop, setBanImgDesktop] = useState('');
  const [banImgMobile, setBanImgMobile] = useState('');
  const [banCtaText, setBanCtaText] = useState('Lihat Katalog');
  const [banCtaLink, setBanCtaLink] = useState('#catalog');
  const [banIsActive, setBanIsActive] = useState(true);

  // Customer Modal State
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custDistrict, setCustDistrict] = useState('Kec. Batang');
  const [custTier, setCustTier] = useState<Customer['membershipTier']>('Bronze');
  const [custPoints, setCustPoints] = useState(0);

  // --- ORDER MANAGEMENT STATES ---
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | 'PENDING' | 'PROCESSED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<'ALL' | 'PAID' | 'UNPAID' | 'REFUNDED'>('ALL');
  const [orderChannelFilter, setOrderChannelFilter] = useState<'ALL' | 'POS' | 'ONLINE'>('ALL');
  
  // Selected Order Modal (Invoice & Details Editor)
  const [selectedOrderModal, setSelectedOrderModal] = useState<Order | null>(null);
  const [editingOrderStatus, setEditingOrderStatus] = useState<Order['orderStatus']>('PENDING');
  const [editingPaymentStatus, setEditingPaymentStatus] = useState<Order['paymentStatus']>('UNPAID');
  const [editingTrackingNumber, setEditingTrackingNumber] = useState('');
  const [editingNotes, setEditingNotes] = useState('');

  // Thermal Receipt Print Modal
  const [printReceiptOrder, setPrintReceiptOrder] = useState<Order | null>(null);

  // Manual Order Modal
  const [isAddManualOrderOpen, setIsAddManualOrderOpen] = useState(false);
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualCustomerPhone, setManualCustomerPhone] = useState('');
  const [manualCustomerAddress, setManualCustomerAddress] = useState('');
  const [manualSelectedProductId, setManualSelectedProductId] = useState('');
  const [manualSelectedVolumeId, setManualSelectedVolumeId] = useState('');
  const [manualQty, setManualQty] = useState(1);
  const [manualPaymentMethod, setManualPaymentMethod] = useState<Order['paymentMethod']>('CASH');
  const [manualPaymentStatus, setManualPaymentStatus] = useState<Order['paymentStatus']>('PAID');
  const [manualShippingFee, setManualShippingFee] = useState(0);

  // Sync state
  const [isSyncingOrders, setIsSyncingOrders] = useState(false);

  // --- USER ACCOUNTS & ROLE ACCESS MANAGEMENT STATE ---
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | UserRole>('ALL');
  
  // User Edit/Create Modal State
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormName, setUserFormName] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormPhone, setUserFormPhone] = useState('');
  const [userFormRole, setUserFormRole] = useState<UserRole>('pelanggan');
  const [userFormIsActive, setUserFormIsActive] = useState(true);

  // User Permissions Modal State
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null);
  const [tempPermissions, setTempPermissions] = useState<FeaturePermissions>({
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
    canManageCustomersCRM: false,
    canManageUsersAndRoles: false,
    canSyncSupabaseAndSheets: false,
  });

  // Delete Confirmation Modal State (replaces blocked native confirm dialogs)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    title: string;
    message: string;
    itemType: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  // Stats Calculations
  const totalRevenue = (orders || []).filter(o => o && (o.paymentStatus || '').toUpperCase() === 'PAID').reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const totalCogs = (orders || []).filter(o => o && (o.paymentStatus || '').toUpperCase() === 'PAID').reduce((acc, o) => acc + (o.totalCogs || 0), 0);
  const totalExpenses = (expenses || []).reduce((acc, e) => acc + (e?.amount || 0), 0);
  const grossProfit = totalRevenue - totalCogs;
  const netProfit = grossProfit - totalExpenses;

  // Filtered Orders Calculation
  const filteredOrders = (orders || []).filter(o => {
    if (!o) return false;
    const search = (orderSearchTerm || '').toLowerCase().trim();
    if (search) {
      const matchNo = (o.orderNumber || '').toLowerCase().includes(search);
      const matchName = (o.customerName || '').toLowerCase().includes(search);
      const matchPhone = (o.customerPhone || '').toLowerCase().includes(search);
      const matchAddr = (o.customerAddress || '').toLowerCase().includes(search);
      const matchResi = (o.trackingNumber || '').toLowerCase().includes(search);
      if (!matchNo && !matchName && !matchPhone && !matchAddr && !matchResi) return false;
    }
    const orderStatus = (o.orderStatus || 'DELIVERED').toUpperCase();
    const paymentStatus = (o.paymentStatus || 'PAID').toUpperCase();

    if (orderStatusFilter !== 'ALL' && orderStatus !== orderStatusFilter.toUpperCase()) return false;
    if (orderPaymentFilter !== 'ALL' && paymentStatus !== orderPaymentFilter.toUpperCase()) return false;
    if (orderChannelFilter === 'POS' && !o.isPosSale) return false;
    if (orderChannelFilter === 'ONLINE' && o.isPosSale) return false;
    return true;
  });

  // Compute deduplicated list of categories strictly from registered categories
  const registeredCategoryNames = Array.from(
    new Set((categories || []).map(c => c?.name).filter(Boolean))
  );

  const allCategoryOptions = Array.from(
    new Set([
      ...registeredCategoryNames,
      ...(prodCategory && !registeredCategoryNames.includes(prodCategory) ? [prodCategory] : [])
    ])
  ).filter(Boolean);

  // --- HANDLERS FOR CRUD & SUPABASE SYNC ---
  // Product Handlers
  const openNewProductModal = () => {
    setEditingProduct(null);
    setProdCode(`PLB-${Math.floor(100 + Math.random() * 900)}`);
    setProdName('');
    const defaultCat = categories[0]?.name || '';
    if (defaultCat) {
      setProdCategory(defaultCat);
      setIsCustomCategory(false);
      setCustomCategoryInput('');
    } else {
      setProdCategory('');
      setIsCustomCategory(true);
      setCustomCategoryInput('');
    }
    setProdScentFamily('Floral');
    setProdDescription('Formulasi parfum konsentrat tahan lama khusus laundry.');
    setProdImageUrl('https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=600');
    setProdOriginalPrice(20000);
    setProdIsPopular(false);
    setProdVolumes([
      { id: `vol-${Date.now()}-1`, name: '250ml Spray', volumeMl: 250, price: 15000, originalPrice: 20000, wholesalePrice: 12000, wholesaleMinQty: 5, cogs: 7000, stock: 50 },
      { id: `vol-${Date.now()}-2`, name: '1 Liter Refill', volumeMl: 1000, price: 40000, originalPrice: 50000, wholesalePrice: 35000, wholesaleMinQty: 5, cogs: 20000, stock: 30 },
      { id: `vol-${Date.now()}-3`, name: '5 Liter Jirigen', volumeMl: 5000, price: 175000, originalPrice: 210000, wholesalePrice: 150000, wholesaleMinQty: 3, cogs: 90000, stock: 15 },
    ]);
    setProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProdCode(product.code);
    setProdName(product.name);
    setProdCategory(product.category);
    if (product.category && !allCategoryOptions.includes(product.category)) {
      setIsCustomCategory(true);
      setCustomCategoryInput(product.category);
    } else {
      setIsCustomCategory(false);
      setCustomCategoryInput('');
    }
    setProdScentFamily(product.scentFamily || 'Floral');
    setProdDescription(product.description || '');
    setProdImageUrl(product.imageUrl || '');
    setProdOriginalPrice(product.originalPrice || 0);
    setProdIsPopular(!!product.isPopular);
    setProdVolumes(product.volumes ? [...product.volumes] : []);
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = (isCustomCategory ? customCategoryInput : prodCategory).trim();
    if (!prodName || !finalCategory) return;

    // Auto register category to categories state & Supabase if not existing
    const catExists = categories.some(c => c.name.toLowerCase() === finalCategory.toLowerCase());
    if (!catExists && finalCategory) {
      const newCatObj: Category = {
        id: `cat-${Date.now()}`,
        name: finalCategory,
        description: 'Kategori produk baru',
      };
      setCategories(prev => [...prev, newCatObj]);
      upsertCategoryToSupabase(newCatObj).catch(err => console.warn('Sync new category error:', err));
    }

    const productObj: Product = editingProduct ? {
      ...editingProduct,
      code: prodCode,
      name: prodName,
      category: finalCategory,
      scentFamily: prodScentFamily,
      description: prodDescription,
      imageUrl: prodImageUrl || 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=600',
      originalPrice: prodOriginalPrice > 0 ? prodOriginalPrice : undefined,
      isPopular: prodIsPopular,
      volumes: prodVolumes,
    } : {
      id: `prod-${Date.now()}`,
      code: prodCode || `PLB-${Date.now()}`,
      name: prodName,
      category: finalCategory,
      scentFamily: prodScentFamily,
      description: prodDescription,
      imageUrl: prodImageUrl || 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=600',
      rating: 5.0,
      originalPrice: prodOriginalPrice > 0 ? prodOriginalPrice : undefined,
      isPopular: prodIsPopular,
      volumes: prodVolumes,
      createdAt: new Date().toISOString(),
    };

    if (editingProduct) {
      setProducts(prev => {
        const next = prev.map(p => p.id === editingProduct.id ? productObj : p);
        setStorageData(STORAGE_KEYS.PRODUCTS, next);
        return next;
      });
    } else {
      setProducts(prev => {
        const next = [productObj, ...prev];
        setStorageData(STORAGE_KEYS.PRODUCTS, next);
        return next;
      });
    }

    setProductModalOpen(false);

    // Sync directly to Supabase
    const res = await upsertProductToSupabase(productObj);
    if (res.success) {
      setSyncStatus(`Produk "${prodName}" tersimpan di lokal & disinkronkan ke Supabase!`);
    } else if (res.error) {
      setSyncStatus(`Produk tersimpan lokal. Catatan Supabase: ${res.error}`);
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setDeleteConfirmModal({
      title: `Hapus Produk "${product.name}"`,
      message: `Apakah Anda yakin ingin menghapus produk "${product.name}" (SKU: ${product.code})?\nData akan dihapus dari penyimpanan lokal dan database Supabase.`,
      itemType: 'Produk',
      onConfirm: async () => {
        setProducts(prev => {
          const next = prev.filter(item => item.id !== product.id && item.code !== product.code);
          setStorageData(STORAGE_KEYS.PRODUCTS, next);
          return next;
        });
        const res = await deleteProductFromSupabase(product.id, product.code);
        if (res.success) {
          setSyncStatus(`✓ Produk "${product.name}" telah dihapus dari lokal & Supabase.`);
        } else {
          setSyncStatus(`✓ Produk "${product.name}" dihapus dari lokal.`);
        }
      }
    });
  };

  // Category Handlers
  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDescription('');
    setCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDescription(cat.description || '');
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    const catObj: Category = editingCategory ? {
      ...editingCategory,
      name: catName,
      description: catDescription,
    } : {
      id: `cat-${Date.now()}`,
      name: catName,
      description: catDescription,
    };

    if (editingCategory) {
      setCategories(prev => {
        const next = prev.map(c => c.id === editingCategory.id ? catObj : c);
        setStorageData(STORAGE_KEYS.CATEGORIES, next);
        return next;
      });
    } else {
      setCategories(prev => {
        const next = [...prev, catObj];
        setStorageData(STORAGE_KEYS.CATEGORIES, next);
        return next;
      });
    }

    setCategoryModalOpen(false);

    // Sync directly to Supabase
    const res = await upsertCategoryToSupabase(catObj);
    if (res.success) {
      setSyncStatus(`Kategori "${catName}" tersimpan di lokal & disinkronkan ke Supabase!`);
    } else if (res.error) {
      setSyncStatus(`Kategori tersimpan lokal. Catatan Supabase: ${res.error}`);
    }
  };

  const handleDeleteCategory = (category: Category) => {
    setDeleteConfirmModal({
      title: `Hapus Kategori "${category.name}"`,
      message: `Apakah Anda yakin ingin menghapus kategori "${category.name}"?\nData akan dihapus dari penyimpanan lokal dan database Supabase.`,
      itemType: 'Kategori',
      onConfirm: async () => {
        setCategories(prev => {
          const next = prev.filter(c => c.id !== category.id && c.name !== category.name);
          setStorageData(STORAGE_KEYS.CATEGORIES, next);
          return next;
        });
        const res = await deleteCategoryFromSupabase(category.id, category.name);
        if (res.success) {
          setSyncStatus(`✓ Kategori "${category.name}" telah dihapus dari lokal & Supabase.`);
        } else {
          setSyncStatus(`✓ Kategori "${category.name}" dihapus dari lokal.`);
        }
      }
    });
  };

  // Sync All Data to Supabase Handlers
  const handleSyncAllToSupabase = async () => {
    setSyncStatus('Sedang mengirim semua produk, kategori, pengguna, pengaturan & transaksi ke Supabase...');
    const res = await syncAllDataToSupabase(products, categories, orders, customers, expenses, coupons, banners, users, settings);
    setSyncStatus(res.message);
  };

  // Clear All Dummy Data Handler
  const handleClearAllDummyData = () => {
    setDeleteConfirmModal({
      title: 'Kosongkan Seluruh Data Dummy Store',
      message: 'APAKAH ANDA YAKIN INGIN MENGHAPUS SEMUA DATA DUMMY?\n\nSemua produk, kategori, pesanan, kupon, pelanggan, dan banner akan dihapus permanen dari LOKAL dan DATABASE SUPABASE.',
      itemType: 'Semua Data Dummy',
      onConfirm: async () => {
        setSyncStatus('Sedang menghapus & mengosongkan semua data dummy dari lokal dan Supabase...');
        
        setProducts([]);
        setCategories([]);
        setOrders([]);
        setCustomers([]);
        setExpenses([]);
        setCoupons([]);
        setBanners([]);

        localStorage.setItem('plb_cleared_dummy_v1', 'true');

        setStorageData(STORAGE_KEYS.PRODUCTS, []);
        setStorageData(STORAGE_KEYS.CATEGORIES, []);
        setStorageData(STORAGE_KEYS.ORDERS, []);
        setStorageData(STORAGE_KEYS.CUSTOMERS, []);
        setStorageData(STORAGE_KEYS.EXPENSES, []);
        setStorageData(STORAGE_KEYS.COUPONS, []);
        setStorageData(STORAGE_KEYS.BANNERS, []);

        // Delete all records from Supabase if connected
        const sbRes = await deleteAllSupabaseData();
        if (sbRes.success) {
          setSyncStatus('✓ Berhasil! Semua data dummy toko di LOKAL & SUPABASE telah dihapus/dikosongkan.');
        } else {
          setSyncStatus(`✓ Data lokal dibersihkan. Supabase: ${sbRes.message}`);
        }
      }
    });
  };

  // Coupon Handlers
  const openNewCouponModal = () => {
    setEditingCoupon(null);
    setCoupCode('BATANGPROMO');
    setCoupType('percentage');
    setCoupValue(10);
    setCoupMinPurchase(50000);
    setCoupExpiresAt('2026-12-31');
    setCoupIsActive(true);
    setCouponModalOpen(true);
  };

  const openEditCouponModal = (coup: Coupon) => {
    setEditingCoupon(coup);
    setCoupCode(coup.code);
    setCoupType(coup.discountType);
    setCoupValue(coup.discountValue);
    setCoupMinPurchase(coup.minPurchase);
    setCoupExpiresAt(coup.expiresAt);
    setCoupIsActive(coup.isActive);
    setCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupCode) return;

    let couponObj: Coupon;
    if (editingCoupon) {
      couponObj = {
        ...editingCoupon,
        code: coupCode.toUpperCase(),
        discountType: coupType,
        discountValue: coupValue,
        minPurchase: coupMinPurchase,
        expiresAt: coupExpiresAt,
        isActive: coupIsActive,
      };
      setCoupons(prev => {
        const next = prev.map(c => c.id === editingCoupon.id ? couponObj : c);
        setStorageData(STORAGE_KEYS.COUPONS, next);
        return next;
      });
    } else {
      couponObj = {
        id: `coup-${Date.now()}`,
        code: coupCode.toUpperCase(),
        discountType: coupType,
        discountValue: coupValue,
        minPurchase: coupMinPurchase,
        expiresAt: coupExpiresAt,
        usageCount: 0,
        isActive: coupIsActive,
      };
      setCoupons(prev => {
        const next = [couponObj, ...prev];
        setStorageData(STORAGE_KEYS.COUPONS, next);
        return next;
      });
    }
    setCouponModalOpen(false);

    const res = await upsertCouponToSupabase(couponObj);
    if (res.success) {
      setSyncStatus(`Kupon "${coupCode}" tersimpan & disinkronkan ke Supabase!`);
    }
  };

  const handleDeleteCoupon = (coup: Coupon) => {
    setDeleteConfirmModal({
      title: `Hapus Kupon Diskon "${coup.code}"`,
      message: `Apakah Anda yakin ingin menghapus kupon diskon voucher "${coup.code}"?\nData akan dihapus dari penyimpanan lokal dan database Supabase.`,
      itemType: 'Kupon Diskon',
      onConfirm: async () => {
        setCoupons(prev => {
          const next = prev.filter(c => c.id !== coup.id && c.code !== coup.code);
          setStorageData(STORAGE_KEYS.COUPONS, next);
          return next;
        });
        const res = await deleteCouponFromSupabase(coup.id, coup.code);
        if (res.success) {
          setSyncStatus(`✓ Kupon "${coup.code}" telah dihapus dari lokal & Supabase.`);
        } else {
          setSyncStatus(`✓ Kupon "${coup.code}" dihapus dari lokal.`);
        }
      }
    });
  };

  // Banner Handlers
  const openNewBannerModal = () => {
    setEditingBanner(null);
    setBanTitle('Promo Varian Aroma Terbaru Laundry Batang');
    setBanSubtitle('Konsentrat berkualitas harum tahan hingga 30 hari. Bebas bau apek.');
    setBanBadge('PROMO TERBARU');
    setBanImgDesktop('https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&q=80&w=1200');
    setBanImgMobile('https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&q=80&w=600');
    setBanCtaText('Lihat Katalog');
    setBanCtaLink('#catalog');
    setBanIsActive(true);
    setBannerModalOpen(true);
  };

  const openEditBannerModal = (banner: CarouselBanner) => {
    setEditingBanner(banner);
    setBanTitle(banner.title);
    setBanSubtitle(banner.subtitle);
    setBanBadge(banner.badge || '');
    setBanImgDesktop(banner.imageUrlDesktop);
    setBanImgMobile(banner.imageUrlMobile);
    setBanCtaText(banner.ctaText);
    setBanCtaLink(banner.ctaLink);
    setBanIsActive(banner.isActive);
    setBannerModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banTitle) return;

    let bannerObj: CarouselBanner;
    if (editingBanner) {
      bannerObj = {
        ...editingBanner,
        title: banTitle,
        subtitle: banSubtitle,
        badge: banBadge,
        imageUrlDesktop: banImgDesktop,
        imageUrlTablet: banImgDesktop,
        imageUrlMobile: banImgMobile || banImgDesktop,
        ctaText: banCtaText,
        ctaLink: banCtaLink,
        isActive: banIsActive,
      };
      setBanners(prev => {
        const next = prev.map(b => b.id === editingBanner.id ? bannerObj : b);
        setStorageData(STORAGE_KEYS.BANNERS, next);
        return next;
      });
    } else {
      bannerObj = {
        id: `ban-${Date.now()}`,
        title: banTitle,
        subtitle: banSubtitle,
        badge: banBadge,
        imageUrlDesktop: banImgDesktop,
        imageUrlTablet: banImgDesktop,
        imageUrlMobile: banImgMobile || banImgDesktop,
        ctaText: banCtaText,
        ctaLink: banCtaLink,
        order: banners.length + 1,
        isActive: banIsActive,
      };
      setBanners(prev => {
        const next = [...prev, bannerObj];
        setStorageData(STORAGE_KEYS.BANNERS, next);
        return next;
      });
    }
    setBannerModalOpen(false);

    const res = await upsertBannerToSupabase(bannerObj);
    if (res.success) {
      setSyncStatus(`Banner "${banTitle}" tersimpan & disinkronkan ke Supabase!`);
    }
  };

  const handleDeleteBanner = (banner: CarouselBanner) => {
    setDeleteConfirmModal({
      title: `Hapus Banner "${banner.title}"`,
      message: `Apakah Anda yakin ingin menghapus banner promo carousel "${banner.title}"?\nData akan dihapus dari penyimpanan lokal dan database Supabase.`,
      itemType: 'Banner Promo',
      onConfirm: async () => {
        setBanners(prev => {
          const next = prev.filter(b => b.id !== banner.id);
          setStorageData(STORAGE_KEYS.BANNERS, next);
          return next;
        });
        const res = await deleteBannerFromSupabase(banner.id, banner.title);
        if (res.success) {
          setSyncStatus(`✓ Banner "${banner.title}" telah dihapus dari lokal & Supabase.`);
        } else {
          setSyncStatus(`✓ Banner dihapus dari lokal.`);
        }
      }
    });
  };

  // Customer Handlers
  const openNewCustomerModal = () => {
    setEditingCustomer(null);
    setCustName('');
    setCustPhone('');
    setCustAddress('');
    setCustDistrict('Kec. Batang');
    setCustTier('Bronze');
    setCustPoints(0);
    setCustomerModalOpen(true);
  };

  const openEditCustomerModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setCustName(cust.name);
    setCustPhone(cust.phone);
    setCustAddress(cust.address);
    setCustDistrict(cust.district || 'Kec. Batang');
    setCustTier(cust.membershipTier);
    setCustPoints(cust.points);
    setCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custPhone) return;

    let custObj: Customer;
    if (editingCustomer) {
      custObj = {
        ...editingCustomer,
        name: custName,
        phone: custPhone,
        address: custAddress,
        district: custDistrict,
        membershipTier: custTier,
        points: custPoints,
      };
      setCustomers(prev => {
        const next = prev.map(c => c.id === editingCustomer.id ? custObj : c);
        setStorageData(STORAGE_KEYS.CUSTOMERS, next);
        return next;
      });
    } else {
      custObj = {
        id: `cust-${Date.now()}`,
        name: custName,
        phone: custPhone,
        address: custAddress,
        district: custDistrict,
        points: custPoints,
        membershipTier: custTier,
        totalSpent: 0,
        debtBalance: 0,
        createdAt: new Date().toISOString(),
      };
      setCustomers(prev => {
        const next = [custObj, ...prev];
        setStorageData(STORAGE_KEYS.CUSTOMERS, next);
        return next;
      });
    }
    setCustomerModalOpen(false);

    const res = await upsertCustomerToSupabase(custObj);
    if (res.success) {
      setSyncStatus(`Pelanggan "${custName}" tersimpan & disinkronkan ke Supabase!`);
    }
  };

  const handleDeleteCustomer = (cust: Customer) => {
    setDeleteConfirmModal({
      title: `Hapus Pelanggan CRM "${cust.name}"`,
      message: `Apakah Anda yakin ingin menghapus data pelanggan CRM "${cust.name}" (${cust.phone})?\nData akan dihapus dari penyimpanan lokal dan database Supabase.`,
      itemType: 'CRM Pelanggan',
      onConfirm: async () => {
        setCustomers(prev => {
          const next = prev.filter(c => c.id !== cust.id);
          setStorageData(STORAGE_KEYS.CUSTOMERS, next);
          return next;
        });
        const res = await deleteCustomerFromSupabase(cust.id, cust.phone, cust.name);
        if (res.success) {
          setSyncStatus(`✓ Pelanggan "${cust.name}" telah dihapus dari lokal & Supabase.`);
        } else {
          setSyncStatus(`✓ Pelanggan "${cust.name}" dihapus dari lokal.`);
        }
      }
    });
  };

  const handlePullDataFromSupabase = async () => {
    setSyncStatus('Sedang mengambil data terbaru dari tabel Supabase...');
    const remoteCats = await fetchCategoriesFromSupabase();
    const remoteProds = await fetchProductsFromSupabase();
    const remoteCusts = await fetchCustomersFromSupabase();
    const remoteCoups = await fetchCouponsFromSupabase();
    const remoteBans = await fetchBannersFromSupabase();
    const remoteExps = await fetchExpensesFromSupabase();
    const remoteOrds = await fetchOrdersFromSupabase();

    let countCats = 0;
    let countProds = 0;
    let countCusts = 0;
    let countCoups = 0;
    let countBans = 0;
    let countExps = 0;
    let countOrds = 0;

    if (remoteCats !== null) {
      setCategories(remoteCats);
      setStorageData(STORAGE_KEYS.CATEGORIES, remoteCats);
      countCats = remoteCats.length;
    }
    if (remoteProds !== null) {
      setProducts(remoteProds);
      setStorageData(STORAGE_KEYS.PRODUCTS, remoteProds);
      countProds = remoteProds.length;
    }
    if (remoteCusts !== null) {
      setCustomers(remoteCusts);
      setStorageData(STORAGE_KEYS.CUSTOMERS, remoteCusts);
      countCusts = remoteCusts.length;
    }
    if (remoteCoups !== null) {
      setCoupons(remoteCoups);
      setStorageData(STORAGE_KEYS.COUPONS, remoteCoups);
      countCoups = remoteCoups.length;
    }
    if (remoteBans !== null) {
      setBanners(remoteBans);
      setStorageData(STORAGE_KEYS.BANNERS, remoteBans);
      countBans = remoteBans.length;
    }
    if (remoteExps !== null) {
      setExpenses(remoteExps);
      setStorageData(STORAGE_KEYS.EXPENSES, remoteExps);
      countExps = remoteExps.length;
    }
    if (remoteOrds !== null) {
      setOrders(prev => {
        const mergedMap = new Map<string, Order>();
        prev.forEach(o => mergedMap.set(o.id, o));
        remoteOrds.forEach(ro => mergedMap.set(ro.id, ro));
        const merged = Array.from(mergedMap.values());
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setStorageData(STORAGE_KEYS.ORDERS, merged);
        return merged;
      });
      countOrds = remoteOrds.length;
    }

    setSyncStatus(`✓ Sinkronisasi Berhasil! Data dari Supabase: ${countProds} produk, ${countCats} kategori, ${countCusts} pelanggan, ${countCoups} kupon, ${countBans} banner, ${countExps} pengeluaran, ${countOrds} transaksi.`);
  };

  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setSupabaseTestResult(null);
    const res = await testSupabaseConnection(settings.supabaseUrl, settings.supabaseAnonKey);
    setSupabaseTestResult(res);
    setTestingSupabase(false);
    if (res.success) {
      handlePullDataFromSupabase();
    }
  };

  const handleSaveSupabaseConfig = async () => {
    setStorageData(STORAGE_KEYS.SETTINGS, settings);
    clearSupabaseClientCache();

    if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
      alert('Supabase URL & Anon Key telah disimpan (kosong).');
      return;
    }

    setTestingSupabase(true);
    setSupabaseTestResult(null);
    const testRes = await testSupabaseConnection(settings.supabaseUrl, settings.supabaseAnonKey);
    setSupabaseTestResult(testRes);
    setTestingSupabase(false);

    if (testRes.success) {
      await upsertSettingsToSupabase(settings);
      await handleSyncAllToSupabase();
      alert('✓ Pengaturan Supabase tersimpan & seluruh data berhasil dikoneksikan ke Cloud Supabase!');
    } else {
      alert(`⚠️ Pengaturan tersimpan di memori lokal, namun koneksi ke Supabase gagal: ${testRes.message}`);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseTitle || newExpenseAmount <= 0) return;
    const exp: Expense = {
      id: `exp-${Date.now()}`,
      title: newExpenseTitle,
      category: newExpenseCategory,
      amount: newExpenseAmount,
      date: new Date().toISOString().slice(0, 10),
    };
    setExpenses(prev => {
      const next = [exp, ...prev];
      setStorageData(STORAGE_KEYS.EXPENSES, next);
      return next;
    });
    setNewExpenseTitle('');
    setNewExpenseAmount(0);

    const res = await upsertExpenseToSupabase(exp);
    if (res.success) {
      setSyncStatus(`Pengeluaran "${exp.title}" tersimpan & disinkronkan ke Supabase!`);
    }
  };

  const handleDeleteExpense = (exp: Expense) => {
    setDeleteConfirmModal({
      title: `Hapus Pengeluaran "${exp.title}"`,
      message: `Apakah Anda yakin ingin menghapus catatan pengeluaran "${exp.title}" (${formatRupiah(exp.amount)})?\nData akan dihapus dari penyimpanan lokal dan database Supabase.`,
      itemType: 'Pengeluaran',
      onConfirm: async () => {
        setExpenses(prev => {
          const next = prev.filter(e => e.id !== exp.id);
          setStorageData(STORAGE_KEYS.EXPENSES, next);
          return next;
        });
        const res = await deleteExpenseFromSupabase(exp.id, exp.title);
        if (res.success) {
          setSyncStatus(`✓ Pengeluaran "${exp.title}" telah dihapus dari lokal & Supabase.`);
        } else {
          setSyncStatus(`✓ Pengeluaran "${exp.title}" dihapus dari lokal.`);
        }
      }
    });
  };

  const handleDeleteOrder = (order: Order) => {
    setDeleteConfirmModal({
      title: `Hapus Transaksi "${order.orderNumber}"`,
      message: `Apakah Anda yakin ingin menghapus transaksi "${order.orderNumber}"?\nData akan dihapus dari penyimpanan lokal dan database Supabase.`,
      itemType: 'Transaksi POS',
      onConfirm: async () => {
        setOrders(prev => {
          const next = prev.filter(o => o.id !== order.id && o.orderNumber !== order.orderNumber);
          setStorageData(STORAGE_KEYS.ORDERS, next);
          return next;
        });
        const res = await deleteOrderFromSupabase(order.id, order.orderNumber);
        if (res.success) {
          setSyncStatus(`✓ Transaksi "${order.orderNumber}" telah dihapus dari lokal & Supabase.`);
        } else {
          setSyncStatus(`✓ Transaksi "${order.orderNumber}" dihapus dari lokal.`);
        }
      }
    });
  };

  const openOrderDetailsModal = (o: Order) => {
    setSelectedOrderModal(o);
    setEditingOrderStatus(o.orderStatus);
    setEditingPaymentStatus(o.paymentStatus);
    setEditingTrackingNumber(o.trackingNumber || '');
    setEditingNotes(o.notes || '');
  };

  const handleQuickUpdateOrderStatus = async (order: Order, newStatus: Order['orderStatus']) => {
    const updatedOrder: Order = { ...order, orderStatus: newStatus };
    setOrders(prev => {
      const next = prev.map(o => o.id === order.id ? updatedOrder : o);
      setStorageData(STORAGE_KEYS.ORDERS, next);
      return next;
    });
    if (selectedOrderModal && selectedOrderModal.id === order.id) {
      setSelectedOrderModal(updatedOrder);
      setEditingOrderStatus(newStatus);
    }
    const res = await upsertOrderToSupabase(updatedOrder);
    if (res.success) {
      setSyncStatus(`✓ Status pesanan #${order.orderNumber} diubah ke ${newStatus} & tersimpan ke Supabase.`);
    } else {
      setSyncStatus(`✓ Status pesanan #${order.orderNumber} diubah di lokal.`);
    }
  };

  const handleQuickUpdatePaymentStatus = async (order: Order, newPaymentStatus: Order['paymentStatus']) => {
    const updatedOrder: Order = { ...order, paymentStatus: newPaymentStatus };
    setOrders(prev => {
      const next = prev.map(o => o.id === order.id ? updatedOrder : o);
      setStorageData(STORAGE_KEYS.ORDERS, next);
      return next;
    });
    if (selectedOrderModal && selectedOrderModal.id === order.id) {
      setSelectedOrderModal(updatedOrder);
      setEditingPaymentStatus(newPaymentStatus);
    }
    const res = await upsertOrderToSupabase(updatedOrder);
    if (res.success) {
      setSyncStatus(`✓ Pembayaran #${order.orderNumber} diubah ke ${newPaymentStatus} & tersimpan ke Supabase.`);
    } else {
      setSyncStatus(`✓ Pembayaran #${order.orderNumber} diubah di lokal.`);
    }
  };

  const handleSaveOrderDetails = async () => {
    if (!selectedOrderModal) return;
    const updatedOrder: Order = {
      ...selectedOrderModal,
      orderStatus: editingOrderStatus,
      paymentStatus: editingPaymentStatus,
      trackingNumber: editingTrackingNumber.trim() || undefined,
      notes: editingNotes.trim() || undefined,
    };

    setOrders(prev => {
      const next = prev.map(o => o.id === selectedOrderModal.id ? updatedOrder : o);
      setStorageData(STORAGE_KEYS.ORDERS, next);
      return next;
    });
    setSelectedOrderModal(updatedOrder);

    const res = await upsertOrderToSupabase(updatedOrder);
    if (res.success) {
      setSyncStatus(`✓ Detail pesanan #${updatedOrder.orderNumber} berhasil disimpan ke Supabase!`);
    } else {
      setSyncStatus(`✓ Detail pesanan disimpan di lokal.`);
    }
  };

  const handleSyncOrdersFromSupabase = async () => {
    setIsSyncingOrders(true);
    setSyncStatus('Sedang mengambil data pesanan dari Supabase...');
    try {
      const remoteOrders = await fetchOrdersFromSupabase();
      if (remoteOrders && remoteOrders.length >= 0) {
        setOrders(remoteOrders);
        setStorageData(STORAGE_KEYS.ORDERS, remoteOrders);
        setSyncStatus(`✓ Berhasil menarik ${remoteOrders.length} pesanan dari Supabase!`);
      } else {
        setSyncStatus('Gagal menarik pesanan dari Supabase atau belum ada data.');
      }
    } catch (err: any) {
      setSyncStatus(`Gagal narik pesanan: ${err.message}`);
    } finally {
      setIsSyncingOrders(false);
    }
  };

  const handleSyncAllOrdersToSupabase = async () => {
    setIsSyncingOrders(true);
    setSyncStatus('Sedang mengunggah seluruh pesanan ke Supabase...');
    try {
      let count = 0;
      for (const ord of orders) {
        const res = await upsertOrderToSupabase(ord);
        if (res.success) count++;
      }
      setSyncStatus(`✓ Berhasil mengunggah ${count} dari ${orders.length} pesanan ke Supabase!`);
    } catch (err: any) {
      setSyncStatus(`Gagal unggah pesanan: ${err.message}`);
    } finally {
      setIsSyncingOrders(false);
    }
  };

  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSelectedProductId || !manualSelectedVolumeId) {
      alert('Pilih produk dan kemasan terlebih dahulu!');
      return;
    }
    const prod = products.find(p => p.id === manualSelectedProductId);
    const vol = prod?.volumes.find(v => v.id === manualSelectedVolumeId);
    if (!prod || !vol) return;

    const subtotal = vol.price * manualQty;
    const totalCogs = (vol.costPrice || vol.price * 0.6) * manualQty;
    const totalAmount = subtotal + manualShippingFee;

    const newOrder: Order = {
      id: `ord_man_${Date.now()}`,
      orderNumber: `PLB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      customerName: manualCustomerName || 'Pelanggan Toko',
      customerPhone: manualCustomerPhone || '-',
      customerAddress: manualCustomerAddress || 'Batang, Jawa Tengah',
      items: [{
        productId: prod.id,
        volumeId: vol.id,
        productName: prod.name,
        volumeName: vol.name || 'Varian',
        volumeMl: vol.volumeMl || 250,
        unitPrice: vol.price,
        originalPrice: vol.originalPrice || vol.price,
        cogs: vol.cogs || 0,
        quantity: manualQty,
        imageUrl: prod.imageUrl || '',
      }],
      subtotal,
      discountAmount: 0,
      shippingFee: manualShippingFee,
      shippingType: manualShippingFee > 0 ? 'DISTANCE_LOCAL' : 'TAKEAWAY',
      shippingDetail: manualShippingFee > 0 ? 'Pengiriman Lokal' : 'Ambil di Toko',
      totalAmount,
      totalCogs,
      paymentMethod: manualPaymentMethod,
      paymentStatus: manualPaymentStatus,
      orderStatus: 'PROCESSED',
      isPosSale: true,
      createdAt: new Date().toISOString(),
    };

    setOrders(prev => {
      const next = [newOrder, ...prev];
      setStorageData(STORAGE_KEYS.ORDERS, next);
      return next;
    });

    const res = await upsertOrderToSupabase(newOrder);
    if (res.success) {
      setSyncStatus(`✓ Pesanan manual #${newOrder.orderNumber} berhasil dicatat & tersimpan ke Supabase!`);
    } else {
      setSyncStatus(`✓ Pesanan manual dicatat di lokal.`);
    }

    setIsAddManualOrderOpen(false);
    setManualCustomerName('');
    setManualCustomerPhone('');
    setManualCustomerAddress('');
    setManualQty(1);
    setManualShippingFee(0);
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsedProds = await parseProductsExcel(file);
      if (parsedProds.length > 0) {
        setProducts(prev => [...(parsedProds as Product[]), ...prev]);
        alert(`Berhasil mengimpor ${parsedProds.length} produk dari Excel!`);
      }
    } catch (err: any) {
      alert(`Gagal impor Excel: ${err.message}`);
    }
  };

  const handleSyncSheets = async () => {
    setSyncStatus('Sedang mengirim data ke Google Sheets...');
    const res = await syncDataToGoogleSheets(settings.googleSheetsWebappUrl);
    setSyncStatus(res.message);
  };

  const openNewUserModal = () => {
    setEditingUser(null);
    setUserFormName('');
    setUserFormEmail('');
    setUserFormPhone('');
    setUserFormRole('pelanggan');
    setUserFormIsActive(true);
    setUserModalOpen(true);
  };

  const openEditUserModal = (u: User) => {
    setEditingUser(u);
    setUserFormName(u.name);
    setUserFormEmail(u.email);
    setUserFormPhone(u.phone || '');
    setUserFormRole(u.role);
    setUserFormIsActive(u.isActive !== false);
    setUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormName || (!userFormEmail && !userFormPhone)) return;

    if (editingUser) {
      const updatedUserObj: User = {
        ...editingUser,
        name: userFormName,
        email: userFormEmail,
        phone: userFormPhone,
        role: userFormRole,
        isActive: userFormIsActive,
      };
      const updated = users.map(u => u.id === editingUser.id ? updatedUserObj : u);
      setUsers(updated);
      upsertUserToSupabase(updatedUserObj).catch(err => console.warn('Supabase user save error:', err));
      if (currentUser && currentUser.id === editingUser.id) {
        setCurrentUser(updatedUserObj);
      }
    } else {
      const newUser: User = {
        id: `usr-${Date.now()}`,
        name: userFormName,
        email: userFormEmail || `${userFormPhone}@parfumlaundry.com`,
        phone: userFormPhone,
        role: userFormRole,
        isActive: userFormIsActive,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setUsers([newUser, ...users]);
      upsertUserToSupabase(newUser).catch(err => console.warn('Supabase user save error:', err));
    }
    setUserModalOpen(false);
  };

  const handleChangeUserRoleDirect = (userId: string, newRole: UserRole) => {
    const updated = users.map(u => {
      if (u.id === userId) {
        return { ...u, role: newRole, customPermissions: undefined };
      }
      return u;
    });
    setUsers(updated);
    if (currentUser && currentUser.id === userId) {
      setCurrentUser({ ...currentUser, role: newRole, customPermissions: undefined });
    }
  };

  const handleToggleUserActive = (userId: string) => {
    const updated = users.map(u => {
      if (u.id === userId) {
        return { ...u, isActive: !u.isActive };
      }
      return u;
    });
    setUsers(updated);
  };

  const handleDeleteUser = (userId: string) => {
    if (currentUser && currentUser.id === userId) {
      setSyncStatus('⚠️ Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.');
      return;
    }
    const targetUser = users.find(u => u.id === userId);
    const userName = targetUser ? targetUser.name : 'Pengguna';

    setDeleteConfirmModal({
      title: `Hapus Akun Pengguna "${userName}"`,
      message: `Apakah Anda yakin ingin menghapus akun "${userName}" dari sistem?\nData akan dihapus dari penyimpanan lokal dan database Supabase.`,
      itemType: 'Akun Pengguna',
      onConfirm: async () => {
        const nextUsers = users.filter(u => u.id !== userId);
        setUsers(nextUsers);
        setStorageData(STORAGE_KEYS.USERS, nextUsers);
        const res = await deleteUserFromSupabase(userId);
        if (res.success) {
          setSyncStatus('✓ Akun pengguna telah dihapus dari lokal & Supabase.');
        } else {
          setSyncStatus('✓ Akun pengguna dihapus dari penyimpanan lokal.');
        }
      }
    });
  };

  const openPermissionsModal = (u: User) => {
    setPermissionsUser(u);
    setTempPermissions(getEffectivePermissions(u));
    setPermissionsModalOpen(true);
  };

  const handleSavePermissions = () => {
    if (!permissionsUser) return;
    const updated = users.map(u => {
      if (u.id === permissionsUser.id) {
        return {
          ...u,
          customPermissions: tempPermissions,
        };
      }
      return u;
    });
    setUsers(updated);
    if (currentUser && currentUser.id === permissionsUser.id) {
      setCurrentUser({ ...currentUser, customPermissions: tempPermissions });
    }
    setPermissionsModalOpen(false);
  };

  const adminMenuTabs = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, badge: null },
    { id: 'products', label: 'Produk & Stok', icon: Package, badge: products.length },
    { id: 'categories', label: 'Kelola Kategori', icon: Layers, badge: categories.length },
    { id: 'orders', label: 'Transaksi POS & Online', icon: ShoppingCart, badge: orders.length },
    { id: 'financials', label: 'Laporan Laba Rugi', icon: TrendingUp, badge: null },
    { id: 'crm', label: 'CRM Pelanggan', icon: Users, badge: customers.length },
    { id: 'users', label: 'Akun & Hak Akses', icon: UserCheck, badge: users.length },
    { id: 'coupons', label: 'Kupon Diskon', icon: Ticket, badge: coupons.length },
    { id: 'banners', label: 'Banner Carousel', icon: ImageIcon, badge: banners.length },
    { id: 'settings', label: 'Pengaturan Sistem', icon: Settings, badge: null },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Admin Panel Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 bg-slate-900 text-white rounded-3xl shadow-xl">
        <div className="flex items-center gap-3.5">
          {settings.appLogoUrl ? (
            <img src={settings.appLogoUrl} alt="Logo Toko" className="w-12 h-12 object-cover rounded-2xl border-2 border-indigo-500/50 shadow-md shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0">
              {settings.storeName ? settings.storeName.charAt(0).toUpperCase() : 'P'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-0.5">
              <ShieldCheck className="w-4 h-4" /> Panel Kontrol Administrator
            </div>
            <h2 className="text-xl sm:text-2xl font-black">{settings.storeName}</h2>
            <p className="text-xs text-slate-400">Atur semua fitur toko, produk, kategori, kupon, banner, transaksi, dan integrasi cloud.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleClearAllDummyData}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            title="Kosongkan seluruh data dummy dari lokal dan database Supabase"
          >
            <Trash2 className="w-4 h-4" /> Kosongkan Data Dummy Store
          </button>
          <button
            onClick={onOpenDeploymentGuide}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" /> Panduan Deployment Vercel & Supabase
          </button>
        </div>
      </div>

      {/* Sync Status Toast/Notification Banner */}
      {syncStatus && (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 rounded-2xl flex items-center justify-between text-xs font-bold shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>{syncStatus}</span>
          </div>
          <button onClick={() => setSyncStatus('')} className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SIDEBAR NAVIGATION LAYOUT (Main content Left, Navigation Sidebar Right) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* MOBILE NAVIGATION BAR (Horizontal Scroll + Quick Selector, Hidden on Desktop) */}
        <div className="lg:hidden w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Menu Admin:</span>
            </div>
            
            {/* Quick Mobile Dropdown */}
            <select
              value={activeAdminTab}
              onChange={(e) => setActiveAdminTab(e.target.value as any)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {adminMenuTabs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} {t.badge !== null ? `(${t.badge})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Horizontal Scrollable Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {adminMenuTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeAdminTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveAdminTab(tab.id as any)}
                  className={`shrink-0 px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/50'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {tab.badge !== null && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-black rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN TAB CONTENT RENDERER (LEFT SIDE ON DESKTOP) */}
        <div className="flex-1 w-full min-w-0">
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeAdminTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 block mb-1">Total Omzet Penjualan</span>
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatRupiah(totalRevenue)}</p>
                  <span className="text-[10px] text-emerald-600 font-semibold">{orders.length} Transaksi Selesai</span>
                </div>

                <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 block mb-1">Laba Bersih (Net Profit)</span>
                  <p className="text-2xl font-black text-emerald-600">{formatRupiah(netProfit)}</p>
                  <span className="text-[10px] text-slate-500">Omzet dikurangi HPP & Beban</span>
                </div>

                <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 block mb-1">Pelanggan CRM Terdaftar</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{customers.length} Orang</p>
                  <span className="text-[10px] text-purple-600 font-semibold">Program Poin Loyalty</span>
                </div>

                <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 block mb-1">Total Varian Aroma</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{products.length} Varian</p>
                  <span className="text-[10px] text-amber-600 font-semibold">Tersedia Botol & Jirigen</span>
                </div>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Aksi Cepat Manajemen Kasir & Toko</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={openNewProductModal}
                    className="p-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-2xl text-xs font-bold text-left flex items-center justify-between border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
                  >
                    <span>+ Tambah Produk Varian Baru</span>
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={openNewCouponModal}
                    className="p-4 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-2xl text-xs font-bold text-left flex items-center justify-between border border-purple-200 dark:border-purple-800 hover:bg-purple-100"
                  >
                    <span>+ Buat Kupon Diskon Baru</span>
                    <Ticket className="w-4 h-4" />
                  </button>
                  <button
                    onClick={openNewBannerModal}
                    className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-bold text-left flex items-center justify-between border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                  >
                    <span>+ Tambah Banner Promo Carousel</span>
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS & STOCK MANAGEMENT */}
          {activeAdminTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Kelola Produk, Varian & Stok</h3>
                  <p className="text-xs text-slate-500">Tambah, Edit, Hapus produk dan atur harga kemasan botol & jirigen.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={openNewProductModal}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                  >
                    <Plus className="w-4 h-4" /> Tambah Produk
                  </button>

                  <button
                    onClick={handleSyncAllToSupabase}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                    title="Kirim semua data produk & kategori ke Supabase"
                  >
                    <Database className="w-3.5 h-3.5" /> Sync Ke Supabase
                  </button>

                  <button
                    onClick={handleClearAllDummyData}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                    title="Kosongkan seluruh data dummy dari aplikasi"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Kosongkan Data Dummy
                  </button>

                  <button
                    onClick={() => exportProductsToExcel(products)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Excel
                  </button>

                  <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm">
                    <Upload className="w-3.5 h-3.5" /> Import Excel
                    <input type="file" accept=".xlsx, .xls" onChange={handleExcelImport} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase">
                    <tr>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Gambar & Produk</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Kemasan & Harga Ritel</th>
                      <th className="p-3 text-right">Aksi Management</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-mono font-bold text-indigo-600">{p.code}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">{p.name}</span>
                              {p.isPopular && <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.2 rounded font-bold uppercase">Best Seller</span>}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold block text-slate-800 dark:text-slate-200">{p.category}</span>
                        </td>
                        <td className="p-3 space-y-1">
                          {p.volumes.map(v => (
                            <div key={v.id} className="text-[11px] text-slate-600 dark:text-slate-400">
                              {v.name}: <strong className="text-slate-900 dark:text-white">{formatRupiah(v.price)}</strong> <span className="text-indigo-600">(Stok: {v.stock})</span>
                            </div>
                          ))}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditProductModal(p)}
                              className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 rounded-lg text-xs font-bold flex items-center gap-1"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg"
                              title="Hapus Produk"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORIES MANAGEMENT */}
          {activeAdminTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Kelola Kategori Produk</h3>
                  <p className="text-xs text-slate-500">Tambah, Edit, dan Hapus Kategori Produk POS.</p>
                </div>
                <button
                  onClick={openNewCategoryModal}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Plus className="w-4 h-4" /> Tambah Kategori
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(cat => {
                  const prodCount = products.filter(p => p.category === cat.name).length;
                  return (
                    <div key={cat.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{cat.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{cat.description || 'Kategori Produk Laundry'}</p>
                        <span className="text-[10px] text-indigo-600 font-bold mt-1 inline-block">{prodCount} Produk terkait</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditCategoryModal(cat)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: TRANSACTIONS & ORDER MANAGEMENT */}
          {activeAdminTab === 'orders' && (
            <div className="space-y-5">
              {/* METRIC SUMMARY CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Transaksi</span>
                    <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{orders.length} Pesanan</h4>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Omzet Lunas</span>
                    <h4 className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(orders.filter(o => o.paymentStatus === 'PAID').reduce((s, o) => s + o.totalAmount, 0))}
                    </h4>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Perlu Diproses</span>
                    <h4 className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
                      {orders.filter(o => o.orderStatus === 'PENDING' || o.orderStatus === 'PROCESSED').length} Pesanan
                    </h4>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/60 rounded-xl text-purple-600 dark:text-purple-400">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Dalam Pengiriman</span>
                    <h4 className="text-base sm:text-lg font-black text-purple-600 dark:text-purple-400">
                      {orders.filter(o => o.orderStatus === 'SHIPPED').length} Pesanan
                    </h4>
                  </div>
                </div>
              </div>

              {/* ACTION & SYNC HEADER */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" /> Kelola Pesanan & Database Supabase
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Ubah status pesanan, input nomor resi, cetak struk POS, dan pastikan data tersimpan otomatis di Supabase.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSyncOrdersFromSupabase}
                    disabled={isSyncingOrders}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
                    title="Tarik data pesanan terbaru dari Supabase"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingOrders ? 'animate-spin' : ''}`} /> Tarik Supabase
                  </button>

                  <button
                    onClick={handleSyncAllOrdersToSupabase}
                    disabled={isSyncingOrders}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
                    title="Unggah seluruh pesanan lokal ke Supabase"
                  >
                    <CloudUpload className="w-3.5 h-3.5 text-indigo-600" /> Unggah Supabase
                  </button>

                  <button
                    onClick={() => exportOrdersToExcel(filteredOrders)}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Excel
                  </button>

                  <button
                    onClick={() => setIsAddManualOrderOpen(true)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <PlusCircle className="w-4 h-4" /> + Catat Manual
                  </button>
                </div>
              </div>

              {/* SEARCH & FILTER TOOLBAR */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari no order (PLB-...), nama pelanggan, HP, atau alamat..."
                      value={orderSearchTerm}
                      onChange={(e) => setOrderSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
                    />
                    {orderSearchTerm && (
                      <button
                        onClick={() => setOrderSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={orderPaymentFilter}
                      onChange={(e) => setOrderPaymentFilter(e.target.value as any)}
                      className="bg-slate-50 dark:bg-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300"
                    >
                      <option value="ALL">Semua Pembayaran</option>
                      <option value="PAID">Lunas (PAID)</option>
                      <option value="UNPAID">Belum Bayar (UNPAID)</option>
                      <option value="REFUNDED">Refunded</option>
                    </select>

                    <select
                      value={orderChannelFilter}
                      onChange={(e) => setOrderChannelFilter(e.target.value as any)}
                      className="bg-slate-50 dark:bg-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300"
                    >
                      <option value="ALL">Semua Saluran</option>
                      <option value="POS">POS Kasir</option>
                      <option value="ONLINE">Online Checkout</option>
                    </select>
                  </div>
                </div>

                {/* STATUS FILTER TABS */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 mr-1 shrink-0">Filter Status:</span>
                  {[
                    { id: 'ALL', label: 'Semua Status' },
                    { id: 'PENDING', label: 'PENDING' },
                    { id: 'PROCESSED', label: 'DIPROSES' },
                    { id: 'SHIPPED', label: 'DIKIRIM' },
                    { id: 'DELIVERED', label: 'SELESAI' },
                    { id: 'CANCELLED', label: 'DIBATALKAN' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setOrderStatusFilter(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl font-extrabold shrink-0 transition-all ${
                        orderStatusFilter === tab.id
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ORDERS TABLE */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3.5">No. Order & Waktu</th>
                        <th className="p-3.5">Pelanggan & Kontak</th>
                        <th className="p-3.5">Detail Item</th>
                        <th className="p-3.5">Total & COGS</th>
                        <th className="p-3.5">Status Pembayaran</th>
                        <th className="p-3.5">Status Pesanan</th>
                        <th className="p-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">
                            Tidak ada pesanan yang sesuai dengan filter pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map(o => {
                          const profit = o.totalAmount - o.totalCogs;
                          return (
                            <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                              {/* ORDER NUMBER & CHANNEL */}
                              <td className="p-3.5 align-top">
                                <button
                                  onClick={() => openOrderDetailsModal(o)}
                                  className="font-mono font-bold text-indigo-600 hover:underline block text-xs"
                                >
                                  {o.orderNumber}
                                </button>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                    o.isPosSale
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                      : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300'
                                  }`}>
                                    {o.isPosSale ? 'Kasir POS' : 'Online'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 block mt-1">
                                  {formatDateIndo(o.createdAt)}
                                </span>
                              </td>

                              {/* CUSTOMER & CONTACT */}
                              <td className="p-3.5 align-top">
                                <span className="font-bold text-slate-900 dark:text-slate-100 block">{o.customerName}</span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-slate-500 font-mono text-[11px]">{o.customerPhone || '-'}</span>
                                  {o.customerPhone && o.customerPhone !== '-' && (
                                    <a
                                      href={`https://wa.me/${o.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo Kak ${o.customerName}, mengenai pesanan #${o.orderNumber} status saat ini: ${o.orderStatus}`)}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded"
                                      title="Kirim pesan WhatsApp"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">{o.customerAddress}</span>
                              </td>

                              {/* ITEMS SUMMARY */}
                              <td className="p-3.5 align-top">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                                  {o.items.length} item ({o.items.reduce((s, i) => s + i.quantity, 0)} pcs)
                                </span>
                                <ul className="text-[10px] text-slate-500 space-y-0.5 mt-0.5">
                                  {o.items.slice(0, 2).map((it, idx) => (
                                    <li key={idx} className="truncate max-w-[180px]">
                                      • {it.productName} ({it.volumeName}) x{it.quantity}
                                    </li>
                                  ))}
                                  {o.items.length > 2 && (
                                    <li className="text-indigo-500 font-bold">+{o.items.length - 2} item lainnya</li>
                                  )}
                                </ul>
                              </td>

                              {/* TOTAL & PROFIT */}
                              <td className="p-3.5 align-top">
                                <span className="font-extrabold text-slate-900 dark:text-white block text-xs">
                                  {formatRupiah(o.totalAmount)}
                                </span>
                                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                                  Profit: {formatRupiah(profit)}
                                </span>
                                {o.shippingFee > 0 && (
                                  <span className="text-[9px] text-slate-400 block mt-0.5">
                                    Ongkir: {formatRupiah(o.shippingFee)}
                                  </span>
                                )}
                              </td>

                              {/* PAYMENT STATUS DROPDOWN */}
                              <td className="p-3.5 align-top">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block">{o.paymentMethod}</span>
                                  <select
                                    value={o.paymentStatus}
                                    onChange={(e) => handleQuickUpdatePaymentStatus(o, e.target.value as any)}
                                    className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                                      o.paymentStatus === 'PAID'
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300'
                                        : o.paymentStatus === 'UNPAID'
                                        ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300'
                                        : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                                    }`}
                                  >
                                    <option value="UNPAID">UNPAID (Belum Bayar)</option>
                                    <option value="PAID">PAID (Lunas)</option>
                                    <option value="REFUNDED">REFUNDED</option>
                                  </select>
                                </div>
                              </td>

                              {/* ORDER STATUS DROPDOWN */}
                              <td className="p-3.5 align-top">
                                <select
                                  value={o.orderStatus}
                                  onChange={(e) => handleQuickUpdateOrderStatus(o, e.target.value as any)}
                                  className={`text-[11px] font-extrabold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer shadow-sm ${
                                    o.orderStatus === 'PENDING'
                                      ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200'
                                      : o.orderStatus === 'PROCESSED'
                                      ? 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/90 dark:text-sky-200'
                                      : o.orderStatus === 'SHIPPED'
                                      ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/90 dark:text-purple-200'
                                      : o.orderStatus === 'DELIVERED'
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200'
                                      : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200'
                                  }`}
                                >
                                  <option value="PENDING">PENDING (Menunggu)</option>
                                  <option value="PROCESSED">DIPROSES (Disiapkan)</option>
                                  <option value="SHIPPED">DIKIRIM (Kurir)</option>
                                  <option value="DELIVERED">SELESAI (Diterima)</option>
                                  <option value="CANCELLED">DIBATALKAN</option>
                                </select>

                                {o.trackingNumber && (
                                  <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 block mt-1 font-bold">
                                    Resi: {o.trackingNumber}
                                  </span>
                                )}
                              </td>

                              {/* ACTIONS */}
                              <td className="p-3.5 align-top text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => openOrderDetailsModal(o)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/80 rounded-lg transition-all"
                                    title="Detail Invoice & Edit Resi"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => setPrintReceiptOrder(o)}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/80 rounded-lg transition-all"
                                    title="Cetak Struk Thermal POS"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteOrder(o)}
                                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/80 rounded-lg transition-all"
                                    title="Hapus Transaksi"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PROFIT & LOSS FINANCIAL REPORT */}
          {activeAdminTab === 'financials' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-sm">Laporan Laba Rugi Operasional</h3>
                  <p className="text-xs text-slate-400">Pencatatan Omzet, HPP Bahan Baku, dan Beban Operasional.</p>
                </div>
                <button
                  onClick={() => exportProfitLossPDF(totalRevenue, totalCogs, expenses, totalExpenses, '', '')}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <FileText className="w-4 h-4" /> Download PDF Laporan Laba Rugi
                </button>
              </div>

              {/* Add Expense Form */}
              <form onSubmit={handleAddExpense} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Catat Beban Operasional Baru:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Judul Pengeluaran (sewa, listrik, botol)..."
                    value={newExpenseTitle}
                    onChange={(e) => setNewExpenseTitle(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700"
                  />
                  <select
                    value={newExpenseCategory}
                    onChange={(e) => setNewExpenseCategory(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700"
                  >
                    <option value="Sewa">Sewa Tempat</option>
                    <option value="Listrik & Air">Listrik & Air</option>
                    <option value="Gaji Karya">Gaji Karyawan</option>
                    <option value="Kemasan & Botol">Kemasan & Botol</option>
                    <option value="Bahan Baku">Bahan Baku Konsentrat</option>
                    <option value="Transportasi">Transportasi</option>
                  </select>
                  <input
                    type="number"
                    required
                    placeholder="Jumlah (Rp)..."
                    value={newExpenseAmount || ''}
                    onChange={(e) => setNewExpenseAmount(Number(e.target.value))}
                    className="bg-slate-50 dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
                  />
                  <button
                    type="submit"
                    className="py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Tambah Beban
                  </button>
                </div>
              </form>

              {/* Expenses List Table with Delete Option */}
              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Daftar Pengeluaran & Beban Operasional:</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase">
                      <tr>
                        <th className="p-3">Pengeluaran</th>
                        <th className="p-3">Kategori</th>
                        <th className="p-3">Tanggal</th>
                        <th className="p-3">Nominal</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {expenses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400">Belum ada catatan pengeluaran operasional.</td>
                        </tr>
                      ) : (
                        expenses.map(exp => (
                          <tr key={exp.id}>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{exp.title}</td>
                            <td className="p-3"><span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-slate-700 dark:text-slate-300">{exp.category}</span></td>
                            <td className="p-3">{exp.date}</td>
                            <td className="p-3 font-bold text-rose-600">{formatRupiah(exp.amount)}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleDeleteExpense(exp)}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-all"
                                title="Hapus Pengeluaran"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CRM CUSTOMERS MANAGEMENT */}
          {activeAdminTab === 'crm' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-sm">CRM Pelanggan & Loyalty Points</h3>
                  <p className="text-xs text-slate-500">Kelola database pelanggan, tier membership, dan poin diskon.</p>
                </div>
                <button
                  onClick={openNewCustomerModal}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Plus className="w-4 h-4" /> Tambah Pelanggan
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase">
                    <tr>
                      <th className="p-3">Nama Pelanggan</th>
                      <th className="p-3">No. Whatsapp</th>
                      <th className="p-3">Kecamatan</th>
                      <th className="p-3">Tier Loyalty</th>
                      <th className="p-3">Poin</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {customers.map(c => (
                      <tr key={c.id}>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{c.name}</td>
                        <td className="p-3 font-mono">{c.phone}</td>
                        <td className="p-3">{c.district || 'Batang'}</td>
                        <td className="p-3 font-semibold text-purple-600">{c.membershipTier}</td>
                        <td className="p-3 font-bold text-amber-500">{c.points} Poin</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => openEditCustomerModal(c)}
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(c)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                              title="Hapus Pelanggan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: COUPONS MANAGEMENT */}
          {activeAdminTab === 'coupons' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-sm">Kelola Kupon Diskon</h3>
                  <p className="text-xs text-slate-500">Buat kode promo voucher untuk checkout pelanggan.</p>
                </div>
                <button
                  onClick={openNewCouponModal}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Plus className="w-4 h-4" /> Tambah Kupon Diskon
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase">
                    <tr>
                      <th className="p-3">Kode Voucher</th>
                      <th className="p-3">Diskon</th>
                      <th className="p-3">Min. Belanja</th>
                      <th className="p-3">Kadaluarsa</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {coupons.map(cp => (
                      <tr key={cp.id}>
                        <td className="p-3 font-mono font-bold text-indigo-600">{cp.code}</td>
                        <td className="p-3 font-bold text-emerald-600">
                          {cp.discountType === 'percentage' ? `${cp.discountValue}%` : formatRupiah(cp.discountValue)}
                        </td>
                        <td className="p-3">{formatRupiah(cp.minPurchase)}</td>
                        <td className="p-3">{cp.expiresAt}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${cp.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {cp.isActive ? 'Aktif' : 'Non-Aktif'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => openEditCouponModal(cp)}
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-bold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(cp)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                              title="Hapus Kupon"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: BANNER CAROUSEL MANAGEMENT */}
          {activeAdminTab === 'banners' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-sm">Kelola Banner Carousel Home</h3>
                  <p className="text-xs text-slate-500">Atur gambar slide promosi halaman utama aplikasi.</p>
                </div>
                <button
                  onClick={openNewBannerModal}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Plus className="w-4 h-4" /> Tambah Banner Promo
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banners.map(b => (
                  <div key={b.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between">
                    <div>
                      <img src={b.imageUrlDesktop} alt={b.title} className="w-full h-36 object-cover bg-slate-900" />
                      <div className="p-4 space-y-1">
                        {b.badge && <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded-full uppercase">{b.badge}</span>}
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">{b.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{b.subtitle}</p>
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex justify-between items-center border-t border-slate-100 dark:border-slate-800/80 mt-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {b.isActive ? 'Tampil' : 'Sembunyi'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditBannerModal(b)}
                          className="px-3 py-1 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-lg"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(b)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Hapus Banner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: SYSTEM SETTINGS (Profile Toko, Titik Asal Toko/Origin, Google Sheets, Supabase, Pakasir) */}
          {activeAdminTab === 'settings' && (
            <div className="space-y-6">
              
              {/* 1. STORE PROFILE & ORIGIN LOCATION SETTINGS */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 rounded-2xl">
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Profil Toko & Titik Asal Toko (Origin Location)</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Atur alamat toko, titik GPS peta OpenStreetMap, dan tarif ongkir lokal per kilometer.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      setStorageData(STORAGE_KEYS.SETTINGS, settings);
                      await upsertSettingsToSupabase(settings);
                      alert('✓ Pengaturan Profil Toko, Logo Aplikasi, & Titik Asal Toko berhasil disimpan (Lokal & Supabase)!');
                    }}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all shrink-0"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan Toko</span>
                  </button>
                </div>

                {/* LOGO APLIKASI & IKON INSTALL PWA */}
                <div className="p-4 bg-gradient-to-br from-indigo-50/70 to-purple-50/70 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/60 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                          Logo Toko & Ikon Install Aplikasi HP (PWA Icon)
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Ubah logo merek toko yang akan tampil di Topbar, Sidebar, Nota Kasir, Favicon, serta Ikon Aplikasi saat di-install di HP
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Preview Box */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-dashed border-indigo-400/80 bg-white dark:bg-slate-900 p-1 flex items-center justify-center overflow-hidden shadow-md relative group">
                        {settings.appLogoUrl ? (
                          <img
                            src={settings.appLogoUrl}
                            alt="Logo Toko"
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-full h-full rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex flex-col items-center justify-center text-white font-black text-2xl">
                            {settings.storeName ? settings.storeName.charAt(0).toUpperCase() : 'P'}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">Preview Logo</span>
                    </div>

                    {/* Actions & Input */}
                    <div className="flex-1 space-y-3 w-full">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Unggah Logo dari Galeri / Kamera HP / PC:
                        </label>
                        <input
                          type="file"
                          id="appLogoFileInput"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const url = await uploadImageToSupabaseStorage(file, 'store');
                              setSettings((prev) => ({ ...prev, appLogoUrl: url }));
                            } catch (err) {
                              console.error('Error uploading logo:', err);
                            }
                          }}
                          className="hidden"
                        />
                        <div className="flex flex-wrap gap-2">
                          <label
                            htmlFor="appLogoFileInput"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-sm transition-all"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Pilih Gambar Logo dari Galeri</span>
                          </label>

                          {settings.appLogoUrl && (
                            <button
                              type="button"
                              onClick={() => setSettings({ ...settings, appLogoUrl: '' })}
                              className="px-3 py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/80 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus Logo Custom</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Atau Tulis URL Gambar Logo (Opsional):
                        </label>
                        <input
                          type="text"
                          placeholder="https://domain.com/logo.png"
                          value={settings.appLogoUrl || ''}
                          onChange={(e) => setSettings({ ...settings, appLogoUrl: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono text-indigo-600 dark:text-indigo-400"
                        />
                      </div>

                      <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium bg-indigo-100/70 dark:bg-indigo-950/50 p-2.5 rounded-xl border border-indigo-200/60 dark:border-indigo-900/60 flex items-start gap-1.5">
                        <Sparkles className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                        <span>
                          <strong>Otomatis Terintegrasi:</strong> Logo ini akan langsung menjadi Favicon Tab Browser, Ikon Utama saat aplikasi di-install ke HP (Add to Home Screen), serta Tampil di Navigation Bar, Sidebar, dan Nota Thermal Kasir.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Identity Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Toko:</label>
                    <input
                      type="text"
                      value={settings.storeName}
                      onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Teks Pengumuman Berjalan Header (Running Text):</span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Banner Atas Header</span>
                    </label>
                    <input
                      type="text"
                      value={settings.topAnnouncementText || ''}
                      onChange={(e) => setSettings({ ...settings, topAnnouncementText: e.target.value })}
                      placeholder="Contoh: Grosir & Eceran Parfum Laundry Batang • Free Delivery Batang Min. Belanja Rp 250.000 ..."
                      className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-100"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Teks ini akan otomatis bergerak (running text) di bagian banner paling atas header aplikasi.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tagline Toko:</label>
                    <input
                      type="text"
                      value={settings.tagline}
                      onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">No. WhatsApp Admin Toko:</label>
                    <input
                      type="text"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold text-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kota / Kabupaten:</label>
                    <input
                      type="text"
                      value={settings.city}
                      onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Alamat Lengkap Toko (Tampil di Nota & Checkout):</label>
                    <input
                      type="text"
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold"
                    />
                  </div>
                </div>

                {/* Map Coordinates Origin Section */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                      <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                        Pilih Titik GPS Asal Toko di Peta Interaktif (Origin):
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              const lat = Math.round(pos.coords.latitude * 10000) / 10000;
                              const lng = Math.round(pos.coords.longitude * 10000) / 10000;
                              setSettings({ ...settings, latitude: lat, longitude: lng });
                              alert(`✓ Koordinat GPS berhasil disesuaikan ke posisi Anda: Lat ${lat}, Lng ${lng}`);
                            },
                            (err) => {
                              alert(`Gagal mengambil GPS: ${err.message}`);
                            }
                          );
                        } else {
                          alert('Browser Anda tidak mendukung Geolocation GPS');
                        }
                      }}
                      className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Deteksi GPS Saya Saat Ini</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Latitude Asal Toko:
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={settings.latitude}
                        onChange={(e) => setSettings({ ...settings, latitude: Number(e.target.value) })}
                        className="w-full bg-white dark:bg-slate-900 text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Longitude Asal Toko:
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={settings.longitude}
                        onChange={(e) => setSettings({ ...settings, longitude: Number(e.target.value) })}
                        className="w-full bg-white dark:bg-slate-900 text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Interactive Map Picker for Store Location */}
                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-500">
                      Klik atau geser pada peta OpenStreetMap di bawah ini untuk menentukan titik lokasi toko Anda secara akurat:
                    </p>
                    <MapPicker
                      initialLat={settings.latitude}
                      initialLng={settings.longitude}
                      mode="STORE_ORIGIN"
                      onLocationSelect={(loc) => {
                        setSettings(prev => ({
                          ...prev,
                          latitude: loc.lat,
                          longitude: loc.lng,
                          ...(loc.addressLabel && loc.addressLabel !== 'Titik Pilihan di Peta' && loc.addressLabel !== 'Titik Asal Toko Pilihan di Peta' ? { address: loc.addressLabel } : {})
                        }));
                      }}
                    />
                  </div>
                </div>

                {/* Shipping Rate Parameters */}
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-3">
                  <h4 className="font-extrabold text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                    Parameter Tarif Ongkir Kurir Lokal per Kilometer
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Tarif per Km (Rp):</label>
                      <input
                        type="number"
                        value={settings.baseRatePerKm}
                        onChange={(e) => setSettings({ ...settings, baseRatePerKm: Number(e.target.value) })}
                        className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Biaya Minimal Kurir (Rp):</label>
                      <input
                        type="number"
                        value={settings.minDeliveryFee}
                        onChange={(e) => setSettings({ ...settings, minDeliveryFee: Number(e.target.value) })}
                        className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Minimal Order Gratis Ongkir (Rp):</label>
                      <input
                        type="number"
                        value={settings.freeDeliveryMinOrder}
                        onChange={(e) => setSettings({ ...settings, freeDeliveryMinOrder: Number(e.target.value) })}
                        className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 100% Free Zero-Config National Courier Engine & Courier Selection Checkboxes */}
                <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-600 text-white rounded-xl">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-emerald-900 dark:text-emerald-100 uppercase tracking-wider">
                          Pengaturan Ekspedisi & Kurir Nasional Aktif
                        </h4>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                          Centang kurir/ekspedisi yang ingin Anda tampilkan kepada pembeli saat checkout.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSettings({
                            ...settings,
                            enabledNationalCouriers: ALL_NATIONAL_COURIERS.map(c => c.code)
                          });
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-all"
                      >
                        Pilih Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSettings({
                            ...settings,
                            enabledNationalCouriers: ['JNT']
                          });
                        }}
                        className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold text-[11px] rounded-lg transition-all"
                      >
                        Reset (1 Kurir)
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 space-y-3 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>⚡ Daftar Ekspedisi Nasional (Centang untuk Menampilkan di Checkout):</span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-black bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                        {(settings.enabledNationalCouriers || ALL_NATIONAL_COURIERS.map(c => c.code)).length} dari {ALL_NATIONAL_COURIERS.length} Aktif
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                      {ALL_NATIONAL_COURIERS.map((courier) => {
                        const enabledList = settings.enabledNationalCouriers || ALL_NATIONAL_COURIERS.map(c => c.code);
                        const isChecked = enabledList.includes(courier.code);

                        return (
                          <label
                            key={courier.code}
                            className={`flex items-center justify-between p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                              isChecked
                                ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-slate-900 dark:text-white shadow-xs'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  let updated: string[];
                                  if (isChecked) {
                                    if (enabledList.length <= 1) {
                                      alert('Minimal 1 kurir nasional harus diaktifkan.');
                                      return;
                                    }
                                    updated = enabledList.filter(c => c !== courier.code);
                                  } else {
                                    updated = [...enabledList, courier.code];
                                  }
                                  setSettings({ ...settings, enabledNationalCouriers: updated });
                                }}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <div>
                                <span className={`font-black text-xs block ${isChecked ? 'text-slate-900 dark:text-white' : 'text-slate-400 line-through'}`}>
                                  {courier.name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium block">
                                  {courier.service}
                                </span>
                              </div>
                            </div>
                            <span className={`w-2.5 h-2.5 rounded-full ${courier.color} ${!isChecked ? 'opacity-30' : ''}`}></span>
                          </label>
                        );
                      })}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-2 border-t border-slate-100 dark:border-slate-800">
                      * Hanya kurir/ekspedisi yang dicentang di atas yang akan muncul pada pilihan pengiriman di halaman checkout/pembayaran pelanggan.
                    </p>
                  </div>
                </div>

              </div>

              {/* Google Sheets Integration */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                    <h3 className="font-extrabold text-base">Integrasi Google Sheets & Auto Database</h3>
                  </div>

                  <button
                    onClick={handleSyncSheets}
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md"
                  >
                    <RefreshCw className="w-4 h-4" /> Sync ke Google Sheets
                  </button>
                </div>

                {syncStatus && <p className="text-xs font-bold text-indigo-600">{syncStatus}</p>}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Google Sheets Web App URL:</label>
                  <input
                    type="text"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={settings.googleSheetsWebappUrl}
                    onChange={(e) => setSettings({ ...settings, googleSheetsWebappUrl: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-mono"
                  />
                </div>

                {/* Google Apps Script Code Generator */}
                <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-400">Kode Google Apps Script Auto-Create Sheets:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
                        setCopiedScript(true);
                        setTimeout(() => setCopiedScript(false), 3000);
                      }}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center gap-1"
                    >
                      {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedScript ? 'Tersalin!' : 'Salin Kode Script'}</span>
                    </button>
                  </div>
                  <pre className="max-h-40 overflow-y-auto font-mono text-[10px] text-slate-300 bg-slate-950 p-3 rounded-xl">
                    {GOOGLE_APPS_SCRIPT_CODE}
                  </pre>
                </div>
              </div>

              {/* Supabase Cloud Database Integration */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-6 h-6 text-emerald-500" />
                    <div>
                      <h3 className="font-extrabold text-base">Database Cloud Supabase (PostgreSQL)</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Terhubung secara aman menggunakan Vercel Environment Variables.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestSupabase}
                      disabled={testingSupabase}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${testingSupabase ? 'animate-spin' : ''}`} />
                      <span>{testingSupabase ? 'Pengujian...' : 'Tes Koneksi Supabase'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" /> Status Environment Variables Supabase (Vercel):
                    </span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md">
                      Aman & Terisolasi (Vercel Env Only)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">1. VITE_SUPABASE_URL</div>
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                        {settings.supabaseUrl ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {settings.supabaseUrl}
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">⚠️ Belum diatur di Vercel</span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">2. VITE_SUPABASE_ANON_KEY</div>
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                        {settings.supabaseAnonKey ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Terdeteksi (••••••••)
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">⚠️ Belum diatur di Vercel</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {supabaseTestResult && (
                  <div className={`p-3 rounded-xl text-xs font-bold ${supabaseTestResult.success ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200' : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200'}`}>
                    {supabaseTestResult.message}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handlePullDataFromSupabase}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <RefreshCw className="w-4 h-4" /> Tarik / Sync Data dari Supabase
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncAllToSupabase}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md"
                  >
                    <Database className="w-4 h-4" /> Bulk Sync Semua Data ke Supabase
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllDummyData}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md"
                  >
                    <Trash2 className="w-4 h-4" /> Hapus / Kosongkan Data Dummy Store
                  </button>
                </div>

                {/* SQL Schema Generator Copy Box */}
                <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-400">Skema Tabel SQL Supabase (products, orders, customers, expenses):</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                        setCopiedSql(true);
                        setTimeout(() => setCopiedSql(false), 3000);
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1"
                    >
                      {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSql ? 'Tersalin!' : 'Salin SQL Schema'}</span>
                    </button>
                  </div>
                  <pre className="max-h-40 overflow-y-auto font-mono text-[10px] text-slate-300 bg-slate-950 p-3 rounded-xl leading-relaxed">
                    {SUPABASE_SQL_SCHEMA}
                  </pre>
                </div>
              </div>

              {/* Pakasir Payment Gateway API Credentials */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-600 text-white rounded-xl">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        Integrasi Payment Gateway Pakasir (pakasir.com)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Proses pembayaran otomatis via QRIS & Virtual Account Bank (BNI, BRI, CIMB, Permata, dll).
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={pakasirTestResult?.loading}
                    onClick={async () => {
                      const slug = settings.pakasirProjectKey?.trim();
                      const key = settings.pakasirApiKey?.trim();
                      if (!slug || !key) {
                        setPakasirTestResult({
                          loading: false,
                          success: false,
                          message: '⚠️ Environment Variable Pakasir belum dikonfigurasi di Vercel.',
                          details: 'Pastikan VITE_PAKASIR_PROJECT_KEY dan VITE_PAKASIR_API_KEY sudah ditambahkan di Project Settings Vercel Anda.'
                        });
                        return;
                      }

                      setPakasirTestResult({ loading: true, message: 'Menguji pembuatan transaksi QRIS ke server Pakasir...' });
                      
                      const res = await createPakasirTransaction(`TEST-${Date.now().toString().slice(-6)}`, 10000, 'qris');
                      if (res.isRealApi) {
                        setPakasirTestResult({
                          loading: false,
                          success: true,
                          message: '✓ Berhasil Terhubung ke API Pakasir Real-Time!',
                          details: `Project Slug "${res.project}" aktif! Respon QRIS / VA String: "${res.paymentNumber.slice(0, 30)}..."`
                        });
                      } else {
                        setPakasirTestResult({
                          loading: false,
                          success: false,
                          message: '⚠️ Pengujian API Pakasir Menggunakan Fallback',
                          details: res.message || 'Periksa kembali Slug Proyek dan API Key Pakasir pada Vercel Environment Variables Anda.'
                        });
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shrink-0 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${pakasirTestResult?.loading ? 'animate-spin' : ''}`} />
                    <span>Tes Koneksi API Pakasir</span>
                  </button>
                </div>

                {pakasirTestResult && (
                  <div className={`p-3 rounded-xl border text-xs animate-fade-in ${
                    pakasirTestResult.loading
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                      : pakasirTestResult.success
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100'
                      : 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                  }`}>
                    <div className="font-extrabold flex items-center gap-2">
                      {pakasirTestResult.loading && <RefreshCw className="w-4 h-4 animate-spin shrink-0" />}
                      {!pakasirTestResult.loading && pakasirTestResult.success && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      {!pakasirTestResult.loading && !pakasirTestResult.success && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
                      <span>{pakasirTestResult.message}</span>
                    </div>
                    {pakasirTestResult.details && (
                      <p className="mt-1 text-[11px] opacity-90 leading-relaxed font-medium">
                        {pakasirTestResult.details}
                      </p>
                    )}
                  </div>
                )}

                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" /> Status Environment Variables Pakasir (Vercel):
                    </span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md">
                      Aman & Terisolasi (Vercel Env Only)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">1. VITE_PAKASIR_PROJECT_KEY</div>
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                        {settings.pakasirProjectKey ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {settings.pakasirProjectKey}
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">⚠️ Belum diatur di Vercel</span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">2. VITE_PAKASIR_API_KEY</div>
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                        {settings.pakasirApiKey ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Terdeteksi (••••••••)
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">⚠️ Belum diatur di Vercel</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2.5 text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-xs">📌 Pengisian Webhook URL di Dashboard Pakasir.com:</span>
                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-md">
                      Panduan Webhook
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                    Isi bidang <b>Webhook URL</b> di panel <b>Edit Proyek (pakasir.com)</b> dengan URL berikut:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/pakasir-webhook`}
                      className="flex-1 bg-white dark:bg-slate-900 text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono text-indigo-600 dark:text-indigo-400 font-bold select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const webhookUrl = `${window.location.origin}/api/pakasir-webhook`;
                        navigator.clipboard.writeText(webhookUrl);
                        alert('✓ Webhook URL berhasil disalin! Silakan paste pada kolom Webhook URL di dashboard Pakasir.');
                      }}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shrink-0 shadow-sm"
                    >
                      Salin URL
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                    *Catatan: Pada aplikasi frontend, sistem juga secara otomatis mengecek status transaksi langsung ke API Pakasir (Real-Time Transaction Detail API) saat pelanggan menekan tombol "Cek Status Pakasir".
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB: KELOLA AKUN & HAK AKSES (USERS & ROLES MANAGEMENT) */}
          {activeAdminTab === 'users' && (
            <div className="space-y-6">
              
              {/* Header Banner & Add Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 text-white rounded-3xl shadow-lg border border-indigo-800/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Manajemen Hak Akses & Fitur Aplikasi</span>
                  </div>
                  <h3 className="text-xl font-black">Kelola Akun & Role Pengguna</h3>
                  <p className="text-xs text-slate-300 max-w-xl">
                    Atur peran akun (Admin, Kasir, Pelanggan, Reseller, Kurir) dan sesuaikan hak akses fitur/menu secara granular untuk tiap pengguna toko.
                  </p>
                </div>

                <button
                  onClick={openNewUserModal}
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 shrink-0 transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ Buat Akun Baru</span>
                </button>
              </div>

              {/* Quick Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Akun</span>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{users.length}</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-purple-600 block">Admin</span>
                  <p className="text-xl font-black text-purple-600">{users.filter(u => u.role === 'admin').length}</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-600 block">Kasir</span>
                  <p className="text-xl font-black text-indigo-600">{users.filter(u => u.role === 'kasir').length}</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-600 block">Pelanggan</span>
                  <p className="text-xl font-black text-emerald-600">{users.filter(u => u.role === 'pelanggan').length}</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-amber-600 block">Reseller / Kurir</span>
                  <p className="text-xl font-black text-amber-600">{users.filter(u => u.role === 'reseller' || u.role === 'kurir').length}</p>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama, email, atau no HP akun..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  <span className="text-xs font-bold text-slate-400 shrink-0">Filter Role:</span>
                  {(['ALL', 'admin', 'kasir', 'pelanggan', 'reseller', 'kurir'] as const).map(roleKey => (
                    <button
                      key={roleKey}
                      onClick={() => setUserRoleFilter(roleKey)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all capitalize shrink-0 ${
                        userRoleFilter === roleKey
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {roleKey === 'ALL' ? 'Semua Role' : roleKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* Users Table / List */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-black text-slate-400 tracking-wider">
                        <th className="p-4">Pengguna & Kontak</th>
                        <th className="p-4">Jenis Akun (Role)</th>
                        <th className="p-4">Status Akun</th>
                        <th className="p-4">Hak Akses Fitur</th>
                        <th className="p-4 text-right">Aksi Management</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                      {(users || [])
                        .filter(u => {
                          if (!u) return false;
                          const q = (userSearchQuery || '').toLowerCase();
                          const matchesQuery = 
                            (u.name || '').toLowerCase().includes(q) ||
                            (u.email || '').toLowerCase().includes(q) ||
                            ((u.phone || '').includes(userSearchQuery));
                          const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
                          return matchesQuery && matchesRole;
                        })
                        .map(u => {
                          const isCurrentActiveUser = currentUser?.id === u.id;
                          const hasCustom = !!u.customPermissions;

                          return (
                            <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-md">
                                    {u.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">{u.name}</span>
                                      {isCurrentActiveUser && (
                                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] rounded-full">
                                          Anda (Aktif)
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                                    {u.phone && <p className="text-[10px] text-slate-400">WA/HP: {u.phone}</p>}
                                  </div>
                                </div>
                              </td>

                              <td className="p-4">
                                {/* Role Selector Dropdown directly inline */}
                                <select
                                  value={u.role}
                                  onChange={(e) => handleChangeUserRoleDirect(u.id, e.target.value as UserRole)}
                                  className={`px-3 py-1.5 rounded-xl font-black text-xs border cursor-pointer ${
                                    u.role === 'admin'
                                      ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-300'
                                      : u.role === 'kasir'
                                      ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-300'
                                      : u.role === 'reseller'
                                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300'
                                      : u.role === 'kurir'
                                      ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-300'
                                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                                  }`}
                                >
                                  <option value="admin">👑 Admin Utama</option>
                                  <option value="kasir">💻 Staff Kasir POS</option>
                                  <option value="pelanggan">🛒 Pelanggan Toko</option>
                                  <option value="reseller">🏷️ Reseller Grosir</option>
                                  <option value="kurir">🚚 Kurir Pengiriman</option>
                                </select>
                              </td>

                              <td className="p-4">
                                <button
                                  onClick={() => handleToggleUserActive(u.id)}
                                  className={`px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                                    u.isActive !== false
                                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                      : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                                  }`}
                                >
                                  {u.isActive !== false ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                  <span>{u.isActive !== false ? 'Aktif' : 'Non-Aktif'}</span>
                                </button>
                              </td>

                              <td className="p-4">
                                <button
                                  onClick={() => openPermissionsModal(u)}
                                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                  <span>{hasCustom ? 'Kustom Hak Akses (*)' : 'Sesuai Role Standard'}</span>
                                </button>
                              </td>

                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => openEditUserModal(u)}
                                    className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-xl transition-colors"
                                    title="Edit Informasi User"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl transition-colors"
                                    title="Hapus Akun User"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Matriks Default Role & Permissions Reference */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Matriks Referensi Hak Akses Standar per Peran (Role)</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                  <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 space-y-1">
                    <span className="font-black text-purple-700 dark:text-purple-300 block">👑 Admin Utama</span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">Akses penuh ke semua fitur, laporan keuangan, stok, HPP, Supabase, dan manajemen pengguna.</p>
                  </div>
                  <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-1">
                    <span className="font-black text-indigo-700 dark:text-indigo-300 block">💻 Staff Kasir POS</span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">Akses Mesin Kasir POS, pencetakan struk nota, CRM pelanggan, & tracking pesanan.</p>
                  </div>
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-1">
                    <span className="font-black text-emerald-700 dark:text-emerald-300 block">🛒 Pelanggan Toko</span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">Akses Katalog Produk eceran, checkout online WA, & lacak pesanan.</p>
                  </div>
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-1">
                    <span className="font-black text-amber-700 dark:text-amber-300 block">🏷️ Reseller Grosir</span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">Akses Katalog Produk dengan harga khusus grosir & order kemasan jirigen.</p>
                  </div>
                  <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-1">
                    <span className="font-black text-blue-700 dark:text-blue-300 block">🚚 Kurir Pengiriman</span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">Akses daftar pesanan khusus antar Batang & pembaruan status lacak.</p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* DESKTOP VERTICAL RIGHT SIDEBAR NAVIGATION MENU (Hidden on mobile) */}
        <div className="hidden lg:block w-72 shrink-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm sticky top-24">
          <div className="px-3 py-2 mb-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Navigasi Admin</h3>
            <span className="px-2 py-0.5 text-[10px] bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 font-bold rounded-full">
              Semua Menu
            </span>
          </div>

          <div className="space-y-1">
            {adminMenuTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeAdminTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveAdminTab(tab.id as any)}
                  className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.badge !== null && (
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* --- MODALS FOR CRUD OPERATIONS --- */}

      {/* PRODUCT MODAL */}
      {productModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4 shrink-0 bg-white dark:bg-slate-900">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                {editingProduct ? 'Edit Produk Varian Aroma' : 'Tambah Produk Varian Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Container with Scrollable Body */}
            <form onSubmit={handleSaveProduct} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-slate-800 dark:text-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">SKU / Kode Produk:</label>
                    <input
                      type="text"
                      required
                      value={prodCode}
                      onChange={(e) => setProdCode(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Nama Produk / Aroma:</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Parfum Akasia Premium"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold">Kategori Produk:</label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !isCustomCategory;
                        setIsCustomCategory(nextState);
                        if (nextState) {
                          setCustomCategoryInput(prodCategory);
                        } else {
                          setProdCategory(allCategoryOptions[0] || '');
                        }
                      }}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      {isCustomCategory ? '← Pilih dari Daftar Kategori' : '+ Ketik Kategori Baru'}
                    </button>
                  </div>

                  {!isCustomCategory && allCategoryOptions.length > 0 ? (
                    <select
                      value={prodCategory}
                      onChange={(e) => {
                        if (e.target.value === '__NEW_CATEGORY__') {
                          setIsCustomCategory(true);
                          setCustomCategoryInput('');
                          setProdCategory('');
                        } else {
                          setProdCategory(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
                    >
                      {allCategoryOptions.map(catName => (
                        <option key={catName} value={catName}>{catName}</option>
                      ))}
                      <option value="__NEW_CATEGORY__">+ Ketik Kategori Baru...</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Ketik nama kategori baru (contoh: Anti Noda Bandel)"
                      value={customCategoryInput}
                      onChange={(e) => {
                        setCustomCategoryInput(e.target.value);
                        setProdCategory(e.target.value);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-indigo-500 dark:border-indigo-400 font-bold focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    {registeredCategoryNames.length > 0 
                      ? 'Menampilkan daftar kategori yang telah Anda tambahkan.' 
                      : 'Belum ada kategori ditambahkan. Ketik nama kategori baru di atas.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Deskripsi Produk / Formulasi:</label>
                  <textarea
                    rows={2}
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Foto / Gambar Produk:</label>
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <input
                      type="text"
                      placeholder="URL Gambar (https://...) atau Upload dari Device"
                      value={prodImageUrl}
                      onChange={(e) => setProdImageUrl(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-mono"
                    />
                    <label className="shrink-0 cursor-pointer px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Device / HP</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const url = await uploadImageToSupabaseStorage(file, 'products');
                              setProdImageUrl(url);
                            } catch (err) {
                              console.error('Error uploading product image:', err);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  {prodImageUrl && (
                    <div className="mt-2 flex items-center gap-3 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                      <img src={prodImageUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg bg-white shrink-0 border" />
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">✓ Gambar Produk Siap Digunakan</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    Harga Coret Produk / Harga Normal (Rp) <span className="text-rose-500 font-medium">(Tampilan Diskon di Beranda)</span>:
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 20000 (Tampil Coret: Rp 20.000)"
                    value={prodOriginalPrice || ''}
                    onChange={(e) => setProdOriginalPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-rose-600 dark:text-rose-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Isi nominal harga sebelum diskon untuk menampilkan harga coret di Katalog & Beranda.
                  </p>
                </div>

                <div className="flex items-center gap-2 p-1">
                  <input
                    type="checkbox"
                    id="isPopularCheck"
                    checked={prodIsPopular}
                    onChange={(e) => setProdIsPopular(e.target.checked)}
                    className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="isPopularCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Tandai Produk "BEST SELLER" / Terpopuler
                  </label>
                </div>

                {/* Volume Options List Management */}
                <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-3 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200">
                      Kemasan, Harga & Stok Varian:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setProdVolumes(prev => [
                          ...prev,
                          {
                            id: `vol-${Date.now()}`,
                            name: 'Refill 500ml',
                            volumeMl: 500,
                            price: 25000,
                            originalPrice: 30000,
                            wholesalePrice: 20000,
                            wholesaleMinQty: 5,
                            cogs: 12000,
                            stock: 20,
                          }
                        ]);
                      }}
                      className="text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Varian Kemasan
                    </button>
                  </div>

                  {prodVolumes.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                      Belum ada varian kemasan. Klik "Tambah Varian Kemasan" di atas.
                    </div>
                  ) : (
                    prodVolumes.map((vol, idx) => (
                      <div key={vol.id} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 shadow-xs">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">Nama Kemasan / Ukuran:</label>
                            <input
                              type="text"
                              placeholder="Contoh: Refill 500ml / Botol Spray 250ml"
                              value={vol.name}
                              onChange={(e) => {
                                const updated = [...prodVolumes];
                                updated[idx].name = e.target.value;
                                setProdVolumes(updated);
                              }}
                              className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setProdVolumes(prev => prev.filter((_, i) => i !== idx))}
                            className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-all self-end shrink-0"
                            title="Hapus Varian"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">Harga Jual (Rp):</label>
                            <input
                              type="number"
                              placeholder="25000"
                              value={vol.price || ''}
                              onChange={(e) => {
                                const updated = [...prodVolumes];
                                updated[idx].price = Number(e.target.value);
                                setProdVolumes(updated);
                              }}
                              className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-indigo-600 dark:text-indigo-400"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-rose-500 mb-0.5">Harga Coret (Rp):</label>
                            <input
                              type="number"
                              placeholder="30000"
                              value={vol.originalPrice || ''}
                              onChange={(e) => {
                                const updated = [...prodVolumes];
                                updated[idx].originalPrice = Number(e.target.value);
                                setProdVolumes(updated);
                              }}
                              className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-rose-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-0.5">Harga Grosir (Rp):</label>
                            <input
                              type="number"
                              placeholder="20000"
                              value={vol.wholesalePrice || ''}
                              onChange={(e) => {
                                const updated = [...prodVolumes];
                                updated[idx].wholesalePrice = Number(e.target.value);
                                setProdVolumes(updated);
                              }}
                              className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-2.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700/60 font-bold text-amber-600 dark:text-amber-400"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-0.5">Min. Qty Grosir:</label>
                            <input
                              type="number"
                              placeholder="5"
                              value={vol.wholesaleMinQty || ''}
                              onChange={(e) => {
                                const updated = [...prodVolumes];
                                updated[idx].wholesaleMinQty = Number(e.target.value);
                                setProdVolumes(updated);
                              }}
                              className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-2.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700/60 font-bold text-amber-600 dark:text-amber-400"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">Modal / HPP (Rp):</label>
                            <input
                              type="number"
                              placeholder="12000"
                              value={vol.cogs || ''}
                              onChange={(e) => {
                                const updated = [...prodVolumes];
                                updated[idx].cogs = Number(e.target.value);
                                setProdVolumes(updated);
                              }}
                              className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">Jumlah Stok:</label>
                            <input
                              type="number"
                              placeholder="20"
                              value={vol.stock || ''}
                              onChange={(e) => {
                                const updated = [...prodVolumes];
                                updated[idx].stock = Number(e.target.value);
                                setProdVolumes(updated);
                              }}
                              className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>

                        {/* Foto / Gambar Varian Khusus Section */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                          <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                            <span>Foto / Gambar Khusus Varian Ini (Opsional):</span>
                            {vol.imageUrl ? (
                              <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">✓ Foto Custom Aktif</span>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-normal">Mengikuti Foto Utama Produk</span>
                            )}
                          </label>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              placeholder="URL Gambar Varian (https://...) atau Upload File"
                              value={vol.imageUrl || ''}
                              onChange={(e) => {
                                const updated = [...prodVolumes];
                                updated[idx].imageUrl = e.target.value;
                                setProdVolumes(updated);
                              }}
                              className="w-full bg-slate-50 dark:bg-slate-800 text-[11px] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-slate-800 dark:text-slate-200"
                            />
                            <label className="shrink-0 cursor-pointer px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all">
                              <Upload className="w-3 h-3" />
                              <span>Upload Varian</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const url = await uploadImageToSupabaseStorage(file, 'volumes');
                                      const updated = [...prodVolumes];
                                      updated[idx].imageUrl = url;
                                      setProdVolumes(updated);
                                    } catch (err) {
                                      console.error('Error uploading variant image:', err);
                                    }
                                  }
                                }}
                              />
                            </label>
                            {vol.imageUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...prodVolumes];
                                  updated[idx].imageUrl = '';
                                  setProdVolumes(updated);
                                }}
                                className="shrink-0 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-rose-500 rounded-xl text-[10px] font-bold transition-all"
                              >
                                Reset Foto
                              </button>
                            )}
                          </div>

                          {/* Preview thumbnail inside variant box */}
                          <div className="flex items-center gap-2 pt-1">
                            <img
                              src={vol.imageUrl || prodImageUrl || 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=600'}
                              alt={`Preview Varian ${vol.name}`}
                              className="w-9 h-9 object-cover rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                              {vol.imageUrl ? `Preview foto varian "${vol.name}"` : `Menggunakan foto utama produk`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sticky Footer Action Buttons */}
              <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 shrink-0">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md max-h-[90vh] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button onClick={() => setCategoryModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">Nama Kategori:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Deterjen Cair Ultra"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Deskripsi Ringkas:</label>
                <input
                  type="text"
                  placeholder="Formulasi pembersih pakaian..."
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COUPON MODAL */}
      {couponModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md max-h-[90vh] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base">
                {editingCoupon ? 'Edit Kupon Diskon' : 'Buat Kupon Diskon Baru'}
              </h3>
              <button onClick={() => setCouponModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">Kode Voucher:</label>
                <input
                  type="text"
                  required
                  placeholder="BATANG10"
                  value={coupCode}
                  onChange={(e) => setCoupCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border font-mono font-bold uppercase text-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Tipe Diskon:</label>
                  <select
                    value={coupType}
                    onChange={(e) => setCoupType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border font-bold"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Nilai Diskon:</label>
                  <input
                    type="number"
                    required
                    value={coupValue}
                    onChange={(e) => setCoupValue(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Minimal Pembelian (Rp):</label>
                <input
                  type="number"
                  value={coupMinPurchase}
                  onChange={(e) => setCoupMinPurchase(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Tanggal Kadaluarsa:</label>
                <input
                  type="date"
                  value={coupExpiresAt}
                  onChange={(e) => setCoupExpiresAt(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border font-bold"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="couponActiveCheck"
                  checked={coupIsActive}
                  onChange={(e) => setCoupIsActive(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="couponActiveCheck" className="text-xs font-bold cursor-pointer">Kupon Aktif & Bisa Digunakan</label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCouponModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Simpan Kupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BANNER CAROUSEL MODAL */}
      {bannerModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg max-h-[90vh] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base">
                {editingBanner ? 'Edit Banner Carousel' : 'Tambah Banner Promo Carousel'}
              </h3>
              <button onClick={() => setBannerModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">Judul Banner:</label>
                <input
                  type="text"
                  required
                  placeholder="Promo Spesial Parfum Laundry..."
                  value={banTitle}
                  onChange={(e) => setBanTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Subtitle / Deskripsi:</label>
                <input
                  type="text"
                  value={banSubtitle}
                  onChange={(e) => setBanSubtitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Badge Text (Opsional):</label>
                  <input
                    type="text"
                    placeholder="PROMO HEBAT"
                    value={banBadge}
                    onChange={(e) => setBanBadge(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Teks Tombol CTA:</label>
                  <input
                    type="text"
                    value={banCtaText}
                    onChange={(e) => setBanCtaText(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Gambar Banner Desktop:</label>
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <input
                    type="text"
                    placeholder="https://... atau Upload dari Device/HP"
                    value={banImgDesktop}
                    onChange={(e) => setBanImgDesktop(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border font-mono"
                  />
                  <label className="shrink-0 cursor-pointer px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const url = await uploadImageToSupabaseStorage(file, 'banners');
                            setBanImgDesktop(url);
                            if (!banImgMobile) setBanImgMobile(url);
                          } catch (err) {
                            console.error('Error uploading banner image:', err);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
                {banImgDesktop && (
                  <div className="mt-2 flex items-center gap-3 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <img src={banImgDesktop} alt="Preview Desktop" className="w-24 h-12 object-cover rounded-lg bg-white shrink-0 border border-slate-200 dark:border-slate-700" />
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">✓ Gambar Desktop Siap</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Gambar Banner Mobile (Opsional):</label>
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <input
                    type="text"
                    placeholder="Gunakan gambar desktop atau upload khusus Mobile"
                    value={banImgMobile}
                    onChange={(e) => setBanImgMobile(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border font-mono"
                  />
                  <label className="shrink-0 cursor-pointer px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const url = await uploadImageToSupabaseStorage(file, 'banners');
                            setBanImgMobile(url);
                          } catch (err) {
                            console.error('Error uploading banner mobile image:', err);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
                {banImgMobile && (
                  <div className="mt-2 flex items-center gap-3 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <img src={banImgMobile} alt="Preview Mobile" className="w-12 h-12 object-cover rounded-lg bg-white shrink-0 border border-slate-200 dark:border-slate-700" />
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">✓ Gambar Mobile Siap</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bannerActiveCheck"
                  checked={banIsActive}
                  onChange={(e) => setBanIsActive(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="bannerActiveCheck" className="text-xs font-bold cursor-pointer">Tampilkan Banner di Homepage</label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBannerModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Simpan Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER MODAL */}
      {customerModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md max-h-[90vh] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base">
                {editingCustomer ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
              </h3>
              <button onClick={() => setCustomerModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">Nama Pelanggan:</label>
                <input
                  type="text"
                  required
                  placeholder="Siti Rahma"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">No. WhatsApp / HP:</label>
                <input
                  type="text"
                  required
                  placeholder="08123456789"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Alamat Lengkap:</label>
                <input
                  type="text"
                  placeholder="Jl. Gajah Mada No 12, Batang"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Kecamatan Batang:</label>
                  <select
                    value={custDistrict}
                    onChange={(e) => setCustDistrict(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border font-bold"
                  >
                    <option value="Kec. Batang">Kec. Batang</option>
                    <option value="Kec. Warungasem">Kec. Warungasem</option>
                    <option value="Kec. Wonotunggal">Kec. Wonotunggal</option>
                    <option value="Kec. Bandar">Kec. Bandar</option>
                    <option value="Kec. Tulis">Kec. Tulis</option>
                    <option value="Kec. Limpung">Kec. Limpung</option>
                    <option value="Kec. Subah">Kec. Subah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Loyalty Tier:</label>
                  <select
                    value={custTier}
                    onChange={(e) => setCustTier(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border font-bold"
                  >
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Poin Loyalty:</label>
                <input
                  type="number"
                  value={custPoints}
                  onChange={(e) => setCustPoints(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border font-bold text-amber-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCustomerModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / CREATE USER MODAL */}
      {userModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md max-h-[90vh] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base">
                {editingUser ? 'Edit Data & Role Akun' : 'Tambah Akun Pengguna Baru'}
              </h3>
              <button onClick={() => setUserModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">Nama Lengkap Pengguna:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Mas Agus Laundry Batang"
                  value={userFormName}
                  onChange={(e) => setUserFormName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Alamat Email:</label>
                <input
                  type="email"
                  required
                  placeholder="contoh@gmail.com"
                  value={userFormEmail}
                  onChange={(e) => setUserFormEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">No. WhatsApp / Telepon:</label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={userFormPhone}
                  onChange={(e) => setUserFormPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Jenis Akun / Peran (Role):</label>
                <select
                  value={userFormRole}
                  onChange={(e) => setUserFormRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border font-bold"
                >
                  <option value="admin">👑 Admin Utama (Akses Seluruh Fitur)</option>
                  <option value="kasir">💻 Staff Kasir POS (Kasir & Struk)</option>
                  <option value="pelanggan">🛒 Pelanggan Toko (Katalog & Lacak)</option>
                  <option value="reseller">🏷️ Reseller Grosir (Harga Spesial)</option>
                  <option value="kurir">🚚 Kurir Pengiriman (Lacak Delivery)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="userIsActiveCheck"
                  checked={userFormIsActive}
                  onChange={(e) => setUserFormIsActive(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="userIsActiveCheck" className="text-xs font-bold cursor-pointer">Akun Aktif (Dapat Login & Digunakan)</label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRANULAR FEATURE PERMISSIONS MODAL */}
      {permissionsModalOpen && permissionsUser && (
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-indigo-600">Atur Kustom Hak Akses Fitur</span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {permissionsUser.name}
                </h3>
              </div>
              <button onClick={() => setPermissionsModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Centang/aktifkan fitur yang diizinkan untuk diakses oleh akun ini. Menonaktifkan akan menyembunyikan/mengunci menu terkait.
            </p>

            <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { key: 'canAccessHome', label: 'Akses Menu Beranda Toko', desc: 'Melihat halaman depan, banner, dan rekomendasi' },
                { key: 'canAccessCatalog', label: 'Akses Katalog Produk', desc: 'Melihat varian aroma dan harga ecer/grosir' },
                { key: 'canAccessPos', label: 'Akses Mesin Kasir POS', desc: 'Melakukan transaksi kasir dan cetak struk nota' },
                { key: 'canAccessTracking', label: 'Akses Lacak Pesanan', desc: 'Melihat status pengiriman pesanan' },
                { key: 'canAccessAdmin', label: 'Akses Panel Administrator', desc: 'Membuka dashboard admin toko' },
                { key: 'canManageProducts', label: 'Kelola Produk & Stok', desc: 'Tambah, edit, hapus varian dan upload foto' },
                { key: 'canManageCategories', label: 'Kelola Kategori Aroma', desc: 'Tambah, edit, hapus kategori' },
                { key: 'canManagePricesAndCogs', label: 'Edit Harga Grosir & HPP', desc: 'Mengubah harga modal dan margin profit' },
                { key: 'canViewFinancialReports', label: 'Melihat Laporan Laba Rugi', desc: 'Melihat omzet, HPP, beban, dan PDF/Excel' },
                { key: 'canManageCoupons', label: 'Kelola Kupon Diskon', desc: 'Buat dan atur kode promo diskon' },
                { key: 'canManageCustomersCRM', label: 'Kelola CRM & Poin Pelanggan', desc: 'Kelola database member & poin' },
                { key: 'canManageUsersAndRoles', label: 'Kelola Akun & Hak Akses', desc: 'Menambah & mengubah role akun user lain' },
                { key: 'canSyncSupabaseAndSheets', label: 'Sinkronisasi Supabase & Sheets', desc: 'Integrasi cloud database & Google Sheets' },
              ].map(perm => {
                const isChecked = tempPermissions[perm.key as keyof FeaturePermissions];
                return (
                  <div key={perm.key} className="pt-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{perm.label}</p>
                      <p className="text-[10px] text-slate-400">{perm.desc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTempPermissions({ ...tempPermissions, [perm.key]: !isChecked })}
                      className={`p-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                        isChecked
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                      }`}
                    >
                      {isChecked ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setTempPermissions(getDefaultPermissionsForRole(permissionsUser.role))}
                className="text-[11px] font-bold text-indigo-600 hover:underline"
              >
                Reset ke Default Role ({permissionsUser.role})
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPermissionsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Simpan Hak Akses
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-[80] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md max-h-[90vh] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-2xl overflow-y-auto">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-950/80 rounded-2xl shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">Konfirmasi Hapus {deleteConfirmModal.itemType}</span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                  {deleteConfirmModal.title}
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              {deleteConfirmModal.message}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const onConf = deleteConfirmModal.onConfirm;
                  setDeleteConfirmModal(null);
                  await onConf();
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-4 h-4" /> Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAILS & INVOICE EDITOR MODAL */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xl overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Detail & Edit Pesanan #{selectedOrderModal.orderNumber}
                </span>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  Invoice Transaksi ({selectedOrderModal.isPosSale ? 'Kasir POS' : 'Online Website'})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Dibuat pada: {formatDateIndo(selectedOrderModal.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedOrderModal(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions & Status Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status Pesanan:</label>
                <select
                  value={editingOrderStatus}
                  onChange={(e) => setEditingOrderStatus(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-extrabold"
                >
                  <option value="PENDING">PENDING (Menunggu Konfirmasi)</option>
                  <option value="PROCESSED">DIPROSES (Sedang Disiapkan)</option>
                  <option value="SHIPPED">DIKIRIM (Dalam Pengiriman Kurir)</option>
                  <option value="DELIVERED">SELESAI (Pesanan Diterima)</option>
                  <option value="CANCELLED">DIBATALKAN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status Pembayaran:</label>
                <select
                  value={editingPaymentStatus}
                  onChange={(e) => setEditingPaymentStatus(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-extrabold"
                >
                  <option value="UNPAID">UNPAID (Belum Lunas)</option>
                  <option value="PAID">PAID (Lunas)</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Resi / Kurir Pengiriman:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: J&T - JNT98871239 / Kurir Toko Agus"
                  value={editingTrackingNumber}
                  onChange={(e) => setEditingTrackingNumber(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Internal Admin:
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan mengenai pesanan ini..."
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-medium resize-none"
                />
              </div>
            </div>

            {/* Customer & Shipping Detail Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 block mb-1">Data Pelanggan</span>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{selectedOrderModal.customerName}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">HP: {selectedOrderModal.customerPhone || '-'}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{selectedOrderModal.customerAddress}</p>

                {selectedOrderModal.customerPhone && selectedOrderModal.customerPhone !== '-' && (
                  <a
                    href={`https://wa.me/${selectedOrderModal.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Halo Kak ${selectedOrderModal.customerName}, update pesanan #${selectedOrderModal.orderNumber}:\nStatus: ${editingOrderStatus}\nResi: ${editingTrackingNumber || 'Belum ada'}\nTerima kasih telah berbelanja di ${settings.storeName || 'Pewangi Laundry Batang'}!`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-xl shadow-sm transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Informasikan via WhatsApp
                  </a>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Metode & Pengiriman</span>
                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  Pembayaran: {selectedOrderModal.paymentMethod}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Tipe Kirim: {selectedOrderModal.shippingType || 'TAKEAWAY'} ({selectedOrderModal.shippingDetail || 'Ambil Sendiri'})
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Ongkos Kirim: {formatRupiah(selectedOrderModal.shippingFee || 0)}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 mb-2">Daftar Produk Dipesan</h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Produk</th>
                      <th className="p-2.5">Kemasan</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Harga</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedOrderModal.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold">{it.productName}</td>
                        <td className="p-2.5 text-slate-500">{it.volumeName}</td>
                        <td className="p-2.5 text-center font-bold">{it.quantity}</td>
                        <td className="p-2.5 text-right">{formatRupiah(it.price)}</td>
                        <td className="p-2.5 text-right font-bold">{formatRupiah(it.price * it.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal Produk:</span>
                <span>{formatRupiah(selectedOrderModal.subtotal)}</span>
              </div>
              {selectedOrderModal.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Diskon Kupon ({selectedOrderModal.couponCode || 'PROMO'}):</span>
                  <span>-{formatRupiah(selectedOrderModal.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Ongkos Kirim:</span>
                <span>{formatRupiah(selectedOrderModal.shippingFee || 0)}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-700">
                <span>Total Pembayaran:</span>
                <span className="text-indigo-600 dark:text-indigo-400">{formatRupiah(selectedOrderModal.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-emerald-600 font-bold pt-0.5">
                <span>Perkiraan Profit Bersih:</span>
                <span>{formatRupiah(selectedOrderModal.totalAmount - selectedOrderModal.totalCogs)}</span>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setPrintReceiptOrder(selectedOrderModal)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
              >
                <Printer className="w-4 h-4" /> Cetak Struk POS
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderModal(null)}
                  className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleSaveOrderDetails}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Save className="w-4 h-4" /> Simpan ke Supabase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* THERMAL RECEIPT PRINT MODAL */}
      {printReceiptOrder && (
        <div className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fadeIn">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-4">
              <h3 className="font-extrabold text-base uppercase tracking-wider">{settings.storeName || 'Pewangi Laundry Batang'}</h3>
              <p className="text-[11px] text-slate-600">{settings.address || 'Batang, Jawa Tengah'}</p>
              <p className="text-[11px] font-mono text-slate-600">Telp/WA: {settings.phone || '0812-3456-7890'}</p>
            </div>

            <div className="text-xs space-y-1 font-mono text-slate-700 border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between">
                <span>No. Nota:</span>
                <span className="font-bold">{printReceiptOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{new Date(printReceiptOrder.createdAt).toLocaleDateString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="font-bold">{printReceiptOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir / Saluran:</span>
                <span>{printReceiptOrder.isPosSale ? 'POS KASIR' : 'ONLINE'}</span>
              </div>
            </div>

            <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
              {printReceiptOrder.items.map((it, idx) => (
                <div key={idx} className="text-xs space-y-0.5">
                  <p className="font-bold">{it.productName}</p>
                  <div className="flex justify-between text-slate-600 font-mono text-[11px]">
                    <span>{it.quantity}x @ {formatRupiah(it.price)} ({it.volumeName})</span>
                    <span className="font-bold text-slate-900">{formatRupiah(it.price * it.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs font-mono border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatRupiah(printReceiptOrder.subtotal)}</span>
              </div>
              {printReceiptOrder.discountAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(printReceiptOrder.discountAmount)}</span>
                </div>
              )}
              {printReceiptOrder.shippingFee > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Ongkir:</span>
                  <span>{formatRupiah(printReceiptOrder.shippingFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-slate-900 pt-1">
                <span>TOTAL:</span>
                <span>{formatRupiah(printReceiptOrder.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 pt-0.5">
                <span>Metode Bayar:</span>
                <span className="font-bold uppercase">{printReceiptOrder.paymentMethod} ({printReceiptOrder.paymentStatus})</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-500 font-medium space-y-1 pt-1">
              <p>*** TERIMA KASIH ATAS KUNJUNGAN ANDA ***</p>
              <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPrintReceiptOrder(null)}
                className="w-1/2 py-2.5 bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="w-1/2 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ORDER CREATION MODAL */}
      {isAddManualOrderOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg max-h-[90vh] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-indigo-600" /> Catat Pesanan / Penjualan Manual
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Input transaksi offline, via telepon, atau order khusus.</p>
              </div>
              <button onClick={() => setIsAddManualOrderOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1">Nama Pelanggan:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ibu Rina Laundry Singosari"
                  value={manualCustomerName}
                  onChange={(e) => setManualCustomerName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold mb-1">Nomor WhatsApp:</label>
                  <input
                    type="text"
                    placeholder="081234567890"
                    value={manualCustomerPhone}
                    onChange={(e) => setManualCustomerPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Ongkos Kirim (Rp):</label>
                  <input
                    type="number"
                    value={manualShippingFee}
                    onChange={(e) => setManualShippingFee(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Alamat Pengiriman:</label>
                <input
                  type="text"
                  placeholder="Jl. Gajah Mada No. 45, Batang"
                  value={manualCustomerAddress}
                  onChange={(e) => setManualCustomerAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Pilih Produk:</label>
                <select
                  required
                  value={manualSelectedProductId}
                  onChange={(e) => {
                    setManualSelectedProductId(e.target.value);
                    const prod = products.find(p => p.id === e.target.value);
                    if (prod && prod.volumes.length > 0) {
                      setManualSelectedVolumeId(prod.volumes[0].id);
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value="">-- Pilih Produk Pewangi --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              {manualSelectedProductId && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold mb-1">Pilih Kemasan / Ukuran:</label>
                    <select
                      required
                      value={manualSelectedVolumeId}
                      onChange={(e) => setManualSelectedVolumeId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                    >
                      {products.find(p => p.id === manualSelectedProductId)?.volumes.map(v => (
                        <option key={v.id} value={v.id}>{v.volume} - {formatRupiah(v.price)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Jumlah (Qty):</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={manualQty}
                      onChange={(e) => setManualQty(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold mb-1">Metode Pembayaran:</label>
                  <select
                    value={manualPaymentMethod}
                    onChange={(e) => setManualPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="CASH">Tunai / Cash</option>
                    <option value="BANK_TRANSFER">Transfer Bank</option>
                    <option value="PAKASIR_QRIS">Pakasir QRIS</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Status Pembayaran:</label>
                  <select
                    value={manualPaymentStatus}
                    onChange={(e) => setManualPaymentStatus(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="PAID">Lunas (PAID)</option>
                    <option value="UNPAID">Belum Bayar (UNPAID)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddManualOrderOpen(false)}
                  className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Simpan & Sync Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};
