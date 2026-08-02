import React, { useState } from 'react';
import { Order } from '../types';
import { Search, Truck, Clock, CheckCircle2, PackageCheck, AlertCircle, Phone, MapPin } from 'lucide-react';
import { formatRupiah, formatDateIndo } from '../lib/excelPdf';

interface OrderTrackingProps {
  orders: Order[];
}

export const OrderTracking: React.FC<OrderTrackingProps> = ({ orders }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(orders[0] || null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const match = orders.find(
      (o) =>
        o.orderNumber.toLowerCase() === searchQuery.trim().toLowerCase() ||
        o.customerPhone.includes(searchQuery.trim())
    );

    if (match) {
      setSearchedOrder(match);
    } else {
      alert('Pesanan dengan No. Order atau No. HP tersebut tidak ditemukan.');
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full">
          Pelacakan Real-time
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Lacak Status Pengiriman Pesanan
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Masukkan No. Pesanan (contoh: PLB-20260731-001) atau No. WhatsApp Anda untuk melacak status paket.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-2">
        <input
          type="text"
          placeholder="No. Pesanan atau No. HP..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-white dark:bg-slate-900 text-xs px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
        <button
          type="submit"
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl shadow-md flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          <span>Lacak</span>
        </button>
      </form>

      {/* Order Details Display Card */}
      {searchedOrder && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
          
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-2">
            <div>
              <span className="text-xs text-slate-400 font-mono">No. Pesanan:</span>
              <h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                {searchedOrder.orderNumber}
              </h3>
              <p className="text-[11px] text-slate-500">Dibuat: {formatDateIndo(searchedOrder.createdAt)}</p>
            </div>

            <div className="flex items-center gap-2">
              {searchedOrder.paymentMethod === 'COD' ? (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 rounded-full text-xs font-bold border border-amber-300 dark:border-amber-700">
                  🚚 COD (Bayar di Tempat)
                </span>
              ) : (
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  searchedOrder.paymentStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  Bayar: {searchedOrder.paymentStatus}
                </span>
              )}

              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold">
                Kirim: {searchedOrder.orderStatus}
              </span>
            </div>
          </div>

          {/* Timeline Status Simulator */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              Status Perjalanan Paket:
            </h4>

            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
              <div className={`p-3 rounded-2xl border ${
                searchedOrder.orderStatus === 'PENDING' || searchedOrder.orderStatus === 'PROCESSED' || searchedOrder.orderStatus === 'SHIPPED' || searchedOrder.orderStatus === 'DELIVERED'
                  ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-400'
              }`}>
                <Clock className="w-5 h-5 mx-auto mb-1" />
                <span>Pesanan Diterima</span>
              </div>

              <div className={`p-3 rounded-2xl border ${
                searchedOrder.orderStatus === 'PROCESSED' || searchedOrder.orderStatus === 'SHIPPED' || searchedOrder.orderStatus === 'DELIVERED'
                  ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-400'
              }`}>
                <PackageCheck className="w-5 h-5 mx-auto mb-1" />
                <span>Dikemas di Toko</span>
              </div>

              <div className={`p-3 rounded-2xl border ${
                searchedOrder.orderStatus === 'SHIPPED' || searchedOrder.orderStatus === 'DELIVERED'
                  ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-400'
              }`}>
                <Truck className="w-5 h-5 mx-auto mb-1" />
                <span>Dalam Kurir</span>
              </div>

              <div className={`p-3 rounded-2xl border ${
                searchedOrder.orderStatus === 'DELIVERED'
                  ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-400'
              }`}>
                <CheckCircle2 className="w-5 h-5 mx-auto mb-1" />
                <span>Tiba di Lokasi</span>
              </div>
            </div>
          </div>

          {/* Customer & Items Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Tujuan Pengiriman:</p>
              <p className="text-slate-900 dark:text-white font-bold">{searchedOrder.customerName}</p>
              <p className="text-slate-500">{searchedOrder.customerAddress}</p>
              <p className="text-indigo-600 font-semibold mt-1">{searchedOrder.shippingDetail}</p>
            </div>

            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Rincian Pembelian:</p>
              <div className="space-y-1">
                {searchedOrder.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{i.productName} ({i.volumeName}) x{i.quantity}</span>
                    <span className="font-bold">{formatRupiah(i.unitPrice * i.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-sm text-indigo-600">
                <span>Total Bayar:</span>
                <span>{formatRupiah(searchedOrder.totalAmount)}</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </section>
  );
};
