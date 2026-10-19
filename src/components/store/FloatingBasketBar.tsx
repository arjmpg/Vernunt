import React from 'react';
import { ChevronRight, ShoppingBag } from 'lucide-react';
import type { CartItem } from '../../types/store.ts';

interface FloatingBasketBarProps {
  cart: CartItem[];
  onOpenCart: () => void;
}

export const FloatingBasketBar: React.FC<FloatingBasketBarProps> = ({
  cart,
  onOpenCart
}) => {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.totalPrice || (item.unitPrice * item.quantity)), 0);

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-3 inset-x-3 sm:hidden z-40 animate-slide-up">
      <div
        onClick={onOpenCart}
        className="bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white rounded-2xl px-4 py-3 shadow-2xl flex items-center justify-between font-bold cursor-pointer transition border border-rose-500/50"
      >
        {/* Left: Items Count Pill & Total Amount (Matching Reference Screenshot) */}
        <div className="flex items-center gap-2.5">
          <span className="bg-white text-rose-700 text-xs font-black px-2.5 py-1 rounded-xl shadow-2xs flex items-center gap-1 font-mono">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
          </span>
          <span className="text-sm font-black font-mono">
            Total: ₹{totalPrice.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Right: VIEW BASKET > (Matching Screenshot) */}
        <div className="flex items-center gap-1 text-xs uppercase font-black tracking-wider text-rose-50">
          <span>VIEW BASKET</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
