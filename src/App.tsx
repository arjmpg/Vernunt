import React, { useState, useEffect, useRef } from 'react';
import { ChildProfile, VerificationStatus, LocationSharing, CommunityEvent, SpecialistProfile, Booking, DaycarePlayhomeProfile, CareBookingRequest, CareBookingStatus } from './types.ts';
import { INITIAL_PLAYMATES, MOCK_EVENTS, INITIAL_DAYCARE_PLAYHOMES, INITIAL_CARE_BOOKINGS } from './data/mockData.ts';
import confetti from 'canvas-confetti';
import { auth, db, triggerGoogleSignIn, handleFirestoreError, OperationType, getGoogleAccessToken } from './utils/firebase.ts';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { DICTIONARY, LANGUAGES, LanguageCode, getDictionary } from './utils/dictionary.ts';
import { createDailyRollingBackup } from './services/googleDriveBackup.ts';

import VernuntLogo from './components/VernuntLogo.tsx';
import LoadingScreen from './components/LoadingScreen.tsx';

// UI Sub components
import LandingLoginGateway from './components/LandingLoginGateway.tsx';
import RegistrationHub from './components/RegistrationHub.tsx';
import PlaymateRadar from './components/PlaymateRadar.tsx';
import PlaymateMap from './components/PlaymateMap.tsx';
import PlaymateCard, { calculateMatchScore } from './components/PlaymateCard.tsx';
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
import DaycareSittingTab from './components/DaycareSittingTab.tsx';

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
import ProximityAlertToast, { ProximityAlert, playSubtleProximityChime } from './components/ProximityAlertToast.tsx';
import EventDynamicQrPassModal from './components/events/EventDynamicQrPassModal.tsx';
import EventOrganizerCheckInStation from './components/events/EventOrganizerCheckInStation.tsx';
import ActivityFeedWidget from './components/ActivityFeedWidget.tsx';
import SyncOutboxDrawer, { SyncStatusBadge } from './components/SyncOutboxDrawer.tsx';
import { 
  queueConnectionRequest, 
  queueAcceptConnection, 
  queueCareBooking, 
  queueCareStatusUpdate 
} from './utils/syncOutbox.ts';

// Icons
import { 
  Navigation, MessageSquare, CalendarRange, 
  Award, Shield, ShieldAlert, Sparkles, LogOut, Info,
  SlidersHorizontal, Search, RotateCcw, HelpCircle, Check, MapPin,
  ExternalLink, Briefcase, User, Edit3, ShieldCheck, Users,
  Bell, X, Radio, Gift, Menu, Zap, ShoppingBag, UserCheck, Bookmark, Clock,
  Smartphone, EyeOff, Lock, BookOpen, Share2, QrCode, ScanLine, Baby, ArrowRight, Loader2
} from 'lucide-react';
import { getHaversineDistance, getProximityBadge } from './utils/distance.ts';
import { calculateTrustScore } from './utils/trustScore.ts';
import { captureAffiliateFromUrl } from './utils/affiliate.ts';

const TAB_DEFINITIONS = [
  { id: 'radar', label: 'Near Playmates', icon: Navigation },
  { id: 'daycare', label: '🍼 Babysitting & Daycare', icon: Baby },
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

export const DEFAULT_TABS_CONFIG: { [key: string]: 'header' | 'side' } = {
  radar: 'header',
  daycare: 'header',
  chat: 'header',
  events: 'header',
  specialists: 'header',
  knowledge: 'header',
  affiliate: 'side',
  billing: 'side',
  planner: 'side',
  referrals: 'side',
  portfolio: 'side',
  business: 'side',
  admin: 'side'
};

export interface CachedAuthSession {
  uid: string;
  userRole: 'Parent' | 'Event Organizer' | 'Portfolio Professional' | 'Admin';
  userProfile: ChildProfile;
  cachedAt: number;
}

export const AUTH_SESSION_KEY = 'vernunt_auth_session';

export const getInitialCachedSession = (): CachedAuthSession | null => {
  if (typeof window === 'undefined') return null;
  try {
    const rawSession = localStorage.getItem(AUTH_SESSION_KEY);
    if (rawSession) {
      const parsed: CachedAuthSession = JSON.parse(rawSession);
      if (parsed && parsed.uid && parsed.userProfile) {
        return parsed;
      }
    }
    // Fallback: check active or last logged in user profile cache
    const lastUid = localStorage.getItem('vernunt_active_user_id') || localStorage.getItem('vernunt_last_logged_in_user');
    if (lastUid) {
      const rawProfile = localStorage.getItem('vernunt_cached_profile_' + lastUid);
      if (rawProfile) {
        const parsedProfile: ChildProfile = JSON.parse(rawProfile);
        if (parsedProfile && parsedProfile.id) {
          const role = (parsedProfile.userRole as any) || 'Parent';
          return {
            uid: parsedProfile.id,
            userRole: role,
            userProfile: parsedProfile,
            cachedAt: Date.now()
          };
        }
      }
    }
  } catch (e) {
    console.debug('[Auth Cache Initializer] Note:', e);
  }
  return null;
};

export const persistAuthSession = (profile: ChildProfile, role?: 'Parent' | 'Event Organizer' | 'Portfolio Professional' | 'Admin') => {
  if (!profile || !profile.id) return;
  const effectiveRole = role || profile.userRole || 'Parent';
  const sessionObj: CachedAuthSession = {
    uid: profile.id,
    userRole: effectiveRole,
    userProfile: profile,
    cachedAt: Date.now()
  };
  try {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionObj));
    localStorage.setItem('vernunt_cached_profile_' + profile.id, JSON.stringify(profile));
    localStorage.setItem('vernunt_active_user_id', profile.id);
  } catch (err) {
    console.debug('[Auth Cache Persist] Storage note:', err);
  }
};

export const clearAuthSession = () => {
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem('vernunt_active_user_id');
  } catch (err) {
    console.debug('[Auth Cache Clear] Storage note:', err);
  }
};

export default function App() {
  const initialSession = React.useMemo(() => getInitialCachedSession(), []);

  // Interactive loading screens states (default false so cached users render instantly)
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingTitle, setLoadingTitle] = useState<string>('Booting Workspace...');

  // Navigation & User session states with instant cache hydration
  const [userProfile, setUserProfile] = useState<ChildProfile | null>(() => initialSession?.userProfile || null);
  const [userRole, setUserRole] = useState<'Parent' | 'Event Organizer' | 'Portfolio Professional' | 'Admin'>(() => initialSession?.userRole || 'Parent');
  const [appMode, setAppMode] = useState<'landing' | 'register' | 'dashboard'>(() => initialSession ? 'dashboard' : 'landing');
  const [activeTab, setActiveTab] = useState<'radar' | 'daycare' | 'chat' | 'planner' | 'events' | 'specialists' | 'knowledge' | 'business' | 'portfolio' | 'admin' | 'referrals' | 'billing' | 'affiliate'>(() => {
    if (initialSession?.userRole === 'Event Organizer') return 'business';
    if (initialSession?.userRole === 'Portfolio Professional') return 'portfolio';
    return 'radar';
  });
  const [isSideMenuOpen, setIsSideMenuOpen] = useState<boolean>(false);
  const [mapOrRadarView, setMapOrRadarView] = useState<'list' | 'radar' | 'map'>('list');

  // Open-access Knowledge Base state for unregistered/guest users
  const [isGuestViewingKnowledge, setIsGuestViewingKnowledge] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      const guide = params.get('guide') || params.get('article') || params.get('slug');
      const path = window.location.pathname;
      return tab === 'knowledge' || !!guide || path.startsWith('/knowledge') || path.startsWith('/guide');
    } catch {
      return false;
    }
  });
  const [guestKnowledgeSlug, setGuestKnowledgeSlug] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    try {
      const params = new URLSearchParams(window.location.search);
      const guide = params.get('guide') || params.get('article') || params.get('slug');
      const path = window.location.pathname;
      if (guide) return guide;
      if (path.startsWith('/knowledge/') || path.startsWith('/guide/')) {
        return path.split('/')[2] || undefined;
      }
    } catch (e) {
      console.debug('Failed to parse initial knowledge slug:', e);
    }
    return undefined;
  });

  // Multilingual localization state
  const [language, setLanguage] = useState<LanguageCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vernunt_language_pref') as LanguageCode;
      if (saved && DICTIONARY[saved]) return saved;
    }
    return 'en';
  });

  const t = getDictionary(language);

  const changeLanguage = (newLang: LanguageCode) => {
    setLanguage(newLang);
    try {
      localStorage.setItem('vernunt_language_pref', newLang);
    } catch (e) {
      console.debug('Language save note:', e);
    }
  };

  const [isOffline, setIsOffline] = useState<boolean>(() => typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [isOutboxDrawerOpen, setIsOutboxDrawerOpen] = useState<boolean>(false);

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
  const [suggestedRegisterRole, setSuggestedRegisterRole] = useState<'Parent' | 'Daycare Center' | 'Event Organizer' | 'Portfolio Professional'>('Parent');

  // Dynamic Navigation Tab Placements configured via Admin & Firestore
  const [tabsConfig, setTabsConfig] = useState<{ [key: string]: 'header' | 'side' }>(DEFAULT_TABS_CONFIG);

  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'system_config', 'tabs'), (docSnap) => {
        if (docSnap.exists() && docSnap.data()?.placements) {
          setTabsConfig(prev => ({ ...prev, ...docSnap.data()!.placements }));
        }
      }, (err) => console.debug("Tabs placement listener note:", err));
      return () => unsub();
    } catch (e) {
      console.debug("Tabs config init note:", e);
    }
  }, []);

  // Role selection popup state for unregistered users post-verification
  const [showRoleSelectModal, setShowRoleSelectModal] = useState<boolean>(false);
  const [pendingAuthUser, setPendingAuthUser] = useState<{ 
    email?: string; 
    phone?: string; 
    uid?: string;
    displayName?: string;
    photoURL?: string;
  } | null>(null);
  const [pendingRegisterDetails, setPendingRegisterDetails] = useState<{
    phone?: string;
    email?: string;
    phoneVerified?: boolean;
    parentName?: string;
    photoUrl?: string;
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
      const guideSlug = params.get('guide') || params.get('article') || params.get('slug');
      const path = window.location.pathname;

      if (targetTab === 'events' || targetEventId) {
        setActiveTab('events');
      } else if (targetTab === 'affiliate') {
        setActiveTab('affiliate');
      } else if (targetTab === 'specialists') {
        setActiveTab('specialists');
      } else if (targetTab === 'knowledge' || guideSlug || path.startsWith('/knowledge') || path.startsWith('/guide')) {
        let extractedSlug = guideSlug;
        if (!extractedSlug && (path.startsWith('/knowledge/') || path.startsWith('/guide/'))) {
          extractedSlug = path.split('/')[2] || null;
        }
        if (extractedSlug) {
          setGuestKnowledgeSlug(extractedSlug);
        }
        if (userProfile) {
          setActiveTab('knowledge');
        } else {
          setIsGuestViewingKnowledge(true);
        }
      }
    } catch (err) {
      console.error('Failed to parse URL referral/tab parameter:', err);
    }
  }, []);

  // Synchronize userProfile changes to localStorage for high-fidelity offline backup & session cache
  useEffect(() => {
    if (userProfile && userProfile.id) {
      persistAuthSession(userProfile, userProfile.userRole);
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

  // 1. Firebase Auth Session Synchronization (High-Performance, Non-Blocking)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // If the user is actively completing the registration wizard, let them finish it!
        if (appModeRef.current === 'register') {
          setIsLoading(false);
          setIsAuthenticating(false);
          return;
        }

        const emailLower = firebaseUser.email?.toLowerCase() || '';
        const isSystemAdmin = emailLower === 'ardha@vernunt.com' || emailLower === 'arjunmpgupta@gmail.com';

        // Fast-path: check if we have a locally cached profile matching this user
        const localCachedRaw = localStorage.getItem('vernunt_cached_profile_' + firebaseUser.uid);
        let fastCachedProfile: ChildProfile | null = null;
        if (localCachedRaw) {
          try {
            fastCachedProfile = JSON.parse(localCachedRaw);
          } catch (e) {
            console.debug('Fast cache read note:', e);
          }
        }

        if (fastCachedProfile) {
          // Instantly activate user session without blocking UI
          setUserProfile(fastCachedProfile);
          const cachedRole = fastCachedProfile.userRole || (isSystemAdmin ? 'Admin' : 'Parent');
          setUserRole(cachedRole);
          setAppMode('dashboard');
          setIsLoading(false);
          setIsAuthenticating(false);

          // Non-blocking background revalidation with Firestore
          (async () => {
            try {
              const userDocRef = doc(db, 'users', firebaseUser.uid);
              const userDoc = await getDoc(userDocRef);
              if (userDoc.exists()) {
                const freshData = userDoc.data() as ChildProfile;
                const freshRole = (freshData.userRole as any) || (isSystemAdmin ? 'Admin' : 'Parent');
                setUserProfile(prev => ({ ...(prev || {}), ...freshData, userRole: freshRole }));
                setUserRole(freshRole);
                persistAuthSession({ ...freshData, id: firebaseUser.uid, userRole: freshRole }, freshRole);
              }
            } catch (bgErr) {
              console.debug('[Auth Background Sync] Network/offline note:', bgErr);
            }
          })();
          return;
        }

        // Cache miss: User is signed in but has no local profile cache on this client
        (async () => {
          setIsLoading(true);
          setLoadingTitle('Loading secure user session...');
          try {
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
                      lat: 12.9716,
                      lng: 77.5946,
                      address: 'Cubbon Park / Central Bangalore, Karnataka, India'
                    },
                    locationSharing: LocationSharing.PRECISE,
                    verificationStatus: VerificationStatus.VERIFIED,
                    interests: ['Platform Auditing', 'Community Building'],
                    photoUrl: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300&crop=faces',
                    userRole: 'Admin',
                    email: emailLower,
                    phoneNumber: '8073749074',
                    aadhaarVerified: true,
                    aadhaarNumber: '111122223333'
                  };
              }

              setUserProfile(adminProfile);
              setUserRole('Admin');
              setAppMode('dashboard');
              setActiveTab('radar');
              persistAuthSession(adminProfile, 'Admin');

              setDoc(userDocRef, adminProfile, { merge: true }).catch(err => {
                console.warn("Admin profile background sync note:", err);
              });
            } else if (userDoc && userDoc.exists()) {
              const data = userDoc.data() as ChildProfile;
              const user_role = data.userRole || 'Parent';
              setUserProfile(data);
              setUserRole(user_role);
              setAppMode('dashboard');
              persistAuthSession({ ...data, id: firebaseUser.uid, userRole: user_role }, user_role);

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
                const user_role = existingDocData.userRole || 'Parent';
                setUserProfile(existingDocData);
                setUserRole(user_role);
                setAppMode('dashboard');
                persistAuthSession({ ...existingDocData, id: firebaseUser.uid, userRole: user_role }, user_role);

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
                // Unregistered user -> prompt registration popup with pre-verified credentials
                const fallbackName = firebaseUser.displayName || (emailLower ? emailLower.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '');
                const cleanPhone = firebaseUser.phoneNumber ? firebaseUser.phoneNumber.replace('+91', '').trim() : '';
                
                setPendingRegisterDetails({
                  email: emailLower || undefined,
                  phone: cleanPhone || undefined,
                  phoneVerified: Boolean(cleanPhone),
                  parentName: fallbackName || undefined,
                  photoUrl: firebaseUser.photoURL || undefined
                });
                setPendingAuthUser({
                  email: emailLower || undefined,
                  phone: cleanPhone || undefined,
                  uid: firebaseUser.uid,
                  displayName: fallbackName || undefined,
                  photoURL: firebaseUser.photoURL || undefined
                });
                setShowRoleSelectModal(true);
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
            }
          } finally {
            setIsLoading(false);
            setIsAuthenticating(false);
          }
        })();
      } else {
        clearAuthSession();
        setUserProfile(null);
        setUserRole('Parent');
        setAppMode('landing');
        setIsLoading(false);
        setIsAuthenticating(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Playmates/Parents DB sync with smart local persistence survival cache
  useEffect(() => {
    // Clear legacy offline cache keys if present
    try {
      localStorage.removeItem('vernunt_offline_playmates');
      localStorage.removeItem('vernunt_offline_playmates_v2');
      localStorage.removeItem('vernunt_offline_playmates_v3');
      localStorage.removeItem('vernunt_offline_playmates_v4');
    } catch {
      // ignore
    }

    if (!auth.currentUser) {
      // Unauthenticated / Sandbox mode: use standard Bangalore mock data
      setPlaymates(INITIAL_PLAYMATES);
      setSelectedPlaymate(INITIAL_PLAYMATES[0] || null);
      return;
    }

    const mockPhotoMap = new Map<string, ChildProfile>(INITIAL_PLAYMATES.map(p => [p.id, p]));

    // Attempt to seed from local offline cache to ensure immediate offline rendering
    const cachedPlaymatesStr = localStorage.getItem('vernunt_offline_playmates_v5');
    if (cachedPlaymatesStr) {
      try {
        const cachedList: ChildProfile[] = JSON.parse(cachedPlaymatesStr);
        if (Array.isArray(cachedList) && cachedList.length > 0) {
          // Always ensure photos are updated with latest authentic curated portraits
          const refreshedCached = cachedList.map(p => {
            const fresh = mockPhotoMap.get(p.id);
            if (fresh) {
              return {
                ...p,
                photoUrl: fresh.photoUrl,
                parentPhotoUrl: fresh.parentPhotoUrl,
                childPhotoUrl: fresh.childPhotoUrl
              };
            }
            return p;
          });
          setPlaymates(refreshedCached);
          setSelectedPlaymate(refreshedCached[0] || null);
          console.log("⚡ Offline/Fast-Boot Cache: Successfully pre-populated playmate nodes with fresh photos");
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

      // Always guarantee latest photos from INITIAL_PLAYMATES for all mock profiles
      const refreshedCombined = combined.map(p => {
        const fresh = mockPhotoMap.get(p.id);
        if (fresh) {
          return {
            ...p,
            photoUrl: fresh.photoUrl,
            parentPhotoUrl: fresh.parentPhotoUrl,
            childPhotoUrl: fresh.childPhotoUrl
          };
        }
        return p;
      });

      setPlaymates(refreshedCombined);
      
      // Persist to local survival cache for future fast-boots or offline connections
      try {
        localStorage.setItem('vernunt_offline_playmates_v5', JSON.stringify(refreshedCombined));
      } catch (storeErr) {
        console.warn("Failed to write offline playmates to cache:", storeErr);
      }

      setSelectedPlaymate(prev => {
        if (prev && refreshedCombined.find(p => p.id === prev.id)) {
          return prev;
        }
        return refreshedCombined[0] || null;
      });
    }, (error) => {
      const msg = error?.message || String(error);
      const isPermissionDenied = error?.code === 'permission-denied' || msg.toLowerCase().includes('permission-denied') || msg.toLowerCase().includes('insufficient permissions');
      if (isPermissionDenied) {
        handleFirestoreError(error, OperationType.GET, 'users');
      } else {
        console.warn("[Users Live Sync Offline] Falling back to client-cached playmates:", error);
        
        // Use existing state or try to fall back to survival local storage or default initial set
        const cacheStr = localStorage.getItem('vernunt_offline_playmates_v5');
        if (cacheStr) {
          try {
            const cached: ChildProfile[] = JSON.parse(cacheStr);
            if (Array.isArray(cached) && cached.length > 0) {
              const refreshed = cached.map(p => {
                const fresh = mockPhotoMap.get(p.id);
                return fresh ? { ...p, photoUrl: fresh.photoUrl, parentPhotoUrl: fresh.parentPhotoUrl, childPhotoUrl: fresh.childPhotoUrl } : p;
              });
              setPlaymates(refreshed);
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
    setLoadingTitle(`Checking registration for ${account.displayName}...`);
    setShowGoogleAccountModal(false);
    setAuthErrorMessage('');

    const emailLower = account.email.toLowerCase().trim();
    const isSystemAdmin = emailLower === 'ardha@vernunt.com' || emailLower === 'arjunmpgupta@gmail.com';
    const assignedUid = 'google-user-' + emailLower.replace(/[^a-zA-Z0-9]/g, '-');

    if (isSystemAdmin) {
      const adminProfile: ChildProfile = {
        id: assignedUid,
        parentName: account.displayName || 'Arjun Gupta (Admin)',
        childName: 'Ayaan',
        childAge: 6,
        childGender: 'Boy',
        gradeLevel: 'Class 1',
        playStyle: 'Active & Social',
        bio: 'Vernunt System Admin Panel and Child Safety Coordinator.',
        location: {
          lat: 12.9716,
          lng: 77.5946,
          address: 'Cubbon Park / Central Bangalore, Karnataka, India'
        },
        locationSharing: LocationSharing.PRECISE,
        verificationStatus: VerificationStatus.VERIFIED,
        interests: ['Platform Auditing', 'Community Building'],
        photoUrl: account.photoURL || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300&crop=faces',
        userRole: 'Admin',
        email: emailLower,
        phoneNumber: '8073749074',
        aadhaarVerified: true,
        aadhaarNumber: '111122223333'
      };

      setUserProfile(adminProfile);
      setUserRole('Admin');
      setAppMode('dashboard');
      setActiveTab('radar');
      try {
        localStorage.setItem('vernunt_cached_profile_' + assignedUid, JSON.stringify(adminProfile));
        localStorage.setItem('vernunt_last_logged_in_user', assignedUid);
      } catch (e) {
        console.debug('Admin storage write note:', e);
      }
      setIsLoading(false);
      setIsAuthenticating(false);
      return;
    }

    // Check if user already exists in Firestore database
    let existingProfile: ChildProfile | null = null;
    try {
      const { collection, query, where, getDocs, doc, getDoc } = await import('firebase/firestore');
      const directDoc = await getDoc(doc(db, 'users', assignedUid));
      if (directDoc.exists()) {
        existingProfile = directDoc.data() as ChildProfile;
      } else {
        const qEmail = query(collection(db, 'users'), where('email', '==', emailLower));
        const snapEmail = await getDocs(qEmail);
        if (!snapEmail.empty) {
          existingProfile = snapEmail.docs[0].data() as ChildProfile;
        }
      }
    } catch (e) {
      console.warn('Firestore user check note:', e);
    }

    // Check local storage
    if (!existingProfile) {
      const cached = localStorage.getItem('vernunt_cached_profile_' + assignedUid);
      if (cached) {
        try {
          existingProfile = JSON.parse(cached);
        } catch (e) {
          console.debug('Cached profile parse note:', e);
        }
      }
    }

    if (existingProfile) {
      // Existing registered user -> Go directly to dashboard
      setUserProfile(existingProfile);
      const targetRole = existingProfile.userRole || 'Parent';
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
        localStorage.setItem('vernunt_cached_profile_' + assignedUid, JSON.stringify(existingProfile));
        localStorage.setItem('vernunt_last_logged_in_user', assignedUid);
      } catch (e) {
        console.debug('Profile storage note:', e);
      }
      setIsLoading(false);
      setIsAuthenticating(false);
    } else {
      // Unregistered user -> Trigger Role Selection / Registration popup with pre-verified Google details
      const regDetails = {
        email: emailLower,
        phone: '',
        phoneVerified: false,
        parentName: account.displayName,
        photoUrl: account.photoURL
      };
      setPendingRegisterDetails(regDetails);
      setPendingAuthUser({
        email: emailLower,
        uid: assignedUid,
        displayName: account.displayName,
        photoURL: account.photoURL
      });
      setIsLoading(false);
      setIsAuthenticating(false);
      setShowRoleSelectModal(true);
    }
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

  // Babysitting & Drop-in Daycare Playhome state
  const [daycarePlayhomes, setDaycarePlayhomes] = useState<DaycarePlayhomeProfile[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vernunt_daycare_playhomes');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          console.debug('Daycare cache parse note:', e);
        }
      }
    }
    return INITIAL_DAYCARE_PLAYHOMES;
  });

  const [careBookings, setCareBookings] = useState<CareBookingRequest[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vernunt_care_bookings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          console.debug('Care bookings parse note:', e);
        }
      }
    }
    return INITIAL_CARE_BOOKINGS;
  });

  const handleSaveDaycareProfile = (newProfile: DaycarePlayhomeProfile) => {
    setDaycarePlayhomes(prev => {
      const filtered = prev.filter(p => p.id !== newProfile.id);
      const updated = [newProfile, ...filtered];
      try {
        localStorage.setItem('vernunt_daycare_playhomes', JSON.stringify(updated));
      } catch (e) {
        console.debug('Save daycare storage note:', e);
      }
      return updated;
    });
    triggerToast(`🏡 "${newProfile.title}" is now published and accepting bookings!`, "Sitter Published");
  };

  const handleAddCareBooking = (newBooking: CareBookingRequest) => {
    setCareBookings(prev => {
      const updated = [newBooking, ...prev];
      try {
        localStorage.setItem('vernunt_care_bookings', JSON.stringify(updated));
      } catch (e) {
        console.debug('Save booking note:', e);
      }
      return updated;
    });

    // Enqueue to background sync outbox for offline persistence & Firebase push
    try {
      queueCareBooking(newBooking);
    } catch (err) {
      console.debug('Sync outbox care booking note:', err);
    }

    triggerToast(`🍼 Sitting request sent to ${newBooking.providerName}!`, "Care Request Sent");
  };

  const handleUpdateBookingStatus = (bookingId: string, newStatus: CareBookingStatus, logNote?: string) => {
    setCareBookings(prev => {
      const updated = prev.map(b => {
        if (b.id !== bookingId) return b;
        const newLogs = [...(b.careActivityLog || [])];
        if (logNote) {
          newLogs.push({
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            activity: newStatus,
            note: logNote
          });
        }
        return {
          ...b,
          status: newStatus,
          careActivityLog: newLogs
        };
      });
      try {
        localStorage.setItem('vernunt_care_bookings', JSON.stringify(updated));
      } catch (e) {
        console.debug('Update booking note:', e);
      }
      return updated;
    });

    // Enqueue status update to sync outbox
    try {
      queueCareStatusUpdate(bookingId, newStatus, logNote);
    } catch (err) {
      console.debug('Sync outbox care status update note:', err);
    }

    triggerToast(`Session status updated: ${newStatus}`, "Care Status");
  };

  // Filter criteria states (with KMs as range criteria)
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(3.0); // Default 3.0 KM scan radius
  const deferredMaxDistanceKm = React.useDeferredValue(maxDistanceKm);
  const [filterPlayStyle, setFilterPlayStyle] = useState<string>('All');
  const [filterAgeGroup, setFilterAgeGroup] = useState<string>('All');
  const [filterGender, setFilterGender] = useState<string>('All');
  const [filterLanguage, setFilterLanguage] = useState<string>('All');
  const [filterSearchQuery, setFilterSearchQuery] = useState<string>('');
  const deferredSearchQuery = React.useDeferredValue(filterSearchQuery);
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
      const AudioCtxClass = typeof window !== 'undefined' ? (window.AudioContext || (window as any).webkitAudioContext) : null;
      if (!AudioCtxClass || typeof AudioCtxClass !== 'function') return;
      const audioCtx = new AudioCtxClass();
      
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
        try {
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
        } catch {
          // ignore
        }
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

  // Dynamic QR Code Event Check-in modal state
  const [showDynamicQrModal, setShowDynamicQrModal] = useState<boolean>(false);
  const [isGeneratingQrPass, setIsGeneratingQrPass] = useState<boolean>(false);
  const [organizerGateEvent, setOrganizerGateEvent] = useState<CommunityEvent | null>(null);

  // Handle Event QR Generation Action with smooth loading state and immediate toast notification
  const handleGenerateEventQrAction = () => {
    if (isGeneratingQrPass) return;
    setIsGeneratingQrPass(true);

    const registeredBooking = bookingsList.find(b => b.type === 'EventTicket');
    const matchedEvent = registeredBooking
      ? eventsList.find(e => e.id === registeredBooking.itemId || e.title === registeredBooking.itemTitle) || eventsList[0]
      : eventsList[0];
    const eventTitle = matchedEvent?.title || 'Bangalore Kids Carnival & Play Fair';

    setTimeout(() => {
      setIsGeneratingQrPass(false);
      setShowDynamicQrModal(true);

      // Trigger immediate toast notification showing event title and active status
      triggerToast(
        `Dynamic QR check-in pass successfully generated for "${eventTitle}". Status: Active & Valid for Gate Entry.`,
        '🎟️ Event Dynamic QR Pass Ready'
      );
    }, 450);
  };

  // Active User Location Coordinates (used for proximity calculations - Default: Bangalore)
  const userLat = typeof userProfile?.location === 'object' && userProfile?.location?.lat !== undefined
    ? Number(userProfile.location.lat)
    : (typeof userProfile?.capturedLat === 'number' ? userProfile.capturedLat : 12.9716);

  const userLng = typeof userProfile?.location === 'object' && userProfile?.location?.lng !== undefined
    ? Number(userProfile.location.lng)
    : (typeof userProfile?.capturedLng === 'number' ? userProfile.capturedLng : 77.5946);

  // 1km Immediate Proximity Alert Notifications State & Detection
  const [proximityAlerts, setProximityAlerts] = useState<ProximityAlert[]>([]);
  const knownPlaymateIdsRef = useRef<Set<string>>(new Set());
  const knownEventIdsRef = useRef<Set<string>>(new Set());
  const isInitialMountRef = useRef<boolean>(true);

  // Initialize known IDs on mount so initial static load does not trigger spurious toasts
  useEffect(() => {
    INITIAL_PLAYMATES.forEach(p => {
      if (p.id) knownPlaymateIdsRef.current.add(p.id);
    });
    MOCK_EVENTS.forEach(e => {
      if (e.id) knownEventIdsRef.current.add(e.id);
    });

    const timer = setTimeout(() => {
      isInitialMountRef.current = false;
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Monitor newly added playmates within 1km radius
  useEffect(() => {
    if (isInitialMountRef.current) {
      playmates.forEach(p => {
        if (p.id) knownPlaymateIdsRef.current.add(p.id);
      });
      return;
    }

    const currentUserId = userProfile?.id || auth.currentUser?.uid;
    const newPlaymates = playmates.filter(
      p => p.id && !knownPlaymateIdsRef.current.has(p.id) && p.id !== currentUserId
    );

    if (newPlaymates.length > 0) {
      const alertsToAdd: ProximityAlert[] = [];

      newPlaymates.forEach(p => {
        knownPlaymateIdsRef.current.add(p.id);

        const pLat = p.location?.lat;
        const pLng = p.location?.lng;
        if (typeof pLat === 'number' && typeof pLng === 'number') {
          const dist = getHaversineDistance(userLat, userLng, pLat, pLng);
          if (dist <= 1.0) { // Within immediate 1km radius
            alertsToAdd.push({
              id: `alert-pm-${p.id}-${Date.now()}`,
              type: 'playmate',
              title: `${p.childName || 'New Playmate'} (${p.childAge || 5} ${p.ageUnit || 'yrs'})`,
              subtitle: `${p.playStyle || 'Friendly Neighbor'} • ${p.parentName ? `Parent: ${p.parentName}` : 'Joined area'}`,
              distanceKm: dist,
              distanceText: `${dist.toFixed(1)} km away`,
              photoUrl: p.childPhotoUrl || p.photoUrl || p.parentPhotoUrl,
              avatarEmoji: '🧸',
              timestamp: Date.now(),
              targetId: p.id,
              address: p.location?.address || 'Immediate neighborhood (< 1 km)'
            });
          }
        }
      });

      if (alertsToAdd.length > 0) {
        setProximityAlerts(prev => [...alertsToAdd, ...prev].slice(0, 5));
        playSubtleProximityChime();
      }
    }
  }, [playmates, userLat, userLng, userProfile?.id]);

  // Monitor newly added events within 1km radius
  useEffect(() => {
    if (isInitialMountRef.current) {
      eventsList.forEach(e => {
        if (e.id) knownEventIdsRef.current.add(e.id);
      });
      return;
    }

    const newEvents = eventsList.filter(
      e => e.id && !knownEventIdsRef.current.has(e.id)
    );

    if (newEvents.length > 0) {
      const alertsToAdd: ProximityAlert[] = [];

      newEvents.forEach(e => {
        knownEventIdsRef.current.add(e.id);

        const eLat = typeof e.lat === 'number' ? e.lat : userLat;
        const eLng = typeof e.lng === 'number' ? e.lng : userLng;
        const dist = getHaversineDistance(userLat, userLng, eLat, eLng);

        if (dist <= 1.0) { // Within immediate 1km radius
          alertsToAdd.push({
            id: `alert-evt-${e.id}-${Date.now()}`,
            type: 'event',
            title: e.title,
            subtitle: `${e.date} at ${e.time} • ${e.category || 'Event'}`,
            distanceKm: dist,
            distanceText: `${dist.toFixed(1)} km away`,
            photoUrl: e.photoUrl,
            avatarEmoji: e.iconEmoji || '🎉',
            timestamp: Date.now(),
            targetId: e.id,
            address: e.location || 'Within 1km walking distance'
          });
        }
      });

      if (alertsToAdd.length > 0) {
        setProximityAlerts(prev => [...alertsToAdd, ...prev].slice(0, 5));
        playSubtleProximityChime();
      }
    }
  }, [eventsList, userLat, userLng]);

  // Dismiss specific proximity toast alert
  const handleDismissProximityAlert = (alertId: string) => {
    setProximityAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  // Handle user clicking "View" on a proximity toast alert
  const handleViewProximityAlert = (alert: ProximityAlert) => {
    setProximityAlerts(prev => prev.filter(a => a.id !== alert.id));

    if (alert.type === 'playmate') {
      const target = playmates.find(p => p.id === alert.targetId);
      if (target) {
        setSelectedPlaymate(target);
        setAppMode('dashboard');
        setActiveTab('radar');
      }
    } else if (alert.type === 'event') {
      const target = eventsList.find(e => e.id === alert.targetId);
      if (target) {
        setAppMode('dashboard');
        setActiveTab('events');
        setTimeout(() => {
          const el = document.getElementById(`event-card-${target.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  };

  // Simulation handler to quickly test 1km proximity notifications in real-time
  const triggerSimulatedProximityAlert = (type: 'playmate' | 'event') => {
    if (type === 'playmate') {
      const testId = `sim-pm-${Date.now()}`;
      const sampleNames = ['Aarav & Kabir (6 yrs)', 'Saanvi (4 yrs)', 'Diya & Reyansh (5 yrs)', 'Neil (7 yrs)'];
      const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const dist = (0.2 + Math.random() * 0.6).toFixed(1);

      const newAlert: ProximityAlert = {
        id: `alert-${testId}`,
        type: 'playmate',
        title: randomName,
        subtitle: 'Modern & Creative Play • Active in neighborhood',
        distanceKm: parseFloat(dist),
        distanceText: `${dist} km away`,
        photoUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&q=80&w=300',
        avatarEmoji: '🧸',
        timestamp: Date.now(),
        targetId: playmates[0]?.id || 'playmate-1',
        address: 'Sector 54 Park Lane (< 1 km)'
      };
      setProximityAlerts(prev => [newAlert, ...prev].slice(0, 5));
      playSubtleProximityChime();
    } else {
      const testId = `sim-evt-${Date.now()}`;
      const sampleEvents = [
        'Sunset Origami & Clay Modeling Workshop',
        'Weekend Little Runners Sprint & Relay',
        'Neighborhood Board Game & Chess Circle',
        'Junior Science Magnet & Prism Lab'
      ];
      const randomEvent = sampleEvents[Math.floor(Math.random() * sampleEvents.length)];
      const dist = (0.3 + Math.random() * 0.5).toFixed(1);

      const newAlert: ProximityAlert = {
        id: `alert-${testId}`,
        type: 'event',
        title: randomEvent,
        subtitle: 'Tomorrow at 04:30 PM • Central Park Green Lawn',
        distanceKm: parseFloat(dist),
        distanceText: `${dist} km away`,
        photoUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=600',
        avatarEmoji: '🎉',
        timestamp: Date.now(),
        targetId: eventsList[0]?.id || 'event-1',
        address: 'Walking distance (0.4 km)'
      };
      setProximityAlerts(prev => [newAlert, ...prev].slice(0, 5));
      playSubtleProximityChime();
    }
  };

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

        // Enqueue to background sync outbox for offline resilience and Firebase sync
        try {
          queueAcceptConnection(partnerId, userProfile);
        } catch (err) {
          console.debug('Sync outbox accept note:', err);
        }

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

        // Enqueue to background sync outbox
        try {
          queueConnectionRequest(partnerId, userProfile);
        } catch (err) {
          console.debug('Sync outbox connect note:', err);
        }

        triggerToast("💌 Connect request sent to parent! Awaiting guardian review & approval...", "Request Sent (Pending)");
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
    role: 'Parent' | 'Daycare Center' | 'Event Organizer' | 'Portfolio Professional',
    details?: { phone?: string; email?: string; phoneVerified?: boolean; parentName?: string; photoUrl?: string }
  ) => {
    setIsLoading(true);
    setLoadingTitle(
      role === 'Parent' 
        ? 'Loading family registration workspace...' 
        : role === 'Daycare Center'
        ? 'Loading Daycare & Creche Center registration workspace...'
        : role === 'Event Organizer'
        ? 'Loading events, class and activities host registration workspace...'
        : 'Loading professional specialist workspace...'
    );
    setSuggestedRegisterRole(role);
    if (details) {
      setPendingRegisterDetails(prev => ({ ...prev, ...details }));
    }
    setShowRoleSelectModal(false);
    setAppMode('register');
    setIsLoading(false);
  };

  const handleQuickStartPlayground = () => {
    setIsLoading(true);
    setLoadingTitle('Spanning localized Ayaan playground radars...');
    
    const demoExpiry = new Date();
    demoExpiry.setDate(demoExpiry.getDate() + 365);
    
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
      photoUrl: 'https://images.unsplash.com/photo-1602030028438-4cf153cba9e7?auto=format&fit=crop&q=80&w=400',
      subscriptionActive: true,
      subscriptionPlan: 'yearly',
      subscriptionExpiryDate: demoExpiry.toISOString().split('T')[0],
      contactViewCredits: 10
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
    
    // If user registered as Daycare Center or opted into Daycare / Babysitter hosting, sync to daycarePlayhomes
    if (savedRole === 'Daycare Center' || (profileWithId as any).isDaycareHost) {
      const daycareProfile: DaycarePlayhomeProfile = {
        id: `daycare-${uid}`,
        name: profileWithId.companyName || profileWithId.parentName || 'Verified Daycare Center',
        type: (profileWithId as any).daycareType || (savedRole === 'Daycare Center' ? 'DaycareCenter' : 'ParentHome'),
        hostName: profileWithId.parentName || 'Center Director',
        contactPhone: profileWithId.phoneNumber || '',
        contactEmail: profileWithId.email || '',
        hourlyRate: (profileWithId as any).hourlyRate ?? 180,
        halfDayRate: (profileWithId as any).halfDayRate,
        fullDayRate: (profileWithId as any).fullDayRate,
        monthlyRate: (profileWithId as any).monthlyRate,
        address: profileWithId.location?.address || 'Local Neighborhood',
        distanceKm: 0.4,
        lat: profileWithId.location?.lat || 19.0760,
        lng: profileWithId.location?.lng || 72.8777,
        capacity: (profileWithId as any).capacity || 15,
        availableSlotsCount: (profileWithId as any).capacity || 8,
        rating: 5.0,
        reviewsCount: 1,
        verified: true,
        licenseNumber: profileWithId.companyRegNumber || (profileWithId as any).licenseNumber,
        staffToChildRatio: (profileWithId as any).staffToChildRatio || '1:4',
        cctvLiveStreamAvailable: (profileWithId as any).cctvLiveStreamAvailable ?? true,
        operatingHours: (profileWithId as any).operatingHours || '08:00 AM - 07:30 PM',
        operatingDays: (profileWithId as any).operatingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        ageGroupsServed: (profileWithId as any).ageGroupsServed || ['Infants (6m - 18m)', 'Toddlers (18m - 3y)', 'Pre-K (3y - 6y)'],
        amenities: (profileWithId as any).amenities || [
          'Live CCTV Access for Parents',
          'Air Conditioned Child-Safe Rooms',
          'Sterilized Infant Nap Cribs',
          'Pediatric First-Aid On-site',
          'Nutritious Pure Vegetarian Meals',
          'Enclosed Outdoor Play Zone'
        ],
        emergencyMedicalTieUp: (profileWithId as any).emergencyMedicalTieUp || 'Apollo Cradle Hospital (0.8 km)',
        photos: (profileWithId as any).facilityPhotos || [
          profileWithId.photoUrl || 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=600'
        ],
        description: profileWithId.bio || 'Certified premium daycare and playhome with strict child safety protocols and live camera streaming.',
        documents: (profileWithId as any).verificationDocs || [
          { name: 'Government Trade / Educational License', url: profileWithId.companyDocUrl || '#', verified: true },
          { name: 'Director Aadhaar Verification', url: profileWithId.aadhaarDocUrl || '#', verified: true }
        ],
        instantBooking: true,
        minimumNoticeHours: 1
      };

      setDaycarePlayhomes(prev => {
        const filtered = prev.filter(d => d.id !== daycareProfile.id);
        const updated = [daycareProfile, ...filtered];
        try {
          localStorage.setItem('vernunt_daycare_playhomes', JSON.stringify(updated));
        } catch (e) {
          console.debug('Daycare storage sync note:', e);
        }
        return updated;
      });
    }

    if (savedRole === 'Event Organizer') {
      setActiveTab('business');
    } else if (savedRole === 'Portfolio Professional') {
      setActiveTab('portfolio');
    } else if (savedRole === 'Daycare Center') {
      setActiveTab('daycare');
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
      clearAuthSession();
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (e) {
      console.error('Sign-out error:', e);
    } finally {
      clearAuthSession();
      setUserProfile(null);
      setUserRole('Parent');
      setAppMode('landing');
      setActiveTab('radar');
      setIsLoading(false);
      setIsAuthenticating(false);
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

  // Filter playmates list in Kilometers and other required criteria (Memoized for high-fps performance)
  const filteredPlaymates = React.useMemo(() => {
    const cleanQuery = deferredSearchQuery.trim().toLowerCase();
    const hasInterests = selectedInterests.length > 0;
    const lowerInterests = hasInterests ? selectedInterests.map(i => i.toLowerCase()) : [];
    const hasActivities = selectedPreferredActivities.length > 0;
    const lowerActivities = hasActivities ? selectedPreferredActivities.map(a => a.toLowerCase()) : [];
    const targetLang = filterLanguage !== 'All' ? filterLanguage.split('/')[0].trim().toLowerCase() : '';
    const now = Date.now();

    const results: (ChildProfile & { _cachedDistance: number })[] = [];

    for (let i = 0; i < playmates.length; i++) {
      const p = playmates[i];
      // Exclude if parent or profile is blocked by user locally
      if (blockedIds.includes(p.id)) continue;

      // Exclude if parent or profile is blocked/suspended by admin
      if (p.isBlocked) continue;

      // 1. Distance filter (in kilometers)
      const distanceKm = getHaversineDistance(userLat, userLng, p.location.lat, p.location.lng);
      if (distanceKm > deferredMaxDistanceKm) continue;

      // 2. Play style filter
      if (filterPlayStyle !== 'All') {
        const pStyleLower = p.playStyle.toLowerCase();
        const fStyleLower = filterPlayStyle.toLowerCase();
        if (filterPlayStyle === 'Outdoor') {
          if (!pStyleLower.includes('outdoor') && !pStyleLower.includes('sporty')) continue;
        } else if (filterPlayStyle === 'Indoor') {
          if (!pStyleLower.includes('indoor') && !pStyleLower.includes('quiet') && !pStyleLower.includes('creative')) continue;
        } else {
          if (!pStyleLower.includes(fStyleLower)) continue;
        }
      }

      // 3. Age bracket category group matching
      if (filterAgeGroup !== 'All') {
        const age = p.childAge;
        if (filterAgeGroup === 'Infant' && (age < 0 || age > 1)) continue;
        if (filterAgeGroup === 'Toddler' && (age < 1 || age > 2)) continue;
        if (filterAgeGroup === 'Preschool' && (age < 3 || age > 4)) continue;
        if (filterAgeGroup === 'Kindergarten' && (age < 5 || age > 6)) continue;
        if (filterAgeGroup === 'SchoolAge' && age < 7) continue;
      }

      // Precise continuous age range filter
      if (p.childAge < filterMinAge || p.childAge > filterMaxAge) continue;

      // 4. Gender filter
      if (filterGender !== 'All' && p.childGender !== filterGender) continue;

      // 5. Language barrier/Demographic filter
      if (targetLang) {
        const languages = p.languagesKnown || [];
        const matchesKnown = languages.some(l => {
          const lNorm = l.toLowerCase().trim();
          return lNorm.includes(targetLang) || targetLang.includes(lNorm);
        });
        const matchesMother = p.motherTongue ? (
          p.motherTongue.toLowerCase().trim().includes(targetLang) || targetLang.includes(p.motherTongue.toLowerCase().trim())
        ) : false;
        if (!matchesKnown && !matchesMother) continue;
      }

      // 6. Fuzzy text matching (Name, Interests, Bio, Parent Profession)
      if (cleanQuery) {
        const nameMatch = p.childName.toLowerCase().includes(cleanQuery) || p.parentName.toLowerCase().includes(cleanQuery);
        const interestMatch = p.interests.some(el => el.toLowerCase().includes(cleanQuery));
        const bioMatch = p.bio?.toLowerCase().includes(cleanQuery) || false;
        const professionMatch = p.parentProfession?.toLowerCase().includes(cleanQuery) || false;
        if (!nameMatch && !interestMatch && !bioMatch && !professionMatch) continue;
      }

      // 7. Days of availability filter
      if (filterAvailableDay !== 'All') {
        const days = p.availableDays || [];
        if (!days.includes(filterAvailableDay)) continue;
      }

      // 8. Times of availability filter
      if (filterAvailableTime !== 'All') {
        const times = p.availableTimes || [];
        if (!times.includes(filterAvailableTime)) continue;
      }

      // 9. Shared Interests tag click filtering
      if (hasInterests) {
        const pInterestsLower = (p.interests || []).map(item => item.toLowerCase());
        const hasMatch = lowerInterests.some(sel => 
          pInterestsLower.some(pi => pi.includes(sel))
        );
        if (!hasMatch) continue;
      }

      // 10. Preferred Activities filtering
      if (hasActivities) {
        const pActLower = (p.preferredActivities || []).map(a => a.toLowerCase());
        const hasMatch = lowerActivities.some(sel => 
          pActLower.some(pa => pa.includes(sel))
        );
        if (!hasMatch) continue;
      }

      // 11. Connected Friends Only filter
      if (filterOnlyConnected && !connectedIds.includes(p.id)) continue;

      // 12. Saved Profiles Only filter
      if (filterOnlySaved && !savedProfileIds.includes(p.id)) continue;

      // 13. Activity Recency filter
      if (filterActivityRecency !== 'All') {
        const lastActiveMs = p.lastActiveAt ? new Date(p.lastActiveAt).getTime() : 0;
        const hoursDiff = lastActiveMs > 0 ? (now - lastActiveMs) / (1000 * 3600) : 9999;

        if (filterActivityRecency === 'active24h') {
          if (hoursDiff > 24 && p.activityStatus !== 'Currently Active') continue;
        } else if (filterActivityRecency === 'active1w') {
          if (hoursDiff > 168 && p.activityStatus !== 'Currently Active' && p.activityStatus !== 'Available for Play') continue;
        } else if (filterActivityRecency === 'currentlyActive') {
          if (p.activityStatus !== 'Currently Active' && !p.lookingForImmediatePlaydate) continue;
        }
      }

      results.push({ ...p, _cachedDistance: distanceKm });
    }

    // Sort by compatibility score (interests, availability, proximity, age, and demographic fallback)
    results.sort((a, b) => {
      const matchA = calculateMatchScore(userProfile, a, userLat, userLng).score;
      const matchB = calculateMatchScore(userProfile, b, userLat, userLng).score;
      if (matchB !== matchA) {
        return matchB - matchA;
      }
      return a._cachedDistance - b._cachedDistance;
    });
    return results;
  }, [
    playmates,
    userProfile,
    deferredMaxDistanceKm,
    userLat,
    userLng,
    deferredSearchQuery,
    filterPlayStyle,
    filterAgeGroup,
    filterGender,
    filterLanguage,
    filterMinAge,
    filterMaxAge,
    selectedInterests,
    selectedPreferredActivities,
    filterAvailableDay,
    filterAvailableTime,
    filterOnlyConnected,
    filterOnlySaved,
    filterActivityRecency,
    blockedIds,
    connectedIds,
    savedProfileIds
  ]);

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
              setIsGuestViewingKnowledge(false);
              setGuestKnowledgeSlug(undefined);
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

                const def = TAB_DEFINITIONS.find(tab => tab.id === tabId);
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
              {/* Background Sync Outbox Badge */}
              <SyncStatusBadge onClick={() => setIsOutboxDrawerOpen(true)} />

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
            <div className="flex items-center gap-2 sm:gap-3 select-none font-sans">
              <button
                id="header-btn-knowledge-guest"
                type="button"
                onClick={() => {
                  if (isGuestViewingKnowledge) {
                    setIsGuestViewingKnowledge(false);
                    setGuestKnowledgeSlug(undefined);
                  } else {
                    setIsGuestViewingKnowledge(true);
                    setGuestKnowledgeSlug(undefined);
                  }
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition cursor-pointer ${
                  isGuestViewingKnowledge
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isGuestViewingKnowledge ? '← Home' : '1,000+ Guides'}</span>
              </button>

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
        <div 
          id="mobile-sticky-tabs" 
          className="lg:hidden bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-[60px] sm:top-[68px] z-20 shadow-xs px-2.5 py-2"
        >
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
            {Object.entries(tabsConfig)
              .filter(([_, placement]) => placement === 'header')
              .map(([tabId]) => {
                // Guards
                if (tabId === 'admin' && userProfile?.userRole !== 'Admin') return null;
                if (tabId === 'business' && userProfile?.userRole === 'Parent') return null;

                const def = TAB_DEFINITIONS.find(tab => tab.id === tabId);
                if (!def) return null;

                const IconComponent = def.icon;
                const isBilling = tabId === 'billing';
                const isActive = activeTab === tabId;

                // Clean, non-overlapping concise labels
                let mobileLabel = def.label;
                if (tabId === 'radar') mobileLabel = 'Radar';
                else if (tabId === 'daycare') mobileLabel = 'Daycare & Sitter';
                else if (tabId === 'chat') mobileLabel = 'Chats';
                else if (tabId === 'events') mobileLabel = 'Events';
                else if (tabId === 'specialists') mobileLabel = 'Specialists';
                else if (tabId === 'knowledge') mobileLabel = '1000+ Guides';
                else if (tabId === 'billing') mobileLabel = '👑 VIP';
                else if (tabId === 'planner') mobileLabel = 'Planner';
                else if (tabId === 'referrals') mobileLabel = 'Refer';

                return (
                  <button
                    key={tabId}
                    id={`mob-btn-${tabId}`}
                    onClick={() => setActiveTab(tabId as any)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer select-none active:scale-95 ${
                      isActive
                        ? isBilling
                          ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                          : 'bg-rose-700 text-white font-black shadow-xs shadow-rose-700/20'
                        : isBilling
                        ? 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100/60'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/70'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isBilling ? 'animate-pulse text-amber-500' : isActive ? 'text-white' : 'text-rose-700'}`} />
                    <span>{mobileLabel}</span>
                  </button>
                );
              })}

            {/* Store shortcut */}
            <a
              id="mob-btn-store-link"
              href="https://vernunt.com/store"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 transition whitespace-nowrap cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span>Store</span>
            </a>

            {/* More menu trigger */}
            <button
              id="mob-btn-more-menu"
              onClick={() => setIsSideMenuOpen(true)}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition whitespace-nowrap cursor-pointer ml-auto"
            >
              <Menu className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span>More</span>
            </button>
          </div>
        </div>
      )}

      {/* Main content body panel */}
      <main id="app-main" className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        
        {/* Onboarding View Logic */}
        {appMode === 'landing' && !isGuestViewingKnowledge && (
          <LandingLoginGateway 
            onStartSignUp={handleStartSignUp} 
            onQuickStart={handleQuickStartPlayground} 
            onGoogleSignIn={handleGoogleSignIn}
            onSelectGoogleAccount={handleSelectGoogleAccount}
            onOpenKnowledgeBase={(slug) => {
              setIsGuestViewingKnowledge(true);
              setGuestKnowledgeSlug(slug);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            isAuthenticating={isAuthenticating}
            externalAuthError={authErrorMessage}
            language={language}
            banners={banners.filter(b => b.placement === 'home' && b.active)}
          />
        )}

        {/* Unregistered / Guest 1000+ Knowledge Base Open View */}
        {appMode === 'landing' && isGuestViewingKnowledge && (
          <div className="animate-fade-in">
            <KnowledgeHub
              initialSlug={guestKnowledgeSlug}
              isGuest={true}
              onNavigateToRadar={(interestKeyword) => {
                handleStartSignUp('Parent');
              }}
              onStartSignUp={(role) => handleStartSignUp((role as any) || 'Parent')}
              onBackToLanding={() => {
                setIsGuestViewingKnowledge(false);
                setGuestKnowledgeSlug(undefined);
                if (typeof window !== 'undefined' && window.history?.replaceState) {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('tab');
                  url.searchParams.delete('guide');
                  url.searchParams.delete('article');
                  url.searchParams.delete('slug');
                  window.history.replaceState({}, '', url.toString());
                }
              }}
            />
          </div>
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
              initialParentName={pendingRegisterDetails.parentName}
              initialPhotoUrl={pendingRegisterDetails.photoUrl}
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
                onClick={handleLogOut}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold text-xs rounded-2xl transition cursor-pointer"
              >
                Exit Session
              </button>
            </div>
          </div>
        ) : appMode === 'dashboard' && (
          <div id="dashboard-content-wrapper" className="space-y-6 animate-fade-in">
            
            {/* KYC Verification Pending Status Banner */}
            {userProfile && userProfile.userRole !== 'Admin' && (userProfile.verificationStatus === VerificationStatus.PENDING || userProfile.verificationStatus === 'PENDING' || !userProfile.aadhaarVerified || userProfile.verificationStatus === VerificationStatus.UNVERIFIED) && (
              <div 
                id="banner-kyc-pending" 
                className="bg-gradient-to-r from-rose-900 via-red-900 to-rose-950 text-white rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-rose-700/60 animate-fade-in text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-full bg-rose-500/10 pointer-events-none blur-2xl"></div>
                <div className="flex items-start gap-3.5 relative z-10">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 text-2xl shadow-inner">
                    🛡️
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif font-black text-sm sm:text-base text-amber-300 tracking-wide">
                        KYC Pending — Finish KYC to Unlock Full Profiles & Parent Photos
                      </span>
                      <span className="bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                        Action Required
                      </span>
                    </div>
                    <p className="text-rose-100/90 text-xs leading-relaxed max-w-2xl font-medium">
                      You can freely explore nearby playmates, names, ages, distance, mother tongue, and parent professions! To view verified parent photos, initiate playdates, and unlock direct chats, please submit your Aadhaar & address proof for community verification.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto justify-end relative z-10">
                  <button
                    type="button"
                    id="btn-finish-kyc-banner"
                    onClick={() => setShowAadhaarVerifyModal(true)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-serif font-black text-xs rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                    <span>Finish KYC Verification ⚡</span>
                  </button>
                </div>
              </div>
            )}

            {/* Biometric / Facial Audit Pending Status Message Banner */}
            {(userProfile?.facialAuditRequired || userProfile?.faceVerificationStatus === 'pending_admin') && (
              <div 
                id="banner-facial-recognition-pending" 
                className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-amber-400/50 animate-fade-in text-left"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30 text-xl">
                    🛡️
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif font-black text-sm sm:text-base tracking-wide">
                        Profile Pending for Facial Recognition Audit
                      </span>
                      <span className="bg-white/20 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/30">
                        Admin Review Required
                      </span>
                    </div>
                    <p className="text-white/90 text-xs leading-relaxed max-w-2xl font-medium">
                      Your profile registration is submitted. Because facial recognition required manual safety clearance, our community administration team is reviewing your profile photos. <strong>Once approved, an instant confirmation Email & SMS with your login link will be sent to {userProfile?.phoneNumber || userProfile?.email || 'your registered contact'}.</strong>
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto justify-end">
                  <span className="text-[10px] font-bold bg-white/15 px-3 py-1.5 rounded-xl border border-white/20 text-amber-50 whitespace-nowrap">
                    ⏳ In Safety Queue
                  </span>
                </div>
              </div>
            )}

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
                  
                  {/* Dynamic QR Code Fast Entry Banner for Registered Events */}
                  <div id="radar-event-qr-banner" className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shrink-0 shadow-md">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs sm:text-sm font-black font-serif text-white tracking-tight">
                            Registered Events Dynamic QR Check-In Pass
                          </h5>
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[8.5px] font-black uppercase px-1.5 py-0.2 rounded-full font-mono">
                            Live Scanner Ready
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-300 font-medium">
                          Generate instant encrypted dynamic QR passes for organizers to scan and check-in attendees to simplify entry.
                        </p>
                      </div>
                    </div>
                    <button
                      id="btn-generate-event-qr-action"
                      type="button"
                      onClick={handleGenerateEventQrAction}
                      disabled={isGeneratingQrPass}
                      className="relative overflow-hidden group px-4 py-2.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-500 hover:via-orange-600 hover:to-amber-600 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-xl hover:shadow-orange-500/30 transform transition-all duration-300 hover:scale-105 active:scale-95 animate-pulse hover:animate-none cursor-pointer shrink-0 font-sans ring-2 ring-amber-400/50 hover:ring-amber-300 disabled:opacity-85 disabled:cursor-wait"
                    >
                      {/* Shimmer light-beam overlay for enhanced discoverability */}
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
                      
                      {isGeneratingQrPass ? (
                        <>
                          <Loader2 className="w-4 h-4 text-slate-950 animate-spin" />
                          <span>Generating Dynamic QR Pass...</span>
                        </>
                      ) : (
                        <>
                          <ScanLine className="w-4 h-4 text-slate-950 animate-bounce" />
                          <span>Generate Dynamic QR Pass</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Babysitting & Drop-in Daycare Marketplace Feature Banner */}
                  <div id="radar-daycare-banner" className="bg-gradient-to-r from-rose-900 via-rose-950 to-orange-950 text-white p-4 sm:p-5 rounded-2xl border border-rose-800/80 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center text-2xl shrink-0 shadow-md">
                        🍼
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-sm font-black font-serif text-white tracking-tight">
                            Need a Sitter for an Hour or Day?
                          </h5>
                          <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full font-mono shadow-xs">
                            Auto-Match Nearest First
                          </span>
                        </div>
                        <p className="text-xs text-rose-200/90 font-medium leading-relaxed max-w-xl">
                          Parents can post busy hours (1h to full day) & connect with verified neighbours & playhomes nearest to you. Handshake PIN drop-off & live session activity log included!
                        </p>
                      </div>
                    </div>
                    <button
                      id="btn-radar-find-sitter-cta"
                      type="button"
                      onClick={() => setActiveTab('daycare')}
                      className="px-4 py-2.5 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-xl hover:shadow-orange-500/30 transform transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shrink-0 font-sans ring-2 ring-rose-400/30"
                    >
                      <Baby className="w-4 h-4 text-white" />
                      <span>Find Sitter or Playhome</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>

                  {/* REAL-TIME RADAR SEARCH & FILTERS HUB */}
                  <div id="filter-hub-card" className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-md space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-100">
                      <div>
                        <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5 font-serif">
                          <SlidersHorizontal className="w-4 h-4 text-rose-700" /> Match Criteria & Proximity Filters
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">Find compatible playmates and families near your area</p>
                      </div>

                      {/* Active filter counter badge & QR Fast Entry Trigger */}
                      <div className="flex items-center gap-2">
                        <button
                          id="btn-generate-event-qr-pass"
                          type="button"
                          onClick={() => setShowDynamicQrModal(true)}
                          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-[10.5px] font-black px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transform transition-all duration-300 hover:scale-105 active:scale-95 animate-pulse hover:animate-none shadow-sm hover:shadow-md hover:shadow-orange-500/25 ring-1 ring-amber-400/50 cursor-pointer"
                          title="Generate dynamic QR code for registered events for fast organizer check-in"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Event QR Pass</span>
                        </button>

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
                        <div className="relative group">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-600 group-focus-within:text-rose-700 group-focus-within:scale-110 transition-all duration-300 z-10 pointer-events-none" />
                          <input
                            id="input-radar-search-query"
                            type="text"
                            value={filterSearchQuery}
                            onChange={(e) => setFilterSearchQuery(e.target.value)}
                            placeholder="e.g. Ayaan, Lego, Hindi, Soccer, Doctor..."
                            className="w-full pl-9 pr-4 py-2 bg-rose-50/30 border border-rose-200 hover:border-rose-300 rounded-xl text-xs outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-500 focus:bg-white focus:scale-[1.01] focus:shadow-md transition-all duration-300 ease-out origin-left"
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
                            {maxDistanceKm < 1 ? maxDistanceKm.toFixed(4) : maxDistanceKm.toFixed(1)} km
                          </span>
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                          <span className="text-[10px] text-slate-400 font-mono">Local (0.1km)</span>
                          <input
                            id="slider-filter-km-radius"
                            type="range"
                            min="0.1"
                            max="1000"
                            step="0.5"
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

                {/* Column 3: Playmate details profiling card & Real-time Activity Feed */}
                <div id="profile-card-column" className="lg:col-span-1 space-y-5">
                  {/* Real-time Categorized Activity Feed Widget */}
                  <ActivityFeedWidget
                    playmates={playmates}
                    eventsList={eventsList}
                    careBookings={careBookings}
                    proximityAlerts={proximityAlerts}
                    connectedIds={connectedIds}
                    interestsSent={interestsSent}
                    interestsReceived={interestsReceived}
                    userLat={userLat}
                    userLng={userLng}
                    onSelectPlaymate={(p) => {
                      handleSelectPlaymate(p);
                      setDetailModalProfile(p);
                    }}
                    onNavigateToTab={(tab, subId) => {
                      setActiveTab(tab as any);
                      if (subId && tab === 'events') {
                        setTimeout(() => {
                          const el = document.getElementById(`event-card-${subId}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 300);
                      }
                    }}
                    onAcceptConnection={handleAcceptConnection}
                    onOpenChat={(p) => handleOpenChatTrigger(p)}
                    onOpenOutbox={() => setIsOutboxDrawerOpen(true)}
                  />

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
                        {filteredPlaymates.slice(0, 24).map((p) => {
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
                                      ? 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=400&crop=faces'
                                      : 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&q=80&w=400&crop=faces';
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

                        {filteredPlaymates.length > 24 && (
                          <div 
                            id="roster-view-all-card"
                            onClick={() => setDashboardSubView('list')}
                            className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-rose-200 min-w-[155px] sm:min-w-[175px] max-w-[185px] bg-rose-50/40 text-center cursor-pointer hover:bg-rose-100/50 transition duration-200 group"
                          >
                            <span className="w-10 h-10 rounded-full bg-rose-100 group-hover:bg-rose-200 flex items-center justify-center text-rose-700 text-lg font-black mb-2 transition">
                              +{filteredPlaymates.length - 24}
                            </span>
                            <h5 className="text-xs font-black text-rose-900 leading-tight">View All in List View</h5>
                            <p className="text-[10px] text-rose-600 mt-1 font-medium">Browse all {filteredPlaymates.length} matches</p>
                          </div>
                        )}
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

            {/* Tab: Babysitting & Drop-in Daycare Marketplace */}
            {activeTab === 'daycare' && (
              <DaycareSittingTab
                daycarePlayhomes={daycarePlayhomes}
                careBookings={careBookings}
                currentUserProfile={userProfile}
                onSaveDaycareProfile={handleSaveDaycareProfile}
                onAddCareBooking={handleAddCareBooking}
                onUpdateBookingStatus={handleUpdateBookingStatus}
                onOpenChatWithUser={(opponentId) => {
                  const mate = playmates.find(p => p.id === opponentId);
                  if (mate) {
                    handleOpenChatTrigger(mate);
                  } else {
                    setActiveTab('chat');
                  }
                }}
                onOpenUserProfile={(targetUser) => {
                  setSelectedPlaymate(targetUser);
                  setActiveTab('radar');
                }}
              />
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
                onNavigateToReferrals={() => setActiveTab('referrals')}
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
      <footer id="global-page-footer" className="bg-white border-t border-slate-200/80 py-10 text-center text-xs text-slate-500 mt-auto px-4">
        <div className="max-w-5xl mx-auto space-y-6 mb-6">
          
          {/* Dedicated Host & Provider Registration Portals */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
              <div className="text-left">
                <span className="text-[10px] uppercase font-black tracking-wider text-rose-700 block">Host &amp; Provider Registration Portals</span>
                <p className="text-[11px] text-slate-600 font-medium">Join Vernunt's verified neighborhood childcare, daycare &amp; activities network</p>
              </div>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                🎁 6 - 12 Months Free Introductory Offer
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
              <button
                id="footer-btn-host-sitter-playhome"
                type="button"
                onClick={() => {
                  if (userProfile && appMode === 'dashboard') {
                    setActiveTab('daycare');
                    setTimeout(() => {
                      const regBtn = document.getElementById('btn-open-sitter-provider-modal');
                      if (regBtn) regBtn.click();
                    }, 100);
                  } else {
                    handleStartSignUp('Parent', { isParentHostingDaycare: true });
                  }
                }}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl font-bold text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <span>🏠</span>
                <span>Host Sitter / Playhome Registration</span>
              </button>

              <button
                id="footer-btn-register-daycare-center"
                type="button"
                onClick={() => {
                  if (userProfile && appMode === 'dashboard') {
                    setActiveTab('daycare');
                  } else {
                    handleStartSignUp('Daycare Center');
                  }
                }}
                className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl font-bold text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <span>🏫</span>
                <span>Register Daycare / Creche Center</span>
              </button>

              <button
                id="footer-btn-host-class"
                type="button"
                onClick={() => {
                  if (userProfile && appMode === 'dashboard') {
                    setActiveTab('events');
                    setTimeout(() => {
                      const hostBtn = document.getElementById('btn-trigger-propose-event');
                      if (hostBtn) hostBtn.click();
                    }, 100);
                  } else {
                    handleStartSignUp('Event Organizer');
                  }
                }}
                className="px-3.5 py-2 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 rounded-xl font-bold text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <span>🎉</span>
                <span>Host Activity or Event</span>
              </button>

              <button
                id="footer-btn-register-spec"
                type="button"
                onClick={() => {
                  if (userProfile && appMode === 'dashboard') {
                    setActiveTab('specialists');
                    setTimeout(() => {
                      const regBtn = document.getElementById('btn-trigger-register-specialist');
                      if (regBtn) regBtn.click();
                    }, 100);
                  } else {
                    handleStartSignUp('Portfolio Professional');
                  }
                }}
                className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl font-bold text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <span>💼</span>
                <span>Pediatric Specialists &amp; Clinics</span>
              </button>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => {
                if (userProfile && appMode === 'dashboard') {
                  setActiveTab('knowledge');
                } else {
                  setIsGuestViewingKnowledge(true);
                  setGuestKnowledgeSlug(undefined);
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-rose-700 font-bold transition cursor-pointer text-rose-800"
            >
              📚 1,000+ Child Growth Guides (Open Access)
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => {
                if (userProfile && appMode === 'dashboard') {
                  setActiveTab('daycare');
                } else {
                  handleStartSignUp('Parent');
                }
              }}
              className="hover:text-rose-700 transition cursor-pointer"
            >
              🍼 Babysitting &amp; Daycare
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => {
                if (userProfile && appMode === 'dashboard') {
                  setActiveTab('radar');
                } else {
                  handleStartSignUp('Parent');
                }
              }}
              className="hover:text-rose-700 transition cursor-pointer"
            >
              🎯 Playmate Radar
            </button>
            <span>&bull;</span>
            <a
              href="https://vernunt.com/store"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:text-orange-700 transition font-bold"
            >
              🛍️ Vernunt Store (vernunt.com/store)
            </a>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => setShowChildComplianceModal(true)}
              className="hover:text-rose-700 transition cursor-pointer"
            >
              🛡️ COPPA &amp; DPDP Safety Protocols
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          &copy; 2026 <strong>Vernunt</strong> (vernunt.com &bull; app.vernunt.com). All Rights Reserved. India's Verified Kids Playmate Radar &amp; Childcare Network.
        </p>
        <button
          id="btn-footer-tac-toggle"
          type="button"
          onClick={() => setShowLegalModal(true)}
          className="text-orange-600 font-bold hover:underline mt-2 text-xs focus:outline-none cursor-pointer"
        >
          View Privacy Regulations &amp; Guardian Terms of Service
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

      {/* Dynamic Event QR Pass & Check-In Modal */}
      {showDynamicQrModal && (
        <EventDynamicQrPassModal
          eventsList={eventsList}
          bookingsList={bookingsList}
          userProfile={userProfile}
          onClose={() => setShowDynamicQrModal(false)}
          onOpenOrganizerGateCheckIn={(event) => {
            setOrganizerGateEvent(event);
          }}
          onUpdateBooking={(updatedBooking) => {
            setBookingsList(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
          }}
        />
      )}

      {/* Organizer Camera Check-In Station Desk */}
      {organizerGateEvent && (
        <EventOrganizerCheckInStation
          event={organizerGateEvent}
          userProfile={userProfile}
          onClose={() => setOrganizerGateEvent(null)}
          onUpdateEvent={(updated) => {
            setEventsList(prev => prev.map(e => e.id === updated.id ? updated : e));
          }}
        />
      )}

      {/* Real-time 1km Immediate Proximity Alert Toast (Non-blocking) */}
      <ProximityAlertToast
        alerts={proximityAlerts}
        onDismiss={handleDismissProximityAlert}
        onView={handleViewProximityAlert}
      />

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

                    const def = TAB_DEFINITIONS.find(tab => tab.id === tabId);
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

            {/* 1km Immediate Proximity Live Beacon Test Section */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  1km Immediate Proximity Live Radar
                </span>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Active</span>
              </div>
              <p className="text-[10px] text-emerald-900 leading-snug">
                Subtle non-blocking toasts are triggered automatically when a new playmate or event joins within your immediate 1km walking radius.
              </p>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  id="btn-simulate-1km-playmate"
                  onClick={() => {
                    triggerSimulatedProximityAlert('playmate');
                    setShowNotificationDrawer(false);
                  }}
                  className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold text-center transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>🧸 Test 1km Playmate</span>
                </button>
                <button
                  id="btn-simulate-1km-event"
                  onClick={() => {
                    triggerSimulatedProximityAlert('event');
                    setShowNotificationDrawer(false);
                  }}
                  className="px-2 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-bold text-center transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>🎉 Test 1km Event</span>
                </button>
              </div>
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
        onClose={() => {
          setShowRoleSelectModal(false);
          setIsLoading(false);
          setIsAuthenticating(false);
        }}
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

      {/* Background Sync Outbox Drawer */}
      <SyncOutboxDrawer
        isOpen={isOutboxDrawerOpen}
        onClose={() => setIsOutboxDrawerOpen(false)}
      />

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
