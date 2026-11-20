import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Mail, Search, RefreshCw, CheckCircle2, Clock, AlertTriangle,
  Eye, EyeOff, Send, Download, X, Radio, RotateCcw, Copy, Check,
  FileText, Code, ShieldCheck, Filter, ExternalLink, Sparkles
} from 'lucide-react';

export interface AdminEmailLogRecord {
  id: string;
  trackingToken?: string;
  to: string;
  from: string;
  subject: string;
  type: string;
  category: string;
  triggerSource: string;
  status: string;
  deliveryStatus: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';
  deliveryTransport: 'smtp_gmail' | 'smtp_custom' | 'firestore_queue';
  messageId?: string;
  smtpResponse?: string;
  accepted?: string[];
  rejected?: string[];
  readStatus: 'unread' | 'read';
  readAt?: string;
  lastReadAt?: string;
  openCount: number;
  lastReadUserAgent?: string;
  previewUrl?: string;
  textPreview?: string;
  htmlContent?: string;
  hasHtmlPreview?: boolean;
  timestamp: string;
  updatedAt: string;
  error?: string;
}

interface EmailLogStats {
  total: number;
  delivered: number;
  sent: number;
  queued: number;
  failed: number;
  bounced: number;
  read: number;
  unread: number;
  totalOpens: number;
  openRatePercent: number;
}

interface SmtpRuntimeInfo {
  smtpConfigured: boolean;
  transportMode: 'smtp_gmail' | 'smtp_custom' | 'firestore_queue';
  senderEmail: string;
  host: string;
}

const EMPTY_STATS: EmailLogStats = {
  total: 0,
  delivered: 0,
  sent: 0,
  queued: 0,
  failed: 0,
  bounced: 0,
  read: 0,
  unread: 0,
  totalOpens: 0,
  openRatePercent: 0
};

function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch {
    return iso;
  }
}

export default function AdminEmailLogsDesk() {
  const [logs, setLogs] = useState<AdminEmailLogRecord[]>([]);
  const [stats, setStats] = useState<EmailLogStats>(EMPTY_STATS);
  const [smtpInfo, setSmtpInfo] = useState<SmtpRuntimeInfo>({
    smtpConfigured: false,
    transportMode: 'firestore_queue',
    senderEmail: 'vernunt@gmail.com',
    host: 'Firestore Mail Queue'
  });
  const [streamState, setStreamState] = useState<'connecting' | 'live' | 'reconnecting'>('connecting');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Inspect modal
  const [inspectingLog, setInspectingLog] = useState<AdminEmailLogRecord | null>(null);
  const [inspectPixelUrl, setInspectPixelUrl] = useState<string>('');
  const [inspectTab, setInspectTab] = useState<'html' | 'text' | 'delivery'>('html');
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Test Email composer
  const [showTestComposer, setShowTestComposer] = useState(false);
  const [testToEmail, setTestToEmail] = useState('arjunmpgupta@gmail.com');
  const [testSubject, setTestSubject] = useState('Vernunt Live Email Log & Read-Tracking Test');
  const [testMessage, setTestMessage] = useState(
    'Verifying real-time outgoing email logging, SMTP delivery confirmation, and open/read tracking.'
  );
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const upsertLog = useCallback((incoming: AdminEmailLogRecord) => {
    if (!incoming || !incoming.id) return;
    setLogs(prev => {
      const idx = prev.findIndex(item => item.id === incoming.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...incoming };
        return next;
      }
      return [incoming, ...prev].slice(0, 500);
    });
    setInspectingLog(prev => (prev && prev.id === incoming.id ? { ...prev, ...incoming } : prev));
    setLastUpdatedAt(new Date().toISOString());
  }, []);

  const fetchSnapshot = useCallback(async () => {
    try {
      const resp = await fetch('/api/admin/email-logs?limit=250');
      if (!resp.ok) return;
      const data = await resp.json();
      if (data?.success) {
        setLogs(Array.isArray(data.logs) ? data.logs : []);
        if (data.stats) setStats(data.stats);
        if (data.smtp) setSmtpInfo(data.smtp);
        setLastUpdatedAt(new Date().toISOString());
      }
    } catch (err) {
      console.warn('[AdminEmailLogsDesk] Snapshot fetch warning:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshot();

    let closed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connectSse = () => {
      if (closed) return;
      setStreamState('connecting');
      const es = new EventSource('/api/admin/email-logs/stream');
      eventSourceRef.current = es;

      es.addEventListener('init', (evt: MessageEvent) => {
        try {
          const payload = JSON.parse(evt.data);
          if (Array.isArray(payload.logs)) setLogs(payload.logs);
          if (payload.stats) setStats(payload.stats);
          if (payload.smtp) setSmtpInfo(payload.smtp);
          setStreamState('live');
          setIsLoading(false);
          setLastUpdatedAt(new Date().toISOString());
        } catch {
          // ignore malformed event
        }
      });

      es.addEventListener('email:created', (evt: MessageEvent) => {
        try {
          const payload = JSON.parse(evt.data);
          if (payload.log) upsertLog(payload.log);
          if (payload.stats) setStats(payload.stats);
          setStreamState('live');
        } catch {
          // ignore
        }
      });

      es.addEventListener('email:updated', (evt: MessageEvent) => {
        try {
          const payload = JSON.parse(evt.data);
          if (payload.log) upsertLog(payload.log);
          if (payload.stats) setStats(payload.stats);
          setStreamState('live');
        } catch {
          // ignore
        }
      });

      es.onopen = () => {
        setStreamState('live');
      };

      es.onerror = () => {
        es.close();
        if (!closed) {
          setStreamState('reconnecting');
          reconnectTimer = setTimeout(connectSse, 4000);
        }
      };
    };

    connectSse();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [fetchSnapshot, upsertLog]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => {
      if (l.category) set.add(l.category);
    });
    return Array.from(set).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return logs.filter(log => {
      if (deliveryFilter !== 'all' && log.deliveryStatus !== deliveryFilter) return false;
      if (readFilter !== 'all' && log.readStatus !== readFilter) return false;
      if (categoryFilter !== 'all' && log.category !== categoryFilter) return false;
      if (q) {
        const hay = `${log.to} ${log.subject} ${log.category} ${log.triggerSource} ${log.type} ${log.messageId || ''} ${log.smtpResponse || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [logs, searchQuery, deliveryFilter, readFilter, categoryFilter]);

  const handleInspectLog = async (record: AdminEmailLogRecord) => {
    setInspectingLog(record);
    setInspectTab('html');
    setInspectPixelUrl('');
    setIsLoadingDetail(true);
    try {
      const resp = await fetch(`/api/admin/email-logs/${encodeURIComponent(record.id)}`);
      const data = await resp.json();
      if (resp.ok && data?.success && data.log) {
        setInspectingLog(data.log);
        setInspectPixelUrl(data.trackingPixelUrl || '');
      }
    } catch (err) {
      console.warn('[AdminEmailLogsDesk] Inspect error:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleResendEmail = async (id: string) => {
    setResendingId(id);
    setBannerMessage(null);
    try {
      const resp = await fetch(`/api/admin/email-logs/${encodeURIComponent(id)}/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        setBannerMessage({
          kind: 'success',
          text: `Email resent (${data.deliveryStatus || 'dispatched'}). New entry added live to the log.`
        });
      } else {
        setBannerMessage({ kind: 'error', text: data?.error || 'Could not resend email.' });
      }
    } catch (err: any) {
      setBannerMessage({ kind: 'error', text: err?.message || 'Network error while resending email.' });
    } finally {
      setResendingId(null);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testToEmail.trim()) return;
    setIsSendingTest(true);
    setBannerMessage(null);
    try {
      const resp = await fetch('/api/admin/email-logs/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: testToEmail.trim(),
          subject: testSubject.trim(),
          message: testMessage.trim()
        })
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        setBannerMessage({
          kind: 'success',
          text: `Test email dispatched to ${testToEmail.trim()} (status: ${data.deliveryStatus}). Open the email to watch Read status update live.`
        });
        setShowTestComposer(false);
      } else {
        setBannerMessage({ kind: 'error', text: data?.error || 'Failed to send test email.' });
      }
    } catch (err: any) {
      setBannerMessage({ kind: 'error', text: err?.message || 'Network error sending test email.' });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Timestamp',
      'Recipient',
      'Subject',
      'Category',
      'Trigger Source',
      'Type',
      'Delivery Status',
      'Transport',
      'Read Status',
      'Open Count',
      'First Read At',
      'Message ID',
      'SMTP Response'
    ];
    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows = filteredLogs.map(l =>
      [
        l.timestamp,
        l.to,
        l.subject,
        l.category,
        l.triggerSource,
        l.type,
        l.deliveryStatus,
        l.deliveryTransport,
        l.readStatus,
        l.openCount,
        l.readAt || '',
        l.messageId || '',
        l.smtpResponse || l.error || ''
      ]
        .map(escapeCsv)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vernunt-email-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderDeliveryBadge = (log: AdminEmailLogRecord) => {
    switch (log.deliveryStatus) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <Send className="w-3 h-3" /> Sent
          </span>
        );
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" /> Queued
          </span>
        );
      case 'bounced':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-900 border border-orange-300">
            <AlertTriangle className="w-3 h-3" /> Bounced
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3" /> Failed
          </span>
        );
    }
  };

  const renderTransportLabel = (mode: AdminEmailLogRecord['deliveryTransport']) => {
    if (mode === 'smtp_gmail') return 'Gmail SMTP';
    if (mode === 'smtp_custom') return 'Custom SMTP';
    return 'Firestore Queue';
  };

  return (
    <div className="space-y-5 text-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                streamState === 'live'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  : 'bg-amber-500/20 text-amber-200 border-amber-400/40'
              }`}
            >
              <Radio className={`w-3 h-3 ${streamState === 'live' ? 'animate-pulse' : ''}`} />
              <span>{streamState === 'live' ? 'Real-Time Stream Live' : 'Reconnecting Stream...'}</span>
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-sky-200 border border-white/15 font-mono">
              Sender: {smtpInfo.senderEmail}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                smtpInfo.smtpConfigured
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-200 border-amber-400/30'
              }`}
            >
              {smtpInfo.smtpConfigured ? `SMTP Active (${smtpInfo.host})` : 'Firestore Queue (Set SMTP_PASS for Live Inbox)'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-serif tracking-tight flex items-center gap-2.5">
            <Mail className="w-6 h-6 text-sky-400" />
            <span>Real-Time Outgoing Email Logs &amp; Read Tracker</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Captures every outgoing notification, trigger, OTP, booking pass, payment alert, password alert, and store order email across Vernunt in real time with live delivery confirmation and recipient read-receipt tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setShowTestComposer(prev => !prev)}
            className="px-3.5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Test Email</span>
          </button>
          <button
            type="button"
            onClick={fetchSnapshot}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/15 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/15 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {bannerMessage && (
        <div
          className={`rounded-xl p-3 text-xs font-bold flex items-center justify-between gap-2 border ${
            bannerMessage.kind === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerMessage.kind === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{bannerMessage.text}</span>
          </div>
          <button type="button" onClick={() => setBannerMessage(null)} className="text-slate-500 hover:text-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Test Email Drawer */}
      {showTestComposer && (
        <form
          onSubmit={handleSendTestEmail}
          className="bg-white border border-sky-200 rounded-2xl p-5 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Dispatch Test Email with Embedded Read-Receipt Pixel</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowTestComposer(false)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Recipient Email</label>
              <input
                type="email"
                required
                value={testToEmail}
                onChange={e => setTestToEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Subject</label>
              <input
                type="text"
                required
                value={testSubject}
                onChange={e => setTestSubject(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Message Body</label>
            <textarea
              rows={2}
              value={testMessage}
              onChange={e => setTestMessage(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              A 1×1 transparent open-tracking pixel is injected automatically into the email HTML.
            </span>
            <button
              type="submit"
              disabled={isSendingTest}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingTest ? 'Dispatching...' : 'Send Live Test'}</span>
            </button>
          </div>
        </form>
      )}

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Emails Logged</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">All app triggers &amp; alerts</div>
        </div>
        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Delivered / Sent</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{stats.delivered + stats.sent}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">
            {stats.delivered} confirmed • {stats.sent} relayed
          </div>
        </div>
        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Queued</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{stats.queued}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Firestore / pending relay</div>
        </div>
        <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Failed / Bounced</div>
          <div className="text-2xl font-black text-rose-700 mt-1">{stats.failed + stats.bounced}</div>
          <div className="text-[11px] text-rose-600 mt-0.5">
            {stats.failed} failed • {stats.bounced} bounced
          </div>
        </div>
        <div className="bg-white border border-indigo-200 rounded-2xl p-4 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Read / Opened</div>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            {stats.read} <span className="text-sm font-bold text-indigo-500">({stats.openRatePercent}%)</span>
          </div>
          <div className="text-[11px] text-indigo-600 mt-0.5">{stats.totalOpens} total open events</div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search recipient email, subject, trigger, message ID, or SMTP status..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={deliveryFilter}
                onChange={e => setDeliveryFilter(e.target.value)}
                className="px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white font-semibold"
              >
                <option value="all">All Delivery Statuses</option>
                <option value="delivered">Delivered</option>
                <option value="sent">Sent</option>
                <option value="queued">Queued</option>
                <option value="bounced">Bounced</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <select
              value={readFilter}
              onChange={e => setReadFilter(e.target.value as 'all' | 'read' | 'unread')}
              className="px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white font-semibold"
            >
              <option value="all">All Read States</option>
              <option value="read">Read / Opened</option>
              <option value="unread">Unread</option>
            </select>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white font-semibold"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-800">{filteredLogs.length}</strong> of{' '}
            <strong className="text-slate-800">{logs.length}</strong> outgoing email logs
          </span>
          <span>
            {lastUpdatedAt ? `Last live sync: ${formatDateTime(lastUpdatedAt)}` : 'Waiting for live events...'}
          </span>
        </div>

        {/* Real-Time Logs Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="p-3 whitespace-nowrap">Sent At</th>
                <th className="p-3">Recipient &amp; Subject</th>
                <th className="p-3 whitespace-nowrap">Trigger / Category</th>
                <th className="p-3 whitespace-nowrap">Delivery Status</th>
                <th className="p-3 whitespace-nowrap">Read Status</th>
                <th className="p-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Connecting to live email log stream...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No outgoing emails match your current filter. Click <strong>Send Test Email</strong> or trigger any user action in the app to see live logs appear automatically.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/90 align-top">
                    <td className="p-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      <div>{formatDateTime(log.timestamp)}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{log.id}</div>
                    </td>
                    <td className="p-3 min-w-[240px]">
                      <div className="font-bold text-slate-900 line-clamp-1">{log.subject}</div>
                      <div className="text-[11px] font-mono text-sky-700 mt-0.5 break-all">{log.to}</div>
                      {log.textPreview && (
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{log.textPreview}</div>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-bold text-[10px]">
                        {log.category}
                      </span>
                      <div className="text-[11px] text-slate-600 mt-1">{log.triggerSource}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div>{renderDeliveryBadge(log)}</div>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">
                        {renderTransportLabel(log.deliveryTransport)}
                      </div>
                      {log.error && (
                        <div className="text-[10px] text-rose-600 mt-0.5 max-w-[180px] truncate" title={log.error}>
                          {log.error}
                        </div>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {log.readStatus === 'read' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <Eye className="w-3 h-3" /> Read · {log.openCount || 1}×
                          </span>
                          <div className="text-[10px] text-slate-500 mt-1">
                            {formatDateTime(log.lastReadAt || log.readAt)}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <EyeOff className="w-3 h-3" /> Unread
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">Awaiting open pixel</div>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleInspectLog(log)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px] transition cursor-pointer"
                        >
                          Inspect
                        </button>
                        <button
                          type="button"
                          disabled={resendingId === log.id}
                          onClick={() => handleResendEmail(log.id)}
                          className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg font-bold text-[11px] transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Resend this email"
                        >
                          <RotateCcw className={`w-3 h-3 ${resendingId === log.id ? 'animate-spin' : ''}`} />
                          <span>Resend</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Honest Read-Tracking Note */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <p>
            <strong>How Read Tracking Works:</strong> Every outgoing HTML email automatically embeds a unique 1×1 transparent tracking pixel (<code className="font-mono">/api/emails/track/open/:id/:token.gif</code>). When the recipient opens the email with remote images enabled, the log switches to <strong>Read</strong> in real time and records open counts and timestamps. Some privacy-focused mail clients (e.g., Apple Mail Privacy Protection or clients blocking external images) may pre-fetch or block tracking pixels.
          </p>
        </div>
      </div>

      {/* Inspect Email Modal */}
      {inspectingLog && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setInspectingLog(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {renderDeliveryBadge(inspectingLog)}
                  {inspectingLog.readStatus === 'read' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white">
                      <Eye className="w-3 h-3" /> Read ({inspectingLog.openCount || 1}×)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-200">
                      <EyeOff className="w-3 h-3" /> Unread
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-slate-400">{inspectingLog.id}</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold truncate">{inspectingLog.subject}</h3>
                <p className="text-[11px] text-slate-300 font-mono truncate">
                  To: {inspectingLog.to} • From: {inspectingLog.from}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-4 pt-3 border-b border-slate-200 flex items-center gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setInspectTab('html')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  inspectTab === 'html'
                    ? 'border-sky-600 text-sky-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code className="w-3.5 h-3.5" /> HTML Preview
              </button>
              <button
                type="button"
                onClick={() => setInspectTab('text')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  inspectTab === 'text'
                    ? 'border-sky-600 text-sky-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Plain Text
              </button>
              <button
                type="button"
                onClick={() => setInspectTab('delivery')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  inspectTab === 'delivery'
                    ? 'border-sky-600 text-sky-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Delivery &amp; Read Telemetry
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {isLoadingDetail ? (
                <div className="py-10 text-center text-xs text-slate-500">Loading email payload...</div>
              ) : inspectTab === 'html' ? (
                inspectingLog.htmlContent ? (
                  <iframe
                    title="Email HTML Preview"
                    sandbox=""
                    srcDoc={inspectingLog.htmlContent}
                    className="w-full h-[420px] border border-slate-200 rounded-xl bg-white"
                  />
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    HTML body not stored for this entry. View the Plain Text or Delivery tabs instead.
                  </div>
                )
              ) : inspectTab === 'text' ? (
                <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800 whitespace-pre-wrap font-mono">
                  {inspectingLog.textPreview || inspectingLog.subject}
                </pre>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Delivery Engine</div>
                      <div className="font-bold text-slate-900">{renderTransportLabel(inspectingLog.deliveryTransport)}</div>
                      <div className="text-[11px] font-mono text-slate-600 break-all">
                        Message-ID: {inspectingLog.messageId || '—'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Read Receipt Activity</div>
                      <div className="font-bold text-slate-900">
                        {inspectingLog.readStatus === 'read'
                          ? `Opened ${inspectingLog.openCount || 1} time(s)`
                          : 'Not yet opened'}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        First Read: {formatDateTime(inspectingLog.readAt)} • Last Read: {formatDateTime(inspectingLog.lastReadAt)}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-500">SMTP Response / Queue Note</div>
                    <div className="font-mono text-[11px] text-slate-800 break-all">
                      {inspectingLog.smtpResponse || inspectingLog.error || 'Accepted'}
                    </div>
                  </div>

                  {inspectingLog.lastReadUserAgent && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Reader Client User-Agent</div>
                      <div className="font-mono text-[11px] text-slate-700 break-all">
                        {inspectingLog.lastReadUserAgent}
                      </div>
                    </div>
                  )}

                  {inspectPixelUrl && (
                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-indigo-800">
                          Embedded Read-Receipt Tracking Pixel URL
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(inspectPixelUrl, 'pixel')}
                            className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === 'pixel' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === 'pixel' ? 'Copied' : 'Copy'}</span>
                          </button>
                          <a
                            href={inspectPixelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Test Open
                          </a>
                        </div>
                      </div>
                      <code className="block text-[10px] font-mono text-indigo-950 bg-white p-2 rounded-lg border border-indigo-200 break-all">
                        {inspectPixelUrl}
                      </code>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={resendingId === inspectingLog.id}
                onClick={() => handleResendEmail(inspectingLog.id)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resendingId === inspectingLog.id ? 'animate-spin' : ''}`} />
                <span>Resend Email</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
