import { getStorageData, STORAGE_KEYS } from './storage';
import { StoreSettings } from '../types';

export interface PakasirPaymentResponse {
  success: boolean;
  orderId: string;
  project: string;
  amount: number;
  fee: number;
  totalPayment: number;
  paymentMethod: string;
  paymentNumber: string; // QRIS String or VA Number
  qrCodeUrl: string;     // Rendered QR Code URL (for QRIS)
  expiredAt: string;
  isRealApi: boolean;
  message?: string;
}

export interface PakasirDetailResponse {
  success: boolean;
  orderId: string;
  amount: number;
  project: string;
  status: 'completed' | 'pending' | 'cancelled' | 'expired' | 'unknown';
  paymentMethod: string;
  completedAt?: string;
  message?: string;
}

/**
 * Universal Pakasir API Fetcher:
 * Tries local server proxy first (/api/pakasir/...).
 * If Express proxy is absent or returns 404 HTML (such as on Vercel static deployments),
 * it seamlessly falls back to direct client-side fetch to https://app.pakasir.com/api/...
 */
async function fetchPakasirApi(
  proxyUrl: string,
  directUrl: string,
  options: RequestInit
): Promise<{ ok: boolean; status: number; data: any }> {
  // 1. Try local Express proxy first
  try {
    const res = await fetch(proxyUrl, options);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    }
  } catch (e) {
    // Ignore proxy error, fallback to direct API
  }

  // 2. Fallback to direct Pakasir API (for Vercel & static deployments)
  try {
    const directRes = await fetch(directUrl, options);
    const contentType = directRes.headers.get('content-type') || '';
    let data: any = {};
    if (contentType.includes('application/json')) {
      data = await directRes.json();
    } else {
      const text = await directRes.text();
      data = { message: text || 'Pakasir Response Non-JSON' };
    }
    return { ok: directRes.ok, status: directRes.status, data };
  } catch (err: any) {
    return { ok: false, status: 500, data: { message: err.message || 'Gagal terhubung ke Pakasir API' } };
  }
}

/**
 * C.2 API: Transaction Create
 */
export async function createPakasirTransaction(
  orderNumber: string,
  amount: number,
  method: string = 'qris'
): Promise<PakasirPaymentResponse> {
  const settings = getStorageData<StoreSettings>(STORAGE_KEYS.SETTINGS, {} as StoreSettings);
  const projectSlug = (settings.pakasirProjectKey || '').trim();
  const apiKey = (settings.pakasirApiKey || '').trim();

  // Validate credentials
  if (!projectSlug || !apiKey) {
    const demoQrString = `00020101021226610016ID.CO.PAKASIR.WWW01189360091800216005230208216005230303UME51440014ID.CO.QRIS.WWW0215ID10243228429300303UME520479295303360540${amount}.005802ID5907Pakasir6012BATANG6304A079`;
    return {
      success: true,
      orderId: orderNumber,
      project: projectSlug || 'demo',
      amount,
      fee: 0,
      totalPayment: amount,
      paymentMethod: method,
      paymentNumber: demoQrString,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(demoQrString)}`,
      expiredAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      isRealApi: false,
      message: 'Mode Simulasi: API Key atau Project Slug Pakasir belum diisi di Pengaturan Toko.',
    };
  }

  const payload = {
    project: projectSlug,
    order_id: orderNumber,
    amount: Math.round(amount),
    api_key: apiKey,
  };

  const { ok, data } = await fetchPakasirApi(
    `/api/pakasir/transactioncreate/${method}`,
    `https://app.pakasir.com/api/transactioncreate/${method}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  if (ok && data && data.payment) {
    const p = data.payment;
    const paymentNum = p.payment_number || '';
    const qrCodeUrl = paymentNum ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(paymentNum)}` : '';

    return {
      success: true,
      orderId: p.order_id || orderNumber,
      project: p.project || projectSlug,
      amount: Number(p.amount || amount),
      fee: Number(p.fee || 0),
      totalPayment: Number(p.total_payment || amount),
      paymentMethod: p.payment_method || method,
      paymentNumber: paymentNum,
      qrCodeUrl,
      expiredAt: p.expired_at || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      isRealApi: true,
    };
  } else {
    const errMsg = data?.message || data?.error || 'Gagal membuat transaksi Pakasir';
    console.warn('Pakasir API Response Error:', data);
    
    const demoQrString = `00020101021226610016ID.CO.PAKASIR.WWW01189360091800216005230208216005230303UME51440014ID.CO.QRIS.WWW0215ID10243228429300303UME520479295303360540${amount}.005802ID5907Pakasir6012BATANG6304A079`;
    return {
      success: true,
      orderId: orderNumber,
      project: projectSlug,
      amount,
      fee: 0,
      totalPayment: amount,
      paymentMethod: method,
      paymentNumber: demoQrString,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(demoQrString)}`,
      expiredAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      isRealApi: false,
      message: `Pakasir Server Respon: ${errMsg}`,
    };
  }
}

/**
 * E. Transaction Detail API
 */
export async function checkPakasirTransactionStatus(
  orderNumber: string,
  amount: number,
  totalPayment?: number,
  isRealApi: boolean = true
): Promise<PakasirDetailResponse> {
  const settings = getStorageData<StoreSettings>(STORAGE_KEYS.SETTINGS, {} as StoreSettings);
  const projectSlug = (settings.pakasirProjectKey || '').trim();
  const apiKey = (settings.pakasirApiKey || '').trim();

  // If credentials are empty or it's a fallback/simulated order
  if (!projectSlug || !apiKey || !isRealApi) {
    try {
      const queryStr = `project=${encodeURIComponent(projectSlug || 'demo')}&amount=${Math.round(amount)}&order_id=${encodeURIComponent(orderNumber)}&api_key=${encodeURIComponent(apiKey || 'demo')}`;
      const { ok, data } = await fetchPakasirApi(
        `/api/pakasir/transactiondetail?${queryStr}`,
        `https://app.pakasir.com/api/transactiondetail?${queryStr}`,
        { method: 'GET' }
      );

      if (ok && data && (data.transaction?.status === 'completed' || data?.status === 'completed')) {
        return {
          success: true,
          orderId: orderNumber,
          amount,
          project: projectSlug || 'demo',
          status: 'completed',
          paymentMethod: 'qris',
          completedAt: new Date().toISOString(),
        };
      }
    } catch (e) {
      console.warn('Checking local simulation state error:', e);
    }

    return {
      success: true,
      orderId: orderNumber,
      amount,
      project: projectSlug || 'demo',
      status: 'pending',
      paymentMethod: 'qris',
      message: 'Mode Simulasi: Transaksi belum diselesaikan. Gunakan tombol "Simulasi Bayar (Sandbox)" untuk menyelesaikan.',
    };
  }

  // Real API Mode: Try primary base amount first, then totalPayment if different
  const amountsToTry = [Math.round(amount)];
  if (totalPayment && Math.round(totalPayment) !== Math.round(amount)) {
    amountsToTry.push(Math.round(totalPayment));
  }

  let lastErrMsg = 'Transaksi belum terdeteksi di Pakasir.';

  for (const amt of amountsToTry) {
    try {
      const queryStr = `project=${encodeURIComponent(projectSlug)}&amount=${amt}&order_id=${encodeURIComponent(orderNumber)}&api_key=${encodeURIComponent(apiKey)}`;
      const { ok, data } = await fetchPakasirApi(
        `/api/pakasir/transactiondetail?${queryStr}`,
        `https://app.pakasir.com/api/transactiondetail?${queryStr}`,
        { method: 'GET' }
      );

      if (ok && data) {
        const tx = data.transaction || data.payment || data.data;
        if (tx && (tx.order_id || tx.orderId || tx.status)) {
          const rawStatus = String(tx?.status || data?.status || '').toLowerCase();
          let status: 'completed' | 'pending' | 'cancelled' | 'expired' | 'unknown' = 'pending';

          if (['completed', 'success', 'paid', 'lunas', 'berhasil', 'settlement'].includes(rawStatus)) {
            status = 'completed';
          } else if (['cancelled', 'canceled', 'batal'].includes(rawStatus)) {
            status = 'cancelled';
          } else if (['expired', 'kadaluarsa'].includes(rawStatus)) {
            status = 'expired';
          } else if (rawStatus === 'pending' || rawStatus === 'waiting') {
            status = 'pending';
          } else if (rawStatus) {
            status = rawStatus as any;
          }

          return {
            success: true,
            orderId: tx?.order_id || tx?.orderId || orderNumber,
            amount: Number(tx?.amount || amount),
            project: tx?.project || projectSlug,
            status,
            paymentMethod: tx?.payment_method || tx?.paymentMethod || 'qris',
            completedAt: tx?.completed_at || tx?.completedAt,
          };
        }
      }

      if (data?.message) {
        lastErrMsg = data.message;
      }
    } catch (err: any) {
      lastErrMsg = err.message || lastErrMsg;
    }
  }

  return {
    success: false,
    orderId: orderNumber,
    amount,
    project: projectSlug,
    status: 'pending',
    paymentMethod: 'qris',
    message: lastErrMsg.includes('tidak ditemukan')
      ? 'Belum ada pembayaran terdeteksi. Silakan scan QRIS & transfer, atau gunakan Simulasi Bayar (Sandbox).'
      : lastErrMsg,
  };
}

/**
 * C.4 API: Payment Simulation (Sandbox Mode)
 */
export async function simulatePakasirPayment(
  orderNumber: string,
  amount: number
): Promise<{ success: boolean; message: string }> {
  const settings = getStorageData<StoreSettings>(STORAGE_KEYS.SETTINGS, {} as StoreSettings);
  const projectSlug = (settings.pakasirProjectKey || '').trim();
  const apiKey = (settings.pakasirApiKey || '').trim();

  const payload = {
    project: projectSlug || 'demo',
    order_id: orderNumber,
    amount: Math.round(amount),
    api_key: apiKey || 'demo',
  };

  const { ok, data } = await fetchPakasirApi(
    '/api/pakasir/paymentsimulation',
    'https://app.pakasir.com/api/paymentsimulation',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  if (ok) {
    return { success: true, message: data.message || 'Simulasi pembayaran Pakasir berhasil diselesaikan!' };
  } else {
    return { success: false, message: data.message || 'Gagal melakukan simulasi pembayaran.' };
  }
}
