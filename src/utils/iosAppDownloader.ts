/**
 * Universal iOS App Download & Installation Engine
 * Supports:
 * 1. Apple Mobile Configuration WebClip Profile (.mobileconfig)
 * 2. Xcode IPA source archive (.zip)
 * 3. iOS Safari Web App Add-to-Home-Screen (PWA)
 */

export function getPublicMobileConfigUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/vernunt.mobileconfig`;
  }
  return 'https://app.vernunt.com/vernunt.mobileconfig';
}

export function getPublicIosProjectUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/vernunt-ios-project.zip`;
  }
  return 'https://app.vernunt.com/vernunt-ios-project.zip';
}

export function getWhatsAppShareIosLink(): string {
  const url = typeof window !== 'undefined' ? window.location.origin : 'https://app.vernunt.com';
  const text = encodeURIComponent(
    `🍏 Install Vernunt on iPhone & iPad:\n${url}\n\n1. Open link in Safari on your iPhone\n2. Tap Share (square with arrow up)\n3. Tap "Add to Home Screen" OR download the iOS App Profile directly!\n\nAccess 1,000+ verified specialists & neighborhood playmates across India.`
  );
  return `https://api.whatsapp.com/send?text=${text}`;
}

export async function triggerMobileConfigDownload(): Promise<{ success: boolean; method: string }> {
  try {
    const link = document.createElement('a');
    link.href = '/vernunt.mobileconfig';
    link.download = 'vernunt.mobileconfig';
    link.target = '_self';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 1500);
    return { success: true, method: 'direct_link' };
  } catch (err) {
    console.warn('[iOS Downloader] Direct link failed, trying blob:', err);
  }

  try {
    const res = await fetch('/vernunt.mobileconfig', { cache: 'no-store' });
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      const blob = new Blob([buffer], { type: 'application/x-apple-aspen-config' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'vernunt.mobileconfig';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(blobUrl);
      }, 3000);

      return { success: true, method: 'blob' };
    }
  } catch (err) {
    console.warn('[iOS Downloader] Blob error:', err);
  }

  return { success: false, method: 'none' };
}

export async function triggerIosProjectDownload(): Promise<{ success: boolean; method: string }> {
  try {
    const link = document.createElement('a');
    link.href = '/vernunt-ios-project.zip';
    link.download = 'vernunt-ios-source.zip';
    link.target = '_self';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 1500);
    return { success: true, method: 'direct_link' };
  } catch (err) {
    console.warn('[iOS Downloader] Project download error:', err);
  }
  return { success: false, method: 'none' };
}
