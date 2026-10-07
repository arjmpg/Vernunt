import React, { useState, useEffect } from 'react';
import { Cookie, Shield, Check, X, Settings2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { CookiePreferences } from '../types.ts';

interface CookieConsentBannerProps {
  onOpenCookiePolicy?: () => void;
}

const STORAGE_KEY = 'vernunt_cookie_consent';

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onOpenCookiePolicy }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
    updatedAt: new Date().toISOString()
  });

  useEffect(() => {
    // Check if user has already made a cookie choice
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPreferences(JSON.parse(saved));
      } else {
        // Show banner after brief delay for smooth entrance
        const timer = setTimeout(() => setIsOpen(true), 1000);
        return () => clearTimeout(timer);
      }
    } catch {
      setIsOpen(true);
    }

    // Listen for custom event to re-open preferences from footer
    const handleReopen = () => {
      setIsOpen(true);
      setShowManageModal(true);
    };
    window.addEventListener('vernunt_open_cookie_preferences', handleReopen);
    return () => window.removeEventListener('vernunt_open_cookie_preferences', handleReopen);
  }, []);

  const saveConsent = (updated: CookiePreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setPreferences(updated);
      setIsOpen(false);
      setShowManageModal(false);

      // Inform server
      fetch('/api/privacy/cookie-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(() => {});

      window.dispatchEvent(new CustomEvent('vernunt_cookie_consent_updated', { detail: updated }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
      updatedAt: new Date().toISOString()
    });
  };

  const handleRejectNonEssential = () => {
    saveConsent({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
      updatedAt: new Date().toISOString()
    });
  };

  const handleSaveCustomPreferences = () => {
    saveConsent({
      ...preferences,
      essential: true,
      updatedAt: new Date().toISOString()
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Floating Bottom Cookie Consent Banner */}
      <div 
        id="vernunt-cookie-banner" 
        role="region" 
        aria-label="Cookie consent banner" 
        className="fixed bottom-3 sm:bottom-5 left-3 sm:left-6 right-3 sm:right-6 md:max-w-4xl md:mx-auto z-[9990] bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-4 sm:p-5 transition-all duration-300 animate-slide-up"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white font-serif">Privacy &amp; Cookie Consent</span>
                <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  DPDP Act 2023 Compliant
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                Vernunt uses essential cookies to authenticate accounts and keep child data secure. Optional cookies for preferences and anonymized analytics are disabled by default until you grant permission. We never sell child data or use cross-site tracking.
              </p>
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenCookiePolicy) onOpenCookiePolicy();
                    else window.dispatchEvent(new CustomEvent('vernunt_open_legal_policy', { detail: { tab: 'cookie' } }));
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Read our complete Cookie Policy</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-end">
            <button
              type="button"
              onClick={() => setShowManageModal(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Preferences</span>
            </button>
            <button
              type="button"
              onClick={handleRejectNonEssential}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              Reject Non-Essential
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black rounded-xl text-xs transition shadow-md cursor-pointer active:scale-95"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>

      {/* Granular Manage Preferences Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9995] flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="bg-white text-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base font-serif">Manage Cookie Preferences</h3>
                  <p className="text-[11px] text-slate-300">Choose which categories of cookies you consent to</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
              {/* Category 1: Essential */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>1. Strictly Necessary &amp; Security Cookies</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">Always Active</span>
                  </span>
                  <input type="checkbox" checked disabled className="w-4 h-4 rounded text-emerald-600 cursor-not-allowed" />
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Required for core platform functionality, user authentication, session integrity, cryptographic CSRF mitigation, and child profile protection. Cannot be deactivated.
                </p>
              </div>

              {/* Category 2: Functional */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">
                    2. Functional &amp; Localization Cookies
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Stores your preferred Kannada / Hindi multilingual voice agent settings, neighbourhood radius filters, and offline cart state.
                </p>
              </div>

              {/* Category 3: Analytics */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">
                    3. Performance &amp; Privacy-Preserving Analytics
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Helps us diagnose slow pages and broken links. Data is strictly aggregated and stripped of IP addresses, child identifiers, and parent identities.
                </p>
              </div>

              {/* Category 4: Marketing */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">
                    4. Marketing &amp; Event Announcements
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Enables notifications regarding family workshops, kids sports classes, and parenting festivals in your Bengaluru locality. Disabled by default.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Reject All Optional
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCustomPreferences}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Save My Preferences
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition cursor-pointer"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsentBanner;
