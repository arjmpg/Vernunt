import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Search, 
  Lock, 
  Layers, 
  RefreshCw, 
  Sliders, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  ArrowRight, 
  ArrowLeft, 
  Database, 
  BarChart3,
  Flame,
  FileCode2,
  Copy,
  Check,
  PackageCheck
} from 'lucide-react';
import { 
  CommerceApiClient, 
  ProductsCursorResponse, 
  SearchStatsResponse, 
  InventoryTelemetryResponse 
} from '../../services/commerceApiClient.ts';
import { STORE_CATEGORIES } from '../../data/storeProducts.ts';

export const AdminCommerceEngineDesk: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'pagination' | 'search_index' | 'taxonomy' | 'inventory_locks'>('pagination');

  // --------------------------------------------------------------------------
  // 1. CURSOR PAGINATION STATE
  // --------------------------------------------------------------------------
  const [pageSize, setPageSize] = useState<number>(6);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest'>('relevance');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [paginatedData, setPaginatedData] = useState<ProductsCursorResponse | null>(null);
  const [isPaginationLoading, setIsPaginationLoading] = useState<boolean>(false);
  const [cursorCopied, setCursorCopied] = useState<boolean>(false);

  const fetchPage = async (cursor?: string, direction: 'next' | 'prev' = 'next') => {
    setIsPaginationLoading(true);
    try {
      const res = await CommerceApiClient.fetchProducts({
        cursor,
        limit: pageSize,
        sortBy,
        direction,
        category: categoryFilter,
        inStockOnly
      });
      setPaginatedData(res);
      setCurrentCursor(cursor);
    } catch (err) {
      console.error('Pagination fetch error:', err);
    } finally {
      setIsPaginationLoading(false);
    }
  };

  useEffect(() => {
    setCursorHistory([]);
    setCurrentCursor(undefined);
    fetchPage(undefined, 'next');
  }, [pageSize, sortBy, categoryFilter, inStockOnly]);

  const handleNextPage = () => {
    if (!paginatedData?.pagination.nextCursor) return;
    if (currentCursor) {
      setCursorHistory(prev => [...prev, currentCursor]);
    } else {
      setCursorHistory(['_INITIAL_']);
    }
    fetchPage(paginatedData.pagination.nextCursor, 'next');
  };

  const handlePrevPage = () => {
    if (cursorHistory.length === 0) return;
    const prevHistory = [...cursorHistory];
    const prevCursorToUse = prevHistory.pop();
    setCursorHistory(prevHistory);
    fetchPage(prevCursorToUse === '_INITIAL_' ? undefined : prevCursorToUse, 'prev');
  };

  // --------------------------------------------------------------------------
  // 2. SEARCH INDEX STATE
  // --------------------------------------------------------------------------
  const [searchStats, setSearchStats] = useState<SearchStatsResponse['stats'] | null>(null);
  const [testSearchQuery, setTestSearchQuery] = useState<string>('ragi');
  const [searchResults, setSearchResults] = useState<ProductsCursorResponse | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<Array<{ term: string; count: number }>>([]);

  const loadSearchStats = async () => {
    const stats = await CommerceApiClient.getSearchStats();
    if (stats) setSearchStats(stats);
  };

  const executeTestSearch = async (q: string) => {
    setIsSearchLoading(true);
    try {
      const res = await CommerceApiClient.searchProducts(q, { limit: 8 });
      setSearchResults(res);
      const sugg = await CommerceApiClient.getSuggestions(q);
      setSuggestions(sugg);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearchLoading(false);
    }
  };

  useEffect(() => {
    loadSearchStats();
    executeTestSearch(testSearchQuery);
  }, []);

  // --------------------------------------------------------------------------
  // 3. TAXONOMY & NORMALIZATION STATE
  // --------------------------------------------------------------------------
  const [catalogNormalizing, setCatalogNormalizing] = useState<boolean>(false);
  const [normalizationResult, setNormalizationResult] = useState<{ totalProducts: number; repairedOrNormalizedCount: number; message: string } | null>(null);

  const handleRunNormalization = async () => {
    setCatalogNormalizing(true);
    try {
      const result = await CommerceApiClient.normalizeCatalog();
      setNormalizationResult(result);
      loadSearchStats();
      fetchPage(undefined, 'next');
    } catch (err) {
      console.error('Normalization error:', err);
    } finally {
      setCatalogNormalizing(false);
    }
  };

  // --------------------------------------------------------------------------
  // 4. INVENTORY LOCKS TELEMETRY STATE
  // --------------------------------------------------------------------------
  const [telemetryData, setTelemetryData] = useState<InventoryTelemetryResponse['telemetry'] | null>(null);
  const [isSimulatingLock, setIsSimulatingLock] = useState<boolean>(false);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  const loadLockTelemetry = async () => {
    const telem = await CommerceApiClient.getInventoryLockTelemetry();
    if (telem) setTelemetryData(telem);
  };

  useEffect(() => {
    loadLockTelemetry();
    const interval = setInterval(loadLockTelemetry, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateLock = async (productId = 'prod-food-01', qty = 2) => {
    setIsSimulatingLock(true);
    setSimulationStatus(null);
    try {
      const lockRes = await CommerceApiClient.acquireLock({
        items: [{ productId, quantity: qty }],
        userEmail: 'simulated.parent@vernunt.com',
        ttlSeconds: 600 // 10 minutes
      });

      if (lockRes.success) {
        setSimulationStatus(`✅ Lock acquired successfully! Token: ${lockRes.lockToken?.slice(0, 16)}... (Reserved ${qty} units for 10m)`);
      } else {
        setSimulationStatus(`❌ Oversell Prevented: ${lockRes.error}`);
      }
      loadLockTelemetry();
      fetchPage(currentCursor, 'next');
    } catch (err: any) {
      setSimulationStatus(`Error: ${err.message}`);
    } finally {
      setIsSimulatingLock(false);
    }
  };

  const handleReleaseLock = async (token: string) => {
    await CommerceApiClient.releaseLock(token, 'Admin manual release');
    loadLockTelemetry();
    fetchPage(currentCursor, 'next');
  };

  const handleCommitLock = async (token: string) => {
    await CommerceApiClient.commitLock(token, `ORD-SIM-${Math.floor(1000 + Math.random() * 9000)}`);
    loadLockTelemetry();
    fetchPage(currentCursor, 'next');
  };

  return (
    <div className="space-y-6">
      {/* HEADER WITH ZERO-COST BADGE */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-2xl p-5 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-rose-900/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Zap className="w-5 h-5 fill-slate-950 text-slate-950" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Vernunt Core Commerce Engine</span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                  100% Zero-Cost Local Infra
                </span>
              </h1>
              <p className="text-xs text-rose-200/80">
                Server-side cursor pagination, sub-millisecond in-memory inverted search index, variant normalization & distributed inventory locks.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Refresh */}
        <button
          type="button"
          onClick={() => {
            fetchPage(currentCursor, 'next');
            loadSearchStats();
            loadLockTelemetry();
          }}
          className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition cursor-pointer border border-white/10 backdrop-blur-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Engine State</span>
        </button>
      </div>

      {/* TOP NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('pagination')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeSubTab === 'pagination'
              ? 'bg-rose-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. Cursor-Based Pagination</span>
          {paginatedData && (
            <span className="bg-rose-800 text-rose-100 text-[10px] px-1.5 py-0.5 rounded-md">
              {paginatedData.pagination.totalMatches}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('search_index')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeSubTab === 'search_index'
              ? 'bg-rose-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>2. Inverted Search Index</span>
          {searchStats && (
            <span className="bg-emerald-500/20 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-md font-mono">
              {searchStats.avgLatencyMs}ms
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('taxonomy')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeSubTab === 'taxonomy'
              ? 'bg-rose-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>3. Variant & Taxonomy Normalizer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('inventory_locks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeSubTab === 'inventory_locks'
              ? 'bg-rose-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>4. Distributed Inventory Locks</span>
          {telemetryData && telemetryData.activeLocksCount > 0 && (
            <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
              {telemetryData.activeLocksCount} Active
            </span>
          )}
        </button>
      </div>

      {/* ===================================================================== */}
      {/* SUBTAB 1: CURSOR-BASED SERVER-SIDE PAGINATION LAB                     */}
      {/* ===================================================================== */}
      {activeSubTab === 'pagination' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Page Size */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span className="text-slate-400">Limit:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value={4}>4 per page</option>
                  <option value={6}>6 per page</option>
                  <option value={12}>12 per page</option>
                  <option value={24}>24 per page</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span className="text-slate-400">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="relevance">Relevance / Featured</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Top Customer Rated</option>
                  <option value="newest">Newest Catalog Additions</option>
                </select>
              </div>

              {/* Category */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span className="text-slate-400">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none max-w-[170px]"
                >
                  <option value="all">All Categories</option>
                  {STORE_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* In Stock Only */}
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span>In-Stock Only</span>
              </label>
            </div>

            {/* Latency & Match counter */}
            {paginatedData && (
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-slate-100 text-slate-600 font-mono font-bold px-2 py-0.5 rounded-md">
                  Matches: {paginatedData.pagination.totalMatches}
                </span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                  {paginatedData.executionTimeMs}ms
                </span>
              </div>
            )}
          </div>

          {/* Cursor Token Inspector Banner */}
          <div className="bg-slate-900 rounded-2xl p-4 text-slate-300 font-mono text-xs border border-slate-800 shadow-md space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <FileCode2 className="w-4 h-4" />
                Active Cursor State (Base64url Token)
              </span>
              <span className="text-[11px] text-slate-500">
                Immune to offset degradation & row-shift anomalies
              </span>
            </div>
            <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 shrink-0">Current Cursor:</span>
              <span className="text-emerald-400 truncate flex-1 font-bold">
                {currentCursor || '(Initial Page: Root Offset 0)'}
              </span>
              {currentCursor && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentCursor);
                    setCursorCopied(true);
                    setTimeout(() => setCursorCopied(false), 2000);
                  }}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                  title="Copy cursor token"
                >
                  {cursorCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="bg-slate-800/60 p-2 rounded-lg">
                <span className="text-slate-500 block">Next Cursor:</span>
                <span className="text-slate-200 truncate block font-bold">
                  {paginatedData?.pagination.nextCursor ? `${paginatedData.pagination.nextCursor.slice(0, 14)}...` : 'None (End)'}
                </span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-lg">
                <span className="text-slate-500 block">Prev Cursor:</span>
                <span className="text-slate-200 truncate block font-bold">
                  {paginatedData?.pagination.prevCursor ? `${paginatedData.pagination.prevCursor.slice(0, 14)}...` : 'None (Start)'}
                </span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-lg">
                <span className="text-slate-500 block">Has More:</span>
                <span className={`font-bold ${paginatedData?.pagination.hasMore ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {paginatedData?.pagination.hasMore ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-lg">
                <span className="text-slate-500 block">History Depth:</span>
                <span className="text-amber-300 font-bold">
                  {cursorHistory.length} Pages Traversed
                </span>
              </div>
            </div>
          </div>

          {/* Paginated Product Grid */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">
                Fetched Items for Page ({paginatedData?.items.length || 0} returned)
              </h3>
              {isPaginationLoading && (
                <span className="text-xs text-rose-700 font-bold animate-pulse flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Querying server...
                </span>
              )}
            </div>

            {paginatedData?.items && paginatedData.items.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {paginatedData.items.map((prod) => (
                  <div 
                    key={prod.id} 
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-rose-200 transition space-y-2.5"
                  >
                    <div className="flex items-start gap-3">
                      <img 
                        src={prod.featuredImage} 
                        alt={prod.name} 
                        className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0" 
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-mono font-bold text-rose-800 uppercase block truncate">
                          {prod.sku} • {prod.category}
                        </span>
                        <h4 className="text-xs font-black text-slate-900 truncate" title={prod.name}>
                          {prod.name}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-black text-slate-900">
                            ₹{prod.price}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            (prod.effectiveStock || prod.stockQuantity) > 5 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : (prod.effectiveStock || prod.stockQuantity) > 0
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            Available: {prod.effectiveStock !== undefined ? prod.effectiveStock : prod.stockQuantity}
                          </span>
                        </div>
                      </div>
                    </div>

                    {prod.currentlyLockedUnits && prod.currentlyLockedUnits > 0 ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-amber-700 shrink-0" />
                        <span>{prod.currentlyLockedUnits} units currently held in customer checkouts</span>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                No products found matching filters.
              </div>
            )}

            {/* Pagination Action Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={cursorHistory.length === 0 || isPaginationLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  cursorHistory.length > 0 && !isPaginationLoading
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Page</span>
              </button>

              <span className="text-xs text-slate-500 font-medium">
                Page Step: <strong className="text-slate-900 font-bold">{cursorHistory.length + 1}</strong>
              </span>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={!paginatedData?.pagination.hasMore || isPaginationLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  paginatedData?.pagination.hasMore && !isPaginationLoading
                    ? 'bg-rose-900 text-white hover:bg-rose-800 shadow-sm'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Next Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 2: DEDICATED HIGH-PERFORMANCE SEARCH INDEX                     */}
      {/* ===================================================================== */}
      {activeSubTab === 'search_index' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Index Telemetry Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold block">Indexed Catalog</span>
              <span className="text-2xl font-black text-slate-900 block mt-1">
                {searchStats?.indexedDocuments || 0}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                Zero external DB calls
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold block">Vocabulary Terms</span>
              <span className="text-2xl font-black text-rose-900 block mt-1">
                {searchStats?.uniqueTermsCount || 0}
              </span>
              <span className="text-[10px] text-slate-400 font-bold mt-1 block">
                Prefix Trie: {searchStats?.prefixTrieNodes || 0}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold block">Average Latency</span>
              <span className="text-2xl font-black text-emerald-600 block mt-1 font-mono">
                {searchStats?.avgLatencyMs || 0.3}ms
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-bold mt-1 block">
                P99: {searchStats?.p99LatencyMs || 0.8}ms
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold block">Scoring Engine</span>
              <span className="text-lg font-black text-slate-800 block mt-1 truncate">
                BM25 + Soundex
              </span>
              <span className="text-[10px] text-amber-600 font-bold mt-1 block">
                100% Free / Self-Hosted
              </span>
            </div>
          </div>

          {/* Interactive Search Index Tester */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Search className="w-4 h-4 text-rose-800" />
                  <span>Real-Time Inverted Index Benchmarker</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Test sub-millisecond ranking, BM25 term weighting, and prefix autocomplete.
                </p>
              </div>

              <button
                type="button"
                onClick={loadSearchStats}
                className="text-xs text-rose-900 font-bold hover:underline cursor-pointer"
              >
                Refresh Stats
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={testSearchQuery}
                  onChange={(e) => {
                    setTestSearchQuery(e.target.value);
                    executeTestSearch(e.target.value);
                  }}
                  placeholder="Type term e.g. ragi, lego, montessori, robot, VRN-FOOD-001..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>

              <button
                type="button"
                onClick={() => executeTestSearch(testSearchQuery)}
                className="px-4 py-2.5 bg-rose-900 hover:bg-rose-800 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
              >
                Benchmark Query
              </button>
            </div>

            {/* Prefix Autocomplete Suggestions */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-bold">Typeahead Suggestions:</span>
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTestSearchQuery(s.term);
                      executeTestSearch(s.term);
                    }}
                    className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-950 rounded-md text-[11px] font-bold transition cursor-pointer border border-rose-100"
                  >
                    {s.term} <span className="text-rose-500 font-mono">({s.count})</span>
                  </button>
                ))}
              </div>
            )}

            {/* Benchmark Output Card */}
            {searchResults && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono">
                  <span className="text-slate-600 font-bold">
                    Returned {searchResults.items.length} of {searchResults.pagination.totalMatches} matches
                  </span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                    Query Execution Time: {searchResults.executionTimeMs}ms
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {searchResults.items.map((item) => (
                    <div key={item.id} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-rose-800">{item.sku}</span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-700">
                          ₹{item.price}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 truncate">{item.name}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{item.shortDescription}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 3: VARIANT & TAXONOMY NORMALIZATION                            */}
      {/* ===================================================================== */}
      {activeSubTab === 'taxonomy' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Action Callout */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-rose-800" />
                <span>Deterministic Variant Matrix & Taxonomy Normalizer</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Audits raw catalog products, aligns synonyms to canonical attribute names (Size, Color, Pack Size, Flavor), builds explicit SKU variations, and repairs invalid taxonomy classifications.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunNormalization}
              disabled={catalogNormalizing}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shadow-xs ${
                catalogNormalizing
                  ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                  : 'bg-rose-900 hover:bg-rose-800 text-white'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${catalogNormalizing ? 'animate-spin' : ''}`} />
              <span>{catalogNormalizing ? 'Auditing & Normalizing...' : 'Audit & Normalize Catalog'}</span>
            </button>
          </div>

          {normalizationResult && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-4 h-4" /> Catalog Audit Completed Successfully
              </span>
              <p className="font-medium text-emerald-700">
                {normalizationResult.message} ({normalizationResult.totalProducts} verified products)
              </p>
            </div>
          )}

          {/* Canonical Taxonomy Mapping Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Canonical Category & Subcategory Schema
              </h4>
              <div className="space-y-2 divide-y divide-slate-100 text-xs">
                {STORE_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <div key={cat.id} className="pt-2 first:pt-0">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{cat.icon} {cat.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{cat.slug}</span>
                    </div>
                    {cat.subcategories && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {cat.subcategories.map((sub, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Canonical Attribute & Variant Rules
              </h4>
              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="pt-2 first:pt-0">
                  <span className="font-bold text-slate-900 block">Attribute Synonym Resolution</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Inputs like <code className="text-rose-700 bg-rose-50 px-1 rounded">sz</code>, <code className="text-rose-700 bg-rose-50 px-1 rounded">dimension</code> resolve to canonical <strong className="text-slate-800">Size</strong>. <code className="text-rose-700 bg-rose-50 px-1 rounded">flavour</code> resolves to <strong className="text-slate-800">Flavor</strong>.
                  </p>
                </div>
                <div className="pt-2">
                  <span className="font-bold text-slate-900 block">Deterministic SKU Generation</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Variants receive deterministic formatted SKUs: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[10px]">PARENT-SKU-SZ-STD-CLR-BLU</code>.
                  </p>
                </div>
                <div className="pt-2">
                  <span className="font-bold text-slate-900 block">Parent-Child Stock Inheritance</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Parent stock is automatically synchronized with the exact aggregate sum of active variation inventories.
                  </p>
                </div>
                <div className="pt-2">
                  <span className="font-bold text-slate-900 block">Age Band Validation</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Strict normalization across canonical age groups: 0-12m, 1-3y, 3-6y, 6-10y, 10-14y, and all-ages.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 4: DISTRIBUTED INVENTORY LOCKING (PREVENTING OVERSELLING)      */}
      {/* ===================================================================== */}
      {activeSubTab === 'inventory_locks' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Telemetry KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold block">Active Locks</span>
              <span className="text-2xl font-black text-rose-900 block mt-1">
                {telemetryData?.activeLocksCount || 0}
              </span>
              <span className="text-[10px] text-slate-500 font-bold mt-1 block">
                Held in checkouts
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold block">Total Units Reserved</span>
              <span className="text-2xl font-black text-amber-600 block mt-1">
                {telemetryData?.totalUnitsHeld || 0}
              </span>
              <span className="text-[10px] text-slate-400 font-bold mt-1 block">
                Stock deduction pool
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold block">Oversell Prevented</span>
              <span className="text-2xl font-black text-emerald-600 block mt-1 flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5 text-emerald-600" />
                {telemetryData?.totalOversellPrevented || 0}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold mt-1 block">
                Zero double-orders
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold block">Auto-Sweeper</span>
              <span className="text-lg font-black text-slate-800 block mt-1 flex items-center gap-1">
                <Flame className="w-4 h-4 text-rose-500" />
                Active (10s)
              </span>
              <span className="text-[10px] text-slate-400 font-bold mt-1 block">
                Reclaims dead carts
              </span>
            </div>
          </div>

          {/* Concurrent Lock Simulation Suite */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-800" />
                  <span>Interactive High-Concurrency Lock Simulator</span>
                </h3>
                <p className="text-xs text-amber-800/80">
                  Simulate concurrent user cart holds to observe atomic check-and-decrement and automatic TTL expiration.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateLock('prod-food-01', 2)}
                  disabled={isSimulatingLock}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
                >
                  Hold 2 Units of Ragi Mix
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateLock('prod-stem-01', 1)}
                  disabled={isSimulatingLock}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
                >
                  Hold 1 Unit of Solar Robot
                </button>
              </div>
            </div>

            {simulationStatus && (
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-300 text-xs font-mono font-bold text-amber-950">
                {simulationStatus}
              </div>
            )}
          </div>

          {/* Active Locks Table */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-800" />
                <span>Active Inventory Leases ({telemetryData?.recentLocks.filter(l => l.status === 'active').length || 0})</span>
              </h3>
              <button
                type="button"
                onClick={loadLockTelemetry}
                className="text-xs text-rose-900 font-bold hover:underline cursor-pointer"
              >
                Refresh Leases
              </button>
            </div>

            {telemetryData?.recentLocks && telemetryData.recentLocks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Lock Token</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Session</th>
                      <th className="py-2.5 px-3">Quantity</th>
                      <th className="py-2.5 px-3">TTL Remaining</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {telemetryData.recentLocks.map((lock) => (
                      <tr key={lock.lockToken} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          {lock.lockToken.slice(0, 18)}...
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            lock.status === 'active'
                              ? 'bg-amber-100 text-amber-800'
                              : lock.status === 'committed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : lock.status === 'expired'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {lock.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {lock.sessionId}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {lock.totalQty} units ({lock.itemCount} items)
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                          {lock.status === 'active' ? `${lock.secondsRemaining}s` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1.5">
                          {lock.status === 'active' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleCommitLock(lock.lockToken)}
                                className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[10px] font-black transition cursor-pointer"
                                title="Simulate payment confirmation and decrement stock"
                              >
                                Commit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReleaseLock(lock.lockToken)}
                                className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[10px] font-black transition cursor-pointer"
                                title="Release held stock immediately"
                              >
                                Release
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                No inventory locks currently registered.
              </div>
            )}
          </div>

          {/* Audit Trail */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Recent Inventory Lock Audit Logs
            </h3>
            <div className="space-y-1.5 max-h-56 overflow-y-auto font-mono text-[11px] divide-y divide-slate-100">
              {telemetryData?.recentAuditLogs && telemetryData.recentAuditLogs.length > 0 ? (
                telemetryData.recentAuditLogs.map((log) => (
                  <div key={log.id} className="pt-1.5 first:pt-0 flex items-start gap-2 text-slate-600">
                    <span className="text-slate-400 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded font-bold shrink-0 ${
                      log.action === 'OVERSELL_PREVENTED'
                        ? 'bg-rose-100 text-rose-800'
                        : log.action === 'LOCK_ACQUIRED'
                        ? 'bg-amber-100 text-amber-800'
                        : log.action === 'LOCK_COMMITTED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {log.action}
                    </span>
                    <span className="truncate flex-1 text-slate-700">
                      {log.details}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 py-3 text-center">No audit logs recorded yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
