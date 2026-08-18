import React, { useState, useEffect } from 'react';
import { SpecialistProfile, Booking, ChildProfile } from '../types.ts';
import { Award, ShieldCheck, Heart, Star, MapPin, Compass, Briefcase, Sparkles, SlidersHorizontal, BookOpen, Scissors, Stethoscope, Utensils, Flame, Check, CreditCard } from 'lucide-react';
import confettiDefault from 'canvas-confetti';
import AestheticImageUploader from './AestheticImageUploader.tsx';
import { db, auth, handleFirestoreError, OperationType } from '../utils/firebase.ts';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

interface SpecialistsTabProps {
  currentProfile: ChildProfile | null;
  onUpdateRole: (newRole: 'Parent' | 'Event Organizer' | 'Portfolio Professional' | 'Admin') => void;
  onAddNewSpecialist: (specialist: SpecialistProfile) => void;
  specialistsList: SpecialistProfile[];
  bookingsList: Booking[];
  onAddBooking: (booking: Booking) => void;
  globalCommissionRate: number; // default global percentage
  onUpdateUserProfile?: (profile: ChildProfile) => void;
}

export default function SpecialistsTab({
  currentProfile,
  onUpdateRole,
  onAddNewSpecialist,
  specialistsList,
  bookingsList,
  onAddBooking,
  globalCommissionRate,
  onUpdateUserProfile
}: SpecialistsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // States for subscription promotion on booking click
  const [showSubPromoModal, setShowSubPromoModal] = useState(false);
  const [pendingSpecToBook, setPendingSpecToBook] = useState<SpecialistProfile | null>(null);

  // Specialist Registration form states
  const [showRegModal, setShowRegModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regTitle, setRegTitle] = useState('');
  const [regCategory, setRegCategory] = useState<string>('Tutor');
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
  const [regEmail, setRegEmail] = useState(currentProfile?.parentName.replace(/\s+/g, '').toLowerCase() + '@gmail.com');
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
  const [buyerName, setBuyerName] = useState(currentProfile?.parentName || '');
  const [buyerEmail, setBuyerEmail] = useState('guardian@vernunt.org');

  const categories = [
    { key: 'All', label: 'All Minds', icon: Compass, color: 'text-orange-500' },
    { key: 'Tutor', label: 'Tutors & Academy', icon: BookOpen, color: 'text-blue-500' },
    { key: 'Nutritionist', label: 'Nutritionists', icon: Utensils, color: 'text-emerald-500' },
    { key: 'Makeup Artist', label: 'Artists & Makeups', icon: Scissors, color: 'text-pink-500' },
    { key: 'Pediatrician', label: 'Pediatricians', icon: Stethoscope, color: 'text-rose-500' },
    { key: 'Coach', label: 'Sports Coaches', icon: Flame, color: 'text-amber-500' },
    ...customSpecCats.map(cs => ({ key: cs.value, label: cs.name, icon: Briefcase, color: 'text-indigo-500' }))
  ];

  const handleRegisterSpecialist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regTitle || !regBio || !regLocation) {
      setRegError('Please supply all required specialist variables.');
      return;
    }

    const initialPhoto = regPhoto || (regCategory === 'Nutritionist' 
      ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400'
      : regCategory === 'Pediatrician'
      ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'
      : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400');

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

  const startBooking = (spec: SpecialistProfile) => {
    if (!currentProfile?.subscriptionActive) {
      setPendingSpecToBook(spec);
      setShowSubPromoModal(true);
      return;
    }
    setSelectedSpecialist(spec);
    setSelectedSlot(spec.availableSlots[0] || '10:00 AM');
    setRazorpayStep('details');
    setShowBookingModal(true);
  };

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
    const fee = selectedSpecialist.sessionFee || 0;

    // If consultation fee is free, we complete booking immediately without payment gateway invocation!
    if (fee === 0) {
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

        confettiDefault({
          particleCount: 100,
          spread: 70,
          colors: ['#3b82f6', '#f59e0b', '#10b981']
        });
      }, 1000);
      return;
    }

    setRazorpayStep('processing');
    try {
      // 1. Create Order
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: fee, planId: `spec_${selectedSpecialist.id}` }),
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
                amountPaid: fee,
                commissionPercentage: rate,
                commissionEarned: earnedCommission,
                hostEarned: hostShare,
                dateStr: bookingDate,
                timeSelected: selectedSlot,
                razorpayPaymentId: payId,
                status: 'Paid'
              };

              onAddBooking(newBooking);

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

  // Filter criteria logic
  const filteredSpecs = specialistsList.filter(spec => {
    if (categoryFilter !== 'All' && spec.category !== categoryFilter) return false;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      spec.name.toLowerCase().includes(query) ||
      spec.title.toLowerCase().includes(query) ||
      spec.bio.toLowerCase().includes(query) ||
      spec.location.toLowerCase().includes(query) ||
      spec.specialties.some(s => s.toLowerCase().includes(query))
    );
  });

  return (
    <div id="specialists-tab-view" className="space-y-6">
      {/* Header and Callouts */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 id="specs-main-title" className="text-xl font-bold text-slate-800 font-serif flex items-center gap-2">
            🧬 Local Child Specialist Portfolios & Consultants
          </h3>
          <p id="specs-main-subtitle" className="text-xs text-slate-500">
            Find seasoned nutritionists, expert coding tutors, children's drama makeup specialists, and pediatric safety health experts.
          </p>
        </div>

        {/* Portfolio Owner & Professional switch buttons or registration */}
        <button
          id="btn-trigger-register-specialist"
          onClick={() => setShowRegModal(true)}
          type="button"
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <Briefcase className="w-4 h-4" />
          <span>Apply as Child Specialist Portfolio</span>
        </button>
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
        <div id="spec-search-bar" className="relative w-full md:w-64">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search specialties, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white text-xs border border-slate-200 focus:border-orange-300 rounded-xl outline-none focus:ring-4 focus:ring-orange-100 transition shadow-xs placeholder-slate-400 text-slate-700 font-bold"
          />
        </div>
      </div>

      {/* Directory Cards Grid */}
      <div id="specs-cards-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSpecs.map((spec) => (
          <div
            id={`spec-card-${spec.id}`}
            key={spec.id}
            className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col group relative"
          >
            {/* Top background aesthetic aura */}
            <div className="h-24 bg-gradient-to-tr from-slate-50 to-orange-50/50 p-4 flex justify-between items-start">
              <span className="text-[10px] font-extrabold uppercase bg-white/70 backdrop-blur-xs text-orange-600 tracking-wider px-2.5 py-1 rounded-lg border border-orange-100/30">
                {spec.category}
              </span>
              <div className="flex items-center gap-1 bg-white/70 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-slate-100">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-bold text-slate-700">{spec.rating}</span>
                <span className="text-[9px] text-slate-400">({spec.reviewsCount})</span>
              </div>
            </div>

            {/* Face and Details */}
            <div className="px-6 pb-6 pt-0 flex-1 flex flex-col -mt-10">
              <div className="flex items-end gap-3 mb-3">
                <img
                  src={spec.photoUrl}
                  alt={spec.name}
                  className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-md bg-slate-100"
                  referrerPolicy="no-referrer"
                />
                <div className="pb-1">
                  <h4 className="font-extrabold text-slate-800 text-sm font-serif">{spec.name}</h4>
                  <p className="text-[11px] font-bold text-orange-500 leading-none">{spec.title}</p>
                </div>
              </div>

              <p className="text-[11.5px] text-slate-600 leading-relaxed mb-4 line-clamp-3">
                {spec.bio}
              </p>

              {/* Badges/Tags of Speciality */}
              <div className="flex flex-wrap gap-1 mb-4">
                {spec.specialties.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="bg-slate-50 text-slate-600 border border-slate-100 text-[9.5px] font-bold px-2 py-0.5 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Pricing, Experience, and Actions at bottom */}
              <div className="pt-3 border-t border-slate-100 mt-auto flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Experience</span>
                  <span className="font-black text-slate-700">{spec.experienceYears} Years Prof</span>
                </div>

                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Session Fee</span>
                  <span className="font-black text-rose-600 text-sm">₹{spec.sessionFee} <span className="text-[9px] text-slate-500 font-medium">/ hr</span></span>
                </div>
              </div>

              <button
                id={`btn-book-session-${spec.id}`}
                onClick={() => startBooking(spec)}
                type="button"
                className="w-full mt-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5" /> Book Consultation Slot
              </button>
            </div>
          </div>
        ))}

        {filteredSpecs.length === 0 && (
          <div className="col-span-full py-16 text-center space-y-3 bg-slate-50 rounded-3xl border border-slate-100">
            <Compass className="w-12 h-12 text-slate-300 mx-auto animate-pulse" />
            <div>
              <h4 className="font-bold text-slate-800 font-serif">No Specialists Found</h4>
              <p className="text-xs text-slate-400">Try broad, inclusive searches like "Tutor" or "Coach".</p>
            </div>
          </div>
        )}
      </div>

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
                !currentProfile?.subscriptionActive ? (
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

                    {/* Production Payment Summary showing split & commission transparency */}
                    <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-2xl text-[11px] space-y-1.5 font-medium text-slate-600">
                      <div className="flex justify-between">
                        <span>Consultation Standard Fee:</span>
                        <strong className="text-slate-800">₹{selectedSpecialist.sessionFee}.00</strong>
                      </div>
                      <div className="flex justify-between border-t border-orange-100/60 pt-1.5 text-xs text-slate-900">
                        <span className="font-extrabold flex items-center gap-1 text-orange-600">
                          <Sparkles className="w-3.5 h-3.5 text-orange-500" /> Payable via Razorpay secure gateway:
                        </span>
                        <strong className="font-black">₹{selectedSpecialist.sessionFee}.00</strong>
                      </div>
                    </div>

                    <button
                      onClick={handleTriggerRazorpayPayment}
                      type="button"
                      className="w-full py-3 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer select-none"
                    >
                      <CreditCard className="w-4 h-4" /> Secure Pay with UPI/Card (Razorpay)
                    </button>
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
                    <option value="Nutritionist">Child Nutritionist</option>
                    <option value="Tutor">Teacher / Tutor</option>
                    <option value="Makeup Artist">Child Makeup Artist</option>
                    <option value="Pediatrician">Pediatrician / Doctor</option>
                    <option value="Therapist">Therapist / Counselor</option>
                    <option value="Coach">Sports Coach</option>
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
                    { name: 'Pediatric Specialist', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400' },
                    { name: 'Clinical Nutritionist', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400' },
                    { name: 'Academy Language Coach', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400' }
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

    </div>
  );
}
