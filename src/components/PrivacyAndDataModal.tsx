import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Lock, Download, Trash2, AlertTriangle, Eye, EyeOff,
  UserX, MapPin, Mail, Cookie, RefreshCw, CheckCircle2, X, FileText,
  Sliders, UserCheck, HeartHandshake, ShieldAlert
} from 'lucide-react';
import { ChildProfile, ChildProfileVisibility } from '../types.ts';

interface PrivacyAndDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: ChildProfile | null;
  onUpdateProfile?: (updated: Partial<ChildProfile>) => void;
  onAccountDeleted?: () => void;
}

export const PrivacyAndDataModal: React.FC<PrivacyAndDataModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  onAccountDeleted
}) => {
  const [activeTab, setActiveTab] = useState<'privacy_controls' | 'data_rights' | 'email_prefs'>('privacy_controls');
  const [visibility, setVisibility] = useState<ChildProfileVisibility>(userProfile?.profileVisibility || 'PRIVATE');
  const [locationSharing, setLocationSharing] = useState<string>(userProfile?.locationSharing || 'APPROXIMATE');
  const [neighbourhood, setNeighbourhood] = useState<string>(userProfile?.neighbourhood || 'Indiranagar / Koramangala');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isDeletingChild, setIsDeletingChild] = useState(false);
  const [childDeletedSuccess, setChildDeletedSuccess] = useState(false);
  const [isSubmittingErasure, setIsSubmittingErasure] = useState(false);
  const [erasureSuccess, setErasureSuccess] = useState(false);
  const [erasureRefId, setErasureRefId] = useState<string | null>(null);
  const [showAccountDeleteConfirm, setShowAccountDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Email Preferences
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [eventAlerts, setEventAlerts] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);
  const [emailSavedNotice, setEmailSavedNotice] = useState(false);

  useEffect(() => {
    if (userProfile?.profileVisibility) {
      setVisibility(userProfile.profileVisibility);
    }
  }, [userProfile]);

  if (!isOpen) return null;

  // Handle Visibility and Location Save
  const handleSavePrivacySettings = () => {
    if (onUpdateProfile) {
      onUpdateProfile({
        profileVisibility: visibility,
        locationSharing: locationSharing as any,
        neighbourhood
      });
    }

    // Save record to backend
    fetch('/api/privacy/record-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userProfile?.id || 'guest',
        childProfileId: userProfile?.id,
        consentType: 'GUARDIAN_AUTHORITY',
        policyVersion: '2.4.0',
        status: visibility === 'PRIVATE' ? 'RESTRICTED' : 'GRANTED'
      })
    }).catch(() => {});

    alert('✓ Child privacy and location settings saved successfully.');
  };

  // Real Data Download API Call
  const handleDownloadMyData = async () => {
    setIsDownloading(true);
    setDownloadSuccess(false);
    try {
      const res = await fetch('/api/privacy/download-my-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile?.id || 'guest',
          userEmail: userProfile?.email || 'parent@vernunt.com',
          userProfile
        })
      });

      if (!res.ok) throw new Error('Data download failed');

      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vernunt-privacy-data-${userProfile?.id || 'export'}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
    } catch (e: any) {
      alert('Error downloading data: ' + e.message);
    } finally {
      setIsDownloading(false);
    }
  };

  // Real Child Profile Deletion API Call
  const handleDeleteChildProfile = async () => {
    if (!confirm(`Are you sure you want to permanently delete the profile for ${userProfile?.childName || 'this child'}? All playmate matches and private photos will be deleted.`)) {
      return;
    }

    setIsDeletingChild(true);
    try {
      const res = await fetch('/api/privacy/delete-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile?.id,
          childId: userProfile?.id,
          childName: userProfile?.childName
        })
      });

      const data = await res.json();
      if (data.success) {
        setChildDeletedSuccess(true);
        if (onUpdateProfile) {
          onUpdateProfile({
            childName: '',
            childAge: 0,
            photoUrl: '',
            profileVisibility: 'PRIVATE'
          });
        }
      }
    } catch (e: any) {
      alert('Error deleting child profile: ' + e.message);
    } finally {
      setIsDeletingChild(false);
    }
  };

  // Real Formal Erasure Request (DPDP 2023)
  const handleRequestDataDeletion = async () => {
    setIsSubmittingErasure(true);
    try {
      const res = await fetch('/api/privacy/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile?.id || 'unknown',
          userEmail: userProfile?.email || 'parent@vernunt.com',
          requestType: 'ACCOUNT_DELETION',
          notes: 'User requested complete data deletion under Section 12 of the DPDP Act 2023.'
        })
      });

      const data = await res.json();
      if (data.success) {
        setErasureSuccess(true);
        setErasureRefId(data.request.id);
      }
    } catch (e: any) {
      alert('Error submitting deletion request: ' + e.message);
    } finally {
      setIsSubmittingErasure(false);
    }
  };

  // Immediate Complete Account Eradication
  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const res = await fetch('/api/privacy/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile?.id || 'unknown',
          userEmail: userProfile?.email || 'parent@vernunt.com',
          reason: 'Self-serve immediate erasure from Privacy & Data Settings'
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('✓ Your account has been permanently erased from Vernunt servers. All sessions are now revoked.');
        if (onAccountDeleted) {
          onAccountDeleted();
        } else {
          window.location.reload();
        }
      }
    } catch (e: any) {
      alert('Error erasing account: ' + e.message);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Save Email Preferences
  const handleSaveEmailPreferences = async () => {
    try {
      await fetch('/api/email/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userProfile?.email || 'parent@vernunt.com',
          marketingEmails,
          eventAlerts,
          productUpdates
        })
      });
      setEmailSavedNotice(true);
      setTimeout(() => setEmailSavedNotice(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9990] flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white text-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                DPDP Act 2023 &bull; Sec 12 Rights
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">&bull; Verifiable Parental Control</span>
            </div>
            <h3 className="text-lg font-black font-serif tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Account Privacy &amp; Data Rights Center</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Manage your child profile discoverability, export your personal data, or exercise statutory erasure rights.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-5 pt-2 shrink-0 gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('privacy_controls')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'privacy_controls'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4 text-indigo-600" />
            <span>Child Privacy &amp; Visibility</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('data_rights')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'data_rights'
                ? 'border-rose-600 text-rose-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4 text-rose-600" />
            <span>Download &amp; Data Deletion</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('email_prefs')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'email_prefs'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4 text-emerald-600" />
            <span>Email &amp; Cookie Preferences</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-xs sm:text-sm">
          
          {/* TAB 1: CHILD PRIVACY & PROFILE VISIBILITY */}
          {activeTab === 'privacy_controls' && (
            <div className="space-y-5">
              
              {/* Default Visibility Tier Notice */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Safest Setting Enforced by Default (PRIVATE)</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Vernunt does not assume that creating a child profile means other users should see it. By default, child profiles are set to <strong>PRIVATE</strong>. You have complete control to keep it hidden, share only with approved connections, or publish for radar playmates.
                </p>
              </div>

              {/* Profile Visibility Radio Options */}
              <div className="space-y-3">
                <label className="font-bold text-slate-900 text-xs sm:text-sm block">
                  Child Profile Visibility &amp; Radar Discoverability:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* PRIVATE */}
                  <label className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between gap-2 ${
                    visibility === 'PRIVATE'
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <EyeOff className="w-4 h-4 text-indigo-600" />
                          <span>PRIVATE</span>
                        </span>
                        <input
                          type="radio"
                          name="visibility"
                          value="PRIVATE"
                          checked={visibility === 'PRIVATE'}
                          onChange={() => setVisibility('PRIVATE')}
                          className="text-indigo-600"
                        />
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full inline-block">
                        Recommended Default
                      </span>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        Completely hidden. No other parent or radar user can see your child's profile or name.
                      </p>
                    </div>
                  </label>

                  {/* CONNECTIONS */}
                  <label className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between gap-2 ${
                    visibility === 'CONNECTIONS'
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-indigo-600" />
                          <span>CONNECTIONS</span>
                        </span>
                        <input
                          type="radio"
                          name="visibility"
                          value="CONNECTIONS"
                          checked={visibility === 'CONNECTIONS'}
                          onChange={() => setVisibility('CONNECTIONS')}
                          className="text-indigo-600"
                        />
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug pt-1">
                        Visible only to parents you explicitly accept connection or playdate invitations with.
                      </p>
                    </div>
                  </label>

                  {/* PUBLIC */}
                  <label className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between gap-2 ${
                    visibility === 'PUBLIC'
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-indigo-600" />
                          <span>PUBLIC RADAR</span>
                        </span>
                        <input
                          type="radio"
                          name="visibility"
                          value="PUBLIC"
                          checked={visibility === 'PUBLIC'}
                          onChange={() => setVisibility('PUBLIC')}
                          className="text-indigo-600"
                        />
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug pt-1">
                        Discoverable on Playmate Radar with fuzzed approximate area (never exact address).
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Location Obfuscation & Approximate Locality */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-600" />
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Location Privacy &amp; Anti-Doxing Protection</h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Vernunt <strong>NEVER</strong> stores or broadcasts your exact residential coordinates. Coordinates are mathematically jittered within a 1.5–2km radius and displayed as an approximate neighborhood.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Approximate Locality / Area:
                    </label>
                    <input
                      type="text"
                      value={neighbourhood}
                      onChange={(e) => setNeighbourhood(e.target.value)}
                      placeholder="e.g. Koramangala 4th Block (~1.5 km)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Radar Location Precision:
                    </label>
                    <select
                      value={locationSharing}
                      onChange={(e) => setLocationSharing(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      <option value="APPROXIMATE">Approximate Radius (~1.5 km)</option>
                      <option value="HIDDEN">Completely Hidden (Do not show on map)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="text-right pt-2">
                <button
                  type="button"
                  onClick={handleSavePrivacySettings}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Save Privacy Preferences
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: DATA RIGHTS (DOWNLOAD, DELETE CHILD, DELETE ACCOUNT) */}
          {activeTab === 'data_rights' && (
            <div className="space-y-5">
              
              {/* Action 1: Download My Data */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <Download className="w-4 h-4 text-indigo-600" />
                    <span>Download My Complete Personal Data (Portability)</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 max-w-md">
                    Receive a comprehensive, uncompressed JSON archive containing your account metadata, child profile, consent timestamp history, and bookings under Section 12 of the DPDP Act 2023.
                  </p>
                  {downloadSuccess && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Data export generated and downloaded successfully.</span>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleDownloadMyData}
                  disabled={isDownloading}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDownloading ? 'animate-spin' : ''}`} />
                  <span>{isDownloading ? 'Exporting...' : 'Download My Data'}</span>
                </button>
              </div>

              {/* Action 2: Delete Child Profile */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-amber-600" />
                    <span>Delete Child Profile Only</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 max-w-md">
                    Permanently delete your child's profile, interests, and photos while keeping your parent account active for events and pediatric directory.
                  </p>
                  {childDeletedSuccess && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Child profile deleted from all radar discovery networks.</span>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleDeleteChildProfile}
                  disabled={isDeletingChild}
                  className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                >
                  {isDeletingChild ? 'Deleting...' : 'Delete Child Profile'}
                </button>
              </div>

              {/* Action 3: Formal Statutory Deletion Request */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>Submit Formal Erasure Notice (DPDP Compliance Team)</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 max-w-md">
                    Submit a formal statutory notice to our Nodal Grievance Officer (<code className="font-mono text-purple-900">grievance@vernunt.com</code>) to review backups and purge auxiliary logs.
                  </p>
                  {erasureSuccess && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Notice logged! Reference ID: <strong>{erasureRefId}</strong></span>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleRequestDataDeletion}
                  disabled={isSubmittingErasure}
                  className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                >
                  {isSubmittingErasure ? 'Submitting...' : 'Request Data Deletion'}
                </button>
              </div>

              {/* Action 4: Immediate Account & Data Eradication */}
              <div className="p-4.5 rounded-2xl bg-red-50 border-2 border-red-200 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h4 className="font-extrabold text-red-900 text-sm">Danger Zone: Permanent Account Deletion</h4>
                </div>
                <p className="text-xs text-red-800 leading-relaxed">
                  Executing this action immediately and irreversibly wipes your parent identity, dependent child profiles, photos, active chats, and device notification tokens across the platform.
                </p>

                {showAccountDeleteConfirm ? (
                  <div className="p-3 bg-white rounded-xl border border-red-300 space-y-2">
                    <p className="text-xs font-bold text-red-900">
                      Are you absolutely certain? This cannot be undone.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmDeleteAccount}
                        disabled={isDeletingAccount}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition cursor-pointer"
                      >
                        {isDeletingAccount ? 'Erasing Everything...' : 'Yes, Permanently Delete My Account'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAccountDeleteConfirm(false)}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAccountDeleteConfirm(true)}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
                  >
                    Delete My Account Permanently
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: EMAIL PREFERENCES & COOKIE CONTROL */}
          {activeTab === 'email_prefs' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">Email Communication Preferences</h4>
                <p className="text-xs text-slate-600">
                  Control which non-essential emails you receive. Essential security and booking transaction notifications are always preserved.
                </p>
              </div>

              <div className="space-y-3">
                <label className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Local Family Workshops &amp; Community Events</span>
                    <span className="text-[11px] text-slate-500">Alerts about parenting masterclasses and playdates in Bangalore</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={eventAlerts}
                    onChange={(e) => setEventAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                </label>

                <label className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Platform Features &amp; Guide Updates</span>
                    <span className="text-[11px] text-slate-500">Weekly child growth milestones and pediatric advice</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={productUpdates}
                    onChange={(e) => setProductUpdates(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                </label>

                <label className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Commercial Offers &amp; Vendor Promotions</span>
                    <span className="text-[11px] text-slate-500">Curated discounts on non-toxic toys and organic nutrition</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={marketingEmails}
                    onChange={(e) => setMarketingEmails(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('vernunt_open_cookie_preferences'))}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Cookie className="w-3.5 h-3.5 text-amber-600" />
                  <span>Re-configure Cookie Banner</span>
                </button>

                <div className="flex items-center gap-2">
                  {emailSavedNotice && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Saved!</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveEmailPreferences}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Save Email Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <span className="flex items-center gap-1">
            <HeartHandshake className="w-4 h-4 text-rose-600" />
            <span>Nodal Officer: <strong>grievance@vernunt.com</strong></span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default PrivacyAndDataModal;
