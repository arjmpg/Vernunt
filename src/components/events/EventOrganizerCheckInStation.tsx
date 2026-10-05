import React, { useState, useEffect, useRef } from 'react';
import { CommunityEvent, EventAttendee } from '../../types.ts';
import { 
  QrCode, Camera, CheckCircle2, AlertTriangle, XCircle, Search, 
  UserCheck, Users, Download, RefreshCw, X, ShieldCheck, 
  Clock, MapPin, Sparkles, Filter, Check, ArrowRight,
  Flashlight, FlashlightOff, Upload, SwitchCamera, Volume2, VolumeX,
  Scan, CheckCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import jsQR from 'jsqr';
import EventOrganizerDynamicCheckInModal from './EventOrganizerDynamicCheckInModal.tsx';

interface EventOrganizerCheckInStationProps {
  event: CommunityEvent;
  userProfile?: any;
  onClose: () => void;
  onUpdateEvent?: (updatedEvent: CommunityEvent) => void;
}

export default function EventOrganizerCheckInStation({
  event,
  userProfile,
  onClose,
  onUpdateEvent
}: EventOrganizerCheckInStationProps) {
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'checked_in' | 'pending'>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [isShakeError, setIsShakeError] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'already_checked' | 'invalid' | null;
    message: string;
    attendee?: EventAttendee;
  }>({ status: null, message: '' });

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [showDynamicQrModal, setShowDynamicQrModal] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scanCooldownRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Web Audio API Synthesizer Feedback for Instant Gate Validation
  const playAudioFeedback = (type: 'success' | 'error' | 'already') => {
    if (!audioFeedbackEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        // High ascending melodic two-tone chime
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc.frequency.setValueAtTime(987.77, ctx.currentTime + 0.1); // B5
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'already') {
        // Warning double tone
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else {
        // Low descending error buzz
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.setValueAtTime(170, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.32);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.32);
      }
    } catch {
      // Audio playback unavailable
    }
  };

  // Helper to extract clean ticket ID/payload from QR code data
  const parseTicketFromQr = (rawText: string): string => {
    const trimmed = rawText.trim();
    if (!trimmed) return '';

    // 1. JSON payload
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        return (
          parsed.ticketNumber ||
          parsed.qrPassCode ||
          parsed.bookingReference ||
          parsed.bookingId ||
          parsed.id ||
          parsed.ticketId ||
          trimmed
        );
      } catch {
        // fallback
      }
    }

    // 2. URL payload
    if (trimmed.includes('ticket=') || trimmed.includes('ticketNumber=') || trimmed.includes('eventId=')) {
      try {
        const url = new URL(trimmed.startsWith('http') ? trimmed : `https://example.com/${trimmed}`);
        const code = url.searchParams.get('ticket') || url.searchParams.get('ticketNumber') || url.searchParams.get('code');
        if (code) return decodeURIComponent(code);
      } catch {
        const match = trimmed.match(/(?:ticket|ticketNumber|code)=([^&]+)/);
        if (match && match[1]) return decodeURIComponent(match[1]);
      }
    }

    // 3. Fallback raw text
    return trimmed;
  };

  // Toggle Camera Torch / Flashlight in low light conditions
  const toggleCameraTorch = async () => {
    const nextTorch = !isTorchOn;
    setIsTorchOn(nextTorch);

    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        try {
          const capabilities = (videoTrack.getCapabilities && videoTrack.getCapabilities()) || {};
          if ('torch' in capabilities || (capabilities as any).fillLightMode) {
            await videoTrack.applyConstraints({
              advanced: [{ torch: nextTorch }]
            } as any);
          }
        } catch (err) {
          console.warn('Torch constraint not supported, applying screen illuminator', err);
        }
      }
    }
  };

  // Switch between Environment (Back) and User (Front) camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (cameraActive) {
      stopCamera();
      setTimeout(() => {
        startCamera(nextMode);
      }, 250);
    }
  };

  // Initialize or load mock/live attendees for this event
  useEffect(() => {
    const saved = localStorage.getItem(`vernunt_attendees_${event.id}`);
    if (saved) {
      try {
        setAttendees(JSON.parse(saved));
        return;
      } catch (e) {
        console.error('Failed to parse saved attendees', e);
      }
    }

    // Default rich attendee sample based on event
    const sampleAttendees: EventAttendee[] = [
      {
        id: 'att-101',
        ticketNumber: `VERN-EVT-${event.id.slice(0, 4).toUpperCase()}-101`,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventVenue: event.location,
        buyerName: 'Ananya Sharma',
        buyerEmail: 'ananya.sharma@example.com',
        buyerPhone: '+91 98201 44821',
        childName: 'Aarav Sharma',
        childAge: 5,
        ticketTierName: 'VIP Family Pass',
        quantity: 1,
        amountPaid: event.ticketPrice ? event.ticketPrice * 1.5 : 499,
        checkedIn: true,
        checkedInAt: '10:04 AM',
        checkedInBy: 'Gate 1 Scanner',
        specialRequirements: 'Nut allergy, prefers front row seating',
        emergencyPhone: '+91 98201 44821',
        createdAt: '2026-08-15T09:30:00Z'
      },
      {
        id: 'att-102',
        ticketNumber: `VERN-EVT-${event.id.slice(0, 4).toUpperCase()}-102`,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventVenue: event.location,
        buyerName: 'Rohan Mehta',
        buyerEmail: 'rohan.mehta@example.com',
        buyerPhone: '+91 97112 39012',
        childName: 'Kiara Mehta',
        childAge: 4,
        ticketTierName: 'Child Entry + Workshop Kit',
        quantity: 1,
        amountPaid: event.ticketPrice || 299,
        checkedIn: false,
        specialRequirements: 'None',
        emergencyPhone: '+91 97112 39012',
        createdAt: '2026-08-16T11:20:00Z'
      },
      {
        id: 'att-103',
        ticketNumber: `VERN-EVT-${event.id.slice(0, 4).toUpperCase()}-103`,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventVenue: event.location,
        buyerName: 'Pooja Iyer',
        buyerEmail: 'pooja.iyer@example.com',
        buyerPhone: '+91 99403 88129',
        childName: 'Aditya Iyer',
        childAge: 7,
        ticketTierName: 'General Admission',
        quantity: 1,
        amountPaid: event.ticketPrice || 199,
        checkedIn: false,
        emergencyPhone: '+91 99403 88129',
        createdAt: '2026-08-16T14:45:00Z'
      },
      {
        id: 'att-104',
        ticketNumber: `VERN-EVT-${event.id.slice(0, 4).toUpperCase()}-104`,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventVenue: event.location,
        buyerName: 'Vikram Joshi',
        buyerEmail: 'vikram.j@example.com',
        buyerPhone: '+91 98450 12390',
        childName: 'Diya Joshi',
        childAge: 6,
        ticketTierName: 'VIP Family Pass',
        quantity: 1,
        amountPaid: event.ticketPrice ? event.ticketPrice * 1.5 : 499,
        checkedIn: true,
        checkedInAt: '10:12 AM',
        checkedInBy: 'Gate 2 Desk',
        createdAt: '2026-08-17T08:10:00Z'
      },
      {
        id: 'att-105',
        ticketNumber: `VERN-EVT-${event.id.slice(0, 4).toUpperCase()}-105`,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventVenue: event.location,
        buyerName: 'Neha Kapoor',
        buyerEmail: 'neha.kapoor@example.com',
        buyerPhone: '+91 98104 55091',
        childName: 'Kabir Kapoor',
        childAge: 3,
        ticketTierName: 'Child Entry + Workshop Kit',
        quantity: 1,
        amountPaid: event.ticketPrice || 299,
        checkedIn: false,
        specialRequirements: 'Requires booster seat if available',
        emergencyPhone: '+91 98104 55091',
        createdAt: '2026-08-17T10:00:00Z'
      }
    ];

    setAttendees(sampleAttendees);
    localStorage.setItem(`vernunt_attendees_${event.id}`, JSON.stringify(sampleAttendees));
  }, [event.id]);

  const saveAttendees = (newList: EventAttendee[]) => {
    setAttendees(newList);
    localStorage.setItem(`vernunt_attendees_${event.id}`, JSON.stringify(newList));
  };

  // Immediate non-visual haptic feedback and red border shake on invalid/expired ticket
  const triggerInvalidFeedback = () => {
    // 1. Device Haptic Feedback (Sharp double pulse)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([140, 60, 180]);
      } catch (e) {
        console.debug('Haptic vibration not available on this device');
      }
    }
    // 2. Subtle Red Border Shake Animation
    setIsShakeError(true);
    setTimeout(() => {
      setIsShakeError(false);
    }, 700);
  };

  // Check-In Logic
  const handleCheckInByCode = (rawCode: string) => {
    const parsed = parseTicketFromQr(rawCode);
    const trimmed = parsed.trim().toUpperCase();
    if (!trimmed) return;

    setLastScannedCode(trimmed);

    // Check if event itself is past or ticket explicitly marked expired
    const todayStr = new Date().toISOString().split('T')[0];
    const isEventExpired = (event.endDate && event.endDate < todayStr) || (event.date && event.date < todayStr);
    const isCodeExpired = trimmed.includes('EXPIRED');

    if (isEventExpired || isCodeExpired) {
      triggerInvalidFeedback();
      playAudioFeedback('error');
      setScanResult({
        status: 'invalid',
        message: `⛔ TICKET EXPIRED: This pass for "${event.title}" has expired (${event.date || 'past event'}). Not valid for gate admission.`
      });
      return;
    }

    // Search attendee by ticketNumber, bookingId, or childName/buyerName
    const matchedIndex = attendees.findIndex(
      a => a.ticketNumber.toUpperCase() === trimmed ||
           a.id.toUpperCase() === trimmed ||
           a.buyerPhone.includes(trimmed) ||
           a.buyerEmail.toLowerCase() === trimmed.toLowerCase() ||
           trimmed.includes(a.ticketNumber.toUpperCase()) ||
           a.ticketNumber.toUpperCase().includes(trimmed)
    );

    if (matchedIndex === -1) {
      triggerInvalidFeedback();
      playAudioFeedback('error');
      setScanResult({
        status: 'invalid',
        message: `❌ INVALID PASS: Ticket "${trimmed}" was not found in this event's roster. Please check the QR pass.`
      });
      return;
    }

    const attendee = attendees[matchedIndex];

    if (attendee.checkedIn) {
      triggerInvalidFeedback();
      playAudioFeedback('already');
      setScanResult({
        status: 'already_checked',
        message: `⚠️ ALREADY CHECKED IN: ${attendee.childName || attendee.buyerName} was already admitted at ${attendee.checkedInAt || 'earlier today'}.`,
        attendee: attendee
      });
      return;
    }

    // Mark as checked in
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedList = [...attendees];
    updatedList[matchedIndex] = {
      ...attendee,
      checkedIn: true,
      checkedInAt: nowTimeStr,
      checkedInBy: 'Venue Scanner Station'
    };

    saveAttendees(updatedList);
    playAudioFeedback('success');

    setScanResult({
      status: 'success',
      message: `✅ ADMITTED: Welcome ${attendee.childName ? `${attendee.childName} (Parent: ${attendee.buyerName})` : attendee.buyerName}!`,
      attendee: updatedList[matchedIndex]
    });

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });

    setManualCodeInput('');
  };

  const toggleManualCheckIn = (attendeeId: string) => {
    const updated = attendees.map(a => {
      if (a.id === attendeeId) {
        const isNowChecked = !a.checkedIn;
        if (isNowChecked) {
          playAudioFeedback('success');
        }
        return {
          ...a,
          checkedIn: isNowChecked,
          checkedInAt: isNowChecked ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
          checkedInBy: isNowChecked ? 'Organizer Manual Desk' : undefined
        };
      }
      return a;
    });

    saveAttendees(updated);
  };

  // Continuous Camera QR Scanner Frame Loop with jsQR
  const scanVideoFrame = () => {
    if (!videoRef.current || !streamRef.current) return;
    const video = videoRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (code && code.data && !scanCooldownRef.current) {
            scanCooldownRef.current = true;
            setTimeout(() => {
              scanCooldownRef.current = false;
            }, 1800);

            handleCheckInByCode(code.data);
          }
        }
      } catch (err) {
        console.debug('Error reading video frame for QR decoding', err);
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  };

  // Camera QR Scanner setup using MediaDevices
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser. Please use the Upload Image or Manual Search tool.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: mode, 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(err.message || 'Camera access unavailable. You can use the instant Manual Ticket Search or Image Scanner below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Scan uploaded image containing QR code
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          if (code && code.data) {
            handleCheckInByCode(code.data);
          } else {
            setScanResult({
              status: 'invalid',
              message: '❌ No QR code detected in the uploaded image. Please ensure the pass QR code is clearly visible.'
            });
            triggerInvalidFeedback();
            playAudioFeedback('error');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input so user can re-upload same file if needed
    e.target.value = '';
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Export Attendees to CSV (WooEvents / WooCommerce Events format)
  const exportAttendeesCSV = () => {
    const headers = [
      'Ticket Number',
      'Event Title',
      'Event Date',
      'Buyer Name',
      'Buyer Email',
      'Buyer Phone',
      'Child Name',
      'Child Age',
      'Ticket Tier',
      'Amount Paid (INR)',
      'Status',
      'Check-In Time',
      'Special Notes'
    ];

    const rows = attendees.map(a => [
      `"${a.ticketNumber}"`,
      `"${a.eventTitle}"`,
      `"${a.eventDate}"`,
      `"${a.buyerName}"`,
      `"${a.buyerEmail}"`,
      `"${a.buyerPhone}"`,
      `"${a.childName || ''}"`,
      `"${a.childAge || ''}"`,
      `"${a.ticketTierName}"`,
      `"${a.amountPaid}"`,
      `"${a.checkedIn ? 'CHECKED_IN' : 'PENDING'}"`,
      `"${a.checkedInAt || ''}"`,
      `"${a.specialRequirements || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendees-${event.title.replace(/\s+/g, '-').toLowerCase()}-${event.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics
  const totalCount = attendees.length;
  const checkedInCount = attendees.filter(a => a.checkedIn).length;
  const pendingCount = totalCount - checkedInCount;
  const checkInRate = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  // Filter attendees
  const filteredAttendees = attendees.filter(a => {
    if (filterStatus === 'checked_in' && !a.checkedIn) return false;
    if (filterStatus === 'pending' && a.checkedIn) return false;
    if (filterTier !== 'all' && a.ticketTierName !== filterTier) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.ticketNumber.toLowerCase().includes(q) ||
        a.buyerName.toLowerCase().includes(q) ||
        (a.childName && a.childName.toLowerCase().includes(q)) ||
        a.buyerEmail.toLowerCase().includes(q) ||
        a.buyerPhone.includes(q)
      );
    }
    return true;
  });

  const allTiers = Array.from(new Set(attendees.map(a => a.ticketTierName)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-md border border-orange-500/30">
                  Organizer Gate Desk
                </span>
                <span className="text-xs text-slate-400">Vernunt Events Verification Station</span>
                {userProfile && (
                  <span className="text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Operator: {userProfile.parentName || 'Organizer'} ({userProfile.userRole || 'Event Organizer'})</span>
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-white leading-tight mt-0.5">
                {event.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Generate Dynamic Check-in QR for Attendees */}
            <button
              id="btn-station-generate-checkin-qr"
              type="button"
              onClick={() => setShowDynamicQrModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white cursor-pointer"
              title="Generate temporary, single-use dynamic QR code for attendees to scan at gate"
            >
              <QrCode className="w-3.5 h-3.5 text-white" />
              <span>Generate Check-in QR</span>
            </button>

            {/* Camera-based QR Scanner Button in Header */}
            <button
              id="btn-station-header-camera-scanner"
              type="button"
              onClick={cameraActive ? stopCamera : () => startCamera()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                cameraActive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30'
              }`}
              title="Camera-based QR scanner to instantly validate attendee passes"
            >
              <Camera className={`w-3.5 h-3.5 ${cameraActive ? 'animate-bounce' : ''}`} />
              <span>{cameraActive ? 'Stop Scanner' : 'Camera QR Scanner'}</span>
              {!cameraActive && (
                <span className="bg-white/20 text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase tracking-wider">
                  Live
                </span>
              )}
            </button>

            <button
              onClick={exportAttendeesCSV}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Attendance Progress Bar */}
        <div className="bg-slate-800/80 px-6 py-3 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Total Registered:</span>
              <span className="font-bold text-white text-sm">{totalCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-semibold">Checked In:</span>
              <span className="font-bold text-emerald-400 text-sm">{checkedInCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400">Awaiting Entry:</span>
              <span className="font-bold text-amber-400 text-sm">{pendingCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 min-w-[200px] flex-1 max-w-xs">
            <div className="flex-1 bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-500 to-emerald-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${checkInRate}%` }}
              />
            </div>
            <span className="font-mono font-bold text-white text-xs">{checkInRate}%</span>
          </div>
        </div>

        {/* Main Content: Scanner + Attendee Roster */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: QR Code Scanner & Quick Code Entry */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Camera / Manual Scanner Card */}
            <div className={`bg-slate-50 border rounded-2xl p-4 shadow-xs space-y-3 transition-all duration-200 ${
              isShakeError 
                ? 'border-rose-500 ring-4 ring-rose-400/50 animate-shake bg-rose-50/60 shadow-lg shadow-rose-500/20' 
                : 'border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ${
                  isShakeError ? 'text-rose-700 font-black' : 'text-slate-700'
                }`}>
                  <QrCode className={`w-4 h-4 ${isShakeError ? 'text-rose-600' : 'text-orange-600'}`} />
                  Live Gate Scanner
                  {isShakeError && (
                    <span className="text-[10px] bg-rose-600 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse ml-1">
                      Scan Error
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-1.5">
                  {/* Sound feedback toggle */}
                  <button
                    type="button"
                    onClick={() => setAudioFeedbackEnabled(!audioFeedbackEnabled)}
                    className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      audioFeedbackEnabled ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-400'
                    }`}
                    title={audioFeedbackEnabled ? 'Audio chime enabled on scan' : 'Audio chime muted'}
                  >
                    {audioFeedbackEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>

                  {cameraActive && (
                    <>
                      {/* Flip Camera front/back */}
                      <button
                        type="button"
                        onClick={toggleFacingMode}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Switch between front and back camera"
                      >
                        <SwitchCamera className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{facingMode === 'environment' ? 'Back' : 'Front'}</span>
                      </button>

                      {/* Torch button */}
                      <button
                        id="btn-camera-flash-station"
                        type="button"
                        onClick={toggleCameraTorch}
                        className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                          isTorchOn 
                            ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-xs animate-pulse' 
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                        title="Toggle camera flash / low-light torch"
                      >
                        {isTorchOn ? <Flashlight className="w-3.5 h-3.5 fill-slate-950" /> : <FlashlightOff className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{isTorchOn ? 'Torch' : 'Torch'}</span>
                      </button>
                    </>
                  )}

                  {/* Primary Camera QR Scanner Button */}
                  <button
                    id="btn-main-camera-scanner-toggle"
                    type="button"
                    onClick={cameraActive ? stopCamera : () => startCamera()}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      cameraActive 
                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' 
                        : 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{cameraActive ? 'Stop Camera' : 'Start Camera'}</span>
                  </button>
                </div>
              </div>

              {/* Video Camera Preview */}
              {cameraActive ? (
                <div className={`relative aspect-video bg-black rounded-xl overflow-hidden border transition-colors ${
                  isShakeError ? 'border-rose-500 ring-4 ring-rose-500/40' : 'border-slate-300'
                }`}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />

                  {/* Night-mode ambient light boost when torch is active */}
                  {isTorchOn && (
                    <div className="absolute inset-0 pointer-events-none bg-radial from-amber-100/30 via-amber-200/10 to-transparent ring-4 ring-amber-300/40 animate-pulse"></div>
                  )}

                  {/* Laser scan line animation */}
                  <div className="absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-[0_0_12px_rgba(249,115,22,1)] animate-bounce pointer-events-none" style={{ top: '48%' }}></div>

                  {/* Scanning Reticle */}
                  <div className={`absolute inset-0 border-2 rounded-xl m-6 pointer-events-none flex items-center justify-center transition-colors ${
                    isShakeError ? 'border-rose-500 bg-rose-950/30' : 'border-orange-500/80 animate-pulse'
                  }`}>
                    <span className={`text-[11px] px-2.5 py-1 rounded-md font-bold shadow-md ${
                      isShakeError ? 'bg-rose-600 text-white' : 'bg-black/70 text-white'
                    }`}>
                      {isShakeError ? '⚠️ Invalid / Expired QR Code' : 'Align Attendee QR Code Here'}
                    </span>
                  </div>

                  {/* Top bar controls in camera preview */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition cursor-pointer"
                    >
                      <SwitchCamera className="w-3 h-3" />
                      <span>{facingMode === 'environment' ? 'Rear' : 'Front'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={toggleCameraTorch}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 backdrop-blur-md transition cursor-pointer ${
                        isTorchOn ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300' : 'bg-black/60 text-white hover:bg-black/80'
                      }`}
                    >
                      {isTorchOn ? <Flashlight className="w-3 h-3 fill-slate-950" /> : <FlashlightOff className="w-3 h-3" />}
                      <span>{isTorchOn ? 'Torch On' : 'Torch Off'}</span>
                    </button>
                  </div>
                </div>
              ) : cameraError ? (
                <div className="p-3 bg-amber-50 rounded-xl text-amber-800 text-xs border border-amber-200 space-y-2">
                  <p>{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload QR Pass Screenshot</span>
                  </button>
                </div>
              ) : (
                /* Prominent Camera-based QR Scanner Button View */
                <div className="space-y-2">
                  <button
                    id="btn-launch-camera-scanner-box"
                    type="button"
                    onClick={() => startCamera()}
                    className="w-full py-4 px-4 bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 hover:from-orange-600 hover:via-amber-600 hover:to-rose-600 text-white rounded-2xl font-bold shadow-md shadow-orange-500/20 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-black block">Camera-based QR Scanner</span>
                      <span className="text-[11px] text-white/90 font-medium">
                        Instant live ticket validation for attendees
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Upload Pass QR Photo</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {/* Manual Ticket ID / Phone Input */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCheckInByCode(manualCodeInput);
                }} 
                className="space-y-2"
              >
                <label className="block text-[11px] font-bold text-slate-700 uppercase">
                  Fast Manual Search & Validation
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value)}
                    placeholder="Enter Ticket ID, Child Name, or Phone..."
                    className={`flex-1 text-xs px-3 py-2 rounded-xl border font-mono transition-all focus:outline-none ${
                      isShakeError 
                        ? 'border-rose-500 ring-2 ring-rose-400 bg-rose-50/60 text-rose-900' 
                        : 'border-slate-300 focus:ring-2 focus:ring-orange-500'
                    }`}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    Check In
                  </button>
                </div>
              </form>

              {/* Instant Quick Validation Result Banner */}
              {scanResult.status && (
                <div className={`p-4 rounded-xl text-xs border animate-fadeIn ${
                  scanResult.status === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : scanResult.status === 'already_checked'
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-rose-50 text-rose-900 border-rose-300'
                }`}>
                  <div className="flex items-start gap-2.5">
                    {scanResult.status === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : scanResult.status === 'already_checked' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-bold">{scanResult.message}</p>
                      {scanResult.attendee && (
                        <div className="text-[11px] text-slate-700 bg-white/80 p-2 rounded-lg border border-slate-200/60 mt-1.5 space-y-0.5">
                          <div><strong>Pass Tier:</strong> {scanResult.attendee.ticketTierName}</div>
                          <div><strong>Ticket ID:</strong> <span className="font-mono">{scanResult.attendee.ticketNumber}</span></div>
                          {scanResult.attendee.specialRequirements && (
                            <div className="text-amber-800 font-semibold">
                              ⚠️ Notes: {scanResult.attendee.specialRequirements}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Demo QR Test Buttons */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-700 text-[11px] block">
                Quick Test Simulators:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {attendees.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleCheckInByCode(a.ticketNumber)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1"
                  >
                    <span>{a.childName || a.buyerName}</span>
                    <span className="text-[10px] text-slate-400">({a.ticketNumber.slice(-3)})</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Live Attendee Roster */}
          <div className="lg:col-span-7 space-y-3">
            
            {/* Search & Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter attendees by name, phone, or ticket ID..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    filterStatus === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All ({attendees.length})
                </button>
                <button
                  onClick={() => setFilterStatus('checked_in')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    filterStatus === 'checked_in' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Admitted ({checkedInCount})
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    filterStatus === 'pending' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
              </div>
            </div>

            {/* Attendee Roster List */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {filteredAttendees.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed-2 border-slate-200">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No attendees match your search</p>
                  <p className="text-[11px] text-slate-400">Try adjusting your filters or search keywords.</p>
                </div>
              ) : (
                filteredAttendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      attendee.checkedIn 
                        ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50/70' 
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Status Indicator Dot (Green for checked in, Orange for pending) */}
                      <div className="pt-2 shrink-0">
                        {attendee.checkedIn ? (
                          <span className="relative flex h-2.5 w-2.5" title="Checked In">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-emerald-200"></span>
                          </span>
                        ) : (
                          <span className="relative flex h-2.5 w-2.5" title="Pending Gate Scan">
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 ring-2 ring-amber-200"></span>
                          </span>
                        )}
                      </div>

                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                        attendee.checkedIn 
                          ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {attendee.checkedIn ? <Check className="w-4 h-4" /> : attendee.childName ? attendee.childName[0] : attendee.buyerName[0]}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-bold text-slate-900 text-xs truncate">
                            {attendee.childName || attendee.buyerName}
                          </h5>
                          {attendee.childAge && (
                            <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded">
                              {attendee.childAge} yrs
                            </span>
                          )}
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-full border border-slate-200">
                            {attendee.ticketTierName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                          <span>Parent: {attendee.buyerName}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-700 font-semibold">{attendee.ticketNumber}</span>
                          <span>•</span>
                          <span>{attendee.buyerPhone}</span>
                        </div>

                        {attendee.specialRequirements && (
                          <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block">
                            ⚠️ {attendee.specialRequirements}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Check-In Toggle */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {attendee.checkedIn ? (
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full block">
                            Checked In
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                            {attendee.checkedInAt}
                          </span>
                        </div>
                      ) : null}

                      <button
                        onClick={() => toggleManualCheckIn(attendee.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                          attendee.checkedIn
                            ? 'bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 border border-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        }`}
                      >
                        {attendee.checkedIn ? 'Undo' : 'Admit'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            End-to-End Encrypted Event Check-In Station
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
          >
            Close Scanner
          </button>
        </div>

      </div>

      {/* Dynamic Single-Use Gate Check-In QR Modal */}
      {showDynamicQrModal && (
        <EventOrganizerDynamicCheckInModal
          isOpen={showDynamicQrModal}
          onClose={() => setShowDynamicQrModal(false)}
          event={event}
          userProfile={userProfile}
          onOpenScanner={() => {
            setShowDynamicQrModal(false);
            if (!cameraActive) {
              startCamera();
            }
          }}
          onUpdateEvent={onUpdateEvent}
        />
      )}
    </div>
  );
}
