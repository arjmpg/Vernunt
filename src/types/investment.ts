export interface InvestmentProperty {
  id: string;
  title: string;
  propertyType: 'Plot / Site' | 'Gated Villa Plot' | 'Suburban Farm Land' | 'Compact Apartment';
  city: string;
  locality: string;
  totalPrice: number; // in INR (e.g. 500000 = 5 Lakhs)
  downPayment: number; // in INR (e.g. 50000 = 10%)
  monthlyEmi: number; // default calculated monthly EMI
  interestRate: number; // standard annual interest rate, default ~8.5%
  tenureYears: number; // standard tenure in years, default 15
  plotAreaSqFt: number; // e.g. 1200
  dimensions: string; // e.g. "30 x 40 ft"
  approvalType: 'RERA & BDA Approved' | 'DTCP Approved' | 'HMDA Approved' | 'PMRDA Approved' | 'Panchayat Khata A' | 'DC Converted';
  reraNumber?: string;
  highlightTag?: string; // e.g. "Kid Future High Growth", "Low Cost EMI", "Near Metro"
  description: string;
  images: string[];
  amenities: string[];
  bankLoanPartners: string[];
  sellerType: 'Builder' | 'Real Estate Agent' | 'Direct Owner';
  sellerName: string;
  sellerPhone: string;
  sellerEmail: string;
  sellerAgency?: string;
  sellerPhoto?: string;
  postedByUid?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface MutualFundRecommendation {
  id: string;
  fundName: string;
  fundHouse: string;
  category: 'Large Cap Index' | 'Flexi Cap' | 'Children Gift Fund' | 'Multi Cap / Mid Cap' | 'Hybrid Balanced';
  riskLevel: 'Moderate' | 'Moderately High' | 'Very High';
  historical3YrCagr: number; // e.g. 15.2%
  historical5YrCagr: number; // e.g. 16.8%
  expectedCagrForCalculation: number; // e.g. 13.5%
  expenseRatio: number; // e.g. 0.35%
  aumCrores: number; // e.g. 24800
  minMonthlySip: number; // e.g. 500
  lockInPeriod: string; // e.g. "Lock-in until child turns 18 or 5 years"
  suitabilityForKids: string;
  recommendedAllocationPercentage: number;
  directAmcUrl?: string;
}

export interface MutualFundAdvisor {
  id: string;
  name: string;
  arnNumber: string; // AMFI Registration Number e.g. "ARN-189240"
  sebiRegNumber?: string;
  agencyName: string;
  city: string;
  state: string;
  experienceYears: number;
  rating: number;
  reviewsCount: number;
  specialization: string[];
  feeType: 'Free Initial Consultation' | 'Zero Commission Direct' | 'Flat Advisory Fee';
  phone: string;
  email: string;
  photoUrl: string;
  bio: string;
  postedByUid?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface GoldSilverStore {
  id: string;
  storeName: string;
  jewellerChain: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  schemeName: string;
  schemeType: 'Monthly Savings Plan (11 Months)' | '24K Gold Coin SIP' | 'Digital Gold to Physical Delivery' | 'Silver Bullion Blocks';
  minMonthlyDeposit: number;
  bonusOffer: string;
  hallmarkPurity: string;
  imageUrl: string;
  managerName: string;
  postedByUid?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface InvestmentLead {
  id: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  kidName?: string;
  kidAge: number;
  targetSector: 'Real Estate (Plot / Site)' | 'Mutual Fund Advisor' | 'Gold / Silver Store';
  itemTitle: string;
  itemId: string;
  providerName: string;
  providerPhone: string;
  providerEmail: string;
  monthlyInvestmentAmount: number;
  bulkInvestmentAmount?: number;
  investmentMode: 'monthly' | 'bulk';
  message: string;
  smsStatus: 'Delivered' | 'Queued' | 'Sent';
  emailStatus: 'Delivered' | 'Queued' | 'Sent';
  smsDeliveryId: string;
  emailDeliveryId: string;
  parentUid?: string;
  isGuest: boolean;
  createdAt: string;
}

export interface PortfolioAllocation {
  realEstatePct: number; // e.g. 60
  mutualFundsPct: number; // e.g. 20
  goldSilverPct: number; // e.g. 20
}

export interface KidWealthPlanResult {
  childAge: number;
  yearsToHorizon: number; // 18 - childAge
  monthlyTotal: number;
  bulkTotal?: number;
  mode: 'monthly' | 'bulk';
  allocation: PortfolioAllocation;
  
  // Real Estate Projection
  realEstateMonthly: number;
  realEstateTotalInvested: number;
  realEstateEstimatedFutureValue: number;
  realEstateAffordableEmi: number;

  // Mutual Funds Projection
  mutualFundsMonthly: number;
  mutualFundsTotalInvested: number;
  mutualFundsEstimatedMaturityAt18: number;
  mutualFundsWealthGain: number;

  // Gold / Silver Projection
  goldSilverMonthly: number;
  goldSilverTotalInvested: number;
  goldSilverEstimatedGrams: number;
  goldSilverEstimatedMaturityAt18: number;

  // Grand Combined
  totalPrincipalInvested: number;
  grandTotalEstimatedCorpusAt18: number;
  totalWealthMultiplier: number;
}
