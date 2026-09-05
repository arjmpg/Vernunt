import React, { useState, useMemo } from 'react';
import {
  Store, Star, ShieldCheck, MapPin, Mail, Phone, Calendar, ArrowLeft,
  MessageSquare, ShoppingBag, Filter, CheckCircle2, RotateCcw, AlertTriangle,
  ExternalLink, Sparkles, Truck, Heart
} from 'lucide-react';
import { VendorProfile } from '../../types/vendor.ts';
import { StoreProduct } from '../../types/store.ts';
import { VendorInquiryModal } from './VendorInquiryModal.tsx';

interface VendorStorePageProps {
  vendor: VendorProfile;
  products: StoreProduct[];
  onBack: () => void;
  onSelectProduct: (product: StoreProduct) => void;
  onAddToCart: (product: StoreProduct) => void;
}

export const VendorStorePage: React.FC<VendorStorePageProps> = ({
  vendor,
  products,
  onBack,
  onSelectProduct,
  onAddToCart
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'reviews' | 'policies'>('products');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedAge, setSelectedAge] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);

  // Vendor's specific products
  const vendorProducts = useMemo(() => {
    return products.filter(p => p.vendorId === vendor.id || p.vendorSlug === vendor.slug || p.brand === vendor.storeName);
  }, [products, vendor]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let result = [...vendorProducts];

    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category.toLowerCase().includes(categoryFilter.toLowerCase()));
    }

    if (selectedAge !== 'all') {
      result = result.filter(p => p.ageGroup === selectedAge || p.ageGroup === 'all-ages');
    }

    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [vendorProducts, categoryFilter, selectedAge, sortBy]);

  // Unique categories for this vendor
  const vendorCategories = useMemo(() => {
    const cats = new Set<string>();
    vendorProducts.forEach(p => cats.add(p.category));
    return Array.from(cats);
  }, [vendorProducts]);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-16 animate-fadeIn">
      {/* Top Breadcrumb & Back Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-teal-700 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Vernunt Marketplace
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">Verified Dokan Marketplace Seller</span>
            {vendor.isVerified && (
              <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-200">
                <ShieldCheck className="w-3 h-3 text-teal-600" /> BIS Verified Store
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Vendor Store Header & Hero Banner */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Banner */}
          <div className="h-44 md:h-64 relative bg-slate-800">
            <img
              src={vendor.bannerImage}
              alt={vendor.storeName}
              className="w-full h-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            
            {vendor.vacationMode?.enabled && (
              <div className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Vacation Mode Active
              </div>
            )}
          </div>

          {/* Profile & Info Bar */}
          <div className="p-6 relative -mt-16 md:-mt-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex items-start md:items-end gap-4">
                <img
                  src={vendor.logo}
                  alt={vendor.storeName}
                  className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-4 border-white shadow-xl bg-white shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900">{vendor.storeName}</h1>
                    {vendor.isVerified && (
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Seller
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{vendor.ownerName}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1">
                    <span className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {vendor.rating} ({vendor.totalReviews} Parent Reviews)
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {vendor.address.city}, {vendor.address.state}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Member since {vendor.joinedDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0">
                <button
                  onClick={() => setIsInquiryModalOpen(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                  Contact Store
                </button>
                {vendor.supportPhone && (
                  <a
                    href={`tel:${vendor.supportPhone}`}
                    className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                    title="Call Seller Support"
                  >
                    <Phone className="w-4 h-4 text-slate-500" />
                  </a>
                )}
                {vendor.supportEmail && (
                  <a
                    href={`mailto:${vendor.supportEmail}`}
                    className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                    title="Email Seller Support"
                  >
                    <Mail className="w-4 h-4 text-slate-500" />
                  </a>
                )}
              </div>
            </div>

            {/* Store Bio */}
            <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-700 leading-relaxed max-w-4xl">
              {vendor.bio}
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Products Listed</span>
                <span className="text-base font-bold text-slate-900">{vendorProducts.length} Play Kits</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Orders Fulfilled</span>
                <span className="text-base font-bold text-slate-900">{vendor.totalOrders}+ Completed</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Safety Compliance</span>
                <span className="text-base font-bold text-emerald-700">100% BIS Pass</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Avg Dispatch Time</span>
                <span className="text-base font-bold text-slate-900">Within 24 Hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'products'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Store Catalog ({vendorProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400" />
            Parent Reviews ({vendor.totalReviews})
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'policies'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Store & Return Policy
          </button>
        </div>

        {/* TAB 1: STORE PRODUCTS */}
        {activeTab === 'products' && (
          <div className="mt-6 space-y-6">
            {/* Filter & Sort controls */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition ${
                    categoryFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All ({vendorProducts.length})
                </button>
                {vendorCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition ${
                      categoryFilter === cat
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Age & Sort Select */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <select
                  value={selectedAge}
                  onChange={e => setSelectedAge(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg text-slate-700 bg-white"
                >
                  <option value="all">All Age Groups</option>
                  <option value="0-12m">0 - 12 Months</option>
                  <option value="1-3y">1 - 3 Years</option>
                  <option value="3-6y">3 - 6 Years</option>
                  <option value="6-10y">6 - 10 Years</option>
                </select>

                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg text-slate-700 bg-white"
                >
                  <option value="featured">Featured First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-2">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No products matching the selected filter</h4>
                <p className="text-xs text-slate-500">Try switching categories or age filters above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition flex flex-col group"
                  >
                    {/* Product Image */}
                    <div 
                      onClick={() => onSelectProduct(product)}
                      className="relative h-48 bg-slate-100 overflow-hidden cursor-pointer"
                    >
                      <img
                        src={product.featuredImage}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      {product.onSale && (
                        <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                          {product.discountPercentage}% OFF
                        </span>
                      )}
                      <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-md backdrop-blur-xs">
                        {product.ageLabel}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{product.category}</span>
                          <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {product.rating}
                          </span>
                        </div>
                        <h3 
                          onClick={() => onSelectProduct(product)}
                          className="text-xs font-bold text-slate-800 line-clamp-2 hover:text-teal-700 cursor-pointer"
                        >
                          {product.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{product.shortDescription}</p>
                      </div>

                      {/* Pricing & Add to Cart */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-extrabold text-slate-900">₹{product.price.toLocaleString('en-IN')}</span>
                            {product.regularPrice > product.price && (
                              <span className="text-xs text-slate-400 line-through">₹{product.regularPrice}</span>
                            )}
                          </div>
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <Truck className="w-3 h-3" /> {product.deliveryDaysEstimate === 0 ? 'Instant Download' : `${product.deliveryDaysEstimate}-Day Delivery`}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(product);
                          }}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Verified Parent Feedback for {vendor.storeName}</h3>
                <p className="text-xs text-slate-500">Collected from certified buyers across India</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-amber-600 flex items-center gap-1 justify-end">
                  <Star className="w-6 h-6 fill-amber-400 text-amber-400" /> {vendor.rating}
                </span>
                <span className="text-xs text-slate-500">{vendor.totalReviews} Total Verified Reviews</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-800">Radhika Narang (Bengaluru)</span>
                  <span className="text-[11px] text-slate-400">August 2026</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  "Ordered the wooden sensory balancing kit from {vendor.storeName}. The packaging was eco-friendly and there were zero sharp edges. My 2-year old twins play with it daily."
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-800">Siddharth Sen (Mumbai)</span>
                  <span className="text-[11px] text-slate-400">August 2026</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  "Prompt delivery within 24 hours. The seller answered all my WhatsApp queries about lead-free vegetable dyes before ordering."
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: POLICIES */}
        {activeTab === 'policies' && (
          <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                <RotateCcw className="w-4 h-4 text-teal-600" /> Return & Refund Policy
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                {vendor.returnPolicy || '7 Days Replacement or Refund if the product arrives damaged or defective. Must be in original packaging.'}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-teal-600" /> Shipping & Fulfillment Guidelines
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                Orders placed before 2:00 PM are dispatched same-day via BlueDart or Delhivery Priority Air. Tracking ID is issued via SMS/WhatsApp upon courier pickup.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" /> GST & Legal Business Identity
              </h3>
              <div className="text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><strong>Registered Legal Entity:</strong> {vendor.storeName}</div>
                <div><strong>GSTIN Number:</strong> {vendor.gstNumber || '29AAACV2026R1ZM'}</div>
                <div><strong>Registered City:</strong> {vendor.address.city}, {vendor.address.state}</div>
                <div><strong>Authorized Contact:</strong> {vendor.supportEmail || vendor.email}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inquiry Modal */}
      {isInquiryModalOpen && (
        <VendorInquiryModal
          vendor={vendor}
          onClose={() => setIsInquiryModalOpen(false)}
          onSubmit={(inq) => {
            console.log('Inquiry submitted:', inq);
          }}
        />
      )}
    </div>
  );
};
