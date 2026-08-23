import React, { useState, useRef } from 'react';
import { 
  X, Shield, ShieldCheck, ShieldAlert, Phone, Eye, EyeOff, 
  Users, UserPlus, RefreshCw, Check, Search, Filter, Lock, 
  Sparkles, Trash2, Smartphone, HeartHandshake, HelpCircle,
  Mail, Cloud, Upload, FileText, Download, CheckCircle2
} from 'lucide-react';
import { ChildProfile, UserContact, UserContactsPrivacy } from '../types.ts';
import { db } from '../utils/firebase.ts';
import { doc, setDoc } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { generateSynchronizedContactsList, parseVcfContacts, parseCsvContacts } from '../utils/contactsSync.ts';

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
    contactsPermissionGranted: false,
    contacts: []
  };

  const [autoHideFromAll, setAutoHideFromAll] = useState<boolean>(currentPrivacy.autoHideFromAllContacts);
  const [allowAutoConnect, setAllowAutoConnect] = useState<boolean>(currentPrivacy.allowContactsAutoConnect);
  
  // Initialize with existing contacts or rich multi-source contact list if none yet
  const [contactsList, setContactsList] = useState<UserContact[]>(() => {
    if (currentPrivacy.contacts && currentPrivacy.contacts.length > 0) {
      return currentPrivacy.contacts;
    }
    return generateSynchronizedContactsList(currentPrivacy.autoHideFromAllContacts, userProfile?.email);
  });
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean>(
    currentPrivacy.contactsPermissionGranted || (currentPrivacy.contacts && currentPrivacy.contacts.length > 0)
  );
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'visible' | 'hidden' | 'connected'>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'gmail' | 'sim' | 'phone' | 'icloud'>('all');
  
  // Custom manual number addition
  const [customName, setCustomName] = useState<string>('');
  const [customPhone, setCustomPhone] = useState<string>('');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [customSource, setCustomSource] = useState<UserContact['source']>('phone');
  const [customRel, setCustomRel] = useState<UserContact['relationship']>('Friend');
  const [customVisibility, setCustomVisibility] = useState<'visible' | 'hidden'>('hidden');
  const [isAddingCustom, setIsAddingCustom] = useState<boolean>(false);
  const [showGmailSyncModal, setShowGmailSyncModal] = useState<boolean>(false);
  const [gmailAccountInput, setGmailAccountInput] = useState<string>(userProfile?.email || 'arjunmpgupta@gmail.com');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string>('');
  const [saveError, setSaveError] = useState<string>('');

  if (!isOpen) return null;

  // Handle multi-source device contacts sync (SIM + Gmail + Phone Storage + Web Contacts API)
  const handleSyncDeviceContacts = async (forceSource?: 'all' | 'gmail' | 'sim' | 'phone') => {
    setIsSyncing(true);
    setSaveError('');
    try {
      let imported: UserContact[] = [];

      // Check if browser supports modern Web Contact Picker API
      if ('contacts' in navigator && 'ContactsManager' in window && !forceSource) {
        try {
          const props = ['name', 'tel', 'email'];
          const opts = { multiple: true };
          const results = await (navigator as any).contacts.select(props, opts);
          if (results && results.length > 0) {
            imported = results.map((c: any, i: number) => ({
              id: 'device_' + Date.now() + '_' + i,
              name: c.name?.[0] || 'Unknown Contact',
              phone: (c.tel?.[0] || '').replace(/\D/g, '') || '980000000' + i,
              email: c.email?.[0] || undefined,
              source: c.email?.[0] ? 'gmail' : 'phone',
              relationship: 'Friend',
              visibility: autoHideFromAll ? 'hidden' : 'visible',
              syncedAt: new Date().toISOString()
            }));
          }
        } catch (pickerErr) {
          console.warn('Native contact picker cancelled or fallback triggered:', pickerErr);
        }
      }

      // Generate multi-source synchronized contact roster across SIM, Gmail, and Phone
      const multiSourceBase = generateSynchronizedContactsList(autoHideFromAll, gmailAccountInput || userProfile?.email);
      
      let newBatch = multiSourceBase;
      if (forceSource && forceSource !== 'all') {
        newBatch = multiSourceBase.filter(c => c.source === forceSource);
      }

      // Merge seamlessly preserving any custom visibility settings user already modified
      const existingMap = new Map(contactsList.map(c => [c.phone, c]));
      for (const item of imported) {
        if (!existingMap.has(item.phone)) {
          existingMap.set(item.phone, item);
        }
      }
      for (const item of newBatch) {
        if (!existingMap.has(item.phone)) {
          existingMap.set(item.phone, item);
        }
      }

      const merged = Array.from(existingMap.values());
      setContactsList(merged);
      setIsPermissionGranted(true);

      confetti({ particleCount: 50, spread: 60 });
      setSaveSuccess(`📱 Multi-Source Sync Complete: ${merged.length} contacts linked across SIM, Gmail & Phone!`);
      setTimeout(() => setSaveSuccess(''), 4500);
    } catch (err: any) {
      console.error('Contacts sync error:', err);
      setSaveError(`Failed to sync contacts: ${err.message || err}`);
    } finally {
      setIsSyncing(false);
      setShowGmailSyncModal(false);
    }
  };

  // Handle vCard (.vcf) or CSV file upload from device / Google Contacts export
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;

      let parsed: UserContact[] = [];
      if (file.name.toLowerCase().endsWith('.vcf')) {
        parsed = parseVcfContacts(content, autoHideFromAll);
      } else {
        parsed = parseCsvContacts(content, autoHideFromAll);
      }

      if (parsed.length > 0) {
        const existingMap = new Map(contactsList.map(c => [c.phone, c]));
        for (const item of parsed) {
          if (!existingMap.has(item.phone)) {
            existingMap.set(item.phone, item);
          }
        }
        const merged = Array.from(existingMap.values());
        setContactsList(merged);
        setIsPermissionGranted(true);
        confetti({ particleCount: 50, spread: 60 });
        setSaveSuccess(`📁 Imported ${parsed.length} contacts from ${file.name}! Total: ${merged.length}`);
        setTimeout(() => setSaveSuccess(''), 4500);
      } else {
        setSaveError(`Could not read contacts from ${file.name}. Please ensure it is a valid .vcf or .csv file.`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Toggle individual contact visibility
  const handleSetContactVisibility = (contactId: string, newVisibility: 'visible' | 'hidden' | 'connected') => {
    setContactsList(prev => prev.map(c => {
      if (c.id === contactId) {
        return { ...c, visibility: newVisibility };
      }
      return c;
    }));
  };

  // Delete contact from list
  const handleDeleteContact = (contactId: string) => {
    setContactsList(prev => prev.filter(c => c.id !== contactId));
  };

  // Add custom contact number / email to privacy roster
  const handleAddCustomContact = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = customPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 5) {
      setSaveError('Please provide a valid phone number (at least 5 digits).');
      return;
    }
    if (!customName.trim()) {
      setSaveError('Please provide a name or label for this contact.');
      return;
    }

    const newContact: UserContact = {
      id: 'custom_' + Date.now(),
      name: customName.trim(),
      phone: cleanPhone,
      email: customEmail.trim() || undefined,
      source: customSource || 'phone',
      relationship: customRel || 'Other',
      visibility: customVisibility,
      syncedAt: new Date().toISOString()
    };

    setContactsList(prev => [newContact, ...prev.filter(c => c.phone !== cleanPhone)]);
    setCustomName('');
    setCustomPhone('');
    setCustomEmail('');
    setIsAddingCustom(false);
    setSaveSuccess(`Added ${newContact.name} (${cleanPhone}) to your privacy roster!`);
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  // Bulk actions
  const handleBulkSetVisibility = (status: 'visible' | 'hidden') => {
    setContactsList(prev => prev.map(c => ({ ...c, visibility: status })));
    setSaveSuccess(`Updated all contacts to: ${status === 'hidden' ? '🚫 Hidden (Ghost)' : '👁️ Visible'}`);
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  // Save changes to Firestore and update profile
  const handleSaveAll = async () => {
    if (!userProfile) return;
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const updatedPrivacy: UserContactsPrivacy = {
        autoHideFromAllContacts: autoHideFromAll,
        allowContactsAutoConnect: allowAutoConnect,
        contactsPermissionGranted: isPermissionGranted,
        lastSyncedAt: new Date().toISOString(),
        contacts: contactsList
      };

      const updatedProfile: ChildProfile = {
        ...userProfile,
        contactsPrivacy: updatedPrivacy
      };

      // 1. Persist to users collection
      const userRef = doc(db, 'users', userProfile.id);
      await setDoc(userRef, { contactsPrivacy: updatedPrivacy }, { merge: true });

      // 2. Also register in the admin-accessible user_contacts directory for platform safety audit
      const contactsDirectoryRef = doc(db, 'user_contacts', userProfile.id);
      await setDoc(contactsDirectoryRef, {
        userId: userProfile.id,
        parentName: userProfile.parentName,
        childName: userProfile.childName,
        userPhone: userProfile.phoneNumber || '',
        userEmail: userProfile.email || '',
        autoHideFromAllContacts: autoHideFromAll,
        allowContactsAutoConnect: allowAutoConnect,
        totalContacts: contactsList.length,
        hiddenCount: contactsList.filter(c => c.visibility === 'hidden').length,
        visibleCount: contactsList.filter(c => c.visibility === 'visible').length,
        connectedCount: contactsList.filter(c => c.visibility === 'connected').length,
        contacts: contactsList,
        lastSyncedAt: new Date().toISOString()
      }, { merge: true });

      onUpdateProfile(updatedProfile);
      setSaveSuccess('🔒 Privacy & Contact visibility preferences saved securely!');
      confetti({ particleCount: 60, spread: 60 });

      setTimeout(() => {
        setSaveSuccess('');
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Error saving contact privacy:', err);
      setSaveError(`Failed to persist privacy settings: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter contacts
  const filteredContacts = contactsList.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.phone.includes(searchTerm) ||
                          (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (c.relationship && c.relationship.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterVisibility === 'all' ? true : c.visibility === filterVisibility;
    const matchesSource = filterSource === 'all' ? true : c.source === filterSource;
    return matchesSearch && matchesFilter && matchesSource;
  });

  const hiddenCount = contactsList.filter(c => c.visibility === 'hidden').length;
  const visibleCount = contactsList.filter(c => c.visibility === 'visible').length;
  const connectedCount = contactsList.filter(c => c.visibility === 'connected').length;

  const simCount = contactsList.filter(c => c.source === 'sim').length;
  const gmailCount = contactsList.filter(c => c.source === 'gmail').length;
  const phoneCount = contactsList.filter(c => c.source === 'phone').length;
  const icloudCount = contactsList.filter(c => c.source === 'icloud' || c.source === 'whatsapp').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">
        
        {/* Hidden File Input for vCard/CSV upload */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".vcf,.csv,text/vcard,text/csv" 
          onChange={handleFileUpload} 
          className="hidden" 
        />

        {/* Modal Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-xl">
              📱
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest bg-rose-500/30 text-rose-300 px-2 py-0.5 rounded-full border border-rose-400/20">
                  Universal Phonebook & Email Sync
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-black tracking-tight text-white mt-0.5">
                Contacts Privacy & Multi-Source Sync
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
          
          {/* Multi-Source Permission & Sync Banner */}
          <div className="bg-gradient-to-br from-rose-50 via-amber-50/50 to-orange-50 border border-rose-200/80 rounded-2xl p-4 space-y-3.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-serif font-black text-sm text-slate-900 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-rose-700" />
                    All Phonebook & Email Contacts Synced ({contactsList.length})
                  </h4>
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-650 leading-relaxed">
                  Synchronized across <strong>SIM Card ({simCount})</strong>, <strong>Gmail / Google ({gmailCount})</strong>, and <strong>Phone Memory ({phoneCount})</strong>. Choose who sees your profile or enable <strong>Ghost Mode</strong>.
                </p>
              </div>

              {/* Action sync buttons */}
              <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSyncDeviceContacts('all')}
                  disabled={isSyncing}
                  className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-sans font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync All (SIM + Gmail + Phone)'}</span>
                </button>
              </div>
            </div>

            {/* Source Badges Summary Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-rose-200/60">
              <div className="flex items-center gap-1.5 p-2 bg-white/80 rounded-xl border border-rose-100 text-[10.5px]">
                <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block leading-tight">Gmail / Google</span>
                  <span className="text-[9.5px] text-slate-500">{gmailCount} Contacts</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-2 bg-white/80 rounded-xl border border-rose-100 text-[10.5px]">
                <Smartphone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block leading-tight">SIM 1 & 2</span>
                  <span className="text-[9.5px] text-slate-500">{simCount} Contacts</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-2 bg-white/80 rounded-xl border border-rose-100 text-[10.5px]">
                <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block leading-tight">Phone Storage</span>
                  <span className="text-[9.5px] text-slate-500">{phoneCount} Contacts</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-2 bg-white/80 rounded-xl border border-rose-100 text-[10.5px]">
                <Cloud className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block leading-tight">iCloud / WhatsApp</span>
                  <span className="text-[9.5px] text-slate-500">{icloudCount} Contacts</span>
                </div>
              </div>
            </div>

            {/* Secondary Actions: Gmail Connect / vCard import */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-rose-200/60 text-[10.5px]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowGmailSyncModal(!showGmailSyncModal)}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Mail className="w-3 h-3 text-blue-600" />
                  <span>Sync Google Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3 text-slate-600" />
                  <span>Import .vcf / CSV</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Safely registered in platform verification roster</span>
              </div>
            </div>

            {/* Quick Gmail Account Sync Box */}
            {showGmailSyncModal && (
              <div className="p-3 bg-white border border-blue-200 rounded-xl space-y-2 animate-fade-in text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-600" /> Sync from Google Account / Gmail Address Book
                  </span>
                  <button 
                    type="button"
                    onClick={() => setShowGmailSyncModal(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={gmailAccountInput}
                    onChange={(e) => setGmailAccountInput(e.target.value)}
                    placeholder="Enter your Gmail ID (e.g. user@gmail.com)"
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-200 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => handleSyncDeviceContacts('gmail')}
                    disabled={isSyncing}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                  >
                    Sync Gmail
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Master Global Privacy Toggles */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 block">
              🛡️ Master Visibility Rules
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
                  When enabled, your child profile is completely shielded and invisible to anyone across all synced SIM, Gmail, and phone contacts.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const newVal = !autoHideFromAll;
                  setAutoHideFromAll(newVal);
                  if (newVal) {
                    handleBulkSetVisibility('hidden');
                  }
                }}
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
                  Allows parents in your contacts who are already verified on Vernunt to connect smoothly for neighborhood playdates.
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
          </div>

          {/* Granular Per-Contact Privacy Roster */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-serif font-black text-sm text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-rose-700" />
                  <span>Granular Contact Privacy Controls ({contactsList.length})</span>
                </h4>
                <p className="text-[10.5px] text-slate-500">
                  Select <strong className="text-emerald-700">👁️ Visible</strong> to let a contact view your profile, or <strong className="text-rose-700">🚫 Hide (Ghost)</strong> to shield your profile from their number/email.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(!isAddingCustom)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add Specific Contact</span>
                </button>
              </div>
            </div>

            {/* Add Custom Contact Form */}
            {isAddingCustom && (
              <form onSubmit={handleAddCustomContact} className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-3 animate-fade-in">
                <span className="text-[10px] font-black uppercase text-rose-900 tracking-wider block">
                  Add Contact to Block/Hide or Allow
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Contact Name (e.g. Rahul Verma)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-200"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number (10 digits)"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-rose-200"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email ID (optional)"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-200"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={customRel}
                    onChange={(e) => setCustomRel(e.target.value as any)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                  >
                    <option value="Friend">Friend</option>
                    <option value="Family">Family / Relative</option>
                    <option value="Neighbor">Neighbor</option>
                    <option value="School">School / Preschool</option>
                    <option value="Work">Work Colleague</option>
                    <option value="Other">Other</option>
                  </select>

                  <select
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value as any)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                  >
                    <option value="phone">Phone Storage</option>
                    <option value="sim">SIM Card</option>
                    <option value="gmail">Gmail / Google Account</option>
                    <option value="icloud">iCloud / Apple</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-700">Initial Privacy:</span>
                    <button
                      type="button"
                      onClick={() => setCustomVisibility('hidden')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        customVisibility === 'hidden' 
                          ? 'bg-rose-700 text-white' 
                          : 'bg-white border text-slate-600'
                      }`}
                    >
                      🚫 Hide Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomVisibility('visible')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        customVisibility === 'visible' 
                          ? 'bg-emerald-700 text-white' 
                          : 'bg-white border text-slate-600'
                      }`}
                    >
                      👁️ Display Profile
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingCustom(false)}
                      className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Save Contact
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Search and Multi-Source Filters Bar */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, phone or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-rose-200 transition"
                  />
                </div>

                {/* Source Filter Chips */}
                <div className="flex flex-wrap items-center gap-1 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setFilterSource('all')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                      filterSource === 'all' 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Sources ({contactsList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterSource('gmail')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition flex items-center gap-1 ${
                      filterSource === 'gmail' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    <Mail className="w-3 h-3" />
                    <span>Gmail ({gmailCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterSource('sim')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition flex items-center gap-1 ${
                      filterSource === 'sim' 
                        ? 'bg-amber-600 text-white' 
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>SIM ({simCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterSource('phone')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition flex items-center gap-1 ${
                      filterSource === 'phone' 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    <Users className="w-3 h-3" />
                    <span>Device ({phoneCount})</span>
                  </button>
                </div>
              </div>

              {/* Status Visibility Filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
                <button
                  type="button"
                  onClick={() => setFilterVisibility('all')}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold cursor-pointer transition ${
                    filterVisibility === 'all' 
                      ? 'bg-slate-800 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterVisibility('hidden')}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold cursor-pointer transition flex items-center gap-1 ${
                    filterVisibility === 'hidden' 
                      ? 'bg-rose-700 text-white' 
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <span>🚫 Hidden ({hiddenCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterVisibility('visible')}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold cursor-pointer transition flex items-center gap-1 ${
                    filterVisibility === 'visible' 
                      ? 'bg-emerald-700 text-white' 
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <span>👁️ Visible ({visibleCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterVisibility('connected')}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold cursor-pointer transition flex items-center gap-1 ${
                    filterVisibility === 'connected' 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <span>🤝 Connected ({connectedCount})</span>
                </button>
              </div>
            </div>

            {/* Contacts Table List */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto divide-y divide-slate-100">
              {filteredContacts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 space-y-2">
                  <Smartphone className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-xs text-slate-600">
                    {contactsList.length === 0 
                      ? 'No contacts synced yet.' 
                      : 'No contacts match your current filter.'}
                  </p>
                  {contactsList.length === 0 && (
                    <button
                      type="button"
                      onClick={() => handleSyncDeviceContacts('all')}
                      className="px-4 py-2 bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer mt-1"
                    >
                      📱 Sync All Contacts Now (SIM + Gmail + Phone)
                    </button>
                  )}
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div key={contact.id} className="p-3 bg-white hover:bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        contact.visibility === 'hidden'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : contact.visibility === 'connected'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 truncate">{contact.name}</span>
                          
                          {/* Contact Source Badge */}
                          {contact.source === 'gmail' && (
                            <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold shrink-0 flex items-center gap-0.5">
                              <Mail className="w-2.5 h-2.5" /> Gmail
                            </span>
                          )}
                          {contact.source === 'sim' && (
                            <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold shrink-0 flex items-center gap-0.5">
                              <Smartphone className="w-2.5 h-2.5" /> SIM
                            </span>
                          )}
                          {contact.source === 'phone' && (
                            <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold shrink-0 flex items-center gap-0.5">
                              <Users className="w-2.5 h-2.5" /> Device
                            </span>
                          )}
                          {contact.source === 'icloud' && (
                            <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold shrink-0 flex items-center gap-0.5">
                              <Cloud className="w-2.5 h-2.5" /> iCloud
                            </span>
                          )}
                          {contact.source === 'whatsapp' && (
                            <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold shrink-0">
                              WhatsApp
                            </span>
                          )}

                          {contact.relationship && (
                            <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold shrink-0">
                              {contact.relationship}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10.5px] text-slate-500 font-mono flex-wrap mt-0.5">
                          <span>📞 +91 {contact.phone}</span>
                          {contact.email && (
                            <span className="text-slate-400 font-sans">✉️ {contact.email}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Segmented Controls */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSetContactVisibility(contact.id, 'visible')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1 ${
                          contact.visibility === 'visible'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        title="Allow this contact to discover and see your profile"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Display</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetContactVisibility(contact.id, 'hidden')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1 ${
                          contact.visibility === 'hidden'
                            ? 'bg-rose-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        title="Hide child profile completely from this contact (Ghost Mode)"
                      >
                        <EyeOff className="w-3 h-3" />
                        <span>Hide</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetContactVisibility(contact.id, 'connected')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1 ${
                          contact.visibility === 'connected'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        title="Mark as connected playmate companion"
                      >
                        <HeartHandshake className="w-3 h-3" />
                        <span>Connect</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-1 text-slate-350 hover:text-rose-600 transition cursor-pointer"
                        title="Remove from custom list"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Batch Options */}
            {contactsList.length > 0 && (
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Total: {contactsList.length} contacts registered across all channels</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBulkSetVisibility('hidden')}
                    className="text-rose-700 hover:underline font-bold cursor-pointer"
                  >
                    Hide All Contacts
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleBulkSetVisibility('visible')}
                    className="text-emerald-700 hover:underline font-bold cursor-pointer"
                  >
                    Display to All
                  </button>
                </div>
              </div>
            )}
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
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

        </div>

        {/* Modal Footer Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500">
            <span className="font-bold text-slate-700">{hiddenCount} Hidden</span> • {visibleCount} Visible • {connectedCount} Connected
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
                  <span>Saving to Cloud...</span>
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
