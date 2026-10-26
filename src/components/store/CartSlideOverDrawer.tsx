import React, { useState } from 'react';
import {
  ShoppingBag, X, CheckCircle2, Minus, Plus, Trash2, ArrowRight
} from 'lucide-react';
import type { CartItem, StoreCoupon } from '../../types/store.ts';

export interface CartSlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onProceedToCheckout: () => void;
  appliedCoupon?: StoreCoupon | null;
  onApplyCoupon?: (code: string) => void;
  couponMessage?: { type: 'success' | 'error'; text: string } | null;
}

export const CartSlideOverDrawer: React.FC<CartSlideOverDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onProceedToCheckout,
  appliedCoupon,
  onApplyCoupon,
  couponMessage
}) => {
  const [localCouponInput, setLocalCouponInput] = useState('');

  if (!isOpen) return null;

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);

  // Discount computation
  let discountAmount = 0;
  if (appliedCoupon && cartSubtotal > 0) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = Math.round((cartSubtotal * appliedCoupon.discountValue) / 100);
      if (appliedCoupon.maxDiscountAmount && discountAmount > appliedCoupon.maxDiscountAmount) {
        discountAmount = appliedCoupon.maxDiscountAmount;
      }
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }

  // Free delivery threshold: ₹499
  const shippingFee = cartSubtotal >= 499 || cartSubtotal === 0 ? 0 : 29;
  const cartGrandTotal = Math.max(0, cartSubtotal - discountAmount + shippingFee);

  const handleApplyClick = () => {
    if (onApplyCoupon) {
      onApplyCoupon(localCouponInput);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in text-left">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-full sm:w-screen max-w-full sm:max-w-md bg-white shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="px-4 sm:px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-rose-700" />
              <h3 className="font-black text-base text-slate-900">
                Your Shopping Cart ({cartItemCount})
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Delivery Meter */}
          <div className="bg-rose-50 px-5 py-2.5 border-b border-rose-100 text-xs">
            {cartSubtotal >= 499 ? (
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>You qualified for FREE Express Courier Delivery! 🎉</span>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-rose-900 font-semibold">
                  <span>Add ₹{499 - cartSubtotal} more for FREE Delivery!</span>
                  <span>₹{cartSubtotal} / ₹499</span>
                </div>
                <div className="w-full bg-rose-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (cartSubtotal / 499) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
                  🛒
                </div>
                <h4 className="font-bold text-slate-800 text-base">Your cart is empty</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Explore safe sensory toys, Montessori blocks, and moral storybooks for your child.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-rose-700 text-white text-xs font-bold rounded-xl hover:bg-rose-800 transition cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              cart.map(item => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white shadow-2xs"
                >
                  <img
                    src={item.product?.featuredImage}
                    alt={item.product?.name}
                    className="w-16 h-16 rounded-lg object-cover shrink-0 border border-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{item.product?.name}</h4>
                    {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                      <p className="text-[10px] text-slate-400 truncate">
                        {Object.entries(item.selectedAttributes).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                      </p>
                    )}
                    <div className="flex items-baseline gap-1 font-mono mt-1">
                      <span className="font-bold text-xs text-slate-900">₹{item.unitPrice}</span>
                      {item.unitRegularPrice > item.unitPrice && (
                        <span className="text-[10px] text-slate-400 line-through">₹{item.unitRegularPrice}</span>
                      )}
                    </div>

                    {/* Stepper and Delete */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-mono font-bold text-xs text-slate-900">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, 0)}
                        className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                        title="Remove"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer: Coupons & Checkout */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3 shrink-0">
              {/* Coupon Input */}
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon code (e.g. VERNUNT15)"
                    value={localCouponInput}
                    onChange={(e) => setLocalCouponInput(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs uppercase font-mono font-bold outline-hidden focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyClick}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponMessage && (
                  <p className={`text-[10px] font-semibold ${couponMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {couponMessage.text}
                  </p>
                )}
              </div>

              {/* Summary Totals */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount ({appliedCoupon?.code}):</span>
                    <span className="font-mono">-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Shipping:</span>
                  <span className="font-mono font-semibold">
                    {shippingFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-200">
                  <span>Total:</span>
                  <span className="font-mono text-rose-700 text-base">₹{cartGrandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={onProceedToCheckout}
                className="w-full py-3 bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-800 hover:to-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
