import React, { useState, useMemo } from 'react';
import { InvestmentProperty, InvestmentLead } from '../../types/investment.ts';
import { calculateMonthlyEmi } from '../../data/kidsInvestmentData.ts';
import PropertyEmiCalculatorWidget from './PropertyEmiCalculatorWidget.tsx';
import { 
  Building2, Plus, Edit3, Trash2, ShieldCheck, Phone, Mail, MapPin, 
  CheckCircle2, X, AlertTriangle, Eye, ArrowRight, Lock, Key, Users, 
  ExternalLink, Search, Filter, Sparkles, LogOut, RefreshCw, Smartphone
} from 'lucide-react';

interface BuilderAgentDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  properties: InvestmentProperty[];
  onAddProperty: (property: InvestmentProperty) => void;
  onUpdateProperty: (property: InvestmentProperty) => void;
  onDeleteProperty: (propertyId: string) => void;
  leads?: InvestmentLead[];
}

interface BuilderSession {
  name: string;
  agency: string;
  phone: string;
  email: string;
  sellerType: 'Builder' | 'Real Estate Agent';
  reraId: string;
  city: string;
}

const DEFAULT_BUILDER_SESSIONS: BuilderSession[] = [
  {
    name: 'Suresh Gowda (VP Sales)',
    agency: 'Greenfield Developers & BDA Promoters',
    phone: '9845012340',
    email: 'sales@greenfieldplots.com',
    sellerType: 'Builder',
    reraId: 'PRM/KA/RERA/1251/310/PR/240120/006501',
    city: 'Bengaluru'
  },
  {
    name: 'K. R. Varma & Associates',
    agency: 'Bangalore Suburban Realty & Sites',
    phone: '9740112233',
    email: 'info@bangaloresuburbanplots.com',
    sellerType: 'Real Estate Agent',
    reraId: 'AG/KA/RERA/1251/310/AG/230911/004120',
    city: 'Bengaluru'
  }
];

export default function BuilderAgentDashboard({
  isOpen,
  onClose,
  properties,
  onAddProperty,
  onUpdateProperty,
  onDeleteProperty,
  leads = []
}: BuilderAgentDashboardProps) {
  // Session State
  const [session, setSession] = useState<BuilderSession | null>(() => {
    try {
      const saved = localStorage.getItem('vernunt_builder_agent_session');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.debug('Error loading builder session', e);
    }
    return DEFAULT_BUILDER_SESSIONS[0];
  });

  // Login View vs Dashboard View
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(!session);
  const [loginPhoneInput, setLoginPhoneInput] = useState<string>('');
  const [loginPinInput, setLoginPinInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Tab inside Builder Dashboard
  const [activeTab, setActiveTab] = useState<'listings' | 'add_property' | 'leads' | 'profile'>('listings');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('All');

  // Form State for Add / Edit
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [showDeleteConfirmId, setShowDeleteConfirmId] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const [formValues, setFormValues] = useState({
    title: '',
    propertyType: 'Plot / Site' as InvestmentProperty['propertyType'],
    city: 'Bengaluru',
    locality: '',
    totalPrice: 600000,
    downPayment: 60000,
    tenureYears: 15,
    plotAreaSqFt: 1200,
    dimensions: '30 x 40 ft',
    approvalType: 'RERA & BDA Approved' as InvestmentProperty['approvalType'],
    reraNumber: '',
    highlightTag: '⭐ Low Cost Verified Site',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800',
    amenities: 'Kids Play Zone, 24/7 Gated Security, Underground Drainage, 40-ft Roads, Water Connection',
    bankLoanPartners: 'State Bank of India, HDFC Bank, ICICI Bank, Canara Bank',
    sellerType: (session?.sellerType || 'Builder') as InvestmentProperty['sellerType'],
    sellerName: session?.name || 'Verified Builder Partner',
    sellerPhone: session?.phone || '9845012340',
    sellerEmail: session?.email || 'sales@vernuntproperties.com',
    sellerAgency: session?.agency || 'Prestige Suburban Plots'
  });

  if (!isOpen) return null;

  // Filter properties belonging to or managed in this dashboard
  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.reraNumber && p.reraNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === 'All' || p.propertyType === filterType;
    return matchesSearch && matchesType;
  });

  // Calculate live EMI for the form
  const formLoanAmount = Math.max(0, formValues.totalPrice - formValues.downPayment);
  const formMonthlyEmi = calculateMonthlyEmi(formLoanAmount, 8.5, formValues.tenureYears);

  // Inquiries for properties
  const myLeads = leads.filter(l => l.targetSector === 'Real Estate (Plot / Site)');

  // Handlers
  const handleLogin = (selectedSession?: BuilderSession) => {
    const targetSession = selectedSession || {
      name: 'Verified Real Estate Partner',
      agency: 'Direct Builders Association',
      phone: loginPhoneInput || '9845012340',
      email: 'sales@vernuntproperties.com',
      sellerType: 'Builder',
      reraId: 'PRM/KA/RERA/2026/VALID',
      city: 'Bengaluru'
    };

    setSession(targetSession);
    try {
      localStorage.setItem('vernunt_builder_agent_session', JSON.stringify(targetSession));
    } catch (e) {
      console.debug('Failed to save session', e);
    }
    setIsAuthenticating(false);
    setAuthError(null);
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('vernunt_builder_agent_session');
    setIsAuthenticating(true);
  };

  const handleOpenEdit = (prop: InvestmentProperty) => {
    setEditingPropertyId(prop.id);
    setFormValues({
      title: prop.title,
      propertyType: prop.propertyType,
      city: prop.city,
      locality: prop.locality,
      totalPrice: prop.totalPrice,
      downPayment: prop.downPayment,
      tenureYears: prop.tenureYears,
      plotAreaSqFt: prop.plotAreaSqFt,
      dimensions: prop.dimensions,
      approvalType: prop.approvalType,
      reraNumber: prop.reraNumber || '',
      highlightTag: prop.highlightTag || '',
      description: prop.description,
      imageUrl: prop.images[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800',
      amenities: prop.amenities.join(', '),
      bankLoanPartners: prop.bankLoanPartners.join(', '),
      sellerType: prop.sellerType,
      sellerName: prop.sellerName,
      sellerPhone: prop.sellerPhone,
      sellerEmail: prop.sellerEmail,
      sellerAgency: prop.sellerAgency || ''
    });
    setActiveTab('add_property');
  };

  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.title || !formValues.sellerPhone) {
      alert('Please provide the property title and seller contact phone number.');
      return;
    }

    const calculatedEmi = calculateMonthlyEmi(
      formValues.totalPrice - formValues.downPayment,
      8.5,
      formValues.tenureYears
    );

    const propertyPayload: InvestmentProperty = {
      id: editingPropertyId || `prop-${Date.now()}`,
      title: formValues.title,
      propertyType: formValues.propertyType,
      city: formValues.city,
      locality: formValues.locality || `${formValues.city} Growth Corridor`,
      totalPrice: Number(formValues.totalPrice),
      downPayment: Number(formValues.downPayment),
      monthlyEmi: calculatedEmi,
      interestRate: 8.5,
      tenureYears: Number(formValues.tenureYears),
      plotAreaSqFt: Number(formValues.plotAreaSqFt),
      dimensions: formValues.dimensions,
      approvalType: formValues.approvalType,
      reraNumber: formValues.reraNumber || undefined,
      highlightTag: formValues.highlightTag || 'Low Cost Verified Property',
      description: formValues.description || 'Verified low-cost residential property suitable for children future long-term wealth.',
      images: [formValues.imageUrl],
      amenities: formValues.amenities.split(',').map(s => s.trim()).filter(Boolean),
      bankLoanPartners: formValues.bankLoanPartners.split(',').map(s => s.trim()).filter(Boolean),
      sellerType: formValues.sellerType,
      sellerName: formValues.sellerName || session?.name || 'Verified Builder Partner',
      sellerPhone: formValues.sellerPhone || session?.phone || '9845012340',
      sellerEmail: formValues.sellerEmail || session?.email || 'sales@vernuntproperties.com',
      sellerAgency: formValues.sellerAgency || session?.agency,
      isVerified: true,
      createdAt: new Date().toISOString()
    };

    if (editingPropertyId) {
      onUpdateProperty(propertyPayload);
      setSaveSuccessMessage('Property updated successfully! Changes are live for all parents.');
    } else {
      onAddProperty(propertyPayload);
      setSaveSuccessMessage('New low cost property published successfully! Parents can now simulate EMI and connect.');
    }

    setTimeout(() => setSaveSuccessMessage(null), 4000);
    setActiveTab('listings');
    setEditingPropertyId(null);
  };

  const handleConfirmDelete = (propertyId: string) => {
    onDeleteProperty(propertyId);
    setShowDeleteConfirmId(null);
    setSaveSuccessMessage('Property listing removed successfully.');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] text-left">
        
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xl">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif font-black tracking-tight text-white">
                  Real Estate Agents &amp; Builders Dashboard
                </h2>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  RERA Verified Portal
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage your low cost properties, plots &amp; sites for parents planning kids' long-term wealth.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {session && !isAuthenticating && (
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Switch Account</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Authentication Wall if not logged in */}
        {isAuthenticating ? (
          <div className="p-6 sm:p-10 space-y-8 max-w-xl mx-auto text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-3xl mx-auto">
              🔐
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black font-serif text-slate-900">
                Secure Real Estate Partner Access
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Sign in with your verified builder or agent credentials to publish, edit, and manage low cost property listings and view parent leads.
              </p>
            </div>

            {/* Quick 1-Click Fast Partner Logins */}
            <div className="space-y-3 text-left bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Quick Partner Login Profiles:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEFAULT_BUILDER_SESSIONS.map(s => (
                  <button
                    key={s.reraId}
                    type="button"
                    onClick={() => handleLogin(s)}
                    className="p-3 bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 block truncate">{s.agency}</span>
                      <span className="text-[11px] text-slate-500 block truncate">{s.name} ({s.sellerType})</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 mt-2 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      RERA Verified ↗
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Phone / Passcode Form */}
            <div className="space-y-3 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Registered Phone Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="e.g. 9845012340"
                    value={loginPhoneInput}
                    onChange={e => setLoginPhoneInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Builder PIN / Passcode</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Enter PIN (Default: 1234)"
                    value={loginPinInput}
                    onChange={e => setLoginPinInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {authError && (
                <p className="text-xs text-rose-600 font-semibold">{authError}</p>
              )}

              <button
                type="button"
                onClick={() => handleLogin()}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
              >
                Authenticate &amp; Open Builder Dashboard ↗
              </button>
            </div>
          </div>
        ) : (
          /* Logged In Dashboard View */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Dashboard Subheader & Navigation Tabs */}
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Logged in as:</span>
                <span className="text-xs font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {session?.agency} ({session?.sellerType})
                </span>
              </div>

              {/* Tabs Navigation */}
              <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('listings');
                    setEditingPropertyId(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'listings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>My Listed Properties</span>
                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                    {filteredProperties.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingPropertyId(null);
                    setActiveTab('add_property');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'add_property' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{editingPropertyId ? 'Edit Property' : 'Add New Property'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('leads')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'leads' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Parent Inquiries</span>
                  {myLeads.length > 0 && (
                    <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold">
                      {myLeads.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Success Toast */}
            {saveSuccessMessage && (
              <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 text-xs font-bold text-emerald-800 flex items-center justify-between animate-fade-in">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {saveSuccessMessage}
                </span>
                <button type="button" onClick={() => setSaveSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-950 cursor-pointer">
                  ✕
                </button>
              </div>
            )}

            {/* Tab Body Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

              {/* TAB 1: LISTINGS OVERVIEW */}
              {activeTab === 'listings' && (
                <div className="space-y-6">
                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search properties, locality, RERA ID..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs text-slate-500">Filter:</span>
                      <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white"
                      >
                        <option value="All">All Property Types</option>
                        <option value="Plot / Site">Plot / Site</option>
                        <option value="Gated Villa Plot">Gated Villa Plot</option>
                        <option value="Suburban Farm Land">Suburban Farm Land</option>
                        <option value="Compact Apartment">Compact Apartment</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingPropertyId(null);
                          setActiveTab('add_property');
                        }}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Property</span>
                      </button>
                    </div>
                  </div>

                  {/* Properties Table / Grid */}
                  {filteredProperties.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                      <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-bold text-slate-700">No properties found matching your search</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setFilterType('All');
                        }}
                        className="text-xs text-emerald-600 font-bold underline cursor-pointer"
                      >
                        Reset filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredProperties.map(prop => {
                        const calculatedEmi = calculateMonthlyEmi(prop.totalPrice - prop.downPayment, 8.5, prop.tenureYears);

                        return (
                          <div 
                            key={prop.id}
                            className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 p-4 transition-all flex flex-col justify-between space-y-3 shadow-xs"
                          >
                            <div className="flex items-start gap-3">
                              <img 
                                src={prop.images[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=300'} 
                                alt={prop.title}
                                className="w-20 h-20 rounded-xl object-cover border border-slate-100 shrink-0" 
                              />
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    {prop.approvalType}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {prop.plotAreaSqFt} sq.ft
                                  </span>
                                </div>
                                <h4 className="font-serif font-bold text-slate-900 text-sm truncate">
                                  {prop.title}
                                </h4>
                                <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  {prop.locality}, {prop.city}
                                </p>
                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-xs font-mono font-bold text-slate-800">
                                    Total: ₹{(prop.totalPrice / 100000).toFixed(1)}L
                                  </span>
                                  <span className="text-xs font-mono font-black text-emerald-700">
                                    EMI: ₹{calculatedEmi.toLocaleString('en-IN')}/mo
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons: Edit & Delete */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                              <span className="text-[11px] text-slate-500 font-mono">
                                Contact: {prop.sellerPhone}
                              </span>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(prop)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3 text-slate-600" />
                                  <span>Edit</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setShowDeleteConfirmId(prop.id)}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-600" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ADD / EDIT PROPERTY FORM */}
              {activeTab === 'add_property' && (
                <form onSubmit={handleSaveProperty} className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-base font-black font-serif text-slate-900">
                        {editingPropertyId ? 'Edit Property Listing' : 'Add New Low Cost Property Listing'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Provide accurate pricing and approval details for prospective parent investors.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingPropertyId(null);
                        setActiveTab('listings');
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Title */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="font-bold text-slate-700">Property Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Green Acres Residential Layout - Phase 1"
                        value={formValues.title}
                        onChange={e => setFormValues({ ...formValues, title: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Property Type */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Property Type</label>
                      <select
                        value={formValues.propertyType}
                        onChange={e => setFormValues({ ...formValues, propertyType: e.target.value as any })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      >
                        <option value="Plot / Site">Plot / Site</option>
                        <option value="Gated Villa Plot">Gated Villa Plot</option>
                        <option value="Suburban Farm Land">Suburban Farm Land</option>
                        <option value="Compact Apartment">Compact Apartment</option>
                      </select>
                    </div>

                    {/* Approval Authority */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Approval Authority</label>
                      <select
                        value={formValues.approvalType}
                        onChange={e => setFormValues({ ...formValues, approvalType: e.target.value as any })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      >
                        <option value="RERA & BDA Approved">RERA &amp; BDA Approved</option>
                        <option value="DTCP Approved">DTCP Approved</option>
                        <option value="HMDA Approved">HMDA Approved</option>
                        <option value="PMRDA Approved">PMRDA Approved</option>
                        <option value="Panchayat Khata A">Panchayat Khata A</option>
                        <option value="DC Converted">DC Converted</option>
                      </select>
                    </div>

                    {/* City & Locality */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">City</label>
                      <input
                        type="text"
                        required
                        value={formValues.city}
                        onChange={e => setFormValues({ ...formValues, city: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Locality / Growth Corridor</label>
                      <input
                        type="text"
                        placeholder="e.g. Devanahalli Airport Corridor"
                        value={formValues.locality}
                        onChange={e => setFormValues({ ...formValues, locality: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    {/* Total Price & Down Payment */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Total Price (INR) *</label>
                      <input
                        type="number"
                        min={100000}
                        step={25000}
                        required
                        value={formValues.totalPrice}
                        onChange={e => {
                          const p = Number(e.target.value);
                          setFormValues({ 
                            ...formValues, 
                            totalPrice: p,
                            downPayment: Math.round(p * 0.1) // default 10%
                          });
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                      />
                      <span className="text-[10.5px] text-slate-400 font-mono">
                        ≈ ₹{(formValues.totalPrice / 100000).toFixed(2)} Lakhs
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Down Payment (INR)</label>
                      <input
                        type="number"
                        min={10000}
                        step={10000}
                        value={formValues.downPayment}
                        onChange={e => setFormValues({ ...formValues, downPayment: Number(e.target.value) })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                      />
                      <span className="text-[10.5px] text-slate-400 font-mono">
                        {formValues.totalPrice > 0 ? Math.round((formValues.downPayment / formValues.totalPrice) * 100) : 0}% of Total Price
                      </span>
                    </div>

                    {/* Plot Area & Dimensions */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Plot Area (sq. ft.)</label>
                      <input
                        type="number"
                        min={300}
                        step={50}
                        value={formValues.plotAreaSqFt}
                        onChange={e => setFormValues({ ...formValues, plotAreaSqFt: Number(e.target.value) })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Dimensions</label>
                      <input
                        type="text"
                        placeholder="e.g. 30 x 40 ft or 30 x 50 ft"
                        value={formValues.dimensions}
                        onChange={e => setFormValues({ ...formValues, dimensions: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    {/* RERA Number */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">RERA Registration / Project ID</label>
                      <input
                        type="text"
                        placeholder="e.g. PRM/KA/RERA/1251/310/PR/..."
                        value={formValues.reraNumber}
                        onChange={e => setFormValues({ ...formValues, reraNumber: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                      />
                    </div>

                    {/* Highlight Tag */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Highlight Badge</label>
                      <input
                        type="text"
                        placeholder="e.g. Low Cost Verified Site"
                        value={formValues.highlightTag}
                        onChange={e => setFormValues({ ...formValues, highlightTag: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    {/* Contact Phone & Email */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Seller Phone Number * (Receives SMS Leads)</label>
                      <input
                        type="tel"
                        required
                        value={formValues.sellerPhone}
                        onChange={e => setFormValues({ ...formValues, sellerPhone: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Agency / Firm Name</label>
                      <input
                        type="text"
                        value={formValues.sellerAgency}
                        onChange={e => setFormValues({ ...formValues, sellerAgency: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    {/* Image URL */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="font-bold text-slate-700">Property Photo URL</label>
                      <input
                        type="url"
                        value={formValues.imageUrl}
                        onChange={e => setFormValues({ ...formValues, imageUrl: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="font-bold text-slate-700">Property Description &amp; Kid Future Appreciation</label>
                      <textarea
                        rows={3}
                        value={formValues.description}
                        onChange={e => setFormValues({ ...formValues, description: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Live EMI Preview Box */}
                  <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-emerald-900">
                        Live Parent EMI Estimate (at 8.5% p.a. over {formValues.tenureYears} Years)
                      </span>
                      <div className="text-xl font-mono font-black text-emerald-800">
                        ₹{formMonthlyEmi.toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-600">/mo</span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-600">
                      <div>Loan: <strong className="font-mono">₹{(formLoanAmount / 100000).toFixed(2)}L</strong></div>
                      <div>Down Payment: <strong className="font-mono">₹{(formValues.downPayment / 100000).toFixed(2)}L</strong></div>
                    </div>
                  </div>

                  {/* Form Submit */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPropertyId(null);
                        setActiveTab('listings');
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingPropertyId ? 'Save Property Changes' : 'Publish Property Listing'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: PARENT LEADS / INQUIRIES */}
              {activeTab === 'leads' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-base font-black font-serif text-slate-900">
                        Parent Inquiries &amp; Site Visit Requests
                      </h3>
                      <p className="text-xs text-slate-500">
                        Parents who clicked "Connect with Builder / Advisor" for your low cost properties.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      {myLeads.length} Inquiries Received
                    </span>
                  </div>

                  {myLeads.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <Users className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-bold text-slate-700">No customer leads received yet</p>
                      <p className="text-xs text-slate-400">
                        When parents request a callback or property site visit, their contact number and investment budget will appear here instantly.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myLeads.map(lead => (
                        <div 
                          key={lead.id}
                          className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{lead.parentName}</span>
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold">
                                Kid Age: {lead.kidAge} yrs
                              </span>
                            </div>
                            <p className="text-slate-600">
                              Interested in: <strong>{lead.itemTitle}</strong>
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                              <span>📞 {lead.parentPhone}</span>
                              {lead.parentEmail && <span>✉️ {lead.parentEmail}</span>}
                              <span>Budget: ₹{lead.monthlyInvestmentAmount?.toLocaleString('en-IN')}/mo</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${lead.parentPhone}`}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 transition"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Call Parent</span>
                            </a>
                            <a
                              href={`https://wa.me/91${lead.parentPhone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(lead.parentName)},%20thank%20you%20for%20your%20inquiry%20regarding%20${encodeURIComponent(lead.itemTitle)}%20on%20Vernunt.`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center gap-1 transition"
                            >
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmId && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-center border border-slate-200 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center text-2xl mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif font-black text-slate-900 text-base">
                  Confirm Property Deletion
                </h4>
                <p className="text-xs text-slate-500">
                  Are you sure you want to permanently delete this property listing? Parents will no longer see it in their investment radar.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDelete(showDeleteConfirmId)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
