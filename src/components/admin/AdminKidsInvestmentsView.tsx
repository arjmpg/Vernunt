import React, { useState, useEffect, useMemo } from 'react';
import { InvestmentLead, InvestmentProperty, MutualFundAdvisor, GoldSilverStore } from '../../types/investment.ts';
import { subscribeToInvestmentLeads } from '../../services/investmentNotificationService.ts';
import { 
  Building2, TrendingUp, Sparkles, Phone, Mail, CheckCircle2, 
  Clock, RefreshCw, Search, Download, Filter, Eye, AlertCircle, ShieldCheck
} from 'lucide-react';
import PartnerInvestmentPortal from '../investments/PartnerInvestmentPortal.tsx';
import { 
  INITIAL_INVESTMENT_PROPERTIES, 
  INITIAL_MUTUAL_FUND_ADVISORS, 
  INITIAL_GOLD_SILVER_STORES 
} from '../../data/kidsInvestmentData.ts';

export default function AdminKidsInvestmentsView() {
  const [leads, setLeads] = useState<InvestmentLead[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sectorFilter, setSectorFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedLead, setSelectedLead] = useState<InvestmentLead | null>(null);

  // Partner dashboard modal state for admin to manage items
  const [showPartnerPortal, setShowPartnerPortal] = useState<boolean>(false);
  const [partnerPortalTab, setPartnerPortalTab] = useState<'real_estate' | 'mutual_funds' | 'gold_silver'>('real_estate');

  // Subscribed properties, advisors, gold stores
  const [properties, setProperties] = useState<InvestmentProperty[]>(() => {
    try {
      const saved = localStorage.getItem('vernunt_custom_properties');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.debug('storage note', e);
    }
    return INITIAL_INVESTMENT_PROPERTIES;
  });

  const [advisors, setAdvisors] = useState<MutualFundAdvisor[]>(() => {
    try {
      const saved = localStorage.getItem('vernunt_custom_advisors');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.debug('storage note', e);
    }
    return INITIAL_MUTUAL_FUND_ADVISORS;
  });

  const [goldStores, setGoldStores] = useState<GoldSilverStore[]>(() => {
    try {
      const saved = localStorage.getItem('vernunt_custom_gold_stores');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.debug('storage note', e);
    }
    return INITIAL_GOLD_SILVER_STORES;
  });

  // Subscribe to leads real-time
  useEffect(() => {
    const unsub = subscribeToInvestmentLeads((updatedLeads) => {
      setLeads(updatedLeads);
    });
    return () => unsub();
  }, []);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      if (sectorFilter !== 'All' && l.targetSector !== sectorFilter) return false;
      if (statusFilter !== 'All') {
        if (statusFilter === 'Delivered' && (l.smsStatus !== 'Delivered' || l.emailStatus !== 'Delivered')) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchParent = l.parentName.toLowerCase().includes(q) || l.parentPhone.includes(q);
        const matchItem = l.itemTitle.toLowerCase().includes(q);
        const matchProvider = l.providerName.toLowerCase().includes(q);
        return matchParent || matchItem || matchProvider;
      }
      return true;
    });
  }, [leads, sectorFilter, statusFilter, searchTerm]);

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredLeads.length === 0) {
      alert('No leads to export');
      return;
    }

    const headers = [
      'Lead ID', 'Date', 'Parent Name', 'Parent Phone', 'Parent Email', 
      'Kid Age', 'Sector', 'Item Title', 'Provider Name', 'Provider Phone', 
      'Budget Amount', 'Mode', 'SMS Status', 'SMS ID', 'Email Status', 'Email ID', 'Message'
    ];

    const rows = filteredLeads.map(l => [
      l.id,
      new Date(l.createdAt).toLocaleString('en-IN'),
      `"${l.parentName}"`,
      `"${l.parentPhone}"`,
      `"${l.parentEmail || ''}"`,
      l.kidAge,
      `"${l.targetSector}"`,
      `"${l.itemTitle}"`,
      `"${l.providerName}"`,
      `"${l.providerPhone}"`,
      l.investmentMode === 'monthly' ? l.monthlyInvestmentAmount : (l.bulkInvestmentAmount || 0),
      l.investmentMode,
      l.smsStatus,
      l.smsDeliveryId,
      l.emailStatus,
      l.emailDeliveryId,
      `"${(l.message || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vernunt_kids_investment_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-fadeIn text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#c3c4c7] pb-4">
        <div>
          <h1 className="text-xl font-serif font-black text-[#1d2327] flex items-center gap-2">
            <span className="text-emerald-700">💰</span>
            <span>Kids Future Wealth &amp; Connection Leads Audit</span>
          </h1>
          <p className="text-xs text-[#646970] mt-0.5">
            Real-time audit log of all parents exploring low-cost plots, mutual funds, and gold. Tracks SMS &amp; Email delivery to builders, advisors, and jewellers.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 bg-white border border-[#8c8f94] hover:border-[#2271b1] text-[#2271b1] text-xs font-bold rounded-xs shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Leads CSV</span>
          </button>

          <button
            type="button"
            onClick={() => { setPartnerPortalTab('real_estate'); setShowPartnerPortal(true); }}
            className="px-3.5 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-bold rounded-xs shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Manage Listings &amp; Portals</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#c3c4c7] p-3.5 rounded-xs space-y-1">
          <span className="text-[10.5px] font-bold text-[#646970] uppercase block">
            Total Parent Enquiries
          </span>
          <div className="text-2xl font-serif font-black text-[#1d2327]">
            {leads.length}
          </div>
          <span className="text-[10.5px] text-emerald-700 font-bold block">
            100% Delivery Verified
          </span>
        </div>

        <div className="bg-white border border-[#c3c4c7] p-3.5 rounded-xs space-y-1">
          <span className="text-[10.5px] font-bold text-[#646970] uppercase block">
            Plot / Real Estate Leads
          </span>
          <div className="text-2xl font-serif font-black text-emerald-800">
            {leads.filter(l => l.targetSector === 'Real Estate (Plot / Site)').length}
          </div>
          <span className="text-[10.5px] text-[#50575e] block">
            Low cost site EMIs
          </span>
        </div>

        <div className="bg-white border border-[#c3c4c7] p-3.5 rounded-xs space-y-1">
          <span className="text-[10.5px] font-bold text-[#646970] uppercase block">
            Mutual Fund Advisor Leads
          </span>
          <div className="text-2xl font-serif font-black text-indigo-800">
            {leads.filter(l => l.targetSector === 'Mutual Fund Advisor').length}
          </div>
          <span className="text-[10.5px] text-[#50575e] block">
            AMFI Certified Consults
          </span>
        </div>

        <div className="bg-white border border-[#c3c4c7] p-3.5 rounded-xs space-y-1">
          <span className="text-[10.5px] font-bold text-[#646970] uppercase block">
            Gold / Silver Store Enquiries
          </span>
          <div className="text-2xl font-serif font-black text-amber-800">
            {leads.filter(l => l.targetSector === 'Gold / Silver Store').length}
          </div>
          <span className="text-[10.5px] text-[#50575e] block">
            11-Month Monthly Schemes
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#c3c4c7] p-3 rounded-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search parent name, phone, or property/advisor title..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-[#c3c4c7] rounded-xs text-xs font-medium focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={sectorFilter}
            onChange={e => setSectorFilter(e.target.value)}
            className="bg-white border border-[#c3c4c7] text-[#2c3338] text-xs font-bold rounded-xs px-2.5 py-1.5"
          >
            <option value="All">All Sectors</option>
            <option value="Real Estate (Plot / Site)">Plots &amp; Real Estate</option>
            <option value="Mutual Fund Advisor">Mutual Fund Advisors</option>
            <option value="Gold / Silver Store">Gold &amp; Silver Stores</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-[#c3c4c7] text-[#2c3338] text-xs font-bold rounded-xs px-2.5 py-1.5"
          >
            <option value="All">All Statuses</option>
            <option value="Delivered">SMS &amp; Email Delivered</option>
          </select>
        </div>
      </div>

      {/* Table of Leads */}
      <div className="bg-white border border-[#c3c4c7] rounded-xs overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f0f0f1] border-b border-[#c3c4c7] text-[#2c3338] font-bold">
                <th className="p-3">Parent Info</th>
                <th className="p-3">Child Age &amp; Budget</th>
                <th className="p-3">Selected Asset / Provider</th>
                <th className="p-3">SMS Delivery</th>
                <th className="p-3">Email Delivery</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f1]">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <p className="font-bold text-sm">No investment leads recorded yet.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      When parents explore the "Kids Investment" tab and request a connection, leads with SMS and Email delivery tracking will automatically appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                    
                    {/* Parent Info */}
                    <td className="p-3 font-medium">
                      <span className="font-bold text-[#1d2327] block">{lead.parentName}</span>
                      <span className="font-mono text-[11px] text-emerald-800 font-bold block">{lead.parentPhone}</span>
                      {lead.parentEmail && (
                        <span className="text-[10.5px] text-slate-400 block truncate">{lead.parentEmail}</span>
                      )}
                    </td>

                    {/* Child Age & Budget */}
                    <td className="p-3">
                      <span className="font-bold text-[#1d2327] block">
                        Child: {lead.kidAge} yrs
                      </span>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">
                        {lead.investmentMode === 'monthly' ? `₹${lead.monthlyInvestmentAmount.toLocaleString('en-IN')}/mo` : `₹${(lead.bulkInvestmentAmount || 0).toLocaleString('en-IN')} bulk`}
                      </span>
                    </td>

                    {/* Selected Asset & Provider */}
                    <td className="p-3 max-w-xs">
                      <span className="font-bold text-[#1d2327] block truncate">{lead.itemTitle}</span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        Provider: <strong>{lead.providerName}</strong> ({lead.providerPhone})
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        {lead.targetSector}
                      </span>
                    </td>

                    {/* SMS Status */}
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{lead.smsStatus}</span>
                      </span>
                      <span className="block font-mono text-[9.5px] text-slate-400 mt-0.5">
                        {lead.smsDeliveryId}
                      </span>
                    </td>

                    {/* Email Status */}
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{lead.emailStatus}</span>
                      </span>
                      <span className="block font-mono text-[9.5px] text-slate-400 mt-0.5">
                        {lead.emailDeliveryId}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="p-3 text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLead(lead)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-bold transition cursor-pointer"
                      >
                        Inspect ↗
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs text-left animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif font-black text-slate-900 text-base">
                Lead Audit &amp; Transmission Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">Parent:</span>
                  <span className="font-bold text-slate-900">{selectedLead.parentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">Phone:</span>
                  <a href={`tel:${selectedLead.parentPhone}`} className="font-mono text-emerald-700 font-bold underline">
                    {selectedLead.parentPhone}
                  </a>
                </div>
                {selectedLead.parentEmail && (
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-600">Email:</span>
                    <span className="font-mono text-slate-800">{selectedLead.parentEmail}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">Child Age:</span>
                  <span className="font-bold text-slate-900">{selectedLead.kidAge} years old</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">Budget Capability:</span>
                  <span className="font-mono font-black text-emerald-800">
                    ₹{selectedLead.monthlyInvestmentAmount.toLocaleString('en-IN')}/mo
                  </span>
                </div>
              </div>

              <div className="bg-emerald-50/70 p-3 rounded-xl space-y-1 border border-emerald-200">
                <div className="flex justify-between">
                  <span className="font-bold text-emerald-900">Target Asset:</span>
                  <span className="font-bold text-emerald-950">{selectedLead.itemTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-emerald-900">Provider:</span>
                  <span className="font-bold text-emerald-950">{selectedLead.providerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-emerald-900">Provider Phone:</span>
                  <a href={`tel:${selectedLead.providerPhone}`} className="font-mono text-emerald-800 font-bold underline">
                    {selectedLead.providerPhone}
                  </a>
                </div>
              </div>

              <div className="bg-slate-100 p-3 rounded-xl space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>SMS Transmission:</span>
                  <span>{selectedLead.smsStatus} ({selectedLead.smsDeliveryId})</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>Email Transmission:</span>
                  <span>{selectedLead.emailStatus} ({selectedLead.emailDeliveryId})</span>
                </div>
                <div className="text-[10px] text-slate-500 pt-1">
                  Transmitted at: {new Date(selectedLead.createdAt).toLocaleString('en-IN')}
                </div>
              </div>

              {selectedLead.message && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Parent Message:</span>
                  <p className="bg-slate-50 p-2.5 rounded-xl text-slate-700 italic border border-slate-200">
                    "{selectedLead.message}"
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partner Dashboards Modal for Admin */}
      <PartnerInvestmentPortal
        isOpen={showPartnerPortal}
        onClose={() => setShowPartnerPortal(false)}
        initialTab={partnerPortalTab}
        properties={properties}
        onAddProperty={(p) => {
          const updated = [p, ...properties];
          setProperties(updated);
          localStorage.setItem('vernunt_custom_properties', JSON.stringify(updated));
        }}
        onUpdateProperty={(p) => {
          const updated = properties.map(x => x.id === p.id ? p : x);
          setProperties(updated);
          localStorage.setItem('vernunt_custom_properties', JSON.stringify(updated));
        }}
        onDeleteProperty={(id) => {
          const updated = properties.filter(x => x.id !== id);
          setProperties(updated);
          localStorage.setItem('vernunt_custom_properties', JSON.stringify(updated));
        }}
        advisors={advisors}
        onAddAdvisor={(a) => {
          const updated = [a, ...advisors];
          setAdvisors(updated);
          localStorage.setItem('vernunt_custom_advisors', JSON.stringify(updated));
        }}
        onUpdateAdvisor={(a) => {
          const updated = advisors.map(x => x.id === a.id ? a : x);
          setAdvisors(updated);
          localStorage.setItem('vernunt_custom_advisors', JSON.stringify(updated));
        }}
        onDeleteAdvisor={(id) => {
          const updated = advisors.filter(x => x.id !== id);
          setAdvisors(updated);
          localStorage.setItem('vernunt_custom_advisors', JSON.stringify(updated));
        }}
        goldStores={goldStores}
        onAddGoldStore={(s) => {
          const updated = [s, ...goldStores];
          setGoldStores(updated);
          localStorage.setItem('vernunt_custom_gold_stores', JSON.stringify(updated));
        }}
        onUpdateGoldStore={(s) => {
          const updated = goldStores.map(x => x.id === s.id ? s : x);
          setGoldStores(updated);
          localStorage.setItem('vernunt_custom_gold_stores', JSON.stringify(updated));
        }}
        onDeleteGoldStore={(id) => {
          const updated = goldStores.filter(x => x.id !== id);
          setGoldStores(updated);
          localStorage.setItem('vernunt_custom_gold_stores', JSON.stringify(updated));
        }}
        isAdmin={true}
      />

    </div>
  );
}
