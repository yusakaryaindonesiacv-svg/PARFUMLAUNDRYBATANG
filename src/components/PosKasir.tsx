import React, { useState } from 'react';
import { Product, Customer, CartItem, Order, VolumeOption, PaymentMethod, StoreSettings } from '../types';
import { Search, Plus, Minus, Trash2, Printer, Receipt, User, ShoppingCart, DollarSign, Package, Sparkles, Check } from 'lucide-react';
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

  // Selected volume state for each product: productId -> volumeId
  const [selectedVolumes, setSelectedVolumes] = useState<Record<string, string>>({});

  // Filter products by SKU/code or name or scent family
  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.scentFamily && p.scentFamily.toLowerCase().includes(q))
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

  const handleClearCart = () => {
    if (posCart.length === 0) return;
    if (confirm('Kosongkan keranjang belanja kasir?')) {
      setPosCart([]);
    }
  };

  const subtotal = posCart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const totalCogs = posCart.reduce((acc, item) => acc + item.cogs * item.quantity, 0);
  const finalTotal = Math.max(0, subtotal - discountAmount);
  const changeAmount = Math.max(0, cashGiven - finalTotal);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleProcessSale = () => {
    if (posCart.length === 0) return;
    if (paymentMethod === 'CASH' && cashGiven < finalTotal) {
      alert('Jumlah uang tunai diterima kurang dari total bayar!');
      return;
    }

    const orderNumber = `POS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 899 + 100)}`;
    const newOrder: Order = {
      id: `ord-pos-${Date.now()}`,
      orderNumber,
      customerName: selectedCustomer ? selectedCustomer.name : 'Pelanggan Kasir Tunai',
      customerPhone: selectedCustomer ? selectedCustomer.phone : '085700000000',
      customerAddress: selectedCustomer ? selectedCustomer.address : 'Toko Kalisalak Batang (Walk-in)',
      customerId: selectedCustomer ? selectedCustomer.id : undefined,
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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-6">
      
      {/* Thermal Receipt Print Modal Overlay */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white text-slate-900 rounded-3xl p-6 shadow-2xl space-y-4">
            
            <div id="printable-receipt" className="font-mono text-xs space-y-3 p-3 border border-dashed border-slate-300 rounded-xl bg-slate-50">
              <div className="text-center">
                {settings?.appLogoUrl && (
                  <div className="flex justify-center mb-1.5">
                    <img src={settings.appLogoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
                  </div>
                )}
                <h2 className="font-black text-sm uppercase">{settings?.storeName || 'PARFUM LAUNDRY BATANG'}</h2>
                <p className="text-[10px] text-slate-600">{settings?.address || 'Jl. Jendral Sudirman No. 142, Batang'}</p>
                <p className="text-[10px] text-slate-600">WA: {settings?.phone || '0857-4288-9900'}</p>
                <div className="my-2 border-b border-dashed border-slate-400" />
              </div>

              <div className="text-[10px] space-y-0.5">
                <p>Nota: <strong>{completedOrder.orderNumber}</strong></p>
                <p>Tgl: {formatDateIndo(completedOrder.createdAt)}</p>
                <p>Pelanggan: {completedOrder.customerName}</p>
                <p>Kasir: Staff On-Duty POS</p>
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
                <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-slate-300">
                  <span>TOTAL:</span>
                  <span>{formatRupiah(completedOrder.totalAmount)}</span>
                </div>
                {completedOrder.paymentMethod === 'CASH' && (
                  <>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>Uang Diterima:</span>
                      <span>{formatRupiah(completedOrder.totalAmount + (cashGiven - finalTotal))}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-emerald-600">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(changeAmount)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-[10px]">
                  <span>Metode:</span>
                  <span className="uppercase font-bold">{completedOrder.paymentMethod}</span>
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
                <span>Cetak Nota Thermal</span>
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

      {/* TOP SECTION: KOLOM TRANSAKSI KASIR (TRANSACTION & BILLING) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Transaction Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-indigo-850 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 rounded-2xl border border-indigo-400/30 text-indigo-300">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">Kolom Transaksi Kasir POS</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {posCart.reduce((s, i) => s + i.quantity, 0)} Item Dipesan
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">Ringkasan transaksi kasir, item belanjaan, dan pembayaran kasir instant.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {posCart.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold rounded-xl border border-rose-400/30 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Kosongkan
              </button>
            )}
            <div className="px-3 py-1.5 bg-white/10 rounded-xl border border-white/15 text-xs font-mono font-bold text-emerald-300">
              Total: {formatRupiah(finalTotal)}
            </div>
          </div>
        </div>

        {/* Transaction Main Body (2 Columns Layout) */}
        <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column in Transaction Box: Customer Selector & Cart Items List */}
          <div className="lg:col-span-7 space-y-4">
            {/* Customer Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" /> Pelanggan / Member (CRM Toko):
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200"
              >
                <option value="WALK_IN">Pelanggan Kasir Tunai (Walk-in / Umum)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.phone} ({c.membershipTier})
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                  Daftar Barang Belanjaan ({posCart.length})
                </span>
                <span className="text-[10px] text-slate-400">Pilih varian produk dari list di bawah untuk menambah</span>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 bg-slate-50/50 dark:bg-slate-800/30">
                {posCart.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs space-y-1">
                    <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-500">Keranjang transaksi masih kosong.</p>
                    <p className="text-[10px]">Silakan pilih aroma & varian pada daftar produk di bawah.</p>
                  </div>
                ) : (
                  posCart.map((item) => (
                    <div
                      key={`${item.productId}-${item.volumeId}`}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs shadow-sm"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{item.productName}</p>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800 mt-0.5">
                          {item.volumeName}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Qty Controls */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.productId, item.volumeId, -1)}
                            className="p-1 hover:text-indigo-600 transition-colors"
                            title="Kurangi"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold px-2 text-xs">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.productId, item.volumeId, 1)}
                            className="p-1 hover:text-indigo-600 transition-colors"
                            title="Tambah"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Price */}
                        <span className="font-extrabold w-24 text-right text-slate-900 dark:text-slate-100">
                          {formatRupiah(item.unitPrice * item.quantity)}
                        </span>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => handleRemove(item.productId, item.volumeId)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Hapus Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column in Transaction Box: Payment & Checkout */}
          <div className="lg:col-span-5 space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            
            <div className="space-y-3">
              {/* Subtotal & Diskon */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Subtotal Belanja:</span>
                <span className="font-bold font-mono text-slate-900 dark:text-slate-100">{formatRupiah(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Diskon Nota (Rp):</span>
                <input
                  type="number"
                  min={0}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-28 bg-white dark:bg-slate-900 text-right font-bold text-xs px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600"
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Metode Pembayaran:
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`py-2 font-extrabold rounded-xl border transition-all ${
                      paymentMethod === 'CASH'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Tunai
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`py-2 font-extrabold rounded-xl border transition-all ${
                      paymentMethod === 'COD'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    COD
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PAKASIR_QRIS')}
                    className={`py-2 font-extrabold rounded-xl border transition-all ${
                      paymentMethod === 'PAKASIR_QRIS'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    QRIS
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('HUTANG')}
                    className={`py-2 font-extrabold rounded-xl border transition-all ${
                      paymentMethod === 'HUTANG'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Hutang
                  </button>
                </div>
              </div>

              {/* Cash Given & Change Calculation */}
              {paymentMethod === 'CASH' && (
                <div className="space-y-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Uang Diterima (Rp):</span>
                    <input
                      type="number"
                      value={cashGiven}
                      onChange={(e) => setCashGiven(Number(e.target.value))}
                      placeholder="0"
                      className="w-32 bg-slate-50 dark:bg-slate-800 font-black text-right px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600"
                    />
                  </div>

                  <div className="flex items-center justify-between font-extrabold text-emerald-600 dark:text-emerald-400">
                    <span>Kembalian:</span>
                    <span className="font-mono text-sm">{formatRupiah(changeAmount)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Total Display & Submit Button */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="p-3 bg-indigo-600 dark:bg-indigo-950 rounded-xl border border-indigo-500 dark:border-indigo-800 flex items-center justify-between text-white">
                <span className="text-xs font-bold uppercase tracking-wider">TOTAL BAYAR:</span>
                <span className="text-xl font-black font-mono text-amber-300">
                  {formatRupiah(finalTotal)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleProcessSale}
                disabled={posCart.length === 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                <span>Proses Transaksi & Cetak Nota</span>
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* BOTTOM SECTION: DAFTAR PRODUK (COMPACT LIST VIEW WITH DROPDOWN VARIAN) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-4">
        
        {/* Header & Search Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Daftar Produk & Varian Aromatis</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih ukuran/varian pada dropdown, lalu klik <span className="text-indigo-600 font-bold">+ Tambah</span> untuk dimasukkan ke kolom transaksi di atas.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-72 shrink-0">
            <input
              type="text"
              placeholder="Cari SKU, nama parfum, atau aroma..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Compact List View Table */}
        <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Nama Produk & Aroma</th>
                  <th className="p-3">Pilih Varian / Kemasan</th>
                  <th className="p-3 text-right">Harga</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Tidak ada produk pewangi yang cocok dengan kata kunci pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const selectedVolId = selectedVolumes[p.id] || (p.volumes[0]?.id ?? '');
                    const selectedVol = p.volumes.find((v) => v.id === selectedVolId) || p.volumes[0];

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        {/* SKU */}
                        <td className="p-3 align-middle font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px] shrink-0">
                          {p.code}
                        </td>

                        {/* Name & Scent Family */}
                        <td className="p-3 align-middle">
                          <span className="font-extrabold text-slate-900 dark:text-white block text-xs">
                            {p.name}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              Aroma: {p.scentFamily || 'Standar'}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                              {p.category}
                            </span>
                          </div>
                        </td>

                        {/* Dropdown Varian / Kemasan */}
                        <td className="p-3 align-middle max-w-[220px]">
                          {p.volumes && p.volumes.length > 0 ? (
                            <select
                              value={selectedVolId}
                              onChange={(e) =>
                                setSelectedVolumes((prev) => ({
                                  ...prev,
                                  [p.id]: e.target.value,
                                }))
                              }
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs px-2.5 py-1.5 rounded-xl font-bold cursor-pointer focus:ring-2 focus:ring-indigo-500"
                            >
                              {p.volumes.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.name} - {formatRupiah(v.price)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Tidak ada varian</span>
                          )}
                        </td>

                        {/* Harga Display for Selected Variant */}
                        <td className="p-3 align-middle text-right font-extrabold text-slate-900 dark:text-white text-xs font-mono">
                          {selectedVol ? formatRupiah(selectedVol.price) : '-'}
                        </td>

                        {/* Action + Tambah Button */}
                        <td className="p-3 align-middle text-center">
                          {selectedVol ? (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(p, selectedVol)}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-sm transition-all inline-flex items-center gap-1 shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Tambah</span>
                            </button>
                          ) : (
                            <button disabled className="px-3 py-1 bg-slate-200 text-slate-400 text-xs rounded-xl">
                              N/A
                            </button>
                          )}
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

    </div>
  );
};
