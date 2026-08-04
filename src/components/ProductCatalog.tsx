import React, { useState } from 'react';
import { Product, Category, Order } from '../types';
import { Sparkles, Star, ShoppingCart, Info, Flame } from 'lucide-react';
import { formatRupiah } from '../lib/excelPdf';

interface ProductCatalogProps {
  products: Product[];
  categories: Category[];
  orders?: Order[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  categories,
  orders = [],
  searchQuery,
  setSearchQuery,
  onSelectProduct,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredProducts = products.filter((prod) => {
    // Category filter
    if (selectedCategory !== 'ALL' && prod.category !== selectedCategory) return false;
    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = prod.name.toLowerCase().includes(q);
      const matchDesc = prod.description.toLowerCase().includes(q);
      const matchCode = prod.code.toLowerCase().includes(q);
      const matchCategory = prod.category.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCode && !matchCategory) return false;
    }
    return true;
  });

  return (
    <section id="catalog" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      
      {/* Title & Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-6 gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Katalog Produk & Formula Laundry</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Pilihan Parfum & Formula Pakaian
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tersedia kemasan Botol Spray 250ml, 1 Liter Refill, hingga Jirigen 5 Liter Grosir.
          </p>
        </div>

        {/* Search Input Mobile & Tablet */}
        <div className="w-full md:w-72 md:hidden">
          <input
            type="text"
            placeholder="Cari produk (Akasia, Downy, Philux)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Category Tabs Scrollable */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-2 sm:pb-3 mb-4 sm:mb-6 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Semua ({products.length})
        </button>
        {Array.from(new Set([
          ...categories.map(c => c.name),
          ...products.map(p => p.category)
        ])).filter(Boolean).map((catName) => {
          const count = products.filter((p) => p.category === catName).length;
          return (
            <button
              key={catName}
              onClick={() => setSelectedCategory(catName)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === catName
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {catName} ({count})
            </button>
          );
        })}
      </div>

      {/* Products Grid - 2 columns on mobile */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <Info className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300">Tidak ada produk yang ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter kategori Anda.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
            }}
            className="mt-4 px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-6">
          {filteredProducts.map((product) => {
            // Find min and max prices
            const prices = product.volumes.map((v) => v.price);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);

            // Determine custom slashed price (harga coret) set in Admin Panel
            let displayOriginalPrice: number | null = null;
            if (product.originalPrice && product.originalPrice > minPrice) {
              displayOriginalPrice = product.originalPrice;
            } else {
              const origPrices = product.volumes
                .map((v) => v.originalPrice)
                .filter((p): p is number => !!p && p > minPrice);
              if (origPrices.length > 0) {
                displayOriginalPrice = Math.min(...origPrices);
              } else {
                displayOriginalPrice = Math.round(minPrice * 1.25);
              }
            }

            // Real sold count calculation from completed orders
            const ordersSalesCount = orders
              .filter(
                (o) =>
                  o.paymentStatus === 'PAID' ||
                  o.orderStatus === 'COMPLETED' ||
                  o.orderStatus === 'PROCESSING' ||
                  o.orderStatus === 'DELIVERED'
              )
              .flatMap((o) => o.items || [])
              .filter((item) => item.productId === product.id)
              .reduce((sum, item) => sum + item.quantity, 0);

            const realSoldCount = (product.salesCount || 0) + ordersSalesCount;
            const variantSummary = product.volumes.map((v) => v.name).join(', ');

            return (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="group bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Product Image & Badges */}
                  <div className="relative aspect-4/3 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Top Badges: BEST SELLER if isPopular */}
                    <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-col gap-1 max-w-[85%]">
                      {product.isPopular && (
                        <span className="px-2 py-0.5 text-[8px] sm:text-[10px] font-black uppercase bg-rose-600 text-white rounded-full flex items-center gap-1 shadow-md">
                          <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 fill-current text-amber-300" /> BEST SELLER
                        </span>
                      )}
                    </div>

                    {/* Rating Badge */}
                    <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 px-1.5 py-0.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-800 dark:text-slate-200 text-[10px] sm:text-xs font-bold rounded-md sm:rounded-lg flex items-center gap-0.5 shadow-sm">
                      <Star className="w-3 h-3 text-amber-400 fill-current shrink-0" />
                      <span>{product.rating}</span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-2.5 sm:p-4 space-y-1">
                    {/* Category & Real Terjual */}
                    <div className="flex items-center justify-between text-[9px] sm:text-[11px] gap-1">
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider truncate">
                        {product.category}
                      </span>
                      <span className="font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] shrink-0">
                        {realSoldCount} Terjual
                      </span>
                    </div>

                    {/* Nama Produk */}
                    <h3 className="font-bold text-xs sm:text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 leading-tight">
                      {product.name}
                    </h3>

                    {/* Varian */}
                    <div className="pt-1">
                      <span className="inline-block bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 px-2 py-0.5 rounded-md font-semibold text-[9px] sm:text-[11px] text-slate-600 dark:text-slate-300">
                        Varian: {variantSummary}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Price & Keranjang Button */}
                <div className="p-2.5 sm:p-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-1 flex flex-col sm:flex-row sm:items-end justify-between gap-1.5">
                  <div>
                    {/* Harga Coret */}
                    {displayOriginalPrice && displayOriginalPrice > minPrice && (
                      <span className="text-[10px] sm:text-[11px] text-slate-400 line-through block font-medium leading-none mb-0.5">
                        {formatRupiah(displayOriginalPrice)}
                      </span>
                    )}
                    {/* Harga Diskon / Jual */}
                    <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 leading-none">
                      {minPrice === maxPrice
                        ? formatRupiah(minPrice)
                        : `${formatRupiah(minPrice)} - ${formatRupiah(maxPrice)}`}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProduct(product);
                    }}
                    className="w-full sm:w-auto px-2.5 py-1.5 sm:px-3 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-indigo-600/20 transition-all transform active:scale-95 shrink-0"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Keranjang</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </section>
  );
};
