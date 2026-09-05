export type VendorStatus = 'active' | 'pending' | 'suspended' | 'rejected';

export interface VendorBankDetails {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId?: string;
}

export interface VendorAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface VendorReview {
  id: string;
  buyerName: string;
  rating: number;
  comment: string;
  date: string;
  productPurchased?: string;
}

export interface VendorProfile {
  id: string;
  slug: string;
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  bio: string;
  logo: string;
  bannerImage: string;
  address: VendorAddress;
  status: VendorStatus;
  isVerified: boolean;
  isFeatured?: boolean;
  rating: number;
  totalReviews: number;
  joinedDate: string;
  gstNumber?: string;
  panNumber?: string;
  bankDetails: VendorBankDetails;
  commissionType?: 'percentage' | 'fixed';
  commissionRate?: number; // Custom commission override for this vendor (e.g. 8% instead of global 10%)
  balance: number; // Current withdrawable wallet balance (₹)
  totalSales: number; // Lifetime gross sales
  totalEarnings: number; // Lifetime net earnings after commission
  totalOrders: number; // Total fulfilled orders
  socialLinks?: {
    instagram?: string;
    website?: string;
    youtube?: string;
  };
  returnPolicy?: string;
  supportPhone?: string;
  supportEmail?: string;
  vacationMode?: {
    enabled: boolean;
    message: string;
  };
}

export type WithdrawalStatus = 'pending' | 'approved' | 'processed' | 'rejected';

export interface VendorWithdrawal {
  id: string;
  withdrawalNumber: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  payoutMethod: 'UPI' | 'Bank Transfer' | 'Paytm';
  payoutDetails: string; // e.g. "UPI: vernunt.crafts@okaxis" or "HDFC A/C: ******4892"
  status: WithdrawalStatus;
  requestedAt: string;
  processedAt?: string;
  transactionRef?: string;
  adminNotes?: string;
}

export interface VendorInquiry {
  id: string;
  vendorId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  productName?: string;
  subject: string;
  message: string;
  date: string;
  status: 'open' | 'replied' | 'closed';
  reply?: string;
  repliedAt?: string;
}

export interface VendorAnnouncement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'normal' | 'high' | 'urgent';
  targetVendorId?: string; // If null/undefined, broadcast to all vendors
  authorName: string;
}
