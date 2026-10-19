import React, { useRef } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import type { StoreProduct, CartItem } from '../../types/store.ts';
import { ProductCarouselCard } from './ProductCarouselCard.tsx';

interface ProductCarouselSectionProps {
  icon: React.ReactNode;
  title: string;
  badgeText?: string;
  products: StoreProduct[];
  cart: CartItem[];
  wishlist: string[];
  onOpenProduct: (product: StoreProduct) => void;
  onAddToCart: (product: StoreProduct) => void;
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onToggleWishlist: (productId: string, e: React.MouseEvent) => void;
  onSeeAll: () => void;
  subcategories?: string[];
  selectedSubcategory?: string;
  onSelectSubcategory?: (sub: string) => void;
  badgeType?: 'featured' | 'discount' | 'highlighted' | 'auto';
  isAdmin?: boolean;
  onToggleFeatured?: (productId: string, e: React.MouseEvent) => void;
  onToggleHighlighted?: (productId: string, e: React.MouseEvent) => void;
}

export const ProductCarouselSection: React.FC<ProductCarouselSectionProps> = ({
  icon,
  title,
  badgeText,
  products,
  cart,
  wishlist,
  onOpenProduct,
  onAddToCart,
  onUpdateQuantity,
  onToggleWishlist,
  onSeeAll,
  subcategories,
  selectedSubcategory = 'all',
  onSelectSubcategory,
  badgeType = 'auto',
  isAdmin = false,
  onToggleFeatured,
  onToggleHighlighted
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="space-y-3 relative group/section">
      {/* Section Header (Matching Reference Screenshot: Icon + Title + See All >) */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xl shrink-0 flex items-center justify-center">
            {icon}
          </span>
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {title}
            </h3>
            <span className="text-xs font-mono font-bold text-slate-400">
              ({products.length})
            </span>
            {badgeText && (
              <span className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full hidden sm:inline">
                {badgeText}
              </span>
            )}
          </div>
        </div>

        {/* See All Button (Right-aligned bold red/rose as in screenshot) */}
        <button
          type="button"
          onClick={onSeeAll}
          className="text-xs sm:text-sm font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-0.5 transition cursor-pointer select-none"
        >
          <span>See All</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Optional Subcategories Filter Pills */}
      {subcategories && subcategories.length > 0 && onSelectSubcategory && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 px-0.5">
          <button
            type="button"
            onClick={() => onSelectSubcategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedSubcategory === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            All Items
          </button>
          {subcategories.map(sub => (
            <button
              key={sub}
              type="button"
              onClick={() => onSelectSubcategory(sub)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedSubcategory.toLowerCase() === sub.toLowerCase()
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Carousel Track with Desktop Navigation Arrows */}
      <div className="relative">
        {/* Left Arrow Button (Desktop) */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 border border-slate-200 shadow-md text-slate-700 hover:text-rose-700 hover:bg-white items-center justify-center transition opacity-0 group-hover/section:opacity-100 cursor-pointer"
          title="Scroll Left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Horizontal Scrolling Track */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-2 pt-1 px-0.5"
        >
          {products.map(product => (
            <ProductCarouselCard
              key={product.id}
              product={product}
              cart={cart}
              isWishlisted={wishlist.includes(product.id)}
              onOpenProduct={onOpenProduct}
              onAddToCart={onAddToCart}
              onUpdateQuantity={onUpdateQuantity}
              onToggleWishlist={onToggleWishlist}
              badgeType={badgeType}
              isAdmin={isAdmin}
              onToggleFeatured={onToggleFeatured}
              onToggleHighlighted={onToggleHighlighted}
            />
          ))}
        </div>

        {/* Right Arrow Button (Desktop) */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 border border-slate-200 shadow-md text-slate-700 hover:text-rose-700 hover:bg-white items-center justify-center transition opacity-0 group-hover/section:opacity-100 cursor-pointer"
          title="Scroll Right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};
