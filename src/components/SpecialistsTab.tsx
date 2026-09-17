import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SpecialistProfile, Booking, ChildProfile } from '../types.ts';
import { 
  Award, ShieldCheck, Heart, Star, MapPin, Compass, Briefcase, Sparkles, 
  SlidersHorizontal, BookOpen, Scissors, Stethoscope, Utensils, Flame, Check, 
  CreditCard, Share2, Send, Copy, Building2, GraduationCap, Phone, ExternalLink, 
  Globe, RefreshCw, ArrowUp, Navigation, CheckCircle, ShieldAlert, Trophy, TrendingUp
} from 'lucide-react';
import { MutualFundAdvisor } from '../types/investment.ts';
import { INITIAL_MUTUAL_FUND_ADVISORS } from '../data/kidsInvestmentData.ts';
import MutualFundAdvisorDashboard from './investments/MutualFundAdvisorDashboard.tsx';
import confettiDefault from 'canvas-confetti';
import AestheticImageUploader from './AestheticImageUploader.tsx';
import PediatricianPortfolioModal from './PediatricianPortfolioModal.tsx';
import { DoctorCard } from './DoctorCard.tsx';
import ClaimSpecialistModal from './ClaimSpecialistModal.tsx';
import SpecialistClaimsAdminModal from './SpecialistClaimsAdminModal.tsx';
import { db, auth, handleFirestoreError, OperationType } from '../utils/firebase.ts';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { generateAffiliateShareUrl, generateWhatsAppShareText, openWhatsAppShare, attributeAffiliateBooking } from '../utils/affiliate.ts';
import { sendSpecialistBookingNotifications } from '../utils/notifications.ts';
import { formatVernuntReviewText, FALLBACK_DOCTOR_PHOTO, getSpecialistDirectUrl, slugifySpecialistName } from '../utils/specialistUrls.ts';
import { INDIAN_CITIES } from '../data/panIndiaPediatricians.ts';
import { 
  getCurrentUserLocation, 
  calculateDoctorDistance, 
  formatDistanceKm, 
  CITY_COORDINATES 
} from '../utils/geoDistance.ts';
import { isAuthorizedSystemAdmin } from '../utils/security.ts';
import { getClaimedSpecialistsMap } from '../utils/specialistClaims.ts';

interface SpecialistsTabProps {
  currentProfile: ChildProfile | null;
  onUpdateRole: (newRole: 'Parent' | 'Event Organizer' | 'Portfolio Professional' | 'Admin') => void;
  onAddNewSpecialist: (specialist: SpecialistProfile) => void;
  specialistsList: SpecialistProfile[];
  bookingsList: Booking[];
  onAddBooking: (booking: Booking) => void;
  globalCommissionRate: number; // default global percentage
  onUpdateUserProfile?: (profile: ChildProfile) => void;
  onUpdateSpecialist?: (specialist: SpecialistProfile) => void;
}

const BANGALORE_AREAS = [
  'All Areas',
  'Jayanagar',
  'Koramangala',
  'Indiranagar',
  'Old Airport Road',
  'Whitefield',
  'Sarjapur Road',
  'Bellandur',
  'Hebbal',
  'Malleshwaram',
  'Rajajinagar',
  'Basaveshwaranagar',
  'Banashankari',
  'Bannerghatta Road',
  'HSR Layout',
  'Kalyan Nagar',
  'Yelahanka',
  'Marathahalli',
  'Electronic City'
];

export default function SpecialistsTab({
  currentProfile,
  onUpdateRole,
  onAddNewSpecialist,
  specialistsList,
  bookingsList,
  onAddBooking,
  globalCommissionRate,
  onUpdateUserProfile,
  onUpdateSpecialist
}: SpecialistsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedLocality, setSelectedLocality] = useState<string>('All Areas');
  const [viewingPortfolioSpec, setViewingPortfolioSpec] = useState<SpecialistProfile | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(30);
  const [isProgressiveLoadingAll, setIsProgressiveLoadingAll] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Distance Sorting & Geolocation state
  const [sortOption, setSortOption] = useState<'distance' | 'recommended' | 'experience' | 'fee-asc' | 'fee-desc'>('distance');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [locationLabel, setLocationLabel] = useState<string>('Pan-India Distance');

  // Claim Portfolio and Admin Desk state
  const [claimingSpecialist, setClaimingSpecialist] = useState<SpecialistProfile | null>(null);
  const [showAdminClaimsModal, setShowAdminClaimsModal] = useState<boolean>(false);
  const isSuperAdmin = isAuthorizedSystemAdmin(currentProfile?.email, currentProfile?.userRole);

  // Mutual Fund & Kids Wealth Advisors state
  const [showAdvisorDashboard, setShowAdvisorDashboard] = useState<boolean>(false);
  const [advisors, setAdvisors] = useState<MutualFundAdvisor[]>(() => {
    try {
      const saved = localStorage.getItem('vernunt_custom_advisors');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.debug('Error loading advisors in SpecialistsTab', e);
    }
    return INITIAL_MUTUAL_FUND_ADVISORS;
  });

  const handleAddAdvisor = (adv: MutualFundAdvisor) => {
    setAdvisors(prev => {
      const updated = [adv, ...prev];
      localStorage.setItem('vernunt_custom_advisors', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateAdvisor = (adv: MutualFundAdvisor) => {
    setAdvisors(prev => {
      const updated = prev.map(a => a.id === adv.id ? adv : a);
      localStorage.setItem('vernunt_custom_advisors', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteAdvisor = (advId: string) => {
    setAdvisors(prev => {
      const updated = prev.filter(a => a.id !== advId);
      localStorage.setItem('vernunt_custom_advisors', JSON.stringify(updated));
      return updated;
    });
  };

  // Combine clinical specialists with Certified AMFI Kids Wealth & Mutual Fund Advisors
  const combinedSpecialistsList = useMemo(() => {
    const advisorSpecs: SpecialistProfile[] = advisors.map(adv => ({
      id: adv.id,
      name: adv.name,
      title: `${adv.agencyName || 'Certified'} • AMFI Registered Mutual Fund Advisor`,
      category: 'Kids Wealth & Investment Planners',
      rating: adv.rating || 4.9,
      reviewsCount: adv.reviewsCount || 128,
      experienceYears: adv.experienceYears || 10,
      bio: adv.bio || 'AMFI Certified Mutual Fund Distributor specializing in Child Future Planning and Minor Demat structuring.',
      location: `${adv.city}, ${adv.state}`,
      photoUrl: adv.photoUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400',
      sessionFee: adv.feeType === 'Free Initial Consultation' ? 0 : 499,
      availableSlots: ['10:00 AM', '02:00 PM', '05:00 PM', '07:00 PM'],
      specialties: adv.specialization?.length ? adv.specialization : ['Child Education Corpus', 'Equity SIP', 'AMFI Certified Portfolio'],
      languages: adv.languages?.length ? adv.languages : ['English', 'Hindi'],
      qualifications: `ARN: ${adv.arnNumber}${adv.sebiRegNumber ? ` • SEBI: ${adv.sebiRegNumber}` : ''}`,
      hospitalAffiliation: adv.agencyName || 'Mutual Fund Advisory Practice',
      clinicAddress: `${adv.city}, ${adv.state}`,
      phone: adv.phone,
      email: adv.email,
      isVerified: adv.verificationStatus === 'AMFI_VERIFIED'
    }));

    return [...specialistsList, ...advisorSpecs];
  }, [specialistsList, advisors]);

  // Automatically attempt to locate user GPS on initial load for nearest distance sorting
  useEffect(() => {
    let isMounted = true;
    getCurrentUserLocation()
      .then(loc => {
        if (isMounted && loc) {
          setUserCoords({ lat: loc.lat, lng: loc.lng });
          setLocationLabel('Your GPS Location');
        }
      })
      .catch(() => {
        // Fallback gracefully without blocking UI
      });
    return () => { isMounted = false; };
  }, []);

  const handleTriggerDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const loc = await getCurrentUserLocation();
      if (loc) {
        setUserCoords({ lat: loc.lat, lng: loc.lng });
        setLocationLabel('Live GPS Location');
        setSortOption('distance');
      }
    } catch (err: any) {
      console.debug('Geolocation prompt note:', err);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  useEffect(() => {
    setVisibleCount(30);
    setIsProgressiveLoadingAll(false);
  }, [categoryFilter, selectedCity, selectedLocality, searchQuery, sortOption]);

  // Deep-link direct URL handling (/specialist/[slug] or ?portfolio=spec-ped-... or ?specialist=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const pathname = window.location.pathname;
      const slugMatch = pathname.match(/^\/specialists?\/([^/?#]+)/i);
      const params = new URLSearchParams(window.location.search);
      const targetQuery = slugMatch 
        ? slugMatch[1] 
        : (params.get('portfolio') || params.get('specialist') || params.get('doctor') || params.get('id'));

      if (targetQuery && specialistsList.length > 0) {
        const cleanTarget = targetQuery.toLowerCase().trim();
        const match = specialistsList.find(s => {
          const sSlug = s.slug || slugifySpecialistName(s.name);
          return (
            sSlug === cleanTarget ||
            s.id.toLowerCase() === cleanTarget ||
            s.name.toLowerCase().replace(/^(dr\.?|doctor)\s+/i, '').replace(/[^a-z0-9]/g, '-') === cleanTarget ||
            s.id.toLowerCase().includes(cleanTarget)
          );
        });
        if (match) {
          setViewingPortfolioSpec(match);
        }
      }
    } catch (err) {
      console.warn('Portfolio URL check error', err);
    }
  }, [specialistsList]);

  // Browser back/forward history support
  useEffect(() => {
    const handlePop = () => {
      try {
        const pathname = window.location.pathname;
        const slugMatch = pathname.match(/^\/specialists?\/([^/?#]+)/i);
        const params = new URLSearchParams(window.location.search);
        const targetId = slugMatch ? slugMatch[1] : (params.get('portfolio') || params.get('specialist') || params.get('doctor'));
        if (targetId) {
          const cleanTarget = targetId.toLowerCase().trim();
          const match = specialistsList.find(s => 
            (s.slug && s.slug === cleanTarget) ||
            s.id === targetId || 
            slugifySpecialistName(s.name) === cleanTarget
          );
          if (match) setViewingPortfolioSpec(match);
        } else {
          setViewingPortfolioSpec(null);
        }
      } catch (err) {
        console.debug('Popstate sync error:', err);
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [specialistsList]);

  const handleOpenPortfolio = useCallback((spec: SpecialistProfile) => {
    setViewingPortfolioSpec(spec);
    if (typeof window !== 'undefined') {
      try {
        const directUrl = getSpecialistDirectUrl(spec);
        window.history.pushState({ portfolioId: spec.id, slug: spec.slug }, '', directUrl);
      } catch (err) {
        console.debug('PushState portfolio error:', err);
      }
    }
  }, []);

  const handleClosePortfolio = () => {
    setViewingPortfolioSpec(null);
    if (typeof window !== 'undefined') {
      try {
        if (window.location.pathname.startsWith('/specialist')) {
          window.history.pushState({}, '', '/');
        } else {
          const url = new URL(window.location.href);
          url.searchParams.delete('portfolio');
          url.searchParams.delete('specialist');
          url.searchParams.delete('doctor');
          url.searchParams.delete('id');
          window.history.pushState({}, '', url.toString());
        }
      } catch (err) {
        console.debug('PushState close error:', err);
      }
    }
  };

  const handleClaimSubmitted = (specId: string) => {
    setClaimingSpecialist(null);
    if (onUpdateSpecialist) {
      const target = specialistsList.find(s => s.id === specId);
      if (target) {
        onUpdateSpecialist({
          ...target,
          claimStatus: 'pending'
        });
      }
    }
  };

  const handleClaimApproved = (specId: string, applicantEmail: string) => {
    if (onUpdateSpecialist) {
      const target = specialistsList.find(s => s.id === specId);
      if (target) {
        onUpdateSpecialist({
          ...target,
          claimed: true,
          claimStatus: 'approved',
          claimedByEmail: applicantEmail
        });
      }
    }
  };

  // States for subscription promotion on booking click
  const [showSubPromoModal, setShowSubPromoModal] = useState(false);
  const [pendingSpecToBook, setPendingSpecToBook] = useState<SpecialistProfile | null>(null);

  // Specialist Registration form states
  const [showRegModal, setShowRegModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regTitle, setRegTitle] = useState('');
  const [regCategory, setRegCategory] = useState<string>('Pediatrician');
  const [regPhoto, setRegPhoto] = useState('');
  
  // Custom Dynamic Specialist categories load
  const [customSpecCats, setCustomSpecCats] = useState<any[]>([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'custom_specialist_categories'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      setCustomSpecCats(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'custom_specialist_categories');
    });
    return () => unsub();
  }, []);
  const [regExperience, setRegExperience] = useState(3);
  const [regBio, setRegBio] = useState('');
  const [regLocation, setRegLocation] = useState('');
  const [regFee, setRegFee] = useState(499);
  const [regSpecialtiesStr, setRegSpecialtiesStr] = useState('');
  const [regEmail, setRegEmail] = useState(
    currentProfile?.parentName 
      ? currentProfile.parentName.replace(/\s+/g, '').toLowerCase() + '@gmail.com' 
      : 'specialist@vernunt.org'
  );
  const [regPhone, setRegPhone] = useState('9876543210');
  const [regError, setRegError] = useState('');

  // Booking details states
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistProfile | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>('2026-06-01');
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Razorpay live payment states
  const [razorpayStep, setRazorpayStep] = useState<'details' | 'processing' | 'otp' | 'success'>('details');
  const [otpInput, setOtpInput] = useState('');
  const [productionPaymentId, setProductionPaymentId] = useState('');
  const [copiedSpecId, setCopiedSpecId] = useState<string | null>(null);

  const handleShareSpecialist = (spec: SpecialistProfile) => {
    const affiliateCode = currentProfile?.affiliateCode || currentProfile?.referralCode || undefined;
    const deepLink = generateAffiliateShareUrl({
      affiliateCode,
      tab: 'specialists',
      itemId: spec.id,
      itemType: 'specialist'
    });

    const shareText = `🌟 ${spec.name} (${spec.title}) 🌟
🧬 Category: ${spec.category}
⭐ Rating: ${spec.rating} (${spec.reviewsCount} reviews)
💼 Experience: ${spec.experienceYears} Years
💰 Session Fee: ₹${spec.sessionFee} / hour
📍 Location: ${spec.location}

${spec.bio}

🔗 Book a consultation slot on Vernunt Playdates:
${deepLink}`;

    navigator.clipboard.writeText(shareText);
    setCopiedSpecId(spec.id);
    setTimeout(() => setCopiedSpecId(null), 2000);
    confettiDefault({ particleCount: 30, spread: 50 });
  };

  const handleWhatsAppShareSpecialist = useCallback((spec: SpecialistProfile) => {
    const affiliateCode = currentProfile?.affiliateCode || currentProfile?.referralCode || undefined;
    const deepLink = generateAffiliateShareUrl({
      affiliateCode,
      tab: 'specialists',
      itemId: spec.id,
      itemType: 'specialist'
    });

    const shareText = `🌟 *Consultation with ${spec.name}* 🌟
🩺 *Specialty:* ${spec.title} (${spec.category})
⭐ *Rating:* ${spec.rating} / 5 (${spec.reviewsCount} reviews)
💼 *Experience:* ${spec.experienceYears} Years Prof
💰 *Fee:* ₹${spec.sessionFee} / hr
📍 *Location:* ${spec.location}

${spec.bio.slice(0, 160)}...

👉 *Book consultation slot directly:*
${deepLink}

${affiliateCode ? `🎁 _Verified Vernunt Community Partner Referral Link._` : ''}`;

    openWhatsAppShare(shareText);
  }, [currentProfile?.affiliateCode, currentProfile?.referralCode]);
  const [buyerName, setBuyerName] = useState(currentProfile?.parentName || '');
  const [buyerEmail, setBuyerEmail] = useState('guardian@vernunt.org');

  const categories = [
    { key: 'All', label: 'All Specialists', icon: Compass, color: 'text-orange-500' },
    { key: 'Pediatrician', label: 'Pediatrician', icon: Stethoscope, color: 'text-rose-500' },
    { key: 'Gynecologist', label: 'Gynecologists & OB/GYN', icon: Heart, color: 'text-fuchsia-500' },
    { key: 'Nutritionist', label: 'Nutritionists & Dietitians', icon: Utensils, color: 'text-emerald-500' },
    { key: 'Coach', label: 'Sports Coaches & Mentors', icon: Trophy, color: 'text-amber-500' },
    { key: 'Kids Wealth & Investment Planners', label: 'Kids Wealth & MF Planners', icon: TrendingUp, color: 'text-indigo-600' },
    ...customSpecCats.map(cs => ({ key: cs.value, label: cs.name, icon: Briefcase, color: 'text-indigo-500' }))
  ];

  const handleRegisterSpecialist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regTitle || !regBio || !regLocation) {
      setRegError('Please supply all required specialist variables.');
      return;
    }

    const initialPhoto = regPhoto || (regCategory === 'Nutritionist' 
      ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&crop=faces'
      : regCategory === 'Pediatrician'
      ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400&crop=faces'
      : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&crop=faces');

    let calculatedCommission = globalCommissionRate;
    if (userProfile?.businessListingModel === 'subscription') {
      calculatedCommission = 0;
    } else if (userProfile?.businessCommissionRate !== undefined) {
      calculatedCommission = userProfile.businessCommissionRate;
    }

    const newSpec: SpecialistProfile = {
      id: `specialist-${Date.now()}`,
      name: regName,
      title: regTitle,
      category: regCategory,
      rating: 5.0,
      reviewsCount: 1,
      experienceYears: regExperience,
      bio: regBio,
      location: regLocation,
      photoUrl: initialPhoto,
      sessionFee: Number(regFee),
      availableSlots: ['09:30 AM', '11:00 AM', '02:00 PM', '04:30 PM'],
      specialties: regSpecialtiesStr.split(',').map(s => s.trim()).filter(Boolean),
      languages: ['English', 'Hindi'],
      commissionPercentage: calculatedCommission, // Dynamic variable matching user listing model config
      phone: regPhone,
      email: regEmail
    };

    onAddNewSpecialist(newSpec);
    onUpdateRole('Portfolio Professional'); // Elevates the role to Portfolio Owner!
    setShowRegModal(false);

    // Reset fields
    setRegName('');
    setRegTitle('');
    setRegBio('');
    setRegLocation('');
    setRegFee(499);
    setRegSpecialtiesStr('');

    confettiDefault({
      particleCount: 80,
      spread: 60,
      colors: ['#3b82f6', '#f59e0b', '#10b981']
    });
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
    if (!currentProfile) {
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
        description: `Premium ${plan.title} (${plan.period}) for ${currentProfile.childName || "Kid"}`,
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

              const updatedProfile: ChildProfile = {
                ...currentProfile,
                subscriptionActive: true,
                subscriptionPlan: plan.id as any,
                subscriptionExpiryDate: expiryDate.toISOString().split('T')[0],
                contactViewCredits: (currentProfile.contactViewCredits || 0) + (plan.durationDays / 30) * 5,
              };

              if (onUpdateUserProfile) {
                onUpdateUserProfile(updatedProfile);
              }

              if (auth.currentUser) {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                await setDoc(userRef, updatedProfile, { merge: true });
              }

              confettiDefault({
                particleCount: 150,
                spread: 80,
                colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899']
              });

              alert(`🎉 Subscription Activated!\nYour plan is active until ${expiryDate.toLocaleDateString('en-IN')}.\nYou can now proceed with booking!`);
            } else {
              alert(`⚠️ Payment Validation Failed: ${verifyResult.error || 'Signature rejected'}`);
            }
          } catch (verifyErr: any) {
            console.error("Signature verification of subscription failed:", verifyErr);
            alert("Payment completed but local profile validation failed. Please contact support.");
          }
        },
        prefill: {
          name: currentProfile.parentName || "",
          email: currentProfile.email || "parent@vernunt.com",
          contact: currentProfile.phoneNumber || ""
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

  const startBooking = useCallback((spec: SpecialistProfile) => {
    if (currentProfile && !currentProfile.subscriptionActive) {
      setPendingSpecToBook(spec);
      setShowSubPromoModal(true);
      return;
    }
    setSelectedSpecialist(spec);
    setSelectedSlot(spec.availableSlots[0] || '10:00 AM');
    setRazorpayStep('details');
    setShowBookingModal(true);
  }, [currentProfile?.subscriptionActive]);

  const handleSkipSubscribePromoAndBook = () => {
    setShowSubPromoModal(false);
    if (pendingSpecToBook) {
      setSelectedSpecialist(pendingSpecToBook);
      setSelectedSlot(pendingSpecToBook.availableSlots[0] || '10:00 AM');
      setRazorpayStep('details');
      setShowBookingModal(true);
      setPendingSpecToBook(null);
    }
  };

  const handleTriggerRazorpayPayment = async () => {
    if (!selectedSpecialist) return;
    const baseFee = selectedSpecialist.sessionFee || 0;
    const gatewayFee = baseFee > 0 ? Math.round(baseFee * 0.02) : 0;
    const totalAmount = baseFee + gatewayFee;

    // If consultation fee is free, we complete booking immediately without payment gateway invocation!
    if (totalAmount === 0) {
      setRazorpayStep('processing');
      setTimeout(() => {
        const payId = `free_VIP_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        setProductionPaymentId(payId);
        setRazorpayStep('success');

        const rate = selectedSpecialist.commissionPercentage ?? globalCommissionRate;
        const earnedCommission = 0;
        const hostShare = 0;

        const newBooking: Booking = {
          id: `booking-${Date.now()}`,
          itemId: selectedSpecialist.id,
          itemTitle: selectedSpecialist.name,
          type: 'SpecialistAppointment',
          buyerName: buyerName,
          buyerEmail: buyerEmail,
          amountPaid: 0,
          commissionPercentage: rate,
          commissionEarned: earnedCommission,
          hostEarned: hostShare,
          dateStr: bookingDate,
          timeSelected: selectedSlot,
          razorpayPaymentId: payId,
          status: 'Paid'
        };

        onAddBooking(newBooking);

        // Dispatch instant Email notification
        sendSpecialistBookingNotifications({
          toEmail: buyerEmail,
          parentName: buyerName,
          specialistName: selectedSpecialist.name,
          specialistRole: selectedSpecialist.title,
          dateStr: bookingDate,
          timeSlot: selectedSlot,
          fee: 0,
          paymentId: payId
        }).catch((e) => console.warn('Specialist alert note:', e));

        confettiDefault({
          particleCount: 100,
          spread: 70,
          colors: ['#3b82f6', '#f59e0b', '#10b981']
        });
      }, 500);
      return;
    }

    setRazorpayStep('processing');
    try {
      // 1. Create Order with 2% gateway fee included
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAmount, planId: `spec_${selectedSpecialist.id}` }),
      });
      if (!response.ok) throw new Error("Server Order initiation fell back or errored.");
      const orderData = await response.json();

      // 2. Load script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      await new Promise((resolve) => {
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
      });

      // 3. Initiate Checkout Modal
      const options = {
        key: orderData.keyId || "rzp_test_simulated_key_123456",
        amount: orderData.amount,
        currency: "INR",
        name: "Vernunt Consultant Booking",
        description: `Consultation with: ${selectedSpecialist.name}`,
        image: selectedSpecialist.photoUrl,
        order_id: orderData.orderId,
        handler: async function (checkoutRes: any) {
          // verify
          try {
            const verifyResponse = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: checkoutRes.razorpay_order_id || orderData.orderId,
                razorpay_payment_id: checkoutRes.razorpay_payment_id,
                razorpay_signature: checkoutRes.razorpay_signature || "simulated_verification_token"
              })
            });
            const verifyResult = await verifyResponse.json();
            if (verifyResult.success) {
              const payId = checkoutRes.razorpay_payment_id || `pay_VRN_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
              setProductionPaymentId(payId);
              setRazorpayStep('success');

              const rate = selectedSpecialist.commissionPercentage ?? globalCommissionRate;
              const earnedCommission = Math.round((fee * rate) / 100);
              const hostShare = fee - earnedCommission;

              const newBooking: Booking = {
                id: `booking-${Date.now()}`,
                itemId: selectedSpecialist.id,
                itemTitle: selectedSpecialist.name,
                type: 'SpecialistAppointment',
                buyerName: buyerName,
                buyerEmail: buyerEmail,
                amountPaid: totalAmount,
                commissionPercentage: rate,
                commissionEarned: earnedCommission,
                hostEarned: hostShare,
                dateStr: bookingDate,
                timeSelected: selectedSlot,
                razorpayPaymentId: payId,
                status: 'Paid'
              };

              onAddBooking(newBooking);

              // Dispatch instant Email notification
              sendSpecialistBookingNotifications({
                toEmail: buyerEmail,
                parentName: buyerName,
                specialistName: selectedSpecialist.name,
                specialistRole: selectedSpecialist.title,
                dateStr: bookingDate,
                timeSlot: selectedSlot,
                fee: totalAmount,
                paymentId: payId
              }).catch((e) => console.warn('Specialist alert note:', e));

              // Attribute affiliate referral commission if buyer came via partner link
              attributeAffiliateBooking(newBooking, `Consultation with ${selectedSpecialist.name}`).catch((err) => {
                console.warn('Specialist affiliate attribution note:', err);
              });

              confettiDefault({
                particleCount: 120,
                spread: 75,
                colors: ['#0082f6', '#FECA14', '#10b981']
              });
            } else {
              alert(`⚠️ Sig failed: ${verifyResult.error}`);
              setRazorpayStep('details');
            }
          } catch (e: any) {
            console.error(e);
            setRazorpayStep('details');
          }
        },
        prefill: {
          name: buyerName || "Parent Member",
          email: buyerEmail || "guardian@vernunt.com"
        },
        theme: {
          color: "#f59e0b"
        },
        modal: {
          ondismiss: function() {
            setRazorpayStep('details');
          }
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.open();
    } catch (e: any) {
      console.error(e);
      alert(`⚠️ Payment initiation failed: ${e.message}`);
      setRazorpayStep('details');
    }
  };

  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payId = `pay_VRN_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    setProductionPaymentId(payId);
    setRazorpayStep('success');
  };

  const activeCityInfo = INDIAN_CITIES.find(c => c.id === selectedCity);
  const currentLocalityList = activeCityInfo ? activeCityInfo.popularAreas : BANGALORE_AREAS;

  // Dynamic SEO Document Title update for Specialists Directory
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const cityName = selectedCity !== 'all' && activeCityInfo ? activeCityInfo.name : 'Pan-India';
    document.title = `${cityName} Specialists Portfolio (${specialistsList.length}+ Verified) | Vernunt`;
  }, [selectedCity, activeCityInfo, specialistsList.length]);

  // Filter criteria logic with Pan-India Cities & Localities with guaranteed unique IDs
  const filteredSpecs = useMemo(() => {
    const seenIds = new Set<string>();
    return combinedSpecialistsList.filter(spec => {
      if (!spec || !spec.id || seenIds.has(spec.id)) return false;
      seenIds.add(spec.id);

      if (categoryFilter !== 'All' && spec.category !== categoryFilter) return false;

      // City Filter
      if (selectedCity !== 'all') {
        const cityObj = INDIAN_CITIES.find(c => c.id === selectedCity);
        if (cityObj) {
          const cityLower = cityObj.name.toLowerCase();
          const cityMatches = (spec.location && spec.location.toLowerCase().includes(cityLower)) ||
                              (spec.clinicAddress && spec.clinicAddress.toLowerCase().includes(cityLower)) ||
                              (spec.hospitalAffiliation && spec.hospitalAffiliation.toLowerCase().includes(cityLower));
          if (!cityMatches) return false;
        }
      }

      // Locality Filter
      if (selectedLocality !== 'All Areas') {
        const locLower = selectedLocality.toLowerCase();
        const matchesLoc = (spec.location && spec.location.toLowerCase().includes(locLower)) ||
                           (spec.clinicAddress && spec.clinicAddress.toLowerCase().includes(locLower));
        if (!matchesLoc) return false;
      }

      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      if (query === 'kids doctor' || query === 'kids doctors' || query === 'child doctor' || query === 'baby doctor') {
        return spec.category === 'Pediatrician' || spec.category === 'Pediatric Specialist';
      }

      if (query === 'nutritionist' || query === 'nutritionists' || query === 'dietitian' || query === 'dietitians' || query === 'nutrition' || query === 'diet') {
        return spec.category === 'Nutritionist' || spec.title.toLowerCase().includes('nutrition') || spec.specialties.some(s => s.toLowerCase().includes('nutrition') || s.toLowerCase().includes('diet'));
      }

      if (query === 'coach' || query === 'coaches' || query === 'swimming' || query === 'gymnastics' || query === 'football' || query === 'fitness') {
        return spec.category === 'Coach' || spec.title.toLowerCase().includes(query) || spec.specialties.some(s => s.toLowerCase().includes(query));
      }

      return (
        spec.name.toLowerCase().includes(query) ||
        spec.title.toLowerCase().includes(query) ||
        spec.bio.toLowerCase().includes(query) ||
        (spec.location && spec.location.toLowerCase().includes(query)) ||
        (spec.hospitalAffiliation && spec.hospitalAffiliation.toLowerCase().includes(query)) ||
        (spec.clinicAddress && spec.clinicAddress.toLowerCase().includes(query)) ||
        (spec.qualifications && spec.qualifications.toLowerCase().includes(query)) ||
        spec.specialties.some(s => s.toLowerCase().includes(query))
      );
    });
  }, [specialistsList, categoryFilter, selectedCity, selectedLocality, searchQuery]);

  // Derive center coordinates for live distance calculation: User GPS > Selected City center > Default Bangalore
  const centerCoords = useMemo(() => {
    if (userCoords) {
      return userCoords;
    }
    if (selectedCity !== 'all' && (CITY_COORDINATES as any)[selectedCity]) {
      const c = (CITY_COORDINATES as any)[selectedCity];
      return { lat: c.lat, lng: c.lng };
    }
    // Default Bangalore center
    return { lat: 12.9716, lng: 77.5946 };
  }, [userCoords, selectedCity]);

  // Calculate distance for each specialist and sort according to user selection
  const sortedAndFilteredSpecs = useMemo(() => {
    const withDistance = filteredSpecs.map(spec => {
      const dist = calculateDoctorDistance(centerCoords.lat, centerCoords.lng, spec);
      return {
        ...spec,
        distanceKm: dist
      };
    });

    return withDistance.sort((a, b) => {
      if (sortOption === 'distance') {
        const distA = a.distanceKm !== undefined ? a.distanceKm : 99999;
        const distB = b.distanceKm !== undefined ? b.distanceKm : 99999;
        return distA - distB;
      }
      if (sortOption === 'recommended') {
        const scoreA = (a.rating || 0) * (a.reviewsCount || 1);
        const scoreB = (b.rating || 0) * (b.reviewsCount || 1);
        return scoreB - scoreA;
      }
      if (sortOption === 'experience') {
        return (b.experienceYears || 0) - (a.experienceYears || 0);
      }
      if (sortOption === 'fee-asc') {
        return (a.sessionFee || 0) - (b.sessionFee || 0);
      }
      if (sortOption === 'fee-desc') {
        return (b.sessionFee || 0) - (a.sessionFee || 0);
      }
      return 0;
    });
  }, [filteredSpecs, centerCoords, sortOption]);

  // Progressive non-blocking batch rendering for "Show All" to prevent browser freeze/hang
  useEffect(() => {
    if (!isProgressiveLoadingAll) return;

    if (visibleCount >= sortedAndFilteredSpecs.length) {
      setIsProgressiveLoadingAll(false);
      return;
    }

    // Schedule next chunk using small interval for butter-smooth 60fps frame budgeting
    const timer = setTimeout(() => {
      setVisibleCount(prev => Math.min(sortedAndFilteredSpecs.length, prev + 60));
    }, 25);

    return () => clearTimeout(timer);
  }, [isProgressiveLoadingAll, visibleCount, sortedAndFilteredSpecs.length]);

  // Auto-load infinite scroll when sentinel enters viewport
  useEffect(() => {
    if (!sentinelRef.current) return;
    if (isProgressiveLoadingAll) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && visibleCount < sortedAndFilteredSpecs.length) {
          setVisibleCount(prev => Math.min(sortedAndFilteredSpecs.length, prev + 30));
        }
      },
      { rootMargin: '350px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [visibleCount, sortedAndFilteredSpecs.length, isProgressiveLoadingAll]);

  // Back to top indicator
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        setShowScrollTop(window.scrollY > 600);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  return (
    <div id="specialists-tab-view" className="space-y-6">
      {/* Header and Callouts */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 id="specs-main-title" className="text-xl font-bold text-slate-800 font-serif flex items-center gap-2">
            🧬 Vernunt Verified Specialists Network &amp; Pan-India Directory
          </h3>
          <p id="specs-main-subtitle" className="text-xs text-slate-500">
            Find and consult verified specialists across India — including pediatricians, gynecologists, child psychologists, dietitians, and health specialists.
          </p>
        </div>

        {/* Action buttons: Register Practice & MF Advisor Dashboard */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-trigger-mf-advisor-dashboard"
            onClick={() => setShowAdvisorDashboard(true)}
            type="button"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="Mutual Fund Advisors: Manage Profile & Showcase AMFI Credentials"
          >
            <TrendingUp className="w-4 h-4" />
            <span>MF Advisor Dashboard</span>
          </button>

          <button
            id="btn-trigger-register-specialist"
            onClick={() => setShowRegModal(true)}
            type="button"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>Register Practice</span>
          </button>
        </div>
      </div>

      {/* Pan-India City Bar & Locality Filter */}
      <div className="bg-gradient-to-r from-rose-50 via-amber-50/50 to-orange-50 border border-rose-200/80 p-4 rounded-3xl space-y-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-slate-900 font-serif">
                  Pan-India Specialists Directory
                </h4>
                <span className="px-2 py-0.5 bg-rose-600 text-white text-[9.5px] font-black rounded-full uppercase tracking-wider">
                  Vernunt Verified
                </span>
              </div>
              <p className="text-[11.5px] text-slate-600">
                100% verified authentic clinical portfolios from top hospitals and trusted clinics across Indian metros.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="filter-only-pediatricians-btn"
              onClick={() => {
                setCategoryFilter('Pediatrician');
                setSelectedLocality('All Areas');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                categoryFilter === 'Pediatrician'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-rose-50 border-rose-200'
              }`}
            >
              Pediatrician ({specialistsList.filter(s => s.category === 'Pediatrician').length})
            </button>
            <button
              type="button"
              id="filter-only-gynecologists-btn"
              onClick={() => {
                setCategoryFilter('Gynecologist');
                setSelectedLocality('All Areas');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                categoryFilter === 'Gynecologist'
                  ? 'bg-fuchsia-600 text-white border-fuchsia-700 shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-fuchsia-50 border-fuchsia-200'
              }`}
            >
              Gynecologists & OB/GYN ({specialistsList.filter(s => s.category === 'Gynecologist').length})
            </button>
            <button
              type="button"
              id="filter-only-nutritionists-btn"
              onClick={() => {
                setCategoryFilter('Nutritionist');
                setSelectedLocality('All Areas');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                categoryFilter === 'Nutritionist'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-emerald-50 border-emerald-200'
              }`}
            >
              Child Nutritionists ({specialistsList.filter(s => s.category === 'Nutritionist').length})
            </button>
            <button
              type="button"
              id="filter-only-coaches-btn"
              onClick={() => {
                setCategoryFilter('Coach');
                setSelectedLocality('All Areas');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                categoryFilter === 'Coach'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-amber-50 border-amber-200'
              }`}
            >
              Kids Coaches ({specialistsList.filter(s => s.category === 'Coach').length})
            </button>
            <button
              type="button"
              id="filter-only-wealth-advisors-btn"
              onClick={() => {
                setCategoryFilter('Kids Wealth & Investment Planners');
                setSelectedLocality('All Areas');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                categoryFilter === 'Kids Wealth & Investment Planners'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-indigo-50 border-indigo-200'
              }`}
            >
              Kids Wealth &amp; MF Planners ({combinedSpecialistsList.filter(s => s.category === 'Kids Wealth & Investment Planners').length})
            </button>
          </div>
        </div>

        {/* Pan-India Cities Row */}
        <div className="pt-2 border-t border-rose-200/60 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[10px] uppercase font-black text-rose-800 tracking-wider whitespace-nowrap mr-1 flex items-center gap-1">
            <Globe className="w-3 h-3 text-rose-600" /> City:
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedCity('all');
              setSelectedLocality('All Areas');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedCity === 'all'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white/85 hover:bg-white text-slate-700 border border-slate-200/80'
            }`}
          >
            🇮🇳 All India ({specialistsList.length})
          </button>
          {INDIAN_CITIES.filter(city => city.id !== 'all').map((city) => {
            const isCitySelected = selectedCity === city.id;
            const countInCity = specialistsList.filter(s => {
              const cName = city.name.toLowerCase();
              return (s.location && s.location.toLowerCase().includes(cName)) ||
                     (s.clinicAddress && s.clinicAddress.toLowerCase().includes(cName)) ||
                     (s.hospitalAffiliation && s.hospitalAffiliation.toLowerCase().includes(cName));
            }).length;

            return (
              <button
                key={city.id}
                type="button"
                onClick={() => {
                  setSelectedCity(city.id);
                  setSelectedLocality('All Areas');
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                  isCitySelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white/85 hover:bg-white text-slate-700 border border-slate-200/80'
                }`}
              >
                <span>{city.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isCitySelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {countInCity}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Locality Chips for selected city */}
        <div className="pt-2 border-t border-rose-200/40 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 whitespace-nowrap mr-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-rose-500" /> Locality:
          </span>
          {currentLocalityList.map((area) => {
            const isSelected = selectedLocality === area;
            return (
              <button
                key={area}
                type="button"
                onClick={() => setSelectedLocality(area)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80'
                }`}
              >
                {area}
              </button>
            );
          })}
        </div>
      </div>

      {/* SEO Trending Searches & Keywords Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
          🔥 Trending:
        </span>
        {[
          { label: 'Kids Doctors Near Me', query: 'kids doctor' },
          { label: 'Pediatrician', query: 'pediatrician' },
          { label: 'Gynecologists & OB/GYN', query: 'gynecologist' },
          { label: 'Newborn Vaccinations', query: 'vaccination' },
          { label: 'Pediatric Pulmonology', query: 'pulmonology' },
          { label: 'Child Neurology', query: 'neurology' },
          { label: 'Pediatric Allergy & Asthma', query: 'asthma' },
          { label: 'Child Dietitian', query: 'nutrition' },
        ].map(item => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              setSearchQuery(item.query);
              if (item.query === 'gynecologist') {
                setCategoryFilter('Gynecologist');
              } else {
                setCategoryFilter('Pediatrician');
              }
            }}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition border cursor-pointer ${
              searchQuery.toLowerCase() === item.query.toLowerCase()
                ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                : 'bg-slate-100/80 hover:bg-rose-50 text-slate-700 border-slate-200/80 hover:border-rose-200'
            }`}
          >
            {item.label}
          </button>
        ))}
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-[11px] text-rose-600 hover:text-rose-800 font-bold whitespace-nowrap ml-1 cursor-pointer"
          >
            ✕ Clear filter
          </button>
        )}
      </div>

      {/* Specialty Filter Hub */}
      <div className="bg-slate-50/80 border border-slate-100 p-3 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5" id="specs-category-filters">
          {categories.map((cat) => {
            const isSelected = categoryFilter === cat.key;
            const count = cat.key === 'All' 
              ? specialistsList.length 
              : specialistsList.filter(s => s.category === cat.key).length;
            const CatIcon = cat.icon;

            return (
              <button
                key={cat.key}
                id={`btn-spec-cat-${cat.key}`}
                type="button"
                onClick={() => setCategoryFilter(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  isSelected 
                    ? 'bg-slate-900 border-slate-950 text-white shadow-xs' 
                    : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <CatIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : cat.color}`} />
                <span>{cat.label}</span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-slate-800 text-slate-250' : 'bg-slate-100 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Search */}
        <div id="spec-search-bar" className="relative w-full md:w-72">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search specialist, clinic, doctor, or specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white text-xs border border-slate-200 focus:border-rose-400 rounded-xl outline-none focus:ring-4 focus:ring-rose-100 transition shadow-xs placeholder-slate-400 text-slate-700 font-bold"
          />
        </div>
      </div>

      {/* Distance Sort & Proximity Bar */}
      <div id="distance-sort-bar" className="bg-white border border-slate-200/90 p-3 sm:p-4 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left: Location indicator & GPS detect button */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-orange-950 font-bold">
            <Navigation className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
            <span>{locationLabel}</span>
            {userCoords && (
              <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.5 rounded-full ml-1 flex items-center gap-0.5">
                <CheckCircle className="w-2.5 h-2.5 text-emerald-600" /> Active GPS
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleTriggerDetectLocation}
            disabled={isDetectingLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer border border-slate-200/60 disabled:opacity-50"
            title="Use your phone or computer GPS to calculate accurate kilometer distances to clinics"
          >
            {isDetectingLocation ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-600" />
                <span>Locating you...</span>
              </>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5 text-slate-600" />
                <span>{userCoords ? 'Refresh GPS Location' : '📍 Detect Live GPS Location'}</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Sort dropdown & Admin claims desk button */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span className="whitespace-nowrap text-slate-500">Sort by:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-300 font-bold text-slate-800 text-xs rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer shadow-xs transition"
            >
              <option value="distance">📍 Distance: Nearest to Me First</option>
              <option value="recommended">⭐ Top Patient Rated &amp; Recommended</option>
              <option value="experience">🏆 Clinical Experience: Highest First</option>
              <option value="fee-asc">💰 Consultation Fee: Low to High</option>
              <option value="fee-desc">💎 Consultation Fee: High to Low</option>
            </select>
          </div>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setShowAdminClaimsModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer border border-slate-950"
              title="Review uploaded doctor ID cards and verify ownership"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Doctor Claims Desk</span>
            </button>
          )}
        </div>
      </div>

      {/* Counter Banner */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-800">{Math.min(visibleCount, sortedAndFilteredSpecs.length)}</strong> of <strong className="text-slate-800">{sortedAndFilteredSpecs.length}</strong> verified specialists &amp; doctors {selectedCity === 'all' ? 'across Pan-India' : `in ${activeCityInfo?.name || 'India'}`}
        </span>
        {sortedAndFilteredSpecs.length > visibleCount && (
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Scroll or click "Load More" below
          </span>
        )}
      </div>

      {/* Directory Cards Grid */}
      <div id="specs-cards-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedAndFilteredSpecs.slice(0, visibleCount).map((spec) => (
          <DoctorCard
            key={spec.id}
            spec={spec}
            onOpenPortfolio={handleOpenPortfolio}
            onStartBooking={startBooking}
            onWhatsAppShare={handleWhatsAppShareSpecialist}
            onClaimProfile={(targetSpec) => setClaimingSpecialist(targetSpec)}
          />
        ))}

        {sortedAndFilteredSpecs.length === 0 && (
          <div className="col-span-full py-16 text-center space-y-3 bg-slate-50 rounded-3xl border border-slate-100">
            <Compass className="w-12 h-12 text-slate-300 mx-auto animate-pulse" />
            <div>
              <h4 className="font-bold text-slate-800 font-serif">No Specialists Found</h4>
              <p className="text-xs text-slate-400">Try broad, inclusive searches like "Tutor" or "Coach".</p>
            </div>
          </div>
        )}
      </div>

      {/* Sentinel trigger for seamless auto-load infinite scroll */}
      {sortedAndFilteredSpecs.length > visibleCount && !isProgressiveLoadingAll && (
        <div ref={sentinelRef} className="h-4 w-full" aria-hidden="true" />
      )}

      {/* Progressive loading banner when user clicks Show All to ensure 60fps & no browser hang */}
      {isProgressiveLoadingAll && (
        <div className="bg-gradient-to-r from-orange-50 via-rose-50 to-amber-50 border border-orange-200/80 rounded-2xl p-4 shadow-sm max-w-xl mx-auto flex flex-col gap-2.5 animate-fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-orange-600 animate-spin" />
              Smoothly rendering verified specialists ({visibleCount} of {sortedAndFilteredSpecs.length})
            </span>
            <button
              type="button"
              onClick={() => setIsProgressiveLoadingAll(false)}
              className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer font-medium"
            >
              Stop Loading
            </button>
          </div>
          <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-rose-500 h-full transition-all duration-100 rounded-full"
              style={{ width: `${Math.min(100, Math.round((visibleCount / sortedAndFilteredSpecs.length) * 100))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 text-center">
            Rendering smoothly without freezing your browser ({Math.min(100, Math.round((visibleCount / sortedAndFilteredSpecs.length) * 100))}% loaded)
          </p>
        </div>
      )}

      {/* Pagination / Load More Controls */}
      {filteredSpecs.length > visibleCount && !isProgressiveLoadingAll && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 pb-6">
          <button
            type="button"
            onClick={() => setVisibleCount(prev => Math.min(filteredSpecs.length, prev + 60))}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
          >
            <span>Load 60 More Portfolios</span>
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px]">
              {filteredSpecs.length - visibleCount} more
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (filteredSpecs.length <= 60) {
                setVisibleCount(filteredSpecs.length);
              } else {
                setIsProgressiveLoadingAll(true);
              }
            }}
            className="px-5 py-2.5 bg-white hover:bg-orange-50 active:scale-95 text-orange-600 hover:text-orange-700 font-bold text-xs rounded-xl border border-orange-200 shadow-xs transition cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Show All ({filteredSpecs.length})</span>
          </button>
        </div>
      )}

      {/* When all verified specialists are loaded */}
      {visibleCount >= filteredSpecs.length && filteredSpecs.length > 30 && (
        <div className="text-center py-6 text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>All {filteredSpecs.length} verified child specialists displayed</span>
        </div>
      )}

      {/* Floating Back to Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 bg-slate-900/90 hover:bg-slate-900 text-white rounded-full shadow-lg backdrop-blur-xs transition hover:scale-105 active:scale-95 flex items-center gap-2 text-xs font-bold"
          title="Back to Top"
        >
          <ArrowUp className="w-4 h-4 text-orange-400" />
          <span className="hidden sm:inline">Top</span>
        </button>
      )}

      {/* Booking and Razorpay Payment Integrated Modal */}
      {showBookingModal && selectedSpecialist && (
        <div id="booking-checkout-modal" className="fixed inset-0 bg-slate-955/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform transition-all flex flex-col max-h-[85vh] my-auto">
            
            {/* Modal Header */}
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between shrink-0 font-sans">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-serif font-black text-base text-white">Safe Booking Checkout</h4>
                  <span className="text-[9px] font-mono tracking-widest text-slate-400">POWERED BY RAZORPAY SECURE</span>
                </div>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 text-left">
              {/* Main Stage Handler depending on Razorpay Steps */}
              {razorpayStep === 'details' && (
                currentProfile && !currentProfile.subscriptionActive ? (
                  <div id="sub-invitation-box" className="p-6 space-y-5">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl text-white p-5 space-y-2 select-none font-sans">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-200 fill-yellow-200 animate-bounce" />
                        <h4 className="font-serif font-black text-sm">Kings Connect Club Membership Needed</h4>
                      </div>
                      <p className="text-[11px] leading-relaxed text-orange-50/90">
                        Consultation bookings and portfolio interactions are reserved for our verified subscriber community. Please choose a subscription pass below to unlock immediate consulting booking and full playdate privileges.
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
                                <span className="block text-[8px] font-black text-orange-600 bg-orange-100 rounded-md px-1 py-0.5 mt-0.5 text-center">Best Value</span>
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
                              className="mt-3 w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10.5px] font-black tracking-wider uppercase transition text-center cursor-pointer select-none"
                            >
                              Subscribe & Unlock (₹{plan.price})
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 space-y-4">
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-start gap-3">
                      <img
                        src={selectedSpecialist.photoUrl}
                        alt="spec"
                        className="w-12 h-12 rounded-xl object-cover bg-slate-150 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h5 className="font-bold text-xs text-slate-850">{selectedSpecialist.name}</h5>
                        <p className="text-[10px] text-slate-500 font-semibold">{selectedSpecialist.title}</p>
                        <span className="text-[11px] text-rose-600 font-bold block mt-1">₹{selectedSpecialist.sessionFee} / consultation</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black uppercase text-slate-500">Pick Date</label>
                          <input
                            type="date"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-xl text-xs outline-none text-slate-700 font-bold bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black uppercase text-slate-500">Select Available Slot</label>
                          <select
                            value={selectedSlot}
                            onChange={(e) => setSelectedSlot(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-xl text-xs outline-none text-slate-700 font-bold bg-white"
                          >
                            {selectedSpecialist.availableSlots.map((slot, sIdx) => (
                              <option key={sIdx} value={slot}>{slot}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase text-slate-500">Your Full Name</label>
                        <input
                          type="text"
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          placeholder="Enter guardian name"
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none text-slate-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase text-slate-500">Contact Email address</label>
                        <input
                          type="email"
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          placeholder="guardian@example.com"
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none text-slate-700"
                        />
                      </div>
                    </div>

                    {/* Production Payment Summary showing breakdown & 2% gateway fee */}
                    {(() => {
                      const baseFee = selectedSpecialist.sessionFee || 0;
                      const isFree = baseFee === 0;
                      const fee2Percent = isFree ? 0 : Math.round(baseFee * 0.02);
                      const totalPay = baseFee + fee2Percent;

                      return (
                        <div className="space-y-3">
                          <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-2xl text-[11px] space-y-1.5 font-medium text-slate-600">
                            <div className="flex justify-between">
                              <span>Consultation Standard Fee:</span>
                              <strong className="text-slate-800">{isFree ? 'FREE' : `₹${baseFee}.00`}</strong>
                            </div>
                            {!isFree && (
                              <div className="flex justify-between text-slate-500 text-[10.5px]">
                                <span>Secure Gateway Fee (2%):</span>
                                <span>₹{fee2Percent}.00</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-orange-100/60 pt-1.5 text-xs text-slate-900">
                              <span className="font-extrabold flex items-center gap-1 text-orange-600">
                                <Sparkles className="w-3.5 h-3.5 text-orange-500" /> Total Payable:
                              </span>
                              <strong className="font-black text-sm">{isFree ? 'FREE (Complimentary)' : `₹${totalPay}.00`}</strong>
                            </div>
                          </div>

                          <button
                            onClick={handleTriggerRazorpayPayment}
                            type="button"
                            className="w-full py-3 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer select-none"
                          >
                            {isFree ? (
                              <>
                                <Check className="w-4 h-4" /> Confirm Free Appointment
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4" /> Pay ₹{totalPay} with Razorpay Secure
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )
              )}

            {razorpayStep === 'processing' && (
              <div className="p-12 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <div>
                  <h5 className="font-bold text-sm text-slate-800">Spawning Razorpay Secure payment overlay...</h5>
                  <p className="text-xs text-slate-400">Authenticating transaction with high security bank servers...</p>
                </div>
              </div>
            )}

            {razorpayStep === 'otp' && (
              <form onSubmit={handleVerifyOtpSubmit} className="p-6 space-y-4 text-center">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-lg font-black animate-pulse">
                  🔑
                </div>
                <div>
                  <h5 className="font-serif font-black text-base text-slate-800">Safe OTP Verification</h5>
                  <p className="text-[11px] text-slate-500">A security transaction pass code was sent to registered telephone link. Enter code below.</p>
                </div>

                <div className="max-w-xs mx-auto">
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="Enter OTP (e.g. 1234)"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="w-full p-3 font-mono font-bold text-center tracking-widest text-lg border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-orange-100 transition text-slate-700"
                  />
                  <div className="text-[10px] text-slate-400 font-bold mt-2 hover:underline cursor-pointer">
                    Resend Safe Code OTP
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRazorpayStep('details')}
                    className="w-1/3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
                  >
                    Go Back
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase transition shadow-md"
                  >
                    Confirm & Split Payment
                  </button>
                </div>
              </form>
            )}

            {razorpayStep === 'success' && (
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                  <Check className="w-8 h-8" strokeWidth={3} />
                </div>
                <div>
                  <h5 className="font-serif font-black text-lg text-slate-800">Appointment Booked Successfully!</h5>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Razorpay secured split transaction with identifier <strong className="text-slate-700 font-mono text-[10px]">{productionPaymentId}</strong> verified successfully on the production live network.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs space-y-1.5 text-left text-slate-600">
                  <div className="flex justify-between">
                    <span>Date & Time:</span>
                    <strong className="text-slate-800">{bookingDate} • {selectedSlot}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Consultant:</span>
                    <strong className="text-slate-800">{selectedSpecialist.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Contact Info:</span>
                    <span className="font-medium text-slate-500">{selectedSpecialist.phone} | {selectedSpecialist.email}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                >
                  Close Receipt Screen
                </button>
              </div>
            )}

            </div>

          </div>
        </div>
      )}

      {/* Specialist registration Modal */}
      {showRegModal && (
        <div id="modal-specialist-form" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all flex flex-col max-h-[85vh] my-auto">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white flex justify-between items-center shrink-0 font-sans">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-100">Child Specialists Registration</span>
                <h4 className="text-lg font-serif font-bold">Launch Professional Child Portfolio</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowRegModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSpecialist} className="p-6 space-y-4 overflow-y-auto flex-1 text-left">
              {regError && (
                <div id="reg-form-error" className="p-3 bg-rose-50 border border-rose-250 rounded-xl text-xs text-rose-700 font-bold">
                  {regError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Your Full Professional Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Dr. Meenakshi Iyer, Prof. Alan"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 focus:border-blue-300 rounded-xl outline-none text-xs text-slate-700 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Specialist Category *</label>
                  <select
                    value={regCategory}
                    onChange={(e) => setRegCategory(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  >
                    <option value="Pediatrician">Pediatrician</option>
                    <option value="Gynecologist">Gynecologist &amp; Obstetrician</option>
                    <option value="Nutritionist">Child Nutritionist &amp; Dietitian</option>
                    <option value="Coach">Kids Coach &amp; Sports Mentor</option>
                    <option value="Therapist">Child Development &amp; Speech Therapist</option>
                    <option value="Other">Other Specialist</option>
                    {customSpecCats.map(cs => (
                      <option key={cs.id} value={cs.value}>✨ {cs.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Official Tagline / title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Child Nutritionist"
                    value={regTitle}
                    onChange={(e) => setRegTitle(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 focus:border-blue-300 rounded-xl outline-none text-xs text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <AestheticImageUploader
                  id="specialist-reg-photo"
                  label="Upload Professional Photo / Studio Headshot"
                  value={regPhoto}
                  onChange={setRegPhoto}
                  presetSuggestions={[
                    { name: 'Pediatrician', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400&crop=faces' },
                    { name: 'Clinical Nutritionist', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&crop=faces' },
                    { name: 'Academy Language Coach', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400&crop=faces' }
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Session Fee (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    min={100}
                    max={10000}
                    value={regFee}
                    onChange={(e) => setRegFee(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Years of Experience *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={regExperience}
                    onChange={(e) => setRegExperience(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Clinic / Office Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Symphony Hall, Suite 402"
                    value={regLocation}
                    onChange={(e) => setRegLocation(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Specialty Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. GlutenFree, Montessori, Clay"
                    value={regSpecialtiesStr}
                    onChange={(e) => setRegSpecialtiesStr(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Tell child parents about your credentials *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your qualifications, typical clinical consultations, child progress mapping, or classes syllabus so parents have ultimate confidence."
                  value={regBio}
                  onChange={(e) => setRegBio(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed resize-none"
                />
              </div>

              {/* Commission note */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3.5 space-y-1 text-[11px] text-indigo-700 font-medium">
                <div className="flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Interactive Split Commission Policy</span>
                </div>
                <p>
                  Vernunt marketplace secures slot bookkeeping bookings automatically. A platform commission of <strong className="text-indigo-900">{selectedSpecialist?.commissionPercentage ?? globalCommissionRate}%</strong> is split via Razorpay standard splits. Remaining ₹ amounts are direct-transfer routed.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Verify & Register Professional Portfolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Pop-up Option to Subscribe on Booking Click */}
      {showSubPromoModal && (
        <div id="modal-subscription-promo" className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all flex flex-col max-h-[90vh]">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white text-left font-sans">
              <span className="p-1 px-2 bg-white/20 text-[9px] font-black uppercase tracking-wider rounded-md">Prime Advantage Hub</span>
              <h4 className="text-xl font-serif font-black mt-1.5 flex items-center gap-1.5 leading-tight">
                🌟 Join Kids Connect Prime
              </h4>
              <p className="text-xs text-white/90 mt-1 leading-relaxed">
                Unlock instant access, bypass consultation fees, and socialise without boundaries!
              </p>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-left">
              {/* Premium Perks Grid */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Subscriber Privileges</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-xl flex items-start gap-2">
                    <span className="text-lg">🎟️</span>
                    <div>
                      <strong className="block text-amber-900 font-extrabold text-[11px]">Free Public Entry Passes</strong>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Zero ticketeer commission on all standard events & physical classes.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-orange-50/40 border border-orange-100 rounded-xl flex items-start gap-2">
                    <span className="text-lg">📞</span>
                    <div>
                      <strong className="block text-orange-950 font-extrabold text-[11px]">Unlimited Direct Contact</strong>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Bypass mobile credentials lockouts & ping other local guardians instantly.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50/40 border border-rose-100 rounded-xl flex items-start gap-2 col-span-2">
                    <span className="text-lg">⚡</span>
                    <div>
                      <strong className="block text-rose-950 font-extrabold text-[11px]">VIP Slot Priority</strong>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Immediate calendar access for child tutoring and clinical experts booking.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Select Pricing Section */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Choose Kids Connect Period Pass</span>
                  <span className="text-[10px] font-bold text-slate-400">Secure Razorpay checkout</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2.5">
                  {subPlans.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handleInPopupSubscribe(plan)}
                      className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-orange-300 rounded-xl text-center transition flex flex-col justify-between items-center h-28 cursor-pointer select-none group"
                    >
                      <strong className="text-[11px] font-serif font-black text-slate-800 leading-tight group-hover:text-orange-600 transition">{plan.title}</strong>
                      <span className="text-[9px] text-slate-400 font-medium my-1">{plan.period}</span>
                      <strong className="text-xs text-orange-600 font-extrabold bg-orange-50 px-2 py-0.5 rounded-md">₹{plan.price}</strong>
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed">
                By selecting a plan, you authorize UPI/Secured Razorpay transaction. You will bypass future consultation commissions.
              </p>
            </div>

            {/* Split controls at the bottom */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSkipSubscribePromoAndBook}
                className="w-full sm:w-auto px-4 py-2 hover:bg-slate-200 text-slate-600 text-xs font-black uppercase tracking-wide transition rounded-xl cursor-pointer"
              >
                Continue Booking Without Subscribing
              </button>

              <button
                type="button"
                onClick={() => setShowSubPromoModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                Close Promotion Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rich Specialist Portfolio Modal */}
      {viewingPortfolioSpec && (
        <PediatricianPortfolioModal
          specialist={viewingPortfolioSpec}
          onClose={handleClosePortfolio}
          onBookSlot={(spec) => {
            handleClosePortfolio();
            startBooking(spec);
          }}
          currentProfile={currentProfile}
          onUpdateSpecialist={onUpdateSpecialist}
          onClaimProfile={(spec) => setClaimingSpecialist(spec)}
        />
      )}

      {/* Claim Portfolio Modal */}
      {claimingSpecialist && (
        <ClaimSpecialistModal
          specialist={claimingSpecialist}
          onClose={() => setClaimingSpecialist(null)}
          onClaimSubmitted={handleClaimSubmitted}
          currentUserEmail={currentProfile?.email}
          currentUserPhone={currentProfile?.parentPhone}
        />
      )}

      {/* Specialist Claims Admin Verification Modal */}
      {showAdminClaimsModal && (
        <SpecialistClaimsAdminModal
          isOpen={showAdminClaimsModal}
          onClose={() => setShowAdminClaimsModal(false)}
          adminEmail={currentProfile?.email || 'admin@vernunt.com'}
          onClaimApproved={handleClaimApproved}
        />
      )}

      {/* Mutual Fund Advisor Dashboard & Credentials Manager */}
      <MutualFundAdvisorDashboard
        isOpen={showAdvisorDashboard}
        onClose={() => setShowAdvisorDashboard(false)}
        advisors={advisors}
        onAddAdvisor={handleAddAdvisor}
        onUpdateAdvisor={handleUpdateAdvisor}
        onDeleteAdvisor={handleDeleteAdvisor}
      />

    </div>
  );
}
