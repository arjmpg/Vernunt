import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, Check, Copy, ExternalLink, ShieldCheck,
  Search, Download, RefreshCw, AlertCircle, FileCode,
  CheckCircle2, Lock, Zap, Clock, CheckSquare, Calendar,
  Ticket, Play, X
} from 'lucide-react';
import {
  generateGoogleMerchantXml,
  auditProductsForMerchantCenter,
  generateProductJsonLd
} from '../../utils/googleMerchantFeed.ts';
import { getStoredProducts } from '../../data/storeProducts.ts';
import { StoreProduct } from '../../types/store.ts';
import { getAutoIndexAuditLogs, triggerAutoIndex, AutoIndexLogEntry } from '../../services/seoAutoIndexer.ts';

const STORAGE_KEY_MERCHANT_ID = 'vernunt_gmc_account_id';
const DEFAULT_MERCHANT_ID = '5909118279';

interface CronStateInfo {
  schedule: string;
  timezone: string;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string;
  lastRunStatus: string;
  totalRuns: number;
}

interface GoogleSyncAuditLog {
  id: string;
  target: 'merchant_center' | 'google_events';
  mode: 'single_product_delta' | 'single_event_delta' | 'daily_cron' | 'manual_full_sync';
  merchantCenterId?: string;
  entityId?: string;
  entityTitle?: string;
  itemsSynced: number;
  apiPushStatus: string;
  summary: string;
  timestamp: string;
}

interface GoogleEventFeedItem {
  eventId: string;
  name: string;
  category: string;
  startDate: string;
  endDate: string;
  location: any;
  realTimeTicketing: {
    currency: string;
    isFree: boolean;
    minPrice: number;
    maxPrice: number;
    totalCapacity: number;
    bookedCount: number;
    availableTickets: number;
    availabilityStatus: 'InStock' | 'LimitedAvailability' | 'SoldOut';
    eventPageUrl: string;
    directCheckoutUrl: string;
    lastPriceSyncAt: string;
    ticketTiers: Array<{
      tierId: string;
      name: string;
      price: number;
      remainingStock: number;
      availability: string;
      checkoutUrl: string;
    }>;
  };
  structuredDataJsonLd: Record<string, any>;
}

interface GoogleSyncStatusResponse {
  success: boolean;
  merchantCenterId: string;
  baseUrl: string;
  googleMerchantApiTokenConfigured: boolean;
  productsCount: number;
  eventsCount: number;
  feeds: {
    merchantXmlUrl: string;
    merchantJsonUrl: string;
    storeSitemapUrl: string;
    eventsTicketingJsonUrl: string;
  };
  merchantCron: CronStateInfo;
  eventsCron: CronStateInfo;
  eventsPreview: GoogleEventFeedItem[];
  logs: GoogleSyncAuditLog[];
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return 'Not yet run';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return iso;
  }
}

export default function AdminMerchantHubDesk() {
  const [activeTab, setActiveTab] = useState<'feed' | 'products' | 'events_feed' | 'auto_index' | 'privacy'>('feed');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [eventSearchFilter, setEventSearchFilter] = useState('');
  const [autoIndexLogs, setAutoIndexLogs] = useState<AutoIndexLogEntry[]>(getAutoIndexAuditLogs);
  const [isRunningMerchantCron, setIsRunningMerchantCron] = useState(false);
  const [isRunningEventsCron, setIsRunningEventsCron] = useState(false);
  const [syncingProductId, setSyncingProductId] = useState<string | null>(null);
  const [syncingEventId, setSyncingEventId] = useState<string | null>(null);
  const [inspectingProduct, setInspectingProduct] = useState<StoreProduct | null>(null);
  const [inspectingEventJsonLd, setInspectingEventJsonLd] = useState<{ title: string; jsonLd: Record<string, any> } | null>(null);

  const [merchantAccountId, setMerchantAccountId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MERCHANT_ID);
      if (!saved || saved === 'VMH-89410523-IN') {
        localStorage.setItem(STORAGE_KEY_MERCHANT_ID, DEFAULT_MERCHANT_ID);
        return DEFAULT_MERCHANT_ID;
      }
      return saved;
    } catch {
      return DEFAULT_MERCHANT_ID;
    }
  });
  const [isSavedMerchantId, setIsSavedMerchantId] = useState(false);
  const [syncStatus, setSyncStatus] = useState<GoogleSyncStatusResponse | null>(null);

  const products = getStoredProducts();
  const productMap = new Map(products.map(p => [p.id, p]));
  const productAudits = auditProductsForMerchantCenter(products);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.vernunt.com';

  const fetchSyncStatus = useCallback(async () => {
    try {
      const resp = await fetch('/api/google/sync/status');
      if (!resp.ok) return;
      const data: GoogleSyncStatusResponse = await resp.json();
      if (data?.success) {
        setSyncStatus(data);
        if (data.merchantCenterId) {
          setMerchantAccountId(data.merchantCenterId);
          try {
            localStorage.setItem(STORAGE_KEY_MERCHANT_ID, data.merchantCenterId);
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      console.warn('[AdminMerchantHubDesk] Status fetch notice:', err);
    }
  }, []);

  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveMerchantId = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = merchantAccountId.trim() || DEFAULT_MERCHANT_ID;
    setMerchantAccountId(cleanId);
    try {
      localStorage.setItem(STORAGE_KEY_MERCHANT_ID, cleanId);
      const resp = await fetch('/api/google/merchant/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantCenterId: cleanId })
      });
      if (resp.ok) {
        setIsSavedMerchantId(true);
        setStatusMessage(`Google Merchant Center ID ${cleanId} linked and XML/JSON product feeds refreshed.`);
        fetchSyncStatus();
        setTimeout(() => setIsSavedMerchantId(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunMerchantDailyCron = async () => {
    setIsRunningMerchantCron(true);
    setStatusMessage(null);
    try {
      const resp = await fetch('/api/google/merchant/cron-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantCenterId: merchantAccountId,
          products
        })
      });
      const data = await resp.json();
      await triggerAutoIndex({
        type: 'product',
        item: {
          id: 'catalog-batch',
          name: `Merchant Center ${merchantAccountId} Daily Sync`,
          slug: 'store'
        }
      }).catch(() => {});
      setAutoIndexLogs(getAutoIndexAuditLogs());
      if (resp.ok && data?.success) {
        setStatusMessage(`Merchant Center (${data.merchantCenterId}) daily cron completed: ${data.totalProducts} products synced.`);
        fetchSyncStatus();
      } else {
        setStatusMessage(data?.error || 'Merchant cron run finished with a notice.');
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Failed to trigger Merchant Center cron.');
    } finally {
      setIsRunningMerchantCron(false);
    }
  };

  const handleSyncSingleProduct = async (product: StoreProduct) => {
    setSyncingProductId(product.id);
    setStatusMessage(null);
    try {
      const resp = await fetch('/api/google/merchant/sync-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product,
          action: 'update',
          merchantCenterId: merchantAccountId
        })
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        setStatusMessage(`Single-product delta sync completed for "${product.name}" (${data.offerId}) → Merchant Center ${data.merchantCenterId}.`);
        fetchSyncStatus();
      } else {
        setStatusMessage(data?.error || 'Could not sync product.');
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Network error syncing single product.');
    } finally {
      setSyncingProductId(null);
    }
  };

  const handleRunEventsDailyCron = async () => {
    setIsRunningEventsCron(true);
    setStatusMessage(null);
    try {
      let userCreatedEvents: any[] = [];
      try {
        const raw = localStorage.getItem('vernunt_user_created_events');
        if (raw) userCreatedEvents = JSON.parse(raw);
      } catch {
        userCreatedEvents = [];
      }
      const resp = await fetch('/api/google/events/cron-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userCreatedEvents.length > 0 ? {} : {})
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        setStatusMessage(`Google Events Ticketing daily cron completed: ${data.totalEvents} events written to /google-events-feed.json.`);
        fetchSyncStatus();
      } else {
        setStatusMessage(data?.error || 'Events cron completed.');
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Failed to trigger Google Events daily cron.');
    } finally {
      setIsRunningEventsCron(false);
    }
  };

  const handleSyncSingleEvent = async (evtItem: GoogleEventFeedItem) => {
    setSyncingEventId(evtItem.eventId);
    setStatusMessage(null);
    try {
      const resp = await fetch('/api/google/events/sync-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: { id: evtItem.eventId, title: evtItem.name },
          action: 'refresh'
        })
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        setStatusMessage(`Refreshed real-time ticket pricing & Schema.org JSON-LD for "${evtItem.name}".`);
        fetchSyncStatus();
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Error refreshing event.');
    } finally {
      setSyncingEventId(null);
    }
  };

  const handleDownloadMerchantXml = () => {
    const xml = generateGoogleMerchantXml(products, origin);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vernunt-merchant-${merchantAccountId}-feed.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadEventsJson = async () => {
    try {
      const resp = await fetch('/google-events-feed.json');
      const data = await resp.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'google-events-feed.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download events JSON error:', err);
    }
  };

  const filteredProducts = productAudits.filter(audit => {
    const prod = productMap.get(audit.id);
    const q = searchFilter.trim().toLowerCase();
    if (!q) return true;
    return (
      audit.name.toLowerCase().includes(q) ||
      audit.category.toLowerCase().includes(q) ||
      audit.sku.toLowerCase().includes(q) ||
      (prod?.brand || '').toLowerCase().includes(q)
    );
  });

  const eventsPreview = syncStatus?.eventsPreview || [];
  const filteredEvents = eventsPreview.filter(evt => {
    const q = eventSearchFilter.trim().toLowerCase();
    if (!q) return true;
    return (
      evt.name.toLowerCase().includes(q) ||
      evt.category.toLowerCase().includes(q) ||
      String(evt.location?.name || '').toLowerCase().includes(q)
    );
  });

  const merchantXmlUrl = `${origin}/google-merchant-feed.xml`;
  const merchantJsonUrl = `${origin}/google-merchant-feed.json`;
  const eventsFeedJsonUrl = `${origin}/google-events-feed.json`;
  const storeSitemapUrl = `${origin}/sitemap-store.xml`;

  return (
    <div className="space-y-6 text-slate-800">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30">
              Merchant Center ID: {merchantAccountId}
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Daily Cron Active (02:00 &amp; 02:15 IST)
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-sky-500/20 text-sky-200 border border-sky-400/30">
              Google Events Ticketing JSON + Schema.org Live
            </span>
          </div>
          <h2 className="text-2xl font-black font-serif tracking-tight text-white flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-orange-400" />
            <span>Google Merchant Center &amp; Events Ticketing Hub</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Links every store product to Google Merchant Center ID <strong className="text-white">{merchantAccountId}</strong> with daily cron updates and instant single-product delta sync whenever a product is published or edited — plus Schema.org Event JSON-LD and the daily Google Events Ticketing Partner JSON feed.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleRunMerchantDailyCron}
            disabled={isRunningMerchantCron}
            className="px-3.5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningMerchantCron ? 'animate-spin' : ''}`} />
            <span>{isRunningMerchantCron ? 'Running Cron...' : 'Run Merchant Cron'}</span>
          </button>
          <button
            type="button"
            onClick={handleRunEventsDailyCron}
            disabled={isRunningEventsCron}
            className="px-3.5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
          >
            <Calendar className={`w-3.5 h-3.5 ${isRunningEventsCron ? 'animate-spin' : ''}`} />
            <span>{isRunningEventsCron ? 'Syncing Events...' : 'Run Events Cron'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadMerchantXml}
            className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Merchant XML</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3 text-xs font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button type="button" onClick={() => setStatusMessage(null)} className="text-emerald-700 hover:text-emerald-950 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 bg-white rounded-xl p-1.5 shadow-2xs gap-1.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('feed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'feed'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Merchant Center ({merchantAccountId}) &amp; Cron</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'products'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Products &amp; Single-Item Sync ({productAudits.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('events_feed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'events_feed'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>Google Events &amp; Ticketing Feed ({eventsPreview.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('auto_index')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'auto_index'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Cron &amp; Delta Sync Logs ({(syncStatus?.logs.length || 0) + autoIndexLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'privacy'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Child Privacy Firewalls</span>
        </button>
      </div>

      {/* Tab 1: Merchant Center Setup & Daily Cron */}
      {activeTab === 'feed' && (
        <div className="space-y-6">
          {/* Cron Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-orange-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <h3 className="text-sm font-bold text-slate-900">Merchant Center Daily Cron</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  0 2 * * * (02:00 IST)
                </span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <div>
                  Linked Account: <strong className="font-mono text-slate-900">{merchantAccountId}</strong>
                </div>
                <div>
                  Last Run: <strong>{formatDateTime(syncStatus?.merchantCron.lastRunAt)}</strong> • Next Run:{' '}
                  <strong>{formatDateTime(syncStatus?.merchantCron.nextRunAt)}</strong>
                </div>
                <div>
                  Delta Mode:{' '}
                  <span className="text-emerald-700 font-semibold">
                    Single-product sync active on publish/update
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Webhook Endpoint: <code className="font-mono">POST /api/cron/merchant-daily</code>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRunMerchantDailyCron}
                disabled={isRunningMerchantCron}
                className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isRunningMerchantCron ? 'Syncing...' : 'Run Merchant Daily Cron Now'}</span>
              </button>
            </div>

            <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <h3 className="text-sm font-bold text-slate-900">Google Events Daily Cron</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                  15 2 * * * (02:15 IST)
                </span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <div>
                  Feed File: <strong className="font-mono text-slate-900">/google-events-feed.json</strong>
                </div>
                <div>
                  Last Run: <strong>{formatDateTime(syncStatus?.eventsCron.lastRunAt)}</strong> • Next Run:{' '}
                  <strong>{formatDateTime(syncStatus?.eventsCron.nextRunAt)}</strong>
                </div>
                <div>
                  Live Coverage:{' '}
                  <span className="text-sky-700 font-semibold">
                    {eventsPreview.length} events with real-time pricing, stock &amp; direct checkout URLs
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Webhook Endpoint: <code className="font-mono">POST /api/cron/events-daily</code>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRunEventsDailyCron}
                disabled={isRunningEventsCron}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isRunningEventsCron ? 'Updating Feed...' : 'Run Events Daily Cron Now'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-orange-600" />
              <span>Hosted Google Feed Endpoints (Ready for Merchant Center &amp; Events Partner Portal)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Google Merchant XML Feed (RSS 2.0)</span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    GMC {merchantAccountId}
                  </span>
                </div>
                <code className="text-[11px] font-mono text-slate-700 bg-white p-2 rounded-lg border border-slate-200 block break-all">
                  {merchantXmlUrl}
                </code>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">{products.length} Products Linked</span>
                  <div className="flex items-center gap-3">
                    <a
                      href="/google-merchant-feed.xml"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Open
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(merchantXmlUrl, 'primary_feed')}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'primary_feed' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'primary_feed' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Google Merchant JSON Feed</span>
                  <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                    Content API Ready
                  </span>
                </div>
                <code className="text-[11px] font-mono text-slate-700 bg-white p-2 rounded-lg border border-slate-200 block break-all">
                  {merchantJsonUrl}
                </code>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    {syncStatus?.googleMerchantApiTokenConfigured
                      ? 'Live Content API Push Enabled'
                      : 'Feed Sync Active (Optional GOOGLE_MERCHANT_ACCESS_TOKEN)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(merchantJsonUrl, 'merchant_json')}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'merchant_json' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'merchant_json' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Google Events Ticketing Partner JSON Feed</span>
                  <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                    Updated Daily
                  </span>
                </div>
                <code className="text-[11px] font-mono text-slate-700 bg-white p-2 rounded-lg border border-sky-200 block break-all">
                  {eventsFeedJsonUrl}
                </code>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-600">{eventsPreview.length} Events • Real-Time Pricing</span>
                  <div className="flex items-center gap-3">
                    <a
                      href="/google-events-feed.json"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-sky-700 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Open
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(eventsFeedJsonUrl, 'events_json')}
                      className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'events_json' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'events_json' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Store XML Sitemap Index</span>
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                    Sitemap XML
                  </span>
                </div>
                <code className="text-[11px] font-mono text-slate-700 bg-white p-2 rounded-lg border border-slate-200 block break-all">
                  {storeSitemapUrl}
                </code>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">Auto-refreshed daily</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(storeSitemapUrl, 'store_sitemap')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'store_sitemap' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'store_sitemap' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Merchant Account Configuration */}
            <form onSubmit={handleSaveMerchantId} className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 space-y-1 w-full">
                <label className="text-xs font-bold text-slate-800 block">
                  Linked Google Merchant Center Account ID
                </label>
                <input
                  type="text"
                  value={merchantAccountId}
                  onChange={(e) => setMerchantAccountId(e.target.value)}
                  placeholder="5909118279"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                {isSavedMerchantId ? 'Linked & Saved!' : 'Save Merchant ID'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Product Catalog Readiness & Single-Product Delta Sync */}
      {activeTab === 'products' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Google Merchant Center ({merchantAccountId}) Product Sync
              </h3>
              <p className="text-xs text-slate-500">
                Publishing or editing any product automatically triggers a single-product delta sync for only that product. You can also sync any individual product on demand below.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search products or SKU..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">SKU / Offer ID</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Feed Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((audit) => {
                  const product = productMap.get(audit.id);
                  if (!product) return null;
                  return (
                    <tr key={audit.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900 flex items-center gap-2">
                        <img
                          src={product.featuredImage || '/vernunt-logo.png'}
                          alt={product.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="truncate max-w-[210px]">{product.name}</div>
                          <div className="text-[10px] text-slate-500">{product.brand || 'Vernunt'}</div>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600">{audit.sku}</td>
                      <td className="p-3 text-slate-600">{audit.category}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">₹{audit.price}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            audit.availability === 'in_stock'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {audit.availability === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="p-3">
                        {audit.isCompliant ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>GMC Ready</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700" title={audit.warnings.join('; ')}>
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>{audit.warnings[0]}</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={syncingProductId === product.id}
                            onClick={() => handleSyncSingleProduct(product)}
                            className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg font-bold text-[11px] cursor-pointer disabled:opacity-50"
                            title="Sync only this product to Merchant Center 5909118279"
                          >
                            {syncingProductId === product.id ? 'Syncing...' : 'Sync Product'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setInspectingProduct(product)}
                            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg font-bold text-[11px] cursor-pointer"
                          >
                            JSON-LD
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Google Events & Ticketing Partner JSON Feed */}
      {activeTab === 'events_feed' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-sky-600" />
                <span>Google Events Ticketing Partner Program &amp; Schema.org Event Structured Data</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Auto-updated daily at 02:15 IST and instantly on event publish or ticket booking. Includes ISO-8601 start/end dates, venue/virtual locations, real-time ticket pricing, remaining stock, and direct checkout URLs.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={handleDownloadEventsJson}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download google-events-feed.json</span>
              </button>
              <button
                type="button"
                onClick={handleRunEventsDailyCron}
                disabled={isRunningEventsCron}
                className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRunningEventsCron ? 'animate-spin' : ''}`} />
                <span>{isRunningEventsCron ? 'Updating...' : 'Run Events Cron'}</span>
              </button>
            </div>
          </div>

          {/* Search & Feed Endpoint Strip */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-sky-50 border border-sky-200 rounded-xl p-3">
            <div className="text-xs text-sky-950 space-y-0.5 min-w-0">
              <div className="font-bold">Live Google Events Feed Endpoint:</div>
              <code className="text-[11px] font-mono break-all text-sky-800">{eventsFeedJsonUrl}</code>
            </div>
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter events..."
                value={eventSearchFilter}
                onChange={(e) => setEventSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-sky-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">Event Name &amp; Schedule</th>
                  <th className="p-3">Location / Mode</th>
                  <th className="p-3">Real-Time Pricing</th>
                  <th className="p-3">Availability</th>
                  <th className="p-3">Direct Checkout URL</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((evt) => {
                  const rt = evt.realTimeTicketing;
                  const priceLabel = rt.isFree
                    ? 'FREE (₹0)'
                    : rt.minPrice === rt.maxPrice
                      ? `₹${rt.minPrice}`
                      : `₹${rt.minPrice} – ₹${rt.maxPrice}`;
                  return (
                    <tr key={evt.eventId} className="hover:bg-slate-50 align-top">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{evt.name}</div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          Start: {evt.startDate}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          End: {evt.endDate}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 max-w-[200px]">
                        <div className="font-semibold text-slate-800 truncate">
                          {evt.location?.['@type'] === 'VirtualLocation' ? 'Online / Virtual' : (evt.location?.name || 'Bengaluru')}
                        </div>
                        <div className="text-[10px] text-slate-500">{evt.category}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">{priceLabel}</div>
                        <div className="text-[10px] text-slate-500">{rt.ticketTiers.length} tier(s) • INR</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rt.availabilityStatus === 'SoldOut'
                              ? 'bg-rose-100 text-rose-800'
                              : rt.availabilityStatus === 'LimitedAvailability'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {rt.availabilityStatus}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {rt.availableTickets} / {rt.totalCapacity} seats left
                        </div>
                      </td>
                      <td className="p-3 max-w-[220px]">
                        <div className="flex items-center gap-1.5">
                          <code className="text-[10px] font-mono text-sky-700 truncate block max-w-[160px]" title={rt.directCheckoutUrl}>
                            {rt.directCheckoutUrl}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopy(rt.directCheckoutUrl, `evt-checkout-${evt.eventId}`)}
                            className="text-sky-600 hover:text-sky-900 cursor-pointer shrink-0"
                            title="Copy direct checkout URL"
                          >
                            {copiedKey === `evt-checkout-${evt.eventId}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={syncingEventId === evt.eventId}
                            onClick={() => handleSyncSingleEvent(evt)}
                            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg font-bold text-[11px] cursor-pointer disabled:opacity-50"
                          >
                            {syncingEventId === evt.eventId ? 'Syncing...' : 'Sync Event'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setInspectingEventJsonLd({ title: evt.name, jsonLd: evt.structuredDataJsonLd })
                            }
                            className="px-2.5 py-1 text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg font-bold text-[11px] cursor-pointer"
                          >
                            Event JSON-LD
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Cron & Single-Product / Single-Event Delta Sync Logs */}
      {activeTab === 'auto_index' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Google Merchant Center &amp; Events Sync Audit Logs</h3>
              <p className="text-xs text-slate-500">
                Tracks every single-product Merchant Center delta sync, daily cron run, and Google Events Ticketing feed update.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchSyncStatus}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Logs</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {(!syncStatus?.logs || syncStatus.logs.length === 0) && autoIndexLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No cron or delta sync events recorded yet. Publish/edit a product or run a daily cron above.
              </p>
            ) : (
              <>
                {(syncStatus?.logs || []).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            log.target === 'merchant_center'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {log.target === 'merchant_center' ? `GMC ${log.merchantCenterId || merchantAccountId}` : 'Google Events'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 border border-emerald-200 text-emerald-700">
                          {log.mode} ({log.itemsSynced} item{log.itemsSynced === 1 ? '' : 's'})
                        </span>
                        {log.entityTitle && <span className="font-bold text-slate-900">{log.entityTitle}</span>}
                      </div>
                      <p className="text-[11px] text-slate-600">{log.summary}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                ))}

                {autoIndexLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{log.title}</span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 text-slate-700">
                          {log.entityType}
                        </span>
                      </div>
                      <code className="text-[10px] font-mono text-slate-600 block">{log.targetUrl}</code>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Child Privacy Firewall */}
      {activeTab === 'privacy' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base text-slate-900">Child Safety &amp; Private Areas Firewall</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Vernunt enforces a strict privacy firewall ensuring private children data, photos, chats, and coordinates are never included in Google Merchant Center or Google Events feeds.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="border border-red-200 bg-red-50/50 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-red-600" />
                <span>Blocked Private Child Data (Never in Feeds)</span>
              </h4>
              <ul className="text-xs space-y-1.5 text-red-800 list-disc list-inside">
                <li>Child profiles, real names &amp; birthdays</li>
                <li>Live GPS radar coordinates &amp; home addresses</li>
                <li>Parent-to-parent chat logs &amp; group messages</li>
                <li>Aadhaar numbers &amp; DigiLocker documents</li>
              </ul>
            </div>

            <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Allowed Public Commercial Catalog</span>
              </h4>
              <ul className="text-xs space-y-1.5 text-emerald-800 list-disc list-inside">
                <li>Verified e-commerce store products &amp; prices (GMC {merchantAccountId})</li>
                <li>Public family workshops, events &amp; ticketing feeds</li>
                <li>Verified pediatric specialists clinical profiles</li>
                <li>Parenting knowledge guides &amp; storybook titles</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* JSON-LD Product Inspector Modal */}
      {inspectingProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setInspectingProduct(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-5 space-y-3 shadow-2xl text-xs"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900">Schema.org Product JSON-LD: {inspectingProduct.name}</span>
              <button
                type="button"
                onClick={() => setInspectingProduct(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="bg-slate-900 text-emerald-300 p-3 rounded-xl overflow-x-auto text-[11px] font-mono max-h-96">
              {JSON.stringify(generateProductJsonLd(inspectingProduct, origin), null, 2)}
            </pre>
            <div className="text-right">
              <button
                type="button"
                onClick={() => setInspectingProduct(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schema.org Event JSON-LD Inspector Modal */}
      {inspectingEventJsonLd && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setInspectingEventJsonLd(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-5 space-y-3 shadow-2xl text-xs"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900">
                Schema.org Event JSON-LD: {inspectingEventJsonLd.title}
              </span>
              <button
                type="button"
                onClick={() => setInspectingEventJsonLd(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="bg-slate-900 text-sky-300 p-3 rounded-xl overflow-x-auto text-[11px] font-mono max-h-96">
              {JSON.stringify(inspectingEventJsonLd.jsonLd, null, 2)}
            </pre>
            <div className="flex items-center justify-between">
              <a
                href="https://developers.google.com/search/docs/appearance/structured-data/event"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-sky-700 hover:underline font-bold flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" /> Google Event Structured Data Spec
              </a>
              <button
                type="button"
                onClick={() => setInspectingEventJsonLd(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold cursor-pointer"
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
