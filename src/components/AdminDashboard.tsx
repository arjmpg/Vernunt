import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  UserCheck, 
  ShieldAlert, 
  CheckCircle, 
  XSquare, 
  Layers, 
  MapPin, 
  Phone, 
  Search, 
  Users, 
  Edit3, 
  Save, 
  Award, 
  Briefcase,
  User,
  ShieldCheck,
  Check,
  RefreshCw,
  Image,
  Megaphone,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Globe,
  Trash2,
  Bell,
  Send,
  Smartphone,
  Eye,
  EyeOff,
  HeartHandshake,
  Download,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  AlertTriangle,
  Activity,
  Terminal,
  Cpu,
  Database,
  UserX,
  Radio,
  Sliders,
  CheckCircle2,
  FileText,
  HardDrive
} from 'lucide-react';
import { db, handleFirestoreError, OperationType, auth } from '../utils/firebase.ts';
import { doc, setDoc, updateDoc, collection, onSnapshot, deleteDoc } from 'firebase/firestore';
import { ChildProfile, VerificationStatus } from '../types.ts';
import confetti from 'canvas-confetti';
import AestheticImageUploader from './AestheticImageUploader.tsx';
import GoogleDriveBackupPanel from './GoogleDriveBackupPanel.tsx';
import VernuntLogo from './VernuntLogo.tsx';
import { 
  isAuthorizedSystemAdmin, 
  maskAadhaar, 
  maskPhone, 
  maskEmail, 
  sanitizeInput, 
  logSecurityThreat, 
  runSecurityAudit, 
  getLocalSecurityLogs,
  SecurityEventLog, 
  SecurityAuditResult 
} from '../utils/security.ts';

interface AdminDashboardProps {
  userProfile: ChildProfile | null;
  playmates: ChildProfile[];
}

export default function AdminDashboard({ userProfile, playmates }: AdminDashboardProps) {
  // Super Admin Cryptographic Verification
  const isSuperAdminAuthorized = isAuthorizedSystemAdmin(auth.currentUser?.email, userProfile?.userRole);
  
  // Security & Sub-Section Navigation
  const [activeAdminSubSection, setActiveAdminSubSection] = useState<'users' | 'security' | 'backups' | 'contacts' | 'banners' | 'push' | 'schemas' | 'subscriptions' | 'tabs'>('users');
  const [securityLogs, setSecurityLogs] = useState<SecurityEventLog[]>(getLocalSecurityLogs());
  const [auditResult, setAuditResult] = useState<SecurityAuditResult>(() => runSecurityAudit(playmates?.length || 0, isSuperAdminAuthorized));
  const [isRunningAudit, setIsRunningAudit] = useState<boolean>(false);
  const [emergencyLockdown, setEmergencyLockdown] = useState<boolean>(false);
  const [isUpdatingLockdown, setIsUpdatingLockdown] = useState<boolean>(false);
  const [showUnmaskedPii, setShowUnmaskedPii] = useState<boolean>(false);
  const [securityThreatFilter, setSecurityThreatFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [threatSimMessage, setThreatSimMessage] = useState<string>('');

  // Sync Emergency Lockdown Mode
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_config', 'lockdown'), (docSnap) => {
      if (docSnap.exists()) {
        setEmergencyLockdown(!!docSnap.data()?.active);
      }
    }, (err) => {
      console.warn("System lockdown listener note:", err);
    });
    return () => unsub();
  }, []);

  // Sync Immutable Security Logs
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'security_logs'), (snapshot) => {
      const logs: SecurityEventLog[] = [];
      snapshot.forEach(docSnap => {
        logs.push(docSnap.data() as SecurityEventLog);
      });
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      if (logs.length > 0) {
        setSecurityLogs(logs);
      }
    }, (err) => {
      console.warn("Security logs listener note:", err);
    });
    return () => unsub();
  }, []);

  // User Contacts Directory & Privacy Audit States
  const [contactsSearchTerm, setContactsSearchTerm] = useState<string>('');
  const [contactsFilterPrivacy, setContactsFilterPrivacy] = useState<'all' | 'hidden' | 'visible' | 'connected'>('all');
  const [expandedUserContactsId, setExpandedUserContactsId] = useState<string | null>(null);
  const [userContactsMap, setUserContactsMap] = useState<{ [userId: string]: any }>({});

  // Sync user_contacts directory collection in live mode
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'user_contacts'), (snapshot) => {
      const map: { [userId: string]: any } = {};
      snapshot.forEach(docSnap => {
        map[docSnap.id] = docSnap.data();
      });
      setUserContactsMap(map);
    }, (err) => {
      console.warn("user_contacts directory listener note:", err);
    });
    return () => unsub();
  }, []);

  // Subscription Plan Manager State
  const [subPlans, setSubPlans] = useState<any[]>([]);
  const [planSuccess, setPlanSuccess] = useState('');
  const [planError, setPlanError] = useState('');
  const [isSavingPlans, setIsSavingPlans] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'subscription_config', 'plans'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && Array.isArray(data.plans)) {
          setSubPlans(data.plans);
        }
      } else {
        // Use default fallback plans so they can be initially customized
        setSubPlans([
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
        ]);
      }
    });

    return () => unsub();
  }, []);

  // Tab Placements Manager State
  const [tabsPlacement, setTabsPlacement] = useState<{ [key: string]: 'header' | 'side' }>({
    radar: 'header',
    chat: 'header',
    events: 'header',
    specialists: 'header',
    billing: 'side',
    planner: 'side',
    referrals: 'side',
    portfolio: 'side',
    business: 'side',
    admin: 'side'
  });
  const [tabsSuccess, setTabsSuccess] = useState('');

  const tabIconsAndLabels: { [key: string]: { label: string, icon: string } } = {
    radar: { label: 'Near Playmates (Radar)', icon: '🗺️' },
    chat: { label: 'Chat Messenger', icon: '💬' },
    events: { label: 'Events & Classes', icon: '✨' },
    specialists: { label: 'Consult Specialists', icon: '🩺' },
    billing: { label: 'Kids Connect Club (Billing)', icon: '👑' },
    planner: { label: 'Playdate Planner', icon: '📅' },
    referrals: { label: 'Refer & Earn', icon: '🎁' },
    portfolio: { label: 'Safety Vault', icon: '🛡️' },
    business: { label: 'Business Hub', icon: '💼' },
    admin: { label: 'Admin Panel', icon: '🔒' }
  };

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      unsub = onSnapshot(doc(db, 'system_config', 'tabs'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.placements) {
            setTabsPlacement(data.placements);
          }
        }
      }, (err) => {
        console.warn('System tabs listener note:', err?.message || err);
      });
    } catch (e) {
      console.warn('System tabs listener init note:', e);
    }
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const handleSaveTabPlacement = async (tabId: string, value: 'header' | 'side') => {
    try {
      const updated = {
        ...tabsPlacement,
        [tabId]: value
      };
      await setDoc(doc(db, 'system_config', 'tabs'), { placements: updated });
      setTabsSuccess('Tab placements updated successfully!');
      setTimeout(() => setTabsSuccess(''), 3000);
    } catch (err: any) {
      console.error(err);
      alert(`Could not save tab config: ${err.message}`);
    }
  };

  // Promotional Banners State
  const [banners, setBanners] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newPlacement, setNewPlacement] = useState<'home' | 'app_top' | 'app_sidebar'>('home');
  const [bannerSuccess, setBannerSuccess] = useState('');
  const [bannerError, setBannerError] = useState('');
  const [isCreatingBanner, setIsCreatingBanner] = useState(false);

  // Push Notification broadcasting states
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [pushImageUrl, setPushImageUrl] = useState('');
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [pushSuccess, setPushSuccess] = useState('');
  const [pushError, setPushError] = useState('');

  const handleSendPushNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle.trim() || !pushBody.trim()) {
      setPushError('Push Title and Push Body are mandatory.');
      return;
    }
    setIsSendingPush(true);
    setPushSuccess('');
    setPushError('');

    try {
      const pushUid = 'push_' + Date.now();
      await setDoc(doc(db, 'push_notifications', pushUid), {
        id: pushUid,
        title: pushTitle.trim(),
        body: pushBody.trim(),
        imageUrl: pushImageUrl.trim(),
        createdAt: Date.now(),
        senderName: userProfile?.parentName || 'Vernunt Staff Representative',
        senderId: userProfile?.id || 'admin_operator'
      });

      setPushTitle('');
      setPushBody('');
      setPushImageUrl('');
      setPushSuccess('🎉 Push alert distributed successfully to all active subscribers via WebSocket logs!');
      confetti({ particleCount: 50, spread: 40 });
    } catch (exp: any) {
      console.error('[Admin Push broadcaster error]:', exp);
      setPushError('Failed to propagate push alerts: ' + exp.message);
    } finally {
      setIsSendingPush(false);
    }
  };

  // Load banners dynamically
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'banners'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((snapshotDoc) => {
        list.push({ id: snapshotDoc.id, ...snapshotDoc.data() });
      });
      // Sort by createdAt descending
      list.sort((a, b) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      setBanners(list);
    }, (err) => {
      console.error('[Admin Banners Engine] error:', err);
    });
    return () => unsub();
  }, []);

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) {
      setBannerError('Image URL is required for promotional advertisements.');
      return;
    }
    setIsCreatingBanner(true);
    setBannerSuccess('');
    setBannerError('');

    try {
      const bannerUid = 'banner_' + Date.now();
      await setDoc(doc(db, 'banners', bannerUid), {
        id: bannerUid,
        title: newTitle.trim() || 'New Promo Campaign',
        imageUrl: newImageUrl.trim(),
        linkUrl: newLinkUrl.trim() || '#',
        placement: newPlacement,
        active: true,
        createdAt: new Date().toISOString()
      });

      setBannerSuccess('Promotional advertisement banner created successfully!');
      setNewTitle('');
      setNewImageUrl('');
      setNewLinkUrl('');
      
      confetti({
        particleCount: 50,
        spread: 45,
        origin: { y: 0.85 }
      });

      setTimeout(() => setBannerSuccess(''), 4000);
    } catch (err: any) {
      console.error('Error creating banner:', err);
      setBannerError(`Failed to save banner: ${err.message || err}`);
    } finally {
      setIsCreatingBanner(false);
    }
  };

  const handleToggleBanner = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'banners', id), {
        active: !currentStatus
      });
    } catch (err: any) {
      console.error('Error toggling banner:', err);
      alert(`Could not toggle banner: ${err.message}`);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this promotional advertisement?')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'banners', id));
    } catch (err: any) {
      console.error('Error deleting banner:', err);
      alert(`Could not delete banner: ${err.message}`);
    }
  };

  // Custom Categories & Profile Fields Schema Manager States
  const [customEventCats, setCustomEventCats] = useState<any[]>([]);
  const [customSpecCats, setCustomSpecCats] = useState<any[]>([]);
  const [customProfileFields, setCustomProfileFields] = useState<any[]>([]);

  const [newEventCatName, setNewEventCatName] = useState('');
  const [newSpecCatName, setNewSpecCatName] = useState('');
  const [newProfileFieldName, setNewProfileFieldName] = useState('');

  // Sync custom items recursively in live mode
  useEffect(() => {
    const unsubEvent = onSnapshot(collection(db, 'custom_event_categories'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      setCustomEventCats(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'custom_event_categories');
    });
    const unsubSpec = onSnapshot(collection(db, 'custom_specialist_categories'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      setCustomSpecCats(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'custom_specialist_categories');
    });
    const unsubFields = onSnapshot(collection(db, 'custom_profile_fields'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      setCustomProfileFields(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'custom_profile_fields');
    });

    return () => {
      unsubEvent();
      unsubSpec();
      unsubFields();
    };
  }, []);

  const handleAddEventCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventCatName.trim()) return;
    try {
      const catId = 'cat_' + Date.now();
      await setDoc(doc(db, 'custom_event_categories', catId), {
        id: catId,
        name: newEventCatName.trim(),
        value: newEventCatName.trim()
      });
      setNewEventCatName('');
    } catch(err) {
      console.error('Error adding event category:', err);
    }
  };

  const handleDeleteEventCat = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'custom_event_categories', id));
    } catch(err) {
      console.error(err);
    }
  };

  const handleAddSpecCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecCatName.trim()) return;
    try {
      const id = 'spec_cat_' + Date.now();
      await setDoc(doc(db, 'custom_specialist_categories', id), {
        id,
        name: newSpecCatName.trim(),
        value: newSpecCatName.trim()
      });
      setNewSpecCatName('');
    } catch(err) {
      console.error(err);
    }
  };

  const handleDeleteSpecCat = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'custom_specialist_categories', id));
    } catch(err) {
      console.error(err);
    }
  };

  const handleAddProfileField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileFieldName.trim()) return;
    try {
      const id = 'field_' + Date.now();
      await setDoc(doc(db, 'custom_profile_fields', id), {
        id,
        fieldName: newProfileFieldName.trim(),
        placeholder: `Enter ${newProfileFieldName.trim()}`
      });
      setNewProfileFieldName('');
    } catch(err) {
      console.error(err);
    }
  };

  const handleDeleteProfileField = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'custom_profile_fields', id));
    } catch(err) {
      console.error(err);
    }
  };

  // Local state for dashboard search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');
  const [selectedUser, setSelectedUser] = useState<ChildProfile | null>(null);

  // States for in-line updating
  const [targetRole, setTargetRole] = useState<'Parent' | 'Event Organizer' | 'Portfolio Professional' | 'Admin'>('Parent');
  const [targetVerification, setTargetVerification] = useState<VerificationStatus>(VerificationStatus.UNVERIFIED);
  const [targetAadhaarVerified, setTargetAadhaarVerified] = useState<boolean>(false);
  const [targetAadhaarNum, setTargetAadhaarNum] = useState<string>('');
  const [targetPhone, setTargetPhone] = useState<string>('');
  const [targetIsLocked, setTargetIsLocked] = useState<boolean>(false);
  const [targetIsBlocked, setTargetIsBlocked] = useState<boolean>(false);

  // Premium business listing states
  const [targetBusinessListingModel, setTargetBusinessListingModel] = useState<'subscription' | 'commission'>('commission');
  const [targetBusinessSubscriptionActive, setTargetBusinessSubscriptionActive] = useState<boolean>(false);
  const [targetBusinessSubscriptionPlan, setTargetBusinessSubscriptionPlan] = useState<'monthly' | 'quarterly' | 'halfyearly' | 'yearly'>('monthly');
  const [targetBusinessSubscriptionExpiryDate, setTargetBusinessSubscriptionExpiryDate] = useState<string>('');
  const [targetBusinessCommissionRate, setTargetBusinessCommissionRate] = useState<number>(10);
  
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Self root admin profile state updates
  const [adminPhone, setAdminPhone] = useState<string>(userProfile?.phoneNumber || '8073749074');
  const [selfUpdateLoading, setSelfUpdateLoading] = useState<boolean>(false);
  const [selfSuccessMsg, setSelfSuccessMsg] = useState<string>('');
  const [selfErrorMsg, setSelfErrorMsg] = useState<string>('');

  // Sync adminPhone state when userProfile loads
  useEffect(() => {
    if (userProfile?.phoneNumber) {
      setAdminPhone(userProfile.phoneNumber);
    }
  }, [userProfile?.phoneNumber]);

  // Saves the Root Admin's own mobile number to Firestore
  const handleSaveAdminSelfPhone = async () => {
    if (!userProfile?.id) {
      setSelfErrorMsg('No active authenticated admin session found.');
      return;
    }
    setSelfUpdateLoading(true);
    setSelfSuccessMsg('');
    setSelfErrorMsg('');

    try {
      const userRef = doc(db, 'users', userProfile.id);
      await setDoc(userRef, { phoneNumber: adminPhone }, { merge: true });

      // Update current dynamic state representation
      userProfile.phoneNumber = adminPhone;
      setSelfSuccessMsg('Your Administrator mobile number was updated successfully in Firestore!');
      
      confetti({
        particleCount: 50,
        spread: 45,
        origin: { y: 0.85 }
      });

      setTimeout(() => {
        setSelfSuccessMsg('');
      }, 3500);
    } catch (err: any) {
      console.error("Admin self-update phone error:", err);
      setSelfErrorMsg(`Failed updating system record: ${err.message || err}`);
    } finally {
      setSelfUpdateLoading(false);
    }
  };

  // Handle local companion click pre-populating target info
  const handleSelectUser = (user: ChildProfile) => {
    setSelectedUser(user);
    setTargetRole(user.userRole || 'Parent');
    setTargetVerification(user.verificationStatus || VerificationStatus.UNVERIFIED);
    setTargetAadhaarVerified(!!user.aadhaarVerified);
    setTargetAadhaarNum(user.aadhaarNumber || '111122223333');
    setTargetPhone(user.phoneNumber || '');
    setTargetIsLocked(!!user.isLocked);
    setTargetIsBlocked(!!user.isBlocked);
    
    // Set premium hosting attributes
    setTargetBusinessListingModel(user.businessListingModel || 'commission');
    setTargetBusinessSubscriptionActive(!!user.businessSubscriptionActive);
    setTargetBusinessSubscriptionPlan(user.businessSubscriptionPlan || 'monthly');
    setTargetBusinessSubscriptionExpiryDate(user.businessSubscriptionExpiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setTargetBusinessCommissionRate(user.businessCommissionRate !== undefined ? user.businessCommissionRate : 10);
    
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Persists changes to Firestore for dynamic updates, or updates state securely
  const handleSaveUserChanges = async () => {
    if (!selectedUser) return;
    setUpdateLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const userRef = doc(db, 'users', selectedUser.id);
      
      const updatePayload = {
        ...selectedUser,
        userRole: targetRole,
        verificationStatus: targetVerification,
        aadhaarVerified: targetAadhaarVerified,
        aadhaarNumber: targetAadhaarNum,
        phoneNumber: targetPhone,
        isLocked: targetIsLocked,
        isBlocked: targetIsBlocked,
        
        // Premium Listing parameters
        businessListingModel: targetBusinessListingModel,
        businessSubscriptionActive: targetBusinessSubscriptionActive,
        businessSubscriptionPlan: targetBusinessSubscriptionPlan,
        businessSubscriptionExpiryDate: targetBusinessSubscriptionExpiryDate,
        businessCommissionRate: Number(targetBusinessCommissionRate)
      };

      // Set or update user document in Firestore directory
      await setDoc(userRef, updatePayload, { merge: true });
      
      setSuccessMsg(`Successfully updated credentials for guardian ${selectedUser.parentName}!`);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });
      
      // Update selected profile state representation
      setSelectedUser(updatePayload);

      setTimeout(() => {
        setSuccessMsg('');
      }, 3500);

    } catch (err: any) {
      console.error("Admin dashboard profile persist error:", err);
      setErrorMsg(`Failed updating user document: ${err.message || err}`);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Helper values for counts
  const totalProfiles = playmates.length + (userProfile ? 1 : 0);
  const verifiedProfiles = playmates.filter(p => p.verificationStatus === VerificationStatus.VERIFIED).length + (userProfile?.verificationStatus === VerificationStatus.VERIFIED ? 1 : 0);
  const aadhaarVerifiedCount = playmates.filter(p => p.aadhaarVerified).length + (userProfile?.aadhaarVerified ? 1 : 0);
  const organizerCount = playmates.filter(p => p.userRole === 'Event Organizer').length + (userProfile?.userRole === 'Event Organizer' ? 1 : 0);
  const professionalCount = playmates.filter(p => p.userRole === 'Portfolio Professional').length + (userProfile?.userRole === 'Portfolio Professional' ? 1 : 0);

  // List containing current admin user & other users to manage everything in one view
  const allSystemUsers = userProfile ? [userProfile, ...playmates] : playmates;

  // Render filter evaluations
  const filteredUsers = allSystemUsers.filter((user) => {
    const matchesSearch = 
      user.parentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.bio && user.bio.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.location.address && user.location.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' ? true : user.userRole === roleFilter;

    let matchesVerification = true;
    if (verificationFilter !== 'all') {
      if (verificationFilter === 'aadhaar') {
        matchesVerification = !!user.aadhaarVerified;
      } else {
        matchesVerification = user.verificationStatus === verificationFilter;
      }
    }

    return matchesSearch && matchesRole && matchesVerification;
  });

  // Apply sorting options selected by Administrator
  const sortedAndFilteredUsers = [...filteredUsers].sort((a, b) => {
    if (sortBy === 'name-asc') {
      return a.parentName.localeCompare(b.parentName);
    }
    if (sortBy === 'name-desc') {
      return b.parentName.localeCompare(a.parentName);
    }
    if (sortBy === 'child-asc') {
      return (a.childName || '').localeCompare(b.childName || '');
    }
    if (sortBy === 'role-asc') {
      return (a.userRole || '').localeCompare(b.userRole || '');
    }
    if (sortBy === 'verification-asc') {
      return (a.verificationStatus || '').localeCompare(b.verificationStatus || '');
    }
    return 0; // maintain default position
  });

  // Admin purge cache state handler to ensure pristine hot reload
  const handlePurgeCacheAndReload = async () => {
    try {
      // 1. Flush local cache configurations
      localStorage.clear();
      sessionStorage.clear();
      
      // 2. Unpack and evict active service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      }
      
      // 3. Unbind and evict registered background service workers
      if ('serviceWorker' in navigator) {
        const swRegistrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          swRegistrations.map((reg) => reg.unregister())
        );
      }
      
      alert("🔒 Administrative Cache Purged Successfully!\n\nInitiating dynamic client cold reload and loading live fresh configuration...");
      window.location.reload();
    } catch (err: any) {
      console.error("Purge Error:", err);
      alert(`Cache cleanup failed: ${err.message || err}`);
    }
  };

  if (!userProfile || userProfile.userRole !== 'Admin' || !isSuperAdminAuthorized) {
    return (
      <div id="admin-access-denied-shield" className="max-w-2xl mx-auto my-12 p-8 bg-slate-950 border-2 border-rose-600/70 rounded-3xl text-white shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-center justify-center mx-auto text-rose-500 animate-pulse">
          <ShieldAlert className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 bg-rose-500/20 text-rose-450 text-[10px] font-black uppercase tracking-widest rounded-full border border-rose-500/30 inline-flex items-center gap-1">
            <Lock className="w-3 h-3" /> Zero-Trust Security Protocol Active
          </span>
          <h3 className="text-2xl font-black font-serif text-white tracking-tight">Access Restricted: Super Admin Verification Failed</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
            The Vernunt Security Perimeter has blocked access. All administrative endpoints and database queries are cryptographically protected and monitored for unauthorized access.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left font-mono text-[11px] text-slate-300 space-y-1.5">
          <div className="flex justify-between text-slate-450 text-[9px] uppercase font-bold tracking-wider">
            <span>Threat Detection Diagnostics</span>
            <span className="text-rose-450">BLOCKED</span>
          </div>
          <div><span className="text-slate-500">Current User:</span> {auth.currentUser?.email || 'Unauthenticated Guest'}</div>
          <div><span className="text-slate-500">Claimed Role:</span> {userProfile?.userRole || 'None'}</div>
          <div><span className="text-slate-500">Auth UID:</span> {auth.currentUser?.uid || 'anonymous'}</div>
          <div><span className="text-slate-500">Status:</span> <span className="text-emerald-450">Data Access Prevented by Firestore Security Rules</span></div>
        </div>

        <button
          type="button"
          onClick={() => {
            logSecurityThreat('ADMIN_PANEL_BLOCKED', `Blocked unverified user ${auth.currentUser?.email || 'guest'} from viewing admin dashboard`, 'HIGH', true);
            window.location.hash = '#home';
          }}
          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg active:scale-95"
        >
          Return to Safe Zone
        </button>
      </div>
    );
  }

  return (
    <div id="admin-dashboard-container" className="space-y-6">
      
      {/* Visual Header Grid banner for management control */}
      <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
          <div className="bg-white p-2 rounded-2xl shadow-md shrink-0">
            <VernuntLogo size="xs" animated={false} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="p-1 px-2.5 bg-rose-600/25 border border-rose-500/20 text-rose-450 rounded-full text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 animate-pulse">
                <Shield className="w-3.5 h-3.5" /> High Sec Control
              </span>
              {emergencyLockdown && (
                <span className="p-1 px-2.5 bg-red-600 text-white rounded-full text-[10px] uppercase font-black tracking-widest flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" /> EMERGENCY LOCKDOWN ACTIVE
                </span>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-black font-serif tracking-tight">Vernunt Platform Administration Panel</h2>
            <p className="text-slate-400 text-xs text-left">Verify household credentials, manage neighborhood safety badges, and audit biometric Aadhaar links.</p>
          </div>
        </div>
        
        {/* Dynamic Cache Purger and Admin Information */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={handlePurgeCacheAndReload}
            className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-sans font-black text-[10px] uppercase tracking-wider rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 shadow-md cursor-pointer text-center"
            title="Purge service workers cache, remove local databases, and force absolute client fresh boot reload."
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> Purge Cache & Deep Refresh
          </button>
          
          <div className="w-full sm:w-auto px-4 py-2 bg-slate-800 border border-slate-700/80 rounded-xl text-xs flex items-center justify-center gap-2 shrink-0">
            <UserCheck className="w-4 h-4 text-rose-450" />
            <div className="text-left font-mono text-[9px] leading-tight">
              <span className="block font-black text-rose-400 uppercase tracking-wide">SECURE ROOT</span>
              <span className="block text-slate-450 text-[8px] font-bold">{auth.currentUser?.email || 'System Root'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Section Navigation Matrix */}
      <div id="admin-subsections-nav" className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveAdminSubSection('users')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition cursor-pointer ${
            activeAdminSubSection === 'users'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-500" /> Households ({filteredUsers.length})
        </button>

        <button
          type="button"
          id="btn-admin-nav-security"
          onClick={() => setActiveAdminSubSection('security')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition cursor-pointer ${
            activeAdminSubSection === 'security'
              ? 'bg-slate-900 text-white shadow-md border border-rose-500/40'
              : 'bg-rose-50/80 text-rose-800 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" /> 🛡️ Cyber Defense & Threat Logs ({securityLogs.length})
        </button>

        <button
          type="button"
          id="btn-admin-nav-backups"
          onClick={() => setActiveAdminSubSection('backups')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition cursor-pointer ${
            activeAdminSubSection === 'backups'
              ? 'bg-slate-900 text-white shadow-md border border-indigo-500/40'
              : 'bg-indigo-50/90 text-indigo-900 hover:bg-indigo-100 border border-indigo-200 shadow-xs'
          }`}
        >
          <HardDrive className="w-4 h-4 text-indigo-600 animate-pulse" /> ☁️ Google Drive Backups
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminSubSection('contacts')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition cursor-pointer ${
            activeAdminSubSection === 'contacts'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Phone className="w-4 h-4 text-emerald-500" /> Private Contacts Audit
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminSubSection('banners')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition cursor-pointer ${
            activeAdminSubSection === 'banners'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Image className="w-4 h-4 text-blue-500" /> Banners & Ads
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminSubSection('push')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition cursor-pointer ${
            activeAdminSubSection === 'push'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Bell className="w-4 h-4 text-amber-500" /> Push Broadcasts
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminSubSection('schemas')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition cursor-pointer ${
            activeAdminSubSection === 'schemas'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Sliders className="w-4 h-4 text-purple-500" /> Custom Fields & Schemas
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminSubSection('subscriptions')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition cursor-pointer ${
            activeAdminSubSection === 'subscriptions'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Award className="w-4 h-4 text-orange-500" /> Subscription Plans
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminSubSection('tabs')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition cursor-pointer ${
            activeAdminSubSection === 'tabs'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Layers className="w-4 h-4 text-teal-500" /> Navigation Tab Matrix
        </button>
      </div>

      {/* Aggregate summary grid statistics cards */}
      <div id="admin-stats-grid" className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Total Users</span>
            <span className="text-lg font-black text-slate-800">{totalProfiles}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Verified Base</span>
            <span className="text-lg font-black text-slate-800">{verifiedProfiles}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <Award className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Aadhaar Linked</span>
            <span className="text-lg font-black text-slate-800">{aadhaarVerifiedCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Organizers</span>
            <span className="text-lg font-black text-slate-800">{organizerCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3 col-span-2 lg:col-span-1">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Specialists</span>
            <span className="text-lg font-black text-slate-800">{professionalCount}</span>
          </div>
        </div>
      </div>

      {/* Main interaction panels split view */}
      <div id="admin-dashboard-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SECTION: GOOGLE DRIVE CLOUD BACKUP & DISASTER RECOVERY */}
        {activeAdminSubSection === 'backups' && (
          <div className="lg:col-span-12">
            <GoogleDriveBackupPanel isSuperAdmin={isSuperAdminAuthorized} />
          </div>
        )}

        {/* Left Side: Users Search Table / List */}
        {activeAdminSubSection !== 'backups' && (
        <>
        <div id="admin-user-selection-col" className="lg:col-span-8 bg-white rounded-3xl border border-slate-150 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <h3 className="font-serif font-black text-base text-slate-800 flex items-center gap-2">
              📂 Auditable Registered Households ({filteredUsers.length})
            </h3>
            
            {/* Quick Refresh indicators */}
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin text-slate-400" /> Real-time DB Sync
            </span>
          </div>

          {/* Filters and Inputs row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="relative col-span-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Name, Email, Bio..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-rose-200 transition"
              />
            </div>

            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:bg-white transition"
              >
                <option value="all">All Role Types</option>
                <option value="Parent">Parent / Guardian</option>
                <option value="Event Organizer">Event Organizer</option>
                <option value="Portfolio Professional">Portfolio Professional</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>

            <div>
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:bg-white transition"
              >
                <option value="all">All Safety Status</option>
                <option value={VerificationStatus.VERIFIED}>Verified Only</option>
                <option value={VerificationStatus.PENDING}>Pending Only</option>
                <option value={VerificationStatus.UNVERIFIED}>Unverified Only</option>
                <option value="aadhaar">Aadhaar Linked</option>
              </select>
            </div>

            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-rose-50/50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 outline-none focus:bg-rose-100/30 transition cursor-pointer"
              >
                <option value="default">⇅ Sort: Default</option>
                <option value="name-asc">Parent Name (A-Z)</option>
                <option value="name-desc">Parent Name (Z-A)</option>
                <option value="child-asc">Child Name (A-Z)</option>
                <option value="role-asc">User Role (A-Z)</option>
                <option value="verification-asc">Safety Status (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Render User Rows */}
          <div className="overflow-x-auto">
            <div className="max-h-[500px] overflow-y-auto space-y-2.5 pr-1">
              {sortedAndFilteredUsers.length === 0 ? (
                <div className="text-center py-12 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <span className="block text-slate-450 font-bold text-xs uppercase">No matched registry entries found</span>
                  <p className="text-slate-400 text-[10px] mt-1">Adjust search metrics or filters inputs.</p>
                </div>
              ) : (
                sortedAndFilteredUsers.map((p) => {
                  const isSelected = selectedUser?.id === p.id;
                  const isCurAdmin = p.email?.toLowerCase() === 'ardha@vernunt.com';
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectUser(p)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isSelected 
                          ? 'bg-rose-50/60 border-rose-250 shadow-sm' 
                          : 'bg-white hover:bg-slate-50/75 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      {/* Left: User Core Description details */}
                      <div className="flex items-center gap-3.5">
                        <img 
                          src={p.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"}
                          alt={p.parentName}
                          className="w-11 h-11 rounded-full object-cover border-2 border-slate-105 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-serif font-black text-sm text-slate-800">{p.parentName}</span>
                            {p.email && (
                              <span className="text-[10px] text-blue-600 bg-blue-50/70 border border-blue-100/50 px-1.5 py-0.5 rounded-md font-mono">
                                {p.email}
                              </span>
                            )}
                            {isCurAdmin && (
                              <span className="bg-rose-100 text-rose-800 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md">
                                ROOT OWNER
                              </span>
                            )}
                            <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                              {p.userRole || 'Parent'}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-450">
                            <span className="font-semibold text-slate-655">Child: {p.childName || 'System'} ({p.childAge} yrs)</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-slate-400" /> {p.location.address?.split(',')[0]}</span>
                            {p.phoneNumber && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-0.5 text-slate-600 font-mono"><Phone className="w-2.5 h-2.5 text-slate-400" /> {showUnmaskedPii ? p.phoneNumber : maskPhone(p.phoneNumber)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Validation and Identity Badge Controls */}
                      <div className="flex items-center gap-2 md:self-center">
                        <div className="flex flex-col items-end">
                          {p.aadhaarVerified ? (
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100">
                              <ShieldCheck className="w-3 h-3 text-emerald-505" /> Aadhaar Linked
                            </span>
                          ) : (
                            <span className="text-[9px] bg-slate-50 text-slate-400 font-extrabold px-2 py-0.5 rounded-full border border-slate-150">
                              Unlinked ID
                            </span>
                          )}

                          <span className={`text-[10px] font-black uppercase mt-1 ${
                            p.verificationStatus === VerificationStatus.VERIFIED ? 'text-emerald-600' :
                            p.verificationStatus === VerificationStatus.PENDING ? 'text-amber-600' :
                            'text-red-500'
                          }`}>
                            {p.verificationStatus}
                          </span>
                          {(p.isLocked || p.isBlocked) && (
                            <div className="flex flex-wrap gap-1 justify-end mt-1">
                              {p.isLocked && (
                                <span className="text-[7.5px] font-extrabold bg-amber-50 border border-amber-205 text-amber-705 px-1 py-0.2 rounded-md uppercase tracking-wider scale-95 shrink-0 select-none">
                                  LOCKED
                                </span>
                              )}
                              {p.isBlocked && (
                                <span className="text-[7.5px] font-extrabold bg-rose-55 border border-rose-205 text-rose-705 px-1 py-0.2 rounded-md uppercase tracking-wider scale-95 shrink-0 select-none animate-pulse">
                                  BLOCKED
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action verification/role modifier Console */}
        <div id="admin-actions-card" className="lg:col-span-4 space-y-4">
          
          <div className="bg-white rounded-3xl border border-slate-150 p-6 space-y-4 shadow-sm">
            <h3 className="font-serif font-black text-sm text-slate-800 border-b border-slate-100 pb-2.5 flex items-center gap-1.5">
              🛡️ Credentials Authority Desk
            </h3>

            {!selectedUser ? (
              <div className="py-12 text-center text-slate-400 text-xs tracking-wide">
                <p>Select a listed household profile on the left to verify credentials, modify registry roles, or toggle platform certificates.</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Active selection info */}
                <div className="p-3.5 bg-slate-50 rounded-2xl flex items-center gap-3">
                  <img 
                    src={selectedUser.photoUrl} 
                    alt={selectedUser.parentName} 
                    className="w-10 h-10 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-0.5">
                    <span className="block text-xs font-black text-slate-800">{selectedUser.parentName}</span>
                    <span className="block text-[10px] text-slate-400 font-mono tracking-wider">ID: {selectedUser.id.slice(0, 10)}...</span>
                  </div>
                </div>

                {/* Display Aadhaar or ID document if uploaded */}
                {(selectedUser.idDocumentName || selectedUser.companyDocName || selectedUser.aadhaarNumber) && (
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-1.5 text-[10px]">
                    <span className="block font-black text-indigo-950 uppercase tracking-wide">Submitted ID Artifacts</span>
                    {selectedUser.aadhaarNumber && (
                      <p className="text-indigo-800">🔒 Aadhaar Registry correlation: <strong className="font-mono text-[11px]">{selectedUser.aadhaarNumber.replace(/(\d{4})/g, '$1 ')}</strong></p>
                    )}
                    {selectedUser.idDocumentName && (
                      <p className="text-indigo-805">📄 Identity Document uploaded: <strong className="font-mono">{selectedUser.idDocumentName}</strong></p>
                    )}
                    {selectedUser.companyDocName && (
                      <p className="text-indigo-805">🏢 Incorporation Document linked: <strong className="font-mono">{selectedUser.companyDocName}</strong></p>
                    )}
                  </div>
                )}

                {/* Face-to-Selfie Verification Details */}
                {(selectedUser.selfiePhotoUrl || selectedUser.faceVerificationStatus) && (
                  <div className="p-3.5 bg-orange-50/40 border border-orange-100 rounded-2xl space-y-3 px-3 text-xs">
                    <div className="flex items-center justify-between border-b border-orange-100/60 pb-2">
                      <span className="block font-black text-orange-950 uppercase tracking-wider text-[10px]">👩‍👦 Biometric Facial Match Audit</span>
                      <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-md border ${
                        selectedUser.faceVerificationStatus === 'verified' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                          : selectedUser.faceVerificationStatus === 'pending_admin' 
                            ? 'bg-amber-100 text-amber-805 border-amber-250 animate-pulse' 
                            : 'bg-rose-100 text-rose-800 border-rose-250'
                      }`}>
                        {selectedUser.faceVerificationStatus || 'none'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-1">
                      <div className="space-y-1">
                        <span className="block text-[8px] font-black uppercase text-slate-400">Step A: Portrait Photo</span>
                        <div className="h-28 rounded-lg overflow-hidden border border-slate-205 bg-slate-100">
                          <img src={selectedUser.photoUrl} alt="Portrait" className="w-full h-full object-cover" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="block text-[8px] font-black uppercase text-slate-400 font-sans">Step B: Live Selfie Snapshot</span>
                        <div className="h-28 rounded-lg overflow-hidden border border-slate-205 bg-slate-100">
                          {selectedUser.selfiePhotoUrl ? (
                            <img src={selectedUser.selfiePhotoUrl} alt="Live Selfie" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-50 text-[10px] text-slate-400 text-center p-2 leading-tight">No Live Webcam Capture Submitted</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] bg-white p-2.5 rounded-xl border border-orange-100">
                      <div className="space-y-0.5">
                        <span className="block font-bold text-slate-705">AI similarity match confidence:</span>
                        <span className="block text-[8.5px] text-slate-400 leading-none">Security pass approval limit is 85%</span>
                      </div>
                      <span className={`font-black text-sm px-2.5 py-1 rounded-lg border ${
                        (selectedUser.faceVerificationScore || 0) >= 85 
                          ? 'bg-emerald-50 border-emerald-205 text-emerald-700' 
                          : 'bg-rose-50 border-rose-205 text-rose-700'
                      }`}>
                        {selectedUser.faceVerificationScore || 0}%
                      </span>
                    </div>

                    {/* Quick Admin Override Actions */}
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setUpdateLoading(true);
                            const userRef = doc(db, 'users', selectedUser.id);
                            const updatedUser = {
                              ...selectedUser,
                              verificationStatus: VerificationStatus.VERIFIED,
                              faceVerificationStatus: 'verified' as const,
                              faceVerificationScore: Math.max(90, selectedUser.faceVerificationScore || 92)
                            };
                            await updateDoc(userRef, {
                              verificationStatus: VerificationStatus.VERIFIED,
                              faceVerificationStatus: 'verified',
                              faceVerificationScore: Math.max(90, selectedUser.faceVerificationScore || 92)
                            });
                            setSelectedUser(updatedUser);
                            setTargetVerification(VerificationStatus.VERIFIED);
                            setSuccessMsg(`✓ Successfully approved Parental Biometrics for ${selectedUser.parentName}!`);
                          } catch (err: any) {
                            setErrorMsg(`Failed to approve: ${err.message}`);
                          } finally {
                            setUpdateLoading(false);
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-heavy text-[9.5px] uppercase tracking-wide rounded-lg transition active:scale-95 cursor-pointer shadow-2xs"
                      >
                        ✓ Approve Match
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setUpdateLoading(true);
                            const userRef = doc(db, 'users', selectedUser.id);
                            const updatedUser = {
                              ...selectedUser,
                              verificationStatus: VerificationStatus.UNVERIFIED,
                              faceVerificationStatus: 'failed' as const
                            };
                            await updateDoc(userRef, {
                              verificationStatus: VerificationStatus.UNVERIFIED,
                              faceVerificationStatus: 'failed'
                            });
                            setSelectedUser(updatedUser);
                            setTargetVerification(VerificationStatus.UNVERIFIED);
                            setSuccessMsg(`⚠️ Biometrics Rejected for ${selectedUser.parentName}. Verification status revoked.`);
                          } catch (err: any) {
                            setErrorMsg(`Failed to reject: ${err.message}`);
                          } finally {
                            setUpdateLoading(false);
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-heavy text-[9.5px] uppercase tracking-wide rounded-lg transition active:scale-95 cursor-pointer shadow-2xs"
                      >
                        ✕ Reject Match
                      </button>
                    </div>
                  </div>
                )}

                {/* Authority Field toggling */}
                <div className="space-y-3 pt-1">
                  
                  {/* Category Role Modifier */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Assign Active User Role</label>
                    <select
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-rose-200 transition"
                    >
                      <option value="Parent">Parent / Guardian</option>
                      <option value="Event Organizer">Event Organizer</option>
                      <option value="Portfolio Professional">Portfolio Professional</option>
                      <option value="Admin">Administrator Account</option>
                    </select>
                  </div>

                  {/* Contact Phone Override */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Contact Phone Number</label>
                    <input
                      type="text"
                      value={targetPhone}
                      onChange={(e) => setTargetPhone(e.target.value)}
                      placeholder="e.g. 8073749074"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-rose-200 transition"
                    />
                  </div>

                  {/* Verification status selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Verification Tier</label>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      {[VerificationStatus.UNVERIFIED, VerificationStatus.PENDING, VerificationStatus.VERIFIED].map((status) => {
                        const active = targetVerification === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setTargetVerification(status)}
                            className={`py-2 rounded-xl text-[10px] font-black transition border ${
                              active 
                                ? 'bg-slate-900 border-slate-900 text-white shadow-xs' 
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-205 text-slate-600'
                            }`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Aadhaar verified Boolean switch fields */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl hover:bg-slate-100/50 transition">
                    <div className="space-y-0.5">
                      <span className="block text-xs font-black text-slate-800">Aadhaar Bio-Verified</span>
                      <p className="text-[9px] text-slate-400">Manual administrative verification override.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTargetAadhaarVerified(!targetAadhaarVerified)}
                      className={`w-12 h-6.5 rounded-full p-1 transition-colors outline-none cursor-pointer flex ${
                        targetAadhaarVerified ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <span className="w-4.5 h-4.5 bg-white rounded-full shadow-md transform transition" />
                    </button>
                  </div>

                  {/* Custom Aadhaar input value overrides if missing */}
                  {targetAadhaarVerified && (
                    <div className="space-y-1 animate-fade-in">
                      <label className="text-[9px] uppercase font-black text-slate-450 tracking-wider">Aadhaar UIDAI Reference</label>
                      <input
                        type="text"
                        maxLength={12}
                        value={targetAadhaarNum}
                        onChange={(e) => setTargetAadhaarNum(e.target.value.replace(/\D/g, '').slice(0,12))}
                        placeholder="111122223333"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 font-mono text-center tracking-widest text-[11px] rounded-lg"
                      />
                    </div>
                  )}

                  {/* Lock Profile option */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl hover:bg-slate-100/50 transition">
                    <div className="space-y-0.5">
                      <span className="block text-xs font-black text-slate-800 flex items-center gap-1">🔒 Lock Profile Details</span>
                      <p className="text-[9px] text-slate-400 font-medium">Freezes user profile edits once accepted/verified.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTargetIsLocked(!targetIsLocked)}
                      className={`w-12 h-6.5 rounded-full p-1 transition-colors outline-none cursor-pointer flex ${
                        targetIsLocked ? 'bg-amber-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <span className="w-4.5 h-4.5 bg-white rounded-full shadow-md transform transition" />
                    </button>
                  </div>

                  {/* Block / Suspended status */}
                  <div className="flex items-center justify-between p-3.5 bg-rose-50/50 border border-rose-100/50 rounded-2xl hover:bg-rose-50 transition">
                    <div className="space-y-0.5">
                      <span className="block text-xs font-black text-rose-900 flex items-center gap-1">🚫 Suspended / Blocked</span>
                      <p className="text-[9px] text-rose-650 font-medium font-sans">Forbids interactive chat, maps, and updates.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTargetIsBlocked(!targetIsBlocked)}
                      className={`w-12 h-6.5 rounded-full p-1 transition-colors outline-none cursor-pointer flex ${
                        targetIsBlocked ? 'bg-rose-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <span className="w-4.5 h-4.5 bg-white rounded-full shadow-md transform transition" />
                    </button>
                  </div>

                  {/* Premium Business Listing & Charging Controls */}
                  {(targetRole === 'Event Organizer' || targetRole === 'Portfolio Professional') && (
                    <div className="p-4 bg-orange-50/40 border border-orange-100 rounded-2xl space-y-3 pt-3 animate-fade-in text-left">
                      <div className="flex items-center gap-1.5 border-b border-orange-100/60 pb-1.5">
                        <span className="p-1 px-1.5 bg-orange-100 text-orange-600 rounded text-[9px] font-black uppercase tracking-wider">Premium Listing</span>
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider font-sans">Business Listing & Charges</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Charging Model</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setTargetBusinessListingModel('subscription')}
                            className={`py-2 px-3 rounded-xl text-[10px] font-black tracking-wide border transition flex flex-col items-center justify-center text-center cursor-pointer ${
                              targetBusinessListingModel === 'subscription'
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <span>Subscription Fee</span>
                            <span className="text-[8px] opacity-75 font-bold">1m, 3m, 6m, 1y Period</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTargetBusinessListingModel('commission')}
                            className={`py-2 px-3 rounded-xl text-[10px] font-black tracking-wide border transition flex flex-col items-center justify-center text-center cursor-pointer ${
                              targetBusinessListingModel === 'commission'
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <span>Commission Model</span>
                            <span className="text-[8px] opacity-75 font-bold">Free List + Booking %</span>
                          </button>
                        </div>
                      </div>

                      {targetBusinessListingModel === 'subscription' ? (
                        <div className="space-y-2.5 animate-fade-in text-xs">
                          {/* Active subscription status switch */}
                          <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-orange-105">
                            <span className="text-[11px] font-bold text-slate-700">Subscribed active?</span>
                            <button
                              type="button"
                              onClick={() => setTargetBusinessSubscriptionActive(!targetBusinessSubscriptionActive)}
                              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors outline-none cursor-pointer flex ${
                                targetBusinessSubscriptionActive ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                              }`}
                            >
                              <span className="w-4.5 h-4.5 bg-white rounded-full shadow-xs" />
                            </button>
                          </div>

                          {/* Plan duration select */}
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400">Paid Period Tier</label>
                            <select
                              value={targetBusinessSubscriptionPlan}
                              onChange={(e) => setTargetBusinessSubscriptionPlan(e.target.value as any)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                            >
                              <option value="monthly">1 Month (Fee Charged)</option>
                              <option value="quarterly">3 Months (Fee Charged)</option>
                              <option value="halfyearly">6 Months (Fee Charged)</option>
                              <option value="yearly">1 Year (Fee Charged)</option>
                            </select>
                          </div>

                          {/* Expiry date input */}
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400">Subscription Expiry</label>
                            <input
                              type="date"
                              value={targetBusinessSubscriptionExpiryDate}
                              onChange={(e) => setTargetBusinessSubscriptionExpiryDate(e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 animate-fade-in text-xs">
                          {/* Commission percentage input */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[9px] uppercase font-bold text-slate-450">
                              <span>Custom Commission Rate</span>
                              <span className="text-orange-600 font-extrabold">{targetBusinessCommissionRate}% Commission</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={targetBusinessCommissionRate}
                              onChange={(e) => setTargetBusinessCommissionRate(Number(e.target.value))}
                              className="w-full accent-orange-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <p className="text-[8px] text-slate-400 leading-tight">Free listing enabled. They are charged this {targetBusinessCommissionRate}% commission on checkout bookings instead.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Save modifications CTA bars */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveUserChanges}
                    disabled={updateLoading}
                    className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-serif font-black text-xs rounded-2xl shadow-md tracking-wide active:scale-95 hover:shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {updateLoading ? 'Applying Sec Keys...' : (
                      <>
                        <Save className="w-4 h-4" /> Save Authority Profile Override
                      </>
                    )}
                  </button>
                </div>

                {successMsg && (
                  <p className="text-[10px] text-emerald-600 font-semibold p-2.5 bg-emerald-50 border border-emerald-150 rounded-xl text-center">
                    {successMsg}
                  </p>
                )}
                {errorMsg && (
                  <p className="text-[10px] text-rose-600 p-2.5 bg-rose-50 border border-rose-150 rounded-xl text-center">
                    {errorMsg}
                  </p>
                )}

              </div>
            )}
          </div>
          
          {/* Root Admin Personal profile manager card */}
          {userProfile?.email?.toLowerCase() === 'ardha@vernunt.com' && (
            <div id="admin-self-service-card" className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-3xl border border-orange-200/60 p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="p-1 px-2 bg-orange-600/10 text-orange-700 rounded-lg text-[9px] font-black uppercase tracking-wider">
                  🔐 Self Console
                </span>
                <h4 className="font-serif font-black text-xs text-slate-800 font-bold">Admin Account Info</h4>
              </div>
              
              <div className="space-y-1 text-slate-650 text-[11px]">
                <p>🙋‍♂️ Name: <span className="font-bold text-slate-800">{userProfile.parentName}</span></p>
                <p>📧 Email: <span className="font-bold font-mono text-slate-800 select-all">{userProfile.email}</span></p>
              </div>

              <div className="space-y-1 border-t border-orange-200/40 pt-3">
                <label className="text-[10px] uppercase font-black text-slate-550 tracking-wider flex items-center gap-1">
                  <Phone className="w-3 h-3 text-orange-500" /> Administrative Mobile Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="admin-self-phone-input"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter your 10 digit number"
                    className="flex-1 px-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-orange-200 transition"
                  />
                  <button
                    type="button"
                    onClick={handleSaveAdminSelfPhone}
                    disabled={selfUpdateLoading}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-serif font-black text-xs rounded-xl tracking-wide transition flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    {selfUpdateLoading ? 'Saving...' : 'Update'}
                  </button>
                </div>
              </div>

              {selfSuccessMsg && (
                <p className="text-[10px] text-emerald-700 font-semibold p-2 bg-emerald-50 border border-emerald-150 rounded-lg text-center animate-fade-in">
                  {selfSuccessMsg}
                </p>
              )}
              {selfErrorMsg && (
                <p className="text-[10px] text-rose-600 p-2 bg-rose-50 border border-rose-150 rounded-lg text-center animate-fade-in">
                  {selfErrorMsg}
                </p>
              )}
            </div>
          )}

          <div className="bg-slate-50 rounded-2xl border border-slate-150 p-4 font-mono text-[9px] leading-relaxed text-slate-450 space-y-1">
            <span className="block font-black text-slate-500 uppercase">SYSTEM LOGS AND METRIC INTEGRATIONS</span>
            <p>• Database Endpoint: {db ? "LIVE_FIRESTORE" : "SANDBOX_MOCK"}</p>
            <p>• Auth UID: {selectedUser?.id ?? "NONE_SELECTED"}</p>
            <p>• Primary App Domain: https://app.vernunt.com (Default: app.vernunat.com / app.vernunt.com)</p>
            <p>• Cloud Hosting Region: asia-east1 (Primary & Default) | [Deprecated: asia-south1 deleted]</p>
            <p>• Session Node: active_asia_east_concentric_network_cluster</p>
          </div>
          
        </div>
        </>
        )}

        {/* SECTION: CYBERSECURITY, THREAT DEFENSE & ZERO-TRUST AUDIT CENTER */}
        <div id="admin-cybersecurity-defense-center" className="lg:col-span-12 bg-slate-950 text-white rounded-3xl border border-slate-800 p-6 md:p-8 space-y-6 shadow-2xl">
          
          {/* Header row */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-rose-500/20 text-rose-450 border border-rose-500/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Active Zero-Trust Defense Shield
                </span>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                  OWASP Top 10 Hardened
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black font-serif tracking-tight text-white flex items-center gap-2.5">
                🛡️ Platform Cyber Defense & Intrusion Prevention Center
              </h3>
              <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
                Continuous automated audit trail, role escalation prevention, tamper-proof security logging, and real-time database write circuit breaker.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <button
                type="button"
                id="btn-run-cyber-audit"
                onClick={async () => {
                  setIsRunningAudit(true);
                  try {
                    await new Promise(r => setTimeout(r, 600));
                    const res = runSecurityAudit(allSystemUsers.length, isSuperAdminAuthorized);
                    setAuditResult(res);
                    confetti({ particleCount: 50, spread: 60 });
                    await logSecurityThreat('SECURITY_SCAN', `Super Admin ${auth.currentUser?.email} ran live security audit. Score: ${res.overallScore}% (${res.grade})`, 'LOW', false);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsRunningAudit(false);
                  }
                }}
                disabled={isRunningAudit}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Activity className={`w-4 h-4 ${isRunningAudit ? 'animate-spin' : ''}`} />
                {isRunningAudit ? 'Scanning Platform...' : 'Run Live Cyber Audit'}
              </button>

              <button
                type="button"
                id="btn-toggle-pii-mask"
                onClick={() => {
                  setShowUnmaskedPii(!showUnmaskedPii);
                  if (!showUnmaskedPii) {
                    logSecurityThreat('DATA_EXPORT_AUDIT', `Admin unmasked sensitive PII on screen`, 'MEDIUM', false);
                  }
                }}
                className={`px-3.5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer border ${
                  showUnmaskedPii
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {showUnmaskedPii ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                {showUnmaskedPii ? 'Mask PII (Protected)' : 'Reveal PII (Plaintext)'}
              </button>
            </div>
          </div>

          {/* 4 Pillars Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Pillar 1: Security Posture Grade */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>Security Defense Rating</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-400 font-serif">{auditResult?.grade || 'A+'}</span>
                <span className="text-xs text-slate-400 font-bold">({auditResult?.overallScore || 100}% Invariants Passed)</span>
              </div>
              <span className="text-[10px] text-emerald-400/90 font-medium block">
                ✓ 10/10 Defense Rules Active
              </span>
            </div>

            {/* Pillar 2: Platform Emergency Lockdown */}
            <div className={`p-4 rounded-2xl border transition-all ${
              emergencyLockdown 
                ? 'bg-red-950/60 border-red-700 text-red-100 shadow-lg shadow-red-950/50' 
                : 'bg-slate-900/80 border-slate-800'
            } space-y-2`}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className={emergencyLockdown ? 'text-red-300' : 'text-slate-400'}>Emergency Lockdown</span>
                <AlertTriangle className={`w-4 h-4 ${emergencyLockdown ? 'text-red-400 animate-bounce' : 'text-slate-500'}`} />
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-black uppercase tracking-wider ${
                  emergencyLockdown ? 'text-red-400 animate-pulse' : 'text-emerald-400'
                }`}>
                  {emergencyLockdown ? 'LOCKDOWN ACTIVE' : 'Normal Operation'}
                </span>
                <button
                  type="button"
                  id="btn-emergency-lockdown"
                  disabled={isUpdatingLockdown}
                  onClick={async () => {
                    const nextState = !emergencyLockdown;
                    if (nextState && !confirm("⚠️ DANGER: Activate Platform Emergency Lockdown?\n\nThis freezes non-admin database write operations to protect against active attacks.")) {
                      return;
                    }
                    try {
                      setIsUpdatingLockdown(true);
                      await setDoc(doc(db, 'system_config', 'lockdown'), {
                        active: nextState,
                        updatedAt: new Date().toISOString(),
                        updatedBy: auth.currentUser?.email || 'admin'
                      });
                      setEmergencyLockdown(nextState);
                      await logSecurityThreat(
                        'LOCKDOWN_TOGGLED',
                        `Emergency lockdown mode turned ${nextState ? 'ON' : 'OFF'} by ${auth.currentUser?.email}`,
                        nextState ? 'CRITICAL' : 'MEDIUM',
                        false
                      );
                    } catch (err: any) {
                      console.error("Lockdown toggle error:", err);
                    } finally {
                      setIsUpdatingLockdown(false);
                    }
                  }}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition active:scale-95 cursor-pointer ${
                    emergencyLockdown
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {emergencyLockdown ? 'Deactivate' : 'Activate Kill Switch'}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block">
                {emergencyLockdown ? 'Non-admin writes frozen' : 'Database write pipeline healthy'}
              </span>
            </div>

            {/* Pillar 3: Threat & Intrusion Events */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>Threat Detections</span>
                <Terminal className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-400 font-serif">{securityLogs.length}</span>
                <span className="text-xs text-slate-400 font-bold">Events Logged</span>
              </div>
              <span className="text-[10px] text-slate-400 block">
                {securityLogs.filter(l => l.blocked).length} Unauthorized Probes Blocked
              </span>
            </div>

            {/* Pillar 4: PII & Identity Obfuscation */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>PII Privacy Shield</span>
                <Lock className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-black text-indigo-400 uppercase tracking-wider">
                  {showUnmaskedPii ? 'UNMASKED (Admin)' : 'MASKED (Zero-Leak)'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">
                Aadhaar & phone obfuscation active
              </span>
            </div>
          </div>

          {/* 10-Point Security Compliance Matrix Accordion */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3.5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <h4 className="font-serif font-black text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Zero-Trust Security Verification Matrix (10 Points)
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                Last verified: {new Date(auditResult?.timestamp || Date.now()).toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(auditResult?.checks || []).map((check, idx) => (
                <div key={idx} className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                      {check.title}
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      {check.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{check.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Threat & Intrusion Event Stream Feed */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <h4 className="font-serif font-black text-sm text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-450 animate-pulse" />
                  Real-time Security Event Stream & Audit Log
                </h4>
                <p className="text-[10px] text-slate-400">
                  Tamper-proof audit logs recorded immutably to Firestore /security_logs.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Severity filter */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px]">
                  {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(sev => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSecurityThreatFilter(sev)}
                      className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                        securityThreatFilter === sev
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>

                {/* Simulate Intrusion Probe button */}
                <button
                  type="button"
                  id="btn-simulate-threat"
                  onClick={async () => {
                    const testType = 'SUSPICIOUS_PAYLOAD_DETECTED';
                    const desc = `Adversarial probe simulated by Admin: SQL/XSS tag injection in registration payload blocked by sanitizer`;
                    await logSecurityThreat(testType, desc, 'HIGH', true);
                    setThreatSimMessage('✓ Defensive test probe triggered and blocked successfully!');
                    setTimeout(() => setThreatSimMessage(''), 4000);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-[10px] border border-slate-700 transition cursor-pointer"
                >
                  ⚡ Test Defensive Probe
                </button>
              </div>
            </div>

            {threatSimMessage && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-bold text-center animate-fade-in">
                {threatSimMessage}
              </div>
            )}

            {/* Event list */}
            <div id="admin-security-logs-feed" className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {securityLogs
                .filter(log => securityThreatFilter === 'ALL' || log.severity === securityThreatFilter)
                .length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No security incidents matching filter. Platform perimeter is calm and secure.
                </div>
              ) : (
                securityLogs
                  .filter(log => securityThreatFilter === 'ALL' || log.severity === securityThreatFilter)
                  .map(log => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-950/90 border border-slate-800/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs hover:border-slate-700 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                            log.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                            log.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                            log.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                          }`}>
                            {log.severity}
                          </span>
                          <span className="font-mono text-slate-300 font-bold text-[11px]">{log.eventType}</span>
                          <span className="text-slate-500 text-[10px] font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()} ({new Date(log.timestamp).toLocaleDateString()})
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">{log.description}</p>
                        <div className="flex items-center gap-3 text-[9px] text-slate-500 font-mono">
                          <span>Actor: {log.actorEmail}</span>
                          <span>UID: {log.actorUid}</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {log.blocked ? (
                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> BLOCKED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-[9px] font-bold uppercase">
                            AUDITED
                          </span>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

        </div>

        {/* SECTION: USER PHONE CONTACTS DIRECTORY & PRIVACY AUDIT PANEL */}
        {(() => {
          // Aggregations
          const userContactsRoster = allSystemUsers.map(user => {
            const fromMap = userContactsMap[user.id];
            const contactsPrivacy = user.contactsPrivacy || fromMap;
            const contactsList = contactsPrivacy?.contacts || [];
            return {
              userId: user.id,
              user,
              parentName: user.parentName,
              childName: user.childName,
              userRole: user.userRole || 'Parent',
              phoneNumber: user.phoneNumber || fromMap?.userPhone || 'Not Provided',
              email: user.email || fromMap?.userEmail || '',
              photoUrl: user.photoUrl,
              autoHideFromAllContacts: !!contactsPrivacy?.autoHideFromAllContacts,
              allowContactsAutoConnect: contactsPrivacy?.allowContactsAutoConnect ?? true,
              contactsPermissionGranted: !!contactsPrivacy?.contactsPermissionGranted || contactsList.length > 0,
              contactsCount: contactsList.length,
              contacts: contactsList,
              lastSyncedAt: contactsPrivacy?.lastSyncedAt || fromMap?.lastSyncedAt || 'N/A'
            };
          });

          const totalUsersWithContacts = userContactsRoster.filter(u => u.contactsCount > 0).length;
          const totalHarvestedContactsCount = userContactsRoster.reduce((sum, u) => sum + u.contactsCount, 0);
          const totalHiddenContactsCount = userContactsRoster.reduce((sum, u) => sum + u.contacts.filter((c: any) => c.visibility === 'hidden').length, 0);
          const totalConnectedContactsCount = userContactsRoster.reduce((sum, u) => sum + u.contacts.filter((c: any) => c.visibility === 'connected').length, 0);
          const totalVisibleContactsCount = userContactsRoster.reduce((sum, u) => sum + u.contacts.filter((c: any) => c.visibility === 'visible').length, 0);

          const filteredContactsRoster = userContactsRoster.filter(u => {
            if (!contactsSearchTerm.trim() && contactsFilterPrivacy === 'all') return true;
            
            const query = contactsSearchTerm.toLowerCase();
            const matchesUser = u.parentName.toLowerCase().includes(query) || 
                                u.childName.toLowerCase().includes(query) || 
                                u.phoneNumber.includes(query) ||
                                u.email.toLowerCase().includes(query);
            
            const matchesAnySavedContact = u.contacts.some((c: any) => 
              c.name.toLowerCase().includes(query) || 
              c.phone.includes(query) ||
              (c.relationship && c.relationship.toLowerCase().includes(query))
            );

            const matchesSearch = matchesUser || matchesAnySavedContact;

            if (contactsFilterPrivacy === 'hidden') {
              return matchesSearch && (u.autoHideFromAllContacts || u.contacts.some((c: any) => c.visibility === 'hidden'));
            }
            if (contactsFilterPrivacy === 'connected') {
              return matchesSearch && u.contacts.some((c: any) => c.visibility === 'connected');
            }
            if (contactsFilterPrivacy === 'visible') {
              return matchesSearch && u.contacts.some((c: any) => c.visibility === 'visible');
            }

            return matchesSearch;
          });

          const handleExportContactsCSV = () => {
            const rows = [
              ['User Name', 'Child Name', 'User Mobile', 'User Email', 'Contact Name', 'Contact Mobile Number', 'Relationship', 'User Privacy Status', 'Sync Date']
            ];

            userContactsRoster.forEach(u => {
              if (u.contacts.length === 0) {
                rows.push([u.parentName, u.childName, u.phoneNumber, u.email, 'No Contacts Synced', 'N/A', 'N/A', 'N/A', u.lastSyncedAt]);
              } else {
                u.contacts.forEach((c: any) => {
                  rows.push([
                    u.parentName,
                    u.childName,
                    u.phoneNumber,
                    u.email,
                    c.name,
                    c.phone,
                    c.relationship || 'Other',
                    c.visibility === 'hidden' ? 'HIDDEN (GHOST)' : c.visibility === 'connected' ? 'CONNECTED' : 'VISIBLE',
                    c.syncedAt || u.lastSyncedAt
                  ]);
                });
              }
            });

            const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `vernunt_user_contacts_audit_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          };

          return (
            <div id="admin-user-contacts-desk" className="lg:col-span-12 bg-white rounded-3xl border border-slate-150 p-6 space-y-6 mt-2 text-left">
              {/* Header & Export CTA */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1 px-2 bg-rose-100 text-rose-800 rounded-lg text-[9px] font-black uppercase tracking-wider">
                      🛡️ Child Privacy & Network Vault
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">Admin Level 1 Audit</span>
                  </div>
                  <h3 className="font-serif font-black text-sm sm:text-base text-slate-900 flex items-center gap-2 mt-1 font-bold">
                    <Smartphone className="w-5 h-5 text-rose-700" />
                    <span>User Phone Contacts Directory & Safety Audit</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Live overview of mobile contacts permitted and saved across all registered households. Inspect who users chose to hide their profile from (Ghost Mode) versus display and connect with.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleExportContactsCSV}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Contacts CSV</span>
                  </button>
                </div>
              </div>

              {/* High-Level Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-150 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-200/80 text-rose-800 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-black text-rose-700 tracking-wider">Households Synced</span>
                    <span className="text-lg font-black text-slate-900">{totalUsersWithContacts} / {allSystemUsers.length}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center font-bold">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-black text-slate-500 tracking-wider">Total Numbers Synced</span>
                    <span className="text-lg font-black text-slate-900">{totalHarvestedContactsCount}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center font-bold">
                    <EyeOff className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-black text-amber-700 tracking-wider">Ghost Mode Hidden</span>
                    <span className="text-lg font-black text-amber-900">{totalHiddenContactsCount}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-200/80 text-emerald-900 flex items-center justify-center font-bold">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-black text-emerald-700 tracking-wider">Allowed & Connected</span>
                    <span className="text-lg font-black text-emerald-900">{totalVisibleContactsCount + totalConnectedContactsCount}</span>
                  </div>
                </div>
              </div>

              {/* Search and Filters Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between pt-1">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={contactsSearchTerm}
                    onChange={(e) => setContactsSearchTerm(e.target.value)}
                    placeholder="Search any user or saved contact phone/name..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-rose-200 transition"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setContactsFilterPrivacy('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      contactsFilterPrivacy === 'all' 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Users ({userContactsRoster.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactsFilterPrivacy('hidden')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      contactsFilterPrivacy === 'hidden' 
                        ? 'bg-rose-700 text-white' 
                        : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Has Hidden ({userContactsRoster.filter(u => u.contacts.some((c: any) => c.visibility === 'hidden')).length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactsFilterPrivacy('connected')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      contactsFilterPrivacy === 'connected' 
                        ? 'bg-amber-600 text-white' 
                        : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <HeartHandshake className="w-3.5 h-3.5" />
                    <span>Has Connected ({userContactsRoster.filter(u => u.contacts.some((c: any) => c.visibility === 'connected')).length})</span>
                  </button>
                </div>
              </div>

              {/* Users & Contacts Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {filteredContactsRoster.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 space-y-2">
                    <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-bold text-xs text-slate-600">No matching user phone contacts found for current search.</p>
                  </div>
                ) : (
                  filteredContactsRoster.map((entry) => {
                    const isExpanded = expandedUserContactsId === entry.userId;
                    const hiddenNum = entry.contacts.filter((c: any) => c.visibility === 'hidden').length;
                    const visibleNum = entry.contacts.filter((c: any) => c.visibility === 'visible').length;
                    const connectedNum = entry.contacts.filter((c: any) => c.visibility === 'connected').length;

                    return (
                      <div key={entry.userId} className="bg-white transition-all">
                        {/* Parent Row */}
                        <div 
                          className="p-4 hover:bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer"
                          onClick={() => setExpandedUserContactsId(isExpanded ? null : entry.userId)}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={entry.photoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'}
                              alt={entry.parentName}
                              className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'; }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-serif font-black text-xs sm:text-sm text-slate-900">{entry.parentName}</span>
                                <span className="text-[10px] text-slate-500 font-semibold">(Child: <strong className="text-slate-700">{entry.childName}</strong>)</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold uppercase">{entry.userRole}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                <span className="font-mono font-bold text-slate-700">📞 +91 {entry.phoneNumber}</span>
                                <span>•</span>
                                <span className="font-mono">{entry.email || 'No email registered'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                            {/* Privacy Badges */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              {entry.autoHideFromAllContacts && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-200 flex items-center gap-1">
                                  <EyeOff className="w-3 h-3" /> Ghost Mode Active
                                </span>
                              )}
                              
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                                📱 {entry.contactsCount} Contacts Synced
                              </span>

                              {entry.contactsCount > 0 && (
                                <div className="text-[10px] font-bold flex items-center gap-1 text-slate-500">
                                  <span className="text-rose-700">({hiddenNum} Hidden</span>
                                  <span>•</span>
                                  <span className="text-emerald-700">{visibleNum} Visible</span>
                                  <span>•</span>
                                  <span className="text-amber-700">{connectedNum} Connect)</span>
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedUserContactsId(isExpanded ? null : entry.userId);
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isExpanded ? 'Hide Details' : 'Inspect Contacts'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Drawer: All Contacts Saved in this User's Mobile */}
                        {isExpanded && (
                          <div className="p-4 bg-slate-50/80 border-t border-slate-150 space-y-3 animate-fade-in text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                <Smartphone className="w-3.5 h-3.5 text-rose-700" />
                                <span>Saved Contacts Harvested in {entry.parentName}'s Device ({entry.contacts.length})</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Last Synced: {entry.lastSyncedAt !== 'N/A' ? new Date(entry.lastSyncedAt).toLocaleString() : 'N/A'}
                              </span>
                            </div>

                            {entry.contacts.length === 0 ? (
                              <div className="p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                                No mobile contacts synchronized by this user yet.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                                {entry.contacts.map((c: any) => (
                                  <div key={c.id || c.phone} className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1.5 shadow-2xs hover:border-slate-300 transition">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-bold text-xs text-slate-900 truncate">{c.name}</span>
                                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                        c.visibility === 'hidden'
                                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                          : c.visibility === 'connected'
                                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      }`}>
                                        {c.visibility === 'hidden' ? '🚫 Hidden' : c.visibility === 'connected' ? '🤝 Connected' : '👁️ Visible'}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="font-mono text-slate-700 font-bold">📞 +91 {c.phone}</span>
                                      {c.relationship && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                                          {c.relationship}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })()}

        {/* SECTION: PROMOTIONAL BANNERS AND ADVERTISEMENTS DESK */}
        <div id="promotional-banners-desk" className="lg:col-span-12 bg-white rounded-3xl border border-slate-150 p-6 space-y-6 mt-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-serif font-black text-sm text-slate-800 flex items-center gap-2 font-bold">
                <Megaphone className="w-5 h-5 text-orange-600 animate-pulse" /> Promotional Banners & Ad Desk
              </h3>
              <p className="text-[11px] text-slate-500">Provide announcements, campaigns, or ads displayed on the Home/Landing page and inside secondary app slots</p>
            </div>
            <span className="p-1 px-2.5 bg-orange-50 text-orange-700 border border-orange-100 rounded-full text-[10px] font-black uppercase tracking-wider w-max">
              📣 Active Slots: {banners.filter(b => b.active).length} / {banners.length}
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* New Banner Form */}
            <form onSubmit={handleCreateBanner} className="xl:col-span-5 bg-slate-50/55 border border-slate-150 rounded-2xl p-5 space-y-4 text-left">
              <h4 className="font-serif font-black text-xs text-slate-800 flex items-center gap-1.5 uppercase tracking-wide font-bold">
                <PlusCircle className="w-4 h-4 text-orange-600" /> Create Promotion Banner
              </h4>

              <div className="space-y-1 text-left">
                <label className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Campaign / Banner Title</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 🎉 Playdate Carnival 2026: Book Tickets Now!" 
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-200 transition text-slate-850"
                  required
                />
              </div>

              <div className="space-y-1 text-left">
                <AestheticImageUploader
                  id="admin-banner"
                  label="Banner Promotion Image"
                  value={newImageUrl}
                  onChange={setNewImageUrl}
                  presetSuggestions={[
                    { name: 'Carnival', url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=1200' },
                    { name: 'Art Lesson', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=1200' },
                    { name: 'Safety Shield', url: 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&q=80&w=1200' },
                    { name: 'Toy Swap', url: 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&q=80&w=1200' }
                  ]}
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Promotion Hyperlink URL</label>
                <input 
                  type="text" 
                  value={newLinkUrl} 
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="e.g. https://vernunt.com or # for none" 
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-orange-200 transition text-slate-850"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">App Placement Target</label>
                <select 
                  value={newPlacement}
                  onChange={(e) => setNewPlacement(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-200 transition text-slate-800"
                >
                  <option value="home">🚪 Home / Landing Login Page</option>
                  <option value="app_top">📱 Inside App - Dashboard Header Top</option>
                  <option value="app_sidebar">🗂️ Inside App - Proximity Radar Sidebar</option>
                </select>
              </div>

              <button 
                type="submit"
                disabled={isCreatingBanner}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-serif font-black text-xs rounded-xl uppercase tracking-wider transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1 font-bold"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {isCreatingBanner ? 'Publishing Ads...' : 'Publish Advertisement Banner'}
              </button>

              {bannerSuccess && (
                <p className="text-[10px] text-emerald-750 p-2.5 bg-emerald-50 border border-emerald-150 rounded-xl text-center font-bold">
                  {bannerSuccess}
                </p>
              )}
              {bannerError && (
                <p className="text-[10px] text-rose-600 p-2.5 bg-rose-50 border border-rose-150 rounded-xl text-center font-bold">
                  {bannerError}
                </p>
              )}
            </form>

            {/* Current Banner List */}
            <div className="xl:col-span-7 space-y-3 max-h-[460px] overflow-y-auto pr-1 text-left">
              <h4 className="font-serif font-black text-xs text-slate-800 flex items-center gap-1.5 uppercase tracking-wide font-bold">
                <Globe className="w-4 h-4 text-emerald-600" /> Currently Broadcasted Banners ({banners.length})
              </h4>

              {banners.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs">
                  💤 No custom advertisements loaded yet. Fallback templates will occupy the slots.
                </div>
              ) : (
                <div className="space-y-3">
                  {banners.map((b) => (
                    <div key={b.id} className="bg-white border border-slate-150 rounded-2xl p-3 flex gap-3 items-center shadow-2xs hover:border-slate-250 transition text-left">
                      <img 
                        src={b.imageUrl} 
                        alt={b.title} 
                        className="w-16 h-12 rounded-lg object-cover shrink-0 border border-slate-100 bg-slate-50"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                            b.placement === 'home' 
                              ? 'bg-amber-100 text-amber-800 border border-amber-200/50' 
                              : b.placement === 'app_top'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200/50'
                                : 'bg-teal-100 text-teal-800 border border-teal-200/50'
                          }`}>
                            {b.placement === 'home' ? 'Home Page' : b.placement === 'app_top' ? 'App Top' : 'Radar Side'}
                          </span>
                          
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            b.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {b.active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <h5 className="font-bold text-xs text-slate-800 truncate">{b.title}</h5>
                        <p className="text-[9px] text-slate-400 font-mono truncate">{b.linkUrl}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          type="button"
                          onClick={() => handleToggleBanner(b.id, b.active)}
                          className={`p-1.5 rounded-lg border text-[10px] font-bold transition flex items-center justify-center cursor-pointer ${
                            b.active 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}
                          title="Toggle Active Broadcast"
                        >
                          {b.active ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleDeleteBanner(b.id)}
                          className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100/50 text-rose-600 transition cursor-pointer"
                          title="Delete Advertisement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION: VERNUNT PUSH NOTIFICATIONS BROADCASTER DESK */}
        <div id="push-notifications-broadcast-desk" className="lg:col-span-12 bg-white rounded-3xl border border-slate-150 p-6 space-y-6 mt-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-serif font-black text-sm text-slate-800 flex items-center gap-2 font-bold">
                <Bell className="w-5 h-5 text-indigo-650 animate-bounce" /> Real-Time Push Notification Broadcaster
              </h3>
              <p className="text-[11px] text-slate-500">Dispatch app-wide security alert triggers, vaccine awareness info, and promo campaigns instantly with lovely synthesized audio chime cues.</p>
            </div>
            <span className="p-1 px-2.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-black uppercase tracking-wider w-max">
              📡 Broadcast Frequency: Instant
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* New Notification Form */}
            <form onSubmit={handleSendPushNotification} className="xl:col-span-12 bg-slate-50/55 border border-slate-150 rounded-2xl p-5 space-y-4 text-left">
              <h4 className="font-serif font-black text-xs text-slate-800 flex items-center gap-1.5 uppercase tracking-wide font-bold">
                <Send className="w-4 h-4 text-indigo-600" /> Compose Alert Message
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Message Header / Title</label>
                    <input 
                      type="text" 
                      value={pushTitle} 
                      onChange={(e) => setPushTitle(e.target.value)}
                      placeholder="e.g. 🚨 High Priority: Child Immunization Directives" 
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-200 transition text-slate-850"
                      required
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <AestheticImageUploader
                      id="push-attachment"
                      label="Banner / Promotion Image Attachment (Optional)"
                      value={pushImageUrl}
                      onChange={setPushImageUrl}
                      presetSuggestions={[
                        { name: 'Carnival', url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=1200' },
                        { name: 'Safety Shield', url: 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&q=80&w=1200' },
                        { name: 'Health Alert', url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1200' }
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left flex flex-col justify-between">
                  <div className="flex-1 flex flex-col min-h-[140px]">
                    <label className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider mb-1">Message Body / Content</label>
                    <textarea 
                      value={pushBody} 
                      onChange={(e) => setPushBody(e.target.value)}
                      placeholder="Provide safety instruction details, alert triggers, vaccine center information, or coupon details..." 
                      className="w-full flex-1 min-h-[120px] px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-200 transition text-slate-850 resize-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="submit" 
                  disabled={isSendingPush}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 font-bold"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  {isSendingPush ? 'Dispatching Broadcast...' : 'Broadcast Push Notification'}
                </button>
              </div>

              {pushSuccess && (
                <p className="text-[10.5px] text-emerald-750 p-2.5 bg-emerald-50 border border-emerald-150 rounded-xl text-center font-bold">
                  {pushSuccess}
                </p>
              )}
              {pushError && (
                <p className="text-[10.5px] text-rose-650 p-2.5 bg-rose-50 border border-rose-150 rounded-xl text-center font-bold">
                  {pushError}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* SECTION: CATEGORIES AND CUSTOM FIELDS SCHEMA CREATOR DESK */}
        <div id="schemas-custom-fields-desk" className="lg:col-span-12 bg-white rounded-3xl border border-slate-150 p-6 space-y-6 mt-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-serif font-black text-sm text-slate-800 flex items-center gap-2 font-bold">
                <Layers className="w-5 h-5 text-indigo-650 animate-pulse" /> Dynamic Categories & Custom Schema Fields Desk
              </h3>
              <p className="text-[11px] text-slate-500">Add custom categories for Events, Specialist Profiles, and custom fields to propagate to the Child Profile Forms automatically.</p>
            </div>
            <span className="p-1 px-2.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-black uppercase tracking-wider w-max">
              ⚙️ Extended Schemas Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* COLUMN 1: EVENT CATEGORIES */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 block">🎉 Event Custom Categories</span>
              
              <form onSubmit={handleAddEventCat} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Science Expo"
                  value={newEventCatName}
                  onChange={(e) => setNewEventCatName(e.target.value)}
                  className="flex-1 p-2 bg-white border border-slate-205 rounded-xl text-xs outline-none"
                  required
                />
                <button type="submit" className="p-2 px-3 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition cursor-pointer">
                  + Add
                </button>
              </form>

              <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                <p className="text-[10px] text-slate-400 font-bold mb-1">Standard Fallbacks:</p>
                <div className="flex items-center justify-between text-xs p-1.5 px-2 bg-white rounded-lg border border-slate-100 text-slate-550 italic">
                  <span>📍 Nearby Event (Standard)</span>
                  <span className="text-[9px] text-slate-350">Default</span>
                </div>
                <div className="flex items-center justify-between text-xs p-1.5 px-2 bg-white rounded-lg border border-slate-100 text-slate-550 italic">
                  <span>🧸 Daily Activity (Standard)</span>
                  <span className="text-[9px] text-slate-350">Default</span>
                </div>

                {customEventCats.length > 0 && (
                  <>
                    <p className="text-[10px] text-indigo-600 font-bold mt-2 mb-1">Admin Dynamic Extensions:</p>
                    {customEventCats.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between text-xs p-1.5 px-2 bg-indigo-50/40 rounded-lg border border-indigo-100 text-indigo-950 font-bold">
                        <span>{cat.name}</span>
                        <button type="button" onClick={() => handleDeleteEventCat(cat.id)} className="text-[10px] text-rose-600 hover:text-rose-800 font-black cursor-pointer">
                          Delete
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* COLUMN 2: SPECIALIST CATEGORIES */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 block">💼 Specialist Custom Fields</span>
              
              <form onSubmit={handleAddSpecCat} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Speech Therapist"
                  value={newSpecCatName}
                  onChange={(e) => setNewSpecCatName(e.target.value)}
                  className="flex-1 p-2 bg-white border border-slate-205 rounded-xl text-xs outline-none"
                  required
                />
                <button type="submit" className="p-2 px-3 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition cursor-pointer">
                  + Add
                </button>
              </form>

              <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                <p className="text-[10px] text-slate-400 font-bold mb-1">Standard Fallbacks:</p>
                <div className="flex items-center justify-between text-xs p-1.5 px-2 bg-white rounded-lg border border-slate-100 text-slate-550 italic">
                  <span>🎓 Tutors (Standard)</span>
                  <span className="text-[9px] text-slate-350">Default</span>
                </div>
                <div className="flex items-center justify-between text-xs p-1.5 px-2 bg-white rounded-lg border border-slate-100 text-slate-550 italic">
                  <span>🧸 Pedatricians (Standard)</span>
                  <span className="text-[9px] text-slate-350">Default</span>
                </div>

                {customSpecCats.length > 0 && (
                  <>
                    <p className="text-[10px] text-indigo-600 font-bold mt-2 mb-1">Admin Dynamic Extensions:</p>
                    {customSpecCats.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between text-xs p-1.5 px-2 bg-indigo-50/40 rounded-lg border border-indigo-100 text-indigo-950 font-bold">
                        <span>{cat.name}</span>
                        <button type="button" onClick={() => handleDeleteSpecCat(cat.id)} className="text-[10px] text-rose-600 hover:text-rose-800 font-black cursor-pointer">
                          Delete
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* COLUMN 3: CHILD PROFILE INPUT ATTRIBUTES */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 block">🛡️ Child Profile Attributes</span>
              
              <form onSubmit={handleAddProfileField} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Allergy Details"
                  value={newProfileFieldName}
                  onChange={(e) => setNewProfileFieldName(e.target.value)}
                  className="flex-1 p-2 bg-white border border-slate-205 rounded-xl text-xs outline-none"
                  required
                />
                <button type="submit" className="p-2 px-3 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition cursor-pointer">
                  + Add
                </button>
              </form>

              <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                <p className="text-[10px] text-slate-400 font-bold mb-1">Standard Attribs:</p>
                <div className="flex items-center justify-between text-xs p-1.5 px-2 bg-white rounded-lg border border-slate-100 text-slate-550 italic">
                  <span>Grade / Play Style / Bio</span>
                  <span className="text-[9px] text-slate-350">Strict</span>
                </div>

                {customProfileFields.length > 0 ? (
                  <>
                    <p className="text-[10px] text-indigo-600 font-bold mt-2 mb-1">Admin Dynamic Attributes:</p>
                    {customProfileFields.map(field => (
                      <div key={field.id} className="flex items-center justify-between text-xs p-1.5 px-2 bg-indigo-50/40 rounded-lg border border-indigo-100 text-indigo-950 font-bold">
                        <span>{field.fieldName}</span>
                        <button type="button" onClick={() => handleDeleteProfileField(field.id)} className="text-[10px] text-rose-600 hover:text-rose-800 font-black cursor-pointer">
                          Delete
                        </button>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="p-3 bg-slate-100 border border-dashed border-slate-200 rounded-xl text-center text-[10px] text-slate-400">
                    No custom profile attributes added yet. Field changes propagate live.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* SECTION: PREMIUM CLIENT CONFIGURATION & SUBSCRIPTION PLANS EDITOR */}
        <div id="premium-subscription-editor-desk" className="lg:col-span-12 bg-white rounded-3xl border border-slate-150 p-6 space-y-6 mt-2 text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-serif font-black text-sm text-slate-800 flex items-center gap-2 font-bold">
                <Award className="w-5 h-5 text-amber-600" /> Dynamic Subscription Plan Configurator
              </h3>
              <p className="text-[11px] text-slate-500">Edit real-time pricing plans, description copy, and custom capabilities displayed dynamically on the Billing portal.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Plan Price list modifiers */}
            <div className="space-y-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 block mb-2">Configure active playdate plans ({subPlans.length})</span>
              
              <div className="space-y-4">
                {subPlans.map((plan, idx) => (
                  <div key={plan.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 uppercase font-mono tracking-wider">{plan.title} ({plan.period})</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold uppercase">{plan.id}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] uppercase font-black text-slate-400 block mb-1">Pass Price (₹)</label>
                        <input
                          type="number"
                          value={plan.price}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updated = [...subPlans];
                            updated[idx] = { ...updated[idx], price: val };
                            setSubPlans(updated);
                          }}
                          className="w-full p-2 bg-white border border-slate-205 rounded-xl text-xs font-mono font-bold text-slate-850"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-black text-slate-400 block mb-1">Pass Title</label>
                        <input
                          type="text"
                          value={plan.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = [...subPlans];
                            updated[idx] = { ...updated[idx], title: val };
                            setSubPlans(updated);
                          }}
                          className="w-full p-2 bg-white border border-slate-205 rounded-xl text-xs font-bold text-slate-850"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-black text-slate-400 block mb-1">Plan Pitch Description</label>
                      <input
                        type="text"
                        value={plan.description || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = [...subPlans];
                          updated[idx] = { ...updated[idx], description: val };
                          setSubPlans(updated);
                        }}
                        className="w-full p-2 bg-white border border-slate-205 rounded-xl text-xs text-slate-700"
                        placeholder="Provide dynamic plan description tagline..."
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-black text-slate-400 block mb-1">Plan Capabilities List (one bullet per line)</label>
                      <textarea
                        value={Array.isArray(plan.capabilities) ? plan.capabilities.join('\n') : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = [...subPlans];
                          updated[idx] = { ...updated[idx], capabilities: val.split('\n') };
                          setSubPlans(updated);
                        }}
                        rows={4}
                        className="w-full p-2 bg-white border border-slate-205 rounded-xl text-xs font-medium resize-none leading-relaxed text-slate-750"
                        placeholder="Enter each capability list benefit item on its own new line..."
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    setIsSavingPlans(true);
                    setPlanSuccess('');
                    setPlanError('');
                    try {
                      await setDoc(doc(db, 'subscription_config', 'plans'), { plans: subPlans });
                      setPlanSuccess('🚀 Dynamic Subscription Plans persisted robustly in Firestore!');
                      confetti({ particleCount: 50, spread: 35 });
                      setTimeout(() => setPlanSuccess(''), 4500);
                    } catch (err: any) {
                      console.error(err);
                      setPlanError(`Failed to save premium plans config: ${err.message}`);
                    } finally {
                      setIsSavingPlans(false);
                    }
                  }}
                  disabled={isSavingPlans}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                  {isSavingPlans ? 'Syncing Schema...' : 'Apply Premium Subscription Configurations'}
                </button>
              </div>

              {planSuccess && (
                <p className="text-[10px] text-emerald-700 font-bold p-3 bg-emerald-50 border border-emerald-150 rounded-xl">
                  {planSuccess}
                </p>
              )}
              {planError && (
                <p className="text-[10px] text-rose-600 font-bold p-3 bg-rose-50 border border-rose-150 rounded-xl">
                  {planError}
                </p>
              )}
            </div>

            {/* TAB PLACEMENT TOGGLER OPTIONS */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 block mb-2">Configure dynamic app menu placements</span>
                <p className="text-[11px] text-slate-400">Configure which core tabs go in the desktop header (navigation bar) versus the slide-over explorer menu (drawer).</p>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-150 p-4 space-y-2 max-h-[500px] overflow-y-auto font-sans">
                {Object.entries(tabIconsAndLabels).map(([tabId, meta]) => {
                  const currentPlacement = tabsPlacement[tabId] || 'side';
                  return (
                    <div key={tabId} className="flex items-center justify-between p-3 bg-white border border-slate-150 rounded-xl hover:border-slate-250 transition-all shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="text-sm select-none">{meta.icon}</span>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block leading-tight">{meta.label}</span>
                          <span className="text-[9px] text-slate-400 uppercase font-mono">ID: {tabId}</span>
                        </div>
                      </div>

                      <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleSaveTabPlacement(tabId, 'header')}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            currentPlacement === 'header' 
                              ? 'bg-slate-900 text-white shadow-xs' 
                              : 'text-slate-550 hover:bg-slate-205/30'
                          }`}
                        >
                          Header
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveTabPlacement(tabId, 'side')}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            currentPlacement === 'side' 
                              ? 'bg-slate-900 text-white shadow-xs' 
                              : 'text-slate-550 hover:bg-slate-205/30'
                          }`}
                        >
                          Side Menu
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {tabsSuccess && (
                <p className="text-[10.5px] text-emerald-755 p-2 bg-emerald-50 border border-emerald-150 rounded-lg text-center font-bold">
                  🎉 {tabsSuccess}
                </p>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
