import React, { useState, useMemo, useEffect } from 'react';
import {
  Store, Package, ShoppingCart, DollarSign, Tag, MessageSquare, Settings,
  Plus, Search, Filter, CheckCircle2, AlertCircle, Clock, Truck, Download,
  Eye, Edit, Trash2, ShieldCheck, ArrowUpRight, ArrowLeft, Users, Building,
  CreditCard, Sparkles, X, Check, Bell, Printer, Share2, AlertTriangle, ChevronRight
} from 'lucide-react';
import { VendorProfile, VendorWithdrawal, VendorInquiry, VendorAnnouncement } from '../../types/vendor.ts';
import { StoreOrder, StoreProduct, StoreCoupon, StoreSettings } from '../../types/store.ts';
import { 
  getStoredVendors, saveStoredVendors, 
  getStoredWithdrawals, saveStoredWithdrawals, 
  INITIAL_INQUIRIES, INITIAL_ANNOUNCEMENTS, 
  getStoredStoreSettings 
} from '../../data/storeVendors.ts';
import { getStoredProducts, saveStoredProducts, getStoredOrders, saveStoredOrders } from '../../data/storeProducts.ts';

interface VendorDashboardProps {
  onBackToStore?: () => void;
  onOpenStorefront?: (vendor: VendorProfile) => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({
  onBackToStore,
  onOpenStorefront
}) => {
  // Master Vendors State
  const [vendors, setVendors] = useState<VendorProfile[]>(getStoredVendors);
  const [activeVendorId, setActiveVendorId] = useState<string>(() => {
    return vendors[0]?.id || 'vend-montessori-minds';
  });

  // Current active vendor
  const currentVendor = useMemo(() => {
    return vendors.find(v => v.id === activeVendorId) || vendors[0];
  }, [vendors, activeVendorId]);

  // Master Products & Orders
  const [products, setProducts] = useState<StoreProduct[]>(getStoredProducts);
  const [orders, setOrders] = useState<StoreOrder[]>(getStoredOrders);
  const [withdrawals, setWithdrawals] = useState<VendorWithdrawal[]>(getStoredWithdrawals);
  const [inquiries, setInquiries] = useState<VendorInquiry[]>(INITIAL_INQUIRIES);
  const [announcements] = useState<VendorAnnouncement[]>(INITIAL_ANNOUNCEMENTS);
  const [storeSettings] = useState<StoreSettings>(getStoredStoreSettings);

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'withdrawals' | 'coupons' | 'inquiries' | 'settings'>('overview');

  // Modals
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [selectedPackingSlipOrder, setSelectedPackingSlipOrder] = useState<StoreOrder | null>(null);

  // Filters
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Forms
  const [productForm, setProductForm] = useState<Partial<StoreProduct>>({
    name: '',
    category: 'Montessori & STEM',
    price: 999,
    regularPrice: 1299,
    ageGroup: '3-6y',
    ageLabel: 'Ages 3 - 6 Years',
    featuredImage: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
    shortDescription: 'Child-safe developmental equipment crafted from sustainable non-toxic materials.',
    description: '100% verified non-toxic, BIS certified, pediatrician approved for safe play.',
    stockQuantity: 30,
    stockStatus: 'instock',
    manageStock: true,
    sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
    hsnCode: '950300',
    gstRate: 12,
    badges: ['100% Non-Toxic', 'BIS Certified'],
    isFeatured: false,
    onSale: true,
    discountPercentage: 23,
    deliveryDaysEstimate: 2
  });

  const [withdrawAmount, setWithdrawAmount] = useState<number>(1000);
  const [withdrawMethod, setWithdrawMethod] = useState<'UPI' | 'Bank Transfer' | 'Paytm'>('UPI');
  const [withdrawNotes, setWithdrawNotes] = useState<string>('');

  // Seller Registration Form
  const [regForm, setRegForm] = useState({
    storeName: '',
    ownerName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    pincode: '',
    category: 'Sensory & STEM Toys',
    gstNumber: '',
    panNumber: '',
    upiId: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    bio: ''
  });

  // Filtered Products for Current Vendor
  const vendorProducts = useMemo(() => {
    if (!currentVendor) return [];
    return products.filter(p => p.vendorId === currentVendor.id || p.brand === currentVendor.storeName);
  }, [products, currentVendor]);

  // Filtered Orders for Current Vendor
  const vendorOrders = useMemo(() => {
    if (!currentVendor) return [];
    return orders.filter(ord => {
      return ord.items.some(item => item.vendorId === currentVendor.id || item.product.vendorId === currentVendor.id || item.product.brand === currentVendor.storeName);
    });
  }, [orders, currentVendor]);

  // Vendor Withdrawals
  const vendorWithdrawalsList = useMemo(() => {
    if (!currentVendor) return [];
    return withdrawals.filter(w => w.vendorId === currentVendor.id);
  }, [withdrawals, currentVendor]);

  // Vendor Inquiries
  const vendorInquiriesList = useMemo(() => {
    if (!currentVendor) return [];
    return inquiries.filter(i => i.vendorId === currentVendor.id);
  }, [inquiries, currentVendor]);

  // Financial Stats
  const stats = useMemo(() => {
    if (!currentVendor) return { grossSales: 0, netEarnings: 0, commissionPaid: 0, ordersCount: 0 };
    const grossSales = currentVendor.totalSales;
    const netEarnings = currentVendor.totalEarnings;
    const commissionRate = currentVendor.commissionRate || storeSettings.globalCommissionRate || 10;
    const commissionPaid = Math.round(grossSales * (commissionRate / 100));
    return {
      grossSales,
      netEarnings,
      commissionPaid,
      ordersCount: vendorOrders.length || currentVendor.totalOrders,
      balance: currentVendor.balance
    };
  }, [currentVendor, vendorOrders, storeSettings]);

  // Handle Add Product Submit
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !currentVendor) return;

    const newProd: StoreProduct = {
      id: 'prod-vend-' + Date.now(),
      name: productForm.name || 'New Developmental Kit',
      slug: (productForm.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      shortDescription: productForm.shortDescription || '',
      description: productForm.description || '',
      price: Number(productForm.price) || 499,
      regularPrice: Number(productForm.regularPrice) || Number(productForm.price) || 499,
      salePrice: Number(productForm.price),
      onSale: Boolean(productForm.onSale),
      discountPercentage: Number(productForm.discountPercentage) || 0,
      sku: productForm.sku || 'SKU-' + Date.now(),
      stockQuantity: Number(productForm.stockQuantity) || 20,
      stockStatus: (productForm.stockQuantity && Number(productForm.stockQuantity) > 0) ? 'instock' : 'outofstock',
      manageStock: true,
      category: productForm.category || 'Montessori & STEM',
      ageGroup: productForm.ageGroup || '3-6y',
      ageLabel: productForm.ageLabel || 'Ages 3 - 6 Years',
      featuredImage: productForm.featuredImage || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
      galleryImages: [productForm.featuredImage || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80'],
      tags: ['Dokan Vendor', currentVendor.storeName, productForm.category || 'Toys'],
      rating: 5.0,
      reviewCount: 1,
      reviews: [],
      qaList: [],
      isFeatured: false,
      badges: productForm.badges || ['BIS Certified'],
      hsnCode: productForm.hsnCode || '950300',
      gstRate: Number(productForm.gstRate) || 12,
      brand: currentVendor.storeName,
      deliveryDaysEstimate: Number(productForm.deliveryDaysEstimate) || 2,
      vendorId: currentVendor.id,
      vendorName: currentVendor.storeName,
      vendorSlug: currentVendor.slug,
      approvalStatus: storeSettings.autoApproveVendorProducts ? 'approved' : 'pending'
    };

    const updated = [newProd, ...products];
    setProducts(updated);
    saveStoredProducts(updated);

    setIsAddProductModalOpen(false);
    alert(`Product "${newProd.name}" added successfully! ${storeSettings.autoApproveVendorProducts ? 'Live on marketplace.' : 'Pending Admin moderation approval.'}`);
  };

  // Handle Request Withdrawal
  const handleRequestWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVendor || withdrawAmount <= 0) return;

    if (withdrawAmount > currentVendor.balance) {
      alert(`Requested amount (₹${withdrawAmount}) exceeds your withdrawable balance (₹${currentVendor.balance}).`);
      return;
    }

    if (withdrawAmount < storeSettings.minWithdrawalAmount) {
      alert(`Minimum withdrawal amount is ₹${storeSettings.minWithdrawalAmount}.`);
      return;
    }

    const payoutDetails = withdrawMethod === 'UPI' 
      ? `UPI: ${currentVendor.bankDetails.upiId || 'seller@upi'}` 
      : `${currentVendor.bankDetails.bankName || 'Bank'} A/C: ${currentVendor.bankDetails.accountNumber} (IFSC: ${currentVendor.bankDetails.ifscCode})`;

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
      adminNotes: withdrawNotes || 'Awaiting Admin 1-Click Payout Release'
    };

    const updatedWithdrawals = [newWithdrawal, ...withdrawals];
    setWithdrawals(updatedWithdrawals);
    saveStoredWithdrawals(updatedWithdrawals);

    // Deduct from temporary vendor balance
    const updatedVendors = vendors.map(v => {
      if (v.id === currentVendor.id) {
        return {
          ...v,
          balance: v.balance - withdrawAmount
        };
      }
      return v;
    });
    setVendors(updatedVendors);
    saveStoredVendors(updatedVendors);

    setIsWithdrawalModalOpen(false);
    alert(`Withdrawal request of ₹${withdrawAmount.toLocaleString('en-IN')} submitted! Admin will process via ${withdrawMethod}.`);
  };

  // Handle Seller Registration
  const handleRegisterSeller = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.storeName || !regForm.email) return;

    const newVendor: VendorProfile = {
      id: 'vend-' + Date.now(),
      slug: regForm.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      storeName: regForm.storeName,
      ownerName: regForm.ownerName || 'Verified Store Manager',
      email: regForm.email,
      phone: regForm.phone || '+91 98765 00000',
      bio: regForm.bio || `Specializing in high-grade ${regForm.category} for growing children. Certified BIS compliant.`,
      logo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
      bannerImage: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=1200&auto=format&fit=crop&q=80',
      address: {
        street: 'Commercial Suite 101',
        city: regForm.city || 'Bengaluru',
        state: regForm.state || 'Karnataka',
        pincode: regForm.pincode || '560001',
        country: 'India'
      },
      status: storeSettings.autoApproveVendors ? 'active' : 'pending',
      isVerified: storeSettings.autoApproveVendors,
      rating: 5.0,
      totalReviews: 0,
      joinedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      gstNumber: regForm.gstNumber || '29AAACV0000R1ZX',
      panNumber: regForm.panNumber || 'AAACV0000R',
      bankDetails: {
        accountHolder: regForm.storeName,
        bankName: regForm.bankName || 'HDFC Bank',
        accountNumber: regForm.accountNumber || '50200019284910',
        ifscCode: regForm.ifscCode || 'HDFC0001042',
        upiId: regForm.upiId || 'seller@upi'
      },
      commissionType: 'percentage',
      commissionRate: storeSettings.globalCommissionRate || 10,
      balance: 0,
      totalSales: 0,
      totalEarnings: 0,
      totalOrders: 0,
      supportEmail: regForm.email,
      supportPhone: regForm.phone
    };

    const updatedVendors = [...vendors, newVendor];
    setVendors(updatedVendors);
    saveStoredVendors(updatedVendors);
    setActiveVendorId(newVendor.id);

    setIsRegisterModalOpen(false);
    alert(`Congratulations! Store "${newVendor.storeName}" has been registered. ${storeSettings.autoApproveVendors ? 'Your store is active!' : 'Status is Pending Admin Verification.'}`);
  };

  // Update order shipment
  const handleUpdateShipping = (orderId: string, status: any) => {
    const updated = orders.map(ord => {
      if (ord.id === orderId) {
        return {
          ...ord,
          orderStatus: status,
          statusHistory: [
            ...ord.statusHistory,
            {
              status,
              timestamp: new Date().toLocaleString(),
              note: `Status updated to ${status} by Vendor ${currentVendor.storeName}.`
            }
          ]
        };
      }
      return ord;
    });
    setOrders(updated);
    saveStoredOrders(updated);
    alert(`Order #${orderId} marked as ${status}. Customer notified.`);
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-800 pb-16 font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-[#1d2327] text-white sticky top-0 z-40 px-4 py-2.5 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBackToStore && (
              <button
                onClick={onBackToStore}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition text-xs flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Marketplace
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-base shadow-xs">
                D
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  Vernunt Dokan Seller Portal
                  <span className="bg-teal-500/20 text-teal-300 text-[10px] font-mono px-2 py-0.2 rounded-full border border-teal-500/40">
                    v3.8 Multi-Vendor
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400">Independent Vendor Marketplace & Payout Console</p>
              </div>
            </div>
          </div>

          {/* Seller Switcher & Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
              <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="text-left">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Active Seller Store</span>
                <select
                  value={activeVendorId}
                  onChange={e => setActiveVendorId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white outline-hidden cursor-pointer"
                >
                  {vendors.map(v => (
                    <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                      {v.storeName} ({v.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {onOpenStorefront && currentVendor && (
              <button
                onClick={() => onOpenStorefront(currentVendor)}
                className="hidden sm:flex items-center gap-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg shadow-sm transition"
              >
                <Eye className="w-3.5 h-3.5" /> View Public Store
              </button>
            )}

            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> + New Seller Account
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        {/* Vendor Profile Brief Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <img
              src={currentVendor?.logo}
              alt={currentVendor?.storeName}
              className="w-14 h-14 rounded-xl object-cover border-2 border-teal-500 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{currentVendor?.storeName}</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                  currentVendor?.status === 'active' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                    : 'bg-amber-50 text-amber-700 border-amber-300'
                }`}>
                  {currentVendor?.status}
                </span>
                {currentVendor?.isVerified && (
                  <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5 border border-teal-200">
                    <ShieldCheck className="w-3 h-3 text-teal-600" /> BIS Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Managed by <strong>{currentVendor?.ownerName}</strong> • {currentVendor?.address.city}, {currentVendor?.address.state} • GSTIN: {currentVendor?.gstNumber || '29AAACV2026R1ZM'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="text-right pr-3 border-r border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Withdrawable Balance</span>
              <span className="text-lg font-extrabold text-emerald-600 font-mono">
                ₹{currentVendor?.balance.toLocaleString('en-IN') || 0}
              </span>
            </div>
            <button
              onClick={() => setIsWithdrawalModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <ArrowUpRight className="w-4 h-4" /> Request Payout
            </button>
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-200 mb-6 bg-white p-1.5 rounded-xl shadow-2xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'overview' ? 'bg-[#1d2327] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Dashboard Overview
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'products' ? 'bg-[#1d2327] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-teal-400" /> Products ({vendorProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'orders' ? 'bg-[#1d2327] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-sky-400" /> Orders ({vendorOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'withdrawals' ? 'bg-[#1d2327] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Withdrawals / Payouts ({vendorWithdrawalsList.length})
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'inquiries' ? 'bg-[#1d2327] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" /> Customer Q&A ({vendorInquiriesList.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'settings' ? 'bg-[#1d2327] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" /> Store Settings
          </button>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: DASHBOARD OVERVIEW                                                */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Lifetime Gross Sales</span>
                <span className="text-2xl font-extrabold text-slate-900 block mt-1 font-mono">
                  ₹{stats.grossSales.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> All customer orders
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Net Seller Earnings</span>
                <span className="text-2xl font-extrabold text-teal-700 block mt-1 font-mono">
                  ₹{stats.netEarnings.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                  After {currentVendor?.commissionRate || 10}% platform fee
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Withdrawable Balance</span>
                <span className="text-2xl font-extrabold text-emerald-600 block mt-1 font-mono">
                  ₹{stats.balance.toLocaleString('en-IN')}
                </span>
                <button
                  onClick={() => setIsWithdrawalModalOpen(true)}
                  className="text-[11px] text-teal-700 font-bold hover:underline mt-1 block"
                >
                  Request Instant Payout →
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Fulfilled Orders</span>
                <span className="text-2xl font-extrabold text-slate-900 block mt-1">
                  {stats.ordersCount}
                </span>
                <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                  {vendorProducts.length} Active Catalog Products
                </span>
              </div>
            </div>

            {/* Announcements Notice */}
            {announcements.length > 0 && (
              <div className="bg-gradient-to-r from-amber-500/10 to-teal-500/10 border border-amber-300/60 p-4 rounded-2xl flex items-start gap-3">
                <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{announcements[0].title}</h4>
                  <p className="text-xs text-slate-700 mt-0.5">{announcements[0].content}</p>
                  <span className="text-[10px] text-slate-500 mt-1 block">Posted by {announcements[0].authorName} • {announcements[0].date}</span>
                </div>
              </div>
            )}

            {/* Quick Actions & Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Orders table */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">Recent Customer Purchases</h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-teal-700 font-bold hover:underline"
                  >
                    View All ({vendorOrders.length}) →
                  </button>
                </div>

                {vendorOrders.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No orders placed for this vendor yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-[11px]">
                          <th className="py-2.5">Order</th>
                          <th className="py-2.5">Customer</th>
                          <th className="py-2.5">Purchased Item</th>
                          <th className="py-2.5">Amount</th>
                          <th className="py-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {vendorOrders.slice(0, 5).map(ord => (
                          <tr key={ord.id} className="hover:bg-slate-50">
                            <td className="py-3 font-mono font-bold text-teal-700">#{ord.orderNumber}</td>
                            <td className="py-3 font-medium">{ord.customerName}</td>
                            <td className="py-3 text-slate-600 line-clamp-1">{ord.items[0]?.product.name}</td>
                            <td className="py-3 font-mono font-bold">₹{ord.totalAmount}</td>
                            <td className="py-3 text-right">
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                {ord.orderStatus.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Vendor Shortcuts & Payout Details */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900">Seller Quick Desk</h3>
                
                <div className="space-y-2">
                  <button
                    onClick={() => setIsAddProductModalOpen(true)}
                    className="w-full p-3 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-xl text-xs font-bold flex items-center justify-between transition"
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-teal-700" /> + Add New Product SKU
                    </span>
                    <ChevronRight className="w-4 h-4 text-teal-600" />
                  </button>

                  <button
                    onClick={() => setIsWithdrawalModalOpen(true)}
                    className="w-full p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-between transition"
                  >
                    <span className="flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-emerald-700" /> Payout Withdrawal Request
                    </span>
                    <ChevronRight className="w-4 h-4 text-emerald-600" />
                  </button>

                  {onOpenStorefront && (
                    <button
                      onClick={() => onOpenStorefront(currentVendor)}
                      className="w-full p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-between transition"
                    >
                      <span className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-slate-600" /> Preview Dokan Store Page
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Commission Split:</span>
                    <strong className="text-slate-900">{100 - (currentVendor?.commissionRate || 10)}% (Seller) / {currentVendor?.commissionRate || 10}% (Platform)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Configured Payout:</span>
                    <strong className="text-slate-900">{currentVendor?.bankDetails.upiId || 'Bank Account'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Min Withdrawal:</span>
                    <strong className="text-slate-900">₹{storeSettings.minWithdrawalAmount}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: PRODUCTS MANAGER                                                  */}
        {/* ========================================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h3 className="font-bold text-base text-slate-900">Seller Product Inventory</h3>
                <p className="text-xs text-slate-500">Manage pricing, stock counts, and regulatory safety attributes.</p>
              </div>
              <button
                onClick={() => setIsAddProductModalOpen(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> Add New Product
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="relative w-full max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by SKU, product name..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <span className="text-xs text-slate-500 shrink-0 font-medium">
                  {vendorProducts.length} items listed
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-[11px] uppercase font-bold">
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">SKU / HSN</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">Moderation</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vendorProducts
                      .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))
                      .map(prod => (
                        <tr key={prod.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 flex items-center gap-3">
                            <img
                              src={prod.featuredImage}
                              alt={prod.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                            />
                            <div>
                              <strong className="text-slate-900 block font-semibold">{prod.name}</strong>
                              <span className="text-[11px] text-slate-500">{prod.category} • {prod.ageLabel}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {prod.sku} <br />
                            <span className="text-slate-400">HSN: {prod.hsnCode || '950300'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-slate-900">₹{prod.price}</span>
                            {prod.regularPrice > prod.price && (
                              <span className="text-slate-400 text-[10px] line-through block">₹{prod.regularPrice}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 font-bold text-xs ${
                              prod.stockQuantity > 5 ? 'text-emerald-700' : 'text-rose-600'
                            }`}>
                              {prod.stockQuantity} in stock
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                              prod.approvalStatus === 'pending'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {prod.approvalStatus || 'Approved'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                const newQty = prompt(`Update stock quantity for "${prod.name}":`, String(prod.stockQuantity));
                                if (newQty !== null && !isNaN(Number(newQty))) {
                                  const updated = products.map(p => p.id === prod.id ? { ...p, stockQuantity: Number(newQty), stockStatus: Number(newQty) > 0 ? 'instock' : 'outofstock' } : p);
                                  setProducts(updated);
                                  saveStoredProducts(updated);
                                }
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-bold"
                            >
                              Stock
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Remove product "${prod.name}" from catalog?`)) {
                                  const updated = products.filter(p => p.id !== prod.id);
                                  setProducts(updated);
                                  saveStoredProducts(updated);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 transition"
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
        {/* VIEW 3: ORDERS DESK                                                       */}
        {/* ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h3 className="font-bold text-base text-slate-900">Seller Order Dispatch Desk</h3>
                <p className="text-xs text-slate-500">Track shipments, generate packing slips, and update logistics tracking.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-[11px] uppercase font-bold">
                      <th className="py-3 px-4">Order & Invoice</th>
                      <th className="py-3 px-4">Customer Details</th>
                      <th className="py-3 px-4">Purchased Items</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Fulfillment Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vendorOrders.map(ord => (
                      <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-mono">
                          <strong className="text-teal-700 block font-bold">#{ord.orderNumber}</strong>
                          <span className="text-[10px] text-slate-400">{ord.invoiceNumber}</span>
                          <span className="text-[10px] text-slate-500 block">{ord.placedAt}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <strong className="text-slate-900 block">{ord.customerName}</strong>
                          <span className="text-[11px] text-slate-500">{ord.shippingAddress.city}, {ord.shippingAddress.pincode}</span>
                          <span className="text-[10px] text-slate-400 block">{ord.customerPhone}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          {ord.items.map(item => (
                            <div key={item.id} className="text-xs text-slate-700">
                              <span className="font-semibold">{item.quantity}x</span> {item.product.name}
                            </div>
                          ))}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-slate-900 font-mono block">₹{ord.totalAmount}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded-sm">
                            {ord.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={ord.orderStatus}
                            onChange={e => handleUpdateShipping(ord.id, e.target.value)}
                            className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2 py-1 outline-hidden"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="packed">Packed</option>
                            <option value="shipped">Shipped</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => setSelectedPackingSlipOrder(ord)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 inline-flex"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-600" /> Packing Slip
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
        {/* VIEW 4: WITHDRAWALS & PAYOUTS                                             */}
        {/* ========================================================================= */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Balance & Request Widget */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-emerald-200 uppercase font-bold tracking-wider block">Available for Settlement</span>
                <span className="text-3xl font-extrabold font-mono mt-1 block">
                  ₹{currentVendor?.balance.toLocaleString('en-IN')}
                </span>
                <p className="text-xs text-emerald-200 mt-1">
                  Settlements are processed via Instant UPI or NEFT direct bank transfer.
                </p>
              </div>

              <button
                onClick={() => setIsWithdrawalModalOpen(true)}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg transition self-start md:self-auto"
              >
                <ArrowUpRight className="w-4 h-4" /> Request Payout Now
              </button>
            </div>

            {/* Payout History Ledger */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Payout & Withdrawal Settlement History</h3>

              {vendorWithdrawalsList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No withdrawal requests recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-[11px] uppercase font-bold">
                        <th className="py-3 px-4">Request #</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Method & Account</th>
                        <th className="py-3 px-4">Transaction Ref</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vendorWithdrawalsList.map(wdr => (
                        <tr key={wdr.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-teal-700">{wdr.withdrawalNumber}</td>
                          <td className="py-3 px-4 text-slate-600">{wdr.requestedAt}</td>
                          <td className="py-3 px-4 font-extrabold font-mono text-slate-900">₹{wdr.amount.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800">{wdr.payoutMethod}</span>
                            <span className="text-[11px] text-slate-500 block">{wdr.payoutDetails}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                            {wdr.transactionRef || 'Pending Settlement'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                              wdr.status === 'processed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {wdr.status}
                            </span>
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
        {/* VIEW 5: INQUIRIES & Q&A                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <h3 className="font-bold text-base text-slate-900">Direct Parent & Buyer Questions</h3>
              <p className="text-xs text-slate-500">Inquiries sent directly from product pages or your Dokan store profile.</p>
            </div>

            {vendorInquiriesList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
                No inquiries received yet.
              </div>
            ) : (
              <div className="space-y-3">
                {vendorInquiriesList.map(inq => (
                  <div key={inq.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm text-slate-900">{inq.customerName}</span>
                        <span className="text-xs text-slate-500 block">{inq.customerEmail} • {inq.date}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        inq.status === 'replied' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inq.status}
                      </span>
                    </div>

                    {inq.productName && (
                      <div className="bg-amber-50 text-amber-900 text-xs px-3 py-1.5 rounded-lg border border-amber-200 inline-block font-semibold">
                        Regarding: {inq.productName}
                      </div>
                    )}

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      <strong>Subject: {inq.subject}</strong>
                      <p className="mt-1">{inq.message}</p>
                    </div>

                    {inq.reply ? (
                      <div className="bg-teal-50/80 p-3.5 rounded-xl border border-teal-200 text-xs text-teal-900">
                        <strong className="block text-teal-800">Your Reply:</strong>
                        <p className="mt-0.5">{inq.reply}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          const replyText = prompt(`Reply to ${inq.customerName}:`);
                          if (replyText) {
                            const updated = inquiries.map(i => i.id === inq.id ? { ...i, reply: replyText, status: 'replied' as const } : i);
                            setInquiries(updated);
                            alert(`Reply sent to ${inq.customerEmail}!`);
                          }
                        }}
                        className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition"
                      >
                        Reply to Parent
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: STORE SETTINGS & BRANDING                                         */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 animate-fadeIn max-w-4xl">
            <div>
              <h3 className="font-bold text-base text-slate-900">Dokan Store Settings & Customization</h3>
              <p className="text-xs text-slate-500">Configure your public storefront banner, payout details, and return policies.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Store settings saved successfully!');
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Store Name</label>
                  <input
                    type="text"
                    defaultValue={currentVendor?.storeName}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Owner / Manager Name</label>
                  <input
                    type="text"
                    defaultValue={currentVendor?.ownerName}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Store Logo Image URL</label>
                  <input
                    type="text"
                    defaultValue={currentVendor?.logo}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Banner Image URL</label>
                  <input
                    type="text"
                    defaultValue={currentVendor?.bannerImage}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Store Bio & Brand Story</label>
                <textarea
                  rows={3}
                  defaultValue={currentVendor?.bio}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3">Bank & UPI Settlement Credentials</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Payout UPI ID</label>
                    <input
                      type="text"
                      defaultValue={currentVendor?.bankDetails.upiId}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bank Name</label>
                    <input
                      type="text"
                      defaultValue={currentVendor?.bankDetails.bankName}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Account Number</label>
                    <input
                      type="text"
                      defaultValue={currentVendor?.bankDetails.accountNumber}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Save Store Settings
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD PRODUCT SKU                                                    */}
      {/* ========================================================================= */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-[#1d2327] text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Add New Product to {currentVendor?.storeName}</h3>
              </div>
              <button onClick={() => setIsAddProductModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Montessori Wooden Stacking Rainbow"
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">MRP / Regular Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.regularPrice}
                    onChange={e => setProductForm({ ...productForm, regularPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={productForm.stockQuantity}
                    onChange={e => setProductForm({ ...productForm, stockQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department Category</label>
                  <select
                    value={productForm.category}
                    onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden bg-white"
                  >
                    <option value="Montessori & STEM">Montessori & STEM</option>
                    <option value="Art & Creative Craft">Art & Creative Craft</option>
                    <option value="Books & Story Sets">Books & Story Sets</option>
                    <option value="Child Safety & Care">Child Safety & Care</option>
                    <option value="Playdate & Outdoor Gear">Playdate & Outdoor Gear</option>
                    <option value="Digital Activity Kits">Digital Activity Kits</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age Suitability</label>
                  <select
                    value={productForm.ageGroup}
                    onChange={e => setProductForm({ ...productForm, ageGroup: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden bg-white"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Featured High-Res Image URL</label>
                <input
                  type="text"
                  value={productForm.featuredImage}
                  onChange={e => setProductForm({ ...productForm, featuredImage: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Short Description (1-2 sentences)</label>
                <textarea
                  rows={2}
                  value={productForm.shortDescription}
                  onChange={e => setProductForm({ ...productForm, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Submit Product SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REQUEST WITHDRAWAL PAYOUT                                          */}
      {/* ========================================================================= */}
      {isWithdrawalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-sm">Request Payout Settlement</h3>
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
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Minimum withdrawal threshold: ₹{storeSettings.minWithdrawalAmount}
                </span>
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
                    Instant UPI Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('Bank Transfer')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                      withdrawMethod === 'Bank Transfer' ? 'bg-emerald-100 border-emerald-500 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    NEFT / Bank Transfer
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Optional Payout Note</label>
                <input
                  type="text"
                  placeholder="e.g. Bi-weekly batch payout"
                  value={withdrawNotes}
                  onChange={e => setWithdrawNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                />
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Confirm Withdrawal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SELLER ONBOARDING REGISTRATION                                     */}
      {/* ========================================================================= */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-5 bg-gradient-to-r from-teal-800 to-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Become a Seller / Vendor on Vernunt</h3>
              </div>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSeller} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Store / Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TinyCrafts Sensory Toys"
                    value={regForm.storeName}
                    onChange={e => setRegForm({ ...regForm, storeName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Owner Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarti Verma"
                    value={regForm.ownerName}
                    onChange={e => setRegForm({ ...regForm, ownerName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Seller Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="seller@brand.com"
                    value={regForm.email}
                    onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={regForm.phone}
                    onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Bengaluru"
                    value={regForm.city}
                    onChange={e => setRegForm({ ...regForm, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="Karnataka"
                    value={regForm.state}
                    onChange={e => setRegForm({ ...regForm, state: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    placeholder="560001"
                    value={regForm.pincode}
                    onChange={e => setRegForm({ ...regForm, pincode: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="29AAACV0000R1ZX"
                    value={regForm.gstNumber}
                    onChange={e => setRegForm({ ...regForm, gstNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payout UPI ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="storename@okhdfcbank"
                    value={regForm.upiId}
                    onChange={e => setRegForm({ ...regForm, upiId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden font-mono"
                  />
                </div>
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
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Submit Seller Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PACKING SLIP                                                       */}
      {/* ========================================================================= */}
      {selectedPackingSlipOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Packing Slip & Delivery Manifest</h3>
                <p className="text-xs text-slate-500 font-mono">#{selectedPackingSlipOrder.orderNumber}</p>
              </div>
              <button onClick={() => setSelectedPackingSlipOrder(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-700 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div><strong>Recipient:</strong> {selectedPackingSlipOrder.customerName}</div>
              <div><strong>Ship To:</strong> {selectedPackingSlipOrder.shippingAddress.addressLine1}, {selectedPackingSlipOrder.shippingAddress.city}, {selectedPackingSlipOrder.shippingAddress.state} - {selectedPackingSlipOrder.shippingAddress.pincode}</div>
              <div><strong>Contact:</strong> {selectedPackingSlipOrder.customerPhone}</div>
              <div><strong>Payment:</strong> {selectedPackingSlipOrder.paymentMethod} ({selectedPackingSlipOrder.paymentStatus.toUpperCase()})</div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Package Contents</span>
              {selectedPackingSlipOrder.items.map(i => (
                <div key={i.id} className="text-xs flex justify-between py-1 border-b border-slate-100">
                  <span>{i.quantity}x {i.product.name}</span>
                  <span className="font-mono font-bold">₹{i.totalPrice}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <Printer className="w-4 h-4" /> Print Packaging Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
