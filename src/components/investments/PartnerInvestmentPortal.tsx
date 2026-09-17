import React, { useState } from 'react';
import { 
  InvestmentProperty, 
  MutualFundAdvisor, 
  GoldSilverStore 
} from '../../types/investment.ts';
import { calculateMonthlyEmi } from '../../data/kidsInvestmentData.ts';
import { 
  Building2, TrendingUp, Sparkles, Plus, Trash2, Edit3, CheckCircle2, 
  X, Phone, Mail, MapPin, ShieldCheck, ArrowRight, ExternalLink, Award 
} from 'lucide-react';

interface PartnerInvestmentPortalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'real_estate' | 'mutual_funds' | 'gold_silver';
  properties: InvestmentProperty[];
  onAddProperty: (prop: InvestmentProperty) => void;
  onUpdateProperty: (prop: InvestmentProperty) => void;
  onDeleteProperty: (id: string) => void;
  advisors: MutualFundAdvisor[];
  onAddAdvisor: (adv: MutualFundAdvisor) => void;
  onUpdateAdvisor: (adv: MutualFundAdvisor) => void;
  onDeleteAdvisor: (id: string) => void;
  goldStores: GoldSilverStore[];
  onAddGoldStore: (store: GoldSilverStore) => void;
  onUpdateGoldStore: (store: GoldSilverStore) => void;
  onDeleteGoldStore: (id: string) => void;
  isAdmin?: boolean;
}

export default function PartnerInvestmentPortal({
  isOpen,
  onClose,
  initialTab = 'real_estate',
  properties,
  onAddProperty,
  onUpdateProperty,
  onDeleteProperty,
  advisors,
  onAddAdvisor,
  onUpdateAdvisor,
  onDeleteAdvisor,
  goldStores,
  onAddGoldStore,
  onUpdateGoldStore,
  onDeleteGoldStore,
  isAdmin = false
}: PartnerInvestmentPortalProps) {
  const [activeTab, setActiveTab] = useState<'real_estate' | 'mutual_funds' | 'gold_silver'>(initialTab);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Property Form State
  const [propForm, setPropForm] = useState({
    title: '',
    propertyType: 'Plot / Site' as InvestmentProperty['propertyType'],
    city: 'Bengaluru',
    locality: '',
    totalPrice: 500000,
    downPayment: 50000,
    tenureYears: 15,
    plotAreaSqFt: 1200,
    dimensions: '30 x 40 ft',
    approvalType: 'RERA & BDA Approved' as InvestmentProperty['approvalType'],
    reraNumber: '',
    highlightTag: '⭐ Kid Future Top Pick',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800',
    amenities: 'Kids Play Zone, 24/7 Gated Security, Underground Drainage, 40-ft Roads',
    bankLoanPartners: 'State Bank of India, HDFC Bank, ICICI Bank',
    sellerType: 'Builder' as InvestmentProperty['sellerType'],
    sellerName: '',
    sellerPhone: '',
    sellerEmail: '',
    sellerAgency: ''
  });

  // Advisor Form State
  const [advForm, setAdvForm] = useState({
    name: '',
    arnNumber: 'ARN-',
    sebiRegNumber: '',
    agencyName: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    experienceYears: 10,
    feeType: 'Free Initial Consultation' as MutualFundAdvisor['feeType'],
    phone: '',
    email: '',
    photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300',
    specialization: 'Child Higher Education Corpus, Sukanya Samriddhi vs Equity SIP, 18th Year Maturity Planning',
    bio: ''
  });

  // Gold Store Form State
  const [goldForm, setGoldForm] = useState({
    storeName: '',
    jewellerChain: 'Tanishq (Tata Group)',
    city: 'Bengaluru',
    address: '',
    phone: '',
    email: '',
    schemeName: 'Child Golden Future 11-Month Plan',
    schemeType: 'Monthly Savings Plan (11 Months)' as GoldSilverStore['schemeType'],
    minMonthlyDeposit: 1000,
    bonusOffer: 'Pay 10 months, Store contributes 11th month bonus + 50% off on making charges',
    hallmarkPurity: '100% BIS Hallmarked 22K (916) & 24K (999.9)',
    managerName: '',
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800'
  });

  if (!isOpen) return null;

  // Real estate EMI preview
  const calculatedEmi = calculateMonthlyEmi(propForm.totalPrice - propForm.downPayment, 8.5, propForm.tenureYears);

  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propForm.title || !propForm.sellerPhone) {
      alert('Please fill property title and seller phone number');
      return;
    }

    const newProp: InvestmentProperty = {
      id: editingId || `prop-${Date.now()}`,
      title: propForm.title,
      propertyType: propForm.propertyType,
      city: propForm.city,
      locality: propForm.locality || `${propForm.city} Growth Corridor`,
      totalPrice: Number(propForm.totalPrice),
      downPayment: Number(propForm.downPayment),
      monthlyEmi: calculatedEmi,
      interestRate: 8.5,
      tenureYears: Number(propForm.tenureYears),
      plotAreaSqFt: Number(propForm.plotAreaSqFt),
      dimensions: propForm.dimensions,
      approvalType: propForm.approvalType,
      reraNumber: propForm.reraNumber || undefined,
      highlightTag: propForm.highlightTag || `Low Cost EMI (₹${calculatedEmi.toLocaleString('en-IN')}/mo)`,
      description: propForm.description || 'Premium low-cost kid investment property with high appreciation prospects.',
      images: [propForm.imageUrl],
      amenities: propForm.amenities.split(',').map(s => s.trim()).filter(Boolean),
      bankLoanPartners: propForm.bankLoanPartners.split(',').map(s => s.trim()).filter(Boolean),
      sellerType: propForm.sellerType,
      sellerName: propForm.sellerName || 'Verified Property Partner',
      sellerPhone: propForm.sellerPhone,
      sellerEmail: propForm.sellerEmail || 'sales@vernuntproperties.com',
      sellerAgency: propForm.sellerAgency,
      isVerified: true,
      createdAt: new Date().toISOString()
    };

    if (editingId) {
      onUpdateProperty(newProp);
      setSaveSuccessMsg('Property updated successfully!');
    } else {
      onAddProperty(newProp);
      setSaveSuccessMsg('Property published! Parents can now explore and request callbacks with instant SMS/Email notifications.');
    }

    setTimeout(() => setSaveSuccessMsg(null), 4000);
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleSaveAdvisor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advForm.name || !advForm.arnNumber || !advForm.phone) {
      alert('Please fill advisor name, ARN number, and contact phone.');
      return;
    }

    const newAdv: MutualFundAdvisor = {
      id: editingId || `mfa-${Date.now()}`,
      name: advForm.name,
      arnNumber: advForm.arnNumber,
      sebiRegNumber: advForm.sebiRegNumber || undefined,
      agencyName: advForm.agencyName || 'Independent Child Wealth Advisor',
      city: advForm.city,
      state: advForm.state,
      experienceYears: Number(advForm.experienceYears),
      rating: 4.9,
      reviewsCount: 1,
      specialization: advForm.specialization.split(',').map(s => s.trim()).filter(Boolean),
      feeType: advForm.feeType,
      phone: advForm.phone,
      email: advForm.email || 'advisor@vernunt.com',
      photoUrl: advForm.photoUrl,
      bio: advForm.bio || 'AMFI Certified Child Education and SIP specialist helping parents build long-term future wealth.',
      isVerified: true,
      createdAt: new Date().toISOString()
    };

    if (editingId) {
      onUpdateAdvisor(newAdv);
      setSaveSuccessMsg('Mutual Fund Advisor profile updated!');
    } else {
      onAddAdvisor(newAdv);
      setSaveSuccessMsg('Advisor profile registered! You are now featured in both Kids Investments & the Specialists Directory.');
    }

    setTimeout(() => setSaveSuccessMsg(null), 4000);
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleSaveGoldStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goldForm.storeName || !goldForm.phone) {
      alert('Please fill Store Name and Phone Number.');
      return;
    }

    const newStore: GoldSilverStore = {
      id: editingId || `gold-${Date.now()}`,
      storeName: goldForm.storeName,
      jewellerChain: goldForm.jewellerChain,
      city: goldForm.city,
      address: goldForm.address || `${goldForm.city} Main Road Showroom`,
      phone: goldForm.phone,
      email: goldForm.email || 'gold@vernunt.com',
      schemeName: goldForm.schemeName,
      schemeType: goldForm.schemeType,
      minMonthlyDeposit: Number(goldForm.minMonthlyDeposit),
      bonusOffer: goldForm.bonusOffer,
      hallmarkPurity: goldForm.hallmarkPurity,
      imageUrl: goldForm.imageUrl,
      managerName: goldForm.managerName || 'Store Manager',
      isVerified: true,
      createdAt: new Date().toISOString()
    };

    if (editingId) {
      onUpdateGoldStore(newStore);
      setSaveSuccessMsg('Gold / Silver Store & Scheme updated!');
    } else {
      onAddGoldStore(newStore);
      setSaveSuccessMsg('Gold Scheme published! Parents can now enroll and connect for monthly savings.');
    }

    setTimeout(() => setSaveSuccessMsg(null), 4000);
    setShowAddForm(false);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] text-left">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                Partner &amp; Creator Hub
              </span>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                  Admin Access
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-black text-white">
              Kids Wealth Partner Dashboards
            </h3>
            <p className="text-xs text-slate-300">
              Manage listings, profiles, and savings schemes. Real-time parent leads will be dispatched to your phone &amp; email via instant SMS &amp; notification.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Tab Bar */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 sm:px-6 py-2 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setActiveTab('real_estate'); setShowAddForm(false); setEditingId(null); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'real_estate' 
                  ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Real Estate Builders &amp; Agents ({properties.length})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('mutual_funds'); setShowAddForm(false); setEditingId(null); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'mutual_funds' 
                  ? 'bg-white text-indigo-800 shadow-sm border border-indigo-200' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Mutual Fund Advisors ({advisors.length})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('gold_silver'); setShowAddForm(false); setEditingId(null); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'gold_silver' 
                  ? 'bg-white text-amber-800 shadow-sm border border-amber-200' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Gold &amp; Silver Stores ({goldStores.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); }}
            className="px-3.5 py-2 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Cancel Form' : '+ Add New Listing'}</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {saveSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 px-6 py-3 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: REAL ESTATE BUILDERS & AGENTS */}
          {activeTab === 'real_estate' && (
            <div className="space-y-6">
              {showAddForm ? (
                <form onSubmit={handleSaveProperty} className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                    <h4 className="font-serif font-black text-emerald-950 text-sm sm:text-base flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-700" />
                      <span>{editingId ? 'Edit Property Listing' : 'Post New Kid Future Property / Plot'}</span>
                    </h4>
                    <span className="text-[11px] text-emerald-800 font-semibold">
                      Auto EMI Calculated @ 8.5%: <strong className="text-emerald-900 font-mono">₹{calculatedEmi.toLocaleString('en-IN')}/mo</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Property Title *</label>
                      <input
                        type="text"
                        required
                        value={propForm.title}
                        onChange={e => setPropForm({ ...propForm, title: e.target.value })}
                        placeholder="e.g. Aeropolis Pride Gated Villa Plots"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Property Type</label>
                      <select
                        value={propForm.propertyType}
                        onChange={e => setPropForm({ ...propForm, propertyType: e.target.value as any })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                      >
                        <option value="Plot / Site">Plot / Site</option>
                        <option value="Gated Villa Plot">Gated Villa Plot</option>
                        <option value="Suburban Farm Land">Suburban Farm Land</option>
                        <option value="Compact Apartment">Compact Apartment</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">City</label>
                      <input
                        type="text"
                        value={propForm.city}
                        onChange={e => setPropForm({ ...propForm, city: e.target.value })}
                        placeholder="e.g. Bengaluru, Hyderabad, Pune"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Locality &amp; Growth Hub</label>
                      <input
                        type="text"
                        value={propForm.locality}
                        onChange={e => setPropForm({ ...propForm, locality: e.target.value })}
                        placeholder="e.g. Devanahalli Airport Corridor"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Total Price (₹) * <span className="text-slate-400 font-normal">(e.g. 500000 = 5 Lakhs)</span>
                      </label>
                      <input
                        type="number"
                        min="100000"
                        step="10000"
                        required
                        value={propForm.totalPrice}
                        onChange={e => setPropForm({ ...propForm, totalPrice: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Down Payment (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        value={propForm.downPayment}
                        onChange={e => setPropForm({ ...propForm, downPayment: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Plot Area (Sq.Ft) &amp; Dimensions</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Sq.Ft (e.g. 1200)"
                          value={propForm.plotAreaSqFt}
                          onChange={e => setPropForm({ ...propForm, plotAreaSqFt: Number(e.target.value) })}
                          className="w-1/2 p-2.5 bg-white border border-slate-200 rounded-xl"
                        />
                        <input
                          type="text"
                          placeholder="Dimensions (30x40)"
                          value={propForm.dimensions}
                          onChange={e => setPropForm({ ...propForm, dimensions: e.target.value })}
                          className="w-1/2 p-2.5 bg-white border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Approval Authority</label>
                      <select
                        value={propForm.approvalType}
                        onChange={e => setPropForm({ ...propForm, approvalType: e.target.value as any })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                      >
                        <option value="RERA & BDA Approved">RERA &amp; BDA Approved</option>
                        <option value="DTCP Approved">DTCP Approved</option>
                        <option value="HMDA Approved">HMDA Approved</option>
                        <option value="PMRDA Approved">PMRDA Approved</option>
                        <option value="Panchayat Khata A">Panchayat Khata A</option>
                        <option value="DC Converted">DC Converted</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">RERA Registration No. (Optional)</label>
                      <input
                        type="text"
                        value={propForm.reraNumber}
                        onChange={e => setPropForm({ ...propForm, reraNumber: e.target.value })}
                        placeholder="e.g. PRM/KA/RERA/..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Highlight Badge</label>
                      <input
                        type="text"
                        value={propForm.highlightTag}
                        onChange={e => setPropForm({ ...propForm, highlightTag: e.target.value })}
                        placeholder="e.g. ⭐ Kid Future Top Pick"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">Property Image URL</label>
                      <input
                        type="url"
                        value={propForm.imageUrl}
                        onChange={e => setPropForm({ ...propForm, imageUrl: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">Description &amp; Highlights for Kid's Future</label>
                      <textarea
                        rows={2}
                        value={propForm.description}
                        onChange={e => setPropForm({ ...propForm, description: e.target.value })}
                        placeholder="Explain why this property is a high-growth investment for children before they turn 18..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2 border-t border-emerald-200/60 pt-3">
                      <h5 className="font-bold text-slate-800 mb-2">Builder / Agent Contact (Receives instant SMS &amp; Email on inquiry):</h5>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Contact Name *</label>
                      <input
                        type="text"
                        required
                        value={propForm.sellerName}
                        onChange={e => setPropForm({ ...propForm, sellerName: e.target.value })}
                        placeholder="e.g. Venkatesh Rao (Builder Sales Head)"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Phone Number (SMS Receiver) *</label>
                      <input
                        type="tel"
                        required
                        value={propForm.sellerPhone}
                        onChange={e => setPropForm({ ...propForm, sellerPhone: e.target.value })}
                        placeholder="+91 98450 12840"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-emerald-800"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Email Address (Email Alerts)</label>
                      <input
                        type="email"
                        value={propForm.sellerEmail}
                        onChange={e => setPropForm({ ...propForm, sellerEmail: e.target.value })}
                        placeholder="sales@aeropolisinfra.in"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Builder / Agency Brand Name</label>
                      <input
                        type="text"
                        value={propForm.sellerAgency}
                        onChange={e => setPropForm({ ...propForm, sellerAgency: e.target.value })}
                        placeholder="e.g. Aeropolis Green Infrastructure LLP"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-serif font-black text-xs shadow-md transition"
                    >
                      {editingId ? 'Save Changes' : 'Publish Property for Kids Future'}
                    </button>
                  </div>
                </form>
              ) : null}

              {/* Existing Properties List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-slate-900 text-sm">
                    Active Property Listings ({properties.length})
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    All properties calculate EMI automatically based on parents' monthly budget.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {properties.map(p => (
                    <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between gap-3 hover:border-emerald-300 transition">
                      <div className="flex gap-3">
                        <img 
                          src={p.images[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=300'} 
                          alt={p.title} 
                          className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-100"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-150">
                              {p.propertyType}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {p.dimensions}
                            </span>
                          </div>
                          <h5 className="font-serif font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                            {p.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{p.locality}, {p.city}</span>
                          </p>
                          <div className="flex items-center gap-3 pt-1">
                            <span className="font-bold text-xs text-slate-900">
                              ₹{(p.totalPrice / 100000).toFixed(1)} Lakhs
                            </span>
                            <span className="font-black text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                              ₹{p.monthlyEmi.toLocaleString('en-IN')}/mo EMI
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="font-mono text-[11px] truncate">{p.sellerPhone} ({p.sellerName})</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setPropForm({
                                title: p.title,
                                propertyType: p.propertyType,
                                city: p.city,
                                locality: p.locality,
                                totalPrice: p.totalPrice,
                                downPayment: p.downPayment,
                                tenureYears: p.tenureYears,
                                plotAreaSqFt: p.plotAreaSqFt,
                                dimensions: p.dimensions,
                                approvalType: p.approvalType,
                                reraNumber: p.reraNumber || '',
                                highlightTag: p.highlightTag || '',
                                description: p.description,
                                imageUrl: p.images[0] || '',
                                amenities: p.amenities.join(', '),
                                bankLoanPartners: p.bankLoanPartners.join(', '),
                                sellerType: p.sellerType,
                                sellerName: p.sellerName,
                                sellerPhone: p.sellerPhone,
                                sellerEmail: p.sellerEmail,
                                sellerAgency: p.sellerAgency || ''
                              });
                              setEditingId(p.id);
                              setShowAddForm(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
                            title="Edit Property"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete property "${p.title}"?`)) {
                                onDeleteProperty(p.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                            title="Delete Property"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MUTUAL FUND ADVISORS */}
          {activeTab === 'mutual_funds' && (
            <div className="space-y-6">
              {showAddForm ? (
                <form onSubmit={handleSaveAdvisor} className="bg-indigo-50/50 border border-indigo-200/80 rounded-2xl p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3">
                    <h4 className="font-serif font-black text-indigo-950 text-sm sm:text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-700" />
                      <span>{editingId ? 'Edit Advisor Profile' : 'Register as AMFI Certified Child Wealth Advisor'}</span>
                    </h4>
                    <span className="text-[11px] text-indigo-800 font-semibold">
                      Auto-syncs to Specialists Tab
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Full Name &amp; Credentials *</label>
                      <input
                        type="text"
                        required
                        value={advForm.name}
                        onChange={e => setAdvForm({ ...advForm, name: e.target.value })}
                        placeholder="e.g. Suresh K. Narayanan, CFP"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">AMFI Registration Number (ARN) *</label>
                      <input
                        type="text"
                        required
                        value={advForm.arnNumber}
                        onChange={e => setAdvForm({ ...advForm, arnNumber: e.target.value })}
                        placeholder="e.g. ARN-189240"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-indigo-800"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Firm / Agency Name</label>
                      <input
                        type="text"
                        value={advForm.agencyName}
                        onChange={e => setAdvForm({ ...advForm, agencyName: e.target.value })}
                        placeholder="e.g. Balaji Child Wealth Planners"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">City &amp; State</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="City (Bengaluru)"
                          value={advForm.city}
                          onChange={e => setAdvForm({ ...advForm, city: e.target.value })}
                          className="w-1/2 p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={advForm.state}
                          onChange={e => setAdvForm({ ...advForm, state: e.target.value })}
                          className="w-1/2 p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Phone Number (SMS Receiver) *</label>
                      <input
                        type="tel"
                        required
                        value={advForm.phone}
                        onChange={e => setAdvForm({ ...advForm, phone: e.target.value })}
                        placeholder="+91 98450 78210"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-indigo-900"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                      <input
                        type="email"
                        value={advForm.email}
                        onChange={e => setAdvForm({ ...advForm, email: e.target.value })}
                        placeholder="advisor@balajiwealth.in"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Years of Experience</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={advForm.experienceYears}
                        onChange={e => setAdvForm({ ...advForm, experienceYears: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Advisory Fee Type</label>
                      <select
                        value={advForm.feeType}
                        onChange={e => setAdvForm({ ...advForm, feeType: e.target.value as any })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                      >
                        <option value="Free Initial Consultation">Free Initial Consultation</option>
                        <option value="Zero Commission Direct">Zero Commission Direct</option>
                        <option value="Flat Advisory Fee">Flat Advisory Fee</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">Profile Photo URL</label>
                      <input
                        type="url"
                        value={advForm.photoUrl}
                        onChange={e => setAdvForm({ ...advForm, photoUrl: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">Specializations (comma separated)</label>
                      <input
                        type="text"
                        value={advForm.specialization}
                        onChange={e => setAdvForm({ ...advForm, specialization: e.target.value })}
                        placeholder="Child Higher Education, Sukanya Samriddhi vs SIP, Minor Accounts..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">Professional Bio</label>
                      <textarea
                        rows={2}
                        value={advForm.bio}
                        onChange={e => setAdvForm({ ...advForm, bio: e.target.value })}
                        placeholder="Describe your approach in guiding parents towards inflation-beating 18-year compounding..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-serif font-black text-xs shadow-md transition"
                    >
                      {editingId ? 'Save Advisor Profile' : 'Register Advisor & Display in Directory'}
                    </button>
                  </div>
                </form>
              ) : null}

              {/* Existing Advisors List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-slate-900 text-sm">
                    Registered Mutual Fund Advisors ({advisors.length})
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Verified AMFI professionals guiding parents on child compounding
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {advisors.map(adv => (
                    <div key={adv.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between gap-3 hover:border-indigo-300 transition">
                      <div className="flex gap-3">
                        <img 
                          src={adv.photoUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300'} 
                          alt={adv.name} 
                          className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-100 shadow-xs"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-150 font-mono">
                              {adv.arnNumber}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                              {adv.feeType}
                            </span>
                          </div>
                          <h5 className="font-serif font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                            {adv.name}
                          </h5>
                          <p className="text-[11px] text-slate-500 truncate">
                            {adv.agencyName} • {adv.city} ({adv.experienceYears} yrs exp)
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {adv.specialization.slice(0, 2).map((s, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span className="font-mono text-[11px] truncate">{adv.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setAdvForm({
                                name: adv.name,
                                arnNumber: adv.arnNumber,
                                sebiRegNumber: adv.sebiRegNumber || '',
                                agencyName: adv.agencyName,
                                city: adv.city,
                                state: adv.state,
                                experienceYears: adv.experienceYears,
                                feeType: adv.feeType,
                                phone: adv.phone,
                                email: adv.email,
                                photoUrl: adv.photoUrl,
                                specialization: adv.specialization.join(', '),
                                bio: adv.bio
                              });
                              setEditingId(adv.id);
                              setShowAddForm(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
                            title="Edit Advisor"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete advisor profile "${adv.name}"?`)) {
                                onDeleteAdvisor(adv.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                            title="Delete Advisor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GOLD & SILVER STORES */}
          {activeTab === 'gold_silver' && (
            <div className="space-y-6">
              {showAddForm ? (
                <form onSubmit={handleSaveGoldStore} className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                    <h4 className="font-serif font-black text-amber-950 text-sm sm:text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-700" />
                      <span>{editingId ? 'Edit Store / Scheme' : 'Register Jeweller Store & Monthly Gold Scheme'}</span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Store / Showroom Name *</label>
                      <input
                        type="text"
                        required
                        value={goldForm.storeName}
                        onChange={e => setGoldForm({ ...goldForm, storeName: e.target.value })}
                        placeholder="e.g. Tanishq Flagship Showroom - Indiranagar"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Jeweller Chain / Brand</label>
                      <input
                        type="text"
                        value={goldForm.jewellerChain}
                        onChange={e => setGoldForm({ ...goldForm, jewellerChain: e.target.value })}
                        placeholder="e.g. Tanishq (Tata Group), Malabar, Kalyan"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Scheme Name *</label>
                      <input
                        type="text"
                        required
                        value={goldForm.schemeName}
                        onChange={e => setGoldForm({ ...goldForm, schemeName: e.target.value })}
                        placeholder="e.g. Golden Harvest Child Savings Plan"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Scheme Category</label>
                      <select
                        value={goldForm.schemeType}
                        onChange={e => setGoldForm({ ...goldForm, schemeType: e.target.value as any })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                      >
                        <option value="Monthly Savings Plan (11 Months)">Monthly Savings Plan (11 Months)</option>
                        <option value="24K Gold Coin SIP">24K Gold Coin SIP</option>
                        <option value="Digital Gold to Physical Delivery">Digital Gold to Physical Delivery</option>
                        <option value="Silver Bullion Blocks">Silver Bullion Blocks</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Min Monthly Deposit (₹) *</label>
                      <input
                        type="number"
                        min="500"
                        step="500"
                        required
                        value={goldForm.minMonthlyDeposit}
                        onChange={e => setGoldForm({ ...goldForm, minMonthlyDeposit: Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Store Phone (SMS Receiver) *</label>
                      <input
                        type="tel"
                        required
                        value={goldForm.phone}
                        onChange={e => setGoldForm({ ...goldForm, phone: e.target.value })}
                        placeholder="+91 80 4125 7890"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-amber-800"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Store Email Address</label>
                      <input
                        type="email"
                        value={goldForm.email}
                        onChange={e => setGoldForm({ ...goldForm, email: e.target.value })}
                        placeholder="indiranagar@tanishq.co.in"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">City &amp; Address</label>
                      <input
                        type="text"
                        value={goldForm.address}
                        onChange={e => setGoldForm({ ...goldForm, address: e.target.value })}
                        placeholder="100 Feet Road, Indiranagar, Bengaluru"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">Bonus Month &amp; Discount Offer for Parents</label>
                      <textarea
                        rows={2}
                        value={goldForm.bonusOffer}
                        onChange={e => setGoldForm({ ...goldForm, bonusOffer: e.target.value })}
                        placeholder="e.g. Pay 10 months; Store contributes 11th installment bonus + zero making charges on gold coins..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-serif font-black text-xs shadow-md transition"
                    >
                      {editingId ? 'Save Store Scheme' : 'Publish Gold Scheme for Parents'}
                    </button>
                  </div>
                </form>
              ) : null}

              {/* Existing Gold Stores List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-slate-900 text-sm">
                    Verified Gold &amp; Silver Partners ({goldStores.length})
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    100% BIS Hallmarked monthly savings schemes for child gold accumulation
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {goldStores.map(store => (
                    <div key={store.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between gap-3 hover:border-amber-300 transition">
                      <div className="flex gap-3">
                        <img 
                          src={store.imageUrl || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=300'} 
                          alt={store.storeName} 
                          className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-100 shadow-xs"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-150">
                            {store.jewellerChain}
                          </span>
                          <h5 className="font-serif font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                            {store.storeName}
                          </h5>
                          <p className="text-[11px] text-amber-700 font-bold truncate">
                            {store.schemeName}
                          </p>
                          <p className="text-[10.5px] text-slate-500 line-clamp-1">
                            Min ₹{store.minMonthlyDeposit.toLocaleString('en-IN')}/mo • {store.bonusOffer}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="font-mono text-[11px] truncate">{store.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setGoldForm({
                                storeName: store.storeName,
                                jewellerChain: store.jewellerChain,
                                city: store.city,
                                address: store.address,
                                phone: store.phone,
                                email: store.email,
                                schemeName: store.schemeName,
                                schemeType: store.schemeType,
                                minMonthlyDeposit: store.minMonthlyDeposit,
                                bonusOffer: store.bonusOffer,
                                hallmarkPurity: store.hallmarkPurity,
                                managerName: store.managerName,
                                imageUrl: store.imageUrl
                              });
                              setEditingId(store.id);
                              setShowAddForm(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
                            title="Edit Store"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete store "${store.storeName}"?`)) {
                                onDeleteGoldStore(store.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                            title="Delete Store"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">All partner submissions are backed by verified phone notifications.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition cursor-pointer"
          >
            Close Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
