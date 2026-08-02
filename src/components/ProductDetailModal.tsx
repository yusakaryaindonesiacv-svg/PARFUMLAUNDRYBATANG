import React, { useState } from 'react';
import { Product, VolumeOption, CartItem } from '../types';
import { X, Plus, Minus, ShoppingBag, Check, ShieldCheck, Tag, Sparkles } from 'lucide-react';
import { formatRupiah } from '../lib/excelPdf';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  const [selectedVolume, setSelectedVolume] = useState<VolumeOption>(product.volumes[0] || {} as VolumeOption);
  const [quantity, setQuantity] = useState<number>(1);

  // Calculate unit price based on wholesale quantity
  const isWholesaleActive = quantity >= selectedVolume.wholesaleMinQty && selectedVolume.wholesalePrice > 0;
  const currentUnitPrice = isWholesaleActive ? selectedVolume.wholesalePrice : selectedVolume.price;
  const totalPrice = currentUnitPrice * quantity;

  const handleAddToCart = () => {
    const item: CartItem = {
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      volumeId: selectedVolume.id,
      volumeName: selectedVolume.name,
      volumeMl: selectedVolume.volumeMl,
      unitPrice: currentUnitPrice,
      originalPrice: selectedVolume.price,
      cogs: selectedVolume.cogs,
      quantity,
    };
    onAddToCart(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          
          {/* Top Section: Image & Basic Info */}
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-full sm:w-1/2 aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="w-full sm:w-1/2 flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800">
                  {product.category}
                </span>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2 leading-tight">
                  {product.name}
                </h2>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {product.description}
                </p>

                <div className="mt-4 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Karakter Aroma: <strong>{product.scentFamily}</strong></span>
                </div>
              </div>

              {/* Stock Info */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Stok Tersedia:</span>
                <span className={`font-bold ${selectedVolume.stock < 5 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {selectedVolume.stock} unit
                </span>
              </div>
            </div>
          </div>

          {/* Volume Selection Cards */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Pilih Ukuran & Kemasan:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {product.volumes.map((vol) => {
                const isSelected = selectedVolume.id === vol.id;
                return (
                  <button
                    key={vol.id}
                    onClick={() => {
                      setSelectedVolume(vol);
                      setQuantity(1);
                    }}
                    className={`p-3 rounded-xl text-left border-2 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-slate-900 dark:text-white shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{vol.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                      </div>
                      <span className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                        {formatRupiah(vol.price)}
                      </span>
                    </div>

                    {vol.wholesalePrice < vol.price && (
                      <div className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        Grosir: {formatRupiah(vol.wholesalePrice)} (min {vol.wholesaleMinQty})
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wholesale Discount Alert */}
          {selectedVolume.wholesaleMinQty > 0 && selectedVolume.wholesalePrice < selectedVolume.price && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-xs text-amber-800 dark:text-amber-200">
              <Tag className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold">PROMO GROSIR DARI PABRIK!</p>
                <p className="text-[11px] opacity-90">
                  Beli minimal {selectedVolume.wholesaleMinQty} unit {selectedVolume.name}, harga otomatis diskon dari {formatRupiah(selectedVolume.price)} jadi <strong>{formatRupiah(selectedVolume.wholesalePrice)}</strong> per unit.
                </p>
              </div>
            </div>
          )}

          {/* Quantity Selector & Total Price */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Total Harga:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {formatRupiah(totalPrice)}
                </span>
                {isWholesaleActive && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                    Hemat {formatRupiah((selectedVolume.price - selectedVolume.wholesalePrice) * quantity)}
                  </span>
                )}
              </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">Jumlah:</span>
              <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 font-bold text-sm text-slate-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(selectedVolume.stock, q + 1))}
                  className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer CTA */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl"
          >
            Batal
          </button>
          <button
            onClick={handleAddToCart}
            disabled={selectedVolume.stock < 1}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Tambah ke Keranjang ({quantity})</span>
          </button>
        </div>

      </div>
    </div>
  );
};
