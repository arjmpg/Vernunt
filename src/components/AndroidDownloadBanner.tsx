import React, { useState } from 'react';
import { Smartphone, Download, QrCode, X, Apple, CheckCircle2 } from 'lucide-react';
import { triggerApkDownload } from '../utils/apkDownloader.ts';

interface AndroidDownloadBannerProps {
  onOpenModal: () => void;
  onOpenIosModal?: () => void;
}

export const AndroidDownloadBanner: React.FC<AndroidDownloadBannerProps> = ({ 
  onOpenModal, 
  onOpenIosModal 
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('vernunt_apk_banner_closed') === 'true';
    }
    return false;
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('vernunt_apk_banner_closed', 'true');
    }
  };

  const handleAndroidClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      const result = await triggerApkDownload();
      if (result.isCookieCheckBlocked || !result.success) {
        // If cookie barrier was detected, open the modal with instructions & 1-tap install
        onOpenModal();
      }
    } catch {
      onOpenModal();
    } finally {
      setTimeout(() => setIsDownloading(false), 2000);
    }
  };

  if (isDismissed) {
    return null;
  }

  return (
    <aside aria-label="Mobile Apps Announcement" className="bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 text-white px-3 sm:px-4 py-2 text-xs relative z-40 shadow-sm border-b border-rose-800/30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        
        {/* Banner Left Info */}
        <div 
          onClick={onOpenModal}
          className="flex items-center gap-2 sm:gap-2.5 text-center sm:text-left cursor-pointer hover:opacity-95 transition"
          role="button"
          tabIndex={0}
          title="Open Vernunt Mobile Apps Download"
        >
          <div className="flex -space-x-1.5 shrink-0">
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center border border-white/20">
              <Smartphone className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="w-6 h-6 rounded-lg bg-black/30 flex items-center justify-center border border-white/20">
              <Apple className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div className="leading-tight">
            <span className="font-extrabold tracking-tight">Vernunt Mobile Apps (Android &amp; iOS) Ready!</span>
            <span className="hidden lg:inline text-rose-100 ml-1.5 font-normal">
              Direct Android App download + 1-Tap iOS Profile installer. Live web synchronized!
            </span>
          </div>
        </div>

        {/* Banner Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-center">
          <button
            type="button"
            id="btn-top-banner-apk"
            onClick={handleAndroidClick}
            disabled={isDownloading}
            className="px-2.5 sm:px-3 py-1 bg-white hover:bg-rose-50 text-rose-700 font-extrabold rounded-lg shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer text-[11px] disabled:opacity-75"
            title="Download Android App"
          >
            {isDownloading ? (
              <>
                <CheckCircle2 className="w-3 h-3 animate-pulse text-emerald-600" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-3 h-3" />
                <span>Android App</span>
              </>
            )}
          </button>

          {onOpenIosModal && (
            <button
              type="button"
              id="btn-top-banner-ios"
              onClick={onOpenIosModal}
              className="px-2.5 sm:px-3 py-1 bg-slate-950 hover:bg-slate-900 text-white font-extrabold rounded-lg shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer text-[11px] border border-white/20"
              title="Install Vernunt on iPhone or iPad"
            >
              <Apple className="w-3.5 h-3.5 text-white" />
              <span>iPhone App</span>
            </button>
          )}

          <button
            type="button"
            id="btn-top-banner-guide"
            onClick={onOpenModal}
            className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg flex items-center gap-1 transition cursor-pointer text-[11px]"
            title="Android App Info & QR Code"
          >
            <QrCode className="w-3 h-3" />
            <span className="hidden sm:inline">QR Scan</span>
          </button>

          <button
            onClick={handleDismiss}
            className="p-1 text-white/70 hover:text-white rounded-md transition cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </aside>
  );
};
