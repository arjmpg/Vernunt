import React from 'react';
import { Star, Plus, Minus, Heart, Zap, Sparkles } from 'lucide-react';
import type { StoreProduct, CartItem } from '../../types/store.ts';

interface ProductCarouselCardProps {
  product: StoreProduct;
  cart: CartItem[];
  isWishlisted: boolean;
  onOpenProduct: (product: StoreProduct) => void;
  onAddToCart: (product: StoreProduct) => void;
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onToggleWishlist: (productId: string, e: React.MouseEvent) => void;
  badgeType?: 'featured' | 'discount' | 'highlighted' | 'auto';
  isAdmin?: boolean;
  onToggleFeatured?: (productId: string, e: React.MouseEvent) => void;
  onToggleHighlighted?: (productId: string, e: React.MouseEvent) => void;
}

export const ProductCarouselCard: React.FC<ProductCarouselCardProps> = ({
  product,
  cart,
  isWishlisted,
  onOpenProduct,
  onAddToCart,
  onUpdateQuantity,
  onToggleWishlist,
  badgeType = 'auto',
  isAdmin = false,
  onToggleFeatured,
  onToggleHighlighted
}) => {
  // Check if item is already in cart to display [- qty +] stepper
  const matchingCartItem = cart.find(item => item.productId === product.id);
  const cartQty = matchingCartItem ? matchingCartItem.quantity : 0;

  // Calculate actual discount percentage
  const discountPct = product.discountPercentage ?? (
    product.regularPrice > product.price 
      ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100) 
      : 0
  );

  // Determine top corner badge matching reference UI
  let cornerBadge: { text: string; bgClass: string } | null = null;
  if (badgeType === 'discount' || (badgeType === 'auto' && discountPct > 15)) {
    cornerBadge = {
      text: `${discountPct}% OFF`,
      bgClass: 'bg-amber-500 text-white'
    };
  } else if (badgeType === 'featured' || (badgeType === 'auto' && product.isFeatured)) {
    cornerBadge = {
      text: 'FEATURED',
      bgClass: 'bg-purple-600 text-white'
    };
  } else if (badgeType === 'highlighted' || (badgeType === 'auto' && product.isHighlighted)) {
    cornerBadge = {
      text: 'HIGHLIGHTED',
      bgClass: 'bg-indigo-600 text-white'
    };
  } else if (product.isBestSeller) {
    cornerBadge = {
      text: 'BEST SELLER',
      bgClass: 'bg-amber-600 text-white'
    };
  }

  // Delivery badge text for easy shipping
  const shippingBadgeText = product.deliveryDaysEstimate === 0 
    ? 'Instant Access' 
    : product.deliveryDaysEstimate === 1 
      ? '⚡ 1-Day Dispatch' 
      : product.deliveryDaysEstimate <= 2 
        ? '⚡ Express 2-Day' 
        : '🚚 Fast Delivery';

  // Pack / Weight / Brand subtitle
  const subtitle = product.weightGrams 
    ? `${product.brand || 'Vernunt'} • ${product.weightGrams}g`
    : product.attributes && product.attributes[0]?.options[0]
      ? `${product.brand || 'Vernunt'} • ${product.attributes[0].options[0]}`
      : `${product.brand || 'Vernunt'} • ${product.category}`;

  return (
    <div
      onClick={() => onOpenProduct(product)}
      className="bg-white rounded-2xl border border-slate-200/90 hover:border-rose-400 hover:shadow-md transition-all duration-200 p-3 flex flex-col justify-between w-[172px] sm:w-[210px] shrink-0 snap-start group cursor-pointer relative select-none overflow-hidden"
    >
      {/* Top Corner Badge (Matching Reference Screenshot) */}
      {cornerBadge && (
        <div className="absolute top-0 right-0 z-10 pointer-events-none">
          <span className={`${cornerBadge.bgClass} text-[9.5px] sm:text-[10px] font-black uppercase px-2.5 py-0.5 rounded-bl-xl shadow-2xs tracking-wide block`}>
            {cornerBadge.text}
          </span>
        </div>
      )}

      {/* Wishlist Heart Button (Top-Left) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleWishlist(product.id, e);
        }}
        className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-500 hover:text-rose-600 shadow-2xs border border-slate-100 flex items-center justify-center transition active:scale-90 cursor-pointer"
        title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'text-rose-600 fill-rose-600' : 'text-slate-400'}`} />
      </button>

      {/* Admin Quick Toggles (Featured & Highlighted) */}
      {isAdmin && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 left-10 z-10 flex items-center gap-0.5 bg-white/95 backdrop-blur-xs p-0.5 rounded-full border border-slate-200 shadow-2xs"
          title="Admin: Quick toggle status"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFeatured?.(product.id, e);
            }}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer ${
              product.isFeatured 
                ? 'bg-purple-600 text-white shadow-2xs' 
                : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'
            }`}
            title={product.isFeatured ? 'Admin: Unmark Featured' : 'Admin: Mark as Featured'}
          >
            <Sparkles className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleHighlighted?.(product.id, e);
            }}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer ${
              product.isHighlighted 
                ? 'bg-amber-500 text-white shadow-2xs' 
                : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
            }`}
            title={product.isHighlighted ? 'Admin: Unmark Highlighted' : 'Admin: Mark as Highlighted'}
          >
            <Star className="w-3 h-3 fill-current" />
          </button>
        </div>
      )}

      {/* Centered Product Image */}
      <div className="w-full aspect-square bg-slate-50/70 rounded-xl overflow-hidden flex items-center justify-center p-2 mb-2 relative">
        <img
          src={product.featuredImage}
          alt={product.name}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Product Content Details */}
      <div className="space-y-1.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Easy Shipping Pill (Matching ⚡ 15-Mins style in Reference) */}
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-[9.5px] sm:text-[10px] font-bold text-amber-900 w-fit">
            <Zap className="w-2.5 h-2.5 text-amber-600 fill-amber-500 shrink-0" />
            <span>{shippingBadgeText}</span>
          </div>

          {/* Rating with review count */}
          <div className="flex items-center gap-1 text-[11px] mt-1">
            <Star className="w-3.5 h-3.5 text-rose-600 fill-rose-600 shrink-0" />
            <span className="font-black text-slate-900 text-xs">{product.rating}</span>
            <span className="text-[10px] text-slate-400 truncate">
              ({product.reviewCount > 50 ? `${product.reviewCount * 120}+ votes` : `${product.reviewCount * 45}+ reviews`})
            </span>
          </div>

          {/* Product Name (2 Lines Max) */}
          <h4 className="font-bold text-slate-900 text-xs sm:text-[13px] line-clamp-2 leading-snug group-hover:text-rose-700 transition mt-0.5" title={product.name}>
            {product.name}
          </h4>

          {/* Subtitle / Weight / Brand */}
          <p className="text-[10.5px] sm:text-[11px] text-slate-500 truncate mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Bottom Price & Add/Counter Button Row */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 mt-1">
          {/* Prices */}
          <div className="flex items-baseline gap-1">
            <span className="font-black text-sm sm:text-base text-slate-900 font-mono">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.regularPrice > product.price && (
              <span className="text-[10.5px] sm:text-xs text-slate-400 line-through font-mono">
                ₹{product.regularPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Interactive + ADD Button or [- Qty +] Stepper (Matching Screenshot) */}
          {cartQty > 0 ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center bg-emerald-700 text-white rounded-lg shadow-xs overflow-hidden"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (matchingCartItem) {
                    onUpdateQuantity(matchingCartItem.id, cartQty - 1);
                  }
                }}
                className="px-2 py-1 hover:bg-emerald-800 transition active:scale-95 cursor-pointer text-xs font-bold"
                title="Decrease"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-2 font-mono font-bold text-xs">
                {cartQty}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (matchingCartItem) {
                    onUpdateQuantity(matchingCartItem.id, cartQty + 1);
                  }
                }}
                className="px-2 py-1 hover:bg-emerald-800 transition active:scale-95 cursor-pointer text-xs font-bold"
                title="Increase"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              className="border border-emerald-600 bg-emerald-50/60 hover:bg-emerald-600 hover:text-white text-emerald-700 font-black text-xs px-3 py-1 rounded-lg transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>ADD</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
