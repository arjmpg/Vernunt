import React, { useState, useMemo } from 'react';
import {
  ShoppingCart, Package, Tag, FileText, Plus, Search, Filter,
  CheckCircle2, AlertCircle, Clock, Truck, Download, Eye, Edit, Trash2,
  DollarSign, Sparkles, Check, X, Printer, ShieldCheck, Box, RefreshCw, BarChart2,
  Store, ToggleLeft, ToggleRight, CreditCard, Send, AlertTriangle, Building,
  ArrowUpRight, Users, ChevronRight, Settings, Sliders, Bell, Layers, Palette
} from 'lucide-react';
import { StoreOrder, StoreProduct, StoreCoupon, ProductOrderStatus, StoreSettings, StoreCategory, StoreAttribute, StoreAttributeTerm } from '../../types/store.ts';
import { VendorProfile, VendorWithdrawal, VendorAnnouncement } from '../../types/vendor.ts';
import { 
  getStoredProducts, saveStoredProducts, 
  getStoredOrders, saveStoredOrders, 
  getStoredCategories, saveStoredCategories,
  getStoredAttributes, saveStoredAttributes,
  STORE_COUPONS, STORE_CATEGORIES 
} from '../../data/storeProducts.ts';
import { 
  getStoredVendors, saveStoredVendors, 
  getStoredWithdrawals, saveStoredWithdrawals, 
  getStoredStoreSettings, saveStoredStoreSettings, 
  INITIAL_ANNOUNCEMENTS 
} from '../../data/storeVendors.ts';
import { StoreInvoiceModal } from '../store/StoreInvoiceModal.tsx';
import { AdminCategoriesDesk } from './AdminCategoriesDesk.tsx';
import { AdminAttributesDesk } from './AdminAttributesDesk.tsx';

interface AdminVernuntCommerceDeskProps {
  onRefresh?: () => void;
}

export const AdminVernuntCommerceDesk: React.FC<AdminVernuntCommerceDeskProps> = () => {
  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories' | 'attributes' | 'vendors' | 'withdrawals' | 'moderation' | 'settings' | 'coupons' | 'taxes'>('orders');

  // Master State
  const [orders, setOrders] = useState<StoreOrder[]>(getStoredOrders);
  const [products, setProducts] = useState<StoreProduct[]>(getStoredProducts);
  const [categories, setCategories] = useState<StoreCategory[]>(getStoredCategories);
  const [attributes, setAttributes] = useState<StoreAttribute[]>(getStoredAttributes);
  const [coupons, setCoupons] = useState<StoreCoupon[]>(STORE_COUPONS);
  const [vendors, setVendors] = useState<VendorProfile[]>(getStoredVendors);
  const [withdrawals, setWithdrawals] = useState<VendorWithdrawal[]>(getStoredWithdrawals);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(getStoredStoreSettings);
  const [announcements, setAnnouncements] = useState<VendorAnnouncement[]>(INITIAL_ANNOUNCEMENTS);

  // Filters
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [productSearch, setProductSearch] = useState<string>('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [vendorSearch, setVendorSearch] = useState<string>('');
  const [categorySearch, setCategorySearch] = useState<string>('');
  const [attributeSearch, setAttributeSearch] = useState<string>('');

  // Modals
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<StoreOrder | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [selectedWithdrawalForAction, setSelectedWithdrawalForAction] = useState<VendorWithdrawal | null>(null);
  const [payoutTxRef, setPayoutTxRef] = useState<string>('');
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState<boolean>(false);
  const [broadcastTitle, setBroadcastTitle] = useState<string>('');
  const [broadcastContent, setBroadcastContent] = useState<string>('');

  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<Partial<StoreCategory>>({
    name: '',
    slug: '',
    icon: '📦',
    description: '',
    ageTag: 'All Ages',
    bannerImage: '',
    thumbnailImage: '',
    displayOrder: 1,
    isFeatured: true,
    subcategories: []
  });
  const [subcategoryInput, setSubcategoryInput] = useState<string>('');

  // Attribute Modal
  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState<boolean>(false);
  const [editingAttribute, setEditingAttribute] = useState<StoreAttribute | null>(null);
  const [attributeFormData, setAttributeFormData] = useState<Partial<StoreAttribute>>({
    name: '',
    slug: '',
    type: 'select',
    description: '',
    isGlobal: true,
    visibleOnProductPage: true,
    terms: []
  });

  // Attribute Terms Manager Modal
  const [selectedAttributeForTerms, setSelectedAttributeForTerms] = useState<StoreAttribute | null>(null);
  const [newTermName, setNewTermName] = useState<string>('');
  const [newTermSlug, setNewTermSlug] = useState<string>('');
  const [newTermColor, setNewTermColor] = useState<string>('#3B82F6');

  // Forms
  const [productFormData, setProductFormData] = useState<Partial<StoreProduct>>({
    name: '',
    brand: 'Vernunt Playgear',
    category: 'Montessori & STEM',
    price: 999,
    regularPrice: 1299,
    ageGroup: '3-6y',
    ageLabel: 'Ages 3 - 6 Yrs',
    featuredImage: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
    shortDescription: 'Certified non-toxic child developmental kit',
    description: '100% child-safe, BIS compliant, therapist-approved play equipment.',
    stockQuantity: 25,
    stockStatus: 'instock',
    manageStock: true,
    sku: 'VRN-NEW-' + Math.floor(100 + Math.random() * 900),
    hsnCode: '950300',
    gstRate: 12,
    badges: ['100% Safe', 'BIS Certified'],
    isFeatured: true,
    isBestSeller: false,
    onSale: true,
    discountPercentage: 23,
    deliveryDaysEstimate: 2
  });

  const [isCouponModalOpen, setIsCouponModalOpen] = useState<boolean>(false);
  const [newCouponCode, setNewCouponCode] = useState<string>('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed_cart' | 'free_shipping'>('percentage');
  const [newCouponAmount, setNewCouponAmount] = useState<number>(15);
  const [newCouponMinSpend, setNewCouponMinSpend] = useState<number>(499);
  const [newCouponDesc, setNewCouponDesc] = useState<string>('Special festive discount for parents');

  // Save Settings Helper
  const handleToggleSetting = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => {
    const updated = {
      ...storeSettings,
      [key]: value
    };
    setStoreSettings(updated);
    saveStoredStoreSettings(updated);
  };

  // Status Change handler
  const handleUpdateOrderStatus = (orderId: string, newStatus: ProductOrderStatus) => {
    const updated = orders.map(ord => {
      if (ord.id === orderId) {
        return {
          ...ord,
          orderStatus: newStatus,
          paymentStatus: (newStatus === 'delivered' ? 'paid' : ord.paymentStatus) as any,
          statusHistory: [
            ...ord.statusHistory,
            {
              status: newStatus,
              timestamp: new Date().toLocaleString(),
              note: `Status updated to ${newStatus.replace('_', ' ')} by Admin Operations.`
            }
          ]
        };
      }
      return ord;
    });
    setOrders(updated);
    saveStoredOrders(updated);
  };

  // Tracking AWB update
  const handleUpdateTracking = (orderId: string, trackingNumber: string, courier: string) => {
    const updated = orders.map(ord => {
      if (ord.id === orderId) {
        return {
          ...ord,
          trackingNumber,
          courierPartner: courier
        };
      }
      return ord;
    });
    setOrders(updated);
    saveStoredOrders(updated);
  };

  // Stock update
  const handleUpdateProductStock = (productId: string, delta: number) => {
    const updated = products.map(p => {
      if (p.id === productId) {
        const newStock = Math.max(0, p.stockQuantity + delta);
        return {
          ...p,
          stockQuantity: newStock,
          stockStatus: (newStock === 0 ? 'outofstock' : newStock < 5 ? 'lowstock' : 'instock') as any
        };
      }
      return p;
    });
    setProducts(updated);
    saveStoredProducts(updated);
  };

  // Vendor Status Toggles (Approve / Suspend / Activate)
  const handleUpdateVendorStatus = (vendorId: string, status: 'active' | 'pending' | 'suspended') => {
    const updated = vendors.map(v => {
      if (v.id === vendorId) {
        return {
          ...v,
          status,
          isVerified: status === 'active'
        };
      }
      return v;
    });
    setVendors(updated);
    saveStoredVendors(updated);
    alert(`Vendor status updated to "${status.toUpperCase()}".`);
  };

  // Override Vendor Commission Rate
  const handleUpdateVendorCommission = (vendorId: string, newRate: number) => {
    const updated = vendors.map(v => {
      if (v.id === vendorId) {
        return {
          ...v,
          commissionRate: newRate
        };
      }
      return v;
    });
    setVendors(updated);
    saveStoredVendors(updated);
    alert(`Custom commission rate of ${newRate}% applied.`);
  };

  // Approve / Process Vendor Withdrawal
  const handleSettleWithdrawal = (withdrawalId: string, txRef: string) => {
    if (!txRef.trim()) {
      alert('Please enter a Bank / UPI Transaction Reference Number as proof.');
      return;
    }

    const updated = withdrawals.map(w => {
      if (w.id === withdrawalId) {
        return {
          ...w,
          status: 'processed' as const,
          transactionRef: txRef,
          processedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        };
      }
      return w;
    });
    setWithdrawals(updated);
    saveStoredWithdrawals(updated);

    setSelectedWithdrawalForAction(null);
    setPayoutTxRef('');
    alert(`Withdrawal marked as Processed & Settled! Proof ref: ${txRef}`);
  };

  // Moderate Vendor Product
  const handleModerateProduct = (productId: string, status: 'approved' | 'rejected') => {
    const updated = products.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          approvalStatus: status
        };
      }
      return p;
    });
    setProducts(updated);
    saveStoredProducts(updated);
    alert(`Product ${status === 'approved' ? 'Approved and is now live on marketplace!' : 'Rejected.'}`);
  };

  // Publish Broadcast to all Vendors
  const handlePublishBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastContent) return;

    const newAnn: VendorAnnouncement = {
      id: 'ann-' + Date.now(),
      title: broadcastTitle,
      content: broadcastContent,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      priority: 'high',
      authorName: 'Vernunt Marketplace Admin'
    };

    setAnnouncements([newAnn, ...announcements]);
    setIsBroadcastModalOpen(false);
    setBroadcastTitle('');
    setBroadcastContent('');
    alert('Broadcast published to all seller dashboard portals!');
  };

  // Save Product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productFormData.name?.trim()) return;

    if (editingProduct) {
      const updated = products.map(p => p.id === editingProduct.id ? ({ ...p, ...productFormData } as StoreProduct) : p);
      setProducts(updated);
      saveStoredProducts(updated);
    } else {
      const newProd: StoreProduct = {
        id: 'prod-' + Date.now(),
        name: productFormData.name!,
        slug: productFormData.slug || productFormData.name!.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        brand: productFormData.brand || 'Vernunt Playgear',
        category: productFormData.category || 'Montessori & STEM',
        price: Number(productFormData.price || 999),
        regularPrice: Number(productFormData.regularPrice || 1299),
        ageGroup: (productFormData.ageGroup as any) || '3-6y',
        ageLabel: productFormData.ageLabel || 'Ages 3 - 6 Yrs',
        featuredImage: productFormData.featuredImage || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
        galleryImages: [productFormData.featuredImage || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80'],
        shortDescription: productFormData.shortDescription || 'Child safety certified developmental toy.',
        description: productFormData.description || 'Child safety certified developmental toy.',
        stockQuantity: Number(productFormData.stockQuantity || 25),
        stockStatus: 'instock',
        manageStock: true,
        sku: productFormData.sku || 'VRN-SKU-' + Date.now().toString().slice(-4),
        hsnCode: productFormData.hsnCode || '950300',
        gstRate: Number(productFormData.gstRate || 12),
        rating: 5.0,
        reviewCount: 1,
        badges: productFormData.badges || ['BIS Certified', '100% Non-Toxic'],
        isFeatured: true,
        isBestSeller: Boolean(productFormData.isBestSeller),
        onSale: Boolean(productFormData.onSale),
        discountPercentage: productFormData.regularPrice && productFormData.price ? Math.round(((productFormData.regularPrice - productFormData.price) / productFormData.regularPrice) * 100) : 15,
        deliveryDaysEstimate: 2,
        tags: ['vernunt', 'playgear', 'safe-toys'],
        reviews: [],
        qaList: [],
        approvalStatus: 'approved'
      };
      const updated = [newProd, ...products];
      setProducts(updated);
      saveStoredProducts(updated);
    }

    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  // Add Coupon
  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;

    const newC: StoreCoupon = {
      id: 'coup-' + Date.now(),
      code: newCouponCode.trim().toUpperCase(),
      discountType: newCouponType,
      amount: Number(newCouponAmount),
      description: newCouponDesc,
      minSpend: Number(newCouponMinSpend),
      usageCount: 0,
      isActive: true
    };

    setCoupons([newC, ...coupons]);
    setNewCouponCode('');
    setIsCouponModalOpen(false);
  };

  // Category Handlers
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name?.trim()) return;

    const slug = categoryFormData.slug?.trim() || categoryFormData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (editingCategory) {
      const updated = categories.map(c => c.id === editingCategory.id ? ({
        ...c,
        ...categoryFormData,
        slug
      } as StoreCategory) : c);
      setCategories(updated);
      saveStoredCategories(updated);
    } else {
      const newCat: StoreCategory = {
        id: slug || 'cat-' + Date.now(),
        name: categoryFormData.name!,
        slug,
        icon: categoryFormData.icon || '📦',
        description: categoryFormData.description || 'Vernunt premium category department',
        ageTag: categoryFormData.ageTag || 'All Ages',
        bannerImage: categoryFormData.bannerImage || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=1200&auto=format&fit=crop&q=80',
        thumbnailImage: categoryFormData.thumbnailImage || categoryFormData.bannerImage || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&auto=format&fit=crop&q=80',
        displayOrder: Number(categoryFormData.displayOrder || categories.length + 1),
        isFeatured: Boolean(categoryFormData.isFeatured),
        subcategories: categoryFormData.subcategories && categoryFormData.subcategories.length > 0 ? categoryFormData.subcategories : ['General', 'Trending Essentials']
      };
      const updated = [...categories, newCat];
      setCategories(updated);
      saveStoredCategories(updated);
    }

    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (catId: string) => {
    if (confirm('Are you sure you want to delete this category? Products in this category will remain in the catalog.')) {
      const updated = categories.filter(c => c.id !== catId);
      setCategories(updated);
      saveStoredCategories(updated);
    }
  };

  // Attribute Handlers
  const handleSaveAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attributeFormData.name?.trim()) return;

    const slug = attributeFormData.slug?.trim() || 'pa_' + attributeFormData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (editingAttribute) {
      const updated = attributes.map(a => a.id === editingAttribute.id ? ({
        ...a,
        ...attributeFormData,
        slug
      } as StoreAttribute) : a);
      setAttributes(updated);
      saveStoredAttributes(updated);
    } else {
      const newAttr: StoreAttribute = {
        id: 'attr-' + Date.now(),
        name: attributeFormData.name!,
        slug,
        type: attributeFormData.type || 'select',
        description: attributeFormData.description || '',
        isGlobal: attributeFormData.isGlobal !== false,
        visibleOnProductPage: attributeFormData.visibleOnProductPage !== false,
        terms: attributeFormData.terms || []
      };
      const updated = [...attributes, newAttr];
      setAttributes(updated);
      saveStoredAttributes(updated);
    }

    setIsAttributeModalOpen(false);
    setEditingAttribute(null);
  };

  const handleDeleteAttribute = (attrId: string) => {
    if (confirm('Are you sure you want to delete this product attribute?')) {
      const updated = attributes.filter(a => a.id !== attrId);
      setAttributes(updated);
      saveStoredAttributes(updated);
    }
  };

  const handleAddTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttributeForTerms || !newTermName.trim()) return;

    const termSlug = newTermSlug.trim() || newTermName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newTerm: StoreAttributeTerm = {
      id: 'term-' + Date.now(),
      name: newTermName.trim(),
      slug: termSlug,
      colorHex: selectedAttributeForTerms.type === 'color' ? newTermColor : undefined
    };

    const updatedAttrList = attributes.map(a => {
      if (a.id === selectedAttributeForTerms.id) {
        const terms = [...(a.terms || []), newTerm];
        const updated = { ...a, terms };
        setSelectedAttributeForTerms(updated);
        return updated;
      }
      return a;
    });

    setAttributes(updatedAttrList);
    saveStoredAttributes(updatedAttrList);
    setNewTermName('');
    setNewTermSlug('');
  };

  const handleDeleteTerm = (termId: string) => {
    if (!selectedAttributeForTerms) return;
    const updatedAttrList = attributes.map(a => {
      if (a.id === selectedAttributeForTerms.id) {
        const terms = (a.terms || []).filter(t => t.id !== termId);
        const updated = { ...a, terms };
        setSelectedAttributeForTerms(updated);
        return updated;
      }
      return a;
    });

    setAttributes(updatedAttrList);
    saveStoredAttributes(updatedAttrList);
  };

  // Filtered Lists
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      if (orderStatusFilter !== 'all' && ord.orderStatus !== orderStatusFilter) return false;
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const matchNum = ord.orderNumber.toLowerCase().includes(q);
        const matchName = ord.customerName.toLowerCase().includes(q);
        const matchPhone = ord.customerPhone.toLowerCase().includes(q);
        const matchEmail = ord.customerEmail.toLowerCase().includes(q);
        if (!matchNum && !matchName && !matchPhone && !matchEmail) return false;
      }
      return true;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (productCategoryFilter !== 'all' && !p.category.toLowerCase().includes(productCategoryFilter.toLowerCase())) return false;
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase();
        const matchTitle = p.name.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchBrand = (p.brand || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSku && !matchBrand) return false;
      }
      return true;
    });
  }, [products, productSearch, productCategoryFilter]);

  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      if (categorySearch.trim()) {
        const q = categorySearch.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [categories, categorySearch]);

  const filteredAttributes = useMemo(() => {
    return attributes.filter(a => {
      if (attributeSearch.trim()) {
        const q = attributeSearch.toLowerCase();
        return a.name.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [attributes, attributeSearch]);

  const pendingModerationProducts = useMemo(() => {
    return products.filter(p => p.approvalStatus === 'pending');
  }, [products]);

  const pendingWithdrawals = useMemo(() => {
    return withdrawals.filter(w => w.status === 'pending');
  }, [withdrawals]);

  // High level financial metrics
  const totalGrossRevenue = useMemo(() => orders.reduce((acc, o) => acc + o.totalAmount, 0), [orders]);
  const totalTaxGst = useMemo(() => orders.reduce((acc, o) => acc + (o.taxAmountGst || 0), 0), [orders]);
  const totalVendorBalances = useMemo(() => vendors.reduce((acc, v) => acc + v.balance, 0), [vendors]);
  const avgOrderValue = useMemo(() => orders.length ? Math.round(totalGrossRevenue / orders.length) : 0, [orders, totalGrossRevenue]);

  return (
    <div className="space-y-6 animate-fadeIn font-sans" id="admin-vernunt-commerce-desk">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-gradient-to-tr from-slate-900 to-[#1d2327] text-amber-400 font-bold shadow-xs">
            <Store className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Vernunt Commerce &amp; Dokan Marketplace Suite
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                Admin Master Control
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Full control over Store Switches (COD, UPI), Multi-Vendor Dokan Sellers, Payout Settlements &amp; GST Invoices
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBroadcastModalOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
          >
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span>Broadcast to Vendors</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Catalog Product</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Gross Sales Revenue</span>
          <span className="text-2xl font-black font-mono text-slate-900 block mt-1">₹{totalGrossRevenue.toLocaleString('en-IN')}</span>
          <span className="text-[10.5px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
            <Sparkles className="w-3 h-3" /> Live in-app orders &amp; UPI
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Dokan Marketplace Vendors</span>
          <span className="text-2xl font-black font-mono text-teal-700 block mt-1">{vendors.length} Stores</span>
          <span className="text-[10.5px] text-slate-500 font-medium">
            {vendors.filter(v => v.status === 'active').length} Active • {vendors.filter(v => v.status === 'pending').length} Pending
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Pending Payouts to Release</span>
          <span className="text-2xl font-black font-mono text-amber-600 block mt-1">
            {pendingWithdrawals.length} Requests
          </span>
          <span className="text-[10.5px] text-amber-700 font-medium">
            ₹{pendingWithdrawals.reduce((a, b) => a + b.amount, 0).toLocaleString('en-IN')} awaiting transfer
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">GST Taxes Collected</span>
          <span className="text-2xl font-black font-mono text-blue-700 block mt-1">₹{totalTaxGst.toLocaleString('en-IN')}</span>
          <span className="text-[10.5px] text-blue-600 font-medium">100% Tax Invoice Ready</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-1.5 overflow-x-auto no-scrollbar bg-slate-100/70 p-1 rounded-xl">
        {[
          { id: 'orders', label: `📦 Orders (${orders.length})` },
          { id: 'products', label: `🧸 Products (${products.length})` },
          { id: 'categories', label: `📁 Categories & Kids Food (${categories.length})` },
          { id: 'attributes', label: `🏷️ Attributes & Terms (${attributes.length})` },
          { id: 'vendors', label: `🏪 Dokan Vendors (${vendors.length})` },
          { id: 'withdrawals', label: `💳 Seller Payouts (${pendingWithdrawals.length})` },
          { id: 'moderation', label: `🛡️ Moderation (${pendingModerationProducts.length})` },
          { id: 'settings', label: `⚙️ Store Switches & COD` },
          { id: 'coupons', label: `🎉 Coupons (${coupons.length})` },
          { id: 'taxes', label: '📊 GST Reports' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: ORDERS & DELIVERIES                                             */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Order ID, Buyer Name, Phone or Email..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-hidden focus:border-teal-500 font-medium"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Status:</span>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-hidden font-medium"
              >
                <option value="all">All Orders ({orders.length})</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10.5px]">
                    <th className="py-3 px-4">Order / Invoice</th>
                    <th className="py-3 px-4">Customer &amp; Contact</th>
                    <th className="py-3 px-4">Items / SKU</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Fulfillment Status</th>
                    <th className="py-3 px-4">Courier / AWB</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No orders matching the search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 font-mono block">#{order.orderNumber}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{order.invoiceNumber}</span>
                          <span className="text-[10px] text-slate-500 block">{order.placedAt}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800 block">{order.customerName}</span>
                          <span className="text-[10.5px] text-slate-500">{order.customerPhone}</span>
                          <span className="text-[10px] text-slate-400 block">{order.customerEmail}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {order.items.map(item => (
                              <div key={item.id} className="text-[11px] text-slate-700 flex items-center gap-1.5">
                                <span className="font-bold text-teal-700 bg-teal-50 px-1 py-0.2 rounded-xs">
                                  {item.quantity}x
                                </span>
                                <span className="truncate max-w-[160px]" title={item.product.name}>
                                  {item.product.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold font-mono text-slate-900 text-sm">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                          {order.discountAmount > 0 && (
                            <span className="text-[10px] text-emerald-600 block">(-₹{order.discountAmount} promo)</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase block text-center max-w-[90px] ${
                            order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {order.paymentStatus}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium block mt-0.5 text-center">
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={order.orderStatus}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as ProductOrderStatus)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 outline-hidden cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="packed">Packed</option>
                            <option value="shipped">Shipped</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          {order.trackingNumber ? (
                            <div className="font-mono text-[10.5px]">
                              <span className="text-slate-900 font-bold block">{order.courierPartner}</span>
                              <span className="text-slate-500">{order.trackingNumber}</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const courier = prompt('Enter Courier Partner (e.g. Delhivery, BlueDart, XpressBees):', 'Delhivery Express');
                                if (!courier) return;
                                const awb = prompt('Enter Tracking AWB Number:', 'AWB-' + Math.floor(10000000 + Math.random() * 90000000));
                                if (!awb) return;
                                handleUpdateTracking(order.id, awb, courier);
                              }}
                              className="text-[10.5px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded-md transition"
                            >
                              + Assign AWB
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceOrder(order)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="Generate Official GST Invoice PDF"
                          >
                            <FileText className="w-4 h-4" />
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
      {/* SUBTAB 2: PRODUCTS & STOCK                                                */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by title, SKU, brand..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-hidden focus:border-teal-500 font-medium"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Category:</span>
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-hidden font-medium"
              >
                <option value="all">All Departments ({products.length})</option>
                {STORE_CATEGORIES.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10.5px]">
                    <th className="py-3 px-4">Product Item</th>
                    <th className="py-3 px-4">Seller / Brand</th>
                    <th className="py-3 px-4">Category &amp; Age</th>
                    <th className="py-3 px-4">Price / MRP</th>
                    <th className="py-3 px-4">Stock Status</th>
                    <th className="py-3 px-4">GST Rate</th>
                    <th className="py-3 px-4 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map(prod => (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.featuredImage}
                            alt={prod.name}
                            className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{prod.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku} • HSN: {prod.hsnCode}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{prod.vendorName || prod.brand || 'Vernunt Store'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700 block">{prod.category}</span>
                        <span className="text-[10.5px] text-teal-700 font-semibold">{prod.ageLabel}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold font-mono text-slate-900 text-sm">₹{prod.price.toLocaleString('en-IN')}</span>
                        {prod.regularPrice > prod.price && (
                          <span className="text-[10.5px] text-slate-400 line-through block">₹{prod.regularPrice.toLocaleString('en-IN')}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateProductStock(prod.id, -1)}
                            className="w-5 h-5 rounded-xs bg-slate-200 hover:bg-slate-300 font-bold flex items-center justify-center text-xs text-slate-700"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-slate-900 min-w-[28px] text-center">
                            {prod.stockQuantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateProductStock(prod.id, 5)}
                            className="w-5 h-5 rounded-xs bg-slate-200 hover:bg-slate-300 font-bold flex items-center justify-center text-xs text-slate-700"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                        {prod.gstRate || 12}% GST
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(prod);
                            setProductFormData(prod);
                            setIsProductModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="Edit Product Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${prod.name}?`)) {
                              const updated = products.filter(p => p.id !== prod.id);
                              setProducts(updated);
                              saveStoredProducts(updated);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
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
      {/* SUBTAB: CATEGORIES MANAGER (WOOCOMMERCE STYLE)                            */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <AdminCategoriesDesk />
      )}

      {/* ========================================================================= */}
      {/* SUBTAB: ATTRIBUTES & TERMS (WOOCOMMERCE STYLE)                            */}
      {/* ========================================================================= */}
      {activeTab === 'attributes' && (
        <AdminAttributesDesk />
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: DOKAN MARKETPLACE VENDORS                                       */}
      {/* ========================================================================= */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <h3 className="font-bold text-base text-slate-900">Dokan Multi-Vendor Stores &amp; Sellers</h3>
              <p className="text-xs text-slate-500">Approve new sellers, configure commission splits, and manage store statuses.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Global Default Commission:</span>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-xs font-extrabold rounded-lg">
                {storeSettings.globalCommissionRate}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10.5px]">
                    <th className="py-3 px-4">Store Profile</th>
                    <th className="py-3 px-4">Owner &amp; Location</th>
                    <th className="py-3 px-4">Lifetime Sales</th>
                    <th className="py-3 px-4">Net Balance</th>
                    <th className="py-3 px-4">Commission</th>
                    <th className="py-3 px-4">Status &amp; Verification</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendors.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <img
                          src={v.logo}
                          alt={v.storeName}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <strong className="text-slate-900 block font-bold">{v.storeName}</strong>
                          <span className="text-[10px] text-slate-400">GST: {v.gstNumber || '29AAACV2026R1ZM'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">{v.ownerName}</span>
                        <span className="text-[11px] text-slate-500">{v.address.city}, {v.address.state}</span>
                        <span className="text-[10px] text-slate-400 block">{v.email}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        ₹{v.totalSales.toLocaleString('en-IN')}
                        <span className="text-[10px] text-slate-400 font-normal block">{v.totalOrders} orders</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-600">
                        ₹{v.balance.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {v.commissionRate}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={v.status}
                          onChange={(e) => handleUpdateVendorStatus(v.id, e.target.value as any)}
                          className={`text-xs font-bold rounded-lg px-2 py-1 border outline-hidden ${
                            v.status === 'active' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                            v.status === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                            'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          <option value="active">Active &amp; Approved</option>
                          <option value="pending">Pending Moderation</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            const newRate = prompt(`Update platform commission rate (%) for ${v.storeName}:`, String(v.commissionRate));
                            if (newRate !== null && !isNaN(Number(newRate))) {
                              handleUpdateVendorCommission(v.id, Number(newRate));
                            }
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold inline-flex items-center gap-1"
                        >
                          <Sliders className="w-3 h-3" /> Commission
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
      {/* SUBTAB 4: WITHDRAWALS & PAYOUTS                                           */}
      {/* ========================================================================= */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <h3 className="font-bold text-base text-slate-900">Seller Payout &amp; Withdrawal Approval Desk</h3>
              <p className="text-xs text-slate-500">Release earnings to sellers via UPI or Bank IMPS/NEFT transfer with audit records.</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-semibold block">Total Withdrawable in System:</span>
              <strong className="text-base font-extrabold text-emerald-600 font-mono">₹{totalVendorBalances.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10.5px]">
                    <th className="py-3 px-4">Request #</th>
                    <th className="py-3 px-4">Seller Store</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method &amp; Account Details</th>
                    <th className="py-3 px-4">Requested On</th>
                    <th className="py-3 px-4">Status &amp; Proof</th>
                    <th className="py-3 px-4 text-right">Settlement Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawals.map(wdr => (
                    <tr key={wdr.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-700">#{wdr.withdrawalNumber}</td>
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 block font-bold">{wdr.vendorName}</strong>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold font-mono text-slate-900 text-sm">
                        ₹{wdr.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800">{wdr.payoutMethod}</span>
                        <span className="text-[11px] text-slate-500 block font-mono">{wdr.payoutDetails}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{wdr.requestedAt}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          wdr.status === 'processed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          {wdr.status}
                        </span>
                        {wdr.transactionRef && (
                          <span className="text-[10px] text-slate-500 block font-mono mt-0.5">
                            Ref: {wdr.transactionRef}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {wdr.status === 'pending' ? (
                          <button
                            onClick={() => {
                              setSelectedWithdrawalForAction(wdr);
                              setPayoutTxRef('UPI-TXN-' + Math.floor(10000000 + Math.random() * 90000000));
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1 inline-flex"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve &amp; Settle
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 justify-end">
                            <CheckCircle2 className="w-4 h-4" /> Settled
                          </span>
                        )}
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
      {/* SUBTAB 5: PRODUCT MODERATION                                              */}
      {/* ========================================================================= */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <h3 className="font-bold text-base text-slate-900">Vendor Product Moderation &amp; Safety Review</h3>
              <p className="text-xs text-slate-500">Ensure all marketplace items comply with BIS child safety and non-toxic regulations before going live.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            {pendingModerationProducts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                All vendor catalog submissions have been reviewed and approved.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10.5px]">
                      <th className="py-3 px-4">Submitted Product</th>
                      <th className="py-3 px-4">Seller Store</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Safety &amp; Compliance</th>
                      <th className="py-3 px-4 text-right">Moderation Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingModerationProducts.map(prod => (
                      <tr key={prod.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <img
                            src={prod.featuredImage}
                            alt={prod.name}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                          />
                          <div>
                            <strong className="text-slate-900 block font-bold">{prod.name}</strong>
                            <span className="text-xs text-slate-500">{prod.shortDescription}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {prod.vendorName || prod.brand}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold font-mono text-slate-900">
                          ₹{prod.price}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            BIS Certified • Non-Toxic
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleModerateProduct(prod.id, 'approved')}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                          >
                            Approve to Marketplace
                          </button>
                          <button
                            onClick={() => handleModerateProduct(prod.id, 'rejected')}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 6: STORE SWITCHES & FEATURE TOGGLES                                */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Main Switches Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-teal-600" />
                Store Payment Methods &amp; Checkout Switchboard
              </h3>
              <p className="text-xs text-slate-500">Enable or disable specific payment gateways in real-time across customer checkout.</p>
            </div>

            {/* Payment Method Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Razorpay Gateway */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-600" />
                    <strong className="text-xs text-slate-900 font-bold">Razorpay Payment Gateway (UPI, Cards, NetBanking)</strong>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Unified all-in-one payment gateway for UPI (GPay/PhonePe), Cards, NetBanking &amp; Wallets</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleSetting('enableRazorpay', !storeSettings.enableRazorpay)}
                  className={`p-1 rounded-full transition cursor-pointer ${
                    storeSettings.enableRazorpay !== false ? 'text-teal-600' : 'text-slate-400'
                  }`}
                >
                  {storeSettings.enableRazorpay !== false ? (
                    <ToggleRight className="w-8 h-8 fill-teal-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8" />
                  )}
                </button>
              </div>

              {/* Cash on Delivery */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <strong className="text-xs text-slate-900 font-bold">Cash on Delivery (COD)</strong>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Allow parents to pay cash on doorstep delivery</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !storeSettings.enableCashOnDelivery;
                    handleToggleSetting('enableCashOnDelivery', nextVal);
                    handleToggleSetting('enableCOD', nextVal);
                  }}
                  className={`p-1 rounded-full transition cursor-pointer ${
                    storeSettings.enableCashOnDelivery ? 'text-teal-600' : 'text-slate-400'
                  }`}
                >
                  {storeSettings.enableCashOnDelivery ? (
                    <ToggleRight className="w-8 h-8 fill-teal-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8" />
                  )}
                </button>
              </div>
            </div>

            {/* Dokan Marketplace Configuration */}
            <div className="border-t border-slate-200 pt-6">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3">Dokan Multi-Vendor Marketplace Rules</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Global Marketplace Commission (%)</label>
                  <input
                    type="number"
                    value={storeSettings.globalCommissionRate}
                    onChange={(e) => handleToggleSetting('globalCommissionRate', Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Platform retention from seller sales</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Payout Threshold (₹)</label>
                  <input
                    type="number"
                    value={storeSettings.minWithdrawalAmount}
                    onChange={(e) => handleToggleSetting('minWithdrawalAmount', Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Minimum balance required to withdraw</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">COD Handling Fee (₹)</label>
                  <input
                    type="number"
                    value={storeSettings.codExtraFee}
                    onChange={(e) => handleToggleSetting('codExtraFee', Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Convenience surcharge for cash orders</span>
                </div>
              </div>
            </div>

            {/* Shipping & Delivery Configuration */}
            <div className="border-t border-slate-200 pt-6">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3">Shipping &amp; Logistics Thresholds</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Delivery Fee (₹)</label>
                  <input
                    type="number"
                    value={storeSettings.standardShippingFee}
                    onChange={(e) => handleToggleSetting('standardShippingFee', Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Free Delivery Min Threshold (₹)</label>
                  <input
                    type="number"
                    value={storeSettings.freeShippingThreshold}
                    onChange={(e) => handleToggleSetting('freeShippingThreshold', Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Express 24-Hour Delivery Fee (₹)</label>
                  <input
                    type="number"
                    value={storeSettings.expressShippingFee}
                    onChange={(e) => handleToggleSetting('expressShippingFee', Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 7: COUPONS                                                         */}
      {/* ========================================================================= */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Active Discount Coupons</h3>
              <p className="text-xs text-slate-500">Managed coupons with automatic checkout validation</p>
            </div>
            <button
              type="button"
              onClick={() => setIsCouponModalOpen(true)}
              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" /> + New Coupon
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10.5px]">
                    <th className="py-3 px-4">Coupon Code</th>
                    <th className="py-3 px-4">Discount Type</th>
                    <th className="py-3 px-4">Discount Value</th>
                    <th className="py-3 px-4">Min Spend</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-teal-700">{c.code}</td>
                      <td className="py-3 px-4 capitalize font-medium">{c.discountType.replace('_', ' ')}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {c.discountType === 'percentage' ? `${c.amount}%` : `₹${c.amount}`}
                      </td>
                      <td className="py-3 px-4 font-mono">₹{c.minSpend || 0}</td>
                      <td className="py-3 px-4 text-slate-600">{c.description}</td>
                      <td className="py-3 px-4">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Active
                        </span>
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
      {/* SUBTAB 8: GST TAX REPORT                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'taxes' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-base text-slate-900">GST Monthly Filing Report &amp; Audit</h3>
            <p className="text-xs text-slate-600">
              Tax summary prepared for GSTR-1, GSTR-3B filings under Indian Goods &amp; Services Tax compliance.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Taxable Value</span>
                <span className="text-lg font-bold font-mono text-slate-900">₹{(totalGrossRevenue - totalTaxGst).toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Integrated / Central GST</span>
                <span className="text-lg font-bold font-mono text-blue-700">₹{totalTaxGst.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Vernunt Registered GSTIN</span>
                <span className="text-xs font-bold font-mono text-slate-900">29AAACV2026R1ZM</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SETTLE WITHDRAWAL PAYOUT                                           */}
      {/* ========================================================================= */}
      {selectedWithdrawalForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Approve &amp; Settle Seller Payout</h3>
              <button onClick={() => setSelectedWithdrawalForAction(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between">
                <span>Vendor Store:</span>
                <strong className="text-slate-900">{selectedWithdrawalForAction.vendorName}</strong>
              </div>
              <div className="flex justify-between">
                <span>Payout Amount:</span>
                <strong className="text-emerald-700 text-sm font-mono font-bold">₹{selectedWithdrawalForAction.amount.toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between">
                <span>Destination:</span>
                <strong className="text-slate-900">{selectedWithdrawalForAction.payoutDetails}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank / UPI Transaction Reference Number *</label>
              <input
                type="text"
                required
                value={payoutTxRef}
                onChange={e => setPayoutTxRef(e.target.value)}
                placeholder="e.g. UPI-TXN-293849102938"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedWithdrawalForAction(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSettleWithdrawal(selectedWithdrawalForAction.id, payoutTxRef)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BROADCAST TO VENDORS                                               */}
      {/* ========================================================================= */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-500" /> Broadcast to All Sellers
              </h3>
              <button onClick={() => setIsBroadcastModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishBroadcast} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Announcement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Festive Play Week Guidelines & Fast Payouts"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Broadcast Content *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter details for all seller portal dashboards..."
                  value={broadcastContent}
                  onChange={e => setBroadcastContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Publish Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRODUCT MODAL                                                             */}
      {/* ========================================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingProduct ? 'Edit Catalog Product' : 'Add New Child Play Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={productFormData.name || ''}
                  onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                  placeholder="e.g. Montessori Sensory Balance Stepping Stones"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={productFormData.price || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">MRP / Regular Price (₹)</label>
                  <input
                    type="number"
                    value={productFormData.regularPrice || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, regularPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category Department</label>
                  <select
                    value={productFormData.category || 'Montessori & STEM'}
                    onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden"
                  >
                    {STORE_CATEGORIES.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Age Suitability</label>
                  <select
                    value={productFormData.ageGroup || '3-6y'}
                    onChange={(e) => {
                      const val = e.target.value;
                      const labelMap: Record<string, string> = {
                        '0-12m': 'Ages 0 - 12 Mos',
                        '1-3y': 'Ages 1 - 3 Yrs',
                        '3-6y': 'Ages 3 - 6 Yrs',
                        '6-10y': 'Ages 6 - 10 Yrs',
                        'all-ages': 'All Ages'
                      };
                      setProductFormData({
                        ...productFormData,
                        ageGroup: val as any,
                        ageLabel: labelMap[val] || 'All Ages'
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden"
                  >
                    <option value="0-12m">0 - 12 Months</option>
                    <option value="1-3y">1 - 3 Years</option>
                    <option value="3-6y">3 - 6 Years</option>
                    <option value="6-10y">6 - 10 Years</option>
                    <option value="all-ages">All Ages</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Featured Image URL</label>
                <input
                  type="url"
                  value={productFormData.featuredImage || ''}
                  onChange={(e) => setProductFormData({ ...productFormData, featuredImage: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={productFormData.shortDescription || ''}
                  onChange={(e) => setProductFormData({ ...productFormData, shortDescription: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Stock Count</label>
                  <input
                    type="number"
                    value={productFormData.stockQuantity || 20}
                    onChange={(e) => setProductFormData({ ...productFormData, stockQuantity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">GST Tax Rate (%)</label>
                  <input
                    type="number"
                    value={productFormData.gstRate || 12}
                    onChange={(e) => setProductFormData({ ...productFormData, gstRate: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg transition"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COUPON MODAL                                                              */}
      {/* ========================================================================= */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Create Promo Discount Coupon</h3>
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Coupon Code (Uppercase) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FESTIVE20"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs uppercase font-mono font-bold outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Type</label>
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_cart">Flat ₹ Discount</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Value</label>
                  <input
                    type="number"
                    value={newCouponAmount}
                    onChange={(e) => setNewCouponAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Minimum Spend (₹)</label>
                <input
                  type="number"
                  value={newCouponMinSpend}
                  onChange={(e) => setNewCouponMinSpend(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description / Campaign Label</label>
                <input
                  type="text"
                  value={newCouponDesc}
                  onChange={(e) => setNewCouponDesc(e.target.value)}
                  placeholder="e.g. Welcome gift for new parents"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg transition cursor-pointer"
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CATEGORY MODAL (WooCommerce-Style)                                        */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-600" />
                {editingCategory ? 'Edit Product Category' : 'Create New Product Category'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Category Title *</label>
                  <input
                    type="text"
                    required
                    value={categoryFormData.name || ''}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setCategoryFormData({ ...categoryFormData, name, slug: categoryFormData.slug ? categoryFormData.slug : slug });
                    }}
                    placeholder="e.g. Kids Food & Organic Nutrition"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden focus:border-teal-500 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Emoji Icon</label>
                  <input
                    type="text"
                    value={categoryFormData.icon || '🥑'}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
                    placeholder="🥑, 🧩, 🎨"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-center text-lg outline-hidden focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Slug (URL Permastring)</label>
                  <input
                    type="text"
                    value={categoryFormData.slug || ''}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="e.g. kids-food"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Age Suitability Tag</label>
                  <input
                    type="text"
                    value={categoryFormData.ageTag || ''}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, ageTag: e.target.value })}
                    placeholder="e.g. 0 - 10 Years, 6m - 3y"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category Description</label>
                <textarea
                  rows={2}
                  value={categoryFormData.description || ''}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  placeholder="Describe this category for parents and buyers..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Banner Image URL</label>
                  <input
                    type="url"
                    value={categoryFormData.bannerImage || ''}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, bannerImage: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Thumbnail Square Image URL</label>
                  <input
                    type="url"
                    value={categoryFormData.thumbnailImage || ''}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, thumbnailImage: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono outline-hidden"
                  />
                </div>
              </div>

              {/* Subcategories Chip Builder */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Subcategory Filters</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(categoryFormData.subcategories || []).map((sub, sidx) => (
                    <span
                      key={sidx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-800 text-xs font-semibold rounded-lg border border-teal-200"
                    >
                      {sub}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (categoryFormData.subcategories || []).filter((_, i) => i !== sidx);
                          setCategoryFormData({ ...categoryFormData, subcategories: updated });
                        }}
                        className="hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add subcategory (e.g. Sprouted Porridges, Melts, Biscuits)..."
                    value={subcategoryInput}
                    onChange={(e) => setSubcategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (subcategoryInput.trim()) {
                          const current = categoryFormData.subcategories || [];
                          if (!current.includes(subcategoryInput.trim())) {
                            setCategoryFormData({ ...categoryFormData, subcategories: [...current, subcategoryInput.trim()] });
                          }
                          setSubcategoryInput('');
                        }
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (subcategoryInput.trim()) {
                        const current = categoryFormData.subcategories || [];
                        if (!current.includes(subcategoryInput.trim())) {
                          setCategoryFormData({ ...categoryFormData, subcategories: [...current, subcategoryInput.trim()] });
                        }
                        setSubcategoryInput('');
                      }
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={categoryFormData.isFeatured || false}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, isFeatured: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  Feature prominently on Store Categories Hub
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg transition cursor-pointer"
                >
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ATTRIBUTE MODAL (WooCommerce-Style)                                       */}
      {/* ========================================================================= */}
      {isAttributeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-600" />
                {editingAttribute ? 'Edit Product Attribute' : 'Create Global Product Attribute'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAttributeModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttribute} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Attribute Name *</label>
                <input
                  type="text"
                  required
                  value={attributeFormData.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = 'pa_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setAttributeFormData({ ...attributeFormData, name, slug: attributeFormData.slug ? attributeFormData.slug : slug });
                  }}
                  placeholder="e.g. Flavor, Pack Size, Age Stage, Material"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Slug (Taxonomy identifier)</label>
                  <input
                    type="text"
                    value={attributeFormData.slug || ''}
                    onChange={(e) => setAttributeFormData({ ...attributeFormData, slug: e.target.value.toLowerCase() })}
                    placeholder="pa_flavor"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Display Control Type</label>
                  <select
                    value={attributeFormData.type || 'select'}
                    onChange={(e) => setAttributeFormData({ ...attributeFormData, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden font-medium"
                  >
                    <option value="select">Dropdown Select Menu</option>
                    <option value="button">Button / Pill Chips</option>
                    <option value="color">Color Swatch Palette</option>
                    <option value="text">Plain Text</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={attributeFormData.description || ''}
                  onChange={(e) => setAttributeFormData({ ...attributeFormData, description: e.target.value })}
                  placeholder="Attribute usage notes (e.g. Available flavor options for kid porridges and purees)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-hidden"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={attributeFormData.isGlobal !== false}
                    onChange={(e) => setAttributeFormData({ ...attributeFormData, isGlobal: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Enable as Global Attribute (available across all product categories)
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={attributeFormData.visibleOnProductPage !== false}
                    onChange={(e) => setAttributeFormData({ ...attributeFormData, visibleOnProductPage: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Visible on Product Detail Page &amp; Cart Variation Selectors
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAttributeModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg transition cursor-pointer"
                >
                  {editingAttribute ? 'Update Attribute' : 'Save Attribute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ATTRIBUTE TERMS MANAGER MODAL (WooCommerce-Style)                         */}
      {/* ========================================================================= */}
      {selectedAttributeForTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Configure Terms: <span className="text-indigo-700">{selectedAttributeForTerms.name}</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">{selectedAttributeForTerms.slug} • Type: {selectedAttributeForTerms.type}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAttributeForTerms(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Term Form */}
            <form onSubmit={handleAddTerm} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800 block text-xs">Add New Term / Option</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Term Name (e.g. Banana & Almond)"
                    value={newTermName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewTermName(val);
                      if (!newTermSlug) setNewTermSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Slug (e.g. banana-almond)"
                    value={newTermSlug}
                    onChange={(e) => setNewTermSlug(e.target.value.toLowerCase())}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono outline-hidden"
                  />
                </div>
              </div>

              {selectedAttributeForTerms.type === 'color' && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold">Swatch Color:</span>
                  <input
                    type="color"
                    value={newTermColor}
                    onChange={(e) => setNewTermColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                  />
                  <span className="font-mono text-slate-700">{newTermColor}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-xs transition cursor-pointer"
              >
                + Add Term to {selectedAttributeForTerms.name}
              </button>
            </form>

            {/* Terms List */}
            <div className="space-y-2">
              <span className="font-bold text-slate-800 text-xs block">
                Existing Configured Terms ({selectedAttributeForTerms.terms?.length || 0})
              </span>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                {selectedAttributeForTerms.terms && selectedAttributeForTerms.terms.length > 0 ? (
                  selectedAttributeForTerms.terms.map(term => (
                    <div key={term.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                      <div className="flex items-center gap-2">
                        {term.colorHex && (
                          <span className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: term.colorHex }} />
                        )}
                        <span className="font-bold text-slate-800">{term.name}</span>
                        <span className="text-[10.5px] font-mono text-slate-400">({term.slug})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTerm(term.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                        title="Delete Term"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400 text-xs italic">
                    No terms added yet. Add terms above to make them selectable on products.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedAttributeForTerms(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GST INVOICE MODAL                                                         */}
      {/* ========================================================================= */}
      {selectedInvoiceOrder && (
        <StoreInvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
};
