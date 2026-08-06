import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getStorageData, STORAGE_KEYS } from './storage';
import { Product, Category, Order, Customer, Expense, Coupon, CarouselBanner, StoreSettings, User } from '../types';
import { compressBase64IfNeeded, compressImageFile } from './imageUtils';
import { PERMANENT_CONFIG } from './config';

let cachedClient: SupabaseClient | null = null;

export function withTimeout<T>(promise: Promise<T>, timeoutMs = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Supabase request timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function clearSupabaseClientCache() {
  cachedClient = null;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const settings = getStorageData<StoreSettings>(STORAGE_KEYS.SETTINGS, {} as StoreSettings);
  const url = (settings.supabaseUrl && settings.supabaseUrl.trim()) || (import.meta as any).env?.VITE_SUPABASE_URL || PERMANENT_CONFIG.supabaseUrl || '';
  const key = (settings.supabaseAnonKey && settings.supabaseAnonKey.trim()) || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || PERMANENT_CONFIG.supabaseAnonKey || '';

  if (url && key && url.startsWith('http') && !url.includes('example.com') && !url.includes('xxxxxxxxxxxx')) {
    try {
      cachedClient = createClient(url, key);
      return cachedClient;
    } catch (err) {
      console.warn('Gagal inisialisasi Supabase client:', err);
      return null;
    }
  }

  return null;
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string; missingTables?: boolean }> {
  if (!url || !key) {
    return { success: false, message: 'URL dan Anon Key Supabase tidak boleh kosong.' };
  }
  try {
    const testClient = createClient(url, key);
    const { error } = await testClient.from('products').select('id').limit(1);
    
    if (error) {
      if (error.message?.includes('relation "public.products" does not exist') || error.code === '42P01') {
        return { 
          success: false, 
          missingTables: true,
          message: '⚠️ URL & Anon Key BENAR! Namun tabel database belum dibuat di Supabase Anda.\n\nSilakan buka SQL Editor di dashboard Supabase (https://supabase.com) lalu Paste & Run script SQL Schema yang tersedia di bawah.' 
        };
      }
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        return {
          success: false,
          missingTables: true,
          message: '⚠️ Tabel Supabase terdeteksi tetapi diblokir oleh Row Level Security (RLS).\n\nSilakan jalankan script SQL Schema di bawah untuk membuka akses RLS Public.'
        };
      }
      return { success: false, message: `Koneksi gagal: ${error.message}` };
    }
    return { success: true, message: '✓ Koneksi Supabase Berhasil & Tabel Database Siap Digunakan!' };
  } catch (err: any) {
    return { success: false, message: `Error koneksi: ${err.message || err}` };
  }
}

/**
 * Uploads image (File object or Base64 string) to Supabase Storage bucket ('media').
 * Returns public Supabase CDN URL if bucket exists, or falls back gracefully to compressed Base64.
 */
export async function uploadImageToSupabaseStorage(
  fileOrBase64: File | string,
  folder = 'products'
): Promise<string> {
  if (!fileOrBase64) return '';

  const client = getSupabaseClient();

  if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('http')) {
    return fileOrBase64;
  }

  if (!client) {
    if (typeof fileOrBase64 === 'string') {
      return await compressBase64IfNeeded(fileOrBase64, 600, 600, 0.7);
    }
    return await compressImageFile(fileOrBase64, 600, 600, 0.75);
  }

  try {
    let fileToUpload: Blob;
    let fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;

    if (typeof fileOrBase64 === 'string') {
      if (!fileOrBase64.startsWith('data:image')) {
        return fileOrBase64;
      }
      const arr = fileOrBase64.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      fileToUpload = new Blob([u8arr], { type: mime });
    } else {
      fileToUpload = fileOrBase64;
      const ext = fileOrBase64.name.split('.').pop() || 'jpg';
      fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    }

    const { data, error } = await client.storage.from('media').upload(fileName, fileToUpload, {
      cacheControl: '3600',
      upsert: true,
    });

    if (error) {
      console.warn('Fallback storage ke Base64 (Storage Bucket "media" belum dibuat):', error.message);
      if (typeof fileOrBase64 === 'string') {
        return await compressBase64IfNeeded(fileOrBase64, 600, 600, 0.7);
      }
      return await compressImageFile(fileOrBase64, 600, 600, 0.75);
    }

    const { data: publicUrlData } = client.storage.from('media').getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.warn('Error upload image ke Supabase Storage:', err);
    if (typeof fileOrBase64 === 'string') {
      return await compressBase64IfNeeded(fileOrBase64, 600, 600, 0.7);
    }
    return await compressImageFile(fileOrBase64, 600, 600, 0.75);
  }
}

// --- SUPABASE CRUD OPERATIONS FOR PRODUCTS ---
export async function upsertProductToSupabase(product: Product): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase belum terkonfigurasi' };

  try {
    const finalImageUrl = product.imageUrl ? await uploadImageToSupabaseStorage(product.imageUrl, 'products') : '';

    const finalVolumes = await Promise.all(
      (product.volumes || []).map(async (v) => ({
        ...v,
        imageUrl: v.imageUrl ? await uploadImageToSupabaseStorage(v.imageUrl, 'volumes') : undefined,
      }))
    );

    const payload = {
      id: product.id,
      code: product.code,
      name: product.name,
      category: product.category,
      scent_family: product.scentFamily || '',
      description: product.description || '',
      image_url: finalImageUrl,
      rating: product.rating || 4.8,
      is_popular: !!product.isPopular,
      volumes: finalVolumes,
      created_at: product.createdAt || new Date().toISOString(),
    };

    const { error } = await client.from('products').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Error upsert product to Supabase:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' };
  }
}

export async function deleteProductFromSupabase(productId: string, productCode?: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase belum terkonfigurasi' };

  try {
    let { error } = await client.from('products').delete().eq('id', productId);
    if (error && productCode) {
      const { error: err2 } = await client.from('products').delete().eq('code', productCode);
      if (err2) return { success: false, error: err2.message };
    } else if (error) {
      return { success: false, error: error.message };
    }
    if (productCode) {
      await client.from('products').delete().eq('code', productCode);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchProductsFromSupabase(): Promise<Product[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from('products').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    return data.map(item => ({
      id: item.id,
      code: item.code,
      name: item.name,
      category: item.category,
      scentFamily: item.scent_family || undefined,
      description: item.description || '',
      imageUrl: item.image_url || '',
      rating: item.rating ? Number(item.rating) : 4.8,
      isPopular: !!item.is_popular,
      volumes: item.volumes || [],
      createdAt: item.created_at,
    }));
  } catch (err) {
    console.error('Error fetching products from Supabase:', err);
    return null;
  }
}

// --- SUPABASE CRUD OPERATIONS FOR CATEGORIES ---
export async function upsertCategoryToSupabase(category: Category): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase belum terkonfigurasi' };

  try {
    const payload = {
      id: category.id,
      name: category.name,
      description: category.description || '',
    };
    const { error } = await client.from('categories').upsert(payload, { onConflict: 'id' });
    if (error) {
      // If conflict on unique name, update existing category row by name
      const { error: updateErr } = await client.from('categories').update({
        description: category.description || '',
      }).eq('name', category.name);

      if (updateErr) {
        console.error('Error upsert category to Supabase:', error, updateErr);
        return { success: false, error: error.message };
      }
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteCategoryFromSupabase(categoryId: string, categoryName?: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase belum terkonfigurasi' };

  try {
    let { error } = await client.from('categories').delete().eq('id', categoryId);
    if (categoryName) {
      await client.from('categories').delete().eq('name', categoryName);
    }
    if (error && !categoryName) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchCategoriesFromSupabase(): Promise<Category[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from('categories').select('*').order('name', { ascending: true });
    if (error || !data) return null;
    return data.map(c => ({ id: String(c.id), name: String(c.name), description: c.description || '' }));
  } catch (err) {
    console.error('Error fetching categories from Supabase:', err);
    return null;
  }
}

// --- SUPABASE CRUD OPERATIONS FOR ORDERS ---
export async function upsertOrderToSupabase(order: Order): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase belum terkonfigurasi' };

  try {
    const payload = {
      id: order.id,
      order_number: order.orderNumber,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      customer_address: order.customerAddress,
      items: order.items,
      subtotal: order.subtotal,
      discount_amount: order.discountAmount || 0,
      shipping_fee: order.shippingFee || 0,
      total_amount: order.totalAmount,
      total_cogs: order.totalCogs,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      order_status: order.orderStatus,
      created_at: order.createdAt || new Date().toISOString(),
    };
    const { error } = await client.from('orders').upsert(payload, { onConflict: 'id' });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- SUPABASE CRUD OPERATIONS FOR USERS ---
export async function upsertUserToSupabase(user: User): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase belum terkonfigurasi' };

  try {
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'pelanggan',
      password: user.password || '',
      address: user.address || '',
      is_active: user.isActive !== false,
      created_at: user.createdAt || new Date().toISOString(),
    };

    const { error } = await client.from('users').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Error upsert user to Supabase:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' };
  }
}

export async function fetchUsersFromSupabase(): Promise<User[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from('users').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    return data.map(item => ({
      id: item.id,
      name: item.name,
      email: item.email || '',
      phone: item.phone || '',
      role: item.role || 'pelanggan',
      password: item.password || undefined,
      address: item.address || undefined,
      isActive: item.is_active !== false,
      createdAt: item.created_at,
    }));
  } catch (err) {
    console.error('Error fetching users from Supabase:', err);
    return null;
  }
}

// --- SUPABASE CRUD OPERATIONS FOR CUSTOMERS (CRM) ---
export async function upsertCustomerToSupabase(customer: Customer): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase belum terkonfigurasi' };

  try {
    const payload = {
      id: customer.id,
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      district: customer.district || '',
      points: customer.points || 0,
      membership_tier: customer.membershipTier || 'Bronze',
      total_spent: customer.totalSpent || 0,
      debt_balance: customer.debtBalance || 0,
      created_at: customer.createdAt || new Date().toISOString(),
    };

    const { error } = await client.from('customers').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Error upsert customer to Supabase:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' };
  }
}

export async function deleteCustomerFromSupabase(customerId: string, customerPhone?: string, customerName?: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase belum terkonfigurasi' };

  try {
    const { error: err1 } = await client.from('customers').delete().eq('id', customerId);
    if (customerPhone) {
      await client.from('customers').delete().eq('phone', customerPhone);
    }
    if (customerName) {
      await client.from('customers').delete().eq('name', customerName);
    }
    if (err1 && !customerPhone && !customerName) return { success: false, error: err1.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- SUPABASE CRUD OPERATIONS FOR COUPONS ---
export async function upsertCouponToSupabase(coupon: Coupon): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase belum terkonfigurasi' };

  try {
    const payload = {
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discountType,
      discount_value: coupon.discountValue,
      min_purchase: coupon.minPurchase || 0,
      max_discount: coupon.maxDiscount || null,
      expires_at: coupon.expiresAt || '',
      usage_count: coupon.usageCount || 0,
      is_active: coupon.isActive !== false,
    };

    const { error } = await client.from('coupons').upsert(payload, { onConflict: 'id' });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' };
  }
}

export async function deleteCouponFromSupabase(couponId: string, couponCode?: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase belum terkonfigurasi' };

  try {
    const { error: err1 } = await client.from('coupons').delete().eq('id', couponId);
    if (couponCode) {
      await client.from('coupons').delete().eq('code', couponCode);
    }
    if (err1 && !couponCode) return { success: false, error: err1.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- SUPABASE CRUD OPERATIONS FOR BANNERS ---
export async function upsertBannerToSupabase(banner: CarouselBanner): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase belum terkonfigurasi' };

  try {
    const imgDesktop = banner.imageUrlDesktop ? await uploadImageToSupabaseStorage(banner.imageUrlDesktop, 'banners') : '';
    const imgTablet = banner.imageUrlTablet ? await uploadImageToSupabaseStorage(banner.imageUrlTablet, 'banners') : imgDesktop;
    const imgMobile = banner.imageUrlMobile ? await uploadImageToSupabaseStorage(banner.imageUrlMobile, 'banners') : imgDesktop;

    const payload = {
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle || '',
      cta_text: banner.ctaText || '',
      cta_link: banner.ctaLink || '',
      badge: banner.badge || '',
      image_url_desktop: imgDesktop,
      image_url_tablet: imgTablet,
      image_url_mobile: imgMobile,
      banner_order: banner.order || 1,
      is_active: banner.isActive !== false,
    };

    const { error } = await client.from('banners').upsert(payload, { onConflict: 'id' });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' };
  }
}

export async function deleteBannerFromSupabase(bannerId: string, bannerTitle?: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase belum terkonfigurasi' };

  try {
    const { error: err1 } = await client.from('banners').delete().eq('id', bannerId);
    if (bannerTitle) {
      await client.from('banners').delete().eq('title', bannerTitle);
    }
    if (err1 && !bannerTitle) return { success: false, error: err1.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteOrderFromSupabase(orderId: string, orderNumber?: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase belum terkonfigurasi' };

  try {
    const { error: err1 } = await client.from('orders').delete().eq('id', orderId);
    if (orderNumber) {
      await client.from('orders').delete().eq('order_number', orderNumber);
    }
    if (err1 && !orderNumber) return { success: false, error: err1.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function upsertExpenseToSupabase(expense: Expense): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase belum terkonfigurasi' };

  try {
    const payload = {
      id: expense.id,
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      notes: expense.notes || '',
    };

    const { error } = await client.from('expenses').upsert(payload, { onConflict: 'id' });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteExpenseFromSupabase(expenseId: string, expenseTitle?: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase belum terkonfigurasi' };

  try {
    const { error: err1 } = await client.from('expenses').delete().eq('id', expenseId);
    if (expenseTitle) {
      await client.from('expenses').delete().eq('title', expenseTitle);
    }
    if (err1 && !expenseTitle) return { success: false, error: err1.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteUserFromSupabase(userId: string, userEmail?: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase belum terkonfigurasi' };

  try {
    const { error: err1 } = await client.from('users').delete().eq('id', userId);
    if (userEmail) {
      await client.from('users').delete().eq('email', userEmail);
    }
    if (err1 && !userEmail) return { success: false, error: err1.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- CLEAR ALL DATA FROM SUPABASE TABLES ---
export async function deleteAllSupabaseData(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, message: 'Supabase belum terkonfigurasi' };

  try {
    // Delete in reverse dependency order to avoid foreign key constraints:
    const tables = ['orders', 'products', 'categories', 'customers', 'coupons', 'banners', 'expenses'];
    let errors: string[] = [];

    for (const tbl of tables) {
      try {
        const { data } = await client.from(tbl).select('id');
        if (data && data.length > 0) {
          const ids = data.map((r: any) => r.id);
          const { error: err1 } = await client.from(tbl).delete().in('id', ids);
          if (err1) {
            await client.from(tbl).delete().neq('id', '___NON_EXISTENT_ID_999___');
          }
        } else {
          await client.from(tbl).delete().neq('id', '___NON_EXISTENT_ID_999___');
        }
      } catch (err: any) {
        errors.push(`${tbl}: ${err.message}`);
      }
    }

    if (errors.length > 0) {
      return { success: false, message: `Catatan Supabase: ${errors.join(', ')}` };
    }
    return { success: true, message: 'Semua data di tabel Supabase berhasil dikosongkan!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal menghapus data Supabase' };
  }
}

export async function fetchCustomersFromSupabase(): Promise<Customer[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('customers').select('*').order('name', { ascending: true });
    if (error || !data) return null;
    return data.map(item => ({
      id: item.id,
      name: item.name,
      phone: item.phone || '',
      address: item.address || '',
      district: item.district || '',
      points: item.points || 0,
      membershipTier: item.membership_tier || 'Bronze',
      totalSpent: Number(item.total_spent) || 0,
      debtBalance: Number(item.debt_balance) || 0,
      createdAt: item.created_at,
    }));
  } catch (err) {
    return null;
  }
}

export async function fetchCouponsFromSupabase(): Promise<Coupon[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('coupons').select('*').order('code', { ascending: true });
    if (error || !data) return null;
    return data.map(item => ({
      id: item.id,
      code: item.code,
      discountType: item.discount_type as any,
      discountValue: Number(item.discount_value),
      minPurchase: Number(item.min_purchase) || 0,
      maxDiscount: item.max_discount ? Number(item.max_discount) : undefined,
      expiresAt: item.expires_at || '',
      usageCount: item.usage_count || 0,
      isActive: item.is_active !== false,
    }));
  } catch (err) {
    return null;
  }
}

export async function fetchBannersFromSupabase(): Promise<CarouselBanner[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('banners').select('*').order('banner_order', { ascending: true });
    if (error || !data) return null;
    return data.map(item => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle || '',
      ctaText: item.cta_text || '',
      ctaLink: item.cta_link || '',
      badge: item.badge || '',
      imageUrlDesktop: item.image_url_desktop || '',
      imageUrlTablet: item.image_url_tablet || item.image_url_desktop || '',
      imageUrlMobile: item.image_url_mobile || item.image_url_desktop || '',
      order: item.banner_order || 1,
      isActive: item.is_active !== false,
    }));
  } catch (err) {
    return null;
  }
}

export async function fetchExpensesFromSupabase(): Promise<Expense[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('expenses').select('*').order('date', { ascending: false });
    if (error || !data) return null;
    return data.map(item => ({
      id: item.id,
      title: item.title,
      category: item.category as any,
      amount: Number(item.amount),
      date: item.date,
      notes: item.notes || '',
    }));
  } catch (err) {
    return null;
  }
}

export async function fetchOrdersFromSupabase(): Promise<Order[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('orders').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;
    return data.map(item => ({
      id: item.id,
      orderNumber: item.order_number,
      customerName: item.customer_name,
      customerPhone: item.customer_phone || '',
      customerAddress: item.customer_address || '',
      items: item.items || [],
      subtotal: Number(item.subtotal),
      discountAmount: Number(item.discount_amount) || 0,
      shippingFee: Number(item.shipping_fee) || 0,
      shippingType: item.shipping_type || 'TAKEAWAY',
      shippingDetail: item.shipping_detail || 'Ambil Sendiri',
      totalAmount: Number(item.total_amount),
      totalCogs: Number(item.total_cogs),
      paymentMethod: item.payment_method,
      paymentStatus: item.payment_status,
      orderStatus: item.order_status,
      createdAt: item.created_at,
    }));
  } catch (err) {
    return null;
  }
}

// --- SYNC ALL LOCAL DATA TO SUPABASE IN ONE CLICK ---
export async function upsertSettingsToSupabase(settings: StoreSettings): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase belum terkonfigurasi' };

  try {
    const logoUrl = settings.appLogoUrl ? await uploadImageToSupabaseStorage(settings.appLogoUrl, 'store') : '';

    const fullPayload = {
      id: 'store_settings',
      store_name: settings.storeName,
      tagline: settings.tagline || '',
      top_announcement_text: settings.topAnnouncementText || '',
      app_logo_url: logoUrl,
      phone: settings.phone || '',
      address: settings.address || '',
      city: settings.city || '',
      base_rate_per_km: settings.baseRatePerKm,
      min_delivery_fee: settings.minDeliveryFee,
      free_delivery_min_order: settings.freeDeliveryMinOrder,
      pakasir_project_key: settings.pakasirProjectKey || '',
      pakasir_api_key: settings.pakasirApiKey || '',
      supabase_url: settings.supabaseUrl || '',
      supabase_anon_key: settings.supabaseAnonKey || '',
      updated_at: new Date().toISOString(),
    };

    let { error } = await client.from('settings').upsert(fullPayload, { onConflict: 'id' });

    // Fallback if extra columns don't exist in Supabase schema yet
    if (error && error.message?.includes('column')) {
      const basicPayload = {
        id: 'store_settings',
        store_name: settings.storeName,
        tagline: settings.tagline || '',
        top_announcement_text: settings.topAnnouncementText || '',
        app_logo_url: settings.appLogoUrl || '',
        phone: settings.phone || '',
        address: settings.address || '',
        city: settings.city || '',
        base_rate_per_km: settings.baseRatePerKm,
        min_delivery_fee: settings.minDeliveryFee,
        free_delivery_min_order: settings.freeDeliveryMinOrder,
        updated_at: new Date().toISOString(),
      };
      const resFallback = await client.from('settings').upsert(basicPayload, { onConflict: 'id' });
      error = resFallback.error;
    }

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' };
  }
}

export async function fetchSettingsFromSupabase(): Promise<Partial<StoreSettings> | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from('settings').select('*').eq('id', 'store_settings').maybeSingle();
    if (error || !data) return null;

    return {
      storeName: data.store_name || undefined,
      tagline: data.tagline || undefined,
      topAnnouncementText: data.top_announcement_text || undefined,
      appLogoUrl: data.app_logo_url || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      baseRatePerKm: data.base_rate_per_km ? Number(data.base_rate_per_km) : undefined,
      minDeliveryFee: data.min_delivery_fee ? Number(data.min_delivery_fee) : undefined,
      freeDeliveryMinOrder: data.free_delivery_min_order ? Number(data.free_delivery_min_order) : undefined,
      pakasirProjectKey: data.pakasir_project_key || undefined,
      pakasirApiKey: data.pakasir_api_key || undefined,
      supabaseUrl: data.supabase_url || undefined,
      supabaseAnonKey: data.supabase_anon_key || undefined,
    };
  } catch (err) {
    console.error('Error fetching settings from Supabase:', err);
    return null;
  }
}

export async function syncAllDataToSupabase(
  products: Product[],
  categories: Category[],
  orders: Order[],
  customers: Customer[],
  expenses: Expense[],
  coupons: Coupon[],
  banners: CarouselBanner[],
  users?: User[],
  settings?: StoreSettings
): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase belum dikoneksikan. Masukkan URL dan Anon Key di Pengaturan Admin.' };
  }

  let errors: string[] = [];

  // 0. Sync Settings
  if (settings) {
    const res = await upsertSettingsToSupabase(settings);
    if (!res.success && res.error) errors.push(`Pengaturan Toko: ${res.error}`);
  }

  // 1. Sync Categories
  for (const c of categories) {
    const res = await upsertCategoryToSupabase(c);
    if (!res.success && res.error) errors.push(`Kategori ${c.name}: ${res.error}`);
  }

  // 2. Sync Products
  for (const p of products) {
    const res = await upsertProductToSupabase(p);
    if (!res.success && res.error) errors.push(`Produk ${p.name}: ${res.error}`);
  }

  // 3. Sync Orders
  for (const o of orders) {
    const res = await upsertOrderToSupabase(o);
    if (!res.success && res.error) errors.push(`Order ${o.orderNumber}: ${res.error}`);
  }

  // 4. Sync Customers (CRM)
  if (customers && customers.length > 0) {
    for (const cust of customers) {
      const res = await upsertCustomerToSupabase(cust);
      if (!res.success && res.error) errors.push(`Pelanggan ${cust.name}: ${res.error}`);
    }
  }

  // 5. Sync Coupons
  if (coupons && coupons.length > 0) {
    for (const cp of coupons) {
      const res = await upsertCouponToSupabase(cp);
      if (!res.success && res.error) errors.push(`Kupon ${cp.code}: ${res.error}`);
    }
  }

  // 6. Sync Banners
  if (banners && banners.length > 0) {
    for (const b of banners) {
      const res = await upsertBannerToSupabase(b);
      if (!res.success && res.error) errors.push(`Banner ${b.title}: ${res.error}`);
    }
  }

  // 7. Sync Users
  if (users && users.length > 0) {
    for (const u of users) {
      const res = await upsertUserToSupabase(u);
      if (!res.success && res.error) errors.push(`User ${u.name}: ${res.error}`);
    }
  }

  // 8. Sync Expenses
  if (expenses && expenses.length > 0) {
    for (const exp of expenses) {
      const res = await upsertExpenseToSupabase(exp);
      if (!res.success && res.error) errors.push(`Pengeluaran ${exp.title}: ${res.error}`);
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      message: `Sinkronisasi selesai dengan beberapa error:\n${errors.slice(0, 3).join('\n')}\n(Pastikan tabel sudah dibuat di Supabase SQL Editor)`
    };
  }

  return { success: true, message: 'Semua data produk, kategori, pelanggan CRM, kupon, banner, pengguna, dan transaksi berhasil disinkronkan ke Supabase!' };
}

// SQL Schema Generator Helper for user setup
export const SUPABASE_SQL_SCHEMA = `
-- SQL SCHEMA PARFUM LAUNDRY BATANG (SUPABASE)

-- 1. Produk
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  scent_family TEXT,
  description TEXT,
  image_url TEXT,
  rating NUMERIC DEFAULT 4.8,
  is_popular BOOLEAN DEFAULT false,
  volumes JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Kategori
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- 3. Pesanan
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  shipping_fee NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  total_cogs NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  order_status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Pelanggan CRM
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  address TEXT,
  district TEXT,
  points INT DEFAULT 0,
  membership_tier TEXT DEFAULT 'Bronze',
  total_spent NUMERIC DEFAULT 0,
  debt_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Pengeluaran Operasional
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  notes TEXT
);

-- 6. Kupon
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value NUMERIC NOT NULL,
  min_purchase NUMERIC DEFAULT 0,
  max_discount NUMERIC,
  expires_at TEXT,
  usage_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- 7. Banner
CREATE TABLE IF NOT EXISTS public.banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  cta_text TEXT,
  cta_link TEXT,
  badge TEXT,
  image_url_desktop TEXT,
  image_url_tablet TEXT,
  image_url_mobile TEXT,
  banner_order INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true
);

-- 8. Pengguna / Akun Terdaftar (Users)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'pelanggan',
  password TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Pengaturan Toko (Settings)
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'store_settings',
  store_name TEXT,
  tagline TEXT,
  top_announcement_text TEXT,
  app_logo_url TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  base_rate_per_km NUMERIC,
  min_delivery_fee NUMERIC,
  free_delivery_min_order NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buka RLS Read/Write
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Public Access Products" ON public.products;
CREATE POLICY "Allow Public Access Products" ON public.products FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow Public Access Categories" ON public.categories;
CREATE POLICY "Allow Public Access Categories" ON public.categories FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow Public Access Orders" ON public.orders;
CREATE POLICY "Allow Public Access Orders" ON public.orders FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow Public Access Customers" ON public.customers;
CREATE POLICY "Allow Public Access Customers" ON public.customers FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow Public Access Expenses" ON public.expenses;
CREATE POLICY "Allow Public Access Expenses" ON public.expenses FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow Public Access Coupons" ON public.coupons;
CREATE POLICY "Allow Public Access Coupons" ON public.coupons FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow Public Access Banners" ON public.banners;
CREATE POLICY "Allow Public Access Banners" ON public.banners FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow Public Access Users" ON public.users;
CREATE POLICY "Allow Public Access Users" ON public.users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow Public Access Settings" ON public.settings;
CREATE POLICY "Allow Public Access Settings" ON public.settings FOR ALL USING (true);

-- 10. Storage Bucket "media" untuk Unggah Foto Produk, Logo, & Banner
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access Storage Media" ON storage.objects;
CREATE POLICY "Public Access Storage Media" ON storage.objects FOR ALL USING (bucket_id = 'media');
`;
