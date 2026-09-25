import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Upload, AlertCircle, Sparkles, CheckCircle2, QrCode } from 'lucide-react';
import jsQR from 'jsqr';

interface EventQrScannerModalProps {
  onClose: () => void;
  onScanEventFound: (eventId: string, autoBook: boolean) => void;
}

export default function EventQrScannerModal({
  onClose,
  onScanEventFound
}: EventQrScannerModalProps) {
  const [activeMode, setActiveMode] = useState<'camera' | 'upload'>('camera');
  const [cameraError, setCameraError] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [detectedData, setDetectedData] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to parse event ID from scanned QR payload
  const parseEventFromQr = (rawText: string) => {
    try {
      // Check if it's a URL (e.g. ?tab=events&eventId=... or ?event=...)
      if (rawText.includes('eventId=') || rawText.includes('event=')) {
        const url = new URL(rawText.startsWith('http') ? rawText : `https://example.com/${rawText}`);
        const evtId = url.searchParams.get('eventId') || url.searchParams.get('event');
        const autoBook = url.searchParams.get('book') === 'true' || url.searchParams.get('action') === 'book' || true;
        if (evtId) {
          return { eventId: evtId, autoBook };
        }
      }

      // Check if it's JSON payload
      if (rawText.trim().startsWith('{')) {
        const parsed = JSON.parse(rawText);
        if (parsed.eventId || parsed.id) {
          return { eventId: parsed.eventId || parsed.id, autoBook: true };
        }
      }

      // Fallback: direct ID format
      if (rawText.startsWith('custom-event-') || rawText.startsWith('event-') || rawText.startsWith('evt-')) {
        return { eventId: rawText.trim(), autoBook: true };
      }
    } catch {
      // Direct search
      const match = rawText.match(/eventId=([^&]+)/);
      if (match && match[1]) {
        return { eventId: decodeURIComponent(match[1]), autoBook: true };
      }
    }
    return null;
  };

  // Camera stream setup and real-time canvas decoding via jsQR
  useEffect(() => {
    if (activeMode !== 'camera') {
      stopCamera();
      return;
    }

    let isSubscribed = true;

    const startCamera = async () => {
      setCameraError('');
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera device access is not supported in this browser. Please use the Upload Image option.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });

        if (!isSubscribed) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          requestAnimationFrame(scanVideoFrame);
        }
      } catch (err: any) {
        if (isSubscribed) {
          console.warn('Camera stream note:', err);
          setCameraError(err.message || 'Unable to access camera. Please switch to the "Upload QR Code Image" tab below.');
        }
      }
    };

    const scanVideoFrame = () => {
      if (!isSubscribed || !videoRef.current) return;

      const video = videoRef.current;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (code && code.data) {
            const parsed = parseEventFromQr(code.data);
            if (parsed) {
              setDetectedData(code.data);
              stopCamera();
              setTimeout(() => {
                onScanEventFound(parsed.eventId, parsed.autoBook);
              }, 600);
              return;
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
    };

    startCamera();

    return () => {
      isSubscribed = false;
      stopCamera();
    };
  }, [activeMode]);

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  // Image Upload Decoding via jsQR
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          const parsed = parseEventFromQr(code.data);
          if (parsed) {
            setDetectedData(code.data);
            setTimeout(() => {
              onScanEventFound(parsed.eventId, parsed.autoBook);
            }, 500);
          } else {
            alert('Scanned QR code is not recognized as an event booking pass. Code data: ' + code.data);
          }
        } else {
          alert('Could not detect a valid QR code in this image. Please make sure the image is clear and well-lit.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div 
      id="modal-scan-event-qr"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400 block">
                Direct Booking Scanner
              </span>
              <h3 className="text-base font-bold text-white">
                Scan Event QR Code
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="p-3 bg-slate-100 flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveMode('camera')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'camera'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Stream</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('upload')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'upload'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 text-center space-y-4">
          {detectedData ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-emerald-950 text-sm">Event Pass QR Detected!</h4>
              <p className="text-xs text-emerald-700">Opening event details &amp; launching booking checkout now...</p>
            </div>
          ) : activeMode === 'camera' ? (
            <div className="space-y-3">
              {cameraError ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-left space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Camera Stream Unavailable</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    {cameraError}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveMode('upload')}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition mt-2 cursor-pointer shadow-xs"
                  >
                    Switch to Upload Image Option
                  </button>
                </div>
              ) : (
                <div className="relative aspect-square w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-black border-2 border-slate-800 shadow-inner flex items-center justify-center">
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover" 
                    playsInline 
                    muted 
                  />
                  {/* Targeting Reticle */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-44 h-44 border-2 border-dashed border-orange-400 rounded-2xl animate-pulse shadow-lg flex items-center justify-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Point your camera at any Vernunt Event QR Code flyer or ticket pass.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-3xl bg-slate-50 hover:bg-orange-50/50 transition cursor-pointer flex flex-col items-center justify-center gap-3 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white text-orange-600 flex items-center justify-center shadow-xs border border-slate-200 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-800">
                    Click to select QR Code image
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    PNG, JPG, or WEBP screenshot
                  </p>
                </div>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </div>
              <p className="text-xs text-slate-500">
                Upload a photo of an event flyer or an invitation poster with a QR code.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
