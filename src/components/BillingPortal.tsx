import React, { useState, useEffect } from 'react';
import { Sparkles, Check, CreditCard, ShieldCheck, Gift, Calendar, User, Zap, Hourglass } from 'lucide-react';
import { ChildProfile, SubscriptionPlan } from '../types.ts';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../utils/firebase.ts';
import confetti from 'canvas-confetti';

interface BillingPortalProps {
  userProfile: ChildProfile | null;
  onUpdateUserProfile: (updated: ChildProfile) => void;
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
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
};

export default function BillingPortal({ userProfile, onUpdateUserProfile }: BillingPortalProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const defaultPlans: SubscriptionPlan[] = [
    {
      id: 'monthly',
      title: 'Monthly Pass',
      price: 299,
      period: '1 Month',
      popular: false,
      saving: null,
      color: 'border-slate-200',
      durationDays: 30,
      description: 'Perfect for temporary stays or trying out the network.',
      capabilities: [
        'Unlimited companion playdate chats',
        '✨ **FREE** Bookings for non-paid classes',
        '🔐 **FREE** view of Professional Portfolios',
        '🥇 Bonus: **5** Decrypt Credits included'
      ]
    },
    {
      id: 'quarterly',
      title: 'Tri-Active Pass',
      price: 799,
      period: '3 Months',
      popular: true,
      saving: 'Save 10%',
      color: 'border-orange-200',
      durationDays: 90,
      description: 'Our most sought-after plan for early childhood growth friends.',
      capabilities: [
        'Unlimited companion playdate chats',
        '✨ **FREE** Bookings for non-paid classes',
        '🔐 **FREE** view of Professional Portfolios',
        '🥇 Bonus: **15** Decrypt Credits included'
      ]
    },
    {
      id: 'halfyearly',
      title: 'Semi-Annual Pass',
      price: 1399,
      period: '6 Months',
      popular: false,
      saving: 'Save 20%',
      color: 'border-amber-200',
      durationDays: 180,
      description: 'Sustain connection habits over a full development season.',
      capabilities: [
        'Unlimited companion playdate chats',
        '✨ **FREE** Bookings for non-paid classes',
        '🔐 **FREE** view of Professional Portfolios',
        '🥇 Bonus: **30** Decrypt Credits included'
      ]
    },
    {
      id: 'yearly',
      title: 'Full Golden Year Pass',
      price: 2499,
      period: '12 Months',
      popular: false,
      saving: 'Save 30%',
      color: 'border-yellow-300',
      durationDays: 365,
      description: 'Complete year-round coverage for optimal socialization paths.',
      capabilities: [
        'Unlimited companion playdate chats',
        '✨ **FREE** Bookings for non-paid classes',
        '🔐 **FREE** view of Professional Portfolios',
        '🥇 Bonus: **60** Decrypt Credits included'
      ]
    }
  ];

  const [plans, setPlans] = useState<SubscriptionPlan[]>(() => {
    const cached = localStorage.getItem('vernunt_sub_plans');
    return cached ? JSON.parse(cached) : defaultPlans;
  });

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      unsub = onSnapshot(doc(db, 'subscription_config', 'plans'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && Array.isArray(data.plans) && data.plans.length > 0) {
            setPlans(data.plans);
            localStorage.setItem('vernunt_sub_plans', JSON.stringify(data.plans));
          }
        }
      }, (err) => {
        console.warn('[Billing Plans Sync] Offline/fallback note:', err?.message || err);
      });
    } catch (e) {
      console.warn('[Billing Plans Sync] Init error:', e);
    }
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const handleSubscribe = async (plan: any) => {
    setLoadingPlan(plan.id);
    setErrorMessage(null);

    try {
      // 1. If Plan is Free (₹0 or promotional zero-cost set by admin), activate instantly without Razorpay
      if (!plan.price || Number(plan.price) <= 0) {
        const today = new Date();
        const expiryDate = new Date(today);
        expiryDate.setDate(today.getDate() + (plan.durationDays || 30));

        const bonusCredits = Math.max(1, Math.round(((plan.durationDays || 30) / 30) * 5));

        const baseProfile: ChildProfile = userProfile ? { ...userProfile } : {
          id: auth.currentUser?.uid || 'user-parent-me',
          parentName: auth.currentUser?.displayName || 'Parent Member',
          childName: 'My Child',
          childAge: 5,
          interests: ['Outdoor Play', 'Art & Crafts', 'Social Games'],
          playStyle: 'Social & Active',
          gradeLevel: 'Kindergarten',
          location: 'Bangalore, India',
          photoUrl: auth.currentUser?.photoURL || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
          aadhaarVerified: true,
          verificationStatus: 'verified',
          email: auth.currentUser?.email || 'parent@vernunt.com',
          phoneNumber: '+91 98765 43210'
        };

        const updatedProfile: ChildProfile = {
          ...baseProfile,
          subscriptionActive: true,
          subscriptionPlan: plan.id as any,
          subscriptionExpiryDate: expiryDate.toISOString().split('T')[0],
          contactViewCredits: (baseProfile.contactViewCredits || 0) + bonusCredits,
        };

        // Persist locally in React state
        onUpdateUserProfile(updatedProfile);
        try {
          localStorage.setItem('vernunt_user_profile', JSON.stringify(updatedProfile));
        } catch (e) {
          console.warn("Storage note:", e);
        }

        // Persist in Firestore
        if (auth.currentUser) {
          try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await setDoc(userRef, updatedProfile, { merge: true });
          } catch (dbErr) {
            console.warn("Firestore user sync note:", dbErr);
          }
        }

        // Fire celebration confetti!
        confetti({
          particleCount: 150,
          spread: 80,
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899']
        });

        alert(`🎉 Free Subscription Activated!\n\nWelcome to Kids Connect Club.\nYour ${plan.title} (${plan.period}) is now ACTIVE until ${expiryDate.toLocaleDateString('en-IN')}.\n\n✓ You can now send connect requests to parents\n✓ You have ${updatedProfile.contactViewCredits} decrypt credits\n✓ Access all community events and specialist portfolios!`);
        return;
      }

      if (!userProfile) {
        alert("Please sign in or complete registration first before purchasing.");
        return;
      }

      // 2. Paid Plan (price > 0): Create Razorpay order on our server backend
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

      // 3. Load the Razorpay Checkout JavaScript library
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay checkout script. Check Web connection.");
      }

      // 4. Mount Razorpay Modal options
      const options = {
        key: orderData.keyId || "rzp_test_simulated_key_123456",
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Vernunt Playdate Connect",
        description: `Premium ${plan.title} (${plan.period}) for ${userProfile.childName || "Kid"}`,
        image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=128&auto=format&fit=crop&q=80",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // Trigger verify backend security signatures
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
              // Successfully verified payment! Celebrate and update profile state
              const today = new Date();
              const expiryDate = new Date(today);
              expiryDate.setDate(today.getDate() + (plan.durationDays || 30));

              const bonusCredits = Math.max(1, Math.round(((plan.durationDays || 30) / 30) * 5));

              const updatedProfile: ChildProfile = {
                ...userProfile,
                subscriptionActive: true,
                subscriptionPlan: plan.id as any,
                subscriptionExpiryDate: expiryDate.toISOString().split('T')[0],
                // reward with bonus contact credits as a subscription thank you
                contactViewCredits: (userProfile.contactViewCredits || 0) + bonusCredits,
              };

              // Persist locally in React states
              onUpdateUserProfile(updatedProfile);

              // Persist robustly in FireStore db
              if (auth.currentUser) {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                await setDoc(userRef, updatedProfile, { merge: true });
              }

              // Fire celebration confetti!
              confetti({
                particleCount: 150,
                spread: 80,
                colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899']
              });

              alert(`🎉 Subscription Activated! Welcome to VIP Kids Connect Club.\nYour plan is active until ${expiryDate.toLocaleDateString('en-IN')}.\nEnjoy free events booking, free basic consulting, and bonus credits!`);
            } else {
              alert(`⚠️ Payment Validation Failed: ${verifyResult.error || 'Signature rejected'}`);
            }
          } catch (verifyErr: any) {
            console.error("Signature verification failed:", verifyErr);
            alert("Payment completed but local profile validation failed. Please check with support.");
          }
        },
        prefill: {
          name: userProfile?.parentName || "",
          email: userProfile?.email || "parent@vernunt.com",
          contact: userProfile?.phoneNumber || ""
        },
        theme: {
          color: "#f59e0b" // beautiful amber standard theme
        },
        modal: {
          ondismiss: function () {
            console.log("Razorpay Checkout payment dismissed by user.");
            setLoadingPlan(null);
          }
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.open();
    } catch (err: any) {
      console.error("Subscription workflow failed:", err);
      setErrorMessage(err.message || "An unexpected error occurred during subscription activation.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const remainingDays = () => {
    if (!userProfile?.subscriptionExpiryDate) return 0;
    const expiry = new Date(userProfile.subscriptionExpiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  return (
    <div id="billing-payment-portal" className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
      
      {/* Intro Banner */}
      <div id="billing-header-banner" className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden border border-amber-500/20 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 left-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <span className="bg-amber-500 text-slate-950 text-[10px] uppercase font-black px-3 py-1 rounded-full tracking-widest inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-slate-950" /> Vernunt Premium Club
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight">Kids Playdate Connect Pass</h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Unlock absolute playtime integration! Get access to secure companion list matching, premium chat badges, unlock hidden profiles, consult specialists, and join neighborhood classes for free.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 w-full md:w-auto min-w-[240px]">
            <p className="text-[10px] uppercase font-black text-amber-400 tracking-wider">Current Membership Mode</p>
            {userProfile?.subscriptionActive && remainingDays() > 0 ? (
              <div className="mt-1.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-serif font-black text-amber-200">👑 ACTIVE VIP</span>
                  <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase">
                    {userProfile.subscriptionPlan}
                  </span>
                </div>
                <div className="text-xs text-slate-350 space-y-0.5 font-mono">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Expires: {userProfile.subscriptionExpiryDate}</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-amber-200">
                    <Hourglass className="w-3.5 h-3.5" />
                    <span>{remainingDays()} Days remaining</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-1.5 space-y-1">
                <span className="text-lg font-serif font-bold text-slate-300 italic">No Active Subscription</span>
                <p className="text-[10px] text-slate-400">Join the VIP club to unlock unlimited early childhood play connections.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2">
          <span>⚠️ {errorMessage}</span>
        </div>
      )}

      {/* Grid: 4 Pricing Packages */}
      <div className="space-y-4">
        <div className="text-center md:text-left">
          <h2 className="text-xl font-serif font-black text-slate-900 tracking-tight">Select Premium Playdate Plan</h2>
          <p className="text-xs text-slate-500 mt-1">Payments are hosted securely with Razorpay India API. Major cards, UPI, and netbanking accepted.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isActivePlan = userProfile?.subscriptionActive && userProfile?.subscriptionPlan === plan.id && remainingDays() > 0;
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl p-6 border-2 relative flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-lg ${
                  plan.popular ? 'ring-2 ring-orange-500 border-orange-500/20' : (plan.color || 'border-slate-200')
                } ${isActivePlan ? 'bg-amber-50/20 border-amber-400' : ''}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white text-[9px] uppercase font-black px-3.5 py-1 rounded-full tracking-widest shadow-sm">
                    Most Popular
                  </span>
                )}
                {plan.saving && (
                  <span className="absolute top-4 right-4 bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-lg uppercase">
                    {plan.saving}
                  </span>
                )}

                <div>
                  <h3 className="text-sm font-black text-slate-800 font-mono tracking-wide uppercase">{plan.title}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-black font-serif text-slate-900">₹{plan.price}</span>
                    <span className="text-xs text-slate-500 ml-1">/ {plan.period}</span>
                  </div>
                  {plan.durationDays >= 30 ? (
                    <p className="text-[10px] text-slate-400 mt-1">Equivalent to ₹{Math.round(plan.price / (plan.durationDays / 30))}/month</p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1">₹{Math.round(plan.price / (plan.durationDays || 1))}/day flexible pass</p>
                  )}
                  {plan.description && (
                    <p className="text-[10.5px] text-slate-500 italic mt-2 bg-slate-50/65 p-2 rounded-xl leading-relaxed border border-slate-100/50">{plan.description}</p>
                  )}

                  <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-5 text-left">
                    {Array.isArray(plan.capabilities) ? (
                      plan.capabilities.map((cap: string, cIdx: number) => (
                        <div key={cIdx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span className="text-[11px] text-slate-650 font-medium">{cap}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span className="text-[11px] text-slate-650 font-medium">Unlimited companion playdate chats</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span className="text-[11px] text-slate-650 font-medium">✨ **FREE** Bookings for non-paid classes</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span className="text-[11px] text-slate-650 font-medium">🔐 **FREE** view of Professional Portfolios</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span className="text-[11px] text-slate-650 font-medium">🥇 Bonus: **{ Math.max(1, Math.round(((plan.durationDays || 30) / 30) * 5)) }** Decrypt Credits included</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  {isActivePlan ? (
                    <div className="w-full py-2.5 bg-emerald-100/70 border border-emerald-300 text-emerald-800 text-xs font-black rounded-2xl text-center select-none flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Active Plan
                    </div>
                  ) : Number(plan.price) <= 0 ? (
                    <button
                      id={`pay-btn-${plan.id}`}
                      onClick={() => handleSubscribe(plan)}
                      disabled={loadingPlan !== null}
                      className="w-full py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                    >
                      {loadingPlan === plan.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Activating...
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 fill-current text-amber-200" />
                          ⚡ Claim Free Plan (₹0)
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      id={`pay-btn-${plan.id}`}
                      onClick={() => handleSubscribe(plan)}
                      disabled={loadingPlan !== null}
                      className={`w-full py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        plan.popular 
                          ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-500/10' 
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      } disabled:opacity-50`}
                    >
                      {loadingPlan === plan.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3.5 h-3.5" />
                          Subscribe {plan.period}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subscription Privilege Guidelines Rule 2 & 3 */}
      <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200">
        <h3 className="text-sm font-black text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Vernunt Premium Playdate Policy Connect
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 text-xs text-slate-600 leading-relaxed text-left">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
            <span className="text-[10px] font-black uppercase text-amber-600 font-mono">🌟 Rule #1: neighborhood Events & Classes</span>
            <p className="leading-relaxed">
              Your overall subscription allows you to book **all free community play events and kids development classes** without paying extra! If the event host organizes a specific **paid event/class/activity**, you can still easily join by paying that host's ticket fee directly via Razorpay at check-in.
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
            <span className="text-[10px] font-black uppercase text-amber-600 font-mono">🎨 Rule #2: Specialist Consultations & Portfolios</span>
            <p className="leading-relaxed">
              Active Kids Connect Club subscribers enjoy **unlimited, completely free access to search and view early childhood specialists' profiles, portfolios, and skills catalogs**. If you book a custom **paid, private expert consultation**, you pay their session consultation fee safely and separately.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
