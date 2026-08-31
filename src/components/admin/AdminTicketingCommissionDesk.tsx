import React, { useState } from 'react';
import { 
  Ticket, Percent, Users, Award, Sliders, Calculator, Plus, 
  Trash2, Edit3, Save, CheckCircle, RefreshCw, AlertTriangle, 
  HelpCircle, ChevronRight, ArrowRight, ShieldCheck, Sparkles, X, DollarSign, Check
} from 'lucide-react';
import { CommunityEvent } from '../../types.ts';
import { 
  AdminTicketingConfig, 
  CommissionTierRule, 
  HostCommissionOverride,
  calculateEventCommissionPolicy,
  calculateTicketOrderBreakdown
} from '../../utils/ticketingCommission.ts';

interface AdminTicketingCommissionDeskProps {
  eventsList: CommunityEvent[];
  onUpdateEvent: (updatedEvent: CommunityEvent) => void;
  ticketingConfig: AdminTicketingConfig;
  onSaveConfig: (newConfig: AdminTicketingConfig) => Promise<void> | void;
  onToggleEventFeatured?: (event: CommunityEvent) => void;
}

export default function AdminTicketingCommissionDesk({
  eventsList,
  onUpdateEvent,
  ticketingConfig,
  onSaveConfig,
  onToggleEventFeatured
}: AdminTicketingCommissionDeskProps) {
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'global-policy' | 'influencer-tiers' | 'host-overrides' | 'calculator'>('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'influencer' | 'standard'>('all');

  // Config draft state
  const [configDraft, setConfigDraft] = useState<AdminTicketingConfig>(ticketingConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Event Ticketing Modal
  const [selectedEventForEdit, setSelectedEventForEdit] = useState<CommunityEvent | null>(null);
  const [eventEditForm, setEventEditForm] = useState<{
    freeTicketsQuota: number;
    freeTicketsIssued: number;
    isInfluencerHost: boolean;
    hostRole: 'standard' | 'influencer';
    customCommissionRate: number | '';
  }>({
    freeTicketsQuota: 30,
    freeTicketsIssued: 0,
    isInfluencerHost: false,
    hostRole: 'standard',
    customCommissionRate: ''
  });

  // Host Override Modal
  const [showHostOverrideModal, setShowHostOverrideModal] = useState(false);
  const [editingHostKey, setEditingHostKey] = useState<string | null>(null);
  const [hostOverrideForm, setHostOverrideForm] = useState<HostCommissionOverride>({
    hostIdOrName: '',
    freeTicketsQuota: 1000,
    commissionRate: 2.0,
    role: 'influencer',
    notes: ''
  });

  // New Tier Rule Modal / State
  const [showAddTierModal, setShowAddTierModal] = useState(false);
  const [tierForm, setTierForm] = useState<CommissionTierRule>({
    minTickets: 1000,
    maxTickets: 3000,
    commissionPercent: 2.0,
    label: 'Custom Tier'
  });

  // Simulator State
  const [simPrice, setSimPrice] = useState<number>(499);
  const [simCount, setSimCount] = useState<number>(250);
  const [simRole, setSimRole] = useState<'standard' | 'influencer'>('influencer');
  const [simCustomQuota, setSimCustomQuota] = useState<number>(1000);
  const [simCustomFee, setSimCustomFee] = useState<number>(2.5);

  const handleSaveGlobalConfig = async () => {
    setIsSaving(true);
    try {
      await onSaveConfig(configDraft);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEventModal = (evt: CommunityEvent) => {
    const policy = calculateEventCommissionPolicy(evt, undefined, ticketingConfig);
    setSelectedEventForEdit(evt);
    setEventEditForm({
      freeTicketsQuota: evt.freeTicketsQuota !== undefined ? evt.freeTicketsQuota : policy.freeTicketsQuota,
      freeTicketsIssued: evt.freeTicketsIssued || 0,
      isInfluencerHost: evt.isInfluencerHost || policy.isInfluencerHost,
      hostRole: evt.hostRole || (policy.isInfluencerHost ? 'influencer' : 'standard'),
      customCommissionRate: evt.customCommissionRate !== undefined ? evt.customCommissionRate : ''
    });
  };

  const handleSaveEventModal = () => {
    if (!selectedEventForEdit) return;
    const updated: CommunityEvent = {
      ...selectedEventForEdit,
      freeTicketsQuota: Number(eventEditForm.freeTicketsQuota) || 0,
      freeTicketsIssued: Number(eventEditForm.freeTicketsIssued) || 0,
      isInfluencerHost: eventEditForm.hostRole === 'influencer',
      hostRole: eventEditForm.hostRole,
      customCommissionRate: eventEditForm.customCommissionRate === '' ? undefined : Number(eventEditForm.customCommissionRate)
    };
    onUpdateEvent(updated);
    setSelectedEventForEdit(null);
  };

  const handleSaveHostOverride = async () => {
    if (!hostOverrideForm.hostIdOrName.trim()) return;
    const key = hostOverrideForm.hostIdOrName.trim();
    const updatedOverrides = {
      ...configDraft.hostOverrides,
      [key]: {
        ...hostOverrideForm,
        hostIdOrName: key,
        updatedAt: new Date().toISOString()
      }
    };
    const newConfig = { ...configDraft, hostOverrides: updatedOverrides };
    setConfigDraft(newConfig);
    await onSaveConfig(newConfig);
    setShowHostOverrideModal(false);
  };

  const handleDeleteHostOverride = async (key: string) => {
    const updatedOverrides = { ...configDraft.hostOverrides };
    delete updatedOverrides[key];
    const newConfig = { ...configDraft, hostOverrides: updatedOverrides };
    setConfigDraft(newConfig);
    await onSaveConfig(newConfig);
  };

  const handleAddTier = async () => {
    const updatedTiers = [...configDraft.influencerTiers, tierForm].sort((a, b) => a.minTickets - b.minTickets);
    const newConfig = { ...configDraft, influencerTiers: updatedTiers };
    setConfigDraft(newConfig);
    await onSaveConfig(newConfig);
    setShowAddTierModal(false);
  };

  const handleDeleteTier = async (index: number) => {
    const updatedTiers = configDraft.influencerTiers.filter((_, i) => i !== index);
    const newConfig = { ...configDraft, influencerTiers: updatedTiers };
    setConfigDraft(newConfig);
    await onSaveConfig(newConfig);
  };

  // Filtered Events
  const filteredEvents = eventsList.filter(evt => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q || evt.title.toLowerCase().includes(q) || evt.hostName.toLowerCase().includes(q) || evt.location.toLowerCase().includes(q);
    const isInf = evt.isInfluencerHost || evt.hostRole === 'influencer';
    const matchesRole = roleFilter === 'all' || (roleFilter === 'influencer' && isInf) || (roleFilter === 'standard' && !isInf);
    return matchesSearch && matchesRole;
  });

  // Simulator Breakdown
  const simBreakdown = calculateTicketOrderBreakdown({
    ticketPrice: simPrice,
    quantity: simCount,
    alreadyIssuedFreeCount: 0,
    policy: {
      freeTicketsQuota: simCustomQuota,
      effectiveCommissionRate: simCustomFee,
      isInfluencerHost: simRole === 'influencer',
      source: 'simulator'
    }
  });

  return (
    <div className="space-y-5 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="bg-white border border-[#c3c4c7] p-5 rounded-xs shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-normal text-[#1d2327] flex items-center gap-2">
              <Ticket className="w-5 h-5 text-orange-600" />
              Event Ticketing, Free Quotas &amp; Influencer Commission Policy Engine
            </h1>
            <p className="text-xs text-[#646970] mt-0.5">
              Administer free ticket quotas (e.g. 1,000 free tickets for Instagram Influencers at 0% fee), platform commission rates, and tiered creator monetization.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveGlobalConfig}
              disabled={isSaving}
              className="px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] disabled:opacity-50 text-white font-bold text-xs rounded-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Saving Policy...' : saveSuccess ? '✓ Policy Saved!' : 'Save Ticketing Rules'}</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex flex-wrap border-b border-[#c3c4c7] pt-2 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSubTab('catalog')}
            className={`px-3 py-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'catalog' ? 'border-[#2271b1] text-[#2271b1] bg-slate-50' : 'border-transparent text-[#50575e] hover:text-[#1d2327]'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Events Catalog &amp; Quotas ({eventsList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('global-policy')}
            className={`px-3 py-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'global-policy' ? 'border-[#2271b1] text-[#2271b1] bg-slate-50' : 'border-transparent text-[#50575e] hover:text-[#1d2327]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Global Defaults &amp; Influencer Rules</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('influencer-tiers')}
            className={`px-3 py-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'influencer-tiers' ? 'border-[#2271b1] text-[#2271b1] bg-slate-50' : 'border-transparent text-[#50575e] hover:text-[#1d2327]'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Influencer Tiered Rates ({configDraft.influencerTiers?.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('host-overrides')}
            className={`px-3 py-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'host-overrides' ? 'border-[#2271b1] text-[#2271b1] bg-slate-50' : 'border-transparent text-[#50575e] hover:text-[#1d2327]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Host &amp; Influencer Custom Overrides ({Object.keys(configDraft.hostOverrides || {}).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('calculator')}
            className={`px-3 py-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'calculator' ? 'border-[#2271b1] text-[#2271b1] bg-slate-50' : 'border-transparent text-[#50575e] hover:text-[#1d2327]'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Revenue Split Simulator</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: EVENTS CATALOG WITH QUOTA TRACKING & OVERRIDES                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-white border border-[#c3c4c7] p-3 rounded-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search events by title, host, or location..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-[#8c8f94] rounded-xs text-xs focus:border-[#2271b1] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#646970] font-bold">Filter Host Type:</span>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value as any)}
                className="p-2 border border-[#8c8f94] rounded-xs bg-white text-xs focus:border-[#2271b1] focus:outline-none"
              >
                <option value="all">All Hosts ({eventsList.length})</option>
                <option value="influencer">Influencer Ambassadors Only</option>
                <option value="standard">Standard Community Hosts</option>
              </select>
            </div>
          </div>

          {/* Events Table */}
          <div className="bg-white border border-[#c3c4c7] shadow-2xs rounded-xs overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f6f7f7] border-b border-[#c3c4c7] text-[#2c3338] font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Event &amp; Venue</th>
                  <th className="py-2.5 px-3">Host &amp; Tier</th>
                  <th className="py-2.5 px-3">Ticket Price</th>
                  <th className="py-2.5 px-3">Free Tickets Quota &amp; Issued</th>
                  <th className="py-2.5 px-3">Platform Commission %</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f1]">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#646970]">
                      No events match the selected search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map(evt => {
                    const policy = calculateEventCommissionPolicy(evt, undefined, ticketingConfig);
                    const isInf = evt.isInfluencerHost || evt.hostRole === 'influencer' || policy.isInfluencerHost;
                    const freeQuota = evt.freeTicketsQuota !== undefined ? evt.freeTicketsQuota : policy.freeTicketsQuota;
                    const freeIssued = evt.freeTicketsIssued || 0;
                    const freeRemaining = Math.max(0, freeQuota - freeIssued);
                    const feeRate = evt.customCommissionRate !== undefined ? evt.customCommissionRate : policy.effectiveCommissionRate;

                    return (
                      <tr key={evt.id} className="hover:bg-[#f6f7f7]">
                        {/* Title */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <img 
                              src={evt.photoUrl} 
                              alt="" 
                              className="w-10 h-10 object-cover rounded-xs border border-[#c3c4c7] shrink-0" 
                              referrerPolicy="no-referrer" 
                            />
                            <div>
                              <span className="font-bold text-slate-900 block line-clamp-1">{evt.title}</span>
                              <span className="text-[10px] text-[#646970]">{evt.location} · {evt.date}</span>
                            </div>
                          </div>
                        </td>

                        {/* Host */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <span className="font-bold text-[#1d2327] block">{evt.hostName}</span>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs font-bold text-[9px] uppercase ${
                              isInf ? 'bg-pink-100 text-pink-900 border border-pink-200' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {isInf ? '★ Influencer Host' : 'Standard Host'}
                            </span>
                          </div>
                        </td>

                        {/* Ticket Price */}
                        <td className="py-3 px-3 font-mono font-bold text-[#1d2327]">
                          {evt.ticketPrice && evt.ticketPrice > 0 ? `₹${evt.ticketPrice}` : 'FREE (₹0)'}
                        </td>

                        {/* Quota Progress */}
                        <td className="py-3 px-3">
                          <div className="space-y-1 max-w-[170px]">
                            <div className="flex justify-between text-[10px]">
                              <span className="font-bold text-emerald-800">{freeIssued} issued</span>
                              <span className="font-mono text-slate-500">/ {freeQuota} free cap</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${isInf ? 'bg-pink-600' : 'bg-emerald-600'}`} 
                                style={{ width: `${Math.min(100, (freeIssued / (freeQuota || 1)) * 100)}%` }}
                              />
                            </div>
                            <span className="text-[9.5px] text-slate-500 block">
                              {freeRemaining} free 0%-fee tickets left
                            </span>
                          </div>
                        </td>

                        {/* Commission */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {feeRate}% {freeIssued < freeQuota ? `(0% on first ${freeQuota})` : ''}
                            </span>
                            <span className="block text-[9.5px] text-slate-500">
                              {evt.customCommissionRate !== undefined ? 'Custom Override' : isInf ? 'Influencer Tier' : 'Standard Rule'}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenEventModal(evt)}
                            className="px-2.5 py-1 bg-[#f0f0f1] hover:bg-[#2271b1] hover:text-white text-[#2c3338] rounded-xs font-bold text-[11px] border border-[#c3c4c7] transition cursor-pointer inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Policy</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: GLOBAL POLICIES & INFLUENCER BASE DEFAULTS                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'global-policy' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Standard Hosts Policy */}
          <div className="bg-white border border-[#c3c4c7] rounded-xs p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-[#f0f0f1] pb-3">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-sm text-[#1d2327]">Standard Community Hosts Policy</h3>
                <p className="text-[11px] text-[#646970]">Applied to general parent hosts &amp; neighborhood organizers.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#2c3338] mb-1">
                  Default Free Ticket Allowance (Zero Commission Quota)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={configDraft.defaultStandardFreeTicketsLimit}
                    onChange={e => setConfigDraft({ ...configDraft, defaultStandardFreeTicketsLimit: Number(e.target.value) || 0 })}
                    className="w-32 p-2 border border-[#8c8f94] rounded-xs font-mono font-bold text-sm focus:border-[#2271b1] focus:outline-none"
                  />
                  <span className="text-[#646970]">tickets at 0% platform fee</span>
                </div>
                <p className="text-[10px] text-[#646970] mt-1">
                  Allows parents to host beginner playdates and small events free of cost up to this cap.
                </p>
              </div>

              <div>
                <label className="block font-bold text-[#2c3338] mb-1">
                  Standard Platform Commission on Paid Tickets (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={configDraft.defaultStandardCommissionRate}
                    onChange={e => setConfigDraft({ ...configDraft, defaultStandardCommissionRate: Number(e.target.value) || 0 })}
                    className="w-32 p-2 border border-[#8c8f94] rounded-xs font-mono font-bold text-sm focus:border-[#2271b1] focus:outline-none"
                  />
                  <span className="text-[#646970] font-bold">% per paid ticket order</span>
                </div>
                <p className="text-[10px] text-[#646970] mt-1">
                  Charged on ticket volume exceeding the free ticket quota.
                </p>
              </div>
            </div>
          </div>

          {/* Influencer Hosts Policy */}
          <div className="bg-white border border-pink-200 rounded-xs p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-pink-100 pb-3">
              <Award className="w-5 h-5 text-pink-600" />
              <div>
                <h3 className="font-bold text-sm text-[#1d2327]">Instagram Influencer Ambassador Policy</h3>
                <p className="text-[11px] text-[#646970]">Free zero-cost hosting and ticketing platform benefits for creators.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-pink-50 p-3 rounded-lg border border-pink-200 text-pink-950 font-medium">
                ✨ <strong>User Request Enforcement:</strong> Influencers can host events and use the ticketing platform free of cost without any commission up to <strong>{configDraft.defaultInfluencerFreeTicketsLimit} tickets</strong>!
              </div>

              <div>
                <label className="block font-bold text-[#2c3338] mb-1">
                  Influencer Free Ticket Quota (100% Zero Commission)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    value={configDraft.defaultInfluencerFreeTicketsLimit}
                    onChange={e => setConfigDraft({ ...configDraft, defaultInfluencerFreeTicketsLimit: Number(e.target.value) || 0 })}
                    className="w-32 p-2 border border-[#8c8f94] rounded-xs font-mono font-bold text-sm focus:border-pink-600 focus:outline-none text-pink-700"
                  />
                  <span className="text-[#646970] font-bold">free tickets at 0% commission</span>
                </div>
                <p className="text-[10px] text-[#646970] mt-1">
                  Default quota for verified Instagram creators and ambassadors.
                </p>
              </div>

              <div>
                <label className="block font-bold text-[#2c3338] mb-1">
                  Commission Rate After Free Quota Exceeded (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={configDraft.defaultInfluencerCommissionRate}
                    onChange={e => setConfigDraft({ ...configDraft, defaultInfluencerCommissionRate: Number(e.target.value) || 0 })}
                    className="w-32 p-2 border border-[#8c8f94] rounded-xs font-mono font-bold text-sm focus:border-pink-600 focus:outline-none"
                  />
                  <span className="text-[#646970] font-bold">% creator rate</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-700">Enable Multi-Tier Volume Brackets:</span>
                <button
                  type="button"
                  onClick={() => setConfigDraft({ ...configDraft, enableTieredCommission: !configDraft.enableTieredCommission })}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                    configDraft.enableTieredCommission ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {configDraft.enableTieredCommission ? '✓ Tiered Enabled' : 'Flat Fee Only'}
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: INFLUENCER TIERED COMMISSION BRACKETS                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'influencer-tiers' && (
        <div className="space-y-4 bg-white border border-[#c3c4c7] p-5 rounded-xs shadow-2xs">
          <div className="flex justify-between items-center border-b border-[#f0f0f1] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#1d2327]">Influencer Ticket Volume &amp; Commission Brackets</h3>
              <p className="text-[11px] text-[#646970]">
                Configure tiered commission charges based on number of tickets generated (e.g. 0% for 1-1,000 tickets, 2% for 1,001-3,000 tickets).
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setTierForm({ minTickets: 1001, maxTickets: 3000, commissionPercent: 2.0, label: 'Custom Creator Tier' });
                setShowAddTierModal(true);
              }}
              className="px-3 py-1.5 bg-[#2271b1] text-white font-bold text-xs rounded-xs flex items-center gap-1 hover:bg-[#135e96] transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add New Tier Bracket</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f6f7f7] border-b border-[#c3c4c7] text-[#2c3338] font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Bracket Tier Label</th>
                  <th className="py-2.5 px-3">Ticket Range (Min - Max)</th>
                  <th className="py-2.5 px-3">Commission Charge (%)</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f1]">
                {(configDraft.influencerTiers || []).map((tier, idx) => (
                  <tr key={idx} className="hover:bg-[#f6f7f7]">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-800 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span>{tier.label}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {tier.minTickets.toLocaleString()} – {tier.maxTickets > 900000 ? 'Unlimited' : tier.maxTickets.toLocaleString()} tickets
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-xs font-mono font-bold text-xs ${
                        tier.commissionPercent === 0 ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-slate-100 text-slate-900'
                      }`}>
                        {tier.commissionPercent === 0 ? '0.0% (FREE OF COST)' : `${tier.commissionPercent}%`}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteTier(idx)}
                        className="text-red-600 hover:text-red-800 p-1 cursor-pointer transition"
                        title="Delete Tier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: HOST & INFLUENCER CUSTOM OVERRIDES                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'host-overrides' && (
        <div className="space-y-4 bg-white border border-[#c3c4c7] p-5 rounded-xs shadow-2xs">
          <div className="flex justify-between items-center border-b border-[#f0f0f1] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#1d2327]">Custom Host &amp; Influencer Quota Overrides</h3>
              <p className="text-[11px] text-[#646970]">
                Assign custom free ticket allocations (e.g. 2,000 tickets) or specialized commission rates to high-profile creators.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingHostKey(null);
                setHostOverrideForm({
                  hostIdOrName: '',
                  freeTicketsQuota: 1000,
                  commissionRate: 2.0,
                  role: 'influencer',
                  notes: ''
                });
                setShowHostOverrideModal(true);
              }}
              className="px-3 py-1.5 bg-[#2271b1] text-white font-bold text-xs rounded-xs flex items-center gap-1 hover:bg-[#135e96] transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Host / Creator Override</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f6f7f7] border-b border-[#c3c4c7] text-[#2c3338] font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Host Name / Identifier</th>
                  <th className="py-2.5 px-3">Role Tier</th>
                  <th className="py-2.5 px-3">Free Tickets Quota</th>
                  <th className="py-2.5 px-3">Commission Rate (%)</th>
                  <th className="py-2.5 px-3">Internal Notes</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f1]">
                {Object.keys(configDraft.hostOverrides || {}).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#646970]">
                      No custom host overrides defined. Global defaults apply to all hosts.
                    </td>
                  </tr>
                ) : (
                  Object.entries(configDraft.hostOverrides).map(([key, ov]) => (
                    <tr key={key} className="hover:bg-[#f6f7f7]">
                      <td className="py-3 px-3 font-bold text-slate-900">{ov.hostIdOrName}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-xs font-bold text-[10px] uppercase ${
                          ov.role === 'influencer' ? 'bg-pink-100 text-pink-900 border border-pink-200' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {ov.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                        {ov.freeTicketsQuota} free tickets
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {ov.commissionRate}%
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px] max-w-[200px] truncate">
                        {ov.notes || '—'}
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingHostKey(key);
                            setHostOverrideForm(ov);
                            setShowHostOverrideModal(true);
                          }}
                          className="text-[#2271b1] hover:underline font-bold text-[11px] cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHostOverride(key)}
                          className="text-red-600 hover:text-red-800 font-bold text-[11px] cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: LIVE REVENUE SPLIT SIMULATOR                                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'calculator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Controls */}
          <div className="bg-white border border-[#c3c4c7] p-5 rounded-xs shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-[#1d2327] border-b border-[#f0f0f1] pb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              Ticketing Order Split Parameters
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#2c3338] mb-1">Ticket Price per Seat (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={simPrice}
                  onChange={e => setSimPrice(Number(e.target.value) || 0)}
                  className="w-full p-2 border border-[#8c8f94] rounded-xs font-mono font-bold text-sm focus:border-[#2271b1] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2c3338] mb-1">Total Tickets Sold</label>
                <input
                  type="number"
                  min="1"
                  value={simCount}
                  onChange={e => setSimCount(Number(e.target.value) || 1)}
                  className="w-full p-2 border border-[#8c8f94] rounded-xs font-mono font-bold text-sm focus:border-[#2271b1] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2c3338] mb-1">Host Role</label>
                  <select
                    value={simRole}
                    onChange={e => {
                      const r = e.target.value as any;
                      setSimRole(r);
                      setSimCustomQuota(r === 'influencer' ? configDraft.defaultInfluencerFreeTicketsLimit : configDraft.defaultStandardFreeTicketsLimit);
                      setSimCustomFee(r === 'influencer' ? configDraft.defaultInfluencerCommissionRate : configDraft.defaultStandardCommissionRate);
                    }}
                    className="w-full p-2 border border-[#8c8f94] rounded-xs bg-white text-xs"
                  >
                    <option value="influencer">Influencer Creator</option>
                    <option value="standard">Standard Host</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#2c3338] mb-1">Free Ticket Cap</label>
                  <input
                    type="number"
                    value={simCustomQuota}
                    onChange={e => setSimCustomQuota(Number(e.target.value) || 0)}
                    className="w-full p-2 border border-[#8c8f94] rounded-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2c3338] mb-1">Platform Commission Rate After Cap (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={simCustomFee}
                  onChange={e => setSimCustomFee(Number(e.target.value) || 0)}
                  className="w-full p-2 border border-[#8c8f94] rounded-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Live Output Card */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-xl space-y-4 shadow-xl border border-slate-800">
            <h3 className="font-bold text-sm text-emerald-400 border-b border-white/10 pb-3 flex items-center justify-between">
              <span>Financial Revenue Split Breakdown</span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 font-mono">Real-time</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-white/10">
                <span className="text-slate-300">Total Gross GMV:</span>
                <span className="font-mono font-bold text-base text-white">₹{simBreakdown.grossAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-white/10">
                <span className="text-slate-300">0%-Fee Free Tickets Count:</span>
                <span className="font-mono font-bold text-emerald-400">{simBreakdown.freeTicketsCount} of {simCount} tickets</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-white/10">
                <span className="text-slate-300">Commissionable Paid Tickets:</span>
                <span className="font-mono font-bold text-amber-300">{simBreakdown.commissionableTicketsCount} tickets</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-white/10">
                <span className="text-slate-300">Vernunt Platform Fee ({simCustomFee}%):</span>
                <span className="font-mono font-bold text-emerald-300">₹{simBreakdown.platformCommissionAmount.toLocaleString()}</span>
              </div>

              <div className="bg-white/10 p-3.5 rounded-xl flex justify-between items-center mt-4">
                <div>
                  <span className="text-[10px] text-slate-300 uppercase tracking-widest block font-bold">
                    Net Payout to Host
                  </span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    ₹{simBreakdown.hostPayoutAmount.toLocaleString()}
                  </span>
                </div>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-bold border border-emerald-400/30">
                  {((simBreakdown.hostPayoutAmount / (simBreakdown.grossAmount || 1)) * 100).toFixed(1)}% to Host
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT SPECIFIC EVENT TICKETING & COMMISSION OVERRIDE              */}
      {/* ========================================================================= */}
      {selectedEventForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col">
            
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-sm">Customize Event Ticketing &amp; Commission</h3>
              </div>
              <button 
                onClick={() => setSelectedEventForEdit(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Target Event</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedEventForEdit.title}</p>
                <p className="text-slate-500 text-[11px]">Host: {selectedEventForEdit.hostName}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Host Role Tier</label>
                  <select
                    value={eventEditForm.hostRole}
                    onChange={e => setEventEditForm({ ...eventEditForm, hostRole: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-md bg-white font-medium"
                  >
                    <option value="standard">Standard Host</option>
                    <option value="influencer">Influencer Ambassador</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Free Ticket Cap</label>
                  <input
                    type="number"
                    min="0"
                    value={eventEditForm.freeTicketsQuota}
                    onChange={e => setEventEditForm({ ...eventEditForm, freeTicketsQuota: Number(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Free Tickets Issued So Far</label>
                  <input
                    type="number"
                    min="0"
                    value={eventEditForm.freeTicketsIssued}
                    onChange={e => setEventEditForm({ ...eventEditForm, freeTicketsIssued: Number(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-300 rounded-md font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Custom Commission Override (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Leave blank for auto tier"
                    value={eventEditForm.customCommissionRate}
                    onChange={e => setEventEditForm({ ...eventEditForm, customCommissionRate: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedEventForEdit(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-md font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEventModal}
                className="px-4 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white rounded-md font-bold text-xs cursor-pointer shadow-xs"
              >
                Save Event Ticketing
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT HOST OVERRIDE                                         */}
      {/* ========================================================================= */}
      {showHostOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col">
            
            <div className="bg-pink-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingHostKey ? 'Edit Host / Influencer Override' : '+ Add New Host / Creator Override'}
              </h3>
              <button 
                onClick={() => setShowHostOverrideModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Host Name or Instagram Handle *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma (@bangalore_mommy_diaries)"
                  value={hostOverrideForm.hostIdOrName}
                  onChange={e => setHostOverrideForm({ ...hostOverrideForm, hostIdOrName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Creator Role</label>
                  <select
                    value={hostOverrideForm.role}
                    onChange={e => setHostOverrideForm({ ...hostOverrideForm, role: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="influencer">Influencer Ambassador</option>
                    <option value="standard">Standard Host</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Free Ticket Cap</label>
                  <input
                    type="number"
                    min="0"
                    value={hostOverrideForm.freeTicketsQuota}
                    onChange={e => setHostOverrideForm({ ...hostOverrideForm, freeTicketsQuota: Number(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Commission Rate After Cap (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={hostOverrideForm.commissionRate}
                  onChange={e => setHostOverrideForm({ ...hostOverrideForm, commissionRate: Number(e.target.value) || 0 })}
                  className="w-full p-2 border border-slate-300 rounded-md font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Verified ambassador partnership agreement signed."
                  value={hostOverrideForm.notes}
                  onChange={e => setHostOverrideForm({ ...hostOverrideForm, notes: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowHostOverrideModal(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-md font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveHostOverride}
                className="px-4 py-1.5 bg-pink-700 hover:bg-pink-800 text-white rounded-md font-bold text-xs cursor-pointer shadow-xs"
              >
                Save Override
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD TIER BRACKET                                                 */}
      {/* ========================================================================= */}
      {showAddTierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col">
            
            <div className="bg-[#2271b1] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">+ Add Influencer Tier Bracket</h3>
              <button 
                onClick={() => setShowAddTierModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tier Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mega Creator Tier"
                  value={tierForm.label}
                  onChange={e => setTierForm({ ...tierForm, label: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Tickets</label>
                  <input
                    type="number"
                    min="1"
                    value={tierForm.minTickets}
                    onChange={e => setTierForm({ ...tierForm, minTickets: Number(e.target.value) || 1 })}
                    className="w-full p-2 border border-slate-300 rounded-md font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Tickets</label>
                  <input
                    type="number"
                    min="1"
                    value={tierForm.maxTickets}
                    onChange={e => setTierForm({ ...tierForm, maxTickets: Number(e.target.value) || 1 })}
                    className="w-full p-2 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Commission Charge (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={tierForm.commissionPercent}
                  onChange={e => setTierForm({ ...tierForm, commissionPercent: Number(e.target.value) || 0 })}
                  className="w-full p-2 border border-slate-300 rounded-md font-mono"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddTierModal(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-md font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddTier}
                className="px-4 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white rounded-md font-bold text-xs cursor-pointer shadow-xs"
              >
                Add Tier Bracket
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
