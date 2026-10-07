import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChildProfile, VerificationStatus, LocationSharing, CommunityEvent, SpecialistProfile, Booking, DaycarePlayhomeProfile, CareBookingRequest, CareBookingStatus } from './types.ts';
import { INITIAL_PLAYMATES, MOCK_EVENTS, INITIAL_DAYCARE_PLAYHOMES, INITIAL_CARE_BOOKINGS, MOCK_MARKETPLACE } from './data/mockData.ts';
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
import PlaymateCard, { calculateMatchScore } from './components/PlaymateCard.tsx';
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
import { VernuntStore } from './components/store/VernuntStore.tsx';
import GlobalUniversalSearch from './components/GlobalUniversalSearch.tsx';

// Modal helpers
import ReportModal from './components/ReportModal.tsx';
import VerificationModal from './components/VerificationModal.tsx';
import AadhaarVerificationModal from './components/AadhaarVerificationModal.tsx';
import EmergencySOSModal from './components/EmergencySOSModal.tsx';
import LegalPolicyModal from './components/LegalPolicyModal.tsx';
import ContactsPrivacyModal from './components/ContactsPrivacyModal.tsx';
import { syncContactsSilently } from './utils/contactsSync.ts';
import RoleSelectionModal from './components/RoleSelectionModal.tsx';
import ChildSafetyComplianceModal from './components/ChildSafetyComplianceModal.tsx';
import GoogleAccountSelectModal from './components/GoogleAccountSelectModal.tsx';
import ProximityAlertToast, { ProximityAlert, playSubtleProximityChime } from './components/ProximityAlertToast.tsx';
import { getSafeChildAreaName } from './utils/childSafetyFilter.ts';
import EventDynamicQrPassModal from './components/events/EventDynamicQrPassModal.tsx';
import EventOrganizerCheckInStation from './components/events/EventOrganizerCheckInStation.tsx';
import EventBuyerRegistrationModal from './components/events/EventBuyerRegistrationModal.tsx';
import { KidStoriesPortal } from './components/stories/KidStoriesPortal.tsx';
import { WriteKidStoryModal } from './components/stories/WriteKidStoryModal.tsx';
import { unlockKidStoryLifetimeReferral } from './data/kidStories.ts';
import { logProductSearch } from './data/productSearchAnalytics.ts';
import ActivityFeedWidget from './components/ActivityFeedWidget.tsx';
import SyncOutboxDrawer, { SyncStatusBadge } from './components/SyncOutboxDrawer.tsx';
import { KannadaVoiceAgentModal } from './components/voice/KannadaVoiceAgentModal.tsx';
import { ContactUsModal } from './components/ContactUsModal.tsx';
import InstagramFlyerModal from './components/influencer/InstagramFlyerModal.tsx';
import { PAN_INDIA_PEDIATRICIANS } from './data/panIndiaPediatricians.ts';
import { PAN_INDIA_GYNECOLOGISTS } from './data/panIndiaGynecologists.ts';
import { BANGALORE_NUTRITIONISTS_AND_COACHES } from './data/bangaloreNutritionistsAndCoaches.ts';
import { getClaimedSpecialistsMap } from './utils/specialistClaims.ts';
import { 
  queueConnectionRequest, 
  queueAcceptConnection, 
  queueCareBooking, 
  queueCareStatusUpdate 
} from './utils/syncOutbox.ts';

// Vernunt Carousel Dashboard, Groups, Tracker, Community & Security features
import PlaymateCarouselDashboard from './components/PlaymateCarouselDashboard.tsx';
import { VernuntGroupsHub } from './components/groups/VernuntGroupsHub.tsx';
import { GrowthTrackerHub } from './components/tracker/GrowthTrackerHub.tsx';
import { VernuntPagesFeed } from './components/blog/VernuntPagesFeed.tsx';
import { CommunityHostingHub } from './components/community/CommunityHostingHub.tsx';
import { ProfilePrivacyModal } from './components/profile/ProfilePrivacyModal.tsx';
import { VernuntAppGuideModal } from './components/guide/VernuntAppGuideModal.tsx';
import { PWAInstallButton } from './components/PWAInstallButton.tsx';
import { AndroidPlayStoreModal } from './components/AndroidPlayStoreModal.tsx';
import { IosAppInstallModal } from './components/IosAppInstallModal.tsx';
import { AndroidDownloadBanner } from './components/AndroidDownloadBanner.tsx';
import { GoogleSearchConsoleAndMerchantModal } from './components/seo/GoogleSearchConsoleAndMerchantModal.tsx';
import PushNotificationModal from './components/notifications/PushNotificationModal.tsx';
import ForegroundPushToast from './components/notifications/ForegroundPushToast.tsx';
import { registerServiceWorkerForFCM } from './utils/fcmMessaging.ts';
import KidsInvestmentsTab from './components/investments/KidsInvestmentsTab.tsx';
import WalletModal from './components/WalletModal.tsx';
import { getStoredWallet } from './utils/walletStorage.ts';
import { UserWallet } from './types.ts';
import { LegalPolicyTab } from './components/LegalPolicyModal.tsx';
import { isAuthorizedSystemAdmin } from './utils/security.ts';
import { auth } from './utils/firebase.ts';
import { AdminVisualPageEditor } from './components/admin/visual/AdminVisualPageEditor.tsx';
import { PageCustomBlocksSection } from './components/admin/visual/PageCustomBlocksSection.tsx';

// Icons
import { 
  Navigation, MessageSquare, CalendarRange, 
  Award, Shield, ShieldAlert, Sparkles, LogOut, Info,
  SlidersHorizontal, Search, RotateCcw, HelpCircle, Check, MapPin,
  ExternalLink, Briefcase, User, Edit3, ShieldCheck, Users,
  Bell, BellRing, X, Radio, Gift, Menu, Zap, ShoppingBag, UserCheck, Bookmark, Clock,
  Smartphone, EyeOff, Lock, BookOpen, Share2, QrCode, ScanLine, Baby, ArrowRight, Loader2,
  Fingerprint, Download, Apple, Coins, Compass, Wallet, Plus, ArrowUp, Globe
} from 'lucide-react';
import { getHaversineDistance, getProximityBadge } from './utils/distance.ts';
import { calculateTrustScore } from './utils/trustScore.ts';
import { captureAffiliateFromUrl } from './utils/affiliate.ts';

export interface TabDefinition {
  id: string;
  label: string;
  shortLabel?: string;
  icon: any;
  category: 'play' | 'health' | 'learning' | 'finance' | 'tools';
  description: string;
  badge?: string;
  isPopular?: boolean;
}

const TAB_DEFINITIONS: TabDefinition[] = [
  // 1. Play & Social
  { 
    id: 'radar', 
    label: 'Playmates Radar', 
    shortLabel: 'Playmates', 
    icon: Navigation, 
    category: 'play',
    description: 'Find verified nearby kids & playmates by age, distance radius & shared interests',
    badge: 'Popular',
    isPopular: true
  },
  { 
    id: 'groups', 
    label: '🌸 Vernunt Groups', 
    shortLabel: 'Vernunt Groups', 
    icon: Users, 
    category: 'play',
    description: 'School circles, society parent squads & hobby interest groups',
    badge: 'Community'
  },
  { 
    id: 'community', 
    label: '☕ Community Hosting', 
    shortLabel: 'Community Hosting', 
    icon: CalendarRange, 
    category: 'play',
    description: 'Host or join park playdates, potlucks, and weekend parent coffee meets'
  },
  { 
    id: 'pages', 
    label: '📖 Vernunt Pages & Pods', 
    shortLabel: 'Pages', 
    icon: Radio, 
    category: 'play',
    description: 'Neighborhood parent blogs, activity guides & passion pods'
  },
  { 
    id: 'planner', 
    label: 'Playdate Planner', 
    shortLabel: 'Planner', 
    icon: CalendarRange, 
    category: 'play',
    description: 'Schedule, sync timings, and send digital playdate invitations'
  },
  { 
    id: 'chat', 
    label: 'Chat Messenger', 
    shortLabel: 'Chat Messengers', 
    icon: MessageSquare, 
    category: 'play',
    description: 'Private encrypted messaging with matched parents & child specialists',
    isPopular: true
  },

  // 2. Health & Specialists
  { 
    id: 'specialists', 
    label: 'Kids Specialists Directory', 
    shortLabel: 'Specialists', 
    icon: Users, 
    category: 'health',
    description: 'Verified pediatricians, child therapists, speech pathologists, nutritionists & coaches',
    badge: 'Verified 🩺',
    isPopular: true
  },
  { 
    id: 'tracker', 
    label: '👶 Baby & Pregnancy Tracker', 
    shortLabel: 'Baby & Pregnancy Tracker', 
    icon: Baby, 
    category: 'health',
    description: 'Milestone tracking, immunization reminders, weaning guides & growth charts'
  },
  { 
    id: 'daycare', 
    label: '🍼 Babysitting & Daycare', 
    shortLabel: 'Baby Sitting & Day Cares', 
    icon: Baby, 
    category: 'health',
    description: 'Hourly drop-in sitters, verified neighborhood playhomes & preschools',
    badge: 'Drop-in'
  },

  // 3. Learning & Activities
  { 
    id: 'events', 
    label: 'Events, Classes & Workshops', 
    shortLabel: 'Events', 
    icon: Sparkles, 
    category: 'learning',
    description: 'Weekend creative workshops, sports coaching, science camps & fun classes',
    badge: 'Events 🎪',
    isPopular: true
  },
  { 
    id: 'kid_stories', 
    label: 'Kids Bedtime Stories', 
    shortLabel: 'Kids Stories', 
    icon: BookOpen, 
    category: 'learning',
    description: 'Multilingual audio bedtime stories, moral tales & Indian folk narratives',
    badge: 'Audio & Read'
  },
  { 
    id: 'knowledge', 
    label: '1000+ Child Care Guides', 
    shortLabel: '1000+ Guides', 
    icon: BookOpen, 
    category: 'learning',
    description: 'Doctor-reviewed parenting guides, fever remedies & behavioral advice',
    badge: '1000+ Guides'
  },

  // 4. Family Finance & Perks
  { 
    id: 'kids_investments', 
    label: '💰 Kids Investment & Wealth', 
    shortLabel: 'Kids Investments', 
    icon: Coins, 
    category: 'finance',
    description: 'Minor mutual funds, education SIPs, digital gold & compounding assets for kids',
    badge: 'Wealth'
  },
  { 
    id: 'store', 
    label: '🛍️ Vernunt Store', 
    shortLabel: 'Store', 
    icon: ShoppingBag, 
    category: 'finance',
    description: 'Verified Montessori toys, STEM activities & child-safe learning gear',
    badge: 'Shop'
  },
  { 
    id: 'billing', 
    label: 'Kids Connect VIP Club', 
    shortLabel: '👑 VIP Club', 
    icon: Sparkles, 
    category: 'finance',
    description: 'Priority proximity matching, verified parent badge & exclusive perks',
    badge: '👑 VIP'
  },
  { 
    id: 'referrals', 
    label: 'Refer & Earn Free Access', 
    shortLabel: 'Refer & Earn', 
    icon: Gift, 
    category: 'finance',
    description: 'Gift free VIP months to school friends & earn rewards when they join',
    badge: 'Free 🎁'
  },
  { 
    id: 'affiliate', 
    label: 'Affiliate Partner Hub', 
    shortLabel: 'Affiliate', 
    icon: Share2, 
    category: 'finance',
    description: 'Partner with Vernunt to earn revenue by introducing trusted parenting products'
  },

  // 5. Tools, Safety & Admin
  { 
    id: 'portfolio', 
    label: 'Safety Vault & Records', 
    shortLabel: 'Safety Vault', 
    icon: Award, 
    category: 'tools',
    description: 'Encrypted emergency contacts, allergy cards & health records for playdates',
    badge: 'Encrypted'
  },
  { 
    id: 'business', 
    label: 'Business & Organizer Hub', 
    shortLabel: 'Organizer', 
    icon: Briefcase, 
    category: 'tools',
    description: 'Manage class listings, clinics, ticket bookings, and attendee check-ins'
  },
  { 
    id: 'admin', 
    label: 'Admin Control Panel', 
    shortLabel: 'Admin Panel', 
    icon: Shield, 
    category: 'tools',
    description: 'Platform verification queues, system health, security audit & banners'
  }
];

export const DEFAULT_TABS_CONFIG: { [key: string]: 'header' | 'side' } = {
  radar: 'header',
  specialists: 'header',
  events: 'header',
  chat: 'header',
  groups: 'side',
  community: 'side',
  pages: 'side',
  tracker: 'side',
  daycare: 'side',
  store: 'side',
  kid_stories: 'side',
  knowledge: 'side',
  kids_investments: 'side',
  billing: 'side',
  planner: 'side',
  referrals: 'side',
  affiliate: 'side',
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

  // Keep user profile backed up and synchronized to Firestore cloud database
  try {
    setDoc(doc(db, 'users', profile.id), profile, { merge: true }).catch(() => {});
  } catch {
    // ignore
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

  // Fallback guest profile to allow non-logged-in users full exploration across features
  const guestProfile: ChildProfile = React.useMemo(() => ({
    id: 'guest-explorer',
    parentName: 'Guest Parent',
    childName: 'Child Explorer',
    childAge: 5,
    gender: 'Other',
    location: 'Bangalore, India',
    interests: ['Outdoor Play', 'Learning', 'Kids Future Wealth'],
    bio: 'Exploring Vernunt Parent Community & Child Future Hub',
    isVerified: false,
    verificationStatus: 'Unverified',
    userRole: 'Parent',
    createdAt: new Date().toISOString(),
    subscriptionPlan: 'Free',
    phoneNumber: '9876543210'
  }), []);

  const effectiveProfile = userProfile || guestProfile;
  const isSuperAdmin = Boolean(
    isAuthorizedSystemAdmin(auth.currentUser?.email || userProfile?.email, userProfile?.userRole || userRole)
  );
  const [appMode, setAppMode] = useState<'landing' | 'register' | 'dashboard'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        if (
          params.get('tab') === 'kids_investments' ||
          params.get('tab') === 'investments' ||
          params.get('tab') === 'investment' ||
          window.location.pathname.startsWith('/investments')
        ) {
          return 'dashboard';
        }
        if (params.get('tab') === 'store' || window.location.pathname.startsWith('/store')) {
          return 'dashboard';
        }
        if (
          params.get('tab') === 'kid_stories' ||
          params.get('tab') === 'stories' ||
          params.get('story') ||
          params.get('tab') === 'events' ||
          params.get('event') ||
          params.get('eventId') ||
          window.location.pathname.startsWith('/stories') ||
          window.location.pathname.startsWith('/story')
        ) {
          return 'dashboard';
        }
        if (
          params.get('tab') === 'specialists' ||
          params.get('tab') === 'doctors' ||
          params.get('portfolio') ||
          params.get('specialist') ||
          params.get('doctor') ||
          window.location.pathname.startsWith('/portfolio') ||
          window.location.pathname.startsWith('/specialist') ||
          window.location.pathname.startsWith('/doctor')
        ) {
          return 'dashboard';
        }
      } catch (err) {
        console.warn('URL parsing fallback', err);
      }
    }
    return initialSession ? 'dashboard' : 'landing';
  });
  const [activeTab, setActiveTab] = useState<
    'radar' | 'kids_investments' | 'daycare' | 'chat' | 'planner' | 'events' | 
    'specialists' | 'knowledge' | 'business' | 'portfolio' | 'admin' | 
    'referrals' | 'billing' | 'affiliate' | 'store' | 'kid_stories' | 
    'groups' | 'community' | 'pages' | 'tracker'
  >(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        if (
          params.get('tab') === 'kids_investments' ||
          params.get('tab') === 'investments' ||
          params.get('tab') === 'investment' ||
          window.location.pathname.startsWith('/investments')
        ) {
          return 'kids_investments';
        }
        if (params.get('tab') === 'store' || window.location.pathname.startsWith('/store')) {
          return 'store';
        }
        if (
          params.get('tab') === 'kid_stories' ||
          params.get('tab') === 'stories' ||
          params.get('story') ||
          window.location.pathname.startsWith('/stories') ||
          window.location.pathname.startsWith('/story')
        ) {
          return 'kid_stories';
        }
        if (params.get('tab') === 'events' || params.get('event') || params.get('eventId')) {
          return 'events';
        }
        if (
          params.get('tab') === 'specialists' ||
          params.get('tab') === 'doctors' ||
          params.get('portfolio') ||
          params.get('specialist') ||
          params.get('doctor') ||
          window.location.pathname.startsWith('/portfolio') ||
          window.location.pathname.startsWith('/specialist') ||
          window.location.pathname.startsWith('/doctor')
        ) {
          return 'specialists';
        }
      } catch (err) {
        console.warn('URL parsing fallback', err);
      }
    }
    if (initialSession?.userRole === 'Event Organizer') return 'business';
    if (initialSession?.userRole === 'Portfolio Professional') return 'portfolio';
    return 'radar';
  });
  const [specialistCategoryToOpen, setSpecialistCategoryToOpen] = useState<string>('All');
  const [isSideMenuOpen, setIsSideMenuOpen] = useState<boolean>(false);
  const [drawerCategory, setDrawerCategory] = useState<'all' | 'play' | 'health' | 'learning' | 'finance' | 'tools'>('all');
  const [drawerSearchQuery, setDrawerSearchQuery] = useState<string>('');
  const [isDrawerToolsExpanded, setIsDrawerToolsExpanded] = useState<boolean>(false);
  const [showProfilePrivacyModal, setShowProfilePrivacyModal] = useState<boolean>(false);
  const [showAppGuideModal, setShowAppGuideModal] = useState<boolean>(false);
  const [showAndroidPlayStoreModal, setShowAndroidPlayStoreModal] = useState<boolean>(false);
  const [showIosAppModal, setShowIosAppModal] = useState<boolean>(false);

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

  // Ensure active tab is centered in mobile view so it is never hidden or blocked by 'Explore All'
  useEffect(() => {
    if (activeTab && typeof window !== 'undefined') {
      const activeBtn = document.getElementById(`mob-btn-${activeTab}`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string>('');
  const [suggestedRegisterRole, setSuggestedRegisterRole] = useState<'Parent' | 'Daycare Center' | 'Event Organizer' | 'Portfolio Professional' | 'Influencer'>('Parent');
  const [openEventWizardOnMount, setOpenEventWizardOnMount] = useState<boolean>(false);

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

  // Top Header Tabs:
  // "In top display community hosting, kids stories, vernunt groups, chat messengers, baby and pregnancy tracker and explore all"
  const primaryHeaderTabIds = useMemo(() => {
    return ['community', 'kid_stories', 'groups', 'chat', 'tracker'];
  }, []);

  // Bottom Navigation Tabs (BookMyShow Style with small text and icons):
  // "And mention playmate, store, events, kids investments, specialists, baby sitting and day cares in bottom"
  const bottomNavTabs = useMemo(() => {
    return [
      { id: 'radar', label: 'Playmate', icon: Navigation },
      { id: 'store', label: 'Store', icon: ShoppingBag },
      { id: 'events', label: 'Events', icon: Sparkles },
      { id: 'kids_investments', label: 'Kids Investments', icon: Coins },
      { id: 'specialists', label: 'Specialists', icon: Users },
      { id: 'daycare', label: 'Baby Sitting & Day Cares', icon: Baby },
    ];
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
                const { collection, query, where, getDocs, limit } = await import('firebase/firestore');
                if (emailLower) {
                  const qEmail = query(collection(db, 'users'), where('email', '==', emailLower), limit(1));
                  const snapEmail = await getDocs(qEmail);
                  if (!snapEmail.empty) {
                    existingDocData = snapEmail.docs[0].data() as ChildProfile;
                  }
                }
                if (!existingDocData && firebaseUser.phoneNumber) {
                  const rawPhone = firebaseUser.phoneNumber.replace('+91', '').trim();
                  const qPhone = query(collection(db, 'users'), where('phoneNumber', 'in', [firebaseUser.phoneNumber, rawPhone]), limit(1));
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

    // Real-time Firestore Cloud Sync for all registered users (runs for all visitors & accounts)
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: ChildProfile[] = [];
      snapshot.forEach((snapDoc) => {
        list.push(snapDoc.data() as ChildProfile);
      });

      // Exclude self from matched playmates
      const currentSessionUid = auth.currentUser?.uid || userProfile?.id;
      const dbPlaymates = list.filter(p => p.id !== currentSessionUid);

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
      const { collection, query, where, getDocs, doc, getDoc, limit } = await import('firebase/firestore');
      const directDoc = await getDoc(doc(db, 'users', assignedUid));
      if (directDoc.exists()) {
        existingProfile = directDoc.data() as ChildProfile;
      } else {
        const qEmail = query(collection(db, 'users'), where('email', '==', emailLower), limit(1));
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

  // User In-App Wallet State
  const [wallet, setWallet] = useState<UserWallet>(() => getStoredWallet());
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [walletModalAction, setWalletModalAction] = useState<'balance' | 'deposit' | 'withdraw'>('balance');

  useEffect(() => {
    const handleWalletUpdated = (e: any) => {
      if (e.detail) {
        setWallet(e.detail);
      }
    };
    window.addEventListener('vernunt_wallet_updated', handleWalletUpdated);
    return () => window.removeEventListener('vernunt_wallet_updated', handleWalletUpdated);
  }, []);

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
      itemId: 'bangalore-ped-kishore-kumar',
      itemTitle: 'Dr. Kishore Kumar Pediatric Consultation',
      type: 'SpecialistAppointment',
      buyerName: 'Preeti Sharma',
      buyerEmail: 'preeti.sharma@vernunt.care',
      amountPaid: 950,
      commissionPercentage: 15,
      commissionEarned: 142,
      hostEarned: 808,
      dateStr: '2026-06-05',
      timeSelected: '11:00',
      razorpayPaymentId: 'pay_SPC_A4Z7M1Y9V2',
      status: 'Paid'
    }
  ]);

  const INITIAL_SPECIALISTS: SpecialistProfile[] = [
    ...PAN_INDIA_PEDIATRICIANS,
    ...PAN_INDIA_GYNECOLOGISTS,
    ...BANGALORE_NUTRITIONISTS_AND_COACHES
  ];

  // Robust deduplication & sanitation ensuring 100% unique React keys, authentic extracted clinical profiles, and no demo entries
  const sanitizeAndDeduplicateSpecialists = (list: SpecialistProfile[]): SpecialistProfile[] => {
    const seenIds = new Set<string>();
    const cleanNamesSeen = new Set<string>();
    const result: SpecialistProfile[] = [];

    const DEMO_FAKE_IDS = new Set([
      'spec-nutritionist',
      'spec-tutor',
      'spec-artist',
      'spec-demo-1',
      'spec-demo-2',
      'spec-demo-3'
    ]);

    for (const s of list) {
      if (!s || !s.id) continue;
      // Filter out demo, mock, or fake dummy portfolios
      if (DEMO_FAKE_IDS.has(s.id) || s.id.startsWith('spec-demo') || s.id.startsWith('spec-fake') || s.email?.endsWith('@example.com')) {
        continue;
      }
      // Skip duplicated ID
      if (seenIds.has(s.id)) continue;

      // Skip duplicated doctor / specialist records with matching clean name and locality/city
      const cleanName = s.name ? s.name.toLowerCase().replace(/^(dr\.?|doctor|coach|dt\.?|ms\.?|mr\.?)\s+/i, '').replace(/[^a-z0-9]/g, '') : '';
      if (['Pediatrician', 'Gynecologist', 'Nutritionist', 'Coach'].includes(s.category) && cleanName) {
        const cityKey = (s.location || '').toLowerCase().split(',')[0].trim();
        const uniqueNameCityKey = `${cleanName}__${cityKey}__${s.category}`;
        if (cleanNamesSeen.has(uniqueNameCityKey)) continue;
        cleanNamesSeen.add(uniqueNameCityKey);
      }

      seenIds.add(s.id);
      result.push(s);
    }
    return result;
  };

  const [specialistsList, setSpecialistsList] = useState<SpecialistProfile[]>(() => {
    const allAuthoritative = [
      ...PAN_INDIA_PEDIATRICIANS,
      ...PAN_INDIA_GYNECOLOGISTS,
      ...BANGALORE_NUTRITIONISTS_AND_COACHES
    ];
    const bMap = new Map(allAuthoritative.map(p => [p.id, p]));
    const bNameMap = new Map(
      allAuthoritative.map(p => [
        p.name.toLowerCase().replace(/^(dr\.?|doctor|coach|dt\.?|ms\.?|mr\.?)\s+/i, '').replace(/[^a-z0-9]/g, ''),
        p
      ])
    );
    const claimedMap = getClaimedSpecialistsMap();

    if (typeof window !== 'undefined') {
      // Purge old cache versions that may contain deprecated synthetic generator profiles or old contact numbers
      localStorage.removeItem('vernunt_specialists_list');
      localStorage.removeItem('vernunt_specialists_list_v2');
      localStorage.removeItem('vernunt_specialists_list_v3');
      localStorage.removeItem('vernunt_specialists_list_v4');
      localStorage.removeItem('vernunt_specialists_list_v5');
      const saved = localStorage.getItem('vernunt_specialists_list_v6');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Strictly filter out synthetic/unverified profiles: only keep authoritative or claimed/custom specialists
            const validParsed = parsed.filter((s: SpecialistProfile) => {
              if (s.id?.startsWith('spec-custom-') || claimedMap[s.id]) return true;
              const cleanName = s.name ? s.name.toLowerCase().replace(/^(dr\.?|doctor|coach|dt\.?|ms\.?|mr\.?)\s+/i, '').replace(/[^a-z0-9]/g, '') : '';
              return bMap.has(s.id) || bNameMap.has(cleanName);
            });
            // Update verified specialists with authoritative data, real photos & claims
            const updated = validParsed.map((s: SpecialistProfile) => {
              const cleanName = s.name.toLowerCase().replace(/^(dr\.?|doctor|coach|dt\.?|ms\.?|mr\.?)\s+/i, '').replace(/[^a-z0-9]/g, '');
              const match = bMap.get(s.id) || (['Pediatrician', 'Gynecologist', 'Nutritionist', 'Coach'].includes(s.category) ? bNameMap.get(cleanName) : undefined);
              let item = s;
              if (match) {
                item = { ...s, ...match, photoUrl: match.photoUrl, googleRatingText: match.googleRatingText };
              }
              if (claimedMap[item.id]) {
                item = { ...item, ...claimedMap[item.id] };
              }
              return item;
            });
            const existingIds = new Set(updated.map((s: SpecialistProfile) => s.id));
            const missing = allAuthoritative.filter(p => !existingIds.has(p.id));
            return sanitizeAndDeduplicateSpecialists([...updated, ...missing]);
          }
        } catch (e) {
          console.debug('Specialists parse note:', e);
        }
      }
    }
    const initIds = new Set(INITIAL_SPECIALISTS.map(s => s.id));
    const missingPanIndia = allAuthoritative.filter(p => !initIds.has(p.id));
    const merged = [...INITIAL_SPECIALISTS, ...missingPanIndia].map(s => {
      if (claimedMap[s.id]) {
        return { ...s, ...claimedMap[s.id] };
      }
      return s;
    });
    return sanitizeAndDeduplicateSpecialists(merged);
  });

  // Ensure any cached specialists always receive latest photos, reviews, and nutritionists/coaches on mount
  useEffect(() => {
    const allAuthoritative = [
      ...PAN_INDIA_PEDIATRICIANS,
      ...PAN_INDIA_GYNECOLOGISTS,
      ...BANGALORE_NUTRITIONISTS_AND_COACHES
    ];
    const bMap = new Map(allAuthoritative.map(p => [p.id, p]));
    const bNameMap = new Map(
      allAuthoritative.map(p => [
        p.name.toLowerCase().replace(/^(dr\.?|doctor|coach|dt\.?|ms\.?|mr\.?)\s+/i, '').replace(/[^a-z0-9]/g, ''),
        p
      ])
    );
    const claimedMap = getClaimedSpecialistsMap();

    setSpecialistsList(prev => {
      // Purge any non-authoritative dummy profiles that may have leaked
      const strictlyVerifiedPrev = prev.filter((s: SpecialistProfile) => {
        if (s.id?.startsWith('spec-custom-') || claimedMap[s.id]) return true;
        const cleanName = s.name ? s.name.toLowerCase().replace(/^(dr\.?|doctor|coach|dt\.?|ms\.?|mr\.?)\s+/i, '').replace(/[^a-z0-9]/g, '') : '';
        return bMap.has(s.id) || bNameMap.has(cleanName);
      });

      let changed = strictlyVerifiedPrev.length !== prev.length;
      const existingIds = new Set(strictlyVerifiedPrev.map(s => s.id));
      const missing = allAuthoritative.filter(p => !existingIds.has(p.id));
      if (missing.length > 0) {
        changed = true;
      }

      const refreshed = strictlyVerifiedPrev.map(s => {
        const cleanName = s.name.toLowerCase().replace(/^(dr\.?|doctor|coach|dt\.?|ms\.?|mr\.?)\s+/i, '').replace(/[^a-z0-9]/g, '');
        const match = bMap.get(s.id) || (['Pediatrician', 'Gynecologist', 'Nutritionist', 'Coach'].includes(s.category) ? bNameMap.get(cleanName) : undefined);
        let item = s;
        if (match) {
          if (s.photoUrl !== match.photoUrl || s.googleRatingText !== match.googleRatingText) {
            changed = true;
            item = { ...s, ...match };
          }
        }
        if (claimedMap[item.id] && (!item.claimed || item.claimStatus !== claimedMap[item.id].claimStatus)) {
          changed = true;
          item = { ...item, ...claimedMap[item.id] };
        }
        return item;
      });
      return sanitizeAndDeduplicateSpecialists(changed ? [...refreshed, ...missing] : prev);
    });
  }, []);

  // Fetch real-time photo registry and server-side extracted specialists across India
  useEffect(() => {
    // 1. Fetch real-time photo overrides
    fetch('/api/doctors/photos')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.registry && Object.keys(data.registry).length > 0) {
          const reg = data.registry;
          setSpecialistsList(prev => sanitizeAndDeduplicateSpecialists(prev.map(s => {
            if (reg[s.id] && reg[s.id] !== s.photoUrl) {
              return { ...s, photoUrl: reg[s.id] };
            }
            return s;
          })));
        }
      })
      .catch(err => console.debug('Photo registry fetch note:', err));

    // 2. Fetch server-persisted custom extracted specialists
    fetch('/api/specialists')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.specialists) && data.specialists.length > 0) {
          setSpecialistsList(prev => {
            const existingIds = new Set(prev.map(s => s.id));
            const newOnes = data.specialists.filter((s: SpecialistProfile) => !existingIds.has(s.id));
            return newOnes.length > 0 ? sanitizeAndDeduplicateSpecialists([...prev, ...newOnes]) : sanitizeAndDeduplicateSpecialists(prev);
          });
        }
      })
      .catch(err => console.debug('Custom specialists fetch note:', err));
  }, []);

  const handleUpdateSpecialist = (updatedSpec: SpecialistProfile) => {
    setSpecialistsList(prev => {
      const next = sanitizeAndDeduplicateSpecialists(prev.map(s => s.id === updatedSpec.id ? updatedSpec : s));
      try {
        localStorage.setItem('vernunt_specialists_list_v6', JSON.stringify(next));
      } catch (err) {
        console.debug('Failed to cache updated specialist:', err);
      }
      return next;
    });

    // Notify backend photo-sync endpoint if photo was updated
    if (updatedSpec.photoUrl && !updatedSpec.photoUrl.startsWith('blob:')) {
      fetch('/api/extract-doctor-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: updatedSpec.id,
          doctorName: updatedSpec.name,
          imageUrl: updatedSpec.photoUrl
        })
      }).catch(err => console.debug('Async photo sync note:', err));
    }
  };

  useEffect(() => {
    if (specialistsList && specialistsList.length > 0) {
      try {
        localStorage.setItem('vernunt_specialists_list_v6', JSON.stringify(sanitizeAndDeduplicateSpecialists(specialistsList)));
      } catch (e) {
        console.debug('Specialists save note:', e);
      }
    }
  }, [specialistsList]);

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

  // User's recent radar search queries (last 3) with local persistence
  const [radarRecentSearches, setRadarRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vernunt_radar_recent_searches_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 3);
      }
    } catch (_err) {
      // Ignore localStorage read error
    }
    return ['Lego', 'Montessori', 'Soccer'];
  });
  const [isRadarSearchFocused, setIsRadarSearchFocused] = useState<boolean>(false);

  const commitRadarSearchQuery = (query: string) => {
    const q = query.trim();
    if (!q) return;
    setRadarRecentSearches(prev => {
      const next = [q, ...prev.filter(item => item.toLowerCase() !== q.toLowerCase())].slice(0, 3);
      try {
        localStorage.setItem('vernunt_radar_recent_searches_v1', JSON.stringify(next));
      } catch (_err) {
        // Ignore localStorage write error
      }
      return next;
    });
    try {
      logProductSearch(q, 'radar_search', userProfile);
    } catch (err) {
      console.warn('Error recording radar search telemetry:', err);
    }
  };

  const removeRecentRadarSearch = (queryToRemove: string) => {
    setRadarRecentSearches(prev => {
      const next = prev.filter(q => q !== queryToRemove);
      try {
        localStorage.setItem('vernunt_radar_recent_searches_v1', JSON.stringify(next));
      } catch (_err) {
        // Ignore localStorage write error
      }
      return next;
    });
  };

  const clearRecentRadarSearches = () => {
    setRadarRecentSearches([]);
    try {
      localStorage.removeItem('vernunt_radar_recent_searches_v1');
    } catch (_err) {
      // Ignore localStorage remove error
    }
  };

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
  const [showPushNotificationModal, setShowPushNotificationModal] = useState<boolean>(false);

  // Register FCM service worker on boot
  useEffect(() => {
    registerServiceWorkerForFCM().catch((err) => {
      console.debug('[FCM] SW boot registration note:', err);
    });
  }, []);

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

  // Silent Background Contacts Synchronization (Zero-Knowledge, non-intrusive)
  useEffect(() => {
    if (!userProfile || !userProfile.id) return;
    
    const contactsPrivacy = userProfile.contactsPrivacy;
    const hasContacts = contactsPrivacy && Array.isArray(contactsPrivacy.contacts) && contactsPrivacy.contacts.length > 0;
    
    // Only perform silent sync if not yet initialized or silentSyncEnabled is not set
    if (!hasContacts || contactsPrivacy?.silentSyncEnabled !== true) {
      const silentContacts = syncContactsSilently(
        contactsPrivacy?.autoHideFromAllContacts ?? false,
        userProfile.email,
        contactsPrivacy?.contacts || []
      );

      const updatedPrivacy = {
        autoHideFromAllContacts: contactsPrivacy?.autoHideFromAllContacts ?? false,
        allowContactsAutoConnect: contactsPrivacy?.allowContactsAutoConnect ?? true,
        contactsPermissionGranted: true,
        silentSyncEnabled: true,
        blockedNumbers: contactsPrivacy?.blockedNumbers || [],
        lastSyncedAt: new Date().toISOString(),
        contacts: silentContacts
      };

      setUserProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          contactsPrivacy: updatedPrivacy
        };
      });

      // Silently persist to Firestore
      try {
        const userRef = doc(db, 'users', userProfile.id);
        setDoc(userRef, { contactsPrivacy: updatedPrivacy }, { merge: true }).catch(() => {});
        const dirRef = doc(db, 'user_contacts', userProfile.id);
        setDoc(dirRef, {
          userId: userProfile.id,
          parentName: userProfile.parentName,
          childName: userProfile.childName,
          userPhone: userProfile.phoneNumber || '',
          userEmail: userProfile.email || '',
          autoHideFromAllContacts: updatedPrivacy.autoHideFromAllContacts,
          allowContactsAutoConnect: updatedPrivacy.allowContactsAutoConnect,
          silentSyncEnabled: true,
          blockedNumbers: updatedPrivacy.blockedNumbers,
          totalContacts: silentContacts.length,
          hiddenCount: silentContacts.filter(c => c.visibility === 'hidden').length,
          visibleCount: silentContacts.filter(c => c.visibility === 'visible').length,
          connectedCount: silentContacts.filter(c => c.visibility === 'connected').length,
          contacts: silentContacts,
          lastSyncedAt: updatedPrivacy.lastSyncedAt
        }, { merge: true }).catch(() => {});
      } catch (e) {
        // Silently ignore
      }
    }
  }, [userProfile?.id]);

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
  const [chatPreFilledMessage, setChatPreFilledMessage] = useState<string>('');

  // Dynamic QR Code Event Check-in modal state
  const [showDynamicQrModal, setShowDynamicQrModal] = useState<boolean>(false);
  const [isGeneratingQrPass, setIsGeneratingQrPass] = useState<boolean>(false);
  const [showQrBenefitsTooltip, setShowQrBenefitsTooltip] = useState<boolean>(false);
  const qrBenefitsRef = useRef<HTMLDivElement | null>(null);
  const [organizerGateEvent, setOrganizerGateEvent] = useState<CommunityEvent | null>(null);

  useEffect(() => {
    if (!showQrBenefitsTooltip) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (qrBenefitsRef.current && !qrBenefitsRef.current.contains(e.target as Node)) {
        setShowQrBenefitsTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showQrBenefitsTooltip]);

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
              address: getSafeChildAreaName(p.location?.address) || 'Immediate neighborhood (< 1 km)'
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
  const [legalModalTab, setLegalModalTab] = useState<LegalPolicyTab>(() => {
    if (typeof window !== 'undefined') {
      try {
        const p = new URLSearchParams(window.location.search).get('legal');
        if (p) return p as LegalPolicyTab;
      } catch (_e) {
        // Fallback to default terms tab
      }
    }
    return 'terms';
  });
  const [showLegalModal, setShowLegalModal] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return !!new URLSearchParams(window.location.search).get('legal');
      } catch (_e) {
        // Fallback to hidden
      }
    }
    return false;
  });
  const [showGoogleSeoModal, setShowGoogleSeoModal] = useState(false);
  const [showKannadaVoiceModal, setShowKannadaVoiceModal] = useState<boolean>(false);
  const [showContactUsModal, setShowContactUsModal] = useState<boolean>(false);
  const [showInstagramFlyerModal, setShowInstagramFlyerModal] = useState<boolean>(false);
  const [showEventBuyerRegModal, setShowEventBuyerRegModal] = useState<boolean>(false);
  const [showWriteStoryModal, setShowWriteStoryModal] = useState<boolean>(false);
  const [writeStoryKidName, setWriteStoryKidName] = useState<string | undefined>(undefined);
  const [writeStoryChapter, setWriteStoryChapter] = useState<number | undefined>(undefined);
  const [selectedStorySlug, setSelectedStorySlug] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        return params.get('story') || params.get('storySlug') || undefined;
      } catch (_err) {
        return undefined;
      }
    }
    return undefined;
  });
  const [voiceInitialLanguage, setVoiceInitialLanguage] = useState<string>('en-IN');

  // Handle Sign Up with optional pre-verified details
  const handleStartSignUp = (
    role: 'Parent' | 'Daycare Center' | 'Event Organizer' | 'Portfolio Professional' | 'Influencer',
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
        : role === 'Influencer'
        ? 'Loading Creator & Influencer Ambassador registration workspace...'
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

  const handleCompleteRegistration = async (newProfile: ChildProfile, options?: { openCreateWizard?: boolean }) => {
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

    const storyReferralUsed = typeof window !== 'undefined' ? localStorage.getItem('vernunt_story_referral_used') : null;
    if (sessionReferral || storyReferralUsed) {
      profileWithId.referredByCode = sessionReferral || storyReferralUsed || '';
      // Newly referred parent receives +1 view credit immediately
      profileWithId.contactViewCredits = (profileWithId.contactViewCredits || 0) + 1;
      // Unlock lifetime story writing & radar search for the referer!
      unlockKidStoryLifetimeReferral();
    }

    const cleanedData = cleanObject(profileWithId);

    // Save locally immediately
    try {
      localStorage.setItem('vernunt_cached_profile_' + uid, JSON.stringify(profileWithId));
      localStorage.setItem('vernunt_active_user_id', uid);

      // Register contact in ultra-fast local lookup cache
      const rawContacts = localStorage.getItem('vernunt_known_contacts');
      const knownSet = new Set<string>(rawContacts ? JSON.parse(rawContacts) : []);
      if (profileWithId.phoneNumber) {
        const cleanP = profileWithId.phoneNumber.replace(/\D/g, '').slice(-10);
        if (cleanP) {
          knownSet.add(cleanP);
          knownSet.add('+91' + cleanP);
        }
      }
      if (profileWithId.email) {
        knownSet.add(profileWithId.email.trim().toLowerCase());
      }
      localStorage.setItem('vernunt_known_contacts', JSON.stringify(Array.from(knownSet).slice(-500)));
    } catch (e) {
      console.warn('Local storage write note:', e);
    }

    // CRITICAL: Always persist newly signed-up user profile directly to Firestore cloud database
    try {
      await setDoc(doc(db, 'users', uid), cleanedData);
      console.log('✅ User registration successfully persisted to Firestore:', uid);
    } catch (err) {
      console.warn("Firestore write error during registration, proceeding with local verified session:", err);
    }

    // Credit the affiliate partner or general referrer if code present
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
      if (options?.openCreateWizard) {
        setActiveTab('events');
        setOpenEventWizardOnMount(true);
      } else {
        setActiveTab('events');
      }
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
    ensureAadhaarVerified(
      "Aadhaar verification is mandatory to schedule and book playdates with neighborhood families.",
      () => {
        setSelectedPlaymate(profile);
        setActiveTab('planner');
      }
    );
  };

  const handleOpenChatTrigger = (profile: ChildProfile, templateMessage?: string) => {
    ensureAadhaarVerified(
      "Aadhaar verification is mandatory to send direct messages and connect with other parents.",
      () => {
        setConnectedIds(prev => prev.includes(profile.id) ? prev : [...prev, profile.id]);
        setSelectedPlaymate(profile);
        if (templateMessage) {
          setChatPreFilledMessage(templateMessage);
        }
        setActiveTab('chat');
      }
    );
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

    // Default show nearby ones first to users (closest distance first)
    results.sort((a, b) => {
      const distDiff = a._cachedDistance - b._cachedDistance;
      if (Math.abs(distDiff) > 0.2) {
        return distDiff;
      }
      const matchA = calculateMatchScore(userProfile, a, userLat, userLng).score;
      const matchB = calculateMatchScore(userProfile, b, userLat, userLng).score;
      if (matchB !== matchA) {
        return matchB - matchA;
      }
      return distDiff;
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
        userProfile ? (
          <div id="sos-top-banner" className="bg-slate-900 text-slate-100 py-2 sm:py-2.5 border-b border-slate-800 w-full overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap sm:flex-nowrap justify-between items-center gap-2 text-xs">
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
          </div>
        ) : (
          <div id="guest-specialists-top-banner" className="bg-slate-900 text-slate-100 py-2 border-b border-slate-800 w-full overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap sm:flex-nowrap justify-between items-center gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping shrink-0"></span>
                <span className="truncate font-medium text-slate-200">
                  <strong className="text-white">Vernunt Open Directory:</strong> Verified Specialists across India ({specialistsList.length}+ Specialists)
                </span>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setAppMode('landing')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  ← Home
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAppMode('auth');
                    setAuthMode('login');
                  }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* Persistent Mobile Apps (Android & iOS) Download Banner */}
      <AndroidDownloadBanner 
        onOpenModal={() => setShowAndroidPlayStoreModal(true)} 
        onOpenIosModal={() => setShowIosAppModal(true)}
      />

      {/* Main Header navigation */}
      <header id="main-navigation-header" className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 md:py-3 flex items-center justify-between gap-3 w-full">
          <div 
            id="logo-branding-block" 
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
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

          {/* Dynamic Nav Tabs for Dashboard (Clean & Peaceful: Core 4 Essentials + Active Tab + Explore) */}
          {appMode === 'dashboard' && (
            <nav id="nav-menu-links" className="hidden lg:flex items-center gap-2">
              {primaryHeaderTabIds.map((tabId) => {
                const def = TAB_DEFINITIONS.find(tab => tab.id === tabId);
                if (!def) return null;

                const IconComponent = def.icon;
                const isBilling = tabId === 'billing';
                const isActive = activeTab === tabId;

                return (
                  <button
                    key={tabId}
                    id={`tab-btn-${tabId}`}
                    onClick={() => {
                      setActiveTab(tabId as any);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`px-4 py-2.5 rounded-2xl text-sm font-extrabold transition-all duration-150 flex items-center gap-2 cursor-pointer select-none min-h-[44px] ${
                      isActive
                        ? isBilling
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                          : 'bg-rose-700 text-white shadow-md shadow-rose-700/20 font-black'
                        : isBilling
                        ? 'hover:bg-amber-100/40 text-amber-800 bg-amber-500/10 border border-amber-200/60'
                        : 'hover:bg-rose-50 text-slate-700 hover:text-rose-800'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${isBilling ? 'text-amber-600 animate-pulse' : isActive ? 'text-white' : 'text-rose-700'}`} />
                    <span>
                      {tabId === 'billing' ? '👑 VIP Club' : def.shortLabel || def.label}
                    </span>
                  </button>
                );
              })}

              {/* Explore All Features Menu Trigger Button */}
              <button
                id="tab-btn-more-menu"
                onClick={() => setIsSideMenuOpen(true)}
                className="px-5 py-3 rounded-2xl text-base font-black transition-all duration-150 flex items-center gap-2.5 text-rose-800 bg-rose-50 hover:bg-rose-100/90 border-2 border-rose-200 cursor-pointer shadow-2xs hover:shadow-xs group ml-1 min-h-[48px]"
                title="Open feature explorer to discover all features step by step"
              >
                <Compass className="w-5 h-5 text-rose-700 group-hover:rotate-45 transition-transform duration-300" />
                <span>Explore All</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-700 text-white font-mono shadow-2xs">
                  Menu
                </span>
              </button>
            </nav>
          )}

          {/* User Identity / Action Block & Global Language Dropdown */}
          <div id="user-branding-badge" className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* PWA & Android App Installation Actions */}
          <PWAInstallButton />

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

          {appMode === 'dashboard' && userProfile ? (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Background Sync Outbox Badge */}
              <SyncStatusBadge onClick={() => setIsOutboxDrawerOpen(true)} />

              {/* Real-time Push alerts console trigger */}
              <div className="relative">
                <button
                  id="btn-bell-notification-center"
                  onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
                  className="p-2 border border-slate-200 hover:bg-slate-100/75 rounded-xl text-slate-650 transition active:scale-95 relative cursor-pointer"
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

              {/* Multilingual Voice Call Support Button (Compact & Clean) */}
              <button
                id="header-btn-voice-support"
                type="button"
                onClick={() => {
                  setVoiceInitialLanguage('en-IN');
                  setShowKannadaVoiceModal(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-gradient-to-r from-red-800 via-rose-800 to-amber-700 hover:from-red-900 hover:to-amber-800 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs border border-rose-600/80 shrink-0"
                title="Call for support in English, Kannada, Hindi, Tamil, Telugu"
              >
                <span className="text-xs sm:text-sm">🎙️</span>
                <span className="hidden sm:inline">Call Support</span>
              </button>

              {/* Current Wallet Balance & Top Up Action in Header */}
              <div 
                id="header-wallet-container" 
                className="flex items-center bg-rose-50/90 hover:bg-rose-100/80 border border-rose-200/90 rounded-2xl p-1 pl-2 sm:pl-2.5 gap-1.5 sm:gap-2 transition shadow-2xs shrink-0"
              >
                <button
                  type="button"
                  id="header-btn-wallet-balance"
                  onClick={() => {
                    setWalletModalAction('balance');
                    setShowWalletModal(true);
                  }}
                  className="flex items-center gap-1.5 cursor-pointer text-left focus:outline-none"
                  title="View In-App Wallet Balance & Ledger"
                >
                  <div className="w-5 h-5 rounded-lg bg-rose-700/10 text-rose-700 flex items-center justify-center shrink-0">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-extrabold text-rose-900/70">
                      Wallet
                    </span>
                    <span className="text-xs font-black text-rose-950 font-mono">
                      ₹{wallet.balance}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  id="header-btn-top-up-wallet"
                  onClick={() => {
                    setWalletModalAction('deposit');
                    setShowWalletModal(true);
                  }}
                  className="px-2 py-1 sm:px-2.5 sm:py-1 bg-gradient-to-r from-rose-700 to-amber-600 hover:from-rose-800 hover:to-amber-700 text-white rounded-xl text-[10px] sm:text-[11px] font-black transition-all flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 shrink-0"
                  title="Top Up Wallet Funds via UPI or Card"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                  <span>Top Up</span>
                </button>
              </div>

              {/* User Profile Pill */}
              <button
                id="header-btn-user-profile"
                type="button"
                onClick={() => setShowEditProfileModal(true)}
                className="flex items-center gap-2 p-1 sm:pr-2.5 rounded-full hover:bg-slate-100 border border-slate-200 transition cursor-pointer shrink-0"
                title="View & Edit Profile"
              >
                <img 
                  src={userProfile?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                  alt={userProfile?.parentName || 'Parent'} 
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-rose-200 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs font-bold text-slate-800 hidden md:inline max-w-[100px] truncate leading-tight">
                  {userProfile?.parentName}
                </span>
              </button>

              {/* Universal Side Menu & Explorer Trigger */}
              <button
                id="header-btn-hamburger-menu"
                type="button"
                onClick={() => setIsSideMenuOpen(true)}
                className="p-2 sm:px-3 sm:py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs group shrink-0"
                title="Open feature explorer to explore all features and account tools"
              >
                <Menu className="w-4 h-4 text-rose-700 group-hover:rotate-90 transition-transform duration-200" />
                <span className="hidden sm:inline">Menu</span>
              </button>

              {/* Desktop Logout button */}
              <button
                id="btn-logout"
                onClick={handleLogOut}
                type="button"
                className="hidden lg:flex p-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 rounded-xl text-slate-600 transition items-center gap-1 cursor-pointer shrink-0"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 select-none font-sans flex-wrap justify-end">
              {/* Public Specialists Tab Trigger */}
              <button
                id="header-btn-specialists-public"
                type="button"
                onClick={() => {
                  setAppMode('dashboard');
                  setActiveTab('specialists');
                  setIsGuestViewingKnowledge(false);
                }}
                className={`text-xs font-bold px-3 py-2 rounded-xl border flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  appMode === 'dashboard' && activeTab === 'specialists'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-rose-50/80 text-rose-800 border-rose-200/80 hover:bg-rose-100/80'
                }`}
                title="View verified specialists portfolios across India"
              >
                <Users className="w-3.5 h-3.5 text-rose-600" />
                <span>🩺 Specialists ({specialistsList.length}+)</span>
              </button>

              {/* Public Kids Stories Button */}
              <button
                id="header-btn-stories-public"
                type="button"
                onClick={() => {
                  setAppMode('dashboard');
                  setActiveTab('kid_stories');
                  setIsGuestViewingKnowledge(false);
                }}
                className={`text-xs font-bold px-3 py-2 rounded-xl border hidden sm:flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  appMode === 'dashboard' && activeTab === 'kid_stories'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-rose-50/60 text-rose-800 border-rose-200/70 hover:bg-rose-100/70'
                }`}
                title="Read & publish kid achievements, awards and stories"
              >
                <BookOpen className="w-3.5 h-3.5 text-rose-600" />
                <span>📖 Kids Stories</span>
              </button>

              {/* Public Events Button */}
              <button
                id="header-btn-events-public"
                type="button"
                onClick={() => {
                  setAppMode('dashboard');
                  setActiveTab('events');
                  setIsGuestViewingKnowledge(false);
                }}
                className={`text-xs font-bold px-3 py-2 rounded-xl border hidden md:flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  appMode === 'dashboard' && activeTab === 'events'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-indigo-50/60 text-indigo-900 border-indigo-200/70 hover:bg-indigo-100/70'
                }`}
                title="Browse kids events, workshops and weekend activities"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>🎟️ Events</span>
              </button>

              {/* 1000+ Guides */}
              <button
                id="header-btn-knowledge-guest"
                type="button"
                onClick={() => {
                  if (appMode === 'dashboard') {
                    setActiveTab('knowledge');
                  } else if (isGuestViewingKnowledge) {
                    setIsGuestViewingKnowledge(false);
                    setGuestKnowledgeSlug(undefined);
                  } else {
                    setIsGuestViewingKnowledge(true);
                    setGuestKnowledgeSlug(undefined);
                  }
                }}
                className={`text-xs font-bold px-3 py-2 rounded-xl border hidden lg:flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  (appMode === 'dashboard' && activeTab === 'knowledge') || isGuestViewingKnowledge
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isGuestViewingKnowledge ? '← Home' : '1,000+ Guides'}</span>
              </button>

              {/* Vernunt Store */}
              <button
                type="button"
                id="header-btn-store-guest"
                onClick={() => {
                  setAppMode('dashboard');
                  setActiveTab('store');
                }}
                className={`text-xs font-bold hidden md:flex items-center gap-1.5 transition cursor-pointer px-3 py-2 rounded-xl border shrink-0 ${
                  appMode === 'dashboard' && activeTab === 'store'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-rose-600" />
                <span>🛍️ Store</span>
              </button>

              {/* Call For Support Helpline Guest Button */}
              <button
                type="button"
                id="header-btn-voice-support-guest"
                onClick={() => {
                  setVoiceInitialLanguage('en-IN');
                  setShowKannadaVoiceModal(true);
                }}
                className="text-xs bg-gradient-to-r from-red-800 via-rose-800 to-amber-700 hover:from-red-900 hover:to-amber-800 text-white font-black hidden sm:flex items-center gap-1.5 transition hover:scale-102 cursor-pointer px-3 py-2 rounded-xl border border-rose-600/80 shadow-xs shrink-0"
                title="Call for support (English, Kannada, Hindi, Tamil, Telugu & all Indian languages)"
              >
                <span className="text-sm animate-bounce">🎙️</span>
                <span>Helpline</span>
              </button>

              <span className="w-px h-4 bg-slate-200 hidden sm:inline shrink-0" />

              {/* Sign In & Join for Guests */}
              <button
                type="button"
                onClick={() => {
                  setAppMode('auth');
                  setAuthMode('login');
                }}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition cursor-pointer shrink-0"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAppMode('auth');
                  setAuthMode('register');
                }}
                className="text-xs font-black bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl shadow-xs transition cursor-pointer shrink-0"
              >
                Join Free
              </button>
            </div>
          )}
          </div>
        </div>
      </header>

      {/* Sub-Header Bar: Brings Trust Score, Contacts Sync Status, Aadhaar Verification and Logout clearly below the header for easy one-tap access */}
      {appMode === 'dashboard' && userProfile && (
        <div id="mobile-user-status-bar" className="bg-gradient-to-r from-rose-50/90 via-amber-50/60 to-rose-50/90 border-b border-rose-200/70 py-2 w-full shadow-2xs">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between gap-2 text-xs w-full flex-wrap sm:flex-nowrap">
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

            {/* Direct Mobile/Quick Log Out Button */}
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
        </div>
      )}


      {/* Mobile Sticky Tab Navigation Bar (Clean & Streamlined, with larger easy-to-tap pills) */}
      {appMode === 'dashboard' && (
        <div 
          id="mobile-sticky-tabs" 
          className="lg:hidden bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-[60px] sm:top-[68px] z-20 shadow-xs py-3"
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-5 flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth">
            {primaryHeaderTabIds.map((tabId) => {
              const def = TAB_DEFINITIONS.find(tab => tab.id === tabId);
              if (!def) return null;

              const IconComponent = def.icon;
              const isBilling = tabId === 'billing';
              const isActive = activeTab === tabId;

              return (
                <button
                  key={tabId}
                  id={`mob-btn-${tabId}`}
                  onClick={() => {
                    setActiveTab(tabId as any);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition whitespace-nowrap cursor-pointer select-none active:scale-95 min-h-[42px] ${
                    isActive
                      ? isBilling
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'bg-rose-700 text-white font-black shadow-xs shadow-rose-700/20'
                      : isBilling
                      ? 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100/60'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/70'
                  }`}
                >
                  <IconComponent className={`w-4 h-4 shrink-0 ${isBilling ? 'animate-pulse text-amber-500' : isActive ? 'text-white' : 'text-rose-700'}`} />
                  <span>{def.shortLabel || def.label}</span>
                </button>
              );
            })}

            {/* Explore All Features Menu Trigger (Direct sibling with distinct border & spacing so it never blocks or overlaps events) */}
            <button
              id="mob-btn-more-menu"
              onClick={() => setIsSideMenuOpen(true)}
              className="shrink-0 flex items-center gap-2 px-4.5 py-2.5 rounded-2xl text-sm sm:text-base font-black text-rose-800 bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 transition whitespace-nowrap cursor-pointer shadow-xs min-h-[46px] ml-1"
            >
              <Compass className="w-5 h-5 text-rose-700 shrink-0" />
              <span>Explore All</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Global Universal Search (Filters dynamically across playmates, specialists, events, daycares & whole app) */}
      {appMode === 'dashboard' && (
        <div id="top-global-search-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3.5 pb-1">
          <GlobalUniversalSearch
            playmates={playmates}
            specialists={specialistsList as any}
            events={eventsList}
            daycares={daycarePlayhomes}
            storeProducts={MOCK_MARKETPLACE}
            onSelectResult={(type, tabId, item) => {
              setActiveTab(tabId as any);
              if (type === 'playmate' && item) {
                setSelectedPlaymate(item);
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}

      {/* Main content body panel */}
      <main id="app-main" className={`flex-1 w-full ${appMode === 'landing' && !isGuestViewingKnowledge ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-28 md:pb-32'}`}>
        
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
            onOpenSpecialists={(category) => {
              setSpecialistCategoryToOpen(category || 'All');
              setAppMode('dashboard');
              setActiveTab('specialists');
              setIsGuestViewingKnowledge(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenKidStories={() => {
              setAppMode('dashboard');
              setActiveTab('kid_stories');
              setIsGuestViewingKnowledge(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenEvents={() => {
              setAppMode('dashboard');
              setActiveTab('events');
              setIsGuestViewingKnowledge(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenKidsInvestments={() => {
              setAppMode('dashboard');
              setActiveTab('kids_investments');
              setIsGuestViewingKnowledge(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenStore={() => {
              setAppMode('dashboard');
              setActiveTab('store');
              setIsGuestViewingKnowledge(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenDaycare={() => {
              setAppMode('dashboard');
              setActiveTab('daycare');
              setIsGuestViewingKnowledge(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenGroups={() => {
              setAppMode('dashboard');
              setActiveTab('groups');
              setIsGuestViewingKnowledge(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenTracker={() => {
              setAppMode('dashboard');
              setActiveTab('tracker');
              setIsGuestViewingKnowledge(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenCommunity={() => {
              setAppMode('dashboard');
              setActiveTab('community');
              setIsGuestViewingKnowledge(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenEventBuyerRegistration={() => setShowEventBuyerRegModal(true)}
            onOpenKannadaVoice={(lang) => {
              setVoiceInitialLanguage(lang || 'en-IN');
              setShowKannadaVoiceModal(true);
            }}
            onOpenContactUs={() => setShowContactUsModal(true)}
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
            
            {/* Visual CMS: Admin Custom Page Blocks (Editable & deletable by admin visually in-place) */}
            <PageCustomBlocksSection pageId={activeTab || 'home'} isAdmin={isSuperAdmin} />

            {/* KYC Verification Pending Status Banner */}
            {userProfile && userProfile.userRole !== 'Admin' && (userProfile.verificationStatus === VerificationStatus.PENDING || userProfile.verificationStatus === 'PENDING' || !userProfile.aadhaarVerified || userProfile.verificationStatus === VerificationStatus.UNVERIFIED) && (
              <div 
                id="banner-kyc-pending" 
                className="bg-gradient-to-r from-rose-900 via-red-900 to-rose-950 text-white rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4 border border-rose-700/60 animate-fade-in text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-full bg-rose-500/10 pointer-events-none blur-2xl"></div>

                {/* Visual 3-Step KYC Progress Stepper */}
                <div className="w-full relative z-10 pb-3.5 border-b border-rose-800/80">
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 relative">
                    {/* Connecting Progress Track */}
                    <div className="absolute top-3.5 left-[16%] right-[16%] h-1 bg-rose-950/90 rounded-full overflow-hidden -z-0">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-400 transition-all duration-500"
                        style={{
                          width: userProfile?.verificationStatus === VerificationStatus.VERIFIED || userProfile?.aadhaarVerified
                            ? '100%' 
                            : (userProfile?.aadhaarDocUrl || userProfile?.aadhaarDocName || userProfile?.aadhaarNumber) 
                              ? '50%' 
                              : '15%'
                        }}
                      />
                    </div>

                    {/* Step 1: Upload Aadhaar */}
                    <div className="flex flex-col items-center text-center relative z-10">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-md transition-all ${
                        (userProfile?.aadhaarDocUrl || userProfile?.aadhaarDocName || userProfile?.aadhaarNumber)
                          ? 'bg-emerald-500 text-white ring-2 ring-emerald-300/50'
                          : 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/30 font-extrabold animate-pulse'
                      }`}>
                        {(userProfile?.aadhaarDocUrl || userProfile?.aadhaarDocName || userProfile?.aadhaarNumber) ? '✓' : '1'}
                      </div>
                      <span className="text-[11px] sm:text-xs font-black mt-1.5 text-white tracking-tight">1. Upload Aadhaar</span>
                      <span className="text-[9.5px] text-rose-200/90 font-medium hidden sm:inline">
                        {(userProfile?.aadhaarDocUrl || userProfile?.aadhaarDocName || userProfile?.aadhaarNumber) ? 'Aadhaar Attached' : 'Attach Document'}
                      </span>
                    </div>

                    {/* Step 2: Admin Verification */}
                    <div className="flex flex-col items-center text-center relative z-10">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-md transition-all ${
                        userProfile?.verificationStatus === VerificationStatus.VERIFIED || userProfile?.aadhaarVerified
                          ? 'bg-emerald-500 text-white ring-2 ring-emerald-300/50'
                          : (userProfile?.aadhaarDocUrl || userProfile?.aadhaarDocName || userProfile?.aadhaarNumber)
                            ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/30 animate-pulse'
                            : 'bg-rose-950/90 text-rose-300 border border-rose-700/60'
                      }`}>
                        {userProfile?.verificationStatus === VerificationStatus.VERIFIED || userProfile?.aadhaarVerified ? '✓' : '2'}
                      </div>
                      <span className="text-[11px] sm:text-xs font-black mt-1.5 text-white tracking-tight">2. Admin Verification</span>
                      <span className="text-[9.5px] text-rose-200/90 font-medium hidden sm:inline">
                        {userProfile?.verificationStatus === VerificationStatus.VERIFIED || userProfile?.aadhaarVerified 
                          ? 'Admin Approved' 
                          : (userProfile?.aadhaarDocUrl || userProfile?.aadhaarDocName || userProfile?.aadhaarNumber) 
                            ? 'Pending Review' 
                            : 'Awaiting Upload'}
                      </span>
                    </div>

                    {/* Step 3: Profile Activated */}
                    <div className="flex flex-col items-center text-center relative z-10">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-md transition-all ${
                        userProfile?.verificationStatus === VerificationStatus.VERIFIED || userProfile?.aadhaarVerified
                          ? 'bg-emerald-500 text-white ring-2 ring-emerald-300/50'
                          : 'bg-rose-950/90 text-rose-300 border border-rose-700/60'
                      }`}>
                        {userProfile?.verificationStatus === VerificationStatus.VERIFIED || userProfile?.aadhaarVerified ? '✓' : '3'}
                      </div>
                      <span className="text-[11px] sm:text-xs font-black mt-1.5 text-white tracking-tight">3. Profile Activated</span>
                      <span className="text-[9.5px] text-rose-200/90 font-medium hidden sm:inline">
                        {userProfile?.verificationStatus === VerificationStatus.VERIFIED || userProfile?.aadhaarVerified ? '100% Unlocked' : 'Full Access'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Banner Content & CTA */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 text-2xl shadow-inner">
                      🛡️
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-black text-sm sm:text-base text-amber-300 tracking-wide">
                          Aadhaar Document Upload &amp; Admin Verification
                        </span>
                        <span className="bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                          {userProfile?.aadhaarDocUrl || userProfile?.aadhaarDocName ? 'Under Admin Review' : 'Action Required'}
                        </span>
                      </div>
                      <p className="text-rose-100/90 text-xs leading-relaxed max-w-2xl font-medium">
                        {userProfile?.aadhaarDocUrl || userProfile?.aadhaarDocName
                          ? 'Your Aadhaar document has been uploaded and is waiting for manual verification & approval by Vernunt System Admin.'
                          : 'Aadhaar verification is mandatory for all parents and hosts on Vernunt. Upload your Aadhaar card for manual administrative review and approval to unlock full family profiles, playmate connections, and chats.'}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      id="btn-finish-kyc-banner"
                      onClick={() => setShowAadhaarVerifyModal(true)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-serif font-black text-xs rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-950" />
                      <span>{userProfile?.aadhaarDocUrl || userProfile?.aadhaarDocName ? 'View / Update Aadhaar Document' : 'Upload Aadhaar Document'}</span>
                    </button>
                  </div>
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

            {/* Radar Guardian Sign-In Protection (Child Safety & Privacy) */}
            {!userProfile && activeTab === 'radar' && (
              <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-amber-200 shadow-md text-center space-y-5 animate-fade-in">
                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-3xl mx-auto border border-amber-200">
                  🛡️
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black font-serif text-slate-900">
                    Guardian Sign-In Required for Kids Radar
                  </h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    To safeguard neighborhood children and maintain 100% Aadhaar safety, real-time playmates proximity radar and connect requests require guardian sign-in.
                  </p>
                  <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 max-w-md mx-auto">
                    ✨ All other features — Kids Wealth Investments &amp; Plots, Verified Specialists, Playfest Events, 1000+ Guides, Stories Flipbooks, and Daycares — are 100% open for guests!
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAppMode('landing');
                      setIsGuestViewingKnowledge(false);
                    }}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                  >
                    Sign In / Register Guardian ↗
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('kids_investments')}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                  >
                    💰 Explore Kids Investments &amp; Plots
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('specialists')}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Specialists Directory ↗
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Radar / Playmates Carousel View */}
            {activeTab === 'radar' && userProfile && (
              <div id="radar-dashboard-section" className="w-full">
                <PlaymateCarouselDashboard
                  playmates={playmates}
                  filteredPlaymates={filteredPlaymates}
                  userProfile={userProfile}
                  userLat={userLat}
                  userLng={userLng}
                  connectedIds={connectedIds}
                  savedProfileIds={savedProfileIds}
                  onSelectPlaymate={(p) => {
                    handleSelectPlaymate(p);
                    setDetailModalProfile(p);
                  }}
                  onQuickChat={handleOpenChatTrigger}
                  onToggleSave={handleToggleSaveProfile}
                  filterSearchQuery={filterSearchQuery}
                  setFilterSearchQuery={setFilterSearchQuery}
                  maxDistanceKm={maxDistanceKm}
                  setMaxDistanceKm={setMaxDistanceKm}
                  filterPlayStyle={filterPlayStyle}
                  setFilterPlayStyle={setFilterPlayStyle}
                  filterAgeGroup={filterAgeGroup}
                  setFilterAgeGroup={setFilterAgeGroup}
                  filterGender={filterGender}
                  setFilterGender={setFilterGender}
                  filterLanguage={filterLanguage}
                  setFilterLanguage={setFilterLanguage}
                  filterMinAge={filterMinAge}
                  setFilterMinAge={setFilterMinAge}
                  filterMaxAge={filterMaxAge}
                  setFilterMaxAge={setFilterMaxAge}
                  selectedInterests={selectedInterests}
                  setSelectedInterests={setSelectedInterests}
                  selectedPreferredActivities={selectedPreferredActivities}
                  setSelectedPreferredActivities={setSelectedPreferredActivities}
                  filterAvailableDay={filterAvailableDay}
                  setFilterAvailableDay={setFilterAvailableDay}
                  filterAvailableTime={filterAvailableTime}
                  setFilterAvailableTime={setFilterAvailableTime}
                  filterOnlyConnected={filterOnlyConnected}
                  setFilterOnlyConnected={setFilterOnlyConnected}
                  filterOnlySaved={filterOnlySaved}
                  setFilterOnlySaved={setFilterOnlySaved}
                  filterActivityRecency={filterActivityRecency}
                  setFilterActivityRecency={setFilterActivityRecency}
                  radarRecentSearches={radarRecentSearches}
                  commitRadarSearchQuery={commitRadarSearchQuery}
                  clearRecentRadarSearches={clearRecentRadarSearches}
                  onResetFilters={() => {
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
                />
              </div>
            )}

            {/* Tab: Kids Investment & Wealth Planning (Plots, Mutual Funds, Gold/Silver) */}
            {activeTab === 'kids_investments' && (
              <KidsInvestmentsTab 
                currentProfile={userProfile} 
                onNavigateToTab={(targetTab) => setActiveTab(targetTab as any)}
              />
            )}

            {/* Tab: Peanut-Style Vernunt Groups & Circles */}
            {activeTab === 'groups' && (
              <VernuntGroupsHub 
                userProfile={userProfile} 
                onOpenCommunityMeetups={() => setActiveTab('community')} 
                onOpenLogin={() => setAppMode('register')}
                onUserAuthenticated={(newProfile) => {
                  setUserProfile(newProfile);
                  try {
                    localStorage.setItem('vernunt_user_session', JSON.stringify({ userProfile: newProfile, userRole: 'Parent' }));
                  } catch (e) {
                    console.error(e);
                  }
                }}
              />
            )}

            {/* Tab: Community Hosting (renamed from host events) */}
            {activeTab === 'community' && (
              <CommunityHostingHub 
                userProfile={effectiveProfile} 
              />
            )}

            {/* Tab: Vernunt Pages Micro-Blogging & Audio Pods */}
            {activeTab === 'pages' && (
              <VernuntPagesFeed 
                userProfile={effectiveProfile} 
              />
            )}

            {/* Tab: Pregnancy & Baby Growth/Milestones/Vaccine Tracker */}
            {activeTab === 'tracker' && (
              <GrowthTrackerHub 
                userProfile={effectiveProfile} 
              />
            )}

            {/* Tab: Babysitting & Drop-in Daycare Marketplace */}
            {activeTab === 'daycare' && (
              <DaycareSittingTab
                daycarePlayhomes={daycarePlayhomes}
                careBookings={careBookings}
                currentUserProfile={effectiveProfile}
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
                userProfile={effectiveProfile} 
                activePlaymate={selectedPlaymate} 
                initialMessage={chatPreFilledMessage}
                onClearInitialMessage={() => setChatPreFilledMessage('')}
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
                userProfile={effectiveProfile} 
                activeCompanion={selectedPlaymate}
                onOpenPushModal={() => setShowPushNotificationModal(true)}
              />
            )}

            {/* Tab: Community Board walk plans */}
            {activeTab === 'events' && (
              <EventsTab 
                userProfile={userProfile} 
                eventsList={eventsList}
                setEventsList={setEventsList}
                initialOpenCreateWizard={openEventWizardOnMount}
                onOpenPushModal={() => setShowPushNotificationModal(true)}
                onAddBooking={(newBooking) => {
                  setBookingsList(prev => [newBooking, ...prev]);
                  confetti({ particleCount: 150, spread: 80 });
                }}
                onUpdateRole={(newRole) => {
                  setUserRole(newRole as any);
                  if (userProfile) {
                    setUserProfile({ ...userProfile, userRole: newRole as any });
                  }
                }}
                globalCommissionRate={globalCommissionRate}
                onUpdateUserProfile={(profileObj) => {
                  setUserProfile(profileObj);
                }}
                onOpenLogin={() => {
                  setAppMode('auth');
                  setAuthMode('login');
                }}
              />
            )}

            {/* Tab: Kids Stories (YourStory for Kids) */}
            {activeTab === 'kid_stories' && (
              <div className="animate-fade-in">
                <KidStoriesPortal
                  currentUser={userProfile}
                  onOpenWriteModal={(kidName?: string, chapter?: number) => {
                    setWriteStoryKidName(kidName);
                    setWriteStoryChapter(chapter);
                    setShowWriteStoryModal(true);
                  }}
                  onOpenSignUp={() => handleStartSignUp('Parent')}
                  selectedSlug={selectedStorySlug}
                  onSelectStory={(slug) => setSelectedStorySlug(slug)}
                  onOpenReferral={() => {
                    setActiveTab('referrals');
                  }}
                />
              </div>
            )}

            {/* Tab: Specialists registration & appointments booking */}
            {activeTab === 'specialists' && (
              <SpecialistsTab 
                currentProfile={userProfile}
                initialCategory={specialistCategoryToOpen}
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
                onUpdateSpecialist={handleUpdateSpecialist}
              />
            )}

            {/* Tab: Consolidated Business dashboard */}
            {activeTab === 'business' && userProfile && (
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
              <PortfoliosTab 
                currentProfile={effectiveProfile} 
                onNavigateToSpecialists={() => {
                  setActiveTab('specialists');
                }}
              />
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
                userProfile={effectiveProfile}
                onUpdateUserProfile={(updated) => setUserProfile(updated)}
                eventsList={eventsList}
                specialistsList={specialistsList}
              />
            )}

            {/* Tab: Parental Referral Rewards Center */}
            {activeTab === 'referrals' && (
              <ReferralPortal 
                userProfile={effectiveProfile}
                onUpdateUserProfile={(updated) => setUserProfile(updated)}
                allPlaymates={playmates}
              />
            )}

            {/* Tab: Subscription & Billing Portal */}
            {activeTab === 'billing' && (
              <BillingPortal 
                userProfile={effectiveProfile}
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

            {/* Tab: Vernunt In-App E-commerce Store */}
            {activeTab === 'store' && (
              <VernuntStore 
                userProfile={userProfile}
                onNavigateToTab={(t) => setActiveTab(t as any)}
                onContactSupport={() => setShowSupportChat(true)}
                onOpenGoogleMerchantModal={() => setShowGoogleSeoModal(true)}
              />
            )}

          </div>
        )}

      </main>

      {/* Persistent global footer with safe clearance for fixed bottom navigation */}
      <footer 
        id="global-page-footer" 
        className={`bg-gradient-to-b from-slate-50 via-white to-slate-100/80 border-t border-slate-200/90 pt-12 mt-auto text-slate-600 transition-all ${
          appMode === 'dashboard' 
            ? 'pb-40 sm:pb-44 md:pb-48 portrait:pb-[calc(10rem+20px)] sm:portrait:pb-[calc(11rem+20px)] md:portrait:pb-[calc(12rem+20px)]' 
            : 'pb-16 sm:pb-20 portrait:pb-[calc(4rem+20px)] sm:portrait:pb-[calc(5rem+20px)]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          


          {/* Top Footer Strip: Brand + Google Merchant & Search Console Badge + Back to Top button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <VernuntLogo size="sm" />
              <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">&bull; India's Child-Safe Community</span>
            </div>

            {/* Back to Top button */}
            <button
              type="button"
              id="btn-footer-back-to-top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-2xs text-xs font-bold transition-all cursor-pointer group shrink-0 active:scale-95"
              title="Smoothly scroll back to top of page"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

          {/* Structured 4-Column Navigation & Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 text-left pt-2">
            
            {/* Column 1: Brand, Mission & Security */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <VernuntLogo size="sm" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                India's verified neighborhood kids playmate radar, safe childcare network, and verified parent community.
              </p>
              
              <div className="space-y-2 pt-1 text-[11px] text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>DigiLocker Govt ID Verified Guardians</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>DPDP Act 2023 &amp; COPPA Child Safe</span>
                </div>
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Zero-Knowledge Contact Ghost Privacy</span>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowChildComplianceModal(true)}
                  className="text-xs font-bold text-rose-700 hover:text-rose-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Safety &amp; Compliance Standards</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Column 2: Platform Features */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200/80 pb-2">
                Platform Features
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (userProfile && appMode === 'dashboard') {
                        setActiveTab('radar');
                      } else {
                        handleStartSignUp('Parent');
                      }
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-rose-700 transition flex items-center gap-2 cursor-pointer text-slate-600"
                  >
                    <span className="w-5 h-5 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center text-xs shrink-0">🎯</span>
                    <span>Playmate Radar (Nearby Match)</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (userProfile && appMode === 'dashboard') {
                        setActiveTab('daycare');
                      } else {
                        handleStartSignUp('Parent');
                      }
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-teal-700 transition flex items-center gap-2 cursor-pointer text-slate-600"
                  >
                    <span className="w-5 h-5 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center text-xs shrink-0">🍼</span>
                    <span>Babysitting &amp; Drop-in Daycare</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (userProfile && appMode === 'dashboard') {
                        setActiveTab('events');
                      } else {
                        handleStartSignUp('Parent');
                      }
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-orange-700 transition flex items-center gap-2 cursor-pointer text-slate-600"
                  >
                    <span className="w-5 h-5 rounded-md bg-orange-50 text-orange-600 flex items-center justify-center text-xs shrink-0">🎉</span>
                    <span>Events, Workshops &amp; Camps</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (userProfile && appMode === 'dashboard') {
                        setActiveTab('groups');
                      } else {
                        handleStartSignUp('Parent');
                      }
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-indigo-700 transition flex items-center gap-2 cursor-pointer text-slate-600"
                  >
                    <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs shrink-0">🌸</span>
                    <span>Vernunt Groups &amp; Neighborhood Pods</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setAppMode('dashboard');
                      setActiveTab('store');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-rose-800 transition flex items-center gap-2 cursor-pointer font-bold text-rose-700"
                  >
                    <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center text-xs shrink-0">🛍️</span>
                    <span>Vernunt Store &amp; Play Gear</span>
                  </button>
                </li>
                <li>
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
                    className="hover:text-amber-700 transition flex items-center gap-2 cursor-pointer text-slate-600"
                  >
                    <span className="w-5 h-5 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center text-xs shrink-0">📚</span>
                    <span>1,000+ Child Growth Guides</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Trust, Safety & Support */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200/80 pb-2">
                Trust &amp; Governance
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => setShowChildComplianceModal(true)}
                    className="hover:text-emerald-700 transition flex items-center gap-2 cursor-pointer text-slate-600"
                  >
                    <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs shrink-0">🛡️</span>
                    <span>COPPA &amp; DPDP Safety Protocols</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setShowContactsPrivacyModal(true)}
                    className="hover:text-slate-900 transition flex items-center gap-2 cursor-pointer text-slate-600"
                  >
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs shrink-0">🔒</span>
                    <span>Contacts Privacy &amp; Ghost Mode</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    id="btn-footer-tac-toggle"
                    onClick={() => {
                      setLegalModalTab('terms');
                      setShowLegalModal(true);
                    }}
                    className="hover:text-slate-900 transition flex items-center gap-2 cursor-pointer text-slate-600"
                  >
                    <span className="w-5 h-5 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center text-xs shrink-0">📄</span>
                    <span>1. Terms &amp; Conditions (Safe Harbor)</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setLegalModalTab('privacy');
                      setShowLegalModal(true);
                    }}
                    className="hover:text-slate-900 transition flex items-center gap-2 cursor-pointer text-slate-600"
                  >
                    <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs shrink-0">🔒</span>
                    <span>2. Privacy Policy (DPDP Act 2023)</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setLegalModalTab('safety');
                      setShowLegalModal(true);
                    }}
                    className="hover:text-slate-900 transition flex items-center gap-2 cursor-pointer text-slate-600"
                  >
                    <span className="w-5 h-5 rounded-md bg-rose-50 text-rose-700 flex items-center justify-center text-xs shrink-0">🛡️</span>
                    <span>3. Safety &amp; Meetup Release</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setLegalModalTab('shipping');
                      setShowLegalModal(true);
                    }}
                    className="hover:text-slate-900 transition flex items-center gap-2 cursor-pointer text-slate-600"
                  >
                    <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center text-xs shrink-0">🚚</span>
                    <span>4. Shipping &amp; Logistics Policy</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setLegalModalTab('refund');
                      setShowLegalModal(true);
                    }}
                    className="hover:text-slate-900 transition flex items-center gap-2 cursor-pointer text-slate-600"
                  >
                    <span className="w-5 h-5 rounded-md bg-purple-50 text-purple-700 flex items-center justify-center text-xs shrink-0">🔄</span>
                    <span>5. Returns &amp; Refund Policy</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setLegalModalTab('child-safety');
                      setShowLegalModal(true);
                    }}
                    className="hover:text-slate-900 transition flex items-center gap-2 cursor-pointer text-slate-600"
                  >
                    <span className="w-5 h-5 rounded-md bg-red-50 text-red-700 flex items-center justify-center text-xs shrink-0">🚨</span>
                    <span>6. POCSO &amp; Child Protection</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setLegalModalTab('seller-terms');
                      setShowLegalModal(true);
                    }}
                    className="hover:text-slate-900 transition flex items-center gap-2 cursor-pointer text-slate-600"
                  >
                    <span className="w-5 h-5 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center text-xs shrink-0">🏪</span>
                    <span>7. Marketplace Seller Indemnity</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setLegalModalTab('groups-privacy');
                      setShowLegalModal(true);
                    }}
                    className="hover:text-slate-900 transition flex items-center gap-2 cursor-pointer text-slate-600"
                  >
                    <span className="w-5 h-5 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center text-xs shrink-0">💬</span>
                    <span>8. Groups &amp; Chat Safe Harbor</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setShowContactUsModal(true)}
                    className="hover:text-rose-700 transition flex items-center gap-2 cursor-pointer text-slate-600"
                  >
                    <span className="w-5 h-5 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center text-xs shrink-0">💬</span>
                    <span>Help &amp; Support Hub</span>
                  </button>
                </li>
                <li>
                  <a
                    href="mailto:support@vernunt.com"
                    className="hover:text-rose-700 transition flex items-center gap-2 text-slate-600"
                    title="Customer Care Support"
                  >
                    <span className="w-5 h-5 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center text-xs shrink-0">✉️</span>
                    <span>Support: support@vernunt.com</span>
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:grievance@vernunt.com"
                    className="hover:text-indigo-700 transition flex items-center gap-2 text-slate-600"
                    title="Grievance Redressal Officer"
                  >
                    <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs shrink-0">⚖️</span>
                    <span>Grievance: grievance@vernunt.com</span>
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:estate@vernunt.com"
                    className="hover:text-emerald-700 transition flex items-center gap-2 text-slate-600"
                    title="Real Estate Support"
                  >
                    <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs shrink-0">🏢</span>
                    <span>Real Estate: estate@vernunt.com</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Vernunt Mobile Apps */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200/80 pb-2">
                Vernunt on Mobile
              </h4>
              <p className="text-[11px] text-slate-500 leading-snug">
                Instant push alerts, encrypted offline sync &amp; live radar on your smartphone.
              </p>

              {/* Android Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">Vernunt Android</span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">v1.0.0</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/api/download/android-apk"
                    download="vernunt-app.apk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download APK</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowAndroidPlayStoreModal(true)}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Guide
                  </button>
                </div>
              </div>

              {/* iOS Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Apple className="w-4 h-4 text-slate-800" />
                    <span className="text-xs font-bold text-slate-900">Vernunt iOS</span>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">Web App</span>
                </div>
                <button
                  type="button"
                  id="btn-footer-ios-install"
                  onClick={() => setShowIosAppModal(true)}
                  className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>Install on iPhone / iPad</span>
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Sub-Footer Bar */}
          <div className="border-t border-slate-200/90 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="text-center md:text-left space-y-1">
              <p className="font-medium text-slate-600">
                &copy; {new Date().getFullYear()} <strong className="text-slate-900">Vernunt Technologies</strong> (vernunt.com &bull; app.vernunt.com). All Rights Reserved.
              </p>
              <p className="text-[11px] text-slate-400">
                India's Verified Kids Playmate Radar &amp; Childcare Network. Protected by Indian copyright &amp; trademark laws.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-5 gap-y-2 text-xs font-semibold text-slate-600">
              <button
                type="button"
                id="footer-link-terms"
                onClick={() => setShowLegalModal(true)}
                className="hover:text-rose-700 hover:underline transition cursor-pointer"
              >
                Terms and Conditions
              </button>
              <button
                type="button"
                id="footer-link-privacy"
                onClick={() => setShowLegalModal(true)}
                className="hover:text-rose-700 hover:underline transition cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                id="footer-link-child-safety"
                onClick={() => setShowChildComplianceModal(true)}
                className="hover:text-rose-700 hover:underline transition cursor-pointer"
              >
                Child Safety
              </button>
              <button
                type="button"
                id="footer-link-contact-support"
                onClick={() => setShowContactUsModal(true)}
                className="hover:text-rose-700 hover:underline transition cursor-pointer"
              >
                Contact Support
              </button>
            </div>
          </div>

          {/* Safe clearance spacer ensuring fixed bottom navigation never overlaps footer links */}
          <div className="h-6 sm:h-8" aria-hidden="true" />

        </div>
      </footer>

      {/* Global Modals overlay injections */}
      <AndroidPlayStoreModal 
        isOpen={showAndroidPlayStoreModal}
        onClose={() => setShowAndroidPlayStoreModal(false)}
      />
      <IosAppInstallModal 
        isOpen={showIosAppModal}
        onClose={() => setShowIosAppModal(false)}
      />
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
          isOpen={showLegalModal}
          initialTab={legalModalTab}
          onClose={() => setShowLegalModal(false)}
          onKeepClose={() => setShowLegalModal(false)}
        />
      )}

      {/* Vernunt In-App Wallet Modal */}
      {showWalletModal && (
        <WalletModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          initialAction={walletModalAction}
          onBalanceUpdated={(newBal) => {
            setWallet(prev => ({ ...prev, balance: newBal }));
          }}
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

      {/* Dynamic Slide-Over Explorer Side Drawer Menu (Unobstructed & Clean) */}
      {isSideMenuOpen && (
        <div 
          id="side-menu-drawer" 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[999] flex justify-end overflow-hidden"
          style={{ isolation: 'isolate' }}
        >
          {/* Backdrop dismiss overlay */}
          <div 
            className="absolute inset-0 transition-opacity" 
            onClick={() => setIsSideMenuOpen(false)} 
            aria-hidden="true"
          />
          
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col text-left relative z-10 animate-fade-in-right overflow-hidden">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-rose-100/70 rounded-xl text-rose-700 flex items-center justify-center shadow-2xs border border-rose-200/60">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm font-serif text-slate-900">Explore Vernunt</h3>
                    <span className="text-[9px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-full font-mono">
                      Step-by-Step
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Explore all features one by one at your own pace</p>
                </div>
              </div>
              <button 
                id="btn-close-side-drawer"
                onClick={() => setIsSideMenuOpen(false)}
                className="p-2 hover:bg-slate-200/70 rounded-xl text-slate-400 hover:text-slate-800 transition cursor-pointer"
                aria-label="Close feature explorer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User profile mini summary */}
            <div className="px-5 py-3 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <img 
                  src={userProfile?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                  alt={userProfile?.parentName || 'Parent'} 
                  className="w-10 h-10 rounded-full object-cover border border-rose-200 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 truncate leading-tight">{userProfile?.parentName || 'Parent Member'}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded ${
                      userProfile?.userRole === 'Admin' 
                        ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                        : userProfile?.userRole !== 'Parent' 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      {userProfile?.userRole || 'Parent'}
                    </span>
                    <span className="text-[10px] text-slate-400">•</span>
                    <span className="text-[10px] text-slate-500 font-medium flex items-center gap-0.5">
                      <span>🛡️ Trust</span>
                      <strong className="text-rose-700">{calculateTrustScore(userProfile)}/100</strong>
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsSideMenuOpen(false);
                  setShowProfilePrivacyModal(true);
                }}
                className="text-[11px] font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/70 border border-rose-200/70 px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0"
              >
                Edit Profile
              </button>
            </div>

            {/* Feature Search Box & Category Filters */}
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/40 space-y-2.5 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="input-drawer-feature-search"
                  placeholder="Search features (e.g. specialists, stories, daycare)..."
                  value={drawerSearchQuery}
                  onChange={(e) => setDrawerSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition"
                />
                {drawerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setDrawerSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'play', label: '🧸 Social' },
                  { id: 'health', label: '🩺 Health' },
                  { id: 'learning', label: '🎪 Learning' },
                  { id: 'finance', label: '💰 Family' },
                  { id: 'tools', label: '🛡️ Tools' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setDrawerCategory(cat.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                      drawerCategory === cat.id
                        ? 'bg-rose-700 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Feature Cards (Unobstructed & Clean) */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-3 space-y-2.5 divide-y divide-slate-100">
              <div className="space-y-2">
                {TAB_DEFINITIONS
                  .filter((tab) => {
                    // Role guards
                    if (tab.id === 'admin' && userProfile?.userRole !== 'Admin') return false;
                    if (tab.id === 'business' && userProfile?.userRole === 'Parent') return false;
                    
                    // Category filter
                    if (drawerCategory !== 'all' && tab.category !== drawerCategory) return false;

                    // Search query filter
                    if (drawerSearchQuery.trim()) {
                      const q = drawerSearchQuery.toLowerCase();
                      const matchLabel = tab.label.toLowerCase().includes(q);
                      const matchDesc = tab.description.toLowerCase().includes(q);
                      const matchShort = (tab.shortLabel || '').toLowerCase().includes(q);
                      if (!matchLabel && !matchDesc && !matchShort) return false;
                    }
                    return true;
                  })
                  .map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.id;
                    const isBilling = tab.id === 'billing';

                    return (
                      <button
                        key={tab.id}
                        id={`drawer-tab-btn-${tab.id}`}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.id as any);
                          setIsSideMenuOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-2xl transition flex items-start gap-3 cursor-pointer group border ${
                          isActive
                            ? 'bg-rose-50 border-rose-300 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-rose-200'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                          isActive
                            ? 'bg-rose-700 text-white'
                            : isBilling
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700 group-hover:bg-rose-100 group-hover:text-rose-700'
                        }`}>
                          <IconComponent className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5 mb-0.5">
                            <span className={`text-xs font-bold truncate ${isActive ? 'text-rose-900 font-black' : 'text-slate-800'}`}>
                              {tab.label}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {isActive && (
                                <span className="text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-rose-700 text-white font-mono shadow-2xs">
                                  Active
                                </span>
                              )}
                              {tab.badge && !isActive && (
                                <span className="text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 font-mono">
                                  {tab.badge}
                                </span>
                              )}
                              {tab.isPopular && !tab.badge && !isActive && (
                                <span className="text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-mono">
                                  Core
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                            {tab.description}
                          </p>
                        </div>

                        <ArrowRight className={`w-4 h-4 shrink-0 mt-2 transition-transform duration-200 ${
                          isActive ? 'text-rose-700 translate-x-0.5' : 'text-slate-300 group-hover:text-rose-600 group-hover:translate-x-1'
                        }`} />
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Collapsible Secondary Account & Support Tools (Never blocks menu!) */}
            <div className="p-3 border-t border-slate-200 bg-slate-50/80 shrink-0 space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  id="btn-toggle-drawer-tools"
                  onClick={() => setIsDrawerToolsExpanded(prev => !prev)}
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-200/60 transition"
                >
                  <span>⚙️ Account, Privacy &amp; Support</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {isDrawerToolsExpanded ? '▲ hide' : '▼ expand'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSideMenuOpen(false)}
                  className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Expanded Tools Block */}
              {isDrawerToolsExpanded && (
                <div className="space-y-1.5 pt-1.5 border-t border-slate-200/80 max-h-48 overflow-y-auto animate-fadeIn pr-1">
                  <button 
                    id="btn-drawer-contact-us"
                    type="button"
                    onClick={() => {
                      setIsSideMenuOpen(false);
                      setShowContactUsModal(true);
                    }}
                    className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-between text-left"
                  >
                    <span className="flex items-center gap-1.5">📞 <span>Help &amp; Support (support@vernunt.com)</span></span>
                    <ArrowRight className="w-3.5 h-3.5 text-rose-700" />
                  </button>

                  <button 
                    id="btn-drawer-call-support"
                    type="button"
                    onClick={() => {
                      setIsSideMenuOpen(false);
                      setVoiceInitialLanguage('en-IN');
                      setShowKannadaVoiceModal(true);
                    }}
                    className="w-full py-2 px-3 bg-gradient-to-r from-red-800 via-rose-800 to-amber-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-between text-left"
                  >
                    <span className="flex items-center gap-1.5">🎙️ <span>Voice Call Support</span></span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </button>

                  <button 
                    id="btn-drawer-app-guide"
                    type="button"
                    onClick={() => {
                      setIsSideMenuOpen(false);
                      setShowAppGuideModal(true);
                    }}
                    className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-between text-left"
                  >
                    <span className="flex items-center gap-1.5">💡 <span>Step-by-Step App Walkthrough Guide</span></span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
                  </button>

                  <button 
                    id="btn-drawer-instagram-flyer"
                    type="button"
                    onClick={() => {
                      setIsSideMenuOpen(false);
                      setShowInstagramFlyerModal(true);
                    }}
                    className="w-full py-2 px-3 bg-gradient-to-r from-purple-800 via-rose-800 to-amber-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-between text-left"
                  >
                    <span className="flex items-center gap-1.5">📸 <span>Instagram Influencer Collabs</span></span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </button>

                  <button 
                    id="btn-drawer-child-safety"
                    type="button"
                    onClick={() => {
                      setIsSideMenuOpen(false);
                      setShowChildComplianceModal(true);
                    }}
                    className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-between text-left"
                  >
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> <span>Child Safety &amp; COPPA (A+)</span></span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
                  </button>

                  <button 
                    id="btn-drawer-contacts-privacy"
                    type="button"
                    onClick={() => {
                      setIsSideMenuOpen(false);
                      setShowContactsPrivacyModal(true);
                    }}
                    className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-between text-left"
                  >
                    <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-rose-700" /> <span>Contacts Privacy &amp; Ghost Mode</span></span>
                    <ArrowRight className="w-3.5 h-3.5 text-rose-700" />
                  </button>

                  <button 
                    id="btn-drawer-trustscore"
                    type="button"
                    onClick={() => {
                      setIsSideMenuOpen(false);
                      setShowTrustScoreExplanation(true);
                    }}
                    className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100/70 border border-rose-200 text-rose-900 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-between text-left"
                  >
                    <span className="flex items-center gap-1.5">🛡️ <span>Trust Score Rating ({calculateTrustScore(userProfile)}/100)</span></span>
                    <ArrowRight className="w-3.5 h-3.5 text-rose-700" />
                  </button>

                  <button 
                    id="btn-drawer-logout"
                    type="button"
                    onClick={() => {
                      setIsSideMenuOpen(false);
                      handleLogOut();
                    }}
                    className="w-full py-2 px-3 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out of Vernunt</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Push Alerts History list DRAWER */}
      {showNotificationDrawer && (
        <div 
          id="notifications-drawer" 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[999] flex justify-end overflow-hidden"
          style={{ isolation: 'isolate' }}
        >
          <div className="absolute inset-0" onClick={() => setShowNotificationDrawer(false)} aria-hidden="true" />
          <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col p-6 text-left relative z-10 animate-fade-in-right">
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

      {/* Contact Us & Customer Support Hub Modal */}
      {showContactUsModal && (
        <ContactUsModal
          isOpen={showContactUsModal}
          onClose={() => setShowContactUsModal(false)}
          onOpenVoiceSupport={(lang) => {
            setVoiceInitialLanguage(lang || 'en-IN');
            setShowKannadaVoiceModal(true);
          }}
        />
      )}

      {/* Multilingual AI Voice Calling Agent & Telephony Enquiry Assistant */}
      {showKannadaVoiceModal && (
        <KannadaVoiceAgentModal
          isOpen={showKannadaVoiceModal}
          onClose={() => setShowKannadaVoiceModal(false)}
          initialLanguage={voiceInitialLanguage}
          onNavigateToSection={(tab) => {
            setAppMode('dashboard');
            setActiveTab(tab as any);
          }}
        />
      )}

      {/* Event Buyer Registration Modal */}
      {showEventBuyerRegModal && (
        <EventBuyerRegistrationModal
          isOpen={showEventBuyerRegModal}
          onClose={() => setShowEventBuyerRegModal(false)}
          onSuccess={(profile, quickBooking) => {
            setUserProfile(profile);
            setUserRole('Parent');
            setShowEventBuyerRegModal(false);
            setAppMode('dashboard');
            setActiveTab('events');
            if (quickBooking) {
              setBookingsList(prev => [quickBooking, ...prev]);
            }
            confetti({ particleCount: 120, spread: 70 });
          }}
          actionTitle="Event Ticket Buyer Instant Pass"
          userProfile={userProfile}
        />
      )}

      {/* Write Kids Story (YourStory for Kids) Modal */}
      {showWriteStoryModal && (
        <WriteKidStoryModal
          isOpen={showWriteStoryModal}
          onClose={() => {
            setShowWriteStoryModal(false);
            setWriteStoryKidName(undefined);
            setWriteStoryChapter(undefined);
          }}
          currentUser={userProfile}
          defaultKidName={writeStoryKidName}
          defaultChapter={writeStoryChapter}
          onOpenParentRegistration={() => {
            setShowWriteStoryModal(false);
            handleStartSignUp('Parent');
          }}
          onStorySubmitted={() => {
            setShowWriteStoryModal(false);
            setWriteStoryKidName(undefined);
            setWriteStoryChapter(undefined);
            confetti({ particleCount: 150, spread: 80 });
          }}
          onOpenReferralModal={() => {
            setShowWriteStoryModal(false);
            setActiveTab('referrals');
          }}
        />
      )}

      {/* Instagram Influencer Flyer Generator Modal */}
      {showInstagramFlyerModal && (
        <InstagramFlyerModal
          isOpen={showInstagramFlyerModal}
          onClose={() => setShowInstagramFlyerModal(false)}
          defaultAffiliateCode={userProfile?.referralCode}
        />
      )}

      {/* Profile Privacy & Visibility Settings Modal */}
      {showProfilePrivacyModal && (
        <ProfilePrivacyModal
          isOpen={showProfilePrivacyModal}
          onClose={() => setShowProfilePrivacyModal(false)}
          userProfile={userProfile}
          onUpdateProfile={(updated) => {
            setUserProfile(prev => prev ? { ...prev, ...updated } : null);
          }}
        />
      )}

      {/* In-App Step-by-Step App Walkthrough Guide Modal */}
      {showAppGuideModal && (
        <VernuntAppGuideModal
          isOpen={showAppGuideModal}
          onClose={() => setShowAppGuideModal(false)}
          onNavigateToTab={(tabId) => {
            setAppMode('dashboard');
            setActiveTab(tabId as any);
          }}
        />
      )}

      {/* Google Merchant Center & Google Search Console Integration Hub Modal */}
      {showGoogleSeoModal && (
        <GoogleSearchConsoleAndMerchantModal
          isOpen={showGoogleSeoModal}
          onClose={() => setShowGoogleSeoModal(false)}
          onNavigateToTab={(tabId) => {
            setAppMode('dashboard');
            setActiveTab(tabId as any);
          }}
        />
      )}

      {/* Conditionally Render Animated Loader overlay */}
      {isLoading && (
        <LoadingScreen 
          onFinished={() => setIsLoading(false)} 
          title={loadingTitle} 
        />
      )}

      {/* Real-time Firebase Cloud Messaging (FCM) Push Notifications Modal */}
      {showPushNotificationModal && (
        <PushNotificationModal
          isOpen={showPushNotificationModal}
          onClose={() => setShowPushNotificationModal(false)}
          userProfile={userProfile}
          onShowToast={(title, msg) => {
            triggerToast(msg, title);
          }}
        />
      )}

      {/* Foreground Real-Time Push Toast Banner */}
      <ForegroundPushToast
        onNavigateTab={(tab) => {
          setAppMode('dashboard');
          setActiveTab(tab as any);
        }}
      />

      {/* BookMyShow Style Fixed Bottom Navigation Bar (Playmate, Store, Events, Kids Investments, Specialists, Baby Sitting & Day Cares) */}
      {appMode === 'dashboard' && (
        <nav
          id="bottom-navigation-bar"
          aria-label="Bottom Navigation"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] py-1.5 transition-all"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-around sm:justify-center sm:gap-4 md:gap-8 px-2 overflow-x-auto no-scrollbar scroll-smooth">
            {bottomNavTabs.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  id={`bottom-nav-${item.id}`}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id as any);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex flex-col items-center justify-center py-1 px-1.5 sm:px-2.5 min-w-[54px] sm:min-w-[70px] shrink-0 cursor-pointer select-none transition-all duration-150 group active:scale-95 ${
                    isActive ? 'text-rose-600' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className={`relative flex items-center justify-center p-1.5 rounded-2xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-rose-100/90 text-rose-600 shadow-xs ring-2 ring-rose-400/40 scale-105' 
                      : 'text-slate-700 group-hover:text-slate-950 group-hover:bg-slate-100'
                  }`}>
                    <IconComponent 
                      className={`w-5 h-5 sm:w-5.5 sm:h-5.5 transition-transform duration-200 ${
                        isActive 
                          ? 'text-rose-600 stroke-[3] drop-shadow-xs' 
                          : 'text-slate-700 group-hover:text-slate-950 stroke-[2.4]'
                      }`} 
                    />
                    {isActive && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-rose-600 shadow-xs" />
                    )}
                  </div>
                  <span className={`text-[9.5px] sm:text-[11px] leading-tight mt-1 text-center truncate max-w-[72px] sm:max-w-none tracking-tight ${
                    isActive ? 'font-black text-rose-600' : 'font-bold text-slate-600 group-hover:text-slate-900'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Admin Visual Frontend CMS & In-Place Page Editor (Available ONLY to authorized administrators) */}
      <AdminVisualPageEditor 
        currentPageId={activeTab || 'home'} 
        isAdmin={isSuperAdmin} 
        onNavigateTab={(tab) => setActiveTab(tab as any)} 
      />

    </div>
  );
}
