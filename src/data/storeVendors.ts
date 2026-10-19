import type { VendorProfile, VendorWithdrawal, VendorInquiry, VendorAnnouncement } from '../types/vendor.ts';
import type { StoreSettings } from '../types/store.ts';
import { DEFAULT_STORE_SETTINGS } from '../types/store.ts';

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
    },
    businessType: 'LLP',
    contactPerson: 'Dr. Sunita Deshmukh',
    pickupAddress: {
      street: '42 Woodcraft Estate, Phase 2, Kothrud',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411038',
      country: 'India'
    },
    primaryServiceablePincodes: ['411038', '411001', '411004', '411014', '411028', '400001', '400050', '560001', '560100', '560102', '110001', '500001', '600001'],
    serviceablePincodes: ['411038', '411001', '411004', '411014', '411028', '400001', '400050', '400076', '560001', '560034', '560100', '560102', '110001', '110016', '110020', '500001', '500081', '600001', '600028', '700001', '380001'],
    defaultShippingFee: 49,
    freeShippingThreshold: 499,
    expressShippingFee: 99,
    pincodeShippingOverrides: {
      '411038': 29, // Local Pune warehouse rate
      '411001': 29,
      '411004': 29,
      '400001': 49,
      '560102': 49
    },
    shippingRules: [
      { id: 'sr-1', label: 'Pune Same-Day Dispatch', pincodes: ['411038', '411001', '411004'], shippingFee: 29, deliveryDays: 1 },
      { id: 'sr-2', label: 'Metro Priority Express', pincodes: ['400001', '560001', '560102', '110001'], shippingFee: 49, deliveryDays: 2 }
    ],
    verificationDocuments: {
      gstDoc: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
      panDoc: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
      bisDoc: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80'
    },
    slaAccepted: true,
    slaAcceptedAt: '2026-01-12T10:30:00.000Z',
    slaType: 'B2B Marketplace & Logistics SLA',
    slaVersion: '2026-v2.1'
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
    commissionRate: 8,
    balance: 8900,
    totalSales: 67500,
    totalEarnings: 62100,
    totalOrders: 42,
    returnPolicy: '10 Days Replacement for any technical or electronic malfunction.',
    supportPhone: '+91 97112 88401',
    supportEmail: 'care@brainyblocks.co.in',
    businessType: 'Private Limited',
    contactPerson: 'Vikramaditya Iyer',
    pickupAddress: {
      street: 'Plot 18, Phase 1, Electronic City',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560100',
      country: 'India'
    },
    primaryServiceablePincodes: ['560100', '560102', '560034', '560001', '560068', '560076', '500001', '600001', '400001', '110001'],
    serviceablePincodes: ['560001', '560002', '560034', '560100', '560102', '560103', '560068', '560076', '500001', '500032', '500081', '600001', '600018', '600028', '682001', '682017', '400001', '110001'],
    defaultShippingFee: 39,
    freeShippingThreshold: 599,
    expressShippingFee: 79,
    pincodeShippingOverrides: {
      '560100': 19,
      '560102': 19,
      '560034': 19
    },
    shippingRules: [
      { id: 'sr-bb-1', label: 'Bengaluru Instant/Next Day', pincodes: ['560100', '560102', '560034'], shippingFee: 19, deliveryDays: 1 }
    ],
    verificationDocuments: {
      gstDoc: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
      panDoc: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80'
    },
    slaAccepted: true,
    slaAcceptedAt: '2026-02-05T14:15:00.000Z',
    slaType: 'B2B Marketplace & Logistics SLA',
    slaVersion: '2026-v2.1'
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
    supportEmail: 'support@kiddysafe.com',
    businessType: 'Partnership',
    contactPerson: 'Neha Singhania',
    pickupAddress: {
      street: 'C-58, Sector 62, Logistics Hub',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201309',
      country: 'India'
    },
    primaryServiceablePincodes: ['201309', '201301', '110001', '110016', '110020', '122001', '560102'],
    serviceablePincodes: ['110001', '110016', '110020', '110024', '110092', '201301', '201309', '122001', '122002', '560001', '560102', '400001', '400050'],
    defaultShippingFee: 49,
    freeShippingThreshold: 499,
    expressShippingFee: 89,
    pincodeShippingOverrides: {
      '201309': 25,
      '110001': 29,
      '110016': 29
    },
    verificationDocuments: {
      gstDoc: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
      panDoc: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80'
    },
    slaAccepted: true,
    slaAcceptedAt: '2026-02-20T11:00:00.000Z',
    slaType: 'B2B Marketplace & Logistics SLA',
    slaVersion: '2026-v2.1'
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
    supportEmail: 'care@littlesprouts.org',
    businessType: 'Individual Artisan',
    contactPerson: 'Rashmi Menon',
    pickupAddress: {
      street: 'Door 14/204, Kaloor Kadavanthra Road',
      city: 'Kochi',
      state: 'Kerala',
      pincode: '682017',
      country: 'India'
    },
    primaryServiceablePincodes: ['682017', '682001', '682016', '560001', '560102'],
    serviceablePincodes: ['682001', '682016', '682017', '682020', '695001', '560001', '560102', '600001'],
    defaultShippingFee: 49,
    freeShippingThreshold: 399,
    expressShippingFee: 89,
    pincodeShippingOverrides: {
      '682017': 20,
      '682001': 20
    },
    verificationDocuments: {
      gstDoc: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
      panDoc: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80'
    },
    slaAccepted: true,
    slaAcceptedAt: '2026-02-27T09:20:00.000Z',
    slaType: 'B2B Marketplace & Logistics SLA',
    slaVersion: '2026-v2.1'
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
