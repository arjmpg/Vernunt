import React, { useState, useEffect, useMemo } from 'react';
import { CommunityEvent, Booking } from '../types.ts';
import { 
  CalendarRange, MapPin, PersonStanding, Check, Search, X, 
  Compass, Star, Calendar, Plus, Award, 
  Sparkles, AlertCircle, CreditCard, Share2, Copy, ExternalLink,
  Ticket, QrCode, UserCheck, Wallet, Clock, ArrowRight, ShieldCheck,
  Navigation, Flame, CheckCircle2, ArrowUpDown, Globe, BellRing, Users,
  ChevronDown, SlidersHorizontal, RotateCcw, Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getHaversineDistance, getProximityBadge } from '../utils/distance.ts';
import AestheticImageUploader from './AestheticImageUploader.tsx';
import { db, auth, handleFirestoreError, OperationType } from '../utils/firebase.ts';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import CommunityEventCheckIn from './CommunityEventCheckIn.tsx';
import EventTicketPassModal from './events/EventTicketPassModal.tsx';
import EventOrganizerCheckInStation from './events/EventOrganizerCheckInStation.tsx';
import EventBookingModal from './events/EventBookingModal.tsx';
import CreateEventWizardModal from './events/CreateEventWizardModal.tsx';
import EventBuyerRegistrationModal from './events/EventBuyerRegistrationModal.tsx';
import UserPurchasesModal from './events/UserPurchasesModal.tsx';
import EventCarouselSection from './events/EventCarouselSection.tsx';
import EventHostQrShareModal from './events/EventHostQrShareModal.tsx';
import EventQrScannerModal from './events/EventQrScannerModal.tsx';
import { getEventCanonicalPath, getEventDirectUrl, normalizeEventType, slugifyEventTitle } from '../utils/eventUrls.ts';
import { sendEventBookingNotifications } from '../utils/notifications.ts';
import { sendEventReminderPush } from '../utils/fcmMessaging.ts';
import { generateAffiliateShareUrl, generateWhatsAppShareText, openWhatsAppShare } from '../utils/affiliate.ts';
import { MOCK_EVENTS } from '../data/mockData.ts';

// Calculate status: 'Upcoming' | 'Full' | 'Past'
export const getEventStatus = (evt: CommunityEvent): 'Upcoming' | 'Full' | 'Past' => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const eventDate = evt.endDate || evt.date;
  if (eventDate && eventDate < todayStr) {
    return 'Past';
  }
  
  const maxCap = evt.maxCapacity || (evt.freeTicketsQuota ? evt.freeTicketsQuota : 0);
  const attendees = evt.attendeesCount || 0;
  if ((maxCap > 0 && attendees >= maxCap) || (evt as any).isFull) {
    return 'Full';
  }
  
  return 'Upcoming';
};

interface EventsTabProps {
  userProfile: any;
  eventsList: CommunityEvent[];
  setEventsList: React.Dispatch<React.SetStateAction<CommunityEvent[]>>;
  onAddBooking: (booking: Booking) => void;
  onUpdateRole: (role: 'Parent' | 'Event Organizer' | 'Portfolio Professional' | 'Admin' | 'eventbuyers') => void;
  globalCommissionRate: number;
  onUpdateUserProfile?: (profile: any) => void;
  onOpenLogin?: () => void;
  initialOpenCreateWizard?: boolean;
  onOpenPushModal?: () => void;
}

export default function EventsTab({
  userProfile,
  eventsList,
  setEventsList,
  onAddBooking,
  onUpdateRole,
  globalCommissionRate,
  onUpdateUserProfile,
  onOpenLogin,
  initialOpenCreateWizard = false,
  onOpenPushModal
}: EventsTabProps) {
  // Core Filter and Sort States declared upfront to eliminate TDZ
  const [sortMode, setSortMode] = useState<'featured_nearby' | 'nearby_only' | 'date' | 'price_low'>('nearby_only');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxDistanceRadiusKm, setMaxDistanceRadiusKm] = useState<number>(15.0);
  const [onlyNearbyFilter, setOnlyNearbyFilter] = useState<boolean>(false);
  const [showFilterSortBlock, setShowFilterSortBlock] = useState<boolean>(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(eventsList[0]?.id || null);

  // Guest / Event Buyer Registration and Account Purchases
  const [showBuyerRegistrationModal, setShowBuyerRegistrationModal] = useState<boolean>(false);
  const [buyerRegActionLabel, setBuyerRegActionLabel] = useState<string>('Book tickets and access digital passes');
  const [pendingBookingEvent, setPendingBookingEvent] = useState<CommunityEvent | null>(null);
  const [showUserPurchasesModal, setShowUserPurchasesModal] = useState<boolean>(false);

  // WooEvents state
  const [activeTicketModalBooking, setActiveTicketModalBooking] = useState<Booking | null>(null);
  const [activeTicketEvent, setActiveTicketEvent] = useState<CommunityEvent | null>(null);
  const [checkInStationEvent, setCheckInStationEvent] = useState<CommunityEvent | null>(null);
  const [bookingModalEvent, setBookingModalEvent] = useState<CommunityEvent | null>(null);
  const [showCreateWizard, setShowCreateWizard] = useState<boolean>(initialOpenCreateWizard);
  const [myTickets, setMyTickets] = useState<Booking[]>([]);
  const [showMyTicketsDrawer, setShowMyTicketsDrawer] = useState<boolean>(false);
  const [organizerRoleAlertEvent, setOrganizerRoleAlertEvent] = useState<CommunityEvent | null>(null);

  // Helper properties for unified filter and sort
  const isAnyFilterActive = categoryFilter !== 'All' || sortMode !== 'nearby_only' || onlyNearbyFilter || searchQuery.trim() !== '';

  const handleResetAllFilters = () => {
    setCategoryFilter('All');
    setSortMode('nearby_only');
    setOnlyNearbyFilter(false);
    setMaxDistanceRadiusKm(15.0);
    setSearchQuery('');
  };

  useEffect(() => {
    if (initialOpenCreateWizard) {
      setShowCreateWizard(true);
    }
  }, [initialOpenCreateWizard]);

  // Parent GPS coordinates (default to userProfile or Bangalore/Central location)
  const userLat = typeof userProfile?.location === 'object' && userProfile?.location?.lat !== undefined
    ? Number(userProfile.location.lat)
    : (typeof userProfile?.lat === 'number' ? userProfile.lat : 12.9716);
  const userLng = typeof userProfile?.location === 'object' && userProfile?.location?.lng !== undefined
    ? Number(userProfile.location.lng)
    : (typeof userProfile?.lng === 'number' ? userProfile.lng : 77.5946);

  const userLocationDisplay = typeof userProfile?.location === 'object' && userProfile?.location?.address
    ? userProfile.location.address
    : (typeof userProfile?.location === 'string' ? userProfile.location : 'Bangalore Central (12.97, 77.59)');

  // Check if current user is authorized to operate the Gate Desk & QR Scanner
  const isAuthorizedOrganizer = (evt?: CommunityEvent) => {
    const role = userProfile?.userRole;
    if (role === 'Event Organizer' || role === 'Admin') return true;
    if (evt && userProfile?.parentName && evt.hostName && 
        userProfile.parentName.toLowerCase().trim() === evt.hostName.toLowerCase().trim()) {
      return true;
    }
    return false;
  };

  const handleOpenGateDesk = (evt: CommunityEvent) => {
    if (isAuthorizedOrganizer(evt)) {
      setCheckInStationEvent(evt);
    } else {
      setOrganizerRoleAlertEvent(evt);
    }
  };

  const handleInitiateBooking = (evt: CommunityEvent) => {
    if (!userProfile) {
      setPendingBookingEvent(evt);
      setBuyerRegActionLabel(`Book passes for "${evt.title}"`);
      setShowBuyerRegistrationModal(true);
      return;
    }
    setBookingModalEvent(evt);
  };

  const handleBuyerRegistrationSuccess = (buyerProfile: ChildProfile) => {
    setShowBuyerRegistrationModal(false);
    if (onUpdateUserProfile) {
      onUpdateUserProfile(buyerProfile);
    }
    onUpdateRole('eventbuyers');
    if (pendingBookingEvent) {
      setBookingModalEvent(pendingBookingEvent);
      setPendingBookingEvent(null);
    }
  };

  // Load saved user tickets from local persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vernunt_user_event_tickets');
      if (saved) {
        setMyTickets(JSON.parse(saved));
      } else if (eventsList.length > 0) {
        // Provide 1 initial demo pass for instant testing
        const demoPass: Booking = {
          id: 'booking-demo-01',
          itemId: eventsList[0].id,
          itemTitle: eventsList[0].title,
          type: 'EventTicket',
          buyerName: userProfile?.parentName || 'Priya Sharma',
          buyerEmail: userProfile?.email || 'priya@vernunt.com',
          buyerPhone: '+91 98765 43210',
          amountPaid: eventsList[0].ticketPrice || 199,
          commissionPercentage: 10,
          commissionEarned: 20,
          hostEarned: 179,
          dateStr: eventsList[0].date,
          timeSelected: eventsList[0].time,
          razorpayPaymentId: 'pay_demo_pass_123',
          status: 'Paid',
          ticketNumber: `VERN-EVT-7721-${Math.floor(100 + Math.random() * 900)}`,
          ticketTierName: 'VIP Family Pass',
          childName: userProfile?.childName || 'Aarav',
          childAge: userProfile?.childAge || 5,
          eventVenue: eventsList[0].location,
          checkedIn: false,
          quantity: 1,
          createdAt: new Date().toISOString()
        };
        setMyTickets([demoPass]);
        localStorage.setItem('vernunt_user_event_tickets', JSON.stringify([demoPass]));
      }
    } catch (err) {
      console.error('Error loading tickets:', err);
    }
  }, [eventsList]);

  const handleSaveNewTicket = (booking: Booking) => {
    const updated = [booking, ...myTickets];
    setMyTickets(updated);
    localStorage.setItem('vernunt_user_event_tickets', JSON.stringify(updated));

    // Also call global app onAddBooking
    onAddBooking(booking);

    // Update event attended status
    setEventsList(prev => prev.map(e => {
      if (e.id === booking.itemId) {
        return { ...e, joined: true, attendeesCount: e.attendeesCount + (booking.quantity || 1) };
      }
      return e;
    }));

    // Find the associated event and pop open the E-Ticket Pass Modal with QR code!
    const evt = eventsList.find(e => e.id === booking.itemId);
    if (evt) {
      setActiveTicketEvent(evt);
      setActiveTicketModalBooking(booking);

      // Trigger Real-Time FCM Push Notification for Event Pass & Reminders (Android / iOS / Web)
      sendEventReminderPush({
        targetUserId: booking.buyerEmail || userProfile?.id || 'guest',
        eventTitle: booking.itemTitle,
        eventDate: booking.dateStr,
        eventTime: booking.timeSelected || '10:00 AM',
        eventVenue: booking.eventVenue || evt?.location || 'Bengaluru',
        eventId: booking.itemId
      }).catch(err => console.warn('[FCM] Event booking push trigger note:', err));
    }
  };

  // Razorpay event ticket purchase state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [allowGuestCheckout, setAllowGuestCheckout] = useState(false);
  const [checkoutEvent, setCheckoutEvent] = useState<CommunityEvent | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'processing' | 'otp' | 'success'>('details');
  const [buyerName, setBuyerName] = useState(userProfile?.parentName || '');
  const [buyerEmail, setBuyerEmail] = useState('parent@vernunt.org');
  const [otpValue, setOtpValue] = useState('');
  const [productionPayId, setProductionPayId] = useState('');

  // Suggested event proposal modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventLoc, setNewEventLoc] = useState('');
  const [newEventHost, setNewEventHost] = useState(userProfile?.parentName || 'Parent Organizer');
  const [newEventCat, setNewEventCat] = useState('Event'); // 'Event' | 'Activity' | 'Competition' | 'Class'
  const [newEventPhoto, setNewEventPhoto] = useState('');
  const [newEventTagsStr, setNewEventTagsStr] = useState('');
  
  // Custom Dynamic Categories sync from Admin Desk
  const [customCats, setCustomCats] = useState<any[]>([]);

  // Event sharing clipboard state & feedback
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<{ title: string; link: string } | null>(null);

  // Event Host QR Code Pass & Share Station state
  const [hostQrModalEvent, setHostQrModalEvent] = useState<CommunityEvent | null>(null);
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);

  // Parse deep link if ?eventId= or ?ticket= is present in URL (e.g. from scanned QR code)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const targetEventId = params.get('eventId') || params.get('event');
      const shouldDirectBook = params.get('book') === 'true' || params.get('action') === 'book' || params.get('scan') === '1';

      if (targetEventId) {
        let found = eventsList.find(e => e.id === targetEventId);

        // Fallback: Check local storage for newly created custom events if not in current state
        if (!found) {
          try {
            const stored = localStorage.getItem('vernunt_user_created_events');
            if (stored) {
              const localList: CommunityEvent[] = JSON.parse(stored);
              const matched = localList.find(e => e.id === targetEventId);
              if (matched) {
                found = matched;
                setEventsList(prev => [matched, ...prev]);
              }
            }
          } catch (e) {
            console.warn('LocalStorage events parse note:', e);
          }
        }

        if (found) {
          setSelectedEventId(targetEventId);

          // If scanned with ?book=true, automatically launch the booking modal!
          if (shouldDirectBook) {
            setTimeout(() => {
              handleInitiateBooking(found!);
            }, 400);
          }

          // If element exists on DOM, scroll to it smoothly and highlight with animated pulse ring
          setTimeout(() => {
            const el = document.getElementById(`event-card-${targetEventId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('ring-4', 'ring-orange-500', 'ring-offset-4');
              setTimeout(() => {
                el.classList.remove('ring-4', 'ring-orange-500', 'ring-offset-4');
              }, 4000);
            }
          }, 300);
        }
      }

      // Check for direct ticket pass deep link: ?ticket=VERN-EVT-...
      const targetTicket = params.get('ticket') || params.get('ticketId') || params.get('pass');
      if (targetTicket) {
        const found = myTickets.find(t => t.ticketNumber === targetTicket || t.id === targetTicket);
        if (found) {
          const evt = eventsList.find(e => e.id === found.itemId || e.title === found.itemTitle) || eventsList[0] || null;
          setActiveTicketModalBooking(found);
          setActiveTicketEvent(evt);
        } else if (eventsList.length > 0) {
          // Construct pass for shared ticket link
          const sharedPass: Booking = {
            id: `booking-${targetTicket}`,
            itemId: eventsList[0].id,
            itemTitle: eventsList[0].title,
            type: 'EventTicket',
            buyerName: userProfile?.parentName || 'Arjun MP',
            buyerEmail: userProfile?.email || 'arjunmpgupta@gmail.com',
            buyerPhone: userProfile?.phone || '+91 98765 43210',
            amountPaid: eventsList[0].ticketPrice || 0,
            commissionPercentage: 10,
            commissionEarned: 0,
            hostEarned: 0,
            dateStr: eventsList[0].date,
            timeSelected: eventsList[0].time,
            razorpayPaymentId: 'pay_shared_verified',
            status: 'Paid',
            ticketNumber: targetTicket,
            ticketTierName: 'Official Family Pass',
            childName: userProfile?.childName || 'Ayaan',
            childAge: userProfile?.childAge || 6,
            eventVenue: eventsList[0].location,
            checkedIn: false,
            quantity: 1,
            createdAt: new Date().toISOString()
          };
          setActiveTicketModalBooking(sharedPass);
          setActiveTicketEvent(eventsList[0]);
        }
      }
    } catch (err) {
      console.error('Failed to parse URL event/ticket parameter:', err);
    }
  }, [eventsList, myTickets, userProfile]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'custom_event_categories'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      setCustomCats(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'custom_event_categories');
    });
    return () => unsub();
  }, []);
  const [newEventPrice, setNewEventPrice] = useState<number>(0); // Custom ticket price in INR
  const [selectedFormTags, setSelectedFormTags] = useState<string[]>([]);
  const [formError, setFormError] = useState('');

  const getPredefinedTagsForCat = (cat: string) => {
    switch (cat) {
      case 'Event':
        return ['Festival', 'Puppet Show', 'Carnival', 'Park Meet', 'Outdoor', 'Gathering', 'Storytelling'];
      case 'Activity':
        return ['Sports', 'Soccer', 'Outdoor', 'Run', 'Hiking', 'Nature', 'Garden', 'Sensory'];
      case 'Competition':
        return ['Lego', 'Bricks', 'Competition', 'Math Olympiad', 'Chess', 'Medals', 'Prizes'];
      case 'Class':
        return ['Sanskrit', 'Chants', 'Heritage', 'Meditation', 'Robotics', 'Coding', 'Scratch', 'Tech', 'Pottery', 'Clay', 'Art'];
      default:
        return ['Kids', 'Parenting', 'Family', 'Folk'];
    }
  };

  const handleToggleFormPresetTag = (tag: string) => {
    setSelectedFormTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleRazorpayEventCheckout = async () => {
    if (!checkoutEvent) return;
    setCheckoutStep('processing');
    try {
      // 1. Create order
      const orderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: checkoutEvent.ticketPrice, planId: `event_${checkoutEvent.id}` }),
      });
      if (!orderResponse.ok) throw new Error("Server checkout route failed.");
      const orderData = await orderResponse.json();

      // 2. Load script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      
      await new Promise((resolve) => {
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
      });

      // 3. Launch Checkout
      const options = {
        key: orderData.keyId || "rzp_test_simulated_key_123456",
        amount: orderData.amount,
        currency: "INR",
        name: "Vernunt Events Gate",
        description: `Entry ticket for: ${checkoutEvent.title}`,
        image: checkoutEvent.photoUrl,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // verify
          const verifyResponse = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id || orderData.orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature || "simulated_opt_token"
            }),
          });
          const verifyResult = await verifyResponse.json();
          if (verifyResult.success) {
            // Confirm Booking
            const payId = response.razorpay_payment_id || `pay_EVT_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
            setProductionPayId(payId);
            
            // Calculate rates
            const rate = checkoutEvent.commissionPercentage ?? globalCommissionRate;
            const price = checkoutEvent.ticketPrice || 0;
            const commissionEarned = Math.round((price * rate) / 100);
            const hostEarned = price - commissionEarned;

            // Trigger Booking transaction
            onAddBooking({
              id: `booking-${Date.now()}`,
              itemId: checkoutEvent.id,
              itemTitle: checkoutEvent.title,
              type: 'EventTicket',
              buyerName: buyerName,
              buyerEmail: buyerEmail,
              amountPaid: price,
              commissionPercentage: rate,
              commissionEarned: commissionEarned,
              hostEarned: hostEarned,
              dateStr: checkoutEvent.date,
              timeSelected: checkoutEvent.time,
              razorpayPaymentId: payId,
              status: 'Paid'
            });

            // Join event state update
            setEventsList(prev => prev.map(e => {
              if (e.id === checkoutEvent.id) {
                return { ...e, joined: true, attendeesCount: e.attendeesCount + 1 };
              }
              return e;
            }));

            // Play sound & celebrate
            confetti({
              particleCount: 100,
              spread: 60,
              colors: ['#f97316', '#a855f7', '#fbbf24']
            });

            setCheckoutStep('success');
          } else {
            alert(`⚠️ Payment Validation Failed: ${verifyResult.error}`);
            setCheckoutStep('details');
          }
        },
        prefill: {
          name: buyerName || "Parent Guest",
          email: buyerEmail || "parent@vernunt.com"
        },
        theme: {
          color: "#f59e0b"
        },
        modal: {
          ondismiss: function() {
            setCheckoutStep('details');
          }
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.open();
    } catch (e: any) {
      console.error(e);
      alert(`⚠️ Checkout initialization failed: ${e.message}`);
      setCheckoutStep('details');
    }
  };

  // Local states for in-popup subscription purchase
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [subError, setSubError] = useState<string | null>(null);

  const embeddedPlans = [
    {
      id: 'monthly',
      title: 'Monthly Pass',
      price: 299,
      period: '1 Month',
      durationDays: 30,
      description: 'Perfect for temporary stays or trying out the network.'
    },
    {
      id: 'quarterly',
      title: 'Tri-Active Pass',
      price: 799,
      period: '3 Months',
      durationDays: 90,
      description: 'Our most sought-after plan for early childhood growth friends.'
    },
    {
      id: 'yearly',
      title: 'Full Golden Year Pass',
      price: 2499,
      period: '12 Months',
      durationDays: 365,
      description: 'Complete year-round coverage for optimal socialization paths.'
    }
  ];

  const handleInPopupSubscribe = async (plan: any) => {
    if (!userProfile) {
      alert("Please sign in or complete registration first before purchasing.");
      return;
    }

    setLoadingPlan(plan.id);
    setSubError(null);

    try {
      const orderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: plan.price, planId: plan.id }),
      });

      if (!orderResponse.ok) {
        throw new Error("Could not create Razorpay order on server backend.");
      }

      const orderData = await orderResponse.json();
      if (!orderData.success) {
        throw new Error(orderData.error || "Failed order creation.");
      }

      const scriptLoaded = await new Promise<boolean>((resolve) => {
        if ((window as any).Razorpay) {
          resolve(true);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay checkout script.");
      }

      const options = {
        key: orderData.keyId || "rzp_test_simulated_key_123456",
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Vernunt Playdate Connect",
        description: `Premium ${plan.title} (${plan.period}) for ${userProfile.childName || "Kid"}`,
        image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=128&auto=format&fit=crop&q=80",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const verifyResponse = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id || orderData.orderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature || "simulated_signature_token"
              }),
            });

            const verifyResult = await verifyResponse.json();
            if (verifyResult.success) {
              const today = new Date();
              const expiryDate = new Date(today);
              expiryDate.setDate(today.getDate() + plan.durationDays);

              const updatedProfile = {
                ...userProfile,
                subscriptionActive: true,
                subscriptionPlan: plan.id,
                subscriptionExpiryDate: expiryDate.toISOString().split('T')[0],
                contactViewCredits: (userProfile.contactViewCredits || 0) + (plan.durationDays / 30) * 5,
              };

              if (onUpdateUserProfile) {
                onUpdateUserProfile(updatedProfile);
              }

              if (auth.currentUser) {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                await setDoc(userRef, updatedProfile, { merge: true });
              }

              confetti({
                particleCount: 150,
                spread: 80,
                colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899']
              });

              alert(`🎉 Subscription Activated!\nYour plan is active until ${expiryDate.toLocaleDateString('en-IN')}.\nYou can now proceed with your booking!`);
            } else {
              alert(`⚠️ Payment Validation Failed: ${verifyResult.error || 'Signature rejected'}`);
            }
          } catch (verifyErr: any) {
            console.error("Signature verification of subscription failed:", verifyErr);
            alert("Payment completed but local profile validation failed. Please contact support.");
          }
        },
        prefill: {
          name: userProfile.parentName || "",
          email: userProfile.email || "parent@vernunt.com",
          contact: userProfile.phoneNumber || ""
        },
        theme: {
          color: "#f59e0b"
        },
        modal: {
          ondismiss: function () {
            setLoadingPlan(null);
          }
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.open();
    } catch (err: any) {
      console.error("In-popup subscription fail:", err);
      setSubError(err.message || "An unexpected error occurred.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleToggleJoinEvent = (eventId: string, isJoining: boolean) => {
    if (isJoining) {
      const selectedEvent = eventsList.find(e => e.id === eventId);
      const isFree = !selectedEvent || !selectedEvent.ticketPrice || selectedEvent.ticketPrice === 0;
      if (isFree && !userProfile?.subscriptionActive) {
        if (selectedEvent) {
          setCheckoutEvent(selectedEvent);
          setCheckoutStep('details');
          setBuyerName(userProfile?.parentName || '');
          setBypassSubCheck(false);
          setShowCheckoutModal(true);
        }
        return;
      }
    }

    setEventsList(prev => prev.map(e => {
      if (e.id === eventId) {
        return {
          ...e,
          joined: isJoining,
          attendeesCount: isJoining ? e.attendeesCount + 1 : e.attendeesCount - 1
        };
      }
      return e;
    }));

    if (isJoining) {
      confetti({
        particleCount: 50,
        spread: 30,
        colors: ['#f97316', '#fbbf24']
      });
    }
  };

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newEventTitle.trim() || !newEventDesc.trim() || !newEventLoc.trim() || !newEventDate) {
      setFormError("Please fill out all mandatory fields: Title, Description, Date, and Location.");
      return;
    }

    // Assign standard gorgeous high-quality stock shots if none is explicitly specified
    let categoryPic = newEventPhoto.trim();
    if (!categoryPic) {
      if (newEventCat === 'Event') {
        categoryPic = 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&q=80&w=600';
      } else if (newEventCat === 'Activity') {
        categoryPic = 'https://images.unsplash.com/photo-1516567727-459e4558f8cf?auto=format&fit=crop&q=80&w=600';
      } else if (newEventCat === 'Competition') {
        categoryPic = 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=600';
      } else { // Class
        categoryPic = 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&q=80&w=600';
      }
    }

    // Process helper tags
    const customTags = newEventTagsStr
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    const combinedTags = Array.from(new Set([...selectedFormTags, ...customTags]));

    let calculatedCommission = globalCommissionRate;
    if (userProfile?.businessListingModel === 'subscription') {
      calculatedCommission = 0;
    } else if (userProfile?.businessCommissionRate !== undefined) {
      calculatedCommission = userProfile.businessCommissionRate;
    }

    const newlyCreated: CommunityEvent = {
      id: `custom-event-${Date.now()}`,
      title: newEventTitle,
      description: newEventDesc,
      date: newEventDate,
      time: newEventTime || '12:00',
      location: newEventLoc,
      hostName: newEventHost || userProfile?.parentName || 'Parent Organizer',
      attendeesCount: 1,
      joined: true,
      category: newEventCat,
      photoUrl: categoryPic,
      tags: combinedTags,
      ticketPrice: Number(newEventPrice || 0),
      commissionPercentage: calculatedCommission,
      lat: userLat + (Math.random() - 0.5) * 0.006,
      lng: userLng + (Math.random() - 0.5) * 0.006
    };

    setEventsList([newlyCreated, ...eventsList]);
    setSelectedEventId(newlyCreated.id);
    onUpdateRole('Event Organizer'); // Change user role automatically to Event Organizer
    setShowAddModal(false);

    // Save to local storage cache so direct booking link works reliably across sessions
    try {
      const stored = localStorage.getItem('vernunt_user_created_events');
      const existing = stored ? JSON.parse(stored) : [];
      localStorage.setItem('vernunt_user_created_events', JSON.stringify([newlyCreated, ...existing]));
    } catch (e) {
      console.warn('Local storage save event note:', e);
    }

    // Present official Host QR Code Pass & Share Station immediately
    setHostQrModalEvent(newlyCreated);

    // Reset fields
    setNewEventTitle('');
    setNewEventDesc('');
    setNewEventDate('');
    setNewEventTime('');
    setNewEventLoc('');
    setNewEventPhoto('');
    setNewEventTagsStr('');
    setNewEventPrice(0);
    setSelectedFormTags([]);
    setFormError('');

    // Play confetti celebration!
    confetti({
      particleCount: 80,
      spread: 60,
      colors: ['#f97316', '#10b981', '#f59e0b', '#a855f7']
    });
  };

  // Filter and Sort events:
  // 1. Filter out dummy / fake / mock data for non-admin users (Admin-only mock data access)
  // 2. Calculate proximity distance from current user coordinates
  // 3. Filter by category, query keywords, and optional radius
  // 4. Hierarchical sort: Featured & Sponsored events at the TOP, then sorted by proximity distance
  const effectiveEvents = eventsList;

  const filteredEvents = effectiveEvents
    .map(evt => {
      const evtLat = evt.lat || 19.0760;
      const evtLng = evt.lng || 72.8777;
      const dist = getHaversineDistance(userLat, userLng, evtLat, evtLng);
      return {
        ...evt,
        distance: dist
      };
    })
    .filter(evt => {
      // 0. Do not show past events (User explicit instruction: "And do not show past events")
      if (getEventStatus(evt) === 'Past') {
        return false;
      }

      // 1. Category check
      if (categoryFilter !== 'All' && evt.category !== categoryFilter) {
        return false;
      }

      // 2. Proximity radius check if onlyNearbyFilter is on
      if (onlyNearbyFilter && evt.distance > maxDistanceRadiusKm) {
        return false;
      }

      // 3. Query check
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      const matchesTag = evt.tags && evt.tags.some(tag => tag.toLowerCase().includes(query));

      return (
        evt.title.toLowerCase().includes(query) ||
        evt.description.toLowerCase().includes(query) ||
        evt.hostName.toLowerCase().includes(query) ||
        evt.location.toLowerCase().includes(query) ||
        (evt.sponsoredBy && evt.sponsoredBy.toLowerCase().includes(query)) ||
        matchesTag
      );
    })
    .sort((a, b) => {
      if (sortMode === 'featured_nearby') {
        // Top Priority: Featured or Sponsored events
        const aPromo = (a.featured || a.isSponsored) ? 1 : 0;
        const bPromo = (b.featured || b.isSponsored) ? 1 : 0;
        if (aPromo !== bPromo) {
          return bPromo - aPromo; // Featured/sponsored events bubble to top
        }
        // Secondary Priority: Distance (closest first)
        return a.distance - b.distance;
      } else if (sortMode === 'nearby_only') {
        // Pure distance sort
        return a.distance - b.distance;
      } else if (sortMode === 'date') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortMode === 'price_low') {
        return (a.ticketPrice || 0) - (b.ticketPrice || 0);
      }
      return 0;
    });

  // Categorized & Ranked Event Pools for Carousel Exploration (BookMyShow UX Pattern)
  const popularEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => (b.attendeesCount || 0) - (a.attendeesCount || 0));
  }, [filteredEvents]);

  const featuredEvents = useMemo(() => {
    const list = filteredEvents.filter(e => e.featured || e.isSponsored || (e.tags && e.tags.some(t => /celebration|fest|weekend|special|gala/i.test(t))));
    return list.length > 0 ? list : filteredEvents.slice(0, 10);
  }, [filteredEvents]);

  const sportsEvents = useMemo(() => {
    return filteredEvents.filter(e => {
      const matchText = `${e.title} ${e.description} ${(e.tags || []).join(' ')} ${e.category}`.toLowerCase();
      return /sport|game|football|cricket|chess|race|skating|swimming|athletics|badminton|olympiad|championship/i.test(matchText);
    });
  }, [filteredEvents]);

  const creativeArtsEvents = useMemo(() => {
    return filteredEvents.filter(e => {
      const matchText = `${e.title} ${e.description} ${(e.tags || []).join(' ')} ${e.category}`.toLowerCase();
      return /art|theatre|theater|music|dance|craft|pottery|drawing|painting|story|acting|clay|creative/i.test(matchText);
    });
  }, [filteredEvents]);

  const stemScienceEvents = useMemo(() => {
    return filteredEvents.filter(e => {
      const matchText = `${e.title} ${e.description} ${(e.tags || []).join(' ')} ${e.category}`.toLowerCase();
      return /stem|science|robot|coding|tech|math|nature|astronomy|ecology|butterfly|seed/i.test(matchText);
    });
  }, [filteredEvents]);

  const toddlerEvents = useMemo(() => {
    return filteredEvents.filter(e => {
      const matchText = `${e.title} ${e.description} ${(e.tags || []).join(' ')} ${e.category}`.toLowerCase();
      return /toddler|baby|infant|montessori|sensory|bubble|rhyme|early/i.test(matchText);
    });
  }, [filteredEvents]);

  // Map representation positions with extra backup locations to avoid overlaps
  const getEventPosition = (id: string, index: number) => {
    const defaultPositions = [
      { top: '25%', left: '38%', color: 'border-orange-400 bg-orange-50 text-orange-600' },
      { top: '60%', left: '22%', color: 'border-emerald-400 bg-emerald-50 text-emerald-600' },
      { top: '30%', left: '70%', color: 'border-indigo-400 bg-indigo-50 text-indigo-600' },
      { top: '75%', left: '55%', color: 'border-pink-400 bg-pink-50 text-pink-600' },
      { top: '45%', left: '15%', color: 'border-amber-400 bg-amber-50 text-amber-600' },
      { top: '80%', left: '80%', color: 'border-blue-400 bg-blue-50 text-blue-600' },
      { top: '15%', left: '60%', color: 'border-purple-400 bg-purple-50 text-purple-600' },
      { top: '50%', left: '85%', color: 'border-rose-400 bg-rose-50 text-rose-600' },
      { top: '68%', left: '42%', color: 'border-teal-400 bg-teal-50 text-teal-600' }
    ];
    return defaultPositions[index % defaultPositions.length];
  };

  const selectedEvent = eventsList.find(e => e.id === selectedEventId) || filteredEvents[0];

  const getCategoryBadgeStyles = (category: string) => {
    switch (category) {
      case 'Event':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Activity':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Competition':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Class':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'Event':
        return '📍 Nearby Event';
      case 'Activity':
        return '🧸 Activity';
      case 'Competition':
        return '🏆 Competition';
      case 'Class':
        return '👑 Class';
      default:
        return category;
    }
  };

  const handleShareEvent = async (evt: CommunityEvent) => {
    const affiliateCode = userProfile?.affiliateCode || userProfile?.referralCode || undefined;
    const deepLink = generateAffiliateShareUrl({
      affiliateCode,
      tab: 'events',
      itemId: evt.id,
      itemType: 'event'
    });
    
    const entryFeeText = evt.ticketPrice && evt.ticketPrice > 0 ? `₹${evt.ticketPrice}.00` : 'FREE Entry';
    const tagsText = evt.tags && evt.tags.length > 0 ? `\n🏷️ Tags: ${evt.tags.map(t => '#' + t).join(' ')}` : '';
    const affiliateBadge = affiliateCode ? `\n🎁 Partner Referral: ${affiliateCode} (Verified Partner Link)` : '';
    
    const shareMessage = `🌟 ${evt.title} 🌟
📂 Category: ${evt.category}
📅 Date & Time: ${evt.date} at ${evt.time}
📍 Location: ${evt.location}
👤 Organizer: ${evt.hostName}
🎟️ Admission: ${entryFeeText}
👥 ${evt.attendeesCount} families RSVP'd${affiliateBadge}

${evt.description}${tagsText}

🔗 View event details & book passes on Vernunt Playdates:
${deepLink}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareMessage);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareMessage;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedEventId(evt.id);
      setShareToast({ title: evt.title, link: deepLink });
      setTimeout(() => {
        setCopiedEventId((curr) => (curr === evt.id ? null : curr));
      }, 2500);
      setTimeout(() => {
        setShareToast(null);
      }, 4000);
    } catch (err) {
      console.error('Failed to copy event details to clipboard:', err);
    }
  };

  const handleWhatsAppShareEvent = (evt: CommunityEvent) => {
    const affiliateCode = userProfile?.affiliateCode || userProfile?.referralCode || undefined;
    const deepLink = generateAffiliateShareUrl({
      affiliateCode,
      tab: 'events',
      itemId: evt.id,
      itemType: 'event'
    });

    const shareText = generateWhatsAppShareText({
      title: evt.title,
      category: evt.category,
      date: evt.date,
      time: evt.time,
      location: evt.location,
      price: evt.ticketPrice,
      description: evt.description,
      hostName: evt.hostName,
      affiliateCode,
      shareUrl: deepLink,
      isAffiliate: !!affiliateCode
    });

    openWhatsAppShare(shareText);
  };

  return (
    <div id="events-dashboard-section" className="space-y-6">
      {/* Toast Notification when event link is copied */}
      {shareToast && (
        <div 
          id="event-share-toast"
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-sm"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Check className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">Link & Details Copied!</p>
            <p className="text-[10px] text-slate-300 truncate">"{shareToast.title}"</p>
          </div>
          <button
            type="button"
            onClick={() => setShareToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Public Visitor Welcome Banner */}
      {!userProfile && (
        <div id="events-public-guest-banner" className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 rounded-2xl p-4 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/25">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="font-bold text-sm flex items-center gap-2">
                <span>Public Events &amp; Classes Directory</span>
                <span className="bg-white/25 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">Open to Public • No Login Required</span>
              </div>
              <p className="text-xs text-orange-100 mt-0.5">
                Explore community weekend workshops, sports academies, robotics sessions, and science championships across Bangalore. Instant ticket booking available!
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-guest-register-buyer-banner"
            onClick={() => {
              setBuyerRegActionLabel('Sign up to buy tickets & receive digital passes');
              setShowBuyerRegistrationModal(true);
            }}
            className="px-4 py-2 bg-white hover:bg-orange-50 text-orange-600 font-extrabold text-xs rounded-xl shadow-md shrink-0 transition cursor-pointer"
          >
            🎟️ Quick Buyer Sign-Up
          </button>
        </div>
      )}

      {/* Tab Header Description & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 id="events-main-title" className="text-xl font-bold text-slate-800 font-serif flex items-center gap-1.5">
            🌍 Nearby Events, Activities, Competitions & Classes
          </h3>
          <p id="events-main-subtitle" className="text-xs text-slate-500">
            Discover local child development classes, friendly school championships, school-break activities, and parent-hosted neighborhood meets.
          </p>
        </div>

        {/* Top Header Actions: Publish Vernunt Event, My Passes, and Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Host/Publish button */}
          <button
            id="btn-trigger-propose-event"
            type="button"
            onClick={() => setShowCreateWizard(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish Vernunt Event</span>
          </button>

          {/* Scan Event QR Code Button */}
          <button
            id="btn-scan-event-qr-code"
            type="button"
            onClick={() => setShowScannerModal(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 border border-slate-200"
            title="Scan an event QR code to open event page and book directly"
          >
            <QrCode className="w-3.5 h-3.5 text-orange-600" />
            <span>Scan Event QR</span>
          </button>

          {/* My Passes & Tickets Wallet Button */}
          <button
            id="btn-my-event-passes"
            type="button"
            onClick={() => setShowUserPurchasesModal(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
            title="View your booked event tickets & passes"
          >
            <Wallet className="w-3.5 h-3.5 text-orange-400" />
            <span>My Passes</span>
            {myTickets.length > 0 && (
              <span className="bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {myTickets.length}
              </span>
            )}
          </button>

          {/* Dynamic Search Input Bar */}
          <div className="relative w-full sm:w-56">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="event-search-input"
              type="text"
              placeholder="Search title, host, venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-white hover:bg-slate-50/50 focus:bg-white text-xs border border-slate-200 focus:border-orange-300 rounded-xl outline-none focus:ring-4 focus:ring-orange-100 transition shadow-xs placeholder-slate-400 text-slate-700"
            />
            {searchQuery && (
              <button
                id="btn-clear-event-search"
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Aligned Filter & Sort Options in One Collapsible Block (Hidden by default) */}
      <div id="events-filter-sort-block" className="space-y-3">
        {/* Clickable Header Strip / Trigger */}
        <button
          id="btn-toggle-filter-sort-block"
          type="button"
          onClick={() => setShowFilterSortBlock(prev => !prev)}
          className="w-full bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-2xs cursor-pointer transition-all flex items-center justify-between gap-3 text-left group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-orange-50 group-hover:bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 transition">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-800 text-xs sm:text-sm">Filter & Sort Options</span>
                {isAnyFilterActive && (
                  <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Active Filters
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                {isAnyFilterActive
                  ? `Category: ${categoryFilter} • Sort: ${sortMode === 'nearby_only' ? 'Closest First' : sortMode === 'featured_nearby' ? 'Featured' : sortMode === 'date' ? 'Date' : 'Price'}${onlyNearbyFilter ? ` • Radius: ${maxDistanceRadiusKm} km` : ''}`
                  : 'Click to filter categories, adjust proximity radius and customize event sort order'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-700 block">
                {filteredEvents.length} {filteredEvents.length === 1 ? 'Event' : 'Events'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {showFilterSortBlock ? 'Click to hide' : 'Click to view options'}
              </span>
            </div>
            <div className={`w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-slate-800 transition transform ${showFilterSortBlock ? 'rotate-180 bg-orange-100 text-orange-700' : ''}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </button>

        {/* Collapsible Panel: Filter & Sort Controls */}
        {showFilterSortBlock && (
          <div id="events-filter-sort-panel" className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            {/* Header & Reset row */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Refine & Sort Gatherings</span>
              </div>
              {isAnyFilterActive && (
                <button
                  id="btn-reset-all-event-filters"
                  type="button"
                  onClick={handleResetAllFilters}
                  className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              )}
            </div>

            {/* Category Quick Filters */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Event Categories & Formats
              </span>
              <div className="flex flex-wrap gap-1.5" id="events-category-filters">
                {[
                  { key: 'All', label: 'All Gatherings', icon: Sparkles, iconColor: 'text-orange-500' },
                  { key: 'Event', label: 'Nearby Events', icon: MapPin, iconColor: 'text-blue-500' },
                  { key: 'Activity', label: 'Daily Activities', icon: Compass, iconColor: 'text-emerald-500' },
                  { key: 'Competition', label: 'Competitions', icon: Award, iconColor: 'text-amber-500' },
                  { key: 'Class', label: 'Classes & Labs', icon: CalendarRange, iconColor: 'text-purple-500' },
                  ...customCats.map(cc => ({ key: cc.value, label: cc.name, icon: CalendarRange, iconColor: 'text-indigo-500' }))
                ].map((cat) => {
                  const isSelected = categoryFilter === cat.key;
                  const count = cat.key === 'All' 
                    ? eventsList.length 
                    : eventsList.filter(e => e.category === cat.key).length;
                  const CatIcon = cat.icon;

                  return (
                    <button
                      key={cat.key}
                      id={`btn-cat-filter-${cat.key}`}
                      type="button"
                      onClick={() => setCategoryFilter(cat.key)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-900 border-slate-950 text-white shadow-xs' 
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80'
                      }`}
                    >
                      <CatIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : cat.iconColor}`} />
                      <span>{cat.label}</span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-slate-800 text-slate-250' : 'bg-white text-slate-500 border border-slate-200/60'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-orange-500" />
                <span>Sort Order</span>
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  id="btn-sort-nearby-only"
                  onClick={() => setSortMode('nearby_only')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    sortMode === 'nearby_only'
                      ? 'bg-orange-500 text-white shadow-xs ring-2 ring-orange-400/30'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5 text-white" />
                  <span>Closest Distance First (Default)</span>
                </button>

                <button
                  type="button"
                  id="btn-sort-featured-nearby"
                  onClick={() => setSortMode('featured_nearby')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    sortMode === 'featured_nearby'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Featured & Nearby</span>
                </button>

                <button
                  type="button"
                  id="btn-sort-date"
                  onClick={() => setSortMode('date')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    sortMode === 'date'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Upcoming Date</span>
                </button>

                <button
                  type="button"
                  id="btn-sort-price"
                  onClick={() => setSortMode('price_low')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    sortMode === 'price_low'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5 text-amber-500" />
                  <span>Price: Low to High</span>
                </button>
              </div>
            </div>

            {/* Proximity Radius Filter */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="chk-only-nearby"
                    checked={onlyNearbyFilter}
                    onChange={(e) => setOnlyNearbyFilter(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-500 accent-orange-500 cursor-pointer"
                  />
                  <span className="flex items-center gap-1 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>Only Within Distance</span>
                  </span>
                </label>

                {onlyNearbyFilter && (
                  <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl text-xs font-bold">
                    <input
                      type="range"
                      min="1"
                      max="25"
                      step="1"
                      value={maxDistanceRadiusKm}
                      onChange={(e) => setMaxDistanceRadiusKm(Number(e.target.value))}
                      className="w-24 accent-orange-500 cursor-pointer"
                    />
                    <span className="text-orange-600 font-extrabold w-12 text-right">{maxDistanceRadiusKm} km</span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <span>📍 Your Location:</span>
                <span className="font-bold text-slate-700 truncate max-w-[200px]" title={userLocationDisplay}>{userLocationDisplay}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {searchQuery && (
        <div id="search-filter-stats" className="text-xs text-slate-500 font-medium flex items-center justify-between">
          <span>
            Found <strong className="text-slate-800">{filteredEvents.length}</strong> {filteredEvents.length === 1 ? 'event' : 'events'} matching "{searchQuery}"
          </span>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-[11px] text-orange-600 font-bold hover:underline cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Events Carousel View (Default and Only View) */}
      {filteredEvents.length === 0 ? (
        <div id="events-empty-state" className="bg-white rounded-3xl p-12 border border-slate-100 shadow-xs text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 font-serif text-base">
              {searchQuery ? 'No matching events found' : 'No verified events found for this filter'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {searchQuery 
                ? `We couldn't find any listings matching "${searchQuery}". Try clearing search or adjusting your filters.` 
                : 'Try adjusting your categories or distance radius, or publish a new community event!'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {isAnyFilterActive && (
              <button
                id="btn-reset-event-filter"
                type="button"
                onClick={handleResetAllFilters}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCreateWizard(true)}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Host Event / Classes / Activity</span>
            </button>
          </div>
        </div>
      ) : (
        <div id="events-carousel-explorer" className="space-y-12">
          {/* Active Filter / Search Matching Section */}
          {isAnyFilterActive && (
            <EventCarouselSection
              title={categoryFilter !== 'All' ? `${categoryFilter} Matches` : 'Filtered Gathering Results'}
              subtitle={`Displaying ${filteredEvents.length} events tailored to your filter and sort criteria`}
              events={filteredEvents}
              defaultBadge="FEATURED"
              onSelectEvent={(evt) => {
                setSelectedEventId(evt.id);
                handleInitiateBooking(evt);
              }}
              onBookEvent={(evt) => handleInitiateBooking(evt)}
              onShareQr={(evt) => setHostQrModalEvent(evt)}
              myTickets={myTickets}
            />
          )}

          {/* 1. Top Selling & Popular Events */}
          <EventCarouselSection
            title="Popular & Top Selling Events"
            subtitle="Most booked weekend activities, kids shows, and workshops"
            events={popularEvents}
            defaultBadge="PROMOTED"
            onSeeAll={() => {
              setShowFilterSortBlock(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectEvent={(evt) => {
              setSelectedEventId(evt.id);
              handleInitiateBooking(evt);
            }}
            onBookEvent={(evt) => handleInitiateBooking(evt)}
            onShareQr={(evt) => setHostQrModalEvent(evt)}
            myTickets={myTickets}
          />

          {/* 2. Featured Celebrations & Family Fests */}
          <EventCarouselSection
            title="Featured Celebrations & Family Fests"
            subtitle="Curated family carnivals, seasonal celebrations & special passes"
            events={featuredEvents}
            defaultBadge="FEATURED"
            onSeeAll={() => {
              setShowFilterSortBlock(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectEvent={(evt) => {
              setSelectedEventId(evt.id);
              handleInitiateBooking(evt);
            }}
            onBookEvent={(evt) => handleInitiateBooking(evt)}
            onShareQr={(evt) => setHostQrModalEvent(evt)}
            myTickets={myTickets}
          />

          {/* 3. Top Games & Sports Events */}
          {sportsEvents.length > 0 && (
            <EventCarouselSection
              title="Top Games & Sports Events"
              subtitle="Weekend football turfs, cricket academies, skating rallies & chess tourneys"
              events={sportsEvents}
              onSeeAll={() => {
                setCategoryFilter('Competition');
                setShowFilterSortBlock(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectEvent={(evt) => {
                setSelectedEventId(evt.id);
                handleInitiateBooking(evt);
              }}
              onBookEvent={(evt) => handleInitiateBooking(evt)}
              onShareQr={(evt) => setHostQrModalEvent(evt)}
              myTickets={myTickets}
            />
          )}

          {/* 4. Creative Arts, Music & Theatre */}
          {creativeArtsEvents.length > 0 && (
            <EventCarouselSection
              title="Creative Arts, Theatre & Music"
              subtitle="Pottery wheels, Broadway drama, live puppet shows & paint studios"
              events={creativeArtsEvents}
              onSeeAll={() => {
                setCategoryFilter('Activity');
                setShowFilterSortBlock(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectEvent={(evt) => {
                setSelectedEventId(evt.id);
                handleInitiateBooking(evt);
              }}
              onBookEvent={(evt) => handleInitiateBooking(evt)}
              onShareQr={(evt) => setHostQrModalEvent(evt)}
              myTickets={myTickets}
            />
          )}

          {/* 5. STEM, Robotics & Science Camps */}
          {stemScienceEvents.length > 0 && (
            <EventCarouselSection
              title="STEM, Robotics & Science Camps"
              subtitle="Hands-on coding, space astronomy, bot challenges & nature walks"
              events={stemScienceEvents}
              onSeeAll={() => {
                setCategoryFilter('Class');
                setShowFilterSortBlock(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectEvent={(evt) => {
                setSelectedEventId(evt.id);
                handleInitiateBooking(evt);
              }}
              onBookEvent={(evt) => handleInitiateBooking(evt)}
              onShareQr={(evt) => setHostQrModalEvent(evt)}
              myTickets={myTickets}
            />
          )}

          {/* 6. Toddler & Early Years Circles */}
          {toddlerEvents.length > 0 && (
            <EventCarouselSection
              title="Toddler & Early Years Discovery"
              subtitle="Gentle sensory play, bubble rhymes & infant social playgroups"
              events={toddlerEvents}
              onSeeAll={() => {
                setCategoryFilter('Event');
                setShowFilterSortBlock(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectEvent={(evt) => {
                setSelectedEventId(evt.id);
                handleInitiateBooking(evt);
              }}
              onBookEvent={(evt) => handleInitiateBooking(evt)}
              onShareQr={(evt) => setHostQrModalEvent(evt)}
              myTickets={myTickets}
            />
          )}
        </div>
      )}

      {/* Host New Event/Activity Modal */}
      {showAddModal && (
        <div id="modal-host-gathering" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all flex flex-col max-h-[85vh] my-auto">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white flex justify-between items-center shrink-0 font-sans">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-100">Host New Gathering</span>
                <h4 className="text-lg font-serif font-bold">Propose Event, Activity, Class or Cup</h4>
              </div>
              <button
                id="btn-close-host-modal"
                type="button"
                onClick={() => { setShowAddModal(false); setFormError(''); }}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEventSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-left">
              {formError && (
                <div id="host-form-error" className="p-3 bg-rose-50 border border-rose-250 rounded-xl flex items-start gap-2 text-xs text-rose-700 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">What are you hosting? *</label>
                <input
                  id="form-input-title"
                  type="text"
                  required
                  placeholder="e.g., Kids Coding Robotics Meet, Sanskrit Shlokas Class, Lego Cup"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 focus:border-orange-300 rounded-xl outline-none text-xs focus:ring-4 focus:ring-orange-100 transition text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Category *</label>
                  <select
                    id="form-select-category"
                    value={newEventCat}
                    onChange={(e) => setNewEventCat(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 focus:border-orange-300 rounded-xl outline-none text-xs focus:ring-4 focus:ring-orange-100 transition font-bold text-slate-700"
                  >
                    <option value="Event">📍 Nearby Event</option>
                    <option value="Activity">🧸 Daily Activity</option>
                    <option value="Competition">🏆 Competition/Olympiad</option>
                    <option value="Class">🎓 Class/Workshop</option>
                    {customCats.map(cc => (
                      <option key={cc.id} value={cc.value}>✨ {cc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Host/Organizer Name</label>
                  <input
                    id="form-input-host"
                    type="text"
                    placeholder="e.g., Parent Sarah, Prof Gupta"
                    value={newEventHost}
                    onChange={(e) => setNewEventHost(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 focus:border-orange-300 rounded-xl outline-none text-xs focus:ring-4 focus:ring-orange-100 transition text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Ticket Price (₹ INR, 0 for Free)</label>
                  <input
                    id="form-input-price"
                    type="number"
                    min={0}
                    max={10000}
                    placeholder="e.g. 299"
                    value={newEventPrice}
                    onChange={(e) => setNewEventPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-200 focus:border-orange-300 rounded-xl outline-none text-xs focus:ring-4 focus:ring-orange-100 transition text-slate-700 font-extrabold"
                  />
                </div>
                
                <div className="space-y-1">
                  <AestheticImageUploader 
                    id="event-cover-art"
                    label="Event Cover Photo"
                    value={newEventPhoto}
                    onChange={setNewEventPhoto}
                    presetSuggestions={[
                      { name: 'Sports Day', url: 'https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&q=80&w=600' },
                      { name: 'Creative Arts', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=600' },
                      { name: 'Toddler Play', url: 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&q=80&w=600' }
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Date *</label>
                  <input
                    id="form-input-date"
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 focus:border-orange-300 rounded-xl outline-none text-xs focus:ring-4 focus:ring-orange-100 transition text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Time</label>
                  <input
                    id="form-input-time"
                    type="time"
                    placeholder="12:00"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 focus:border-orange-300 rounded-xl outline-none text-xs focus:ring-4 focus:ring-orange-100 transition text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Location Address *</label>
                <input
                  id="form-input-location"
                  type="text"
                  required
                  placeholder="e.g., Central Park South lawn, Symphony Hall Floor 2"
                  value={newEventLoc}
                  onChange={(e) => setNewEventLoc(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 focus:border-orange-300 rounded-xl outline-none text-xs focus:ring-4 focus:ring-orange-100 transition text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Description & Details *</label>
                <textarea
                  id="form-input-desc"
                  rows={3}
                  required
                  placeholder="Describe your class syllabus, activity schedule or prize pools for competitions so parents have clear insight!"
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 focus:border-orange-300 rounded-xl outline-none text-xs focus:ring-4 focus:ring-orange-100 transition resize-none leading-relaxed text-slate-700"
                />
              </div>

              {/* Sub-categories & Tags Hub */}
              <div id="modal-tags-hub" className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Sub-categories & Tags</span>
                  <span className="text-[10px] text-slate-400 font-medium">Click to select preset tags</span>
                </label>
                
                {/* Dynamically suggested tags based on Category */}
                <div id="modal-preset-tags-container" className="flex flex-wrap gap-1.5 py-1">
                  {getPredefinedTagsForCat(newEventCat).map((tag, tIdx) => {
                    const isSelected = selectedFormTags.includes(tag);
                    return (
                      <button
                        key={tIdx}
                        id={`form-preset-tag-${tIdx}`}
                        type="button"
                        onClick={() => handleToggleFormPresetTag(tag)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition border cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500 border-orange-650 text-white shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Or add custom tags (comma separated):</label>
                  <input
                    id="form-input-custom-tags"
                    type="text"
                    placeholder="e.g. Montessori, Clay, Weekend"
                    value={newEventTagsStr}
                    onChange={(e) => setNewEventTagsStr(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 focus:border-orange-300 rounded-lg outline-none text-xs focus:ring-2 focus:ring-orange-100 transition text-slate-700 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  id="btn-cancel-form"
                  type="button"
                  onClick={() => { setShowAddModal(false); setFormError(''); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-form"
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-md active:scale-95 cursor-pointer"
                >
                  Publish Gathering
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Razorpay Event Ticket Purchase checkout Modal */}
      {showCheckoutModal && checkoutEvent && (
        <div id="event-checkout-modal" className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all flex flex-col max-h-[85vh] my-auto">
            
            {/* Header branding */}
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between shrink-0 font-sans">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-lg text-white">
                  🎟️
                </div>
                <div>
                  <h4 className="font-serif font-black text-base text-white">Event Ticket Checkout</h4>
                  <span className="text-[9px] font-mono tracking-widest text-slate-400">RAZORPAY SECURE SPLIT CHANNEL</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 text-left">
              {checkoutStep === 'details' && (
                (!userProfile?.subscriptionActive && !allowGuestCheckout) ? (
                  <div id="sub-invitation-box-events" className="p-6 space-y-5">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl text-white p-5 space-y-2 select-none font-sans">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-250 fill-yellow-250 animate-bounce" />
                        <h4 className="font-serif font-black text-sm">Kings Connect Club Membership Needed</h4>
                      </div>
                      <p className="text-[11px] leading-relaxed text-orange-50/90">
                        Class RSVP scheduling, event postings, and specialist consulting are reserved for our verified subscriber community. Please choose a subscription pass below to unlock immediate event booking and full playdate privileges.
                      </p>
                    </div>

                    {subError && (
                      <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl font-bold">
                        {subError}
                      </div>
                    )}

                    <div className="space-y-3">
                      {embeddedPlans.map((plan) => (
                        <div 
                          key={plan.id}
                          className="p-4 border border-slate-20/80 rounded-2xl hover:border-orange-500 hover:bg-orange-50/20 transition flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <span className="font-black text-xs text-slate-850">{plan.title} ({plan.period})</span>
                              <p className="text-[10px] text-slate-400 font-medium">{plan.description}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-sm font-black text-slate-900 font-mono">₹{plan.price}</span>
                              {plan.id === 'quarterly' && (
                                <span className="block text-[8px] font-black text-orange-600 bg-orange-100 rounded-md px-1 py-0.5 mt-0.5 text-center font-sans">Best Value</span>
                              )}
                            </div>
                          </div>
                          {loadingPlan === plan.id ? (
                            <div className="mt-3 py-1.5 bg-orange-500 rounded-xl text-white text-[10px] font-extrabold text-center flex items-center justify-center gap-1.5 animate-pulse select-none">
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Opening secure payment gateway...
                            </div>
                          ) : (
                            <button
                              onClick={() => handleInPopupSubscribe(plan)}
                              type="button"
                              className="mt-3 w-full py-1.5 bg-slate-950 hover:bg-slate-850 text-white rounded-xl text-[10.5px] font-black tracking-wider uppercase transition text-center cursor-pointer select-none font-sans"
                            >
                              Subscribe & Unlock (₹{plan.price})
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Guest Checkout Option */}
                      <div className="pt-3 border-t border-slate-100 text-center">
                        <button
                          type="button"
                          onClick={() => setAllowGuestCheckout(true)}
                          className="text-xs font-bold text-orange-600 hover:text-orange-700 underline transition cursor-pointer"
                        >
                          Continue booking and check out as guest
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 space-y-4">
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                      <span className="text-[9px] uppercase font-bold text-orange-500 tracking-wider">Gathering booking description</span>
                      <h5 className="font-black text-sm text-slate-800 font-serif leading-snug mt-0.5">{checkoutEvent.title}</h5>
                      <p className="text-[11px] text-slate-500 truncate">{checkoutEvent.location} • {checkoutEvent.date}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase text-slate-500">Your Full Name</label>
                        <input
                          type="text"
                          required
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          placeholder="e.g. Sarah Connor"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none text-slate-705 font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase text-slate-500">Your Contact Email address</label>
                        <input
                          type="email"
                          required
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          placeholder="e.g. sarah@example.com"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none text-slate-705"
                        />
                      </div>
                    </div>

                    {/* Pricing / Commission Split summary */}
                    <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-2xl text-[11px] space-y-1.5 text-slate-600 font-medium">
                      <div className="flex justify-between">
                        <span>1x Entry Ticket Pass:</span>
                        <strong className="text-slate-800">₹{checkoutEvent.ticketPrice}.00</strong>
                      </div>
                      <div className="flex justify-between border-t border-orange-100/60 pt-1.5 text-xs text-slate-905">
                        <span className="font-extrabold text-orange-600 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> Total Pay Amount:
                        </span>
                        <strong className="font-black">₹{checkoutEvent.ticketPrice}.00</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRazorpayEventCheckout}
                      className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4.5 h-4.5" /> Proceed to Razorpay Secure
                    </button>
                  </div>
                )
              )}

            {checkoutStep === 'processing' && (
              <div className="p-12 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-505 border-t-transparent rounded-full animate-spin mx-auto" />
                <div>
                  <h5 className="font-bold text-sm text-slate-800">Contacting payment hub...</h5>
                  <p className="text-xs text-slate-400">Verifying secure split UPI routes with Razorpay networks...</p>
                </div>
              </div>
            )}

            {checkoutStep === 'otp' && (
              <div className="p-6 space-y-4 text-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-lg font-black animate-pulse">
                  🛡️
                </div>
                <div>
                  <h5 className="font-serif font-black text-base text-slate-800 font-bold">Secure Card / UPI One Time Passcode</h5>
                  <p className="text-[11px] text-slate-500">Enter secure OTP passcode to complete live split authorization.</p>
                </div>

                <div className="max-w-xs mx-auto">
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="Enter security OTP"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value)}
                    className="w-full p-2.5 font-mono font-bold text-center tracking-widest text-lg border border-slate-200 rounded-xl outline-none text-slate-700"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('details')}
                    className="w-1/3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const payId = `pay_EVT_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
                      setProductionPayId(payId);

                      // Calculate rates
                      const rate = checkoutEvent.commissionPercentage ?? globalCommissionRate;
                      const price = checkoutEvent.ticketPrice || 0;
                      const commissionEarned = Math.round((price * rate) / 100);
                      const hostEarned = price - commissionEarned;

                      // Trigger Booking transaction
                      const newBookingRecord: Booking = {
                        id: `booking-${Date.now()}`,
                        itemId: checkoutEvent.id,
                        itemTitle: checkoutEvent.title,
                        type: 'EventTicket',
                        buyerName: buyerName,
                        buyerEmail: buyerEmail,
                        amountPaid: price,
                        commissionPercentage: rate,
                        commissionEarned: commissionEarned,
                        hostEarned: hostEarned,
                        dateStr: checkoutEvent.date,
                        timeSelected: checkoutEvent.time,
                        razorpayPaymentId: payId,
                        status: 'Paid',
                        ticketNumber: `VERN-EVT-${Date.now().toString().slice(-6)}`,
                        eventVenue: checkoutEvent.location,
                        quantity: 1,
                        createdAt: new Date().toISOString()
                      };

                      onAddBooking(newBookingRecord);

                      // Dispatch instant Email & SMS notifications
                      sendEventBookingNotifications({
                        toEmail: buyerEmail,
                        toPhone: userProfile?.phoneNumber,
                        recipientName: buyerName,
                        booking: newBookingRecord,
                        event: checkoutEvent,
                        type: 'booking_confirmed'
                      }).catch((err) => console.warn('Notification dispatch error:', err));

                      // Dispatch Real-Time FCM Push Notification to Android / iOS / Web device
                      sendEventReminderPush({
                        targetUserId: buyerEmail || userProfile?.id || 'guest',
                        eventTitle: checkoutEvent.title,
                        eventDate: checkoutEvent.date,
                        eventTime: checkoutEvent.time,
                        eventVenue: checkoutEvent.location,
                        eventId: checkoutEvent.id
                      }).catch((err) => console.warn('[FCM] Checkout event push notification note:', err));

                      // Join event state update
                      setEventsList(prev => prev.map(e => {
                        if (e.id === checkoutEvent.id) {
                          return { ...e, joined: true, attendeesCount: e.attendeesCount + 1 };
                        }
                        return e;
                      }));

                      // Play sound & celebrate
                      confetti({
                        particleCount: 100,
                        spread: 60,
                        colors: ['#f97316', '#a855f7', '#fbbf24']
                      });

                      setCheckoutStep('success');
                    }}
                    className="w-2/3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase transition shadow-md"
                  >
                    Confirm ₹{checkoutEvent.ticketPrice} via Razorpay
                  </button>
                </div>
              </div>
            )}

            {checkoutStep === 'success' && (
              <div className="p-8 text-center space-y-6">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                  ✓
                </div>
                <div>
                  <h5 className="font-serif font-black text-lg text-slate-800 leading-none">Ticket Booked Successfully!</h5>
                  <p className="text-xs text-slate-500 leading-relaxed mt-2">
                    Payment transaction <strong className="text-indigo-600 font-mono text-[10px]">{productionPayId}</strong> has been secure split approved dynamically.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs space-y-1.5 text-left text-slate-600">
                  <div className="flex justify-between">
                    <span>Gathering title:</span>
                    <strong className="text-slate-800 font-semibold">{checkoutEvent.title}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Date / Location:</span>
                    <strong className="text-slate-800">{checkoutEvent.date} @ {checkoutEvent.time}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ticket Receipt Email:</span>
                    <span className="font-semibold text-slate-500">{buyerEmail}</span>
                  </div>
                </div>

                {/* Email and SMS Confirmation Notice */}
                <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-3.5 text-xs text-left space-y-1.5">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Notifications Dispatched:
                  </span>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <div>📧 E-Ticket Pass &amp; QR Code sent to <strong>{buyerEmail}</strong></div>
                    <div>📱 Booking SMS confirmation sent to registered number</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowCheckoutModal(false);
                    // Automatically load the detailed confirmation view in list
                    setSelectedEventId(checkoutEvent.id);
                  }}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                >
                  Close Receipt & Back
                </button>
              </div>
            )}

            </div>

          </div>
        </div>
      )}

      {/* WooEvents E-Ticket Pass Modal (QR Code & Pass Download) */}
      {activeTicketModalBooking && (
        <EventTicketPassModal
          booking={activeTicketModalBooking}
          event={activeTicketEvent || eventsList.find(e => e.id === activeTicketModalBooking.itemId || e.title === activeTicketModalBooking.itemTitle) || null}
          onClose={() => {
            setActiveTicketModalBooking(null);
            setActiveTicketEvent(null);
          }}
        />
      )}

      {/* WooEvents Organizer Check-In Station Modal (Camera QR Scanner & Roster) */}
      {checkInStationEvent && (
        <EventOrganizerCheckInStation
          event={checkInStationEvent}
          userProfile={userProfile}
          onClose={() => setCheckInStationEvent(null)}
        />
      )}

      {/* Organizer Role Required Modal */}
      {organizerRoleAlertEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-orange-100 text-orange-800 px-2.5 py-1 rounded-full">
                Event Organizer Access Only
              </span>
              <h3 className="text-lg font-bold text-slate-900 font-serif">
                Gate Check-In & Ticket Scanner Desk
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The Gate Desk scanner and live attendee check-in roster for <strong>"{organizerRoleAlertEvent.title}"</strong> is restricted to registered <strong>Event Organizers</strong>, <strong>Administrators</strong>, or the event host (<em>{organizerRoleAlertEvent.hostName}</em>).
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span>Current Account:</span>
                <strong className="text-slate-800">{userProfile?.parentName || 'Parent User'}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Current Role:</span>
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                  {userProfile?.userRole || 'Parent'}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onUpdateRole('Event Organizer');
                  setCheckInStationEvent(organizerRoleAlertEvent);
                  setOrganizerRoleAlertEvent(null);
                }}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <UserCheck className="w-4 h-4" />
                <span>Switch to Event Organizer Role & Open Desk</span>
              </button>

              <button
                type="button"
                onClick={() => setOrganizerRoleAlertEvent(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WooEvents Multi-Tier Ticket Booking & Razorpay Checkout Modal */}
      {bookingModalEvent && (
        <EventBookingModal
          event={bookingModalEvent}
          userProfile={userProfile}
          globalCommissionRate={globalCommissionRate}
          onClose={() => setBookingModalEvent(null)}
          onBookingSuccess={(newBooking) => {
            handleSaveNewTicket(newBooking);
            setBookingModalEvent(null);
          }}
        />
      )}

      {/* WooEvents Event Creation Wizard Modal */}
      {showCreateWizard && (
        <CreateEventWizardModal
          userProfile={userProfile}
          customCategories={customCats}
          onClose={() => setShowCreateWizard(false)}
          onAddEvent={(newEvent) => {
            setEventsList(prev => [newEvent, ...prev]);
            setSelectedEventId(newEvent.id);
          }}
          onDirectBook={(evt) => {
            setShowCreateWizard(false);
            handleInitiateBooking(evt);
          }}
        />
      )}

      {/* Dedicated Event Host QR Code & Direct Booking Share Station */}
      {hostQrModalEvent && (
        <EventHostQrShareModal
          event={hostQrModalEvent}
          onClose={() => setHostQrModalEvent(null)}
          onDirectBook={(evt) => {
            setHostQrModalEvent(null);
            handleInitiateBooking(evt);
          }}
        />
      )}

      {/* In-App Camera / Image QR Scanner for Event Direct Booking */}
      {showScannerModal && (
        <EventQrScannerModal
          onClose={() => setShowScannerModal(false)}
          onScanEventFound={(scannedId, autoBook) => {
            setShowScannerModal(false);
            let targetEvt = eventsList.find(e => e.id === scannedId);
            if (!targetEvt) {
              try {
                const stored = localStorage.getItem('vernunt_user_created_events');
                if (stored) {
                  const list = JSON.parse(stored);
                  targetEvt = list.find((e: any) => e.id === scannedId);
                  if (targetEvt) setEventsList(prev => [targetEvt!, ...prev]);
                }
              } catch (e) {
                console.warn('LocalStorage QR scan retrieval note:', e);
              }
            }
            if (targetEvt) {
              setSelectedEventId(targetEvt.id);
              setTimeout(() => {
                const el = document.getElementById(`event-card-${scannedId}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.classList.add('ring-4', 'ring-orange-500', 'ring-offset-4');
                  setTimeout(() => {
                    el.classList.remove('ring-4', 'ring-orange-500', 'ring-offset-4');
                  }, 4000);
                }
                if (autoBook) {
                  handleInitiateBooking(targetEvt!);
                }
              }, 350);
            }
          }}
        />
      )}

      {/* My Passes & Tickets Drawer */}
      {showMyTicketsDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">My E-Ticket Wallet</h3>
                  <p className="text-xs text-slate-400">All purchased event passes and entry QR codes</p>
                </div>
              </div>
              <button
                onClick={() => setShowMyTicketsDrawer(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Passes List */}
            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              {myTickets.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed-2 border-slate-200">
                  <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No active tickets</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Browse the event grid and book passes to see your admission QR codes here.
                  </p>
                </div>
              ) : (
                myTickets.map((pass) => {
                  const matchingEvt = eventsList.find(e => e.id === pass.itemId) || {
                    id: pass.itemId,
                    title: pass.itemTitle,
                    description: '',
                    category: 'Event',
                    date: pass.dateStr,
                    time: pass.timeSelected,
                    location: pass.eventVenue || 'Venue Location',
                    hostName: 'Organizer',
                    attendeesCount: 1,
                    joined: true,
                    photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
                    ticketPrice: pass.amountPaid
                  };

                  return (
                    <div
                      key={pass.id}
                      className="p-4 bg-slate-50 hover:bg-orange-50/40 border border-slate-200 hover:border-orange-300 rounded-2xl transition-all flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                            {pass.ticketTierName || 'General Pass'}
                          </span>
                          <span className="font-mono text-[11px] text-slate-600 font-bold">
                            {pass.ticketNumber}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {pass.itemTitle}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span>📅 {pass.dateStr} at {pass.timeSelected}</span>
                          <span>🧒 {pass.childName || pass.buyerName}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setActiveTicketEvent(matchingEvt);
                          setActiveTicketModalBooking(pass);
                          setShowMyTicketsDrawer(false);
                        }}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 flex-shrink-0 shadow-xs"
                      >
                        <QrCode className="w-3.5 h-3.5 text-orange-400" />
                        <span>View Pass</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500">{myTickets.length} ticket(s) in wallet</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowMyTicketsDrawer(false);
                    setShowUserPurchasesModal(true);
                  }}
                  className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold rounded-xl transition-colors border border-orange-200 cursor-pointer"
                >
                  Full Order Ledger
                </button>
                <button
                  onClick={() => setShowMyTicketsDrawer(false)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Close Wallet
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Guest & Public Ticket Buyer Quick Registration Modal */}
      {showBuyerRegistrationModal && (
        <EventBuyerRegistrationModal
          actionLabel={buyerRegActionLabel}
          onClose={() => {
            setShowBuyerRegistrationModal(false);
            setPendingBookingEvent(null);
          }}
          onSuccess={(buyer) => handleBuyerRegistrationSuccess(buyer)}
          onSwitchToLogin={() => {
            setShowBuyerRegistrationModal(false);
            if (onOpenLogin) onOpenLogin();
          }}
        />
      )}

      {/* User Event Purchases & Verified Digital Passes Ledger Modal */}
      {showUserPurchasesModal && (
        <UserPurchasesModal
          userProfile={userProfile}
          onClose={() => setShowUserPurchasesModal(false)}
        />
      )}
    </div>
  );
}

