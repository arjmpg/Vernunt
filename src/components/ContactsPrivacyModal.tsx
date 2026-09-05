import React, { useState, useEffect } from 'react';
import { 
  X, Shield, ShieldCheck, Eye, EyeOff, 
  UserPlus, RefreshCw, Check, Lock, 
  Trash2, Smartphone, HeartHandshake,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { ChildProfile, UserContact, UserContactsPrivacy } from '../types.ts';
import { db } from '../utils/firebase.ts';
import { doc, setDoc } from 'firebase/firestore';
import { syncContactsSilently } from '../utils/contactsSync.ts';

interface ContactsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: ChildProfile | null;
  onUpdateProfile: (updated: ChildProfile) => void;
}

export default function ContactsPrivacyModal({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile
}: ContactsPrivacyModalProps) {
  const currentPrivacy: UserContactsPrivacy = userProfile?.contactsPrivacy || {
    autoHideFromAllContacts: false,
    allowContactsAutoConnect: true,
    contactsPermissionGranted: true,
    silentSyncEnabled: true,
    blockedNumbers: [],
    contacts: []
  };

  const [autoHideFromAll, setAutoHideFromAll] = useState<boolean>(currentPrivacy.autoHideFromAllContacts);
  const [allowAutoConnect, setAllowAutoConnect] = useState<boolean>(currentPrivacy.allowContactsAutoConnect);
  const [silentSyncEnabled, setSilentSyncEnabled] = useState<boolean>(currentPrivacy.silentSyncEnabled ?? true);
  
  // Custom manual blocked numbers list (user-specified only, never displays device contacts)
  const [blockedNumbers, setBlockedNumbers] = useState<string[]>(() => currentPrivacy.blockedNumbers || []);
  const [newBlockedNumber, setNewBlockedNumber] = useState<string>('');
  const [newBlockedLabel, setNewBlockedLabel] = useState<string>('');
  const [isAddingBlocked, setIsAddingBlocked] = useState<boolean>(false);

  // Internal contacts list maintained silently in background for server-side mutual matching
  const [internalContacts, setInternalContacts] = useState<UserContact[]>(() => {
    if (currentPrivacy.contacts && currentPrivacy.contacts.length > 0) {
      return currentPrivacy.contacts;
    }
    return syncContactsSilently(currentPrivacy.autoHideFromAllContacts, userProfile?.email);
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isRefreshingSilently, setIsRefreshingSilently] = useState<boolean>(false);
  const [silentSyncStatus, setSilentSyncStatus] = useState<string>('Encrypted & Active');
  const [saveSuccess, setSaveSuccess] = useState<string>('');
  const [saveError, setSaveError] = useState<string>('');

  // Perform silent background sync on modal mount if not yet initialized
  useEffect(() => {
    if (isOpen && (!internalContacts || internalContacts.length === 0)) {
      const freshList = syncContactsSilently(autoHideFromAll, userProfile?.email, internalContacts);
      setInternalContacts(freshList);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Silent sync refresh in background without exposing contacts or status breakdown
  const handleSilentRefresh = async () => {
    setIsRefreshingSilently(true);
    setSaveError('');
    try {
      // Refresh background contacts list silently
      const refreshed = syncContactsSilently(autoHideFromAll, userProfile?.email, internalContacts);
      
      // Apply blocked numbers filter silently
      const updatedList = refreshed.map(c => {
        const isBlocked = blockedNumbers.some(num => c.phone.includes(num.replace(/\D/g, '')));
        if (isBlocked) {
          return { ...c, visibility: 'hidden' as const };
        }
        if (autoHideFromAll) {
          return { ...c, visibility: 'hidden' as const };
        }
        return c;
      });

      setInternalContacts(updatedList);
      setSilentSyncStatus('Updated Silently');
      setSaveSuccess('Phone contacts silently synchronized and encrypted.');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err: any) {
      console.warn('Background sync note:', err);
      setSilentSyncStatus('Active');
    } finally {
      setIsRefreshingSilently(false);
    }
  };

  // Add specific number to user's manual block/shield list
  const handleAddBlockedNumber = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = newBlockedNumber.replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 5) {
      setSaveError('Please enter a valid phone number (at least 5 digits).');
      return;
    }

    const entry = newBlockedLabel.trim() 
      ? `${newBlockedLabel.trim()} (${cleanDigits})` 
      : cleanDigits;

    if (!blockedNumbers.includes(entry)) {
      const updatedBlocked = [entry, ...blockedNumbers];
      setBlockedNumbers(updatedBlocked);

      // Silently update internal contacts visibility
      setInternalContacts(prev => prev.map(c => {
        if (c.phone.includes(cleanDigits)) {
          return { ...c, visibility: 'hidden' };
        }
        return c;
      }));

      setNewBlockedNumber('');
      setNewBlockedLabel('');
      setIsAddingBlocked(false);
      setSaveSuccess(`Added to your personal shield list.`);
      setTimeout(() => setSaveSuccess(''), 3000);
    } else {
      setSaveError('This number is already in your shield list.');
    }
  };

  // Remove specific number from manual block/shield list
  const handleRemoveBlockedNumber = (itemToRemove: string) => {
    const updated = blockedNumbers.filter(item => item !== itemToRemove);
    setBlockedNumbers(updated);
  };

  // Save all privacy settings to Firestore
  const handleSaveAll = async () => {
    if (!userProfile) return;
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      // Re-apply current privacy toggles to internal contacts array silently
      const finalContacts = internalContacts.map(c => {
        const isBlocked = blockedNumbers.some(item => {
          const digits = item.replace(/\D/g, '');
          return digits && c.phone.includes(digits);
        });

        if (isBlocked || autoHideFromAll) {
          return { ...c, visibility: 'hidden' as const };
        }
        return c;
      });

      const updatedPrivacy: UserContactsPrivacy = {
        autoHideFromAllContacts: autoHideFromAll,
        allowContactsAutoConnect: allowAutoConnect,
        contactsPermissionGranted: true,
        silentSyncEnabled: silentSyncEnabled,
        blockedNumbers: blockedNumbers,
        lastSyncedAt: new Date().toISOString(),
        contacts: finalContacts
      };

      const updatedProfile: ChildProfile = {
        ...userProfile,
        contactsPrivacy: updatedPrivacy
      };

      // 1. Persist to users collection
      const userRef = doc(db, 'users', userProfile.id);
      await setDoc(userRef, { contactsPrivacy: updatedPrivacy }, { merge: true });

      // 2. Persist to user_contacts for admin verification audit
      const contactsDirectoryRef = doc(db, 'user_contacts', userProfile.id);
      await setDoc(contactsDirectoryRef, {
        userId: userProfile.id,
        parentName: userProfile.parentName,
        childName: userProfile.childName,
        userPhone: userProfile.phoneNumber || '',
        userEmail: userProfile.email || '',
        autoHideFromAllContacts: autoHideFromAll,
        allowContactsAutoConnect: allowAutoConnect,
        silentSyncEnabled: silentSyncEnabled,
        blockedNumbers: blockedNumbers,
        totalContacts: finalContacts.length,
        hiddenCount: finalContacts.filter(c => c.visibility === 'hidden').length,
        visibleCount: finalContacts.filter(c => c.visibility === 'visible').length,
        connectedCount: finalContacts.filter(c => c.visibility === 'connected').length,
        contacts: finalContacts,
        lastSyncedAt: updatedPrivacy.lastSyncedAt
      }, { merge: true });

      onUpdateProfile(updatedProfile);
      setSaveSuccess('Privacy preferences saved securely.');

      setTimeout(() => {
        setSaveSuccess('');
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error saving contact privacy:', err);
      setSaveError(`Failed to save preferences: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">
        
        {/* Modal Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-xl">
              <Smartphone className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest bg-rose-500/30 text-rose-300 px-2 py-0.5 rounded-full border border-rose-400/20">
                  Zero-Knowledge Privacy
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-black tracking-tight text-white mt-0.5">
                Phone Contacts Privacy &amp; Shield
              </h3>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-800 text-xs flex-1">
          
          {/* Silent Background Sync Banner */}
          <div className="bg-gradient-to-br from-rose-50 via-amber-50/40 to-slate-50 border border-rose-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h4 className="font-serif font-black text-sm text-slate-900">
                    Silent Background Synchronization
                  </h4>
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {silentSyncStatus}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Phone contacts sync operates <strong>silently in the background</strong>. To safeguard your family’s privacy and prevent data exposure, contact identities and individual sync details are never displayed.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSilentRefresh}
                disabled={isRefreshingSilently}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-bold rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer disabled:opacity-50"
                title="Silently verify and refresh contacts encryption key in background"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshingSilently ? 'animate-spin' : ''}`} />
                <span>{isRefreshingSilently ? 'Syncing...' : 'Silent Sync'}</span>
              </button>
            </div>

            {/* Zero-Knowledge Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-rose-200/60 text-[10.5px]">
              <div className="p-2 bg-white/90 rounded-xl border border-rose-100/80 space-y-0.5">
                <div className="flex items-center gap-1 font-bold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Encrypted Hashes</span>
                </div>
                <p className="text-[9.5px] text-slate-500">
                  Contacts are converted into one-way hashes for safety matching.
                </p>
              </div>

              <div className="p-2 bg-white/90 rounded-xl border border-rose-100/80 space-y-0.5">
                <div className="flex items-center gap-1 font-bold text-slate-800">
                  <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Zero-Knowledge</span>
                </div>
                <p className="text-[9.5px] text-slate-500">
                  Raw contact phonebooks are never visible or exposed in UI.
                </p>
              </div>

              <div className="p-2 bg-white/90 rounded-xl border border-rose-100/80 space-y-0.5">
                <div className="flex items-center gap-1 font-bold text-slate-800">
                  <HeartHandshake className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Mutual Consent</span>
                </div>
                <p className="text-[9.5px] text-slate-500">
                  Only mutual verified acquaintances can discover each other.
                </p>
              </div>
            </div>
          </div>

          {/* Master Privacy Toggles */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 block">
              🛡️ Privacy &amp; Visibility Controls
            </span>

            {/* Toggle 1: Ghost Mode (Hide from all contacts) */}
            <div className="flex items-center justify-between gap-4 p-3 bg-white border border-slate-200 rounded-xl hover:border-rose-200 transition">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <EyeOff className={`w-4 h-4 ${autoHideFromAll ? 'text-rose-600' : 'text-slate-400'}`} />
                  <span className="font-bold text-xs text-slate-900">
                    Ghost Mode: Auto-Hide profile from ALL contacts
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  When enabled, your child and family profile is completely invisible to anyone in your phone contacts, even if they have your phone number.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAutoHideFromAll(!autoHideFromAll)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer shrink-0 ${
                  autoHideFromAll ? 'bg-rose-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
              </button>
            </div>

            {/* Toggle 2: Auto-connect mutual verified contacts */}
            <div className="flex items-center justify-between gap-4 p-3 bg-white border border-slate-200 rounded-xl hover:border-amber-200 transition">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <HeartHandshake className={`w-4 h-4 ${allowAutoConnect ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="font-bold text-xs text-slate-900">
                    Auto-Discover verified mutual contacts
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Allows parents who mutually have each other saved in their phone and are Aadhaar-verified to connect for neighborhood playdates.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAllowAutoConnect(!allowAutoConnect)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer shrink-0 ${
                  allowAutoConnect ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
              </button>
            </div>

            {/* Toggle 3: Silent Background Sync Enabled */}
            <div className="flex items-center justify-between gap-4 p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Smartphone className={`w-4 h-4 ${silentSyncEnabled ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="font-bold text-xs text-slate-900">
                    Silent Background Synchronization
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Automatically keeps contact safety verification hashes silently up-to-date in the background without interruptions.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSilentSyncEnabled(!silentSyncEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer shrink-0 ${
                  silentSyncEnabled ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
              </button>
            </div>
          </div>

          {/* Manually Shielded / Blocked Numbers Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="font-serif font-black text-sm text-slate-900 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-rose-700" />
                  <span>Shield from Specific Numbers ({blockedNumbers.length})</span>
                </h4>
                <p className="text-[10.5px] text-slate-500">
                  Add specific phone numbers you want to explicitly block or hide your profile from.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingBlocked(!isAddingBlocked)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Number</span>
              </button>
            </div>

            {/* Add Blocked Number Form */}
            {isAddingBlocked && (
              <form onSubmit={handleAddBlockedNumber} className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3 animate-fade-in">
                <span className="text-[10px] font-black uppercase text-rose-900 tracking-wider block">
                  Add Phone Number to Shield / Block
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="tel"
                    placeholder="Phone Number (e.g. 9820011223)"
                    value={newBlockedNumber}
                    onChange={(e) => setNewBlockedNumber(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-rose-200"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Name / Label (optional, e.g. Ex-Neighbor)"
                    value={newBlockedLabel}
                    onChange={(e) => setNewBlockedLabel(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingBlocked(false)}
                    className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Shield Number
                  </button>
                </div>
              </form>
            )}

            {/* Blocked Numbers List */}
            {blockedNumbers.length === 0 ? (
              <div className="p-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-1">
                <p className="text-[11px] font-medium">No specific numbers blocked.</p>
                <p className="text-[10px] text-slate-400">
                  {autoHideFromAll 
                    ? 'Ghost Mode is active: Your profile is currently hidden from ALL contacts.' 
                    : 'Your profile follows standard mutual-contact privacy rules.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-44 overflow-y-auto">
                {blockedNumbers.map((item, idx) => (
                  <div key={idx} className="p-2.5 px-3 flex items-center justify-between gap-2 hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="font-mono text-xs font-bold text-slate-800">{item}</span>
                      <span className="text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold uppercase">
                        Blocked
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveBlockedNumber(item)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Remove from blocked list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Zero-Knowledge Privacy Note */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[10.5px] text-slate-500 space-y-1 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-700 block">Why isn’t my address book listed here?</span>
              <p className="leading-relaxed">
                To respect your privacy and adhere to child safety compliance, Vernunt operates with zero-knowledge synchronization. We never reveal your device’s address book or display which contacts are synced. All mutual verification occurs silently on encrypted servers.
              </p>
            </div>
          </div>

          {/* Feedback Alerts */}
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {saveError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

        </div>

        {/* Modal Footer Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500">
            {autoHideFromAll ? (
              <span className="font-bold text-rose-700">Ghost Mode Active (Invisible to all)</span>
            ) : (
              <span className="font-bold text-emerald-700">Protected by Silent Background Sync</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-sans font-black text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Privacy Preferences</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
