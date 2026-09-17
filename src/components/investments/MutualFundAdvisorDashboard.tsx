import React, { useState } from 'react';
import { MutualFundAdvisor, InvestmentLead } from '../../types/investment.ts';
import { 
  TrendingUp, Award, ShieldCheck, CheckCircle2, X, Phone, Mail, MapPin, 
  Sparkles, Star, Users, ExternalLink, LogOut, Check, Eye, Clock, 
  Briefcase, Edit3, Smartphone, Key, AlertCircle
} from 'lucide-react';

interface MutualFundAdvisorDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  advisors: MutualFundAdvisor[];
  onAddAdvisor: (advisor: MutualFundAdvisor) => void;
  onUpdateAdvisor: (advisor: MutualFundAdvisor) => void;
  onDeleteAdvisor: (advisorId: string) => void;
  leads?: InvestmentLead[];
}

const DEFAULT_ADVISORS_SESSION = {
  id: 'mfa-1',
  name: 'Rajesh K. Sharma, CFP',
  arnNumber: 'ARN-189240',
  sebiRegNumber: 'INA000014892',
  agencyName: 'WealthKids Family Office',
  city: 'Bengaluru',
  state: 'Karnataka',
  experienceYears: 14,
  rating: 4.9,
  reviewsCount: 128,
  specialization: [
    'Child Higher Education Corpus',
    'Sukanya Samriddhi vs Equity SIP',
    '18th Year Maturity Wealth Planning',
    'Tax Saving ELSS'
  ],
  feeType: 'Free Initial Consultation' as MutualFundAdvisor['feeType'],
  phone: '9845123456',
  email: 'rajesh@wealthkids.in',
  photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300',
  bio: 'AMFI Registered Mutual Fund Distributor and Certified Financial Planner specializing in helping young parents compound multi-crore wealth for their children by their 18th birthday.',
  isVerified: true,
  createdAt: '2024-01-10T10:00:00Z'
};

export default function MutualFundAdvisorDashboard({
  isOpen,
  onClose,
  advisors,
  onAddAdvisor,
  onUpdateAdvisor,
  onDeleteAdvisor,
  leads = []
}: MutualFundAdvisorDashboardProps) {
  // Session State
  const [currentAdvisor, setCurrentAdvisor] = useState<MutualFundAdvisor>(() => {
    try {
      const saved = localStorage.getItem('vernunt_advisor_session');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.debug('Error loading advisor session', e);
    }
    return advisors[0] || DEFAULT_ADVISORS_SESSION;
  });

  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [loginArnInput, setLoginArnInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'profile' | 'credentials' | 'leads' | 'preview'>('profile');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Showcase Toggles
  const [showcaseInInvestmentsTab, setShowcaseInInvestmentsTab] = useState<boolean>(true);
  const [showcaseInSpecialistsDirectory, setShowcaseInSpecialistsDirectory] = useState<boolean>(true);

  // Profile Form Fields
  const [formName, setFormName] = useState<string>(currentAdvisor.name);
  const [formArn, setFormArn] = useState<string>(currentAdvisor.arnNumber);
  const [formSebi, setFormSebi] = useState<string>(currentAdvisor.sebiRegNumber || '');
  const [formAgency, setFormAgency] = useState<string>(currentAdvisor.agencyName);
  const [formCity, setFormCity] = useState<string>(currentAdvisor.city);
  const [formState, setFormState] = useState<string>(currentAdvisor.state);
  const [formExp, setFormExp] = useState<number>(currentAdvisor.experienceYears);
  const [formFeeType, setFormFeeType] = useState<MutualFundAdvisor['feeType']>(currentAdvisor.feeType);
  const [formPhone, setFormPhone] = useState<string>(currentAdvisor.phone);
  const [formEmail, setFormEmail] = useState<string>(currentAdvisor.email);
  const [formPhoto, setFormPhoto] = useState<string>(currentAdvisor.photoUrl);
  const [formBio, setFormBio] = useState<string>(currentAdvisor.bio);
  const [formSpecs, setFormSpecs] = useState<string[]>(currentAdvisor.specialization);

  if (!isOpen) return null;

  // Predefined Specializations for Child Wealth
  const AVAILABLE_SPECIALIZATIONS = [
    'Child Higher Education Corpus',
    'Sukanya Samriddhi vs Equity SIP',
    '18th Year Maturity Wealth Planning',
    'Tax Saving ELSS',
    'Children Gift Mutual Funds',
    'Systematic Transfer Plans (STP)',
    'Goal-Based Asset Allocation',
    'Overseas College Fund Hedging'
  ];

  const handleToggleSpec = (spec: string) => {
    if (formSpecs.includes(spec)) {
      setFormSpecs(formSpecs.filter(s => s !== spec));
    } else {
      setFormSpecs([...formSpecs, spec]);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formArn || !formPhone) {
      alert('Please provide your name, AMFI ARN number, and official phone number.');
      return;
    }

    const updatedAdvisor: MutualFundAdvisor = {
      ...currentAdvisor,
      name: formName,
      arnNumber: formArn,
      sebiRegNumber: formSebi || undefined,
      agencyName: formAgency,
      city: formCity,
      state: formState,
      experienceYears: Number(formExp),
      feeType: formFeeType,
      phone: formPhone,
      email: formEmail,
      photoUrl: formPhoto,
      bio: formBio,
      specialization: formSpecs,
      isVerified: true
    };

    setCurrentAdvisor(updatedAdvisor);
    try {
      localStorage.setItem('vernunt_advisor_session', JSON.stringify(updatedAdvisor));
    } catch (e) {
      console.debug('Failed to save session', e);
    }

    // Check if existing advisor or new
    const exists = advisors.some(a => a.id === updatedAdvisor.id);
    if (exists) {
      onUpdateAdvisor(updatedAdvisor);
    } else {
      onAddAdvisor(updatedAdvisor);
    }

    setSaveSuccessMessage('Advisor credentials & profile updated! Live in both the Kids Investments Tab and Specialists Directory.');
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  // Leads for mutual fund advisors
  const advisorLeads = leads.filter(l => l.targetSector === 'Mutual Fund Advisor');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] text-left">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold text-xl">
              📈
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif font-black tracking-tight text-white">
                  Mutual Fund Advisor Credentials Dashboard
                </h2>
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-400" />
                  AMFI ARN Verified
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage your advisor profile, showcase credentials, and connect with parents planning child future SIPs.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dashboard Subheader & Navigation Tabs */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Advisor ARN:</span>
            <span className="text-xs font-mono font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              {currentAdvisor.arnNumber}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'profile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Profile Info
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('credentials')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'credentials' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Credentials &amp; Specialization
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Card Preview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('leads')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'leads' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Parent Inquiries</span>
              {advisorLeads.length > 0 && (
                <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold">
                  {advisorLeads.length}
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

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* TAB 1: PROFILE INFO */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-black font-serif text-slate-900">
                  Manage Professional Profile
                </h3>
                <p className="text-xs text-slate-500">
                  Update your contact, agency name, and experience displayed across Vernunt.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Firm / Agency Name</label>
                  <input
                    type="text"
                    value={formAgency}
                    onChange={e => setFormAgency(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">City</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={e => setFormCity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">State</label>
                  <input
                    type="text"
                    value={formState}
                    onChange={e => setFormState(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Experience (Years)</label>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={formExp}
                    onChange={e => setFormExp(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Advisory Fee Model</label>
                  <select
                    value={formFeeType}
                    onChange={e => setFormFeeType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  >
                    <option value="Free Initial Consultation">Free Initial Consultation</option>
                    <option value="Zero Commission Direct">Zero Commission Direct</option>
                    <option value="Flat Advisory Fee">Flat Advisory Fee</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Official Contact Phone * (Receives SMS Leads)</label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Official Email Address</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-700">Profile Photo URL</label>
                  <input
                    type="url"
                    value={formPhoto}
                    onChange={e => setFormPhoto(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-700">Bio &amp; Philosophy for Child Future Wealth</label>
                  <textarea
                    rows={3}
                    value={formBio}
                    onChange={e => setFormBio(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Advisor Profile</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CREDENTIALS & SPECIALIZATIONS */}
          {activeTab === 'credentials' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-black font-serif text-slate-900">
                  Showcase Your Credentials &amp; Certifications
                </h3>
                <p className="text-xs text-slate-500">
                  Highlight AMFI, SEBI, and NISM certifications to build parent trust in the investment specialist tabs.
                </p>
              </div>

              {/* Verified Credentials Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>AMFI Registration Number (ARN) *</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ARN-189240"
                    value={formArn}
                    onChange={e => setFormArn(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                  <p className="text-[11px] text-slate-500">
                    Association of Mutual Funds in India (AMFI) verified distributor registration.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span>SEBI Registration Number (Optional)</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. INA000014892 (RIA)"
                    value={formSebi}
                    onChange={e => setFormSebi(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                  <p className="text-[11px] text-slate-500">
                    Securities and Exchange Board of India (SEBI) RIA license if applicable.
                  </p>
                </div>
              </div>

              {/* Specialization Checkbox Hub */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-800 block">
                  Select Child Future Specializations to Showcase:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_SPECIALIZATIONS.map(spec => {
                    const isSelected = formSpecs.includes(spec);
                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => handleToggleSpec(spec)}
                        className={`p-3 rounded-xl border text-left text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                          isSelected 
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{spec}</span>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Placement Showcase Controls */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Directory Visibility:
                </span>
                
                <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showcaseInInvestmentsTab}
                    onChange={e => setShowcaseInInvestmentsTab(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-sm"
                  />
                  <span>Showcase in <strong>Kids Investment Tab</strong> (Verified Child Wealth Advisors section)</span>
                </label>

                <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showcaseInSpecialistsDirectory}
                    onChange={e => setShowcaseInSpecialistsDirectory(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-sm"
                  />
                  <span>Showcase in <strong>Pan-India Specialists Directory</strong> (Child Financial Planners category)</span>
                </label>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Update &amp; Showcase Credentials</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-black font-serif text-slate-900">
                  Live Showcase Preview
                </h3>
                <p className="text-xs text-slate-500">
                  This is how your verified credential card appears to parents browsing the directory.
                </p>
              </div>

              <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 hover:border-indigo-400 p-5 shadow-lg space-y-4 text-left">
                <div className="flex items-start gap-3.5">
                  <img 
                    src={formPhoto} 
                    alt={formName} 
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0" 
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10.5px] font-mono font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-indigo-600" />
                        {formArn}
                      </span>
                      {formSebi && (
                        <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                          SEBI RIA
                        </span>
                      )}
                    </div>
                    <h4 className="font-serif font-black text-slate-900 text-base leading-tight">
                      {formName}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">
                      {formAgency} • {formCity}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {formBio}
                </p>

                {/* Specialization Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {formSpecs.map(spec => (
                    <span 
                      key={spec}
                      className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                <div className="bg-indigo-50/60 rounded-2xl p-3 border border-indigo-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Advisory Fee</span>
                    <span className="font-bold text-indigo-900">{formFeeType}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Experience</span>
                    <span className="font-mono font-bold text-slate-800">{formExp}+ Years</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Book Free Consultation (SMS &amp; Email Alert)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: PARENT LEADS */}
          {activeTab === 'leads' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-black font-serif text-slate-900">
                    Parent Inquiries for Child SIP Advisory
                  </h3>
                  <p className="text-xs text-slate-500">
                    Parents who requested an advisory consultation for their child's future wealth.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-lg">
                  {advisorLeads.length} Consultations Requested
                </span>
              </div>

              {advisorLeads.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <Users className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No consultation requests yet</p>
                  <p className="text-xs text-slate-400">
                    When parents click "Book Free Consultation" or request child SIP guidance, their phone and target corpus will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {advisorLeads.map(lead => (
                    <div 
                      key={lead.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{lead.parentName}</span>
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold">
                            Kid Age: {lead.kidAge} yrs
                          </span>
                        </div>
                        <p className="text-slate-600">
                          Topic: <strong>{lead.itemTitle}</strong>
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                          <span>📞 {lead.parentPhone}</span>
                          {lead.parentEmail && <span>✉️ {lead.parentEmail}</span>}
                          <span>SIP Target: ₹{lead.monthlyInvestmentAmount?.toLocaleString('en-IN')}/mo</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${lead.parentPhone}`}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1 transition"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Parent</span>
                        </a>
                        <a
                          href={`https://wa.me/91${lead.parentPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(lead.parentName)},%20I%20received%20your%20child%20SIP%20consultation%20request%20on%20Vernunt.`}
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
    </div>
  );
}
