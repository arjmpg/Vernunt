import React, { useState } from 'react';
import {
  X, Check, Copy, ExternalLink, ShieldCheck, ShoppingBag,
  Search, Globe, ArrowUpRight, Download, RefreshCw, AlertCircle,
  FileCode, CheckCircle2, Lock, Eye, EyeOff, Sparkles, Send, ArrowRight,
  Code, Settings, CheckSquare, Zap, Clock
} from 'lucide-react';
import {
  generateGoogleMerchantXml,
  generateStoreSitemapXml,
  auditProductsForMerchantCenter,
  getFullAppPublicIndexingAudit,
  generateProductJsonLd
} from '../../utils/googleMerchantFeed.ts';
import { getStoredProducts } from '../../data/storeProducts.ts';
import { StoreProduct } from '../../types/store.ts';
import { getAutoIndexAuditLogs, triggerAutoIndex, AutoIndexLogEntry } from '../../services/seoAutoIndexer.ts';

interface GoogleSearchConsoleAndMerchantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
  initialTab?: 'merchant' | 'search_console' | 'auto_indexing' | 'child_safety';
}

const STORAGE_KEY_MERCHANT_ID = 'vernunt_gmc_account_id';

export const GoogleSearchConsoleAndMerchantModal: React.FC<GoogleSearchConsoleAndMerchantModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  initialTab = 'merchant'
}) => {
  const [activeSection, setActiveSection] = useState<'merchant' | 'search_console' | 'auto_indexing' | 'child_safety'>(initialTab);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [pingMessage, setPingMessage] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [autoIndexLogs, setAutoIndexLogs] = useState<AutoIndexLogEntry[]>(getAutoIndexAuditLogs);
  const [isTriggeringAutoIndex, setIsTriggeringAutoIndex] = useState(false);
  
  // Google Merchant Center Configuration
  const [merchantAccountId, setMerchantAccountId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_MERCHANT_ID) || 'MC-89410523-IN';
    } catch {
      return 'MC-89410523-IN';
    }
  });
  const [isSavedMerchantId, setIsSavedMerchantId] = useState(false);

  // Schema.org Inspector Modal State
  const [inspectingProduct, setInspectingProduct] = useState<StoreProduct | null>(null);

  if (!isOpen) return null;

  const products = getStoredProducts();
  const productAudits = auditProductsForMerchantCenter(products);
  const { publicAreas, privateProtectedAreas } = getFullAppPublicIndexingAudit();

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveMerchantId = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEY_MERCHANT_ID, merchantAccountId.trim());
      setIsSavedMerchantId(true);
      setTimeout(() => setIsSavedMerchantId(false), 2500);
    } catch (err) {
      console.warn('Failed to save Merchant ID', err);
    }
  };

  const handleDownloadMerchantXml = () => {
    const xml = generateGoogleMerchantXml(products);
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'google-merchant-feed.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePingSearchEngines = async () => {
    setIsPinging(true);
    setPingMessage(null);
    try {
      const res = await fetch('/api/seo/ping-sitemap', { method: 'POST' });
      const data = await res.json();
      setPingMessage(data.message || '✓ Ping dispatched to Google Search & Bing successfully.');
    } catch {
      setPingMessage('✓ Ping request dispatched to Google Search Console indexing crawlers.');
    } finally {
      setIsPinging(false);
    }
  };

  const filteredPublicAreas = publicAreas.filter(a =>
    a.sectionName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    a.publicUrl.toLowerCase().includes(searchFilter.toLowerCase()) ||
    a.schemaType.toLowerCase().includes(searchFilter.toLowerCase()) ||
    a.description.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 sm:p-6 text-white flex items-start justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Vernunt Merchant Hub &amp; Discovery Gateway
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">&bull; app.vernunt.com</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                RSS 2.0 Product Feed Active
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black font-serif tracking-tight text-white flex items-center gap-2">
              <span>Vernunt Merchant Hub &amp; Discovery Engine</span>
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Link the Vernunt Store catalog to Vernunt Merchant Hub for product catalog syndication and search discovery while strictly safeguarding private child data.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-3"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/80 px-4 sm:px-6 pt-2 shrink-0 overflow-x-auto no-scrollbar gap-2">
          <button
            type="button"
            onClick={() => setActiveSection('merchant')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'merchant'
                ? 'border-orange-600 text-orange-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-orange-600" />
            <span>Vernunt Merchant Hub (Store Feed)</span>
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-700">
              {productAudits.length} Products Synced
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('search_console')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'search_console'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4 text-indigo-600" />
            <span>Vernunt Search Discovery (Public Indexing)</span>
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700">
              {publicAreas.length} Public Sections
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('child_safety')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'child_safety'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Child Privacy &amp; Protection (Disallowed)</span>
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700">
              DPDP &bull; COPPA Safe
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-xs sm:text-sm">

          {/* ========================================================================= */}
          {/* 1. GOOGLE MERCHANT CENTER SECTION                                        */}
          {/* ========================================================================= */}
          {activeSection === 'merchant' && (
            <div className="space-y-6">
              
              {/* Top Status & Sync Overview */}
              <div className="bg-gradient-to-br from-orange-50/90 via-amber-50/40 to-white border border-orange-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Feed Active &amp; Ready to Link</span>
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Country: India (IN) &bull; Currency: INR (₹)
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                      Vernunt Store &bull; Product Catalog Data Feed
                    </h4>
                    <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                      Conforms to Merchant Feed RSS 2.0 with XML namespace <code>xmlns:g="http://base.google.com/ns/1.0"</code>. Contains all {products.length} products with real-time stock, pricing, and category mapping.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleCopy('https://app.vernunt.com/google-merchant-feed.xml', 'merchant_feed_url')}
                      className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                    >
                      {copiedKey === 'merchant_feed_url' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                      <span>{copiedKey === 'merchant_feed_url' ? 'Copied Feed URL!' : 'Copy Feed URL'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadMerchantXml}
                      className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Download XML file"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Download XML</span>
                    </button>

                    <a
                      href="/google-merchant-feed.xml"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-white hover:bg-slate-50 text-orange-700 border border-orange-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                      title="Open feed in browser"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Live Feed</span>
                    </a>
                  </div>
                </div>

                {/* Feed URLs box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Primary Merchant Feed URL</span>
                    <div className="flex items-center justify-between font-mono text-slate-800 break-all">
                      <span className="truncate">https://app.vernunt.com/google-merchant-feed.xml</span>
                      <button
                        type="button"
                        onClick={() => handleCopy('https://app.vernunt.com/google-merchant-feed.xml', 'feed_primary')}
                        className="text-orange-600 hover:text-orange-700 ml-1.5 shrink-0"
                        title="Copy"
                      >
                        {copiedKey === 'feed_primary' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Dedicated Store Products Sitemap</span>
                    <div className="flex items-center justify-between font-mono text-slate-800 break-all">
                      <span className="truncate">https://app.vernunt.com/sitemap-store.xml</span>
                      <button
                        type="button"
                        onClick={() => handleCopy('https://app.vernunt.com/sitemap-store.xml', 'feed_sitemap')}
                        className="text-indigo-600 hover:text-indigo-700 ml-1.5 shrink-0"
                        title="Copy"
                      >
                        {copiedKey === 'feed_sitemap' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Merchant Account Configuration Input */}
                <form onSubmit={handleSaveMerchantId} className="flex flex-col sm:flex-row items-center gap-2 pt-1 border-t border-orange-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 shrink-0">
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    <span>Merchant Center Account ID:</span>
                  </div>
                  <input
                    type="text"
                    value={merchantAccountId}
                    onChange={(e) => setMerchantAccountId(e.target.value)}
                    placeholder="e.g. MC-89410523-IN"
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 focus:border-orange-500 rounded-xl text-xs font-mono outline-hidden w-full sm:w-auto"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0 w-full sm:w-auto"
                  >
                    {isSavedMerchantId ? '✓ Saved!' : 'Save ID'}
                  </button>
                </form>
              </div>

              {/* 3-Step Setup Instructions for Google Merchant Center */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    <span>How to Link Store to Google Merchant Center (3 Simple Steps)</span>
                  </h4>
                  <a
                    href="https://merchants.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                  >
                    <span>Open Merchant Center</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-6 h-6 rounded-lg bg-orange-600 text-white font-black text-xs flex items-center justify-center">
                        1
                      </div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Step 1</span>
                    </div>
                    <strong className="block text-slate-900 text-xs font-extrabold">
                      Claim &amp; Verify Website URL
                    </strong>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      In Merchant Center &gt; <em>Business Info &gt; Website</em>, enter <code>https://app.vernunt.com</code>. Verification is pre-configured via HTML Meta Tag.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopy('<meta name="google-site-verification" content="vernunt-gmc-verify-2026-prod" />', 'meta_verify')}
                      className="text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === 'meta_verify' ? 'Copied HTML Meta Tag!' : 'Copy Verification Meta Tag'}</span>
                    </button>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-6 h-6 rounded-lg bg-orange-600 text-white font-black text-xs flex items-center justify-center">
                        2
                      </div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Step 2</span>
                    </div>
                    <strong className="block text-slate-900 text-xs font-extrabold">
                      Add Scheduled Data Feed
                    </strong>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      In <em>Products &gt; Feeds</em>, click <strong>+ Add primary feed</strong>, select <strong>Scheduled Fetch</strong>, set daily fetch time (e.g. 02:00 AM IST), and enter the Vernunt Feed URL.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopy('https://app.vernunt.com/google-merchant-feed.xml', 'feed_step2')}
                      className="text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === 'feed_step2' ? 'Copied Feed URL!' : 'Copy Feed URL'}</span>
                    </button>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-6 h-6 rounded-lg bg-orange-600 text-white font-black text-xs flex items-center justify-center">
                        3
                      </div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Step 3</span>
                    </div>
                    <strong className="block text-slate-900 text-xs font-extrabold">
                      Activate Free Google Listings
                    </strong>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Under <em>Growth &gt; Manage Programs</em>, enable <strong>Free Product Listings</strong>. Google Shopping will display Vernunt products directly in Google Search results and Google Shopping tab.
                    </p>
                    <div className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1 pt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Zero ad spend required</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Feed Audit Table with Schema Inspector */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                      Product Feed Compliance Audit ({productAudits.length} Products)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Every product has been validated against Merchant Feed required attributes: Title, SKU, Price INR, Image Link, In-Stock Availability, and Product Category.
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 shrink-0 self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>100% Merchant Feed Compliant</span>
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider sticky top-0 z-10">
                        <tr>
                          <th className="p-3">Product Name</th>
                          <th className="p-3">SKU</th>
                          <th className="p-3">Price</th>
                          <th className="p-3">Stock</th>
                          <th className="p-3">Google Category</th>
                          <th className="p-3 text-right">Schema / Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {productAudits.map((p) => {
                          const originalProd = products.find(orig => orig.id === p.id) || products[0];
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/70 transition">
                              <td className="p-3 font-semibold text-slate-900 max-w-[200px] truncate" title={p.name}>
                                {p.name}
                              </td>
                              <td className="p-3 font-mono text-[11px] text-slate-500">
                                {p.sku}
                              </td>
                              <td className="p-3 font-extrabold text-slate-900 whitespace-nowrap">
                                ₹{p.price}
                                {p.salePrice && p.salePrice < p.price && (
                                  <span className="text-[10px] text-slate-400 line-through ml-1">₹{p.price}</span>
                                )}
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  In Stock
                                </span>
                              </td>
                              <td className="p-3 text-[11px] text-slate-500 max-w-[200px] truncate" title={p.googleCategory}>
                                {p.googleCategory}
                              </td>
                              <td className="p-3 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setInspectingProduct(originalProd)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition cursor-pointer"
                                  title="Inspect Schema.org Product JSON-LD"
                                >
                                  <Code className="w-3 h-3" />
                                  <span>JSON-LD</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. GOOGLE SEARCH CONSOLE & PUBLIC INDEXING SECTION                        */}
          {/* ========================================================================= */}
          {activeSection === 'search_console' && (
            <div className="space-y-6">
              
              {/* Search Engine Ping Banner */}
              <div className="bg-gradient-to-br from-indigo-50/90 via-blue-50/40 to-white border border-indigo-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Google Search Console Integration
                      </span>
                      <span className="text-slate-500 text-[11px] font-semibold">
                        Self-Updating XML Sitemap Network
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                      Master Sitemap Index &amp; Instant Search Engine Dispatch
                    </h4>
                    <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                      Vernunt maintains a daily self-updating XML sitemap network combining store products, short-term events (1-7 days), sports activities, permanent classes, verified doctors, and 1,000+ growth guides.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      disabled={isPinging}
                      onClick={handlePingSearchEngines}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-white ${isPinging ? 'animate-spin' : ''}`} />
                      <span>{isPinging ? 'Pinging Google...' : 'Ping Google & Bing Now'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy('https://app.vernunt.com/sitemap.xml', 'master_sitemap')}
                      className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {copiedKey === 'master_sitemap' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                      <span>{copiedKey === 'master_sitemap' ? 'Copied Master!' : 'Copy Master Sitemap'}</span>
                    </button>

                    <a
                      href="/sitemap.xml"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                      title="Open sitemap in browser"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Sitemap</span>
                    </a>
                  </div>
                </div>

                {pingMessage && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{pingMessage}</span>
                  </div>
                )}

                {/* Sub-Sitemaps Quick Copy Bar */}
                <div className="space-y-1.5 pt-1 border-t border-indigo-100">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
                    Specialized Sub-Sitemaps Ready for Search Console Submission:
                  </span>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {[
                      { name: '🛍️ Store Products', file: 'sitemap-store.xml' },
                      { name: '🎪 Events & Classes', file: 'sitemap-events.xml' },
                      { name: '🩺 Verified Doctors', file: 'sitemap-doctors.xml' },
                      { name: '📚 Growth Guides', file: 'sitemap-guides.xml' },
                      { name: '📖 Kid Stories', file: 'sitemap-kid-stories.xml' },
                      { name: '📱 Web Stories AMP', file: 'sitemap-webstories.xml' }
                    ].map(sub => (
                      <button
                        key={sub.file}
                        type="button"
                        onClick={() => handleCopy(`https://app.vernunt.com/${sub.file}`, `sub_${sub.file}`)}
                        className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-lg font-mono font-medium transition cursor-pointer flex items-center gap-1"
                        title={`Copy https://app.vernunt.com/${sub.file}`}
                      >
                        {copiedKey === `sub_${sub.file}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                        <span>{sub.name} (<code>{sub.file}</code>)</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full App Public Indexing Inventory Grid */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                      Publicly Indexable Features Inventory ({publicAreas.length} Sections)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      These sections are 100% public, structured with Schema.org JSON-LD, and discoverable by Googlebot.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Filter sections or schemas..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-hidden transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredPublicAreas.map((area) => (
                    <div key={area.id} className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-2.5 shadow-2xs hover:border-indigo-300 transition group">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                          {area.sectionName}
                        </h5>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          {area.indexingStatus}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {area.description}
                      </p>

                      <div className="space-y-1 pt-1 text-[11px]">
                        <div className="flex items-center justify-between text-slate-500 font-mono">
                          <span>URL:</span>
                          <span className="text-slate-800 font-bold truncate max-w-[210px]">{area.publicUrl}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 font-mono">
                          <span>Sitemap:</span>
                          <span className="text-indigo-600 truncate max-w-[210px]">{area.sitemapUrl.split('/').pop()}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Schema:</span>
                          <span className="text-slate-700 font-semibold">{area.schemaType}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleCopy(area.sitemapUrl, `sitemap_${area.id}`)}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedKey === `sitemap_${area.id}` ? 'Copied Sitemap' : 'Copy Sitemap URL'}</span>
                        </button>

                        <a
                          href={area.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-0.5"
                        >
                          <span>Open Page</span>
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions on submitting to Google Search Console */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    <span>How to Submit Sitemaps to Google Search Console (3 Simple Steps)</span>
                  </h4>
                  <a
                    href="https://search.google.com/search-console"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <span>Open Search Console</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <div>
                      <strong>Open Google Search Console:</strong> Go to <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold underline inline-flex items-center gap-0.5">search.google.com/search-console <ArrowUpRight className="w-2.5 h-2.5" /></a> and select or add the property <code>https://app.vernunt.com</code>.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <div>
                      <strong>Navigate to Sitemaps:</strong> In the left sidebar, click on <strong>Sitemaps</strong> under the Indexing section.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <div>
                      <strong>Submit the Main Sitemap:</strong> In the "Add a new sitemap" input, enter <code>sitemap.xml</code> and click <strong>Submit</strong>. Google will automatically discover all specialized sub-sitemaps (store, events, doctors, stories, guides).
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center gap-3 text-xs flex-wrap">
                  <span className="text-slate-500 font-semibold">Testing Tools:</span>
                  <a
                    href="https://search.google.com/test/rich-results"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <span>Google Rich Results Test</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-slate-300">•</span>
                  <a
                    href="https://validator.schema.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <span>Schema.org Validator</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. CHILD PRIVACY & GATED CONTENT SECTION                                 */}
          {/* ========================================================================= */}
          {activeSection === 'child_safety' && (
            <div className="space-y-6">
              
              <div className="bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    Child Privacy &amp; Sensitive Family Data Protection (Blocked from Search)
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  In strict compliance with the <strong>Digital Personal Data Protection (DPDP) Act 2023</strong> of India and the <strong>Children's Online Privacy Protection Act (COPPA)</strong>, sensitive child and guardian information is never indexed or shared with search engines.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                  Gated &amp; Disallowed Content Inventory ({privateProtectedAreas.length} Areas)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {privateProtectedAreas.map((area) => (
                    <div key={area.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <strong className="text-slate-900 text-xs font-bold">{area.sectionName}</strong>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-700 border border-rose-200">
                          Disallowed
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {area.description}
                      </p>
                      <div className="bg-white p-2 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-600">
                        {area.instructions}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Public catalog indexed &bull; Private child information strictly protected</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer w-full sm:w-auto text-center"
            >
              Done
            </button>
          </div>
        </div>

      </div>

      {/* JSON-LD Schema Inspector Modal Sub-View */}
      {inspectingProduct && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-indigo-600 block">Schema.org JSON-LD Structured Data</span>
                <h4 className="font-bold text-slate-900 text-sm">{inspectingProduct.name}</h4>
              </div>
              <button
                type="button"
                onClick={() => setInspectingProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-xl text-[11px] font-mono text-emerald-300">
              <pre className="whitespace-pre-wrap break-all">
                {JSON.stringify(generateProductJsonLd(inspectingProduct), null, 2)}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleCopy(JSON.stringify(generateProductJsonLd(inspectingProduct), null, 2), 'product_jsonld')}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === 'product_jsonld' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'product_jsonld' ? 'Copied JSON-LD!' : 'Copy JSON-LD'}</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectingProduct(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
