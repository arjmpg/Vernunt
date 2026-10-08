import React, { useState, useEffect } from 'react';
import { SocialShareRecord, ChildProfile } from '../../types.ts';
import { getTrackedSocialShares, subscribeToSocialShares } from '../../utils/shareTracking.ts';
import { 
  Share2, Users, Search, Filter, ArrowUpDown, Calendar, 
  ExternalLink, Phone, Mail, CheckCircle2, Eye, Award, 
  TrendingUp, RefreshCw, X, Download, ShieldCheck, MessageCircle
} from 'lucide-react';

interface EventShareTrackerViewProps {
  onClose?: () => void;
  userProfile?: ChildProfile | null;
}

export default function EventShareTrackerView({ onClose, userProfile }: EventShareTrackerViewProps) {
  const [shares, setShares] = useState<SocialShareRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    getTrackedSocialShares().then((list) => {
      setShares(list);
      setLoading(false);
    });

    // Real-time listener for live updates
    const unsubscribe = subscribeToSocialShares((list) => {
      setShares(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredShares = shares.filter((share) => {
    const matchesSearch = 
      share.eventTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      share.senderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      share.senderPhone?.includes(searchQuery) ||
      share.recipientPhone?.includes(searchQuery) ||
      share.recipientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      share.shareToken?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlatform = platformFilter === 'all' || share.platform === platformFilter;

    return matchesSearch && matchesPlatform;
  });

  // Calculate Metrics
  const totalShares = shares.length;
  const directPhoneShares = shares.filter(s => s.recipientPhone).length;
  const totalClicks = shares.reduce((acc, curr) => acc + (curr.clicksCount || 0), 0);
  const totalConversions = shares.reduce((acc, curr) => acc + (curr.conversionsCount || 0), 0);

  const handleCopyLink = (token: string, url: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    }
  };

  const formatPlatformLabel = (platform: string) => {
    switch (platform) {
      case 'whatsapp_direct':
        return { label: 'WhatsApp (Direct Phone)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'whatsapp_general':
        return { label: 'WhatsApp (General)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'facebook':
        return { label: 'Facebook', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'twitter':
        return { label: 'X (Twitter)', color: 'bg-slate-100 text-slate-800 border-slate-300' };
      case 'telegram':
        return { label: 'Telegram', color: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'linkedin':
        return { label: 'LinkedIn', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'email':
        return { label: 'Email', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'native_share':
        return { label: 'Device Share', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'link_copy':
        return { label: 'Link Copied', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'qr_flyer':
        return { label: 'QR Flyer Pass', color: 'bg-orange-50 text-orange-700 border-orange-200' };
      default:
        return { label: platform, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const handleExportCsv = () => {
    if (shares.length === 0) return;
    const headers = ['Share ID', 'Date & Time', 'Event Title', 'Sender Name', 'Sender Phone', 'Sender Email', 'Recipient Phone', 'Recipient Name', 'Platform', 'Clicks', 'Conversions', 'Share URL'];
    const rows = shares.map(s => [
      s.id,
      s.createdAt,
      `"${(s.eventTitle || '').replace(/"/g, '""')}"`,
      `"${(s.senderName || '').replace(/"/g, '""')}"`,
      s.senderPhone || '',
      s.senderEmail || '',
      s.recipientPhone || '',
      `"${(s.recipientName || '').replace(/"/g, '""')}"`,
      s.platform,
      s.clicksCount || 0,
      s.conversionsCount || 0,
      `"${s.shareUrl}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vernunt_social_shares_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="event-share-tracker-view" className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden text-left font-sans animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-orange-950 to-slate-900 p-5 sm:p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-orange-500/30 border border-orange-400/40 text-orange-300 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-400" /> Real-Time Social Share Telemetry &amp; Audit
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-serif text-white flex items-center gap-2">
            <span>Social Share Tracking &amp; Attribution Desk</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Live audit of who shared which event, from which account/number, to which recipient phone number, with link clicks and ticket booking attribution.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            id="btn-export-share-audit-csv"
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/15"
            title="Export CSV Log"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Shares Logged</span>
            <span className="p-1.5 rounded-xl bg-orange-100 text-orange-600"><Share2 className="w-4 h-4" /></span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">{totalShares}</p>
          <span className="text-[10.5px] text-slate-400 font-medium">All channels recorded</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Direct Phone Sends</span>
            <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-600"><Phone className="w-4 h-4" /></span>
          </div>
          <p className="text-2xl font-black text-emerald-800 mt-2 font-mono">{directPhoneShares}</p>
          <span className="text-[10.5px] text-emerald-600 font-medium">Recipient numbers captured</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Inbound Clicks</span>
            <span className="p-1.5 rounded-xl bg-blue-100 text-blue-600"><Eye className="w-4 h-4" /></span>
          </div>
          <p className="text-2xl font-black text-blue-900 mt-2 font-mono">{totalClicks}</p>
          <span className="text-[10.5px] text-blue-600 font-medium">Unique opens via tracked links</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Ticket Conversions</span>
            <span className="p-1.5 rounded-xl bg-purple-100 text-purple-600"><TrendingUp className="w-4 h-4" /></span>
          </div>
          <p className="text-2xl font-black text-purple-900 mt-2 font-mono">{totalConversions}</p>
          <span className="text-[10.5px] text-purple-600 font-medium">Bookings attributed to shares</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Sender Name, Sender Mobile, Recipient Mobile, Event, or Share Token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Channels</option>
            <option value="whatsapp_direct">WhatsApp (Direct Phone)</option>
            <option value="whatsapp_general">WhatsApp (General)</option>
            <option value="facebook">Facebook</option>
            <option value="twitter">X (Twitter)</option>
            <option value="telegram">Telegram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="email">Email</option>
            <option value="link_copy">Link Copy</option>
            <option value="native_share">Device Share</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 uppercase font-black tracking-wider text-[10px]">
              <th className="p-3.5 pl-5">Date &amp; Time</th>
              <th className="p-3.5">Event Details</th>
              <th className="p-3.5">From Account &amp; Number</th>
              <th className="p-3.5">To Mobile Number</th>
              <th className="p-3.5">Platform Channel</th>
              <th className="p-3.5 text-center">Clicks</th>
              <th className="p-3.5 text-center">Conversions</th>
              <th className="p-3.5 pr-5 text-right">Tracked Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                    <span>Loading real-time social share audit records...</span>
                  </div>
                </td>
              </tr>
            ) : filteredShares.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700 text-sm">No share records found</p>
                    <p className="text-xs">When users or parents click share on events, the telemetry audit records will appear here live.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredShares.map((share) => {
                const meta = formatPlatformLabel(share.platform);
                const dateFormatted = new Date(share.timestamp).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <tr key={share.id} className="hover:bg-orange-50/40 transition-colors">
                    {/* Timestamp */}
                    <td className="p-3.5 pl-5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {dateFormatted}
                    </td>

                    {/* Event */}
                    <td className="p-3.5 min-w-[180px]">
                      <div className="font-bold text-slate-900 leading-tight line-clamp-1">{share.eventTitle}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <span>{share.eventDate}</span>
                        {share.eventLocation && <span>• {share.eventLocation.split(',')[0]}</span>}
                      </div>
                    </td>

                    {/* From Account & Mobile */}
                    <td className="p-3.5 min-w-[160px]">
                      <div className="font-extrabold text-slate-900 flex items-center gap-1">
                        <span>{share.senderName}</span>
                        {share.senderRole && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                            {share.senderRole}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-600 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-orange-500 shrink-0" />
                        <span>{share.senderPhone || 'Mobile not provided'}</span>
                      </div>
                    </td>

                    {/* To Mobile Number */}
                    <td className="p-3.5 min-w-[160px]">
                      {share.recipientPhone ? (
                        <div>
                          <div className="font-mono font-bold text-emerald-800 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                            <span>{share.recipientPhone}</span>
                          </div>
                          {share.recipientName && (
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                              Recipient: {share.recipientName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10.5px] text-slate-400 italic">
                          Broadcast / General Group
                        </span>
                      )}
                    </td>

                    {/* Channel */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${meta.color}`}>
                        {meta.label}
                      </span>
                    </td>

                    {/* Clicks */}
                    <td className="p-3.5 text-center font-mono font-bold">
                      <span className={share.clicksCount > 0 ? 'text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full' : 'text-slate-400'}>
                        {share.clicksCount || 0}
                      </span>
                    </td>

                    {/* Conversions */}
                    <td className="p-3.5 text-center font-mono font-bold">
                      <span className={share.conversionsCount > 0 ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full' : 'text-slate-400'}>
                        {share.conversionsCount || 0}
                      </span>
                    </td>

                    {/* Tracked Link & Token */}
                    <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {share.shareToken}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(share.shareToken, share.shareUrl)}
                          className="p-1 rounded-md bg-slate-100 hover:bg-orange-100 text-slate-600 hover:text-orange-600 transition cursor-pointer"
                          title="Copy Tracked Link"
                        >
                          {copiedToken === share.shareToken ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <span>Showing <strong>{filteredShares.length}</strong> of {shares.length} recorded shares</span>
        <span className="text-[11px] text-slate-400">
          🔒 Telemetry strictly governed under Vernunt Child Protection &amp; Community Security Audit policies
        </span>
      </div>
    </div>
  );
}
