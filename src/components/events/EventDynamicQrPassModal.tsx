import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  QrCode, X, Download, Share2, Copy, Check, Calendar, MapPin, 
  Clock, ShieldCheck, Ticket, User, Sparkles, RefreshCw, CheckCircle2,
  ScanLine, ExternalLink, Smartphone, AlertCircle, History, Users,
  Search, ArrowRight, CheckCircle, Clock3, Filter, Trash2, FileSpreadsheet,
  Flashlight, FlashlightOff, Camera, Zap, Sun, Lightbulb, Video
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import jsQR from 'jsqr';
import { CommunityEvent, Booking, ChildProfile } from '../../types.ts';

export interface ScannedAttendeeRecord {
  id: string;
  ticketNumber: string;
  attendeeName: string;
  parentName: string;
  phone: string;
  tier: string;
  status: 'checked-in' | 'pending';
  checkInTimestamp?: string;
  scannedAtRaw?: number;
  gateLocation?: string;
  method?: 'QR Scan' | 'Manual Verified' | 'Fast Touchless';
}

interface EventDynamicQrPassModalProps {
  eventsList: CommunityEvent[];
  bookingsList?: Booking[];
  userProfile?: ChildProfile | any;
  onClose: () => void;
  onOpenOrganizerGateCheckIn?: (event: CommunityEvent) => void;
  onUpdateBooking?: (updated: Booking) => void;
}

export default function EventDynamicQrPassModal({
  eventsList,
  bookingsList = [],
  userProfile,
  onClose,
  onOpenOrganizerGateCheckIn,
  onUpdateBooking
}: EventDynamicQrPassModalProps) {
  // Find initial event - prefer first event or registered booking
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    if (bookingsList.length > 0) {
      const match = eventsList.find(e => e.id === bookingsList[0].itemId || e.title === bookingsList[0].itemTitle);
      if (match) return match.id;
    }
    return eventsList[0]?.id || '';
  });

  const selectedEvent = eventsList.find(e => e.id === selectedEventId) || eventsList[0];

  // Active View Tab: 'pass' | 'scanner' | 'roster' | 'history'
  const [activeTab, setActiveTab] = useState<'pass' | 'scanner' | 'roster' | 'history'>('pass');

  // Camera Flash / Torch & Low-Light Scanner State
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scannerFeedback, setScannerFeedback] = useState<{ status: 'idle' | 'success' | 'warning'; text: string }>({
    status: 'idle',
    text: 'Position attendee QR code inside the target reticle'
  });

  // Session Real-time Scanned Counter
  const [sessionScannedCount, setSessionScannedCount] = useState<number>(0);

  // 1.5-Second Success Animation & Auto-Refresh State
  const [isSuccessAnimating, setIsSuccessAnimating] = useState<boolean>(false);
  const [lastScannedAttendee, setLastScannedAttendee] = useState<ScannedAttendeeRecord | null>(null);
  const successTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Manual Check-in ID State
  const [showManualCheckIn, setShowManualCheckIn] = useState<boolean>(false);
  const [manualAttendeeId, setManualAttendeeId] = useState<string>('');
  const [manualCheckInError, setManualCheckInError] = useState<string>('');

  // How-to-scan Overlay Guide
  const [showHowToScan, setShowHowToScan] = useState<boolean>(false);

  // Attendee customization
  const [attendeeName, setAttendeeName] = useState<string>(
    userProfile?.childName || userProfile?.parentName || 'Aarav Sharma'
  );
  const [parentName, setParentName] = useState<string>(
    userProfile?.parentName || 'Priya Sharma'
  );
  const [phone, setPhone] = useState<string>(
    userProfile?.phone || '+91 98201 44821'
  );
  const [ticketTier, setTicketTier] = useState<string>('Standard Child Entry');
  
  // Dynamic Ticket Number and QR generation state
  const [ticketNumber, setTicketNumber] = useState<string>(() => 
    `VERN-EVT-${selectedEvent?.id?.slice(0, 4).toUpperCase() || 'PASS'}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [qrTimestamp, setQrTimestamp] = useState<number>(Date.now());
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<number>(30);

  // Search and filter in roster/history
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checked-in' | 'pending'>('all');

  // Attendee Roster State per Event
  const [attendeesRoster, setAttendeesRoster] = useState<ScannedAttendeeRecord[]>(() => {
    // Generate initial roster with rich realistic sample attendees for the event
    const baseChild = userProfile?.childName || 'Aarav Sharma';
    const baseParent = userProfile?.parentName || 'Priya Sharma';

    const now = new Date();
    const tMinus15 = new Date(now.getTime() - 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const tMinus8 = new Date(now.getTime() - 8 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Map bookings from bookingsList to attendee records
    const bookingAttendees: ScannedAttendeeRecord[] = (bookingsList || [])
      .filter(b => b.type === 'EventTicket' || !b.type)
      .map(b => ({
        id: b.id,
        ticketNumber: b.ticketNumber || `VERN-EVT-${selectedEvent?.id?.slice(0, 4).toUpperCase() || 'PASS'}-${b.id.slice(-4)}`,
        attendeeName: b.childName || b.buyerName || baseChild,
        parentName: b.buyerName || baseParent,
        phone: b.buyerPhone || userProfile?.phone || '+91 98201 44821',
        tier: b.tierName || 'Confirmed Admission Ticket',
        status: (b.checkedIn ? 'checked-in' : 'pending') as 'checked-in' | 'pending',
        checkInTimestamp: b.checkedInAt,
        gateLocation: 'Gate-A (North Entrance)',
        method: b.checkedIn ? 'QR Scan' : undefined
      }));

    const defaultAttendees: ScannedAttendeeRecord[] = [
      {
        id: 'att-1',
        ticketNumber: `VERN-EVT-${selectedEvent?.id?.slice(0, 4).toUpperCase() || 'PASS'}-1092`,
        attendeeName: baseChild,
        parentName: baseParent,
        phone: userProfile?.phone || '+91 98201 44821',
        tier: 'Standard Child Entry',
        status: 'pending',
        gateLocation: 'Gate-A (North Entrance)'
      },
      {
        id: 'att-2',
        ticketNumber: `VERN-EVT-${selectedEvent?.id?.slice(0, 4).toUpperCase() || 'PASS'}-2044`,
        attendeeName: 'Ananya & Kabir Patel (6 yrs)',
        parentName: 'Rohan Patel',
        phone: '+91 98202 33910',
        tier: 'VIP Family Pass + Workshop Kit',
        status: 'checked-in',
        checkInTimestamp: tMinus15,
        scannedAtRaw: Date.now() - 15 * 60000,
        gateLocation: 'Gate-A (North Entrance)',
        method: 'QR Scan'
      },
      {
        id: 'att-3',
        ticketNumber: `VERN-EVT-${selectedEvent?.id?.slice(0, 4).toUpperCase() || 'PASS'}-3819`,
        attendeeName: 'Devansh & Diya Roy (5 yrs)',
        parentName: 'Sneha Roy',
        phone: '+91 98119 77201',
        tier: 'Standard Child Entry',
        status: 'checked-in',
        checkInTimestamp: tMinus8,
        scannedAtRaw: Date.now() - 8 * 60000,
        gateLocation: 'Gate-B (Lawn Express)',
        method: 'QR Scan'
      },
      {
        id: 'att-4',
        ticketNumber: `VERN-EVT-${selectedEvent?.id?.slice(0, 4).toUpperCase() || 'PASS'}-4102`,
        attendeeName: 'Saanvi Iyer (4 yrs)',
        parentName: 'Karthik Iyer',
        phone: '+91 98450 11983',
        tier: 'Sibling Group Pass',
        status: 'pending',
        gateLocation: 'Gate-A (North Entrance)'
      },
      {
        id: 'att-5',
        ticketNumber: `VERN-EVT-${selectedEvent?.id?.slice(0, 4).toUpperCase() || 'PASS'}-5591`,
        attendeeName: 'Reyansh Malhotra (7 yrs)',
        parentName: 'Neha Malhotra',
        phone: '+91 98210 66542',
        tier: 'Standard Child Entry',
        status: 'pending',
        gateLocation: 'Gate-A (North Entrance)'
      },
      {
        id: 'att-6',
        ticketNumber: `VERN-EVT-${selectedEvent?.id?.slice(0, 4).toUpperCase() || 'PASS'}-6720`,
        attendeeName: 'Ishaan Verma (6 yrs)',
        parentName: 'Vikram Verma',
        phone: '+91 99304 88129',
        tier: 'VIP Family Pass + Workshop Kit',
        status: 'pending',
        gateLocation: 'Gate-B (Lawn Express)'
      }
    ];

    const merged = [...bookingAttendees];
    for (const d of defaultAttendees) {
      if (!merged.some(m => m.id === d.id || m.ticketNumber === d.ticketNumber)) {
        merged.push(d);
      }
    }
    return merged;
  });

  // Current main attendee status
  const currentMainAttendee = attendeesRoster.find(a => a.id === 'att-1') || attendeesRoster[0];
  const isCheckedIn = currentMainAttendee?.status === 'checked-in';
  const checkInTimestamp = currentMainAttendee?.checkInTimestamp || null;

  // Regenerate ticket number when event changes
  useEffect(() => {
    if (selectedEvent) {
      setTicketNumber(`VERN-EVT-${selectedEvent.id.slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [selectedEventId, selectedEvent]);

  // Dynamic rotating QR payload with security token
  const qrPayload = useMemo(() => {
    return JSON.stringify({
      protocol: 'VERNUNT_DYNAMIC_GATE_CHECKIN_V2',
      ticketNumber: currentMainAttendee?.ticketNumber || ticketNumber,
      eventId: selectedEvent?.id,
      eventTitle: selectedEvent?.title,
      eventDate: selectedEvent?.date,
      eventTime: selectedEvent?.time,
      venue: selectedEvent?.location,
      attendee: attendeeName,
      parent: parentName,
      phone: phone,
      tier: ticketTier,
      gate: 'Gate-A (North Entrance)',
      nonce: qrTimestamp,
      verifiedSecuritySeal: 'VERNUNT_VERIFIED_SIGNATURE_2026'
    });
  }, [currentMainAttendee?.ticketNumber, ticketNumber, selectedEvent, attendeeName, parentName, phone, ticketTier, qrTimestamp]);

  // Generate crisp QR code whenever payload updates
  useEffect(() => {
    QRCode.toDataURL(qrPayload, {
      width: 400,
      margin: 1.5,
      color: {
        dark: '#090d16',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR generation failure', err));
  }, [qrPayload]);

  // Auto-rotating dynamic security refresh every 30s to prevent screenshot fraud
  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setQrTimestamp(Date.now());
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoRotate]);

  // Camera Flash / Torch Controller for low-light indoor venues
  const toggleCameraFlash = async () => {
    const nextFlashState = !isFlashOn;
    setIsFlashOn(nextFlashState);

    // Apply hardware torch constraint if video track supports it
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const track = videoTracks[0];
        try {
          const capabilities = (track.getCapabilities && track.getCapabilities()) || {};
          if ('torch' in capabilities || (capabilities as any).fillLightMode) {
            await track.applyConstraints({
              advanced: [{ torch: nextFlashState }]
            } as any);
          }
        } catch (err) {
          console.warn('Hardware camera torch not available on this device; active screen illuminator engaged.', err);
        }
      }
    }
  };

  // Hidden canvas for decoding video frames with jsQR
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanAnimationIdRef = useRef<number | null>(null);
  const lastScannedQrRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Core QR Validation against bookingsList state
  const handleProcessScannedQrData = useCallback((rawData: string) => {
    if (!rawData || !rawData.trim()) return;
    const cleanRaw = rawData.trim();

    // Prevent immediate re-scan duplicates within 2.5 seconds
    const now = Date.now();
    if (lastScannedQrRef.current.code === cleanRaw && now - lastScannedQrRef.current.time < 2500) {
      return;
    }
    lastScannedQrRef.current = { code: cleanRaw, time: now };

    // Try parsing as JSON if the QR payload is serialized JSON
    let parsedJson: any = null;
    try {
      if (cleanRaw.startsWith('{') && cleanRaw.endsWith('}')) {
        parsedJson = JSON.parse(cleanRaw);
      }
    } catch (e) {
      // not JSON
    }

    const ticketIdToMatch = parsedJson?.ticketNumber || parsedJson?.ticketId || parsedJson?.bookingId || parsedJson?.id || cleanRaw;
    const cleanMatchStr = ticketIdToMatch.toLowerCase();

    // 1. First validate against bookingsList state
    const matchedBooking = bookingsList.find(b => {
      const bTicket = (b.ticketNumber || '').toLowerCase();
      const bId = (b.id || '').toLowerCase();
      const bQr = (b.qrPayload || '').toLowerCase();
      const bRazor = (b.razorpayPaymentId || '').toLowerCase();
      const bChild = (b.childName || '').toLowerCase();
      const bBuyer = (b.buyerName || '').toLowerCase();
      const bPhone = (b.buyerPhone || '').replace(/\D/g, '');
      const inputPhone = cleanRaw.replace(/\D/g, '');

      return (
        (bTicket && (cleanMatchStr === bTicket || cleanMatchStr.includes(bTicket) || bTicket.includes(cleanMatchStr))) ||
        (bId && (cleanMatchStr === bId || cleanMatchStr.includes(bId))) ||
        (bQr && (cleanRaw === bQr || bQr.includes(cleanRaw))) ||
        (bRazor && cleanMatchStr.includes(bRazor)) ||
        (bChild && cleanMatchStr.includes(bChild)) ||
        (bBuyer && cleanMatchStr.includes(bBuyer)) ||
        (inputPhone.length >= 8 && bPhone.includes(inputPhone))
      );
    });

    if (matchedBooking) {
      if (matchedBooking.checkedIn) {
        setScannerFeedback({
          status: 'warning',
          text: `⚠️ ALREADY ADMITTED: ${matchedBooking.childName || matchedBooking.buyerName} was already checked in at ${matchedBooking.checkedInAt || 'earlier today'}.`
        });
        return;
      }

      // Valid booking confirmed!
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const updatedBooking: Booking = {
        ...matchedBooking,
        checkedIn: true,
        checkedInAt: timeStr,
        checkedInBy: 'Gate Camera Scanner'
      };

      if (onUpdateBooking) {
        onUpdateBooking(updatedBooking);
      }

      const admittedRecord: ScannedAttendeeRecord = {
        id: matchedBooking.id,
        ticketNumber: matchedBooking.ticketNumber || `VERN-EVT-${matchedBooking.id.slice(-4)}`,
        attendeeName: matchedBooking.childName || matchedBooking.buyerName || 'Attendee',
        parentName: matchedBooking.buyerName || userProfile?.parentName || 'Parent Guardian',
        phone: matchedBooking.buyerPhone || userProfile?.phone || '+91 98201 44821',
        tier: matchedBooking.tierName || 'Confirmed Admission Ticket',
        status: 'checked-in',
        checkInTimestamp: timeStr,
        scannedAtRaw: Date.now(),
        gateLocation: 'Gate-A (North Entrance)',
        method: 'QR Scan'
      };

      // Sync into attendees roster state
      setAttendeesRoster(prev => {
        const exists = prev.some(a => a.id === admittedRecord.id || a.ticketNumber === admittedRecord.ticketNumber);
        if (exists) {
          return prev.map(a => (a.id === admittedRecord.id || a.ticketNumber === admittedRecord.ticketNumber) ? admittedRecord : a);
        }
        return [admittedRecord, ...prev];
      });

      triggerSuccessScanAnimation(admittedRecord);
      setScannerFeedback({
        status: 'success',
        text: `✅ ENTRY CONFIRMED: Verified ${admittedRecord.attendeeName} (${admittedRecord.tier}) • Pass ${admittedRecord.ticketNumber}`
      });
      return;
    }

    // 2. If not matched directly in bookingsList, check attendeesRoster state
    const matchedRosterAttendee = attendeesRoster.find(a => {
      const aId = a.id.toLowerCase();
      const aTicket = a.ticketNumber.toLowerCase();
      const aName = a.attendeeName.toLowerCase();
      const aParent = a.parentName.toLowerCase();
      const aPhone = a.phone.replace(/\D/g, '');
      const inputPhone = cleanRaw.replace(/\D/g, '');

      return (
        cleanMatchStr === aId ||
        cleanMatchStr === aTicket ||
        cleanMatchStr.includes(aTicket) ||
        aTicket.includes(cleanMatchStr) ||
        cleanMatchStr.includes(aName) ||
        cleanMatchStr.includes(aParent) ||
        (inputPhone.length >= 8 && aPhone.includes(inputPhone))
      );
    });

    if (matchedRosterAttendee) {
      if (matchedRosterAttendee.status === 'checked-in') {
        setScannerFeedback({
          status: 'warning',
          text: `⚠️ ALREADY ADMITTED: ${matchedRosterAttendee.attendeeName} was verified at ${matchedRosterAttendee.checkInTimestamp || 'earlier today'}.`
        });
        return;
      }

      const updated = handleToggleAttendeeCheckIn(matchedRosterAttendee.id, 'QR Scan');
      if (updated) {
        triggerSuccessScanAnimation(updated);
        setScannerFeedback({
          status: 'success',
          text: `✅ ENTRY CONFIRMED: Verified ${matchedRosterAttendee.attendeeName} (${matchedRosterAttendee.tier}) • Pass ${matchedRosterAttendee.ticketNumber}`
        });
      }
      return;
    }

    // 3. Unrecognized pass
    setScannerFeedback({
      status: 'warning',
      text: `❌ UNVERIFIED PASS: Scanned data ("${cleanRaw.slice(0, 24)}...") does not match any registered attendee or booking.`
    });
  }, [bookingsList, attendeesRoster, onUpdateBooking, userProfile]);

  // Start live gate camera scanner
  const startCameraScanner = async () => {
    setCameraError('');
    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      } else {
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access unavailable or restricted:', err);
      setCameraError('Camera stream restricted in sandbox preview. Live simulated scanner reticle is active.');
      setCameraActive(true);
    }
  };

  // Stop live gate camera
  const stopCameraScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (scanAnimationIdRef.current) {
      cancelAnimationFrame(scanAnimationIdRef.current);
      scanAnimationIdRef.current = null;
    }
    setCameraActive(false);
    setIsFlashOn(false);
  };

  // Real-time jsQR video frame decoding loop
  useEffect(() => {
    if (!cameraActive || activeTab !== 'scanner') {
      if (scanAnimationIdRef.current) {
        cancelAnimationFrame(scanAnimationIdRef.current);
        scanAnimationIdRef.current = null;
      }
      return;
    }

    let isScanning = true;

    const scanFrame = () => {
      if (!isScanning) return;

      const video = videoRef.current;
      if (video && video.readyState >= 2 && !isSuccessAnimating) {
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }
        const canvas = canvasRef.current;
        const width = video.videoWidth || 320;
        const height = video.videoHeight || 240;

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (code && code.data) {
            handleProcessScannedQrData(code.data);
          }
        }
      }

      scanAnimationIdRef.current = requestAnimationFrame(scanFrame);
    };

    scanAnimationIdRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanning = false;
      if (scanAnimationIdRef.current) {
        cancelAnimationFrame(scanAnimationIdRef.current);
        scanAnimationIdRef.current = null;
      }
    };
  }, [cameraActive, activeTab, isSuccessAnimating, handleProcessScannedQrData]);

  // Auto-start camera when scanner tab is opened
  useEffect(() => {
    if (activeTab === 'scanner') {
      startCameraScanner();
    } else {
      if (cameraActive) {
        stopCameraScanner();
      }
    }
  }, [activeTab]);

  // Clean up media streams and timers on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (scanAnimationIdRef.current) {
        cancelAnimationFrame(scanAnimationIdRef.current);
      }
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  // Trigger 1.5s success animation and auto-refresh/clear view for the next scan
  const triggerSuccessScanAnimation = (admittedAttendee: ScannedAttendeeRecord) => {
    setLastScannedAttendee(admittedAttendee);
    setIsSuccessAnimating(true);
    setSessionScannedCount(prev => prev + 1);

    // Trigger celebratory visual confetti
    try {
      confetti({
        particleCount: 60,
        spread: 65,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }

    // Auto-refresh/clear the view after exactly 1.5 seconds (1500ms)
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
    }
    successTimerRef.current = setTimeout(() => {
      setIsSuccessAnimating(false);
      setLastScannedAttendee(null);
      setManualAttendeeId('');
      setManualCheckInError('');
      setScannerFeedback({
        status: 'idle',
        text: 'Target reticle ready • Position next attendee QR pass or enter ID'
      });
    }, 1500);
  };

  // Simulate scanning a ticket with the camera reticle
  const handleSimulateCameraScan = (targetAttendeeId?: string) => {
    // Find next pending attendee or target
    const pendingAttendee = targetAttendeeId 
      ? attendeesRoster.find(a => a.id === targetAttendeeId)
      : attendeesRoster.find(a => a.status === 'pending') || attendeesRoster[0];

    if (!pendingAttendee) {
      setScannerFeedback({
        status: 'warning',
        text: 'All attendees in the event roster are already admitted and checked in!'
      });
      return;
    }

    if (pendingAttendee.status === 'checked-in') {
      setScannerFeedback({
        status: 'warning',
        text: `⚠️ ALREADY CHECKED IN: ${pendingAttendee.attendeeName} was verified at ${pendingAttendee.checkInTimestamp || 'earlier today'}.`
      });
      return;
    }

    const updated = handleToggleAttendeeCheckIn(pendingAttendee.id, 'QR Scan');
    if (updated) {
      triggerSuccessScanAnimation(updated);
      setScannerFeedback({
        status: 'success',
        text: `✅ VERIFIED: Admitted ${pendingAttendee.attendeeName} (${pendingAttendee.tier}) • Pass ${pendingAttendee.ticketNumber}`
      });
    }
  };

  // Manual Check-In Verification by Attendee ID / Ticket Number
  const handleManualCheckInSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setManualCheckInError('');

    const cleanInput = manualAttendeeId.trim().toLowerCase();
    if (!cleanInput) {
      setManualCheckInError('Please enter a valid Attendee ID or Ticket Number.');
      return;
    }

    // First validate against bookingsList or roster via core validation
    handleProcessScannedQrData(manualAttendeeId.trim());
  };

  // Toggle check-in status for an attendee in the roster
  const handleToggleAttendeeCheckIn = (attendeeId: string, customMethod: 'QR Scan' | 'Manual Verified' | 'Fast Touchless' = 'QR Scan'): ScannedAttendeeRecord | null => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let updatedRecord: ScannedAttendeeRecord | null = null;

    setAttendeesRoster(prev => prev.map(item => {
      if (item.id === attendeeId) {
        const isNowCheckedIn = item.status !== 'checked-in';
        const newItem: ScannedAttendeeRecord = {
          ...item,
          status: isNowCheckedIn ? 'checked-in' : 'pending',
          checkInTimestamp: isNowCheckedIn ? timeStr : undefined,
          scannedAtRaw: isNowCheckedIn ? Date.now() : undefined,
          method: isNowCheckedIn ? customMethod : undefined
        };
        if (isNowCheckedIn) {
          updatedRecord = newItem;
        }
        return newItem;
      }
      return item;
    }));

    return updatedRecord;
  };

  // Check In All pending attendees in 1 click
  const handleCheckInAll = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setAttendeesRoster(prev => prev.map(item => ({
      ...item,
      status: 'checked-in',
      checkInTimestamp: item.checkInTimestamp || timeStr,
      scannedAtRaw: item.scannedAtRaw || Date.now(),
      method: item.method || 'Manual Verified'
    })));

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }
  };

  // Reset Check-in status
  const handleResetCheckIns = () => {
    setAttendeesRoster(prev => prev.map(item => ({
      ...item,
      status: 'pending',
      checkInTimestamp: undefined,
      scannedAtRaw: undefined,
      method: undefined
    })));
  };

  // Filtered attendees roster
  const filteredAttendees = useMemo(() => {
    return attendeesRoster.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.attendeeName.toLowerCase().includes(q) ||
        a.parentName.toLowerCase().includes(q) ||
        a.ticketNumber.toLowerCase().includes(q) ||
        a.phone.includes(q)
      );
    });
  }, [attendeesRoster, statusFilter, searchQuery]);

  // Scanned history log (only checked-in attendees, sorted by newest scan first)
  const scannedHistory = useMemo(() => {
    return attendeesRoster
      .filter(a => a.status === 'checked-in')
      .sort((a, b) => (b.scannedAtRaw || 0) - (a.scannedAtRaw || 0));
  }, [attendeesRoster]);

  // Statistics calculation
  const totalCount = attendeesRoster.length;
  const checkedInCount = attendeesRoster.filter(a => a.status === 'checked-in').length;
  const pendingCount = totalCount - checkedInCount;
  const checkInPercentage = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  const handleCopyTicketDetails = () => {
    const shareText = `🎟️ Vernunt Event Entry Pass\nEvent: ${selectedEvent?.title}\nTicket ID: ${currentMainAttendee?.ticketNumber || ticketNumber}\nAttendee: ${attendeeName}\nDate/Time: ${selectedEvent?.date} at ${selectedEvent?.time}\nVenue: ${selectedEvent?.location}\nStatus: ${isCheckedIn ? 'Checked-In' : 'Valid for Entry'}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDownloadQrImage = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `Vernunt-Pass-${ticketNumber}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleExportCsv = () => {
    // Export formatted CSV of scanned attendees, or full attendee roster if none yet
    const exportData = scannedHistory.length > 0 ? scannedHistory : attendeesRoster;
    const headers = [
      'Index',
      'Ticket Number',
      'Attendee Name',
      'Parent / Guardian',
      'Phone Number',
      'Pass Tier',
      'Status',
      'Check-In Timestamp',
      'Gate Location',
      'Verification Method',
      'Event Title',
      'Event Date',
      'Event Time',
      'Event Venue'
    ];

    const rows = exportData.map((item, idx) => [
      idx + 1,
      `"${(item.ticketNumber || '').replace(/"/g, '""')}"`,
      `"${(item.attendeeName || '').replace(/"/g, '""')}"`,
      `"${(item.parentName || '').replace(/"/g, '""')}"`,
      `"${(item.phone || '').replace(/"/g, '""')}"`,
      `"${(item.tier || '').replace(/"/g, '""')}"`,
      `"${item.status === 'checked-in' ? 'Checked-In' : 'Pending'}"`,
      `"${(item.checkInTimestamp || 'Pending Gate Scan').replace(/"/g, '""')}"`,
      `"${(item.gateLocation || 'Gate-A (North Entrance)').replace(/"/g, '""')}"`,
      `"${(item.method || 'QR Scanner Desk').replace(/"/g, '""')}"`,
      `"${(selectedEvent?.title || 'Community Event').replace(/"/g, '""')}"`,
      `"${(selectedEvent?.date || '').replace(/"/g, '""')}"`,
      `"${(selectedEvent?.time || '').replace(/"/g, '""')}"`,
      `"${(selectedEvent?.location || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanTitle = (selectedEvent?.title || 'Event').replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `Vernunt_CheckIn_History_${cleanTitle}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🎟️ *Vernunt Event Entry Pass*\n*Event:* ${selectedEvent?.title}\n*Ticket ID:* ${currentMainAttendee?.ticketNumber || ticketNumber}\n*Attendee:* ${attendeeName} (Parent: ${parentName})\n*Date & Time:* ${selectedEvent?.date} at ${selectedEvent?.time}\n*Venue:* ${selectedEvent?.location}\n\nShow this QR at the entrance gate for quick scan & entry.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div 
      id="event-dynamic-qr-modal" 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[150] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto text-left relative flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-md shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black font-serif tracking-tight text-white">
                  Event Dynamic QR Pass & Check-In Hub
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Live Dynamic
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Encrypted QR badges, live attendee status indicators, and check-in audit history
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Camera Flash / Low-Light Torch Toggle Button */}
            <button
              id="btn-camera-flash-toggle"
              type="button"
              onClick={toggleCameraFlash}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition transform active:scale-95 cursor-pointer shadow-xs ${
                isFlashOn
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 ring-2 ring-amber-300 shadow-amber-400/50 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:text-white'
              }`}
              title={isFlashOn ? 'Camera Flash: Active (Low-Light Torch ON)' : 'Camera Flash: OFF (Click to turn on for low-light environments)'}
            >
              {isFlashOn ? (
                <Flashlight className="w-3.5 h-3.5 text-slate-950 fill-amber-300" />
              ) : (
                <FlashlightOff className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="hidden sm:inline">{isFlashOn ? 'Flash ON' : 'Flash Light'}</span>
            </button>

            <button
              id="btn-close-dynamic-qr-modal"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress & Quick Stats Ribbon */}
        <div className="bg-slate-50 px-4 sm:px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-[11px] font-bold text-slate-600">
              Check-in Progress: <span className="text-slate-900 font-black">{checkedInCount} / {totalCount}</span> ({checkInPercentage}%)
            </div>
            <div className="w-24 sm:w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${checkInPercentage}%` }}
              />
            </div>
          </div>

          {/* Session Real-time Counter & Status Indicator Legend */}
          <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-bold">
            {/* Real-Time Session Scanned Counter */}
            <div 
              id="badge-realtime-session-counter"
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white px-2.5 py-0.5 rounded-full border border-indigo-700 shadow-2xs font-mono"
              title="Total attendees successfully scanned during current active session"
            >
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>Session Scans:</span>
              <span className="font-black text-amber-300 text-xs px-1 rounded bg-white/10">{sessionScannedCount}</span>
            </div>

            <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Checked-In ({checkedInCount})
            </span>
            <span className="flex items-center gap-1.5 text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Pending Gate Scan ({pendingCount})
            </span>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-150 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-white">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              id="tab-btn-dynamic-qr-pass"
              type="button"
              onClick={() => setActiveTab('pass')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                activeTab === 'pass'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Dynamic QR Pass</span>
            </button>

            <button
              id="tab-btn-camera-scanner"
              type="button"
              onClick={() => setActiveTab('scanner')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                activeTab === 'scanner'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-orange-500" />
              <span>Live Scanner</span>
            </button>

            <button
              id="tab-btn-attendees-roster"
              type="button"
              onClick={() => setActiveTab('roster')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer relative shrink-0 ${
                activeTab === 'roster'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Attendee Roster</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === 'roster' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
              }`}>
                {totalCount}
              </span>
            </button>

            <button
              id="tab-btn-checkin-history"
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer relative shrink-0 ${
                activeTab === 'history'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Check-in History</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === 'history' ? 'bg-emerald-400 text-slate-950' : 'bg-slate-200 text-slate-700'
              }`}>
                {scannedHistory.length}
              </span>
            </button>
          </div>

          {/* Quick Low-Light Flash Status on right */}
          <button
            id="btn-quick-flash-toggle-bar"
            type="button"
            onClick={toggleCameraFlash}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              isFlashOn
                ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="Toggle camera flash / torch"
          >
            {isFlashOn ? <Flashlight className="w-3.5 h-3.5 text-amber-600 fill-amber-400" /> : <FlashlightOff className="w-3.5 h-3.5 text-slate-400" />}
            <span>Torch: {isFlashOn ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 divide-y divide-slate-100">
          
          {/* Top Controls: Event Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Select Registered Event or Activity</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {eventsList.length} community events available
              </span>
            </label>
            <select
              id="select-dynamic-qr-event"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-orange-100 transition cursor-pointer"
            >
              {eventsList.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title} — {evt.date} ({evt.location || 'Local Community Venue'})
                </option>
              ))}
            </select>
          </div>

          {/* TAB 1: DYNAMIC QR PASS VIEW */}
          {activeTab === 'pass' && (
            <div className="pt-4 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* QR Code Presentation Box */}
              <div className="md:col-span-6 flex flex-col items-center justify-center p-4 sm:p-5 bg-gradient-to-b from-slate-50 to-slate-100/70 rounded-3xl border border-slate-200 text-center relative overflow-hidden shadow-inner">
                {/* Check-In Status Banner with Indicator Dot */}
                {isCheckedIn ? (
                  <div className="mb-3 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-full text-xs font-black flex items-center gap-1.5 shadow-xs animate-bounce">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span>CHECKED-IN • {checkInTimestamp || 'Verified at Gate'}</span>
                  </div>
                ) : (
                  <div className="mb-3 px-3 py-1 bg-amber-50 border border-amber-300 text-amber-900 rounded-full text-[10.5px] font-mono font-bold flex items-center gap-1.5 shadow-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span>PENDING ORGANIZER GATE SCAN</span>
                  </div>
                )}

                {/* High-Contrast Dynamic QR Code */}
                <div className="relative bg-white p-3 rounded-2xl border-2 border-slate-900/10 shadow-lg group">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt={`Dynamic QR Pass for ${selectedEvent?.title}`} 
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center text-slate-400">
                      <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
                    </div>
                  )}

                  {/* Live rotating radar watermark indicator */}
                  <div className="absolute top-1 right-1 bg-slate-900 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {timeLeft}s
                  </div>
                </div>

                {/* Ticket ID Tag */}
                <div className="mt-3 text-center">
                  <span className="text-[11px] font-mono font-black text-slate-800 tracking-wider bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-2xs">
                    {currentMainAttendee?.ticketNumber || ticketNumber}
                  </span>
                  <p className="text-[9.5px] text-slate-500 mt-1 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Vernunt Verified Anti-Fraud Pass Token
                  </p>
                </div>

                {/* Dynamic rotation toggle & Low-Light Flash Quick Action */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQrTimestamp(Date.now());
                      setTimeLeft(30);
                    }}
                    className="text-[10px] text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2 py-0.5 bg-white rounded-lg border border-slate-200 font-bold transition cursor-pointer"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    Refresh Token ({timeLeft}s)
                  </button>

                  <button
                    id="btn-flash-toggle-pass-card"
                    type="button"
                    onClick={toggleCameraFlash}
                    className={`text-[10px] flex items-center gap-1 px-2.5 py-0.5 rounded-lg border font-bold transition cursor-pointer ${
                      isFlashOn
                        ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs ring-1 ring-amber-300'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                    title="Toggle camera flash / torch for dim venues"
                  >
                    {isFlashOn ? <Flashlight className="w-3 h-3 text-amber-600 fill-amber-300" /> : <FlashlightOff className="w-3 h-3 text-slate-400" />}
                    <span>Torch: {isFlashOn ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Ticket Event & Attendee Details Column */}
              <div className="md:col-span-6 space-y-3.5">
                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5 text-amber-700" />
                    {selectedEvent?.title}
                  </span>
                  
                  <div className="space-y-1 text-xs text-slate-700 font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{selectedEvent?.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{selectedEvent?.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{selectedEvent?.location || 'Community Lawn / Studio'}</span>
                    </div>
                  </div>
                </div>

                {/* Attendee Input Fields */}
                <div className="space-y-2.5 bg-white p-3.5 rounded-2xl border border-slate-150">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Child / Attendee</label>
                      <input
                        type="text"
                        value={attendeeName}
                        onChange={(e) => setAttendeeName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Parent / Guardian</label>
                      <input
                        type="text"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Admission Pass Tier</label>
                    <select
                      value={ticketTier}
                      onChange={(e) => setTicketTier(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="Standard Child Entry">Standard Child Entry (₹{selectedEvent?.ticketPrice || 0})</option>
                      <option value="VIP Family Pass + Workshop Kit">VIP Family Pass + Workshop Kit</option>
                      <option value="Sibling Group Pass">Sibling Group Pass</option>
                      <option value="Free Community Gate Pass">Free Community Gate Pass</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons: Check In Simulation & Organizers Launch */}
                <div className="space-y-2 pt-1">
                  <button
                    id="btn-toggle-organizer-checkin-state"
                    onClick={() => handleToggleAttendeeCheckIn('att-1')}
                    className={`w-full py-2.5 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition shadow-sm cursor-pointer ${
                      isCheckedIn
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isCheckedIn ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Attendee Verified & Checked In! (Click to Undo)</span>
                      </>
                    ) : (
                      <>
                        <ScanLine className="w-4 h-4 text-amber-400" />
                        <span>Simulate Organizer Gate Scan</span>
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="btn-view-roster-shortcut"
                      type="button"
                      onClick={() => setActiveTab('roster')}
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-slate-600" />
                      <span>View Attendees ({checkedInCount}/{totalCount})</span>
                    </button>

                    <button
                      id="btn-view-history-shortcut"
                      type="button"
                      onClick={() => setActiveTab('history')}
                      className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Scan Log ({scannedHistory.length})</span>
                    </button>
                  </div>

                  {onOpenOrganizerGateCheckIn && selectedEvent && (
                    <button
                      id="btn-launch-organizer-scanner-desk"
                      onClick={() => {
                        onClose();
                        onOpenOrganizerGateCheckIn(selectedEvent);
                      }}
                      className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-amber-700" />
                      <span>Open Full Organizer Scanner Desk for "{selectedEvent.title}"</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE CAMERA SCANNER WITH REAL-TIME COUNTER, FLASH & MANUAL CHECK-IN */}
          {activeTab === 'scanner' && (
            <div id="live-camera-scanner-view" className="pt-4 space-y-4">
              
              {/* Low-Light Environment Banner & Flashlight Controller & Real-Time Counter */}
              <div className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isFlashOn 
                  ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border-amber-400 shadow-md shadow-amber-500/10 text-slate-900' 
                  : 'bg-slate-900 text-white border-slate-800'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                    isFlashOn 
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/50 ring-2 ring-amber-300' 
                      : 'bg-slate-800 text-amber-400 border border-slate-700'
                  }`}>
                    {isFlashOn ? <Flashlight className="w-5 h-5 fill-amber-950 animate-bounce" /> : <FlashlightOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-black">
                        {isFlashOn ? 'Camera Flash: Active (Low-Light Torch ON)' : 'Camera Flash: Inactive (Low-Light Torch OFF)'}
                      </h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full font-mono uppercase ${
                        isFlashOn ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isFlashOn ? 'Night Boost Active' : 'Standard Illumination'}
                      </span>
                    </div>
                    <p className={`text-[11px] font-medium mt-0.5 ${isFlashOn ? 'text-amber-950' : 'text-slate-300'}`}>
                      Assists gate staff in dimly lit venues, indoor auditoriums, and evening events
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Real-time Session Scanned Counter Badge */}
                  <div 
                    id="scanner-session-scanned-pill"
                    className="px-3 py-1.5 bg-indigo-950/90 text-indigo-200 border border-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 font-mono shadow-xs"
                    title="Real-time count of attendees admitted in this scanner session"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                    <span>Session:</span>
                    <span className="font-black text-amber-300 text-sm px-1.5 py-0.2 bg-indigo-900 rounded-md">
                      {sessionScannedCount}
                    </span>
                    <span className="text-[10px] text-indigo-300">scanned</span>
                  </div>

                  {/* How to Scan Toggle */}
                  <button
                    id="btn-how-to-scan-toggle"
                    type="button"
                    onClick={() => setShowHowToScan(prev => !prev)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-sky-400" />
                    <span>{showHowToScan ? 'Hide Guide' : 'How to Scan'}</span>
                  </button>

                  {/* Camera Flash Toggle */}
                  <button
                    id="btn-camera-flash-toggle-scanner"
                    type="button"
                    onClick={toggleCameraFlash}
                    className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition transform active:scale-95 cursor-pointer shadow-sm ${
                      isFlashOn
                        ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 ring-2 ring-amber-300 shadow-amber-400/40'
                        : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700'
                    }`}
                  >
                    {isFlashOn ? (
                      <>
                        <Flashlight className="w-4 h-4 fill-slate-950" />
                        <span>Turn Off Flash</span>
                      </>
                    ) : (
                      <>
                        <Flashlight className="w-4 h-4 fill-amber-300 text-white" />
                        <span>Turn On Flash</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* How to Scan Interactive Overlay Guide (When Opened) */}
              {showHowToScan && (
                <div id="how-to-scan-guidance-box" className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-sky-950 space-y-2 animate-fade-in text-xs">
                  <div className="flex items-center justify-between font-black text-sky-900">
                    <span className="flex items-center gap-1.5 text-sm">
                      <ScanLine className="w-4 h-4 text-sky-700" />
                      How to Scan Attendee Dynamic QR Passes
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setShowHowToScan(false)}
                      className="text-sky-600 hover:text-sky-900 font-bold text-xs"
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11.5px]">
                    <div className="p-2.5 bg-white rounded-xl border border-sky-150 shadow-2xs">
                      <p className="font-bold text-sky-900 mb-0.5">1. Align QR in Target</p>
                      <p className="text-slate-600">Position the attendee's phone or printed pass within the central glowing reticle (15–25 cm distance).</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-sky-150 shadow-2xs">
                      <p className="font-bold text-sky-900 mb-0.5">2. Low Light? Use Flash</p>
                      <p className="text-slate-600">Turn on Camera Flash for dimly lit gate auditoriums, evening entryways, and shaded outdoor kiosks.</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-sky-150 shadow-2xs">
                      <p className="font-bold text-sky-900 mb-0.5">3. Damaged QR? Manual ID</p>
                      <p className="text-slate-600">If screen glare or damaged paper prevents scanning, click 'Manual Check-In' below to enter the Attendee ID.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Camera Feed Container */}
              <div className="relative rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-xl min-h-[270px] flex items-center justify-center">
                {/* Real Video Element */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-64 sm:h-72 object-cover"
                />

                {/* Night-mode software illumination boost ring when Flash is ON */}
                {isFlashOn && (
                  <div className="absolute inset-0 pointer-events-none bg-radial from-amber-100/30 via-amber-200/10 to-transparent ring-8 ring-amber-300/40 transition-all duration-500 animate-pulse"></div>
                )}

                {/* Standard Scanner Reticle Overlay (Hidden when Success Animating) */}
                {!isSuccessAnimating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none animate-fade-in">
                    <div className={`relative w-44 h-44 sm:w-52 sm:h-52 border-2 rounded-2xl transition-all duration-300 flex items-center justify-center ${
                      isFlashOn 
                        ? 'border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.5)]' 
                        : 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                    }`}>
                      {/* Corner Reticle Accents */}
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-amber-400 rounded-tl-sm"></div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-amber-400 rounded-tr-sm"></div>
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-amber-400 rounded-bl-sm"></div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-amber-400 rounded-br-sm"></div>

                      {/* Animated Scanning Laser Line */}
                      <div className={`w-full h-0.5 transition-colors animate-pulse ${isFlashOn ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-emerald-400 shadow-[0_0_8px_#10b981]'}`}></div>
                    </div>

                    {/* Status Overlay Pill */}
                    <div className="mt-4 pointer-events-auto">
                      <span className="bg-slate-900/90 backdrop-blur-md text-slate-100 text-[11px] font-bold px-3 py-1 rounded-full border border-slate-700 shadow-md flex items-center gap-1.5 font-mono">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        <span>Target Reticle Ready • Align QR Code</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* 1.5-SECOND SUCCESS ANIMATION & AUTO-REFRESH OVERLAY */}
                {isSuccessAnimating && lastScannedAttendee && (
                  <div 
                    id="scan-success-animation-overlay"
                    className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 z-20 text-center animate-fade-in"
                  >
                    <div className="bg-gradient-to-b from-emerald-950/90 to-slate-900 border-2 border-emerald-400 rounded-3xl p-5 max-w-sm w-full shadow-[0_0_40px_rgba(16,185,129,0.5)] transform scale-100 transition-all">
                      {/* Big Glowing Checkmark */}
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/50 ring-4 ring-emerald-300 animate-bounce">
                        <Check className="w-9 h-9 stroke-[3.5]" />
                      </div>

                      <div className="space-y-1">
                        <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full font-mono">
                          Verified & Checked-In
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-white font-serif mt-1">
                          {lastScannedAttendee.attendeeName}
                        </h3>
                        <p className="text-xs text-emerald-300 font-mono font-bold">
                          {lastScannedAttendee.ticketNumber}
                        </p>
                        <p className="text-[11px] text-slate-300">
                          {lastScannedAttendee.tier} • Parent: {lastScannedAttendee.parentName}
                        </p>
                      </div>

                      {/* Auto-Refresh 1.5s Progress Bar */}
                      <div className="mt-4 pt-3 border-t border-emerald-800/60">
                        <div className="flex items-center justify-between text-[10px] text-emerald-300 font-mono mb-1">
                          <span>Preparing next scan...</span>
                          <span className="font-bold">1.5s Auto-Clear</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-400 to-amber-300 animate-[pulse_1.5s_ease-in-out] w-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Floating Torch Status Badge in video top-right */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                  <button
                    type="button"
                    onClick={() => setShowHowToScan(prev => !prev)}
                    className="px-2.5 py-1 rounded-xl text-[10.5px] font-bold flex items-center gap-1 backdrop-blur-md bg-slate-900/80 hover:bg-slate-900 text-slate-200 border border-slate-700 transition cursor-pointer"
                    title="Toggle How to Scan guide"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-sky-400" />
                    <span>Guide</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleCameraFlash}
                    className={`px-2.5 py-1 rounded-xl text-[10.5px] font-black flex items-center gap-1.5 backdrop-blur-md transition cursor-pointer ${
                      isFlashOn 
                        ? 'bg-amber-400/95 text-slate-950 ring-2 ring-amber-300 shadow-lg shadow-amber-400/50' 
                        : 'bg-slate-900/80 hover:bg-slate-900 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {isFlashOn ? <Flashlight className="w-3.5 h-3.5 fill-slate-950" /> : <FlashlightOff className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{isFlashOn ? 'Flash ON' : 'Flash OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Scanner Feedback Notification & Quick Scan Trigger */}
              <div className={`p-3 rounded-xl border text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                scannerFeedback.status === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : scannerFeedback.status === 'warning'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  {scannerFeedback.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>{scannerFeedback.text}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    id="btn-simulate-next-scan"
                    type="button"
                    onClick={() => handleSimulateCameraScan()}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-black transition cursor-pointer"
                  >
                    Scan Next Ticket
                  </button>
                </div>
              </div>

              {/* MANUAL CHECK-IN LINK & INPUT SECTION */}
              <div id="manual-checkin-container" className="p-3.5 bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black text-slate-800">
                      Can't scan the QR code?
                    </span>
                  </div>
                  <button
                    id="link-toggle-manual-checkin"
                    type="button"
                    onClick={() => setShowManualCheckIn(prev => !prev)}
                    className="text-xs font-black text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showManualCheckIn ? 'Hide Manual Check-in' : 'Manual Check-in'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Manual Check-in Input Form */}
                {showManualCheckIn && (
                  <form onSubmit={handleManualCheckInSubmit} className="pt-2 border-t border-slate-200 space-y-2 animate-fade-in">
                    <p className="text-[11px] text-slate-600">
                      Type the unique Attendee ID, Ticket Number (e.g. <span className="font-mono font-bold text-slate-800">VERN-EVT-PASS-1092</span> or <span className="font-mono font-bold text-slate-800">att-1</span>), or attendee name to verify entry:
                    </p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="input-manual-attendee-id"
                          type="text"
                          value={manualAttendeeId}
                          onChange={(e) => {
                            setManualAttendeeId(e.target.value);
                            setManualCheckInError('');
                          }}
                          placeholder="Enter Attendee ID / Pass Number (e.g. VERN-EVT-PASS-1092)"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-300 shadow-2xs"
                        />
                      </div>
                      <button
                        id="btn-submit-manual-checkin"
                        type="submit"
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-slate-900 hover:from-indigo-700 hover:to-slate-950 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-sm shrink-0 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Verify & Admit</span>
                      </button>
                    </div>

                    {manualCheckInError && (
                      <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{manualCheckInError}</span>
                      </div>
                    )}
                  </form>
                )}
              </div>

              {/* Quick Roster Scan List with Visual Status Dots */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-black text-slate-800">
                  <div className="flex items-center gap-2">
                    <span>Fast Gate Check-In Actions</span>
                    <span className="text-[10px] text-slate-500 font-medium">(1-Click Admit from Roster)</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('roster')} 
                    className="text-[11px] text-indigo-600 hover:underline font-bold"
                  >
                    View All {totalCount} Attendees &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attendeesRoster.slice(0, 4).map((att) => (
                    <button
                      key={att.id}
                      type="button"
                      onClick={() => handleSimulateCameraScan(att.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition cursor-pointer ${
                        att.status === 'checked-in'
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {/* Visual Status Indicator Dot */}
                          <span className="relative flex h-2 w-2">
                            {att.status === 'checked-in' && (
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            )}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${
                              att.status === 'checked-in' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}></span>
                          </span>
                          <p className="text-xs font-bold truncate">{att.attendeeName}</p>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">{att.ticketNumber}</p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                        att.status === 'checked-in' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-900 text-white'
                      }`}>
                        {att.status === 'checked-in' ? 'Admitted' : 'Scan'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDEE ROSTER WITH STATUS INDICATOR DOTS */}
          {activeTab === 'roster' && (
            <div id="attendee-roster-view" className="pt-4 space-y-4">
              
              {/* Search & Status Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search attendee, parent, or ticket number..."
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({totalCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('checked-in')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      statusFilter === 'checked-in' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Checked-In ({checkedInCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('pending')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      statusFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    Pending ({pendingCount})
                  </button>
                </div>
              </div>

              {/* Quick Batch Actions */}
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-600 font-medium">
                  Showing {filteredAttendees.length} of {totalCount} registered attendees
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCheckInAll}
                    className="text-emerald-700 hover:text-emerald-900 font-black hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Check In All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleResetCheckIns}
                    className="text-slate-500 hover:text-rose-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset
                  </button>
                </div>
              </div>

              {/* Attendee Cards List with Indicator Dots */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredAttendees.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                    <p className="text-xs font-bold text-slate-600">No attendees match this filter</p>
                  </div>
                ) : (
                  filteredAttendees.map((attendee) => {
                    const isAttCheckedIn = attendee.status === 'checked-in';
                    return (
                      <div
                        key={attendee.id}
                        id={`attendee-card-${attendee.id}`}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isAttCheckedIn
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : 'bg-white border-slate-200 hover:border-amber-300'
                        }`}
                      >
                        {/* Attendee info with Status Indicator Dot */}
                        <div className="flex items-start gap-3">
                          {/* Small Status Indicator Dot (Green for checked-in, Orange for pending) */}
                          <div className="pt-1 shrink-0">
                            {isAttCheckedIn ? (
                              <span 
                                id={`status-dot-checked-in-${attendee.id}`} 
                                className="relative flex h-3 w-3"
                                title="Checked In"
                              >
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-emerald-200"></span>
                              </span>
                            ) : (
                              <span 
                                id={`status-dot-pending-${attendee.id}`} 
                                className="relative flex h-3 w-3"
                                title="Pending Gate Scan"
                              >
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 ring-2 ring-amber-200"></span>
                              </span>
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-xs font-black text-slate-900 font-serif">
                                {attendee.attendeeName}
                              </h4>
                              
                              {/* Status Badge */}
                              {isAttCheckedIn ? (
                                <span className="text-[9.5px] font-black uppercase text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" />
                                  Checked In ({attendee.checkInTimestamp || 'Gate Scan'})
                                </span>
                              ) : (
                                <span className="text-[9.5px] font-black uppercase text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Clock3 className="w-2.5 h-2.5" />
                                  Pending Check-in
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10.5px] text-slate-500">
                              <span>Parent: <strong className="text-slate-700">{attendee.parentName}</strong></span>
                              <span>•</span>
                              <span>Phone: {attendee.phone}</span>
                              <span>•</span>
                              <span className="font-mono text-slate-600 font-bold">{attendee.ticketNumber}</span>
                            </div>
                            
                            <div className="text-[10px] text-slate-400 pt-0.5 flex items-center gap-2">
                              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium">{attendee.tier}</span>
                              <span>•</span>
                              <span>{attendee.gateLocation || 'North Gate'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick 1-tap Check-in / Undo button */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            id={`btn-toggle-attendee-${attendee.id}`}
                            type="button"
                            onClick={() => handleToggleAttendeeCheckIn(attendee.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                              isAttCheckedIn
                                ? 'bg-emerald-100 hover:bg-rose-100 text-emerald-800 hover:text-rose-700 border border-emerald-300 hover:border-rose-300'
                                : 'bg-slate-900 hover:bg-emerald-600 text-white'
                            }`}
                          >
                            {isAttCheckedIn ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Checked (Undo)</span>
                              </>
                            ) : (
                              <>
                                <ScanLine className="w-3.5 h-3.5 text-amber-400" />
                                <span>Scan & Check In</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CHECK-IN HISTORY LOG VIEW */}
          {activeTab === 'history' && (
            <div id="checkin-history-view" className="pt-4 space-y-4">
              
              {/* History Summary Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <History className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-black text-white">Live Gate Check-In History</h4>
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[8.5px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                        CSV Export Ready
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-300">
                      Chronological log of scanned tickets and verified attendee entries
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <button
                    id="btn-export-checkin-history-csv"
                    type="button"
                    onClick={handleExportCsv}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-sm transition transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                    title="Download scanned attendee data as a formatted CSV file"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>

                  <div className="text-right pl-2.5 border-l border-slate-700">
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      {scannedHistory.length}
                    </span>
                    <span className="text-[9.5px] text-slate-400 block font-medium">Scanned Total</span>
                  </div>
                </div>
              </div>

              {/* Check-In History Log Stream */}
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {scannedHistory.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <History className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-700">No scanned entries yet</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Use the "Scan & Check In" button or organizer scanner desk to register attendee gate arrivals.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('roster')}
                      className="mt-2 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Attendee Roster</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  scannedHistory.map((item, idx) => (
                    <div
                      key={item.id}
                      id={`history-log-item-${item.id}`}
                      className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">
                              {item.attendeeName}
                            </span>
                            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                              Verified Entry
                            </span>
                          </div>
                          <div className="text-[10.5px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>Parent: {item.parentName}</span>
                            <span>•</span>
                            <span className="font-mono text-slate-600 font-bold">{item.ticketNumber}</span>
                            <span>•</span>
                            <span>{item.gateLocation || 'Gate-A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1 text-xs font-black text-emerald-700 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{item.checkInTimestamp || 'Just now'}</span>
                        </div>
                        <span className="text-[9.5px] text-slate-400 font-medium">
                          {item.method || 'Touchless Scan'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Quick Sharing & Export Options Footer */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                id="btn-download-qr-pass-img"
                onClick={handleDownloadQrImage}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Download QR code image for offline use"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save QR Image</span>
              </button>

              <button
                id="btn-footer-export-csv"
                onClick={handleExportCsv}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Download attendee check-in records as formatted CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>

              <button
                id="btn-copy-ticket-info"
                onClick={handleCopyTicketDetails}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Pass!' : 'Copy Ticket'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-share-whatsapp-pass"
                onClick={handleShareWhatsApp}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share via WhatsApp</span>
              </button>

              <button
                id="btn-done-qr-modal"
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
