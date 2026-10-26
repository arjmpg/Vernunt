import React, { useState, useMemo, useEffect } from 'react';
import {
  Store, Package, ShoppingCart, DollarSign, Tag, MessageSquare, Settings,
  Plus, Search, Filter, CheckCircle2, AlertCircle, Clock, Truck, Download,
  Eye, Edit, Trash2, ShieldCheck, ArrowUpRight, ArrowLeft, Users, Building,
  CreditCard, Sparkles, X, Check, Bell, Printer, Share2, AlertTriangle, ChevronRight,
  MapPin, Sliders, BarChart2, Layers, HelpCircle, FileText, CheckSquare, Square,
  RotateCcw, Send, CheckCircle, Smartphone, Info, Compass, Shield, Copy
} from 'lucide-react';
import { VendorProfile, VendorWithdrawal, VendorInquiry, VendorAnnouncement, VendorDashboardStats } from '../../types/vendor.ts';
import { StoreOrder, StoreProduct, StoreCoupon, StoreSettings, StoreCategory } from '../../types/store.ts';
import { 
  getStoredVendors, saveStoredVendors, 
  getStoredWithdrawals, saveStoredWithdrawals, 
  INITIAL_INQUIRIES, INITIAL_ANNOUNCEMENTS, 
  getStoredStoreSettings, saveStoredStoreSettings 
} from '../../data/storeVendors.ts';
import { getStoredProducts, saveStoredProducts, getStoredOrders, saveStoredOrders, STORE_CATEGORIES } from '../../data/storeProducts.ts';
import { REGIONAL_PINCODE_PRESETS, cleanPincode, checkProductDeliverability, getEstimatedDeliveryDate } from '../../utils/pincodeChecker.ts';
import { MarketplaceApiClient } from '../../services/marketplaceApiClient.ts';
import { ShiprocketShippingDesk } from './ShiprocketShippingDesk.tsx';
import ServiceLevelAgreementModal from '../legal/ServiceLevelAgreementModal.tsx';
import { PortalAuthModal } from '../auth/PortalAuthModal.tsx';

export type VendorTabKey = 
  | 'overview'
  | 'profile'
  | 'products'
  | 'add_product'
  | 'categories'
  | 'pincodes'
  | 'bulk_pincodes'
  | 'shipping_charges'
  | 'incoming_orders'
  | 'order_processing'
  | 'shipping_tracking'
  | 'inventory'
  | 'sales_reports'
  | 'earnings'
  | 'inquiries'
  | 'store_settings'
  | 'notifications'
  | 'help_support';

interface VendorDashboardProps {
  userProfile?: any;
  currentUserProfile?: any;
  onBackToStore?: () => void;
  onOpenStorefront?: (vendor: VendorProfile) => void;
  onNavigateHome?: () => void;
  onOpenHelpSop?: () => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({
  userProfile,
  currentUserProfile,
  onBackToStore,
  onOpenStorefront,
  onNavigateHome,
  onOpenHelpSop
}) => {
  // Master Vendors State
  const [vendors, setVendors] = useState<VendorProfile[]>(getStoredVendors);

  // Check for authenticated vendor session from localStorage or props
  const [vendorSession, setVendorSession] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('vernunt_auth_vendor_session');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    const propUser = userProfile || currentUserProfile;
    if (propUser && (propUser.userRole === 'Vendor' || (propUser as any).isVendor)) return propUser;
    return null;
  });

  const [showPortalAuthModal, setShowPortalAuthModal] = useState<boolean>(false);

  // Current active vendor - strictly bound to the authenticated vendor
  const currentVendor = useMemo<VendorProfile | null>(() => {
    if (!vendorSession) return null;
    const sessionPhone = vendorSession.phoneNumber ? vendorSession.phoneNumber.replace(/[^\d]/g, '').slice(-10) : '';
    const sessionEmail = vendorSession.email?.toLowerCase().trim();
    const sessionId = vendorSession.id || vendorSession.vendorId;

    // Check if matched existing registered vendor
    const found = vendors.find(v => 
      v.id === sessionId || 
      (v as any).userId === sessionId ||
      (v.phone && v.phone.replace(/[^\d]/g, '').slice(-10) === sessionPhone) ||
      (sessionEmail && v.email && v.email.toLowerCase().trim() === sessionEmail)
    );
    if (found) return found;

    // Construct a dedicated isolated vendor profile for this authenticated vendor
    const storeTitle = vendorSession.companyName || vendorSession.parentName || 'My Vernunt Store';
    return {
      id: sessionId || `vend_${sessionPhone || Date.now()}`,
      storeName: storeTitle,
      ownerName: vendorSession.parentName || 'Verified Seller',
      slug: storeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      email: vendorSession.email || `${sessionPhone || 'seller'}@vernunt.com`,
      phone: vendorSession.phoneNumber || '+91 98765 43210',
      status: 'active',
      kycVerified: true,
      rating: 5.0,
      reviewCount: 0,
      totalSales: 0,
      balance: 0,
      walletBalance: 0,
      commissionRate: 8,
      defaultShippingFee: 49,
      freeShippingThreshold: 499,
      expressShippingFee: 89,
      serviceablePincodes: ['560001', '560100', '560102'],
      badge: 'Vernunt Verified Seller',
      bankDetails: {
        accountHolder: vendorSession.companyName || vendorSession.parentName || 'Verified Seller',
        bankName: 'HDFC Bank',
        accountNumber: 'XXXXXX' + (sessionPhone ? sessionPhone.slice(-4) : '1234'),
        ifscCode: 'HDFC0001234',
        upiId: (sessionPhone ? `${sessionPhone}@okhdfcbank` : 'seller@upi')
      }
    };
  }, [vendors, vendorSession]);

  // Master Products, Orders & Settings
  const [products, setProducts] = useState<StoreProduct[]>(getStoredProducts);
  const [orders, setOrders] = useState<StoreOrder[]>(getStoredOrders);
  const [withdrawals, setWithdrawals] = useState<VendorWithdrawal[]>(getStoredWithdrawals);
  const [inquiries, setInquiries] = useState<VendorInquiry[]>(INITIAL_INQUIRIES);
  const [announcements, setAnnouncements] = useState<VendorAnnouncement[]>(INITIAL_ANNOUNCEMENTS);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(getStoredStoreSettings);

  // Active Tab (1 of 18 sections)
  const [activeTab, setActiveTab] = useState<VendorTabKey>('overview');

  // Modals & UI Controls
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedPackingSlipOrder, setSelectedPackingSlipOrder] = useState<StoreOrder | null>(null);
  const [showSlaModal, setShowSlaModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filters
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStockFilter, setProductStockFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [pincodeLookupTest, setPincodeLookupTest] = useState('');

  // Bulk Pincode Assignment Form State
  const [bulkSelectedProductIds, setBulkSelectedProductIds] = useState<string[]>([]);
  const [bulkSelectAll, setBulkSelectAll] = useState(true);
  const [bulkPincodesInput, setBulkPincodesInput] = useState('');
  const [bulkCustomShippingFee, setBulkCustomShippingFee] = useState<string>('');
  const [bulkActionMode, setBulkActionMode] = useState<'add' | 'replace'>('add');

  // New Product Form State
  const [newProductForm, setNewProductForm] = useState<Partial<StoreProduct>>({
    name: '',
    shortDescription: '',
    description: '',
    category: 'Montessori & STEM',
    subcategory: 'Sensory Wooden Toys',
    price: 999,
    regularPrice: 1299,
    salePrice: 999,
    stockQuantity: 25,
    manageStock: true,
    lowStockThreshold: 5,
    sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
    ageGroup: '3-6y',
    ageLabel: 'Ages 3-6 Years',
    featuredImage: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
    galleryImages: [],
    weightGrams: 500,
    dimensionsCm: { length: 20, width: 15, height: 10 },
    hsnCode: '950300',
    gstRate: 12,
    brand: '',
    isAllIndiaDelivery: false,
    serviceablePincodes: ['560001', '560100', '560102', '411038', '400001', '110001'],
    defaultShippingFee: 49,
    badges: ['100% Non-Toxic', 'BIS Certified']
  });

  // Shipping Configuration State for Current Vendor
  const [shippingConfig, setShippingConfig] = useState({
    defaultShippingFee: currentVendor?.defaultShippingFee || 49,
    freeShippingThreshold: currentVendor?.freeShippingThreshold || 499,
    expressShippingFee: currentVendor?.expressShippingFee || 89,
    newRulePincode: '',
    newRuleFee: 39,
    newRuleDays: 2,
    newRuleLabel: ''
  });

  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState<number>(1000);
  const [withdrawMethod, setWithdrawMethod] = useState<'UPI' | 'Bank Transfer' | 'Paytm'>('UPI');
  const [withdrawNotes, setWithdrawNotes] = useState<string>('');

  // Seller Registration Form State
  const [regForm, setRegForm] = useState({
    storeName: '',
    ownerName: '',
    contactPerson: '',
    email: '',
    phone: '',
    businessType: 'Proprietorship',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    street: '',
    pickupStreet: '',
    pickupCity: 'Bengaluru',
    pickupState: 'Karnataka',
    pickupPincode: '560001',
    gstNumber: '',
    panNumber: '',
    primaryPincodes: '560001, 560034, 560100, 560102, 400001, 110001',
    bankName: 'HDFC Bank',
    accountHolder: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    bio: '',
    slaAccepted: false
  });

  // Helper toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync state on vendor switch
  useEffect(() => {
    if (currentVendor) {
      setShippingConfig({
        defaultShippingFee: currentVendor.defaultShippingFee || 49,
        freeShippingThreshold: currentVendor.freeShippingThreshold || 499,
        expressShippingFee: currentVendor.expressShippingFee || 89,
        newRulePincode: '',
        newRuleFee: 39,
        newRuleDays: 2,
        newRuleLabel: ''
      });
    }
  }, [currentVendor]);

  // Filtered Products for Current Vendor - ONLY products added by THIS vendor!
  const vendorProducts = useMemo(() => {
    if (!vendorSession || !currentVendor) return [];
    return products.filter(p => {
      if (p.vendorId && p.vendorId === currentVendor.id) return true;
      if ((p as any).createdByUserId && (p as any).createdByUserId === currentVendor.id) return true;
      if ((p as any).vendorUserId && (p as any).vendorUserId === vendorSession.id) return true;
      if (p.vendorSlug && currentVendor.slug && p.vendorSlug === currentVendor.slug) return true;
      return false;
    });
  }, [products, currentVendor, vendorSession]);

  // Filtered Orders for Current Vendor - ONLY orders containing THIS vendor's items!
  const vendorOrders = useMemo(() => {
    if (!vendorSession || !currentVendor) return [];
    return orders
      .filter(ord =>
        ord.items.some(item => 
          item.vendorId === currentVendor.id || 
          item.product?.vendorId === currentVendor.id
        )
      )
      .map(ord => ({
        ...ord,
        // Strip items belonging to other vendors!
        items: ord.items.filter(it => it.vendorId === currentVendor.id || it.product?.vendorId === currentVendor.id)
      }));
  }, [orders, currentVendor, vendorSession]);

  // Filtered Withdrawals
  const vendorWithdrawals = useMemo(() => {
    if (!currentVendor) return [];
    return withdrawals.filter(w => w.vendorId === currentVendor.id);
  }, [withdrawals, currentVendor]);

  // Filtered Customer Inquiries
  const vendorInquiries = useMemo(() => {
    if (!currentVendor) return [];
    return inquiries.filter(i => i.vendorId === currentVendor.id);
  }, [inquiries, currentVendor]);

  // 14 REQUIRED KPI METRICS COMPUTATION
  const kpiStats = useMemo(() => {
    const totalProducts = vendorProducts.length;
    const activeProducts = vendorProducts.filter(p => p.approvalStatus === 'approved' && p.stockStatus !== 'outofstock').length;
    const pendingProducts = vendorProducts.filter(p => p.approvalStatus === 'pending' || p.approvalStatus === 'draft').length;
    
    const totalOrders = vendorOrders.length;
    const newOrders = vendorOrders.filter(o => o.orderStatus === 'pending').length;
    const awaitingShipmentOrders = vendorOrders.filter(o => o.orderStatus === 'processing' || o.orderStatus === 'packed').length;
    const shippedOrders = vendorOrders.filter(o => o.orderStatus === 'shipped' || o.orderStatus === 'out_for_delivery').length;
    const deliveredOrders = vendorOrders.filter(o => o.orderStatus === 'delivered').length;
    const cancelledOrders = vendorOrders.filter(o => o.orderStatus === 'cancelled' || o.orderStatus === 'refunded').length;

    let totalSales = 0;
    let shippingChargesCollected = 0;

    vendorOrders.forEach(o => {
      if (o.orderStatus !== 'cancelled' && o.orderStatus !== 'refunded') {
        o.items.forEach(it => {
          if (it.vendorId === currentVendor?.id || it.product?.vendorId === currentVendor?.id || it.product?.brand === currentVendor?.storeName) {
            totalSales += (it.totalPrice || (it.unitPrice * it.quantity));
          }
        });
        shippingChargesCollected += (o.shippingFee || 0);
      }
    });

    const availableInventory = vendorProducts.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);

    const coveredPincodesSet = new Set<string>(currentVendor?.serviceablePincodes || []);
    vendorProducts.forEach(p => {
      p.serviceablePincodes?.forEach(pin => coveredPincodesSet.add(pin));
    });

    return {
      totalProducts,
      activeProducts,
      pendingProducts,
      totalOrders,
      newOrders,
      awaitingShipmentOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalSales: totalSales || currentVendor?.totalSales || 0,
      shippingChargesCollected,
      availableInventory,
      pincodeCoverageCount: coveredPincodesSet.size,
      coveredPincodesList: Array.from(coveredPincodesSet)
    };
  }, [vendorProducts, vendorOrders, currentVendor]);

  // Best-selling products
  const bestSellingProducts = useMemo(() => {
    const map: Record<string, { product: StoreProduct; units: number; revenue: number }> = {};
    vendorProducts.forEach(p => {
      map[p.id] = { product: p, units: 0, revenue: 0 };
    });

    vendorOrders.forEach(o => {
      o.items.forEach(it => {
        const pid = it.productId || it.product?.id;
        if (pid && map[pid]) {
          map[pid].units += it.quantity || 1;
          map[pid].revenue += (it.totalPrice || (it.unitPrice * it.quantity));
        }
      });
    });

    return Object.values(map).sort((a, b) => b.units - a.units).slice(0, 5);
  }, [vendorProducts, vendorOrders]);

  // Pincode test lookup results
  const pincodeTestResults = useMemo(() => {
    if (!pincodeLookupTest || pincodeLookupTest.trim().length !== 6) return null;
    const clean = cleanPincode(pincodeLookupTest);
    return vendorProducts.map(p => ({
      product: p,
      check: checkProductDeliverability(p, clean, currentVendor)
    }));
  }, [pincodeLookupTest, vendorProducts, currentVendor]);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  // Handle Add Product Submission
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.price) {
      alert('Please fill in product name and price.');
      return;
    }

    const newProd: StoreProduct = {
      id: 'prod-' + Date.now(),
      name: newProductForm.name,
      slug: newProductForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      shortDescription: newProductForm.shortDescription || 'Child-safe certified developmental play gear.',
      description: newProductForm.description || newProductForm.shortDescription || 'Crafted with certified non-toxic child-safe materials.',
      price: Number(newProductForm.price),
      regularPrice: Number(newProductForm.regularPrice || newProductForm.price),
      salePrice: newProductForm.salePrice ? Number(newProductForm.salePrice) : undefined,
      onSale: Number(newProductForm.regularPrice || 0) > Number(newProductForm.price),
      discountPercentage: Math.max(0, Math.round(((Number(newProductForm.regularPrice || newProductForm.price) - Number(newProductForm.price)) / Number(newProductForm.regularPrice || newProductForm.price)) * 100)),
      sku: newProductForm.sku || ('SKU-' + Math.floor(1000 + Math.random() * 9000)),
      stockQuantity: Number(newProductForm.stockQuantity || 20),
      stockStatus: Number(newProductForm.stockQuantity || 20) > 0 ? 'instock' : 'outofstock',
      manageStock: newProductForm.manageStock !== false,
      lowStockThreshold: Number(newProductForm.lowStockThreshold || 5),
      category: newProductForm.category || 'Montessori & STEM',
      subcategory: newProductForm.subcategory,
      ageGroup: newProductForm.ageGroup || '3-6y',
      ageLabel: newProductForm.ageLabel || 'Ages 3-6 Years',
      featuredImage: newProductForm.featuredImage || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
      galleryImages: newProductForm.galleryImages?.length ? newProductForm.galleryImages : [newProductForm.featuredImage || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80'],
      tags: ['Multi-Vendor', newProductForm.category || 'Kids Gear', 'Certified Safe'],
      attributes: [],
      variations: [],
      rating: 5.0,
      reviewCount: 0,
      reviews: [],
      qaList: [],
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      isDigital: false,
      weightGrams: Number(newProductForm.weightGrams || 500),
      dimensionsCm: newProductForm.dimensionsCm || { length: 20, width: 15, height: 10 },
      badges: newProductForm.badges || ['100% Non-Toxic', 'BIS Certified'],
      hsnCode: newProductForm.hsnCode || '950300',
      gstRate: Number(newProductForm.gstRate || 12),
      brand: currentVendor?.storeName || 'Vernunt Certified',
      deliveryDaysEstimate: 3,
      vendorId: currentVendor?.id,
      vendorName: currentVendor?.storeName,
      vendorSlug: currentVendor?.slug,
      approvalStatus: storeSettings.autoApproveVendorProducts ? 'approved' : 'pending',
      isActive: true,
      isAllIndiaDelivery: !!newProductForm.isAllIndiaDelivery,
      serviceablePincodes: newProductForm.serviceablePincodes || currentVendor?.serviceablePincodes || [],
      pincodeShippingRates: {},
      defaultShippingFee: newProductForm.defaultShippingFee || currentVendor?.defaultShippingFee || 49
    };

    const updated = [newProd, ...products];
    setProducts(updated);
    saveStoredProducts(updated);
    showToast(`Product "${newProd.name}" created successfully! ${storeSettings.autoApproveVendorProducts ? 'Live on marketplace.' : 'Submitted for Admin moderation.'}`);
    setActiveTab('products');
  };

  // Handle Edit Product Save
  const handleSaveEditedProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !currentVendor) return;

    if (editingProduct.vendorId !== currentVendor.id && (editingProduct as any).createdByUserId !== currentVendor.id) {
      alert('Security policy violation: You can only edit products added by your vendor account.');
      return;
    }

    const updated = products.map(p => p.id === editingProduct.id ? editingProduct : p);
    setProducts(updated);
    saveStoredProducts(updated);
    setIsEditProductModalOpen(false);
    setEditingProduct(null);
    showToast(`Product "${editingProduct.name}" updated successfully.`);
  };

  // Handle Toggle Product Active/Draft
  const handleToggleProductStatus = (productId: string) => {
    if (!currentVendor) return;
    const target = products.find(p => p.id === productId);
    if (!target) return;
    if (target.vendorId !== currentVendor.id && (target as any).createdByUserId !== currentVendor.id) {
      alert('Security policy violation: You can only change status for products added by your vendor account.');
      return;
    }
    const updated = products.map(p => {
      if (p.id === productId) {
        const nextStatus = p.approvalStatus === 'approved' ? 'draft' : 'approved';
        return { ...p, approvalStatus: nextStatus as any, isActive: nextStatus === 'approved' };
      }
      return p;
    });
    setProducts(updated);
    saveStoredProducts(updated);
    showToast('Product status updated.');
  };

  // Handle Delete Product
  const handleDeleteProduct = (productId: string, productName: string) => {
    if (!currentVendor) return;
    const target = products.find(p => p.id === productId);
    if (!target) return;
    if (target.vendorId !== currentVendor.id && (target as any).createdByUserId !== currentVendor.id) {
      alert('Security policy violation: You can only delete products added by your vendor account.');
      return;
    }
    if (!confirm(`Are you sure you want to remove "${productName}" from your store catalog?`)) return;
    const updated = products.filter(p => p.id !== productId);
    setProducts(updated);
    saveStoredProducts(updated);
    showToast(`Product "${productName}" removed.`);
  };

  // Handle Quick Stock Update
  const handleUpdateStock = (productId: string, delta: number) => {
    const updated = products.map(p => {
      if (p.id === productId) {
        const nextQty = Math.max(0, (p.stockQuantity || 0) + delta);
        return {
          ...p,
          stockQuantity: nextQty,
          stockStatus: (nextQty > 0 ? 'instock' : 'outofstock') as any
        };
      }
      return p;
    });
    setProducts(updated);
    saveStoredProducts(updated);
  };

  // Handle Apply Bulk Pincodes
  const handleApplyBulkPincodes = () => {
    const pins = bulkPincodesInput
      .split(/[\s,\n]+/)
      .map(cleanPincode)
      .filter(p => p.length === 6);

    if (pins.length === 0) {
      alert('Please enter at least one valid 6-digit Indian PIN code or select a regional preset.');
      return;
    }

    const targetProds = bulkSelectAll 
      ? vendorProducts 
      : vendorProducts.filter(p => bulkSelectedProductIds.includes(p.id));

    if (targetProds.length === 0) {
      alert('Please select at least one product.');
      return;
    }

    const customFee = bulkCustomShippingFee.trim() !== '' ? Number(bulkCustomShippingFee) : undefined;

    const updated = products.map(p => {
      const isTarget = targetProds.some(tp => tp.id === p.id);
      if (!isTarget) return p;

      let nextPins: string[] = [];
      if (bulkActionMode === 'replace') {
        nextPins = Array.from(new Set(pins));
      } else {
        nextPins = Array.from(new Set([...(p.serviceablePincodes || []), ...pins]));
      }

      const nextRates = { ...(p.pincodeShippingRates || {}) };
      if (customFee !== undefined) {
        pins.forEach(pin => { nextRates[pin] = customFee; });
      }

      return {
        ...p,
        serviceablePincodes: nextPins,
        pincodeShippingRates: nextRates,
        isAllIndiaDelivery: false
      };
    });

    setProducts(updated);
    saveStoredProducts(updated);

    // Also update current vendor master serviceable pincodes
    if (currentVendor) {
      const mergedVendorPins = Array.from(new Set([...(currentVendor.serviceablePincodes || []), ...pins]));
      const updatedVendors = vendors.map(v => v.id === currentVendor.id ? { ...v, serviceablePincodes: mergedVendorPins } : v);
      setVendors(updatedVendors);
      saveStoredVendors(updatedVendors);
    }

    showToast(`⚡ Successfully assigned ${pins.length} pincodes to ${targetProds.length} products!`);
    setBulkPincodesInput('');
    setBulkCustomShippingFee('');
  };

  // Handle Preset Pincode Click
  const handleSelectPincodePreset = (presetKey: keyof typeof REGIONAL_PINCODE_PRESETS) => {
    const presetList = REGIONAL_PINCODE_PRESETS[presetKey];
    const existing = bulkPincodesInput.split(/[\s,\n]+/).map(cleanPincode).filter(p => p.length === 6);
    const combined = Array.from(new Set([...existing, ...presetList]));
    setBulkPincodesInput(combined.join(', '));
  };

  // Handle Save Shipping Configuration
  const handleSaveShippingConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVendor) return;

    const updatedVendors = vendors.map(v => {
      if (v.id === currentVendor.id) {
        return {
          ...v,
          defaultShippingFee: Number(shippingConfig.defaultShippingFee),
          freeShippingThreshold: Number(shippingConfig.freeShippingThreshold),
          expressShippingFee: Number(shippingConfig.expressShippingFee)
        };
      }
      return v;
    });

    setVendors(updatedVendors);
    saveStoredVendors(updatedVendors);
    showToast('Shipping charges & free delivery thresholds updated successfully.');
  };

  // Handle Add Custom Pincode Shipping Rule
  const handleAddCustomShippingRule = () => {
    const pin = cleanPincode(shippingConfig.newRulePincode);
    if (pin.length !== 6) {
      alert('Please enter a valid 6-digit PIN code.');
      return;
    }

    if (!currentVendor) return;

    const nextOverrides = {
      ...(currentVendor.pincodeShippingOverrides || {}),
      [pin]: Number(shippingConfig.newRuleFee)
    };

    const nextRules = [
      ...(currentVendor.shippingRules || []),
      {
        id: 'rule-' + Date.now(),
        label: shippingConfig.newRuleLabel || `PIN ${pin} Custom Rate`,
        pincodes: [pin],
        shippingFee: Number(shippingConfig.newRuleFee),
        deliveryDays: Number(shippingConfig.newRuleDays)
      }
    ];

    const updatedVendors = vendors.map(v => {
      if (v.id === currentVendor.id) {
        return {
          ...v,
          pincodeShippingOverrides: nextOverrides,
          shippingRules: nextRules
        };
      }
      return v;
    });

    setVendors(updatedVendors);
    saveStoredVendors(updatedVendors);
    setShippingConfig({
      ...shippingConfig,
      newRulePincode: '',
      newRuleLabel: ''
    });
    showToast(`Added custom rate of ₹${shippingConfig.newRuleFee} for PIN ${pin}.`);
  };

  // Handle Remove Custom Shipping Rule
  const handleRemoveShippingRule = (ruleId: string, pincode?: string) => {
    if (!currentVendor) return;
    const nextRules = (currentVendor.shippingRules || []).filter(r => r.id !== ruleId);
    const nextOverrides = { ...(currentVendor.pincodeShippingOverrides || {}) };
    if (pincode) delete nextOverrides[pincode];

    const updatedVendors = vendors.map(v => {
      if (v.id === currentVendor.id) {
        return { ...v, shippingRules: nextRules, pincodeShippingOverrides: nextOverrides };
      }
      return v;
    });

    setVendors(updatedVendors);
    saveStoredVendors(updatedVendors);
    showToast('Custom shipping rule removed.');
  };

  // Handle Order Status Update
  const handleUpdateOrderStatus = (orderId: string, nextStatus: any, courierPartner?: string, awb?: string) => {
    MarketplaceApiClient.updateOrderStatus({
      orderId,
      status: nextStatus,
      courierPartner,
      trackingNumber: awb,
      vendorId: currentVendor?.id
    });

    const updated = orders.map(ord => {
      if (ord.id === orderId) {
        return {
          ...ord,
          orderStatus: nextStatus,
          courierPartner: courierPartner || ord.courierPartner,
          trackingNumber: awb || ord.trackingNumber,
          statusHistory: [
            ...ord.statusHistory,
            {
              status: nextStatus,
              timestamp: new Date().toLocaleString('en-IN'),
              note: `Order status updated to ${nextStatus} by ${currentVendor?.storeName}. Courier: ${courierPartner || ord.courierPartner || 'N/A'}`
            }
          ]
        };
      }
      return ord;
    });
    setOrders(updated);
    saveStoredOrders(updated);
    showToast(`Order #${orderId} moved to ${nextStatus}. Customer notified.`);
  };

  // Handle Request Withdrawal
  const handleRequestWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVendor || withdrawAmount <= 0) return;

    if (withdrawAmount > currentVendor.balance) {
      alert(`Requested amount (₹${withdrawAmount}) exceeds your balance (₹${currentVendor.balance}).`);
      return;
    }

    if (withdrawAmount < storeSettings.minWithdrawalAmount) {
      alert(`Minimum withdrawal threshold is ₹${storeSettings.minWithdrawalAmount}.`);
      return;
    }

    const payoutDetails = withdrawMethod === 'UPI'
      ? `UPI: ${currentVendor.bankDetails.upiId || 'seller@upi'}`
      : `${currentVendor.bankDetails.bankName || 'HDFC Bank'} A/C: ${currentVendor.bankDetails.accountNumber} (IFSC: ${currentVendor.bankDetails.ifscCode})`;

    const newWithdrawal: VendorWithdrawal = {
      id: 'wdr-' + Date.now(),
      withdrawalNumber: 'WDR-' + Math.floor(1000 + Math.random() * 9000),
      vendorId: currentVendor.id,
      vendorName: currentVendor.storeName,
      amount: withdrawAmount,
      payoutMethod: withdrawMethod,
      payoutDetails,
      status: 'pending',
      requestedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      adminNotes: withdrawNotes || 'Pending Admin 1-Click Payout Release'
    };

    const updatedWithdrawals = [newWithdrawal, ...withdrawals];
    setWithdrawals(updatedWithdrawals);
    saveStoredWithdrawals(updatedWithdrawals);

    // Deduct balance
    const updatedVendors = vendors.map(v => {
      if (v.id === currentVendor.id) {
        return { ...v, balance: Math.max(0, v.balance - withdrawAmount) };
      }
      return v;
    });
    setVendors(updatedVendors);
    saveStoredVendors(updatedVendors);

    setIsWithdrawalModalOpen(false);
    showToast(`Payout request of ₹${withdrawAmount.toLocaleString('en-IN')} submitted successfully!`);
  };

  // Handle Seller Registration
  const handleRegisterSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.storeName || !regForm.email) {
      alert('Please provide store name and email.');
      return;
    }

    if (!regForm.slaAccepted) {
      alert('Please review and accept the B2B Marketplace Service Level Agreement (SLA).');
      return;
    }

    const parsedPrimaryPins = regForm.primaryPincodes
      .split(/[\s,\n]+/)
      .map(cleanPincode)
      .filter(p => p.length === 6);

    const result = await MarketplaceApiClient.registerVendor({
      storeName: regForm.storeName,
      ownerName: regForm.ownerName || regForm.contactPerson || 'Store Owner',
      contactPerson: regForm.contactPerson || regForm.ownerName,
      email: regForm.email,
      phone: regForm.phone,
      businessType: regForm.businessType as any,
      address: {
        street: regForm.street,
        city: regForm.city,
        state: regForm.state,
        pincode: regForm.pincode,
        country: 'India'
      },
      pickupAddress: {
        street: regForm.pickupStreet || regForm.street,
        city: regForm.pickupCity || regForm.city,
        state: regForm.pickupState || regForm.state,
        pincode: regForm.pickupPincode || regForm.pincode,
        country: 'India'
      },
      gstNumber: regForm.gstNumber,
      panNumber: regForm.panNumber,
      primaryServiceablePincodes: parsedPrimaryPins,
      serviceablePincodes: parsedPrimaryPins,
      bankDetails: {
        accountHolder: regForm.accountHolder || regForm.storeName,
        bankName: regForm.bankName,
        accountNumber: regForm.accountNumber,
        ifscCode: regForm.ifscCode,
        upiId: regForm.upiId
      },
      bio: regForm.bio || `${regForm.storeName} specialized child products on Vernunt Marketplace.`,
      slaAccepted: true,
      slaAcceptedAt: new Date().toISOString()
    });

    if (result.success && result.vendor) {
      setVendors(getStoredVendors());
      setActiveVendorId(result.vendor.id);
      setIsRegisterModalOpen(false);
      showToast(`Congratulations! "${result.vendor.storeName}" has been registered.`);
    } else {
      alert(result.error || 'Registration failed');
    }
  };

  // Handle Vendor Profile Update
  const handleSaveVendorProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVendor) return;

    saveStoredVendors(vendors);
    showToast('Store profile & verification details updated successfully.');
  };

  // Handle Reply to Inquiry
  const handleReplyInquiry = (inquiryId: string, replyText: string) => {
    const updated = inquiries.map(inq => {
      if (inq.id === inquiryId) {
        return {
          ...inq,
          status: 'replied' as const,
          reply: replyText,
          repliedAt: new Date().toLocaleString('en-IN')
        };
      }
      return inq;
    });
    setInquiries(updated);
    showToast('Reply dispatched to customer! 📩');
  };

  // NAVIGATION TABS DEFINITIONS (18 ITEMS)
  const NAV_ITEMS: { id: VendorTabKey; label: string; icon: any; count?: number; group: string }[] = [
    // Group 1: Core
    { id: 'overview', label: 'Dashboard Overview', icon: DollarSign, group: 'Core' },
    { id: 'profile', label: 'Vendor Profile & KYC', icon: Building, group: 'Core' },
    
    // Group 2: Catalog
    { id: 'products', label: 'Product Management', icon: Package, count: vendorProducts.length, group: 'Catalog & Inventory' },
    { id: 'add_product', label: 'Add New Product', icon: Plus, group: 'Catalog & Inventory' },
    { id: 'categories', label: 'Product Categories', icon: Layers, group: 'Catalog & Inventory' },
    { id: 'inventory', label: 'Inventory Management', icon: CheckSquare, group: 'Catalog & Inventory' },

    // Group 3: Pincodes & Logistics
    { id: 'pincodes', label: 'Pincode & Delivery', icon: MapPin, count: kpiStats.pincodeCoverageCount, group: 'Logistics & Coverage' },
    { id: 'bulk_pincodes', label: 'Bulk Pincode Assignment', icon: Sparkles, group: 'Logistics & Coverage' },
    { id: 'shipping_charges', label: 'Shipping Charges & Rules', icon: Sliders, group: 'Logistics & Coverage' },
    { id: 'shipping_tracking', label: 'Shipping & Tracking (AWB)', icon: Truck, group: 'Logistics & Coverage' },

    // Group 4: Orders
    { id: 'incoming_orders', label: 'Incoming Orders', icon: Bell, count: kpiStats.newOrders, group: 'Orders & Fulfillment' },
    { id: 'order_processing', label: 'Order Processing & Slips', icon: ShoppingCart, count: kpiStats.awaitingShipmentOrders, group: 'Orders & Fulfillment' },

    // Group 5: Finance & Reports
    { id: 'sales_reports', label: 'Sales Reports & Analytics', icon: BarChart2, group: 'Finance & Analytics' },
    { id: 'earnings', label: 'Earnings & Withdrawals', icon: CreditCard, group: 'Finance & Analytics' },

    // Group 6: Support & Settings
    { id: 'inquiries', label: 'Customer Enquiries', icon: MessageSquare, count: vendorInquiries.length, group: 'Store & Support' },
    { id: 'store_settings', label: 'Store Settings', icon: Settings, group: 'Store & Support' },
    { id: 'notifications', label: 'Notifications & Alerts', icon: Info, count: announcements.length, group: 'Store & Support' },
    { id: 'help_support', label: 'Help & Seller Support', icon: HelpCircle, group: 'Store & Support' }
  ];

  // ---------------------------------------------------------------------------
  // SECURITY GATE: RESTRICT ACCESS TO AUTHENTICATED SELLERS ONLY
  // ---------------------------------------------------------------------------
  if (!vendorSession || !currentVendor) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between selection:bg-teal-500 selection:text-white">
        {/* Top Header */}
        <header className="px-4 sm:px-8 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Vernunt Marketplace
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold uppercase">
                  Seller Portal
                </span>
              </h1>
              <p className="text-xs text-slate-400">app.vernunt.com/vendor • Multi-Tenant Partner Security</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(onNavigateHome || onBackToStore) && (
              <button
                type="button"
                onClick={onNavigateHome || onBackToStore}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Marketplace</span>
              </button>
            )}
          </div>
        </header>

        {/* Access Gate Card */}
        <main className="max-w-xl mx-auto px-4 py-12 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto text-3xl shadow-lg">
            🔒
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Seller Authentication Required
            </h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              To protect vendor catalog security and customer data, only authenticated sellers can access product management, shipping desk, and payout logs.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-1">
              <Package className="w-4 h-4 text-teal-400" />
              <h3 className="text-xs font-bold text-white">Your Products Only</h3>
              <p className="text-[11px] text-slate-400">Manage, edit, and delete only items added by your verified store account.</p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-1">
              <Truck className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white">Direct Shipments</h3>
              <p className="text-[11px] text-slate-400">Pincode serviceability, AWB dispatch, and packing slip printing.</p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white">Zero Data Leakage</h3>
              <p className="text-[11px] text-slate-400">Customer privacy &amp; seller financial metrics are strictly isolated.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <button
              type="button"
              onClick={() => setShowPortalAuthModal(true)}
              className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-black text-sm rounded-xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Log In with Mobile OTP / Registered Seller Account</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Seller? Register Your Store with GST/Aadhaar</span>
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center py-6 text-xs text-slate-500 border-t border-slate-800">
          Vernunt Marketplace B2B Seller Desk • Secured with 256-bit encryption
        </footer>

        {/* Portal Auth Modal */}
        <PortalAuthModal
          isOpen={showPortalAuthModal}
          portalType="vendor"
          onClose={() => setShowPortalAuthModal(false)}
          onSuccess={(profile) => {
            setShowPortalAuthModal(false);
            setVendorSession(profile);
            localStorage.setItem('vernunt_auth_vendor_session', JSON.stringify(profile));
          }}
        />

        {/* Registration Modal */}
        <ServiceLevelAgreementModal
          isOpen={showSlaModal}
          onClose={() => setShowSlaModal(false)}
          onAccept={() => {
            setRegForm(prev => ({ ...prev, slaAccepted: true }));
            setShowSlaModal(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-20 font-sans selection:bg-teal-500 selection:text-white">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-slide-up">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 px-4 py-3 shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBackToStore && (
              <button
                type="button"
                onClick={onBackToStore}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
                title="Return to Public Store"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Storefront</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Store className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                  Vernunt Multi-Vendor Marketplace
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold uppercase">
                    Seller Desk
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400">Pincode Logistics, Catalog &amp; Order Fulfillment Engine</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Authenticated Seller Badge & Identity */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <span className="text-xs font-bold text-teal-300">
                {currentVendor.storeName}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-400 font-bold uppercase">
                {currentVendor.status}
              </span>
            </div>

            {onOpenStorefront && currentVendor && (
              <button
                type="button"
                onClick={() => onOpenStorefront(currentVendor)}
                className="hidden md:flex items-center gap-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl shadow-xs transition"
              >
                <Eye className="w-3.5 h-3.5" /> View Public Store
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('vernunt_auth_vendor_session');
                setVendorSession(null);
                showToast('Logged out of seller desk.');
              }}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
              title="Sign Out of Seller Desk"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        {/* Vendor Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <img
              src={currentVendor?.logo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80'}
              alt={currentVendor?.storeName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-500 shadow-xs shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900">{currentVendor?.storeName}</h2>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                  currentVendor?.status === 'active'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : currentVendor?.status === 'pending'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}>
                  {currentVendor?.status === 'active' ? '✓ Approved & Active' : currentVendor?.status}
                </span>
                {currentVendor?.businessType && (
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                    {currentVendor.businessType}
                  </span>
                )}
                {currentVendor?.isVerified && (
                  <span className="text-[10px] text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border border-teal-200">
                    <ShieldCheck className="w-3 h-3 text-teal-600" /> BIS &amp; KYC Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Owner: <strong>{currentVendor?.ownerName}</strong> • Pickup PIN: <strong className="font-mono text-slate-800">{currentVendor?.pickupAddress?.pincode || currentVendor?.address.pincode}</strong> ({currentVendor?.pickupAddress?.city || currentVendor?.address.city}) • GSTIN: <strong className="font-mono text-slate-700">{currentVendor?.gstNumber || 'Unregistered'}</strong>
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600 font-medium">
                <span>📍 Serviceable PINs: <strong className="text-teal-700 font-bold">{kpiStats.pincodeCoverageCount} Zones</strong></span>
                <span>•</span>
                <span>📦 Active Products: <strong className="text-slate-800 font-bold">{kpiStats.activeProducts}</strong></span>
                <span>•</span>
                <span>🚚 Default Shipping: <strong className="text-slate-800 font-bold">₹{currentVendor?.defaultShippingFee ?? 49}</strong> (Free &gt; ₹{currentVendor?.freeShippingThreshold ?? 499})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <div className="text-right pr-4 border-r border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Withdrawable Balance</span>
              <span className="text-xl font-black text-emerald-600 font-mono">
                ₹{currentVendor?.balance?.toLocaleString('en-IN') || 0}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsWithdrawalModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <ArrowUpRight className="w-4 h-4" /> Request Payout
            </button>
          </div>
        </div>

        {/* 18 NAVIGATION TABS BAR (CATEGORIZED & RESPONSIVE) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-2xs mb-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max">
            {NAV_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isActive ? 'bg-teal-500/30 text-teal-200' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: DASHBOARD OVERVIEW (ALL 14 REQUIRED KPI METRICS + WIDGETS)        */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Metrics Grid: 14 Metrics */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Live Marketplace Operations &amp; Performance Metrics
                </h3>
                <span className="text-xs text-slate-400 font-medium">Real-time database sync</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                {/* 1. Total Products */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">1. Total Products</span>
                  <span className="text-xl font-black text-slate-900 font-mono mt-1 block">{kpiStats.totalProducts}</span>
                  <span className="text-[10px] text-slate-500">{kpiStats.availableInventory} Units in stock</span>
                </div>

                {/* 2. Active Products */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase block">2. Active Products</span>
                  <span className="text-xl font-black text-emerald-700 font-mono mt-1 block">{kpiStats.activeProducts}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Live in store</span>
                </div>

                {/* 3. Products Pending Approval */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-amber-600 uppercase block">3. Pending Approval</span>
                  <span className="text-xl font-black text-amber-600 font-mono mt-1 block">{kpiStats.pendingProducts}</span>
                  <span className="text-[10px] text-amber-700">Admin moderation</span>
                </div>

                {/* 4. Total Orders */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">4. Total Orders</span>
                  <span className="text-xl font-black text-slate-900 font-mono mt-1 block">{kpiStats.totalOrders}</span>
                  <span className="text-[10px] text-slate-500">Lifetime volume</span>
                </div>

                {/* 5. New Orders */}
                <div className="bg-white p-3.5 rounded-2xl border border-teal-200 bg-teal-50/30 shadow-2xs">
                  <span className="text-[10px] font-bold text-teal-800 uppercase block">5. New Orders</span>
                  <span className="text-xl font-black text-teal-800 font-mono mt-1 block">{kpiStats.newOrders}</span>
                  <button onClick={() => setActiveTab('incoming_orders')} className="text-[10px] text-teal-700 font-bold hover:underline">
                    Fulfill now →
                  </button>
                </div>

                {/* 6. Awaiting Shipment */}
                <div className="bg-white p-3.5 rounded-2xl border border-sky-200 bg-sky-50/30 shadow-2xs">
                  <span className="text-[10px] font-bold text-sky-800 uppercase block">6. Awaiting Shipment</span>
                  <span className="text-xl font-black text-sky-800 font-mono mt-1 block">{kpiStats.awaitingShipmentOrders}</span>
                  <span className="text-[10px] text-sky-700 font-semibold">Processing / Packed</span>
                </div>

                {/* 7. Shipped Orders */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase block">7. Shipped Orders</span>
                  <span className="text-xl font-black text-indigo-700 font-mono mt-1 block">{kpiStats.shippedOrders}</span>
                  <span className="text-[10px] text-indigo-600">In-transit couriers</span>
                </div>

                {/* 8. Delivered Orders */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase block">8. Delivered Orders</span>
                  <span className="text-xl font-black text-emerald-700 font-mono mt-1 block">{kpiStats.deliveredOrders}</span>
                  <span className="text-[10px] text-emerald-600">Successfully completed</span>
                </div>

                {/* 9. Cancelled / Returned */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-rose-600 uppercase block">9. Cancelled / Ret</span>
                  <span className="text-xl font-black text-rose-700 font-mono mt-1 block">{kpiStats.cancelledOrders}</span>
                  <span className="text-[10px] text-rose-600">Zero penalty</span>
                </div>

                {/* 10. Total Sales */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">10. Total Sales</span>
                  <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
                    ₹{kpiStats.totalSales.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-500">Gross product value</span>
                </div>

                {/* 11. Shipping Charges Collected */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">11. Shipping Collected</span>
                  <span className="text-xl font-black text-blue-700 font-mono mt-1 block">
                    ₹{kpiStats.shippingChargesCollected.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-blue-600 font-medium">Logistics revenue</span>
                </div>

                {/* 12. Available Inventory */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">12. Total Inventory</span>
                  <span className="text-xl font-black text-slate-900 font-mono mt-1 block">{kpiStats.availableInventory}</span>
                  <span className="text-[10px] text-slate-500">Across {kpiStats.totalProducts} SKUs</span>
                </div>

                {/* 13 & 14 Pincode Delivery Coverage */}
                <div className="col-span-2 bg-gradient-to-r from-teal-900 to-slate-900 text-white p-3.5 rounded-2xl shadow-xs">
                  <span className="text-[10px] font-bold text-teal-300 uppercase block">13. Serviceable Pincodes</span>
                  <span className="text-xl font-black text-white font-mono mt-1 block">
                    {kpiStats.pincodeCoverageCount} PIN Codes
                  </span>
                  <button
                    onClick={() => setActiveTab('bulk_pincodes')}
                    className="text-[10px] text-amber-300 font-bold hover:underline flex items-center gap-1 mt-0.5"
                  >
                    14. Expand Delivery Zones →
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setActiveTab('add_product')}
                className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-500 text-left transition shadow-2xs group cursor-pointer"
              >
                <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold mb-2 group-hover:bg-teal-600 group-hover:text-white transition">
                  <Plus className="w-4 h-4" />
                </span>
                <strong className="text-xs text-slate-900 block font-bold">Add New Product</strong>
                <span className="text-[11px] text-slate-500">Create SKU with custom pincodes</span>
              </button>

              <button
                onClick={() => setActiveTab('bulk_pincodes')}
                className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-500 text-left transition shadow-2xs group cursor-pointer"
              >
                <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-2 group-hover:bg-amber-600 group-hover:text-white transition">
                  <Sparkles className="w-4 h-4" />
                </span>
                <strong className="text-xs text-slate-900 block font-bold">Bulk Pincode Assignment</strong>
                <span className="text-[11px] text-slate-500">Apply delivery zones to catalog</span>
              </button>

              <button
                onClick={() => setActiveTab('incoming_orders')}
                className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-500 text-left transition shadow-2xs group cursor-pointer"
              >
                <span className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold mb-2 group-hover:bg-sky-600 group-hover:text-white transition">
                  <ShoppingCart className="w-4 h-4" />
                </span>
                <strong className="text-xs text-slate-900 block font-bold">Process Incoming Orders</strong>
                <span className="text-[11px] text-slate-500">{kpiStats.newOrders} awaiting confirmation</span>
              </button>

              <button
                onClick={() => setActiveTab('shipping_charges')}
                className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-500 text-left transition shadow-2xs group cursor-pointer"
              >
                <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-2 group-hover:bg-purple-600 group-hover:text-white transition">
                  <Sliders className="w-4 h-4" />
                </span>
                <strong className="text-xs text-slate-900 block font-bold">Shipping Charges</strong>
                <span className="text-[11px] text-slate-500">Pincode-wise custom fees &amp; thresholds</span>
              </button>
            </div>

            {/* Recent Orders & Best Sellers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Orders (13 of 14) */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Recent Customer Orders</h3>
                    <p className="text-xs text-slate-500">Orders placed for your store products</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('incoming_orders')}
                    className="text-xs text-teal-700 font-bold hover:underline"
                  >
                    View All Orders →
                  </button>
                </div>

                {vendorOrders.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No orders placed for this vendor yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-[10.5px] uppercase font-bold">
                          <th className="py-2.5">Order</th>
                          <th className="py-2.5">Customer &amp; PIN</th>
                          <th className="py-2.5">Items</th>
                          <th className="py-2.5">Amount</th>
                          <th className="py-2.5 text-right">Status / Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {vendorOrders.slice(0, 5).map(ord => (
                          <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 font-mono font-bold text-teal-700">
                              #{ord.orderNumber}
                              <span className="text-[10px] text-slate-400 block font-normal">{ord.placedAt}</span>
                            </td>
                            <td className="py-3">
                              <span className="font-semibold text-slate-800 block">{ord.customerName}</span>
                              <span className="text-[11px] text-slate-500">PIN: <strong className="font-mono text-slate-700">{ord.shippingAddress?.pincode}</strong></span>
                            </td>
                            <td className="py-3 text-slate-600">
                              {ord.items.filter(i => i.vendorId === currentVendor?.id || i.product?.vendorId === currentVendor?.id).map(i => i.product?.name).join(', ') || ord.items[0]?.product?.name}
                            </td>
                            <td className="py-3 font-mono font-bold text-slate-900">
                              ₹{ord.totalAmount?.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 text-right">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                ord.orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                                ord.orderStatus === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                                ord.orderStatus === 'processing' || ord.orderStatus === 'packed' ? 'bg-sky-100 text-sky-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {ord.orderStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Best Selling Products (14 of 14) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Top Selling Products</h3>
                    <p className="text-xs text-slate-500">By units ordered &amp; revenue</p>
                  </div>
                </div>

                {bestSellingProducts.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Products will rank here once orders are placed.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bestSellingProducts.map((item, idx) => (
                      <div key={item.product.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-slate-100">
                        <span className="w-5 text-center text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                        <img
                          src={item.product.featuredImage}
                          alt={item.product.name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <strong className="text-xs text-slate-900 block truncate font-bold">{item.product.name}</strong>
                          <span className="text-[11px] text-slate-500">
                            {item.units} sold • ₹{item.product.price}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-extrabold text-emerald-600">
                          ₹{item.revenue > 0 ? item.revenue.toLocaleString('en-IN') : (item.product.price * (item.units || 1)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Delivery Zone Coverage Visual Widget */}
                <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Product Deliverability by Pincode</span>
                  <div className="flex items-center justify-between mt-1 text-xs">
                    <span>Unique Serviceable Pincodes:</span>
                    <strong className="text-teal-700 font-bold font-mono">{kpiStats.pincodeCoverageCount}</strong>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs">
                    <span>All-India Delivery Products:</span>
                    <strong className="text-slate-800 font-bold font-mono">
                      {vendorProducts.filter(p => p.isAllIndiaDelivery).length}
                    </strong>
                  </div>
                  <button
                    onClick={() => setActiveTab('pincodes')}
                    className="w-full mt-2 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-bold text-slate-800 transition"
                  >
                    View &amp; Test Pincode Coverage →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: VENDOR PROFILE & KYC VERIFICATION                                 */}
        {/* ========================================================================= */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Seller Business Profile &amp; Verification Details</h3>
                <p className="text-xs text-slate-500">Manage legal business name, courier pickup address, GSTIN, and bank settlement details.</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase border ${
                currentVendor?.status === 'active' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                Status: {currentVendor?.status}
              </span>
            </div>

            <form onSubmit={handleSaveVendorProfile} className="space-y-6">
              {/* Business Identity */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">1. Business Identity</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Store / Brand Name</label>
                    <input
                      type="text"
                      value={currentVendor?.storeName || ''}
                      onChange={e => {
                        const updated = vendors.map(v => v.id === currentVendor?.id ? { ...v, storeName: e.target.value } : v);
                        setVendors(updated);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Business Type</label>
                    <select
                      value={currentVendor?.businessType || 'Proprietorship'}
                      onChange={e => {
                        const updated = vendors.map(v => v.id === currentVendor?.id ? { ...v, businessType: e.target.value as any } : v);
                        setVendors(updated);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-medium"
                    >
                      <option value="Proprietorship">Proprietorship</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Private Limited">Private Limited</option>
                      <option value="LLP">LLP</option>
                      <option value="Individual Artisan">Individual Artisan / Craftsperson</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Owner / Primary Contact Person</label>
                    <input
                      type="text"
                      value={currentVendor?.ownerName || ''}
                      onChange={e => {
                        const updated = vendors.map(v => v.id === currentVendor?.id ? { ...v, ownerName: e.target.value } : v);
                        setVendors(updated);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Support Email</label>
                    <input
                      type="email"
                      value={currentVendor?.email || ''}
                      onChange={e => {
                        const updated = vendors.map(v => v.id === currentVendor?.id ? { ...v, email: e.target.value } : v);
                        setVendors(updated);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Support Phone</label>
                    <input
                      type="text"
                      value={currentVendor?.phone || ''}
                      onChange={e => {
                        const updated = vendors.map(v => v.id === currentVendor?.id ? { ...v, phone: e.target.value } : v);
                        setVendors(updated);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN Number</label>
                    <input
                      type="text"
                      value={currentVendor?.gstNumber || ''}
                      onChange={e => {
                        const updated = vendors.map(v => v.id === currentVendor?.id ? { ...v, gstNumber: e.target.value } : v);
                        setVendors(updated);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-mono uppercase font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Courier Pickup Address (Crucial for multi-vendor fulfillment) */}
              <div className="border-t border-slate-100 pt-5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  2. Warehouse &amp; Courier Dispatch Pickup Address
                </h4>
                <p className="text-[11px] text-slate-500 mb-3">
                  Couriers (BlueDart, Delhivery, Shadowfax) will dispatch vans to this address to collect packed packages.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Street / Suite</label>
                    <input
                      type="text"
                      value={currentVendor?.pickupAddress?.street || currentVendor?.address.street || ''}
                      onChange={e => {
                        const updated = vendors.map(v => v.id === currentVendor?.id ? {
                          ...v,
                          pickupAddress: { ...(v.pickupAddress || v.address), street: e.target.value }
                        } : v);
                        setVendors(updated);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={currentVendor?.pickupAddress?.city || currentVendor?.address.city || ''}
                      onChange={e => {
                        const updated = vendors.map(v => v.id === currentVendor?.id ? {
                          ...v,
                          pickupAddress: { ...(v.pickupAddress || v.address), city: e.target.value }
                        } : v);
                        setVendors(updated);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse PIN Code *</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={currentVendor?.pickupAddress?.pincode || currentVendor?.address.pincode || ''}
                      onChange={e => {
                        const clean = cleanPincode(e.target.value);
                        const updated = vendors.map(v => v.id === currentVendor?.id ? {
                          ...v,
                          pickupAddress: { ...(v.pickupAddress || v.address), pincode: clean }
                        } : v);
                        setVendors(updated);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Bank & Settlement Details */}
              <div className="border-t border-slate-100 pt-5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  3. Settlement &amp; Bank Account Details (Private &amp; Encrypted)
                </h4>
                <p className="text-[11px] text-slate-500 mb-3">
                  Never visible to customers or other sellers. Used strictly for vendor earnings disbursements.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={currentVendor?.bankDetails.accountHolder || ''}
                      onChange={e => {
                        const updated = vendors.map(v => v.id === currentVendor?.id ? {
                          ...v,
                          bankDetails: { ...v.bankDetails, accountHolder: e.target.value }
                        } : v);
                        setVendors(updated);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={currentVendor?.bankDetails.bankName || ''}
                      onChange={e => {
                        const updated = vendors.map(v => v.id === currentVendor?.id ? {
                          ...v,
                          bankDetails: { ...v.bankDetails, bankName: e.target.value }
                        } : v);
                        setVendors(updated);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={currentVendor?.bankDetails.accountNumber || ''}
                      onChange={e => {
                        const updated = vendors.map(v => v.id === currentVendor?.id ? {
                          ...v,
                          bankDetails: { ...v.bankDetails, accountNumber: e.target.value }
                        } : v);
                        setVendors(updated);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={currentVendor?.bankDetails.ifscCode || ''}
                      onChange={e => {
                        const updated = vendors.map(v => v.id === currentVendor?.id ? {
                          ...v,
                          bankDetails: { ...v.bankDetails, ifscCode: e.target.value.toUpperCase() }
                        } : v);
                        setVendors(updated);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">UPI ID (Instant Payouts)</label>
                    <input
                      type="text"
                      value={currentVendor?.bankDetails.upiId || ''}
                      onChange={e => {
                        const updated = vendors.map(v => v.id === currentVendor?.id ? {
                          ...v,
                          bankDetails: { ...v.bankDetails, upiId: e.target.value }
                        } : v);
                        setVendors(updated);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-mono text-teal-700 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* SLA & Legal */}
              <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Marketplace SLA Compliance (v2.1)
                  </span>
                  <p className="text-[11px] text-slate-500">Accepted on {currentVendor?.joinedDate || 'Registration'}</p>
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: PRODUCT MANAGEMENT                                                */}
        {/* ========================================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products by title, SKU or category..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full text-xs outline-hidden font-medium bg-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={productCategoryFilter}
                  onChange={e => setProductCategoryFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-hidden"
                >
                  <option value="all">All Categories</option>
                  {STORE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={productStockFilter}
                  onChange={e => setProductStockFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-hidden"
                >
                  <option value="all">All Stock Statuses</option>
                  <option value="instock">In Stock</option>
                  <option value="outofstock">Out of Stock</option>
                </select>

                <button
                  onClick={() => setActiveTab('add_product')}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Product
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="py-3 px-4">Product Info</th>
                      <th className="py-3 px-4">SKU &amp; Category</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Inventory</th>
                      <th className="py-3 px-4">Serviceable Pincodes</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vendorProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <Package className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                          <p className="font-bold text-slate-700 text-xs">No products added by your store yet</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Click &quot;+ Add Product&quot; to list your first child developmental toy, book, or kit.</p>
                        </td>
                      </tr>
                    ) : (
                      vendorProducts
                        .filter(p => {
                          if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) return false;
                          if (productStockFilter !== 'all' && p.stockStatus !== productStockFilter) return false;
                          if (productSearch && !p.name.toLowerCase().includes(productSearch.toLowerCase()) && !p.sku.toLowerCase().includes(productSearch.toLowerCase())) return false;
                          return true;
                        })
                        .map(prod => (
                          <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 flex items-center gap-3">
                            <img
                              src={prod.featuredImage}
                              alt={prod.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <strong className="text-slate-900 block font-bold">{prod.name}</strong>
                              <span className="text-[11px] text-slate-500">{prod.ageLabel}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-slate-600 block">{prod.sku}</span>
                            <span className="text-[11px] text-slate-500">{prod.category}</span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            ₹{prod.price}
                            {prod.regularPrice > prod.price && (
                              <span className="text-[10px] text-slate-400 line-through block font-normal">
                                ₹{prod.regularPrice}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-mono font-bold ${prod.stockQuantity <= 5 ? 'text-amber-600' : 'text-slate-800'}`}>
                                {prod.stockQuantity}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                prod.stockStatus === 'instock' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {prod.stockStatus}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {prod.isAllIndiaDelivery ? (
                              <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                🇮🇳 All India Delivery
                              </span>
                            ) : (
                              <span className="text-[10.5px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                                📍 {prod.serviceablePincodes?.length || currentVendor?.serviceablePincodes?.length || 0} Pincodes
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleProductStatus(prod.id)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border cursor-pointer ${
                                prod.approvalStatus === 'approved' 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {prod.approvalStatus}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5">
                            <button
                              onClick={() => {
                                setEditingProduct(prod);
                                setIsEditProductModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                              title="Edit Product"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: ADD NEW PRODUCT                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'add_product' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900">Add New Marketplace Product</h3>
              <p className="text-xs text-slate-500">Configure catalog information, pricing, stock levels, and deliverable pincodes.</p>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-6">
              {/* Product Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wooden Sensory Math Balancing Scale"
                    value={newProductForm.name}
                    onChange={e => setNewProductForm({ ...newProductForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={newProductForm.category}
                    onChange={e => setNewProductForm({ ...newProductForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                  >
                    {STORE_CATEGORIES.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing & GST */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newProductForm.price}
                    onChange={e => setNewProductForm({ ...newProductForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Regular MRP (₹)</label>
                  <input
                    type="number"
                    min={1}
                    value={newProductForm.regularPrice}
                    onChange={e => setNewProductForm({ ...newProductForm, regularPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST Tax Rate (%)</label>
                  <select
                    value={newProductForm.gstRate}
                    onChange={e => setNewProductForm({ ...newProductForm, gstRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                  >
                    <option value={0}>0% (Tax Exempt)</option>
                    <option value={5}>5% (Kids Food / Books)</option>
                    <option value={12}>12% (Wooden Toys / Safety)</option>
                    <option value={18}>18% (Electronic Gear)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={newProductForm.hsnCode}
                    onChange={e => setNewProductForm({ ...newProductForm, hsnCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* Stock & Logistics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newProductForm.stockQuantity}
                    onChange={e => setNewProductForm({ ...newProductForm, stockQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={newProductForm.sku}
                    onChange={e => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (Grams)</label>
                  <input
                    type="number"
                    value={newProductForm.weightGrams}
                    onChange={e => setNewProductForm({ ...newProductForm, weightGrams: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Ages 2-5 Years"
                    value={newProductForm.ageLabel}
                    onChange={e => setNewProductForm({ ...newProductForm, ageLabel: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Featured Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newProductForm.featuredImage}
                  onChange={e => setNewProductForm({ ...newProductForm, featuredImage: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                />
              </div>

              {/* Serviceable Pincodes & Delivery Availability (Core Requirement) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-teal-600" />
                      Pincode-Based Delivery Availability for this Product
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Specify which postal codes this item can be shipped to, or enable Pan-India delivery.
                    </span>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!newProductForm.isAllIndiaDelivery}
                      onChange={e => setNewProductForm({ ...newProductForm, isAllIndiaDelivery: e.target.checked })}
                      className="rounded-sm text-teal-600 focus:ring-teal-500"
                    />
                    Deliver to ALL Pincodes in India
                  </label>
                </div>

                {!newProductForm.isAllIndiaDelivery && (
                  <div>
                    <textarea
                      rows={3}
                      placeholder="Enter 6-digit Indian PIN codes separated by comma, space or newlines (e.g. 560001, 560100, 411038, 400001)..."
                      value={newProductForm.serviceablePincodes?.join(', ')}
                      onChange={e => {
                        const parsed = e.target.value.split(/[\s,\n]+/).map(cleanPincode).filter(p => p.length === 6);
                        setNewProductForm({ ...newProductForm, serviceablePincodes: parsed });
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-mono"
                    />
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                      <span>Valid PIN codes: <strong className="text-teal-700 font-bold">{newProductForm.serviceablePincodes?.length || 0}</strong></span>
                      <button
                        type="button"
                        onClick={() => setNewProductForm({ ...newProductForm, serviceablePincodes: currentVendor?.serviceablePincodes || [] })}
                        className="text-teal-700 font-bold hover:underline"
                      >
                        Copy Vendor's Default Pincodes ({currentVendor?.serviceablePincodes?.length || 0})
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  Create &amp; Publish Product
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: MANAGE PRODUCT CATEGORIES                                         */}
        {/* ========================================================================= */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <h3 className="text-base font-black text-slate-900">Marketplace Categories &amp; Store Catalog Mapping</h3>
              <p className="text-xs text-slate-500">Vernunt curated taxonomy for child developmental equipment and organic foods.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {STORE_CATEGORIES.map(cat => {
                const count = vendorProducts.filter(p => p.category === cat.name).length;
                return (
                  <div key={cat.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                          {count} Products
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{cat.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.description}</p>
                      {cat.subcategories && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {cat.subcategories.slice(0, 4).map(sub => (
                            <span key={sub} className="text-[9px] bg-slate-50 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-medium">
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setProductCategoryFilter(cat.name);
                        setActiveTab('products');
                      }}
                      className="mt-4 w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-bold transition border border-slate-200"
                    >
                      Filter Store Products ({count})
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: PINCODE AND DELIVERY MANAGEMENT                                    */}
        {/* ========================================================================= */}
        {activeTab === 'pincodes' && (
          <div className="space-y-6">
            {/* Test Pincode Lookup Widget */}
            <div className="bg-gradient-to-r from-slate-900 to-teal-950 text-white p-5 rounded-2xl shadow-xs">
              <div className="max-w-xl">
                <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider block">Live Deliverability Diagnostic Tool</span>
                <h3 className="text-base font-bold text-white mt-1">Test Product Availability by Customer Pincode</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Enter any 6-digit Indian PIN code to immediately preview what a customer in that area will see.
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit PIN (e.g. 560102, 411038, 110001)..."
                    value={pincodeLookupTest}
                    onChange={e => setPincodeLookupTest(cleanPincode(e.target.value))}
                    className="px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-bold text-white outline-hidden font-mono flex-1 focus:border-teal-400"
                  />
                  {pincodeLookupTest && (
                    <button
                      onClick={() => setPincodeLookupTest('')}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Diagnostic Results */}
              {pincodeTestResults && (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Diagnostic Results for PIN: <strong className="text-teal-300 font-mono">{pincodeLookupTest}</strong>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {pincodeTestResults.map(({ product, check }) => (
                      <div
                        key={product.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          check.isDeliverable 
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                            : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                        }`}
                      >
                        <span className="truncate max-w-[200px] font-semibold">{product.name}</span>
                        <span className="font-bold shrink-0">
                          {check.isDeliverable ? `✓ Deliverable (₹${check.shippingFee})` : '✗ Not Serviceable'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Product-Wise Pincode Coverage Table */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Product-Wise Serviceable Pincodes</h3>
                  <p className="text-xs text-slate-500">Click any product to adjust its deliverable pincodes directly</p>
                </div>
                <button
                  onClick={() => setActiveTab('bulk_pincodes')}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Bulk Assign Pincodes
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Delivery Mode</th>
                      <th className="py-2.5 px-3">Pincodes Count</th>
                      <th className="py-2.5 px-3">Sample Pincodes</th>
                      <th className="py-2.5 px-3 text-right">Quick Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vendorProducts.map(prod => (
                      <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 flex items-center gap-2.5 font-bold text-slate-900">
                          <img src={prod.featuredImage} alt={prod.name} className="w-8 h-8 rounded-lg object-cover" />
                          <span className="truncate max-w-[220px]">{prod.name}</span>
                        </td>
                        <td className="py-3 px-3">
                          {prod.isAllIndiaDelivery ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              All India
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                              Specific Pincodes
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          {prod.isAllIndiaDelivery ? '19,000+ PINs' : `${prod.serviceablePincodes?.length || currentVendor?.serviceablePincodes?.length || 0} PINs`}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500 truncate max-w-[200px]">
                          {prod.isAllIndiaDelivery ? 'Pan-India coverage' : (prod.serviceablePincodes?.slice(0, 4).join(', ') || 'Inherits vendor default')}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                              setIsEditProductModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold"
                          >
                            Edit Pincodes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 7: BULK PINCODE ASSIGNMENT                                           */}
        {/* ========================================================================= */}
        {activeTab === 'bulk_pincodes' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block">Multi-Product Logistics Engine</span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">Bulk Pincode Assignment &amp; Territory Control</h3>
              <p className="text-xs text-slate-500 mt-1">
                Assign deliverable postal codes to multiple products simultaneously or use one-click regional presets.
              </p>
            </div>

            {/* Step 1: Select Products */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Step 1: Choose Target Products
                </label>
                <button
                  type="button"
                  onClick={() => setBulkSelectAll(!bulkSelectAll)}
                  className="text-xs text-teal-700 font-bold hover:underline"
                >
                  {bulkSelectAll ? 'Deselect All' : 'Select All Products'}
                </button>
              </div>

              {bulkSelectAll ? (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs font-semibold text-teal-900 flex items-center justify-between">
                  <span>✓ Applying to ALL ({vendorProducts.length}) products in your catalog.</span>
                  <button onClick={() => setBulkSelectAll(false)} className="text-teal-700 underline text-xs font-bold">
                    Choose individual items
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {vendorProducts.map(p => {
                    const isChecked = bulkSelectedProductIds.includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-xs cursor-pointer hover:border-teal-500">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setBulkSelectedProductIds([...bulkSelectedProductIds, p.id]);
                            } else {
                              setBulkSelectedProductIds(bulkSelectedProductIds.filter(id => id !== p.id));
                            }
                          }}
                          className="rounded-sm text-teal-600 focus:ring-teal-500"
                        />
                        <span className="truncate font-semibold">{p.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Regional Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Step 2: Quick Regional Presets (1-Click Insertion)
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPincodePreset('METROS')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  ⚡ All India Metros ({REGIONAL_PINCODE_PRESETS.METROS.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPincodePreset('SOUTH_INDIA')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  🌴 South India Hubs ({REGIONAL_PINCODE_PRESETS.SOUTH_INDIA.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPincodePreset('NORTH_INDIA')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  🏔️ North India Hubs ({REGIONAL_PINCODE_PRESETS.NORTH_INDIA.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPincodePreset('WEST_INDIA')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  🌊 West India Hubs ({REGIONAL_PINCODE_PRESETS.WEST_INDIA.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPincodePreset('EAST_AND_CENTRAL')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  🌅 East &amp; Central Hubs ({REGIONAL_PINCODE_PRESETS.EAST_AND_CENTRAL.length})
                </button>
              </div>
            </div>

            {/* Step 3: Pincodes Freeform Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Step 3: Pincode List (Enter or Paste)
                </label>
                <span className="text-xs font-mono font-bold text-teal-700">
                  {bulkPincodesInput.split(/[\s,\n]+/).map(cleanPincode).filter(p => p.length === 6).length} PINs detected
                </span>
              </div>
              <textarea
                rows={4}
                placeholder="Paste or type 6-digit Indian PIN codes separated by commas, spaces, or lines (e.g. 560001, 560100, 411038, 400001, 110001)..."
                value={bulkPincodesInput}
                onChange={e => setBulkPincodesInput(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl outline-hidden font-mono focus:border-teal-500"
              />
            </div>

            {/* Step 4: Assignment Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assignment Mode</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="bulkMode"
                      checked={bulkActionMode === 'add'}
                      onChange={() => setBulkActionMode('add')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    Add / Append to existing pincodes
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="bulkMode"
                      checked={bulkActionMode === 'replace'}
                      onChange={() => setBulkActionMode('replace')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    Replace all existing pincodes
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Optional Custom Shipping Charge for this Batch (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 39 (leave empty for vendor default)"
                  value={bulkCustomShippingFee}
                  onChange={e => setBulkCustomShippingFee(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={handleApplyBulkPincodes}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> Apply Bulk Pincodes to Catalog
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 8: SHIPPING CHARGES & THRESHOLDS                                     */}
        {/* ========================================================================= */}
        {activeTab === 'shipping_charges' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block">Custom Logistics Rules</span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">Shipping Charges, Free Delivery Thresholds &amp; Custom Pincode Rates</h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure your store's base delivery rates, minimum spend for free shipping, and custom rates for specific delivery pincodes.
              </p>
            </div>

            {/* Base Shipping Form */}
            <form onSubmit={handleSaveShippingConfig} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Base Standard Shipping Fee (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={shippingConfig.defaultShippingFee}
                  onChange={e => setShippingConfig({ ...shippingConfig, defaultShippingFee: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-bold font-mono"
                />
                <span className="text-[10px] text-slate-400">Charged on regular orders below threshold</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Free Delivery Minimum Spend (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={shippingConfig.freeShippingThreshold}
                  onChange={e => setShippingConfig({ ...shippingConfig, freeShippingThreshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-bold font-mono text-emerald-600"
                />
                <span className="text-[10px] text-slate-400">Orders above this amount get 100% Free Shipping</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Express Courier Surcharge (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={shippingConfig.expressShippingFee}
                  onChange={e => setShippingConfig({ ...shippingConfig, expressShippingFee: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-bold font-mono"
                />
                <span className="text-[10px] text-slate-400">For 24h express dispatch option</span>
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Save Store Shipping Defaults
                </button>
              </div>
            </form>

            {/* Pincode Specific Override Rules Builder */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Pincode-Specific Shipping Charges Override
                </h4>
                <p className="text-[11px] text-slate-500">
                  Override default shipping rates for specific postal codes (e.g. local warehouse delivery: ₹20, remote delivery: ₹80).
                </p>
              </div>

              {/* Add New Rule Row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Pincode (6 Digits)</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 560100"
                    value={shippingConfig.newRulePincode}
                    onChange={e => setShippingConfig({ ...shippingConfig, newRulePincode: cleanPincode(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Shipping Fee (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={shippingConfig.newRuleFee}
                    onChange={e => setShippingConfig({ ...shippingConfig, newRuleFee: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Delivery Days</label>
                  <input
                    type="number"
                    min={1}
                    value={shippingConfig.newRuleDays}
                    onChange={e => setShippingConfig({ ...shippingConfig, newRuleDays: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddCustomShippingRule}
                    className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Rule
                  </button>
                </div>
              </div>

              {/* Rules Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="py-2.5">Pincode</th>
                      <th className="py-2.5">Custom Shipping Fee</th>
                      <th className="py-2.5">Est. Delivery</th>
                      <th className="py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(currentVendor?.pincodeShippingOverrides || {}).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400">
                          No custom pincode rates configured. Default store fee (₹{currentVendor?.defaultShippingFee || 49}) applies.
                        </td>
                      </tr>
                    ) : (
                      Object.entries(currentVendor?.pincodeShippingOverrides || {}).map(([pin, fee]) => (
                        <tr key={pin} className="hover:bg-slate-50">
                          <td className="py-2.5 font-mono font-bold text-slate-900">{pin}</td>
                          <td className="py-2.5 font-mono font-bold text-teal-700">₹{fee}</td>
                          <td className="py-2.5 text-slate-500">1 - 2 business days</td>
                          <td className="py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveShippingRule(pin, pin)}
                              className="text-rose-600 hover:underline text-xs font-bold"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 9: INCOMING ORDERS                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'incoming_orders' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Incoming Orders Awaiting Acceptance</h3>
                <p className="text-xs text-slate-500">Confirm receipt and advance orders to warehouse packing.</p>
              </div>
              <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">
                {vendorOrders.filter(o => o.orderStatus === 'pending').length} New Orders
              </span>
            </div>

            {vendorOrders.filter(o => o.orderStatus === 'pending').length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No new pending orders right now. Good job! All orders are currently processed.
              </div>
            ) : (
              <div className="space-y-4">
                {vendorOrders.filter(o => o.orderStatus === 'pending').map(ord => (
                  <div key={ord.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                      <div>
                        <span className="text-sm font-black font-mono text-slate-900">Order #{ord.orderNumber}</span>
                        <span className="text-[11px] text-slate-500 ml-2">Placed: {ord.placedAt}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-extrabold text-emerald-700">₹{ord.totalAmount?.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold uppercase">
                          Pending Acceptance
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <strong className="text-slate-800 block mb-1">Customer Delivery Address:</strong>
                        <p className="text-slate-600 font-medium">
                          {ord.shippingAddress?.fullName} ({ord.shippingAddress?.phone})<br />
                          {ord.shippingAddress?.addressLine1}, {ord.shippingAddress?.city}, {ord.shippingAddress?.state}<br />
                          Delivery PIN: <strong className="font-mono text-slate-900 font-bold">{ord.shippingAddress?.pincode}</strong>
                        </p>
                      </div>

                      <div>
                        <strong className="text-slate-800 block mb-1">Ordered Items (This Store):</strong>
                        <ul className="space-y-1">
                          {ord.items.filter(i => i.vendorId === currentVendor?.id || i.product?.vendorId === currentVendor?.id).map((it, idx) => (
                            <li key={idx} className="flex justify-between text-slate-700">
                              <span>{it.quantity}x {it.product?.name}</span>
                              <span className="font-mono font-bold">₹{it.totalPrice || (it.unitPrice * it.quantity)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/80">
                      <button
                        onClick={() => setSelectedPackingSlipOrder(ord)}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print Packing Slip
                      </button>
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'processing')}
                        className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept &amp; Start Packing
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 10: ORDER PROCESSING                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'order_processing' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Order Processing &amp; Packing Checklist</h3>
                <p className="text-xs text-slate-500">Pack verified orders, generate GST tax invoices, and prepare for courier pickup.</p>
              </div>
              <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg">
                {vendorOrders.filter(o => o.orderStatus === 'processing' || o.orderStatus === 'packed').length} In-Process
              </span>
            </div>

            {vendorOrders.filter(o => o.orderStatus === 'processing' || o.orderStatus === 'packed').length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No orders currently in packing stage. Check "Incoming Orders" to accept new orders.
              </div>
            ) : (
              <div className="space-y-4">
                {vendorOrders.filter(o => o.orderStatus === 'processing' || o.orderStatus === 'packed').map(ord => (
                  <div key={ord.id} className="p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <strong className="text-sm font-mono font-bold text-slate-900">#{ord.orderNumber}</strong>
                        <span className="text-xs text-slate-500 ml-2">Invoice: {ord.invoiceNumber || 'INV-' + ord.orderNumber}</span>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 uppercase">
                        {ord.orderStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Destination</span>
                        <strong className="text-slate-800 block">{ord.customerName}</strong>
                        <span className="text-slate-600">{ord.shippingAddress?.city} - PIN {ord.shippingAddress?.pincode}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase">Fulfillment SLA</span>
                        <span className="text-emerald-700 font-bold block">24h Dispatch Window</span>
                        <span className="text-slate-500">Courier van scheduled</span>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedPackingSlipOrder(ord)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> GST Invoice
                        </button>
                        {ord.orderStatus === 'processing' ? (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'packed')}
                            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                          >
                            Mark as Packed
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveTab('shipping_tracking')}
                            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
                          >
                            Assign AWB →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 11: SHIPPING AND TRACKING                                            */}
        {/* ========================================================================= */}
        {activeTab === 'shipping_tracking' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-black text-slate-900">Courier Dispatch, Tracking &amp; AWB Management</h3>
                <p className="text-xs text-slate-500">Record courier partners (Delhivery, BlueDart, Shadowfax) and tracking numbers.</p>
              </div>

              {/* Shipped / Out for delivery list */}
              <div className="space-y-3">
                {vendorOrders.map(ord => (
                  <div key={ord.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-mono font-bold text-slate-900">#{ord.orderNumber}</strong>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase bg-indigo-50 text-indigo-800 border border-indigo-200">
                          {ord.orderStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Destination: <strong>{ord.shippingAddress?.fullName}</strong> • PIN <strong className="font-mono">{ord.shippingAddress?.pincode}</strong> ({ord.shippingAddress?.city})
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Courier: <strong>{ord.courierPartner || 'Not assigned'}</strong> • AWB: <strong className="font-mono">{ord.trackingNumber || 'Pending'}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          const partner = prompt('Courier Company Name (e.g. BlueDart, Delhivery, Shadowfax):', ord.courierPartner || 'Delhivery Express');
                          if (!partner) return;
                          const awb = prompt('Enter Courier AWB / Waybill Tracking Number:', ord.trackingNumber || 'DEL' + Math.floor(10000000 + Math.random() * 90000000));
                          if (!awb) return;
                          handleUpdateOrderStatus(ord.id, 'shipped', partner, awb);
                        }}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                      >
                        Enter Courier / AWB
                      </button>

                      {ord.orderStatus === 'shipped' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shiprocket Automated Integration Hub */}
            <ShiprocketShippingDesk currentVendor={currentVendor} />
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 12: INVENTORY MANAGEMENT                                             */}
        {/* ========================================================================= */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Inventory Stock Controller</h3>
                <p className="text-xs text-slate-500">Prevent overselling with real-time stock counters and low inventory alerts.</p>
              </div>
              <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">
                Total Units: {kpiStats.availableInventory}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-2.5 px-3">Product Name &amp; SKU</th>
                    <th className="py-2.5 px-3">Current Stock</th>
                    <th className="py-2.5 px-3">Low-Stock Alert Level</th>
                    <th className="py-2.5 px-3">Quick Counter Adjustment</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendorProducts.map(prod => (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {prod.name}
                        <span className="text-[10px] text-slate-400 font-mono block">SKU: {prod.sku}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-base text-slate-900">
                        {prod.stockQuantity}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono">
                        &le; {prod.lowStockThreshold || 5} units
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateStock(prod.id, -1)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStock(prod.id, 1)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStock(prod.id, 10)}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg font-bold text-xs"
                          >
                            +10
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          prod.stockQuantity > 5 ? 'bg-emerald-50 text-emerald-800' :
                          prod.stockQuantity > 0 ? 'bg-amber-50 text-amber-800' :
                          'bg-rose-50 text-rose-800'
                        }`}>
                          {prod.stockStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 13: SALES REPORTS                                                    */}
        {/* ========================================================================= */}
        {activeTab === 'sales_reports' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900">Store Sales &amp; Revenue Analytics</h3>
              <p className="text-xs text-slate-500">Comprehensive breakdown of order volume, average order values, and commission splits.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Gross Product Revenue</span>
                <span className="text-2xl font-black text-slate-900 font-mono block mt-1">₹{kpiStats.totalSales.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Shipping Revenue</span>
                <span className="text-2xl font-black text-blue-700 font-mono block mt-1">₹{kpiStats.shippingChargesCollected.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Average Order Value (AOV)</span>
                <span className="text-2xl font-black text-teal-700 font-mono block mt-1">
                  ₹{kpiStats.totalOrders > 0 ? Math.round(kpiStats.totalSales / kpiStats.totalOrders).toLocaleString('en-IN') : 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 14: EARNINGS AND TRANSACTIONS                                        */}
        {/* ========================================================================= */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Wallet Balance</span>
                <span className="text-3xl font-black text-emerald-600 font-mono block mt-1">
                  ₹{currentVendor?.balance.toLocaleString('en-IN') || 0}
                </span>
                <span className="text-xs text-slate-500">Minimum withdrawal threshold: ₹{storeSettings.minWithdrawalAmount}</span>
              </div>
              <button
                onClick={() => setIsWithdrawalModalOpen(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <ArrowUpRight className="w-4 h-4" /> Request Payout Now
              </button>
            </div>

            {/* Withdrawals History */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Withdrawal &amp; Disbursement History</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="py-2.5 px-3">Withdrawal ID</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Method &amp; Account</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vendorWithdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          No withdrawal requests submitted yet.
                        </td>
                      </tr>
                    ) : (
                      vendorWithdrawals.map(w => (
                        <tr key={w.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{w.withdrawalNumber}</td>
                          <td className="py-3 px-3 text-slate-500">{w.requestedAt}</td>
                          <td className="py-3 px-3 font-mono font-bold text-emerald-600">₹{w.amount.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 text-slate-700">{w.payoutDetails}</td>
                          <td className="py-3 px-3 text-right">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                              {w.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 15: CUSTOMER ENQUIRIES                                               */}
        {/* ========================================================================= */}
        {activeTab === 'inquiries' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900">Customer Product Inquiries</h3>
              <p className="text-xs text-slate-500">Answer buyer questions regarding materials, age suitability, and deliverability.</p>
            </div>

            <div className="space-y-4">
              {vendorInquiries.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No inquiries received yet.
                </div>
              ) : (
                vendorInquiries.map(inq => (
                  <div key={inq.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs text-slate-900 font-bold">{inq.subject}</strong>
                      <span className="text-[10px] text-slate-400">{inq.date}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">"{inq.message}"</p>
                    <span className="text-[11px] text-slate-500 block">From: {inq.customerName} ({inq.customerEmail})</span>

                    {inq.reply ? (
                      <div className="p-3 bg-white rounded-lg border border-teal-200 text-xs text-teal-900 mt-2">
                        <strong>Store Reply:</strong> {inq.reply}
                      </div>
                    ) : (
                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          placeholder="Type your response to the customer..."
                          id={`reply-input-${inq.id}`}
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-hidden"
                        />
                        <button
                          onClick={() => {
                            const el = document.getElementById(`reply-input-${inq.id}`) as HTMLInputElement;
                            if (el?.value) {
                              handleReplyInquiry(inq.id, el.value);
                              el.value = '';
                            }
                          }}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold"
                        >
                          Send Reply
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 16: STORE SETTINGS & POLICIES                                        */}
        {/* ========================================================================= */}
        {activeTab === 'store_settings' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900">Seller Store Settings &amp; Policies</h3>
              <p className="text-xs text-slate-500">Configure return policies, vacation mode, and store branding.</p>
            </div>

            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Return &amp; Replacement Policy</label>
                <textarea
                  rows={3}
                  value={currentVendor?.returnPolicy || '7 Days Replacement for manufacturing defects with original packaging intact.'}
                  onChange={e => {
                    const updated = vendors.map(v => v.id === currentVendor?.id ? { ...v, returnPolicy: e.target.value } : v);
                    setVendors(updated);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Store Biography / About</label>
                <textarea
                  rows={3}
                  value={currentVendor?.bio || ''}
                  onChange={e => {
                    const updated = vendors.map(v => v.id === currentVendor?.id ? { ...v, bio: e.target.value } : v);
                    setVendors(updated);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    saveStoredVendors(vendors);
                    showToast('Store settings saved successfully!');
                  }}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  Save Store Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 17: NOTIFICATIONS                                                    */}
        {/* ========================================================================= */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900">Marketplace Notices &amp; Announcements</h3>
              <p className="text-xs text-slate-500">Administrative updates, festive seller guidelines, and dispatch alerts.</p>
            </div>

            <div className="space-y-3">
              {announcements.map(ann => (
                <div key={ann.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{ann.title}</h4>
                    <span className="text-[10px] text-slate-400">{ann.date}</span>
                  </div>
                  <p className="text-xs text-slate-600">{ann.content}</p>
                  <span className="text-[10px] text-slate-400 block pt-1">Posted by {ann.authorName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 18: HELP AND SUPPORT                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'help_support' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900">Seller Help Desk &amp; Compliance Guidelines</h3>
              <p className="text-xs text-slate-500">Packaging safety rules, courier dispatch SLAs, and direct merchant contact.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Vernunt Child Safety &amp; Packaging Rules
                </h4>
                <p className="text-xs text-slate-600">
                  All wooden products must feature certified lead-free organic stains. Food items must adhere strictly to FSSAI guidelines with zero refined sugar.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  Courier Pickup &amp; Dispatch SLA
                </h4>
                <p className="text-xs text-slate-600">
                  Sellers must hand over packed orders within 24-48 hours of order acceptance to maintain top marketplace ranking.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 sm:col-span-2 space-y-2">
                <h4 className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-teal-700" />
                  Direct Vernunt Merchant Support Desk
                </h4>
                <p className="text-xs text-teal-900">
                  Dedicated assistance for catalog approval, banking questions, and custom API logistics.
                </p>
                <div className="flex flex-wrap gap-4 text-xs font-semibold text-teal-800 pt-1">
                  <span>📧 merchant-support@vernunt.com</span>
                  <span>📞 1800-VERNUNT (Mon-Sat 9 AM - 7 PM)</span>
                  <span>💬 WhatsApp Seller Helpline</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: EDIT PRODUCT DETAILS                                               */}
      {/* ========================================================================= */}
      {isEditProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <h3 className="font-bold text-sm">Edit Product: {editingProduct.name}</h3>
              <button onClick={() => setIsEditProductModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Title</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={editingProduct.stockQuantity}
                    onChange={e => setEditingProduct({ ...editingProduct, stockQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Serviceable Pincodes (Comma separated)</label>
                <textarea
                  rows={3}
                  value={editingProduct.serviceablePincodes?.join(', ') || ''}
                  onChange={e => {
                    const parsed = e.target.value.split(/[\s,\n]+/).map(cleanPincode).filter(p => p.length === 6);
                    setEditingProduct({ ...editingProduct, serviceablePincodes: parsed, isAllIndiaDelivery: false });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PACKING SLIP & GST TAX INVOICE                                      */}
      {/* ========================================================================= */}
      {selectedPackingSlipOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">VERIFIED PACKING SLIP &amp; TAX INVOICE</h3>
                <span className="text-xs font-mono text-slate-500">Order #{selectedPackingSlipOrder.orderNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={() => setSelectedPackingSlipOrder(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-100 pb-4">
              <div>
                <strong className="text-slate-900 block font-bold mb-1">DISPATCHED FROM (SELLER):</strong>
                <p className="text-slate-600">
                  {currentVendor?.storeName}<br />
                  {currentVendor?.pickupAddress?.street || currentVendor?.address.street}<br />
                  {currentVendor?.pickupAddress?.city || currentVendor?.address.city}, {currentVendor?.pickupAddress?.state || currentVendor?.address.state} - {currentVendor?.pickupAddress?.pincode || currentVendor?.address.pincode}<br />
                  GSTIN: {currentVendor?.gstNumber || 'Unregistered'}
                </p>
              </div>
              <div>
                <strong className="text-slate-900 block font-bold mb-1">DELIVER TO (CUSTOMER):</strong>
                <p className="text-slate-600">
                  {selectedPackingSlipOrder.shippingAddress?.fullName}<br />
                  {selectedPackingSlipOrder.shippingAddress?.addressLine1}<br />
                  {selectedPackingSlipOrder.shippingAddress?.city}, {selectedPackingSlipOrder.shippingAddress?.state} - <strong>{selectedPackingSlipOrder.shippingAddress?.pincode}</strong><br />
                  Phone: {selectedPackingSlipOrder.shippingAddress?.phone}
                </p>
              </div>
            </div>

            <div>
              <strong className="text-xs text-slate-900 block font-bold mb-2">ITEMS CHECKLIST:</strong>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="p-2.5">Item Name</th>
                      <th className="p-2.5">Qty</th>
                      <th className="p-2.5">Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPackingSlipOrder.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium">{it.product?.name}</td>
                        <td className="p-2.5 font-mono">{it.quantity}</td>
                        <td className="p-2.5 font-mono">₹{it.unitPrice}</td>
                        <td className="p-2.5 font-mono text-right font-bold">₹{it.totalPrice || (it.unitPrice * it.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-right text-xs pt-2">
              <span className="text-slate-500">Total Invoice Value:</span>{' '}
              <strong className="text-base font-black text-slate-900 font-mono">
                ₹{selectedPackingSlipOrder.totalAmount?.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REQUEST WITHDRAWAL                                                 */}
      {/* ========================================================================= */}
      {isWithdrawalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-sm">Request Vendor Payout Disbursement</h3>
              </div>
              <button onClick={() => setIsWithdrawalModalOpen(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestWithdrawal} className="p-6 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900 flex justify-between items-center">
                <span>Withdrawable Balance:</span>
                <strong className="text-sm font-mono font-extrabold">₹{currentVendor?.balance.toLocaleString('en-IN')}</strong>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Withdrawal Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={storeSettings.minWithdrawalAmount}
                  max={currentVendor?.balance}
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-base font-bold font-mono border border-slate-300 rounded-lg outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payout Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('UPI')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                      withdrawMethod === 'UPI' ? 'bg-emerald-100 border-emerald-500 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    UPI Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('Bank Transfer')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                      withdrawMethod === 'Bank Transfer' ? 'bg-emerald-100 border-emerald-500 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    Bank Transfer
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWithdrawalModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SELLER REGISTRATION                                                */}
      {/* ========================================================================= */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Vernunt Multi-Vendor Marketplace Registration</h3>
              </div>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSeller} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Store / Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BrainyKids Sensory Toys"
                    value={regForm.storeName}
                    onChange={e => setRegForm({ ...regForm, storeName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Business Type</label>
                  <select
                    value={regForm.businessType}
                    onChange={e => setRegForm({ ...regForm, businessType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                  >
                    <option value="Proprietorship">Proprietorship</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Private Limited">Private Limited</option>
                    <option value="LLP">LLP</option>
                    <option value="Individual Artisan">Individual Artisan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    value={regForm.contactPerson}
                    onChange={e => setRegForm({ ...regForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={regForm.phone}
                    onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="vendor@company.com"
                    value={regForm.email}
                    onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              {/* Pickup Address for Courier Vans */}
              <div className="border-t border-slate-200 pt-3">
                <span className="text-xs font-bold text-slate-800 uppercase block mb-1">Courier Pickup Address</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Warehouse / Suite Street"
                    value={regForm.pickupStreet}
                    onChange={e => setRegForm({ ...regForm, pickupStreet: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={regForm.pickupCity}
                    onChange={e => setRegForm({ ...regForm, pickupCity: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden"
                  />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Pickup PIN Code"
                    value={regForm.pickupPincode}
                    onChange={e => setRegForm({ ...regForm, pickupPincode: cleanPincode(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* Primary Serviceable Pincodes */}
              <div className="border-t border-slate-200 pt-3">
                <label className="block text-xs font-bold text-slate-800 mb-1">Primary Serviceable Pincodes (Comma separated)</label>
                <input
                  type="text"
                  placeholder="560001, 560034, 560100, 400001, 110001..."
                  value={regForm.primaryPincodes}
                  onChange={e => setRegForm({ ...regForm, primaryPincodes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-mono"
                />
              </div>

              {/* Agreement */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2">
                <input
                  type="checkbox"
                  id="regSla"
                  checked={regForm.slaAccepted}
                  onChange={e => setRegForm({ ...regForm, slaAccepted: e.target.checked })}
                  className="mt-0.5 rounded-sm text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="regSla" className="text-xs text-slate-600">
                  I confirm that all developmental products sold comply with Vernunt certified non-toxic standards, and agree to the <strong>Marketplace Service Level Agreement (SLA)</strong>.
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  Complete Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
