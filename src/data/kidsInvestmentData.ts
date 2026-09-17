import { 
  InvestmentProperty, 
  MutualFundRecommendation, 
  MutualFundAdvisor, 
  GoldSilverStore, 
  PortfolioAllocation, 
  KidWealthPlanResult 
} from '../types/investment.ts';

/**
 * Standard EMI Calculation Formula:
 * E = P * r * (1 + r)^n / ((1 + r)^n - 1)
 * @param principal Loan amount in INR
 * @param annualRate Annual interest rate (e.g. 8.5)
 * @param tenureYears Loan tenure in years (e.g. 15)
 */
export function calculateMonthlyEmi(
  principal: number,
  annualRate: number = 8.5,
  tenureYears: number = 15
): number {
  if (principal <= 0 || tenureYears <= 0) return 0;
  const monthlyRate = annualRate / (12 * 100);
  const totalMonths = tenureYears * 12;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
  return Math.round(emi);
}

/**
 * Reverse EMI Formula: Calculate affordable loan principal from monthly budget
 * P = E * ((1 + r)^n - 1) / (r * (1 + r)^n)
 */
export function calculatePrincipalFromEmi(
  monthlyEmi: number,
  annualRate: number = 8.5,
  tenureYears: number = 15
): number {
  if (monthlyEmi <= 0 || tenureYears <= 0) return 0;
  const monthlyRate = annualRate / (12 * 100);
  const totalMonths = tenureYears * 12;
  const factor = Math.pow(1 + monthlyRate, totalMonths);
  const principal = (monthlyEmi * (factor - 1)) / (monthlyRate * factor);
  return Math.round(principal);
}

/**
 * Monthly SIP Future Value Formula:
 * FV = P * [ (1 + i)^n - 1 ] * (1 + i) / i
 * @param monthlySip Monthly investment in INR
 * @param annualCagr Annual return rate (e.g. 13.5)
 * @param years Total years
 */
export function calculateSipFutureValue(
  monthlySip: number,
  annualCagr: number = 13.5,
  years: number = 15
): number {
  if (monthlySip <= 0 || years <= 0) return 0;
  const monthlyRate = annualCagr / (12 * 100);
  const totalMonths = years * 12;
  const fv = monthlySip * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
  return Math.round(fv);
}

/**
 * Compound Bulk / Lump Sum Future Value:
 * FV = P * (1 + r)^n
 */
export function calculateLumpSumFutureValue(
  principal: number,
  annualCagr: number = 12.0,
  years: number = 15
): number {
  if (principal <= 0 || years <= 0) return 0;
  const fv = principal * Math.pow(1 + annualCagr / 100, years);
  return Math.round(fv);
}

/**
 * Gold Investment Projection (Accumulating grams & compounding price)
 * Assumes current 24K gold rate ~ ₹7,400/gram with historical ~10% annual CAGR
 */
export function calculateGoldFutureValue(
  monthlyAmount: number,
  years: number = 15,
  currentGoldPricePerGram: number = 7400,
  annualGoldCagr: number = 10.0
): { gramsAccumulated: number; futureValuation: number } {
  if (monthlyAmount <= 0 || years <= 0) return { gramsAccumulated: 0, futureValuation: 0 };
  const totalInvested = monthlyAmount * 12 * years;
  const averagePurchasePrice = currentGoldPricePerGram * Math.pow(1 + (annualGoldCagr / 2) / 100, years / 2);
  const gramsAccumulated = Number((totalInvested / averagePurchasePrice).toFixed(1));
  const futureGoldPricePerGram = currentGoldPricePerGram * Math.pow(1 + annualGoldCagr / 100, years);
  const futureValuation = Math.round(gramsAccumulated * futureGoldPricePerGram);
  return { gramsAccumulated, futureValuation };
}

/**
 * Comprehensive Portfolio Plan Builder for Kid turning 18
 */
export function calculateComprehensivePlan(
  monthlyTotal: number,
  bulkTotal: number | undefined,
  mode: 'monthly' | 'bulk',
  allocation: PortfolioAllocation,
  childAge: number
): KidWealthPlanResult {
  const yearsToHorizon = Math.max(1, 18 - Math.max(0, Math.min(17, childAge)));
  
  if (mode === 'monthly') {
    const realEstateMonthly = Math.round((monthlyTotal * allocation.realEstatePct) / 100);
    const mutualFundsMonthly = Math.round((monthlyTotal * allocation.mutualFundsPct) / 100);
    const goldSilverMonthly = Math.round((monthlyTotal * allocation.goldSilverPct) / 100);

    // 1. Real Estate (Assuming land appreciates at ~10% CAGR over the period)
    const realEstateTotalInvested = realEstateMonthly * 12 * yearsToHorizon;
    // Estimated property worth financed through this monthly EMI at standard interest rate & tenure
    const loanPrincipal = calculatePrincipalFromEmi(realEstateMonthly, 8.5, 15);
    // Assuming 20% down payment paid upfront or during site booking
    const approximatePropertyCost = loanPrincipal > 0 ? Math.round(loanPrincipal / 0.8) : 0;
    const realEstateEstimatedFutureValue = Math.round(approximatePropertyCost * Math.pow(1 + 0.10, yearsToHorizon));

    // 2. Mutual Funds (13.5% CAGR equity compounding)
    const mutualFundsTotalInvested = mutualFundsMonthly * 12 * yearsToHorizon;
    const mutualFundsEstimatedMaturityAt18 = calculateSipFutureValue(mutualFundsMonthly, 13.5, yearsToHorizon);
    const mutualFundsWealthGain = Math.max(0, mutualFundsEstimatedMaturityAt18 - mutualFundsTotalInvested);

    // 3. Gold & Silver (10% CAGR precious metals)
    const goldSilverTotalInvested = goldSilverMonthly * 12 * yearsToHorizon;
    const { gramsAccumulated, futureValuation } = calculateGoldFutureValue(goldSilverMonthly, yearsToHorizon);

    const totalPrincipalInvested = realEstateTotalInvested + mutualFundsTotalInvested + goldSilverTotalInvested;
    const grandTotalEstimatedCorpusAt18 = realEstateEstimatedFutureValue + mutualFundsEstimatedMaturityAt18 + futureValuation;
    const totalWealthMultiplier = totalPrincipalInvested > 0 
      ? Number((grandTotalEstimatedCorpusAt18 / totalPrincipalInvested).toFixed(1))
      : 1;

    return {
      childAge,
      yearsToHorizon,
      monthlyTotal,
      mode: 'monthly',
      allocation,
      realEstateMonthly,
      realEstateTotalInvested,
      realEstateEstimatedFutureValue,
      realEstateAffordableEmi: realEstateMonthly,
      mutualFundsMonthly,
      mutualFundsTotalInvested,
      mutualFundsEstimatedMaturityAt18,
      mutualFundsWealthGain,
      goldSilverMonthly,
      goldSilverTotalInvested,
      goldSilverEstimatedGrams: gramsAccumulated,
      goldSilverEstimatedMaturityAt18: futureValuation,
      totalPrincipalInvested,
      grandTotalEstimatedCorpusAt18,
      totalWealthMultiplier
    };
  } else {
    // Bulk / Lump Sum Mode
    const lump = bulkTotal || 100000;
    const reLump = Math.round((lump * allocation.realEstatePct) / 100);
    const mfLump = Math.round((lump * allocation.mutualFundsPct) / 100);
    const goldLump = Math.round((lump * allocation.goldSilverPct) / 100);

    const realEstateEstimatedFutureValue = calculateLumpSumFutureValue(reLump, 10.5, yearsToHorizon);
    const mutualFundsEstimatedMaturityAt18 = calculateLumpSumFutureValue(mfLump, 14.0, yearsToHorizon);
    const goldFutureVal = calculateLumpSumFutureValue(goldLump, 10.0, yearsToHorizon);

    const grandTotal = realEstateEstimatedFutureValue + mutualFundsEstimatedMaturityAt18 + goldFutureVal;
    return {
      childAge,
      yearsToHorizon,
      monthlyTotal: 0,
      bulkTotal: lump,
      mode: 'bulk',
      allocation,
      realEstateMonthly: 0,
      realEstateTotalInvested: reLump,
      realEstateEstimatedFutureValue,
      realEstateAffordableEmi: Math.round(reLump / (12 * yearsToHorizon)),
      mutualFundsMonthly: 0,
      mutualFundsTotalInvested: mfLump,
      mutualFundsEstimatedMaturityAt18,
      mutualFundsWealthGain: Math.max(0, mutualFundsEstimatedMaturityAt18 - mfLump),
      goldSilverMonthly: 0,
      goldSilverTotalInvested: goldLump,
      goldSilverEstimatedGrams: Number((goldLump / 7400).toFixed(1)),
      goldSilverEstimatedMaturityAt18: goldFutureVal,
      totalPrincipalInvested: lump,
      grandTotalEstimatedCorpusAt18: grandTotal,
      totalWealthMultiplier: Number((grandTotal / lump).toFixed(1))
    };
  }
}

/**
 * Initial Curated Properties for Kids Future
 * Low-cost plots & sites with affordable EMI starting from ₹2,800/mo
 */
export const INITIAL_INVESTMENT_PROPERTIES: InvestmentProperty[] = [
  {
    id: 'prop-1',
    title: 'Aerotropolis Pride Gated Villa Plots',
    propertyType: 'Plot / Site',
    city: 'Bengaluru',
    locality: 'Devanahalli - North Airport Growth Corridor',
    totalPrice: 520000, // 5.2 Lakhs
    downPayment: 52000,
    monthlyEmi: 3150,
    interestRate: 8.5,
    tenureYears: 15,
    plotAreaSqFt: 1200,
    dimensions: '30 x 40 ft',
    approvalType: 'RERA & BDA Approved',
    reraNumber: 'PRM/KA/RERA/1250/303/PR/240115/006421',
    highlightTag: '⭐ Kid Future Top Pick (₹3,150/mo EMI)',
    description: 'Directly on the proposed 6-lane STRR expressway near Kempegowda International Airport. Excellent long-term wealth asset for your child with 100% clear legal titles, underground cabling, avenue plantation, and bank loan approvals.',
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&q=80&w=800'
    ],
    amenities: [
      'Kids Multi-Sport Play Turf',
      '24/7 Gated Security & CCTV',
      'Wide 40-ft Tar Roads',
      'Underground Drainage & Water Grid',
      'Overhead Water Tank & Rainwater Harvesting',
      'Clubhouse & Amphitheater'
    ],
    bankLoanPartners: ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank'],
    sellerType: 'Builder',
    sellerName: 'Venkatesh Rao',
    sellerPhone: '+91 98450 12840',
    sellerEmail: 'sales@aeropolisinfra.in',
    sellerAgency: 'Aeropolis Green Infrastructure LLP',
    sellerPhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300',
    isVerified: true,
    createdAt: '2026-03-10T10:00:00Z'
  },
  {
    id: 'prop-2',
    title: 'Suraksha Green Haven Suburban Agro-Residential Sites',
    propertyType: 'Plot / Site',
    city: 'Bengaluru',
    locality: 'Sarjapur-Attibele Tech Hub Corridor',
    totalPrice: 480000, // 4.8 Lakhs
    downPayment: 48000,
    monthlyEmi: 2900,
    interestRate: 8.5,
    tenureYears: 15,
    plotAreaSqFt: 1200,
    dimensions: '30 x 40 ft',
    approvalType: 'DTCP Approved',
    reraNumber: 'KA-RERA-SARJ-2025-901',
    highlightTag: '🚀 High Growth Zone (₹2,900/mo EMI)',
    description: 'Surrounded by upcoming international schools and IT tech hubs. Perfect gifting property for your child before college. Completely surveyed boundary stones and individual E-Khata registration.',
    images: [
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=800'
    ],
    amenities: [
      'Organic Fruit Orchard & Butterfly Garden',
      'Solar Street Lighting Grid',
      'Compound Wall for Entire Layout',
      'Individual Water Connection Point',
      'Jogging & Cycling Track'
    ],
    bankLoanPartners: ['SBI', 'Canara Bank', 'HDFC Bank', 'Bank of Baroda'],
    sellerType: 'Builder',
    sellerName: 'Sunil Gowda',
    sellerPhone: '+91 99002 44781',
    sellerEmail: 'connect@surakshaland.com',
    sellerAgency: 'Suraksha Developers Pvt Ltd',
    sellerPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    isVerified: true,
    createdAt: '2026-04-01T12:00:00Z'
  },
  {
    id: 'prop-3',
    title: 'Sannidhi Heritage Eco Farm & Villa Plots',
    propertyType: 'Suburban Farm Land',
    city: 'Bengaluru',
    locality: 'Mysore Road - Bidadi Expressway Hub',
    totalPrice: 650000, // 6.5 Lakhs
    downPayment: 65000,
    monthlyEmi: 3950,
    interestRate: 8.5,
    tenureYears: 15,
    plotAreaSqFt: 1500,
    dimensions: '30 x 50 ft',
    approvalType: 'DC Converted',
    reraNumber: 'PRM/KA/RERA/BIDADI/092',
    highlightTag: '🌳 Weekend Farm + Future Value',
    description: 'Scenic farm plots with 25 pre-planted sandalwood and mahogany trees for long-term timber wealth. Located just 12 mins from Bidadi Metro terminal along the Bangalore-Mysore Expressway.',
    images: [
      'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800'
    ],
    amenities: [
      '25 Timber & Fruit Trees Maintained Free for 5 Yrs',
      'Gated Community with Caretaker House',
      'Drip Irrigation Pipeline',
      'Children Country Playground'
    ],
    bankLoanPartners: ['Kotak Mahindra Bank', 'State Bank of India', 'PNB Housing'],
    sellerType: 'Real Estate Agent',
    sellerName: 'Manjunath Swamy',
    sellerPhone: '+91 97412 88390',
    sellerEmail: 'manju@sannidhifarms.in',
    sellerAgency: 'Sannidhi Agro Living',
    sellerPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    isVerified: true,
    createdAt: '2026-04-15T09:30:00Z'
  },
  {
    id: 'prop-4',
    title: 'CyberCity Enclave Smart Micro-Sites',
    propertyType: 'Plot / Site',
    city: 'Hyderabad',
    locality: 'Pharma City - Srisailam Highway Hub',
    totalPrice: 450000, // 4.5 Lakhs
    downPayment: 45000,
    monthlyEmi: 2750,
    interestRate: 8.5,
    tenureYears: 15,
    plotAreaSqFt: 1080,
    dimensions: '27 x 40 ft',
    approvalType: 'HMDA Approved',
    reraNumber: 'P02400006811',
    highlightTag: '💎 Lowest Entry EMI (₹2,750/mo)',
    description: 'HMDA approved layout with spot registration near the largest upcoming industrial and tech pharma corridor. High growth potential over a 15-year holding horizon for your kid.',
    images: [
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=800'
    ],
    amenities: [
      'HMDA Norms 33 & 40 ft BT Roads',
      'Electricity with Transformer Grid',
      'Park and Social Infrastructure Zone',
      'Clear Title Spot Registration'
    ],
    bankLoanPartners: ['Union Bank of India', 'SBI', 'HDFC'],
    sellerType: 'Builder',
    sellerName: 'Rajesh Reddy',
    sellerPhone: '+91 98480 33198',
    sellerEmail: 'sales@cybercityinfra.com',
    sellerAgency: 'CyberCity Infra Developers',
    isVerified: true,
    createdAt: '2026-05-02T11:15:00Z'
  },
  {
    id: 'prop-5',
    title: 'Hinjewadi Hills Smart Villa Enclave',
    propertyType: 'Gated Villa Plot',
    city: 'Pune',
    locality: 'Hinjewadi Phase 3 Extension - Marunji',
    totalPrice: 750000, // 7.5 Lakhs
    downPayment: 75000,
    monthlyEmi: 4550,
    interestRate: 8.5,
    tenureYears: 15,
    plotAreaSqFt: 1200,
    dimensions: '30 x 40 ft',
    approvalType: 'PMRDA Approved',
    reraNumber: 'P52100049210',
    highlightTag: '⚡ Tech Corridor (₹4,550/mo)',
    description: 'PMRDA approved residential layout with breathtaking hill views, close to IT companies and upcoming Ring Road. Ideal generational asset for children education fund security.',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800'
    ],
    amenities: [
      'Clubhouse with Indoor Games',
      'Swimming Pool & Kids Splash Zone',
      '24/7 Security Cabin with Boom Barrier',
      'Underground Sewage Treatment Plant'
    ],
    bankLoanPartners: ['ICICI Bank', 'HDFC', 'SBI', 'Bank of Maharashtra'],
    sellerType: 'Builder',
    sellerName: 'Amitabh Deshmukh',
    sellerPhone: '+91 98220 77123',
    sellerEmail: 'amitabh@hinjewadihills.co.in',
    sellerAgency: 'Deshmukh Landmarks Pune',
    isVerified: true,
    createdAt: '2026-05-18T14:20:00Z'
  },
  {
    id: 'prop-6',
    title: 'Golden Horizon Compact Studio Apartment',
    propertyType: 'Compact Apartment',
    city: 'Bengaluru',
    locality: 'Electronic City Phase 2 - Chandapura Circle',
    totalPrice: 1150000, // 11.5 Lakhs
    downPayment: 115000,
    monthlyEmi: 6980,
    interestRate: 8.5,
    tenureYears: 15,
    plotAreaSqFt: 380,
    dimensions: '1 BHK Studio',
    approvalType: 'RERA & BDA Approved',
    reraNumber: 'PRM/KA/RERA/1251/308/PR/230919/006280',
    highlightTag: '🏢 Rental Income Generating for Kids',
    description: 'Ready-to-lease compact studio apartment fetching ₹6,500/month rent immediately, virtually paying for its own EMI! All rent can be reinvested into children SIP.',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800'
    ],
    amenities: [
      'Elevator & Power Backup',
      'Gymnasium & Rooftop Terrace',
      'Dedicated Property Management / Tenant Finding'
    ],
    bankLoanPartners: ['SBI', 'HDFC Bank', 'Canara Bank'],
    sellerType: 'Builder',
    sellerName: 'Prashanth Nair',
    sellerPhone: '+91 98455 90112',
    sellerEmail: 'prashanth@goldenhorizon.in',
    sellerAgency: 'Horizon Urban Homes',
    isVerified: true,
    createdAt: '2026-06-01T08:00:00Z'
  }
];

/**
 * Curated Top Child-Focus Mutual Funds
 */
export const INITIAL_CHILD_MUTUAL_FUNDS: MutualFundRecommendation[] = [
  {
    id: 'mf-1',
    fundName: 'UTI Nifty 50 Index Fund (Direct Growth)',
    fundHouse: 'UTI Mutual Fund',
    category: 'Large Cap Index',
    riskLevel: 'Moderately High',
    historical3YrCagr: 15.4,
    historical5YrCagr: 16.2,
    expectedCagrForCalculation: 13.5,
    expenseRatio: 0.22,
    aumCrores: 19500,
    minMonthlySip: 500,
    lockInPeriod: 'Nil (Flexible withdrawal anytime)',
    suitabilityForKids: 'The ultimate bedrock for your child. Lowest cost index investing in India top 50 bluechip giants like Reliance, TCS, HDFC Bank, Infosys.',
    recommendedAllocationPercentage: 35,
    directAmcUrl: 'https://www.utimf.com'
  },
  {
    id: 'mf-2',
    fundName: 'HDFC Children\'s Gift Fund (Direct Growth)',
    fundHouse: 'HDFC Mutual Fund',
    category: 'Children Gift Fund',
    riskLevel: 'Moderately High',
    historical3YrCagr: 17.1,
    historical5YrCagr: 18.0,
    expectedCagrForCalculation: 14.0,
    expenseRatio: 0.88,
    aumCrores: 9200,
    minMonthlySip: 500,
    lockInPeriod: 'Compulsory lock-in until child turns 18 or 5 years (whichever is earlier)',
    suitabilityForKids: 'Specifically designed child solution fund. Prevents premature emotional redemptions by parents and creates a protected college kitty.',
    recommendedAllocationPercentage: 30,
    directAmcUrl: 'https://www.hdfcfund.com'
  },
  {
    id: 'mf-3',
    fundName: 'Parag Parikh Flexi Cap Fund (Direct Growth)',
    fundHouse: 'PPFAS Mutual Fund',
    category: 'Flexi Cap',
    riskLevel: 'Moderately High',
    historical3YrCagr: 18.9,
    historical5YrCagr: 21.4,
    expectedCagrForCalculation: 15.0,
    expenseRatio: 0.61,
    aumCrores: 65400,
    minMonthlySip: 1000,
    lockInPeriod: 'Nil',
    suitabilityForKids: 'Global + Indian equity exposure (includes Indian bluechips + US tech giants like Alphabet and Microsoft) giving foreign currency hedge for future overseas study.',
    recommendedAllocationPercentage: 25,
    directAmcUrl: 'https://amc.ppfas.com'
  },
  {
    id: 'mf-4',
    fundName: 'Nippon India Small Cap Fund (Direct Growth)',
    fundHouse: 'Nippon India Mutual Fund',
    category: 'Multi Cap / Mid Cap',
    riskLevel: 'Very High',
    historical3YrCagr: 24.8,
    historical5YrCagr: 26.5,
    expectedCagrForCalculation: 16.0,
    expenseRatio: 0.67,
    aumCrores: 48000,
    minMonthlySip: 500,
    lockInPeriod: 'Nil',
    suitabilityForKids: 'Best suited when child is young (0-7 years) with a 10+ year time horizon where high volatility smooths out into massive compounding.',
    recommendedAllocationPercentage: 10,
    directAmcUrl: 'https://mf.nipponindiaim.com'
  }
];

/**
 * AMFI Registered Mutual Fund Advisors
 */
export const INITIAL_MUTUAL_FUND_ADVISORS: MutualFundAdvisor[] = [
  {
    id: 'mfa-1',
    name: 'Suresh K. Narayanan, CFP',
    arnNumber: 'ARN-189240',
    sebiRegNumber: 'INA000012891',
    agencyName: 'Balaji Child Wealth Planners',
    city: 'Bengaluru',
    state: 'Karnataka',
    experienceYears: 16,
    rating: 4.9,
    reviewsCount: 142,
    specialization: [
      'Child Higher Education Corpus Planning',
      'Sukanya Samriddhi vs Equity SIP Strategy',
      'Overseas University Currency Hedging',
      'Zero-Commission Direct Fund Guidance'
    ],
    feeType: 'Free Initial Consultation',
    phone: '+91 98450 78210',
    email: 'suresh@balajiwealth.in',
    photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300',
    bio: 'AMFI Certified Financial Planner specializing in helping young millennial parents set up automated, inflation-beating wealth plans for their children.',
    isVerified: true,
    createdAt: '2026-01-10T10:00:00Z'
  },
  {
    id: 'mfa-2',
    name: 'Pooja Agarwal, CFA',
    arnNumber: 'ARN-210450',
    sebiRegNumber: 'INA000015402',
    agencyName: 'EduWealth Advisors',
    city: 'Mumbai',
    state: 'Maharashtra',
    experienceYears: 12,
    rating: 4.8,
    reviewsCount: 98,
    specialization: [
      'Ivy League & Overseas College Fund',
      'Children Solution Lock-in Portfolios',
      'Tax Harvesting on Minor MF Accounts'
    ],
    feeType: 'Free Initial Consultation',
    phone: '+91 98200 45612',
    email: 'pooja@eduwealth.co.in',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    bio: 'Mother of two and ex-Goldman Sachs analyst passionate about empowering parents with stress-free child college funding roadmaps.',
    isVerified: true,
    createdAt: '2026-02-14T11:00:00Z'
  },
  {
    id: 'mfa-3',
    name: 'Raghavan R. Iyer',
    arnNumber: 'ARN-143091',
    agencyName: 'Nivesh Kids Financial Health',
    city: 'Chennai',
    state: 'Tamil Nadu',
    experienceYears: 20,
    rating: 4.9,
    reviewsCount: 215,
    specialization: [
      'Disciplined ₹1000 - ₹5000 Monthly SIPs',
      'Government Sovereign Gold Bonds Integration',
      'Child Minor Demat & Mutual Fund Accounts'
    ],
    feeType: 'Free Initial Consultation',
    phone: '+91 98410 99882',
    email: 'raghavan@niveshkids.com',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    bio: 'Over 20 years guiding 2,500+ south Indian families towards financial peace of mind. Transparent, ethical, client-first advisory.',
    isVerified: true,
    createdAt: '2026-03-01T09:00:00Z'
  }
];

/**
 * Verified Gold & Silver Stores with Monthly Savings Schemes
 */
export const INITIAL_GOLD_SILVER_STORES: GoldSilverStore[] = [
  {
    id: 'gold-1',
    storeName: 'Tanishq Flagship Showroom - Indiranagar',
    jewellerChain: 'Tanishq (Tata Group)',
    city: 'Bengaluru',
    address: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
    phone: '+91 80 4125 7890',
    email: 'indiranagar@tanishq.co.in',
    schemeName: 'Golden Harvest Child Savings Plan',
    schemeType: 'Monthly Savings Plan (11 Months)',
    minMonthlyDeposit: 2000,
    bonusOffer: 'Pay for 10 months; Tanishq contributes up to 75% of one monthly installment as a special bonus on the 11th month + 50% discount on jewellery making charges.',
    hallmarkPurity: '100% BIS Hallmarked 22K (916) & 24K (999.9) Purity with Tata Guarantee',
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800',
    managerName: 'Girish Sharma',
    isVerified: true,
    createdAt: '2026-01-05T10:00:00Z'
  },
  {
    id: 'gold-2',
    storeName: 'Malabar Gold & Diamonds - Jayanagar',
    jewellerChain: 'Malabar Gold & Diamonds',
    city: 'Bengaluru',
    address: '9th Main Road, 4th Block, Jayanagar, Bengaluru, Karnataka 560011',
    phone: '+91 80 2654 3322',
    email: 'jayanagar@malabargoldanddiamonds.com',
    schemeName: 'Smart Buy Gold & Silver Monthly Advance Scheme',
    schemeType: 'Monthly Savings Plan (11 Months)',
    minMonthlyDeposit: 1000,
    bonusOffer: 'Zero making charges on selected gold coins and jewellery, plus price protection guarantee: purchase at the lowest gold rate recorded during your scheme tenure.',
    hallmarkPurity: '916 Hallmarked & IGI Certified Diamonds with 100% Buyback Value Guarantee',
    imageUrl: 'https://images.unsplash.com/photo-1611591475883-bd86d6ee4e5f?auto=format&fit=crop&q=80&w=800',
    managerName: 'Kishore Kumar',
    isVerified: true,
    createdAt: '2026-02-10T12:00:00Z'
  },
  {
    id: 'gold-3',
    storeName: 'Kalyan Jewellers - MG Road',
    jewellerChain: 'Kalyan Jewellers',
    city: 'Bengaluru',
    address: 'Near Trinity Metro Station, MG Road, Bengaluru, Karnataka 560001',
    phone: '+91 80 4343 1900',
    email: 'mgroad@kalyanjewellers.net',
    schemeName: 'Dhanvarsha Monthly Gold & Silver Kitty',
    schemeType: 'Monthly Savings Plan (11 Months)',
    minMonthlyDeposit: 1000,
    bonusOffer: 'Earn guaranteed additional grams credited monthly. Redeem for 24K Swiss Gold minted bars, silver blocks or custom wedding sets when child turns 18.',
    hallmarkPurity: '4-Level Certification with Free Lifetime Maintenance & Purity Karatmeter Testing',
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800',
    managerName: 'Ramesh Prabhu',
    isVerified: true,
    createdAt: '2026-03-01T14:00:00Z'
  },
  {
    id: 'gold-4',
    storeName: 'MMTC-PAMP Certified Bullion Partner Hub',
    jewellerChain: 'MMTC-PAMP (Govt of India & Swiss PAMP)',
    city: 'Bengaluru',
    address: 'Commercial Street Bullion Arcade, Bengaluru, Karnataka 560001',
    phone: '+91 80 2558 1144',
    email: 'support@mmtcpamp-partners.in',
    schemeName: '24K 999.9 Pure Gold & Silver Minted Blocks SIP',
    schemeType: '24K Gold Coin SIP',
    minMonthlyDeposit: 1000,
    bonusOffer: 'Accumulate in LBMA accredited 999.9 pure gold. Fractional monthly buying with certified tamper-evident CertiPAMP sealed physical block delivery at home.',
    hallmarkPurity: '999.9 (24 Karat Purest Bullion) LBMA Accredited',
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&q=80&w=800',
    managerName: 'Vandana Sen',
    isVerified: true,
    createdAt: '2026-03-20T16:00:00Z'
  }
];
