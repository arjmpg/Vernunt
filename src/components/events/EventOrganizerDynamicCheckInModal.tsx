import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CommunityEvent, EventAttendee, ChildProfile } from '../../types.ts';
import { 
  QrCode, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  Clock, 
  Users, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  UserCheck, 
  Flame, 
  ArrowRight, 
  Camera, 
  Copy, 
  Check, 
  Shield, 
  Zap,
  Info
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';

interface EventOrganizerDynamicCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CommunityEvent;
  allEvents?: CommunityEvent[];
  onSelectEvent?: (evt: CommunityEvent) => void;
  userProfile?: ChildProfile | null;
  onOpenScanner?: () => void;
  onUpdateEvent?: (updated: CommunityEvent) => void;
}

interface DynamicTokenPayload {
  type: string;
  eventId: string;
  eventTitle: string;
  token: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
  validitySeconds: number;
  gateStationId: string;
  singleUse: boolean;
}

export default function EventOrganizerDynamicCheckInModal({
  isOpen,
  onClose,
  event: initialEvent,
  allEvents = [],
  onSelectEvent,
  userProfile,
  onOpenScanner,
  onUpdateEvent
}: EventOrganizerDynamicCheckInModalProps) {
  const [currentEvent, setCurrentEvent] = useState<CommunityEvent>(initialEvent);
  const [validitySeconds, setValiditySeconds] = useState<number>(30); // 30s dynamic expiry
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const [tokenPayload, setTokenPayload] = useState<DynamicTokenPayload | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [tokenStatus, setTokenStatus] = useState<'ACTIVE' | 'SCANNED' | 'EXPIRED'>('ACTIVE');
  const [scannedAttendeeInfo, setScannedAttendeeInfo] = useState<EventAttendee | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'recent_scans' | 'gate_settings'>('qr');
  
  // Attendee tracking state
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [selectedSimAttendeeId, setSelectedSimAttendeeId] = useState<string>('');

  const modalRef = useRef<HTMLDivElement>(null);

  // Sync with prop if it changes
  useEffect(() => {
    setCurrentEvent(initialEvent);
  }, [initialEvent]);

  // Load attendees for this event
  useEffect(() => {
    const saved = localStorage.getItem(`vernunt_attendees_${currentEvent.id}`);
    if (saved) {
      try {
        setAttendees(JSON.parse(saved));
        return;
      } catch (e) {
        console.error('Failed to parse saved attendees', e);
      }
    }

    // Default sample attendees if none in storage
    const sampleAttendees: EventAttendee[] = [
      {
        id: 'att-201',
        ticketNumber: `VERN-EVT-${currentEvent.id.slice(0, 4).toUpperCase()}-201`,
        eventId: currentEvent.id,
        eventTitle: currentEvent.title,
        eventDate: currentEvent.date,
        eventTime: currentEvent.time,
        eventVenue: currentEvent.location,
        buyerName: 'Priya Narang',
        buyerEmail: 'priya.narang@example.com',
        buyerPhone: '+91 98201 55321',
        childName: 'Reyansh Narang',
        childAge: 5,
        ticketTierName: 'VIP Pass',
        quantity: 1,
        amountPaid: currentEvent.ticketPrice || 499,
        checkedIn: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'att-202',
        ticketNumber: `VERN-EVT-${currentEvent.id.slice(0, 4).toUpperCase()}-202`,
        eventId: currentEvent.id,
        eventTitle: currentEvent.title,
        eventDate: currentEvent.date,
        eventTime: currentEvent.time,
        eventVenue: currentEvent.location,
        buyerName: 'Kunal Deshmukh',
        buyerEmail: 'kunal.d@example.com',
        buyerPhone: '+91 98402 11983',
        childName: 'Anvi Deshmukh',
        childAge: 6,
        ticketTierName: 'General Entry',
        quantity: 1,
        amountPaid: currentEvent.ticketPrice || 299,
        checkedIn: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'att-203',
        ticketNumber: `VERN-EVT-${currentEvent.id.slice(0, 4).toUpperCase()}-203`,
        eventId: currentEvent.id,
        eventTitle: currentEvent.title,
        eventDate: currentEvent.date,
        eventTime: currentEvent.time,
        eventVenue: currentEvent.location,
        buyerName: 'Sneha Roy',
        buyerEmail: 'sneha.roy@example.com',
        buyerPhone: '+91 97115 88203',
        childName: 'Kabir Roy',
        childAge: 4,
        ticketTierName: 'Early Bird Family Pass',
        quantity: 2,
        amountPaid: currentEvent.ticketPrice ? currentEvent.ticketPrice * 2 : 598,
        checkedIn: true,
        checkedInAt: '09:45 AM',
        checkedInBy: 'Dynamic Gate QR',
        createdAt: new Date().toISOString()
      }
    ];

    setAttendees(sampleAttendees);
    localStorage.setItem(`vernunt_attendees_${currentEvent.id}`, JSON.stringify(sampleAttendees));
  }, [currentEvent.id, currentEvent.title, currentEvent.date, currentEvent.time, currentEvent.location, currentEvent.ticketPrice]);

  // Audio synthesizer for gate chime feedback
  const playAudioCue = (type: 'success' | 'expire' | 'generate') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        // Melodic ascending two-tone high chime (Gate Validated)
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc.frequency.setValueAtTime(987.77, ctx.currentTime + 0.08); // B5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'expire') {
        // Soft double-click / tick sound
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
      } else {
        // Subtle futuristic swoosh tone
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch {
      // Audio playback unavailable
    }
  };

  // Generate a new temporary, single-use dynamic QR code
  const generateDynamicQrCode = async () => {
    setIsGenerating(true);
    const now = Date.now();
    const tokenRandom = Math.random().toString(36).substring(2, 9).toUpperCase();
    const nonce = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = now + validitySeconds * 1000;
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://app.vernunt.com';

    const payload: DynamicTokenPayload = {
      type: 'GATE_CHECKIN_DYNAMIC',
      eventId: currentEvent.id,
      eventTitle: currentEvent.title,
      token: `CHK-${tokenRandom}`,
      nonce,
      issuedAt: now,
      expiresAt,
      validitySeconds,
      gateStationId: 'GATE-DESK-01',
      singleUse: true
    };

    // Construct URL for camera scans + JSON payload for app scanner
    const scanUrl = `${origin}/gate-checkin?eventId=${encodeURIComponent(currentEvent.id)}&token=${encodeURIComponent(payload.token)}&nonce=${encodeURIComponent(nonce)}&exp=${expiresAt}&singleUse=1`;

    try {
      const dataUrl = await QRCode.toDataURL(scanUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });

      setTokenPayload(payload);
      setQrDataUrl(dataUrl);
      setTokenStatus('ACTIVE');
      setSecondsRemaining(validitySeconds);
      setScannedAttendeeInfo(null);
      playAudioCue('generate');
    } catch (err) {
      console.error('Error generating QR code:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Initial generation when opened
  useEffect(() => {
    if (isOpen) {
      generateDynamicQrCode();
    }
  }, [isOpen, currentEvent.id, validitySeconds]);

  // Live Countdown Timer
  useEffect(() => {
    if (!isOpen || tokenStatus !== 'ACTIVE') return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Token expired!
          if (autoRefresh) {
            // Auto regenerate fresh token
            generateDynamicQrCode();
            return validitySeconds;
          } else {
            setTokenStatus('EXPIRED');
            playAudioCue('expire');
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, tokenStatus, autoRefresh, validitySeconds, currentEvent.id]);

  // Handle Attendee Check-In Simulation (or live attendee scan trigger)
  const handleSimulateAttendeeScan = (attendeeToScan?: EventAttendee) => {
    if (tokenStatus !== 'ACTIVE' || !tokenPayload) return;

    // Pick target attendee: provided, or selected in dropdown, or next pending attendee
    const target = attendeeToScan || 
      attendees.find(a => a.id === selectedSimAttendeeId) || 
      attendees.find(a => !a.checkedIn) || 
      attendees[0];

    if (!target) return;

    const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedAttendees = attendees.map(a => {
      if (a.id === target.id) {
        return {
          ...a,
          checkedIn: true,
          checkedInAt: nowFormatted,
          checkedInBy: 'Gate Dynamic QR (Single-Use)'
        };
      }
      return a;
    });

    setAttendees(updatedAttendees);
    localStorage.setItem(`vernunt_attendees_${currentEvent.id}`, JSON.stringify(updatedAttendees));

    // Consume the token (single-use burned!)
    setTokenStatus('SCANNED');
    setScannedAttendeeInfo({
      ...target,
      checkedIn: true,
      checkedInAt: nowFormatted,
      checkedInBy: 'Gate Dynamic QR (Single-Use)'
    });

    // Audio & celebratory cues
    playAudioCue('success');
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // Confetti fallback
    }

    // Auto-generate next token after 2.5 seconds so next attendee can step up
    setTimeout(() => {
      generateDynamicQrCode();
    }, 2800);
  };

  // Copy shareable gate link
  const handleCopyLink = () => {
    if (!tokenPayload) return;
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://app.vernunt.com';
    const scanUrl = `${origin}/gate-checkin?eventId=${encodeURIComponent(currentEvent.id)}&token=${encodeURIComponent(tokenPayload.token)}&exp=${tokenPayload.expiresAt}&singleUse=1`;
    navigator.clipboard.writeText(scanUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // Toggle fullscreen mode
  const handleToggleFullscreen = () => {
    setIsFullScreen(prev => !prev);
  };

  // Stats calculations
  const stats = useMemo(() => {
    const total = attendees.length;
    const checkedIn = attendees.filter(a => a.checkedIn).length;
    const pending = total - checkedIn;
    const percentage = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
    return { total, checkedIn, pending, percentage };
  }, [attendees]);

  // Unchecked attendees list for test simulation
  const pendingAttendees = useMemo(() => {
    return attendees.filter(a => !a.checkedIn);
  }, [attendees]);

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in ${
        isFullScreen ? 'p-0' : ''
      }`}
    >
      <div 
        ref={modalRef}
        className={`relative w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 ${
          isFullScreen 
            ? 'h-screen max-w-none rounded-none border-none' 
            : 'max-w-3xl max-h-[92vh]'
        }`}
      >
        {/* TOP NAVIGATION / HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 text-white p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300 shrink-0 shadow-inner">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-rose-500/30 text-rose-200 border border-rose-400/30 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Dynamic Gate Check-In QR
                </span>
                <span className="bg-amber-500/20 text-amber-200 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  🛡️ Single-Use Token
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white font-serif truncate mt-0.5">
                {currentEvent.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(prev => !prev)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
              title={soundEnabled ? 'Mute gate audio' : 'Enable gate audio'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
              title={isFullScreen ? 'Exit fullscreen gate monitor' : 'Expand to gate kiosk mode'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-600/80 text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* EVENT SELECTION DROPDOWN & TABS */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* If organizer has multiple events */}
          {allEvents.length > 1 ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold shrink-0">Switch Event:</span>
              <select
                value={currentEvent.id}
                onChange={(e) => {
                  const found = allEvents.find(ev => ev.id === e.target.value);
                  if (found) {
                    setCurrentEvent(found);
                    if (onSelectEvent) onSelectEvent(found);
                  }
                }}
                className="bg-white border border-slate-200 text-slate-800 font-medium py-1 px-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 max-w-xs text-xs"
              >
                {allEvents.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.date})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentEvent.date} • {currentEvent.time}</span>
              <span className="text-slate-300">|</span>
              <span className="truncate max-w-[200px] text-slate-500">{currentEvent.location}</span>
            </div>
          )}

          {/* Sub-tabs */}
          <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                activeTab === 'qr' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dynamic QR Gate
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('recent_scans')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'recent_scans' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Attendees ({stats.checkedIn}/{stats.total})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('gate_settings')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                activeTab === 'gate_settings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Settings
            </button>
          </div>
        </div>

        {/* MODAL MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'qr' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* LEFT / CENTER: THE DYNAMIC QR CODE DISPLAY */}
              <div className="md:col-span-7 flex flex-col items-center justify-center space-y-4">
                {/* QR Display Card */}
                <div className="relative w-full max-w-sm bg-gradient-to-b from-white to-slate-50 border-2 border-slate-200/90 rounded-3xl p-5 shadow-lg flex flex-col items-center text-center">
                  
                  {/* Status Banner */}
                  <div className="w-full flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        tokenStatus === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' :
                        tokenStatus === 'SCANNED' ? 'bg-blue-500' : 'bg-red-500'
                      }`} />
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                        {tokenStatus === 'ACTIVE' && 'Live Gate Passcode'}
                        {tokenStatus === 'SCANNED' && 'Verified & Consumed!'}
                        {tokenStatus === 'EXPIRED' && 'Token Expired'}
                      </span>
                    </div>

                    {/* Expiration Badge */}
                    <div className="flex items-center gap-1 text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                      <Clock className="w-3 h-3 text-rose-500" />
                      <span>{secondsRemaining}s</span>
                    </div>
                  </div>

                  {/* QR Image Box */}
                  <div className="relative w-64 h-64 sm:w-72 sm:h-72 bg-white rounded-2xl border border-slate-200 p-2.5 shadow-inner flex items-center justify-center overflow-hidden">
                    {qrDataUrl && tokenStatus === 'ACTIVE' && (
                      <img 
                        src={qrDataUrl} 
                        alt="Gate Dynamic Check-In QR" 
                        className="w-full h-full object-contain animate-scale-up"
                      />
                    )}

                    {/* Scanned / Used Overlay */}
                    {tokenStatus === 'SCANNED' && (
                      <div className="absolute inset-0 bg-emerald-600/95 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-white text-center animate-fade-in">
                        <div className="w-16 h-16 rounded-full bg-white text-emerald-600 flex items-center justify-center mb-3 shadow-lg animate-bounce">
                          <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h4 className="font-serif font-black text-lg">Check-In Approved!</h4>
                        <p className="text-xs text-emerald-100 mt-1 max-w-[200px]">
                          {scannedAttendeeInfo ? scannedAttendeeInfo.buyerName : 'Attendee verified successfully.'}
                        </p>
                        <span className="text-[10px] bg-emerald-700/80 px-2 py-0.5 rounded-full mt-2 font-mono">
                          Generating next single-use QR...
                        </span>
                      </div>
                    )}

                    {/* Expired Overlay */}
                    {tokenStatus === 'EXPIRED' && (
                      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-white text-center animate-fade-in space-y-2">
                        <AlertCircle className="w-10 h-10 text-amber-400 mb-1" />
                        <h4 className="font-serif font-bold text-base">QR Token Expired</h4>
                        <p className="text-[11px] text-slate-300 max-w-[200px]">
                          Temporary token expired for security. Click to refresh.
                        </p>
                        <button
                          type="button"
                          onClick={generateDynamicQrCode}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Generate New QR</span>
                        </button>
                      </div>
                    )}

                    {/* Loading spinner */}
                    {isGenerating && (
                      <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center space-y-2">
                        <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
                        <span className="text-xs font-bold text-slate-600">Generating secure token...</span>
                      </div>
                    )}
                  </div>

                  {/* Countdown Progress Bar */}
                  <div className="w-full mt-3 space-y-1">
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          secondsRemaining > 15 ? 'bg-emerald-500' :
                          secondsRemaining > 5 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${(secondsRemaining / validitySeconds) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>Token: {tokenPayload?.token || '---'}</span>
                      <span>Auto-Refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
                    </div>
                  </div>

                  {/* Gate Instructions Subtext */}
                  <div className="mt-3 bg-amber-50/70 border border-amber-200/60 rounded-xl p-2.5 text-left text-[11px] text-amber-900 w-full flex items-start gap-2">
                    <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Dynamic Security Guarantee:</strong>
                      <span>This QR code is single-use and automatically refreshes every {validitySeconds} seconds to prevent unauthorized screenshots or gate pass sharing.</span>
                    </div>
                  </div>

                  {/* Manual Action Buttons */}
                  <div className="w-full flex items-center gap-2 mt-3 pt-2 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={generateDynamicQrCode}
                      disabled={isGenerating}
                      className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                      <span>Refresh Now</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      title="Copy check-in link"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                    </button>

                    {onOpenScanner && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenScanner();
                        }}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        title="Switch to camera badge scanner"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Camera Scan</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT: ATTENDEE SCAN SIMULATOR & GATE CONTROLS */}
              <div className="md:col-span-5 space-y-4">
                {/* Gate Live Stats Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 font-serif">
                      Gate Attendance Status
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      {stats.percentage}% Checked In
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Total</span>
                      <strong className="text-base font-black text-slate-800">{stats.total}</strong>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-emerald-800 shadow-xs">
                      <span className="text-[10px] text-emerald-600 font-bold block uppercase">Checked In</span>
                      <strong className="text-base font-black">{stats.checkedIn}</strong>
                    </div>
                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-800 shadow-xs">
                      <span className="text-[10px] text-amber-600 font-bold block uppercase">Pending</span>
                      <strong className="text-base font-black">{stats.pending}</strong>
                    </div>
                  </div>
                </div>

                {/* SIMULATE ATTENDEE SCANNING AT GATE */}
                <div className="bg-white border-2 border-dashed border-rose-200 rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-rose-800">
                    <Sparkles className="w-4 h-4 text-rose-600 shrink-0" />
                    <h4 className="text-xs font-black uppercase tracking-wider font-serif">
                      Simulate Gate Attendee Scan
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Test the single-use dynamic QR flow instantly by simulating an arriving parent scanning the code at the gate terminal.
                  </p>

                  {pendingAttendees.length > 0 ? (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Select Arriving Attendee in Queue:
                      </label>
                      <select
                        value={selectedSimAttendeeId}
                        onChange={(e) => setSelectedSimAttendeeId(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 font-medium"
                      >
                        <option value="">Next in queue ({pendingAttendees[0]?.buyerName})</option>
                        {pendingAttendees.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.buyerName} ({a.ticketTierName} - {a.ticketNumber})
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleSimulateAttendeeScan()}
                        disabled={tokenStatus !== 'ACTIVE'}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Simulate Attendee Scan at Gate</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>All registered attendees have checked in!</span>
                    </div>
                  )}
                </div>

                {/* RECENT CHECK-INS FEED */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                  <h4 className="text-xs font-extrabold text-slate-700 flex items-center justify-between">
                    <span>Recent Gate Check-Ins</span>
                    <span className="text-[10px] text-slate-400 font-normal">Live Log</span>
                  </h4>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {attendees.filter(a => a.checkedIn).length === 0 ? (
                      <p className="text-center py-4 text-xs text-slate-400 italic">
                        No attendees checked in yet today.
                      </p>
                    ) : (
                      attendees
                        .filter(a => a.checkedIn)
                        .slice(0, 5)
                        .map(a => (
                          <div 
                            key={a.id} 
                            className="bg-white border border-slate-100 rounded-xl p-2 flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0">
                              <span className="font-bold text-slate-800 block truncate">{a.buyerName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{a.ticketTierName}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 block">
                                {a.checkedInAt || 'Checked In'}
                              </span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: RECENT SCANS & FULL ROSTER */}
          {activeTab === 'recent_scans' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-black text-slate-900 text-sm">
                    Live Gate Attendee Roster ({stats.total} Passes)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Full verification status for {currentEvent.title}.
                  </p>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-xl border border-emerald-200">
                    Checked In: {stats.checkedIn}
                  </span>
                  <span className="bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-xl border border-amber-200">
                    Pending: {stats.pending}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="p-3">Attendee Name</th>
                      <th className="p-3">Ticket #</th>
                      <th className="p-3">Tier</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendees.map(attendee => (
                      <tr key={attendee.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <strong className="block text-slate-800">{attendee.buyerName}</strong>
                          <span className="text-[10px] text-slate-400">{attendee.buyerPhone}</span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">
                          {attendee.ticketNumber}
                        </td>
                        <td className="p-3 text-slate-600">
                          {attendee.ticketTierName}
                        </td>
                        <td className="p-3">
                          {attendee.checkedIn ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <Check className="w-3 h-3" />
                              {attendee.checkedInAt || 'Checked In'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <Clock className="w-3 h-3" />
                              Pending Arrival
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {!attendee.checkedIn ? (
                            <button
                              type="button"
                              onClick={() => handleSimulateAttendeeScan(attendee)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              Check In
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Done</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: GATE SETTINGS */}
          {activeTab === 'gate_settings' && (
            <div className="space-y-5 max-w-lg mx-auto bg-slate-50 border border-slate-200 rounded-3xl p-5 text-xs text-slate-700">
              <h3 className="font-serif font-black text-slate-900 text-sm">
                Gate QR Code Security & Display Settings
              </h3>

              <div className="space-y-4">
                {/* Validity Window */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Temporary QR Expiration Window:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[20, 30, 60].map(secs => (
                      <button
                        key={secs}
                        type="button"
                        onClick={() => {
                          setValiditySeconds(secs);
                          setSecondsRemaining(secs);
                        }}
                        className={`py-2 px-3 rounded-xl font-bold border transition cursor-pointer ${
                          validitySeconds === secs 
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs' 
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {secs} Seconds
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Shorter intervals guarantee higher security by expiring screenshots before they can be forwarded.
                  </p>
                </div>

                {/* Auto Refresh Toggle */}
                <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200">
                  <div>
                    <strong className="block font-bold text-slate-800">Auto-Rotate Dynamic QR</strong>
                    <span className="text-[11px] text-slate-500">Automatically generate a new code when timer reaches zero.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoRefresh(prev => !prev)}
                    className={`w-12 h-6 rounded-full transition p-0.5 cursor-pointer ${
                      autoRefresh ? 'bg-rose-600' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition transform ${
                      autoRefresh ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Audio Feedback */}
                <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200">
                  <div>
                    <strong className="block font-bold text-slate-800">Gate Verification Tone</strong>
                    <span className="text-[11px] text-slate-500">Play pleasant ascending chime when an attendee checks in.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(prev => !prev)}
                    className={`w-12 h-6 rounded-full transition p-0.5 cursor-pointer ${
                      soundEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition transform ${
                      soundEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 border-t border-slate-200 p-3.5 sm:p-4 px-6 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Vernunt Zero-Trust Gate Verification Engine</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={generateDynamicQrCode}
              className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate QR</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
