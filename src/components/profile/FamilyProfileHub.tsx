import React, { useState, useEffect, useRef } from 'react';
import { 
  User, ShieldCheck, ShieldAlert, Award, Sparkles, Heart, 
  MapPin, Phone, Mail, Edit3, Plus, Calendar, ShoppingBag, 
  Lock, MessageSquare, AlertCircle, LogOut, CheckCircle2, 
  ChevronRight, ExternalLink, Gift, Wallet, HelpCircle, FileText,
  CreditCard, KeyRound, Eye, EyeOff, Shield
} from 'lucide-react';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../utils/firebase.ts';
import type { ChildProfile, Booking } from '../../types.ts';
import { PaymentHistorySection } from './PaymentHistorySection.tsx';

export interface FamilyProfileHubProps {
  userProfile: ChildProfile;
  isAdmin?: boolean;
  isGuest?: boolean;
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
  onOpenSignIn?: () => void;
  onPasswordChanged?: (updatedAt: string) => void;
  onSignOut: () => void;
}

export const FamilyProfileHub: React.FC<FamilyProfileHubProps> = ({
  userProfile,
  isAdmin = false,
  isGuest = false,
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
  onOpenSignIn,
  onPasswordChanged,
  onSignOut
}) => {
  const [activeSubSection, setActiveSubSection] = useState<'overview' | 'safety' | 'activity' | 'payments'>('overview');
  const isAadhaarVerified = userProfile.verificationStatus === 'VERIFIED';

  // Change / Set Password State (for Admin & All Users)
  const passwordSectionRef = useRef<HTMLDivElement | null>(null);
  const [hasExistingPassword, setHasExistingPassword] = useState<boolean>(false);
  const [passwordLastUpdatedAt, setPasswordLastUpdatedAt] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<string>('');

  const isGuestAccount = isGuest || userProfile.id === 'guest-explorer';

  useEffect(() => {
    if (isGuestAccount) return;
    const params = new URLSearchParams();
    if (userProfile.id) params.set('userId', userProfile.id);
    if (userProfile.email) params.set('email', userProfile.email);
    if (userProfile.phoneNumber) params.set('phone', userProfile.phoneNumber);

    fetch(`/api/users/password-status?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setHasExistingPassword(Boolean(data.hasPassword));
          setPasswordLastUpdatedAt(data.updatedAt || null);
        }
      })
      .catch(() => {
        // Non-blocking status lookup
      });
  }, [isGuestAccount, userProfile.id, userProfile.email, userProfile.phoneNumber]);

  const handleJumpToPassword = () => {
    setActiveSubSection('safety');
    setTimeout(() => {
      passwordSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  const getPasswordStrength = (pw: string): { label: string; color: string; width: string } => {
    if (!pw) return { label: '', color: 'bg-slate-200', width: 'w-0' };
    let score = 0;
    if (pw.length >= 6) score += 1;
    if (pw.length >= 10) score += 1;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
    if (/\d/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;
    if (score <= 2) return { label: 'Weak', color: 'bg-rose-500', width: 'w-1/3' };
    if (score === 3) return { label: 'Good', color: 'bg-amber-500', width: 'w-2/3' };
    return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (isGuestAccount) {
      setPasswordError('Please sign in first to set or change your account password.');
      return;
    }
    if (hasExistingPassword && !currentPassword.trim()) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.trim().length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }
    if (hasExistingPassword && currentPassword === newPassword) {
      setPasswordError('New password must be different from your current password.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const resp = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.id,
          email: userProfile.email,
          phoneNumber: userProfile.phoneNumber,
          currentPassword: hasExistingPassword ? currentPassword : undefined,
          newPassword
        })
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data?.success) {
        setPasswordError(data?.error || 'Could not update password. Please check your details and try again.');
        return;
      }

      // If signed into Firebase Auth via Email/Password provider, mirror update cleanly (non-blocking)
      try {
        const fbUser = auth.currentUser;
        const hasPasswordProvider = fbUser?.providerData?.some((p) => p.providerId === 'password');
        if (fbUser && hasPasswordProvider) {
          await updatePassword(fbUser, newPassword);
        }
      } catch (fbErr) {
        console.debug('Firebase Auth password sync note:', fbErr);
      }

      setHasExistingPassword(true);
      setPasswordLastUpdatedAt(data.updatedAt || new Date().toISOString());
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(data.message || 'Password updated successfully.');
      onPasswordChanged?.(data.updatedAt || new Date().toISOString());
    } catch (err: any) {
      setPasswordError(err?.message || 'Network error updating password. Please try again.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

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

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
            {isAdmin && (
              <button
                type="button"
                id="profile-btn-open-admin"
                onClick={() => onNavigateToTab('admin')}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <Shield className="w-3.5 h-3.5 text-amber-300" />
                <span>Admin Dashboard</span>
              </button>
            )}
            <button
              type="button"
              id="profile-btn-change-password"
              onClick={handleJumpToPassword}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>{hasExistingPassword ? 'Change Password' : 'Set Password'}</span>
            </button>
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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-5 mt-5 border-t border-slate-100">
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

          <div 
            onClick={() => setActiveSubSection('payments')}
            className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-rose-300 transition cursor-pointer col-span-2 sm:col-span-1"
          >
            <span className="block text-lg font-black text-rose-600 flex items-center gap-1">
              <CreditCard className="w-4 h-4 text-rose-500" />
              <span>History</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-600">Order &amp; Payments</span>
          </div>
        </div>
      </section>

      {/* Navigation Tabs inside Profile */}
      <div className="flex items-center gap-2 border-b border-slate-200/90 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubSection('overview')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
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
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeSubSection === 'safety'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Security &amp; Password</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubSection('activity')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeSubSection === 'activity'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          My Bookings &amp; Connections
        </button>
        <button
          type="button"
          onClick={() => setActiveSubSection('payments')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeSubSection === 'payments'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payment History</span>
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

          {/* Account Password Management Card (Admin & All Users) */}
          <div
            ref={passwordSectionRef}
            id="profile-change-password-card"
            className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    {hasExistingPassword ? 'Change Account Password' : 'Set Account Password'}
                  </h2>
                  {isAdmin && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-200">
                      Admin Account
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {hasExistingPassword
                    ? 'Update the password used to sign in with your email or mobile number.'
                    : 'Create a password for your account so you can sign in anytime using Password or OTP.'}
                </p>
              </div>
              {passwordLastUpdatedAt && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  Updated {new Date(passwordLastUpdatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>

            {isGuestAccount ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs font-medium text-amber-900">
                  You are browsing as a guest. Sign in to your Vernunt account to set or change your password.
                </p>
                {onOpenSignIn && (
                  <button
                    type="button"
                    onClick={onOpenSignIn}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer shrink-0"
                  >
                    Sign In
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handlePasswordChangeSubmit} className="space-y-3.5 max-w-lg">
                <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 flex flex-wrap gap-x-4 gap-y-1">
                  {userProfile.email && (
                    <span>Email: <strong className="text-slate-800 font-mono">{userProfile.email}</strong></span>
                  )}
                  {userProfile.phoneNumber && (
                    <span>Phone: <strong className="text-slate-800 font-mono">{userProfile.phoneNumber}</strong></span>
                  )}
                </div>

                {hasExistingPassword && (
                  <div className="space-y-1">
                    <label htmlFor="input-current-password" className="block text-xs font-bold text-slate-700">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        id="input-current-password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        autoComplete="current-password"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs sm:text-sm text-slate-900 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title={showCurrentPassword ? 'Hide password' : 'Show password'}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="input-new-password" className="block text-xs font-bold text-slate-700">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="input-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs sm:text-sm text-slate-900 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full transition-all duration-200 ${passwordStrength.color} ${passwordStrength.width}`} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600">{passwordStrength.label}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="input-confirm-password" className="block text-xs font-bold text-slate-700">
                    Confirm New Password
                  </label>
                  <input
                    id="input-confirm-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs sm:text-sm text-slate-900 transition"
                  />
                </div>

                {passwordError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="submit"
                    id="btn-submit-change-password"
                    disabled={isUpdatingPassword}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs sm:text-sm font-bold transition cursor-pointer shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      {isUpdatingPassword
                        ? 'Updating Password...'
                        : hasExistingPassword
                          ? 'Update Password'
                          : 'Save New Password'}
                    </span>
                  </button>
                </div>
              </form>
            )}
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

      {/* SECTION D: Payment History & Verified Orders */}
      {activeSubSection === 'payments' && (
        <PaymentHistorySection
          userProfile={userProfile}
          onNavigateToStore={() => onNavigateToTab('store')}
        />
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
