import React, { useState, useEffect, useCallback } from 'react';
import { 
  Utensils, Plus, Minus, Trash2, ShoppingCart, 
  WifiOff, CheckCircle2, Leaf, Coffee, RefreshCw, Clock, Cloud
} from 'lucide-react';
import { EventMenuItem, EventSelectedMenuItem } from '../../types.ts';
import { getStoredEventMenu, saveStoredEventMenu } from '../../utils/eventMenuStorage.ts';
import { 
  getStoredEventCart, 
  saveStoredEventCart, 
  clearStoredEventCart, 
  calculateEventCartTotal,
  queueEventCartBackgroundSync,
  getEventCartSyncStatus,
  triggerImmediateCartSync
} from '../../utils/eventCartStorage.ts';

export interface EventMenuComponentProps {
  eventId: string;
  eventTitle?: string;
  initialMenuItems?: EventMenuItem[];
  selectedItems?: EventSelectedMenuItem[];
  onCartChange?: (items: EventSelectedMenuItem[], totalAmount: number) => void;
  readOnly?: boolean;
  isHost?: boolean;
  className?: string;
}

export default function EventMenuComponent({
  eventId,
  eventTitle = 'Community Event',
  initialMenuItems = [],
  selectedItems: propSelectedItems,
  onCartChange,
  readOnly = false,
  isHost = false,
  className = ''
}: EventMenuComponentProps) {
  // 1. Fetch event host's menu items
  const [menuItems, setMenuItems] = useState<EventMenuItem[]>(() => {
    const stored = getStoredEventMenu(eventId, initialMenuItems);
    if (stored.length > 0) return stored;
    return initialMenuItems.length > 0 ? initialMenuItems : [
      {
        id: `default-menu-1-${eventId}`,
        name: 'Fresh Mango & Berry Smoothie',
        price: 90,
        category: 'Drink',
        isVegetarian: true,
        photoUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=300&fit=crop',
        description: 'Chilled Alphonso mango blend with organic wild berries'
      },
      {
        id: `default-menu-2-${eventId}`,
        name: 'Kid-Safe Fruit Skewers',
        price: 75,
        category: 'Snack',
        isVegetarian: true,
        photoUrl: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=300&fit=crop',
        description: 'Watermelon, grapes, kiwi, and pineapple skewers with honey dip'
      },
      {
        id: `default-menu-3-${eventId}`,
        name: 'Artisan Nut-Free Energy Muffin',
        price: 60,
        category: 'Snack',
        isVegetarian: true,
        photoUrl: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=300&fit=crop',
        description: 'Oatmeal, carrot & banana whole-wheat baked muffin'
      }
    ];
  });

  // Host creator form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<string>('');
  const [newItemPhoto, setNewItemPhoto] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'Drink' | 'Snack' | 'Meal' | 'Dessert' | 'Kit' | 'Other'>('Snack');
  const [isVeg, setIsVeg] = useState(true);

  // 2. Offline-first Cart Selection persistence in localStorage
  const [cartItems, setCartItems] = useState<EventSelectedMenuItem[]>(() => {
    if (propSelectedItems && propSelectedItems.length > 0) {
      return propSelectedItems;
    }
    return getStoredEventCart(eventId);
  });

  // Track online/offline status
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  // Track real-time sync status ('offline' | 'syncing' | 'pending' | 'synced')
  const [syncStatus, setSyncStatus] = useState<'offline' | 'syncing' | 'pending' | 'synced'>(() => {
    return getEventCartSyncStatus(eventId);
  });
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);

  const refreshSyncStatus = useCallback(() => {
    setSyncStatus(getEventCartSyncStatus(eventId));
  }, [eventId]);

  // Network and outbox listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      refreshSyncStatus();
      triggerImmediateCartSync().then(() => {
        setTimeout(refreshSyncStatus, 1500);
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    const handleOutboxUpdated = () => {
      refreshSyncStatus();
    };

    const handleCartSyncState = (e: any) => {
      if (e.detail?.eventId === eventId) {
        refreshSyncStatus();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('vernunt_outbox_updated', handleOutboxUpdated);
    window.addEventListener('vernunt_event_cart_sync_state', handleCartSyncState);

    refreshSyncStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('vernunt_outbox_updated', handleOutboxUpdated);
      window.removeEventListener('vernunt_event_cart_sync_state', handleCartSyncState);
    };
  }, [eventId, refreshSyncStatus]);

  // Sync menu items from host broadcasts
  useEffect(() => {
    const handleMenuSync = (e: any) => {
      if (e.detail?.eventId === eventId && Array.isArray(e.detail?.items)) {
        setMenuItems(e.detail.items);
      }
    };
    window.addEventListener('vernunt_event_menu_updated', handleMenuSync);
    return () => window.removeEventListener('vernunt_event_menu_updated', handleMenuSync);
  }, [eventId]);

  // Sync cart from other components or tabs
  useEffect(() => {
    const handleCartSync = (e: any) => {
      if (e.detail?.eventId === eventId && Array.isArray(e.detail?.items)) {
        setCartItems(e.detail.items);
        refreshSyncStatus();
      }
    };
    window.addEventListener('vernunt_event_cart_updated', handleCartSync);
    return () => window.removeEventListener('vernunt_event_cart_updated', handleCartSync);
  }, [eventId, refreshSyncStatus]);

  // If props change from parent
  useEffect(() => {
    if (propSelectedItems) {
      setCartItems(propSelectedItems);
    }
  }, [propSelectedItems]);

  // 3. Offline-compatible Cart Total calculation
  const cartTotal = calculateEventCartTotal(cartItems);

  // Update item quantity with Service Worker background sync
  const handleUpdateQuantity = (item: EventMenuItem, delta: number) => {
    if (readOnly) return;

    const existingIdx = cartItems.findIndex(i => i.id === item.id);
    const updatedCart: EventSelectedMenuItem[] = [...cartItems];

    if (existingIdx > -1) {
      const newQty = updatedCart[existingIdx].quantity + delta;
      if (newQty <= 0) {
        updatedCart.splice(existingIdx, 1);
      } else {
        updatedCart[existingIdx] = {
          ...updatedCart[existingIdx],
          quantity: newQty
        };
      }
    } else if (delta > 0) {
      updatedCart.push({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        photoUrl: item.photoUrl
      });
    }

    setCartItems(updatedCart);
    saveStoredEventCart(eventId, updatedCart);

    // Queue Service Worker background sync to persist selections to Firestore
    queueEventCartBackgroundSync(eventId, eventTitle, updatedCart);
    refreshSyncStatus();

    if (onCartChange) {
      const calc = calculateEventCartTotal(updatedCart);
      onCartChange(updatedCart, calc.totalAmount);
    }
  };

  const handleClearCart = () => {
    if (readOnly) return;
    setCartItems([]);
    clearStoredEventCart(eventId);
    queueEventCartBackgroundSync(eventId, eventTitle, []);
    refreshSyncStatus();
    if (onCartChange) {
      onCartChange([], 0);
    }
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      await triggerImmediateCartSync();
      setTimeout(() => {
        refreshSyncStatus();
        setIsManualSyncing(false);
      }, 800);
    } catch {
      setIsManualSyncing(false);
    }
  };

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

    setNewItemName('');
    setNewItemPrice('');
    setNewItemPhoto('');
    setNewItemDesc('');
    setShowAddForm(false);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!confirm('Remove this item from event menu?')) return;
    const updated = menuItems.filter(i => i.id !== itemId);
    setMenuItems(updated);
    saveStoredEventMenu(eventId, updated);

    const updatedCart = cartItems.filter(i => i.id !== itemId);
    if (updatedCart.length !== cartItems.length) {
      setCartItems(updatedCart);
      saveStoredEventCart(eventId, updatedCart);
      queueEventCartBackgroundSync(eventId, eventTitle, updatedCart);
      refreshSyncStatus();
      if (onCartChange) {
        const calc = calculateEventCartTotal(updatedCart);
        onCartChange(updatedCart, calc.totalAmount);
      }
    }
  };

  const getItemQuantity = (itemId: string): number => {
    const found = cartItems.find(i => i.id === itemId);
    return found ? found.quantity : 0;
  };

  return (
    <div id={`event-menu-component-${eventId}`} className={`space-y-3 ${className}`}>
      {/* Component Header with Clear Visual Offline & Syncing Status Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Host Refreshment &amp; Snack Menu
            </h4>
            <p className="text-[10px] text-slate-500">
              Pre-order kid-friendly snacks &amp; meals directly with host
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isHost && (
            <button
              type="button"
              id={`btn-host-add-menu-${eventId}`}
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>{showAddForm ? 'Cancel' : 'Add Item'}</span>
            </button>
          )}

          {/* Sync Status Badge Indicator */}
          {syncStatus === 'offline' ? (
            <div 
              id={`badge-menu-offline-${eventId}`} 
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-bold shadow-2xs"
              title="You are offline. Selections are preserved in local storage and queued for background sync."
            >
              <WifiOff className="w-3 h-3 text-amber-600 animate-pulse shrink-0" />
              <span>Offline • Saved Locally</span>
            </div>
          ) : syncStatus === 'syncing' || isManualSyncing ? (
            <div 
              id={`badge-menu-syncing-${eventId}`} 
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-900 border border-blue-300 text-[10px] font-bold shadow-2xs animate-pulse"
              title="Service Worker is synchronizing cart selections with the cloud server."
            >
              <RefreshCw className="w-3 h-3 text-blue-600 animate-spin shrink-0" />
              <span>Syncing with Server...</span>
            </div>
          ) : syncStatus === 'pending' ? (
            <button
              type="button"
              id={`btn-menu-pending-sync-${eventId}`}
              onClick={handleManualSync}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold shadow-2xs cursor-pointer transition active:scale-95"
              title="Items pending background sync upload. Click to trigger immediate upload."
            >
              <Clock className="w-3 h-3 text-amber-700 shrink-0" />
              <span>Pending Sync</span>
              <RefreshCw className="w-2.5 h-2.5 text-amber-600 ml-0.5" />
            </button>
          ) : (
            <div 
              id={`badge-menu-synced-${eventId}`} 
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold shadow-2xs"
              title="Cart selections are synchronized with Firestore."
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Cloud Synced</span>
            </div>
          )}
        </div>
      </div>

      {/* Clear Reassurance Banner when Offline or Pending Sync */}
      {(syncStatus === 'offline' || syncStatus === 'pending') && (
        <div 
          id={`reassurance-banner-${eventId}`} 
          className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-start gap-2.5 text-xs text-amber-950 shadow-2xs animate-fadeIn"
        >
          <div className="w-6 h-6 rounded-lg bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            {syncStatus === 'offline' ? (
              <WifiOff className="w-3.5 h-3.5 text-amber-700" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-amber-700 animate-spin" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-amber-900 text-xs">
                {syncStatus === 'offline' ? 'Offline Storage Protected' : 'Background Sync Queue Active'}
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
                Safe on Device
              </span>
            </div>
            <p className="text-[11px] text-amber-900/85 mt-0.5 leading-relaxed font-medium">
              {syncStatus === 'offline'
                ? 'Your menu selections are safely stored in offline memory. Service Worker background sync will automatically upload them to Firestore as soon as your network connection returns.'
                : 'Selections are saved locally. Service Worker background sync is uploading your refreshment items to the cloud server.'}
            </p>
          </div>
        </div>
      )}

      {/* Host New Item Form */}
      {isHost && showAddForm && (
        <form onSubmit={handleAddItem} className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5 text-xs animate-fadeIn">
          <h5 className="font-bold text-amber-950 text-xs">Add New Menu Item to Event</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Item Name *</label>
              <input
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Organic Apple Juice Box"
                className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Price (₹ INR) *</label>
              <input
                type="number"
                required
                min="0"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                placeholder="e.g. 50"
                className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Photo URL (Optional)</label>
              <input
                type="url"
                value={newItemPhoto}
                onChange={(e) => setNewItemPhoto(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Category</label>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value as any)}
                className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-amber-500"
              >
                <option value="Drink">Drink</option>
                <option value="Snack">Snack</option>
                <option value="Meal">Meal</option>
                <option value="Dessert">Dessert</option>
                <option value="Kit">Kit</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Description (Optional)</label>
            <input
              type="text"
              value={newItemDesc}
              onChange={(e) => setNewItemDesc(e.target.value)}
              placeholder="e.g. 100% cold pressed juice, no added sugars"
              className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={isVeg}
                onChange={(e) => setIsVeg(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span className="flex items-center gap-1 text-[11px] text-emerald-800">
                <Leaf className="w-3 h-3 text-emerald-600" /> Vegetarian
              </span>
            </label>
            <button
              type="submit"
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
            >
              Save Menu Item
            </button>
          </div>
        </form>
      )}

      {/* Simple List View of Host's Menu Items */}
      {menuItems.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
          No menu items listed by the event host yet.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
          {menuItems.map((item) => {
            const qty = getItemQuantity(item.id);
            return (
              <div 
                key={item.id} 
                id={`menu-list-item-${item.id}`}
                className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                {/* Photo & Details */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {item.photoUrl ? (
                    <img 
                      src={item.photoUrl} 
                      alt={item.name} 
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                      <Coffee className="w-6 h-6 stroke-[1.5]" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {item.name}
                      </span>
                      {item.isVegetarian && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 shrink-0">
                          <Leaf className="w-2.5 h-2.5" /> Veg
                        </span>
                      )}
                      {item.category && (
                        <span className="text-[9px] text-slate-400 bg-slate-50 px-1.5 py-0.2 rounded font-medium shrink-0">
                          {item.category}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    )}
                    <div className="mt-1">
                      <span className="text-xs font-black text-amber-900 font-mono">
                        ₹{item.price}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">each</span>
                    </div>
                  </div>
                </div>

                {/* Quantity Controls (Add / Stepper) & Host Actions */}
                <div className="shrink-0 flex items-center gap-1.5">
                  {!readOnly && (
                    <>
                      {qty === 0 ? (
                        <button
                          type="button"
                          id={`btn-add-menu-item-${item.id}`}
                          onClick={() => handleUpdateQuantity(item, 1)}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 bg-amber-50/80 border border-amber-200 rounded-lg p-0.5">
                          <button
                            type="button"
                            id={`btn-decrease-menu-item-${item.id}`}
                            onClick={() => handleUpdateQuantity(item, -1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-amber-800 hover:bg-amber-200/80 transition cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-slate-900 font-mono">
                            {qty}
                          </span>
                          <button
                            type="button"
                            id={`btn-increase-menu-item-${item.id}`}
                            onClick={() => handleUpdateQuantity(item, 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-amber-800 hover:bg-amber-200/80 transition cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {isHost && (
                    <button
                      type="button"
                      id={`btn-delete-menu-item-${item.id}`}
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer ml-1"
                      title="Remove item from event menu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Offline-Compatible Cart Calculation Summary */}
      {cartItems.length > 0 && (
        <div 
          id={`event-menu-cart-summary-${eventId}`}
          className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-amber-950">
                  {cartTotal.itemCount} {cartTotal.itemCount === 1 ? 'item' : 'items'} in Menu Cart
                </span>
                <span className="text-[10px] text-amber-800 font-medium">
                  (Persisted Offline)
                </span>
              </div>
              <div className="text-[11px] text-amber-800">
                Menu Total:{' '}
                <strong className="text-amber-950 font-mono font-black text-sm">
                  ₹{cartTotal.totalAmount}
                </strong>
              </div>
            </div>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                id={`btn-clear-cart-${eventId}`}
                onClick={handleClearCart}
                className="text-[11px] text-slate-500 hover:text-rose-600 p-1 rounded transition cursor-pointer flex items-center gap-0.5"
                title="Clear selected menu items"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
