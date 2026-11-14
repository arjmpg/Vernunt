import React, { useState, useEffect } from 'react';
import { 
  wordpressService, 
  WordPressConfigData, 
  WordPressConnectionTestResult, 
  WordPressPublishAllResult,
  BitnamiSetupGuideData
} from '../../services/wordpressService.ts';
import { 
  X, 
  Globe, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  UploadCloud, 
  Download, 
  ExternalLink, 
  Server, 
  Key, 
  User, 
  Layers, 
  Sparkles,
  HelpCircle,
  Eye,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface WordPressHeadlessManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncCompleted?: () => void;
}

export const WordPressHeadlessManagerModal: React.FC<WordPressHeadlessManagerModalProps> = ({
  isOpen,
  onClose,
  onSyncCompleted
}) => {
  const [config, setConfig] = useState<WordPressConfigData>({
    endpoint: '',
    username: '',
    hasAppPassword: false,
    syncEnabled: false,
    lastTestedAt: null,
    siteTitle: null,
    isBitnami: false,
  });

  const [inputEndpoint, setInputEndpoint] = useState('');
  const [inputUsername, setInputUsername] = useState('');
  const [inputAppPassword, setInputAppPassword] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(false);

  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<WordPressConnectionTestResult | null>(null);

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<WordPressPublishAllResult | null>(null);

  const [activeTab, setActiveTab] = useState<'config' | 'publish' | 'guide'>('config');
  const [guideData, setGuideData] = useState<BitnamiSetupGuideData | null>(null);
  const [expandedOption, setExpandedOption] = useState<number | null>(0);

  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // Load config on modal open
  useEffect(() => {
    if (!isOpen) return;

    const fetchConfig = async () => {
      setIsLoadingConfig(true);
      const res = await wordpressService.getConfig();
      if (res.success && res.config) {
        setConfig(res.config);
        setInputEndpoint(res.config.endpoint || '');
        setInputUsername(res.config.username || '');
        setInputAppPassword(res.config.hasAppPassword ? '••••••••' : '');
        setSyncEnabled(Boolean(res.config.syncEnabled));
      }
      setIsLoadingConfig(false);
    };

    const fetchGuide = async () => {
      const res = await wordpressService.getSetupGuide();
      if (res.success && res.guide) {
        setGuideData(res.guide);
      }
    };

    fetchConfig();
    fetchGuide();
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Save
  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    const res = await wordpressService.saveConfig({
      endpoint: inputEndpoint,
      username: inputUsername,
      appPassword: inputAppPassword,
      syncEnabled,
    });
    setIsSaving(false);

    if (res.success) {
      if (res.config) setConfig(res.config);
      showToast('WordPress configuration saved successfully!');
      if (onSyncCompleted) onSyncCompleted();
    } else {
      showToast(res.error || 'Failed to save configuration', 'error');
    }
  };

  // Handle Test Connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const res = await wordpressService.testConnection({
      endpoint: inputEndpoint,
      username: inputUsername,
      appPassword: inputAppPassword,
    });

    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      showToast(res.message || 'Connected to WordPress successfully!');
      // Refresh config to reflect updated metadata
      const refreshed = await wordpressService.getConfig();
      if (refreshed.success && refreshed.config) {
        setConfig(refreshed.config);
      }
    } else {
      showToast(res.error || 'Connection test failed', 'error');
    }
  };

  // Handle Publish All Guides
  const handlePublishAll = async () => {
    if (!inputEndpoint.trim()) {
      showToast('Please specify a WordPress endpoint URL first', 'error');
      return;
    }
    if (!inputUsername.trim() || (!inputAppPassword.trim() && !config.hasAppPassword)) {
      showToast('WordPress username and Application Password are required to publish', 'error');
      return;
    }

    const confirmPublish = window.confirm(
      'Publish all 1,000+ Vernunt child care & development guides to your WordPress blog now? Existing guides with matching slugs will be safely updated.'
    );
    if (!confirmPublish) return;

    setIsPublishing(true);
    setPublishResult(null);

    const res = await wordpressService.publishAllGuides({
      endpoint: inputEndpoint,
      username: inputUsername,
      appPassword: inputAppPassword,
    });

    setIsPublishing(false);
    setPublishResult(res);

    if (res.success) {
      showToast(res.message || 'Successfully synchronized guides with WordPress!');
      if (onSyncCompleted) onSyncCompleted();
    } else {
      showToast(res.error || 'Publish failed', 'error');
    }
  };

  // Handle Download WXR XML
  const handleDownloadWxr = () => {
    wordpressService.downloadWxrXml();
    showToast('Downloaded WordPress WXR XML import file.');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xl shrink-0">
              🌐
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black font-serif tracking-tight">
                  Headless WordPress Blog &amp; Guide Publisher
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  100% White-Labeled
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Manage all parenting guides in WordPress while frontend parents experience pure native Vernunt UI.
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-100 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`pb-3 pt-1 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'config'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Connection &amp; API Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('publish')}
            className={`pb-3 pt-1 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'publish'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Publish Guides to WordPress</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-mono font-bold">
              1-Click
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`pb-3 pt-1 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'guide'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Bitnami &amp; Free Setup Guide</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* Toast Notification */}
          {feedbackToast && (
            <div className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-fadeIn ${
              feedbackToast.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {feedbackToast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedbackToast.message}</span>
            </div>
          )}

          {/* TAB 1: CONNECTION & API SETTINGS */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              
              {/* White-Label Assurance Card */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 text-sm shadow-xs mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-slate-900">
                    Front-End Privacy &amp; Zero WordPress Branding Guarantee
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    WordPress operates strictly as your headless backend database. Frontend visitors and parents only see Vernunt&apos;s custom typography, pediatrician tags, reading time meters, and interactive steps. There are <strong>no WordPress logos, no wp- admin bars, and zero third-party branding</strong>.
                  </p>
                </div>
              </div>

              {/* Status Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Connection Status
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${config.endpoint ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    <strong className="text-xs text-slate-900 font-mono">
                      {config.endpoint ? 'Configured' : 'Not Connected'}
                    </strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Target Site
                  </span>
                  <strong className="text-xs text-slate-900 truncate block mt-1" title={config.siteTitle || config.endpoint || 'None'}>
                    {config.siteTitle || (config.endpoint ? new URL(config.endpoint).hostname : 'None')}
                  </strong>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Publishing Auth
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {config.hasAppPassword ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> App Password Ready
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-700">
                        Read-Only (No Password)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Settings Form */}
              <form onSubmit={handleSaveConfig} className="space-y-4">
                
                {/* Endpoint */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>WordPress Site URL / Endpoint:</span>
                    <span className="text-[11px] font-normal text-slate-400">Bitnami GCE IP, Custom Domain, or WordPress.com</span>
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={inputEndpoint}
                      onChange={(e) => setInputEndpoint(e.target.value)}
                      placeholder="e.g. https://my-blog.com or http://34.120.45.67 (Bitnami GCE)"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-indigo-500 focus:bg-white shadow-2xs"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Vernunt connects to <code className="text-indigo-600 font-mono">/wp-json/wp/v2/posts</code> via standard WordPress REST API.
                  </p>
                </div>

                {/* Username & App Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      WordPress Username / Admin Email:
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={inputUsername}
                        onChange={(e) => setInputUsername(e.target.value)}
                        placeholder="e.g. admin or user"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-indigo-500 focus:bg-white shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Application Password:</span>
                      <span className="text-[10px] text-indigo-600 font-medium">From WP Users &gt; Profile</span>
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        value={inputAppPassword}
                        onChange={(e) => setInputAppPassword(e.target.value)}
                        placeholder="e.g. abcd efgh ijkl mnop"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-indigo-500 focus:bg-white shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic Sync Toggle */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      Enable Live Dynamic Guide Sync
                    </strong>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      When enabled, newly published guides on your WordPress blog are fetched dynamically and rendered seamlessly on the Vernunt frontend.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={syncEnabled}
                      onChange={(e) => setSyncEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Form Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting || !inputEndpoint.trim()}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testing Connection...' : 'Test WordPress Connection'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
                  </button>
                </div>
              </form>

              {/* Test Result Card */}
              {testResult && (
                <div className={`p-4 rounded-2xl border text-xs space-y-2 animate-fadeIn ${
                  testResult.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <strong className="text-sm">
                      {testResult.success ? 'Connection Successful!' : 'Connection Failed'}
                    </strong>
                  </div>

                  <p className="text-xs leading-relaxed">
                    {testResult.message || testResult.error}
                  </p>

                  {testResult.success && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono border-t border-emerald-200/60 mt-2">
                      <div>Site: <strong>{testResult.siteName}</strong></div>
                      <div>Latency: <strong>{testResult.latencyMs}ms</strong></div>
                      <div>Total Posts: <strong>{testResult.totalPosts}</strong></div>
                      <div>Bitnami: <strong>{testResult.isBitnami ? 'Yes' : 'Standard'}</strong></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 1-CLICK PUBLISH ALL GUIDES */}
          {activeTab === 'publish' && (
            <div className="space-y-6">
              
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/80 rounded-2xl p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xl shadow-xs">
                    🚀
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      1-Click Batch Publisher: Vernunt Guides to WordPress
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                      Automatically converts and publishes all 1,000+ encyclopedic child care guides, recipes, and sleep blueprints directly into your WordPress blog posts table via the WP REST API.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePublishAll}
                    disabled={isPublishing}
                    className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <UploadCloud className={`w-4 h-4 ${isPublishing ? 'animate-bounce' : ''}`} />
                    <span>{isPublishing ? 'Publishing Guides to WordPress...' : 'Publish All Guides to WordPress'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadWxr}
                    className="px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4 text-indigo-600" />
                    <span>Download WordPress WXR XML File (Instant Import)</span>
                  </button>
                </div>
              </div>

              {/* What gets published */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Guide Structure Converted to WordPress Posts</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                    <strong className="text-slate-900 block">🍎 Baby &amp; Child Nutrition</strong>
                    <p className="text-slate-500 text-[11px]">Brain-boosting foods, toddler superfoods, weaning recipes, and picky eating guides.</p>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                    <strong className="text-slate-900 block">🧠 Child Psychology &amp; SEL</strong>
                    <p className="text-slate-500 text-[11px]">Emotional regulation, tantrum decoding, bedtime anxiety, and positive discipline.</p>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                    <strong className="text-slate-900 block">🧸 Screen-Free Playdate Setups</strong>
                    <p className="text-slate-500 text-[11px]">Sensory play bins, apartment DIY cloud dough, and cooperative Montessori games.</p>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                    <strong className="text-slate-900 block">🩺 Pediatric Health &amp; Sleep</strong>
                    <p className="text-slate-500 text-[11px]">Pediatric sleep cycles, gentle weaning, speech checklists, and infant care.</p>
                  </div>
                </div>
              </div>

              {/* Publishing Results Summary */}
              {publishResult && (
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <strong className="text-xs text-slate-900 font-bold">
                        Sync Summary: {publishResult.publishedCount} Published, {publishResult.updatedCount} Updated
                      </strong>
                    </div>
                    {publishResult.failedCount > 0 && (
                      <span className="text-[11px] text-rose-600 font-bold">
                        {publishResult.failedCount} Failed
                      </span>
                    )}
                  </div>

                  {publishResult.results && publishResult.results.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-1 text-[11px] font-mono border-t border-slate-200 pt-2">
                      {publishResult.results.map((r, i) => (
                        <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                          <span className="truncate max-w-[70%] text-slate-700">{r.title}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'created' ? 'bg-emerald-100 text-emerald-800' :
                            r.status === 'updated' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BITNAMI & FREE WORDPRESS SETUP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 text-sm shadow-xs mt-0.5">
                  💡
                </div>
                <div className="space-y-1 text-xs text-amber-900">
                  <h4 className="font-bold">Understanding Bitnami &amp; WordPress for this App</h4>
                  <p className="leading-relaxed">
                    Bitnami WordPress is a complete pre-packaged virtual machine stack (Apache web server, PHP engine, MySQL database, and WordPress). In modern web applications, WordPress runs as a <strong>Headless CMS</strong> on a cloud VM or free host, while Vernunt acts as the high-speed, custom frontend.
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  3 Free Ways to Run WordPress as your CMS
                </h4>

                {guideData?.options?.map((opt, idx) => {
                  const isExpanded = expandedOption === idx;
                  return (
                    <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/60">
                      <button
                        type="button"
                        onClick={() => setExpandedOption(isExpanded ? null : idx)}
                        className="w-full p-4 text-left flex items-center justify-between gap-3 bg-white hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <strong className="text-xs text-slate-900 font-bold">{opt.name}</strong>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2 text-xs">
                          <ol className="list-decimal pl-5 space-y-1.5 text-slate-600 leading-relaxed">
                            {opt.steps.map((st, sIdx) => (
                              <li key={sIdx}>{st}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* How to generate Application Password */}
              <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/60 space-y-2">
                <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-600" />
                  <span>How to Generate a WordPress Application Password in 10 Seconds</span>
                </h4>
                <ol className="list-decimal pl-5 space-y-1 text-xs text-indigo-900 leading-relaxed">
                  <li>In your WordPress Admin, go to <strong>Users &gt; Profile</strong>.</li>
                  <li>Scroll down to the <strong>Application Passwords</strong> section.</li>
                  <li>Enter name: <code>Vernunt Headless App</code> and click <strong>Add New Application Password</strong>.</li>
                  <li>Copy the 24-character generated password and paste it into the Vernunt settings.</li>
                </ol>
              </div>

              {/* Download WXR XML alternative */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <strong className="text-xs font-bold text-slate-900 block">
                    Zero-Setup Alternative: Download WXR XML
                  </strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Don&apos;t want to set up an API password? Download our complete XML file and upload it in WordPress via <strong>Tools &gt; Import &gt; WordPress</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadWxr}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download XML</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Vernunt Headless Architecture (WP REST API &amp; React SPA)</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordPressHeadlessManagerModal;
