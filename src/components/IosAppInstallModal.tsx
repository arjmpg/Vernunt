import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  Download,
  CheckCircle2,
  ShieldCheck,
  Apple,
  ExternalLink,
  X,
  FileCode,
  Share2,
  Copy,
  Check,
  QrCode,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Layers,
  Settings
} from 'lucide-react';
import { 
  getPublicMobileConfigUrl, 
  getPublicIosProjectUrl, 
  getWhatsAppShareIosLink, 
  triggerMobileConfigDownload, 
  triggerIosProjectDownload 
} from '../utils/iosAppDownloader';

interface IosAppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IosAppInstallModal: React.FC<IosAppInstallModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'safari' | 'developer'>('profile');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const publicMobileConfigUrl = typeof window !== 'undefined' ? getPublicMobileConfigUrl() : 'https://app.vernunt.com/vernunt.mobileconfig';
  const whatsappUrl = typeof window !== 'undefined' ? getWhatsAppShareIosLink() : '#';

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      // Generate QR Code for iPhone camera scan
      const targetUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.vernunt.com';
      QRCode.toDataURL(targetUrl, {
        width: 220,
        margin: 1,
        color: {
          dark: '#0f172a', // Slate 900
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadProfile = async () => {
    setIsDownloading(true);
    try {
      await triggerMobileConfigDownload();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.error('iOS Profile download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadProject = async () => {
    setIsDownloading(true);
    try {
      await triggerIosProjectDownload();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.error('iOS Project download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div 
      id="ios-app-popup-overlay"
      className="fixed inset-0 z-[999999] flex items-start sm:items-center justify-center bg-slate-950/80 backdrop-blur-md p-2.5 sm:p-4 overflow-y-auto animate-fade-in text-left"
      onClick={onClose}
    >
      <div 
        id="ios-app-popup-dialog"
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-zinc-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15 shrink-0 shadow-xs">
              <Apple className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-black text-amber-400 tracking-wider">
                  Apple iOS App Package
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                  iOS 15–18+ Ready
                </span>
              </div>
              <h3 className="font-bold text-base font-serif text-white">
                Install Vernunt on iPhone &amp; iPad
              </h3>
            </div>
          </div>
          <button 
            id="btn-close-ios-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 select-none">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-slate-700" />
            <span>1-Tap iOS Profile (.mobileconfig)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('safari')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'safari'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span>Safari Add to Home Screen</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('developer')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'developer'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xcode / IPA Source (.zip)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-xs">
          
          {/* TAB 1: 1-Tap iOS Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-850 to-zinc-900 text-white rounded-2xl border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-400/20 text-amber-300 rounded-lg text-xs font-mono font-bold">
                      🍏 iOS Configuration Profile
                    </span>
                    <span className="text-[10px] text-slate-400">Direct Home Screen App</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    No App Store Needed
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Apple natively supports <strong>Web Clip Profiles (.mobileconfig)</strong> to install web applications directly onto your iPhone or iPad home screen with a dedicated app icon and full-screen standalone mode.
                </p>

                <div className="pt-1 flex flex-col sm:flex-row gap-2">
                  <button
                    id="btn-download-ios-mobileconfig"
                    type="button"
                    onClick={handleDownloadProfile}
                    disabled={isDownloading}
                    className="flex-1 py-3 px-4 bg-white hover:bg-slate-100 text-slate-950 font-extrabold rounded-xl text-xs transition shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-900" />
                    <span>{isDownloading ? 'Preparing Profile...' : 'Download iOS App Profile (.mobileconfig)'}</span>
                  </button>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    title="Send installation link to iPhone via WhatsApp"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Send to iPhone</span>
                  </a>
                </div>

                {downloadSuccess && (
                  <div className="p-2.5 bg-emerald-900/60 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Profile downloaded! Now open <strong>Settings → Profile Downloaded</strong> to complete installation.</span>
                  </div>
                )}
              </div>

              {/* 3 Step Visual Guide */}
              <div className="space-y-3">
                <h4 className="font-serif font-black text-slate-900 text-sm flex items-center gap-2">
                  <span>How to Install on iPhone in 3 Quick Steps</span>
                  <span className="text-[10px] text-slate-400 font-sans font-normal">(Takes 15 seconds)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                    <div className="w-7 h-7 rounded-xl bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-xs">
                      1
                    </div>
                    <div className="font-bold text-slate-900 text-xs">Tap Download</div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Tap the button above. iOS Safari will ask: <em>"This website is trying to download a configuration profile. Do you want to allow this?"</em> Tap <strong>Allow</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                    <div className="w-7 h-7 rounded-xl bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-xs">
                      2
                    </div>
                    <div className="font-bold text-slate-900 text-xs">Open Settings</div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Go to your iPhone <strong>Settings</strong> app. Near the top under your Apple ID, tap <strong>"Profile Downloaded"</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-700 text-white font-mono font-bold flex items-center justify-center text-xs">
                      3
                    </div>
                    <div className="font-bold text-slate-900 text-xs">Tap Install</div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Tap <strong>Install</strong> in the top right, enter your device passcode, and confirm. The Vernunt App icon will immediately appear on your Home Screen!
                    </p>
                  </div>
                </div>
              </div>

              {/* QR Code for Desktop to iPhone Scanning */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                {qrCodeDataUrl ? (
                  <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200 shrink-0">
                    <img 
                      src={qrCodeDataUrl} 
                      alt="Scan on iPhone" 
                      className="w-28 h-28 object-contain" 
                    />
                  </div>
                ) : (
                  <div className="w-28 h-28 bg-slate-200 animate-pulse rounded-xl shrink-0" />
                )}
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="font-bold text-slate-900 text-xs flex items-center justify-center sm:justify-start gap-1.5">
                    <QrCode className="w-4 h-4 text-slate-700" />
                    <span>Viewing this on a laptop or desktop?</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Open your iPhone's standard <strong>Camera app</strong> and point it at this QR code. Tap the yellow banner that appears to open Vernunt directly on your iPhone.
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(publicMobileConfigUrl, 'profile-url')}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[10px] font-bold text-slate-700 transition flex items-center gap-1.5 cursor-pointer mx-auto sm:mx-0"
                    >
                      {copiedKey === 'profile-url' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'profile-url' ? 'Link Copied!' : 'Copy Direct iPhone Link'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Safari Add to Home Screen */}
          {activeTab === 'safari' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Apple className="w-4 h-4 text-blue-700" />
                    Instant Safari Web App (Recommended for iOS 16.4+)
                  </span>
                </div>
                <p className="text-[11.5px] text-blue-950 leading-relaxed">
                  Apple Safari includes built-in Progressive Web App (PWA) installation. When added to your home screen, Vernunt runs in full-screen native mode and supports <strong>Apple Web Push Notifications</strong> on your lock screen!
                </p>
              </div>

              {/* Visual Safari Instruction Cards */}
              <div className="space-y-3">
                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-start gap-3 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-slate-900 text-xs">Open in Safari Browser</h5>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Make sure you are browsing in <strong>Apple Safari</strong> on your iPhone or iPad (Apple restricts Home Screen installation in Chrome on iOS).
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-start gap-3 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-slate-900 text-xs">Tap the Share Icon</h5>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Tap the <strong>Share button</strong> at the bottom center of Safari (the square icon with an upward-pointing arrow).
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-start gap-3 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-slate-900 text-xs">Tap "Add to Home Screen"</h5>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Scroll down the Share menu and tap <strong>"Add to Home Screen"</strong> (indicated by a plus icon in a square).
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-start gap-3 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-slate-900 text-xs">Confirm &amp; Enjoy</h5>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Tap <strong>Add</strong> in the top right corner. The Vernunt icon is now installed on your iPhone's home screen alongside your native apps!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Developer Xcode & IPA Source */}
          {activeTab === 'developer' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900 text-xs">Complete iOS Xcode Project</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    SwiftUI + WKWebView
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  For Apple Developer account holders who want to compile their own signed <strong>.ipa binary</strong>, distribute via <strong>Apple TestFlight</strong>, or submit directly to the <strong>App Store</strong>, download the official iOS source bundle.
                </p>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 font-mono text-[10.5px] text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bundle ID:</span>
                    <span className="font-bold text-slate-900">com.vernunt.app</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Framework:</span>
                    <span className="font-bold text-slate-900">SwiftUI / WebKit / APNs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Build Target:</span>
                    <span className="font-bold text-slate-900">iOS 15.0+ (iPhone &amp; iPad)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Archive:</span>
                    <span className="font-bold text-slate-900">vernunt-ios-source.zip</span>
                  </div>
                </div>

                <div className="pt-1 flex gap-2">
                  <button
                    id="btn-download-ios-project"
                    type="button"
                    onClick={handleDownloadProject}
                    disabled={isDownloading}
                    className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isDownloading ? 'Preparing Archive...' : 'Download iOS Project (.zip)'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Why does iOS require Xcode or MobileConfig instead of a raw IPA download?</span>
                </div>
                <p className="leading-snug text-amber-800">
                  Unlike Android (which allows users to enable "Install Unknown Apps" for any APK), Apple's security model strictly prohibits downloading and running unsigned raw <code>.ipa</code> files from Safari without either:
                  (1) An Apple Developer enterprise certificate, 
                  (2) TestFlight invitation, or 
                  (3) An Apple WebClip MobileConfig profile (Tab 1).
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Encrypted UIDAI Aadhaar verification &amp; certified COPPA safe for children.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
