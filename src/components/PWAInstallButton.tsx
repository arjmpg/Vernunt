import React, { useState } from 'react';
import { Download, Smartphone, Share2, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (!isInstallable && !isIOS) return null;

  return (
    <>
      <div className="inline-flex items-center gap-2">
        {/* Chromium PWA Install Button */}
        {isInstallable && !isInstalled && (
          <button
            onClick={install}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
            title="Install Vernunt on Home Screen"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}

        {/* iOS Safari Install Button */}
        {isIOS && !isInstalled && (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
            title="Add to Home Screen on iPhone"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Install on iOS</span>
          </button>
        )}
      </div>

      {/* iOS Safari Guided Installation Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Smartphone className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Install Vernunt on iPhone / iPad</h3>
              <p className="text-xs text-slate-500">Run Vernunt like a native iOS app in two simple steps:</p>
            </div>

            <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">1</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>Tap the</span>
                  <span className="inline-flex items-center gap-1 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                    <Share2 className="w-3 h-3 text-blue-600" /> Share
                  </span>
                  <span>icon in Safari toolbar.</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">2</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>Scroll down and tap</span>
                  <span className="inline-flex items-center gap-1 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                    <PlusSquare className="w-3 h-3 text-slate-800" /> Add to Home Screen
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
