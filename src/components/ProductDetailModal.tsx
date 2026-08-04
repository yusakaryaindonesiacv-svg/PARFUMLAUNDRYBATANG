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
      imageUrl: selectedVolume.imageUrl || product.imageUrl,
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

  const currentDisplayImage = selectedVolume.imageUrl || product.imageUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-100/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-5 sm:p-7 space-y-5">
          
          {/* Header Info: Category Tag & Product Title */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800">
                {product.category}
              </span>
              <span className={`text-xs font-bold ${selectedVolume.stock < 5 ? 'text-rose-500' : 'text-emerald-600'}`}>
                Stok: {selectedVolume.stock} unit
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {product.name}
            </h2>
          </div>

          {/* 1. GAMBAR PRODUK (Product Image) - Dynamically updates on variant select */}
          <div className="relative w-full aspect-16/9 sm:aspect-21/9 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md group">
            <img
              src={currentDisplayImage}
              alt={`${product.name} - ${selectedVolume.name}`}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {selectedVolume.imageUrl && (
              <div className="absolute bottom-2.5 right-2.5 px-3 py-1 bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-bold rounded-xl border border-white/20 flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Foto Varian: {selectedVolume.name}</span>
              </div>
            )}
          </div>

          {/* 2. PILIH UKURAN & KEMASAN (Located BELOW Product Image & ABOVE Description) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>PILIH UKURAN & KEMASAN:</span>
              </label>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                {product.volumes.length} Varian
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {product.volumes.map((vol) => {
                const isSelected = selectedVolume.id === vol.id;
                const volThumb = vol.imageUrl || product.imageUrl;

                return (
                  <button
                    key={vol.id}
                    onClick={() => {
                      setSelectedVolume(vol);
                      setQuantity(1);
                    }}
                    className={`p-2.5 rounded-2xl text-left border-2 transition-all flex items-center gap-2.5 relative ${
                      isSelected
                        ? 'border-indigo-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                  >
                    {/* Variant Thumbnail */}
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 relative">
                      <img src={volThumb} alt={vol.name} className="w-full h-full object-cover" />
                      {vol.imageUrl && (
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-indigo-600 rounded-bl-md" title="Ada Foto Khusus Varian" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs truncate leading-tight">{vol.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400">
                          {formatRupiah(vol.price)}
                        </span>
                        {vol.originalPrice && vol.originalPrice > vol.price && (
                          <span className="text-[9px] text-rose-500 line-through">
                            {formatRupiah(vol.originalPrice)}
                          </span>
                        )}
                      </div>
                      {vol.wholesalePrice < vol.price && (
                        <div className="mt-0.5 text-[8px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/80 px-1 py-0.2 rounded border border-emerald-200 dark:border-emerald-800 inline-block">
                          Grosir {formatRupiah(vol.wholesalePrice)}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. DESKRIPSI PRODUK (Located BELOW PILIH UKURAN & KEMASAN) */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Deskripsi Produk:
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              {product.description}
            </p>

            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Karakter Aroma: <strong>{product.scentFamily}</strong></span>
              </div>
            </div>
          </div>

          {/* Wholesale Discount Alert */}
          {selectedVolume.wholesaleMinQty > 0 && selectedVolume.wholesalePrice < selectedVolume.price && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-3 text-xs text-amber-800 dark:text-amber-200">
              <Tag className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold">PROMO GROSIR PABRIK!</p>
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
