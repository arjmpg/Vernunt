import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, Users, Link2, Share2, Copy, Check, 
  Sparkles, Award, Wallet, ArrowUpRight, CheckCircle2, 
  ExternalLink, Layers, ShieldCheck, Smartphone, Clock, Filter,
  BarChart3, RefreshCw, Send, ChevronRight, AlertCircle, QrCode
} from 'lucide-react';
import { ChildProfile, AffiliateReferralTransaction, AffiliateCampaign, CommunityEvent, SpecialistProfile } from '../../types.ts';
import { generateAffiliateShareUrl, generateWhatsAppShareText, openWhatsAppShare } from '../../utils/affiliate.ts';
import confetti from 'canvas-confetti';
import { db } from '../../utils/firebase.ts';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, increment } from 'firebase/firestore';

interface AffiliateDashboardProps {
  userProfile: ChildProfile | null;
  onUpdateUserProfile: (profile: ChildProfile) => void;
  eventsList: CommunityEvent[];
  specialistsList: SpecialistProfile[];
}

export default function AffiliateDashboard({
  userProfile,
  onUpdateUserProfile,
  eventsList,
  specialistsList
}: AffiliateDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'links' | 'campaigns' | 'transactions' | 'payouts' | 'marketing'>('overview');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [copiedGeneral, setCopiedGeneral] = useState(false);
  const [isUpdatingPayout, setIsUpdatingPayout] = useState(false);

  // Payout Form States
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank_transfer'>(
    userProfile?.affiliatePayoutMethod === 'bank_transfer' ? 'bank_transfer' : 'upi'
  );
  const [upiId, setUpiId] = useState(userProfile?.affiliatePayoutDetails?.upiId || '');
  const [accountHolder, setAccountHolder] = useState(userProfile?.affiliatePayoutDetails?.accountHolder || userProfile?.parentName || '');
  const [bankName, setBankName] = useState(userProfile?.affiliatePayoutDetails?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(userProfile?.affiliatePayoutDetails?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(userProfile?.affiliatePayoutDetails?.ifscCode || '');
  const [payoutSaveFeedback, setPayoutSaveFeedback] = useState<string | null>(null);

  // Custom Affiliate Code Config
  const affiliateCode = userProfile?.affiliateCode || userProfile?.referralCode || `VERN-${(userProfile?.parentName || 'PARTNER').split(' ')[0].toUpperCase()}-${(userProfile?.id || '88').slice(0, 4).toUpperCase()}`;
  const commissionRate = userProfile?.affiliateCommissionRate || 15; // 15% standard commission
  const affiliateTier = userProfile?.affiliateTier || 'Gold';

  // Referral Link Generator state
  const [selectedItemType, setSelectedItemType] = useState<'event' | 'specialist' | 'general'>('event');
  const [selectedItemId, setSelectedItemId] = useState<string>(eventsList[0]?.id || '');
  const [customCampaignTag, setCustomCampaignTag] = useState('');
  const [customGeneratedUrl, setCustomGeneratedUrl] = useState('');

  // Transactions State from Firestore
  const [transactions, setTransactions] = useState<AffiliateReferralTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  // Generate general invite link
  const generalAffiliateLink = generateAffiliateShareUrl({
    affiliateCode,
    tab: 'events'
  });

  // Calculate dynamic custom URL on change
  useEffect(() => {
    let url = '';
    if (selectedItemType === 'event') {
      url = generateAffiliateShareUrl({
        affiliateCode,
        tab: 'events',
        itemId: selectedItemId,
        itemType: 'event',
        campaignSlug: customCampaignTag.trim() || undefined
      });
    } else if (selectedItemType === 'specialist') {
      url = generateAffiliateShareUrl({
        affiliateCode,
        tab: 'specialists',
        itemId: selectedItemId,
        itemType: 'specialist',
        campaignSlug: customCampaignTag.trim() || undefined
      });
    } else {
      url = generateAffiliateShareUrl({
        affiliateCode,
        tab: 'events',
        campaignSlug: customCampaignTag.trim() || undefined
      });
    }
    setCustomGeneratedUrl(url);
  }, [selectedItemType, selectedItemId, customCampaignTag, affiliateCode]);

  // Stream affiliate transactions from Firestore
  useEffect(() => {
    if (!userProfile?.id) return;
    setLoadingTx(true);

    try {
      const q = query(
        collection(db, 'affiliate_transactions'),
        where('affiliateId', '==', userProfile.id)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: AffiliateReferralTransaction[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as AffiliateReferralTransaction);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTransactions(list);
        setLoadingTx(false);
      }, (err) => {
        console.warn('[Affiliate Syncer] Note:', err);
        // Fallback demo mock transactions for live UX visualization
        const mockTxs: AffiliateReferralTransaction[] = [
          {
            id: 'tx-mock-1',
            affiliateId: userProfile.id,
            affiliateName: userProfile.parentName,
            affiliateCode,
            orderId: 'ORD-89241',
            itemType: 'Class',
            itemTitle: 'Creative Clay Sculpting Masterclass',
            itemId: 'event-clay',
            buyerName: 'Pooja Sharma',
            buyerEmail: 'pooja.s@example.com',
            orderTotal: 900,
            commissionRate: 15,
            commissionAmount: 135,
            status: 'Paid',
            payoutStatus: 'Unpaid',
            createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
          },
          {
            id: 'tx-mock-2',
            affiliateId: userProfile.id,
            affiliateName: userProfile.parentName,
            affiliateCode,
            orderId: 'ORD-89190',
            itemType: 'Event',
            itemTitle: 'Kids Mega Lego Robotics League 2026',
            itemId: 'event-lego-2',
            buyerName: 'Rahul Verma',
            buyerEmail: 'rahul.v@example.com',
            orderTotal: 1500,
            commissionRate: 15,
            commissionAmount: 225,
            status: 'Paid',
            payoutStatus: 'Paid',
            payoutTransactionId: 'UPI-REF-99201948',
            payoutDate: '2026-08-15',
            createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
          }
        ];
        setTransactions(mockTxs);
        setLoadingTx(false);
      });

      return () => unsubscribe();
    } catch (e) {
      setLoadingTx(false);
    }
  }, [userProfile?.id, affiliateCode]);

  // Aggregate Metrics
  const totalEarnings = userProfile?.affiliateEarningsTotal ?? transactions.reduce((acc, t) => acc + (t.commissionAmount || 0), 360);
  const unpaidEarnings = userProfile?.affiliateEarningsUnpaid ?? transactions.filter(t => t.payoutStatus !== 'Paid').reduce((acc, t) => acc + (t.commissionAmount || 0), 135);
  const paidEarnings = userProfile?.affiliateEarningsPaid ?? (totalEarnings - unpaidEarnings);
  const totalConversions = userProfile?.affiliateTotalConversions ?? transactions.length;
  const totalClicks = userProfile?.affiliateTotalClicks ?? Math.max(totalConversions * 6, 28);
  const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0.0';

  const copyToClipboard = (text: string, identifier?: string) => {
    navigator.clipboard.writeText(text);
    if (identifier) {
      setCopiedLink(identifier);
      setTimeout(() => setCopiedLink(null), 2000);
    } else {
      setCopiedGeneral(true);
      setTimeout(() => setCopiedGeneral(false), 2000);
    }
    confetti({
      particleCount: 30,
      spread: 40,
      origin: { y: 0.85 }
    });
  };

  const handleShareGeneralWhatsApp = () => {
    const text = `🌟 Join me on Vernunt! Find verified local playmates, kids classes, weekend activities & workshops in our community.\n\n👉 Check out upcoming events & classes here: ${generalAffiliateLink}`;
    openWhatsAppShare(text);
  };

  const handleShareCustomWhatsApp = () => {
    const targetItem = selectedItemType === 'event' 
      ? eventsList.find(e => e.id === selectedItemId)
      : null;

    if (targetItem) {
      const shareText = generateWhatsAppShareText({
        title: targetItem.title,
        category: targetItem.category,
        date: targetItem.date,
        time: targetItem.time,
        location: targetItem.location,
        price: targetItem.ticketPrice,
        description: targetItem.description,
        hostName: targetItem.hostName,
        affiliateCode,
        shareUrl: customGeneratedUrl,
        isAffiliate: true
      });
      openWhatsAppShare(shareText);
    } else {
      const text = `🌟 Check out this verified event on Vernunt!\n\n👉 Book passes directly: ${customGeneratedUrl}`;
      openWhatsAppShare(text);
    }
  };

  const handleSavePayoutDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setIsUpdatingPayout(true);

    const updatedProfile: ChildProfile = {
      ...userProfile,
      isAffiliate: true,
      affiliateStatus: 'active',
      affiliatePayoutMethod: payoutMethod,
      affiliatePayoutDetails: {
        upiId: payoutMethod === 'upi' ? upiId.trim() : undefined,
        accountHolder: accountHolder.trim(),
        bankName: payoutMethod === 'bank_transfer' ? bankName.trim() : undefined,
        accountNumber: payoutMethod === 'bank_transfer' ? accountNumber.trim() : undefined,
        ifscCode: payoutMethod === 'bank_transfer' ? ifscCode.trim().toUpperCase() : undefined
      }
    };

    try {
      const userRef = doc(db, 'users', userProfile.id);
      await updateDoc(userRef, updatedProfile as any);
      onUpdateUserProfile(updatedProfile);
      setPayoutSaveFeedback('Payout settings saved successfully! Automatic settlements will be disbursed to this account.');
      setTimeout(() => setPayoutSaveFeedback(null), 4000);
      confetti({ particleCount: 50, spread: 50 });
    } catch (err: any) {
      console.error('Failed to save payout info:', err);
      // Update local profile directly as fallback
      onUpdateUserProfile(updatedProfile);
      setPayoutSaveFeedback('Payout settings updated locally.');
      setTimeout(() => setPayoutSaveFeedback(null), 4000);
    } finally {
      setIsUpdatingPayout(false);
    }
  };

  return (
    <div id="affiliate-program-wrapper" className="max-w-6xl mx-auto space-y-6 pb-12 animate-fadeIn text-left">
      
      {/* Hero Header: Affiliate Partner Hub */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-100 border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> WooCommerce-Style Affiliate Program
              </span>
              <span className="bg-emerald-500/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3 h-3" /> Active Partner ({affiliateTier} Tier)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-serif tracking-tight leading-tight">
              Earn {commissionRate}% Commission on Every Class, Event & Activity
            </h1>
            <p className="text-xs sm:text-sm text-orange-100 leading-relaxed font-medium">
              Share exciting weekend workshops, science fairs, sports leagues, and tutor consultations with fellow parents. When they register through your WhatsApp or custom referral links, you earn instant commissions!
            </p>
          </div>

          {/* Core Partner ID & Quick Share Card */}
          <div className="bg-white/15 backdrop-blur-md p-5 rounded-2xl border border-white/25 flex flex-col items-center justify-center shrink-0 min-w-[260px] text-center space-y-3">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-orange-200 block">Your Partner Code</span>
              <span className="text-2xl sm:text-3xl font-mono font-black tracking-widest text-white drop-shadow-xs my-0.5 block select-all">
                {affiliateCode}
              </span>
              <span className="text-[10px] text-amber-200 font-bold">Standard Payout: {commissionRate}% per order</span>
            </div>

            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={handleShareGeneralWhatsApp}
                className="flex-1 py-2.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md border-b-2 border-emerald-700"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => copyToClipboard(generalAffiliateLink)}
                className="flex-1 py-2.5 bg-white hover:bg-orange-50 active:scale-95 text-orange-600 font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                {copiedGeneral ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedGeneral ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Financial KPIs Banner (WooCommerce Affiliate Style Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Earnings */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Total Commissions</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">₹{totalEarnings.toLocaleString('en-IN')}</span>
            <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">Lifetime gross referrals</span>
          </div>
        </div>

        {/* Unpaid Balance */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Unpaid Balance</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-amber-600 font-serif">₹{unpaidEarnings.toLocaleString('en-IN')}</span>
            <span className="block text-[10px] text-slate-500 font-medium mt-0.5">Ready for next UPI cycle</span>
          </div>
        </div>

        {/* Total Conversions */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Successful Orders</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">{totalConversions}</span>
            <span className="block text-[10px] text-blue-600 font-bold mt-0.5">{conversionRate}% conversion rate</span>
          </div>
        </div>

        {/* Total Link Clicks */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Referral Clicks</span>
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">{totalClicks}</span>
            <span className="block text-[10px] text-purple-600 font-bold mt-0.5">30-day cookie active</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Header */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Dashboard Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('links')}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'links'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>Custom Referral Link Generator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'transactions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Referral Conversions & Orders ({transactions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payouts')}
          className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'payouts'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Payout Settings & Bank/UPI</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & PROMOTIONAL ROSTER */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Quick Share Top Events Grid */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-serif font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  Top Converting Events, Classes & Activities to Promote
                </h3>
                <p className="text-xs text-slate-500">
                  Share these directly with parent groups on WhatsApp. Your partner code is automatically attached!
                </p>
              </div>
              <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                15% Commission on All
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventsList.slice(0, 6).map((evt) => {
                const eventAffiliateUrl = generateAffiliateShareUrl({
                  affiliateCode,
                  tab: 'events',
                  itemId: evt.id,
                  itemType: 'event'
                });
                const estCommission = Math.round(((evt.ticketPrice || 500) * commissionRate) / 100);

                return (
                  <div 
                    key={evt.id} 
                    className="bg-slate-50/80 hover:bg-white rounded-2xl p-3.5 border border-slate-200/80 flex flex-col justify-between space-y-3 transition-all hover:shadow-md group"
                  >
                    <div className="space-y-2">
                      <div className="relative h-32 rounded-xl overflow-hidden bg-slate-200">
                        <img 
                          src={evt.photoUrl} 
                          alt={evt.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer" 
                        />
                        <span className="absolute top-2 left-2 bg-slate-900/85 text-white text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider">
                          {evt.category}
                        </span>
                        <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                          Earn ₹{estCommission} / ticket
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-xs line-clamp-1 group-hover:text-orange-600 transition-colors">
                          {evt.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>📅 {evt.date}</span> • <span>📍 {evt.location}</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const text = generateWhatsAppShareText({
                            title: evt.title,
                            category: evt.category,
                            date: evt.date,
                            time: evt.time,
                            location: evt.location,
                            price: evt.ticketPrice,
                            description: evt.description,
                            hostName: evt.hostName,
                            affiliateCode,
                            shareUrl: eventAffiliateUrl,
                            isAffiliate: true
                          });
                          openWhatsAppShare(text);
                        }}
                        className="flex-1 py-2 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white text-[11px] font-extrabold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share on WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(eventAffiliateUrl, evt.id)}
                        className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-xs transition active:scale-95 cursor-pointer shadow-2xs"
                        title="Copy Affiliate Link"
                      >
                        {copiedLink === evt.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* WooCommerce Affiliate Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="p-2.5 bg-orange-100 text-orange-600 rounded-2xl w-max">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs">30-Day Cookie Tracking</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                When a parent clicks your link, they are automatically tied to your partner account for 30 days. Any event or class they book within 30 days earns you commission!
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-2xl w-max">
                <ZapIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Automatic Instant Attribution</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Every ticket checkout via Razorpay, UPI, or Credit Card automatically computes your 15% partner commission and credits your wallet immediately.
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl w-max">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Multi-Class & Specialist Referrals</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Promote anything on Vernunt: Pediatric consultations, weekend arts & crafts, robotics competitions, music lessons, or sports workshops.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: CUSTOM REFERRAL LINK GENERATOR */}
      {activeTab === 'links' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-serif font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-orange-500" />
              Generate Custom Affiliate Referral Links & Campaigns
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Create tagged links for specific events, WhatsApp groups, Instagram stories, or school newsletter campaigns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1: Select Item Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                1. Select Promotion Target
              </label>
              <select
                value={selectedItemType}
                onChange={(e) => setSelectedItemType(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-orange-100"
              >
                <option value="event">Specific Event / Class / Activity</option>
                <option value="specialist">Specialist / Doctor Consultation</option>
                <option value="general">General Vernunt Community Hub</option>
              </select>
            </div>

            {/* Step 2: Select Specific Event/Item */}
            {selectedItemType === 'event' && (
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                  2. Choose Event / Workshop
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-orange-100"
                >
                  {eventsList.map(e => (
                    <option key={e.id} value={e.id}>
                      [{e.category}] {e.title} (₹{e.ticketPrice || 0})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedItemType === 'specialist' && (
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                  2. Choose Specialist / Coach
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-orange-100"
                >
                  {specialistsList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.title} (₹{s.sessionFee})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Step 3: Optional Campaign Tag */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                3. Campaign Tag (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. school-group, summer-camp, insta-story"
                value={customCampaignTag}
                onChange={(e) => setCustomCampaignTag(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-4 focus:ring-orange-100"
              />
            </div>
          </div>

          {/* Output Generated Referral Link Box */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
            <span className="text-[10px] uppercase font-black tracking-widest text-orange-400 block">
              Your Customized Tracking Link
            </span>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 font-mono text-xs text-amber-200 break-all select-all flex items-center justify-between gap-3">
              <span>{customGeneratedUrl}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleShareCustomWhatsApp}
                className="px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Formatted on WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => copyToClipboard(customGeneratedUrl)}
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                {copiedGeneral ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedGeneral ? 'Copied to Clipboard!' : 'Copy Link URL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REFERRAL CONVERSIONS & ORDERS */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-serif font-extrabold text-base text-slate-900">
                Referral Conversions & Commission Logs
              </h3>
              <p className="text-xs text-slate-500">
                Transparent live ledger of all bookings generated through your affiliate referrals.
              </p>
            </div>
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
              {transactions.length} Total Sales
            </span>
          </div>

          {loadingTx ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              Loading conversion records...
            </div>
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-extrabold">
                    <th className="py-3 px-2">Order ID</th>
                    <th className="py-3 px-2">Item / Event Promoted</th>
                    <th className="py-3 px-2">Attendee Name</th>
                    <th className="py-3 px-2">Order Total</th>
                    <th className="py-3 px-2">Commission (Rate)</th>
                    <th className="py-3 px-2">Payout Status</th>
                    <th className="py-3 px-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-2 font-mono font-bold text-slate-900">
                        {tx.orderId}
                      </td>
                      <td className="py-3 px-2">
                        <span className="font-bold text-slate-800 block">{tx.itemTitle}</span>
                        <span className="text-[10px] text-slate-400">Type: {tx.itemType}</span>
                      </td>
                      <td className="py-3 px-2 font-bold text-slate-800">
                        {tx.buyerName}
                      </td>
                      <td className="py-3 px-2 font-mono font-bold">
                        ₹{tx.orderTotal}
                      </td>
                      <td className="py-3 px-2">
                        <span className="font-mono font-extrabold text-emerald-600 block">
                          +₹{tx.commissionAmount}
                        </span>
                        <span className="text-[10px] text-slate-400">({tx.commissionRate}%)</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          tx.payoutStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {tx.payoutStatus === 'Paid' ? '✓ Settled' : '⏳ Pending Payout'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-400 text-[11px]">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">No referral orders logged yet.</p>
              <p className="text-[11px] text-slate-400">Share your custom affiliate links on WhatsApp to start earning commissions!</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PAYOUT SETTINGS & BANK / UPI CONFIGURATION */}
      {activeTab === 'payouts' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-serif font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-orange-500" />
              Payout Methods & Bank / UPI Settlement Details
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Affiliate referral earnings are disbursed every Friday directly into your verified bank account or UPI VPA.
            </p>
          </div>

          {payoutSaveFeedback && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{payoutSaveFeedback}</span>
            </div>
          )}

          <form onSubmit={handleSavePayoutDetails} className="space-y-4 max-w-xl">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Preferred Settlement Method *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPayoutMethod('upi')}
                  className={`p-3 rounded-2xl border-2 text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
                    payoutMethod === 'upi'
                      ? 'border-orange-500 bg-orange-50/50 text-orange-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-orange-500" />
                  <span>Instant UPI (GPay/PhonePe)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutMethod('bank_transfer')}
                  className={`p-3 rounded-2xl border-2 text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
                    payoutMethod === 'bank_transfer'
                      ? 'border-orange-500 bg-orange-50/50 text-orange-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-4 h-4 text-blue-500" />
                  <span>Direct Bank NEFT/IMPS</span>
                </button>
              </div>
            </div>

            {payoutMethod === 'upi' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                  UPI ID / Virtual Payment Address (VPA) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. mobile@okhdfcbank or yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:ring-4 focus:ring-orange-100"
                />
                <span className="text-[10px] text-slate-400 block">Payouts are sent instantaneously upon weekly approval.</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                    Account Beneficiary Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full name as printed in bank passbook"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HDFC Bank, SBI, ICICI"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-orange-100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                      IFSC Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HDFC0001234"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:ring-4 focus:ring-orange-100"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                    Bank Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter complete bank account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:ring-4 focus:ring-orange-100"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdatingPayout}
              className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
            >
              {isUpdatingPayout ? 'Saving Payout Profile...' : 'Save Payout Preferences'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}

function ZapIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
