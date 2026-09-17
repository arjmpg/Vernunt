import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Clock, Calendar, Download, RefreshCw, Trash2,
  CheckCircle2, AlertCircle, ShoppingBag, Filter, Sparkles,
  ExternalLink, Eye, ChevronRight, X, ArrowUpDown, TrendingUp,
  MapPin, User, ShieldAlert, Package, Layers
} from 'lucide-react';
import { ProductSearchLogEntry, MatchedProductSnippet } from '../../types/searchAnalytics.ts';
import {
  getStoredProductSearchLogs,
  saveStoredProductSearchLogs,
  computeSearchAnalyticsSummary,
  clearStoredProductSearchLogs,
  RETENTION_DAYS,
  EVENT_SEARCH_LOGS_UPDATED
} from '../../data/productSearchAnalytics.ts';

interface AdminProductSearchesDeskProps {
  onOpenProductDetail?: (productId: string) => void;
}

export const AdminProductSearchesDesk: React.FC<AdminProductSearchesDeskProps> = ({
  onOpenProductDetail
}) => {
  // State
  const [logs, setLogs] = useState<ProductSearchLogEntry[]>(getStoredProductSearchLogs);
  const [filterDateRange, setFilterDateRange] = useState<'45d' | '30d' | '14d' | '7d' | 'today'>('45d');
  const [filterOutcome, setFilterOutcome] = useState<'all' | 'has_results' | 'zero_results'>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'radar_search' | 'store_catalog'>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedLogForModal, setSelectedLogForModal] = useState<ProductSearchLogEntry | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedProductInspect, setSelectedProductInspect] = useState<MatchedProductSnippet | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync listener across tabs and events
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setLogs(e.detail);
      } else {
        setLogs(getStoredProductSearchLogs());
      }
    };

    window.addEventListener(EVENT_SEARCH_LOGS_UPDATED, handleUpdate);
    return () => {
      window.removeEventListener(EVENT_SEARCH_LOGS_UPDATED, handleUpdate);
    };
  }, []);

  // Compute 45-day cutoff date
  const cutoffDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - RETENTION_DAYS);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }, []);

  // Filter logs by date range, outcome, source, and search term
  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    let maxAgeMs = 45 * DAY_MS;
    if (filterDateRange === '30d') maxAgeMs = 30 * DAY_MS;
    if (filterDateRange === '14d') maxAgeMs = 14 * DAY_MS;
    if (filterDateRange === '7d') maxAgeMs = 7 * DAY_MS;
    if (filterDateRange === 'today') maxAgeMs = 1 * DAY_MS;

    return logs.filter(log => {
      const logTime = new Date(log.searchedAt).getTime();
      const ageMs = now - logTime;

      // Date range filter
      if (ageMs > maxAgeMs) return false;

      // Outcome filter
      if (filterOutcome === 'has_results' && log.matchedCount === 0) return false;
      if (filterOutcome === 'zero_results' && log.matchedCount > 0) return false;

      // Source filter
      if (filterSource !== 'all') {
        if (filterSource === 'radar_search' && log.source !== 'radar_search') return false;
        if (filterSource === 'store_catalog' && log.source !== 'store_catalog' && log.source !== 'mobile_store') return false;
      }

      // Keyword filter
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const matchesQuery = log.query.toLowerCase().includes(q);
        const matchesUser = log.userName.toLowerCase().includes(q) || log.userCity.toLowerCase().includes(q);
        const matchesProduct = log.matchedProducts.some(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
        if (!matchesQuery && !matchesUser && !matchesProduct) return false;
      }

      return true;
    });
  }, [logs, filterDateRange, filterOutcome, filterSource, searchKeyword]);

  // Analytical summary based on currently filtered logs
  const stats = useMemo(() => {
    return computeSearchAnalyticsSummary(filteredLogs);
  }, [filteredLogs]);

  // Overall full 45-day analytics summary
  const overallStats = useMemo(() => {
    return computeSearchAnalyticsSummary(logs);
  }, [logs]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      showToast('No logs found for export');
      return;
    }

    const headers = ['Search ID', 'Search Query', 'Timestamp', 'User Name', 'Role', 'City', 'Matched Products Count', 'Matched Product Names', 'Source'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.query.replace(/"/g, '""')}"`,
      new Date(l.searchedAt).toLocaleString('en-IN'),
      `"${l.userName}"`,
      l.userRole,
      l.userCity,
      l.matchedCount,
      `"${l.matchedProducts.map(p => p.name).join('; ').replace(/"/g, '""')}"`,
      l.source
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vernunt_product_searches_${filterDateRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredLogs.length} search records to CSV`);
  };

  // Force Prune History (> 45 days)
  const handleForcePrune = () => {
    saveStoredProductSearchLogs(logs);
    showToast('Pruning complete: Enforced strict 45-day retention limit.');
  };

  // Reset to default sample history
  const handleResetHistory = () => {
    clearStoredProductSearchLogs();
    setTimeout(() => {
      setLogs(getStoredProductSearchLogs());
      showToast('Reset search logs to standard 45-day seed history');
    }, 50);
  };

  // Format relative time
  const getRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (3600 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 3600 * 1000));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Retention Policy Header */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-rose-900/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2.5">
                  <span>Product Search Telemetry &amp; Logs</span>
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-400/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    45-Day Window
                  </span>
                </h2>
                <p className="text-xs text-rose-200/80 font-medium">
                  Complete administrative visibility into products queried across the Vernunt ecosystem (Radar Search &amp; Storefront Catalog).
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Download filtered records as CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleForcePrune}
              className="px-3 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-xs font-bold text-rose-200 transition flex items-center gap-1.5 cursor-pointer"
              title="Ensure all logs older than 45 days are purged"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Verify 45-Day Pruning</span>
            </button>
            <button
              type="button"
              onClick={handleResetHistory}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
              title="Reload sample telemetry data"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Retention Policy Notice Pill */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-rose-200/80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span><strong>Retention Protocol:</strong> Preserving rolling 45 days of search traffic (Earliest active record: <strong>{cutoffDate}</strong>).</span>
          </div>
          <span className="font-mono text-white/90">
            Total Logs in 45-Day Window: <strong>{logs.length} searches</strong>
          </span>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Searches ({filterDateRange})</span>
            <Search className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{stats.totalSearches}</div>
          <div className="text-[11px] text-slate-500">
            Across {stats.uniqueQueries} unique queries
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Active Searchers</span>
            <User className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900 font-mono">{stats.uniqueUsers}</div>
          <div className="text-[11px] text-slate-500">
            Unique verified parents &amp; daycare accounts
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Product Matches</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 font-mono">{stats.totalProductsMatched}</div>
          <div className="text-[11px] text-emerald-700 font-medium">
            Items presented to searching parents
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Zero-Result Searches</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono">{stats.zeroResultCount}</div>
          <div className="text-[11px] text-amber-700 font-medium">
            {stats.zeroResultRate}% unmet demand (catalogue gaps)
          </div>
        </div>
      </div>

      {/* Top Searched Products & Popular Keywords Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top 5 Most Searched Products */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-600" />
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                Top Searched Products (Last 45 Days)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Ranked by search occurrences
            </span>
          </div>

          {overallStats.topSearchedProducts.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No product matches recorded yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {overallStats.topSearchedProducts.slice(0, 6).map((item, idx) => (
                <div
                  key={item.product.id}
                  onClick={() => setSelectedProductInspect(item.product)}
                  className="p-2.5 rounded-xl border border-slate-150 hover:border-rose-300 hover:shadow-xs bg-slate-50/50 hover:bg-white transition flex items-center gap-3 cursor-pointer group"
                >
                  <span className="w-5 h-5 rounded-full bg-slate-200 group-hover:bg-rose-100 text-slate-700 group-hover:text-rose-700 text-[10px] font-black flex items-center justify-center shrink-0 font-mono">
                    #{idx + 1}
                  </span>
                  <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <img
                      src={item.product.featuredImage}
                      alt={item.product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-bold text-rose-700 uppercase tracking-wider block truncate">
                      {item.product.category}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-rose-700 transition">
                      {item.product.name}
                    </h4>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="font-mono font-black text-slate-800">₹{item.product.price}</span>
                      <span className="text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 px-1.5 py-0.2 rounded-md font-mono">
                        {item.searchCount} searches
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Keywords Cloud & Unmet Search Gaps */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                  Top Query Terms
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">Frequency</span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {overallStats.topKeywords.slice(0, 12).map((kw, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSearchKeyword(kw.keyword)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition cursor-pointer ${
                    kw.hasResults
                      ? 'bg-slate-50 hover:bg-rose-50 border-slate-200 hover:border-rose-300 text-slate-800'
                      : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900 font-bold'
                  }`}
                  title={`Searched ${kw.count} times. Click to filter logs.`}
                >
                  <span>{kw.keyword}</span>
                  <span className="text-[10px] opacity-70 font-mono">({kw.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Unmet Demand Highlight Box */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-900">
            <div className="flex items-center gap-1.5 font-black uppercase text-[10px] tracking-wider text-amber-950">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
              <span>Unmet Product Demand Insight</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-snug">
              Parents frequently queried terms with 0 catalog matches like <em>"electric scooter for 2 year old"</em> and <em>"dinosaur drone"</em>. Stocking these or approving maker vendors can capture lost revenue.
            </p>
          </div>
        </div>
      </div>

      {/* Main Search Logs Filtering and Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-600" />
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                45-Day Search Logs Chronology
              </h3>
              <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono font-bold">
                {filteredLogs.length} Records
              </span>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Date range filter */}
              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFilterDateRange('45d')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${filterDateRange === '45d' ? 'bg-rose-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  45 Days
                </button>
                <button
                  type="button"
                  onClick={() => setFilterDateRange('30d')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${filterDateRange === '30d' ? 'bg-rose-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  30 Days
                </button>
                <button
                  type="button"
                  onClick={() => setFilterDateRange('7d')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${filterDateRange === '7d' ? 'bg-rose-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setFilterDateRange('today')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${filterDateRange === 'today' ? 'bg-rose-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  24h
                </button>
              </div>

              {/* Outcome filter */}
              <select
                value={filterOutcome}
                onChange={(e) => setFilterOutcome(e.target.value as any)}
                className="bg-white border border-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 outline-hidden text-slate-700"
              >
                <option value="all">All Outcomes</option>
                <option value="has_results">Has Products Matched</option>
                <option value="zero_results">Zero Results Only</option>
              </select>

              {/* Source filter */}
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value as any)}
                className="bg-white border border-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 outline-hidden text-slate-700"
              >
                <option value="all">All Search Sources</option>
                <option value="radar_search">Radar Search (#input-radar-search-query)</option>
                <option value="store_catalog">Vernunt Store Catalog</option>
              </select>
            </div>
          </div>

          {/* Search Query Filter Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Search by query term, parent name, city or matched product..."
              className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-hidden focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table View */}
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Search className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No matching search logs found</h4>
            <p className="text-xs text-slate-500">Try broadening your date filter or clearing your search keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Search Query</th>
                  <th className="py-3 px-4">Date &amp; Recency</th>
                  <th className="py-3 px-4">User / Parent</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Products Matched</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredLogs.map((log) => {
                  const hasProducts = log.matchedCount > 0;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      {/* Query */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-xs">
                            "{log.query}"
                          </span>
                          {!hasProducts && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              0 Results
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {log.id.slice(0, 14)}...</span>
                      </td>

                      {/* Date & Recency */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800">
                          {new Date(log.searchedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{getRelativeTime(log.searchedAt)}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-[10px]">{new Date(log.searchedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{log.userName}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-600 font-bold">{log.userRole}</span>
                          <MapPin className="w-2.5 h-2.5 text-slate-400" />
                          <span>{log.userCity}</span>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          log.source === 'radar_search'
                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                            : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}>
                          {log.source === 'radar_search' ? 'Radar Search' : 'Store Catalog'}
                        </span>
                      </td>

                      {/* Products Matched */}
                      <td className="py-3 px-4">
                        {hasProducts ? (
                          <div className="flex items-center gap-1.5 flex-wrap max-w-sm">
                            <span className="font-mono font-bold text-[11px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {log.matchedCount} Items
                            </span>
                            {log.matchedProducts.slice(0, 3).map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedProductInspect(p)}
                                className="flex items-center gap-1 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-[10px] px-1.5 py-0.5 rounded-md text-slate-700 hover:text-rose-700 transition cursor-pointer"
                                title={`View "${p.name}" (₹${p.price})`}
                              >
                                <img src={p.featuredImage} alt={p.name} className="w-3.5 h-3.5 rounded object-cover" />
                                <span className="max-w-[110px] truncate">{p.name}</span>
                              </button>
                            ))}
                            {log.matchedCount > 3 && (
                              <button
                                type="button"
                                onClick={() => setSelectedLogForModal(log)}
                                className="text-[10px] text-rose-700 hover:underline font-bold"
                              >
                                +{log.matchedCount - 3} more
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">No catalog match</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedLogForModal(log)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal for a single search log */}
      {selectedLogForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-rose-600" />
                <h3 className="font-black text-base text-slate-900">
                  Search Query Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLogForModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100">
                <span className="text-[10px] font-extrabold uppercase text-rose-900 tracking-wider block">Raw Search Term</span>
                <span className="text-base font-black text-slate-900 font-serif">"{selectedLogForModal.query}"</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Searcher</span>
                  <span className="font-bold text-slate-900">{selectedLogForModal.userName}</span>
                  <span className="text-[10px] text-slate-500 block">{selectedLogForModal.userRole} • {selectedLogForModal.userCity}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Timestamp</span>
                  <span className="font-bold text-slate-900">{new Date(selectedLogForModal.searchedAt).toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-slate-500 block">{getRelativeTime(selectedLogForModal.searchedAt)}</span>
                </div>
              </div>

              <div>
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Products Matched ({selectedLogForModal.matchedCount})</span>
                  <span className="text-slate-400 font-normal">Source: {selectedLogForModal.source}</span>
                </h4>

                {selectedLogForModal.matchedCount === 0 ? (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-center">
                    No products matched this query. This represents an unmet product need.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedLogForModal.matchedProducts.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          setSelectedLogForModal(null);
                          setSelectedProductInspect(prod);
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 transition cursor-pointer"
                      >
                        <img src={prod.featuredImage} alt={prod.name} className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-bold text-rose-700 uppercase block truncate">{prod.category}</span>
                          <h5 className="font-bold text-slate-900 text-xs truncate">{prod.name}</h5>
                          <span className="text-slate-500 font-mono text-[11px]">₹{prod.price}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLogForModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Inspect Modal */}
      {selectedProductInspect && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[10px] font-black uppercase text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                {selectedProductInspect.category}
              </span>
              <button
                type="button"
                onClick={() => setSelectedProductInspect(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={selectedProductInspect.featuredImage}
                  alt={selectedProductInspect.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900 leading-snug">
                  {selectedProductInspect.name}
                </h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-black text-slate-900 font-mono">
                    ₹{selectedProductInspect.price.toLocaleString('en-IN')}
                  </span>
                  {selectedProductInspect.regularPrice && selectedProductInspect.regularPrice > selectedProductInspect.price && (
                    <span className="text-xs text-slate-400 line-through font-mono">
                      ₹{selectedProductInspect.regularPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-bold">Age Group</span>
                  <span className="font-bold text-slate-800">{selectedProductInspect.ageLabel || 'All Ages'}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-bold">Inventory Status</span>
                  <span className={`font-bold ${selectedProductInspect.inStock ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {selectedProductInspect.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedProductInspect(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
