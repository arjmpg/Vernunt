import React, { useState, useMemo } from 'react';
import { X, Search, Sparkles, Star, Tag, Check, Filter } from 'lucide-react';
import type { StoreProduct, StoreCategory } from '../../types/store.ts';

interface AdminShowcaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: StoreProduct[];
  categories: StoreCategory[];
  onToggleFeatured: (productId: string) => void;
  onToggleHighlighted: (productId: string) => void;
  onBatchUpdate?: (updatedProducts: StoreProduct[]) => void;
}

export const AdminShowcaseManagerModal: React.FC<AdminShowcaseManagerModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  onToggleFeatured,
  onToggleHighlighted,
  onBatchUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'featured' | 'highlighted' | 'deals'>('all');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const featuredCount = useMemo(() => products.filter(p => p.isFeatured).length, [products]);
  const highlightedCount = useMemo(() => products.filter(p => p.isHighlighted).length, [products]);
  const dealsCount = useMemo(() => products.filter(p => (p.discountPercentage || 0) > 0 || (p.regularPrice > p.price)).length, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Tab filter
      if (activeTab === 'featured' && !p.isFeatured) return false;
      if (activeTab === 'highlighted' && !p.isHighlighted) return false;
      if (activeTab === 'deals') {
        const disc = p.discountPercentage ?? (p.regularPrice > p.price ? Math.round(((p.regularPrice - p.price) / p.regularPrice) * 100) : 0);
        if (disc <= 0) return false;
      }

      // Category filter
      if (selectedCat !== 'all') {
        const catObj = categories.find(c => c.id === selectedCat);
        if (catObj) {
          const catName = catObj.name.toLowerCase();
          const pCat = p.category.toLowerCase();
          if (!pCat.includes(catObj.id.toLowerCase()) && !pCat.includes(catName)) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchBrand = (p.brand || '').toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchBrand) return false;
      }

      return true;
    }).sort((a, b) => {
      if (activeTab === 'deals') {
        const discA = a.discountPercentage ?? (a.regularPrice > a.price ? Math.round(((a.regularPrice - a.price) / a.regularPrice) * 100) : 0);
        const discB = b.discountPercentage ?? (b.regularPrice > b.price ? Math.round(((b.regularPrice - b.price) / b.regularPrice) * 100) : 0);
        return discB - discA;
      }
      return 0;
    });
  }, [products, activeTab, selectedCat, searchQuery, categories]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg shrink-0">
              ⚙️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Admin Showcase & Carousel Manager
                </h3>
                <span className="text-[10px] font-black bg-purple-100 text-purple-800 uppercase px-2 py-0.5 rounded-full">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Mark products to showcase in Featured, Highlighted, and Category carousels on the storefront
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center border border-slate-200 transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Metrics Strip */}
        <div className="px-5 py-3 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="font-bold text-slate-700">
              Total Catalog: <strong className="text-slate-900 font-mono">{products.length}</strong>
            </span>
            <span className="text-slate-300">·</span>
            <span className="font-bold text-purple-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Featured: </span>
              <strong className="font-mono">{featuredCount}</strong>
            </span>
            <span className="text-slate-300">·</span>
            <span className="font-bold text-amber-700 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Highlighted: </span>
              <strong className="font-mono">{highlightedCount}</strong>
            </span>
            <span className="text-slate-300">·</span>
            <span className="font-bold text-rose-700 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-rose-500" />
              <span>Top Discounts: </span>
              <strong className="font-mono">{dealsCount}</strong>
            </span>
          </div>

          {/* Quick Preset Buttons */}
          {onBatchUpdate && (
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={() => {
                  const sorted = [...products].sort((a, b) => b.rating - a.rating);
                  const top5Ids = new Set(sorted.slice(0, 6).map(p => p.id));
                  const updated = products.map(p => ({
                    ...p,
                    isFeatured: top5Ids.has(p.id) ? true : p.isFeatured
                  }));
                  onBatchUpdate(updated);
                }}
                className="text-[11px] font-bold text-purple-700 hover:bg-purple-50 px-2 py-1 rounded-md border border-purple-200 transition cursor-pointer"
              >
                + Feature Top Rated
              </button>
              <button
                type="button"
                onClick={() => {
                  const sorted = [...products].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
                  const top5Ids = new Set(sorted.slice(0, 6).map(p => p.id));
                  const updated = products.map(p => ({
                    ...p,
                    isHighlighted: top5Ids.has(p.id) ? true : p.isHighlighted
                  }));
                  onBatchUpdate(updated);
                }}
                className="text-[11px] font-bold text-amber-700 hover:bg-amber-50 px-2 py-1 rounded-md border border-amber-200 transition cursor-pointer"
              >
                + Highlight Best Sellers
              </button>
            </div>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="p-3 sm:px-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('featured')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'featured' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:text-purple-700'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Featured ({featuredCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('highlighted')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'highlighted' ? 'bg-amber-500 text-slate-950 shadow-2xs' : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <Star className="w-3 h-3 fill-current" />
              <span>Highlighted ({highlightedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('deals')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'deals' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <span>🔥 Top Discounts ({dealsCount})</span>
            </button>
          </div>

          {/* Category Dropdown & Search */}
          <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
            <div className="relative shrink-0">
              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 outline-hidden focus:border-purple-500 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.filter(c => c.id !== 'all').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search product, brand, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-hidden focus:border-purple-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Products Table/List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Filter className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-bold text-sm text-slate-600">No matching products found</p>
              <p className="text-xs">Try clearing filters or search query</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              {filteredProducts.map(product => {
                const discountPct = product.discountPercentage ?? (
                  product.regularPrice > product.price 
                    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100) 
                    : 0
                );

                return (
                  <div
                    key={product.id}
                    className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition"
                  >
                    {/* Thumbnail & Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                        <img
                          src={product.featuredImage}
                          alt={product.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {product.name}
                          </h4>
                          {discountPct > 0 && (
                            <span className="text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded shrink-0">
                              {discountPct}% OFF
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-bold text-slate-700">{product.category}</span>
                          {product.subcategory && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span>{product.subcategory}</span>
                            </>
                          )}
                          <span className="text-slate-300">·</span>
                          <span className="font-mono">₹{product.price}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-amber-600 font-bold">★ {product.rating}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Toggles */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Featured Toggle */}
                      <button
                        type="button"
                        onClick={() => onToggleFeatured(product.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer select-none ${
                          product.isFeatured
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-700 border border-slate-200'
                        }`}
                        title={product.isFeatured ? 'Click to remove from Featured' : 'Click to mark as Featured'}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                          {product.isFeatured ? 'Featured' : 'Not Featured'}
                        </span>
                        {product.isFeatured && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      {/* Highlighted Toggle */}
                      <button
                        type="button"
                        onClick={() => onToggleHighlighted(product.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer select-none ${
                          product.isHighlighted
                            ? 'bg-amber-500 text-slate-950 shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-800 border border-slate-200'
                        }`}
                        title={product.isHighlighted ? 'Click to remove from Highlighted' : 'Click to mark as Highlighted'}
                      >
                        <Star className={`w-3.5 h-3.5 ${product.isHighlighted ? 'fill-slate-950' : ''}`} />
                        <span className="hidden sm:inline">
                          {product.isHighlighted ? 'Highlighted' : 'Not Highlighted'}
                        </span>
                        {product.isHighlighted && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:px-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Changes take effect immediately on the store carousels.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Done & Return to Store
          </button>
        </div>
      </div>
    </div>
  );
};
