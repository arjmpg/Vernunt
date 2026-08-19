import React, { useState, useEffect } from 'react';
import { CommunityEvent, Booking } from '../types.ts';
import { 
  CalendarRange, MapPin, PersonStanding, Check, Search, X, 
  Map as MapIcon, List, Compass, Star, Calendar, Plus, Award, 
  Sparkles, AlertCircle, CreditCard, Share2, Copy, ExternalLink,
  Ticket, QrCode, UserCheck, CalendarDays, Wallet, Clock, ArrowRight, ShieldCheck,
  Navigation, Flame, CheckCircle2, ArrowUpDown
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
import EventInteractiveCalendar from './events/EventInteractiveCalendar.tsx';
import CreateEventWizardModal from './events/CreateEventWizardModal.tsx';
import { sendEventBookingNotifications } from '../utils/notifications.ts';
import { generateAffiliateShareUrl, generateWhatsAppShareText, openWhatsAppShare } from '../utils/affiliate.ts';

interface EventsTabProps {
  userProfile: any;
  eventsList: CommunityEvent[];
  setEventsList: React.Dispatch<React.SetStateAction<CommunityEvent[]>>;
  onAddBooking: (booking: Booking) => void;
  onUpdateRole: (role: 'Parent' | 'Event Organizer' | 'Portfolio Professional' | 'Admin') => void;
  globalCommissionRate: number;
  onUpdateUserProfile?: (profile: any) => void;
}

export default function EventsTab({
  userProfile,
  eventsList,
  setEventsList,
  onAddBooking,
  onUpdateRole,
  globalCommissionRate,
  onUpdateUserProfile
}: EventsTabProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'calendar'>('list');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(eventsList[0]?.id || null);

  // WooEvents state
  const [activeTicketModalBooking, setActiveTicketModalBooking] = useState<Booking | null>(null);
  const [activeTicketEvent, setActiveTicketEvent] = useState<CommunityEvent | null>(null);
  const [checkInStationEvent, setCheckInStationEvent] = useState<CommunityEvent | null>(null);
  const [bookingModalEvent, setBookingModalEvent] = useState<CommunityEvent | null>(null);
  const [showCreateWizard, setShowCreateWizard] = useState<boolean>(false);
  const [myTickets, setMyTickets] = useState<Booking[]>([]);
  const [showMyTicketsDrawer, setShowMyTicketsDrawer] = useState<boolean>(false);
  const [organizerRoleAlertEvent, setOrganizerRoleAlertEvent] = useState<CommunityEvent | null>(null);
  const [sortMode, setSortMode] = useState<'featured_nearby' | 'nearby_only' | 'date' | 'price_low'>('featured_nearby');
  const [maxDistanceRadiusKm, setMaxDistanceRadiusKm] = useState<number>(15.0);
  const [onlyNearbyFilter, setOnlyNearbyFilter] = useState<boolean>(false);

  // Parent GPS coordinates (default to userProfile or Mumbai/Central location)
  const userLat = typeof userProfile?.location === 'object' && userProfile?.location?.lat !== undefined
    ? Number(userProfile.location.lat)
    : (typeof userProfile?.lat === 'number' ? userProfile.lat : 19.0760);
  const userLng = typeof userProfile?.location === 'object' && userProfile?.location?.lng !== undefined
    ? Number(userProfile.location.lng)
    : (typeof userProfile?.lng === 'number' ? userProfile.lng : 72.8777);

  const userLocationDisplay = typeof userProfile?.location === 'object' && userProfile?.location?.address
    ? userProfile.location.address
    : (typeof userProfile?.location === 'string' ? userProfile.location : 'Central Area (19.07, 72.87)');

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

  // Parse deep link if ?eventId= is present in URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const targetEventId = params.get('eventId') || params.get('event');
      if (targetEventId && eventsList.some(e => e.id === targetEventId)) {
        setSelectedEventId(targetEventId);
        // If element exists on DOM, scroll to it smoothly
        setTimeout(() => {
          const el = document.getElementById(`event-card-${targetEventId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-4', 'ring-orange-400', 'ring-offset-2');
            setTimeout(() => {
              el.classList.remove('ring-4', 'ring-orange-400', 'ring-offset-2');
            }, 3000);
          }
        }, 300);
      }
    } catch (err) {
      console.error('Failed to parse URL event parameter:', err);
    }
  }, [eventsList]);

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
        categoryPic = 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600';
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
      commissionPercentage: calculatedCommission
    };

    setEventsList([newlyCreated, ...eventsList]);
    setSelectedEventId(newlyCreated.id);
    onUpdateRole('Event Organizer'); // Change user role automatically to Event Organizer
    setShowAddModal(false);

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
  // 1. Calculate proximity distance from current user coordinates
  // 2. Filter by category, query keywords, and optional radius
  // 3. Hierarchical sort: Featured & Sponsored events at the TOP, then sorted by proximity distance
  const filteredEvents = eventsList
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

      {/* Tab Header Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 id="events-main-title" className="text-xl font-bold text-slate-800 font-serif flex items-center gap-1.5">
            🌍 Nearby Events, Activities, Competitions & Classes
          </h3>
          <p id="events-main-subtitle" className="text-xs text-slate-500">
            Discover local child development classes, friendly school championships, school-break activities, and parent-hosted neighborhood meets.
          </p>
        </div>

        {/* View Mode Switching Segments + My Passes & Search Box */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Segmented Control with Calendar */}
          <div className="flex p-0.5 bg-slate-100 rounded-xl" id="events-view-switcher">
            <button
              id="btn-events-view-list"
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List Grid</span>
            </button>
            <button
              id="btn-events-view-calendar"
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-orange-500" />
              <span>Calendar</span>
            </button>
            <button
              id="btn-events-view-map"
              type="button"
              onClick={() => setViewMode('map')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'map'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
          </div>

          {/* My Passes & Tickets Wallet Button */}
          <button
            id="btn-my-event-passes"
            type="button"
            onClick={() => setShowMyTicketsDrawer(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
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
              className="w-full pl-9 pr-9 py-1.5 bg-white hover:bg-slate-50/50 focus:bg-white text-xs border border-slate-200 focus:border-orange-300 rounded-xl outline-none focus:ring-4 focus:ring-orange-100 transition shadow-xs placeholder-slate-400 text-slate-700"
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

      {/* Specialty Filter Hub */}
      <div className="bg-slate-50/80 border border-slate-100 p-3 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category quick filters */}
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
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  isSelected 
                    ? 'bg-slate-900 border-slate-950 text-white shadow-xs' 
                    : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <CatIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : cat.iconColor}`} />
                <span>{cat.label}</span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-slate-800 text-slate-250' : 'bg-slate-100 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Host/Publish button */}
        <button
          id="btn-trigger-propose-event"
          type="button"
          onClick={() => setShowCreateWizard(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Publish WooEvent</span>
        </button>
      </div>

      {/* Proximity & Sorting Control Bar for Parents */}
      <div id="events-proximity-sort-bar" className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold pr-2 border-r border-slate-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[11px] uppercase tracking-wider text-slate-400">Sort By:</span>
          </div>

          <button
            type="button"
            id="btn-sort-featured-nearby"
            onClick={() => setSortMode('featured_nearby')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              sortMode === 'featured_nearby'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Featured & Nearby</span>
            <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded font-mono">Recommended</span>
          </button>

          <button
            type="button"
            id="btn-sort-nearby-only"
            onClick={() => setSortMode('nearby_only')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              sortMode === 'nearby_only'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span>Closest Distance First</span>
          </button>

          <button
            type="button"
            id="btn-sort-date"
            onClick={() => setSortMode('date')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              sortMode === 'date'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
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
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Ticket className="w-3.5 h-3.5 text-amber-500" />
            <span>Price: Low to High</span>
          </button>
        </div>

        {/* Nearby Distance Radius Filter */}
        <div className="flex items-center gap-3 self-end lg:self-center">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              id="chk-only-nearby"
              checked={onlyNearbyFilter}
              onChange={(e) => setOnlyNearbyFilter(e.target.checked)}
              className="w-4 h-4 rounded text-orange-500 accent-orange-500 cursor-pointer"
            />
            <span className="flex items-center gap-1 text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Only Within</span>
            </span>
          </label>

          {onlyNearbyFilter && (
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl text-xs font-bold animate-fadeIn">
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={maxDistanceRadiusKm}
                onChange={(e) => setMaxDistanceRadiusKm(Number(e.target.value))}
                className="w-20 accent-orange-500 cursor-pointer"
              />
              <span className="text-orange-600 font-extrabold w-12 text-right">{maxDistanceRadiusKm} km</span>
            </div>
          )}

          <div className="text-[11px] text-slate-400 pl-2 border-l border-slate-200 flex items-center gap-1">
            <span>📍 Your Location:</span>
            <span className="font-bold text-slate-700 truncate max-w-[180px]" title={userLocationDisplay}>{userLocationDisplay}</span>
          </div>
        </div>
      </div>

      {searchQuery && (
        <div id="search-filter-stats" className="text-xs text-slate-500 font-medium">
          Found <strong className="text-slate-800">{filteredEvents.length}</strong> {filteredEvents.length === 1 ? 'event' : 'events'} matching "{searchQuery}"
        </div>
      )}

      {/* View Switch Dispatch */}
      {viewMode === 'calendar' ? (
        /* WooEvents Interactive Calendar View */
        <EventInteractiveCalendar
          events={filteredEvents}
          onSelectEvent={(evt) => {
            setSelectedEventId(evt.id);
            setViewMode('list');
          }}
          onBookEvent={(evt) => setBookingModalEvent(evt)}
        />
      ) : viewMode === 'list' ? (
        /* List / Grid View layout */
        filteredEvents.length > 0 ? (
          <div id="events-grids-container" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredEvents.map((evt) => {
              // Find if current user has an issued ticket for this event
              const userTicket = myTickets.find(t => t.itemId === evt.id);
              const isEventJoined = evt.joined || !!userTicket;

              return (
                <div id={`event-card-${evt.id}`} key={evt.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
                  {/* Image banner */}
                  <div id="event-pic" className="h-44 bg-slate-100 relative">
                    <img src={evt.photoUrl} alt={evt.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    
                    {/* Featured / Sponsored Promoted Badge */}
                    {(evt.featured || evt.isSponsored) && (
                      <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                        {evt.featured && (
                          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg border border-amber-300/40 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-white fill-white animate-pulse" />
                            <span>Featured</span>
                          </div>
                        )}
                        {evt.isSponsored && (
                          <div className="bg-slate-900/90 backdrop-blur-md text-amber-300 px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider border border-amber-400/30 flex items-center gap-1 shadow-md">
                            <Flame className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                            <span>Sponsored</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Price Badge */}
                    <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md text-white px-2.5 py-1 rounded-xl text-xs font-black shadow-md border border-white/20 flex items-center gap-1">
                      <Ticket className="w-3.5 h-3.5 text-orange-400" />
                      <span>{evt.ticketPrice && evt.ticketPrice > 0 ? `₹${evt.ticketPrice}` : 'FREE Entry'}</span>
                    </div>

                    {/* Distance Proximity Pill on Image */}
                    {evt.distance !== undefined && (
                      <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md text-slate-800 px-2 py-0.5 rounded-xl text-[10px] font-extrabold shadow-md border border-slate-200 flex items-center gap-1">
                        <Navigation className="w-2.5 h-2.5 text-emerald-600" />
                        <span>{evt.distance < 1 ? '< 1 km away' : `${evt.distance.toFixed(1)} km away`}</span>
                      </div>
                    )}

                    {/* Category badge */}
                    <div 
                      id="event-tag" 
                      className={`absolute top-3 right-3 text-[10px] font-black uppercase tracking-widest py-1.5 px-3 rounded-xl border ${getCategoryBadgeStyles(evt.category)}`}
                    >
                      {getCategoryLabel(evt.category)}
                    </div>

                    {/* Quick Share floating icon buttons: WhatsApp & Copy Link */}
                    <div className="absolute top-12 left-3 flex flex-col gap-1.5 z-10">
                      <button
                        id={`btn-quick-whatsapp-${evt.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWhatsAppShareEvent(evt);
                        }}
                        className="w-8 h-8 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white shadow-md flex items-center justify-center transition active:scale-90 cursor-pointer border border-emerald-600"
                        title="Share on WhatsApp with affiliate referral link"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      <button
                        id={`btn-quick-share-${evt.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareEvent(evt);
                        }}
                        className="w-8 h-8 rounded-xl bg-white/90 backdrop-blur-md hover:bg-white text-slate-700 shadow-md flex items-center justify-center transition active:scale-90 cursor-pointer border border-white/40"
                        title="Copy event details & affiliate link"
                      >
                        {copiedEventId === evt.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-700" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Event Info Details */}
                  <div id="event-body" className="p-5 flex-1 flex flex-col space-y-3">
                    {/* Sponsored Subheader */}
                    {evt.sponsoredBy && (
                      <div className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg w-max flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Presented by: <strong className="text-amber-900">{evt.sponsoredBy}</strong></span>
                      </div>
                    )}

                    <h4 id={`event-title-${evt.id}`} className="font-bold text-slate-800 font-serif text-sm leading-snug">{evt.title}</h4>
                    <p id={`event-desc-${evt.id}`} className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                      {evt.description}
                    </p>

                    {/* Ticket Tiers preview if present */}
                    {evt.ticketTiers && evt.ticketTiers.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {evt.ticketTiers.map(tier => (
                          <span key={tier.id} className="text-[9px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                            {tier.name} (₹{tier.price})
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Sub-categories or tags */}
                    {evt.tags && evt.tags.length > 0 && (
                      <div id={`event-tags-list-${evt.id}`} className="flex flex-wrap gap-1 pt-0.5 opacity-95">
                        {evt.tags.map((tag, tagIndex) => (
                          <button
                            key={tagIndex}
                            id={`btn-tag-${evt.id}-${tagIndex}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchQuery(tag);
                            }}
                            className="bg-orange-50 hover:bg-orange-100 text-orange-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border border-orange-100/30 transition-colors cursor-pointer"
                            title={`Click to filter by tag: #${tag}`}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Event stats (time/address) */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-700">{evt.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CalendarRange className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-700">{evt.date} at {evt.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <PersonStanding className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-700">Host: <strong className="text-slate-800 font-semibold">{evt.hostName}</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenGateDesk(evt)}
                          className="text-[10px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded-md flex items-center gap-1 border border-orange-200/60"
                          title="Open Gate Check-In & Scanner Station (Event Organizers only)"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Gate Desk</span>
                        </button>
                      </div>
                    </div>

                    {/* Roster attendance & Actions */}
                    <div className="flex justify-between items-center pt-2.5 mt-auto border-t border-slate-100/80 gap-2">
                      <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                        🧒 {evt.attendeesCount} RSVP'd
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* If attendee already has ticket, provide E-Ticket Pass Modal trigger */}
                        {isEventJoined && (
                          <button
                            type="button"
                            onClick={() => {
                              const pass = userTicket || {
                                id: `booking-${evt.id}`,
                                itemId: evt.id,
                                itemTitle: evt.title,
                                type: 'EventTicket',
                                buyerName: userProfile?.parentName || 'Parent Attendee',
                                buyerEmail: userProfile?.email || 'parent@vernunt.com',
                                buyerPhone: userProfile?.phoneNumber || '+91 98765 43210',
                                amountPaid: evt.ticketPrice || 0,
                                commissionPercentage: 10,
                                commissionEarned: 0,
                                hostEarned: 0,
                                dateStr: evt.date,
                                timeSelected: evt.time,
                                status: 'Paid',
                                ticketNumber: `VERN-EVT-7721-${evt.id.slice(-3).toUpperCase()}`,
                                ticketTierName: evt.ticketTiers?.[0]?.name || 'General Admission',
                                childName: userProfile?.childName || 'Aarav',
                                childAge: userProfile?.childAge || 5,
                                eventVenue: evt.location,
                                checkedIn: false,
                                quantity: 1,
                                createdAt: new Date().toISOString()
                              };
                              setActiveTicketEvent(evt);
                              setActiveTicketModalBooking(pass);
                            }}
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-1.5 px-2.5 rounded-xl text-[10px] font-bold transition flex items-center gap-1 border border-emerald-200 cursor-pointer shadow-xs"
                            title="View QR Code E-Ticket"
                          >
                            <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                            <span>E-Pass</span>
                          </button>
                        )}

                        {/* WooEvents Multi-Tier Ticket Booking Modal */}
                        <button
                          id={`btn-event-book-${evt.id}`}
                          onClick={() => setBookingModalEvent(evt)}
                          type="button"
                          className="bg-orange-600 hover:bg-orange-700 text-white py-1.5 px-3 rounded-xl text-[10px] font-bold transition shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <Ticket className="w-3 h-3" />
                          <span>{isEventJoined ? 'Book More' : 'Book Pass'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div id="events-empty-state" className="bg-white rounded-3xl p-12 border border-slate-100 shadow-xs text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 font-serif text-base">No matching playground meets found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                We couldn't find any meetups or learning packages matching "{searchQuery}" under the category "{categoryFilter}". Try toggling category filters.
              </p>
            </div>
            <button
              id="btn-reset-event-filter"
              type="button"
              onClick={() => { setSearchQuery(''); setCategoryFilter('All'); }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition active:scale-95"
            >
              Examine All Classes & Events
            </button>
          </div>
        )
      ) : (
        /* Geolocation Map View layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Interactive Canvas */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block">Geographic Gathering Points</span>
                <span className="text-xs text-slate-400">Interactive community spots surrounding Central Park and local venues</span>
              </div>
              <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200 py-1 px-2.5 rounded-xl flex items-center gap-1 select-none">
                <Star className="w-3 h-3 text-orange-500 fill-orange-500" /> Nearby Public Locations
              </span>
            </div>

            {/* Sandbox Canvas */}
            <div id="events-map-canvas" className="relative w-full h-96 bg-amber-50/40 rounded-2xl border border-amber-100 overflow-hidden shadow-inner flex items-center justify-center">
              {/* Grass details background dots */}
              <div className="absolute inset-0 opacity-15" style={{ 
                backgroundImage: 'radial-gradient(#f59e0b 1.5px, transparent 1.5px), radial-gradient(#10b981 1.5px, #fef3c7 1.5px)', 
                backgroundSize: '28px 28px', 
                backgroundPosition: '0 0, 14px 14px' 
              }}></div>

              {/* Central Park Lake decoration */}
              <div id="events-map-lake" className="absolute top-1/3 left-1/4 w-40 h-24 bg-cyan-100/60 border border-cyan-200/55 rounded-full blur-xs pointer-events-none transform -rotate-6 flex items-center justify-center">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Main Basin Meadow</span>
              </div>

              {/* Soccer field decoration outline */}
              <div className="absolute bottom-12 right-20 w-32 h-16 border-2 border-dashed border-emerald-300 pointer-events-none rounded-xl transform -rotate-12 flex items-center justify-center">
                <span className="text-[9px] text-emerald-400/80 font-bold uppercase tracking-wider">Playground Field</span>
              </div>

              {/* Host pins mapping */}
              {filteredEvents.map((evt, index) => {
                const pos = getEventPosition(evt.id, index);
                const isSelected = selectedEventId === evt.id;

                return (
                  <button
                    id={`events-map-btn-pin-${evt.id}`}
                    key={evt.id}
                    onClick={() => setSelectedEventId(evt.id)}
                    type="button"
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-300 hover:scale-110 flex flex-col items-center group cursor-pointer"
                    style={{ top: pos.top, left: pos.left }}
                  >
                    {/* Hover Card Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-xl mb-1.5 flex flex-col gap-0.5 shadow-lg whitespace-nowrap pointer-events-none z-30">
                      <span className="font-bold">{evt.title}</span>
                      <span className="text-[9px] text-slate-300">Organizer: {evt.hostName} • {evt.attendeesCount} families</span>
                    </div>

                    {/* Highly polished Pin with visual tag */}
                    <div className={`p-1.5 rounded-full border-2 transition-all shadow-md flex items-center justify-center ${
                      isSelected 
                        ? 'bg-orange-500 border-white ring-4 ring-orange-400/20 scale-110 text-white font-bold' 
                        : 'bg-white border-slate-300 text-slate-700 hover:border-slate-500'
                    }`}>
                      <MapPin className="w-5 h-5" />
                    </div>

                    {/* Miniature category bubble */}
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-lg mt-1 block shadow-xs select-none ${
                      isSelected ? 'bg-orange-600 text-white' : 'bg-slate-800 text-white'
                    }`}>
                      {evt.category}
                    </span>
                  </button>
                );
              })}

              {/* Family Home Base Marker */}
              <div id="events-map-user-marker" className="absolute top-1/2 right-1/3 -translate-y-1/2 flex flex-col items-center select-none">
                <div className="p-1 px-2.5 bg-slate-900 text-white border border-slate-700 text-[10px] rounded-full font-bold shadow-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping animate-duration-1000"></span>
                  <span>Your Home Base</span>
                </div>
              </div>
            </div>

            {/* Hint guidelines */}
            <p className="text-[10px] text-slate-400 text-center italic font-medium pt-1">
              * Exact coordinates are approximate for community event locations to promote safety and easy public gathering.
            </p>
          </div>

          {/* Map Side-Inspecting Card Panel for selected meet */}
          <div className="lg:col-span-1">
            {selectedEvent ? (
              <div id="events-map-drawer-card" className="bg-white rounded-3xl border border-slate-100 shadow-md p-5 h-full flex flex-col space-y-4">
                <div className="relative h-40 rounded-2xl overflow-hidden bg-slate-50">
                  <img src={selectedEvent.photoUrl} alt={selectedEvent.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <span className={`absolute top-3 right-3 text-[9px] py-1 px-2.5 rounded-xl font-bold uppercase tracking-wider border ${getCategoryBadgeStyles(selectedEvent.category)}`}>
                    {selectedEvent.category}
                  </span>

                  {/* Share floating button on map drawer */}
                  <button
                    id={`btn-share-map-event-${selectedEvent.id}`}
                    type="button"
                    onClick={() => handleShareEvent(selectedEvent)}
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-white/90 backdrop-blur-md hover:bg-white text-slate-700 text-[10px] font-bold shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer border border-white/40"
                    title="Copy event details & deep link"
                  >
                    {copiedEventId === selectedEvent.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-slate-700" />
                        <span>Share</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2 flex-1">
                  <div>
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{getCategoryLabel(selectedEvent.category)} Detail</span>
                    <h4 className="font-bold text-slate-800 font-serif text-base leading-snug">{selectedEvent.title}</h4>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{selectedEvent.description}"
                  </p>

                  {/* Selected Event Tags */}
                  {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                    <div id="selected-event-tags-container" className="flex flex-wrap gap-1 py-0.5">
                      {selectedEvent.tags.map((tag, tagIndex) => (
                        <button
                          key={tagIndex}
                          id={`selected-tag-pill-${tagIndex}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchQuery(tag);
                          }}
                          className="bg-orange-50 hover:bg-orange-100 text-orange-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border border-orange-100/30 transition-colors cursor-pointer"
                          title={`Search tag #${tag}`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600 font-medium select-none">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate text-slate-700">{selectedEvent.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-slate-700">{selectedEvent.date} at {selectedEvent.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <PersonStanding className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-slate-700">Organizer: <strong className="text-slate-800 font-semibold">{selectedEvent.hostName}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-150 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span>Attendance list</span>
                    <span className="text-slate-800">{selectedEvent.attendeesCount} Families RSVP'd</span>
                  </div>

                  {selectedEvent.ticketPrice && selectedEvent.ticketPrice > 0 ? (
                    selectedEvent.joined ? (
                      <div className="space-y-4">
                        <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl text-[11px] text-emerald-800 space-y-1 font-medium">
                          <div className="flex items-center gap-1 font-bold text-emerald-900">
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>Ticket Confirmed!</span>
                          </div>
                          <p>You bought 1 pass for ₹{selectedEvent.ticketPrice}.00. Present your secure digital code pass upon entering.</p>
                        </div>

                        {/* Interactive Gate QR Check-in */}
                        <CommunityEventCheckIn
                          userProfile={userProfile}
                          onUpdateUserProfile={(profileObj) => {
                            if (onUpdateUserProfile) {
                              onUpdateUserProfile(profileObj);
                            }
                          }}
                          eventId={selectedEvent.id}
                          eventTitle={selectedEvent.title}
                          eventHostName={selectedEvent.hostName}
                        />

                        <button
                          id={`btn-event-cancel-ticket-${selectedEvent.id}`}
                          onClick={() => handleToggleJoinEvent(selectedEvent.id, false)}
                          type="button"
                          className="w-full py-2 border border-slate-200 text-slate-500 rounded-xl text-xs hover:bg-slate-50 transition cursor-pointer"
                        >
                          Cancel Booking & Request Refund
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`btn-event-buy-ticket-${selectedEvent.id}`}
                        onClick={() => {
                          setCheckoutEvent(selectedEvent);
                          setCheckoutStep('details');
                          setBuyerName(userProfile?.parentName || '');
                          setBypassSubCheck(false);
                          setShowCheckoutModal(true);
                        }}
                        type="button"
                        className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Buy Ticket (₹{selectedEvent.ticketPrice}) via Razorpay</span>
                      </button>
                    )
                  ) : (
                    selectedEvent.joined ? (
                      <div className="space-y-4">
                        <button
                          id={`btn-map-joined-${selectedEvent.id}`}
                          onClick={() => handleToggleJoinEvent(selectedEvent.id, false)}
                          type="button"
                          className="w-full py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>You are RSVP'd Attending</span>
                        </button>

                        {/* Interactive Gate QR Check-in */}
                        <CommunityEventCheckIn
                          userProfile={userProfile}
                          onUpdateUserProfile={(profileObj) => {
                            if (onUpdateUserProfile) {
                              onUpdateUserProfile(profileObj);
                            }
                          }}
                          eventId={selectedEvent.id}
                          eventTitle={selectedEvent.title}
                          eventHostName={selectedEvent.hostName}
                        />
                      </div>
                    ) : (
                      <button
                        id={`btn-map-join-${selectedEvent.id}`}
                        onClick={() => handleToggleJoinEvent(selectedEvent.id, true)}
                        type="button"
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-md shadow-slate-900/10 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>RSVP Join Gathering</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 border border-dashed border-slate-200 text-center text-slate-400 h-full flex flex-col items-center justify-center">
                <Compass className="w-8 h-8 text-slate-300 animate-bounce mb-2" />
                <p className="text-xs font-bold">Please select an event pin on the map to inspect details.</p>
              </div>
            )}
          </div>
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
      {activeTicketModalBooking && activeTicketEvent && (
        <EventTicketPassModal
          booking={activeTicketModalBooking}
          event={activeTicketEvent}
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
            setShowCreateWizard(false);
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
              <button
                onClick={() => setShowMyTicketsDrawer(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
              >
                Close Wallet
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

