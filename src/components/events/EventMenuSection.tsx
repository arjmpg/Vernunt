import React, { useState, useEffect } from 'react';
import { 
  Utensils, Plus, Trash2, Image as ImageIcon, Check, DollarSign, 
  ShoppingCart, AlertCircle, Sparkles, ChevronDown, ChevronUp, Leaf
} from 'lucide-react';
import { EventMenuItem, EventSelectedMenuItem } from '../../types.ts';
import { getStoredEventMenu, saveStoredEventMenu } from '../../utils/eventMenuStorage.ts';

interface EventMenuSectionProps {
  eventId: string;
  initialItems?: EventMenuItem[];
  isHost?: boolean;
  selectedItems?: EventSelectedMenuItem[];
  onSelectedItemsChange?: (items: EventSelectedMenuItem[]) => void;
}

export default function EventMenuSection({
  eventId,
  initialItems = [],
  isHost = false,
  selectedItems = [],
  onSelectedItemsChange
}: EventMenuSectionProps) {
  const [menuItems, setMenuItems] = useState<EventMenuItem[]>(() => 
    getStoredEventMenu(eventId, initialItems)
  );

  // Host creator state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<string>('');
  const [newItemPhoto, setNewItemPhoto] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'Drink' | 'Snack' | 'Meal' | 'Dessert' | 'Kit' | 'Other'>('Snack');
  const [isVeg, setIsVeg] = useState(true);

  // Sync menu updates
  useEffect(() => {
    const handleMenuSync = (e: any) => {
      if (e.detail?.eventId === eventId && Array.isArray(e.detail?.items)) {
        setMenuItems(e.detail.items);
      }
    };
    window.addEventListener('vernunt_event_menu_updated', handleMenuSync);
    return () => window.removeEventListener('vernunt_event_menu_updated', handleMenuSync);
  }, [eventId]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice || isNaN(Number(newItemPrice))) {
      alert('Please enter a valid item name and price.');
      return;
    }

    const item: EventMenuItem = {
      id: `menu-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: newItemName.trim(),
      price: Math.max(0, Number(newItemPrice)),
      photoUrl: newItemPhoto.trim() || undefined,
      description: newItemDesc.trim() || undefined,
      category: newItemCategory,
      isVegetarian: isVeg
    };

    const updated = [...menuItems, item];
    setMenuItems(updated);
    saveStoredEventMenu(eventId, updated);

    // Reset form
    setNewItemName('');
    setNewItemPrice('');
    setNewItemPhoto('');
    setNewItemDesc('');
    setShowAddForm(false);
  };

  const handleDeleteItem = (itemId: string) => {
    const updated = menuItems.filter(i => i.id !== itemId);
    setMenuItems(updated);
    saveStoredEventMenu(eventId, updated);

    // Also remove from selected items if user had it in cart
    if (onSelectedItemsChange) {
      onSelectedItemsChange(selectedItems.filter(i => i.id !== itemId));
    }
  };

  const handleUpdateQuantity = (item: EventMenuItem, delta: number) => {
    if (!onSelectedItemsChange) return;

    const existingIndex = selectedItems.findIndex(i => i.id === item.id);
    const nextSelected: EventSelectedMenuItem[] = [...selectedItems];

    if (existingIndex > -1) {
      const currentQty = nextSelected[existingIndex].quantity;
      const nextQty = currentQty + delta;
      if (nextQty <= 0) {
        nextSelected.splice(existingIndex, 1);
      } else {
        nextSelected[existingIndex] = {
          ...nextSelected[existingIndex],
          quantity: nextQty
        };
      }
    } else if (delta > 0) {
      nextSelected.push({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        photoUrl: item.photoUrl
      });
    }

    onSelectedItemsChange(nextSelected);
  };

  const getQuantityFor = (itemId: string): number => {
    const found = selectedItems.find(i => i.id === itemId);
    return found ? found.quantity : 0;
  };

  const totalMenuPrice = selectedItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const totalItemCount = selectedItems.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border-b border-amber-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                Event Refreshments &amp; Activity Menu
              </h4>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                Offline Ready ⚡
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Pre-order kid-friendly snacks, smoothies, and meal combos directly from the event host.
            </p>
          </div>
        </div>

        {isHost && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Cancel' : 'Add Item'}</span>
          </button>
        )}
      </div>

      {/* Host Add Item Form */}
      {isHost && showAddForm && (
        <form onSubmit={handleAddItem} className="p-4 bg-amber-50/60 border-b border-amber-200/70 space-y-3">
          <span className="text-xs font-black text-amber-950 uppercase tracking-wider block">
            Add New Menu Refreshment or Activity Kit
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Item Title *</label>
              <input
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Fresh Mango Smoothie / Fruit Box"
                className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Price (₹ INR) *</label>
              <input
                type="number"
                required
                min={0}
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                placeholder="e.g. 90"
                className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={newItemCategory}
                onChange={(e: any) => setNewItemCategory(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
              >
                <option value="Drink">🥤 Drink / Smoothie</option>
                <option value="Snack">🥪 Snack / Finger Food</option>
                <option value="Meal">🍱 Junior Meal Combo</option>
                <option value="Dessert">🧁 Healthy Dessert / Cookie</option>
                <option value="Kit">🎨 Craft Kit / Activity Bag</option>
                <option value="Other">✨ Other</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Photo URL (Optional)</label>
              <input
                type="url"
                value={newItemPhoto}
                onChange={(e) => setNewItemPhoto(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 text-xs">Description / Allergens (Optional)</label>
            <input
              type="text"
              value={newItemDesc}
              onChange={(e) => setNewItemDesc(e.target.value)}
              placeholder="e.g. 100% Organic Alphonso mango, lactose-free, nut-free."
              className="w-full p-2 rounded-xl border border-slate-300 bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={isVeg}
                onChange={(e) => setIsVeg(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                Pure Vegetarian / Kid Safe
              </span>
            </label>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
            >
              Save to Menu (Offline Ready)
            </button>
          </div>
        </form>
      )}

      {/* Menu List View */}
      <div className="p-4">
        {menuItems.length === 0 ? (
          <div className="p-6 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Utensils className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-slate-500" />
            <span className="text-xs font-bold block text-slate-600">No refreshments currently listed</span>
            <span className="text-[11px] text-slate-400">
              {isHost ? 'Click "Add Item" above to create food, drinks or activity kits for attendees.' : 'The host has not published menu items for this event yet.'}
            </span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {menuItems.map((item) => {
              const qty = getQuantityFor(item.id);
              const itemTotal = qty * item.price;

              return (
                <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group">
                  {/* Photo & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    {item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 shadow-2xs group-hover:scale-102 transition-transform"
                        onError={(e) => {
                          (e.target as any).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                        <Utensils className="w-5 h-5 opacity-70" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                          {item.name}
                        </span>
                        {item.isVegetarian && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            🌱 Veg
                          </span>
                        )}
                        {item.category && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-600">
                            {item.category}
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono font-black text-rose-700">
                          ₹{item.price}
                        </span>
                        <span className="text-[10px] text-slate-400">per serving</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Counter & Host Actions */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {onSelectedItemsChange && (
                      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          disabled={qty === 0}
                          onClick={() => handleUpdateQuantity(item, -1)}
                          className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs text-xs cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-mono font-black text-xs text-slate-900">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item, 1)}
                          className="w-7 h-7 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center transition shadow-2xs text-xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    )}

                    {isHost && (
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete menu item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Items Cart Footer */}
        {selectedItems.length > 0 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <ShoppingCart className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-slate-800">
                Menu Pre-order ({totalItemCount} item{totalItemCount !== 1 ? 's' : ''}):
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono font-black text-slate-950">
                +₹{totalMenuPrice}
              </span>
              <span className="text-[10px] text-slate-500 block leading-none">
                added to event total
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
