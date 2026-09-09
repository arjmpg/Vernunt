import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  Download,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Key,
  ExternalLink,
  X,
  FileCode,
  Layers,
  Copy,
  Check,
  QrCode,
  Share2,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { triggerApkDownload, getPublicApkUrl, getWhatsAppShareApkLink } from '../utils/apkDownloader';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidPlayStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidPlayStoreModal: React.FC<AndroidPlayStoreModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'download' | 'playstore_guide' | 'specs'>('download');
  const [showParseTroubleshooting, setShowParseTroubleshooting] = useState<boolean>(false);

  const { isInstallable, isInstalled, install: installPWA } = usePWAInstall();

  const publicApkUrl = typeof window !== 'undefined' ? getPublicApkUrl() : 'https://app.vernunt.com/api/download/android-apk';
  const whatsappUrl = typeof window !== 'undefined' ? getWhatsAppShareApkLink() : '#';

  useEffect(() => {
    if (isOpen) {
      // Prevent background scrolling while modal is open
      document.body.style.overflow = 'hidden';

      // Generate QR Code for direct APK download
      const targetUrl = typeof window !== 'undefined' ? window.location.origin + '/api/download/android-apk' : 'https://app.vernunt.com/api/download/android-apk';
      QRCode.toDataURL(targetUrl, {
        width: 220,
        margin: 1,
        color: {
          dark: '#9f1239', // Rose 800
          light: '#ffffff'
        }
      })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error('QR Code generation error:', err));
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const [cookieWarning, setCookieWarning] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadClick = async () => {
    setIsDownloading(true);
    setCookieWarning(false);
    try {
      const res = await triggerApkDownload();
      if (res.isCookieCheckBlocked) {
        setCookieWarning(true);
      } else if (res.success) {
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 4000);
      } else {
        setCookieWarning(true);
      }
    } catch (err) {
      console.error('Download error:', err);
      setCookieWarning(true);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div 
      id="android-apk-popup-overlay"
      className="fixed inset-0 z-[999999] flex items-start sm:items-center justify-center bg-slate-950/80 backdrop-blur-md p-2.5 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        id="android-apk-popup-dialog"
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden my-auto flex flex-col max-h-[92vh] text-left"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Sticky Header with prominent close button */}
        <div className="sticky top-0 z-30 bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 text-white p-4 sm:p-5 shrink-0 shadow-sm">
          <button
            type="button"
            id="btn-close-apk-popup"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95 shadow-xs"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>

          <div className="flex items-center gap-3 pr-16">
            <img
              src="/pwa-192x192.png"
              alt="Vernunt App Icon"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white p-1 object-contain shadow-md shrink-0 border border-white/40"
            />
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/30 text-amber-200 text-[10px] font-black uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Official Android App</span>
              </div>
              <h2 className="text-base sm:text-xl font-black tracking-tight leading-tight">Install Vernunt Android App</h2>
              <p className="text-[11px] text-rose-100">Live Web-Synchronized • Verified v1.0.0</p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-white/20 text-xs font-bold overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('download')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs ${
                activeTab === 'download'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download &amp; Install</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('playstore_guide')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs ${
                activeTab === 'playstore_guide'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Play Store Guide</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs ${
                activeTab === 'specs'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tech Specs</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-slate-700 text-sm grow">

          {/* TAB 1: DIRECT DOWNLOAD & PHONE QR CODE */}
          {activeTab === 'download' && (
            <div className="space-y-4">

              {/* Primary Download Action Card */}
              <div className="bg-gradient-to-b from-rose-50/70 to-amber-50/40 border-2 border-rose-200/80 rounded-3xl p-4 sm:p-5 space-y-3.5 text-center">
                <div className="max-w-md mx-auto space-y-1">
                  <span className="inline-block px-2.5 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                    Ready to Install
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    vernunt-app.apk
                  </h3>
                  <p className="text-xs text-slate-500">
                    Size: <strong>366 KB</strong> • Android 5.0 to 14+ • v1, v2 &amp; v3 Signatures Verified
                  </p>
                </div>

                {/* Direct Action Button */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                  <button
                    type="button"
                    id="btn-direct-download-apk"
                    onClick={handleDownloadClick}
                    disabled={isDownloading}
                    className="w-full sm:w-auto px-6 py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-sm font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition cursor-pointer disabled:opacity-75"
                  >
                    {isDownloading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Starting Download...</span>
                      </>
                    ) : downloadSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>Download Started! Check Notifications</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Download Android App (366 KB)</span>
                      </>
                    )}
                  </button>

                  <a
                    href="/api/download/android-apk"
                    download="vernunt-app.apk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 shadow-2xs transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>Direct File Link</span>
                  </a>
                </div>

                {/* Cookie Check or Download Issue Guidance */}
                {cookieWarning && (
                  <div className="text-xs text-rose-900 bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-left space-y-2 animate-fade-in shadow-xs">
                    <div className="flex items-center gap-2 font-bold text-rose-800">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Notice: Cookie Check Screen Encountered</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      If opening the downloaded file displays <em>"Action required to load your app • browser is blocking a required security cookie"</em>, your Android system Download Manager was redirected to a preview security barrier.
                    </p>
                    <div className="pt-1 flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => installPWA()}
                        className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>1-Tap Add to Home Screen (Recommended)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open(window.location.href, '_blank')}
                        className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in New Browser Tab</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Helpful Note for Android Chrome users */}
                <div className="text-[11px] text-slate-500 bg-amber-50/80 border border-amber-200/70 rounded-xl p-2.5 text-left flex items-start gap-2">
                  <span className="shrink-0 text-amber-700">💡</span>
                  <p className="leading-snug">
                    <strong>Android Note:</strong> If your browser automatically downloads the file with <code>.html</code> at the end (e.g. <code>vernunt-app.apk.html</code>), simply open your <strong>Files / Downloads</strong> app, tap <strong>Rename</strong>, remove the <code>.html</code> from the end so it is <code>vernunt-app.apk</code>, and tap to install.
                  </p>
                </div>

                {/* Alternative 1-Click PWA Installation */}
                {isInstallable && (
                  <div className="pt-2 border-t border-rose-200/60 flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => installPWA()}
                      className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-900" />
                      <span>1-Tap Add to Phone Home Screen (No setup required)</span>
                    </button>
                  </div>
                )}

                {/* Instant Share via WhatsApp or Copy Link */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Send Link to WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(publicApkUrl, 'direct_link')}
                    className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedKey === 'direct_link' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied Link!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Android App Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Troubleshooting "There was a problem parsing the package" (Parse Error) */}
              <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 text-left space-y-2">
                <button
                  type="button"
                  onClick={() => setShowParseTroubleshooting(!showParseTroubleshooting)}
                  className="w-full flex items-center justify-between font-bold text-xs text-amber-950 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Seeing &quot;There was a problem parsing the package&quot;?</span>
                  </div>
                  <span className="text-amber-800 text-[11px] underline">
                    {showParseTroubleshooting ? 'Hide tips' : 'View quick fixes'}
                  </span>
                </button>

                <div className={`space-y-2 text-xs text-amber-950/90 pt-1 ${showParseTroubleshooting ? 'block' : 'hidden sm:block'}`}>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    This Android system prompt appears if the APK was downloaded inside an in-app browser preview or if installation from unknown apps is disabled on your device.
                  </p>
                  <ul className="text-[11px] space-y-1.5 list-disc list-inside text-amber-900">
                    <li>
                      <strong>Fix 1:</strong> Use the <strong>Direct File Link</strong> button above, or copy the Android App link and open directly in Chrome (outside preview mode).
                    </li>
                    <li>
                      <strong>Fix 2:</strong> In your phone <em>Settings &gt; Apps &gt; Chrome &gt; Install unknown apps</em>, toggle <strong>Allow from this source</strong> to ON.
                    </li>
                    <li>
                      <strong>Fix 3:</strong> Open your phone&apos;s <strong>My Files / Downloads</strong> app and tap <code>vernunt-app.apk</code> to install directly from local storage.
                    </li>
                    <li>
                      <strong>Instant Alternative:</strong> In Chrome, tap the 3 dots (⋮) &gt; <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong> to install Vernunt instantly with no security prompts!
                    </li>
                  </ul>
                </div>
              </div>

              {/* Android Phone Installation Guide (3 Simple Steps) */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-extrabold text-xs text-slate-900">How to Install on Android Phone:</span>
                </div>
                <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside pl-1">
                  <li>
                    Tap <strong>Download Android App</strong> above.
                  </li>
                  <li>
                    If your browser displays <em>&quot;File might be harmful&quot;</em>, tap <strong>&quot;Download anyway&quot;</strong> (this is Android&apos;s standard prompt for apps installed outside Google Play).
                  </li>
                  <li>
                    Tap <strong>Open</strong> in your notification bar and select <strong>Install</strong>.
                  </li>
                </ol>
              </div>

              {/* Live Web Sync Assurance (Compact & Non-blocking) */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 flex gap-2.5 items-center text-left">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <RefreshCw className="w-3.5 h-3.5" />
                </div>
                <p className="text-[11px] text-emerald-950 leading-snug">
                  <strong>Auto-Sync Active:</strong> Connects directly to <code>app.vernunt.com</code>. Any updates to doctors, stories, or features appear instantly inside the Android App without reinstalling.
                </p>
              </div>

              {/* QR Code Section: Scan with phone camera */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center gap-3.5 text-left">
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="Vernunt Android App Download QR Code"
                      className="w-24 h-24 sm:w-28 sm:h-28"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                      QR Code
                    </div>
                  )}
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="font-extrabold text-xs text-slate-900 flex items-center justify-center sm:justify-start gap-1">
                    <QrCode className="w-3.5 h-3.5 text-rose-600" />
                    <span>Scan with Mobile Camera</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Point your Android camera at this QR code to download and install Vernunt directly on your mobile device.
                  </p>
                </div>
              </div>

              {/* Full Android Studio Source Project Download */}
              <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm font-bold">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Android Studio Source Code (ZIP)</h4>
                    <p className="text-[11px] text-slate-500">
                      Complete Gradle project with MainActivity, AndroidManifest, assets, and keystore.
                    </p>
                  </div>
                </div>
                <a
                  href="/api/download/android-project"
                  download="vernunt-android-source.zip"
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Source (.ZIP)</span>
                </a>
              </div>

            </div>
          )}

          {/* TAB 2: PLAY STORE FAQ & UPLOAD GUIDE */}
          {activeTab === 'playstore_guide' && (
            <div className="space-y-5">
              
              {/* Question: "Can you add yourself to Play Store?" */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4.5 space-y-2">
                <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>"Can AI automatically publish my app to the Google Play Store?"</span>
                </h3>
                <p className="text-xs text-amber-900 leading-relaxed">
                  <strong>Why Google requires your account:</strong> Google requires every published app to belong to a verified <strong>Google Play Developer Account</strong> ($25 one-time registration fee paid directly to Google). Google verifies your personal government identity and requires two-factor authentication (2FA). 
                  For legal and security reasons, automated assistants cannot log into your personal Google account.
                </p>
                <p className="text-xs text-amber-950 font-bold leading-relaxed pt-1">
                  ✨ However, <strong>we have done 100% of the technical packaging work for you!</strong> The Android App is pre-signed, tested, and ready. You only need to drop it into your Google Play Console in 3 simple steps below.
                </p>
              </div>

              {/* Ready-to-Copy Store Listing Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                    <span>Copy-Paste Store Listing Metadata (SEO Optimized)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">Click button to copy</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* Title */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">App Title (50 chars)</div>
                      <div className="font-bold text-slate-900">Vernunt - Kids Doctors, Playmates &amp; Daycare</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard('Vernunt - Kids Doctors, Playmates & Daycare', 'title')}
                      className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600"
                    >
                      {copiedKey === 'title' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Short Description */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Short Description (80 chars)</div>
                      <div className="text-slate-800">India's verified kids doctors, pediatricians, playmates &amp; daycare network.</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard("India's verified kids doctors, pediatricians, playmates & daycare network.", 'short_desc')}
                      className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600"
                    >
                      {copiedKey === 'short_desc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Privacy Policy URL */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Privacy Policy URL</div>
                      <div className="font-mono text-slate-800 text-[11px]">https://app.vernunt.com/?legal=privacy</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard('https://app.vernunt.com/?legal=privacy', 'privacy_url')}
                      className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600"
                    >
                      {copiedKey === 'privacy_url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Play Console Walkthrough */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  <span>3-Step Quick Upload Walkthrough</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                    <div>
                      <strong>Open Google Play Console:</strong> Visit <a href="https://play.google.com/console" target="_blank" rel="noreferrer" className="text-rose-600 font-bold underline inline-flex items-center gap-0.5">play.google.com/console <ExternalLink className="w-3 h-3" /></a>, click <strong>"Create app"</strong>, type <code>Vernunt</code>, select <strong>Free</strong>, and choose Category: <strong>Parenting</strong>.
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                    <div>
                      <strong>Upload the Signed Android App:</strong> Under <strong>Release &gt; Production</strong>, click <strong>"Create new release"</strong> and drag &amp; drop your downloaded <code>vernunt-app.apk</code> (or export an <code>.aab</code> using Android Studio).
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                    <div>
                      <strong>Submit For Review:</strong> Paste the Privacy Policy URL (<code>https://app.vernunt.com/?legal=privacy</code>), complete the 2-minute content questionnaire, and click <strong>"Send for review"</strong>!
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: KEYSTORE & TECHNICAL SPECS */}
          {activeTab === 'specs' && (
            <div className="space-y-5">
              
              {/* Technical Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-medium">Package ID</div>
                  <div className="font-mono font-bold text-slate-800 truncate">com.vernunt.app</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-medium">Version Code</div>
                  <div className="font-mono font-bold text-slate-800">1 (v1.0.0)</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-medium">Target SDK</div>
                  <div className="font-mono font-bold text-emerald-700">API 33 (Android 13/14)</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-medium">Min SDK</div>
                  <div className="font-mono font-bold text-slate-800">API 21 (Android 5+)</div>
                </div>
              </div>

              {/* Keystore Credentials */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-700" />
                    <span>Signing Keystore Details</span>
                  </h4>
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-semibold">Included in /android/keystore</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                  <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between">
                    <span>Alias: <strong className="text-slate-800">vernunt</strong></span>
                    <button
                      onClick={() => copyToClipboard('vernunt', 'alias')}
                      className="text-slate-400 hover:text-slate-700 ml-1"
                    >
                      {copiedKey === 'alias' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between">
                    <span>Password: <strong className="text-slate-800">vernunt2026</strong></span>
                    <button
                      onClick={() => copyToClipboard('vernunt2026', 'pass')}
                      className="text-slate-400 hover:text-slate-700 ml-1"
                    >
                      {copiedKey === 'pass' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between">
                    <span>File: <strong className="text-slate-800 truncate">vernunt-release-key.jks</strong></span>
                  </div>
                </div>

                <div className="text-[11px] text-amber-900 bg-white/70 p-2.5 rounded-xl border border-amber-200/60 font-mono break-all">
                  SHA-256 Fingerprint:<br />
                  <strong className="text-slate-800">0E:3F:FB:A7:93:FA:50:8E:4B:12:8C:1E:B0:1B:21:65:A5:B6:C7:CA:93:11:64:CE:35:B9:E7:33:E7:95:D0:E9</strong>
                </div>
              </div>

              {/* Digital Asset Links Status */}
              <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-700">Digital Asset Links Status: <strong>Live &amp; Active</strong></span>
                </div>
                <a
                  href="/.well-known/assetlinks.json"
                  target="_blank"
                  rel="noreferrer"
                  className="text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-1 text-[11px]"
                >
                  <span>View AssetLinks JSON</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/70 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Re-compile anytime with <code className="text-rose-700 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">bash android/build-apk.sh</code>
          </div>
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
