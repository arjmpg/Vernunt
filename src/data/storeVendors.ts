import { VendorProfile, VendorWithdrawal, VendorInquiry, VendorAnnouncement } from '../types/vendor.ts';
import { StoreSettings, DEFAULT_STORE_SETTINGS } from '../types/store.ts';

export const INITIAL_VENDORS: VendorProfile[] = [
  {
    id: 'vend-montessori-minds',
    slug: 'montessori-minds-india',
    storeName: 'Montessori Minds India',
    ownerName: 'Dr. Sunita Deshmukh (Pediatric Montessori Trainer)',
    email: 'sunita@montessoriminds.in',
    phone: '+91 98234 11092',
    bio: 'Pioneering sensory-rich, open-ended Montessori wooden developmental gear hand-crafted from sustainably harvested neem and beechwood. 100% lead-free vegetable dyed.',
    logo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=1200&auto=format&fit=crop&q=80',
    address: {
      street: '42 Woodcraft Estate, Phase 2',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411038',
      country: 'India'
    },
    status: 'active',
    isVerified: true,
    isFeatured: true,
    rating: 4.9,
    totalReviews: 128,
    joinedDate: '12 Jan 2026',
    gstNumber: '27AABCM9102K1Z9',
    panNumber: 'AABCM9102K',
    bankDetails: {
      accountHolder: 'Montessori Minds LLP',
      bankName: 'HDFC Bank',
      accountNumber: '50200084729104',
      ifscCode: 'HDFC0001042',
      upiId: 'montessoriminds@hdfcbank'
    },
    commissionType: 'percentage',
    commissionRate: 10,
    balance: 14250,
    totalSales: 94800,
    totalEarnings: 85320,
    totalOrders: 68,
    socialLinks: {
      instagram: 'https://instagram.com/montessoriminds',
      website: 'https://montessoriminds.in'
    },
    returnPolicy: '7 Days Hassle-Free Return if unboxed with original packaging and seal intact.',
    supportPhone: '+91 98234 11092',
    supportEmail: 'support@montessoriminds.in',
    vacationMode: {
      enabled: false,
      message: 'Store is currently accepting all standard express dispatches.'
    }
  },
  {
    id: 'vend-brainy-stem',
    slug: 'brainy-blocks-stem-labs',
    storeName: 'BrainyBlocks STEM Labs',
    ownerName: 'Vikramaditya Iyer (Robotics Engineer & Father)',
    email: 'vikram@brainyblocks.co.in',
    phone: '+91 97112 88401',
    bio: 'Age-adaptive STEM robotics, hydraulic science models, and hands-on coding kits for young inquisitive minds aged 4 to 12. Approved by school STEM councils.',
    logo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
    address: {
      street: 'Tower 4, Electronic City',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560100',
      country: 'India'
    },
    status: 'active',
    isVerified: true,
    isFeatured: true,
    rating: 4.8,
    totalReviews: 94,
    joinedDate: '05 Feb 2026',
    gstNumber: '29AAFCB3891P1ZX',
    panNumber: 'AAFCB3891P',
    bankDetails: {
      accountHolder: 'BrainyBlocks Innovations Private Limited',
      bankName: 'ICICI Bank',
      accountNumber: '000205018923',
      ifscCode: 'ICIC0000002',
      upiId: 'brainyblocks@icici'
    },
    commissionType: 'percentage',
    commissionRate: 8, // VIP discounted commission rate
    balance: 8900,
    totalSales: 67500,
    totalEarnings: 62100,
    totalOrders: 42,
    returnPolicy: '10 Days Replacement for any technical or electronic malfunction.',
    supportPhone: '+91 97112 88401',
    supportEmail: 'care@brainyblocks.co.in'
  },
  {
    id: 'vend-kiddysafe',
    slug: 'kiddysafe-child-protection',
    storeName: 'KiddySafe Protection & Health',
    ownerName: 'Neha & Anuj Singhania',
    email: 'hello@kiddysafe.com',
    phone: '+91 98910 22340',
    bio: 'Pediatrician-tested child safety proofing essentials, medical grade BPA-free silicone tableware, anti-skid bath mats, and real-time baby safety accessories.',
    logo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=1200&auto=format&fit=crop&q=80',
    address: {
      street: 'Sector 62, Industrial Area',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201309',
      country: 'India'
    },
    status: 'active',
    isVerified: true,
    rating: 4.7,
    totalReviews: 56,
    joinedDate: '20 Feb 2026',
    gstNumber: '09AAECK1290M1ZY',
    panNumber: 'AAECK1290M',
    bankDetails: {
      accountHolder: 'KiddySafe Enterprises',
      bankName: 'Axis Bank',
      accountNumber: '918020048192039',
      ifscCode: 'UTIB0000120',
      upiId: 'kiddysafe@axisbank'
    },
    commissionType: 'percentage',
    commissionRate: 10,
    balance: 4200,
    totalSales: 31200,
    totalEarnings: 28080,
    totalOrders: 27,
    supportPhone: '+91 98910 22340',
    supportEmail: 'support@kiddysafe.com'
  },
  {
    id: 'vend-littlesprouts',
    slug: 'little-sprouts-sensory-crafts',
    storeName: 'Little Sprouts Sensory & Arts',
    ownerName: 'Rashmi Menon',
    email: 'rashmi@littlesprouts.org',
    phone: '+91 94471 90231',
    bio: 'Artisanal organic modeling clays, botanical water colours, textured sensory touch-and-feel tactile playdoughs crafted with edible food-grade ingredients.',
    logo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&auto=format&fit=crop&q=80',
    address: {
      street: 'Kaloor Kadavanthra Road',
      city: 'Kochi',
      state: 'Kerala',
      pincode: '682017',
      country: 'India'
    },
    status: 'pending', // Pending Admin KYC verification
    isVerified: false,
    rating: 5.0,
    totalReviews: 4,
    joinedDate: '27 Feb 2026',
    gstNumber: '32AABCR9912K1Z4',
    panNumber: 'AABCR9912K',
    bankDetails: {
      accountHolder: 'Little Sprouts Crafts',
      bankName: 'State Bank of India',
      accountNumber: '30491029481',
      ifscCode: 'SBIN0004071',
      upiId: 'littlesprouts@sbi'
    },
    commissionType: 'percentage',
    commissionRate: 10,
    balance: 0,
    totalSales: 0,
    totalEarnings: 0,
    totalOrders: 0,
    supportPhone: '+91 94471 90231',
    supportEmail: 'care@littlesprouts.org'
  }
];

export const INITIAL_WITHDRAWALS: VendorWithdrawal[] = [
  {
    id: 'wdr-2026-001',
    withdrawalNumber: 'WDR-901',
    vendorId: 'vend-montessori-minds',
    vendorName: 'Montessori Minds India',
    amount: 25000,
    payoutMethod: 'Bank Transfer',
    payoutDetails: 'HDFC A/C: ******9104 | IFSC: HDFC0001042',
    status: 'processed',
    requestedAt: '22 Feb 2026',
    processedAt: '23 Feb 2026',
    transactionRef: 'NEFT-HDFC-902184910',
    adminNotes: 'Settled regular bi-weekly sales cycle.'
  },
  {
    id: 'wdr-2026-002',
    withdrawalNumber: 'WDR-902',
    vendorId: 'vend-brainy-stem',
    vendorName: 'BrainyBlocks STEM Labs',
    amount: 18000,
    payoutMethod: 'UPI',
    payoutDetails: 'UPI: brainyblocks@icici',
    status: 'processed',
    requestedAt: '24 Feb 2026',
    processedAt: '25 Feb 2026',
    transactionRef: 'UPI-ICICI-491028491',
    adminNotes: 'Instant UPI payout approved.'
  },
  {
    id: 'wdr-2026-003',
    withdrawalNumber: 'WDR-903',
    vendorId: 'vend-montessori-minds',
    vendorName: 'Montessori Minds India',
    amount: 14000,
    payoutMethod: 'UPI',
    payoutDetails: 'UPI: montessoriminds@hdfcbank',
    status: 'pending',
    requestedAt: '28 Feb 2026',
    adminNotes: 'Awaiting Admin 1-click payout approval.'
  }
];

export const INITIAL_INQUIRIES: VendorInquiry[] = [
  {
    id: 'inq-01',
    vendorId: 'vend-montessori-minds',
    customerName: 'Ananya Sharma',
    customerEmail: 'ananya.s@gmail.com',
    customerPhone: '+91 98200 48102',
    productName: 'Montessori Wooden Geometric Sensory Blocks',
    subject: 'Is the paint water-soluble or saliva safe?',
    message: 'Hello, my toddler is 14 months old and tends to chew everything. Are the dyes completely non-toxic and organic?',
    date: '27 Feb 2026',
    status: 'replied',
    reply: 'Dear Ananya, absolutely! All our toys use natural plant-based vegetable dyes and are certified 100% lead-free under BIS IS-9873 standards.',
    repliedAt: '27 Feb 2026'
  },
  {
    id: 'inq-02',
    vendorId: 'vend-brainy-stem',
    customerName: 'Karthik Rao',
    customerEmail: 'karthik.rao@outlook.com',
    customerPhone: '+91 99100 81920',
    productName: 'Solar Rover & Hydraulic Mechanical Kit',
    subject: 'Does this require soldering or high voltage?',
    message: 'Hi Vikram, is this safe for a 7-year old to build independently without adult soldering tools?',
    date: '28 Feb 2026',
    status: 'open'
  }
];

export const INITIAL_ANNOUNCEMENTS: VendorAnnouncement[] = [
  {
    id: 'ann-01',
    title: '📢 Festive Season Seller Guidelines & Same-Day Dispatch Incentive',
    content: 'Vernunt Marketplace is boosting visibility for all sellers who maintain a 24-hour dispatch rate. Ensure your inventory counts are updated before the upcoming weekend rush.',
    date: '25 Feb 2026',
    priority: 'high',
    authorName: 'Vernunt Admin Operations'
  },
  {
    id: 'ann-02',
    title: '🧾 GST E-Invoicing Threshold Compliance Notice',
    content: 'Please verify that your GSTIN and HSN codes are accurately configured in your Seller Settings to ensure instant 1-click B2B tax invoice generation for corporate child-care buyers.',
    date: '20 Feb 2026',
    priority: 'normal',
    authorName: 'Vernunt Compliance Desk'
  }
];

// Helper to get Store Settings
export const getStoredStoreSettings = (): StoreSettings => {
  try {
    const saved = localStorage.getItem('vernunt_store_settings_v1');
    return saved ? { ...DEFAULT_STORE_SETTINGS, ...JSON.parse(saved) } : DEFAULT_STORE_SETTINGS;
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
};

// Helper to save Store Settings
export const saveStoredStoreSettings = (settings: StoreSettings) => {
  try {
    localStorage.setItem('vernunt_store_settings_v1', JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('vernunt_store_settings_updated', { detail: settings }));
  } catch (err) {
    console.error('Error saving store settings:', err);
  }
};

// Helper to get Vendors
export const getStoredVendors = (): VendorProfile[] => {
  try {
    const saved = localStorage.getItem('vernunt_store_vendors_v1');
    return saved ? JSON.parse(saved) : INITIAL_VENDORS;
  } catch {
    return INITIAL_VENDORS;
  }
};

// Helper to save Vendors
export const saveStoredVendors = (vendors: VendorProfile[]) => {
  try {
    localStorage.setItem('vernunt_store_vendors_v1', JSON.stringify(vendors));
    window.dispatchEvent(new CustomEvent('vernunt_vendors_updated', { detail: vendors }));
  } catch (err) {
    console.error('Error saving vendors:', err);
  }
};

// Helper to get Withdrawals
export const getStoredWithdrawals = (): VendorWithdrawal[] => {
  try {
    const saved = localStorage.getItem('vernunt_store_withdrawals_v1');
    return saved ? JSON.parse(saved) : INITIAL_WITHDRAWALS;
  } catch {
    return INITIAL_WITHDRAWALS;
  }
};

// Helper to save Withdrawals
export const saveStoredWithdrawals = (withdrawals: VendorWithdrawal[]) => {
  try {
    localStorage.setItem('vernunt_store_withdrawals_v1', JSON.stringify(withdrawals));
    window.dispatchEvent(new CustomEvent('vernunt_withdrawals_updated', { detail: withdrawals }));
  } catch (err) {
    console.error('Error saving withdrawals:', err);
  }
};
