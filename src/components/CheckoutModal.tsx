import React, { useState, useEffect } from 'react';
import { CartItem, Coupon, Order, StoreSettings, PaymentMethod } from '../types';
import { X, MapPin, Truck, CreditCard, ShieldCheck, Check, Sparkles, QrCode, ArrowRight, Navigation, Globe, RefreshCw, CheckCircle2, MessageCircle } from 'lucide-react';
import { formatRupiah } from '../lib/excelPdf';
import { BATANG_DISTRICTS, calculateLocalDistanceShipping, calculateNationalShippingOptionsDetailed, NATIONAL_PROVINCES_TARIFF } from '../lib/shipping';
import { getProvinceNames, getCitiesByProvince, getDistrictsByCity } from '../lib/indonesiaRegions';
import { createPakasirTransaction, checkPakasirTransactionStatus, simulatePakasirPayment } from '../lib/pakasir';
import { STORAGE_KEYS, getStorageData, setStorageData } from '../lib/storage';
import { MapPicker } from './MapPicker';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  appliedCoupon: Coupon | null;
  settings: StoreSettings;
  onOrderPlaced: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  appliedCoupon,
  settings,
  onOrderPlaced,
}) => {
  if (!isOpen) return null;

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  
  // Shipping State
  const [shippingType, setShippingType] = useState<'DISTANCE_LOCAL' | 'COURIER_NATIONAL' | 'TAKEAWAY'>('DISTANCE_LOCAL');
  const [useMapPicker, setUseMapPicker] = useState<boolean>(true);
  const [mapDistanceKm, setMapDistanceKm] = useState<number>(2.5);
  const [mapAddressLabel, setMapAddressLabel] = useState<string>('Area Batang');
  const [selectedDistrict, setSelectedDistrict] = useState(BATANG_DISTRICTS[0].name);
  const [selectedProvince, setSelectedProvince] = useState('Jawa Tengah');
  const [selectedCity, setSelectedCity] = useState('Kabupaten Batang');
  const [selectedDistrictNational, setSelectedDistrictNational] = useState('Batang');
  const [selectedCourierCode, setSelectedCourierCode] = useState('JNT');

  const handleProvinceChange = (newProv: string) => {
    setSelectedProvince(newProv);
    const cities = getCitiesByProvince(newProv);
    const firstCity = cities[0]?.name || '';
    setSelectedCity(firstCity);
    const districts = getDistrictsByCity(newProv, firstCity);
    setSelectedDistrictNational(districts[0] || '');
  };

  const handleCityChange = (newCity: string) => {
    setSelectedCity(newCity);
    const districts = getDistrictsByCity(selectedProvince, newCity);
    setSelectedDistrictNational(districts[0] || '');
  };

  // Ensure selectedCourierCode is valid among enabled couriers
  useEffect(() => {
    if (shippingType === 'COURIER_NATIONAL') {
      const totalWeight = cart.reduce((acc, item) => acc + item.volumeMl * item.quantity, 0);
      const options = calculateNationalShippingOptionsDetailed(
        selectedProvince,
        selectedCity,
        selectedDistrictNational,
        totalWeight,
        settings.enabledNationalCouriers
      );
      if (options.length > 0 && !options.some((o) => o.code === selectedCourierCode)) {
        setSelectedCourierCode(options[0].code);
      }
    }
  }, [selectedProvince, selectedCity, selectedDistrictNational, settings.enabledNationalCouriers, shippingType, selectedCourierCode, cart]);
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PAKASIR_QRIS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrisResult, setQrisResult] = useState<{
    orderId: string;
    qrCodeUrl: string;
    paymentNumber: string;
    fee: number;
    totalPayment: number;
    isRealApi: boolean;
    checkingStatus?: boolean;
    statusText?: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    shippingDetail?: string;
  } | null>(null);

  const [completedWaData, setCompletedWaData] = useState<{
    orderId: string;
    totalAmount: number;
    waUrl: string;
    customerName: string;
    customerPhone: string;
  } | null>(null);

  const handlePaymentCompletedSuccess = (
    qResult: {
      orderId: string;
      totalPayment: number;
      paymentNumber?: string;
      customerName?: string;
      customerPhone?: string;
    }
  ) => {
    // Update order status in local storage to PAID
    const existingOrders = getStorageData<Order[]>(STORAGE_KEYS.ORDERS, []);
    const updatedOrders = existingOrders.map((o) => {
      if (o.orderNumber === qResult.orderId || o.pakasirTransactionId === qResult.orderId) {
        return { ...o, paymentStatus: 'PAID' as const };
      }
      return o;
    });
    setStorageData(STORAGE_KEYS.ORDERS, updatedOrders);

    // Prepare WhatsApp Message Link
    const waText = encodeURIComponent(
      `*PESANAN LUNAS PARFUM LAUNDRY BATANG (PAKASIR)*\n` +
      `No. Pesanan: ${qResult.orderId}\n` +
      `Status Pembayaran: LUNAS (PAID via Pakasir QRIS/VA)\n` +
      `Total Pembayaran: ${formatRupiah(qResult.totalPayment)}\n` +
      `Nama Pelanggan: ${qResult.customerName || customerName || 'Pelanggan'}\n\n` +
      `Halo Admin, pembayaran pesanan saya telah LUNAS di Pakasir. Mohon pesanan ini segera diproses, terima kasih!`
    );
    const waUrl = `https://wa.me/${settings.phone.replace(/[^0-9]/g, '')}?text=${waText}`;

    setCompletedWaData({
      orderId: qResult.orderId,
      totalAmount: qResult.totalPayment,
      waUrl,
      customerName: qResult.customerName || customerName || 'Pelanggan',
      customerPhone: qResult.customerPhone || customerPhone || '',
    });

    setQrisResult(null);
  };

  // Real-time Auto Polling Effect (Checks status every 2 seconds)
  useEffect(() => {
    if (!qrisResult || completedWaData) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await checkPakasirTransactionStatus(
          qrisResult.orderId,
          qrisResult.amount,
          qrisResult.totalPayment,
          qrisResult.isRealApi
        );
        if (res.success && res.status === 'completed') {
          handlePaymentCompletedSuccess(qrisResult);
        }
      } catch (err) {
        console.warn('Auto checking Pakasir status error:', err);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [qrisResult, completedWaData]);

  const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const totalCogs = cart.reduce((acc, item) => acc + item.cogs * item.quantity, 0);
  const totalWeightGram = cart.reduce((acc, item) => acc + item.volumeMl * item.quantity, 0);

  // Discount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = (subtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscount && discountAmount > appliedCoupon.maxDiscount) {
        discountAmount = appliedCoupon.maxDiscount;
      }
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }

  // Calculate Shipping Fee
  let shippingFee = 0;
  let shippingDetailName = '';

  if (shippingType === 'DISTANCE_LOCAL') {
    let effectiveDist = mapDistanceKm;
    if (!useMapPicker) {
      const distPreset = BATANG_DISTRICTS.find((d) => d.name === selectedDistrict) || BATANG_DISTRICTS[0];
      effectiveDist = distPreset.avgDistanceKm;
    }
    const localCalc = calculateLocalDistanceShipping(effectiveDist, subtotal);
    shippingFee = localCalc.cost;
    shippingDetailName = `${localCalc.message} ${useMapPicker ? '(Peta OpenStreetMap GPS)' : ''}`;
  } else if (shippingType === 'COURIER_NATIONAL') {
    const options = calculateNationalShippingOptionsDetailed(
      selectedProvince,
      selectedCity,
      selectedDistrictNational,
      totalWeightGram,
      settings.enabledNationalCouriers
    );
    const selectedOption = options.find((o) => o.code === selectedCourierCode) || options[0];
    shippingFee = selectedOption ? selectedOption.cost : 0;
    shippingDetailName = selectedOption
      ? `${selectedOption.name} (${selectedProvince}, ${selectedCity}, Kec. ${selectedDistrictNational} - ETD ${selectedOption.etd})`
      : `Kurir Nasional (${selectedProvince}, ${selectedCity})`;
  } else {
    shippingFee = 0;
    shippingDetailName = 'Ambil Mandiri Di Toko Kalisalak Batang';
  }

  const finalTotalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || (!customerAddress && shippingType !== 'TAKEAWAY')) {
      alert('Mohon lengkapi Nama, No. WhatsApp, dan Alamat Pengiriman.');
      return;
    }

    setIsSubmitting(true);
    const orderNumber = `PLB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 899 + 100)}`;

    let pakasirTxId = '';

    // If Pakasir Payment is selected, trigger Pakasir API
    if (paymentMethod === 'PAKASIR_QRIS' || paymentMethod === 'PAKASIR_VA') {
      const pMethod = paymentMethod === 'PAKASIR_VA' ? 'bni_va' : 'qris';
      const pakasirRes = await createPakasirTransaction(
        orderNumber,
        finalTotalAmount,
        pMethod
      );
      if (pakasirRes.success) {
        setQrisResult({
          orderId: pakasirRes.orderId,
          qrCodeUrl: pakasirRes.qrCodeUrl,
          paymentNumber: pakasirRes.paymentNumber,
          fee: pakasirRes.fee,
          totalPayment: pakasirRes.totalPayment,
          isRealApi: pakasirRes.isRealApi,
          customerName,
          customerPhone,
          customerAddress,
          shippingDetail: shippingDetailName,
        });
        pakasirTxId = pakasirRes.orderId;
      }
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerName,
      customerPhone,
      customerAddress: shippingType === 'TAKEAWAY' ? 'Ambil di Toko' : customerAddress,
      items: cart,
      subtotal,
      discountAmount,
      couponCode: appliedCoupon?.code,
      shippingFee,
      shippingType,
      shippingDetail: shippingDetailName,
      totalAmount: finalTotalAmount,
      totalCogs,
      paymentMethod,
      paymentStatus: paymentMethod === 'CASH' ? 'PAID' : 'UNPAID',
      orderStatus: 'PENDING',
      pakasirTransactionId: pakasirTxId,
      createdAt: new Date().toISOString(),
      isPosSale: false,
    };

    onOrderPlaced(newOrder);
    setIsSubmitting(false);

    // Prepare WhatsApp Share Link for non-Pakasir payments
    if (paymentMethod !== 'PAKASIR_QRIS' && paymentMethod !== 'PAKASIR_VA') {
      const waText = encodeURIComponent(
        `*PESANAN BARU PARFUM LAUNDRY BATANG*\n` +
        `No. Pesanan: ${orderNumber}\n` +
        `Nama: ${customerName}\n` +
        `No. HP: ${customerPhone}\n` +
        `Alamat: ${customerAddress || 'Ambil di Toko'}\n` +
        `Pengiriman: ${shippingDetailName}\n` +
        `Metode Bayar: ${paymentMethod}\n` +
        `Total Pembayaran: ${formatRupiah(finalTotalAmount)}\n\n` +
        `Mohon diproses, terima kasih!`
      );
      const waUrl = `https://wa.me/${settings.phone.replace(/[^0-9]/g, '')}?text=${waText}`;

      setCompletedWaData({
        orderId: orderNumber,
        totalAmount: finalTotalAmount,
        waUrl,
        customerName,
        customerPhone,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Formulir Pesanan Online</span>
            <h2 className="text-xl font-black">Checkout & Pembayaran</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {completedWaData ? (
          /* Payment Completed WhatsApp Confirmation View */
          <div className="p-6 sm:p-8 text-center space-y-6 max-h-[85vh] overflow-y-auto animate-fade-in">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/80 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-xl border border-emerald-300 dark:border-emerald-700">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="inline-block text-xs font-black uppercase text-emerald-700 dark:text-emerald-300 tracking-widest bg-emerald-50 dark:bg-emerald-950 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                ⚡ Status Pembayaran: LUNAS (COMPLETED)
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Pembayaran Pakasir Berhasil!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Formulir pesanan online & pembayaran telah <b>otomatis ditutup</b>. Silakan klik tombol di bawah untuk konfirmasi pesanan lunas ke admin via WhatsApp.
              </p>
            </div>

            {/* Order Details Summary Box */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-left max-w-md mx-auto space-y-2 shadow-sm">
              <div className="flex justify-between border-b pb-1.5 border-slate-200 dark:border-slate-700">
                <span className="text-slate-400">No. Pesanan:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{completedWaData.orderId}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-slate-200 dark:border-slate-700">
                <span className="text-slate-400">Nama Pelanggan:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{completedWaData.customerName}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Total Lunas:</span>
                <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">{formatRupiah(completedWaData.totalAmount)}</span>
              </div>
            </div>

            {/* WhatsApp Confirmation Action Button */}
            <div className="pt-2 max-w-md mx-auto space-y-3">
              <a
                href={completedWaData.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl hover:shadow-2xl flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>Konfirmasi Pesanan ke Admin via WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setCompletedWaData(null);
                  onClose();
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
              >
                Tutup Modal
              </button>
            </div>
          </div>
        ) : qrisResult ? (
          /* Pakasir Payment Result Display State */
          <div className="p-6 sm:p-8 text-center space-y-5 max-h-[80vh] overflow-y-auto">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl max-w-lg mx-auto text-left flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-100">Tagihan Pembayaran Pakasir Dibuat!</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${qrisResult.isRealApi ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                    {qrisResult.isRealApi ? 'Pakasir Live API' : 'Pakasir Simulasi'}
                  </span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Scan QRIS di bawah ini dengan BCA, Mandiri, BRI, Gopay, OVO, Dana, ShopeePay atau gunakan nomor pembayaran.
                </p>
              </div>
            </div>

            {/* QR Code / Payment Number Display Box */}
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md mx-auto shadow-xl space-y-4">
              {qrisResult.qrCodeUrl && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl inline-block border border-slate-200 dark:border-slate-700">
                  <img
                    src={qrisResult.qrCodeUrl}
                    alt="Kode QRIS Pakasir"
                    className="w-56 h-56 mx-auto object-contain"
                  />
                </div>
              )}

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between border-b pb-1 border-slate-100 dark:border-slate-700">
                  <span className="text-slate-400">Order ID Pakasir:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{qrisResult.orderId}</span>
                </div>
                {qrisResult.fee > 0 && (
                  <div className="flex justify-between border-b pb-1 border-slate-100 dark:border-slate-700">
                    <span className="text-slate-400">Biaya Layanan Pakasir:</span>
                    <span className="font-bold">{formatRupiah(qrisResult.fee)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 font-black text-sm text-indigo-600 dark:text-indigo-400">
                  <span>Total Tagihan:</span>
                  <span>{formatRupiah(qrisResult.totalPayment)}</span>
                </div>
              </div>

              {qrisResult.paymentNumber && (
                <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-left space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">String QR / Nomor Pembayaran Pakasir:</span>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate select-all">
                      {qrisResult.paymentNumber}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(qrisResult.paymentNumber);
                        alert('Nomor / String QRIS Pakasir berhasil disalin!');
                      }}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg shrink-0"
                    >
                      Salin
                    </button>
                  </div>
                </div>
              )}

              {/* Status Text Notice & Auto Polling Indicator */}
              <div className="space-y-2">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-500 animate-spin shrink-0" />
                  <span>Memeriksa status pembayaran otomatis setiap 3 detik...</span>
                </div>

                {qrisResult.statusText && (
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 rounded-xl text-xs font-bold animate-fade-in">
                    {qrisResult.statusText}
                  </div>
                )}
              </div>

              {/* Interactive Status Check & Simulation Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  disabled={qrisResult.checkingStatus}
                  onClick={async () => {
                    setQrisResult(prev => prev ? { ...prev, checkingStatus: true, statusText: 'Mengecek status pembayaran ke API Pakasir...' } : null);
                    const res = await checkPakasirTransactionStatus(
                      qrisResult.orderId,
                      qrisResult.amount,
                      qrisResult.totalPayment,
                      qrisResult.isRealApi
                    );
                    if (res.success && res.status === 'completed') {
                      handlePaymentCompletedSuccess(qrisResult);
                    } else {
                      setQrisResult(prev => prev ? {
                        ...prev,
                        checkingStatus: false,
                        statusText: res.success
                          ? `Status Pakasir: ${res.status.toUpperCase()} ${res.completedAt ? `(Selesai: ${new Date(res.completedAt).toLocaleTimeString()})` : ''}`
                          : `Info Pakasir: ${res.message || 'Status transaksi belum terbayar.'}`
                      } : null);
                    }
                  }}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${qrisResult.checkingStatus ? 'animate-spin' : ''}`} />
                  <span>Cek Status Pakasir</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setQrisResult(prev => prev ? { ...prev, statusText: 'Mengirimkan simulasi pembayaran Sandbox ke Pakasir...' } : null);
                    const simRes = await simulatePakasirPayment(qrisResult.orderId, qrisResult.amount || qrisResult.totalPayment);
                    const checkRes = await checkPakasirTransactionStatus(
                      qrisResult.orderId,
                      qrisResult.amount,
                      qrisResult.totalPayment,
                      qrisResult.isRealApi
                    );
                    if (simRes.success || (checkRes.success && checkRes.status === 'completed')) {
                      handlePaymentCompletedSuccess(qrisResult);
                    } else {
                      setQrisResult(prev => prev ? {
                        ...prev,
                        statusText: simRes.message || 'Simulasi berhasil dikirim.'
                      } : null);
                    }
                  }}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simulasi Bayar (Sandbox)</span>
                </button>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg transition-all"
              >
                Selesai & Tutup Modal
              </button>
            </div>
          </div>
        ) : (
          /* Main Checkout Form */
          <form onSubmit={handleSubmitOrder} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
            
            {/* Step 1: Customer Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">1</span>
                <span>Informasi Pembeli / Pelanggan</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bpk. Agus Suherman"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">No. WhatsApp (Aktif):</label>
                  <input
                    type="tel"
                    required
                    placeholder="081234567890"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {shippingType !== 'TAKEAWAY' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Alamat Pengiriman Lengkap:</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Jl. Pemuda No. 45, RT 02/RW 03, Kel. Kauman, Batang"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Step 2: Shipping Options */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">2</span>
                <span>Pilih Metode Pengiriman</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Distance Local Batang */}
                <button
                  type="button"
                  onClick={() => setShippingType('DISTANCE_LOCAL')}
                  className={`p-3 rounded-2xl text-left border-2 transition-all ${
                    shippingType === 'DISTANCE_LOCAL'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <MapPin className="w-5 h-5 text-indigo-600 mb-1" />
                  <p className="font-bold text-xs">Kurir Lokal Batang</p>
                  <p className="text-[10px] text-slate-500">Hitung berdasarkan jarak (Km)</p>
                </button>

                {/* Courier National */}
                <button
                  type="button"
                  onClick={() => setShippingType('COURIER_NATIONAL')}
                  className={`p-3 rounded-2xl text-left border-2 transition-all ${
                    shippingType === 'COURIER_NATIONAL'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Truck className="w-5 h-5 text-indigo-600 mb-1" />
                  <p className="font-bold text-xs">Kurir Nasional</p>
                  <p className="text-[10px] text-slate-500">JNE, J&T, POS Indonesia</p>
                </button>

                {/* Takeaway */}
                <button
                  type="button"
                  onClick={() => setShippingType('TAKEAWAY')}
                  className={`p-3 rounded-2xl text-left border-2 transition-all ${
                    shippingType === 'TAKEAWAY'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Check className="w-5 h-5 text-indigo-600 mb-1" />
                  <p className="font-bold text-xs">Ambil di Toko</p>
                  <p className="text-[10px] text-slate-500">Kalisalak Batang (Bebas Ongkir)</p>
                </button>

              </div>

              {/* Sub-options based on selected shipping */}
              {shippingType === 'DISTANCE_LOCAL' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                  
                  {/* Local Mode Switcher: Map vs Preset */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      <span>Mode Hitung Ongkir Lokal:</span>
                    </span>
                    <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-xl text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setUseMapPicker(true)}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          useMapPicker
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                        }`}
                      >
                        🗺️ Peta & GPS Real
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseMapPicker(false)}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          !useMapPicker
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                        }`}
                      >
                        🏘️ Pilih Kecamatan
                      </button>
                    </div>
                  </div>

                  {useMapPicker ? (
                    <div>
                      <p className="text-[11px] text-slate-500 mb-2">
                        Tentukan lokasi tujuan pengiriman pada peta gratis (OpenStreetMap) atau tekan tombol <b>Deteksi GPS Saya</b> untuk hitung jarak otomatis:
                      </p>
                      <MapPicker
                        storeLat={settings.latitude}
                        storeLng={settings.longitude}
                        mode="CUSTOMER_SELECT"
                        onLocationSelect={(loc) => {
                          setMapDistanceKm(loc.distanceKm);
                          setMapAddressLabel(loc.addressLabel);
                          if (loc.addressLabel && loc.addressLabel !== 'Titik Pilihan di Peta') {
                            setCustomerAddress(loc.addressLabel);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Pilih Wilayah / Kecamatan di Batang:
                      </label>
                      <select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold"
                      >
                        {BATANG_DISTRICTS.map((d) => (
                          <option key={d.id} value={d.name}>
                            {d.name} (~{d.avgDistanceKm} km dari toko)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-900 dark:text-indigo-200">
                      Rincian Biaya Kurir:
                    </span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                      {shippingFee === 0 ? 'GRATIS ONGKIR' : formatRupiah(shippingFee)}
                    </span>
                  </div>
                </div>
              )}

              {shippingType === 'COURIER_NATIONAL' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-indigo-600" />
                      <span>Lokasi Tujuan Pengiriman (3 Kolom Wilayah):</span>
                    </span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      Total Berat: {totalWeightGram} gram ({Math.max(1, Math.ceil(totalWeightGram / 1000))} kg)
                    </span>
                  </div>

                  {/* 3 Kolom Tujuan: Provinsi, Kabupaten/Kota, Kecamatan */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Kolom 1: Provinsi */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        1. Provinsi:
                      </label>
                      <select
                        value={selectedProvince}
                        onChange={(e) => handleProvinceChange(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {getProvinceNames().map((prov) => (
                          <option key={prov} value={prov}>
                            {prov}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Kolom 2: Kabupaten / Kota */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        2. Kabupaten / Kota:
                      </label>
                      <select
                        value={selectedCity}
                        onChange={(e) => handleCityChange(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {getCitiesByProvince(selectedProvince).map((city) => (
                          <option key={city.name} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Kolom 3: Kecamatan */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        3. Kecamatan:
                      </label>
                      <select
                        value={selectedDistrictNational}
                        onChange={(e) => setSelectedDistrictNational(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {getDistrictsByCity(selectedProvince, selectedCity).map((dist) => (
                          <option key={dist} value={dist}>
                            Kec. {dist}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Summary Address Badge */}
                  <div className="p-2.5 bg-indigo-50/80 dark:bg-indigo-950/50 rounded-xl border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>📍 Tujuan Hitung Ongkir: <b className="text-indigo-600 dark:text-indigo-400">Kec. {selectedDistrictNational}, {selectedCity}, {selectedProvince}</b></span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Pilih Layanan Kurir / Ekspedisi Nasional:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {calculateNationalShippingOptionsDetailed(selectedProvince, selectedCity, selectedDistrictNational, totalWeightGram, settings.enabledNationalCouriers).map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => setSelectedCourierCode(c.code)}
                          className={`p-3 rounded-2xl text-left border-2 transition-all flex flex-col justify-between ${
                            selectedCourierCode === c.code
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          <div>
                            <span className="block font-black text-xs">{c.name}</span>
                            <span className="block text-[10px] opacity-85 mt-0.5 font-medium">{c.service}</span>
                          </div>
                          <div className="mt-2 pt-1 border-t border-current/20 flex items-center justify-between text-[11px] font-bold">
                            <span>{c.etd}</span>
                            <span className="text-xs font-black">{formatRupiah(c.cost)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Payment Gateway */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">3</span>
                <span>Pilih Metode Pembayaran</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('PAKASIR_QRIS')}
                  className={`p-3.5 rounded-2xl text-left border-2 transition-all flex flex-col justify-between ${
                    paymentMethod === 'PAKASIR_QRIS'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-slate-900 dark:text-white shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <QrCode className="w-6 h-6 text-indigo-600" />
                    {paymentMethod === 'PAKASIR_QRIS' && <Check className="w-4 h-4 text-indigo-600 font-bold" />}
                  </div>
                  <div>
                    <p className="font-bold text-xs">Pakasir QRIS (Otomatis)</p>
                    <p className="text-[10px] text-slate-500">BCA, Dana, OVO, Gopay, ShopeePay</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  className={`p-3.5 rounded-2xl text-left border-2 transition-all flex flex-col justify-between ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-slate-900 dark:text-white shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <CreditCard className="w-6 h-6 text-indigo-600" />
                    {paymentMethod === 'BANK_TRANSFER' && <Check className="w-4 h-4 text-indigo-600 font-bold" />}
                  </div>
                  <div>
                    <p className="font-bold text-xs">Transfer Bank BCA / BRI</p>
                    <p className="text-[10px] text-slate-500">Konfirmasi manual via WhatsApp</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-3.5 rounded-2xl text-left border-2 transition-all flex flex-col justify-between ${
                    paymentMethod === 'COD'
                      ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-slate-900 dark:text-white shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <Truck className="w-6 h-6 text-emerald-600" />
                    {paymentMethod === 'COD' && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
                  </div>
                  <div>
                    <p className="font-bold text-xs">COD (Bayar di Tempat)</p>
                    <p className="text-[10px] text-slate-500">Bayar tunai ke kurir saat barang tiba</p>
                  </div>
                </button>
              </div>

              {paymentMethod === 'COD' && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    <b>Sistem COD Aktif:</b> Anda tidak perlu bayar sekarang. Siapkan uang pas sebesar <b>{formatRupiah(finalTotalAmount)}</b> untuk diserahkan ke kurir saat barang sampai.
                  </span>
                </div>
              )}
            </div>

            {/* Summary & Submit */}
            <div className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal Barang:</span>
                <span className="font-bold">{formatRupiah(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Diskon Kupon:</span>
                  <span>-{formatRupiah(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Biaya Pengiriman:</span>
                <span className="font-bold">{formatRupiah(shippingFee)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-indigo-600 dark:text-indigo-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>TOTAL AKHIR:</span>
                <span>{formatRupiah(finalTotalAmount)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <span>{isSubmitting ? 'Memproses Pesanan...' : 'Buat Pesanan & Bayar'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
