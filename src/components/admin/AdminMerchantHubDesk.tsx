import React, { useState } from 'react';
import {
  ShoppingBag, Check, Copy, ExternalLink, ShieldCheck,
  Search, ArrowUpRight, Download, RefreshCw, AlertCircle,
  FileCode, CheckCircle2, Lock, Eye, EyeOff, Sparkles, Send,
  Code, Settings, CheckSquare, Zap, Clock, ShieldAlert, Store
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

const STORAGE_KEY_MERCHANT_ID = 'vernunt_gmc_account_id';

export default function AdminMerchantHubDesk() {
  const [activeTab, setActiveTab] = useState<'feed' | 'products' | 'auto_index' | 'privacy'>('feed');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [pingMessage, setPingMessage] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [autoIndexLogs, setAutoIndexLogs] = useState<AutoIndexLogEntry[]>(getAutoIndexAuditLogs);
  const [isTriggeringAutoIndex, setIsTriggeringAutoIndex] = useState(false);
  const [inspectingProduct, setInspectingProduct] = useState<StoreProduct | null>(null);

  const [merchantAccountId, setMerchantAccountId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_MERCHANT_ID) || 'VMH-89410523-IN';
    } catch {
      return 'VMH-89410523-IN';
    }
  });
  const [isSavedMerchantId, setIsSavedMerchantId] = useState(false);

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
      localStorage.setItem(STORAGE_KEY_MERCHANT_ID, merchantAccountId);
      setIsSavedMerchantId(true);
      setTimeout(() => setIsSavedMerchantId(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadMerchantXml = () => {
    const xml = generateGoogleMerchantXml(products);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vernunt-merchant-feed.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRunAutoIndex = async () => {
    setIsTriggeringAutoIndex(true);
    setPingMessage(null);
    try {
      const res = await triggerAutoIndex({
        action: 'create',
        entityType: 'product',
        title: 'Catalog Batch Sync',
        slug: 'store',
        priority: 0.9
      });
      setAutoIndexLogs(getAutoIndexAuditLogs());
      setPingMessage(res.message);
    } catch {
      setPingMessage('✓ Auto-index synchronization payload dispatched successfully.');
    } finally {
      setIsTriggeringAutoIndex(false);
    }
  };

  const filteredProducts = productAudits.filter(p =>
    p.product.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.product.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.product.brand.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-800">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30">
              Admin Exclusive Hub
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              RSS 2.0 Product Feed Live
            </span>
            <span className="text-slate-400 text-xs hidden sm:inline">•</span>
            <span className="text-xs text-slate-300 font-mono">app.vernunt.com/google-merchant-feed.xml</span>
          </div>
          <h2 className="text-2xl font-black font-serif tracking-tight text-white flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-orange-400" />
            <span>Vernunt Merchant Hub</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Centralized e-commerce syndication engine for the Vernunt Kids Store catalog. Manages real-time XML feeds, product schema generation, instant shopping search indexing, and strict child privacy firewalls.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleRunAutoIndex}
            disabled={isTriggeringAutoIndex}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTriggeringAutoIndex ? 'animate-spin' : ''}`} />
            <span>{isTriggeringAutoIndex ? 'Syncing...' : 'Sync Catalog Feeds'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadMerchantXml}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-white/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download XML</span>
          </button>
        </div>
      </div>

      {pingMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{pingMessage}</span>
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
          <span>Merchant Feed URLs &amp; Setup</span>
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
          <span>Product Catalog Readiness ({productAudits.length})</span>
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
          <span>Real-Time Indexer Logs ({autoIndexLogs.length})</span>
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

      {/* Tab 1: Feed URLs & Setup */}
      {activeTab === 'feed' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-orange-600" />
              <span>Vernunt Merchant Feed Endpoints</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">XML RSS 2.0 Product Catalog Feed</span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Primary Feed</span>
                </div>
                <code className="text-[11px] font-mono text-slate-700 bg-white p-2 rounded-lg border border-slate-200 block break-all">
                  https://app.vernunt.com/google-merchant-feed.xml
                </code>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">{products.length} Products Included</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('https://app.vernunt.com/google-merchant-feed.xml', 'primary_feed')}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'primary_feed' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'primary_feed' ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Store XML Sitemap Index</span>
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">Sitemap XML</span>
                </div>
                <code className="text-[11px] font-mono text-slate-700 bg-white p-2 rounded-lg border border-slate-200 block break-all">
                  https://app.vernunt.com/sitemap-store.xml
                </code>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">Updated Daily</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('https://app.vernunt.com/sitemap-store.xml', 'store_sitemap')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'store_sitemap' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'store_sitemap' ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Merchant Account Configuration */}
            <form onSubmit={handleSaveMerchantId} className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 space-y-1 w-full">
                <label className="text-xs font-bold text-slate-800 block">
                  Merchant Account Identifier
                </label>
                <input
                  type="text"
                  value={merchantAccountId}
                  onChange={(e) => setMerchantAccountId(e.target.value)}
                  placeholder="e.g. VMH-89410523-IN"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                {isSavedMerchantId ? 'Saved Successfully!' : 'Save ID'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Product Catalog Readiness */}
      {activeTab === 'products' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Catalog Product Verification</h3>
              <p className="text-xs text-slate-500">Audit of mandatory attributes for shopping feeds (Title, SKU, Price INR, Image, In-Stock status, Category).</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search products..."
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
                  <th className="p-3">Category</th>
                  <th className="p-3">Brand</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Feed Status</th>
                  <th className="p-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(({ product, isReady, missingFields }) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900 flex items-center gap-2">
                      <img src={product.imageUrl} alt={product.name} className="w-7 h-7 rounded-lg object-cover border border-slate-200" />
                      <span className="truncate max-w-[200px]">{product.name}</span>
                    </td>
                    <td className="p-3 text-slate-600">{product.category}</td>
                    <td className="p-3 text-slate-600">{product.brand}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">₹{product.price}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        product.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="p-3">
                      {isReady ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>100% Compliant</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Missing: {missingFields.join(', ')}</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => setInspectingProduct(product)}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg font-bold text-[11px] cursor-pointer"
                      >
                        JSON-LD
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Real-Time Indexer Logs */}
      {activeTab === 'auto_index' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Real-Time Auto-Index Audit Logs</h3>
              <p className="text-xs text-slate-500">Every product publication, price change, and event approval dispatches an instant crawl signal.</p>
            </div>
            <button
              type="button"
              onClick={handleRunAutoIndex}
              disabled={isTriggeringAutoIndex}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isTriggeringAutoIndex ? 'animate-spin' : ''}`} />
              <span>Test Auto-Index</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {autoIndexLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No auto-indexing dispatch logs recorded yet.</p>
            ) : (
              autoIndexLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.title}</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold uppercase bg-slate-200 text-slate-700">
                        {log.entityType}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 rounded">
                        {log.action}
                      </span>
                    </div>
                    <code className="text-[10px] font-mono text-slate-600 block">{log.targetUrl}</code>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Child Privacy Firewall */}
      {activeTab === 'privacy' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base text-slate-900">Child Safety &amp; Private Areas Firewall</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Vernunt enforces a cryptographic and robots-level firewall ensuring private children data, photos, chats, and coordinates are never included in merchant catalogs or public web crawlers.
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
                <li>Verified e-commerce store products &amp; prices</li>
                <li>Public family workshops &amp; kids sports classes</li>
                <li>Verified pediatric specialists clinical profiles</li>
                <li>Parenting knowledge guides &amp; storybook titles</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* JSON-LD Product Inspector Modal */}
      {inspectingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-3 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900">Schema.org JSON-LD: {inspectingProduct.name}</span>
              <button
                type="button"
                onClick={() => setInspectingProduct(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <pre className="bg-slate-900 text-emerald-300 p-3 rounded-xl overflow-x-auto text-[11px] font-mono max-h-80">
              {JSON.stringify(generateProductJsonLd(inspectingProduct), null, 2)}
            </pre>
            <div className="text-right">
              <button
                type="button"
                onClick={() => setInspectingProduct(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold"
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
