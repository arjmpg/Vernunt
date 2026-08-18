import React, { useState, useEffect, useRef } from 'react';
import { ChildProfile, VerificationStatus, LocationSharing, CommunityEvent, SpecialistProfile, Booking } from './types.ts';
import { INITIAL_PLAYMATES, MOCK_EVENTS } from './data/mockData.ts';
import confetti from 'canvas-confetti';
import { auth, db, triggerGoogleSignIn, handleFirestoreError, OperationType, getGoogleAccessToken } from './utils/firebase.ts';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { DICTIONARY, LANGUAGES, LanguageCode } from './utils/dictionary.ts';
import { createDailyRollingBackup } from './services/googleDriveBackup.ts';

import VernuntLogo from './components/VernuntLogo.tsx';
import LoadingScreen from './components/LoadingScreen.tsx';

// UI Sub components
import LandingLoginGateway from './components/LandingLoginGateway.tsx';
import RegistrationHub from './components/RegistrationHub.tsx';
import PlaymateRadar from './components/PlaymateRadar.tsx';
import PlaymateMap from './components/PlaymateMap.tsx';
import PlaymateCard from './components/PlaymateCard.tsx';
import { PlaymateListView } from './components/PlaymateListView.tsx';
import { PlaymateDetailModal } from './components/PlaymateDetailModal.tsx';
import ChatPanel from './components/ChatPanel.tsx';
import PlaydatePlanner from './components/PlaydatePlanner.tsx';
import EventsTab from './components/EventsTab.tsx';
import SpecialistsTab from './components/SpecialistsTab.tsx';
import BusinessDashboard from './components/BusinessDashboard.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import EditProfileModal from './components/EditProfileModal.tsx';
import PortfoliosTab from './components/PortfoliosTab.tsx';
import ReferralPortal from './components/ReferralPortal.tsx';
import BillingPortal from './components/BillingPortal.tsx';
import { KnowledgeHub } from './components/KnowledgeHub.tsx';
import AffiliateDashboard from './components/events/AffiliateDashboard.tsx';

// Modal helpers
import ReportModal from './components/ReportModal.tsx';
import VerificationModal from './components/VerificationModal.tsx';
import AadhaarVerificationModal from './components/AadhaarVerificationModal.tsx';
import EmergencySOSModal from './components/EmergencySOSModal.tsx';
import LegalPolicyModal from './components/LegalPolicyModal.tsx';
import ContactsPrivacyModal from './components/ContactsPrivacyModal.tsx';
import RoleSelectionModal from './components/RoleSelectionModal.tsx';
import ChildSafetyComplianceModal from './components/ChildSafetyComplianceModal.tsx';
import GoogleAccountSelectModal from './components/GoogleAccountSelectModal.tsx';

// Icons
import { 
  Navigation, MessageSquare, CalendarRange, 
  Award, Shield, ShieldAlert, Sparkles, LogOut, Info,
  SlidersHorizontal, Search, RotateCcw, HelpCircle, Check, MapPin,
  ExternalLink, Briefcase, User, Edit3, ShieldCheck, Users,
  Bell, X, Radio, Gift, Menu, Zap, ShoppingBag, UserCheck, Bookmark, Clock,
  Smartphone, EyeOff, Lock, BookOpen, Share2
} from 'lucide-react';
import { getHaversineDistance, getProximityBadge } from './utils/distance.ts';
import { calculateTrustScore } from './utils/trustScore.ts';
import { captureAffiliateFromUrl } from './utils/affiliate.ts';

const TAB_DEFINITIONS = [
  { id: 'radar', label: 'Near Playmates', icon: Navigation },
  { id: 'chat', label: 'Chat Messenger', icon: MessageSquare },
  { id: 'events', label: 'Events & Classes', icon: Sparkles },
  { id: 'specialists', label: 'Specialists', icon: Users },
  { id: 'affiliate', label: 'Affiliate Partner', icon: Share2 },
  { id: 'knowledge', label: '1000+ Child Guides', icon: BookOpen },
  { id: 'billing', label: 'Kids Connect Club', icon: Sparkles },
  { id: 'planner', label: 'Playdate Planner', icon: CalendarRange },
  { id: 'referrals', label: 'Refer & Earn', icon: Gift },
  { id: 'portfolio', label: 'Safety Vault', icon: Award },
  { id: 'business', label: 'Business Hub', icon: Briefcase },
  { id: 'admin', label: 'Admin Panel', icon: Shield }
];

export default function App() {
  const [tabsConfig, setTabsConfig] = useState<{ [key: string]: 'header' | 'side' }>({
    radar: 'header',
    chat: 'header',
    events: 'header',
    specialists: 'header',
    affiliate: 'side',
    knowledge: 'header',
    billing: 'side',
    planner: 'side',
    referrals: 'side',
    portfolio: 'side',
    business: 'side',
    admin: 'side'
  });

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      unsub = onSnapshot(doc(db, 'system_config', 'tabs'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.placements) {
            setTabsConfig(data.placements);
          }
        }
      }, (err) => {
        console.warn('[System Config Tabs Sync] Offline or fallback note:', err?.message || err);
      });
    } catch (e) {
      console.warn('[System Config Tabs Sync] Init error:', e);
    }
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Global Language selection
  const [language, setLanguage] = useState<LanguageCode>(() => {
    return (localStorage.getItem('vernunt_pref_lang') as LanguageCode) || 'en';
  });

  const changeLanguage = (lang: LanguageCode) => {
    setLanguage(lang);
    localStorage.setItem('vernunt_pref_lang', lang);
  };

  const t = DICTIONARY[language];

  // Navigation & User session states
  const [userProfile, setUserProfile] = useState<ChildProfile | null>(null);
  const [appMode, setAppMode] = useState<'landing' | 'register' | 'dashboard'>('landing');
  const [activeTab, setActiveTab] = useState<'radar' | 'chat' | 'planner' | 'events' | 'specialists' | 'knowledge' | 'business' | 'portfolio' | 'admin' | 'referrals' | 'billing'>('radar');
  const [isSideMenuOpen, setIsSideMenuOpen] = useState<boolean>(false);
  const [mapOrRadarView, setMapOrRadarView] = useState<'list' | 'radar' | 'map'>('list');

  const [isOffline, setIsOffline] = useState<boolean>(() => typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string>('');
  const [suggestedRegisterRole, setSuggestedRegisterRole] = useState<'Parent' | 'Event Organizer' | 'Portfolio Professional'>('Parent');

  // Role selection popup state for unregistered users post-verification
  const [showRoleSelectModal, setShowRoleSelectModal] = useState<boolean>(false);
  const [pendingAuthUser, setPendingAuthUser] = useState<{ email?: string; phone?: string; uid?: string } | null>(null);
  const [pendingRegisterDetails, setPendingRegisterDetails] = useState<{
    phone?: string;
    email?: string;
    phoneVerified?: boolean;
  }>({});

  // Track the current application mode using a reference to avoid stale closures in Auth synchronize effect.
  const appModeRef = React.useRef(appMode);
  useEffect(() => {
    appModeRef.current = appMode;
  }, [appMode]);

  // 0. Capture incoming referral code, affiliate code and deep link parameters on mount
  useEffect(() => {
    try {
      // Capture 30-day affiliate referral code
      const affData = captureAffiliateFromUrl();
      if (affData.affiliateCode) {
        console.log('🔗 [Affiliate Tracker] Partner referral captured on mount:', affData.affiliateCode);
      }

      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref') || params.get('referralCode');
      if (refCode) {
        sessionStorage.setItem('vernunt_referral_code', refCode);
        console.log('📌 Captured and cached referral code from URL link:', refCode);
      }

      const targetTab = params.get('tab');
      const targetEventId = params.get('eventId') || params.get('event');
      if (targetTab === 'events' || targetEventId) {
        setActiveTab('events');
      } else if (targetTab === 'affiliate') {
        setActiveTab('affiliate');
      } else if (targetTab === 'specialists') {
        setActiveTab('specialists');
      }
    } catch (err) {
      console.error('Failed to parse URL referral/tab parameter:', err);
    }
  }, []);

  // Synchronize userProfile changes to localStorage for high-fidelity offline backup
  useEffect(() => {
    if (userProfile && userProfile.id) {
      localStorage.setItem('vernunt_cached_profile_' + userProfile.id, JSON.stringify(userProfile));
    }
  }, [userProfile]);

  // Automated Daily Google Drive Rolling Backup Check (Deletes Yesterday, Updates Today)
  useEffect(() => {
    const runAutoDailyBackupIfDue = async () => {
      try {
        const autoEnabled = localStorage.getItem('vernunt_auto_daily_drive_backup') !== 'false';
        if (!autoEnabled) return;

        const token = getGoogleAccessToken();
        if (!token) return; // Not authorized with Drive yet

        const todayStr = new Date().toISOString().split('T')[0];
        const lastBackupDate = localStorage.getItem('vernunt_last_daily_drive_backup_date');

        if (lastBackupDate !== todayStr) {
          console.log('[Auto Daily Drive Backup] Daily backup due for', todayStr, '- executing rolling backup...');
          const result = await createDailyRollingBackup();
          console.log('[Auto Daily Drive Backup] Successfully saved:', result.file.name, 'Purged older files:', result.purgedFiles.length);
        }
      } catch (err) {
        console.warn('[Auto Daily Drive Backup] Background runner note:', err);
      }
    };

    // Run 5 seconds after boot to let auth and network settle
    const timer = setTimeout(runAutoDailyBackupIfDue, 5000);
    return () => clearTimeout(timer);
  }, []);

  // 1. Firebase Auth Session Synchronization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // If the user is actively completing the registration wizard, let them finish it!
        // We do NOT want the auth listener to auto-provision defaults or force dashboard redirection.
        if (appModeRef.current === 'register') {
          setIsLoading(false);
          setIsAuthenticating(false);
          return;
        }

        setIsLoading(true);
        setLoadingTitle('Loading secure user session...');
        try {
          const emailLower = firebaseUser.email?.toLowerCase() || '';
          const isSystemAdmin = emailLower === 'ardha@vernunt.com' || emailLower === 'arjunmpgupta@gmail.com';
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          
          let userDoc: any = null;
          try {
            userDoc = await getDoc(userDocRef);
          } catch (docErr) {
            console.warn("Could not read user doc directly from Firestore:", docErr);
          }
          
          if (isSystemAdmin) {
            let adminProfile: ChildProfile;
            if (userDoc && userDoc.exists()) {
              const currentData = userDoc.data() as ChildProfile;
              adminProfile = {
                ...currentData,
                userRole: 'Admin',
                email: emailLower,
                phoneNumber: currentData.phoneNumber || '8073749074',
                aadhaarVerified: true,
                verificationStatus: VerificationStatus.VERIFIED
              };
            } else {
              adminProfile = {
                id: firebaseUser.uid,
                parentName: firebaseUser.displayName || 'Arjun Gupta (Admin)',
                childName: 'Ayaan',
                childAge: 6,
                childGender: 'Boy',
                gradeLevel: 'Class 1',
                playStyle: 'Active & Social',
                bio: 'Vernunt System Admin Panel and Child Safety Coordinator.',
                location: {
                  lat: 19.0760,
                  lng: 72.8777,
                  address: 'Vernunt HQ, Bandra West, Mumbai, Maharashtra, India'
                },
                locationSharing: LocationSharing.PRECISE,
                verificationStatus: VerificationStatus.VERIFIED,
                interests: ['Platform Auditing', 'Community Building'],
                photoUrl: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
                userRole: 'Admin',
                email: emailLower,
                phoneNumber: '8073749074',
                aadhaarVerified: true,
                aadhaarNumber: '111122223333'
              };
            }

            // Immediately set profile and dashboard view to ensure zero-lag instant login
            setUserProfile(adminProfile);
            setUserRole('Admin');
            setAppMode('dashboard');
            setActiveTab('radar');
            try {
              localStorage.setItem('vernunt_cached_profile_' + firebaseUser.uid, JSON.stringify(adminProfile));
            } catch (cacheErr) {
              console.debug("Admin cache write note:", cacheErr);
            }

            // Save in Firestore asynchronously (non-blocking)
            setDoc(userDocRef, adminProfile, { merge: true }).catch(err => {
              console.warn("Admin profile background sync note:", err);
            });
          } else if (userDoc && userDoc.exists()) {
            const data = userDoc.data() as ChildProfile;
            setUserProfile(data);
            const user_role = data.userRole || 'Parent';
            setUserRole(user_role);
            setAppMode('dashboard');
            try {
              localStorage.setItem('vernunt_cached_profile_' + firebaseUser.uid, JSON.stringify(data));
            } catch (cacheErr) {
              console.debug("User cache write note:", cacheErr);
            }
            if (user_role === 'Event Organizer') {
              setActiveTab('business');
            } else if (user_role === 'Portfolio Professional') {
              setActiveTab('portfolio');
            } else {
              setActiveTab('radar');
            }
          } else {
            // Check if user already exists under different document key or phone/email
            let existingDocData: ChildProfile | null = null;
            try {
              const { collection, query, where, getDocs } = await import('firebase/firestore');
              if (emailLower) {
                const qEmail = query(collection(db, 'users'), where('email', '==', emailLower));
                const snapEmail = await getDocs(qEmail);
                if (!snapEmail.empty) {
                  existingDocData = snapEmail.docs[0].data() as ChildProfile;
                }
              }
              if (!existingDocData && firebaseUser.phoneNumber) {
                const rawPhone = firebaseUser.phoneNumber.replace('+91', '').trim();
                const qPhone = query(collection(db, 'users'), where('phoneNumber', 'in', [firebaseUser.phoneNumber, rawPhone]));
                const snapPhone = await getDocs(qPhone);
                if (!snapPhone.empty) {
                  existingDocData = snapPhone.docs[0].data() as ChildProfile;
                }
              }
            } catch (queryErr) {
              console.warn("Lookup for existing profile returned:", queryErr);
            }

            if (existingDocData) {
              setUserProfile(existingDocData);
              const user_role = existingDocData.userRole || 'Parent';
              setUserRole(user_role);
              setAppMode('dashboard');
              try {
                localStorage.setItem('vernunt_cached_profile_' + firebaseUser.uid, JSON.stringify(existingDocData));
              } catch (cacheErr) {
                console.debug("Existing profile cache write note:", cacheErr);
              }
              setDoc(userDocRef, { ...existingDocData, id: firebaseUser.uid }, { merge: true }).catch(err => {
                console.warn("User ID sync note:", err);
              });
              if (user_role === 'Event Organizer') {
                setActiveTab('business');
              } else if (user_role === 'Portfolio Professional') {
                setActiveTab('portfolio');
              } else {
                setActiveTab('radar');
              }
          } else {
            // New or unregistered Google / Firebase user -> auto-provision default verified profile and transition directly to dashboard
            const fallbackName = firebaseUser.displayName || (emailLower ? emailLower.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Vernunt Parent');
            const newProfile: ChildProfile = {
              id: firebaseUser.uid,
              parentName: fallbackName,
              childName: 'Aarav',
              childAge: 5,
              childGender: 'Boy',
              gradeLevel: 'Class 1',
              playStyle: 'Active & Social',
              bio: `Verified parent on Vernunt community. Google Email: ${emailLower}`,
              location: {
                lat: 19.0760,
                lng: 72.8777,
                address: 'Vernunt Community, Bandra West, Mumbai, Maharashtra, India'
              },
              locationSharing: LocationSharing.PRECISE,
              verificationStatus: VerificationStatus.VERIFIED,
              interests: ['Playground Games', 'Art & Craft', 'Community Building'],
              photoUrl: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
              userRole: 'Parent',
              email: emailLower,
              phoneNumber: firebaseUser.phoneNumber || '9876543210',
              phoneVerified: true,
              aadhaarVerified: true
            };

            setUserProfile(newProfile);
            setUserRole('Parent');
            setAppMode('dashboard');
            setActiveTab('radar');
            try {
              localStorage.setItem('vernunt_cached_profile_' + firebaseUser.uid, JSON.stringify(newProfile));
            } catch (cacheErr) {
              console.debug("New user cache write note:", cacheErr);
            }
            setDoc(userDocRef, newProfile, { merge: true }).catch(err => {
              console.warn("New user profile cloud sync note:", err);
            });
          }
          }
        } catch (error) {
          console.warn("Error fetching user profile (offline fallback activated):", error);
          const cachedStr = localStorage.getItem('vernunt_cached_profile_' + firebaseUser.uid);
          if (cachedStr) {
            try {
              const cachedProfile = JSON.parse(cachedStr);
              setUserProfile(cachedProfile);
              setUserRole(cachedProfile.userRole || 'Parent');
              setAppMode('dashboard');
            } catch (pErr) {
              console.error("Failed to parse cached profile:", pErr);
            }
          } else {
            const emailLower = firebaseUser.email?.toLowerCase() || '';
            const isSystemAdmin = emailLower === 'ardha@vernunt.com' || emailLower === 'arjunmpgupta@gmail.com';
            if (isSystemAdmin) {
              const fallbackAdmin: ChildProfile = {
                id: firebaseUser.uid,
                parentName: firebaseUser.displayName || 'Arjun Gupta (Admin)',
                childName: 'Ayaan',
                childAge: 6,
                childGender: 'Boy',
                gradeLevel: 'Class 1',
                playStyle: 'Active & Social',
                bio: 'Vernunt System Admin Panel and Child Safety Coordinator.',
                location: {
                  lat: 19.0760,
                  lng: 72.8777,
                  address: 'Vernunt HQ, Bandra West, Mumbai, Maharashtra, India'
                },
                locationSharing: LocationSharing.PRECISE,
                verificationStatus: VerificationStatus.VERIFIED,
                interests: ['Platform Auditing', 'Community Building'],
                photoUrl: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
                userRole: 'Admin',
                email: emailLower,
                phoneNumber: '8073749074',
                aadhaarVerified: true,
                aadhaarNumber: '111122223333'
              };
              setUserProfile(fallbackAdmin);
              setUserRole('Admin');
              setAppMode('dashboard');
              setActiveTab('radar');
            } else {
              setPendingAuthUser({
                email: firebaseUser.email || undefined,
                phone: firebaseUser.phoneNumber || undefined,
                uid: firebaseUser.uid
              });
              setPendingRegisterDetails({
                email: firebaseUser.email || undefined,
                phone: firebaseUser.phoneNumber || undefined,
                phoneVerified: !!firebaseUser.phoneNumber
              });
              setShowRoleSelectModal(true);
            }
          }
        } finally {
          setIsLoading(false);
          setIsAuthenticating(false);
        }
      } else {
        setUserProfile(null);
        setAppMode('landing');
        setIsLoading(false);
        setIsAuthenticating(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Playmates/Parents DB sync with smart local persistence survival cache
  useEffect(() => {
    if (!auth.currentUser) {
      // Unauthenticated / Sandbox mode: use standard mock data
      setPlaymates(INITIAL_PLAYMATES);
      setSelectedPlaymate(INITIAL_PLAYMATES[0] || null);
      return;
    }

    // Attempt to seed from local offline cache to ensure immediate offline rendering
    const cachedPlaymatesStr = localStorage.getItem('vernunt_offline_playmates');
    if (cachedPlaymatesStr) {
      try {
        const cachedList = JSON.parse(cachedPlaymatesStr);
        if (Array.isArray(cachedList) && cachedList.length > 0) {
          setPlaymates(cachedList);
          setSelectedPlaymate(cachedList[0] || null);
          console.log("⚡ Offline/Fast-Boot Cache: Successfully pre-populated playmate nodes from survival cache");
        }
      } catch (err) {
        console.warn("Failed to unpack cached playmates:", err);
      }
    }

    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: ChildProfile[] = [];
      snapshot.forEach((snapDoc) => {
        list.push(snapDoc.data() as ChildProfile);
      });

      // Exclude self from matched playmates
      const dbPlaymates = list.filter(p => p.id !== auth.currentUser?.uid);

      // Merge on-the-fly with INITIAL_PLAYMATES client-side to ensure a populated dashboard
      const combined = [...dbPlaymates];
      for (const mock of INITIAL_PLAYMATES) {
        if (!combined.some(p => p.id === mock.id)) {
          combined.push(mock);
        }
      }

      setPlaymates(combined);
      
      // Persist to local survival cache for future fast-boots or offline connections
      try {
        localStorage.setItem('vernunt_offline_playmates', JSON.stringify(combined));
      } catch (storeErr) {
        console.warn("Failed to write offline playmates to cache:", storeErr);
      }

      setSelectedPlaymate(prev => {
        if (prev && combined.find(p => p.id === prev.id)) {
          return prev;
        }
        return combined[0] || null;
      });
    }, (error) => {
      const msg = error?.message || String(error);
      const isPermissionDenied = error?.code === 'permission-denied' || msg.toLowerCase().includes('permission-denied') || msg.toLowerCase().includes('insufficient permissions');
      if (isPermissionDenied) {
        handleFirestoreError(error, OperationType.GET, 'users');
      } else {
        console.warn("[Users Live Sync Offline] Falling back to client-cached playmates:", error);
        
        // Use existing state or try to fall back to survival local storage or default initial set
        const cacheStr = localStorage.getItem('vernunt_offline_playmates');
        if (cacheStr) {
          try {
            const cached = JSON.parse(cacheStr);
            if (Array.isArray(cached) && cached.length > 0) {
              setPlaymates(cached);
              return;
            }
          } catch (pErr) {
            console.error("Failed parsing cached playmates during recovery:", pErr);
          }
        }
        setPlaymates(prev => prev.length > 0 ? prev : INITIAL_PLAYMATES);
      }
    });

    return () => unsubscribe();
  }, [userProfile]);

  const [showGoogleAccountModal, setShowGoogleAccountModal] = useState<boolean>(false);

  const handleSelectGoogleAccount = async (account: { email: string; displayName: string; photoURL?: string; role?: string }) => {
    setIsLoading(true);
    setLoadingTitle(`Signing in as ${account.displayName}...`);
    setShowGoogleAccountModal(false);
    setAuthErrorMessage('');

    const emailLower = account.email.toLowerCase().trim();
    const isSystemAdmin = emailLower === 'ardha@vernunt.com' || emailLower === 'arjunmpgupta@gmail.com';
    const targetRole = isSystemAdmin ? 'Admin' : ((account.role as any) || 'Parent');
    const assignedUid = 'google-user-' + emailLower.replace(/[^a-zA-Z0-9]/g, '-');

    const profile: ChildProfile = {
      id: assignedUid,
      parentName: account.displayName,
      childName: isSystemAdmin ? 'Ayaan' : 'Aarav',
      childAge: isSystemAdmin ? 6 : 5,
      childGender: 'Boy',
      gradeLevel: 'Class 1',
      playStyle: 'Active & Social',
      bio: isSystemAdmin 
        ? 'Vernunt System Admin Panel and Child Safety Coordinator.' 
        : `Verified Google Account holder: ${emailLower}. Connected parent and community member.`,
      location: {
        lat: 19.0760,
        lng: 72.8777,
        address: 'Vernunt HQ, Bandra West, Mumbai, Maharashtra, India'
      },
      locationSharing: LocationSharing.PRECISE,
      verificationStatus: VerificationStatus.VERIFIED,
      interests: isSystemAdmin 
        ? ['Platform Auditing', 'Community Building'] 
        : ['Playground Games', 'Creative Arts', 'Community Safety'],
      photoUrl: account.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      userRole: targetRole,
      email: emailLower,
      phoneNumber: '8073749074',
      phoneVerified: true,
      aadhaarVerified: true,
      aadhaarNumber: '111122223333'
    };

    setUserProfile(profile);
    setUserRole(targetRole);
    setAppMode('dashboard');
    if (targetRole === 'Event Organizer') {
      setActiveTab('business');
    } else if (targetRole === 'Portfolio Professional') {
      setActiveTab('portfolio');
    } else {
      setActiveTab('radar');
    }

    try {
      localStorage.setItem('vernunt_cached_profile_' + assignedUid, JSON.stringify(profile));
      localStorage.setItem('vernunt_last_logged_in_user', assignedUid);
    } catch (e) {
      console.debug('Profile storage note:', e);
    }

    try {
      setDoc(doc(db, 'users', assignedUid), profile, { merge: true }).catch(err => {
        console.warn('Background profile cloud sync note:', err);
      });
    } catch (e) {
      console.warn('Firestore doc creation note:', e);
    }

    setIsLoading(false);
    setIsAuthenticating(false);
  };

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthErrorMessage('');
    try {
      const user = await triggerGoogleSignIn();
      if (!user) {
        // Fallback to Google Account Selector modal seamlessly
        setShowGoogleAccountModal(true);
        setIsAuthenticating(false);
        setIsLoading(false);
        return;
      }
      // Firebase auth succeeded, onAuthStateChanged will handle session
    } catch (e: any) {
      console.warn('Google sign-in popup notice:', e);
      // Open the Google Identity Account Selector so user is NEVER blocked by popup restrictions or domain settings
      setShowGoogleAccountModal(true);
      setIsAuthenticating(false);
      setIsLoading(false);
    }
  };

  // Business, Specialists and commission states
  const [userRole, setUserRole] = useState<'Parent' | 'Event Organizer' | 'Portfolio Professional' | 'Admin'>('Parent');
  const [globalCommissionRate, setGlobalCommissionRate] = useState<number>(15); // Default 15% platform commission
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);

  const [bookingsList, setBookingsList] = useState<Booking[]>([
    {
      id: 'booking-init-1',
      itemId: 'event-clay',
      itemTitle: 'Creative Clay Sculpting Masterclass',
      type: 'EventTicket',
      buyerName: 'Vikram Mehta',
      buyerEmail: 'vikram.mehta@example.com',
      amountPaid: 450,
      commissionPercentage: 15,
      commissionEarned: 68,
      hostEarned: 382,
      dateStr: '2026-06-03',
      timeSelected: '14:05',
      razorpayPaymentId: 'pay_EVT_K9X8P3L2Q1',
      status: 'Paid'
    },
    {
      id: 'booking-init-2',
      itemId: 'spec-nutritionist',
      itemTitle: 'Dr. Anjali Sen Pediatric consultation',
      type: 'SpecialistAppointment',
      buyerName: 'Preeti Sharma',
      buyerEmail: 'preeti.sharma@example.com',
      amountPaid: 800,
      commissionPercentage: 15,
      commissionEarned: 120,
      hostEarned: 680,
      dateStr: '2026-06-05',
      timeSelected: '11:00',
      razorpayPaymentId: 'pay_SPC_A4Z7M1Y9V2',
      status: 'Paid'
    }
  ]);

  const [specialistsList, setSpecialistsList] = useState<SpecialistProfile[]>([
    {
      id: 'spec-nutritionist',
      name: 'Dr. Anjali Sen',
      title: 'Pediatric Dietitian & Nutrition Specialist',
      category: 'Nutritionist',
      bio: 'Dr. Sen has over 12 years of experience planning allergy-safe, nutrient-dense growth diets for children from toddler to school age. MD Pediatrics.',
      sessionFee: 800,
      commissionPercentage: 15,
      photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
      phone: '9827361545',
      email: 'anjali.sen@example.com',
      rating: 4.9,
      reviewsCount: 24,
      experienceYears: 12,
      location: 'Saket, New Delhi',
      availableSlots: ['10:00 - 11:00', '11:00 - 12:00', '15:00 - 16:00'],
      specialties: ['Allergy Safe Dieting', 'Growth Tracking', 'Picky Eaters Solutions'],
      languages: ['English', 'Hindi']
    },
    {
      id: 'spec-tutor',
      name: 'Prof. Rajesh Khanna',
      title: 'Interactive Math & Homework Coach',
      category: 'Tutor',
      bio: 'Private home tuitions specializing in early childhood math puzzles, phonetic spelling drills, and homework learning circles.',
      sessionFee: 650,
      commissionPercentage: 15,
      photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400',
      phone: '9716253456',
      email: 'rajesh.tutors@example.com',
      rating: 4.8,
      reviewsCount: 19,
      experienceYears: 8,
      location: 'Indiranagar, Bangalore',
      availableSlots: ['14:00 - 15:30', '16:00 - 17:30', '18:00 - 19:30'],
      specialties: ['Vedic Mathematics', 'Phonetics & Reading', 'Homework Support'],
      languages: ['English', 'Hindi', 'Punjabi']
    },
    {
      id: 'spec-artist',
      name: 'Meera Nair',
      title: 'Thematic Children Party Face Makeup Artist',
      category: 'Makeup Artist',
      bio: 'FDAapproved non-toxic organic colors paint modeling, birthday cartoon transformations, and creative face glitter decorations.',
      sessionFee: 1200,
      commissionPercentage: 15,
      photoUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=400',
      phone: '9567432190',
      email: 'meera.partyart@example.com',
      rating: 5.0,
      reviewsCount: 37,
      experienceYears: 5,
      location: 'Colaba, Mumbai',
      availableSlots: ['10:00 - 13:00', '14:00 - 18:00'],
      specialties: ['Face Painting', 'Organic Decay Paints', 'Cartoon Transformation'],
      languages: ['English', 'Tamil']
    }
  ]);

  const [eventsList, setEventsList] = useState<CommunityEvent[]>(MOCK_EVENTS);

  // Interactive loading screens states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingTitle, setLoadingTitle] = useState<string>('Booting Premium Parent Workspace...');

  // Filter criteria states (with KMs as range criteria)
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(3.0); // Default 3.0 KM scan radius
  const [filterPlayStyle, setFilterPlayStyle] = useState<string>('All');
  const [filterAgeGroup, setFilterAgeGroup] = useState<string>('All');
  const [filterGender, setFilterGender] = useState<string>('All');
  const [filterLanguage, setFilterLanguage] = useState<string>('All');
  const [filterSearchQuery, setFilterSearchQuery] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  
  // Custom precise filters requested by user:
  const [filterMinAge, setFilterMinAge] = useState<number>(0);
  const [filterMaxAge, setFilterMaxAge] = useState<number>(15);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedPreferredActivities, setSelectedPreferredActivities] = useState<string[]>([]);
  const [filterAvailableDay, setFilterAvailableDay] = useState<string>('All');
  const [filterAvailableTime, setFilterAvailableTime] = useState<string>('All');

  // Quick Filters requested by user:
  const [filterOnlyConnected, setFilterOnlyConnected] = useState<boolean>(false);
  const [filterOnlySaved, setFilterOnlySaved] = useState<boolean>(false);
  const [filterActivityRecency, setFilterActivityRecency] = useState<string>('All'); // 'All' | 'active24h' | 'active1w' | 'currentlyActive'

  // Promotional Banners/Ads State
  const [banners, setBanners] = useState<any[]>([]);

  // Load banners dynamically inside App.tsx with safe offline fallback
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onSnapshot(collection(db, 'banners'), (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((snapDoc) => {
          list.push({ id: snapDoc.id, ...snapDoc.data() });
        });
        setBanners(list);
      }, (err) => {
        console.warn('[App Banners Sync] Note/offline fallback:', err?.message || err);
      });
    } catch (e) {
      console.warn('[App Banners Sync] Startup init note:', e);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Real-Time Push Notification states
  const [latestNotification, setLatestNotification] = useState<any | null>(null);
  const [showPushToast, setShowPushToast] = useState<boolean>(false);
  const [notificationsHistory, setNotificationsHistory] = useState<any[]>([]);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState<boolean>(false);

  const triggerToast = (message: string, title: string = 'Vernunt Update') => {
    setLatestNotification({
      title,
      body: message,
      timestamp: new Date().toISOString()
    });
    setShowPushToast(true);
    setTimeout(() => {
      setShowPushToast(false);
    }, 4500);
  };
  
  // Custom interactive explanation modals
  const [showAadhaarExplanation, setShowAadhaarExplanation] = useState<boolean>(false);
  const [showTrustScoreExplanation, setShowTrustScoreExplanation] = useState<boolean>(false);
  const [showContactsPrivacyModal, setShowContactsPrivacyModal] = useState<boolean>(false);
  const [showChildComplianceModal, setShowChildComplianceModal] = useState<boolean>(false);

  // Silently and automatically acquire GPS location by default without popup modal
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserProfile((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              location: {
                ...(prev.location || { address: 'Current Area' }),
                lat,
                lng
              }
            };
          });
        },
        () => {},
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      );
    }
  }, []);

  // Web Audio chime player
  const playNotificationChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.4);

      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
        gain2.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.45);
      }, 100);

    } catch (err) {
      console.warn('Web Audio block warning:', err);
    }
  };

  // Real-time Push Notification synchronization
  useEffect(() => {
    if (!auth.currentUser || !userProfile) return;
    const appLoadTime = Date.now();
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onSnapshot(collection(db, 'push_notifications'), (snapshot) => {
        const list: any[] = [];
        let latest: any = null;
        let hasNew = false;
        
        snapshot.forEach((snapDoc) => {
          const data = snapDoc.data();
          list.push({ id: snapDoc.id, ...data });
          
          if (data.createdAt && data.createdAt > appLoadTime) {
            if (!latest || data.createdAt > latest.createdAt) {
              latest = { id: snapDoc.id, ...data };
              hasNew = true;
            }
          }
        });
        
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setNotificationsHistory(list);
        
        if (hasNew && latest) {
          setLatestNotification(latest);
          setShowPushToast(true);
          playNotificationChime();
        }
      }, (err) => {
        console.warn('[App Push Notifications Syncer] Offline/sync note:', err?.message || err);
      });
    } catch (e) {
      console.warn('[App Push Notifications Syncer] Init note:', e);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userProfile?.id]);

  // Interactive matched playmates list
  const [playmates, setPlaymates] = useState<ChildProfile[]>(INITIAL_PLAYMATES);
  const [selectedPlaymate, setSelectedPlaymate] = useState<ChildProfile | null>(INITIAL_PLAYMATES[0]);

  // Secure connection state (restricting private parent communication)
  const [connectedIds, setConnectedIds] = useState<string[]>(() => {
    const cached = localStorage.getItem('vernunt_connected_ids');
    return cached ? JSON.parse(cached) : ['playmate-1', 'playmate-2'];
  });
  const [interestsSent, setInterestsSent] = useState<string[]>(() => {
    const cached = localStorage.getItem('vernunt_interests_sent');
    return cached ? JSON.parse(cached) : [];
  });
  const [interestsReceived, setInterestsReceived] = useState<string[]>(() => {
    const cached = localStorage.getItem('vernunt_interests_received');
    return cached ? JSON.parse(cached) : ['playmate-3']; // Elena & Leo wants to connect first!
  });
  const [blockedIds, setBlockedIds] = useState<string[]>(() => {
    const cached = localStorage.getItem('vernunt_blocked_ids');
    return cached ? JSON.parse(cached) : [];
  });

  // Saved / Bookmarked profiles state
  const [savedProfileIds, setSavedProfileIds] = useState<string[]>(() => {
    const cached = localStorage.getItem('vernunt_saved_profile_ids');
    return cached ? JSON.parse(cached) : ['playmate-1'];
  });

  useEffect(() => {
    localStorage.setItem('vernunt_saved_profile_ids', JSON.stringify(savedProfileIds));
  }, [savedProfileIds]);

  const handleToggleSaveProfile = (profileId: string) => {
    setSavedProfileIds(prev => {
      const isAlreadySaved = prev.includes(profileId);
      const next = isAlreadySaved ? prev.filter(id => id !== profileId) : [...prev, profileId];
      if (!isAlreadySaved) {
        triggerToast('⭐ Profile saved to your bookmarks!');
      } else {
        triggerToast('Profile removed from bookmarks.');
      }
      return next;
    });
  };

  // Aadhaar Verification Dashboard States & Handlers
  const [showAadhaarVerifyModal, setShowAadhaarVerifyModal] = useState<boolean>(false);
  const [aadhaarActionMessage, setAadhaarActionMessage] = useState<string>('');
  const aadhaarSuccessCallbackRef = useRef<(() => void) | null>(null);

  const ensureAadhaarVerified = (actionMessage: string, onSuccess: () => void) => {
    if (userProfile && userProfile.aadhaarVerified) {
      onSuccess();
    } else {
      setAadhaarActionMessage(actionMessage);
      aadhaarSuccessCallbackRef.current = onSuccess;
      setShowAadhaarVerifyModal(true);
    }
  };

  const handleAadhaarVerifySuccess = (updatedProfile: ChildProfile) => {
    setUserProfile(updatedProfile);
    setShowAadhaarVerifyModal(false);

    // Trigger the original pending callback if it exists
    if (aadhaarSuccessCallbackRef.current) {
      aadhaarSuccessCallbackRef.current();
      aadhaarSuccessCallbackRef.current = null;
    }
  };

  const handleAcceptConnection = (partnerId: string) => {
    ensureAadhaarVerified(
      "To accept incoming peer requests, connect with playmates, and swap private dashboard contacts, Aadhaar authentication is required.",
      () => {
        const updatedConn = [...connectedIds, partnerId];
        const updatedRecv = interestsReceived.filter(id => id !== partnerId);
        setConnectedIds(updatedConn);
        setInterestsReceived(updatedRecv);
        localStorage.setItem('vernunt_connected_ids', JSON.stringify(updatedConn));
        localStorage.setItem('vernunt_interests_received', JSON.stringify(updatedRecv));

        confetti({
          particleCount: 100,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#f97316', '#fbbf24', '#10b981']
        });
      }
    );
  };

  const handleSendConnectionRequest = (partnerId: string) => {
    if (!userProfile?.subscriptionActive) {
      alert("👑 To send connect requests to neighborhood parents, please activate any Kids Connect Club plan (including Free Plan) first!");
      setActiveTab('billing');
      return;
    }
    ensureAadhaarVerified(
      "To request playmate match connect with local active parents on the playground map, Aadhaar integration is required.",
      () => {
        if (interestsSent.includes(partnerId) || connectedIds.includes(partnerId)) {
          triggerToast("Connection request is already sent or connected!", "Connected");
          return;
        }
        
        const updatedSent = [...interestsSent, partnerId];
        setInterestsSent(updatedSent);
        localStorage.setItem('vernunt_interests_sent', JSON.stringify(updatedSent));
        triggerToast("💌 Connect request sent to parent! Awaiting guardian approval...", "Request Sent");

        // Simulate other parent auto-accepting with active feedback after 3 seconds
        setTimeout(() => {
          setConnectedIds(prevConnected => {
            if (prevConnected.includes(partnerId)) return prevConnected;
            const updated = [...prevConnected, partnerId];
            localStorage.setItem('vernunt_connected_ids', JSON.stringify(updated));
            return updated;
          });
          setInterestsSent(prevSent => {
            const updated = prevSent.filter(id => id !== partnerId);
            localStorage.setItem('vernunt_interests_sent', JSON.stringify(updated));
            return updated;
          });

          confetti({
            particleCount: 60,
            spread: 40,
            origin: { y: 0.7 }
          });

          triggerToast("🎉 Parent accepted your connection request! Secure chat is now unlocked.", "Connected!");
        }, 3000);
      }
    );
  };

  const handleBlockParent = (partnerId: string) => {
    const updatedBlocked = [...blockedIds, partnerId];
    setBlockedIds(updatedBlocked);
    localStorage.setItem('vernunt_blocked_ids', JSON.stringify(updatedBlocked));
    
    // Also remove from connections and pending interests just in case
    setConnectedIds(prev => {
      const filtered = prev.filter(id => id !== partnerId);
      localStorage.setItem('vernunt_connected_ids', JSON.stringify(filtered));
      return filtered;
    });
    setInterestsSent(prev => {
      const filtered = prev.filter(id => id !== partnerId);
      localStorage.setItem('vernunt_interests_sent', JSON.stringify(filtered));
      return filtered;
    });
    setInterestsReceived(prev => {
      const filtered = prev.filter(id => id !== partnerId);
      localStorage.setItem('vernunt_interests_received', JSON.stringify(filtered));
      return filtered;
    });

    alert("ℹ️ Parent blocked and removed from all views instantly.");
  };

  const handleUnlockPhoneByCredit = async (targetId: string) => {
    if (!userProfile) {
      alert("Please register or log in first.");
      return;
    }
    const currentCredits = userProfile.contactViewCredits || 0;
    if (currentCredits <= 0) {
      alert("No view credits remaining. Please refer other parents to receive further contacts view credits.");
      setActiveTab('referrals');
      return;
    }

    const unlockedIds = [...(userProfile.unlockedPhoneIds || [])];
    if (!unlockedIds.includes(targetId)) {
      unlockedIds.push(targetId);
    }

    const updatedProfile: ChildProfile = {
      ...userProfile,
      contactViewCredits: currentCredits - 1,
      unlockedPhoneIds: unlockedIds
    };

    setUserProfile(updatedProfile);

    if (auth.currentUser) {
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userRef, updatedProfile, { merge: true });
      } catch (err) {
        console.error("Firestore persistence failure:", err);
      }
    }

    confetti({
      particleCount: 55,
      spread: 35,
      colors: ['#fbbf24', '#3b82f6', '#10b981']
    });

    alert("🎉 Guardian Contact Mobile Decrypted! Balance: " + (currentCredits - 1) + " credits.");
  };

  // Modal display toggles
  const [detailModalProfile, setDetailModalProfile] = useState<ChildProfile | null>(null);
  const [activeReportProfile, setActiveReportProfile] = useState<ChildProfile | null>(null);
  const [activeVerifyProfile, setActiveVerifyProfile] = useState<ChildProfile | null>(null);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);

  // Handle Sign Up with optional pre-verified details
  const handleStartSignUp = (
    role: 'Parent' | 'Event Organizer' | 'Portfolio Professional',
    details?: { phone?: string; email?: string; phoneVerified?: boolean }
  ) => {
    setIsLoading(true);
    setLoadingTitle(
      role === 'Parent' 
        ? 'Loading family registration workspace...' 
        : role === 'Event Organizer'
        ? 'Loading activity host registration workspace...'
        : 'Loading professional specialist workspace...'
    );
    setSuggestedRegisterRole(role);
    if (details) {
      setPendingRegisterDetails(details);
    }
    setShowRoleSelectModal(false);
    setAppMode('register');
    setIsLoading(false);
  };

  const handleQuickStartPlayground = () => {
    setIsLoading(true);
    setLoadingTitle('Spanning localized Ayaan playground radars...');
    
    // Generate a beautiful, pre-populated, demo-ready playground profile
    const demoProfile: ChildProfile = {
      id: 'playground-user',
      parentName: 'Arjun Gupta', // Keeps user requested parent identity
      childName: 'Ayaan',
      gradeLevel: 'Grade 1',
      childAge: 6,
      childGender: 'Boy',
      playStyle: 'Quiet & Creative',
      bio: 'Ayaan is an imaginative, friendly child who is obsessed with building high Lego towers, sketching rockets, and chasing mini-soccer relays on grassy yards!',
      location: {
        lat: 19.1663,
        lng: 72.8526,
        address: 'Oberoi Garden City, Goregaon, Mumbai, India'
      },
      locationSharing: LocationSharing.PRECISE,
      verificationStatus: VerificationStatus.VERIFIED,
      interests: ['Lego Sets', 'Sketching', 'Mini Soccer'],
      photoUrl: 'https://images.unsplash.com/photo-1602030028438-4cf153cba9e7?auto=format&fit=crop&q=80&w=400'
    };

    setTimeout(() => {
      setUserProfile(demoProfile);
      setAppMode('dashboard');
    }, 1500);
  };

  const handleCompleteRegistration = async (newProfile: ChildProfile) => {
    setIsLoading(true);
    setLoadingTitle('Saving verified guardian profile...');
    
    const uid = auth.currentUser?.uid || `user-${Date.now()}`;
    const autoReferralCode = `REF-${(newProfile.parentName || 'PARENT').split(' ')[0].toUpperCase()}-${uid.slice(0, 4).toUpperCase()}`;
    const sessionReferral = sessionStorage.getItem('vernunt_referral_code') || undefined;
    const activeAffiliateCode = sessionStorage.getItem('vernunt_active_affiliate_ref') || localStorage.getItem('vernunt_active_affiliate_ref') || undefined;

    // Clean undefined fields for Firestore safety
    const cleanObject = (obj: any): any => {
      const out: any = {};
      Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined) {
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            out[key] = cleanObject(obj[key]);
          } else {
            out[key] = obj[key];
          }
        }
      });
      return out;
    };

    const profileWithId: ChildProfile = { 
      ...newProfile, 
      id: uid, 
      email: auth.currentUser?.email || newProfile.email || undefined,
      referralCode: autoReferralCode,
      contactViewCredits: newProfile.contactViewCredits || 0,
      referralCount: newProfile.referralCount || 0,
      // Default affiliate status enabled for all registered parents / organizers
      affiliateStatus: 'active',
      affiliateTier: 'Silver',
      affiliateCommissionRate: 15,
      affiliateCode: autoReferralCode
    };

    if (activeAffiliateCode) {
      profileWithId.affiliateReferredBy = activeAffiliateCode;
    }

    if (sessionReferral) {
      profileWithId.referredByCode = sessionReferral;
      // Newly referred parent receives +1 view credit immediately
      profileWithId.contactViewCredits = (profileWithId.contactViewCredits || 0) + 1;
    }

    const cleanedData = cleanObject(profileWithId);

    // Save locally immediately
    try {
      localStorage.setItem('vernunt_cached_profile_' + uid, JSON.stringify(profileWithId));
      localStorage.setItem('vernunt_active_user_id', uid);
    } catch (e) {
      console.warn('Local storage write note:', e);
    }

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', uid), cleanedData);

        // Credit the affiliate partner or general referrer
        const attributionCode = activeAffiliateCode || sessionReferral;
        if (attributionCode) {
          try {
            const { collection, query, where, getDocs, updateDoc, increment } = await import('firebase/firestore');
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('referralCode', '==', attributionCode));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const referrerDoc = querySnapshot.docs[0];
              await updateDoc(doc(db, 'users', referrerDoc.id), {
                contactViewCredits: increment(1),
                referralCount: increment(1),
                affiliateTotalCustomersReferred: increment(1)
              });
              console.log("🎁 Successfully credited referrer profile ID:", referrerDoc.id);
            }
          } catch (refErr) {
            console.error("Failed to update credit for referrer:", refErr);
          }
        }
      } catch (err) {
        console.warn("Firestore write error during registration, proceeding with local verified session:", err);
      }
    }

    // Always succeed and navigate to dashboard smoothly
    setUserProfile(profileWithId);
    const savedRole = profileWithId.userRole || 'Parent';
    setUserRole(savedRole);
    setAppMode('dashboard');
    
    if (savedRole === 'Event Organizer') {
      setActiveTab('business');
    } else if (savedRole === 'Portfolio Professional') {
      setActiveTab('portfolio');
    } else {
      setActiveTab('radar');
    }

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (e) {
      // ignore
    }

    setIsLoading(false);
  };

  const handleLogOut = async () => {
    setIsLoading(true);
    setLoadingTitle('Signing out...');
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (e) {
      console.error('Sign-out error:', e);
    } finally {
      setUserProfile(null);
      setAppMode('landing');
      setIsLoading(false);
    }
  };

  const handleSelectPlaymate = (profile: ChildProfile) => {
    setSelectedPlaymate(profile);
  };

  const handleBookPlaydateTrigger = (profile: ChildProfile) => {
    setSelectedPlaymate(profile);
    setActiveTab('planner');
  };

  const handleOpenChatTrigger = (profile: ChildProfile) => {
    setSelectedPlaymate(profile);
    setActiveTab('chat');
  };

  const handleCompleteVerification = () => {
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        verificationStatus: VerificationStatus.VERIFIED
      });
    }
  };

  // Derive center coordinate for distance filter
  const userLat = userProfile?.location?.lat || 19.0760;
  const userLng = userProfile?.location?.lng || 72.8777;

  // Filter playmates list in Kilometers and other required criteria
  const filteredPlaymates = playmates.filter((p) => {
    // Exclude if parent or profile is blocked by user locally
    if (blockedIds.includes(p.id)) return false;

    // Exclude if parent or profile is blocked/suspended by admin
    if (p.isBlocked) return false;

    // 1. Distance filter (in kilometers instead of miles)
    const distanceKm = getHaversineDistance(userLat, userLng, p.location.lat, p.location.lng);
    if (distanceKm > maxDistanceKm) return false;

    // 2. Play style filter
    if (filterPlayStyle !== 'All') {
      const pStyleLower = p.playStyle.toLowerCase();
      const fStyleLower = filterPlayStyle.toLowerCase();
      if (filterPlayStyle === 'Outdoor') {
        if (!pStyleLower.includes('outdoor') && !pStyleLower.includes('sporty')) return false;
      } else if (filterPlayStyle === 'Indoor') {
        if (!pStyleLower.includes('indoor') && !pStyleLower.includes('quiet') && !pStyleLower.includes('creative')) return false;
      } else {
        if (!pStyleLower.includes(fStyleLower)) return false;
      }
    }

    // 3. Age bracket category group matching (can coexist or act as preset)
    if (filterAgeGroup !== 'All') {
      const age = p.childAge;
      if (filterAgeGroup === 'Infant' && (age < 0 || age > 1)) return false;
      if (filterAgeGroup === 'Toddler' && (age < 1 || age > 2)) return false;
      if (filterAgeGroup === 'Preschool' && (age < 3 || age > 4)) return false;
      if (filterAgeGroup === 'Kindergarten' && (age < 5 || age > 6)) return false;
      if (filterAgeGroup === 'SchoolAge' && age < 7) return false;
    }

    // Precise continuous age range filter:
    if (p.childAge < filterMinAge || p.childAge > filterMaxAge) return false;

    // 4. Gender filter
    if (filterGender !== 'All' && p.childGender !== filterGender) return false;

    // 5. Language barrier/Demographic filter
    if (filterLanguage !== 'All') {
      const targetLang = filterLanguage.split('/')[0].trim().toLowerCase();
      const languages = p.languagesKnown || [];
      const matchesKnown = languages.some(l => {
        const lNorm = l.toLowerCase().trim();
        return lNorm.includes(targetLang) || targetLang.includes(lNorm);
      });
      const matchesMother = p.motherTongue ? (
        p.motherTongue.toLowerCase().trim().includes(targetLang) || targetLang.includes(p.motherTongue.toLowerCase().trim())
      ) : false;
      if (!matchesKnown && !matchesMother) return false;
    }

    // 6. Fuzzy text matching (Name, Interests, Bio, Parent Profession)
    if (filterSearchQuery.trim()) {
      const query = filterSearchQuery.toLowerCase().trim();
      const nameMatch = p.childName.toLowerCase().includes(query) || p.parentName.toLowerCase().includes(query);
      const interestMatch = p.interests.some(el => el.toLowerCase().includes(query));
      const bioMatch = p.bio?.toLowerCase().includes(query) || false;
      const professionMatch = p.parentProfession?.toLowerCase().includes(query) || false;
      if (!nameMatch && !interestMatch && !bioMatch && !professionMatch) return false;
    }

    // 7. Days of availability filter
    if (filterAvailableDay !== 'All') {
      const days = p.availableDays || [];
      if (!days.includes(filterAvailableDay)) return false;
    }

    // 8. Times of availability filter
    if (filterAvailableTime !== 'All') {
      const times = p.availableTimes || [];
      if (!times.includes(filterAvailableTime)) return false;
    }

    // 9. Shared Interests tag click filtering
    if (selectedInterests.length > 0) {
      const pInterestsLower = (p.interests || []).map(i => i.toLowerCase());
      const hasMatch = selectedInterests.some(sel => 
        pInterestsLower.some(pi => pi.includes(sel.toLowerCase()))
      );
      if (!hasMatch) return false;
    }

    // 10. Preferred Activities filtering
    if (selectedPreferredActivities.length > 0) {
      const pActLower = (p.preferredActivities || []).map(a => a.toLowerCase());
      const hasMatch = selectedPreferredActivities.some(sel => 
        pActLower.some(pa => pa.includes(sel.toLowerCase()))
      );
      if (!hasMatch) return false;
    }

    // 11. Connected Friends Only filter
    if (filterOnlyConnected && !connectedIds.includes(p.id)) return false;

    // 12. Saved Profiles Only filter
    if (filterOnlySaved && !savedProfileIds.includes(p.id)) return false;

    // 13. Activity Recency filter (Active last 24 hrs / Active 1 week / Currently Active)
    if (filterActivityRecency !== 'All') {
      const now = Date.now();
      const lastActiveMs = p.lastActiveAt ? new Date(p.lastActiveAt).getTime() : 0;
      const hoursDiff = lastActiveMs > 0 ? (now - lastActiveMs) / (1000 * 3600) : 9999;

      if (filterActivityRecency === 'active24h') {
        if (hoursDiff > 24 && p.activityStatus !== 'Currently Active') return false;
      } else if (filterActivityRecency === 'active1w') {
        if (hoursDiff > 168 && p.activityStatus !== 'Currently Active' && p.activityStatus !== 'Available for Play') return false;
      } else if (filterActivityRecency === 'currentlyActive') {
        if (p.activityStatus !== 'Currently Active' && !p.lookingForImmediatePlaydate) return false;
      }
    }

    return true;
  });

  // Safe selected playmate resolving (defaults to first matching when list changes)
  const activePlaymate = filteredPlaymates.find(p => p.id === selectedPlaymate?.id) || filteredPlaymates[0] || null;

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased">
      
      {/* Top Banner & Emergency Bar if Logged In / In Dashboard */}
      {appMode === 'dashboard' && (
        <div id="sos-top-banner" className="bg-slate-900 text-slate-100 py-2 sm:py-3 px-3 sm:px-4 md:px-8 border-b border-slate-800 flex flex-wrap sm:flex-nowrap justify-between items-center gap-2 text-xs w-full max-w-full overflow-hidden">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0"></span>
            <span className="truncate">{t.loggedInAs}: <strong>{userProfile?.parentName}</strong> • Matchable with <strong>{playmates.length} {t.localPlaymatesCount}</strong>.</span>
          </div>
          
          <button
            id="btn-trigger-sos"
            onClick={() => setShowSOSModal(true)}
            className="px-2.5 sm:px-3 py-1 bg-red-650 hover:bg-red-700 text-white font-bold rounded-lg transition active:scale-95 flex items-center gap-1 shrink-0 uppercase tracking-wider text-[10px]"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> {t.safetySOSHelp}
          </button>
        </div>
      )}

      {/* Main Header navigation */}
      <header id="main-navigation-header" className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs px-3 sm:px-4 md:px-8 py-2.5 md:py-3 flex items-center justify-between gap-2 w-full max-w-full">
        <div 
          id="logo-branding-block" 
          className="flex items-center gap-2 cursor-pointer group shrink-0"
          onClick={() => {
            if (auth.currentUser || userProfile) {
              setAppMode('dashboard');
              setActiveTab('radar');
            } else {
              setIsLoading(true);
              setLoadingTitle('Navigating to landing gateway...');
              setAppMode('landing');
            }
          }}
          title={auth.currentUser || userProfile ? "Go to Radar Tab" : "Back to Landing Gateway"}
        >
          <VernuntLogo size="xs" showText={false} animated={true} />
          <div className="flex flex-col">
            <span id="nav-brand-title" className="text-lg sm:text-xl font-black tracking-tight leading-none text-slate-900 font-serif flex items-center gap-1.5">
              <span>
                <span className="text-rose-700">vern</span>
                <span className="text-amber-500">unt</span>
                <span className="text-rose-800 text-[10px] sm:text-xs font-sans font-bold ml-0.5">.com</span>
              </span>
              {isOffline && (
                <span className="bg-amber-100/80 border border-amber-200/60 text-amber-900 font-sans font-bold text-[8px] tracking-wide px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                  <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse inline-block" /> Offline
                </span>
              )}
            </span>
            <span className="block text-[7.5px] sm:text-[8px] uppercase font-black text-rose-800 tracking-wider mt-0.5">Verified Playmate Network</span>
          </div>
        </div>

        {/* Dynamic Nav Tabs for Dashboard */}
        {appMode === 'dashboard' && (
          <nav id="nav-menu-links" className="hidden lg:flex items-center gap-1.5">
            {Object.entries(tabsConfig)
              .filter(([_, placement]) => placement === 'header')
              .map(([tabId]) => {
                // Guards
                if (tabId === 'admin' && userProfile?.userRole !== 'Admin') return null;
                if (tabId === 'business' && userProfile?.userRole === 'Parent') return null;

                const def = TAB_DEFINITIONS.find(t => t.id === tabId);
                if (!def) return null;

                const IconComponent = def.icon;
                const isBilling = tabId === 'billing';

                return (
                  <button
                    key={tabId}
                    id={`tab-btn-${tabId}`}
                    onClick={() => setActiveTab(tabId as any)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === tabId
                        ? isBilling
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                          : 'bg-rose-700 text-white shadow-md shadow-rose-700/20 font-black'
                        : isBilling
                        ? 'hover:bg-amber-100/40 text-amber-800 bg-amber-500/10 border border-amber-200/60'
                        : 'hover:bg-rose-50 text-slate-700 hover:text-rose-800'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${isBilling ? 'text-amber-600 animate-pulse' : activeTab === tabId ? 'text-white' : 'text-rose-700'}`} />
                    {tabId === 'billing' ? '👑 VIP Club' : def.label === 'Near Playmates' ? t.nearPlaymates : def.label === 'Chat Messenger' ? 'Messages' : def.label === 'Events & Classes' ? 'Play Events' : def.label === 'Specialists' ? 'Specialists' : def.label}
                  </button>
                );
              })}

            <a
              id="tab-btn-store"
              href="https://vernunt.com/store"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 text-slate-600"
            >
              <ExternalLink className="w-4 h-4 text-orange-500" />
              Store
            </a>

            {/* More Menu Trigger Button */}
            <button
              id="tab-btn-more-menu"
              onClick={() => setIsSideMenuOpen(true)}
              className="px-3.5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer"
              title="Open full feature exploration menu"
            >
              <Menu className="w-4 h-4 text-slate-600" /> More Options
            </button>
          </nav>
        )}

        {/* User Identity / Action Block & Global Language Dropdown */}
        <div id="user-branding-badge" className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Global Language Selector Dropdown */}
          <div id="global-language-selector" className="relative flex items-center gap-1 bg-slate-50 border border-slate-200 py-1 px-1.5 sm:py-1.5 sm:px-2 rounded-xl hover:bg-slate-100 transition max-w-[120px] sm:max-w-none">
            <span className="text-xs shrink-0" role="img" aria-label="language-globe">🌐</span>
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value as LanguageCode)}
              className="bg-transparent text-[11px] sm:text-xs font-bold text-slate-755 focus:outline-none cursor-pointer truncate"
              id="select-pref-language"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="text-slate-800 bg-white">
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </div>

          {appMode === 'dashboard' ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Real-time Push alerts console trigger */}
              <div className="relative">
                <button
                  id="btn-bell-notification-center"
                  onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
                  className="p-1.5 sm:p-2 border border-slate-200 hover:bg-slate-100/75 rounded-xl text-slate-650 transition active:scale-95 relative cursor-pointer"
                  title="Vernunt Push Broadcast Alerts Log Book"
                >
                  <Bell className={`w-4 h-4 ${notificationsHistory.length > 0 ? 'text-orange-500 fill-orange-50/20' : ''}`} />
                  {notificationsHistory.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono font-black text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      {Math.min(9, notificationsHistory.length)}
                    </span>
                  )}
                </button>
              </div>

              {/* Desktop Unique Circular Interactive Community Trust Score Badge */}
              <button
                id="btn-trustscore-indicator"
                onClick={() => setShowTrustScoreExplanation(true)}
                className="hidden md:flex items-center gap-2 bg-gradient-to-r from-orange-50/65 to-amber-50/65 hover:from-orange-100/50 hover:to-amber-100/50 hover:border-orange-200 border border-orange-150/50 rounded-2xl p-1.5 transition text-left active:scale-98 cursor-pointer shadow-2xs group"
                title="Your localized Safety & Verification Trust Factor Scorecard"
              >
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Trust Score</span>
                  <span className="text-xs font-serif font-black text-orange-600 leading-tight group-hover:text-orange-700 transition">
                    {calculateTrustScore(userProfile)}/100
                  </span>
                </div>
                <div className="relative w-7 h-7 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="14" cy="14" r="11" stroke="#ffedd5" strokeWidth="2.5" fill="transparent" />
                    <circle 
                      cx="14" 
                      cy="14" 
                      r="11" 
                      stroke="#f97316" 
                      strokeWidth="2.5" 
                      fill="transparent" 
                      strokeDasharray="69" 
                      strokeDashoffset={69 - (69 * calculateTrustScore(userProfile)) / 100} 
                      className="transition-all duration-500"
                    />
                  </svg>
                  <span className="absolute text-[8px] font-black text-orange-700 font-mono">🛡️</span>
                </div>
              </button>

              {/* Child Safety & COPPA Compliance Certified Button */}
              <button
                id="btn-child-safety-badge"
                onClick={() => setShowChildComplianceModal(true)}
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/90 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs group"
                title="Vernunt Child Safety & COPPA / DPDP Compliance Hub"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col text-left">
                  <span className="text-[7.5px] font-black text-emerald-700 uppercase tracking-wider leading-none">Safe Kids</span>
                  <span className="text-[11px] font-bold text-emerald-950 leading-tight">COPPA A+</span>
                </div>
              </button>

              <div className="text-right hidden lg:block">
                <div className="flex items-center gap-1.5 justify-end">
                  {userProfile?.aadhaarVerified && (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 fill-emerald-100/30" title="Correlated Aadhaar Biometrics Confirmed via UIDAI Secure API" />
                  )}
                  <span className="block text-xs font-black text-slate-800 font-serif">{t.loggedInAs} {userProfile?.parentName}</span>
                  <button
                    onClick={() => setShowEditProfileModal(true)}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-orange-500 transition cursor-pointer"
                    title="Edit parents bio / child description"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
                
                {/* Visual Aadhaar verified display header with safety explanation icon */}
                <div className="flex items-center gap-1 mt-0.5 justify-end">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-widest flex items-center gap-1 ${
                    userProfile?.aadhaarVerified 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-150/40' 
                      : 'bg-amber-50 text-amber-700 border border-amber-150/40'
                  }`}>
                    {userProfile?.aadhaarVerified ? '✓ Aadhaar Verified' : '⚠ Aadhaar Unverified'}
                  </span>
                  <button 
                    onClick={() => setShowAadhaarExplanation(true)}
                    className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-800 transition cursor-pointer"
                    title="Aadhaar verification requirement overview"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Contacts Privacy Trigger Button */}
              <button
                id="btn-header-contacts-privacy"
                type="button"
                onClick={() => setShowContactsPrivacyModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-850 border border-rose-200/80 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                title="Manage who can see or connect with your profile from saved phone contacts"
              >
                <Smartphone className="w-3.5 h-3.5 text-rose-700" />
                <span className="hidden xl:inline">Contacts Privacy</span>
                {userProfile?.contactsPrivacy?.autoHideFromAllContacts ? (
                  <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-extrabold uppercase tracking-wider">Ghost</span>
                ) : (
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold uppercase tracking-wider">
                    {userProfile?.contactsPrivacy?.contacts?.length ? `${userProfile.contactsPrivacy.contacts.length}` : 'Sync'}
                  </span>
                )}
              </button>

              {/* User Avatar */}
              <img 
                src={userProfile?.photoUrl} 
                alt="user" 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-rose-200 cursor-pointer hover:border-rose-500 transition shrink-0"
                onClick={() => setShowEditProfileModal(true)}
                referrerPolicy="no-referrer"
                title="View/Edit Profile"
              />

              {/* Desktop Logout button */}
              <button
                id="btn-logout"
                onClick={handleLogOut}
                type="button"
                className="hidden md:flex p-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 rounded-xl text-slate-600 transition items-center gap-1 cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3.5 select-none font-sans">
              <a
                id="header-btn-store-guest"
                href="https://vernunt.com/store"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-orange-600 hover:text-orange-700 font-black flex items-center gap-1.5 transition hover:scale-102 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                Store
              </a>
              <span className="w-px h-3 bg-slate-200 hidden sm:inline" />
              <button
                id="btn-trigger-tac"
                onClick={() => setShowLegalModal(true)}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Info className="w-4 h-4" /> <span className="hidden sm:inline">{t.safetyStandards}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Sub-Header Bar: Brings Trust Score and Logout clearly below the header for easy one-tap access on mobile */}
      {appMode === 'dashboard' && (
        <div id="mobile-user-status-bar" className="md:hidden bg-gradient-to-r from-rose-50/90 via-amber-50/60 to-rose-50/90 border-b border-rose-200/70 px-3 py-2 flex items-center justify-between gap-2 text-xs w-full max-w-full shadow-2xs">
          {/* Trust Score Button */}
          <button
            id="btn-mob-trustscore"
            onClick={() => setShowTrustScoreExplanation(true)}
            className="flex items-center gap-2 bg-white/95 border border-rose-200/90 hover:border-rose-300 rounded-xl px-2.5 py-1.5 shadow-2xs transition active:scale-95 text-left cursor-pointer shrink-0"
            title="View Safety & Trust Score Breakdown"
          >
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-rose-800 uppercase tracking-widest leading-none">Trust Score</span>
              <span className="text-xs font-serif font-black text-rose-950 leading-tight">
                {calculateTrustScore(userProfile)}/100
              </span>
            </div>
            <span className="text-xs font-mono font-black text-rose-700 bg-rose-100/70 px-1 py-0.5 rounded">
              🛡️
            </span>
          </button>

          {/* Mobile Contacts Privacy Button */}
          <button
            id="btn-mob-contacts-privacy"
            type="button"
            onClick={() => setShowContactsPrivacyModal(true)}
            className="flex items-center gap-1 bg-white/95 border border-rose-200 rounded-xl px-2 py-1.5 shadow-2xs transition active:scale-95 text-rose-900 font-bold text-[10px] cursor-pointer shrink-0"
            title="Manage Phone Contacts Privacy & Ghost Mode"
          >
            <Smartphone className="w-3.5 h-3.5 text-rose-700" />
            <span>Contacts</span>
            {userProfile?.contactsPrivacy?.autoHideFromAllContacts ? (
              <span className="text-[8px] bg-rose-600 text-white px-1 rounded font-black">Ghost</span>
            ) : (
              <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded font-black">
                {userProfile?.contactsPrivacy?.contacts?.length ?? 0}
              </span>
            )}
          </button>

          {/* User Parent Name & Aadhaar Badge */}
          <div className="flex items-center gap-1 min-w-0 flex-1 justify-center overflow-hidden">
            <span className={`text-[9px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider truncate flex items-center gap-1 border ${
              userProfile?.aadhaarVerified 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {userProfile?.aadhaarVerified ? '✓ Verified' : '⚠ Unverified'}
            </span>
          </div>

          {/* Direct Mobile Log Out Button */}
          <button
            id="btn-mob-logout"
            onClick={handleLogOut}
            type="button"
            className="flex items-center gap-1 bg-white hover:bg-rose-50 border border-rose-300 text-rose-800 hover:text-rose-900 px-2.5 py-1.5 rounded-xl text-xs font-black shadow-2xs transition active:scale-95 shrink-0 cursor-pointer"
            title="Log Out of Vernunt"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-700" />
            <span>Log Out</span>
          </button>
        </div>
      )}

      {/* Full Length Highlighted Shop Now External Banner (Only visible after login) */}
      {(auth.currentUser || userProfile) && (
        <a
          id="banner-shop-favourite-products"
          href="https://vernunt.com/store"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:via-amber-600 hover:to-orange-700 text-white py-2.5 px-4 flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 text-xs sm:text-sm font-extrabold shadow-sm transition-all duration-200 cursor-pointer border-b border-orange-600/30 group text-center"
          title="Shop your child's favourite products on Vernunt Store"
        >
          <div className="flex items-center gap-2 whitespace-normal sm:whitespace-nowrap">
            <ShoppingBag className="w-4 h-4 text-amber-100 group-hover:scale-110 transition-transform shrink-0" />
            <span className="font-serif tracking-wide">Shop your child's favourite products</span>
          </div>
          <span className="ml-1 bg-white/20 hover:bg-white/30 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 border border-white/30 shadow-2xs whitespace-nowrap">
            Shop Now <ExternalLink className="w-3 h-3 text-amber-200" />
          </span>
        </a>
      )}

      {/* Mobile Sticky Tab Navigation Bar */}
      {appMode === 'dashboard' && (
        <div id="mobile-sticky-tabs" className="lg:hidden bg-white border-b border-slate-100 flex items-center justify-around py-2.5 sticky top-[68px] z-20 shadow-sm">
          {Object.entries(tabsConfig)
            .filter(([_, placement]) => placement === 'header')
            .map(([tabId]) => {
              // Guards
              if (tabId === 'admin' && userProfile?.userRole !== 'Admin') return null;
              if (tabId === 'business' && userProfile?.userRole === 'Parent') return null;

              const def = TAB_DEFINITIONS.find(t => t.id === tabId);
              if (!def) return null;

              const IconComponent = def.icon;
              const isBilling = tabId === 'billing';

              return (
                <button
                  key={tabId}
                  id={`mob-btn-${tabId}`}
                  onClick={() => setActiveTab(tabId as any)}
                  className={`flex flex-col items-center gap-1 text-[10px] uppercase font-bold transition cursor-pointer ${
                    activeTab === tabId
                      ? isBilling
                        ? 'text-amber-500 font-extrabold'
                        : 'text-orange-500 font-extrabold'
                      : isBilling
                      ? 'text-amber-500/70'
                      : 'text-slate-400'
                  }`}
                >
                  <IconComponent className={`w-4 h-4 ${isBilling ? 'animate-pulse text-amber-500' : ''}`} />
                  {tabId === 'billing' ? '👑 Club' : def.label === 'Near Playmates' ? 'Radar' : def.label === 'Chat Messenger' ? 'Chats' : def.label === 'Events & Classes' ? 'Events' : def.label === 'Specialists' ? 'Consult' : def.label}
                </button>
              );
            })}

          {/* More menu trigger */}
          <button
            id="mob-btn-more-menu"
            onClick={() => setIsSideMenuOpen(true)}
            className="flex flex-col items-center gap-1 text-[10px] uppercase font-extrabold transition text-slate-500 cursor-pointer"
          >
            <Menu className="w-4 h-4 text-slate-600" /> More
          </button>
        </div>
      )}

      {/* Main content body panel */}
      <main id="app-main" className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        
        {/* Onboarding View Logic */}
        {appMode === 'landing' && (
          <LandingLoginGateway 
            onStartSignUp={handleStartSignUp} 
            onQuickStart={handleQuickStartPlayground} 
            onGoogleSignIn={handleGoogleSignIn}
            isAuthenticating={isAuthenticating}
            externalAuthError={authErrorMessage}
            language={language}
            banners={banners.filter(b => b.placement === 'home' && b.active)}
          />
        )}

        {appMode === 'register' && (
          <div className="animate-fade-in">
            <RegistrationHub 
              onCompleteSignup={handleCompleteRegistration} 
              onCancel={() => setAppMode('landing')} 
              language={language}
              initialRole={suggestedRegisterRole}
              initialPhone={pendingRegisterDetails.phone}
              initialEmail={pendingRegisterDetails.email}
              initialPhoneVerified={pendingRegisterDetails.phoneVerified}
            />
          </div>
        )}

        {appMode === 'dashboard' && userProfile?.isBlocked && userProfile?.userRole !== 'Admin' ? (
          <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-[32px] text-center space-y-6 shadow-xl animate-fade-in">
            <div className="w-16 h-16 bg-rose-50 border border-rose-150 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="p-1 px-3 bg-red-100 border border-red-200 text-red-800 rounded-full text-[10px] uppercase font-black tracking-widest inline-block animate-pulse">
                Access Revoked
              </span>
              <h2 className="text-xl md:text-2xl font-serif font-black text-slate-950">Vernunt Account Suspended</h2>
              <p className="text-slate-600 text-xs leading-relaxed max-w-sm mx-auto">
                After comprehensive safety audit and identity profile evaluation under neighborhood child protection guidelines, this account has been suspended by community safety administrators.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] text-slate-505 leading-relaxed text-left space-y-2">
              <h4 className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider">🔒 Safeguard Restrictions Imposed:</h4>
              <p>• Your physical playgrounds search coords has been isolated and removed from other families' maps.</p>
              <p>• Inbound and outbound secure chats have been disabled to ensure mutual family safety.</p>
              <p>• Event scheduling, specialist listings, and referral bonuses have been locked.</p>
            </div>

            <div className="pt-2 flex flex-col gap-2 select-none">
              <a
                href="mailto:safety@vernunt.com?subject=Profile%20Suspension%20Appeal"
                className="w-full py-3 bg-rose-500 hover:bg-rose-650 text-white font-serif font-black text-xs rounded-2xl shadow-md tracking-wider transition uppercase"
              >
                Submit Official Verification Appeal
              </a>
              <button
                type="button"
                onClick={() => signOut(auth)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold text-xs rounded-2xl transition cursor-pointer"
              >
                Exit Session
              </button>
            </div>
          </div>
        ) : appMode === 'dashboard' && (
          <div id="dashboard-content-wrapper" className="space-y-6 animate-fade-in">
            
            {/* Promotional Campaign/Advertisement Placement: app_top */}
            {banners.filter(b => b.placement === 'app_top' && b.active).map((b) => (
              <div 
                key={b.id} 
                id={`app-top-promo-${b.id}`} 
                className="bg-gradient-to-r from-orange-50 to-amber-50/50 rounded-2xl border border-orange-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs text-left animate-fade-in"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-14 h-10 rounded-lg overflow-hidden shrink-0 border border-orange-200">
                    <img 
                      src={b.imageUrl} 
                      alt={b.title} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 bg-orange-600/10 text-orange-705 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mb-0.5">
                      🔥 Announcement
                    </span>
                    <h5 className="text-[11px] font-bold text-slate-800 tracking-wide leading-snug">
                      {b.title}
                    </h5>
                  </div>
                </div>
                {b.linkUrl && b.linkUrl !== '#' && (
                  <a 
                    href={b.linkUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-serif font-black text-[10px] rounded-xl text-center uppercase tracking-wider shrink-0 transition font-bold"
                  >
                    Details ↗
                  </a>
                )}
              </div>
            ))}

            {/* Tab: Radar Proximity Search */}
            {activeTab === 'radar' && (
              <div id="radar-dashboard-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1 & 2: Main Map/Radar Toggle & Grid */}
                <div id="radar-views-panel" className="lg:col-span-2 space-y-6">
                  
                  {/* REAL-TIME RADAR SEARCH & FILTERS HUB */}
                  <div id="filter-hub-card" className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-md space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-100">
                      <div>
                        <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5 font-serif">
                          <SlidersHorizontal className="w-4 h-4 text-rose-700" /> Match Criteria & Proximity Filters
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">Find compatible playmates and families near your area</p>
                      </div>

                      {/* Active filter counter badge */}
                      <div className="flex items-center gap-2">
                        {((maxDistanceKm !== 3.0) || filterPlayStyle !== 'All' || filterAgeGroup !== 'All' || filterGender !== 'All' || filterLanguage !== 'All' || filterSearchQuery || filterMinAge !== 0 || filterMaxAge !== 15 || selectedInterests.length > 0 || selectedPreferredActivities.length > 0 || filterAvailableDay !== 'All' || filterAvailableTime !== 'All' || filterOnlyConnected || filterOnlySaved || filterActivityRecency !== 'All') && (
                          <button
                            id="btn-clear-all-filters"
                            type="button"
                            onClick={() => {
                              setMaxDistanceKm(3.0);
                              setFilterPlayStyle('All');
                              setFilterAgeGroup('All');
                              setFilterGender('All');
                              setFilterLanguage('All');
                              setFilterSearchQuery('');
                              setFilterMinAge(0);
                              setFilterMaxAge(15);
                              setSelectedInterests([]);
                              setSelectedPreferredActivities([]);
                              setFilterAvailableDay('All');
                              setFilterAvailableTime('All');
                              setFilterOnlyConnected(false);
                              setFilterOnlySaved(false);
                              setFilterActivityRecency('All');
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" /> Reset Criteria
                          </button>
                        )}
                        <span className="text-[10px] font-black bg-rose-700 text-white px-3 py-1 rounded-full shadow-xs">
                          {filteredPlaymates.length} Compatible Matches
                        </span>
                      </div>
                    </div>

                    {/* Row 1: Search keyword search bar & Range Slider in KMs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Search Bar Input */}
                      <div className="flex flex-col space-y-1.5" id="filter-search-container">
                        <label className="text-[11px] font-extrabold text-rose-900 uppercase tracking-wider">Search Name / Language / Interest</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-600" />
                          <input
                            id="input-radar-search-query"
                            type="text"
                            value={filterSearchQuery}
                            onChange={(e) => setFilterSearchQuery(e.target.value)}
                            placeholder="e.g. Ayaan, Lego, Hindi, Soccer, Doctor..."
                            className="w-full pl-9 pr-4 py-2 bg-rose-50/30 border border-rose-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-rose-100 focus:bg-white transition"
                          />
                        </div>
                      </div>

                      {/* Distance Kilometers Slider */}
                      <div className="flex flex-col space-y-1.5" id="filter-distance-container">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-extrabold text-rose-900 uppercase tracking-wider flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-700" /> Max Match Radius
                          </label>
                          <span className="text-xs font-mono font-black text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
                            {maxDistanceKm} km
                          </span>
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                          <span className="text-[10px] text-slate-400 font-mono">Local</span>
                          <input
                            id="slider-filter-km-radius"
                            type="range"
                            min="0.0001"
                            max="1000"
                            step="0.0001"
                            value={maxDistanceKm}
                            onChange={(e) => setMaxDistanceKm(parseFloat(e.target.value))}
                            className="flex-1 accent-rose-700 h-2 bg-rose-100 rounded-lg cursor-pointer"
                          />
                          <span className="text-[10px] text-slate-400 font-mono">1000 km</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Filters Row: Connected Friends, Saved Profiles, Recency */}
                    <div id="quick-filters-row" className="p-3 bg-slate-50/80 rounded-2xl border border-slate-150/80 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Quick Filters:</span>

                        {/* Connected Friends Only */}
                        <button
                          id="btn-filter-only-connected"
                          type="button"
                          onClick={() => setFilterOnlyConnected(!filterOnlyConnected)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                            filterOnlyConnected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <UserCheck className={`w-3.5 h-3.5 ${filterOnlyConnected ? 'text-white' : 'text-emerald-600'}`} />
                          <span>Connected Friends</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${filterOnlyConnected ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {connectedIds.length}
                          </span>
                        </button>

                        {/* Saved Profiles Only */}
                        <button
                          id="btn-filter-only-saved"
                          type="button"
                          onClick={() => setFilterOnlySaved(!filterOnlySaved)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                            filterOnlySaved
                              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${filterOnlySaved ? 'fill-white text-white' : 'text-amber-500'}`} />
                          <span>Saved Profiles</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${filterOnlySaved ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {savedProfileIds.length}
                          </span>
                        </button>
                      </div>

                      {/* Recency Selector Chips */}
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs shrink-0">
                        <Clock className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
                        <button
                          id="btn-recency-all"
                          type="button"
                          onClick={() => setFilterActivityRecency('All')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            filterActivityRecency === 'All' ? 'bg-slate-900 text-white shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          All
                        </button>
                        <button
                          id="btn-recency-24h"
                          type="button"
                          onClick={() => setFilterActivityRecency('active24h')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            filterActivityRecency === 'active24h' ? 'bg-orange-500 text-white shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Active 24h
                        </button>
                        <button
                          id="btn-recency-1w"
                          type="button"
                          onClick={() => setFilterActivityRecency('active1w')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            filterActivityRecency === 'active1w' ? 'bg-orange-500 text-white shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Active 1 Wk
                        </button>
                        <button
                          id="btn-recency-active-now"
                          type="button"
                          onClick={() => setFilterActivityRecency('currentlyActive')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            filterActivityRecency === 'currentlyActive' ? 'bg-emerald-500 text-white shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Active Now
                        </button>
                      </div>
                    </div>

                    {/* Expanded Dropdowns Grid / Collapsible Controls */}
                    <div className="pt-2 border-t border-slate-50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <button
                          id="btn-toggle-advanced-refinement"
                          type="button"
                          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                          className="text-xs font-bold text-slate-600 hover:text-orange-600 transition flex items-center gap-1 focus:outline-none cursor-pointer self-start"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>{showAdvancedFilters ? 'Hide Advanced Match Keys ▲' : 'Show Advanced Match Keys (Age, Style, Language) ▼'}</span>
                        </button>
                        
                        {/* Quick Distance shortcut presets for convenience */}
                        <div className="flex flex-wrap items-center gap-1 text-[10px]" id="filter-distance-presets">
                          <span className="text-slate-400 font-semibold">Presets:</span>
                          <button
                            id="btn-preset-distance-00001"
                            type="button"
                            onClick={() => setMaxDistanceKm(0.0001)}
                            className={`px-1.5 py-0.5 rounded font-mono cursor-pointer ${maxDistanceKm === 0.0001 ? 'bg-orange-500 text-white font-bold' : 'bg-slate-100 hover:bg-slate-150 text-slate-600'}`}
                          >
                            0.0001km
                          </button>
                          <button
                            id="btn-preset-distance-1"
                            type="button"
                            onClick={() => setMaxDistanceKm(1.0)}
                            className={`px-1.5 py-0.5 rounded font-mono cursor-pointer ${maxDistanceKm === 1.0 ? 'bg-orange-500 text-white font-bold' : 'bg-slate-100 hover:bg-slate-150 text-slate-600'}`}
                          >
                            1km
                          </button>
                          <button
                            id="btn-preset-distance-10"
                            type="button"
                            onClick={() => setMaxDistanceKm(10.0)}
                            className={`px-1.5 py-0.5 rounded font-mono cursor-pointer ${maxDistanceKm === 10.0 ? 'bg-orange-500 text-white font-bold' : 'bg-slate-100 hover:bg-slate-150 text-slate-600'}`}
                          >
                            10km
                          </button>
                          <button
                            id="btn-preset-distance-100"
                            type="button"
                            onClick={() => setMaxDistanceKm(100.0)}
                            className={`px-1.5 py-0.5 rounded font-mono cursor-pointer ${maxDistanceKm === 100.0 ? 'bg-orange-500 text-white font-bold' : 'bg-slate-100 hover:bg-slate-150 text-slate-600'}`}
                          >
                            100km
                          </button>
                          <button
                            id="btn-preset-distance-1000"
                            type="button"
                            onClick={() => setMaxDistanceKm(1000.0)}
                            className={`px-1.5 py-0.5 rounded font-mono cursor-pointer ${maxDistanceKm === 1000.0 ? 'bg-orange-500 text-white font-bold' : 'bg-slate-100 hover:bg-slate-150 text-slate-600'}`}
                          >
                            1000km
                          </button>
                        </div>
                      </div>

                      {showAdvancedFilters && (
                        <div id="advanced-filters-grid" className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3.5 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden animate-fade-in">
                          {/* Advanced Column 1: Play style */}
                          <div id="adv-filter-col-playstyle" className="flex flex-col space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Play style</label>
                            <select
                                id="select-filter-playstyle"
                                value={filterPlayStyle}
                                onChange={(e) => setFilterPlayStyle(e.target.value)}
                                className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-orange-100"
                            >
                              <option value="All">All styles</option>
                              <option value="Cooperative & Social">Cooperative & Shared</option>
                              <option value="Energetic & Sporty">Energetic & Outdoor</option>
                              <option value="Quiet & Creative">Quiet & Creative</option>
                              <option value="Inquisitive & Educational">Educational & Puzzles</option>
                              <option value="Outdoor">Outdoor Indian Sports</option>
                              <option value="Indoor">Indoor Traditional Games</option>
                            </select>
                          </div>

                          {/* Advanced Column 2: Age group */}
                          <div id="adv-filter-col-age" className="flex flex-col space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Age bracket preset</label>
                            <select
                                id="select-filter-age"
                                value={filterAgeGroup}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFilterAgeGroup(val);
                                  // Update age range sliders to correspond to preset for optimal convenience:
                                  if (val === 'Infant') {
                                    setFilterMinAge(0);
                                    setFilterMaxAge(1);
                                  } else if (val === 'Toddler') {
                                    setFilterMinAge(1);
                                    setFilterMaxAge(2);
                                  } else if (val === 'Preschool') {
                                    setFilterMinAge(3);
                                    setFilterMaxAge(4);
                                  } else if (val === 'Kindergarten') {
                                    setFilterMinAge(5);
                                    setFilterMaxAge(6);
                                  } else if (val === 'SchoolAge') {
                                    setFilterMinAge(7);
                                    setFilterMaxAge(15);
                                  } else {
                                    setFilterMinAge(0);
                                    setFilterMaxAge(15);
                                  }
                                }}
                                className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-orange-100"
                            >
                              <option value="All">All primary ages</option>
                              <option value="Infant">Infant / Baby (0–1 yr)</option>
                              <option value="Toddler">Toddler (1-2 yrs)</option>
                              <option value="Preschool">Preschool (3-4 yrs)</option>
                              <option value="Kindergarten">Kindergarten (5-6 yrs)</option>
                              <option value="SchoolAge">School-Age (7+ yrs)</option>
                            </select>
                          </div>

                          {/* Advanced Column 3: Languages spoken */}
                          <div id="adv-filter-col-language" className="flex flex-col space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Language Spoken</label>
                            <select
                                id="select-filter-language"
                                value={filterLanguage}
                                onChange={(e) => setFilterLanguage(e.target.value)}
                                className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-orange-100 max-w-full truncate"
                            >
                              <option value="All">All Languages (28+ Indian & Global)</option>
                              <option value="Assamese">Assamese / অসমীয়া</option>
                              <option value="Bengali">Bengali / বাংলা</option>
                              <option value="Bhojpuri">Bhojpuri / भोजपुरी</option>
                              <option value="Bodo">Bodo / बर'</option>
                              <option value="Chhattisgarhi">Chhattisgarhi / छत्तीसगढ़ी</option>
                              <option value="Dogri">Dogri / डोगरी</option>
                              <option value="English">English</option>
                              <option value="Garhwali">Garhwali / गढ़वाली</option>
                              <option value="Garo">Garo</option>
                              <option value="Gujarati">Gujarati / ગુજરાતી</option>
                              <option value="Haryanvi">Haryanvi / हरियाणवी</option>
                              <option value="Hindi">Hindi / हिन्दी</option>
                              <option value="Kannada">Kannada / ಕನ್ನಡ</option>
                              <option value="Kashmiri">Kashmiri / कॉशुर</option>
                              <option value="Khasi">Khasi / खासी</option>
                              <option value="Konkani">Konkani / कोंकणी</option>
                              <option value="Kumaoni">Kumaoni / कुमाऊँनी</option>
                              <option value="Maithili">Maithili / मैथिली</option>
                              <option value="Malayalam">Malayalam / മലയാളം</option>
                              <option value="Manipuri">Manipuri / मणीपुरी</option>
                              <option value="Marathi">Marathi / मराठी</option>
                              <option value="Marwari">Marwari / मारवाड़ी</option>
                              <option value="Mizo">Mizo / मिज़ो</option>
                              <option value="Nepali">Nepali / नेपाली</option>
                              <option value="Odia">Odia / ଓଡ଼ିଆ</option>
                              <option value="Punjabi">Punjabi / ਪੰਜਾਬੀ</option>
                              <option value="Rajasthani">Rajasthani / राजस्थानी</option>
                              <option value="Sanskrit">Sanskrit / संस्कृतम्</option>
                              <option value="Santali">Santali / संथाली</option>
                              <option value="Sindhi">Sindhi / सिंधी</option>
                              <option value="Tamil">Tamil / தமிழ்</option>
                              <option value="Telugu">Telugu / తెలుగు</option>
                              <option value="Tulu">Tulu / ತುಳು</option>
                              <option value="Urdu">Urdu / اردو</option>
                              <option value="Mandarin">Mandarin</option>
                              <option value="Russian">Russian</option>
                              <option value="French">French</option>
                              <option value="German">German</option>
                              <option value="Spanish">Spanish</option>
                            </select>
                          </div>

                          {/* Advanced Column 4: Gender */}
                          <div id="adv-filter-col-gender" className="flex flex-col space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Child gender</label>
                            <select
                                id="select-filter-gender"
                                value={filterGender}
                                onChange={(e) => setFilterGender(e.target.value)}
                                className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-orange-100"
                            >
                              <option value="All">All genders</option>
                              <option value="Boy">Boy</option>
                              <option value="Girl">Girl</option>
                            </select>
                          </div>

                          {/* Continuous custom Age Range continuous sliders & Available days/times selectors */}
                          <div className="sm:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-3.5 mt-1 border-t border-slate-200/60">
                            {/* Min / Max Age range slider pair */}
                            <div className="flex flex-col space-y-1.5 bg-white p-3 rounded-xl border border-slate-100">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                  👶 Specific Age range
                                </span>
                                <span className="text-[11px] font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100/50">
                                  {filterMinAge} to {filterMaxAge} yrs old
                                </span>
                              </div>
                              <div className="flex items-center gap-3 pt-1">
                                <div className="flex-1 flex flex-col">
                                  <span className="text-[9px] text-slate-400 font-bold mb-0.5">Min: {filterMinAge} yr</span>
                                  <input
                                    type="range"
                                    min="0"
                                    max="15"
                                    value={filterMinAge}
                                    onChange={(e) => setFilterMinAge(Math.min(parseInt(e.target.value), filterMaxAge))}
                                    className="w-full accent-orange-500 h-1 bg-slate-100 rounded cursor-pointer"
                                  />
                                </div>
                                <div className="flex-1 flex flex-col">
                                  <span className="text-[9px] text-slate-400 font-bold mb-0.5">Max: {filterMaxAge} yrs</span>
                                  <input
                                    type="range"
                                    min="0"
                                    max="15"
                                    value={filterMaxAge}
                                    onChange={(e) => setFilterMaxAge(Math.max(parseInt(e.target.value), filterMinAge))}
                                    className="w-full accent-orange-500 h-1 bg-slate-100 rounded cursor-pointer"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Availability selects */}
                            <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-100">
                              <div className="flex flex-col space-y-1">
                                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Available day</label>
                                <select
                                  value={filterAvailableDay}
                                  onChange={(e) => setFilterAvailableDay(e.target.value)}
                                  className="px-2 py-1.5 bg-slate-50 border border-slate-150 rounded-lg text-xs outline-none"
                                >
                                  <option value="All">Any day</option>
                                  <option value="Monday">Monday</option>
                                  <option value="Tuesday">Tuesday</option>
                                  <option value="Wednesday">Wednesday</option>
                                  <option value="Thursday">Thursday</option>
                                  <option value="Friday">Friday</option>
                                  <option value="Saturday">Saturday</option>
                                  <option value="Sunday">Sunday</option>
                                </select>
                              </div>
                              <div className="flex flex-col space-y-1">
                                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Available time</label>
                                <select
                                  value={filterAvailableTime}
                                  onChange={(e) => setFilterAvailableTime(e.target.value)}
                                  className="px-2 py-1.5 bg-slate-50 border border-slate-150 rounded-lg text-xs outline-none"
                                >
                                  <option value="All">Any time</option>
                                  <option value="Morning">Morning</option>
                                  <option value="Afternoon">Afternoon</option>
                                  <option value="Evening">Evening</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Shared interests click selector section */}
                          <div className="sm:col-span-4 space-y-1.5 pt-3 border-t border-slate-200/60">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                ⚽ Filter by shared hobby interests ({selectedInterests.length} selected)
                              </label>
                              {selectedInterests.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedInterests([])}
                                  className="text-[10px] font-bold text-orange-600 hover:underline"
                                >
                                  Clear interests filter
                                </button>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-slate-150">
                              {Array.from(new Set(playmates.flatMap(p => p.interests || []))).map(interest => {
                                const isSel = selectedInterests.includes(interest);
                                return (
                                  <button
                                    key={interest}
                                    type="button"
                                    onClick={() => {
                                      if (isSel) {
                                        setSelectedInterests(selectedInterests.filter(i => i !== interest));
                                      } else {
                                        setSelectedInterests([...selectedInterests, interest]);
                                      }
                                    }}
                                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                      isSel
                                        ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                                        : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600 font-medium'
                                    }`}
                                  >
                                    <span>#{interest}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Preferred activities click selector section */}
                          <div className="sm:col-span-4 space-y-1.5 pt-3 border-t border-slate-200/60">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                🎯 Filter by preferred activities ({selectedPreferredActivities.length} selected)
                              </label>
                              {selectedPreferredActivities.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPreferredActivities([])}
                                  className="text-[10px] font-bold text-orange-600 hover:underline"
                                >
                                  Clear activities filter
                                </button>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-slate-150">
                              {Array.from(new Set(playmates.flatMap(p => p.preferredActivities || []))).map(act => {
                                const isSel = selectedPreferredActivities.includes(act);
                                return (
                                  <button
                                    key={act}
                                    type="button"
                                    onClick={() => {
                                      if (isSel) {
                                        setSelectedPreferredActivities(selectedPreferredActivities.filter(a => a !== act));
                                      } else {
                                        setSelectedPreferredActivities([...selectedPreferredActivities, act]);
                                      }
                                    }}
                                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                      isSel
                                        ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                                        : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600 font-medium'
                                    }`}
                                  >
                                    <span>⭐ {act}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* View slider controls */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                    <div id="radar-toggle" className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
                      <button
                        id="btn-toggle-list-lens"
                        onClick={() => setMapOrRadarView('list')}
                        className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition cursor-pointer ${mapOrRadarView === 'list' ? 'bg-slate-900 text-white shadow-xs' : 'hover:bg-slate-200/60 text-slate-600'}`}
                      >
                        📋 List View
                      </button>
                      <button
                        id="btn-toggle-radar-lens"
                        onClick={() => setMapOrRadarView('radar')}
                        className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition cursor-pointer ${mapOrRadarView === 'radar' ? 'bg-slate-900 text-white shadow-xs' : 'hover:bg-slate-200/60 text-slate-600'}`}
                      >
                        📡 Radar Scan
                      </button>
                      <button
                        id="btn-toggle-map-lens"
                        onClick={() => setMapOrRadarView('map')}
                        className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition cursor-pointer ${mapOrRadarView === 'map' ? 'bg-slate-900 text-white shadow-xs' : 'hover:bg-slate-200/60 text-slate-600'}`}
                      >
                        🗺️ Maps Range
                      </button>
                    </div>

                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                      GPS Gated Parent Matching
                    </span>
                  </div>

                  {/* Projected Match Lenses */}
                  {mapOrRadarView === 'list' ? (
                    <PlaymateListView
                      playmates={filteredPlaymates}
                      userProfile={userProfile}
                      onSelectPlaymate={handleSelectPlaymate}
                      onOpenDetailModal={(p) => setDetailModalProfile(p)}
                      selectedPlaymateId={activePlaymate?.id}
                      connectedIds={connectedIds}
                      interestsSent={interestsSent}
                      interestsReceived={interestsReceived}
                      savedProfileIds={savedProfileIds}
                      onToggleSave={handleToggleSaveProfile}
                      onSendConnection={handleSendConnectionRequest}
                      onAcceptConnection={handleAcceptConnection}
                      maxDistanceKm={maxDistanceKm}
                    />
                  ) : mapOrRadarView === 'radar' ? (
                    <PlaymateRadar 
                      playmates={filteredPlaymates} 
                      userProfile={userProfile} 
                      onSelectPlaymate={(p) => {
                        handleSelectPlaymate(p);
                        setDetailModalProfile(p);
                      }} 
                      selectedPlaymateId={activePlaymate?.id}
                      maxDistanceKm={maxDistanceKm}
                    />
                  ) : (
                    <PlaymateMap 
                      playmates={filteredPlaymates} 
                      userProfile={userProfile} 
                      onSelectPlaymate={(p) => {
                        handleSelectPlaymate(p);
                        setDetailModalProfile(p);
                      }} 
                      selectedPlaymateId={activePlaymate?.id}
                      maxDistanceKm={maxDistanceKm}
                      events={eventsList}
                      onToggleJoinEvent={(eventId, join) => {
                        setEventsList(prev => prev.map(e => {
                          if (e.id === eventId) {
                            return {
                              ...e,
                              joined: join,
                              attendeesCount: join ? e.attendeesCount + 1 : Math.max(0, e.attendeesCount - 1)
                            };
                          }
                          return e;
                        }));
                      }}
                      onNavigateToEventsTab={(_cat, _evtId) => {
                        setActiveTab('events');
                      }}
                    />
                  )}
                </div>

                {/* Column 3: Playmate details profiling card */}
                <div id="profile-card-column" className="lg:col-span-1 space-y-5">
                  {/* Promotional Campaign/Advertisement Placement: app_sidebar */}
                  {banners.filter(b => b.placement === 'app_sidebar' && b.active).map((b) => (
                    <div 
                      key={b.id} 
                      id={`app-sidebar-promo-${b.id}`} 
                      className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs hover:border-orange-200 transition duration-300 text-left animate-fade-in"
                    >
                      <div className="relative h-28 w-full bg-slate-900">
                        <img 
                          src={b.imageUrl} 
                          alt={b.title} 
                          className="w-full h-full object-cover opacity-85" 
                          referrerPolicy="no-referrer"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex flex-col justify-end p-3">
                           <span className="bg-orange-500 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded w-max mb-1 shadow-sm font-bold">
                             📢 Sponsor Spot
                           </span>
                           <h5 className="text-white text-[10px] font-bold leading-tight truncate">
                             {b.title}
                           </h5>
                         </div>
                       </div>
                       {b.linkUrl && b.linkUrl !== '#' && (
                         <div className="p-2 border-t border-slate-50 bg-slate-50 flex justify-end">
                           <a 
                             href={b.linkUrl} 
                             target="_blank" 
                             rel="noopener noreferrer" 
                             className="text-[9px] text-orange-600 hover:text-orange-700 font-bold uppercase tracking-wider flex items-center gap-0.5"
                           >
                             Explore Campaign ↗
                           </a>
                         </div>
                       )}
                     </div>
                   ))}

                  {filteredPlaymates.length > 0 && (
                    <div id="playmates-roster-switcher" className="bg-white rounded-3xl p-5 border border-slate-150 shadow-sm space-y-3.5 text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <span>🔍 Matching Cohort Profiles</span>
                              <span className="px-2 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold font-mono">
                                {filteredPlaymates.length}
                              </span>
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">Click any profile card below to inspect child interests, parent safety verifications, and connect</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowContactsPrivacyModal(true)}
                            className="text-[10px] text-rose-850 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                            title="Set which phone contacts can see or connect with your family profile"
                          >
                            <Smartphone className="w-3 h-3 text-rose-700" />
                            <span>Contacts Privacy</span>
                          </button>
                          <span className="text-[10px] text-orange-600 font-extrabold bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                            Nearby Playmates
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-stretch gap-3.5 overflow-x-auto pb-2 scrollbar-thin pt-1">
                        {filteredPlaymates.map((p) => {
                          const isSelected = activePlaymate?.id === p.id;
                          const dKm = getHaversineDistance(userLat, userLng, p.location.lat, p.location.lng);
                          const proxBadge = getProximityBadge(dKm);
                          return (
                            <div
                              key={p.id}
                              id={`roster-card-${p.id}`}
                              onClick={() => {
                                handleSelectPlaymate(p);
                                setDetailModalProfile(p);
                              }}
                              className={`flex flex-col justify-between p-3 rounded-2xl border-2 min-w-[155px] sm:min-w-[175px] max-w-[185px] transition-all duration-200 cursor-pointer shadow-2xs group hover:shadow-md ${
                                isSelected 
                                  ? 'bg-rose-50/50 border-rose-400 text-slate-900 ring-4 ring-rose-100/70 scale-[1.02]' 
                                  : 'bg-white border-slate-200/80 text-slate-700 hover:border-rose-300'
                              }`}
                            >
                              {/* Profile Cover Image with verified tags */}
                              <div className="relative w-full h-32 sm:h-36 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                <img 
                                  src={p.photoUrl} 
                                  alt={p.childName} 
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = p.childGender === 'Girl'
                                      ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400'
                                      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400';
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>

                                {/* Top Badges */}
                                <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                                  {p.aadhaarVerified ? (
                                    <span className="text-[8px] font-black uppercase bg-emerald-600/90 backdrop-blur-xs text-white px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-xs">
                                      ✓ Verified
                                    </span>
                                  ) : (
                                    <span className="text-[8px] font-bold uppercase bg-slate-900/60 backdrop-blur-xs text-white px-1.5 py-0.5 rounded-md">
                                      Playmate
                                    </span>
                                  )}

                                  {connectedIds.includes(p.id) && (
                                    <span className="text-[8px] font-black uppercase bg-amber-500 text-white px-1.5 py-0.5 rounded-md shadow-xs">
                                      Connected
                                    </span>
                                  )}
                                </div>

                                {/* Color-Coded Proximity Badge Overlay */}
                                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white pointer-events-none">
                                  <span 
                                    id={`roster-dist-badge-${p.id}`}
                                    className={`text-[9.5px] font-mono font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs ${proxBadge.badgeOverlayClass}`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${proxBadge.dotColor} shrink-0`}></span>
                                    {proxBadge.distanceText}
                                  </span>
                                  {isSelected && (
                                    <span className="text-[9px] bg-rose-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">
                                      Active
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Child Details */}
                              <div className="pt-2.5 space-y-1 text-left flex-1 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-serif font-black text-xs sm:text-sm text-slate-900 truncate leading-tight group-hover:text-rose-700 transition">
                                      {p.childName}, {p.childAge}y
                                    </h4>
                                  </div>

                                  <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500 font-semibold">
                                    <span>{p.childGender}</span>
                                    <span>•</span>
                                    <span className="truncate">{p.gradeLevel || 'Grade School'}</span>
                                  </div>

                                  {/* Immediate Proximity Category Pill */}
                                  <div className="mt-1.5">
                                    <span 
                                      id={`roster-tier-badge-${p.id}`}
                                      className={`inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-md border ${proxBadge.badgeClass}`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${proxBadge.dotColor} shrink-0`}></span>
                                      <span>{proxBadge.label}</span>
                                      <span className="text-[8px] opacity-75 uppercase font-medium">({proxBadge.subtext})</span>
                                    </span>
                                  </div>
                                </div>

                                {p.interests && p.interests.length > 0 && (
                                  <div className="pt-1.5">
                                    <span className="inline-block text-[9px] text-rose-800 bg-rose-50 border border-rose-150 px-2 py-0.5 rounded-md font-bold truncate max-w-full">
                                      #{p.interests[0]}
                                    </span>
                                  </div>
                                )}

                                <button
                                  type="button"
                                  className={`w-full mt-2 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                                    isSelected
                                      ? 'bg-rose-700 text-white shadow-xs'
                                      : 'bg-slate-100 hover:bg-rose-100 text-slate-800 hover:text-rose-900'
                                  }`}
                                >
                                  {isSelected ? '✓ Active Profile' : 'View Profile'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick Connect Subscriber Privilege Card */}
                  {userProfile?.subscriptionActive && activePlaymate && (
                    <div id="quick-connect-card" className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-4 rounded-3xl text-white shadow-sm space-y-2.5 animate-fade-in border border-orange-300/40">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 text-white px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                          👑 Active Subscriber Pass
                        </span>
                        <span className="text-[10px] font-bold text-amber-100 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-200 fill-current" /> Instant Chat
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
                        <div>
                          <h4 className="font-serif font-bold text-sm text-white leading-tight">
                            Quick Connect with {activePlaymate.childName}
                          </h4>
                          <p className="text-[11px] text-orange-100 font-medium leading-snug mt-0.5">
                            Start a direct chat session with parent {activePlaymate.parentName}
                          </p>
                        </div>
                        <button
                          id="btn-quick-connect"
                          type="button"
                          onClick={() => handleOpenChatTrigger(activePlaymate)}
                          className="px-4 py-2 bg-white hover:bg-orange-50 text-orange-600 font-extrabold text-xs rounded-2xl shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 border border-orange-100"
                        >
                          <MessageSquare className="w-4 h-4 fill-orange-500 text-orange-500" />
                          <span>Quick Connect</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {activePlaymate ? (
                    <PlaymateCard 
                      profile={activePlaymate} 
                      onInitiatePlaydate={handleBookPlaydateTrigger}
                      onOpenChat={handleOpenChatTrigger}
                      onOpenReport={(p) => setActiveReportProfile(p)}
                      onOpenVerify={(p) => setActiveVerifyProfile(p)}
                      isConnected={connectedIds.includes(activePlaymate.id)}
                      isInterestSent={interestsSent.includes(activePlaymate.id)}
                      isInterestReceived={interestsReceived.includes(activePlaymate.id)}
                      isSaved={savedProfileIds.includes(activePlaymate.id)}
                      onToggleSave={handleToggleSaveProfile}
                      onAcceptConnection={handleAcceptConnection}
                      onSendConnection={handleSendConnectionRequest}
                      currentUserLat={userLat}
                      currentUserLng={userLng}
                      currentUserProfile={userProfile}
                      onUnlockPhone={handleUnlockPhoneByCredit}
                      onNavigateToReferrals={() => setActiveTab('referrals')}
                      onBlockProfile={handleBlockParent}
                    />
                  ) : (
                    <div className="bg-white rounded-3xl p-8 border border-dashed border-slate-200 text-center text-slate-400 h-full flex flex-col items-center justify-center space-y-3">
                      <span className="text-3xl">🧩</span>
                      <p className="text-sm font-semibold">No playmates match your active search filters.</p>
                      <button 
                        id="btn-clear-filters-card"
                        type="button"
                        onClick={() => {
                          setMaxDistanceKm(5.0);
                          setFilterPlayStyle('All');
                          setFilterAgeGroup('All');
                          setFilterGender('All');
                          setFilterLanguage('All');
                          setFilterSearchQuery('');
                        }}
                        className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition active:scale-95"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Tab: Instant chats log */}
            {activeTab === 'chat' && (
              <ChatPanel 
                playmates={playmates} 
                userProfile={userProfile} 
                activePlaymate={selectedPlaymate} 
                onBackToRadar={() => setActiveTab('radar')}
                connectedIds={connectedIds}
                interestsSent={interestsSent}
                interestsReceived={interestsReceived}
                onAcceptConnection={handleAcceptConnection}
                onSendConnection={handleSendConnectionRequest}
                onTriggerAadhaarVerification={ensureAadhaarVerified}
              />
            )}

            {/* Tab: Structured schedules */}
            {activeTab === 'planner' && (
              <PlaydatePlanner 
                playmates={playmates} 
                userProfile={userProfile} 
                activeCompanion={selectedPlaymate}
              />
            )}

            {/* Tab: Community Board walk plans */}
            {activeTab === 'events' && (
              <EventsTab 
                userProfile={userProfile} 
                eventsList={eventsList}
                setEventsList={setEventsList}
                onAddBooking={(newBooking) => {
                  setBookingsList(prev => [newBooking, ...prev]);
                  confetti({ particleCount: 150, spread: 80 });
                }}
                onUpdateRole={(newRole) => {
                  setUserRole(newRole);
                  if (userProfile) {
                    setUserProfile({ ...userProfile, userRole: newRole });
                  }
                }}
                globalCommissionRate={globalCommissionRate}
                onUpdateUserProfile={(profileObj) => {
                  setUserProfile(profileObj);
                }}
              />
            )}

            {/* Tab: Specialists registration & appointments booking */}
            {activeTab === 'specialists' && (
              <SpecialistsTab 
                currentProfile={userProfile}
                onUpdateRole={(newRole) => {
                  setUserRole(newRole);
                  if (userProfile) {
                    setUserProfile({ ...userProfile, userRole: newRole });
                  }
                }}
                onAddNewSpecialist={(newSpec) => {
                  setSpecialistsList(prev => [...prev, newSpec]);
                  confetti({ particleCount: 100, spread: 60 });
                }}
                specialistsList={specialistsList}
                bookingsList={bookingsList}
                onAddBooking={(newBooking) => {
                  setBookingsList(prev => [newBooking, ...prev]);
                  confetti({ particleCount: 140, spread: 75 });
                }}
                globalCommissionRate={globalCommissionRate}
                onUpdateUserProfile={(profileObj) => {
                  setUserProfile(profileObj);
                }}
              />
            )}

            {/* Tab: Consolidated Business dashboard */}
            {activeTab === 'business' && (
              <BusinessDashboard 
                userProfile={userProfile}
                onUpdateProfile={(updated) => {
                  setUserProfile(updated);
                }}
                playmates={playmates}
                eventsList={eventsList}
                setEventsList={setEventsList}
                specialistsList={specialistsList}
                setSpecialistsList={setSpecialistsList}
                bookingsList={bookingsList}
                globalCommissionRate={globalCommissionRate}
                setGlobalCommissionRate={setGlobalCommissionRate}
                userRole={userRole}
                onUpdateRole={(newRole) => {
                  setUserRole(newRole);
                  if (userProfile) {
                    setUserProfile({ ...userProfile, userRole: newRole });
                  }
                }}
              />
            )}

            {/* Tab: Health vaccine records */}
            {activeTab === 'portfolio' && (
              <PortfoliosTab currentProfile={userProfile} />
            )}

            {/* Tab: System Admin panel */}
            {activeTab === 'admin' && userProfile?.userRole === 'Admin' && (
              <AdminDashboard 
                userProfile={userProfile}
                playmates={playmates}
                eventsList={eventsList}
                setEventsList={setEventsList}
              />
            )}

            {/* Tab: Affiliate Partner Center (WooCommerce Affiliate Model) */}
            {activeTab === 'affiliate' && (
              <AffiliateDashboard 
                userProfile={userProfile}
                onUpdateUserProfile={(updated) => setUserProfile(updated)}
                eventsList={eventsList}
                specialistsList={specialistsList}
              />
            )}

            {/* Tab: Parental Referral Rewards Center */}
            {activeTab === 'referrals' && (
              <ReferralPortal 
                userProfile={userProfile}
                onUpdateUserProfile={(updated) => setUserProfile(updated)}
                allPlaymates={playmates}
              />
            )}

            {/* Tab: Subscription & Billing Portal */}
            {activeTab === 'billing' && (
              <BillingPortal 
                userProfile={userProfile}
                onUpdateUserProfile={(updated) => setUserProfile(updated)}
              />
            )}

            {/* Tab: 1000+ Child Guides & SEO Knowledge Base */}
            {activeTab === 'knowledge' && (
              <KnowledgeHub 
                onNavigateToRadar={() => setActiveTab('radar')}
              />
            )}

          </div>
        )}

      </main>

      {/* Persistent global footer */}
      <footer id="global-page-footer" className="bg-white border-t border-slate-100 py-8 text-center text-xs text-slate-400 mt-auto px-4">
        <div className="max-w-4xl mx-auto space-y-4 mb-5">
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400">Host Portals:</span>
            <button
              id="footer-btn-host-class"
              onClick={() => {
                if (userProfile && appMode === 'dashboard') {
                  setActiveTab('events');
                  setTimeout(() => {
                    const hostBtn = document.getElementById('btn-trigger-propose-event');
                    if (hostBtn) hostBtn.click();
                  }, 100);
                } else {
                  setSuggestedRegisterRole('Event Organizer');
                  setAppMode('register');
                }
              }}
              className="px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100 rounded-lg font-bold text-[11px] transition shadow-sm cursor-pointer animate-pulse-slow"
            >
              ➕ Host Activity or Class
            </button>
            <button
              id="footer-btn-register-spec"
              onClick={() => {
                if (userProfile && appMode === 'dashboard') {
                  setActiveTab('specialists');
                  setTimeout(() => {
                    const regBtn = document.getElementById('btn-trigger-register-specialist');
                    if (regBtn) regBtn.click();
                  }, 100);
                } else {
                  setSuggestedRegisterRole('Portfolio Professional');
                  setAppMode('register');
                }
              }}
              className="px-3 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-100 rounded-lg font-bold text-[11px] transition shadow-sm cursor-pointer"
            >
              💼 Register Consultant Portfolio
            </button>
            <button
              id="footer-btn-biz-console"
              onClick={() => {
                if (userProfile && appMode === 'dashboard') {
                  setActiveTab('business');
                } else {
                  setSuggestedRegisterRole('Event Organizer');
                  setAppMode('register');
                }
              }}
              className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-bold text-[11px] transition shadow-md cursor-pointer"
            >
              ⚙️ Host Business Console
            </button>
            <button
              id="footer-btn-knowledge-hub"
              onClick={() => {
                if (appMode !== 'dashboard') {
                  setAppMode('dashboard');
                }
                setActiveTab('knowledge');
              }}
              className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg font-bold text-[11px] transition shadow-xs cursor-pointer flex items-center gap-1"
            >
              📚 1,000+ Child Growth Guides
            </button>
          </div>
        </div>
        <p>© 2026 Vernunt Neighborhood Families Inc. All Rights Reserved. Created under secure, verified vaccine and children safety guidelines.</p>
        <button
          id="btn-footer-tac-toggle"
          onClick={() => setShowLegalModal(true)}
          className="text-orange-500 font-bold hover:underline mt-1.5 focus:outline-none cursor-pointer"
        >
          View Privacy Regulations & Guardian Terms of Service
        </button>
      </footer>

      {/* Global Modals overlay injections */}
      {detailModalProfile && (
        <PlaymateDetailModal 
          profile={detailModalProfile}
          onClose={() => setDetailModalProfile(null)}
          onInitiatePlaydate={handleBookPlaydateTrigger}
          onOpenChat={handleOpenChatTrigger}
          onOpenReport={(p) => setActiveReportProfile(p)}
          onOpenVerify={(p) => setActiveVerifyProfile(p)}
          isConnected={connectedIds.includes(detailModalProfile.id)}
          isInterestSent={interestsSent.includes(detailModalProfile.id)}
          isInterestReceived={interestsReceived.includes(detailModalProfile.id)}
          isSaved={savedProfileIds.includes(detailModalProfile.id)}
          onToggleSave={handleToggleSaveProfile}
          onAcceptConnection={handleAcceptConnection}
          onSendConnection={handleSendConnectionRequest}
          currentUserLat={userLat}
          currentUserLng={userLng}
          currentUserProfile={userProfile}
          onUnlockPhone={handleUnlockPhoneByCredit}
          onNavigateToReferrals={() => setActiveTab('referrals')}
          onBlockProfile={handleBlockParent}
        />
      )}

      {activeReportProfile && (
        <ReportModal 
          profile={activeReportProfile} 
          onClose={() => setActiveReportProfile(null)} 
        />
      )}

      {activeVerifyProfile && (
        <VerificationModal 
          profile={activeVerifyProfile} 
          onClose={() => setActiveVerifyProfile(null)} 
          onVerifyCompleted={handleCompleteVerification}
        />
      )}

      {showSOSModal && (
        <EmergencySOSModal 
          onClose={() => setShowSOSModal(false)}
          userProfile={userProfile}
        />
      )}

      {showLegalModal && (
        <LegalPolicyModal 
          onKeepClose={() => setShowLegalModal(false)}
        />
      )}

      {showEditProfileModal && userProfile && (
        <EditProfileModal 
          currentProfile={userProfile}
          onClose={() => setShowEditProfileModal(false)}
          onSave={(updated) => {
            setUserProfile(updated);
            setShowEditProfileModal(false);
            confetti({ particleCount: 80, spread: 50 });
          }}
        />
      )}

      {showAadhaarVerifyModal && userProfile && (
        <AadhaarVerificationModal 
          userProfile={userProfile}
          onClose={() => {
            setShowAadhaarVerifyModal(false);
            setOnAadhaarVerifySuccessCallback(null);
          }}
          onVerifySuccess={handleAadhaarVerifySuccess}
          actionMessage={aadhaarActionMessage}
        />
      )}

      {/* Real-time Toast notification */}
      {showPushToast && latestNotification && (
        <div id="push-notification-toast" className="fixed top-20 right-5 w-full max-w-sm bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl shadow-2xl z-[120] flex gap-3 items-start animate-fade-in">
          <div className="p-2 bg-orange-500 rounded-xl text-slate-950 mt-0.5 text-center flex items-center justify-center font-bold text-xs">
            🔔
          </div>
          <div className="flex-1 space-y-1 text-left">
            <div className="flex justify-between items-center">
              <span className="text-[8px] uppercase tracking-widest font-black text-orange-400">🔔 Push Announcement</span>
              <button 
                onClick={() => setShowPushToast(false)}
                className="text-slate-400 hover:text-white transition font-bold text-xs"
              >
                ✕
              </button>
            </div>
            <h4 className="text-xs font-black font-serif leading-snug">{latestNotification.title}</h4>
            <p className="text-[10.5px] text-slate-300 leading-normal font-medium">{latestNotification.body}</p>
            {latestNotification.imageUrl && (
              <img 
                src={latestNotification.imageUrl} 
                alt="campaign" 
                className="w-full h-24 object-cover rounded-xl mt-1.5 border border-slate-800"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="flex justify-end gap-1.5 pt-1 text-[10px]">
              <button 
                onClick={() => setShowPushToast(false)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold transition"
              >
                Dismiss
              </button>
              <button 
                onClick={() => {
                  setShowPushToast(false);
                  setShowNotificationDrawer(true);
                }}
                className="px-2.5 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded font-black transition"
              >
                View History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Slide-Over Explorer Side Drawer Menu */}
      {isSideMenuOpen && (
        <div id="side-menu-drawer" className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[100] flex justify-end">
          {/* Backdrop dismiss overlay */}
          <div className="absolute inset-0" onClick={() => setIsSideMenuOpen(false)} />
          
          <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col p-6 text-left relative z-10 animate-fade-in-right">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-50 rounded-full text-orange-600 border border-orange-100">
                  <Menu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm font-serif text-slate-900">Explore Vernunt</h3>
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider leading-none">Access secondary platform tools and resources</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSideMenuOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 space-y-5">
              {/* Profile summary card inside Drawer */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex items-center gap-3">
                <img 
                  src={userProfile?.photoUrl} 
                  alt="user" 
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 leading-tight">{userProfile?.parentName}</h4>
                  <span className="text-[10px] text-slate-500 block font-medium truncate max-w-[180px]">{userProfile?.email || 'member@vernunt.com'}</span>
                  <span className={`text-[9px] font-extrabold uppercase mt-1 tracking-widest inline-block px-1.5 py-0.5 rounded ${
                    userProfile?.userRole === 'Admin' 
                      ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                      : userProfile?.userRole !== 'Parent' 
                      ? 'bg-slate-905 text-white' 
                      : 'bg-orange-500/10 text-orange-700'
                  }`}>
                    {userProfile?.userRole} Member
                  </span>
                </div>
              </div>

              {/* Navigation Side links */}
              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-widest font-black text-slate-400 px-1">Actions & Features</span>
                
                {Object.entries(tabsConfig)
                  .filter(([_, placement]) => placement === 'side')
                  .map(([tabId]) => {
                    // Guards
                    if (tabId === 'admin' && userProfile?.userRole !== 'Admin') return null;
                    if (tabId === 'business' && userProfile?.userRole === 'Parent') return null;

                    const def = TAB_DEFINITIONS.find(t => t.id === tabId);
                    if (!def) return null;

                    const IconComponent = def.icon;
                    const isActive = activeTab === tabId;
                    const isBilling = tabId === 'billing';

                    return (
                      <button
                        key={tabId}
                        onClick={() => { setActiveTab(tabId as any); setIsSideMenuOpen(false); }}
                        className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          isActive
                            ? tabId === 'admin'
                              ? 'bg-rose-600 text-white shadow-md'
                              : isBilling
                              ? 'bg-amber-600 text-white shadow-md'
                              : 'bg-orange-500 text-white shadow-md shadow-orange-500/10'
                            : tabId === 'admin'
                            ? 'hover:bg-rose-50/50 text-rose-700 bg-rose-50/10'
                            : isBilling
                            ? 'hover:bg-amber-50 text-amber-700 bg-amber-50/10'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : tabId === 'admin' ? 'text-rose-500' : isBilling ? 'text-amber-500' : 'text-slate-500'}`} />
                          {tabId === 'billing' ? '👑 Kids Connect Club' : def.label}
                        </span>
                        {tabId === 'referrals' && (
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black tracking-wider uppercase ${isActive ? 'bg-orange-600 text-white' : 'bg-orange-500 text-white animate-pulse'}`}>Free 🎁</span>
                        )}
                        {tabId === 'planner' && (
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Cards</span>
                        )}
                        {tabId === 'business' && (
                          <span className={`text-[8px] uppercase tracking-wide px-1.5 py-0.5 font-bold rounded ${isActive ? 'bg-orange-650 text-white' : 'bg-orange-100 text-orange-700'}`}>Organizer</span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button 
                id="btn-drawer-child-safety"
                onClick={() => {
                  setIsSideMenuOpen(false);
                  setShowChildComplianceModal(true);
                }}
                className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold rounded-2xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Child Safety & COPPA Compliance Hub (A+)</span>
              </button>

              <button 
                id="btn-drawer-contacts-privacy"
                onClick={() => {
                  setIsSideMenuOpen(false);
                  setShowContactsPrivacyModal(true);
                }}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 font-bold rounded-2xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4 text-rose-700" />
                <span>Phone Contacts Privacy & Ghost Mode</span>
              </button>

              <button 
                id="btn-drawer-trustscore"
                onClick={() => {
                  setIsSideMenuOpen(false);
                  setShowTrustScoreExplanation(true);
                }}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100/70 border border-rose-200/80 text-rose-900 font-bold rounded-2xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🛡️ Trust Score:</span>
                <span className="font-serif font-black">{calculateTrustScore(userProfile)}/100</span>
              </button>

              <button 
                id="btn-drawer-logout"
                onClick={() => {
                  setIsSideMenuOpen(false);
                  handleLogOut();
                }}
                className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-2xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Vernunt</span>
              </button>

              <button 
                onClick={() => setIsSideMenuOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition cursor-pointer"
              >
                Close Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Push Alerts History list DRAWER */}
      {showNotificationDrawer && (
        <div id="notifications-drawer" className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[100] flex justify-end">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col p-6 text-left">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-50 rounded-full text-orange-600 border border-orange-100">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm font-serif text-slate-900">Broadcast Alerts Room</h3>
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider leading-none">Security notifications from our support desk</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNotificationDrawer(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 py-4">
              {notificationsHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2 py-20">
                  <span className="text-3xl text-slate-350">🔔</span>
                  <p className="text-xs font-bold font-serif">No broad messages sent yet.</p>
                  <p className="text-[10px] max-w-[240px] leading-relaxed mx-auto">Admin dashboard pushes appear here in real-time with lovely synthesized chime vibrations!</p>
                </div>
              ) : (
                notificationsHistory.map((note) => (
                  <div key={note.id} className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-[8px] font-black uppercase text-slate-400">
                      <span>👤 {note.senderName || 'Staff Administrator'}</span>
                      <span className="font-mono">{note.createdAt ? new Date(note.createdAt).toLocaleTimeString() : 'Active'}</span>
                    </div>
                    <h4 className="text-xs font-black text-slate-800 leading-tight">{note.title}</h4>
                    <p className="text-[10.5px] text-slate-600 leading-normal font-bold">{note.body}</p>
                    {note.imageUrl && (
                      <img 
                        src={note.imageUrl} 
                        alt="attachment" 
                        className="w-full h-28 object-cover rounded-xl mt-1.5 border border-slate-150 bg-slate-100"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={() => setShowNotificationDrawer(false)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition cursor-pointer"
            >
              Back to Playground Radar
            </button>
          </div>
        </div>
      )}

      {/* Aadhaar Safegard explanation dialog */}
      {showAadhaarExplanation && (
        <div id="aadhaar-explanation-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-y-auto animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 p-6 space-y-4 flex flex-col max-h-[85vh] my-auto">
            <div className="flex items-center gap-2 text-emerald-600 shrink-0 select-none">
              <ShieldCheck className="w-6 h-6 fill-emerald-100/30" />
              <h3 className="font-serif font-black text-sm text-slate-900">National Aadhaar Mandate</h3>
            </div>
            
            <div className="space-y-3.5 text-[11px] text-slate-600 leading-relaxed text-left overflow-y-auto flex-1 pr-1">
              <p>
                To provide safe playground coordinates and private messenger access on <strong>Vernunt</strong>, secure identity correlation via Indian National Aadhaar cards is required.
              </p>
              
              <div className="space-y-1.5 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/60 leading-normal">
                <h4 className="font-black text-emerald-900 text-[10px] uppercase tracking-wider">
                  🛡️ Restricting Bad Actors
                </h4>
                <p className="text-slate-600 text-[10.5px]">
                  Correlating bio-names via central UIDAI registries instantly wipes out dummy records, spammers, and visual profile spoofing.
                </p>
              </div>

              <div className="space-y-1.5 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100/60 leading-normal">
                <h4 className="font-black text-indigo-900 text-[10px] uppercase tracking-wider">
                  🤝 Enhancing Neighborhood Trust
                </h4>
                <p className="text-slate-600 text-[10.5px]">
                  Knowing that each participant has cleared identity matches allows worry-free chats and successful local playdate scheduling.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setShowAadhaarExplanation(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs transition shrink-0"
            >
              I Understand, Close Safety Deck
            </button>
          </div>
        </div>
      )}

      {/* TrustScore score breakdown dialog */}
      {showTrustScoreExplanation && (
        <div id="trustscore-explanation-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-y-auto animate-fade-incol-span-12">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 p-6 space-y-4 text-left flex flex-col max-h-[85vh] my-auto">
            <div className="flex items-center gap-2 text-orange-600 shrink-0 select-none">
              <Award className="w-6 h-6" />
              <div>
                <h3 className="font-serif font-black text-sm text-slate-900 leading-none">Community Trust Score Matrix</h3>
                <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide mt-1">Calculated factor breakdown</p>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl text-white text-center space-y-0.5 shrink-0 select-none">
              <span className="text-[9px] uppercase font-bold tracking-widest text-orange-100">Calculated Safety Grade</span>
              <div className="text-2xl font-serif font-black">{calculateTrustScore(userProfile)}/100</div>
              <p className="text-[9.5px] text-orange-50/90 leading-tight">
                {calculateTrustScore(userProfile) >= 80 ? '🌟 Tier 1 - Highly Trusted Playground Parent' : 'Complete Aadhaar and criminal checks to access top safety tiers.'}
              </p>
            </div>

            <div className="space-y-2 text-[11px] overflow-y-auto flex-1 pr-1">
              <h4 className="font-black text-slate-700 uppercase text-[9px] tracking-wider mb-0.5">Points Criteria:</h4>
              
              <div className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded-xl">
                <div>
                  <span className="font-black text-slate-800 block">Base Profile Creation</span>
                  <p className="text-[9px] text-slate-450">Account initialized successfully.</p>
                </div>
                <div className="font-mono font-black text-emerald-600 text-xs text-right shrink-0 pr-1">+50 Pts</div>
              </div>

              <div className={`flex justify-between items-center p-2 border rounded-xl ${
                userProfile?.aadhaarVerified ? 'bg-emerald-50/40 border-emerald-100' : 'bg-slate-50/50 border-slate-100'
              }`}>
                <div>
                  <span className={`font-black block ${userProfile?.aadhaarVerified ? 'text-emerald-950' : 'text-slate-500'}`}>
                    Aadhaar Verification
                  </span>
                  <p className="text-[9px] text-slate-450">Correlated biometric credentials verified.</p>
                </div>
                <div className={`font-mono font-black text-xs text-right shrink-0 pr-1 ${userProfile?.aadhaarVerified ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {userProfile?.aadhaarVerified ? '+25 Pts' : '0 Pts'}
                </div>
              </div>

              <div className={`flex justify-between items-center p-2 border rounded-xl ${
                userProfile?.criminalRecordChecked ? 'bg-emerald-50/40 border-emerald-100' : 'bg-slate-50/50 border-slate-100'
              }`}>
                <div>
                  <span className={`font-black block ${userProfile?.criminalRecordChecked ? 'text-emerald-950' : 'text-slate-500'}`}>
                    Criminal Record Match Checked
                  </span>
                  <p className="text-[9px] text-slate-450">No negative records found in crime registries.</p>
                </div>
                <div className={`font-mono font-black text-xs text-right shrink-0 pr-1 ${userProfile?.criminalRecordChecked ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {userProfile?.criminalRecordChecked ? '+15 Pts' : '0 Pts'}
                </div>
              </div>

              <div className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded-xl">
                <div>
                  <span className="font-black text-slate-800 block">Peer Reviews Recommendations</span>
                  <p className="text-[9px] text-slate-450">Positive ratings on completed playdates.</p>
                </div>
                <div className="font-mono font-black text-emerald-600 text-xs text-right shrink-0 pr-1">
                  +{Math.min(10, (userProfile?.positiveReviewsCount ?? (userProfile?.aadhaarVerified ? 4 : 1)) * 2)} Pts
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowTrustScoreExplanation(false)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs transition shrink-0"
            >
              Dismiss Safety Matrix
            </button>
          </div>
        </div>
      )}

      {/* Contacts Privacy & Ghost Mode Modal */}
      {showContactsPrivacyModal && (
        <ContactsPrivacyModal
          isOpen={showContactsPrivacyModal}
          onClose={() => setShowContactsPrivacyModal(false)}
          userProfile={userProfile}
          onUpdateProfile={(updated) => setUserProfile(updated)}
        />
      )}

      {/* Google Account Selector & Instant Fast-Login Modal */}
      {showGoogleAccountModal && (
        <GoogleAccountSelectModal
          isOpen={showGoogleAccountModal}
          onClose={() => setShowGoogleAccountModal(false)}
          onSelectGoogleAccount={handleSelectGoogleAccount}
        />
      )}

      {/* Role Selection Modal for Unregistered Users on Authentication */}
      <RoleSelectionModal
        isOpen={showRoleSelectModal}
        onSelectRole={(role) => handleStartSignUp(role, pendingRegisterDetails)}
        onClose={() => setShowRoleSelectModal(false)}
        verifiedEmail={pendingAuthUser?.email}
        verifiedPhone={pendingAuthUser?.phone}
        language={language}
      />

      {/* Child Safety & COPPA / DPDP Compliance Modal */}
      {showChildComplianceModal && (
        <ChildSafetyComplianceModal
          isOpen={showChildComplianceModal}
          onClose={() => setShowChildComplianceModal(false)}
        />
      )}

      {/* Conditionally Render Animated Loader overlay */}
      {isLoading && (
        <LoadingScreen 
          onFinished={() => setIsLoading(false)} 
          title={loadingTitle} 
        />
      )}

    </div>
  );
}
