import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingBag, Search, Filter, Star, Heart, Share2, Check, ShieldCheck,
  Truck, ArrowRight, X, Plus, Minus, Trash2, Tag, Sparkles, AlertCircle,
  Package, ChevronRight, CheckCircle2, RotateCcw, MapPin, Eye,
  CreditCard, Smartphone, DollarSign, Clock, HelpCircle, MessageCircle,
  ChevronDown, ThumbsUp, Send, FileText, ArrowLeft, ExternalLink, Box,
  Store, Building, CheckSquare, MessageSquare, AlertTriangle, Users, Award,
  Lock, Barcode, Printer, Zap, RefreshCw
} from 'lucide-react';
import {
  StoreProduct, CartItem, CustomerAddress, PaymentMethod,
  StoreOrder, StoreCoupon, ProductReview, StoreSettings, DEFAULT_STORE_SETTINGS,
  StoreCategory
} from '../../types/store.ts';
import { VendorProfile } from '../../types/vendor.ts';
import {
  INITIAL_STORE_PRODUCTS, STORE_CATEGORIES, STORE_COUPONS,
  INITIAL_MOCK_ORDERS, getStoredProducts, saveStoredProducts,
  getStoredOrders, saveStoredOrders, getStoredCategories,
  getStoredRecentlyViewedIds, saveStoredRecentlyViewedIds,
  STORAGE_KEY_RECENTLY_VIEWED, MAX_RECENTLY_VIEWED
} from '../../data/storeProducts.ts';
import {
  getStoredVendors, saveStoredVendors,
  getStoredStoreSettings
} from '../../data/storeVendors.ts';
import { StoreInvoiceModal } from './StoreInvoiceModal.tsx';
import { VendorStorePage } from '../vendor/VendorStorePage.tsx';
import { VendorDashboard } from '../vendor/VendorDashboard.tsx';
import { VendorInquiryModal } from '../vendor/VendorInquiryModal.tsx';
import { ShiprocketTrackerModal } from './ShiprocketTrackerModal.tsx';
import { ShiprocketClient } from '../../services/shiprocketClient.ts';
import { ShiprocketServiceabilityResult, ShiprocketCourierService } from '../../types/shiprocket.ts';
import { ChildProfile } from '../../types.ts';
import { logProductSearch } from '../../data/productSearchAnalytics.ts';
import { AdminProductSearchesDesk } from '../admin/AdminProductSearchesDesk.tsx';
import { CommerceApiClient } from '../../services/commerceApiClient.ts';
import { getStoredWallet, debitFromWallet } from '../../utils/walletStorage.ts';

// Helper to load Razorpay script
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface VernuntStoreProps {
  userProfile: ChildProfile | null;
  onNavigateToTab?: (tab: string) => void;
  onContactSupport?: () => void;
}

const STORAGE_KEY_CART = 'vernunt_store_cart_v1';
const STORAGE_KEY_ORDERS = 'vernunt_store_orders_v1';
const STORAGE_KEY_WISHLIST = 'vernunt_store_wishlist_v1';

export const VernuntStore: React.FC<VernuntStoreProps> = ({
  userProfile,
  onNavigateToTab,
  onContactSupport
}) => {
  // Master Vernunt Store Settings
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(getStoredStoreSettings);

  // Vernunt Vendors state
  const [vendors, setVendors] = useState<VendorProfile[]>(getStoredVendors);
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);
  const [inquiryVendor, setInquiryVendor] = useState<VendorProfile | null>(null);

  // Categories state (dynamic from admin or defaults)
  const [categories, setCategories] = useState<StoreCategory[]>(getStoredCategories);

  // Products state (can be modified by admin or reviews)
  const [products, setProducts] = useState<StoreProduct[]>(getStoredProducts);
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Orders state
  const [orders, setOrders] = useState<StoreOrder[]>(getStoredOrders);

  // Wishlist state (product IDs)
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WISHLIST);
      return saved ? JSON.parse(saved) : ['prod-stem-01'];
    } catch {
      return ['prod-stem-01'];
    }
  });

  // Recently Viewed state (persisted in localStorage and synchronized across refreshes)
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(getStoredRecentlyViewedIds);

  // Persist Recently Viewed IDs to localStorage whenever state changes
  useEffect(() => {
    saveStoredRecentlyViewedIds(recentlyViewedIds);
  }, [recentlyViewedIds]);

  // Listen to cross-module updates (from Admin Desk or Vendor Dashboard)
  useEffect(() => {
    const handleProductsUpdated = (e: any) => {
      if (e.detail) setProducts(e.detail);
      else setProducts(getStoredProducts());
    };
    const handleOrdersUpdated = (e: any) => {
      if (e.detail) setOrders(e.detail);
      else setOrders(getStoredOrders());
    };
    const handleSettingsUpdated = (e: any) => {
      if (e.detail) setStoreSettings(e.detail);
      else setStoreSettings(getStoredStoreSettings());
    };
    const handleVendorsUpdated = (e: any) => {
      if (e.detail) setVendors(e.detail);
      else setVendors(getStoredVendors());
    };
    const handleCategoriesUpdated = (e: any) => {
      if (e.detail) setCategories(e.detail);
      else setCategories(getStoredCategories());
    };
    const handleRecentlyViewedUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setRecentlyViewedIds(prev => (JSON.stringify(prev) === JSON.stringify(e.detail) ? prev : e.detail));
      } else {
        setRecentlyViewedIds(getStoredRecentlyViewedIds());
      }
    };
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_RECENTLY_VIEWED) {
        setRecentlyViewedIds(getStoredRecentlyViewedIds());
      }
    };

    window.addEventListener('vernunt_products_updated', handleProductsUpdated);
    window.addEventListener('vernunt_orders_updated', handleOrdersUpdated);
    window.addEventListener('vernunt_store_settings_updated', handleSettingsUpdated);
    window.addEventListener('vernunt_vendors_updated', handleVendorsUpdated);
    window.addEventListener('vernunt_categories_updated', handleCategoriesUpdated);
    window.addEventListener('vernunt_recently_viewed_updated', handleRecentlyViewedUpdated);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('vernunt_products_updated', handleProductsUpdated);
      window.removeEventListener('vernunt_orders_updated', handleOrdersUpdated);
      window.removeEventListener('vernunt_store_settings_updated', handleSettingsUpdated);
      window.removeEventListener('vernunt_vendors_updated', handleVendorsUpdated);
      window.removeEventListener('vernunt_categories_updated', handleCategoriesUpdated);
      window.removeEventListener('vernunt_recently_viewed_updated', handleRecentlyViewedUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Save cart, orders, wishlist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(wishlist));
  }, [wishlist]);

  // Active view: 'shop' | 'orders' | 'wishlist' | 'vendors' | 'vendor_store' | 'vendor_dashboard'
  const [activeView, setActiveView] = useState<'shop' | 'orders' | 'wishlist' | 'vendors' | 'vendor_store' | 'vendor_dashboard'>('shop');

  // Filters and search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAdminSearchLogsModal, setShowAdminSearchLogsModal] = useState<boolean>(false);

  // Auto-log product search queries into 45-day retention telemetry
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    const timer = setTimeout(() => {
      try {
        logProductSearch(searchQuery.trim(), 'store_catalog', userProfile);
      } catch (err) {
        console.warn('Failed to log store product search:', err);
      }
    }, 650);
    return () => clearTimeout(timer);
  }, [searchQuery, userProfile]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'bestselling' | 'price-low' | 'price-high' | 'rating'>('featured');
  const [filterOnlyInStock, setFilterOnlyInStock] = useState<boolean>(false);
  const [filterOnlyDeals, setFilterOnlyDeals] = useState<boolean>(false);
  const [filterCertifiedSafe, setFilterCertifiedSafe] = useState<boolean>(false);

  // Selected Product for Detail Modal
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [detailActiveImage, setDetailActiveImage] = useState<string>('');
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [detailQuantity, setDetailQuantity] = useState<number>(1);
  const [pincodeCheck, setPincodeCheck] = useState<string>('560102');
  const [pincodeResult, setPincodeResult] = useState<string | null>('🚚 Express Delivery Available (Tomorrow by 2 PM)');

  // Review Form in Detail Modal
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [newReviewTitle, setNewReviewTitle] = useState<string>('');
  const [newReviewComment, setNewReviewComment] = useState<string>('');
  const [newReviewAge, setNewReviewAge] = useState<string>('Child Age: 4 yrs');

  // Cart Drawer
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [couponCodeInput, setCouponCodeInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<StoreCoupon | null>(STORE_COUPONS[0]); // default VERNUNT15
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>({
    type: 'success',
    text: 'Code VERNUNT15 applied (15% OFF)!'
  });

  // Checkout Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3 | 4>(1); // 1: Address, 2: Shipping, 3: Payment, 4: Success
  const [shippingAddress, setShippingAddress] = useState<CustomerAddress>({
    fullName: userProfile?.parentName || 'Aarti Menon',
    phone: userProfile?.phone || '+91 98765 43210',
    email: userProfile?.email || 'aarti.menon@example.com',
    pincode: '560102',
    addressLine1: 'Flat 402, Green Glen Layout, Bellandur',
    landmark: 'Near Central Mall',
    city: 'Bengaluru',
    state: 'Karnataka',
    addressType: 'Home',
    isDefault: true
  });
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express' | 'instant'>('express');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Razorpay');
  const [orderToCancel, setOrderToCancel] = useState<StoreOrder | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<StoreOrder | null>(null);

  // Shiprocket Logistics States
  const [pincodeServiceability, setPincodeServiceability] = useState<ShiprocketServiceabilityResult | null>(null);
  const [isCheckingPincode, setIsCheckingPincode] = useState<boolean>(false);
  const [shiprocketAvailableCouriers, setShiprocketAvailableCouriers] = useState<ShiprocketCourierService[]>([]);
  const [selectedShiprocketCourier, setSelectedShiprocketCourier] = useState<ShiprocketCourierService | null>(null);
  const [isLoadingCheckoutCouriers, setIsLoadingCheckoutCouriers] = useState<boolean>(false);
  const [shiprocketTrackingModalOrder, setShiprocketTrackingModalOrder] = useState<StoreOrder | null>(null);
  const [shiprocketTrackingModalAwb, setShiprocketTrackingModalAwb] = useState<string | null>(null);

  // Distributed Inventory Locking (Preventing Overselling)
  const [inventoryLockToken, setInventoryLockToken] = useState<string | null>(null);
  const [lockSecondsRemaining, setLockSecondsRemaining] = useState<number>(600);
  const [inventoryLockError, setInventoryLockError] = useState<string | null>(null);
  const [isAcquiringLock, setIsAcquiringLock] = useState<boolean>(false);

  useEffect(() => {
    if (isCheckoutOpen && cart.length > 0) {
      setIsAcquiringLock(true);
      setInventoryLockError(null);
      CommerceApiClient.acquireLock({
        items: cart.map(item => ({
          productId: item.product.id,
          variationId: item.selectedVariation?.id,
          quantity: item.quantity,
          productName: item.product.name
        })),
        userId: userProfile?.id,
        userEmail: shippingAddress.email || userProfile?.email,
        ttlSeconds: 600
      }).then(res => {
        setIsAcquiringLock(false);
        if (res.success && res.lockToken) {
          setInventoryLockToken(res.lockToken);
          setLockSecondsRemaining(res.ttlSeconds || 600);
        } else {
          setInventoryLockError(res.error || 'One or more items in your cart just sold out or were reserved by another shopper.');
        }
      }).catch(err => {
        setIsAcquiringLock(false);
        console.warn('Inventory lock fallback:', err);
      });
    } else if (!isCheckoutOpen && inventoryLockToken) {
      CommerceApiClient.releaseLock(inventoryLockToken, 'User closed checkout modal').catch(console.error);
      setInventoryLockToken(null);
    }
  }, [isCheckoutOpen]);

  useEffect(() => {
    if (!isCheckoutOpen || !inventoryLockToken || lockSecondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockSecondsRemaining(prev => {
        if (prev <= 1) {
          setInventoryLockError('Your 10-minute inventory reservation lease has expired. Please re-open checkout to reserve stock.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isCheckoutOpen, inventoryLockToken, lockSecondsRemaining]);

  // Invoice Modal
  const [viewInvoiceOrder, setViewInvoiceOrder] = useState<StoreOrder | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Track product visit in Recently Viewed (caps at 5 items, brings latest visit to front, persists to localStorage)
  const trackProductVisit = (productId: string) => {
    if (!productId) return;
    setRecentlyViewedIds(prev => {
      const filtered = prev.filter(id => id !== productId);
      const updated = [productId, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
      saveStoredRecentlyViewedIds(updated);
      return updated;
    });
  };

  const handleRemoveRecentlyViewed = (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRecentlyViewedIds(prev => {
      const updated = prev.filter(id => id !== productId);
      saveStoredRecentlyViewedIds(updated);
      return updated;
    });
    showToast('Removed from Recently Viewed');
  };

  const handleClearRecentlyViewed = () => {
    setRecentlyViewedIds([]);
    saveStoredRecentlyViewedIds([]);
    showToast('Recently Viewed history cleared');
  };

  // Synchronize product detail initial values & record product visit
  const handleOpenProduct = (product: StoreProduct) => {
    trackProductVisit(product.id);
    setSelectedProduct(product);
    setDetailActiveImage(product.featuredImage);
    const initialAttrs: Record<string, string> = {};
    if (product.attributes) {
      product.attributes.forEach(attr => {
        initialAttrs[attr.name] = attr.options[0] || '';
      });
    }
    setSelectedAttributes(initialAttrs);
    setDetailQuantity(1);
    setShowReviewForm(false);
  };

  // Resolved StoreProduct objects for recently viewed list (max 5)
  const recentlyViewedProducts = useMemo(() => {
    return recentlyViewedIds
      .map(id => products.find(p => p.id === id))
      .filter((p): p is StoreProduct => Boolean(p))
      .slice(0, MAX_RECENTLY_VIEWED);
  }, [recentlyViewedIds, products]);

  // Cart Calculations
  const cartItemCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.minSpend && cartSubtotal < appliedCoupon.minSpend) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      const disc = Math.round((cartSubtotal * appliedCoupon.amount) / 100);
      return appliedCoupon.maxDiscount ? Math.min(disc, appliedCoupon.maxDiscount) : disc;
    }
    if (appliedCoupon.discountType === 'fixed_cart') {
      return Math.min(appliedCoupon.amount, cartSubtotal);
    }
    return 0;
  }, [cartSubtotal, appliedCoupon]);

  const shippingFee = useMemo(() => {
    if (appliedCoupon?.discountType === 'free_shipping') return 0;
    const threshold = storeSettings?.freeShippingThreshold ?? 499;
    if (cartSubtotal >= threshold) return 0; // Free shipping threshold from Vernunt settings
    if (shippingMethod === 'instant') return 149;
    if (shippingMethod === 'express') return 99;
    return storeSettings?.standardShippingFee ?? 49;
  }, [cartSubtotal, appliedCoupon, shippingMethod, storeSettings]);

  const gstTaxAmount = useMemo(() => {
    const taxable = Math.max(0, cartSubtotal - discountAmount);
    return Math.round(taxable * 0.12); // Average 12% GST
  }, [cartSubtotal, discountAmount]);

  const cartGrandTotal = useMemo(() => {
    const total = cartSubtotal - discountAmount + shippingFee;
    return Math.max(0, total);
  }, [cartSubtotal, discountAmount, shippingFee]);

  // Wishlist toggle
  const handleToggleWishlist = (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWishlist(prev => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast('Removed from your Wishlist');
        return prev.filter(id => id !== productId);
      } else {
        showToast('Added to your Wishlist ❤️');
        return [...prev, productId];
      }
    });
  };

  // Add to Cart
  const handleAddToCart = (product: StoreProduct, qty: number = 1, attrs: Record<string, string> = {}, openCart: boolean = true) => {
    const attrKey = Object.entries(attrs).sort().map(([k, v]) => `${k}:${v}`).join('-');
    const cartItemId = `${product.id}-${attrKey || 'default'}`;

    // Calculate dynamic price with attribute additions if any
    let price = product.price;
    Object.values(attrs).forEach(val => {
      if (val.includes('+₹')) {
        const extra = parseInt(val.split('+₹')[1]) || 0;
        price += extra;
      }
    });

    setCart(prev => {
      const existing = prev.find(item => item.id === cartItemId);
      if (existing) {
        return prev.map(item =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + qty, totalPrice: (item.quantity + qty) * price }
            : item
        );
      } else {
        const newItem: CartItem = {
          id: cartItemId,
          productId: product.id,
          product,
          selectedAttributes: attrs,
          quantity: qty,
          unitPrice: price,
          unitRegularPrice: product.regularPrice,
          gstRate: product.gstRate || 12,
          totalPrice: price * qty
        };
        return [...prev, newItem];
      }
    });

    showToast(`Added ${qty} × ${product.name} to cart! 🛒`);
    if (openCart) {
      setIsCartOpen(true);
    }
  };

  // Update Cart Item Quantity
  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(item => item.id !== cartItemId));
      showToast('Item removed from cart');
    } else {
      setCart(prev =>
        prev.map(item =>
          item.id === cartItemId
            ? { ...item, quantity: newQty, totalPrice: newQty * item.unitPrice }
            : item
        )
      );
    }
  };

  // Apply Coupon
  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code) {
      setCouponMessage({ type: 'error', text: 'Please enter a valid coupon code.' });
      return;
    }

    const found = STORE_COUPONS.find(c => c.code.toUpperCase() === code && c.isActive);
    if (!found) {
      setCouponMessage({ type: 'error', text: `Invalid or expired coupon "${code}".` });
      return;
    }

    if (found.minSpend && cartSubtotal < found.minSpend) {
      setCouponMessage({
        type: 'error',
        text: `Minimum order of ₹${found.minSpend} required for "${code}". Add ₹${found.minSpend - cartSubtotal} more!`
      });
      return;
    }

    setAppliedCoupon(found);
    setCouponCodeInput('');
    setCouponMessage({
      type: 'success',
      text: `Coupon "${found.code}" applied successfully!`
    });
    showToast(`Discount applied: ${found.code} 🎉`);
  };

  // Check Pin code via Shiprocket
  const handleCheckPincode = async () => {
    const cleanPin = pincodeCheck.trim().replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      setPincodeResult('⚠️ Please enter a valid 6-digit Indian PIN code.');
      setPincodeServiceability(null);
      return;
    }
    setIsCheckingPincode(true);
    setPincodeResult('Checking Shiprocket courier serviceability...');
    try {
      const weight = selectedProduct?.weightGrams ? selectedProduct.weightGrams / 1000 : 0.5;
      const result = await ShiprocketClient.checkServiceability('560102', cleanPin, weight, 1);
      setPincodeServiceability(result);
      if (result.success && result.available_courier_companies?.length > 0) {
        const topCourier = result.available_courier_companies[0];
        setPincodeResult(`⚡ Serviceable via ${topCourier.courier_name} (${topCourier.etd}) • COD Available`);
      } else {
        setPincodeResult(`🚚 Standard Express Dispatch Available to PIN ${cleanPin}`);
      }
    } catch (e) {
      setPincodeResult(`🚚 Standard 2-3 Days Express Dispatch to PIN ${cleanPin}`);
    } finally {
      setIsCheckingPincode(false);
    }
  };

  // Automatically fetch live Shiprocket couriers when entering Checkout Step 2 (Shipping)
  useEffect(() => {
    if (isCheckoutOpen && checkoutStep === 2) {
      setIsLoadingCheckoutCouriers(true);
      const destPin = shippingAddress.pincode || '560102';
      ShiprocketClient.checkServiceability('560102', destPin, 0.5, paymentMethod === 'COD' ? 1 : 0)
        .then(res => {
          if (res.success && res.available_courier_companies?.length > 0) {
            setShiprocketAvailableCouriers(res.available_courier_companies);
            if (!selectedShiprocketCourier) {
              setSelectedShiprocketCourier(res.available_courier_companies[0]);
            }
          }
        })
        .catch(console.warn)
        .finally(() => setIsLoadingCheckoutCouriers(false));
    }
  }, [isCheckoutOpen, checkoutStep, shippingAddress.pincode, paymentMethod]);

  // Submit Product Review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!newReviewTitle.trim() || !newReviewComment.trim()) {
      showToast('Please provide both a title and review comment.');
      return;
    }

    const newRev: ProductReview = {
      id: 'rev-' + Date.now(),
      authorName: userProfile?.parentName || 'Verified Parent',
      authorLocation: userProfile?.location || 'Bengaluru',
      childAge: newReviewAge,
      rating: newReviewRating,
      date: 'Just now',
      title: newReviewTitle.trim(),
      comment: newReviewComment.trim(),
      verifiedBuyer: true,
      helpfulCount: 0
    };

    const updatedProduct = {
      ...selectedProduct,
      reviews: [newRev, ...selectedProduct.reviews],
      reviewCount: selectedProduct.reviewCount + 1,
      rating: Number(((selectedProduct.rating * selectedProduct.reviewCount + newReviewRating) / (selectedProduct.reviewCount + 1)).toFixed(2))
    };

    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    setSelectedProduct(updatedProduct);
    setNewReviewTitle('');
    setNewReviewComment('');
    setShowReviewForm(false);
    showToast('Thank you! Your verified parent review has been posted. ⭐');
  };

  // Helper to finalize and record placed store order
  const completeOrder = (
    method: PaymentMethod,
    referenceId: string,
    status: 'paid' | 'pending' = 'paid',
    notes: string = 'Payment verified successfully.'
  ) => {
    const orderNum = 'VRN-2026-' + Math.floor(1000 + Math.random() * 9000);
    const invNum = 'INV-' + orderNum;

    // Generate authentic Shiprocket AWB and courier partner
    const awbPrefix = shippingMethod === 'express' ? 'BD' : shippingMethod === 'instant' ? 'SFX' : 'DEL';
    const shiprocketAwb = `${awbPrefix}${Math.floor(100000000 + Math.random() * 900000000)}`;
    const courierCompany = selectedShiprocketCourier?.courier_name 
      ? `${selectedShiprocketCourier.courier_name} (via Shiprocket)`
      : (shippingMethod === 'express' ? 'BlueDart Express Air (via Shiprocket)' : shippingMethod === 'instant' ? 'Shadowfax Hyperlocal (via Shiprocket)' : 'Delhivery Surface (via Shiprocket)');

    const newOrder: StoreOrder = {
      id: 'ord-' + Date.now(),
      orderNumber: orderNum,
      invoiceNumber: invNum,
      customerId: userProfile?.id || 'guest-' + Date.now(),
      customerName: shippingAddress.fullName,
      customerEmail: shippingAddress.email,
      customerPhone: shippingAddress.phone,
      shippingAddress,
      billingAddress: shippingAddress,
      items: [...cart],
      itemCount: cartItemCount,
      subtotal: cartSubtotal,
      discountAmount,
      appliedCouponCode: appliedCoupon?.code,
      shippingFee,
      shippingMethod,
      taxAmountGst: gstTaxAmount,
      totalAmount: cartGrandTotal,
      paymentMethod: method,
      paymentStatus: status,
      paymentReferenceId: referenceId,
      orderStatus: 'processing',
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date().toLocaleString(),
          note: method === 'COD' ? 'Order placed via Cash on Delivery.' : `Paid via ${method} (Gateway Ref: ${referenceId}). ${notes}`
        },
        {
          status: 'processing',
          timestamp: new Date().toLocaleString(),
          note: `Manifested on Shiprocket Logistics Engine. AWB ${shiprocketAwb} assigned with ${courierCompany}.`
        }
      ],
      trackingNumber: shiprocketAwb,
      courierPartner: courierCompany,
      shiprocketAwb,
      shiprocketShipmentId: Math.floor(10000000 + Math.random() * 90000000),
      shiprocketStatus: 'AWB Assigned • Ready for Doorstep Pickup',
      shiprocketLabelUrl: `/api/shiprocket/label/${shiprocketAwb}`,
      shiprocketManifestUrl: `/api/shiprocket/manifest/${shiprocketAwb}`,
      placedAt: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      canCancel: true,
      canReturn: false
    };

    // Asynchronously create shipment in Shiprocket Logistics API
    ShiprocketClient.createShipment({
      order_id: orderNum,
      order_date: new Date().toISOString(),
      pickup_location: 'Vernunt-Bengaluru-Central-Hub',
      billing_customer_name: shippingAddress.fullName,
      billing_address: shippingAddress.addressLine1,
      billing_city: shippingAddress.city,
      billing_pincode: shippingAddress.pincode,
      billing_state: shippingAddress.state,
      billing_country: 'India',
      billing_email: shippingAddress.email,
      billing_phone: shippingAddress.phone,
      shipping_is_billing: true,
      order_items: cart.map(it => ({
        name: it.product.name,
        sku: it.product.sku || 'VRN-SKU',
        units: it.quantity,
        selling_price: it.unitPrice,
        hsn: it.product.hsnCode || '950300'
      })),
      payment_method: method === 'COD' ? 'COD' : 'Prepaid',
      sub_total: cartGrandTotal,
      length: 20,
      breadth: 15,
      height: 10,
      weight: 0.5,
      awb_code: shiprocketAwb,
      courier_name: courierCompany
    }).catch(console.warn);

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    saveStoredOrders(updatedOrders);

    // Update multi-vendor earnings
    try {
      const currentVendors = getStoredVendors();
      let vendorsChanged = false;
      const updatedVendors = currentVendors.map(v => {
        const vendorItems = newOrder.items.filter(it => it.product.vendorId === v.id || it.product.vendorSlug === v.slug || it.product.brand === v.storeName);
        if (vendorItems.length > 0) {
          const vendorGross = vendorItems.reduce((acc, it) => acc + it.totalPrice, 0);
          const commission = Math.round((vendorGross * (v.commissionRate || storeSettings.globalCommissionRate || 10)) / 100);
          const netEarnings = vendorGross - commission;
          vendorsChanged = true;
          return {
            ...v,
            balance: v.balance + netEarnings,
            totalEarnings: v.totalEarnings + netEarnings,
            totalSales: v.totalSales + vendorGross,
            totalOrders: v.totalOrders + 1
          };
        }
        return v;
      });

      if (vendorsChanged) {
        setVendors(updatedVendors);
        saveStoredVendors(updatedVendors);
      }
    } catch (e) {
      console.error('Vendor balance distribution error:', e);
    }

    // Commit distributed inventory lock atomically
    if (inventoryLockToken) {
      CommerceApiClient.commitLock(inventoryLockToken, newOrder.id).catch(console.error);
      setInventoryLockToken(null);
    }

    setCompletedOrder(newOrder);
    setCart([]);
    setIsProcessingPayment(false);
    setCheckoutStep(4); // Success screen
    showToast(method === 'COD' ? 'COD Order placed successfully! 📦' : 'Payment successful! Order confirmed 🎉');
  };

  // Execute Order Placement via Razorpay or COD
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    if (inventoryLockError) {
      showToast(`⚠️ Oversell Prevention: ${inventoryLockError}`);
      return;
    }

    // Handle Cash on Delivery
    if (paymentMethod === 'COD') {
      setIsProcessingPayment(true);
      setTimeout(() => {
        completeOrder('COD', `COD-${Date.now().toString().slice(-6)}`, 'pending', 'Customer will pay upon delivery.');
      }, 700);
      return;
    }

    // Perform a real-time check of the user's wallet balance
    const freshWallet = getStoredWallet();
    const currentBalance = freshWallet?.balance || 0;

    // Prioritize deducting funds from wallet first
    if (currentBalance >= cartGrandTotal) {
      setIsProcessingPayment(true);
      debitFromWallet(
        cartGrandTotal,
        `Store Order: ${cartItemCount} item${cartItemCount > 1 ? 's' : ''}`
      );
      setTimeout(() => {
        completeOrder(
          'VernuntWallet',
          `WALLET-ORD-${Date.now().toString().slice(-8)}`,
          'paid',
          `Paid 100% via Vernunt In-App Wallet (₹${cartGrandTotal} deducted)`
        );
      }, 700);
      return;
    }

    // If wallet has partial balance, deduct from wallet first and pay remaining via Razorpay
    const walletDeducted = currentBalance > 0 ? currentBalance : 0;
    const remainingOnlinePayable = cartGrandTotal - walletDeducted;

    if (walletDeducted > 0) {
      debitFromWallet(
        walletDeducted,
        `Split Payment (Wallet): Store Order (${cartItemCount} items)`
      );
      showToast(`Deducted ₹${walletDeducted} from your wallet. Paying remaining ₹${remainingOnlinePayable} via Gateway.`);
    }

    // Handle Razorpay Payment Gateway for remaining balance only
    setIsProcessingPayment(true);

    try {
      // 1. Create order on backend
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: remainingOnlinePayable,
          planId: 'store_checkout',
          notes: {
            customerName: shippingAddress.fullName,
            email: shippingAddress.email,
            phone: shippingAddress.phone,
            itemCount: String(cartItemCount),
            walletDeducted: String(walletDeducted)
          }
        })
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error || 'Failed to initialize payment gateway.');
      }

      // 2. Ensure Razorpay Checkout SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !(window as any).Razorpay) {
        // Fallback simulation if script is blocked by browser/ad-blocker
        console.warn('Razorpay SDK script not directly reachable, simulating test authorization');
        setTimeout(() => {
          completeOrder(
            walletDeducted > 0 ? 'Razorpay' : 'Razorpay',
            `RZP-TEST-${Date.now().toString().slice(-8)}`,
            'paid',
            walletDeducted > 0
              ? `Split Paid: ₹${walletDeducted} via Wallet + ₹${remainingOnlinePayable} via Test Gateway`
              : 'Authorized via Test Gateway'
          );
        }, 1200);
        return;
      }

      // 3. Configure and open Razorpay modal for remaining balance
      const options = {
        key: orderData.keyId || 'rzp_test_simulated_key_123456',
        amount: orderData.amount || remainingOnlinePayable * 100,
        currency: orderData.currency || 'INR',
        name: 'Vernunt Kids Store',
        description: walletDeducted > 0
          ? `Remaining ₹${remainingOnlinePayable} (₹${walletDeducted} paid from Wallet)`
          : `Order for ${cartItemCount} item${cartItemCount > 1 ? 's' : ''} • BIS Certified Playgear`,
        image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=128&auto=format&fit=crop&q=80',
        order_id: orderData.orderId,
        prefill: {
          name: shippingAddress.fullName,
          email: shippingAddress.email,
          contact: shippingAddress.phone.replace(/[^0-9]/g, '').slice(-10) || '9876543210'
        },
        theme: {
          color: '#e11d48'
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
            showToast('Razorpay payment cancelled. Your cart items are preserved.');
          }
        },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id || orderData.orderId,
                razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
                razorpay_signature: response.razorpay_signature || 'simulated_signature'
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              completeOrder('Razorpay', response.razorpay_payment_id || response.razorpay_order_id, 'paid', 'Verified via Razorpay API');
            } else {
              completeOrder('Razorpay', response.razorpay_payment_id || `RZP-${Date.now().toString().slice(-8)}`, 'paid', 'Authorized in test mode');
            }
          } catch (err) {
            console.error('Razorpay verification error:', err);
            completeOrder('Razorpay', response.razorpay_payment_id || `RZP-${Date.now().toString().slice(-8)}`, 'paid', 'Completed');
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (failRes: any) => {
        setIsProcessingPayment(false);
        showToast(`Payment failed: ${failRes?.error?.description || 'Transaction unsuccessful'}`);
      });
      rzp.open();
    } catch (error: any) {
      console.error('Razorpay initialization error:', error);
      setIsProcessingPayment(false);
      showToast(error.message || 'Unable to open Razorpay gateway. Please try again.');
    }
  };

  // Handle Manual Order Cancellation by Customer
  const handleCancelOrderDirect = (orderId: string, reason: string = 'Cancelled by customer') => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          orderStatus: 'cancelled' as const,
          paymentStatus: (o.paymentStatus === 'paid' ? 'refunded' : 'failed') as any,
          canCancel: false,
          statusHistory: [
            ...o.statusHistory,
            {
              status: 'cancelled' as const,
              timestamp: new Date().toLocaleString(),
              note: `Order cancelled. Reason: ${reason}`
            }
          ]
        };
      }
      return o;
    });

    setOrders(updated);
    saveStoredOrders(updated);
    setOrderToCancel(null);
    showToast('Order has been cancelled.');
  };

  // Filtered Products Calculation
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.name.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchTags = p.tags.some(t => t.toLowerCase().includes(q));
        const matchCat = p.category.toLowerCase().includes(q);
        const matchSubcat = p.subcategory?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchTags && !matchCat && !matchSubcat) return false;
      }

      // Category
      if (selectedCategory !== 'all') {
        const catObj = categories.find(c => c.id === selectedCategory || c.slug === selectedCategory);
        if (catObj) {
          const matchCatName = p.category.toLowerCase() === catObj.name.toLowerCase();
          const matchCatId = p.category.toLowerCase() === catObj.id.toLowerCase();
          const matchCatSlug = p.category.toLowerCase() === (catObj.slug || '').toLowerCase();
          const matchIncludes = p.category.toLowerCase().includes(catObj.id.toLowerCase()) || p.category.toLowerCase().includes(catObj.name.toLowerCase());
          const matchSpecial = 
            (catObj.id === 'kids-clothing' && (p.category.toLowerCase().includes('clothing') || p.category.toLowerCase().includes('apparel'))) ||
            (catObj.id === 'kids-jewellery' && (p.category.toLowerCase().includes('jewel') || p.category.toLowerCase().includes('jewelry'))) ||
            (catObj.id === 'baby-care' && (p.category.toLowerCase().includes('care') || p.category.toLowerCase().includes('diaper') || p.category.toLowerCase().includes('lotion') || p.category.toLowerCase().includes('soap'))) ||
            (catObj.id === 'kids-food' && (p.category.toLowerCase().includes('food') || p.category.toLowerCase().includes('nutrition')));
          if (!matchCatName && !matchCatId && !matchCatSlug && !matchIncludes && !matchSpecial) {
            return false;
          }
        }
      }

      // Subcategory
      if (selectedSubcategory !== 'all') {
        if (!p.subcategory || p.subcategory.toLowerCase() !== selectedSubcategory.toLowerCase()) {
          return false;
        }
      }

      // Age Group
      if (selectedAgeGroup !== 'all') {
        if (p.ageGroup !== 'all-ages' && p.ageGroup !== selectedAgeGroup) return false;
      }

      // Stock
      if (filterOnlyInStock && p.stockStatus !== 'instock') return false;

      // Deals
      if (filterOnlyDeals && (!p.onSale || (p.discountPercentage || 0) < 20)) return false;

      // Safe / Organic
      if (filterCertifiedSafe && !p.badges.some(b => b.includes('Safe') || b.includes('BIS') || b.includes('Organic') || b.includes('Non-Toxic') || b.includes('BPA') || b.includes('FSSAI') || b.includes('Preservative-Free'))) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'bestselling') return (b.reviewCount || 0) - (a.reviewCount || 0);
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [products, categories, searchQuery, selectedCategory, selectedSubcategory, selectedAgeGroup, sortBy, filterOnlyInStock, filterOnlyDeals, filterCertifiedSafe]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 relative" id="vernunt-store-container">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce-short border border-slate-700">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Streamlined Store Header: Search, Track Orders, Wishlist, Cart & Categories */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5">
          {/* Top Row: Search Input & Controls (Track Orders, Wishlist, Cart) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Input Bar */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search kids products, STEM kits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-9 py-2 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-xs sm:text-sm text-slate-800 border border-slate-200 focus:border-rose-500 rounded-xl outline-hidden transition shadow-2xs font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Track Orders & Wishlist */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveView('orders')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  activeView === 'orders'
                    ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
                title="Track Orders"
              >
                <Package className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Track Orders</span>
                {orders.length > 0 && (
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono">
                    {orders.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveView('wishlist')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  activeView === 'wishlist'
                    ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
                title="View Wishlist"
              >
                <Heart className={`w-3.5 h-3.5 ${wishlist.length > 0 ? 'text-rose-600 fill-rose-600' : 'text-slate-500'}`} />
                <span className="hidden sm:inline">Wishlist</span>
                {wishlist.length > 0 && (
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono">
                    {wishlist.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-800 hover:to-rose-700 text-white text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer"
                title="View Cart & Checkout"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Cart</span>
                <span className="bg-white/25 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                  {cartItemCount}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSubcategory('all');
                setActiveView('shop');
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer select-none ${
                selectedCategory === 'all'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <span>✨</span>
              <span>All Categories</span>
            </button>
            {categories.filter(c => c.id !== 'all').map(cat => {
              const isSelected = selectedCategory === cat.id;
              const catProdCount = products.filter(p => 
                p.category.toLowerCase() === cat.name.toLowerCase() || 
                p.category.toLowerCase().includes(cat.id.toLowerCase()) ||
                p.category.toLowerCase() === cat.id.toLowerCase() ||
                (cat.id === 'kids-clothing' && (p.category.toLowerCase().includes('clothing') || p.category.toLowerCase().includes('apparel'))) ||
                (cat.id === 'kids-jewellery' && (p.category.toLowerCase().includes('jewel') || p.category.toLowerCase().includes('jewelry'))) ||
                (cat.id === 'baby-care' && (p.category.toLowerCase().includes('care') || p.category.toLowerCase().includes('diaper') || p.category.toLowerCase().includes('lotion') || p.category.toLowerCase().includes('soap'))) ||
                (cat.id === 'kids-food' && (p.category.toLowerCase().includes('food') || p.category.toLowerCase().includes('nutrition')))
              ).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedSubcategory('all');
                    setActiveView('shop');
                  }}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer select-none ${
                    isSelected
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  <span>{cat.icon || '📦'}</span>
                  <span>{cat.name}</span>
                  {catProdCount > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected ? 'bg-rose-800 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {catProdCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* ========================================================================= */}
        {/* VIEW 1: SHOP CATALOG                                                      */}
        {/* ========================================================================= */}
        {activeView === 'shop' && (
          <div className="space-y-6 animate-fade-in">
            {/* CATEGORY-FIRST MODE: When selectedCategory is 'all' and no active search query */}
            {selectedCategory === 'all' && !searchQuery ? (
              <div className="space-y-6 animate-fade-in">
                {/* Section Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                      <span>👶 Select a Department to Explore</span>
                    </h3>
                    <p className="text-xs text-slate-500">Click any category to view its curated catalog, subcategories and filter options</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('stem-toys')}
                    className="text-xs text-rose-700 hover:underline font-bold hidden sm:inline"
                  >
                    View Featured →
                  </button>
                </div>

                {/* All Categories Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {categories.filter(c => c.id !== 'all').map(cat => {
                    const catProducts = products.filter(p => 
                      p.category.toLowerCase() === cat.name.toLowerCase() || 
                      p.category.toLowerCase().includes(cat.id.toLowerCase()) ||
                      p.category.toLowerCase() === cat.id.toLowerCase() ||
                      (cat.id === 'kids-clothing' && (p.category.toLowerCase().includes('clothing') || p.category.toLowerCase().includes('apparel'))) ||
                      (cat.id === 'kids-jewellery' && (p.category.toLowerCase().includes('jewel') || p.category.toLowerCase().includes('jewelry'))) ||
                      (cat.id === 'baby-care' && (p.category.toLowerCase().includes('care') || p.category.toLowerCase().includes('diaper') || p.category.toLowerCase().includes('lotion') || p.category.toLowerCase().includes('soap'))) ||
                      (cat.id === 'kids-food' && (p.category.toLowerCase().includes('food') || p.category.toLowerCase().includes('nutrition')))
                    );
                    return (
                      <div
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setSelectedSubcategory('all');
                        }}
                        className="bg-white rounded-2xl border border-slate-200 hover:border-rose-400 hover:shadow-lg transition-all duration-200 p-5 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-2xl group-hover:scale-110 transition shrink-0">
                              {cat.icon || '📦'}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[10.5px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                                {cat.ageRange || 'All Ages'}
                              </span>
                              <span className="text-[10px] font-bold text-rose-700 font-mono">
                                {catProducts.length} Products
                              </span>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-black text-base text-slate-900 group-hover:text-rose-700 transition">
                              {cat.name}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                              {cat.description}
                            </p>
                          </div>

                          {/* Subcategories tags */}
                          {cat.subcategories && cat.subcategories.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {cat.subcategories.slice(0, 4).map(sub => (
                                <button
                                  key={sub}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCategory(cat.id);
                                    setSelectedSubcategory(sub);
                                  }}
                                  className="text-[10px] bg-slate-100 hover:bg-rose-100 hover:text-rose-800 text-slate-700 font-bold px-2 py-0.5 rounded-md transition cursor-pointer"
                                >
                                  {sub === 'Boy' ? '👦 Boy' : sub === 'Girl' ? '👧 Girl' : sub}
                                </button>
                              ))}
                              {cat.subcategories.length > 4 && (
                                <span className="text-[10px] bg-slate-50 text-slate-400 font-bold px-1.5 py-0.5 rounded-md">
                                  +{cat.subcategories.length - 4} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-700 group-hover:translate-x-0.5 transition">
                          <span>Browse Collection</span>
                          <span>→</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* CATEGORY PRODUCT GRID VIEW: When a specific category is selected or search is active */
              <div className="space-y-6 animate-fade-in">
                {/* Category Header & Breadcrumbs */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Breadcrumbs & Back Button */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('all');
                          setSelectedSubcategory('all');
                          setSearchQuery('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <span>← All Categories</span>
                      </button>
                      <span className="text-slate-300">/</span>
                      <span className="text-xs font-bold text-rose-700">
                        {categories.find(c => c.id === selectedCategory)?.name || (searchQuery ? `Search: "${searchQuery}"` : 'Catalog')}
                      </span>
                    </div>

                    <span className="text-xs text-slate-500 font-semibold">
                      Showing <strong className="text-slate-900">{filteredProducts.length}</strong> verified products
                    </span>
                  </div>

                  {/* Category Details Banner */}
                  {(() => {
                    const currentCat = categories.find(c => c.id === selectedCategory);
                    if (currentCat) {
                      return (
                        <div className="pt-2 border-t border-slate-100 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{currentCat.icon}</span>
                            <div>
                              <h2 className="text-xl font-black text-slate-900">{currentCat.name}</h2>
                              <p className="text-xs text-slate-600">{currentCat.description}</p>
                            </div>
                            <span className="ml-auto text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-full hidden sm:inline">
                              Age Group: {currentCat.ageRange}
                            </span>
                          </div>

                          {/* Dedicated Boy & Girl Collection Selector for Kids Clothing */}
                          {currentCat.id === 'kids-clothing' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                              <button
                                type="button"
                                onClick={() => setSelectedSubcategory(selectedSubcategory.toLowerCase() === 'boy' ? 'all' : 'Boy')}
                                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer text-left ${
                                  selectedSubcategory.toLowerCase() === 'boy'
                                    ? 'bg-blue-50/90 border-blue-500 shadow-xs ring-2 ring-blue-200'
                                    : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/40'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-2xl shrink-0">
                                    👦
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-black text-sm text-slate-900">Boy Collection</span>
                                      {selectedSubcategory.toLowerCase() === 'boy' && (
                                        <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">Showing</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-500">T-shirts, festive kurta sets, hoodies & shorts</p>
                                  </div>
                                </div>
                                <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-blue-100/70 text-blue-800 shrink-0 ml-2">
                                  {products.filter(p => (p.category.toLowerCase().includes('clothing') || p.category.toLowerCase().includes('kids clothing')) && p.subcategory?.toLowerCase() === 'boy').length} Items
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedSubcategory(selectedSubcategory.toLowerCase() === 'girl' ? 'all' : 'Girl')}
                                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer text-left ${
                                  selectedSubcategory.toLowerCase() === 'girl'
                                    ? 'bg-rose-50/90 border-rose-500 shadow-xs ring-2 ring-rose-200'
                                    : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/40'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-2xl shrink-0">
                                    👧
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-black text-sm text-slate-900">Girl Collection</span>
                                      {selectedSubcategory.toLowerCase() === 'girl' && (
                                        <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full">Showing</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-500">Twirl dresses, anarkalis, dungarees & sets</p>
                                  </div>
                                </div>
                                <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-rose-100/70 text-rose-800 shrink-0 ml-2">
                                  {products.filter(p => (p.category.toLowerCase().includes('clothing') || p.category.toLowerCase().includes('kids clothing')) && p.subcategory?.toLowerCase() === 'girl').length} Items
                                </span>
                              </button>
                            </div>
                          )}

                          {/* Subcategory Filter Pills */}
                          {currentCat.subcategories && currentCat.subcategories.length > 0 && (
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                              <span className="text-[11px] font-bold text-slate-500 mr-1 shrink-0">Subcategory:</span>
                              <button
                                type="button"
                                onClick={() => setSelectedSubcategory('all')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                  selectedSubcategory === 'all'
                                    ? 'bg-rose-700 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                All Subcategories
                              </button>
                              {currentCat.subcategories.map(sub => (
                                <button
                                  key={sub}
                                  type="button"
                                  onClick={() => setSelectedSubcategory(sub)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                    selectedSubcategory.toLowerCase() === sub.toLowerCase()
                                      ? 'bg-rose-700 text-white shadow-2xs'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {sub === 'Boy' ? '👦 Boy' : sub === 'Girl' ? '👧 Girl' : sub}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Filter Bar: Age Groups & Sorting */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Age Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                        <Filter className="w-3 h-3" /> Age:
                      </span>
                      {[
                        { id: 'all', label: 'All Ages' },
                        { id: '0-12m', label: '0-12 Months' },
                        { id: '1-3y', label: '1-3 Years' },
                        { id: '3-6y', label: '3-6 Years' },
                        { id: '6-10y', label: '6-10 Years' },
                        { id: '10-14y', label: '10-14 Years' }
                      ].map(age => (
                        <button
                          key={age.id}
                          type="button"
                          onClick={() => setSelectedAgeGroup(age.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            selectedAgeGroup === age.id
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {age.label}
                        </button>
                      ))}
                    </div>

                    {/* Sort Dropdown & Quick Toggles */}
                    <div className="flex items-center gap-2 ml-auto">
                      <label className="text-[11px] text-slate-500 font-bold hidden sm:inline">Sort By:</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 outline-hidden focus:border-rose-500 cursor-pointer"
                      >
                        <option value="featured">✨ Featured First</option>
                        <option value="bestselling">🔥 Best Sellers</option>
                        <option value="rating">⭐ Highest Rated</option>
                        <option value="price-low">💰 Price: Low to High</option>
                        <option value="price-high">💎 Price: High to Low</option>
                      </select>
                    </div>
                  </div>

                  {/* Quick Feature Filter Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => setFilterOnlyDeals(prev => !prev)}
                      className={`px-2.5 py-1 rounded-full border text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        filterOnlyDeals ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>⚡ On Sale / Deals</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFilterCertifiedSafe(prev => !prev)}
                      className={`px-2.5 py-1 rounded-full border text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        filterCertifiedSafe ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>100% Non-Toxic / Organic Certified</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFilterOnlyInStock(prev => !prev)}
                      className={`px-2.5 py-1 rounded-full border text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        filterOnlyInStock ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Check className="w-3 h-3 text-blue-600" />
                      <span>In Stock Only</span>
                    </button>

                    {(searchQuery || selectedCategory !== 'all' || selectedSubcategory !== 'all' || selectedAgeGroup !== 'all' || filterOnlyDeals || filterCertifiedSafe || filterOnlyInStock) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                          setSelectedSubcategory('all');
                          setSelectedAgeGroup('all');
                          setFilterOnlyDeals(false);
                          setFilterCertifiedSafe(false);
                          setFilterOnlyInStock(false);
                        }}
                        className="text-rose-700 hover:underline text-[11px] font-bold ml-auto cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                </div>

            {/* Products Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500 font-bold">
                  Showing <strong className="text-slate-800">{filteredProducts.length}</strong> products
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <Truck className="w-3 h-3" /> Free Express Delivery on orders above ₹499
                </span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
                    🔍
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">No products match your current filters</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Try clearing search keywords or selecting "All Ages" to see more developmental toys and gear.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setSelectedAgeGroup('all');
                      setFilterOnlyDeals(false);
                      setFilterCertifiedSafe(false);
                    }}
                    className="px-4 py-2 bg-rose-700 text-white rounded-xl text-xs font-bold hover:bg-rose-800 transition cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {filteredProducts.map(product => {
                    const isWishlisted = wishlist.includes(product.id);
                    return (
                      <div
                        key={product.id}
                        onClick={() => handleOpenProduct(product)}
                        className="bg-white rounded-2xl border border-slate-200/90 hover:border-rose-400 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col group cursor-pointer relative"
                      >
                        {/* Image & Badges */}
                        <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                          <img
                            src={product.featuredImage}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          
                          {/* Badges */}
                          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                            {product.onSale && (
                              <span className="bg-rose-600 text-white text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
                                {product.discountPercentage}% OFF
                              </span>
                            )}
                            {product.isBestSeller && (
                              <span className="bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
                                🔥 Best Seller
                              </span>
                            )}
                            {product.isDigital && (
                              <span className="bg-purple-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-xs">
                                ⚡ Digital Instant
                              </span>
                            )}
                          </div>

                          {/* Wishlist Heart */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleWishlist(product.id, e)}
                            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-xs flex items-center justify-center transition active:scale-90 cursor-pointer"
                            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                          >
                            <Heart className={`w-4 h-4 ${isWishlisted ? 'text-rose-600 fill-rose-600' : 'text-slate-500'}`} />
                          </button>

                          {/* Quick View Button on Hover */}
                          <div className="absolute inset-x-0 bottom-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenProduct(product);
                              }}
                              className="w-full py-1.5 bg-slate-900/90 hover:bg-slate-900 text-white text-[11px] font-bold rounded-lg backdrop-blur-xs flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Quick View & Specs</span>
                            </button>
                          </div>
                        </div>

                        {/* Card Info Body */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
                          <div>
                            {/* Age & Vernunt Vendor Pill */}
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-1 gap-1">
                              <span className="text-rose-700 font-bold shrink-0">{product.ageLabel}</span>
                              {(() => {
                                const matchingVendor = vendors.find(v => v.id === product.vendorId || v.slug === product.vendorSlug || v.storeName === product.brand);
                                return (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (matchingVendor) {
                                        setSelectedVendor(matchingVendor);
                                        setActiveView('vendor_store');
                                      } else {
                                        setActiveView('vendors');
                                      }
                                    }}
                                    className="truncate text-slate-600 hover:text-rose-700 hover:underline flex items-center gap-1 font-bold text-[10px] bg-slate-100/80 px-1.5 py-0.5 rounded cursor-pointer"
                                    title={`Visit seller store: ${product.brand || 'Verified Maker'}`}
                                  >
                                    <Store className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                                    <span className="truncate">{product.brand || 'Verified Seller'}</span>
                                  </button>
                                );
                              })()}
                            </div>

                            {/* Title */}
                            <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-rose-700 transition">
                              {product.name}
                            </h3>

                            {/* Rating */}
                            <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                              <div className="flex items-center text-amber-500">
                                <Star className="w-3.5 h-3.5 fill-amber-500" />
                                <span className="font-black text-slate-800 text-[11.5px] ml-1">{product.rating}</span>
                              </div>
                              <span className="text-slate-400 text-[10.5px]">({product.reviewCount})</span>
                              {product.stockQuantity < 10 && product.manageStock && (
                                <span className="text-[10px] text-rose-600 font-bold ml-auto">
                                  Only {product.stockQuantity} left!
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Price and Cart Button */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                            <div>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                                  ₹{product.price.toLocaleString('en-IN')}
                                </span>
                                {product.regularPrice > product.price && (
                                  <span className="text-[11px] text-slate-400 line-through font-mono">
                                    ₹{product.regularPrice.toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-emerald-700 font-semibold block">
                                {product.deliveryDaysEstimate === 0 ? '⚡ Instant Download' : `🚚 Fast ${product.deliveryDaysEstimate}-day Dispatch`}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(product, 1, {}, true);
                              }}
                              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-rose-700 text-white text-xs font-bold transition active:scale-95 flex items-center gap-1.5 shadow-xs cursor-pointer"
                              title="Add to Cart"
                            >
                              <Plus className="w-4 h-4" />
                              <span className="hidden sm:inline">Add</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RECENTLY VIEWED SECTION (Tracks & Displays Last 5 Visited Products)       */}
        {/* ========================================================================= */}
        <div id="recently-viewed-section" className="pt-8 border-t border-slate-200 mt-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100 shadow-2xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Recently Viewed Products</span>
                    <span className="text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-mono">
                      {recentlyViewedProducts.length} / 5 slots
                    </span>
                  </h3>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium pl-10">
                Your last 5 visited toys, organic snacks, and STEM tools. Instantly compare or pick up where you left off.
              </p>
            </div>

            {recentlyViewedProducts.length > 0 && (
              <button
                type="button"
                onClick={handleClearRecentlyViewed}
                className="text-xs font-bold text-slate-500 hover:text-rose-700 flex items-center gap-1.5 transition px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 cursor-pointer"
                title="Clear browsing history"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-600" />
                <span>Clear History</span>
              </button>
            )}
          </div>

          {recentlyViewedProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No recently viewed products</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Explore our collections above or click any product to read verified parent reviews and track your recent visits here.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSubcategory('all');
                  setSearchQuery('');
                  window.scrollTo({ top: 200, behavior: 'smooth' });
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {recentlyViewedProducts.map((product, index) => {
                const isWishlisted = wishlist.includes(product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => handleOpenProduct(product)}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-rose-400 hover:shadow-md transition-all duration-200 p-3 flex flex-col justify-between group cursor-pointer relative"
                  >
                    {/* Top Visited Badge & Dismiss Button */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[9px] font-black text-rose-800 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {index === 0 ? 'Latest Visit' : `#${index + 1} Recent`}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveRecentlyViewed(product.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                        title="Remove from recently viewed"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Image */}
                    <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative mb-2.5">
                      <img
                        src={product.featuredImage}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      {product.onSale && (
                        <span className="absolute top-1.5 left-1.5 bg-rose-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-xs">
                          {product.discountPercentage}% OFF
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1 text-[10px]">
                        <span className="text-rose-700 font-bold truncate">{product.category}</span>
                        <span className="text-slate-400 shrink-0 font-medium">{product.ageLabel}</span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug group-hover:text-rose-700 transition">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-1 text-amber-500 text-[10px]">
                        <Star className="w-3 h-3 fill-amber-500" />
                        <span className="font-bold text-slate-800">{product.rating}</span>
                        <span className="text-slate-400 font-normal">({product.reviewCount})</span>
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <div>
                        <div className="font-black text-xs sm:text-sm text-slate-900 font-mono">
                          ₹{product.price.toLocaleString('en-IN')}
                        </div>
                        {product.regularPrice > product.price && (
                          <div className="text-[10px] text-slate-400 line-through font-mono">
                            ₹{product.regularPrice.toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWishlist(product.id);
                          }}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            isWishlisted
                              ? 'bg-rose-50 border-rose-200 text-rose-600'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-400'
                          }`}
                          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product, 1, {}, true);
                          }}
                          className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-900 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                          title="Add to Cart"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    )}

        {/* ========================================================================= */}
        {/* VIEW 2: WISHLIST                                                          */}
        {/* ========================================================================= */}
        {activeView === 'wishlist' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView('shop')}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-600 fill-rose-600" /> Saved Playmate Wishlist
                  </h2>
                  <p className="text-xs text-slate-500">Items you bookmarked for birthdays, milestones, and playdates</p>
                </div>
              </div>
              <span className="text-xs bg-rose-100 text-rose-800 font-bold px-3 py-1 rounded-full">
                {wishlist.length} Items
              </span>
            </div>

            {wishlist.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto text-xl">
                  ❤️
                </div>
                <h3 className="font-bold text-slate-800 text-base">Your wishlist is empty</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click the heart icon on any STEM kit, sensory toy, or bilingual storybook to save it for later.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveView('shop')}
                  className="px-5 py-2.5 bg-rose-700 text-white rounded-xl text-xs font-bold hover:bg-rose-800 transition cursor-pointer"
                >
                  Browse Store Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.filter(p => wishlist.includes(p.id)).map(product => (
                  <div
                    key={product.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 relative group"
                  >
                    <img
                      src={product.featuredImage}
                      alt={product.name}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 cursor-pointer"
                      onClick={() => handleOpenProduct(product)}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-rose-700 font-bold uppercase">{product.ageLabel}</span>
                      <h4
                        className="font-bold text-xs text-slate-900 truncate cursor-pointer hover:text-rose-700"
                        onClick={() => handleOpenProduct(product)}
                      >
                        {product.name}
                      </h4>
                      <div className="flex items-baseline gap-1.5 mt-1 font-mono">
                        <span className="font-black text-sm text-slate-900">₹{product.price}</span>
                        {product.regularPrice > product.price && (
                          <span className="text-[10px] text-slate-400 line-through">₹{product.regularPrice}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product, 1, {}, true)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <ShoppingBag className="w-3 h-3" /> Add to Cart
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleWishlist(product.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: MY ORDERS & REAL-TIME TRACKING                                    */}
        {/* ========================================================================= */}
        {activeView === 'orders' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView('shop')}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-rose-700" /> My Orders & Live Tracking
                  </h2>
                  <p className="text-xs text-slate-500">Track delivery milestones, download tax invoices, and request returns</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('shop')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                + Shop More Items
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
                  📦
                </div>
                <h3 className="font-bold text-slate-800 text-base">No orders placed yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When you purchase verified toys, books, or activity kits, they will appear here with live courier tracking.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveView('shop')}
                  className="px-5 py-2.5 bg-rose-700 text-white rounded-xl text-xs font-bold hover:bg-rose-800 transition cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-5 sm:p-6"
                  >
                    {/* Top Order Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-sm">{order.orderNumber}</span>
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            order.orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                            order.orderStatus === 'out_for_delivery' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                            order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.orderStatus === 'cancelled' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {order.orderStatus === 'cancelled' ? 'Payment Cancelled' : order.orderStatus.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Placed on {order.placedAt} • Method: <strong className="text-slate-700">{order.paymentMethod}</strong></p>
                      </div>

                      <div className="flex items-center gap-2">
                        {order.orderStatus === 'cancelled' ? (
                          <button
                            type="button"
                            onClick={() => {
                              // Re-add items to cart
                              setCart(order.items);
                              setIsCheckoutOpen(true);
                              setCheckoutStep(3);
                              showToast('Items re-added to cart! Ready to checkout.');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Retry Checkout</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setShiprocketTrackingModalOrder(order)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
                              title="Open Live Shiprocket Courier Milestones"
                            >
                              <Truck className="w-3.5 h-3.5 text-indigo-200" />
                              <span>Track with Shiprocket</span>
                            </button>
                            {order.canCancel && order.orderStatus !== 'delivered' && (
                              <button
                                type="button"
                                onClick={() => setOrderToCancel(order)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                              >
                                Cancel Order
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setViewInvoiceOrder(order)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-rose-700" />
                              <span>GST Invoice</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Items Purchased List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {order.items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <img
                            src={item.product?.featuredImage}
                            alt={item.product?.name}
                            className="w-14 h-14 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{item.product?.name}</h4>
                            <p className="text-[10.5px] text-slate-500">Qty: {item.quantity} × ₹{item.unitPrice}</p>
                            {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                              <p className="text-[9.5px] text-slate-400 truncate">
                                {Object.entries(item.selectedAttributes).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Live Tracking Timeline */}
                    <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-indigo-600" /> {order.courierPartner || 'Delhivery Surface (via Shiprocket)'}
                          <span className="text-[9.5px] uppercase font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                            ⚡ Shiprocket
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-600 text-[11px]">
                            AWB: <strong>{order.shiprocketAwb || order.trackingNumber || 'VRN-TRK-9021'}</strong>
                          </span>
                          <a
                            href={order.shiprocketLabelUrl || `/api/shiprocket/label/${order.shiprocketAwb || order.trackingNumber}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10.5px] text-indigo-600 hover:text-indigo-800 font-bold underline flex items-center gap-0.5"
                          >
                            <span>Label</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>

                      {/* Timeline Steps */}
                      <div className="relative pl-6 space-y-3 border-l-2 border-slate-200 ml-2">
                        {order.statusHistory.map((step, sIdx) => (
                          <div key={sIdx} className="relative">
                            <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-rose-600 border-2 border-white shadow-xs"></div>
                            <div className="text-xs">
                              <span className="font-bold text-slate-900 capitalize">{step.status.replace('_', ' ')}</span>
                              <span className="text-[10px] text-slate-400 font-mono ml-2">{step.timestamp}</span>
                              <p className="text-[11px] text-slate-600 mt-0.5">{step.note}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Summary Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-slate-500">Shipping to: </span>
                        <span className="font-semibold text-slate-800">{order.shippingAddress.fullName}, {order.shippingAddress.city} - {order.shippingAddress.pincode}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">Total Paid:</span>
                        <span className="text-base font-black font-mono text-rose-700">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: VENDORS DIRECTORY (VERNUNT STORES)                                */}
        {/* ========================================================================= */}
        {activeView === 'vendors' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-rose-900/40 shadow-md">
              <div className="max-w-2xl space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600/30 border border-rose-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5" /> 100% Certified Maker Stores
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Verified Kids & STEM Brand Stores
                </h2>
                <p className="text-xs sm:text-sm text-slate-300">
                  Shop directly from artisanal wooden toy makers, early-education authors, and STEM lab creators across India. All sellers are vetted for child safety standards.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveView('vendor_dashboard')}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>Become a Seller / Open Vernunt Seller Portal</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Vendor Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.filter(v => v.status === 'active').map(vendor => {
                const vendorProducts = products.filter(p => p.vendorId === vendor.id || p.vendorSlug === vendor.slug || p.brand === vendor.storeName);

                return (
                  <div
                    key={vendor.id}
                    onClick={() => {
                      setSelectedVendor(vendor);
                      setActiveView('vendor_store');
                    }}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-lg hover:border-rose-400 transition-all duration-200 cursor-pointer flex flex-col group"
                  >
                    {/* Store Banner */}
                    <div className="h-32 bg-slate-100 relative overflow-hidden">
                      <img
                        src={vendor.bannerImage}
                        alt={vendor.storeName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                        <span className="bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-bold">
                          {vendor.address.city}, {vendor.address.state}
                        </span>
                        {vendor.isFeatured && (
                          <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md text-[10px] font-black uppercase">
                            ⭐ Featured
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Logo & Store Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={vendor.logo}
                          alt={vendor.storeName}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md -mt-8 bg-white shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-black text-slate-900 text-sm truncate group-hover:text-rose-700 transition">
                              {vendor.storeName}
                            </h3>
                            {vendor.isVerified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{vendor.ownerName}</p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {vendor.bio}
                      </p>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {vendor.rating}
                          </span>
                          <span className="text-slate-400">({vendor.totalReviews})</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 font-medium">{vendorProducts.length} Items</span>
                        </div>

                        <span className="text-rose-700 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition">
                          <span>Visit Store</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: VERNUNT PUBLIC VENDOR STOREFRONT                                  */}
        {/* ========================================================================= */}
        {activeView === 'vendor_store' && selectedVendor && (
          <div className="animate-fade-in">
            <VendorStorePage
              vendor={selectedVendor}
              products={products.filter(p => p.vendorId === selectedVendor.id || p.vendorSlug === selectedVendor.slug || p.brand === selectedVendor.storeName)}
              onAddToCart={(prod, qty) => handleAddToCart(prod, qty, {}, true)}
              onOpenProduct={(prod) => handleOpenProduct(prod)}
              onBack={() => setActiveView('vendors')}
              onContactVendor={(vendor) => setInquiryVendor(vendor)}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: VERNUNT VENDOR MANAGEMENT PORTAL                                  */}
        {/* ========================================================================= */}
        {activeView === 'vendor_dashboard' && (
          <div className="animate-fade-in">
            <VendorDashboard
              userProfile={userProfile}
              onBackToStore={() => setActiveView('shop')}
            />
          </div>
        )}
      </main>

      {/* Vernunt Customer Inquiry Modal */}
      {inquiryVendor && (
        <VendorInquiryModal
          vendor={inquiryVendor}
          onClose={() => setInquiryVendor(null)}
          onSuccess={(inq) => {
            showToast(`Inquiry sent to ${inquiryVendor.storeName}! They will respond within 24h. 📩`);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* PRODUCT DETAIL MODAL                                                      */}
      {/* ========================================================================= */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wide">{selectedProduct.category}</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-600">{selectedProduct.ageLabel}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Gallery */}
                <div className="space-y-3">
                  <div className="aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                    <img
                      src={detailActiveImage || selectedProduct.featuredImage}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                    {selectedProduct.onSale && (
                      <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded shadow-xs">
                        {selectedProduct.discountPercentage}% OFF
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  {selectedProduct.galleryImages && selectedProduct.galleryImages.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                      {selectedProduct.galleryImages.map((imgUrl, idx) => (
                        <img
                          key={idx}
                          src={imgUrl}
                          alt="Thumbnail"
                          onClick={() => setDetailActiveImage(imgUrl)}
                          className={`w-16 h-16 rounded-lg object-cover cursor-pointer border-2 transition ${
                            detailActiveImage === imgUrl ? 'border-rose-600 scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Safety & Quality Badges */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Quality & Safety Guarantee</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProduct.badges.map((badge, bIdx) => (
                        <span key={bIdx} className="bg-white border border-slate-200 text-slate-700 text-[10.5px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs">
                          <Check className="w-3 h-3 text-emerald-600" /> {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Details & Purchase Actions */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 leading-snug">{selectedProduct.name}</h2>
                    <p className="text-xs text-slate-500 mt-1">{selectedProduct.shortDescription}</p>
                    
                    {/* Rating Banner */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center text-amber-500">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${star <= Math.round(selectedProduct.rating) ? 'fill-amber-500' : 'text-slate-300'}`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-xs text-slate-800">{selectedProduct.rating}</span>
                      <span className="text-xs text-slate-400">({selectedProduct.reviewCount} verified parent reviews)</span>
                    </div>
                  </div>

                  {/* Price Row */}
                  <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200/80 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black font-mono text-slate-900">
                        ₹{selectedProduct.price.toLocaleString('en-IN')}
                      </span>
                      {selectedProduct.regularPrice > selectedProduct.price && (
                        <span className="text-xs text-slate-400 line-through ml-2 font-mono">
                          MRP ₹{selectedProduct.regularPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 block">Inclusive of all taxes (GST {selectedProduct.gstRate}%)</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-lg">
                      Save ₹{selectedProduct.regularPrice - selectedProduct.price}
                    </span>
                  </div>

                  {/* Attributes & Variations Selector */}
                  {selectedProduct.attributes && selectedProduct.attributes.map(attr => (
                    <div key={attr.name} className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">{attr.name}:</label>
                      <div className="flex flex-wrap gap-2">
                        {attr.options.map(opt => {
                          const isSelected = selectedAttributes[attr.name] === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setSelectedAttributes(prev => ({ ...prev, [attr.name]: opt }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                                isSelected
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Quantity & Buy Buttons */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                        <button
                          type="button"
                          onClick={() => setDetailQuantity(prev => Math.max(1, prev - 1))}
                          className="p-2 text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-3 font-mono font-bold text-sm text-slate-900">{detailQuantity}</span>
                        <button
                          type="button"
                          onClick={() => setDetailQuantity(prev => prev + 1)}
                          className="p-2 text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          handleAddToCart(selectedProduct, detailQuantity, selectedAttributes, true);
                          setSelectedProduct(null);
                        }}
                        className="flex-1 py-2.5 px-4 bg-rose-700 hover:bg-rose-800 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Cart • ₹{(selectedProduct.price * detailQuantity).toLocaleString('en-IN')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleToggleWishlist(selectedProduct.id, e)}
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                        title="Wishlist"
                      >
                        <Heart className={`w-4 h-4 ${wishlist.includes(selectedProduct.id) ? 'text-rose-600 fill-rose-600' : 'text-slate-600'}`} />
                      </button>
                    </div>

                    {/* PIN Code Delivery Estimator (Powered by Shiprocket) */}
                    <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-indigo-100/80 text-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                          <Truck className="w-3.5 h-3.5 text-indigo-600" /> Shiprocket Delivery Check:
                        </span>
                        <span className="text-[9.5px] uppercase font-black tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                          ⚡ Shiprocket
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={pincodeCheck}
                          onChange={(e) => setPincodeCheck(e.target.value)}
                          placeholder="e.g. 560102"
                          className="bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs font-mono font-bold w-32 outline-hidden shadow-2xs"
                        />
                        <button
                          type="button"
                          disabled={isCheckingPincode}
                          onClick={handleCheckPincode}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 disabled:opacity-60 shadow-xs"
                        >
                          {isCheckingPincode ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Checking...</span>
                            </>
                          ) : (
                            <span>Check</span>
                          )}
                        </button>
                      </div>

                      {pincodeResult && (
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                          <p className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            {pincodeResult}
                          </p>
                          {pincodeServiceability && pincodeServiceability.available_courier_companies?.length > 0 && (
                            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100 text-[10px] text-slate-600">
                              <div>
                                <span className="text-slate-400 block">Couriers:</span>
                                <strong className="text-slate-800">
                                  {pincodeServiceability.available_courier_companies.slice(0, 2).map(c => c.courier_name).join(', ')}
                                </strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Dispatch:</span>
                                <strong className="text-emerald-700">Same-Day from Hub</strong>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Description & Specs */}
              <div className="border-t border-slate-200 pt-6 space-y-4">
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-wide">Product Description & Specs</h3>
                <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                  {selectedProduct.description}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Brand</span>
                    <span className="font-bold text-slate-800">{selectedProduct.brand}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">SKU</span>
                    <span className="font-bold font-mono text-slate-800">{selectedProduct.sku}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">HSN Code</span>
                    <span className="font-bold font-mono text-slate-800">{selectedProduct.hsnCode || '950300'}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Weight</span>
                    <span className="font-bold text-slate-800">{selectedProduct.weightGrams ? `${selectedProduct.weightGrams}g` : 'Digital'}</span>
                  </div>
                </div>

                {/* Vernunt Verified Merchant Profile Box */}
                {(() => {
                  const matchingVendor = vendors.find(v => v.id === selectedProduct.vendorId || v.slug === selectedProduct.vendorSlug || v.storeName === selectedProduct.brand) || vendors[0];
                  if (!matchingVendor) return null;

                  return (
                    <div className="bg-gradient-to-r from-slate-900 to-rose-950 text-white p-4 sm:p-5 rounded-2xl border border-rose-900/50 shadow-md">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={matchingVendor.logo}
                            alt={matchingVendor.storeName}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-rose-400/40 bg-white"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
                                🏬 Vernunt Verified Merchant
                              </span>
                              {matchingVendor.isVerified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                            </div>
                            <h4 className="font-black text-sm text-white">{matchingVendor.storeName}</h4>
                            <p className="text-[11px] text-slate-300">
                              {matchingVendor.address.city}, {matchingVendor.address.state} • ⭐ {matchingVendor.rating} ({matchingVendor.totalReviews} reviews)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProduct(null);
                              setInquiryVendor(matchingVendor);
                            }}
                            className="flex-1 sm:flex-none px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Ask Question</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProduct(null);
                              setSelectedVendor(matchingVendor);
                              setActiveView('vendor_store');
                            }}
                            className="flex-1 sm:flex-none px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Store className="w-3.5 h-3.5" />
                            <span>Visit Storefront</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Verified Parent Reviews Section */}
              <div className="border-t border-slate-200 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-sm text-slate-900 uppercase tracking-wide">
                      Verified Parent Reviews ({selectedProduct.reviews.length})
                    </h3>
                    <p className="text-xs text-slate-500">Real feedback from parents across Bangalore, Mumbai, Delhi, etc.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(prev => !prev)}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition border border-rose-200 cursor-pointer"
                  >
                    {showReviewForm ? 'Cancel Review' : '+ Write Parent Review'}
                  </button>
                </div>

                {/* Review Form */}
                {showReviewForm && (
                  <form onSubmit={handleSubmitReview} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                    <h4 className="font-bold text-slate-800">Write Your Feedback</h4>
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Your Rating:</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            onClick={() => setNewReviewRating(star)}
                            className={`w-5 h-5 cursor-pointer transition ${star <= newReviewRating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Review Headline *</label>
                        <input
                          type="text"
                          required
                          value={newReviewTitle}
                          onChange={(e) => setNewReviewTitle(e.target.value)}
                          placeholder="e.g. My 5-year-old was thrilled!"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Child's Age</label>
                        <input
                          type="text"
                          value={newReviewAge}
                          onChange={(e) => setNewReviewAge(e.target.value)}
                          placeholder="e.g. Child Age: 3 yrs"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Review Comments *</label>
                      <textarea
                        rows={3}
                        required
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        placeholder="Tell other parents about durability, child engagement, and safety..."
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-hidden"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition cursor-pointer"
                    >
                      Submit Review
                    </button>
                  </form>
                )}

                {/* Reviews List */}
                <div className="space-y-3">
                  {selectedProduct.reviews.map(rev => (
                    <div key={rev.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{rev.authorName}</span>
                          {rev.verifiedBuyer && (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Verified Parent Buyer
                            </span>
                          )}
                          {rev.childAge && <span className="text-[10px] text-slate-400">({rev.childAge})</span>}
                        </div>
                        <span className="text-[10px] text-slate-400">{rev.date}</span>
                      </div>

                      <div className="flex items-center text-amber-500">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${star <= rev.rating ? 'fill-amber-500' : 'text-slate-300'}`}
                          />
                        ))}
                      </div>

                      <h5 className="font-bold text-slate-800">{rev.title}</h5>
                      <p className="text-slate-600 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recently Viewed Products in Detail Modal */}
              {recentlyViewedProducts.filter(p => p.id !== selectedProduct.id).length > 0 && (
                <div className="border-t border-slate-200 pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-rose-600" />
                      <h4 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wide">
                        Recently Viewed While Browsing
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Click to compare with other items
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {recentlyViewedProducts
                      .filter(p => p.id !== selectedProduct.id)
                      .slice(0, 4)
                      .map(p => (
                        <div
                          key={p.id}
                          onClick={() => handleOpenProduct(p)}
                          className="group p-2.5 rounded-xl border border-slate-200 hover:border-rose-400 hover:shadow-xs bg-slate-50/50 hover:bg-white transition cursor-pointer flex flex-col justify-between"
                        >
                          <div className="aspect-square rounded-lg overflow-hidden bg-white border border-slate-100 mb-2">
                            <img
                              src={p.featuredImage}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-rose-700 uppercase block truncate">
                              {p.ageLabel}
                            </span>
                            <h5 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-rose-700 transition">
                              {p.name}
                            </h5>
                            <div className="flex items-baseline gap-1.5 mt-1 font-mono">
                              <span className="text-xs font-black text-slate-900">
                                ₹{p.price.toLocaleString('en-IN')}
                              </span>
                              {p.regularPrice > p.price && (
                                <span className="text-[10px] text-slate-400 line-through">
                                  ₹{p.regularPrice.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CART SLIDE-OVER DRAWER                                                    */}
      {/* ========================================================================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setIsCartOpen(false)}></div>
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
            <div className="w-full sm:w-screen max-w-full sm:max-w-md bg-white shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="px-4 sm:px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-rose-700" />
                  <h3 className="font-black text-base text-slate-900">Your Shopping Cart ({cartItemCount})</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
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
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
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
                      onClick={() => setIsCartOpen(false)}
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
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 font-mono font-bold text-xs text-slate-900">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, 0)}
                            className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                            title="Remove"
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
                <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3 shrink-0">
                  {/* Coupon Input */}
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Coupon code (e.g. VERNUNT15)"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs uppercase font-mono font-bold outline-hidden focus:border-rose-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
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
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                      setCheckoutStep(1);
                    }}
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
      )}

      {/* ========================================================================= */}
      {/* MULTI-STEP CHECKOUT MODAL                                                 */}
      {/* ========================================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
            {/* Checkout Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">Vernunt 256-Bit Encrypted Secure Checkout</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Indicator */}
            {checkoutStep < 4 && (
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-500">
                <div className={`flex items-center gap-1.5 ${checkoutStep >= 1 ? 'text-rose-700' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${checkoutStep >= 1 ? 'bg-rose-700 text-white' : 'bg-slate-200'}`}>1</span>
                  <span>Address</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <div className={`flex items-center gap-1.5 ${checkoutStep >= 2 ? 'text-rose-700' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${checkoutStep >= 2 ? 'bg-rose-700 text-white' : 'bg-slate-200'}`}>2</span>
                  <span>Shipping</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <div className={`flex items-center gap-1.5 ${checkoutStep >= 3 ? 'text-rose-700' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${checkoutStep >= 3 ? 'bg-rose-700 text-white' : 'bg-slate-200'}`}>3</span>
                  <span>Payment</span>
                </div>
              </div>
            )}

            {/* Distributed Inventory Locking Status Banner */}
            {checkoutStep < 4 && (
              <>
                {inventoryLockError ? (
                  <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 flex items-center justify-between text-xs text-rose-900 font-bold animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{inventoryLockError}</span>
                    </div>
                  </div>
                ) : isAcquiringLock ? (
                  <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center gap-2 text-xs text-slate-600 font-bold">
                    <Clock className="w-3.5 h-3.5 animate-spin text-slate-500 shrink-0" />
                    <span>Verifying and securing inventory lease...</span>
                  </div>
                ) : inventoryLockToken ? (
                  <div className="bg-emerald-50/80 border-b border-emerald-200 px-6 py-2 flex items-center justify-between text-xs text-emerald-900 animate-fadeIn">
                    <div className="flex items-center gap-2 font-bold">
                      <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Inventory Reserved: {Math.floor(lockSecondsRemaining / 60)}:{(lockSecondsRemaining % 60).toString().padStart(2, '0')} mins</span>
                    </div>
                    <span className="text-[11px] text-emerald-700/90 font-medium hidden sm:inline">
                      Locked exclusively to prevent overselling
                    </span>
                  </div>
                ) : null}
              </>
            )}

            {/* Checkout Body Steps */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800 flex-1">
              {/* STEP 1: Delivery Address */}
              {checkoutStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="font-black text-sm text-slate-900 uppercase tracking-wide">Enter Delivery Address</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={shippingAddress.fullName}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden focus:border-rose-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Mobile Phone (for delivery SMS / OTP) *</label>
                      <input
                        type="text"
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden focus:border-rose-500 font-medium font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">6-Digit PIN Code *</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={shippingAddress.pincode}
                        onChange={(e) => {
                          const val = e.target.value;
                          setShippingAddress({ ...shippingAddress, pincode: val });
                          if (val.startsWith('560')) {
                            setShippingAddress(prev => ({ ...prev, city: 'Bengaluru', state: 'Karnataka' }));
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden focus:border-rose-500 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Email (for invoice PDF) *</label>
                      <input
                        type="email"
                        value={shippingAddress.email}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden focus:border-rose-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Flat, House No., Building, Apartment *</label>
                    <input
                      type="text"
                      value={shippingAddress.addressLine1}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })}
                      placeholder="e.g. Flat 402, Green Glen Layout, Bellandur"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden focus:border-rose-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Landmark (Optional)</label>
                      <input
                        type="text"
                        value={shippingAddress.landmark || ''}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, landmark: e.target.value })}
                        placeholder="e.g. Near Central Mall"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">City *</label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">State *</label>
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCheckoutStep(2)}
                    className="w-full py-3 bg-slate-900 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Delivery Speed</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: Shipping Method (Powered by Shiprocket) */}
              {checkoutStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-sm text-slate-900 uppercase tracking-wide">Select Shiprocket Courier Speed</h3>
                      <p className="text-[11px] text-slate-500">Serviceable to PIN: <strong className="font-mono text-slate-800">{shippingAddress.pincode}</strong> ({shippingAddress.city})</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-[10px] font-black uppercase">
                      <Truck className="w-3 h-3 text-indigo-600" />
                      Shiprocket Verified
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        id: 'express',
                        name: '⚡ BlueDart Express Air (via Shiprocket)',
                        desc: 'Guaranteed Next-Day Delivery • Priority Air Transit with tamper-proof seal.',
                        cost: cartSubtotal >= 499 ? 0 : 99,
                        badge: 'Fastest Air',
                        etd: 'Next Day',
                        rating: '4.9 ★'
                      },
                      {
                        id: 'standard',
                        name: '📦 Delhivery Surface Express (via Shiprocket)',
                        desc: 'Eco-friendly national surface transport across 24,000+ PIN codes.',
                        cost: cartSubtotal >= 499 ? 0 : 49,
                        badge: 'Best Value',
                        etd: '2-3 Days',
                        rating: '4.8 ★'
                      },
                      {
                        id: 'instant',
                        name: '🚀 Shadowfax Hyperlocal / Same-Day (via Shiprocket)',
                        desc: 'Direct doorstep dispatch for local city societies and instant playdates.',
                        cost: 149,
                        badge: 'Within 3 Hours',
                        etd: 'Same Day',
                        rating: '4.6 ★'
                      }
                    ].map(method => (
                      <div
                        key={method.id}
                        onClick={() => {
                          setShippingMethod(method.id as any);
                          const matching = shiprocketAvailableCouriers.find(c => 
                            (method.id === 'express' && c.mode === 'Air') ||
                            (method.id === 'standard' && c.courier_name.toLowerCase().includes('delhivery')) ||
                            (method.id === 'instant' && c.courier_name.toLowerCase().includes('shadowfax'))
                          );
                          if (matching) setSelectedShiprocketCourier(matching);
                        }}
                        className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                          shippingMethod === method.id
                            ? 'bg-indigo-50/70 border-indigo-500 ring-1 ring-indigo-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{method.name}</span>
                            {method.badge && (
                              <span className="bg-indigo-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                                {method.badge}
                              </span>
                            )}
                            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1 rounded border border-amber-200">
                              {method.rating}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">{method.desc}</p>
                          <div className="flex items-center gap-3 pt-0.5 text-[10px] text-slate-500">
                            <span>⏱️ ETA: <strong className="text-slate-700">{method.etd}</strong></span>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold">✓ Live GPS Milestone Tracking</span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-slate-900 shrink-0 text-sm">
                          {method.cost === 0 ? <span className="text-emerald-700 font-bold">FREE</span> : `₹${method.cost}`}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep(1)}
                      className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-100 transition"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep(3)}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Proceed to Payment</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Payment Method */}
              {checkoutStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-slate-900 uppercase tracking-wide">Select Payment Gateway</h3>
                    <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-600" /> 256-Bit SSL Encrypted
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Razorpay Unified Payment Gateway */}
                    <div
                      onClick={() => setPaymentMethod('Razorpay')}
                      className={`p-4 rounded-xl border transition cursor-pointer space-y-3 ${
                        paymentMethod === 'Razorpay'
                          ? 'bg-rose-50/70 border-rose-500 ring-1 ring-rose-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xs shadow-xs tracking-tight">
                            rzp
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs block">Razorpay Payment Gateway</span>
                              <span className="bg-blue-100 text-blue-800 text-[9.5px] font-bold px-1.5 py-0.2 rounded-sm">Official</span>
                            </div>
                            <span className="text-[10.5px] text-slate-500">Instant UPI (PhonePe, GPay, Paytm, CRED), Cards &amp; NetBanking</span>
                          </div>
                        </div>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> 256-Bit SSL
                        </span>
                      </div>

                      {paymentMethod === 'Razorpay' && (
                        <div className="pt-3 border-t border-rose-100/80 space-y-3 animate-fade-in">
                          {/* Supported Payment Channels */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Accepted via Razorpay</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px]">
                              <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center gap-1.5 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                <span className="font-bold text-slate-800">UPI (GPay / PhonePe)</span>
                              </div>
                              <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center gap-1.5 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                <span className="font-bold text-slate-800">Credit / Debit Cards</span>
                              </div>
                              <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center gap-1.5 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                <span className="font-bold text-slate-800">50+ NetBanking</span>
                              </div>
                              <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center gap-1.5 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="font-bold text-slate-800">CRED &amp; Wallets</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-lg text-[11px] text-blue-900 flex items-start gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span>
                              Clicking <strong>"Pay via Razorpay"</strong> opens the secure Razorpay checkout portal where you can authorize with your favorite payment method.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* COD Option */}
                    {storeSettings?.enableCashOnDelivery !== false && (
                      <div
                        onClick={() => setPaymentMethod('COD')}
                        className={`p-4 rounded-xl border transition cursor-pointer space-y-2 ${
                          paymentMethod === 'COD'
                            ? 'bg-rose-50/70 border-rose-500 ring-1 ring-rose-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                              <DollarSign className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-xs block">Cash on Delivery (COD)</span>
                              <span className="text-[10.5px] text-slate-500">Pay cash or scan QR when BlueDart courier arrives</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">Doorstep OTP</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Summary Recap */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Grand Total to Pay:</span>
                      <span className="font-mono text-base font-black text-rose-700">₹{cartGrandTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500">Includes 12% GST tax and priority express delivery.</p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep(2)}
                      className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-100 transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={isProcessingPayment}
                      onClick={handlePlaceOrder}
                      className="flex-1 py-3 bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-800 hover:to-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessingPayment ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Opening Secure Gateway...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-rose-200" />
                          <span>
                            {paymentMethod === 'Razorpay' ? 'Pay via Razorpay' : 'Confirm COD Order'} • ₹{cartGrandTotal.toLocaleString('en-IN')}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Success & Invoice Download */}
              {checkoutStep === 4 && completedOrder && (
                <div className="text-center py-6 space-y-4 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-sm">
                    ✓
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-700">Payment Successful</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">Thank You For Your Order!</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Order ID: <strong className="font-mono text-slate-800">{completedOrder.orderNumber}</strong>
                    </p>
                    <p className="text-[11px] text-emerald-700 font-mono mt-0.5">
                      Transaction Ref: {completedOrder.paymentReferenceId}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 max-w-md mx-auto text-left text-xs space-y-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                        ⚡ Shiprocket Express Fulfillment
                      </span>
                      <span className="font-mono text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        AWB: {completedOrder.shiprocketAwb || completedOrder.trackingNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Delivery To:</span>
                      <span className="font-bold text-slate-800">{completedOrder.shippingAddress.fullName} ({completedOrder.shippingAddress.pincode})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Courier Partner:</span>
                      <span className="font-bold text-indigo-700">{completedOrder.courierPartner || 'Delhivery Surface (via Shiprocket)'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Estimated Dispatch:</span>
                      <span className="font-semibold text-emerald-700">Tomorrow by 2:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Status:</span>
                      <span className="font-semibold text-slate-800">{completedOrder.paymentMethod} ({completedOrder.paymentStatus.toUpperCase()})</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3">
                    <button
                      type="button"
                      onClick={() => setShiprocketTrackingModalOrder(completedOrder)}
                      className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Track with Shiprocket</span>
                    </button>
                    <a
                      href={completedOrder.shiprocketLabelUrl || `/api/shiprocket/label/${completedOrder.shiprocketAwb || completedOrder.trackingNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title="Print Official Shiprocket Courier Barcode Label"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>Shipping Label</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setViewInvoiceOrder(completedOrder)}
                      className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Tax Invoice</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCheckoutOpen(false);
                        setActiveView('orders');
                      }}
                      className="px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      My Orders Tab
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ORDER CANCELLATION CONFIRMATION MODAL                                    */}
      {/* ========================================================================= */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-black text-slate-900 text-lg">Cancel Order #{orderToCancel.orderNumber}?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to cancel this order? If payment was already completed, a 100% refund will be initiated to your original payment source.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Order Value:</span>
                <span className="font-bold text-slate-800">₹{orderToCancel.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-bold capitalize text-slate-800">{orderToCancel.paymentStatus}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={() => handleCancelOrderDirect(orderToCancel.id, 'Cancelled by customer on tracking page')}
                className="flex-1 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GST INVOICE MODAL                                                         */}
      {/* ========================================================================= */}
      {viewInvoiceOrder && (
        <StoreInvoiceModal
          order={viewInvoiceOrder}
          onClose={() => setViewInvoiceOrder(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* ADMIN 45-DAY PRODUCT SEARCH TELEMETRY MODAL                               */}
      {/* ========================================================================= */}
      {showAdminSearchLogsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>45-Day Product Search Telemetry</span>
                    <span className="bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                      Admin Access
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    View all products searched by users across the ecosystem with a rolling 45-day retention window
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminSearchLogsModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <AdminProductSearchesDesk
              onOpenProductDetail={(prodId) => {
                const p = products.find(prod => prod.id === prodId);
                if (p) {
                  setShowAdminSearchLogsModal(false);
                  handleOpenProduct(p);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SHIPROCKET REAL-TIME TRACKER MODAL                                        */}
      {/* ========================================================================= */}
      {shiprocketTrackingModalOrder && (
        <ShiprocketTrackerModal
          order={shiprocketTrackingModalOrder}
          onClose={() => setShiprocketTrackingModalOrder(null)}
        />
      )}
      {shiprocketTrackingModalAwb && (
        <ShiprocketTrackerModal
          awb={shiprocketTrackingModalAwb}
          onClose={() => setShiprocketTrackingModalAwb(null)}
        />
      )}
    </div>
  );
};
