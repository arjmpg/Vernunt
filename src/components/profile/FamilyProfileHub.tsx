import React, { useState } from 'react';
import { 
  User, ShieldCheck, ShieldAlert, Award, Sparkles, Heart, 
  MapPin, Phone, Mail, Edit3, Plus, Calendar, ShoppingBag, 
  Lock, MessageSquare, AlertCircle, LogOut, CheckCircle2, 
  ChevronRight, ExternalLink, Gift, Wallet, HelpCircle, FileText
} from 'lucide-react';
import type { ChildProfile, Booking } from '../../types.ts';

export interface FamilyProfileHubProps {
  userProfile: ChildProfile;
  connectedPlaymates: ChildProfile[];
  bookingsList: Booking[];
  walletBalance: number;
  onEditProfile: () => void;
  onOpenAadhaarVerification: () => void;
  onOpenWallet: () => void;
  onOpenVIPBilling: () => void;
  onOpenReferrals: () => void;
  onOpenChatWithPlaymate: (playmate: ChildProfile) => void;
  onNavigateToTab: (tabId: string) => void;
  onOpenSupport: () => void;
  onSignOut: () => void;
}

export const FamilyProfileHub: React.FC<FamilyProfileHubProps> = ({
  userProfile,
  connectedPlaymates,
  bookingsList,
  walletBalance,
  onEditProfile,
  onOpenAadhaarVerification,
  onOpenWallet,
  onOpenVIPBilling,
  onOpenReferrals,
  onOpenChatWithPlaymate,
  onNavigateToTab,
  onOpenSupport,
  onSignOut
}) => {
  const [activeSubSection, setActiveSubSection] = useState<'overview' | 'safety' | 'activity'>('overview');
  const isAadhaarVerified = userProfile.verificationStatus === 'VERIFIED';

  return (
    <div id="family-profile-hub" className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in pb-16">
      
      {/* 1. Parent Profile Header Card (Pure White Minimal) */}
      <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={userProfile.parentPhotoUrl || userProfile.photoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80'}
                alt={userProfile.parentName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-2xs"
              />
              <span 
                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                  isAadhaarVerified ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                title={isAadhaarVerified ? 'Aadhaar Verified' : 'Pending Verification'}
              >
                {isAadhaarVerified ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-white" />
                )}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {userProfile.parentName || 'Parent'}
                </h1>
                {isAadhaarVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Parent
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenAadhaarVerification}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
                  >
                    <ShieldAlert className="w-3 h-3" />
                    Verify Aadhaar
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{userProfile.neighbourhood || userProfile.location?.address || 'Bengaluru, India'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={onEditProfile}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
              <span>Edit Profile</span>
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Family Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-slate-100">
          <div 
            onClick={() => setActiveSubSection('activity')}
            className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 transition cursor-pointer"
          >
            <span className="block text-lg font-black text-indigo-600">{connectedPlaymates.length}</span>
            <span className="text-[11px] font-semibold text-slate-600">Play Connections</span>
          </div>

          <div 
            onClick={() => setActiveSubSection('activity')}
            className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-amber-300 transition cursor-pointer"
          >
            <span className="block text-lg font-black text-amber-600">{bookingsList.length}</span>
            <span className="text-[11px] font-semibold text-slate-600">Event Passes</span>
          </div>

          <div 
            onClick={onOpenWallet}
            className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition cursor-pointer"
          >
            <span className="block text-lg font-black text-emerald-600">₹{walletBalance}</span>
            <span className="text-[11px] font-semibold text-slate-600">In-App Wallet</span>
          </div>

          <div 
            onClick={onOpenVIPBilling}
            className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-purple-300 transition cursor-pointer"
          >
            <span className="block text-lg font-black text-purple-600">VIP Club</span>
            <span className="text-[11px] font-semibold text-slate-600">Free Proximity</span>
          </div>
        </div>
      </section>

      {/* Navigation Tabs inside Profile */}
      <div className="flex items-center gap-2 border-b border-slate-200/90 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubSection('overview')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeSubSection === 'overview'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Child Profiles &amp; Family
        </button>
        <button
          type="button"
          onClick={() => setActiveSubSection('safety')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeSubSection === 'safety'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Safety Vault &amp; Records
        </button>
        <button
          type="button"
          onClick={() => setActiveSubSection('activity')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeSubSection === 'activity'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          My Bookings &amp; Connections
        </button>
      </div>

      {/* SECTION A: Child Profiles & Family Management */}
      {activeSubSection === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Registered Child Profile
              </h2>
              <button
                type="button"
                onClick={onEditProfile}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Edit Child Details
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <img
                src={userProfile.photoUrl || 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=160&q=80'}
                alt={userProfile.childName}
                className="w-16 h-16 rounded-xl object-cover border border-slate-200"
              />
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {userProfile.childName}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    {userProfile.childAge} years old · {userProfile.childGender || 'Child'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {userProfile.bio || 'Active toddler who loves outdoor playground sessions, Lego building and sports.'}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(userProfile.interests || ['Playground', 'Art', 'Sports']).map((interest, idx) => (
                    <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Perks & VIP Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm text-slate-900">Kids Connect VIP Club</h3>
              </div>
              <p className="text-xs text-slate-500">
                Priority proximity radar matching, verified trust badges, and exclusive invites.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenVIPBilling}
              className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer shrink-0"
            >
              View VIP Perks
            </button>
          </div>
        </div>
      )}

      {/* SECTION B: Safety Vault & Records */}
      {activeSubSection === 'safety' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                Encrypted Emergency &amp; Health Vault
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Only shared with approved parents during scheduled playdates and emergencies.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Aadhaar Trust Status</span>
                <p className="text-sm font-extrabold text-slate-800">
                  {isAadhaarVerified ? 'Zero-Knowledge Aadhaar Verified 🛡️' : 'Pending Verification'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Secured with DigiLocker authentication
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Allergy &amp; Dietary Notes</span>
                <p className="text-sm font-bold text-slate-800">
                  No known severe allergies reported
                </p>
                <p className="text-[11px] text-slate-500">
                  Can be updated in child profile settings
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Location Privacy</span>
                <p className="text-sm font-bold text-slate-800">
                  Approximate Neighborhood Radius (Fuzzed)
                </p>
                <p className="text-[11px] text-slate-500">
                  Exact house coordinates are never exposed
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Emergency Contact</span>
                <p className="text-sm font-bold text-slate-800">
                  Parent Verified Phone Active
                </p>
                <p className="text-[11px] text-slate-500">
                  Ready for instant SOS broadcasts
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION C: My Activity & Bookings */}
      {activeSubSection === 'activity' && (
        <div className="space-y-4">
          
          {/* Connected Playmates */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Connected Play Partners ({connectedPlaymates.length})
              </h2>
              <button
                type="button"
                onClick={() => onNavigateToTab('radar')}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Find More Playmates
              </button>
            </div>

            {connectedPlaymates.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">
                No connected playmates yet. Explore nearby verified kids on the Playtime tab!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {connectedPlaymates.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={p.photoUrl} alt={p.childName} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{p.childName} ({p.childAge}y)</h4>
                        <p className="text-[10px] text-slate-500">{p.parentName}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenChatWithPlaymate(p)}
                      className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Event Passes */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                My Booked Events &amp; Passes ({bookingsList.length})
              </h2>
              <button
                type="button"
                onClick={() => onNavigateToTab('events')}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Browse Weekend Events
              </button>
            </div>

            {bookingsList.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">
                No active event passes booked. Discover creative workshops and science camps in the Events tab.
              </p>
            ) : (
              <div className="space-y-2">
                {bookingsList.map((b) => (
                  <div key={b.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{b.specialistName || 'Family Event Pass'}</h4>
                      <p className="text-[10px] text-slate-500">{b.date} · {b.timeSlot || 'Confirmed'}</p>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      Confirmed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Footer Support & Policy Actions */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-4 px-2">
        <button
          type="button"
          onClick={onOpenSupport}
          className="hover:underline flex items-center gap-1 cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Help &amp; Support</span>
        </button>
        <button
          type="button"
          onClick={onOpenReferrals}
          className="hover:underline flex items-center gap-1 text-purple-700 font-bold cursor-pointer"
        >
          <Gift className="w-3.5 h-3.5" />
          <span>Refer &amp; Earn Rewards</span>
        </button>
      </div>

    </div>
  );
};

export default FamilyProfileHub;
