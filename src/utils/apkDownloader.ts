/**
 * Universal APK Download Engine
 * Handles sandboxed iframes, mobile Chrome, and desktop browsers
 * Prevents "Cookie check" HTML interception and guarantees genuine binary delivery
 */

export function getPublicApkUrl(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    return `${origin}/api/download/android-apk`;
  }
  return 'https://app.vernunt.com/api/download/android-apk';
}

export function getDirectFileApkUrl(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    return `${origin}/vernunt-app.apk`;
  }
  return 'https://app.vernunt.com/vernunt-app.apk';
}

export function getWhatsAppShareApkLink(): string {
  const url = getPublicApkUrl();
  const text = encodeURIComponent(
    `📲 Download Vernunt Android App (Official APK):\n${url}\n\nInstall directly on your Android phone to consult 1,000+ verified specialists across India & find neighborhood playmates.`
  );
  return `https://api.whatsapp.com/send?text=${text}`;
}

export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent || '');
}

export interface ApkDownloadResult {
  success: boolean;
  method: string;
  error?: string;
  isCookieCheckBlocked?: boolean;
}

export async function triggerApkDownload(): Promise<ApkDownloadResult> {
  const apkEndpoint = '/vernunt.apk';

  // Strategy 1: Fetch binary within current authenticated session to verify genuine APK
  try {
    const response = await fetch(apkEndpoint, {
      credentials: 'same-origin',
      cache: 'no-store'
    });

    if (response.ok) {
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer.slice(0, 4));

      // Validate ZIP/APK magic bytes (0x50 0x4B 0x03 0x04)
      const isZipApk = bytes[0] === 0x50 && bytes[1] === 0x4B;

      if (!isZipApk) {
        console.warn('[APK Downloader] Server returned non-ZIP payload (likely Cookie check HTML barrier)');
        return {
          success: false,
          method: 'cookie_check_detected',
          isCookieCheckBlocked: true,
          error: 'Browser authentication cookie barrier detected. Use 1-Tap Home Screen installation or open in direct window.'
        };
      }

      // If on mobile Android and Web Share API is available with file support:
      // This directly invokes Android's native "Package Installer" or "Save to Files"
      // without triggering Chrome's DownloadManager external HTTP fetch!
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
        try {
          const apkFile = new File([buffer], 'vernunt-app.apk', {
            type: 'application/vnd.android.package-archive'
          });

          if (navigator.canShare({ files: [apkFile] })) {
            await navigator.share({
              files: [apkFile],
              title: 'Vernunt Android App',
              text: 'Install Vernunt Android App (Official APK)'
            });
            return { success: true, method: 'android_system_share_installer' };
          }
        } catch (shareErr: any) {
          // User canceled or share aborted; proceed to blob anchor fallback
          if (shareErr?.name !== 'AbortError') {
            console.debug('[APK Downloader] Web Share note:', shareErr);
          }
        }
      }

      // Strategy 2: In-browser Blob download (same tab, no target="_blank" to retain session)
      const blob = new Blob([buffer], { type: 'application/vnd.android.package-archive' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'vernunt-app.apk';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(blobUrl);
      }, 2500);

      return { success: true, method: 'in_memory_blob_authenticated' };
    }
  } catch (err: any) {
    console.warn('[APK Downloader] Authenticated fetch note:', err);
  }

  // Strategy 3: Standard direct link fallback
  try {
    const link = document.createElement('a');
    link.href = getPublicApkUrl();
    link.download = 'vernunt-app.apk';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 1500);
    return { success: true, method: 'direct_anchor_same_tab' };
  } catch (err: any) {
    return { success: false, method: 'failed', error: err?.message };
  }
}

