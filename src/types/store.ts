export interface ProductAttribute {
  name: string; // e.g. 'Size', 'Age Kit', 'Color', 'Bundle'
  options: string[]; // e.g. ['Starter Kit', 'Pro Kit', 'Deluxe Bundle']
}

export interface ProductVariation {
  id: string;
  sku: string;
  attributes: Record<string, string>; // { 'Size': 'Standard', 'Color': 'Teal' }
  price: number;
  regularPrice: number;
  stockQuantity: number;
  inStock: boolean;
  imageUrl?: string;
}

export interface ProductReview {
  id: string;
  authorName: string;
  authorLocation?: string;
  authorPhoto?: string;
  childAge?: string;
  rating: number; // 1-5
  date: string;
  title: string;
  comment: string;
  verifiedBuyer: boolean;
  helpfulCount: number;
  images?: string[];
}

export interface ProductQA {
  id: string;
  question: string;
  askedBy: string;
  date: string;
  answer: string;
  answeredBy: string; // e.g., 'Vernunt Certified Pediatric Gear Specialist'
}

export interface StoreProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  regularPrice: number;
  salePrice?: number;
  onSale: boolean;
  discountPercentage?: number;
  sku: string;
  stockQuantity: number;
  stockStatus: 'instock' | 'outofstock' | 'onbackorder';
  manageStock: boolean;
  lowStockThreshold?: number;
  category: string; // e.g., 'Montessori & STEM', 'Art & Craft', 'Safety & Health', 'Kids Books', 'Baby & Toddler', 'Playdate Gear', 'Digital Activity Kits'
  subcategory?: string;
  ageGroup: '0-12m' | '1-3y' | '3-6y' | '6-10y' | '10-14y' | 'all-ages';
  ageLabel: string; // e.g. 'Ages 2-5 Years'
  featuredImage: string;
  galleryImages: string[];
  tags: string[];
  attributes?: ProductAttribute[];
  variations?: ProductVariation[];
  rating: number;
  reviewCount: number;
  reviews: ProductReview[];
  qaList: ProductQA[];
  isFeatured: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isDigital?: boolean;
  digitalDownloadUrl?: string;
  digitalFileType?: string;
  weightGrams?: number;
  dimensionsCm?: { length: number; width: number; height: number };
  badges: string[]; // e.g., ['BIS Certified', 'BPA-Free', 'Organic Wood', '1-Day Dispatch', 'Free Shipping']
  hsnCode?: string;
  gstRate: number; // 0, 5, 12, 18 percent
  brand: string;
  deliveryDaysEstimate: number;
  vendorId?: string;
  vendorName?: string;
  vendorSlug?: string;
  approvalStatus?: 'approved' | 'pending' | 'rejected' | 'draft';
}

export interface CartItem {
  id: string; // Unique cart item ID (product ID + variation hash)
  productId: string;
  product: StoreProduct;
  selectedAttributes: Record<string, string>;
  selectedVariationId?: string;
  quantity: number;
  unitPrice: number;
  unitRegularPrice: number;
  gstRate: number;
  totalPrice: number;
  vendorId?: string;
  vendorName?: string;
}

export interface StoreSettings {
  // Payment Options
  enableRazorpay: boolean;
  enableCOD: boolean;
  enableCashOnDelivery?: boolean;
  codExtraFee: number;
  codMinOrder: number;
  codMaxOrder: number;
  enableUPI?: boolean;
  enableUpi?: boolean;
  enableCards?: boolean;
  enableNetBanking?: boolean;
  enableWallet?: boolean;

  // Shipping & Logistics
  standardShippingFee: number;
  freeShippingThreshold: number;
  expressShippingFee: number;
  enableInstantDelivery: boolean;
  instantDeliveryFee: number;

  // General & Taxes
  storeName: string;
  defaultGstRate: number;
  gstinNumber: string;
  storeCurrency: string;
  currencySymbol: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  showAnnouncementBanner: boolean;
  announcementBannerText: string;

  // Dokan Multi-Vendor Configuration
  allowVendorRegistration: boolean;
  autoApproveVendors: boolean;
  autoApproveVendorProducts: boolean;
  globalCommissionType: 'percentage' | 'fixed';
  globalCommissionRate: number; // e.g. 10%
  minWithdrawalAmount: number; // e.g. 1000 INR
  allowedPayoutMethods: ('UPI' | 'Bank Transfer' | 'Paytm')[];
  allowVendorCustomCoupons: boolean;
  showVendorInfoOnProduct: boolean;
  vendorVerificationRequired: boolean;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  enableRazorpay: true,
  enableCOD: true,
  enableCashOnDelivery: true,
  codExtraFee: 0,
  codMinOrder: 299,
  codMaxOrder: 15000,
  enableUPI: true,
  enableCards: true,
  enableNetBanking: true,
  enableWallet: true,

  standardShippingFee: 49,
  freeShippingThreshold: 499,
  expressShippingFee: 99,
  enableInstantDelivery: true,
  instantDeliveryFee: 149,

  storeName: 'Vernunt Store',
  defaultGstRate: 12,
  gstinNumber: '29AAACV2026R1ZM',
  storeCurrency: 'INR',
  currencySymbol: '₹',
  maintenanceMode: false,
  maintenanceMessage: 'Vernunt Store is undergoing brief scheduled maintenance. Orders will resume shortly.',
  showAnnouncementBanner: true,
  announcementBannerText: '✨ FREE Express Delivery on all Playgear orders above ₹499 • 100% Non-Toxic & BIS Certified',

  allowVendorRegistration: true,
  autoApproveVendors: false,
  autoApproveVendorProducts: false,
  globalCommissionType: 'percentage',
  globalCommissionRate: 10, // 10% marketplace commission
  minWithdrawalAmount: 500, // ₹500 minimum payout threshold
  allowedPayoutMethods: ['UPI', 'Bank Transfer', 'Paytm'],
  allowVendorCustomCoupons: true,
  showVendorInfoOnProduct: true,
  vendorVerificationRequired: true
};

export interface CustomerAddress {
  fullName: string;
  phone: string;
  email: string;
  pincode: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  addressType: 'Home' | 'Office' | 'Daycare';
  isDefault?: boolean;
}

export type PaymentMethod = 'Razorpay' | 'COD' | 'UPI' | 'Card' | 'NetBanking' | 'VernuntWallet';

export type OrderStatus = 
  | 'pending'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type ProductOrderStatus = OrderStatus;

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  note: string;
  location?: string;
}

export interface StoreOrder {
  id: string;
  orderNumber: string; // e.g., 'VRN-2026-8901'
  invoiceNumber: string; // e.g., 'INV-VRN-8901'
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: CustomerAddress;
  billingAddress: CustomerAddress;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  appliedCouponCode?: string;
  appliedPointsDiscount?: number;
  appliedPointsCount?: number;
  shippingFee: number;
  shippingMethod: 'standard' | 'express' | 'instant';
  taxAmountGst: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  paymentReferenceId?: string; // UPI ref or Gateway txn id
  orderStatus: OrderStatus;
  statusHistory: OrderStatusHistory[];
  trackingNumber?: string;
  courierPartner?: string; // e.g., 'BlueDart Express', 'Delhivery Priority', 'Shadowfax 24h'
  placedAt: string;
  deliveredAt?: string;
  notes?: string;
  canCancel: boolean;
  canReturn: boolean;
}

export interface StoreCoupon {
  id?: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed_cart' | 'free_shipping';
  amount: number; // e.g. 15 for 15% or 200 for ₹200
  minSpend?: number;
  maxDiscount?: number;
  expiryDate?: string;
  usageLimitPerUser?: number;
  usageCount: number;
  isActive: boolean;
  highlightText?: string;
}

export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  bannerImage?: string;
  thumbnailImage?: string;
  itemCount?: number;
  parentId?: string;
  parentName?: string;
  isFeatured?: boolean;
  displayOrder?: number;
  ageTag?: string; // e.g. '0-3y', '3-7y', 'All Ages'
  ageRange?: string; // Compatibility alias
  subcategories?: string[];
}

export interface StoreAttributeTerm {
  id: string;
  name: string; // e.g. 'Alphonso Mango', '100g Pouch', 'Organic Sprouted'
  slug: string;
  colorHex?: string;
  description?: string;
  count?: number;
}

export interface StoreAttribute {
  id: string;
  name: string; // e.g. 'Flavor / Taste', 'Pack Size / Weight', 'Dietary Type', 'Material'
  slug: string;
  type: 'select' | 'button' | 'color' | 'text';
  terms: StoreAttributeTerm[];
  isGlobal: boolean;
  description?: string;
  visibleOnProductPage: boolean;
}
