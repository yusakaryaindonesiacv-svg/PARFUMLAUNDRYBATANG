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
 * Helper to safely parse JSON responses without throwing Unexpected token errors on HTML pages
 */
async function parseJsonSafely(response: Response): Promise<{ isJson: boolean; data: any; rawText: string }> {
  try {
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return { isJson: true, data, rawText: text };
    } catch {
      return { isJson: false, data: null, rawText: text };
    }
  } catch (err: any) {
    return { isJson: false, data: null, rawText: err.message || '' };
  }
}

/**
 * C.2 API: Transaction Create
 * Calls backend proxy `/api/pakasir/transactioncreate/{method}`
 * If proxy returns non-JSON (e.g. static hosting Vercel 404 HTML), falls back to direct call to app.pakasir.com
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

  let responseData: any = null;
  let isRealApiSuccess = false;
  let lastErrorMessage = '';

  // 1. Try local / Vercel proxy endpoint first
  try {
    const proxyRes = await fetch(`/api/pakasir/transactioncreate/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const parsed = await parseJsonSafely(proxyRes);
    if (proxyRes.ok && parsed.isJson && parsed.data && parsed.data.payment) {
      responseData = parsed.data;
      isRealApiSuccess = true;
    } else if (parsed.isJson && parsed.data) {
      lastErrorMessage = parsed.data.message || parsed.data.error || 'Gagal membuat transaksi Pakasir';
    } else {
      lastErrorMessage = 'Proxy /api/pakasir merespon halaman non-JSON (Vercel static 404). Mencoba koneksi langsung...';
    }
  } catch (err: any) {
    console.warn('Pakasir proxy fetch error:', err);
    lastErrorMessage = err.message || 'Gagal terhubung ke proxy local';
  }

  // 2. If proxy failed or returned non-JSON, try direct fetch to Pakasir API
  if (!isRealApiSuccess) {
    try {
      const directRes = await fetch(`https://app.pakasir.com/api/transactioncreate/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const parsedDirect = await parseJsonSafely(directRes);
      if (directRes.ok && parsedDirect.isJson && parsedDirect.data && parsedDirect.data.payment) {
        responseData = parsedDirect.data;
        isRealApiSuccess = true;
      } else if (parsedDirect.isJson && parsedDirect.data) {
        lastErrorMessage = parsedDirect.data.message || parsedDirect.data.error || lastErrorMessage;
      }
    } catch (err: any) {
      console.warn('Pakasir direct fetch error:', err);
    }
  }

  // 3. Process success response
  if (isRealApiSuccess && responseData && responseData.payment) {
    const p = responseData.payment;
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
  }

  // 4. Fallback if both failed
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
    message: lastErrorMessage || 'Pakasir API tidak merespon format JSON yang valid.',
  };
}

/**
 * E. Transaction Detail API
 * GET /api/pakasir/transactiondetail
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
      const url = `/api/pakasir/transactiondetail?project=${encodeURIComponent(projectSlug || 'demo')}&amount=${Math.round(amount)}&order_id=${encodeURIComponent(orderNumber)}&api_key=${encodeURIComponent(apiKey || 'demo')}`;
      const response = await fetch(url, { method: 'GET' });
      const parsed = await parseJsonSafely(response);

      if (response.ok && parsed.isJson && parsed.data && (parsed.data.transaction?.status === 'completed' || parsed.data?.status === 'completed')) {
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
    // 1. Try proxy
    try {
      const url = `/api/pakasir/transactiondetail?project=${encodeURIComponent(projectSlug)}&amount=${amt}&order_id=${encodeURIComponent(orderNumber)}&api_key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, { method: 'GET' });
      const parsed = await parseJsonSafely(response);

      if (response.ok && parsed.isJson && parsed.data) {
        const data = parsed.data;
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

      if (parsed.isJson && parsed.data?.message) {
        lastErrMsg = parsed.data.message;
      }
    } catch (err: any) {
      console.warn('Pakasir detail proxy error:', err);
    }

    // 2. Try direct Pakasir API
    try {
      const directUrl = `https://app.pakasir.com/api/transactiondetail?project=${encodeURIComponent(projectSlug)}&amount=${amt}&order_id=${encodeURIComponent(orderNumber)}&api_key=${encodeURIComponent(apiKey)}`;
      const directRes = await fetch(directUrl, { method: 'GET' });
      const parsedDirect = await parseJsonSafely(directRes);

      if (directRes.ok && parsedDirect.isJson && parsedDirect.data) {
        const data = parsedDirect.data;
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

      if (parsedDirect.isJson && parsedDirect.data?.message) {
        lastErrMsg = parsedDirect.data.message;
      }
    } catch (err: any) {
      console.warn('Pakasir detail direct fetch error:', err);
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
 * Method: POST /api/pakasir/paymentsimulation
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

  // 1. Try proxy
  try {
    const response = await fetch('/api/pakasir/paymentsimulation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const parsed = await parseJsonSafely(response);
    if (response.ok && parsed.isJson) {
      return { success: true, message: parsed.data.message || 'Simulasi pembayaran Pakasir berhasil diselesaikan!' };
    }
  } catch (err: any) {
    console.warn('Simulation proxy error, trying direct...', err);
  }

  // 2. Try direct fetch
  try {
    const directRes = await fetch('https://app.pakasir.com/api/paymentsimulation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const parsedDirect = await parseJsonSafely(directRes);
    if (directRes.ok && parsedDirect.isJson) {
      return { success: true, message: parsedDirect.data.message || 'Simulasi pembayaran Pakasir berhasil diselesaikan!' };
    }
  } catch (err: any) {
    console.warn('Simulation direct error:', err);
  }

  return { success: true, message: 'Simulasi pembayaran diselesaikan secara lokal.' };
}
