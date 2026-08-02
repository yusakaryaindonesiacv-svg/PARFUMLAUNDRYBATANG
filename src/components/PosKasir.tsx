import React, { useState } from 'react';
import { Product, Customer, CartItem, Order, VolumeOption, PaymentMethod, StoreSettings } from '../types';
import { Search, Plus, Minus, Trash2, Printer, Share2, Receipt, User, Tag, Check, Sparkles } from 'lucide-react';
import { formatRupiah, formatDateIndo } from '../lib/excelPdf';

interface PosKasirProps {
  products: Product[];
  customers: Customer[];
  settings?: StoreSettings;
  onCompleteSale: (order: Order) => void;
}

export const PosKasir: React.FC<PosKasirProps> = ({ products, customers, settings, onCompleteSale }) => {
  const [search, setSearch] = useState('');
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('WALK_IN');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Filter products by SKU/code or name
  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const handleAddToCart = (product: Product, volume: VolumeOption) => {
    setPosCart((prev) => {
      const existing = prev.find(
        (item) => item.productId === product.id && item.volumeId === volume.id
      );
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id && item.volumeId === volume.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          imageUrl: product.imageUrl,
          volumeId: volume.id,
          volumeName: volume.name,
          volumeMl: volume.volumeMl,
          unitPrice: volume.price,
          originalPrice: volume.price,
          cogs: volume.cogs,
          quantity: 1,
        },
      ];
    });
  };

  const handleUpdateQty = (productId: string, volumeId: string, delta: number) => {
    setPosCart((prev) =>
      prev
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

  const handleRemove = (productId: string, volumeId: string) => {
    setPosCart((prev) =>
      prev.filter((item) => !(item.productId === productId && item.volumeId === volumeId))
    );
  };

  const subtotal = posCart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const totalCogs = posCart.reduce((acc, item) => acc + item.cogs * item.quantity, 0);
  const finalTotal = Math.max(0, subtotal - discountAmount);
  const changeAmount = Math.max(0, cashGiven - finalTotal);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleProcessSale = () => {
    if (posCart.length === 0) return;
    if (paymentMethod === 'CASH' && cashGiven < finalTotal) {
      alert('Jumlah uang tunai kurang!');
      return;
    }

    const orderNumber = `POS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 899 + 100)}`;
    const newOrder: Order = {
      id: `ord-pos-${Date.now()}`,
      orderNumber,
      customerName: selectedCustomer ? selectedCustomer.name : 'Pelanggan Kasir Tunai',
      customerPhone: selectedCustomer ? selectedCustomer.phone : '085700000000',
      customerAddress: selectedCustomer ? selectedCustomer.address : 'Toko Kalisalak Batang (Walk-in)',
      items: posCart,
      subtotal,
      discountAmount,
      shippingFee: 0,
      shippingType: 'TAKEAWAY',
      shippingDetail: 'Kasir POS Walk-in',
      totalAmount: finalTotal,
      totalCogs,
      paymentMethod,
      paymentStatus: paymentMethod === 'HUTANG' ? 'UNPAID' : 'PAID',
      orderStatus: 'DELIVERED',
      createdAt: new Date().toISOString(),
      isPosSale: true,
    };

    onCompleteSale(newOrder);
    setCompletedOrder(newOrder);
    setPosCart([]);
    setCashGiven(0);
    setDiscountAmount(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Thermal Receipt Print Modal Overlay */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-white text-slate-900 rounded-3xl p-6 shadow-2xl space-y-4">
            
            <div id="printable-receipt" className="font-mono text-xs space-y-3 p-2 border border-dashed border-slate-300 rounded-xl bg-slate-50">
              <div className="text-center">
                {settings?.appLogoUrl && (
                  <div className="flex justify-center mb-1.5">
                    <img src={settings.appLogoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
                  </div>
                )}
                <h2 className="font-black text-sm">{settings?.storeName || 'PARFUM LAUNDRY BATANG'}</h2>
                <p className="text-[10px] text-slate-600">{settings?.address || 'Jl. Jendral Sudirman No. 142, Batang'}</p>
                <p className="text-[10px] text-slate-600">WA: {settings?.phone || '0857-4288-9900'}</p>
                <div className="my-2 border-b border-dashed border-slate-400" />
              </div>

              <div className="text-[10px] space-y-0.5">
                <p>Nota: <strong>{completedOrder.orderNumber}</strong></p>
                <p>Tgl: {formatDateIndo(completedOrder.createdAt)}</p>
                <p>Pelanggan: {completedOrder.customerName}</p>
                <p>Kasir: Staff On-Duty</p>
              </div>

              <div className="my-2 border-b border-dashed border-slate-400" />

              {/* Items */}
              <div className="space-y-1">
                {completedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <div>
                      <p className="font-bold">{item.productName}</p>
                      <p className="text-[9px] text-slate-500">{item.volumeName} x{item.quantity}</p>
                    </div>
                    <span className="font-bold">{formatRupiah(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="my-2 border-b border-dashed border-slate-400" />

              <div className="text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(completedOrder.subtotal)}</span>
                </div>
                {completedOrder.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(completedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-xs">
                  <span>TOTAL:</span>
                  <span>{formatRupiah(completedOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Metode:</span>
                  <span>{completedOrder.paymentMethod}</span>
                </div>
              </div>

              <div className="my-2 border-b border-dashed border-slate-400" />
              <p className="text-center text-[10px] italic">*** Terima Kasih Telah Berbelanja ***</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Nota</span>
              </button>

              <button
                onClick={() => setCompletedOrder(null)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* POS Screen Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Product Search & Quick Grid (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Header & Search */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Kasir Kasir POS Toko</h2>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Cari SKU / Aroma..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <span className="text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                    {p.code}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                    {p.name}
                  </h4>
                  <p className="text-[10px] text-slate-400">{p.scentFamily}</p>
                </div>

                <div className="mt-2 space-y-1">
                  {p.volumes.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleAddToCart(p, v)}
                      className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold flex items-center justify-between transition-colors border border-slate-200/60 dark:border-slate-700"
                    >
                      <span className="truncate max-w-[80px]">{v.name}</span>
                      <span>{formatRupiah(v.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right Side: POS Billing Cart & Payment (5 Columns) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-5 flex flex-col justify-between space-y-4">
          
          <div>
            {/* Customer CRM Selector */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-600" /> Select Customer (CRM):
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700"
              >
                <option value="WALK_IN">Pelanggan Kasir Tunai (Walk-in)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.phone} ({c.membershipTier})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Items Table */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {posCart.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Belum ada barang dipilih. Klik tombol ukuran produk di sebelah kiri.
                </div>
              ) : (
                posCart.map((item) => (
                  <div
                    key={`${item.productId}-${item.volumeId}`}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{item.productName}</p>
                      <p className="text-[10px] text-indigo-600 font-semibold">{item.volumeName}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 px-1">
                        <button
                          onClick={() => handleUpdateQty(item.productId, item.volumeId, -1)}
                          className="p-1 hover:text-indigo-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold px-1.5">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQty(item.productId, item.volumeId, 1)}
                          className="p-1 hover:text-indigo-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-extrabold w-16 text-right">
                        {formatRupiah(item.unitPrice * item.quantity)}
                      </span>

                      <button
                        onClick={() => handleRemove(item.productId, item.volumeId)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment Calculation Area */}
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            
            {/* Discount Manual */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400">Diskon Nota (Rp):</span>
              <input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="w-28 bg-slate-50 dark:bg-slate-800 text-right font-bold px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2 font-bold rounded-xl border transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Tunai
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`py-2 font-bold rounded-xl border transition-all ${
                  paymentMethod === 'COD'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                COD
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('PAKASIR_QRIS')}
                className={`py-2 font-bold rounded-xl border transition-all ${
                  paymentMethod === 'PAKASIR_QRIS'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                QRIS
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('HUTANG')}
                className={`py-2 font-bold rounded-xl border transition-all ${
                  paymentMethod === 'HUTANG'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Hutang
              </button>
            </div>

            {/* Cash Given & Change */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold">Uang Diterima:</span>
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(Number(e.target.value))}
                    placeholder="0"
                    className="w-32 bg-white dark:bg-slate-900 font-black text-right px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div className="flex items-center justify-between font-bold text-emerald-600">
                  <span>Kembalian:</span>
                  <span>{formatRupiah(changeAmount)}</span>
                </div>
              </div>
            )}

            {/* Final Total Display */}
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-indigo-900 dark:text-indigo-200">
              <span className="text-xs font-bold uppercase tracking-wider">TOTAL BAYAR:</span>
              <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                {formatRupiah(finalTotal)}
              </span>
            </div>

            <button
              onClick={handleProcessSale}
              disabled={posCart.length === 0}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all"
            >
              Proses Transaksi & Cetak Nota
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};
