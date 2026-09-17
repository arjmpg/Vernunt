import React, { useState, useMemo, useEffect } from 'react';
import { 
  InvestmentProperty, 
  MutualFundRecommendation, 
  MutualFundAdvisor, 
  GoldSilverStore, 
  PortfolioAllocation, 
  InvestmentLead,
  KidWealthPlanResult
} from '../../types/investment.ts';
import { 
  calculateComprehensivePlan, 
  calculateMonthlyEmi,
  INITIAL_INVESTMENT_PROPERTIES, 
  INITIAL_CHILD_MUTUAL_FUNDS, 
  INITIAL_MUTUAL_FUND_ADVISORS, 
  INITIAL_GOLD_SILVER_STORES 
} from '../../data/kidsInvestmentData.ts';
import { dispatchInvestmentLead } from '../../services/investmentNotificationService.ts';
import PartnerInvestmentPortal from './PartnerInvestmentPortal.tsx';
import PropertyEmiCalculatorWidget from './PropertyEmiCalculatorWidget.tsx';
import BuilderAgentDashboard from './BuilderAgentDashboard.tsx';
import MutualFundAdvisorDashboard from './MutualFundAdvisorDashboard.tsx';
import { ChildProfile } from '../../types.ts';
import { 
  Building2, TrendingUp, Sparkles, Phone, Mail, MapPin, ShieldCheck, 
  Calendar, Award, ArrowRight, CheckCircle2, ChevronRight, Calculator,
  Sliders, MessageSquare, ExternalLink, HelpCircle, User, Info, DollarSign,
  Briefcase, Percent, Layers, Clock, AlertCircle, Share2, Compass, Check
} from 'lucide-react';

interface KidsInvestmentsTabProps {
  userProfile: ChildProfile | null;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  isAdmin?: boolean;
}

const LOCAL_STORAGE_PROPERTIES_KEY = 'vernunt_custom_properties';
const LOCAL_STORAGE_ADVISORS_KEY = 'vernunt_custom_advisors';
const LOCAL_STORAGE_GOLD_KEY = 'vernunt_custom_gold_stores';

export default function KidsInvestmentsTab({
  userProfile,
  onOpenAuth,
  isAdmin = false
}: KidsInvestmentsTabProps) {
  // 1. Investment Mode & Amounts
  const [investMode, setInvestMode] = useState<'monthly' | 'bulk'>('monthly');
  const [monthlyAmount, setMonthlyAmount] = useState<number>(5000);
  const [bulkAmount, setBulkAmount] = useState<number>(200000);

  // String state for inputs so zero disappears completely when typing or backspacing
  const [monthlyInputStr, setMonthlyInputStr] = useState<string>('5000');
  const [bulkInputStr, setBulkInputStr] = useState<string>('200000');

  const handleMonthlyAmountChange = (raw: string) => {
    // Keep only numbers
    const digitsOnly = raw.replace(/[^0-9]/g, '');
    // Strip leading zeroes so typing e.g. '5' over '0' replaces the zero, not '05'
    const cleaned = digitsOnly.replace(/^0+(?=\d)/, '');
    setMonthlyInputStr(cleaned);
    const num = cleaned === '' ? 0 : Number(cleaned);
    setMonthlyAmount(num);
  };

  const handleBulkAmountChange = (raw: string) => {
    const digitsOnly = raw.replace(/[^0-9]/g, '');
    const cleaned = digitsOnly.replace(/^0+(?=\d)/, '');
    setBulkInputStr(cleaned);
    const num = cleaned === '' ? 0 : Number(cleaned);
    setBulkAmount(num);
  };

  const handleSelectMonthlyChip = (amt: number) => {
    setMonthlyAmount(amt);
    setMonthlyInputStr(amt.toString());
  };

  const handleSelectBulkChip = (amt: number) => {
    setBulkAmount(amt);
    setBulkInputStr(amt.toString());
  };

  const handleClearAmount = () => {
    if (investMode === 'monthly') {
      setMonthlyInputStr('');
      setMonthlyAmount(0);
    } else {
      setBulkInputStr('');
      setBulkAmount(0);
    }
  };

  // 2. Child Age (Pre-filled from profile if logged in, else default 3 years old)
  const initialKidAge = useMemo(() => {
    if (userProfile?.childAge !== undefined && userProfile.childAge !== null) {
      return Math.min(17, Math.max(0, userProfile.childAge));
    }
    return 3;
  }, [userProfile]);

  const [childAge, setChildAge] = useState<number>(initialKidAge);

  // Sync childAge if user profile updates
  useEffect(() => {
    if (userProfile?.childAge !== undefined && userProfile.childAge !== null) {
      setChildAge(Math.min(17, Math.max(0, userProfile.childAge)));
    }
  }, [userProfile?.childAge]);

  // 3. Asset Allocation (Default 60% Real Estate, 20% Mutual Funds, 20% Gold/Silver)
  const [allocation, setAllocation] = useState<PortfolioAllocation>({
    realEstatePct: 60,
    mutualFundsPct: 20,
    goldSilverPct: 20
  });

  // Sector Explorer active tab
  const [activeSectorTab, setActiveSectorTab] = useState<'real_estate' | 'mutual_funds' | 'gold_silver'>('real_estate');

  // Real estate filters
  const [cityFilter, setCityFilter] = useState<string>('All');
  const [propTypeFilter, setPropTypeFilter] = useState<string>('All');
  const [tenureYears, setTenureYears] = useState<number>(15);

  // Partner dashboard modal state
  const [showPartnerPortal, setShowPartnerPortal] = useState<boolean>(false);
  const [partnerPortalTab, setPartnerPortalTab] = useState<'real_estate' | 'mutual_funds' | 'gold_silver'>('real_estate');

  // Dedicated Dashboards for Builders/Agents and Mutual Fund Advisors
  const [showBuilderDashboard, setShowBuilderDashboard] = useState<boolean>(false);
  const [showAdvisorDashboard, setShowAdvisorDashboard] = useState<boolean>(false);
  const [activeCardEmiCalcId, setActiveCardEmiCalcId] = useState<string | null>(null);
  const [showGlobalEmiCalculator, setShowGlobalEmiCalculator] = useState<boolean>(false);
  const [leadsList, setLeadsList] = useState<InvestmentLead[]>(() => {
    try {
      const saved = localStorage.getItem('vernunt_investment_leads');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.debug('Error loading leads', e);
    }
    return [];
  });

  // Property detail modal state
  const [selectedProperty, setSelectedProperty] = useState<InvestmentProperty | null>(null);

  // Lead Enquiry & Callback Modal state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [leadTarget, setLeadTarget] = useState<{
    sector: InvestmentLead['targetSector'];
    title: string;
    id: string;
    providerName: string;
    providerPhone: string;
    providerEmail: string;
  } | null>(null);

  const [parentNameInput, setParentNameInput] = useState<string>(userProfile?.parentName || '');
  const [parentPhoneInput, setParentPhoneInput] = useState<string>(userProfile?.phoneNumber || userProfile?.phone || '');
  const [parentEmailInput, setParentEmailInput] = useState<string>(userProfile?.email || '');
  const [parentMessageInput, setParentMessageInput] = useState<string>('');
  const [isDispatchingLead, setIsDispatchingLead] = useState<boolean>(false);
  const [leadDispatchSuccess, setLeadDispatchSuccess] = useState<{
    smsDeliveryId: string;
    emailDeliveryId: string;
    providerPhone: string;
    providerName: string;
    parentPhone: string;
    itemTitle: string;
  } | null>(null);

  // Dynamic properties, advisors, gold stores from local storage or initial list
  const [properties, setProperties] = useState<InvestmentProperty[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PROPERTIES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.debug('Error loading properties', e);
    }
    return INITIAL_INVESTMENT_PROPERTIES;
  });

  const [advisors, setAdvisors] = useState<MutualFundAdvisor[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ADVISORS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.debug('Error loading advisors', e);
    }
    return INITIAL_MUTUAL_FUND_ADVISORS;
  });

  const [goldStores, setGoldStores] = useState<GoldSilverStore[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_GOLD_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.debug('Error loading gold stores', e);
    }
    return INITIAL_GOLD_SILVER_STORES;
  });

  // Calculate comprehensive portfolio projection result
  const planResult: KidWealthPlanResult = useMemo(() => {
    return calculateComprehensivePlan(
      monthlyAmount,
      bulkAmount,
      investMode,
      allocation,
      childAge
    );
  }, [monthlyAmount, bulkAmount, investMode, allocation, childAge]);

  // Allocation quick preset helper
  const handleSelectPreset = (re: number, mf: number, gold: number) => {
    setAllocation({
      realEstatePct: re,
      mutualFundsPct: mf,
      goldSilverPct: gold
    });
  };

  // Filtered properties
  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      if (cityFilter !== 'All' && p.city !== cityFilter) return false;
      if (propTypeFilter !== 'All' && p.propertyType !== propTypeFilter) return false;
      return true;
    });
  }, [properties, cityFilter, propTypeFilter]);

  // Save properties change
  const handleAddProperty = (newProp: InvestmentProperty) => {
    const updated = [newProp, ...properties];
    setProperties(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_PROPERTIES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.debug('Storage note', e);
    }
  };

  const handleUpdateProperty = (updatedProp: InvestmentProperty) => {
    const updated = properties.map(p => p.id === updatedProp.id ? updatedProp : p);
    setProperties(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_PROPERTIES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.debug('Storage note', e);
    }
  };

  const handleDeleteProperty = (id: string) => {
    const updated = properties.filter(p => p.id !== id);
    setProperties(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_PROPERTIES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.debug('Storage note', e);
    }
  };

  // Advisors handlers
  const handleAddAdvisor = (newAdv: MutualFundAdvisor) => {
    const updated = [newAdv, ...advisors];
    setAdvisors(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_ADVISORS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.debug('Storage note', e);
    }
  };

  const handleUpdateAdvisor = (updatedAdv: MutualFundAdvisor) => {
    const updated = advisors.map(a => a.id === updatedAdv.id ? updatedAdv : a);
    setAdvisors(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_ADVISORS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.debug('Storage note', e);
    }
  };

  const handleDeleteAdvisor = (id: string) => {
    const updated = advisors.filter(a => a.id !== id);
    setAdvisors(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_ADVISORS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.debug('Storage note', e);
    }
  };

  // Gold store handlers
  const handleAddGoldStore = (newStore: GoldSilverStore) => {
    const updated = [newStore, ...goldStores];
    setGoldStores(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_GOLD_KEY, JSON.stringify(updated));
    } catch (e) {
      console.debug('Storage note', e);
    }
  };

  const handleUpdateGoldStore = (updatedStore: GoldSilverStore) => {
    const updated = goldStores.map(s => s.id === updatedStore.id ? updatedStore : s);
    setGoldStores(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_GOLD_KEY, JSON.stringify(updated));
    } catch (e) {
      console.debug('Storage note', e);
    }
  };

  const handleDeleteGoldStore = (id: string) => {
    const updated = goldStores.filter(s => s.id !== id);
    setGoldStores(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_GOLD_KEY, JSON.stringify(updated));
    } catch (e) {
      console.debug('Storage note', e);
    }
  };

  // Open Lead Connect Modal
  const handleInitiateConnect = (
    sector: InvestmentLead['targetSector'],
    title: string,
    id: string,
    providerName: string,
    providerPhone: string,
    providerEmail: string
  ) => {
    setLeadTarget({
      sector,
      title,
      id,
      providerName,
      providerPhone,
      providerEmail
    });
    setParentNameInput(userProfile?.parentName || '');
    setParentPhoneInput(userProfile?.phoneNumber || userProfile?.phone || '');
    setParentEmailInput(userProfile?.email || '');
    setParentMessageInput('');
    setLeadDispatchSuccess(null);
    setIsConnectModalOpen(true);
  };

  // Submit Lead -> Dispatches SMS & Email to provider
  const handleConfirmLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadTarget) return;
    if (!parentNameInput.trim() || !parentPhoneInput.trim()) {
      alert('Please provide your Name and Contact Phone Number.');
      return;
    }

    setIsDispatchingLead(true);
    try {
      const allocatedSectorAmount = 
        leadTarget.sector === 'Real Estate (Plot / Site)' ? planResult.realEstateMonthly :
        leadTarget.sector === 'Mutual Fund Advisor' ? planResult.mutualFundsMonthly :
        planResult.goldSilverMonthly;

      const result = await dispatchInvestmentLead({
        parentName: parentNameInput.trim(),
        parentPhone: parentPhoneInput.trim(),
        parentEmail: parentEmailInput.trim() || undefined,
        kidName: userProfile?.childName || 'Child',
        kidAge: childAge,
        targetSector: leadTarget.sector,
        itemTitle: leadTarget.title,
        itemId: leadTarget.id,
        providerName: leadTarget.providerName,
        providerPhone: leadTarget.providerPhone,
        providerEmail: leadTarget.providerEmail,
        monthlyInvestmentAmount: allocatedSectorAmount,
        bulkInvestmentAmount: investMode === 'bulk' ? bulkAmount : undefined,
        investmentMode: investMode,
        message: parentMessageInput.trim() || `Interested in kid future investment of ₹${allocatedSectorAmount.toLocaleString('en-IN')}/mo. Please call me.`,
        parentUid: userProfile?.id,
        isGuest: !userProfile,
        createdAt: new Date().toISOString()
      });

      setLeadDispatchSuccess({
        smsDeliveryId: result.smsReceipt.deliveryId,
        emailDeliveryId: result.emailReceipt.deliveryId,
        providerPhone: leadTarget.providerPhone,
        providerName: leadTarget.providerName,
        parentPhone: parentPhoneInput.trim(),
        itemTitle: leadTarget.title
      });
    } catch (err) {
      console.error('Lead dispatch error:', err);
      alert('Notification queued. We will connect you shortly.');
    } finally {
      setIsDispatchingLead(false);
    }
  };

  return (
    <div id="kids-investments-container" className="space-y-8 animate-fade-in text-left pb-16">
      
      {/* 1. TOP HERO HIGHLIGHT BANNER */}
      <div 
        id="kids-investment-hero-banner"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white p-6 sm:p-8 md:p-10 shadow-2xl border border-emerald-500/30"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                <span>We bring low cost properties for your kid's future</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold border border-white/15">
                Target Age: 18th Year Maturity
              </span>
              {!userProfile && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-[11px] font-bold">
                  Open to all parents (No login required)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-white tracking-tight leading-tight">
              Invest in Plots, Mutual Funds &amp; Gold for Your Child's Future
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl font-medium">
              Enter your monthly capability (e.g. ₹5,000/mo) and split between <strong>low-cost plots with easy EMIs</strong>, <strong>high-return child mutual funds</strong>, and <strong>hallmarked gold</strong>. See compounding projections for the day your child turns 18!
            </p>
          </div>

          {/* Quick Partner Action Buttons */}
          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={() => { setPartnerPortalTab('real_estate'); setShowPartnerPortal(true); }}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer font-sans"
            >
              <Building2 className="w-4 h-4 text-slate-950" />
              <span>🏢 Builder / Agent Portal</span>
            </button>

            <button
              type="button"
              onClick={() => { setPartnerPortalTab('mutual_funds'); setShowPartnerPortal(true); }}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl border border-white/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-emerald-300" />
              <span>📈 MF Advisor Registration</span>
            </button>

            <button
              type="button"
              onClick={() => { setPartnerPortalTab('gold_silver'); setShowPartnerPortal(true); }}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl border border-white/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>🪙 Jeweller / Gold Store Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN INTERACTIVE CALCULATOR & ALLOCATION ENGINE */}
      <div id="kids-investment-calculator-card" className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 md:p-8 space-y-7">
        
        {/* Step 1 Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase text-emerald-700 tracking-wider">
              Step 1: Your Investment Capability
            </span>
            <h3 className="text-lg sm:text-xl font-serif font-black text-slate-900">
              How much are you capable of investing for your child?
            </h3>
          </div>

          {/* Mode Switcher: Monthly SIP vs Bulk Lump Sum */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setInvestMode('monthly')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                investMode === 'monthly' ? 'bg-white text-emerald-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly SIP / EMI
            </button>
            <button
              type="button"
              onClick={() => setInvestMode('bulk')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                investMode === 'bulk' ? 'bg-white text-emerald-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulk / Lump Sum
            </button>
          </div>
        </div>

        {/* Amount Input & Child Age Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Col 1: Investment Amount */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                {investMode === 'monthly' ? 'Monthly Investment Amount (₹)' : 'Bulk Lump Sum Amount (₹)'}
              </label>
              {investMode === 'monthly' && monthlyAmount > 50000 && (
                <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  <span>✨</span> High-Growth Tier (&gt;₹50k)
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-serif font-bold text-slate-400 text-lg">
                ₹
              </span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={investMode === 'monthly' ? 'Enter amount (e.g. 75000)' : 'Enter lump sum (e.g. 500000)'}
                value={investMode === 'monthly' ? monthlyInputStr : bulkInputStr}
                onChange={e => {
                  if (investMode === 'monthly') {
                    handleMonthlyAmountChange(e.target.value);
                  } else {
                    handleBulkAmountChange(e.target.value);
                  }
                }}
                className="w-full pl-9 pr-20 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-lg font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              {((investMode === 'monthly' ? monthlyInputStr : bulkInputStr) !== '') && (
                <button
                  type="button"
                  onClick={handleClearAmount}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-2.5 py-1 rounded-lg bg-slate-200/70 hover:bg-slate-300 transition cursor-pointer font-medium"
                  title="Clear input"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Live verbal translation / breakdown */}
            <div className="flex items-center justify-between text-[11px] text-slate-600 px-1 font-medium">
              <span>
                {investMode === 'monthly' ? (
                  monthlyAmount > 0 ? (
                    monthlyAmount >= 100000 ? (
                      <span className="text-emerald-700 font-bold">
                        ₹{(monthlyAmount / 100000).toFixed(monthlyAmount % 100000 === 0 ? 0 : 2)} Lakhs per month (₹{monthlyAmount.toLocaleString('en-IN')})
                      </span>
                    ) : (
                      <span>₹{monthlyAmount.toLocaleString('en-IN')} per month</span>
                    )
                  ) : (
                    <span className="text-slate-400 italic">Type any custom amount or select below</span>
                  )
                ) : (
                  bulkAmount > 0 ? (
                    bulkAmount >= 100000 ? (
                      <span className="text-emerald-700 font-bold">
                        ₹{(bulkAmount / 100000).toFixed(bulkAmount % 100000 === 0 ? 0 : 2)} Lakhs one-time lump sum
                      </span>
                    ) : (
                      <span>₹{bulkAmount.toLocaleString('en-IN')} lump sum</span>
                    )
                  ) : (
                    <span className="text-slate-400 italic">Type any custom lump sum amount</span>
                  )
                )}
              </span>
              {investMode === 'monthly' && (
                <span className="text-slate-400 text-[10px]">No upper limit</span>
              )}
            </div>

            {/* Quick Chips */}
            {investMode === 'monthly' ? (
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between text-[10.5px] text-slate-500 font-medium">
                  <span>Quick Amounts:</span>
                  <span className="text-emerald-700 font-bold">Includes &gt;₹50k High-Growth</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '₹2,500', val: 2500 },
                    { label: '₹5,000', val: 5000 },
                    { label: '₹10,000', val: 10000 },
                    { label: '₹15,000', val: 15000 },
                    { label: '₹25,000', val: 25000 },
                    { label: '₹50,000', val: 50000 },
                    { label: '₹75,000', val: 75000, high: true },
                    { label: '₹1 Lakh', val: 100000, high: true },
                    { label: '₹1.5 Lakh', val: 150000, high: true },
                    { label: '₹2 Lakh', val: 200000, high: true },
                    { label: '₹5 Lakh', val: 500000, high: true },
                  ].map(chip => (
                    <button
                      key={chip.val}
                      type="button"
                      onClick={() => handleSelectMonthlyChip(chip.val)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-mono font-bold transition cursor-pointer flex items-center gap-1 ${
                        monthlyAmount === chip.val 
                          ? 'bg-emerald-600 text-white shadow-xs' 
                          : chip.high 
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {chip.high && <span className="text-[9px] text-amber-500">★</span>}
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 pt-0.5">
                <div className="text-[10.5px] text-slate-500 font-medium">
                  Quick Lump Sum Amounts:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '₹50k', val: 50000 },
                    { label: '₹1L', val: 100000 },
                    { label: '₹2L', val: 200000 },
                    { label: '₹5L', val: 500000 },
                    { label: '₹10L', val: 1000000 },
                    { label: '₹25L', val: 2500000 },
                    { label: '₹50L', val: 5000000 },
                    { label: '₹1 Cr', val: 10000000 },
                  ].map(chip => (
                    <button
                      key={chip.val}
                      type="button"
                      onClick={() => handleSelectBulkChip(chip.val)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-mono font-bold transition cursor-pointer ${
                        bulkAmount === chip.val 
                          ? 'bg-emerald-600 text-white shadow-xs' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Col 2: Kid Age & Horizon */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Child's Current Age
              </label>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Horizon: {planResult.yearsToHorizon} Years to 18
              </span>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={childAge}
                onChange={e => setChildAge(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm cursor-pointer"
              >
                <option value={0}>0 Years (Newborn)</option>
                <option value={1}>1 Year Old</option>
                <option value={2}>2 Years Old</option>
                <option value={3}>3 Years Old (Pre-KG)</option>
                <option value={4}>4 Years Old</option>
                <option value={5}>5 Years Old (Kindergarten)</option>
                <option value={6}>6 Years Old (Grade 1)</option>
                <option value={7}>7 Years Old (Grade 2)</option>
                <option value={8}>8 Years Old (Grade 3)</option>
                <option value={9}>9 Years Old</option>
                <option value={10}>10 Years Old (Middle School)</option>
                <option value={11}>11 Years Old</option>
                <option value={12}>12 Years Old</option>
                <option value={13}>13 Years Old (Teenager)</option>
                <option value={14}>14 Years Old</option>
                <option value={15}>15 Years Old (10th Board)</option>
                <option value={16}>16 Years Old</option>
                <option value={17}>17 Years Old (1 Year to College)</option>
              </select>
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              {userProfile?.childName ? (
                <span>Auto-synced with <strong>{userProfile.childName}</strong>'s age from your profile.</span>
              ) : (
                <span>Maturity calculations run until your child completes 18 years.</span>
              )}
            </p>
          </div>

          {/* Col 3: Strategy Presets */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Quick Allocation Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectPreset(60, 20, 20)}
                className={`p-2 rounded-xl text-left border text-xs transition cursor-pointer ${
                  allocation.realEstatePct === 60 && allocation.mutualFundsPct === 20 
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-500/40' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-[11.5px]">🏡 60-20-20 Land First</div>
                <div className="text-[10px] text-slate-500 font-mono">60% Plots, 20% MF, 20% Gold</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset(40, 40, 20)}
                className={`p-2 rounded-xl text-left border text-xs transition cursor-pointer ${
                  allocation.realEstatePct === 40 && allocation.mutualFundsPct === 40 
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-500/40' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-[11.5px]">⚖️ 40-40-20 Balanced</div>
                <div className="text-[10px] text-slate-500 font-mono">40% Plots, 40% MF, 20% Gold</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset(70, 20, 10)}
                className={`p-2 rounded-xl text-left border text-xs transition cursor-pointer ${
                  allocation.realEstatePct === 70 
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-500/40' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-[11.5px]">📐 70% Real Estate</div>
                <div className="text-[10px] text-slate-500 font-mono">Max plot EMI sizing</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset(30, 50, 20)}
                className={`p-2 rounded-xl text-left border text-xs transition cursor-pointer ${
                  allocation.mutualFundsPct === 50 
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-500/40' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-[11.5px]">📈 50% High Growth MF</div>
                <div className="text-[10px] text-slate-500 font-mono">Max equity compounding</div>
              </button>
            </div>
          </div>
        </div>

        {/* Step 2: Custom Percentage Allocation Sliders */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-black uppercase text-emerald-700 tracking-wider">
                Step 2: Customize Sector Split
              </span>
              <h4 className="font-serif font-black text-slate-900 text-sm sm:text-base">
                Adjust the % share for each asset class
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Total Allocation:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black ${
                allocation.realEstatePct + allocation.mutualFundsPct + allocation.goldSilverPct === 100
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'bg-amber-100 text-amber-900 animate-pulse'
              }`}>
                {allocation.realEstatePct + allocation.mutualFundsPct + allocation.goldSilverPct}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Sector 1: Real Estate Slider */}
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm shadow-xs">
                    🏡
                  </div>
                  <div>
                    <h5 className="font-serif font-bold text-emerald-950 text-xs sm:text-sm">
                      Plots &amp; Real Estate
                    </h5>
                    <p className="text-[10.5px] text-emerald-700 font-medium">Low Cost Plot EMIs</p>
                  </div>
                </div>
                <span className="font-mono font-black text-emerald-900 text-base">
                  {allocation.realEstatePct}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={allocation.realEstatePct}
                onChange={e => {
                  const val = Number(e.target.value);
                  const remaining = 100 - val;
                  const half = Math.floor(remaining / 2);
                  setAllocation({
                    realEstatePct: val,
                    mutualFundsPct: half,
                    goldSilverPct: remaining - half
                  });
                }}
                className="w-full accent-emerald-600 cursor-pointer"
              />

              <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200/60">
                <span className="text-emerald-800 font-medium">Monthly Allocation:</span>
                <span className="font-mono font-black text-emerald-950">
                  ₹{planResult.realEstateMonthly.toLocaleString('en-IN')}/mo
                </span>
              </div>
            </div>

            {/* Sector 2: Mutual Funds Slider */}
            <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm shadow-xs">
                    📈
                  </div>
                  <div>
                    <h5 className="font-serif font-bold text-indigo-950 text-xs sm:text-sm">
                      Mutual Funds &amp; SIP
                    </h5>
                    <p className="text-[10.5px] text-indigo-700 font-medium">Child Education Compounding</p>
                  </div>
                </div>
                <span className="font-mono font-black text-indigo-900 text-base">
                  {allocation.mutualFundsPct}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={allocation.mutualFundsPct}
                onChange={e => {
                  const val = Number(e.target.value);
                  const remaining = 100 - val;
                  const reShare = Math.min(allocation.realEstatePct, remaining);
                  setAllocation({
                    realEstatePct: reShare,
                    mutualFundsPct: val,
                    goldSilverPct: Math.max(0, remaining - reShare)
                  });
                }}
                className="w-full accent-indigo-600 cursor-pointer"
              />

              <div className="flex items-center justify-between text-xs pt-1 border-t border-indigo-200/60">
                <span className="text-indigo-800 font-medium">Monthly Allocation:</span>
                <span className="font-mono font-black text-indigo-950">
                  ₹{planResult.mutualFundsMonthly.toLocaleString('en-IN')}/mo
                </span>
              </div>
            </div>

            {/* Sector 3: Gold / Silver Slider */}
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center text-sm shadow-xs">
                    🪙
                  </div>
                  <div>
                    <h5 className="font-serif font-bold text-amber-950 text-xs sm:text-sm">
                      Gold &amp; Silver Savings
                    </h5>
                    <p className="text-[10.5px] text-amber-700 font-medium">Jewellery / Minted 24K Blocks</p>
                  </div>
                </div>
                <span className="font-mono font-black text-amber-900 text-base">
                  {allocation.goldSilverPct}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={allocation.goldSilverPct}
                onChange={e => {
                  const val = Number(e.target.value);
                  const remaining = 100 - val;
                  const reShare = Math.min(allocation.realEstatePct, remaining);
                  setAllocation({
                    realEstatePct: reShare,
                    mutualFundsPct: Math.max(0, remaining - reShare),
                    goldSilverPct: val
                  });
                }}
                className="w-full accent-amber-600 cursor-pointer"
              />

              <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200/60">
                <span className="text-amber-800 font-medium">Monthly Allocation:</span>
                <span className="font-mono font-black text-amber-950">
                  ₹{planResult.goldSilverMonthly.toLocaleString('en-IN')}/mo
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* 3. PROJECTION CARD: WHAT HAPPENS WHEN KID TURNS 18 */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-white/10 pb-6">
            <div className="space-y-1">
              <span className="text-[10.5px] font-black uppercase text-amber-400 tracking-wider">
                🌟 Compounded Wealth Projection
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-black text-white">
                When your child turns 18 years old (in {planResult.yearsToHorizon} Years):
              </h3>
              <p className="text-xs text-slate-300">
                Based on your disciplined {investMode === 'monthly' ? `₹${monthlyAmount.toLocaleString('en-IN')}/mo` : `₹${bulkAmount.toLocaleString('en-IN')}`} capability:
              </p>
            </div>

            {/* Big Highlight Box */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center lg:text-right shrink-0 w-full lg:w-auto">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                Total Estimated Future Wealth
              </span>
              <div className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-amber-300 font-mono">
                {planResult.grandTotalEstimatedCorpusAt18 >= 10000000
                  ? `₹${(planResult.grandTotalEstimatedCorpusAt18 / 10000000).toFixed(2)} Crores`
                  : `₹${(planResult.grandTotalEstimatedCorpusAt18 / 100000).toFixed(1)} Lakhs`}
              </div>
              <span className="text-[11px] text-emerald-300 font-bold block mt-0.5">
                {planResult.totalWealthMultiplier}x Growth on {planResult.totalPrincipalInvested >= 10000000
                  ? `₹${(planResult.totalPrincipalInvested / 10000000).toFixed(2)} Cr`
                  : `₹${(planResult.totalPrincipalInvested / 100000).toFixed(1)}L`} Invested
              </span>
            </div>
          </div>

          {/* 3 Pillar Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs">
            
            {/* Real Estate Result */}
            <div className="bg-white/5 rounded-2xl p-4 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-emerald-400 text-sm flex items-center gap-1.5">
                  <span>🏡</span> Plot / Property Worth
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{allocation.realEstatePct}% share</span>
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-white">
                {planResult.realEstateEstimatedFutureValue >= 10000000
                  ? `₹${(planResult.realEstateEstimatedFutureValue / 10000000).toFixed(2)} Cr`
                  : `₹${(planResult.realEstateEstimatedFutureValue / 100000).toFixed(1)} Lakhs`}
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Affordable plot EMI: <strong>₹{planResult.realEstateAffordableEmi.toLocaleString('en-IN')}/mo</strong>. Tangible land asset registered in your family's name with ~10% annual appreciation.
              </p>
            </div>

            {/* Mutual Fund Result */}
            <div className="bg-white/5 rounded-2xl p-4 border border-indigo-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-indigo-300 text-sm flex items-center gap-1.5">
                  <span>📈</span> Mutual Fund Corpus
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{allocation.mutualFundsPct}% share</span>
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-white">
                {planResult.mutualFundsEstimatedMaturityAt18 >= 10000000
                  ? `₹${(planResult.mutualFundsEstimatedMaturityAt18 / 10000000).toFixed(2)} Cr`
                  : `₹${(planResult.mutualFundsEstimatedMaturityAt18 / 100000).toFixed(1)} Lakhs`}
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Total SIP invested: {planResult.mutualFundsTotalInvested >= 10000000 ? `₹${(planResult.mutualFundsTotalInvested / 10000000).toFixed(2)} Cr` : `₹${(planResult.mutualFundsTotalInvested / 100000).toFixed(1)}L`}. Pure compounding wealth gain of <strong>+{planResult.mutualFundsWealthGain >= 10000000 ? `₹${(planResult.mutualFundsWealthGain / 10000000).toFixed(2)} Cr` : `₹${(planResult.mutualFundsWealthGain / 100000).toFixed(1)}L`}</strong> at ~13.5% CAGR.
              </p>
            </div>

            {/* Gold / Silver Result */}
            <div className="bg-white/5 rounded-2xl p-4 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-amber-300 text-sm flex items-center gap-1.5">
                  <span>🪙</span> Gold &amp; Silver Corpus
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{allocation.goldSilverPct}% share</span>
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-white">
                {planResult.goldSilverEstimatedMaturityAt18 >= 10000000
                  ? `₹${(planResult.goldSilverEstimatedMaturityAt18 / 10000000).toFixed(2)} Cr`
                  : `₹${(planResult.goldSilverEstimatedMaturityAt18 / 100000).toFixed(1)} Lakhs`}
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Accumulates approximately <strong>{planResult.goldSilverEstimatedGrams} grams</strong> of 24K pure gold/silver blocks shielding child education from inflation.
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* 4. SECTOR RECOMMENDATION EXPLORER TABS */}
      <div className="space-y-6">
        
        {/* Navigation Selector */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSectorTab('real_estate')}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-serif font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSectorTab === 'real_estate'
                  ? 'bg-emerald-700 text-white shadow-md font-black'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>🏡 Matching Properties &amp; Plots</span>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] bg-white/20 text-white font-mono">
                {properties.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSectorTab('mutual_funds')}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-serif font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSectorTab === 'mutual_funds'
                  ? 'bg-indigo-700 text-white shadow-md font-black'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>📈 Top Child Mutual Funds &amp; Advisors</span>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] bg-white/20 text-white font-mono">
                {INITIAL_CHILD_MUTUAL_FUNDS.length + advisors.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSectorTab('gold_silver')}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-serif font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSectorTab === 'gold_silver'
                  ? 'bg-amber-700 text-white shadow-md font-black'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>🪙 Gold &amp; Silver Savings Schemes</span>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] bg-white/20 text-white font-mono">
                {goldStores.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Selecting an option triggers instant SMS &amp; Email to the creator/partner
          </div>
        </div>

        {/* TAB 1 CONTENT: MATCHING PROPERTIES (REAL ESTATE) */}
        {activeSectorTab === 'real_estate' && (
          <div className="space-y-6">
            
            {/* Filter Bar & Highlight */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg shrink-0">
                  🏡
                </div>
                <div>
                  <h4 className="font-serif font-bold text-emerald-950 text-sm">
                    Low-Cost Plots Matching Your Monthly EMI Capability: ₹{planResult.realEstateAffordableEmi.toLocaleString('en-IN')}/mo
                  </h4>
                  <p className="text-[11.5px] text-emerald-800">
                    Auto-calculated EMIs assuming standard 8.5% p.a. bank loan interest over {tenureYears} years.
                  </p>
                </div>
              </div>

              {/* City & Type Filters & Actions */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => setShowGlobalEmiCalculator(!showGlobalEmiCalculator)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    showGlobalEmiCalculator 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{showGlobalEmiCalculator ? 'Close Calculator' : 'EMI Calculator Widget'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowBuilderDashboard(true)}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Builder & Agent listing portal"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Builder &amp; Agent Portal</span>
                </button>

                <select
                  value={cityFilter}
                  onChange={e => setCityFilter(e.target.value)}
                  className="bg-white border border-emerald-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2"
                >
                  <option value="All">All Cities</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Pune">Pune</option>
                </select>

                <select
                  value={propTypeFilter}
                  onChange={e => setPropTypeFilter(e.target.value)}
                  className="bg-white border border-emerald-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2"
                >
                  <option value="All">All Types</option>
                  <option value="Plot / Site">Plots / Sites</option>
                  <option value="Gated Villa Plot">Villa Plots</option>
                  <option value="Suburban Farm Land">Farm Land</option>
                  <option value="Compact Apartment">Apartments</option>
                </select>

                <select
                  value={tenureYears}
                  onChange={e => setTenureYears(Number(e.target.value))}
                  className="bg-white border border-emerald-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 font-mono"
                  title="Loan Tenure"
                >
                  <option value={10}>10 Yrs Tenure</option>
                  <option value={15}>15 Yrs Tenure</option>
                  <option value={20}>20 Yrs Tenure</option>
                </select>
              </div>
            </div>

            {/* Expandable Property EMI Calculator Widget */}
            {showGlobalEmiCalculator && (
              <div className="animate-fade-in">
                <PropertyEmiCalculatorWidget
                  property={null}
                  defaultPrice={planResult.realEstateTargetPlotCost || 600000}
                  onSelectProperty={(p) => setSelectedProperty(p)}
                />
              </div>
            )}

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map(prop => {
                // Dynamically recalculate EMI based on current selected tenure
                const calculatedPropEmi = calculateMonthlyEmi(prop.totalPrice - prop.downPayment, 8.5, tenureYears);
                const isAffordable = calculatedPropEmi <= planResult.realEstateAffordableEmi * 1.25;

                return (
                  <div 
                    key={prop.id}
                    className="bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-400 hover:shadow-lg transition-all flex flex-col overflow-hidden group text-left"
                  >
                    {/* Image & Badges */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                      <img 
                        src={prop.images[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=600'} 
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                      
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                          {prop.approvalType}
                        </span>
                        {prop.highlightTag && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold shadow-xs">
                            {prop.highlightTag}
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                        <span className="font-mono text-xs font-bold bg-slate-900/80 px-2 py-0.5 rounded-md backdrop-blur-xs">
                          📐 {prop.plotAreaSqFt} sq.ft ({prop.dimensions})
                        </span>
                        <span className="text-[11px] font-bold bg-emerald-900/80 px-2 py-0.5 rounded-md backdrop-blur-xs">
                          {prop.propertyType}
                        </span>
                      </div>
                    </div>

                    {/* Body Info */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-serif font-black text-slate-900 text-base line-clamp-1 group-hover:text-emerald-700 transition">
                          {prop.title}
                        </h4>
                        
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{prop.locality}, {prop.city}</span>
                        </p>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                          {prop.description}
                        </p>
                      </div>

                      {/* Pricing & EMI Highlight Box */}
                      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">
                            Total Property Cost
                          </span>
                          <span className="text-base sm:text-lg font-mono font-black text-slate-900">
                            ₹{(prop.totalPrice / 100000).toFixed(1)} Lakhs
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-emerald-800 font-bold uppercase block">
                            Monthly EMI @ 8.5%
                          </span>
                          <span className="text-base sm:text-lg font-mono font-black text-emerald-700">
                            ₹{calculatedPropEmi.toLocaleString('en-IN')}/mo
                          </span>
                        </div>
                      </div>

                      {/* Interactive EMI Calculator Button for this Property */}
                      <button
                        type="button"
                        onClick={() => setActiveCardEmiCalcId(activeCardEmiCalcId === prop.id ? null : prop.id)}
                        className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{activeCardEmiCalcId === prop.id ? 'Close EMI Calculator' : 'Estimate Monthly EMI & Tenure'}</span>
                      </button>

                      {/* Expandable EMI Calculator Widget on this Property */}
                      {activeCardEmiCalcId === prop.id && (
                        <div className="pt-2 animate-fade-in">
                          <PropertyEmiCalculatorWidget
                            property={prop}
                            compact={true}
                            onSelectProperty={() => setSelectedProperty(prop)}
                          />
                        </div>
                      )}

                      {/* Builder / Agent Contact & Phone Number */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                            👤
                          </div>
                          <div className="min-w-0 truncate">
                            <span className="font-bold text-slate-800 block truncate text-[11.5px]">{prop.sellerName}</span>
                            <span className="text-[10.5px] text-slate-500 font-mono flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5 text-emerald-600" />
                              {prop.sellerPhone}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedProperty(prop)}
                          className="text-slate-600 hover:text-slate-900 text-xs font-bold underline shrink-0 cursor-pointer"
                        >
                          Details ↗
                        </button>
                      </div>

                      {/* Action CTA Button */}
                      <button
                        type="button"
                        onClick={() => handleInitiateConnect(
                          'Real Estate (Plot / Site)',
                          prop.title,
                          prop.id,
                          prop.sellerName,
                          prop.sellerPhone,
                          prop.sellerEmail
                        )}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-serif font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Connect</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2 CONTENT: MUTUAL FUNDS & ADVISORS */}
        {activeSectorTab === 'mutual_funds' && (
          <div className="space-y-8">
            
            {/* Mutual Fund SIP Compounding Card */}
            <div className="bg-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-indigo-500/30 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">
                    Child Equity Compounding
                  </span>
                  <h4 className="text-xl font-serif font-black text-white">
                    ₹{planResult.mutualFundsMonthly.toLocaleString('en-IN')}/mo SIP Wealth Result at Age 18
                  </h4>
                  <p className="text-xs text-indigo-200">
                    Invested for {planResult.yearsToHorizon} Years until your child completes 18 years of age.
                  </p>
                </div>

                <div className="bg-white/10 rounded-2xl p-4 border border-white/20 text-center sm:text-right shrink-0">
                  <span className="text-[10.5px] font-bold text-slate-300 uppercase block">
                    Total Estimated Corpus at 18
                  </span>
                  <span className="text-2xl sm:text-3xl font-mono font-black text-amber-300">
                    ₹{(planResult.mutualFundsEstimatedMaturityAt18 / 100000).toFixed(1)} Lakhs
                  </span>
                  <span className="text-[11px] text-emerald-300 font-bold block">
                    (₹{(planResult.mutualFundsTotalInvested / 100000).toFixed(1)}L Principal + ₹{(planResult.mutualFundsWealthGain / 100000).toFixed(1)}L Compounded Gain)
                  </span>
                </div>
              </div>
            </div>

            {/* Curated Mutual Funds List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <span>Curated Child Future Mutual Funds</span>
                </h4>
                <span className="text-xs text-slate-500">
                  Low expense ratio, long-term wealth creators
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {INITIAL_CHILD_MUTUAL_FUNDS.map(mf => (
                  <div key={mf.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between gap-4 hover:border-indigo-300 transition">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-150">
                          {mf.category}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Exp. Ratio: {mf.expenseRatio}%
                        </span>
                      </div>

                      <h5 className="font-serif font-bold text-slate-900 text-sm">
                        {mf.fundName}
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        {mf.fundHouse} • AUM: ₹{mf.aumCrores.toLocaleString('en-IN')} Cr
                      </p>

                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {mf.suitabilityForKids}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-[9.5px] text-slate-400 block font-sans">3Y CAGR</span>
                        <span className="font-black text-emerald-700">{mf.historical3YrCagr}%</span>
                      </div>
                      <div>
                        <span className="text-[9.5px] text-slate-400 block font-sans">5Y CAGR</span>
                        <span className="font-black text-emerald-700">{mf.historical5YrCagr}%</span>
                      </div>
                      <div>
                        <span className="text-[9.5px] text-slate-400 block font-sans">Min SIP</span>
                        <span className="font-bold text-slate-900">₹{mf.minMonthlySip}/mo</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-[10.5px] text-slate-500 font-medium truncate max-w-[220px]">
                        🔒 {mf.lockInPeriod}
                      </span>
                      {mf.directAmcUrl && (
                        <a 
                          href={mf.directAmcUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 text-[11px]"
                        >
                          AMC Portal <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certified AMFI Mutual Fund Advisors */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-serif font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <span>Certified AMFI Mutual Fund Advisors for Child Education</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Connect directly for customized college portfolio structuring &amp; minor demat accounts
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAdvisorDashboard(true)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Advisor Dashboard &amp; Credentials</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPartnerPortalTab('mutual_funds'); setShowPartnerPortal(true); }}
                    className="text-xs font-bold text-indigo-700 hover:underline cursor-pointer shrink-0 hidden sm:inline"
                  >
                    + Quick Register ↗
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {advisors.map(adv => (
                  <div key={adv.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between gap-4 hover:border-indigo-400 transition">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={adv.photoUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'} 
                          alt={adv.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shrink-0" 
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-black uppercase text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded font-mono">
                            {adv.arnNumber}
                          </span>
                          <h5 className="font-serif font-bold text-slate-900 text-sm truncate mt-1">
                            {adv.name}
                          </h5>
                          <p className="text-[11px] text-slate-500 truncate">
                            {adv.agencyName} ({adv.experienceYears}+ yrs exp)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-amber-500 font-bold">★ {adv.rating}</span>
                        <span className="text-slate-400">({adv.reviewsCount} reviews)</span>
                        <span className="ml-auto text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded">
                          {adv.feeType}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {adv.specialization.map((spec, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {spec}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {adv.bio}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                        <Phone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{adv.phone}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleInitiateConnect(
                          'Mutual Fund Advisor',
                          adv.name,
                          adv.id,
                          adv.name,
                          adv.phone,
                          adv.email
                        )}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-serif font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Connect</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3 CONTENT: GOLD & SILVER STORES */}
        {activeSectorTab === 'gold_silver' && (
          <div className="space-y-6">
            
            {/* Gold Accumulation Highlight */}
            <div className="bg-amber-950 text-white rounded-3xl p-6 sm:p-8 border border-amber-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
                    Physical Gold &amp; Bullion Security
                  </span>
                  <h4 className="text-xl font-serif font-black text-white">
                    ₹{planResult.goldSilverMonthly.toLocaleString('en-IN')}/mo Gold Accumulation Result
                  </h4>
                  <p className="text-xs text-amber-200">
                    Expected to accumulate approximately <strong>{planResult.goldSilverEstimatedGrams} grams</strong> of pure precious gold by age 18.
                  </p>
                </div>

                <div className="bg-white/10 rounded-2xl p-4 border border-white/20 text-center sm:text-right shrink-0">
                  <span className="text-[10.5px] font-bold text-slate-300 uppercase block">
                    Estimated Gold Corpus at 18
                  </span>
                  <span className="text-2xl sm:text-3xl font-mono font-black text-amber-300">
                    ₹{(planResult.goldSilverEstimatedMaturityAt18 / 100000).toFixed(1)} Lakhs
                  </span>
                  <span className="text-[11px] text-emerald-300 font-bold block">
                    (Protects child marriage &amp; education from inflation)
                  </span>
                </div>
              </div>
            </div>

            {/* Stores List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goldStores.map(store => (
                <div key={store.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-xs hover:border-amber-400 transition">
                  <div className="relative h-44 w-full bg-slate-100">
                    <img 
                      src={store.imageUrl || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600'} 
                      alt={store.storeName}
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                    
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase shadow-xs">
                        {store.jewellerChain}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="text-[11px] font-mono bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur-xs">
                        {store.hallmarkPurity}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-serif font-black text-slate-900 text-base">
                        {store.storeName}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{store.address}</span>
                      </p>

                      {/* Scheme details card */}
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-serif font-bold text-amber-950">{store.schemeName}</span>
                          <span className="font-mono font-black text-amber-800">Min ₹{store.minMonthlyDeposit}/mo</span>
                        </div>
                        <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                          🎁 {store.bonusOffer}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block text-[11px]">{store.managerName}</span>
                        <span className="font-mono text-slate-500 text-[11px]">{store.phone}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleInitiateConnect(
                          'Gold / Silver Store',
                          `${store.storeName} (${store.schemeName})`,
                          store.id,
                          store.managerName,
                          store.phone,
                          store.email
                        )}
                        className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-serif font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Enroll &amp; Request Callback</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

      {/* 5. PROPERTY DETAIL MODAL */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto text-left">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            
            <div className="relative h-64 w-full bg-slate-100">
              <img 
                src={selectedProperty.images[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800'} 
                alt={selectedProperty.title}
                className="w-full h-full object-cover" 
              />
              <button
                type="button"
                onClick={() => setSelectedProperty(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white transition cursor-pointer backdrop-blur-xs"
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-xs font-black uppercase tracking-wider shadow-sm">
                  {selectedProperty.approvalType}
                </span>
                {selectedProperty.reraNumber && (
                  <span className="text-xs font-mono bg-slate-900/80 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                    RERA: {selectedProperty.reraNumber}
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-left">
              <div>
                <span className="text-[11px] font-mono text-emerald-700 uppercase font-black tracking-wider block">
                  {selectedProperty.propertyType} • {selectedProperty.dimensions} ({selectedProperty.plotAreaSqFt} Sq.Ft)
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-black text-slate-900">
                  {selectedProperty.title}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedProperty.locality}, {selectedProperty.city}</span>
                </p>
              </div>

              {/* Price & EMI Box */}
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">Total Plot Price</span>
                  <span className="text-2xl font-mono font-black text-slate-900">
                    ₹{(selectedProperty.totalPrice / 100000).toFixed(1)} Lakhs
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Down payment: ₹{(selectedProperty.downPayment / 100000).toFixed(1)}L (10%)
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">Monthly EMI (15 Yrs @ 8.5%)</span>
                  <span className="text-2xl font-mono font-black text-emerald-700">
                    ₹{selectedProperty.monthlyEmi.toLocaleString('en-IN')}/mo
                  </span>
                  <span className="text-[11px] text-emerald-800 font-bold block">
                    Matches your kid's plan!
                  </span>
                </div>
              </div>

              {/* Interactive EMI Calculator for this specific Property */}
              <div className="pt-1">
                <PropertyEmiCalculatorWidget
                  property={selectedProperty}
                  compact={true}
                />
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">About this Property for Kid's Wealth:</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {selectedProperty.description}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">Key Community Amenities:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selectedProperty.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 text-slate-700">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">Approved Loan Partners:</h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  {selectedProperty.bankLoanPartners.map((bank, idx) => (
                    <span key={idx} className="px-3 py-1 bg-slate-100 rounded-lg text-slate-800 font-medium">
                      🏦 {bank}
                    </span>
                  ))}
                </div>
              </div>

              {/* Direct Contact */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Posted by {selectedProperty.sellerType}
                  </span>
                  <h5 className="font-bold text-sm text-white">
                    {selectedProperty.sellerName}
                  </h5>
                  <p className="text-xs text-slate-300 font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>Direct Call: {selectedProperty.sellerPhone}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedProperty(null);
                    handleInitiateConnect(
                      'Real Estate (Plot / Site)',
                      selectedProperty.title,
                      selectedProperty.id,
                      selectedProperty.sellerName,
                      selectedProperty.sellerPhone,
                      selectedProperty.sellerEmail
                    );
                  }}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-serif font-black text-xs rounded-xl shadow-md transition shrink-0 cursor-pointer"
                >
                  Request Callback &amp; SMS
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 6. CONNECT / ENQUIRY MODAL (Dispatches SMS & Email to Poster) */}
      {isConnectModalOpen && leadTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in text-left">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-5 sm:p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  Instant Connection Alert
                </span>
                <h3 className="text-lg font-serif font-black text-white">
                  Connect with {leadTarget.providerName}
                </h3>
                <p className="text-xs text-emerald-200/90 truncate">
                  {leadTarget.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5 sm:p-6 space-y-4">
              {leadDispatchSuccess ? (
                <div className="space-y-4 text-center py-4 animate-fade-in">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                    ✓
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-serif font-black text-slate-900 text-lg">
                      SMS &amp; Email Alert Dispatched!
                    </h4>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                      We have notified <strong>{leadDispatchSuccess.providerName}</strong> via verified SMS &amp; Email with your contact details (<strong>{leadDispatchSuccess.parentPhone}</strong>). They will call you shortly.
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-left space-y-1.5 font-mono text-[11px] text-slate-700">
                    <div className="flex items-center justify-between">
                      <span>SMS Gateway Tracking:</span>
                      <span className="text-emerald-700 font-bold">{leadDispatchSuccess.smsDeliveryId} (Delivered)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Email Delivery Receipt:</span>
                      <span className="text-emerald-700 font-bold">{leadDispatchSuccess.emailDeliveryId} (Delivered)</span>
                    </div>
                  </div>

                  {/* Immediate 1-tap direct options */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                    <a
                      href={`tel:${leadDispatchSuccess.providerPhone}`}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-serif font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Direct Call ({leadDispatchSuccess.providerPhone})</span>
                    </a>
                    <a
                      href={`https://wa.me/${leadDispatchSuccess.providerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${leadDispatchSuccess.providerName}, I saw your ${leadDispatchSuccess.itemTitle} on Vernunt Kids Wealth. I am interested in exploring this for my child's future. Please share details.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-serif font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp Chat</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsConnectModalOpen(false)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer mt-2"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleConfirmLeadSubmit} className="space-y-4">
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 text-xs text-emerald-950 space-y-1">
                    <div className="font-bold flex items-center justify-between">
                      <span>Selected: {leadTarget.title}</span>
                      <span className="font-mono text-emerald-800">Age: {childAge} yrs</span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Target monthly capability: <strong>₹{(
                        leadTarget.sector === 'Real Estate (Plot / Site)' ? planResult.realEstateMonthly :
                        leadTarget.sector === 'Mutual Fund Advisor' ? planResult.mutualFundsMonthly :
                        planResult.goldSilverMonthly
                      ).toLocaleString('en-IN')}/mo</strong>
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Your Name (Parent / Guardian) *</label>
                      <input
                        type="text"
                        required
                        value={parentNameInput}
                        onChange={e => setParentNameInput(e.target.value)}
                        placeholder="e.g. Anand Sharma"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Your Mobile Number (For Call &amp; SMS) *</label>
                      <input
                        type="tel"
                        required
                        value={parentPhoneInput}
                        onChange={e => setParentPhoneInput(e.target.value)}
                        placeholder="+91 98450 12345"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Your Email (Optional)</label>
                      <input
                        type="email"
                        value={parentEmailInput}
                        onChange={e => setParentEmailInput(e.target.value)}
                        placeholder="anand@example.com"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Message / Best Time to Call</label>
                      <textarea
                        rows={2}
                        value={parentMessageInput}
                        onChange={e => setParentMessageInput(e.target.value)}
                        placeholder="e.g. Available after 6 PM, interested in weekend site visit..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>An automated SMS &amp; Email notification will be sent to {leadTarget.providerName} with your contact number.</span>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsConnectModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isDispatchingLead}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-serif font-black text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      {isDispatchingLead ? 'Dispatching SMS & Email...' : 'Confirm & Send SMS Alert'}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 7. PARTNER PORTAL DASHBOARDS (FOR BUILDERS, MF ADVISORS, JEWELLERS) */}
      <PartnerInvestmentPortal
        isOpen={showPartnerPortal}
        onClose={() => setShowPartnerPortal(false)}
        initialTab={partnerPortalTab}
        properties={properties}
        onAddProperty={handleAddProperty}
        onUpdateProperty={handleUpdateProperty}
        onDeleteProperty={handleDeleteProperty}
        advisors={advisors}
        onAddAdvisor={handleAddAdvisor}
        onUpdateAdvisor={handleUpdateAdvisor}
        onDeleteAdvisor={handleDeleteAdvisor}
        goldStores={goldStores}
        onAddGoldStore={handleAddGoldStore}
        onUpdateGoldStore={handleUpdateGoldStore}
        onDeleteGoldStore={handleDeleteGoldStore}
        isAdmin={isAdmin}
      />

      {/* 8. DEDICATED SECURE BUILDER & REAL ESTATE AGENT DASHBOARD */}
      <BuilderAgentDashboard
        isOpen={showBuilderDashboard}
        onClose={() => setShowBuilderDashboard(false)}
        properties={properties}
        onAddProperty={handleAddProperty}
        onUpdateProperty={handleUpdateProperty}
        onDeleteProperty={handleDeleteProperty}
        leads={leadsList}
      />

      {/* 9. DEDICATED MUTUAL FUND ADVISOR CREDENTIALS & PROFILE DASHBOARD */}
      <MutualFundAdvisorDashboard
        isOpen={showAdvisorDashboard}
        onClose={() => setShowAdvisorDashboard(false)}
        advisors={advisors}
        onAddAdvisor={handleAddAdvisor}
        onUpdateAdvisor={handleUpdateAdvisor}
        onDeleteAdvisor={handleDeleteAdvisor}
        leads={leadsList}
      />

    </div>
  );
}
