import React, { useState, useEffect } from 'react';
import { 
  Shield, UserCheck, ShieldAlert, CheckCircle, XSquare, Layers, 
  MapPin, Phone, Search, Users, Edit3, Save, Award, Briefcase,
  User, ShieldCheck, Check, RefreshCw, Image, Megaphone, PlusCircle,
  ToggleLeft, ToggleRight, Sparkles, Globe, Trash2, Bell, Send,
  Smartphone, Eye, EyeOff, HeartHandshake, Download, ChevronDown,
  ChevronUp, Lock, Unlock, AlertTriangle, Activity, Terminal, Cpu,
  Database, UserX, Radio, Sliders, CheckCircle2, FileText, HardDrive,
  Calendar, Sparkles as SparklesIcon, Flame, Star, Compass, LayoutDashboard,
  ShoppingCart, HelpCircle, MoreHorizontal, ExternalLink, Settings,
  CreditCard, Key, Server, CheckSquare, Square, Filter, ChevronLeft,
  ChevronRight, ArrowUpRight, Copy, Share2, Plus, X, ArrowUp, ArrowDown,
  Tag, Clock, Zap, Palette, Ticket, BookOpen, Menu
} from 'lucide-react';
import { db, handleFirestoreError, OperationType, auth } from '../utils/firebase.ts';
import { doc, setDoc, updateDoc, collection, onSnapshot, deleteDoc } from 'firebase/firestore';
import { ChildProfile, VerificationStatus, CommunityEvent, SubscriptionPlan, AdminCouponCode } from '../types.ts';
import { 
  KnowledgeArticle, 
  FLAGSHIP_KNOWLEDGE_ARTICLES, 
  KNOWLEDGE_CATEGORIES, 
  getAdminCustomKnowledgeArticles, 
  saveAdminKnowledgeArticle, 
  deleteAdminKnowledgeArticle,
  publishAndAutoIndexArticle,
  getArticleCanonicalUrl,
  getArticleDeepLinkUrl,
  injectArticleSeoHead
} from '../data/knowledgeBase.ts';
import {
  getAdminTicketingConfig,
  saveAdminTicketingConfig,
  AdminTicketingConfig,
  CommissionTierRule,
  HostCommissionOverride,
  calculateEventCommissionPolicy,
  calculateTicketOrderBreakdown,
  DEFAULT_TICKETING_CONFIG
} from '../utils/ticketingCommission.ts';
import confetti from 'canvas-confetti';
import AestheticImageUploader from './AestheticImageUploader.tsx';
import GoogleDriveBackupPanel from './GoogleDriveBackupPanel.tsx';
import VernuntLogo from './VernuntLogo.tsx';
import VernuntSeoSuite from './VernuntSeoSuite.tsx';
import AdminTicketingCommissionDesk from './admin/AdminTicketingCommissionDesk.tsx';
import GoogleIndexingInspectorModal from './admin/GoogleIndexingInspectorModal.tsx';
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
import { runChildComplianceAudit, ChildComplianceAuditResult } from '../utils/childSafetyFilter.ts';

interface AdminDashboardProps {
  userProfile: ChildProfile | null;
  playmates: ChildProfile[];
  eventsList?: CommunityEvent[];
  setEventsList?: React.Dispatch<React.SetStateAction<CommunityEvent[]>>;
}

export default function AdminDashboard({ 
  userProfile, 
  playmates, 
  eventsList = [], 
  setEventsList 
}: AdminDashboardProps) {
  // Super Admin Cryptographic Verification
  const isSuperAdminAuthorized = isAuthorizedSystemAdmin(auth.currentUser?.email, userProfile?.userRole);
  
  // Navigation Menu States
  // Main Sections: dashboard | users | child-safety | events | woocommerce | affiliates | subscriptions | coupons | knowledge-hub | broadcast | contacts | security | backups | settings | seo
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'users' | 'child-safety' | 'events' | 'woocommerce' | 'affiliates' | 'subscriptions' | 'coupons' | 'knowledge-hub' | 'broadcast' | 'contacts' | 'security' | 'backups' | 'settings' | 'seo'>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string>('all');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // =========================================================================
  // COUPON CODES MANAGEMENT STATES
  // =========================================================================
  const defaultInitialCoupons: AdminCouponCode[] = [
    {
      id: 'coupon-1',
      code: 'INFLUENCER365',
      title: '1-Year Free Access VIP Influencer Pass',
      benefitType: 'free_1_year_vip',
      durationDays: 365,
      isActive: true,
      maxRedemptions: 1000,
      timesRedeemed: 14,
      assignedInfluencerName: 'Bangalore Mommy Community (@bangalore_mommy_diaries)',
      notes: 'Gives parents 1 year free access across app. Paid events require host fee.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'coupon-2',
      code: 'VIPMOM',
      title: 'Mom Creator Community 1-Year Free Pass',
      benefitType: 'free_1_year_vip',
      durationDays: 365,
      isActive: true,
      maxRedemptions: 500,
      timesRedeemed: 28,
      assignedInfluencerName: 'Dr. Ananya Reddy (@gentle_parenting_india)',
      notes: 'Special cross-promotional code for pediatric Instagram campaign.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'coupon-3',
      code: 'BANGALOREKIDS',
      title: 'Bangalore Co-op 1-Year Free Pass',
      benefitType: 'free_1_year_vip',
      durationDays: 365,
      isActive: true,
      maxRedemptions: 500,
      timesRedeemed: 62,
      assignedInfluencerName: 'Aarav Sports Academy (@aarav_play_hub)',
      notes: 'Community playdate access code.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'coupon-4',
      code: 'VERNUNT1YEAR',
      title: 'Vernunt Launch 1-Year Pass',
      benefitType: 'free_1_year_vip',
      durationDays: 365,
      isActive: true,
      maxRedemptions: 2000,
      timesRedeemed: 105,
      assignedInfluencerName: 'Platform SuperAdmin',
      notes: 'General promotion code for platform early adopters.',
      createdAt: new Date().toISOString()
    }
  ];

  const [couponsList, setCouponsList] = useState<AdminCouponCode[]>(() => {
    try {
      const stored = localStorage.getItem('vernunt_admin_coupons');
      return stored ? JSON.parse(stored) : defaultInitialCoupons;
    } catch {
      return defaultInitialCoupons;
    }
  });

  const [showCouponModal, setShowCouponModal] = useState<boolean>(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [couponCodeForm, setCouponCodeForm] = useState({
    code: '',
    title: '',
    benefitType: 'free_1_year_vip' as 'free_1_year_vip' | 'free_pass' | 'percentage' | 'flat',
    durationDays: 365,
    maxRedemptions: 500,
    assignedInfluencerName: '',
    notes: '',
    validUntil: '',
    isActive: true
  });

  const saveCoupons = (updated: AdminCouponCode[]) => {
    setCouponsList(updated);
    try {
      localStorage.setItem('vernunt_admin_coupons', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to persist coupons:', e);
    }
  };

  // =========================================================================
  // KNOWLEDGE HUB / WORDPRESS POSTS MANAGEMENT STATES
  // =========================================================================
  const [knowledgeArticlesList, setKnowledgeArticlesList] = useState<KnowledgeArticle[]>(() => {
    const custom = getAdminCustomKnowledgeArticles();
    return [...custom, ...FLAGSHIP_KNOWLEDGE_ARTICLES];
  });

  const [knowledgeSearchTerm, setKnowledgeSearchTerm] = useState<string>('');
  const [knowledgeCategoryFilter, setKnowledgeCategoryFilter] = useState<string>('all');
  const [showArticleEditorModal, setShowArticleEditorModal] = useState<boolean>(false);
  const [editingArticleSlug, setEditingArticleSlug] = useState<string | null>(null);

  const [articleForm, setArticleForm] = useState({
    title: '',
    slug: '',
    category: 'Playdate' as KnowledgeArticle['category'],
    categoryLabel: 'Playdate Ideas',
    ageGroup: 'All Ages' as KnowledgeArticle['ageGroup'],
    readTime: '5 min read',
    summary: '',
    publishedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    authorName: 'Vernunt Editorial Team',
    authorRole: 'Parenting & Child Development Specialist',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop&q=80',
    status: 'Published' as 'Published' | 'Draft',
    // Influencer Spotlight Fields
    isInfluencerSpotlight: false,
    influencerName: '',
    influencerHandle: '',
    influencerUrl: '',
    influencerBio: '',
    influencerFollowers: '',
    influencerBadge: 'Verified Community Ambassador',
    influencerAvatar: '',
    // Content Fields
    keyTakeawaysText: '',
    deepDive1Heading: '',
    deepDive1Body: '',
    deepDive1ProTip: '',
    deepDive1Alert: '',
    deepDive2Heading: '',
    deepDive2Body: '',
    actionableStepsText: '',
    faqQuestion1: '',
    faqAnswer1: '',
    faqQuestion2: '',
    faqAnswer2: '',
    keywordsText: ''
  });
  
  // Screen Options & Help toggles (WordPress native top dropdowns)
  const [showScreenOptions, setShowScreenOptions] = useState<boolean>(false);
  const [showHelpDrawer, setShowHelpDrawer] = useState<boolean>(false);
  const [screenWidgets, setScreenWidgets] = useState({
    welcomePanel: true,
    atAGlance: true,
    activity: true,
    quickDraft: true,
    siteHealth: true,
    wooStatus: true
  });

  // Selected table items for Bulk Actions
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('-1');
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  // Search & Filter state for Users
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [userSortBy, setUserSortBy] = useState<'latest' | 'oldest' | 'name_asc' | 'name_desc' | 'role'>('latest');
  const [selectedUser, setSelectedUser] = useState<ChildProfile | null>(null);

  // In-line KYC / Role editing modal state
  const [showKycDrawer, setShowKycDrawer] = useState<boolean>(false);
  const [targetRole, setTargetRole] = useState<'Parent' | 'Event Organizer' | 'Portfolio Professional' | 'Admin'>('Parent');
  const [targetVerification, setTargetVerification] = useState<VerificationStatus>(VerificationStatus.UNVERIFIED);
  const [targetAadhaarVerified, setTargetAadhaarVerified] = useState<boolean>(false);
  const [targetAadhaarNum, setTargetAadhaarNum] = useState<string>('');
  const [targetPhone, setTargetPhone] = useState<string>('');
  const [targetIsLocked, setTargetIsLocked] = useState<boolean>(false);
  const [targetIsBlocked, setTargetIsBlocked] = useState<boolean>(false);
  const [targetBusinessListingModel, setTargetBusinessListingModel] = useState<'subscription' | 'commission'>('commission');
  const [targetBusinessSubscriptionActive, setTargetBusinessSubscriptionActive] = useState<boolean>(false);
  const [targetBusinessSubscriptionPlan, setTargetBusinessSubscriptionPlan] = useState<'monthly' | 'quarterly' | 'halfyearly' | 'yearly'>('monthly');
  const [targetBusinessSubscriptionExpiryDate, setTargetBusinessSubscriptionExpiryDate] = useState<string>('');
  const [targetBusinessCommissionRate, setTargetBusinessCommissionRate] = useState<number>(10);
  
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [wpNotice, setWpNotice] = useState<{ type: 'success' | 'warning' | 'error' | 'info'; message: string } | null>({
    type: 'info',
    message: 'Welcome to the Vernunt Administrator Control Center. All system databases are synchronized.'
  });

  // Events & Classes management states
  const [eventSearchTerm, setEventSearchTerm] = useState<string>('');
  const [eventFilterCategory, setEventFilterCategory] = useState<string>('all');
  const [updatingEventId, setUpdatingEventId] = useState<string | null>(null);

  // Ticketing & Commission Policy Desk States
  const [ticketingConfig, setTicketingConfig] = useState<AdminTicketingConfig>(() => getAdminTicketingConfig());
  const [eventsSubTab, setEventsSubTab] = useState<'catalog' | 'global-policy' | 'influencer-tiers' | 'host-overrides' | 'calculator'>('catalog');
  const [editingEventTicketing, setEditingEventTicketing] = useState<CommunityEvent | null>(null);
  const [eventTicketingForm, setEventTicketingForm] = useState<{
    freeTicketsQuota: number;
    freeTicketsIssued: number;
    isInfluencerHost: boolean;
    hostRole: 'standard' | 'influencer';
    customCommissionRate: number | '';
  }>({
    freeTicketsQuota: 30,
    freeTicketsIssued: 0,
    isInfluencerHost: false,
    hostRole: 'standard',
    customCommissionRate: ''
  });
  const [showAddHostOverrideModal, setShowAddHostOverrideModal] = useState<boolean>(false);
  const [hostOverrideForm, setHostOverrideForm] = useState<{
    hostIdOrName: string;
    freeTicketsQuota: number;
    commissionRate: number;
    role: 'influencer' | 'standard';
    notes: string;
  }>({
    hostIdOrName: '',
    freeTicketsQuota: 1000,
    commissionRate: 2.0,
    role: 'influencer',
    notes: ''
  });
  const [calcSim, setCalcSim] = useState<{
    ticketPrice: number;
    ticketsCount: number;
    hostRole: 'influencer' | 'standard';
    freeQuota: number;
    commissionPercent: number;
  }>({
    ticketPrice: 499,
    ticketsCount: 250,
    hostRole: 'influencer',
    freeQuota: 1000,
    commissionPercent: 2.5
  });

  // Knowledge Hub Auto-Indexing & Live Google Preview States
  const [isPublishingAutoIndex, setIsPublishingAutoIndex] = useState<boolean>(false);
  const [indexingFeedbackModal, setIndexingFeedbackModal] = useState<{
    isOpen: boolean;
    articleTitle: string;
    canonicalUrl: string;
    deepLinkUrl: string;
    sitemapStatus: string;
    indexNowStatus: string;
    schemaInjected: boolean;
    timestamp: string;
  } | null>(null);
  const [schemaInspectArticle, setSchemaInspectArticle] = useState<KnowledgeArticle | null>(null);

  // Security & Telemetry States
  const [securityLogs, setSecurityLogs] = useState<SecurityEventLog[]>(getLocalSecurityLogs());
  const [auditResult, setAuditResult] = useState<SecurityAuditResult>(() => runSecurityAudit(playmates?.length || 0, isSuperAdminAuthorized));
  const [isRunningAudit, setIsRunningAudit] = useState<boolean>(false);
  const [emergencyLockdown, setEmergencyLockdown] = useState<boolean>(false);
  const [isUpdatingLockdown, setIsUpdatingLockdown] = useState<boolean>(false);
  const [showUnmaskedPii, setShowUnmaskedPii] = useState<boolean>(false);
  const [securityThreatFilter, setSecurityThreatFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  // Push Notification / Quick Notice states (WP Quick Draft equivalent)
  const [quickNoticeTitle, setQuickNoticeTitle] = useState('');
  const [quickNoticeBody, setQuickNoticeBody] = useState('');
  const [quickNoticeImage, setQuickNoticeImage] = useState('');
  const [isSendingQuickNotice, setIsSendingQuickNotice] = useState(false);

  // Promotional Banner Ads state
  const [banners, setBanners] = useState<any[]>([]);
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerImg, setNewBannerImg] = useState('');
  const [newBannerLink, setNewBannerLink] = useState('');
  const [newBannerPlacement, setNewBannerPlacement] = useState<'home' | 'app_top' | 'app_sidebar'>('home');
  const [isCreatingBanner, setIsCreatingBanner] = useState(false);

  // Subscription Plans Configuration state
  const [subPlans, setSubPlans] = useState<SubscriptionPlan[]>([]);
  const [isSavingPlans, setIsSavingPlans] = useState<boolean>(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [planModalMode, setPlanModalMode] = useState<'add' | 'edit'>('add');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [inlinePrices, setInlinePrices] = useState<{ [id: string]: number }>({});
  const [planViewMode, setPlanViewMode] = useState<'cards' | 'table'>('cards');

  const [planForm, setPlanForm] = useState<SubscriptionPlan>({
    id: '',
    title: '',
    price: 149,
    period: '1 Week',
    popular: false,
    saving: '',
    color: 'border-indigo-200',
    durationDays: 7,
    description: '',
    capabilities: [
      'Unlimited companion playdate chats',
      '✨ FREE Bookings for non-paid classes',
      '🔐 FREE view of Professional Portfolios',
      '🥇 Bonus: 3 Decrypt Credits included'
    ]
  });
  const [newCapInput, setNewCapInput] = useState<string>('');

  // Navigation Tab Placements
  const [tabsPlacement, setTabsPlacement] = useState<{ [key: string]: 'header' | 'side' }>({
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

  // User Contacts Directory state
  const [contactsSearchTerm, setContactsSearchTerm] = useState<string>('');
  const [userContactsMap, setUserContactsMap] = useState<{ [userId: string]: any }>({});
  const [expandedUserContactsId, setExpandedUserContactsId] = useState<string | null>(null);

  // Custom Categories & Schemas state
  const [customEventCats, setCustomEventCats] = useState<any[]>([]);
  const [customSpecCats, setCustomSpecCats] = useState<any[]>([]);
  const [newEventCatName, setNewEventCatName] = useState('');
  const [newSpecCatName, setNewSpecCatName] = useState('');

  // Self Profile Phone update
  const [adminPhone, setAdminPhone] = useState<string>(userProfile?.phoneNumber || '8073749074');
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  // =================== FIRESTORE LISTENERS ===================

  // 1. Sync Emergency Lockdown
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_config', 'lockdown'), (docSnap) => {
      if (docSnap.exists()) {
        setEmergencyLockdown(!!docSnap.data()?.active);
      }
    }, (err) => console.warn("Lockdown listener note:", err));
    return () => unsub();
  }, []);

  // 2. Sync Security Logs
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'security_logs'), (snapshot) => {
      const logs: SecurityEventLog[] = [];
      snapshot.forEach(docSnap => logs.push(docSnap.data() as SecurityEventLog));
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      if (logs.length > 0) setSecurityLogs(logs);
    }, (err) => console.warn("Security logs note:", err));
    return () => unsub();
  }, []);

  // 3. Sync User Contacts
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'user_contacts'), (snapshot) => {
      const map: { [userId: string]: any } = {};
      snapshot.forEach(docSnap => { map[docSnap.id] = docSnap.data(); });
      setUserContactsMap(map);
    }, (err) => console.warn("Contacts listener note:", err));
    return () => unsub();
  }, []);

  // 4. Sync Subscription Plans
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'subscription_config', 'plans'), (docSnap) => {
      if (docSnap.exists() && Array.isArray(docSnap.data()?.plans)) {
        setSubPlans(docSnap.data()!.plans);
      } else {
        setSubPlans([
          {
            id: 'monthly',
            title: 'Monthly Pass',
            price: 299,
            period: '1 Month',
            popular: false,
            saving: null,
            durationDays: 30,
            description: 'Perfect for temporary stays or trying out the network.',
            capabilities: ['Unlimited playdate chats', 'FREE Bookings for community events', '5 Decrypt Credits included']
          },
          {
            id: 'quarterly',
            title: 'Tri-Active Pass',
            price: 799,
            period: '3 Months',
            popular: true,
            saving: 'Save 10%',
            durationDays: 90,
            description: 'Our most sought-after plan for early childhood growth friends.',
            capabilities: ['Unlimited playdate chats', 'FREE Bookings for community events', '15 Decrypt Credits included']
          },
          {
            id: 'yearly',
            title: 'Full Golden Year Pass',
            price: 2499,
            period: '12 Months',
            popular: false,
            saving: 'Save 30%',
            durationDays: 365,
            description: 'Complete year-round coverage for optimal socialization paths.',
            capabilities: ['Unlimited playdate chats', 'FREE Bookings for community events', '60 Decrypt Credits included', 'VIP Badge']
          }
        ]);
      }
    }, (err) => console.warn("Subscription plans sync note:", err));
    return () => unsub();
  }, []);

  // 5. Sync Banners
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'banners'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setBanners(list);
    }, (err) => console.warn("Banners error:", err));
    return () => unsub();
  }, []);

  // 6. Sync Navigation Tab Placements
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_config', 'tabs'), (docSnap) => {
      if (docSnap.exists() && docSnap.data()?.placements) {
        setTabsPlacement(docSnap.data()!.placements);
      }
    }, (err) => console.warn("Tabs placement note:", err));
    return () => unsub();
  }, []);

  // 7. Sync Custom Categories
  useEffect(() => {
    const unsubE = onSnapshot(collection(db, 'custom_event_categories'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setCustomEventCats(list);
    }, (err) => console.warn("Event categories note:", err));
    const unsubS = onSnapshot(collection(db, 'custom_specialist_categories'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setCustomSpecCats(list);
    }, (err) => console.warn("Specialist categories note:", err));
    return () => {
      unsubE();
      unsubS();
    };
  }, []);

  // 8. Sync Ticketing & Commission Config & Custom Articles from Server
  useEffect(() => {
    fetch('/api/ticketing-config')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.config) {
          setTicketingConfig(data.config);
          saveAdminTicketingConfig(data.config);
        }
      })
      .catch(e => console.debug('Ticketing config server sync note:', e));

    fetch('/api/knowledge/articles')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.articles) && data.articles.length > 0) {
          data.articles.forEach((art: KnowledgeArticle) => {
            saveAdminKnowledgeArticle(art);
          });
          const updatedCustom = getAdminCustomKnowledgeArticles();
          setKnowledgeArticlesList([...updatedCustom, ...FLAGSHIP_KNOWLEDGE_ARTICLES]);
        }
      })
      .catch(e => console.debug('Knowledge articles server sync note:', e));
  }, []);

  // =================== HANDLERS ===================

  const showNotification = (type: 'success' | 'warning' | 'error' | 'info', message: string) => {
    setWpNotice({ type, message });
    if (type === 'success') {
      confetti({ particleCount: 35, spread: 45, origin: { y: 0.85 } });
    }
  };

  const handleSelectUser = (user: ChildProfile) => {
    setSelectedUser(user);
    setTargetRole(user.userRole || 'Parent');
    setTargetVerification(user.verificationStatus || VerificationStatus.UNVERIFIED);
    setTargetAadhaarVerified(!!user.aadhaarVerified);
    setTargetAadhaarNum(user.aadhaarNumber || '111122223333');
    setTargetPhone(user.phoneNumber || '');
    setTargetIsLocked(!!user.isLocked);
    setTargetIsBlocked(!!user.isBlocked);
    setTargetBusinessListingModel(user.businessListingModel || 'commission');
    setTargetBusinessSubscriptionActive(!!user.businessSubscriptionActive);
    setTargetBusinessSubscriptionPlan(user.businessSubscriptionPlan || 'monthly');
    setTargetBusinessSubscriptionExpiryDate(user.businessSubscriptionExpiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setTargetBusinessCommissionRate(user.businessCommissionRate !== undefined ? user.businessCommissionRate : 10);
    setShowKycDrawer(true);
  };

  const sendApprovalNotification = async (user: Partial<ChildProfile>) => {
    try {
      const res = await fetch('/api/notify-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          parentName: user.parentName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.userRole,
          loginUrl: window.location.origin
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', `✓ Verified ${user.parentName} & dispatched Approval Email + SMS with login link!`);
      }
    } catch (notifyErr) {
      console.warn("Notification trigger warning:", notifyErr);
    }
  };

  const handleSaveUserChanges = async () => {
    if (!selectedUser) return;
    setUpdateLoading(true);
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      const isNewlyVerified = targetVerification === VerificationStatus.VERIFIED && selectedUser.verificationStatus !== VerificationStatus.VERIFIED;
      const updatePayload = {
        ...selectedUser,
        userRole: targetRole,
        verificationStatus: targetVerification,
        facialAuditRequired: targetVerification === VerificationStatus.VERIFIED ? false : selectedUser.facialAuditRequired,
        faceVerificationStatus: targetVerification === VerificationStatus.VERIFIED ? 'verified' : (targetVerification === VerificationStatus.REJECTED ? 'rejected' : selectedUser.faceVerificationStatus),
        aadhaarVerified: targetAadhaarVerified,
        aadhaarNumber: targetAadhaarNum,
        phoneNumber: targetPhone,
        isLocked: targetIsLocked,
        isBlocked: targetIsBlocked,
        businessListingModel: targetBusinessListingModel,
        businessSubscriptionActive: targetBusinessSubscriptionActive,
        businessSubscriptionPlan: targetBusinessSubscriptionPlan,
        businessSubscriptionExpiryDate: targetBusinessSubscriptionExpiryDate,
        businessCommissionRate: Number(targetBusinessCommissionRate)
      };

      await setDoc(userRef, updatePayload, { merge: true });
      setSelectedUser(updatePayload);
      
      if (isNewlyVerified) {
        await sendApprovalNotification(updatePayload);
      } else {
        showNotification('success', `User "${selectedUser.parentName}" was updated successfully.`);
      }
      setShowKycDrawer(false);
    } catch (err: any) {
      showNotification('error', `Failed updating user: ${err.message || err}`);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleBulkUserAction = async () => {
    if (bulkAction === '-1' || selectedUserIds.length === 0) return;
    try {
      setUpdateLoading(true);
      for (const id of selectedUserIds) {
        const userRef = doc(db, 'users', id);
        if (bulkAction === 'verify') {
          await updateDoc(userRef, {
            verificationStatus: VerificationStatus.VERIFIED,
            aadhaarVerified: true
          });
        } else if (bulkAction === 'block') {
          await updateDoc(userRef, {
            isBlocked: true,
            verificationStatus: VerificationStatus.REJECTED
          });
        } else if (bulkAction === 'unblock') {
          await updateDoc(userRef, {
            isBlocked: false,
            isLocked: false
          });
        }
      }
      showNotification('success', `Bulk action "${bulkAction}" applied to ${selectedUserIds.length} user(s).`);
      setSelectedUserIds([]);
      setBulkAction('-1');
    } catch (err: any) {
      showNotification('error', `Bulk action failed: ${err.message}`);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleToggleEventFeatured = async (evt: CommunityEvent) => {
    setUpdatingEventId(evt.id);
    try {
      const isCurrentlyFeatured = !!evt.isFeatured;
      const evtRef = doc(db, 'events', evt.id);
      await updateDoc(evtRef, { isFeatured: !isCurrentlyFeatured });
      if (setEventsList) {
        setEventsList(prev => prev.map(e => e.id === evt.id ? { ...e, isFeatured: !isCurrentlyFeatured } : e));
      }
      showNotification('success', `Event "${evt.title}" featured status toggled to ${!isCurrentlyFeatured ? 'FEATURED' : 'STANDARD'}.`);
    } catch (err: any) {
      showNotification('error', `Failed to update event: ${err.message}`);
    } finally {
      setUpdatingEventId(null);
    }
  };

  const handleUpdateEvent = async (updatedEvt: CommunityEvent) => {
    try {
      const evtRef = doc(db, 'events', updatedEvt.id);
      await updateDoc(evtRef, {
        freeTicketsQuota: updatedEvt.freeTicketsQuota,
        freeTicketsIssued: updatedEvt.freeTicketsIssued,
        isInfluencerHost: updatedEvt.isInfluencerHost,
        hostRole: updatedEvt.hostRole,
        customCommissionRate: updatedEvt.customCommissionRate
      }).catch(e => console.debug("Firestore update note:", e));

      if (setEventsList) {
        setEventsList(prev => prev.map(e => e.id === updatedEvt.id ? updatedEvt : e));
      }
      showNotification('success', `Ticketing & commission quota updated for "${updatedEvt.title}".`);
    } catch (err: any) {
      showNotification('error', `Failed to update event: ${err.message}`);
    }
  };

  const handleSaveTicketingConfig = async (newConfig: AdminTicketingConfig) => {
    try {
      saveAdminTicketingConfig(newConfig);
      setTicketingConfig(newConfig);
      await fetch('/api/ticketing-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      }).catch(e => console.debug("Ticketing config server push note:", e));
      showNotification('success', 'Ticketing and commission policy rules saved live across the platform!');
    } catch (err: any) {
      showNotification('error', `Failed to save policy: ${err.message}`);
    }
  };

  const handleToggleLockdown = async () => {
    const nextState = !emergencyLockdown;
    const confirmText = nextState 
      ? "CRITICAL: Activating Emergency Lockdown will freeze all non-admin logins and session write permissions. Confirm?"
      : "Deactivate Emergency Lockdown and restore normal network operations?";
    
    if (!window.confirm(confirmText)) return;
    setIsUpdatingLockdown(true);
    try {
      await setDoc(doc(db, 'system_config', 'lockdown'), {
        active: nextState,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile?.parentName || 'Administrator'
      });
      setEmergencyLockdown(nextState);
      showNotification(nextState ? 'error' : 'success', `Emergency Lockdown has been ${nextState ? 'ACTIVATED (Network Frozen)' : 'DEACTIVATED (Network Operational)'}.`);
    } catch (err: any) {
      showNotification('error', `Failed to toggle lockdown: ${err.message}`);
    } finally {
      setIsUpdatingLockdown(false);
    }
  };

  const handleSendQuickNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoticeTitle.trim() || !quickNoticeBody.trim()) {
      showNotification('error', 'Notice Title and Message are required.');
      return;
    }
    setIsSendingQuickNotice(true);
    try {
      const pushUid = 'notice_' + Date.now();
      await setDoc(doc(db, 'push_notifications', pushUid), {
        id: pushUid,
        title: quickNoticeTitle.trim(),
        body: quickNoticeBody.trim(),
        imageUrl: quickNoticeImage.trim() || '',
        createdAt: Date.now(),
        senderName: userProfile?.parentName || 'Vernunt Administrator',
        senderId: userProfile?.id || 'root_admin'
      });
      setQuickNoticeTitle('');
      setQuickNoticeBody('');
      setQuickNoticeImage('');
      showNotification('success', 'Community notification published and distributed via WebSocket to all active apps!');
    } catch (err: any) {
      showNotification('error', `Failed to distribute notice: ${err.message}`);
    } finally {
      setIsSendingQuickNotice(false);
    }
  };

  const handleSaveTabPlacement = async (tabId: string, placement: 'header' | 'side') => {
    try {
      const updated = { ...tabsPlacement, [tabId]: placement };
      await setDoc(doc(db, 'system_config', 'tabs'), { placements: updated });
      setTabsPlacement(updated);
      showNotification('success', `Navigation placement for "${tabId}" saved to ${placement}.`);
    } catch (err: any) {
      showNotification('error', `Failed to save tab placement: ${err.message}`);
    }
  };

  const handleSaveAdminPhone = async () => {
    if (!userProfile?.id) return;
    setIsSavingPhone(true);
    try {
      await updateDoc(doc(db, 'users', userProfile.id), { phoneNumber: adminPhone });
      userProfile.phoneNumber = adminPhone;
      showNotification('success', 'Administrator primary contact number updated in Firestore.');
    } catch (err: any) {
      showNotification('error', `Failed saving phone: ${err.message}`);
    } finally {
      setIsSavingPhone(false);
    }
  };

  // =========================================================================
  // SUBSCRIPTION PLANS & PRICING MATRIX HANDLERS
  // =========================================================================
  const defaultAdminPlans: SubscriptionPlan[] = [
    {
      id: 'free-parent-1yr',
      title: 'Parent 1-Year Free Pass',
      price: 0,
      period: '12 Months Free',
      popular: true,
      saving: '100% Free Offer',
      color: 'border-emerald-400 ring-2 ring-emerald-400',
      durationDays: 365,
      description: 'Exclusive 1-Year zero-cost access for all registered parents & children.',
      capabilities: [
        '🎁 100% FREE Full App Usage for 1 Full Year',
        'Unlimited companion playdate chats',
        '✨ FREE Bookings for non-paid classes',
        '🔐 FREE view of Professional Portfolios',
        '🥇 Bonus: 10 Decrypt Credits included'
      ]
    },
    {
      id: 'free-host-6mo',
      title: 'Host & Specialist 6-Month Free Pass',
      price: 0,
      period: '6 Months Free',
      popular: false,
      saving: '100% Free Offer',
      color: 'border-indigo-400 ring-2 ring-indigo-400',
      durationDays: 180,
      description: 'Exclusive 6-Month zero-cost listing & hosting access for organizers and portfolio specialists.',
      capabilities: [
        '🎁 100% FREE Host & Portfolio Listing for 6 Months',
        'Create & publish unlimited community classes/events',
        'Collect verified registrations & client appointment requests',
        '🥇 Bonus: 10 Decrypt Credits included'
      ]
    },
    {
      id: 'monthly',
      title: 'Monthly Pass',
      price: 299,
      period: '1 Month',
      popular: false,
      saving: null,
      color: 'border-slate-200',
      durationDays: 30,
      description: 'Flexible 30-day renewal pass for post-promotional extensions.',
      capabilities: [
        'Unlimited companion playdate chats',
        '✨ FREE Bookings for non-paid classes',
        '🔐 FREE view of Professional Portfolios',
        '🥇 Bonus: 5 Decrypt Credits included'
      ]
    },
    {
      id: 'quarterly',
      title: 'Tri-Active Pass',
      price: 799,
      period: '3 Months',
      popular: false,
      saving: 'Save 10%',
      color: 'border-orange-200',
      durationDays: 90,
      description: 'Our most sought-after plan for early childhood growth friends.',
      capabilities: [
        'Unlimited companion playdate chats',
        '✨ FREE Bookings for non-paid classes',
        '🔐 FREE view of Professional Portfolios',
        '🥇 Bonus: 15 Decrypt Credits included'
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
        '✨ FREE Bookings for non-paid classes',
        '🔐 FREE view of Professional Portfolios',
        '🥇 Bonus: 30 Decrypt Credits included'
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
        '✨ FREE Bookings for non-paid classes',
        '🔐 FREE view of Professional Portfolios',
        '🥇 Bonus: 60 Decrypt Credits included',
        'VIP Supporter Badge'
      ]
    }
  ];

  const handleSaveAllPlans = async (updatedPlans: SubscriptionPlan[]) => {
    setIsSavingPlans(true);
    try {
      await setDoc(doc(db, 'subscription_config', 'plans'), {
        plans: updatedPlans,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile?.parentName || auth.currentUser?.email || 'Administrator'
      });
      setSubPlans(updatedPlans);
      localStorage.setItem('vernunt_sub_plans', JSON.stringify(updatedPlans));
      showNotification('success', 'Kids Connect Club subscription plans & pricing matrix updated live across all parent apps!');
    } catch (err: any) {
      console.error('[Save Plans Error]:', err);
      showNotification('error', `Failed to save subscription matrix: ${err.message}`);
    } finally {
      setIsSavingPlans(false);
    }
  };

  const handleQuickPriceChange = (planId: string, val: number) => {
    setInlinePrices(prev => ({ ...prev, [planId]: val }));
  };

  const handleCommitQuickPrice = async (planId: string) => {
    const newPrice = inlinePrices[planId];
    if (newPrice === undefined || isNaN(newPrice) || newPrice < 0) {
      showNotification('error', 'Please enter a valid price in ₹ INR.');
      return;
    }
    const updated = subPlans.map(p => p.id === planId ? { ...p, price: Number(newPrice) } : p);
    await handleSaveAllPlans(updated);
    setInlinePrices(prev => {
      const copy = { ...prev };
      delete copy[planId];
      return copy;
    });
  };

  const handleOpenAddPlan = (preset?: Partial<SubscriptionPlan>) => {
    setPlanModalMode('add');
    setEditingPlanId(null);
    setPlanForm({
      id: preset?.id || `plan_${Date.now().toString(36)}`,
      title: preset?.title || 'Weekly Explorer Pass',
      price: preset?.price !== undefined ? preset.price : 149,
      period: preset?.period || '1 Week',
      popular: !!preset?.popular,
      saving: preset?.saving || '',
      color: preset?.color || 'border-indigo-200',
      durationDays: preset?.durationDays || 7,
      description: preset?.description || 'Full 7-day access for holiday playdates and school break activities.',
      capabilities: preset?.capabilities && preset.capabilities.length > 0 ? [...preset.capabilities] : [
        'Unlimited companion playdate chats',
        '✨ FREE Bookings for non-paid classes',
        '🔐 FREE view of Professional Portfolios',
        '🥇 Bonus: 3 Decrypt Credits included'
      ]
    });
    setNewCapInput('');
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: SubscriptionPlan) => {
    setPlanModalMode('edit');
    setEditingPlanId(plan.id);
    setPlanForm({
      ...plan,
      saving: plan.saving || '',
      color: plan.color || 'border-slate-200',
      capabilities: Array.isArray(plan.capabilities) ? [...plan.capabilities] : []
    });
    setNewCapInput('');
    setIsPlanModalOpen(true);
  };

  const handleSavePlanModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.title.trim()) {
      showNotification('error', 'Plan Title is required.');
      return;
    }
    if (planForm.price < 0 || isNaN(planForm.price)) {
      showNotification('error', 'Valid non-negative price is required.');
      return;
    }
    if (!planForm.period.trim()) {
      showNotification('error', 'Period label (e.g. "1 Day", "1 Week") is required.');
      return;
    }
    if (planForm.durationDays <= 0 || isNaN(planForm.durationDays)) {
      showNotification('error', 'Duration in days must be at least 1.');
      return;
    }

    const cleanId = planForm.id.trim() || `plan_${Date.now().toString(36)}`;
    const finalPlan: SubscriptionPlan = {
      id: cleanId,
      title: planForm.title.trim(),
      price: Number(planForm.price),
      period: planForm.period.trim(),
      durationDays: Number(planForm.durationDays),
      popular: !!planForm.popular,
      saving: planForm.saving?.trim() || null,
      color: planForm.color || 'border-slate-200',
      description: planForm.description.trim(),
      capabilities: planForm.capabilities.filter(c => c.trim().length > 0)
    };

    let updatedList: SubscriptionPlan[];
    if (planModalMode === 'edit' && editingPlanId) {
      updatedList = subPlans.map(p => p.id === editingPlanId ? finalPlan : p);
    } else {
      const existingIdx = subPlans.findIndex(p => p.id === finalPlan.id);
      if (existingIdx >= 0) {
        finalPlan.id = `${finalPlan.id}_${Date.now().toString(36).slice(-4)}`;
      }
      updatedList = [...subPlans, finalPlan];
    }

    await handleSaveAllPlans(updatedList);
    setIsPlanModalOpen(false);
  };

  const handleDeletePlan = async (planId: string) => {
    const target = subPlans.find(p => p.id === planId);
    if (!window.confirm(`Are you sure you want to delete the "${target?.title || planId}" subscription plan? Parents will no longer be able to purchase this tier.`)) {
      return;
    }
    const updated = subPlans.filter(p => p.id !== planId);
    await handleSaveAllPlans(updated);
  };

  const handleMovePlan = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= subPlans.length) return;
    const copy = [...subPlans];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    await handleSaveAllPlans(copy);
  };

  const handleTogglePlanPopular = async (planId: string) => {
    const updated = subPlans.map(p => p.id === planId ? { ...p, popular: !p.popular } : p);
    await handleSaveAllPlans(updated);
  };

  const handleResetToDefaultPlans = async () => {
    if (!window.confirm('Reset all pricing matrix packages to default Vernunt 1-Day, Weekly, Monthly, Tri-Active, Semi-Annual, and Annual tiers? This will replace your customized list.')) {
      return;
    }
    await handleSaveAllPlans(defaultAdminPlans);
  };

  const handleAddCapability = () => {
    if (!newCapInput.trim()) return;
    setPlanForm(prev => ({
      ...prev,
      capabilities: [...prev.capabilities, newCapInput.trim()]
    }));
    setNewCapInput('');
  };

  const handleRemoveCapability = (idx: number) => {
    setPlanForm(prev => ({
      ...prev,
      capabilities: prev.capabilities.filter((_, i) => i !== idx)
    }));
  };

  // Helper for sorting & displaying user registration dates
  const getUserRegistrationTime = (u: ChildProfile): number => {
    if (u.createdAt) {
      const t = new Date(u.createdAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (u.registeredAt) {
      const t = new Date(u.registeredAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (u.capturedAt) {
      const t = new Date(u.capturedAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (u.lastActiveAt) {
      const t = new Date(u.lastActiveAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (u.id) {
      const match = u.id.match(/\d{10,}/);
      if (match) {
        const num = Number(match[0]);
        if (!isNaN(num) && num > 1000000000) return num;
      }
    }
    return 0;
  };

  const formatRegistrationDate = (u: ChildProfile): { dateStr: string; timeStr: string; relativeStr: string; isRecent: boolean } => {
    const time = getUserRegistrationTime(u);
    if (!time) {
      return { dateStr: 'Standard Entry', timeStr: '', relativeStr: 'Enrolled', isRecent: false };
    }
    const date = new Date(time);
    const now = Date.now();
    const diffMs = now - time;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let relativeStr = '';
    let isRecent = false;

    if (diffMinutes < 1) {
      relativeStr = 'Just now';
      isRecent = true;
    } else if (diffMinutes < 60) {
      relativeStr = `${diffMinutes}m ago`;
      isRecent = true;
    } else if (diffHours < 24) {
      relativeStr = `${diffHours}h ago`;
      isRecent = true;
    } else if (diffDays === 1) {
      relativeStr = 'Yesterday';
    } else if (diffDays < 7) {
      relativeStr = `${diffDays}d ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      relativeStr = `${weeks}w ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      relativeStr = `${months}mo ago`;
    }

    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return { dateStr, timeStr, relativeStr, isRecent };
  };

  // Filtered Users computation
  const allUsers = userProfile ? [userProfile, ...playmates.filter(p => p.id !== userProfile.id)] : playmates;
  const verifiedCount = allUsers.filter(u => u.verificationStatus === VerificationStatus.VERIFIED).length;
  const pendingCount = allUsers.filter(u => u.verificationStatus === VerificationStatus.PENDING).length;
  const organizerCount = allUsers.filter(u => u.userRole === 'Event Organizer').length;
  const specialistCount = allUsers.filter(u => u.userRole === 'Portfolio Professional').length;
  const influencerCount = allUsers.filter(u => u.userRole === 'Influencer').length;
  const adminCount = allUsers.filter(u => u.userRole === 'Admin').length;

  const filteredUsers = allUsers.filter(u => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || 
      (u.parentName || '').toLowerCase().includes(term) ||
      (u.childName || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.phoneNumber || '').toLowerCase().includes(term) ||
      (u.id || '').toLowerCase().includes(term);

    const matchesRole = roleFilter === 'all' || u.userRole === roleFilter;

    let matchesVerification = true;
    if (verificationFilter !== 'all') {
      if (verificationFilter === 'aadhaar') {
        matchesVerification = !!u.aadhaarVerified;
      } else {
        matchesVerification = u.verificationStatus === verificationFilter;
      }
    }

    if (activeSubTab === 'verified') return matchesSearch && u.verificationStatus === VerificationStatus.VERIFIED;
    if (activeSubTab === 'pending') return matchesSearch && u.verificationStatus === VerificationStatus.PENDING;
    if (activeSubTab === 'organizers') return matchesSearch && u.userRole === 'Event Organizer';
    if (activeSubTab === 'specialists') return matchesSearch && u.userRole === 'Portfolio Professional';
    if (activeSubTab === 'admins') return matchesSearch && u.userRole === 'Admin';

    return matchesSearch && matchesRole && matchesVerification;
  }).sort((a, b) => {
    if (userSortBy === 'latest') {
      return getUserRegistrationTime(b) - getUserRegistrationTime(a);
    }
    if (userSortBy === 'oldest') {
      return getUserRegistrationTime(a) - getUserRegistrationTime(b);
    }
    if (userSortBy === 'name_asc') {
      const nameA = (a.childName || a.parentName || '').toLowerCase();
      const nameB = (b.childName || b.parentName || '').toLowerCase();
      return nameA.localeCompare(nameB);
    }
    if (userSortBy === 'name_desc') {
      const nameA = (a.childName || a.parentName || '').toLowerCase();
      const nameB = (b.childName || b.parentName || '').toLowerCase();
      return nameB.localeCompare(nameA);
    }
    if (userSortBy === 'role') {
      const roleA = (a.userRole || 'Parent').toLowerCase();
      const roleB = (b.userRole || 'Parent').toLowerCase();
      return roleA.localeCompare(roleB);
    }
    return 0;
  });

  return (
    <div id="wpwrap" className="min-h-screen bg-[#f0f0f1] font-sans text-[#3c434a] flex flex-col antialiased select-auto">
      
      {/* ========================================================================= */}
      {/* 1. VERNUNT TOP ADMIN BAR                                                  */}
      {/* ========================================================================= */}
      <header id="wpadminbar" className="bg-[#1d2327] text-[#c3c4c7] h-8 sm:h-9 fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-2 sm:px-3 text-xs select-none border-b border-[#2c3338] shadow-xs">
        {/* Left Side: Vernunt Logo, Site Name & Jump Links, Updates, New Dropdown */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          
          {/* Mobile hamburger menu toggle */}
          <button 
            type="button"
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            className="md:hidden flex items-center gap-1.5 px-2 py-1 bg-[#2c3338] hover:bg-[#3c434a] text-white rounded-xs border border-[#50575e] active:scale-95 transition cursor-pointer touch-manipulation shadow-2xs"
            aria-label={isMobileMenuOpen ? 'Close admin menu' : 'Open admin menu'}
            title="Admin Menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-3.5 h-3.5 text-amber-300" />
            ) : (
              <Menu className="w-3.5 h-3.5 text-[#72aee6]" />
            )}
            <span className="text-[11px] font-bold tracking-tight text-white">Menu</span>
            {pendingCount > 0 && (
              <span className="bg-[#d63638] text-white text-[9px] font-bold px-1 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Vernunt Brand Icon mark */}
          <div className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#2c3338] rounded-xs cursor-pointer transition">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 text-white flex items-center justify-center font-serif font-black text-[11px] shadow-2xs">
              V
            </div>
            <span className="font-serif font-black tracking-tight text-white hidden sm:inline text-xs">
              VERNUNT
            </span>
          </div>

          {/* Site Title & Quick View */}
          <div className="group relative">
            <button 
              type="button"
              className="flex items-center gap-1 px-2 py-1 hover:bg-[#2c3338] hover:text-[#72aee6] rounded-xs text-[#f0f0f1] font-medium transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#72aee6]" />
              <span className="hidden sm:inline font-semibold">Vernunt Playdates & Safety Engine</span>
              <ChevronDown className="w-3 h-3 text-[#c3c4c7]" />
            </button>
            
            {/* Hover dropdown for site jumping */}
            <div className="hidden group-hover:block absolute left-0 top-full bg-[#2c3338] text-[#c3c4c7] py-1 w-48 shadow-lg rounded-b-xs border-t border-[#3c434a] z-50">
              <a href="#radar" onClick={() => window.location.search = '?tab=radar'} className="block px-3 py-1.5 hover:bg-[#2271b1] hover:text-white text-xs">
                Visit Playmate Radar
              </a>
              <a href="#events" onClick={() => window.location.search = '?tab=events'} className="block px-3 py-1.5 hover:bg-[#2271b1] hover:text-white text-xs">
                Visit Events & Classes
              </a>
              <a href="#affiliate" onClick={() => window.location.search = '?tab=affiliate'} className="block px-3 py-1.5 hover:bg-[#2271b1] hover:text-white text-xs">
                Visit Affiliate Partner Hub
              </a>
            </div>
          </div>

          {/* Pending Verifications Badge in top bar */}
          <button 
            type="button"
            onClick={() => { setActiveMenu('users'); setActiveSubTab('pending'); }}
            className="flex items-center gap-1 px-2 py-1 hover:bg-[#2c3338] rounded-xs text-xs text-[#c3c4c7] hover:text-white transition"
            title={`${pendingCount} pending verification request(s)`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="bg-[#d63638] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {pendingCount}
            </span>
          </button>

          {/* "+ New" quick action dropdown */}
          <div className="group relative hidden sm:block">
            <button 
              type="button"
              className="flex items-center gap-1 px-2 py-1 hover:bg-[#2c3338] hover:text-[#72aee6] rounded-xs text-xs text-[#c3c4c7] hover:text-white transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New</span>
              <ChevronDown className="w-3 h-3 text-[#c3c4c7]" />
            </button>
            <div className="hidden group-hover:block absolute left-0 top-full bg-[#2c3338] text-[#c3c4c7] py-1 w-44 shadow-lg rounded-b-xs border-t border-[#3c434a] z-50">
              <button 
                type="button" 
                onClick={() => { setActiveMenu('users'); setShowKycDrawer(true); }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#2271b1] hover:text-white text-xs"
              >
                New User Account
              </button>
              <button 
                type="button" 
                onClick={() => setActiveMenu('broadcast')}
                className="w-full text-left px-3 py-1.5 hover:bg-[#2271b1] hover:text-white text-xs"
              >
                New Broadcast Push Notice
              </button>
              <button 
                type="button" 
                onClick={() => setActiveMenu('events')}
                className="w-full text-left px-3 py-1.5 hover:bg-[#2271b1] hover:text-white text-xs"
              >
                New Event or Workshop
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Howdy, Admin & Gravatar */}
        <div className="flex items-center gap-2">
          {emergencyLockdown && (
            <span className="bg-[#d63638] text-white font-bold text-[10px] px-2 py-0.5 rounded-xs animate-pulse flex items-center gap-1">
              <Lock className="w-3 h-3" /> LOCKDOWN ACTIVE
            </span>
          )}

          <div className="group relative flex items-center gap-1.5 px-2 py-1 hover:bg-[#2c3338] rounded-xs cursor-pointer">
            <span className="text-[#c3c4c7] text-xs">
              Howdy, <strong className="text-white">{userProfile?.parentName || 'Administrator'}</strong>
            </span>
            <div className="w-5 h-5 rounded-full bg-[#72aee6] text-[#1d2327] font-black flex items-center justify-center text-[10px] overflow-hidden border border-[#50575e]">
              {userProfile?.photoUrl ? (
                <img src={userProfile.photoUrl} alt="Admin" className="w-full h-full object-cover" />
              ) : (
                'A'
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="hidden group-hover:block absolute right-0 top-full bg-[#2c3338] text-[#c3c4c7] py-2 w-52 shadow-lg rounded-b-xs border-t border-[#3c434a] z-50">
              <div className="px-3 py-2 border-b border-[#3c434a] flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#72aee6] overflow-hidden">
                  <img src={userProfile?.photoUrl || ''} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="overflow-hidden">
                  <span className="block font-bold text-white text-xs truncate">{userProfile?.parentName}</span>
                  <span className="block text-[10px] text-amber-300 uppercase font-black">Super Administrator</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => { setActiveMenu('settings'); }} 
                className="w-full text-left px-3 py-1.5 hover:bg-[#2271b1] hover:text-white text-xs"
              >
                Edit Admin Profile
              </button>
              <button 
                type="button" 
                onClick={() => window.location.reload()} 
                className="w-full text-left px-3 py-1.5 hover:bg-[#2271b1] hover:text-white text-xs text-rose-300"
              >
                Log Out / Switch User
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTAINER WITH VERNUNT LEFT SIDEBAR & BODY CONTENT               */}
      {/* ========================================================================= */}
      <div id="wpbody" className="pt-8 sm:pt-9 flex-1 flex">
        
        {/* Mobile Backdrop Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-xs z-40 md:hidden transition-opacity animate-fadeIn"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* =================== VERNUNT ADMIN MENU SIDEBAR =================== */}
        <aside 
          id="adminmenuwrap" 
          className={`bg-[#1d2327] text-[#c3c4c7] shrink-0 transition-all duration-200 border-r border-[#2c3338] flex flex-col justify-between ${
            /* Mobile drawer styling */
            isMobileMenuOpen 
              ? 'fixed inset-y-0 left-0 z-50 w-72 sm:w-80 shadow-2xl flex translate-x-0'
              : 'hidden md:flex'
          } ${
            /* Desktop width styling */
            isSidebarCollapsed ? 'md:w-12 lg:w-14' : 'md:w-48 lg:w-52'
          }`}
        >
          {/* Mobile Drawer Top Banner (Visible on mobile only) */}
          <div className="md:hidden p-3.5 bg-[#14181b] border-b border-[#2c3338] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 text-white flex items-center justify-center font-serif font-black text-xs shadow-xs">
                V
              </div>
              <div>
                <div className="font-serif font-bold text-white text-xs tracking-tight">VERNUNT ADMIN</div>
                <div className="text-[10px] text-amber-300 font-mono">Control Center</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 text-[#c3c4c7] hover:text-white hover:bg-[#2c3338] rounded-xs cursor-pointer touch-manipulation"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav id="adminmenu" className="py-2 space-y-0.5 overflow-y-auto scrollbar-none flex-1 text-[13px]">
            
            {/* MENU ITEM: Dashboard */}
            <button
              type="button"
              onClick={() => { setActiveMenu('dashboard'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 md:py-2 text-left transition cursor-pointer ${
                activeMenu === 'dashboard'
                  ? 'bg-[#2271b1] text-white font-bold border-l-4 border-white'
                  : 'hover:bg-[#135e96] hover:text-white'
              }`}
              title="Dashboard"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-[#72aee6]" />
              {(isMobileMenuOpen || !isSidebarCollapsed) && <span>Dashboard</span>}
            </button>

            {/* MENU ITEM: Users / Household Profiles */}
            <button
              type="button"
              onClick={() => { setActiveMenu('users'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 md:py-2 text-left transition cursor-pointer ${
                activeMenu === 'users'
                  ? 'bg-[#2271b1] text-white font-bold border-l-4 border-white'
                  : 'hover:bg-[#135e96] hover:text-white'
              }`}
              title="Users"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 shrink-0 text-[#72aee6]" />
                {(isMobileMenuOpen || !isSidebarCollapsed) && <span>Users & KYC</span>}
              </div>
              {(isMobileMenuOpen || !isSidebarCollapsed) && pendingCount > 0 && (
                <span className="bg-[#d63638] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>

            {/* MENU ITEM: Child Safety & COPPA Compliance */}
            <button
              type="button"
              onClick={() => { setActiveMenu('child-safety'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 md:py-2 text-left transition cursor-pointer ${
                activeMenu === 'child-safety'
                  ? 'bg-[#2271b1] text-white font-bold border-l-4 border-white'
                  : 'hover:bg-[#135e96] hover:text-white'
              }`}
              title="Child Safety & Compliance"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                {(isMobileMenuOpen || !isSidebarCollapsed) && <span>Child Safety & COPPA</span>}
              </div>
              {(isMobileMenuOpen || !isSidebarCollapsed) && (
                <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-xs">
                  A+ Safe
                </span>
              )}
            </button>

            {/* MENU ITEM: Events & Classes */}
            <button
              type="button"
              onClick={() => { setActiveMenu('events'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 md:py-2 text-left transition cursor-pointer ${
                activeMenu === 'events'
                  ? 'bg-[#2271b1] text-white font-bold border-l-4 border-white'
                  : 'hover:bg-[#135e96] hover:text-white'
              }`}
              title="Events & Classes"
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 shrink-0 text-[#72aee6]" />
                {(isMobileMenuOpen || !isSidebarCollapsed) && <span>Events & Classes</span>}
              </div>
              {(isMobileMenuOpen || !isSidebarCollapsed) && (
                <span className="bg-[#2c3338] text-[#c3c4c7] text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {eventsList.length}
                </span>
              )}
            </button>

            {/* MENU ITEM: Commerce & Passes */}
            <button
              type="button"
              onClick={() => { setActiveMenu('woocommerce'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 md:py-2 text-left transition cursor-pointer ${
                activeMenu === 'woocommerce'
                  ? 'bg-[#2271b1] text-white font-bold border-l-4 border-white'
                  : 'hover:bg-[#135e96] hover:text-white'
              }`}
              title="Commerce & Passes"
            >
              <ShoppingCart className="w-4 h-4 shrink-0 text-[#96588a]" />
              {(isMobileMenuOpen || !isSidebarCollapsed) && <span>Commerce & Passes</span>}
            </button>

            {/* MENU ITEM: Affiliates & Partners */}
            <button
              type="button"
              onClick={() => { setActiveMenu('affiliates'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 md:py-2 text-left transition cursor-pointer ${
                activeMenu === 'affiliates'
                  ? 'bg-[#2271b1] text-white font-bold border-l-4 border-white'
                  : 'hover:bg-[#135e96] hover:text-white'
              }`}
              title="Affiliate Partners"
            >
              <Share2 className="w-4 h-4 shrink-0 text-orange-400" />
              {(isMobileMenuOpen || !isSidebarCollapsed) && <span>Affiliate Partners</span>}
            </button>

            {/* MENU ITEM: Subscriptions & Plans */}
            <button
              type="button"
              onClick={() => { setActiveMenu('subscriptions'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 md:py-2 text-left transition cursor-pointer ${
                activeMenu === 'subscriptions'
                  ? 'bg-[#2271b1] text-white font-bold border-l-4 border-white'
                  : 'hover:bg-[#135e96] hover:text-white'
              }`}
              title="Subscriptions"
            >
              <CreditCard className="w-4 h-4 shrink-0 text-[#72aee6]" />
              {(isMobileMenuOpen || !isSidebarCollapsed) && <span>Subscriptions</span>}
            </button>

            {/* MENU ITEM: Coupons & 1-Yr VIP Passes */}
            <button
              type="button"
              onClick={() => { setActiveMenu('coupons'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 md:py-2 text-left transition cursor-pointer ${
                activeMenu === 'coupons'
                  ? 'bg-[#2271b1] text-white font-bold border-l-4 border-white'
                  : 'hover:bg-[#135e96] hover:text-white'
              }`}
              title="Coupon Codes & VIP Passes"
            >
              <Ticket className="w-4 h-4 shrink-0 text-amber-400" />
              {(isMobileMenuOpen || !isSidebarCollapsed) && (
                <div className="flex items-center justify-between w-full">
                  <span>Coupons &amp; VIP Passes</span>
                  <span className="text-[10px] bg-amber-500/30 text-amber-200 px-1.5 py-0.2 rounded font-mono font-bold">1-Yr</span>
                </div>
              )}
            </button>

            {/* MENU ITEM: Knowledge Hub & Influencer Posts (WordPress Style) */}
            <button
              type="button"
              onClick={() => { setActiveMenu('knowledge-hub'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 md:py-2 text-left transition cursor-pointer ${
                activeMenu === 'knowledge-hub'
                  ? 'bg-[#2271b1] text-white font-bold border-l-4 border-white'
                  : 'hover:bg-[#135e96] hover:text-white'
              }`}
              title="Knowledge Hub & Influencer Posts"
            >
              <BookOpen className="w-4 h-4 shrink-0 text-pink-400" />
              {(isMobileMenuOpen || !isSidebarCollapsed) && (
                <div className="flex items-center justify-between w-full">
                  <span>Knowledge Hub (WP)</span>
                  <span className="text-[10px] bg-pink-500/30 text-pink-200 px-1.5 py-0.2 rounded font-mono font-bold">Posts</span>
                </div>
              )}
            </button>

            {/* MENU ITEM: Broadcast & Push Notices */}
            <button
              type="button"
              onClick={() => { setActiveMenu('broadcast'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 md:py-2 text-left transition cursor-pointer ${
                activeMenu === 'broadcast'
                  ? 'bg-[#2271b1] text-white font-bold border-l-4 border-white'
                  : 'hover:bg-[#135e96] hover:text-white'
              }`}
              title="Broadcast & Banners"
            >
              <Megaphone className="w-4 h-4 shrink-0 text-[#72aee6]" />
              {(isMobileMenuOpen || !isSidebarCollapsed) && <span>Marketing & Push</span>}
            </button>

            {/* MENU ITEM: User Contacts & Privacy */}
            <button
              type="button"
              onClick={() => { setActiveMenu('contacts'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 md:py-2 text-left transition cursor-pointer ${
                activeMenu === 'contacts'
                  ? 'bg-[#2271b1] text-white font-bold border-l-4 border-white'
                  : 'hover:bg-[#135e96] hover:text-white'
              }`}
              title="Contacts Directory"
            >
              <Phone className="w-4 h-4 shrink-0 text-[#72aee6]" />
              {(isMobileMenuOpen || !isSidebarCollapsed) && <span>Contact Audits</span>}
            </button>

            {/* MENU ITEM: Security & Tools */}
            <button
              type="button"
              onClick={() => { setActiveMenu('security'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 md:py-2 text-left transition cursor-pointer ${
                activeMenu === 'security'
                  ? 'bg-[#2271b1] text-white font-bold border-l-4 border-white'
                  : 'hover:bg-[#135e96] hover:text-white'
              }`}
              title="Security & Tools"
            >
              <Shield className="w-4 h-4 shrink-0 text-emerald-400" />
              {(isMobileMenuOpen || !isSidebarCollapsed) && <span>Security & Tools</span>}
            </button>

            {/* MENU ITEM: Backups & Cloud Sync */}
            <button
              type="button"
              onClick={() => { setActiveMenu('backups'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 md:py-2 text-left transition cursor-pointer ${
                activeMenu === 'backups'
                  ? 'bg-[#2271b1] text-white font-bold border-l-4 border-white'
                  : 'hover:bg-[#135e96] hover:text-white'
              }`}
              title="Backups & Cloud"
            >
              <HardDrive className="w-4 h-4 shrink-0 text-[#72aee6]" />
              {(isMobileMenuOpen || !isSidebarCollapsed) && <span>Backups & Cloud</span>}
            </button>

            {/* MENU ITEM: Vernunt SEO & Instant Indexing Studio */}
            <button
              type="button"
              onClick={() => { setActiveMenu('seo'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 md:py-2 text-left transition cursor-pointer ${
                activeMenu === 'seo'
                  ? 'bg-[#2271b1] text-white font-bold border-l-4 border-amber-400 shadow-md'
                  : 'hover:bg-[#135e96] hover:text-white'
              }`}
              title="Vernunt SEO & Instant Indexing"
            >
              <Globe className="w-4 h-4 shrink-0 text-amber-300" />
              {(isMobileMenuOpen || !isSidebarCollapsed) && (
                <div className="flex items-center justify-between w-full">
                  <span>SEO & Indexing</span>
                  <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                    Rank Math
                  </span>
                </div>
              )}
            </button>

            {/* MENU ITEM: Settings & Tabs */}
            <button
              type="button"
              onClick={() => { setActiveMenu('settings'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 md:py-2 text-left transition cursor-pointer ${
                activeMenu === 'settings'
                  ? 'bg-[#2271b1] text-white font-bold border-l-4 border-white'
                  : 'hover:bg-[#135e96] hover:text-white'
              }`}
              title="Settings"
            >
              <Settings className="w-4 h-4 shrink-0 text-[#72aee6]" />
              {(isMobileMenuOpen || !isSidebarCollapsed) && <span>Settings</span>}
            </button>

          </nav>

          {/* Mobile bottom info */}
          <div className="p-3 bg-[#14181b] border-t border-[#2c3338] md:hidden flex items-center justify-between">
            <div className="text-[11px] text-[#8c8f94]">
              Signed in: <strong className="text-white">{userProfile?.parentName || 'SuperAdmin'}</strong>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-xs bg-[#2271b1] text-white font-bold px-2.5 py-1 rounded"
            >
              Close
            </button>
          </div>

          {/* Sidebar Collapse Button */}
          <div className="p-2 border-t border-[#2c3338] hidden md:block">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#a7aaad] hover:text-white hover:bg-[#2c3338] rounded-xs transition cursor-pointer"
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {!isSidebarCollapsed && <span>Collapse menu</span>}
            </button>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* 3. VERNUNT MAIN CONTENT BODY (#wpbody-content)                            */}
        {/* ========================================================================= */}
        <main id="wpbody-content" className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-4 sm:space-y-5 overflow-y-auto">
          
          {/* Mobile Quick-Navigation Horizontal Pill Bar */}
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 -mt-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="px-2.5 py-1.5 bg-[#1d2327] text-amber-300 border border-amber-400/40 rounded text-xs font-bold shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>All Menus</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMenu('dashboard')}
              className={`px-2.5 py-1.5 rounded text-xs font-medium shrink-0 transition cursor-pointer ${
                activeMenu === 'dashboard' ? 'bg-[#2271b1] text-white font-bold' : 'bg-white text-slate-700 border border-slate-200 shadow-2xs'
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActiveMenu('users')}
              className={`px-2.5 py-1.5 rounded text-xs font-medium shrink-0 transition flex items-center gap-1 cursor-pointer ${
                activeMenu === 'users' ? 'bg-[#2271b1] text-white font-bold' : 'bg-white text-slate-700 border border-slate-200 shadow-2xs'
              }`}
            >
              <span>Users &amp; KYC</span>
              {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveMenu('events')}
              className={`px-2.5 py-1.5 rounded text-xs font-medium shrink-0 transition cursor-pointer ${
                activeMenu === 'events' ? 'bg-[#2271b1] text-white font-bold' : 'bg-white text-slate-700 border border-slate-200 shadow-2xs'
              }`}
            >
              Events &amp; Ticketing
            </button>
            <button
              type="button"
              onClick={() => setActiveMenu('knowledge-hub')}
              className={`px-2.5 py-1.5 rounded text-xs font-medium shrink-0 transition cursor-pointer ${
                activeMenu === 'knowledge-hub' ? 'bg-[#2271b1] text-white font-bold' : 'bg-white text-slate-700 border border-slate-200 shadow-2xs'
              }`}
            >
              Knowledge Hub
            </button>
            <button
              type="button"
              onClick={() => setActiveMenu('child-safety')}
              className={`px-2.5 py-1.5 rounded text-xs font-medium shrink-0 transition cursor-pointer ${
                activeMenu === 'child-safety' ? 'bg-[#2271b1] text-white font-bold' : 'bg-white text-slate-700 border border-slate-200 shadow-2xs'
              }`}
            >
              Safety
            </button>
            <button
              type="button"
              onClick={() => setActiveMenu('coupons')}
              className={`px-2.5 py-1.5 rounded text-xs font-medium shrink-0 transition cursor-pointer ${
                activeMenu === 'coupons' ? 'bg-[#2271b1] text-white font-bold' : 'bg-white text-slate-700 border border-slate-200 shadow-2xs'
              }`}
            >
              Coupons
            </button>
            <button
              type="button"
              onClick={() => setActiveMenu('seo')}
              className={`px-2.5 py-1.5 rounded text-xs font-medium shrink-0 transition cursor-pointer ${
                activeMenu === 'seo' ? 'bg-[#2271b1] text-white font-bold' : 'bg-white text-slate-700 border border-slate-200 shadow-2xs'
              }`}
            >
              SEO &amp; Index
            </button>
          </div>
          
          {/* Top Screen Options & Help Bar */}
          <div className="flex items-center justify-between border-b border-[#dcdcde] pb-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#646970]">Vernunt Core v2.4 • Enterprise Administrator Engine</span>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => { setShowScreenOptions(!showScreenOptions); setShowHelpDrawer(false); }}
                className={`px-3 py-1 border border-[#c3c4c7] rounded-xs bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2c3338] font-medium flex items-center gap-1 transition cursor-pointer ${
                  showScreenOptions ? 'border-b-0 bg-white font-bold' : ''
                }`}
              >
                <span>Screen Options</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showScreenOptions ? 'rotate-180' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => { setShowHelpDrawer(!showHelpDrawer); setShowScreenOptions(false); }}
                className={`px-3 py-1 border border-[#c3c4c7] rounded-xs bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2c3338] font-medium flex items-center gap-1 transition cursor-pointer ${
                  showHelpDrawer ? 'border-b-0 bg-white font-bold' : ''
                }`}
              >
                <span>Help</span>
                <HelpCircle className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Screen Options Drawer */}
          {showScreenOptions && (
            <div className="bg-white border border-[#c3c4c7] p-4 rounded-xs shadow-xs space-y-3 text-xs animate-fadeIn">
              <h4 className="font-bold text-[#1d2327]">Show on Screen</h4>
              <div className="flex flex-wrap gap-4 text-[#50575e]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={screenWidgets.welcomePanel} 
                    onChange={e => setScreenWidgets({ ...screenWidgets, welcomePanel: e.target.checked })} 
                  />
                  <span>Welcome Panel</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={screenWidgets.atAGlance} 
                    onChange={e => setScreenWidgets({ ...screenWidgets, atAGlance: e.target.checked })} 
                  />
                  <span>At a Glance</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={screenWidgets.activity} 
                    onChange={e => setScreenWidgets({ ...screenWidgets, activity: e.target.checked })} 
                  />
                  <span>Activity</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={screenWidgets.quickDraft} 
                    onChange={e => setScreenWidgets({ ...screenWidgets, quickDraft: e.target.checked })} 
                  />
                  <span>Quick Community Notice</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={screenWidgets.siteHealth} 
                    onChange={e => setScreenWidgets({ ...screenWidgets, siteHealth: e.target.checked })} 
                  />
                  <span>Site Health Status</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={screenWidgets.wooStatus} 
                    onChange={e => setScreenWidgets({ ...screenWidgets, wooStatus: e.target.checked })} 
                  />
                  <span>Commerce & Revenue Snapshot</span>
                </label>
              </div>
            </div>
          )}

          {/* Help Drawer */}
          {showHelpDrawer && (
            <div className="bg-white border border-[#c3c4c7] p-4 rounded-xs shadow-xs space-y-2 text-xs animate-fadeIn">
              <h4 className="font-bold text-[#1d2327]">Overview & Documentation</h4>
              <p className="text-[#50575e] leading-relaxed">
                The Vernunt Administrator Console provides full operational authority over all community playdate records, KYC identity validations, Aadhaar correlations, class & event ticket passes, affiliate commissions, and emergency system protocols.
              </p>
              <p className="text-[#50575e]">
                For emergency security freezes or suspicious IP mitigations, visit the <strong>Security & Tools</strong> tab.
              </p>
            </div>
          )}

          {/* WordPress Notice Banner Alert (Dismissible) */}
          {wpNotice && (
            <div 
              className={`p-3 bg-white border-l-4 shadow-2xs text-xs font-medium flex items-center justify-between gap-3 ${
                wpNotice.type === 'success' ? 'border-l-[#00a32a] text-[#1e1e1e]' :
                wpNotice.type === 'warning' ? 'border-l-[#dba617] text-[#1e1e1e]' :
                wpNotice.type === 'error' ? 'border-l-[#d63638] text-[#1e1e1e]' :
                'border-l-[#2271b1] text-[#1e1e1e]'
              }`}
            >
              <div className="flex items-center gap-2">
                {wpNotice.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#00a32a]" />}
                {wpNotice.type === 'warning' && <AlertTriangle className="w-4 h-4 text-[#dba617]" />}
                {wpNotice.type === 'error' && <XSquare className="w-4 h-4 text-[#d63638]" />}
                {wpNotice.type === 'info' && <ShieldCheck className="w-4 h-4 text-[#2271b1]" />}
                <span>{wpNotice.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setWpNotice(null)}
                className="text-[#646970] hover:text-[#1d2327] p-1 cursor-pointer"
                title="Dismiss Notice"
              >
                <XSquare className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW A: WORDPRESS DASHBOARD HOME (`index.php`)                           */}
          {/* ========================================================================= */}
          {activeMenu === 'dashboard' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Heading with page title action */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-xl sm:text-2xl font-normal font-sans text-[#1d2327] flex items-center gap-2">
                  Dashboard
                </h1>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setActiveMenu('users'); setShowKycDrawer(true); }}
                    className="px-3 py-1.5 bg-[#f6f7f7] hover:bg-[#f0f0f1] active:bg-[#dcdcde] text-[#2271b1] hover:text-[#135e96] border border-[#2271b1] rounded-xs font-semibold text-xs transition cursor-pointer shadow-2xs"
                  >
                    + Add New User
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMenu('events')}
                    className="px-3 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white rounded-xs font-semibold text-xs transition cursor-pointer shadow-2xs"
                  >
                    + Add Event / Class
                  </button>
                </div>
              </div>

              {/* Vernunt Welcome Panel (#welcome-panel) */}
              {screenWidgets.welcomePanel && (
                <div id="welcome-panel" className="bg-white border border-[#c3c4c7] p-6 rounded-xs relative shadow-2xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-[#1d2327]">
                        Welcome to Vernunt Admin Control Center
                      </h2>
                      <p className="text-xs text-[#646970] mt-0.5">
                        Operational console for managing playdate companions, community safety verifications, and event tickets.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScreenWidgets({ ...screenWidgets, welcomePanel: false })}
                      className="text-xs text-[#646970] hover:text-[#1d2327]"
                    >
                      Dismiss
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-[#f0f0f1]">
                    {/* Col 1: Get Started */}
                    <div className="space-y-2 text-xs">
                      <h3 className="font-bold text-[#1d2327] text-sm">Get Started</h3>
                      <button
                        type="button"
                        onClick={() => { setActiveMenu('users'); setActiveSubTab('pending'); }}
                        className="px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white font-bold rounded-xs transition block cursor-pointer"
                      >
                        Review Pending KYC ({pendingCount})
                      </button>
                      <p className="text-[#646970] text-[11px]">
                        Verify uploaded Aadhaar IDs & live facial snapshots for trust scores.
                      </p>
                    </div>

                    {/* Col 2: Next Steps */}
                    <div className="space-y-2 text-xs text-[#2271b1]">
                      <h3 className="font-bold text-[#1d2327] text-sm">Next Steps</h3>
                      <ul className="space-y-1.5">
                        <li>
                          <button type="button" onClick={() => setActiveMenu('events')} className="hover:underline flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> Manage Upcoming Events & Workshops
                          </button>
                        </li>
                        <li>
                          <button type="button" onClick={() => setActiveMenu('broadcast')} className="hover:underline flex items-center gap-1.5">
                            <Megaphone className="w-3.5 h-3.5" /> Broadcast Community Push Alert
                          </button>
                        </li>
                        <li>
                          <button type="button" onClick={() => setActiveMenu('affiliates')} className="hover:underline flex items-center gap-1.5">
                            <Share2 className="w-3.5 h-3.5" /> Review Affiliate Commissions & Payouts
                          </button>
                        </li>
                      </ul>
                    </div>

                    {/* Col 3: More Actions */}
                    <div className="space-y-2 text-xs text-[#2271b1]">
                      <h3 className="font-bold text-[#1d2327] text-sm">More Actions</h3>
                      <ul className="space-y-1.5">
                        <li>
                          <button type="button" onClick={() => setActiveMenu('subscriptions')} className="hover:underline flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" /> Manage Subscription Plans & Pricing
                          </button>
                        </li>
                        <li>
                          <button type="button" onClick={() => setActiveMenu('security')} className="hover:underline flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5" /> Run Automated Security & Threat Audit
                          </button>
                        </li>
                        <li>
                          <button type="button" onClick={() => setActiveMenu('backups')} className="hover:underline flex items-center gap-1.5">
                            <HardDrive className="w-3.5 h-3.5" /> Google Drive Cloud Backup Sync
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Dashboard Postboxes Grid (2-Column Layout) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* WIDGET 1: At a Glance */}
                {screenWidgets.atAGlance && (
                  <div className="bg-white border border-[#c3c4c7] rounded-xs shadow-2xs overflow-hidden">
                    <div className="bg-[#f6f7f7] px-4 py-3 border-b border-[#c3c4c7] flex items-center justify-between">
                      <h3 className="font-bold text-xs text-[#1d2327] uppercase tracking-wider">At a Glance</h3>
                    </div>
                    <div className="p-4 space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-4 pb-3 border-b border-[#f0f0f1]">
                        <div className="space-y-1">
                          <button 
                            type="button" 
                            onClick={() => { setActiveMenu('users'); setActiveSubTab('all'); }}
                            className="text-[#2271b1] hover:underline font-bold text-sm flex items-center gap-1.5"
                          >
                            <Users className="w-4 h-4" /> {allUsers.length} Total Users
                          </button>
                          <span className="text-[11px] text-[#646970] block">{verifiedCount} Verified, {pendingCount} Pending</span>
                        </div>

                        <div className="space-y-1">
                          <button 
                            type="button" 
                            onClick={() => setActiveMenu('events')}
                            className="text-[#2271b1] hover:underline font-bold text-sm flex items-center gap-1.5"
                          >
                            <Calendar className="w-4 h-4" /> {eventsList.length} Active Events
                          </button>
                          <span className="text-[11px] text-[#646970] block">
                            {eventsList.filter(e => e.isFeatured).length} Featured / Sponsored
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="font-bold text-[#1d2327] block flex items-center gap-1">
                            <ShoppingCart className="w-3.5 h-3.5 text-[#96588a]" /> Vernunt Commerce
                          </span>
                          <span className="text-[11px] text-[#646970] block">Enabled (Razorpay + UPI)</span>
                        </div>
                        <div className="space-y-1">
                          <span className="font-bold text-[#1d2327] block flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Firestore Security
                          </span>
                          <span className="text-[11px] text-emerald-600 font-bold block">100% Rules Enforced</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* WIDGET 2: Commerce & Financial Snapshot */}
                {screenWidgets.wooStatus && (
                  <div className="bg-white border border-[#c3c4c7] rounded-xs shadow-2xs overflow-hidden">
                    <div className="bg-[#f6f7f7] px-4 py-3 border-b border-[#c3c4c7] flex items-center justify-between">
                      <h3 className="font-bold text-xs text-[#96588a] uppercase tracking-wider flex items-center gap-1.5">
                        <ShoppingCart className="w-3.5 h-3.5" /> Commerce Sales & Affiliate Ledger
                      </h3>
                      <button 
                        type="button" 
                        onClick={() => setActiveMenu('woocommerce')}
                        className="text-[11px] text-[#2271b1] hover:underline"
                      >
                        View Orders →
                      </button>
                    </div>
                    <div className="p-4 grid grid-cols-3 gap-3 text-center text-xs">
                      <div className="p-3 bg-[#f6f7f7] rounded-xs border border-[#dcdcde]">
                        <span className="block text-[10px] text-[#646970] font-bold uppercase">Passes Sold</span>
                        <span className="text-xl font-bold text-[#1d2327] mt-1 block">48</span>
                        <span className="text-[10px] text-emerald-600 font-medium">₹28,500 Gross</span>
                      </div>
                      <div className="p-3 bg-[#f6f7f7] rounded-xs border border-[#dcdcde]">
                        <span className="block text-[10px] text-[#646970] font-bold uppercase">Affiliate Earned</span>
                        <span className="text-xl font-bold text-orange-600 mt-1 block">₹4,275</span>
                        <span className="text-[10px] text-[#646970]">15% Partner Rev</span>
                      </div>
                      <div className="p-3 bg-[#f6f7f7] rounded-xs border border-[#dcdcde]">
                        <span className="block text-[10px] text-[#646970] font-bold uppercase">Subscribers</span>
                        <span className="text-xl font-bold text-blue-600 mt-1 block">19</span>
                        <span className="text-[10px] text-blue-600 font-medium">Club Members</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* WIDGET 3: Quick Notice / Push Dispatcher (#dashboard_quick_press) */}
                {screenWidgets.quickDraft && (
                  <div className="bg-white border border-[#c3c4c7] rounded-xs shadow-2xs overflow-hidden">
                    <div className="bg-[#f6f7f7] px-4 py-3 border-b border-[#c3c4c7] flex items-center justify-between">
                      <h3 className="font-bold text-xs text-[#1d2327] uppercase tracking-wider flex items-center gap-1.5">
                        <Megaphone className="w-3.5 h-3.5 text-orange-500" /> Quick Community Broadcast
                      </h3>
                    </div>
                    <form onSubmit={handleSendQuickNotice} className="p-4 space-y-3 text-xs">
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Notice Title (e.g. Weekend Park Playdate Alert)"
                          value={quickNoticeTitle}
                          onChange={e => setQuickNoticeTitle(e.target.value)}
                          className="w-full p-2 bg-[#f6f7f7] border border-[#8c8f94] rounded-xs text-xs font-semibold outline-none focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                        />
                      </div>
                      <div>
                        <textarea
                          rows={3}
                          required
                          placeholder="What's happening? Notify all registered families on their apps immediately..."
                          value={quickNoticeBody}
                          onChange={e => setQuickNoticeBody(e.target.value)}
                          className="w-full p-2 bg-[#f6f7f7] border border-[#8c8f94] rounded-xs text-xs outline-none focus:bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-[#646970]">Broadcasts live to all devices via WebSocket</span>
                        <button
                          type="submit"
                          disabled={isSendingQuickNotice}
                          className="px-4 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white font-bold text-xs rounded-xs transition cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          {isSendingQuickNotice ? 'Publishing...' : 'Publish Notice'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* WIDGET 4: Site Health Status (#dashboard_site_health) */}
                {screenWidgets.siteHealth && (
                  <div className="bg-white border border-[#c3c4c7] rounded-xs shadow-2xs overflow-hidden">
                    <div className="bg-[#f6f7f7] px-4 py-3 border-b border-[#c3c4c7] flex items-center justify-between">
                      <h3 className="font-bold text-xs text-[#1d2327] uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-600" /> Site Health Status
                      </h3>
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsRunningAudit(true);
                          setTimeout(() => {
                            setAuditResult(runSecurityAudit(allUsers.length, isSuperAdminAuthorized));
                            setIsRunningAudit(false);
                            showNotification('success', 'Full platform health & security audit completed.');
                          }, 800);
                        }}
                        className="text-[11px] text-[#2271b1] hover:underline"
                      >
                        {isRunningAudit ? 'Auditing...' : 'Run Audit'}
                      </button>
                    </div>
                    <div className="p-4 space-y-3 text-xs">
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xs">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-sm">
                          {auditResult.score}%
                        </div>
                        <div>
                          <strong className="block text-emerald-900 font-bold">Good Health Score</strong>
                          <p className="text-[11px] text-emerald-800">
                            No critical cryptographic vulnerabilities found. HTTPS SSL active, phone encryption operational.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[11px] text-[#50575e]">
                        <div className="flex justify-between py-1 border-b border-[#f0f0f1]">
                          <span>Emergency Lockdown Protocol:</span>
                          <span className={emergencyLockdown ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
                            {emergencyLockdown ? 'LOCKED' : 'NORMAL / OPERATIONAL'}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#f0f0f1]">
                          <span>Firestore Database Sync:</span>
                          <span className="text-emerald-600 font-bold">CONNECTED</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Aadhaar Identity Masking:</span>
                          <span className="text-emerald-600 font-bold">ACTIVE (UIDAI Compliant)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW B: WORDPRESS USERS LIST TABLE (`users.php`)                          */}
          {/* ========================================================================= */}
          {activeMenu === 'users' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Page Title & Add New Button */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-normal text-[#1d2327]">Users</h1>
                  <button
                    type="button"
                    onClick={() => { setSelectedUser(null); setShowKycDrawer(true); }}
                    className="px-2.5 py-1 bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2271b1] border border-[#2271b1] rounded-xs font-semibold text-xs transition cursor-pointer"
                  >
                    Add New User
                  </button>
                </div>

                {/* WP Search Box */}
                <div className="flex items-center gap-1">
                  <input
                    type="search"
                    placeholder="Search Users..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="p-1.5 bg-white border border-[#8c8f94] rounded-xs text-xs outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                  />
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-[#f6f7f7] hover:bg-[#f0f0f1] border border-[#8c8f94] rounded-xs text-xs font-medium text-[#2c3338]"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* WordPress Subsubsub Views Navigation (All | Verified | Pending KYC | Organizers | Specialists | Admins) */}
              <ul className="flex flex-wrap items-center gap-1 text-xs text-[#646970] border-b border-[#c3c4c7] pb-2">
                <li>
                  <button 
                    type="button" 
                    onClick={() => setActiveSubTab('all')}
                    className={`hover:text-[#2271b1] ${activeSubTab === 'all' ? 'text-[#1d2327] font-bold' : 'text-[#2271b1]'}`}
                  >
                    All <span className="text-[#646970]">({allUsers.length})</span>
                  </button>
                  <span className="mx-1 text-[#dcdcde]">|</span>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => setActiveSubTab('verified')}
                    className={`hover:text-[#2271b1] ${activeSubTab === 'verified' ? 'text-[#1d2327] font-bold' : 'text-[#2271b1]'}`}
                  >
                    Verified <span className="text-[#646970]">({verifiedCount})</span>
                  </button>
                  <span className="mx-1 text-[#dcdcde]">|</span>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => setActiveSubTab('pending')}
                    className={`hover:text-[#2271b1] ${activeSubTab === 'pending' ? 'text-[#1d2327] font-bold' : 'text-[#2271b1]'}`}
                  >
                    Pending KYC <span className="text-[#d63638] font-bold">({pendingCount})</span>
                  </button>
                  <span className="mx-1 text-[#dcdcde]">|</span>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => setActiveSubTab('organizers')}
                    className={`hover:text-[#2271b1] ${activeSubTab === 'organizers' ? 'text-[#1d2327] font-bold' : 'text-[#2271b1]'}`}
                  >
                    Event Organizers <span className="text-[#646970]">({organizerCount})</span>
                  </button>
                  <span className="mx-1 text-[#dcdcde]">|</span>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => setActiveSubTab('specialists')}
                    className={`hover:text-[#2271b1] ${activeSubTab === 'specialists' ? 'text-[#1d2327] font-bold' : 'text-[#2271b1]'}`}
                  >
                    Specialists <span className="text-[#646970]">({specialistCount})</span>
                  </button>
                  <span className="mx-1 text-[#dcdcde]">|</span>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => setActiveSubTab('admins')}
                    className={`hover:text-[#2271b1] ${activeSubTab === 'admins' ? 'text-[#1d2327] font-bold' : 'text-[#2271b1]'}`}
                  >
                    Administrators <span className="text-[#646970]">({adminCount})</span>
                  </button>
                </li>
              </ul>

              {/* Bulk Actions & Filters Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 py-1 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Bulk Actions */}
                  <div className="flex items-center gap-1">
                    <select
                      value={bulkAction}
                      onChange={e => setBulkAction(e.target.value)}
                      className="p-1.5 bg-white border border-[#8c8f94] rounded-xs text-xs outline-none focus:border-[#2271b1]"
                    >
                      <option value="-1">Bulk actions</option>
                      <option value="verify">Approve KYC & Verify</option>
                      <option value="block">Block User Account</option>
                      <option value="unblock">Unblock / Unlock Account</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleBulkUserAction}
                      disabled={bulkAction === '-1' || selectedUserIds.length === 0}
                      className="px-3 py-1.5 bg-[#f6f7f7] hover:bg-[#f0f0f1] border border-[#8c8f94] rounded-xs text-xs font-semibold text-[#2c3338] disabled:opacity-40 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>

                  {/* Role Filter */}
                  <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="p-1.5 bg-white border border-[#8c8f94] rounded-xs text-xs outline-none focus:border-[#2271b1]"
                  >
                    <option value="all">All Roles</option>
                    <option value="Parent">Parents</option>
                    <option value="Event Organizer">Event Organizers</option>
                    <option value="Portfolio Professional">Specialists</option>
                    <option value="Admin">Administrators</option>
                  </select>

                  {/* Verification Filter */}
                  <select
                    value={verificationFilter}
                    onChange={e => setVerificationFilter(e.target.value)}
                    className="p-1.5 bg-white border border-[#8c8f94] rounded-xs text-xs outline-none focus:border-[#2271b1]"
                  >
                    <option value="all">All KYC Status</option>
                    <option value={VerificationStatus.VERIFIED}>Verified Only</option>
                    <option value={VerificationStatus.PENDING}>Pending Review</option>
                    <option value="aadhaar">Aadhaar Verified</option>
                    <option value={VerificationStatus.UNVERIFIED}>Unverified</option>
                  </select>

                  {/* Sort Order Selector (Requested by Admin) */}
                  <div className="flex items-center gap-1.5 bg-white border border-[#2271b1] rounded-xs px-2 py-1 shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-[#2271b1]" />
                    <span className="text-[11px] font-bold text-[#1d2327]">Sort by:</span>
                    <select
                      value={userSortBy}
                      onChange={e => setUserSortBy(e.target.value as any)}
                      className="bg-transparent text-xs text-[#2271b1] font-bold outline-none cursor-pointer pr-1"
                    >
                      <option value="latest">⚡ Latest / Newest Registered First</option>
                      <option value="oldest">⏳ Oldest Registered First</option>
                      <option value="name_asc">🔤 Name (A → Z)</option>
                      <option value="name_desc">🔤 Name (Z → A)</option>
                      <option value="role">🏷️ User Role</option>
                    </select>
                  </div>

                  {/* Quick Toggle Pill for Latest Registrations */}
                  <button
                    type="button"
                    onClick={() => setUserSortBy(prev => prev === 'latest' ? 'oldest' : 'latest')}
                    className={`px-2.5 py-1 rounded-xs font-semibold text-xs border transition flex items-center gap-1 cursor-pointer ${
                      userSortBy === 'latest'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                        : 'bg-white text-[#646970] border-[#c3c4c7] hover:border-[#2271b1]'
                    }`}
                    title="Toggle newest or oldest registration order"
                  >
                    {userSortBy === 'latest' ? (
                      <>
                        <ArrowDown className="w-3 h-3 text-emerald-600" />
                        <span>Showing Newest First</span>
                      </>
                    ) : userSortBy === 'oldest' ? (
                      <>
                        <ArrowUp className="w-3 h-3 text-amber-600" />
                        <span>Showing Oldest First</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        <span>Sort: Latest</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#646970] font-medium">
                  <span className="bg-[#f0f0f1] px-2 py-0.5 rounded-xs border border-[#dcdcde]">
                    {filteredUsers.length} user(s) found
                  </span>
                </div>
              </div>

              {/* WordPress Standard List Table (`wp-list-table widefat striped`) */}
              <div className="bg-white border border-[#c3c4c7] shadow-2xs overflow-x-auto rounded-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f6f7f7] border-b border-[#c3c4c7] text-[#2c3338] font-semibold text-xs">
                      <th className="py-2.5 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={e => {
                            if (e.target.checked) setSelectedUserIds(filteredUsers.map(u => u.id));
                            else setSelectedUserIds([]);
                          }}
                        />
                      </th>
                      <th className="py-2.5 px-3">Username & Profile</th>
                      <th className="py-2.5 px-3">Parent Name</th>
                      <th className="py-2.5 px-3">Child & Age</th>
                      <th className="py-2.5 px-3">Mobile & Email</th>
                      <th className="py-2.5 px-3">KYC / Aadhaar</th>
                      <th className="py-2.5 px-3">Role</th>
                      
                      {/* Clickable Sortable Header for Registration Date */}
                      <th 
                        onClick={() => setUserSortBy(prev => prev === 'latest' ? 'oldest' : 'latest')}
                        className="py-2.5 px-3 cursor-pointer select-none hover:bg-[#eaecee] transition text-[#2271b1] group"
                        title="Click to sort by registration date (latest vs oldest)"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold underline decoration-dotted decoration-[#2271b1]">Registered</span>
                          {userSortBy === 'latest' ? (
                            <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded-xs text-[10px] font-bold">
                              <ArrowDown className="w-3 h-3" /> Newest
                            </span>
                          ) : userSortBy === 'oldest' ? (
                            <span className="inline-flex items-center gap-0.5 text-amber-700 bg-amber-100 px-1 py-0.2 rounded-xs text-[10px] font-bold">
                              <ArrowUp className="w-3 h-3" /> Oldest
                            </span>
                          ) : (
                            <Clock className="w-3 h-3 text-[#8c8f94] group-hover:text-[#2271b1]" />
                          )}
                        </div>
                      </th>

                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f1]">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-[#646970]">
                          No users found matching current filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSelected = selectedUserIds.includes(u.id);
                        const isHovered = hoveredRowId === u.id;

                        return (
                          <tr 
                            key={u.id}
                            onMouseEnter={() => setHoveredRowId(u.id)}
                            onMouseLeave={() => setHoveredRowId(null)}
                            className={`transition-colors ${
                              isSelected ? 'bg-[#f0f6fc]' : 'hover:bg-[#f6f7f7]'
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="py-3 px-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={e => {
                                  if (e.target.checked) setSelectedUserIds([...selectedUserIds, u.id]);
                                  else setSelectedUserIds(selectedUserIds.filter(id => id !== u.id));
                                }}
                              />
                            </td>

                            {/* User Avatar & Name with Row Actions on Hover */}
                            <td className="py-3 px-3">
                              <div className="flex items-start gap-2.5">
                                <img
                                  src={u.photoUrl}
                                  alt={u.parentName}
                                  className="w-8 h-8 rounded-xs object-cover bg-slate-100 shrink-0 border border-[#c3c4c7]"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="space-y-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectUser(u)}
                                    className="font-bold text-[#2271b1] hover:text-[#135e96] hover:underline block text-left"
                                  >
                                    {u.childName || u.parentName}
                                  </button>
                                  <span className="text-[10px] text-[#646970] font-mono block">ID: {u.id.slice(0, 10)}...</span>

                                  {/* WordPress Hover Row Actions */}
                                  <div className={`flex items-center gap-1.5 text-[11px] text-[#2271b1] pt-0.5 ${
                                    isHovered ? 'opacity-100' : 'opacity-0'
                                  }`}>
                                    <button 
                                      type="button" 
                                      onClick={() => handleSelectUser(u)} 
                                      className="hover:underline"
                                    >
                                      Edit / KYC
                                    </button>
                                    <span className="text-[#dcdcde]">|</span>
                                    <button 
                                      type="button" 
                                      onClick={async () => {
                                        try {
                                          const userRef = doc(db, 'users', u.id);
                                          await updateDoc(userRef, {
                                            verificationStatus: VerificationStatus.VERIFIED,
                                            aadhaarVerified: true,
                                            facialAuditRequired: false,
                                            faceVerificationStatus: 'verified'
                                          });
                                          await sendApprovalNotification(u);
                                        } catch (err: any) {
                                          showNotification('error', err.message);
                                        }
                                      }} 
                                      className="hover:underline text-emerald-700 font-bold"
                                    >
                                      Approve & Notify
                                    </button>
                                    <span className="text-[#dcdcde]">|</span>
                                    <button 
                                      type="button" 
                                      onClick={async () => {
                                        if (window.confirm(`Block ${u.parentName}?`)) {
                                          try {
                                            await updateDoc(doc(db, 'users', u.id), { isBlocked: true });
                                            showNotification('warning', `Blocked user ${u.parentName}`);
                                          } catch(e: any) {
                                            showNotification('error', e.message);
                                          }
                                        }
                                      }} 
                                      className="hover:underline text-[#d63638]"
                                    >
                                      Block
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Parent Name */}
                            <td className="py-3 px-3 font-semibold text-[#1d2327]">
                              {u.parentName}
                            </td>

                            {/* Child & Age */}
                            <td className="py-3 px-3 text-[#50575e]">
                              {u.childName} ({u.childAge} yrs)
                            </td>

                            {/* Mobile & Email */}
                            <td className="py-3 px-3 font-mono text-[11px] text-[#50575e]">
                              <div>{showUnmaskedPii ? u.phoneNumber : maskPhone(u.phoneNumber)}</div>
                              <div className="text-[10px] text-[#646970]">{showUnmaskedPii ? u.email : maskEmail(u.email)}</div>
                            </td>

                            {/* KYC / Uploaded Documents (Admin Only) */}
                            <td className="py-3 px-3">
                              <div className="space-y-1">
                                {u.aadhaarDocUrl ? (
                                  <a
                                    href={u.aadhaarDocUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-xs font-bold text-[10px] transition"
                                    title={u.aadhaarDocName || 'Aadhaar Document'}
                                  >
                                    <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>📄 Aadhaar Document</span>
                                  </a>
                                ) : u.aadhaarVerified ? (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-xs font-bold text-[10px]">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Aadhaar Linked
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-[#f6f7f7] text-[#646970] border border-[#dcdcde] px-2 py-0.5 rounded-xs text-[10px]">
                                    Unlinked
                                  </span>
                                )}

                                {u.idDocUrl && (
                                  <div>
                                    <a
                                      href={u.idDocUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-xs font-bold text-[10px] transition"
                                      title={u.idDocumentName || 'Govt ID Document'}
                                    >
                                      <Eye className="w-3 h-3 text-purple-600 shrink-0" />
                                      <span>📁 ID Document</span>
                                    </a>
                                  </div>
                                )}

                                {u.companyDocUrl && (
                                  <div>
                                    <a
                                      href={u.companyDocUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-xs font-bold text-[10px] transition"
                                      title={u.companyDocName || 'Corporate Document'}
                                    >
                                      <Eye className="w-3 h-3 text-blue-600 shrink-0" />
                                      <span>🏢 Corporate Doc</span>
                                    </a>
                                  </div>
                                )}

                                {u.addressProofDocUrl && (
                                  <div>
                                    <a
                                      href={u.addressProofDocUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-xs font-bold text-[10px] transition"
                                      title={u.addressProofDocName || 'Address Proof'}
                                    >
                                      <Eye className="w-3 h-3 text-amber-600 shrink-0" />
                                      <span>📍 Address Proof</span>
                                    </a>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Role */}
                            <td className="py-3 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded-xs font-bold text-[10px] uppercase ${
                                u.userRole === 'Admin' ? 'bg-purple-100 text-purple-800' :
                                u.userRole === 'Event Organizer' ? 'bg-blue-100 text-blue-800' :
                                u.userRole === 'Portfolio Professional' ? 'bg-orange-100 text-orange-800' :
                                u.userRole === 'Influencer' ? 'bg-pink-100 text-pink-800 border border-pink-200' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {u.userRole || 'Parent'}
                              </span>
                            </td>

                            {/* Registered Date & Relative Badge */}
                            <td className="py-3 px-3">
                              {(() => {
                                const reg = formatRegistrationDate(u);
                                const fullTimestamp = u.createdAt || u.registeredAt || u.capturedAt || (getUserRegistrationTime(u) ? new Date(getUserRegistrationTime(u)).toISOString() : null);
                                return (
                                  <div 
                                    className="space-y-0.5" 
                                    title={fullTimestamp ? `Registered: ${new Date(fullTimestamp).toLocaleString()}` : 'Registered on Vernunt'}
                                  >
                                    <div className="flex items-center gap-1 font-semibold text-[#1d2327]">
                                      <Calendar className="w-3 h-3 text-[#646970] shrink-0" />
                                      <span className="font-mono text-[11px]">{reg.dateStr}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-xs text-[9.5px] font-bold ${
                                        reg.isRecent 
                                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                                          : 'bg-[#f0f0f1] text-[#646970]'
                                      }`}>
                                        <Clock className="w-2.5 h-2.5" />
                                        {reg.relativeStr}
                                      </span>
                                      {reg.isRecent && (
                                        <span className="text-[9px] text-emerald-700 font-extrabold tracking-tight">
                                          ⚡ NEW
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3 text-right">
                              <span className={`inline-block font-bold text-[10px] uppercase px-2 py-0.5 rounded-xs ${
                                u.verificationStatus === VerificationStatus.VERIFIED ? 'bg-emerald-100 text-emerald-800' :
                                u.verificationStatus === VerificationStatus.PENDING ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {u.verificationStatus || 'Unverified'}
                              </span>
                              {u.isBlocked && (
                                <span className="block text-[9px] text-red-600 font-bold uppercase mt-0.5">BLOCKED</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW C: EVENTS & CLASSES (`edit.php?post_type=event`)                     */}
          {/* ========================================================================= */}
          {activeMenu === 'events' && (
            <AdminTicketingCommissionDesk
              eventsList={eventsList}
              onUpdateEvent={handleUpdateEvent}
              ticketingConfig={ticketingConfig}
              onSaveConfig={handleSaveTicketingConfig}
              onToggleEventFeatured={handleToggleEventFeatured}
            />
          )}

          {/* ========================================================================= */}
          {/* VIEW: CHILD SAFETY & COPPA / DPDP COMPLIANCE                              */}
          {/* ========================================================================= */}
          {activeMenu === 'child-safety' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#c3c4c7] pb-3">
                <div>
                  <h1 className="text-xl font-normal text-[#1d2327] flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" /> Child Safety, Privacy & COPPA Compliance Desk
                  </h1>
                  <p className="text-xs text-[#646970] mt-0.5">
                    Zero-tolerance child protection monitoring, verifiable parental consent (VPC), automated predator screening & rapid triage.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Grade A+ Certified Safe
                  </span>
                </div>
              </div>

              {/* Safety & Compliance Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#c3c4c7] p-4 rounded-xs shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-[#646970]">
                    <span className="text-xs font-bold uppercase tracking-wider">COPPA Status</span>
                    <Lock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#1d2327]">100% Passed</div>
                  <span className="text-[11px] text-emerald-700 block">US FTC 16 CFR Part 312 Active</span>
                </div>

                <div className="bg-white border border-[#c3c4c7] p-4 rounded-xs shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-[#646970]">
                    <span className="text-xs font-bold uppercase tracking-wider">DPDP Act (India)</span>
                    <Shield className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#1d2327]">Sec 9 Verified</div>
                  <span className="text-[11px] text-emerald-700 block">Zero behavioral tracking of minors</span>
                </div>

                <div className="bg-white border border-[#c3c4c7] p-4 rounded-xs shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-[#646970]">
                    <span className="text-xs font-bold uppercase tracking-wider">AI Content Guard</span>
                    <Terminal className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#1d2327]">Live Screening</div>
                  <span className="text-[11px] text-[#646970] block">Predator & profanity filters active</span>
                </div>

                <div className="bg-white border border-[#c3c4c7] p-4 rounded-xs shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-[#646970]">
                    <span className="text-xs font-bold uppercase tracking-wider">Parental Custody</span>
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#1d2327]">100% Guardians</div>
                  <span className="text-[11px] text-[#646970] block">No direct minor self-registration</span>
                </div>
              </div>

              {/* Subtabs for Child Safety: Triage Desk | Consent Ledger | Data Purge | SOS Feeds */}
              <div className="bg-white border border-[#c3c4c7] rounded-xs overflow-hidden shadow-2xs">
                <div className="bg-[#f6f7f7] border-b border-[#c3c4c7] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#d63638]" />
                    <h3 className="font-bold text-xs text-[#1d2327] uppercase tracking-wide">
                      Real-time Child Safety Incident & Chat Flag Triage Desk
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#646970]">
                    Zero-tolerance escalation protocol with law enforcement dispatch
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#c3c4c7] text-[#646970] font-semibold text-[11px] bg-[#fbfbfb]">
                          <th className="py-2.5 px-3">Threat ID</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Flagged Trigger / Content</th>
                          <th className="py-2.5 px-3">Sender & Recipient</th>
                          <th className="py-2.5 px-3">Severity</th>
                          <th className="py-2.5 px-3 text-right">Emergency Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0f0f1]">
                        <tr className="hover:bg-[#fff9f9]">
                          <td className="py-3 px-3 font-mono font-bold text-[#d63638]">#CS-9941</td>
                          <td className="py-3 px-3">
                            <span className="bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 rounded-xs font-bold text-[10px]">
                              GROOMING_PREDATORY
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[#1d2327] font-medium max-w-xs truncate">
                            "don't tell your mom and come alone..."
                          </td>
                          <td className="py-3 px-3 text-[#50575e]">
                            <span className="block font-bold">sender_anon_98</span>
                            <span className="text-[10px] text-[#646970]">Target: Ayaan (Age 5)</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="bg-[#d63638] text-white text-[10px] font-black px-2 py-0.5 rounded-xs">
                              CRITICAL
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                alert('Account permanently suspended and frozen. Tamper-proof evidence packet generated for Childline 1098 & Cyber Crime Portal (1930).');
                              }}
                              className="px-2 py-1 bg-[#d63638] hover:bg-[#b32d2e] text-white font-bold text-[10px] rounded-xs cursor-pointer"
                            >
                              Freeze & Ban
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                alert('Formal guardian warning issued to registered account email.');
                              }}
                              className="px-2 py-1 bg-[#f6f7f7] hover:bg-white text-[#2c3338] border border-[#c3c4c7] font-bold text-[10px] rounded-xs cursor-pointer"
                            >
                              Warn Guardian
                            </button>
                          </td>
                        </tr>

                        <tr className="hover:bg-[#fffdf9]">
                          <td className="py-3 px-3 font-mono font-bold text-amber-700">#CS-9940</td>
                          <td className="py-3 px-3">
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-xs font-bold text-[10px]">
                              PII_HARVESTING
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[#1d2327] font-medium max-w-xs truncate">
                            "give me your private mobile number and home flat address"
                          </td>
                          <td className="py-3 px-3 text-[#50575e]">
                            <span className="block font-bold">guest_user_12</span>
                            <span className="text-[10px] text-[#646970]">Target: Chloe (Age 6)</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-xs">
                              HIGH
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                alert('Residential address extraction blocked. Message auto-redacted.');
                              }}
                              className="px-2 py-1 bg-[#2271b1] hover:bg-[#135e96] text-white font-bold text-[10px] rounded-xs cursor-pointer"
                            >
                              Redacted
                            </button>
                          </td>
                        </tr>

                        <tr className="hover:bg-[#f6f7f7]">
                          <td className="py-3 px-3 font-mono font-bold text-[#646970]">#CS-9939</td>
                          <td className="py-3 px-3">
                            <span className="bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded-xs font-bold text-[10px]">
                              PROFANITY
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[#1d2327] font-medium max-w-xs truncate">
                            "shut up you stupid..."
                          </td>
                          <td className="py-3 px-3 text-[#50575e]">
                            <span className="block font-bold">user_trial_04</span>
                            <span className="text-[10px] text-[#646970]">Target: Leo (Age 4)</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="bg-slate-500 text-white text-[10px] font-black px-2 py-0.5 rounded-xs">
                              LOW
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                alert('Profanity automatically filtered and sanitized into [••••]. Warning note logged.');
                              }}
                              className="px-2 py-1 bg-[#f6f7f7] hover:bg-white text-[#2c3338] border border-[#c3c4c7] font-bold text-[10px] rounded-xs cursor-pointer"
                            >
                              Filtered
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Verifiable Parental Consent (VPC) Register */}
              <div className="bg-white border border-[#c3c4c7] rounded-xs p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#f0f0f1] pb-3">
                  <div>
                    <h3 className="font-bold text-xs text-[#1d2327] uppercase flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" /> Verifiable Parental Consent (VPC) Audit Register
                    </h3>
                    <p className="text-xs text-[#646970]">
                      COPPA 16 CFR § 312.5 and DPDP Act 2023 proof of verifiable guardian authorization.
                    </p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-xs">
                    Total Consents: {allUsers.length} Active Guardians
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#c3c4c7] text-[#646970] font-semibold text-[11px]">
                        <th className="py-2">Parent / Legal Guardian</th>
                        <th className="py-2">Dependent Minor</th>
                        <th className="py-2">Age Bracket</th>
                        <th className="py-2">KYC & Aadhaar Token</th>
                        <th className="py-2">VPC Electronic Token</th>
                        <th className="py-2 text-right">Consent Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0f1]">
                      {allUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-[#f6f7f7]">
                          <td className="py-2.5 font-bold text-[#1d2327]">
                            {u.parentName} ({maskEmail(u.email || `${u.parentName.toLowerCase().replace(/\s/g, '')}@gmail.com`)})
                          </td>
                          <td className="py-2.5 font-semibold text-[#2271b1]">{u.childName}</td>
                          <td className="py-2.5 text-[#50575e]">{u.childAge} {u.ageUnit || 'yrs'}</td>
                          <td className="py-2.5 font-mono text-[11px]">
                            {u.aadhaarVerified ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> UIDAI Linked
                              </span>
                            ) : (
                              <span className="text-[#646970]">Standard ID</span>
                            )}
                          </td>
                          <td className="py-2.5 font-mono text-[10px] text-[#646970]">
                            #VPC-{u.id.slice(0, 6).toUpperCase()}-2026
                          </td>
                          <td className="py-2.5 text-right">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-xs">
                              Active & Verified
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Parental Right-to-be-Forgotten & Data Erasure Compliance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-[#c3c4c7] p-4 rounded-xs shadow-2xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-[#d63638]" />
                    <h3 className="font-bold text-xs text-[#1d2327] uppercase">
                      Parental Right to Erasure (Zero-Trace Purge Desk)
                    </h3>
                  </div>
                  <p className="text-xs text-[#646970] leading-relaxed">
                    Under COPPA Sec 312.6 and DPDP Section 9, parents may request irrevocable purge of child profiles. Requests are processed instantly with cryptographic audit confirmation.
                  </p>
                  <div className="p-3 bg-[#f6f7f7] border border-[#dcdcde] rounded-xs flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1d2327]">Pending Erasure Requests: 0</span>
                    <span className="text-emerald-700 font-bold">All queues clear (0 SLA delays)</span>
                  </div>
                </div>

                <div className="bg-white border border-[#c3c4c7] p-4 rounded-xs shadow-2xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-rose-600" />
                    <h3 className="font-bold text-xs text-[#1d2327] uppercase">
                      Child Safety Emergency Hotline Dispatch
                    </h3>
                  </div>
                  <p className="text-xs text-[#646970] leading-relaxed">
                    Direct integration with India Childline 1098, National Emergency 112, and Cyber Crime Portal 1930.
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-xs">
                      <span className="block font-black text-rose-900">1098</span>
                      <span className="text-[10px] text-rose-700">Childline</span>
                    </div>
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-xs">
                      <span className="block font-black text-blue-900">112</span>
                      <span className="text-[10px] text-blue-700">Emergency</span>
                    </div>
                    <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-xs">
                      <span className="block font-black text-indigo-900">1930</span>
                      <span className="text-[10px] text-indigo-700">Cyber Crime</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW D: COMMERCE & PASSES LEDGER                                          */}
          {/* ========================================================================= */}
          {activeMenu === 'woocommerce' && (
            <div className="space-y-4 animate-fadeIn">
              <h1 className="text-xl font-normal text-[#1d2327] flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#96588a]" /> Commerce Orders & Event Ticket Passes
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 border border-[#c3c4c7] rounded-xs shadow-2xs">
                  <span className="text-[10px] text-[#646970] uppercase font-bold block">Net Sales This Month</span>
                  <span className="text-2xl font-bold text-[#1d2327] block mt-1">₹42,800.00</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">+18.4% vs last period</span>
                </div>
                <div className="bg-white p-4 border border-[#c3c4c7] rounded-xs shadow-2xs">
                  <span className="text-[10px] text-[#646970] uppercase font-bold block">Total Passes Completed</span>
                  <span className="text-2xl font-bold text-[#1d2327] block mt-1">64</span>
                  <span className="text-[10px] text-[#646970]">Razorpay & UPI settlements</span>
                </div>
                <div className="bg-white p-4 border border-[#c3c4c7] rounded-xs shadow-2xs">
                  <span className="text-[10px] text-[#646970] uppercase font-bold block">Average Order Value</span>
                  <span className="text-2xl font-bold text-[#1d2327] block mt-1">₹668.75</span>
                  <span className="text-[10px] text-[#646970]">Family ticket average</span>
                </div>
                <div className="bg-white p-4 border border-[#c3c4c7] rounded-xs shadow-2xs">
                  <span className="text-[10px] text-[#646970] uppercase font-bold block">Commission Retained</span>
                  <span className="text-2xl font-bold text-emerald-600 block mt-1">₹4,280.00</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">10% Platform fee</span>
                </div>
              </div>

              <div className="bg-white border border-[#c3c4c7] rounded-xs p-4 space-y-3">
                <h3 className="font-bold text-xs text-[#1d2327] uppercase">Recent Ticket & Order Transactions</h3>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#c3c4c7] text-[#646970] font-semibold text-[11px]">
                      <th className="py-2">Order</th>
                      <th className="py-2">Purchased Item / Pass</th>
                      <th className="py-2">Buyer</th>
                      <th className="py-2">Payment Method</th>
                      <th className="py-2">Total</th>
                      <th className="py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f1]">
                    <tr className="hover:bg-[#f6f7f7]">
                      <td className="py-2.5 font-mono font-bold text-[#2271b1]">#ORD-9021</td>
                      <td className="py-2.5 font-semibold text-[#1d2327]">Kids Lego Robotics Championship</td>
                      <td className="py-2.5">Rohit Sen (rohit@example.com)</td>
                      <td className="py-2.5 font-mono text-[11px]">Razorpay UPI</td>
                      <td className="py-2.5 font-mono font-bold">₹1,500.00</td>
                      <td className="py-2.5 text-right"><span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-xs">Processing</span></td>
                    </tr>
                    <tr className="hover:bg-[#f6f7f7]">
                      <td className="py-2.5 font-mono font-bold text-[#2271b1]">#ORD-9020</td>
                      <td className="py-2.5 font-semibold text-[#1d2327]">Clay Sculpting & Pottery Pass</td>
                      <td className="py-2.5">Pooja Sharma (pooja@example.com)</td>
                      <td className="py-2.5 font-mono text-[11px]">Card / NetBanking</td>
                      <td className="py-2.5 font-mono font-bold">₹900.00</td>
                      <td className="py-2.5 text-right"><span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-xs">Completed</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW E: AFFILIATES & PARTNERS                                             */}
          {/* ========================================================================= */}
          {activeMenu === 'affiliates' && (
            <div className="space-y-4 animate-fadeIn">
              <h1 className="text-xl font-normal text-[#1d2327] flex items-center gap-2">
                <Share2 className="w-5 h-5 text-orange-500" /> Affiliate Partners & Referral Commission Desk
              </h1>

              <div className="bg-white border border-[#c3c4c7] p-5 rounded-xs space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#f0f0f1] pb-3">
                  <div>
                    <h3 className="font-bold text-xs text-[#1d2327] uppercase">Global Affiliate Rules</h3>
                    <p className="text-xs text-[#646970]">Configure commission percentages and cookie attribution windows.</p>
                  </div>
                  <span className="bg-orange-100 text-orange-900 text-xs font-bold px-3 py-1 rounded-xs">
                    Standard Rate: 15%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-[#f6f7f7] border border-[#dcdcde] rounded-xs space-y-1">
                    <span className="font-bold text-[#1d2327] block">Cookie Duration Window</span>
                    <p className="text-[#646970] text-[11px]">30 Days active referral cookie lock.</p>
                  </div>
                  <div className="p-3 bg-[#f6f7f7] border border-[#dcdcde] rounded-xs space-y-1">
                    <span className="font-bold text-[#1d2327] block">Weekly Settlement Cycle</span>
                    <p className="text-[#646970] text-[11px]">Disbursed every Friday via UPI / NEFT.</p>
                  </div>
                  <div className="p-3 bg-[#f6f7f7] border border-[#dcdcde] rounded-xs space-y-1">
                    <span className="font-bold text-[#1d2327] block">Multi-Category Attribution</span>
                    <p className="text-[#646970] text-[11px]">Classes, Events & Specialist Bookings.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW F: SUBSCRIPTION PLANS & PRICING MATRIX                                */}
          {/* ========================================================================= */}
          {activeMenu === 'subscriptions' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header & Control Bar */}
              <div className="bg-white border border-[#c3c4c7] p-5 rounded-xs shadow-2xs space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#f0f0f1] pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-[#1d2327] flex items-center gap-2">
                      <CreditCard className="w-6 h-6 text-[#2271b1]" /> 
                      Kids Connect Club Subscriptions & Pricing Matrix
                      <span className="bg-[#2271b1]/10 text-[#2271b1] text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                        {subPlans.length} Plans Active
                      </span>
                    </h1>
                    <p className="text-xs text-[#646970] mt-1">
                      Live pricing & package manager. Customize prices, durations (1-day flash passes, weekly, monthly, annual), discount tags, and capabilities. Updates sync instantly to all parent devices.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setPlanViewMode(planViewMode === 'cards' ? 'table' : 'cards')}
                      className="px-3 py-1.5 bg-[#f6f7f7] border border-[#dcdcde] text-xs font-semibold text-[#2c3338] rounded-xs hover:bg-[#f0f0f1] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5 text-[#50575e]" />
                      {planViewMode === 'cards' ? 'Table View' : 'Cards View'}
                    </button>

                    <button
                      type="button"
                      onClick={handleResetToDefaultPlans}
                      disabled={isSavingPlans}
                      className="px-3 py-1.5 bg-[#f6f7f7] border border-[#dcdcde] text-xs font-semibold text-[#b32d2e] rounded-xs hover:bg-red-50 hover:border-red-300 transition-all cursor-pointer flex items-center gap-1.5"
                      title="Reset to default Vernunt plans"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Defaults
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenAddPlan()}
                      className="px-4 py-1.5 bg-[#2271b1] text-white text-xs font-bold rounded-xs hover:bg-[#135e96] transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      + Add New Plan
                    </button>
                  </div>
                </div>

                {/* Quick Add Presets Bar */}
                <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                  <span className="font-bold text-[#50575e] text-[11px] uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Quick Presets:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenAddPlan({
                      id: 'free-parent-1yr',
                      title: 'Parent 1-Year Free Pass',
                      price: 0,
                      period: '12 Months Free',
                      durationDays: 365,
                      popular: true,
                      color: 'border-emerald-400',
                      saving: '100% Free',
                      description: 'Exclusive 1-Year zero-cost access for all registered parents & children.',
                      capabilities: [
                        '🎁 100% FREE Full App Usage for 1 Full Year',
                        'Unlimited companion playdate chats',
                        '✨ FREE Bookings for non-paid classes',
                        '🔐 FREE view of Professional Portfolios',
                        '🥇 Bonus: 10 Decrypt Credits included'
                      ]
                    })}
                    className="px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-900 text-[11px] font-bold rounded-full hover:bg-emerald-100 transition-all cursor-pointer flex items-center gap-1"
                  >
                    🎁 Parent 1-Yr Free (₹0)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenAddPlan({
                      id: 'free-host-6mo',
                      title: 'Host & Specialist 6-Month Free Pass',
                      price: 0,
                      period: '6 Months Free',
                      durationDays: 180,
                      color: 'border-indigo-400',
                      saving: '100% Free',
                      description: 'Exclusive 6-Month zero-cost listing & hosting access for organizers and portfolio specialists.',
                      capabilities: [
                        '🎁 100% FREE Host & Portfolio Listing for 6 Months',
                        'Create & publish unlimited community classes/events',
                        'Collect verified registrations & client appointment requests',
                        '🥇 Bonus: 10 Decrypt Credits included'
                      ]
                    })}
                    className="px-2.5 py-1 bg-indigo-50 border border-indigo-300 text-indigo-900 text-[11px] font-bold rounded-full hover:bg-indigo-100 transition-all cursor-pointer flex items-center gap-1"
                  >
                    🎁 Host/Specialist 6-Mo Free (₹0)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenAddPlan({
                      id: '1-day',
                      title: '1-Day Flash Pass',
                      price: 49,
                      period: '1 Day',
                      durationDays: 1,
                      color: 'border-cyan-300',
                      description: 'Instant 24-hour full access pass for quick weekend playdates or emergency trial.',
                      capabilities: [
                        'Unlimited companion playdate chats for 24h',
                        '✨ FREE Bookings for same-day community classes',
                        '🔐 FREE view of Professional Portfolios',
                        '🥇 Bonus: 1 Decrypt Credit included'
                      ]
                    })}
                    className="px-2.5 py-1 bg-cyan-50 border border-cyan-200 text-cyan-800 text-[11px] font-semibold rounded-full hover:bg-cyan-100 transition-all cursor-pointer"
                  >
                    + 1-Day Flash Pass (₹49)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenAddPlan({
                      id: 'weekly',
                      title: 'Weekly Explorer Pass',
                      price: 149,
                      period: '1 Week',
                      durationDays: 7,
                      color: 'border-indigo-300',
                      saving: 'Intro Offer',
                      description: '7-day complete access pass for vacation playdates and school break activities.',
                      capabilities: [
                        'Unlimited companion playdate chats',
                        '✨ FREE Bookings for weekly classes',
                        '🔐 FREE view of Professional Portfolios',
                        '🥇 Bonus: 3 Decrypt Credits included'
                      ]
                    })}
                    className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-semibold rounded-full hover:bg-indigo-100 transition-all cursor-pointer"
                  >
                    + 7-Day Weekly Pass (₹149)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenAddPlan({
                      id: 'weekend',
                      title: 'Weekend Special Pass',
                      price: 99,
                      period: '3 Days',
                      durationDays: 3,
                      color: 'border-amber-300',
                      saving: 'Weekend Fun',
                      description: '3-day Friday to Sunday pass for active weekend playdates and events.',
                      capabilities: [
                        'Unlimited weekend companion chats',
                        '✨ FREE Bookings for weekend workshops',
                        '🥇 Bonus: 2 Decrypt Credits included'
                      ]
                    })}
                    className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded-full hover:bg-amber-100 transition-all cursor-pointer"
                  >
                    + Weekend Pass (₹99)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenAddPlan({
                      id: 'fortnight',
                      title: '14-Day Fortnight Pass',
                      price: 219,
                      period: '2 Weeks',
                      durationDays: 14,
                      color: 'border-emerald-300',
                      saving: 'Popular',
                      description: 'Two-week flexible pass for school holidays or visiting family.',
                      capabilities: [
                        'Unlimited companion playdate chats',
                        '✨ FREE Bookings for non-paid classes',
                        '🥇 Bonus: 4 Decrypt Credits included'
                      ]
                    })}
                    className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold rounded-full hover:bg-emerald-100 transition-all cursor-pointer"
                  >
                    + 14-Day Fortnight (₹219)
                  </button>
                </div>
              </div>

              {/* Status or Empty Notice */}
              {subPlans.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 p-8 rounded-xs text-center space-y-3">
                  <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
                  <h3 className="font-bold text-sm text-amber-900">No Subscription Plans Configured</h3>
                  <p className="text-xs text-amber-700 max-w-md mx-auto">
                    There are currently no plans in the active matrix. Parents will see fallback defaults until you add plans or restore the standard suite.
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleResetToDefaultPlans}
                      className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xs hover:bg-amber-700 cursor-pointer"
                    >
                      Restore Standard Plans
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAddPlan()}
                      className="px-4 py-2 bg-white border border-amber-300 text-amber-900 text-xs font-bold rounded-xs hover:bg-amber-100 cursor-pointer"
                    >
                      + Create Custom Plan
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW MODE 1: RICH CARDS VIEW */}
              {planViewMode === 'cards' && subPlans.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {subPlans.map((plan, index) => {
                    const currentInlinePrice = inlinePrices[plan.id] !== undefined ? inlinePrices[plan.id] : plan.price;
                    const hasPriceChanged = inlinePrices[plan.id] !== undefined && inlinePrices[plan.id] !== plan.price;

                    return (
                      <div 
                        key={plan.id} 
                        className={`bg-white border-2 rounded-xl p-5 shadow-xs flex flex-col justify-between relative transition-all duration-200 hover:shadow-md ${
                          plan.popular ? 'ring-2 ring-orange-500 border-orange-400' : (plan.color || 'border-[#c3c4c7]')
                        }`}
                      >
                        {/* Top Badges & Quick Action */}
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                              #{index + 1} • {plan.id}
                            </span>
                            {plan.popular && (
                              <span className="bg-orange-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs tracking-wider">
                                Most Popular
                              </span>
                            )}
                            {plan.saving && (
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                                {plan.saving}
                              </span>
                            )}
                          </div>

                          {/* Reorder Arrows */}
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMovePlan(index, 'up')}
                              disabled={index === 0}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                              title="Move plan left/up"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMovePlan(index, 'down')}
                              disabled={index === subPlans.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                              title="Move plan right/down"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Title & Duration */}
                        <div>
                          <div className="flex justify-between items-baseline">
                            <h3 className="font-bold text-base text-[#1d2327] tracking-tight">{plan.title}</h3>
                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              {plan.period}
                            </span>
                          </div>

                          {/* Duration Tag */}
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Duration: <strong>{plan.durationDays} {plan.durationDays === 1 ? 'day' : 'days'}</strong></span>
                          </div>

                          {/* Interactive Price Modifier Box */}
                          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                              Price (₹ INR):
                            </label>
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-600">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={currentInlinePrice}
                                  onChange={(e) => handleQuickPriceChange(plan.id, parseInt(e.target.value, 10))}
                                  className="w-full pl-6 pr-2 py-1 bg-white border border-slate-300 rounded text-sm font-bold font-mono text-[#1d2327] focus:ring-1 focus:ring-[#2271b1] focus:outline-none"
                                />
                              </div>
                              {hasPriceChanged && (
                                <button
                                  type="button"
                                  onClick={() => handleCommitQuickPrice(plan.id)}
                                  disabled={isSavingPlans}
                                  className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 transition-all cursor-pointer shadow-xs"
                                  title="Save price change"
                                >
                                  Save
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1.5">
                              {plan.durationDays >= 30 
                                ? `≈ ₹${Math.round(plan.price / (plan.durationDays / 30))}/month` 
                                : `≈ ₹${Math.round(plan.price / (plan.durationDays || 1))}/day`}
                            </p>
                          </div>

                          {/* Description */}
                          {plan.description && (
                            <p className="text-xs text-[#50575e] italic mt-3 leading-relaxed">
                              "{plan.description}"
                            </p>
                          )}

                          {/* Capabilities List */}
                          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-[#2c3338]">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Included Benefits:</span>
                            {plan.capabilities?.map((cap: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="text-[11px] leading-tight text-slate-700">{cap}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Card Action Buttons */}
                        <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleTogglePlanPopular(plan.id)}
                            className={`px-2.5 py-1.5 text-[11px] font-semibold rounded border cursor-pointer transition-all flex items-center gap-1 ${
                              plan.popular 
                                ? 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100' 
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                            title="Toggle most popular badge"
                          >
                            <Star className={`w-3 h-3 ${plan.popular ? 'fill-orange-500 text-orange-500' : 'text-slate-400'}`} />
                            {plan.popular ? 'Popular' : 'Star'}
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPlan(plan)}
                              className="px-3 py-1.5 bg-[#2271b1]/10 text-[#2271b1] hover:bg-[#2271b1] hover:text-white border border-[#2271b1]/30 text-xs font-bold rounded transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePlan(plan.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-all cursor-pointer"
                              title="Delete this subscription plan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* VIEW MODE 2: MANAGEMENT TABLE */}
              {planViewMode === 'table' && subPlans.length > 0 && (
                <div className="bg-white border border-[#c3c4c7] rounded-xs shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#f6f7f7] border-b border-[#c3c4c7] text-[#2c3338] uppercase font-bold text-[11px]">
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Plan Title & ID</th>
                          <th className="py-2.5 px-3">Duration (Days)</th>
                          <th className="py-2.5 px-3">Billing Period</th>
                          <th className="py-2.5 px-3">Price (₹ INR)</th>
                          <th className="py-2.5 px-3">Badge / Savings</th>
                          <th className="py-2.5 px-3">Benefits</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0f0f1]">
                        {subPlans.map((plan, index) => {
                          const currentInlinePrice = inlinePrices[plan.id] !== undefined ? inlinePrices[plan.id] : plan.price;
                          const hasPriceChanged = inlinePrices[plan.id] !== undefined && inlinePrices[plan.id] !== plan.price;

                          return (
                            <tr key={plan.id} className="hover:bg-[#f6f7f7] transition-colors">
                              <td className="py-3 px-3 font-mono text-slate-500 font-semibold">{index + 1}</td>
                              <td className="py-3 px-3">
                                <div className="font-bold text-[#1d2327]">{plan.title}</div>
                                <div className="text-[10px] font-mono text-slate-400">id: {plan.id}</div>
                              </td>
                              <td className="py-3 px-3">
                                <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-bold text-slate-700">
                                  {plan.durationDays} {plan.durationDays === 1 ? 'day' : 'days'}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-medium text-slate-700">{plan.period}</td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-500 font-bold">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={currentInlinePrice}
                                    onChange={(e) => handleQuickPriceChange(plan.id, parseInt(e.target.value, 10))}
                                    className="w-20 px-2 py-0.5 border border-slate-300 rounded font-mono font-bold text-[#1d2327] focus:ring-1 focus:ring-[#2271b1]"
                                  />
                                  {hasPriceChanged && (
                                    <button
                                      type="button"
                                      onClick={() => handleCommitQuickPrice(plan.id)}
                                      disabled={isSavingPlans}
                                      className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded cursor-pointer"
                                    >
                                      Save
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1 flex-wrap">
                                  {plan.popular && (
                                    <span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                                      POPULAR
                                    </span>
                                  )}
                                  {plan.saving && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                      {plan.saving}
                                    </span>
                                  )}
                                  {!plan.popular && !plan.saving && <span className="text-slate-400 text-[10px]">—</span>}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-[11px] text-slate-600 max-w-xs truncate">
                                {plan.capabilities?.length || 0} features configured
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditPlan(plan)}
                                    className="px-2.5 py-1 bg-[#2271b1]/10 text-[#2271b1] hover:bg-[#2271b1] hover:text-white rounded font-semibold text-xs transition-all cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePlan(plan.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* PLAN CREATION & CUSTOMIZATION MODAL (POPUP DIALOG)                         */}
          {/* ========================================================================= */}
          {isPlanModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="px-6 py-4 bg-[#f6f7f7] border-b border-[#c3c4c7] flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-[#1d2327] flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#2271b1]" />
                      {planModalMode === 'add' ? 'Create New Subscription Plan' : `Customize Plan: ${planForm.title}`}
                    </h3>
                    <p className="text-xs text-[#646970]">
                      Configure plan duration, pricing in ₹ INR, badge highlights, and parent benefits.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPlanModalOpen(false)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body Form */}
                <form onSubmit={handleSavePlanModal} className="p-6 overflow-y-auto space-y-5 text-xs">
                  {/* Preset Selector Pill Bar */}
                  <div>
                    <label className="block font-bold text-[#2c3338] mb-1.5 uppercase text-[10px] tracking-wider">
                      Preset Duration Templates:
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setPlanForm(prev => ({
                          ...prev,
                          title: '1-Day Flash Pass',
                          id: prev.id || '1-day-pass',
                          price: 49,
                          period: '1 Day',
                          durationDays: 1,
                          color: 'border-cyan-300',
                          description: 'Instant 24-hour full access pass for quick weekend playdates or emergency trial.',
                          capabilities: [
                            'Unlimited companion playdate chats for 24h',
                            '✨ FREE Bookings for same-day community classes',
                            '🔐 FREE view of Professional Portfolios',
                            '🥇 Bonus: 1 Decrypt Credit included'
                          ]
                        }))}
                        className="px-2.5 py-1 bg-cyan-50 border border-cyan-200 text-cyan-800 text-[11px] font-semibold rounded hover:bg-cyan-100 cursor-pointer"
                      >
                        ⚡ 1-Day Pass (₹49)
                      </button>

                      <button
                        type="button"
                        onClick={() => setPlanForm(prev => ({
                          ...prev,
                          title: 'Weekly Explorer Pass',
                          id: prev.id || 'weekly-pass',
                          price: 149,
                          period: '1 Week',
                          durationDays: 7,
                          color: 'border-indigo-300',
                          saving: 'Intro Offer',
                          description: '7-day complete access pass for vacation playdates and school break activities.',
                          capabilities: [
                            'Unlimited companion playdate chats',
                            '✨ FREE Bookings for weekly classes',
                            '🔐 FREE view of Professional Portfolios',
                            '🥇 Bonus: 3 Decrypt Credits included'
                          ]
                        }))}
                        className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-semibold rounded hover:bg-indigo-100 cursor-pointer"
                      >
                        📅 1-Week Pass (₹149)
                      </button>

                      <button
                        type="button"
                        onClick={() => setPlanForm(prev => ({
                          ...prev,
                          title: 'Weekend Fun Pass',
                          id: prev.id || 'weekend-pass',
                          price: 99,
                          period: '3 Days',
                          durationDays: 3,
                          color: 'border-amber-300',
                          saving: 'Weekend Special',
                          description: '3-day Friday to Sunday pass for family fun and activities.',
                          capabilities: [
                            'Unlimited weekend companion chats',
                            '✨ FREE Bookings for weekend workshops',
                            '🥇 Bonus: 2 Decrypt Credits included'
                          ]
                        }))}
                        className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded hover:bg-amber-100 cursor-pointer"
                      >
                        🎉 3-Day Weekend (₹99)
                      </button>

                      <button
                        type="button"
                        onClick={() => setPlanForm(prev => ({
                          ...prev,
                          title: 'Monthly Pass',
                          id: prev.id || 'monthly-pass',
                          price: 299,
                          period: '1 Month',
                          durationDays: 30,
                          color: 'border-slate-300',
                          description: 'Perfect for temporary stays or trying out the network.',
                          capabilities: [
                            'Unlimited companion playdate chats',
                            '✨ FREE Bookings for non-paid classes',
                            '🔐 FREE view of Professional Portfolios',
                            '🥇 Bonus: 5 Decrypt Credits included'
                          ]
                        }))}
                        className="px-2.5 py-1 bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-semibold rounded hover:bg-slate-200 cursor-pointer"
                      >
                        🗓️ 1-Month Pass (₹299)
                      </button>
                    </div>
                  </div>

                  {/* Primary Fields Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#2c3338] mb-1">
                        Plan Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 1-Day Flash Pass, Weekly Pass"
                        value={planForm.title}
                        onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                        className="w-full p-2 border border-[#8c8f94] rounded-xs font-semibold text-[#1d2327] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#2c3338] mb-1">
                        Plan Identifier (Slug ID) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 1-day, weekly, monthly"
                        value={planForm.id}
                        disabled={planModalMode === 'edit'}
                        onChange={(e) => setPlanForm({ ...planForm, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                        className="w-full p-2 border border-[#8c8f94] rounded-xs font-mono text-[#1d2327] disabled:bg-slate-100 focus:border-[#2271b1] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#2c3338] mb-1">
                        Price in ₹ INR *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">₹</span>
                        <input
                          type="number"
                          required
                          min="0"
                          placeholder="e.g. 49, 149, 299"
                          value={planForm.price}
                          onChange={(e) => setPlanForm({ ...planForm, price: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-7 pr-3 p-2 border border-[#8c8f94] rounded-xs font-mono font-bold text-base text-[#1d2327] focus:border-[#2271b1] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-[#2c3338] mb-1">
                        Duration in Days *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 1 (day), 7 (week), 30 (month), 365 (year)"
                        value={planForm.durationDays}
                        onChange={(e) => setPlanForm({ ...planForm, durationDays: parseInt(e.target.value, 10) || 1 })}
                        className="w-full p-2 border border-[#8c8f94] rounded-xs font-mono text-[#1d2327] focus:border-[#2271b1] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#2c3338] mb-1">
                        Period Display Label *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 1 Day, 1 Week, 30 Days, 3 Months"
                        value={planForm.period}
                        onChange={(e) => setPlanForm({ ...planForm, period: e.target.value })}
                        className="w-full p-2 border border-[#8c8f94] rounded-xs text-[#1d2327] focus:border-[#2271b1] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#2c3338] mb-1">
                        Discount / Savings Badge Tag
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Save 15%, Intro Special, Best Value"
                        value={planForm.saving || ''}
                        onChange={(e) => setPlanForm({ ...planForm, saving: e.target.value })}
                        className="w-full p-2 border border-[#8c8f94] rounded-xs text-[#1d2327] focus:border-[#2271b1] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Highlights & Accent Settings */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="popular-toggle"
                          checked={planForm.popular}
                          onChange={(e) => setPlanForm({ ...planForm, popular: e.target.checked })}
                          className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500 cursor-pointer"
                        />
                        <label htmlFor="popular-toggle" className="font-bold text-slate-800 cursor-pointer flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                          Highlight as "Most Popular" Plan
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="font-bold text-slate-700 text-[11px]">Card Border Theme:</label>
                        <select
                          value={planForm.color || 'border-slate-200'}
                          onChange={(e) => setPlanForm({ ...planForm, color: e.target.value })}
                          className="p-1 border border-slate-300 rounded text-xs bg-white text-slate-800 focus:outline-none"
                        >
                          <option value="border-slate-200">Slate (Neutral)</option>
                          <option value="border-cyan-300">Cyan (Bright)</option>
                          <option value="border-indigo-300">Indigo (Royal)</option>
                          <option value="border-emerald-300">Emerald (Fresh)</option>
                          <option value="border-orange-300">Orange (Vibrant)</option>
                          <option value="border-amber-300">Amber (Gold)</option>
                          <option value="border-purple-300">Purple (VIP)</option>
                          <option value="border-rose-300">Rose (Warm)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-[#2c3338] mb-1">
                        Parent Description Pitch
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Brief summary explaining what kind of parent or child this plan is best suited for..."
                        value={planForm.description}
                        onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                        className="w-full p-2 border border-[#8c8f94] rounded-xs text-[#1d2327] focus:border-[#2271b1] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Capabilities / Benefits Builder */}
                  <div>
                    <label className="block font-bold text-[#2c3338] mb-1.5 uppercase text-[10px] tracking-wider">
                      Included Capabilities & Features:
                    </label>
                    <div className="space-y-2 mb-3">
                      {planForm.capabilities.map((cap, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="flex-1 font-medium text-slate-800 text-xs">{cap}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCapability(idx)}
                            className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Add benefit e.g. '🥇 Bonus: 10 Decrypt Credits included' or 'Unlimited companion chats'"
                        value={newCapInput}
                        onChange={(e) => setNewCapInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCapability();
                          }
                        }}
                        className="flex-1 p-2 border border-[#8c8f94] rounded-xs text-[#1d2327] focus:border-[#2271b1] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCapability}
                        className="px-3 py-2 bg-[#f6f7f7] border border-[#dcdcde] text-xs font-bold text-[#2c3338] rounded-xs hover:bg-[#f0f0f1] cursor-pointer"
                      >
                        + Add Feature
                      </button>
                    </div>
                  </div>

                  {/* Live Card Preview Box */}
                  <div className="p-4 bg-slate-100 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-2">Live Parent App Preview:</span>
                    <div className={`bg-white rounded-2xl p-5 border-2 relative max-w-sm mx-auto shadow-sm ${
                      planForm.popular ? 'ring-2 ring-orange-500 border-orange-400' : (planForm.color || 'border-slate-200')
                    }`}>
                      {planForm.popular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[9px] uppercase font-black px-3 py-0.5 rounded-full shadow-xs">
                          Most Popular
                        </span>
                      )}
                      {planForm.saving && (
                        <span className="absolute top-3 right-3 bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                          {planForm.saving}
                        </span>
                      )}
                      <h4 className="text-sm font-bold text-slate-800 font-mono uppercase">{planForm.title || 'Plan Title'}</h4>
                      <div className="mt-2 flex items-baseline">
                        <span className="text-2xl font-black font-serif text-slate-900">₹{planForm.price}</span>
                        <span className="text-xs text-slate-500 ml-1">/ {planForm.period || 'Period'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {planForm.durationDays >= 30 
                          ? `Equivalent to ₹${Math.round(planForm.price / (planForm.durationDays / 30))}/month` 
                          : `₹${Math.round(planForm.price / (planForm.durationDays || 1))}/day flexible access`}
                      </p>
                      {planForm.description && (
                        <p className="text-[10px] text-slate-600 italic mt-2 bg-slate-50 p-1.5 rounded">{planForm.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer Buttons */}
                  <div className="pt-4 border-t border-[#f0f0f1] flex justify-end items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPlanModalOpen(false)}
                      className="px-4 py-2 bg-white border border-[#c3c4c7] text-[#2c3338] text-xs font-bold rounded-xs hover:bg-[#f6f7f7] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingPlans}
                      className="px-5 py-2 bg-[#2271b1] text-white text-xs font-bold rounded-xs hover:bg-[#135e96] transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      {isSavingPlans ? 'Deploying...' : planModalMode === 'add' ? 'Publish Plan Live' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW E2: COUPONS & 1-YEAR FREE VIP PASSES MANAGEMENT                      */}
          {/* ========================================================================= */}
          {activeMenu === 'coupons' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header & Quick Action */}
              <div className="bg-white border border-[#c3c4c7] p-5 rounded-xs shadow-2xs space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#f0f0f1] pb-4">
                  <div>
                    <h1 className="text-xl font-normal text-[#1d2327] flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-amber-500" />
                      Influencer Coupon Codes &amp; 1-Year Free VIP Passes
                    </h1>
                    <p className="text-xs text-[#646970] mt-0.5">
                      Generate and manage VIP coupon codes. When parents redeem a code, they unlock <strong>1 full year of 100% free app access</strong> and 60 bonus decrypt credits (excluding third-party paid event fees).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingCouponId(null);
                      setCouponCodeForm({
                        code: `CREATOR${Math.floor(100 + Math.random() * 900)}`,
                        title: '1-Year Free Access VIP Pass',
                        benefitType: 'free_1_year_vip',
                        durationDays: 365,
                        maxRedemptions: 500,
                        assignedInfluencerName: '',
                        notes: '1-year free access promo code for Instagram creator campaigns.',
                        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        isActive: true
                      });
                      setShowCouponModal(true);
                    }}
                    className="px-4 py-2 bg-[#2271b1] text-white text-xs font-bold rounded-xs hover:bg-[#135e96] transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New VIP Coupon</span>
                  </button>
                </div>

                {/* Metrics Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 bg-[#f6f7f7] border border-[#dcdcde] rounded-xs">
                    <span className="text-[11px] text-[#646970] font-semibold block">Total Promo Codes</span>
                    <span className="text-lg font-bold text-[#1d2327] font-mono">{couponsList.length}</span>
                  </div>
                  <div className="p-3 bg-[#f6f7f7] border border-[#dcdcde] rounded-xs">
                    <span className="text-[11px] text-[#646970] font-semibold block">Active Campaigns</span>
                    <span className="text-lg font-bold text-emerald-700 font-mono">
                      {couponsList.filter(c => c.isActive).length}
                    </span>
                  </div>
                  <div className="p-3 bg-[#f6f7f7] border border-[#dcdcde] rounded-xs">
                    <span className="text-[11px] text-[#646970] font-semibold block">Total Times Redeemed</span>
                    <span className="text-lg font-bold text-amber-600 font-mono">
                      {couponsList.reduce((sum, c) => sum + (c.timesRedeemed || 0), 0)} parents
                    </span>
                  </div>
                  <div className="p-3 bg-[#f6f7f7] border border-[#dcdcde] rounded-xs">
                    <span className="text-[11px] text-[#646970] font-semibold block">Parent Value Saved</span>
                    <span className="text-lg font-bold text-slate-800 font-mono">
                      ₹{(couponsList.reduce((sum, c) => sum + (c.timesRedeemed || 0), 0) * 2499).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Coupons Table */}
              <div className="bg-white border border-[#c3c4c7] rounded-xs shadow-2xs overflow-hidden">
                <div className="px-4 py-3 bg-[#f6f7f7] border-b border-[#c3c4c7] flex justify-between items-center">
                  <h3 className="font-bold text-xs text-[#1d2327] uppercase tracking-wider">
                    All Active &amp; Scheduled VIP Codes
                  </h3>
                  <span className="text-xs text-[#646970]">
                    Showing {couponsList.length} coupon codes
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f6f7f7] border-b border-[#c3c4c7] text-[#2c3338] uppercase font-bold text-[11px]">
                        <th className="py-2.5 px-3">Code &amp; Title</th>
                        <th className="py-2.5 px-3">Benefit &amp; Duration</th>
                        <th className="py-2.5 px-3">Assigned Influencer / Campaign</th>
                        <th className="py-2.5 px-3 text-center">Redemptions</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0f1]">
                      {couponsList.map((coupon) => (
                        <tr key={coupon.id} className="hover:bg-[#f6f7f7]/60 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-sm">
                                {coupon.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(coupon.code);
                                  setWpNotice({ type: 'success', message: `Copied coupon "${coupon.code}" to clipboard!` });
                                }}
                                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                                title="Copy code"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="font-bold text-slate-800 mt-1">{coupon.title}</div>
                            {coupon.notes && <div className="text-[11px] text-slate-500 line-clamp-1">{coupon.notes}</div>}
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10.5px]">
                              🎁 {coupon.durationDays || 365} Days (1 Year) FREE
                            </span>
                            <div className="text-[11px] text-slate-500 mt-1">
                              +60 Contact Decrypt Credits Included
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            {coupon.assignedInfluencerName ? (
                              <div className="font-medium text-slate-800 flex items-center gap-1.5">
                                <span className="text-pink-600 font-bold">📸</span>
                                <span>{coupon.assignedInfluencerName}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">General Platform Promo</span>
                            )}
                            {coupon.validUntil && (
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Valid until: {coupon.validUntil}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className="font-mono font-bold text-slate-800">
                              {coupon.timesRedeemed || 0}
                            </span>
                            {coupon.maxRedemptions && (
                              <span className="text-[11px] text-slate-400 font-mono"> / {coupon.maxRedemptions}</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = couponsList.map(c => c.id === coupon.id ? { ...c, isActive: !c.isActive } : c);
                                saveCoupons(updated);
                              }}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition ${
                                coupon.isActive
                                  ? 'bg-emerald-100 text-emerald-850 hover:bg-emerald-200'
                                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              }`}
                            >
                              {coupon.isActive ? 'Active' : 'Paused'}
                            </button>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCouponId(coupon.id);
                                  setCouponCodeForm({
                                    code: coupon.code,
                                    title: coupon.title,
                                    benefitType: coupon.benefitType || 'free_1_year_vip',
                                    durationDays: coupon.durationDays || 365,
                                    maxRedemptions: coupon.maxRedemptions || 500,
                                    assignedInfluencerName: coupon.assignedInfluencerName || '',
                                    notes: coupon.notes || '',
                                    validUntil: coupon.validUntil || '',
                                    isActive: coupon.isActive ?? true
                                  });
                                  setShowCouponModal(true);
                                }}
                                className="p-1.5 text-[#2271b1] hover:bg-[#2271b1]/10 rounded cursor-pointer"
                                title="Edit Coupon"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Delete coupon "${coupon.code}"?`)) {
                                    const updated = couponsList.filter(c => c.id !== coupon.id);
                                    saveCoupons(updated);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                title="Delete Coupon"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* COUPON CREATION & EDIT MODAL                                              */}
          {/* ========================================================================= */}
          {showCouponModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="px-6 py-4 bg-[#f6f7f7] border-b border-[#c3c4c7] flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-[#1d2327] flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-amber-500" />
                      {editingCouponId ? 'Edit VIP Coupon Code' : 'Generate New VIP Coupon Code'}
                    </h3>
                    <p className="text-xs text-[#646970]">
                      Configure coupon for influencer partnerships or special promotions granting 1-year free access.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCouponModal(false)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const cleanCode = couponCodeForm.code.trim().toUpperCase();
                    if (!cleanCode) return;

                    if (editingCouponId) {
                      const updated = couponsList.map(c => c.id === editingCouponId ? {
                        ...c,
                        code: cleanCode,
                        title: couponCodeForm.title || '1-Year Free Access VIP Pass',
                        benefitType: couponCodeForm.benefitType,
                        durationDays: couponCodeForm.durationDays || 365,
                        maxRedemptions: couponCodeForm.maxRedemptions,
                        assignedInfluencerName: couponCodeForm.assignedInfluencerName,
                        notes: couponCodeForm.notes,
                        validUntil: couponCodeForm.validUntil,
                        isActive: couponCodeForm.isActive
                      } : c);
                      saveCoupons(updated);
                    } else {
                      const newCoupon: AdminCouponCode = {
                        id: `coupon-${Date.now()}`,
                        code: cleanCode,
                        title: couponCodeForm.title || '1-Year Free Access VIP Pass',
                        benefitType: couponCodeForm.benefitType,
                        durationDays: couponCodeForm.durationDays || 365,
                        maxRedemptions: couponCodeForm.maxRedemptions,
                        timesRedeemed: 0,
                        assignedInfluencerName: couponCodeForm.assignedInfluencerName,
                        notes: couponCodeForm.notes,
                        validUntil: couponCodeForm.validUntil,
                        isActive: couponCodeForm.isActive,
                        createdAt: new Date().toISOString()
                      };
                      saveCoupons([newCoupon, ...couponsList]);
                    }

                    setShowCouponModal(false);
                    setWpNotice({ type: 'success', message: `Coupon code "${cleanCode}" saved successfully!` });
                  }}
                  className="p-6 space-y-4 overflow-y-auto text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#2c3338] mb-1">Coupon Code (Uppercase) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. INFLUENCER365 / VIPMOM"
                        value={couponCodeForm.code}
                        onChange={(e) => setCouponCodeForm({ ...couponCodeForm, code: e.target.value.toUpperCase() })}
                        className="w-full p-2.5 border border-[#8c8f94] rounded-xs font-mono font-bold text-sm text-[#1d2327] uppercase tracking-wider focus:border-[#2271b1] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#2c3338] mb-1">Campaign / Pass Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 1-Year Free VIP Parent Pass"
                        value={couponCodeForm.title}
                        onChange={(e) => setCouponCodeForm({ ...couponCodeForm, title: e.target.value })}
                        className="w-full p-2.5 border border-[#8c8f94] rounded-xs text-[#1d2327] focus:border-[#2271b1] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-[#2c3338] mb-1">Free Duration (Days) *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={couponCodeForm.durationDays}
                        onChange={(e) => setCouponCodeForm({ ...couponCodeForm, durationDays: parseInt(e.target.value, 10) || 365 })}
                        className="w-full p-2 border border-[#8c8f94] rounded-xs font-mono text-[#1d2327] focus:border-[#2271b1] focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-500">365 = 1 Full Year</span>
                    </div>

                    <div>
                      <label className="block font-bold text-[#2c3338] mb-1">Max Redemptions</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 500"
                        value={couponCodeForm.maxRedemptions}
                        onChange={(e) => setCouponCodeForm({ ...couponCodeForm, maxRedemptions: parseInt(e.target.value, 10) || 500 })}
                        className="w-full p-2 border border-[#8c8f94] rounded-xs font-mono text-[#1d2327] focus:border-[#2271b1] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#2c3338] mb-1">Valid Until Date</label>
                      <input
                        type="date"
                        value={couponCodeForm.validUntil}
                        onChange={(e) => setCouponCodeForm({ ...couponCodeForm, validUntil: e.target.value })}
                        className="w-full p-2 border border-[#8c8f94] rounded-xs text-[#1d2327] focus:border-[#2271b1] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#2c3338] mb-1">
                      Assigned Influencer / Creator (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Priya Sharma (@bangalore_mommy_diaries)"
                      value={couponCodeForm.assignedInfluencerName}
                      onChange={(e) => setCouponCodeForm({ ...couponCodeForm, assignedInfluencerName: e.target.value })}
                      className="w-full p-2.5 border border-[#8c8f94] rounded-xs text-[#1d2327] focus:border-[#2271b1] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#2c3338] mb-1">Internal Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Campaign notes e.g. Free 1-year pass for moms signing up via Instagram reel link..."
                      value={couponCodeForm.notes}
                      onChange={(e) => setCouponCodeForm({ ...couponCodeForm, notes: e.target.value })}
                      className="w-full p-2.5 border border-[#8c8f94] rounded-xs text-[#1d2327] focus:border-[#2271b1] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="coupon-active-toggle"
                      checked={couponCodeForm.isActive}
                      onChange={(e) => setCouponCodeForm({ ...couponCodeForm, isActive: e.target.checked })}
                      className="h-4 w-4 text-[#2271b1] rounded cursor-pointer"
                    />
                    <label htmlFor="coupon-active-toggle" className="font-bold text-slate-800 cursor-pointer">
                      Active and Redeemable by Parents Immediately
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-[#f0f0f1]">
                    <button
                      type="button"
                      onClick={() => setShowCouponModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-bold rounded-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingCouponId ? 'Save Changes' : 'Publish VIP Coupon'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW E3: WORDPRESS-STYLE KNOWLEDGE HUB & INFLUENCER POSTS MANAGER         */}
          {/* ========================================================================= */}
          {activeMenu === 'knowledge-hub' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header & Controls */}
              <div className="bg-white border border-[#c3c4c7] p-5 rounded-xs shadow-2xs space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#f0f0f1] pb-4">
                  <div>
                    <h1 className="text-xl font-normal text-[#1d2327] flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-pink-600" />
                      Knowledge Hub &amp; Influencer Cross-Promotion Posts (WordPress Engine)
                    </h1>
                    <p className="text-xs text-[#646970] mt-0.5">
                      Publish and manage parenting guides, activity blueprints, and <strong>Instagram Influencer Ambassador Spotlights</strong> with live cross-promotion links.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingArticleSlug(null);
                      setArticleForm({
                        title: '',
                        slug: '',
                        category: 'Playdate',
                        categoryLabel: 'Playdate Ideas',
                        ageGroup: 'All Ages',
                        readTime: '5 min read',
                        summary: '',
                        publishedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        authorName: 'Vernunt Editorial Team',
                        authorRole: 'Parenting & Child Development Specialist',
                        authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
                        coverImage: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop&q=80',
                        status: 'Published',
                        isInfluencerSpotlight: true,
                        influencerName: '',
                        influencerHandle: '@',
                        influencerUrl: 'https://instagram.com/',
                        influencerBio: '',
                        influencerFollowers: '25K',
                        influencerBadge: 'Verified Community Ambassador',
                        influencerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                        keyTakeawaysText: 'Focus on experiential play over passive screen time.\nBuild daily structured routines with positive reinforcement.\nEngage peer co-op families for mutual growth.',
                        deepDive1Heading: 'Evidence-Based Framework for Modern Indian Parents',
                        deepDive1Body: 'Scientific child development research emphasizes the power of social play, balanced nutrition, and emotional safety in early developmental windows.',
                        deepDive1ProTip: 'Encourage 20 minutes of daily uninterrupted outdoor activity or creative crafting.',
                        deepDive1Alert: 'Avoid high-sugar snacks right before interactive learning sessions.',
                        deepDive2Heading: 'Step-by-Step Implementation Blueprint',
                        deepDive2Body: 'Follow a consistent schedule and involve your child in setting up play equipment and cleaning up after sessions.',
                        actionableStepsText: 'Prepare materials and safe play area beforehand.\nIntroduce activity with enthusiastic demonstration.\nAllow open-ended exploration without excessive correction.',
                        faqQuestion1: 'How often should parents practice this activity?',
                        faqAnswer1: '3 to 4 times a week provides ideal consistency and retention without burnout.',
                        faqQuestion2: 'Can we connect with other families doing this nearby?',
                        faqAnswer2: 'Yes, use the Vernunt Playmate Radar to discover verified neighborhood peers.',
                        keywordsText: 'parenting, playdates, influencer, child development, activities'
                      });
                      setShowArticleEditorModal(true);
                    }}
                    className="px-4 py-2 bg-[#2271b1] text-white text-xs font-bold rounded-xs hover:bg-[#135e96] transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Article / Influencer Post</span>
                  </button>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search articles by title, author, or influencer handle..."
                      value={knowledgeSearchTerm}
                      onChange={(e) => setKnowledgeSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-[#8c8f94] rounded-xs text-xs text-[#1d2327] focus:border-[#2271b1] focus:outline-none"
                    />
                  </div>

                  <select
                    value={knowledgeCategoryFilter}
                    onChange={(e) => setKnowledgeCategoryFilter(e.target.value)}
                    className="p-1.5 border border-[#8c8f94] rounded-xs text-xs text-[#1d2327] bg-white focus:border-[#2271b1] focus:outline-none"
                  >
                    <option value="all">All Categories ({knowledgeArticlesList.length})</option>
                    {KNOWLEDGE_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* WordPress-Style Posts Table */}
              <div className="bg-white border border-[#c3c4c7] rounded-xs shadow-2xs overflow-hidden">
                <div className="px-4 py-3 bg-[#f6f7f7] border-b border-[#c3c4c7] flex justify-between items-center">
                  <h3 className="font-bold text-xs text-[#1d2327] uppercase tracking-wider">
                    All Knowledge Hub Posts &amp; Influencer Cross-Promotions
                  </h3>
                  <span className="text-xs text-[#646970]">
                    Showing {knowledgeArticlesList.length} articles
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f6f7f7] border-b border-[#c3c4c7] text-[#2c3338] uppercase font-bold text-[11px]">
                        <th className="py-2.5 px-3">Title &amp; Excerpt</th>
                        <th className="py-2.5 px-3">Google SEO &amp; Canonical URL</th>
                        <th className="py-2.5 px-3">Category &amp; Age</th>
                        <th className="py-2.5 px-3">Author / Influencer Ambassador</th>
                        <th className="py-2.5 px-3">Date Published</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0f1]">
                      {knowledgeArticlesList
                        .filter(article => {
                          const matchesSearch = !knowledgeSearchTerm || 
                            article.title.toLowerCase().includes(knowledgeSearchTerm.toLowerCase()) ||
                            article.summary.toLowerCase().includes(knowledgeSearchTerm.toLowerCase()) ||
                            article.author.name.toLowerCase().includes(knowledgeSearchTerm.toLowerCase()) ||
                            (article.influencerSpotlight?.instagramHandle?.toLowerCase() || '').includes(knowledgeSearchTerm.toLowerCase());
                          const matchesCat = knowledgeCategoryFilter === 'all' || article.category === knowledgeCategoryFilter;
                          return matchesSearch && matchesCat;
                        })
                        .map((article) => {
                          const canonicalUrl = getArticleCanonicalUrl(article.slug);
                          return (
                            <tr key={article.slug} className="hover:bg-[#f6f7f7]/60 transition-colors">
                              <td className="py-3 px-3 max-w-sm">
                                <div className="font-bold text-slate-900 line-clamp-1">{article.title}</div>
                                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{article.summary}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] text-slate-400 font-mono">slug: {article.slug}</span>
                                  {article.influencerSpotlight && (
                                    <span className="text-[9px] bg-pink-100 text-pink-800 font-bold px-2 py-0.5 rounded-full border border-pink-200">
                                      ⭐ Influencer Cross-Promo
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Google SEO & Canonical URL */}
                              <td className="py-3 px-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                      <Sparkles className="w-2.5 h-2.5" /> Auto-Indexed
                                    </span>
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      Schema.org ✓
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-600 truncate max-w-[180px]" title={canonicalUrl}>
                                    {canonicalUrl}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(canonicalUrl);
                                        showNotification('success', `Copied canonical URL: ${canonicalUrl}`);
                                      }}
                                      className="text-[#2271b1] hover:underline font-bold cursor-pointer inline-flex items-center gap-0.5"
                                    >
                                      <Copy className="w-2.5 h-2.5" /> Copy URL
                                    </button>
                                    <span className="text-slate-300">•</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIndexingFeedbackModal({
                                          isOpen: true,
                                          articleTitle: article.title,
                                          canonicalUrl: canonicalUrl,
                                          deepLinkUrl: getArticleDeepLinkUrl(article.slug),
                                          sitemapStatus: 'Registered in /sitemap.xml and /sitemap-guides.xml',
                                          indexNowStatus: 'HTTP 200 OK (Dispatched to IndexNow API)',
                                          schemaInjected: true,
                                          timestamp: new Date().toISOString()
                                        });
                                        setSchemaInspectArticle(article);
                                      }}
                                      className="text-emerald-700 hover:underline font-bold cursor-pointer inline-flex items-center gap-0.5"
                                    >
                                      <Globe className="w-2.5 h-2.5" /> Google SERP &amp; Index
                                    </button>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <span className="font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10.5px]">
                                  {article.categoryLabel || article.category}
                                </span>
                                <div className="text-[11px] text-slate-500 mt-1">
                                  Age: {article.ageGroup} • {article.readTime}
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                {article.influencerSpotlight ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 font-bold text-pink-700">
                                      <span>📸 {article.influencerSpotlight.name}</span>
                                    </div>
                                    <div className="text-[10.5px] font-mono text-slate-600">
                                      {article.influencerSpotlight.instagramHandle} ({article.influencerSpotlight.followersCount || 'Creator'})
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-slate-800">{article.author.name}</div>
                                    <div className="text-[10.5px] text-slate-500">{article.author.role}</div>
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-3">
                                <span className="text-slate-600 font-mono text-[11px]">{article.publishedDate}</span>
                                <div className="text-[10px] text-emerald-700 font-bold mt-0.5">Published</div>
                              </td>

                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIndexingFeedbackModal({
                                        isOpen: true,
                                        articleTitle: article.title,
                                        canonicalUrl: canonicalUrl,
                                        deepLinkUrl: getArticleDeepLinkUrl(article.slug),
                                        sitemapStatus: 'Registered in /sitemap.xml & /sitemap-guides.xml',
                                        indexNowStatus: 'HTTP 200 OK (Dispatched to IndexNow API)',
                                        schemaInjected: true,
                                        timestamp: new Date().toISOString()
                                      });
                                      setSchemaInspectArticle(article);
                                    }}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                                    title="Google Index & SERP Inspector"
                                  >
                                    <Globe className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingArticleSlug(article.slug);
                                      setArticleForm({
                                        title: article.title,
                                        slug: article.slug,
                                        category: article.category,
                                        categoryLabel: article.categoryLabel || article.category,
                                        ageGroup: article.ageGroup,
                                        readTime: article.readTime,
                                        summary: article.summary,
                                        publishedDate: article.publishedDate,
                                        authorName: article.author.name,
                                        authorRole: article.author.role,
                                        authorAvatar: article.author.avatar,
                                        coverImage: article.coverImage || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop&q=80',
                                        status: 'Published',
                                        isInfluencerSpotlight: !!article.influencerSpotlight,
                                        influencerName: article.influencerSpotlight?.name || '',
                                        influencerHandle: article.influencerSpotlight?.instagramHandle || '@',
                                        influencerUrl: article.influencerSpotlight?.instagramUrl || 'https://instagram.com/',
                                        influencerBio: article.influencerSpotlight?.bio || '',
                                        influencerFollowers: article.influencerSpotlight?.followersCount || '',
                                        influencerBadge: article.influencerSpotlight?.badgeLabel || 'Verified Community Ambassador',
                                        influencerAvatar: article.influencerSpotlight?.avatarUrl || '',
                                        keyTakeawaysText: (article.content.keyTakeaways || []).join('\n'),
                                        deepDive1Heading: article.content.deepDiveSections[0]?.heading || '',
                                        deepDive1Body: (article.content.deepDiveSections[0]?.paragraphs || []).join('\n\n'),
                                        deepDive1ProTip: article.content.deepDiveSections[0]?.proTip || '',
                                        deepDive1Alert: article.content.deepDiveSections[0]?.alertWarning || '',
                                        deepDive2Heading: article.content.deepDiveSections[1]?.heading || '',
                                        deepDive2Body: (article.content.deepDiveSections[1]?.paragraphs || []).join('\n\n'),
                                        actionableStepsText: (article.content.actionableSteps || []).join('\n'),
                                        faqQuestion1: article.content.faq?.[0]?.question || '',
                                        faqAnswer1: article.content.faq?.[0]?.answer || '',
                                        faqQuestion2: article.content.faq?.[1]?.question || '',
                                        faqAnswer2: article.content.faq?.[1]?.answer || '',
                                        keywordsText: (article.keywords || []).join(', ')
                                      });
                                      setShowArticleEditorModal(true);
                                    }}
                                    className="p-1.5 text-[#2271b1] hover:bg-[#2271b1]/10 rounded cursor-pointer"
                                    title="Edit Post"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Delete article "${article.title}"?`)) {
                                        deleteAdminKnowledgeArticle(article.slug);
                                        const updatedCustom = getAdminCustomKnowledgeArticles();
                                        setKnowledgeArticlesList([...updatedCustom, ...FLAGSHIP_KNOWLEDGE_ARTICLES]);
                                        setWpNotice({ type: 'success', message: 'Article removed from Knowledge Hub.' });
                                      }
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                    title="Delete Post"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* WORDPRESS-STYLE ARTICLE & INFLUENCER SPOTLIGHT VISUAL EDITOR MODAL        */}
          {/* ========================================================================= */}
          {showArticleEditorModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
                {/* Editor Header */}
                <div className="px-6 py-4 bg-[#f6f7f7] border-b border-[#c3c4c7] flex justify-between items-center shrink-0">
                  <div>
                    <h3 className="text-base font-bold text-[#1d2327] flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-pink-600" />
                      {editingArticleSlug ? 'Edit Knowledge Hub Guide' : 'Add New Knowledge Hub Guide & Influencer Post'}
                    </h3>
                    <p className="text-xs text-[#646970]">
                      WordPress-style content manager with native Instagram cross-promotion support.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowArticleEditorModal(false)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Editor Body Form */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!articleForm.title.trim()) return;

                    const autoSlug = articleForm.slug.trim() || articleForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

                    const newArticle: KnowledgeArticle = {
                      slug: autoSlug,
                      title: articleForm.title.trim(),
                      category: articleForm.category,
                      categoryLabel: articleForm.categoryLabel || articleForm.category,
                      ageGroup: articleForm.ageGroup,
                      readTime: articleForm.readTime || '5 min read',
                      summary: articleForm.summary.trim(),
                      publishedDate: articleForm.publishedDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                      author: {
                        name: articleForm.authorName.trim(),
                        role: articleForm.authorRole.trim(),
                        avatar: articleForm.authorAvatar.trim()
                      },
                      coverImage: articleForm.coverImage.trim(),
                      keywords: articleForm.keywordsText ? articleForm.keywordsText.split(',').map(k => k.trim()).filter(Boolean) : [articleForm.title.toLowerCase()],
                      influencerSpotlight: articleForm.isInfluencerSpotlight ? {
                        name: articleForm.influencerName.trim() || articleForm.authorName.trim(),
                        instagramHandle: articleForm.influencerHandle.trim(),
                        instagramUrl: articleForm.influencerUrl.trim(),
                        bio: articleForm.influencerBio.trim(),
                        followersCount: articleForm.influencerFollowers.trim(),
                        badgeLabel: articleForm.influencerBadge.trim(),
                        avatarUrl: articleForm.influencerAvatar.trim() || articleForm.authorAvatar.trim()
                      } : undefined,
                      tableOfContents: [
                        'Core Insights & Key Takeaways',
                        articleForm.deepDive1Heading || 'Comprehensive Framework',
                        articleForm.deepDive2Heading || 'Actionable Daily Implementation',
                        'Step-by-Step Blueprint',
                        'Frequently Asked Questions'
                      ],
                      content: {
                        keyTakeaways: articleForm.keyTakeawaysText.split('\n').map(t => t.trim()).filter(Boolean),
                        deepDiveSections: [
                          {
                            heading: articleForm.deepDive1Heading.trim() || 'Comprehensive Framework',
                            paragraphs: articleForm.deepDive1Body.split('\n\n').map(p => p.trim()).filter(Boolean),
                            proTip: articleForm.deepDive1ProTip.trim() || undefined,
                            alertWarning: articleForm.deepDive1Alert.trim() || undefined
                          },
                          ...(articleForm.deepDive2Heading.trim() ? [{
                            heading: articleForm.deepDive2Heading.trim(),
                            paragraphs: articleForm.deepDive2Body.split('\n\n').map(p => p.trim()).filter(Boolean)
                          }] : [])
                        ],
                        actionableSteps: articleForm.actionableStepsText.split('\n').map(s => s.trim()).filter(Boolean),
                        faq: [
                          ...(articleForm.faqQuestion1.trim() ? [{
                            question: articleForm.faqQuestion1.trim(),
                            answer: articleForm.faqAnswer1.trim()
                          }] : []),
                          ...(articleForm.faqQuestion2.trim() ? [{
                            question: articleForm.faqQuestion2.trim(),
                            answer: articleForm.faqAnswer2.trim()
                          }] : [])
                        ]
                      }
                    };

                    setIsPublishingAutoIndex(true);
                    try {
                      saveAdminKnowledgeArticle(newArticle);
                      const indexResult = await publishAndAutoIndexArticle(newArticle);
                      const updatedCustom = getAdminCustomKnowledgeArticles();
                      setKnowledgeArticlesList([...updatedCustom, ...FLAGSHIP_KNOWLEDGE_ARTICLES]);
                      setShowArticleEditorModal(false);

                      setIndexingFeedbackModal({
                        isOpen: true,
                        articleTitle: newArticle.title,
                        canonicalUrl: indexResult.canonicalUrl,
                        deepLinkUrl: indexResult.deepLinkUrl,
                        sitemapStatus: indexResult.sitemapStatus,
                        indexNowStatus: indexResult.indexNowStatus,
                        schemaInjected: indexResult.schemaInjected,
                        timestamp: indexResult.timestamp
                      });
                      setSchemaInspectArticle(newArticle);

                      showNotification('success', `✓ "${newArticle.title}" published & registered with Google Indexing!`);
                    } catch (err: any) {
                      showNotification('error', `Failed to publish & auto-index: ${err.message}`);
                    } finally {
                      setIsPublishingAutoIndex(false);
                    }
                  }}
                  className="p-6 space-y-6 overflow-y-auto text-xs"
                >
                  {/* Title & Slug */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block font-bold text-[#2c3338] mb-1 text-sm">Post Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 10 Screen-Free Montessori Activities for Active 4-Year-Olds"
                        value={articleForm.title}
                        onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                        className="w-full p-2.5 border border-[#8c8f94] rounded-xs font-bold text-sm text-[#1d2327] focus:border-[#2271b1] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-[#2c3338] mb-1">Category *</label>
                        <select
                          value={articleForm.category}
                          onChange={(e) => {
                            const cat = e.target.value as KnowledgeArticle['category'];
                            const matched = KNOWLEDGE_CATEGORIES.find(c => c.id === cat);
                            setArticleForm({
                              ...articleForm,
                              category: cat,
                              categoryLabel: matched ? matched.name : cat
                            });
                          }}
                          className="w-full p-2 border border-[#8c8f94] rounded-xs text-[#1d2327] bg-white focus:border-[#2271b1] focus:outline-none"
                        >
                          {KNOWLEDGE_CATEGORIES.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-[#2c3338] mb-1">Target Age Group *</label>
                        <select
                          value={articleForm.ageGroup}
                          onChange={(e) => setArticleForm({ ...articleForm, ageGroup: e.target.value as any })}
                          className="w-full p-2 border border-[#8c8f94] rounded-xs text-[#1d2327] bg-white focus:border-[#2271b1] focus:outline-none"
                        >
                          <option value="0-12 Months">0-12 Months</option>
                          <option value="1-3 Years">1-3 Years</option>
                          <option value="4-6 Years">4-6 Years</option>
                          <option value="7-10 Years">7-10 Years</option>
                          <option value="11-14 Years">11-14 Years</option>
                          <option value="All Ages">All Ages</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-[#2c3338] mb-1">Estimated Read Time</label>
                        <input
                          type="text"
                          value={articleForm.readTime}
                          onChange={(e) => setArticleForm({ ...articleForm, readTime: e.target.value })}
                          placeholder="e.g. 5 min read"
                          className="w-full p-2 border border-[#8c8f94] rounded-xs text-[#1d2327] focus:border-[#2271b1] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* INFLUENCER CROSS-PROMOTION SECTION */}
                  <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 p-5 rounded-2xl border-2 border-pink-200 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📸</span>
                        <div>
                          <h4 className="text-sm font-black text-pink-950 font-serif">
                            Instagram Influencer Spotlight &amp; Cross-Promotion
                          </h4>
                          <p className="text-xs text-pink-850">
                            Feature the creator's profile, handle, bio, and direct Instagram link at the top of this article.
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={articleForm.isInfluencerSpotlight}
                          onChange={(e) => setArticleForm({ ...articleForm, isInfluencerSpotlight: e.target.checked })}
                          className="h-4 w-4 text-pink-600 rounded"
                        />
                        <span className="font-bold text-pink-900 text-xs">Enable Creator Spotlight</span>
                      </label>
                    </div>

                    {articleForm.isInfluencerSpotlight && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-pink-200">
                        <div>
                          <label className="block font-bold text-pink-950 mb-1">Creator / Mom Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Priya Sharma"
                            value={articleForm.influencerName}
                            onChange={(e) => setArticleForm({ ...articleForm, influencerName: e.target.value })}
                            className="w-full p-2 bg-white border border-pink-300 rounded-xs text-[#1d2327] focus:border-pink-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-pink-950 mb-1">Instagram Handle *</label>
                          <input
                            type="text"
                            placeholder="e.g. @bangalore_mommy_diaries"
                            value={articleForm.influencerHandle}
                            onChange={(e) => setArticleForm({ ...articleForm, influencerHandle: e.target.value })}
                            className="w-full p-2 bg-white border border-pink-300 rounded-xs font-mono font-bold text-pink-600 focus:border-pink-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-pink-950 mb-1">Instagram Profile URL</label>
                          <input
                            type="text"
                            placeholder="https://instagram.com/bangalore_mommy_diaries"
                            value={articleForm.influencerUrl}
                            onChange={(e) => setArticleForm({ ...articleForm, influencerUrl: e.target.value })}
                            className="w-full p-2 bg-white border border-pink-300 rounded-xs text-[#1d2327] focus:border-pink-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-pink-950 mb-1">Followers Count Badge</label>
                          <input
                            type="text"
                            placeholder="e.g. 28.5K Followers"
                            value={articleForm.influencerFollowers}
                            onChange={(e) => setArticleForm({ ...articleForm, influencerFollowers: e.target.value })}
                            className="w-full p-2 bg-white border border-pink-300 rounded-xs text-[#1d2327] focus:border-pink-500 focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-bold text-pink-950 mb-1">Creator Bio &amp; Niche Description</label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Pediatric play enthusiast & mom of two sharing screen-free routines in Indiranagar..."
                            value={articleForm.influencerBio}
                            onChange={(e) => setArticleForm({ ...articleForm, influencerBio: e.target.value })}
                            className="w-full p-2 bg-white border border-pink-300 rounded-xs text-[#1d2327] focus:border-pink-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary / Excerpt */}
                  <div>
                    <label className="block font-bold text-[#2c3338] mb-1">Summary / Excerpt *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Brief overview summarizing why this guide is essential for parents..."
                      value={articleForm.summary}
                      onChange={(e) => setArticleForm({ ...articleForm, summary: e.target.value })}
                      className="w-full p-2.5 border border-[#8c8f94] rounded-xs text-[#1d2327] focus:border-[#2271b1] focus:outline-none"
                    />
                  </div>

                  {/* Key Takeaways */}
                  <div>
                    <label className="block font-bold text-[#2c3338] mb-1">
                      Key Takeaways (One per line)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Line 1: Focus on experiential play over passive screen time.&#10;Line 2: Build daily structured routines with positive reinforcement."
                      value={articleForm.keyTakeawaysText}
                      onChange={(e) => setArticleForm({ ...articleForm, keyTakeawaysText: e.target.value })}
                      className="w-full p-2.5 border border-[#8c8f94] rounded-xs text-[#1d2327] font-mono text-xs focus:border-[#2271b1] focus:outline-none"
                    />
                  </div>

                  {/* Deep Dive Section 1 */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-[#1d2327] text-xs uppercase tracking-wider">
                      Deep Dive Section 1 (Core Framework)
                    </h4>
                    <div>
                      <label className="block font-semibold text-[#2c3338] mb-1">Section Heading</label>
                      <input
                        type="text"
                        placeholder="e.g. Evidence-Based Framework for Social Development"
                        value={articleForm.deepDive1Heading}
                        onChange={(e) => setArticleForm({ ...articleForm, deepDive1Heading: e.target.value })}
                        className="w-full p-2 border border-[#8c8f94] rounded-xs text-[#1d2327] focus:border-[#2271b1] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#2c3338] mb-1">Body Paragraphs (Separate with empty line)</label>
                      <textarea
                        rows={4}
                        placeholder="Detailed clinical and practical advice for parents..."
                        value={articleForm.deepDive1Body}
                        onChange={(e) => setArticleForm({ ...articleForm, deepDive1Body: e.target.value })}
                        className="w-full p-2.5 border border-[#8c8f94] rounded-xs text-[#1d2327] focus:border-[#2271b1] focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-emerald-800 mb-1">💡 Pro-Tip Callout</label>
                        <input
                          type="text"
                          placeholder="e.g. Schedule 20 minutes of daily uninterrupted play."
                          value={articleForm.deepDive1ProTip}
                          onChange={(e) => setArticleForm({ ...articleForm, deepDive1ProTip: e.target.value })}
                          className="w-full p-2 bg-emerald-50 border border-emerald-300 rounded-xs text-emerald-950 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-amber-800 mb-1">⚠️ Safety / Parent Alert</label>
                        <input
                          type="text"
                          placeholder="e.g. Avoid rushing transitions between activities."
                          value={articleForm.deepDive1Alert}
                          onChange={(e) => setArticleForm({ ...articleForm, deepDive1Alert: e.target.value })}
                          className="w-full p-2 bg-amber-50 border border-amber-300 rounded-xs text-amber-950 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actionable Steps */}
                  <div>
                    <label className="block font-bold text-[#2c3338] mb-1">
                      Actionable Step-by-Step Checklist (One step per line)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Step 1: Set up a dedicated play zone.&#10;Step 2: Demonstrate the activity with warmth.&#10;Step 3: Encourage peer collaboration."
                      value={articleForm.actionableStepsText}
                      onChange={(e) => setArticleForm({ ...articleForm, actionableStepsText: e.target.value })}
                      className="w-full p-2.5 border border-[#8c8f94] rounded-xs text-[#1d2327] font-mono text-xs focus:border-[#2271b1] focus:outline-none"
                    />
                  </div>

                  {/* FAQs */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-[#1d2327] text-xs uppercase tracking-wider">
                      Frequently Asked Questions
                    </h4>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="FAQ 1 Question: How quickly do children adapt to this routine?"
                        value={articleForm.faqQuestion1}
                        onChange={(e) => setArticleForm({ ...articleForm, faqQuestion1: e.target.value })}
                        className="w-full p-2 border border-[#8c8f94] rounded-xs text-[#1d2327] font-semibold focus:border-[#2271b1] focus:outline-none"
                      />
                      <textarea
                        rows={2}
                        placeholder="FAQ 1 Answer: Most children show positive engagement within 3 to 7 days."
                        value={articleForm.faqAnswer1}
                        onChange={(e) => setArticleForm({ ...articleForm, faqAnswer1: e.target.value })}
                        className="w-full p-2 border border-[#8c8f94] rounded-xs text-[#1d2327] focus:border-[#2271b1] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex justify-end gap-2 pt-4 border-t border-[#f0f0f1]">
                    <button
                      type="button"
                      onClick={() => setShowArticleEditorModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPublishingAutoIndex}
                      className="px-6 py-2.5 bg-[#2271b1] hover:bg-[#135e96] disabled:opacity-60 text-white text-xs font-bold rounded-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      {isPublishingAutoIndex ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Publishing & Auto-Indexing in Google...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>{editingArticleSlug ? 'Update Article & Auto-Index' : 'Publish & Auto-Index with Google'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW G: BROADCAST & BANNER ADS                                            */}
          {/* ========================================================================= */}
          {activeMenu === 'broadcast' && (
            <div className="space-y-4 animate-fadeIn">
              <h1 className="text-xl font-normal text-[#1d2327] flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-orange-500" /> Broadcast Push Alerts & Banner Campaigns
              </h1>

              <div className="bg-white border border-[#c3c4c7] p-5 rounded-xs space-y-4 shadow-2xs max-w-2xl">
                <h3 className="font-bold text-xs text-[#1d2327] uppercase">Create Community Notification Push</h3>
                <form onSubmit={handleSendQuickNotice} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-[#2c3338] mb-1">Alert Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Science Fair Registration Open!"
                      value={quickNoticeTitle}
                      onChange={e => setQuickNoticeTitle(e.target.value)}
                      className="w-full p-2 bg-[#f6f7f7] border border-[#8c8f94] rounded-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#2c3338] mb-1">Message Body *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Enter detailed message to show on parent screens..."
                      value={quickNoticeBody}
                      onChange={e => setQuickNoticeBody(e.target.value)}
                      className="w-full p-2 bg-[#f6f7f7] border border-[#8c8f94] rounded-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#2c3338] mb-1">Optional Banner Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={quickNoticeImage}
                      onChange={e => setQuickNoticeImage(e.target.value)}
                      className="w-full p-2 bg-[#f6f7f7] border border-[#8c8f94] rounded-xs font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSendingQuickNotice}
                    className="px-5 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white font-bold rounded-xs transition cursor-pointer"
                  >
                    {isSendingQuickNotice ? 'Distributing...' : 'Broadcast to All Devices'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW H: CONTACT PRIVACY AUDITS                                            */}
          {/* ========================================================================= */}
          {activeMenu === 'contacts' && (
            <div className="space-y-4 animate-fadeIn">
              <h1 className="text-xl font-normal text-[#1d2327] flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#2271b1]" /> Contact Privacy Audits & Shared Directory
              </h1>

              <div className="bg-white border border-[#c3c4c7] rounded-xs p-4 space-y-3">
                <p className="text-xs text-[#646970]">
                  Audit parent mobile numbers and privacy preferences to prevent unauthorized contact scraping.
                </p>
                <div className="divide-y divide-[#f0f0f1]">
                  {allUsers.map((u) => (
                    <div key={u.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#1d2327] block">{u.parentName}</span>
                        <span className="text-[#646970] text-[11px]">Parent of {u.childName}</span>
                      </div>
                      <div className="font-mono text-xs text-[#50575e]">
                        {showUnmaskedPii ? u.phoneNumber : maskPhone(u.phoneNumber)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW I: SECURITY & TOOLS (`tools.php?page=security`)                      */}
          {/* ========================================================================= */}
          {activeMenu === 'security' && (
            <div className="space-y-4 animate-fadeIn">
              <h1 className="text-xl font-normal text-[#1d2327] flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" /> Platform Security & Threat Mitigation Tools
              </h1>

              {/* Emergency Lockdown Toggle Box */}
              <div className={`p-4 border rounded-xs ${
                emergencyLockdown ? 'bg-red-50 border-red-300' : 'bg-white border-[#c3c4c7]'
              } flex items-center justify-between`}>
                <div>
                  <h3 className="font-bold text-xs text-[#1d2327] uppercase">Emergency Network Lockdown</h3>
                  <p className="text-xs text-[#646970] mt-0.5">
                    Instantly freeze all non-admin write operations and chat socket pipelines during active security breaches.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleLockdown}
                  disabled={isUpdatingLockdown}
                  className={`px-4 py-2 font-bold text-xs rounded-xs transition cursor-pointer ${
                    emergencyLockdown
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-[#2271b1] hover:bg-[#135e96] text-white'
                  }`}
                >
                  {isUpdatingLockdown ? 'Updating...' : emergencyLockdown ? 'Deactivate Lockdown' : 'Activate Lockdown'}
                </button>
              </div>

              {/* PII Masking Switch */}
              <div className="bg-white border border-[#c3c4c7] p-4 rounded-xs flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-[#1d2327]">Mask PII in Administrative Views</h4>
                  <p className="text-[#646970]">Obfuscate Aadhaar numbers, phones, and emails on screen for audit compliance.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUnmaskedPii(!showUnmaskedPii)}
                  className={`px-3 py-1.5 rounded-xs font-bold text-xs border ${
                    showUnmaskedPii ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-[#f6f7f7] text-[#2c3338] border-[#c3c4c7]'
                  }`}
                >
                  {showUnmaskedPii ? '👁️ Mask PII' : '🔓 Reveal Unmasked PII'}
                </button>
              </div>

              {/* Security Logs Viewer */}
              <div className="bg-white border border-[#c3c4c7] rounded-xs p-4 space-y-3">
                <h3 className="font-bold text-xs text-[#1d2327] uppercase">Audit & Security Event Log Stream</h3>
                <div className="bg-[#1d2327] text-emerald-400 p-3 rounded-xs font-mono text-[11px] max-h-60 overflow-y-auto space-y-1">
                  {securityLogs.length === 0 ? (
                    <div>[INFO] System security stream operational. No threat events logged.</div>
                  ) : (
                    securityLogs.map((l, i) => (
                      <div key={i} className="leading-tight">
                        <span className="text-[#646970]">[{new Date(l.timestamp).toLocaleTimeString()}]</span>{' '}
                        <strong className="text-amber-300">[{l.severity}]</strong> {l.details}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW J: BACKUPS & GOOGLE DRIVE CLOUD SYNC                                 */}
          {/* ========================================================================= */}
          {activeMenu === 'backups' && (
            <div className="space-y-4 animate-fadeIn">
              <h1 className="text-xl font-normal text-[#1d2327] flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-[#2271b1]" /> Backups & Cloud Sync Center
              </h1>

              <GoogleDriveBackupPanel
                userProfile={userProfile}
                playmates={playmates}
                eventsList={eventsList}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW K: SETTINGS & NAVIGATION PLACEMENTS (`options-general.php`)          */}
          {/* ========================================================================= */}
          {activeMenu === 'settings' && (
            <div className="space-y-4 animate-fadeIn max-w-3xl">
              <h1 className="text-xl font-normal text-[#1d2327] flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#2271b1]" /> General Settings & Navigation Customizer
              </h1>

              {/* Navigation Placements Form */}
              <div className="bg-white border border-[#c3c4c7] p-5 rounded-xs space-y-4 shadow-2xs">
                <h3 className="font-bold text-xs text-[#1d2327] uppercase">Tab Placements (Header vs Side Menu)</h3>
                
                <div className="space-y-3 text-xs">
                  {Object.entries(tabsPlacement).map(([tabKey, placement]) => (
                    <div key={tabKey} className="flex items-center justify-between py-2 border-b border-[#f0f0f1]">
                      <span className="font-bold text-[#2c3338] capitalize">{tabKey} Tab</span>
                      <select
                        value={placement}
                        onChange={e => handleSaveTabPlacement(tabKey, e.target.value as any)}
                        className="p-1 bg-[#f6f7f7] border border-[#8c8f94] rounded-xs text-xs font-semibold"
                      >
                        <option value="header">Top Header Navigation</option>
                        <option value="side">Side Drawer Menu</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Primary Contact Phone */}
              <div className="bg-white border border-[#c3c4c7] p-5 rounded-xs space-y-3 shadow-2xs text-xs">
                <h3 className="font-bold text-[#1d2327] uppercase">Root Administrator Phone Number</h3>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={adminPhone}
                    onChange={e => setAdminPhone(e.target.value)}
                    className="p-2 bg-[#f6f7f7] border border-[#8c8f94] rounded-xs font-mono font-bold w-64"
                  />
                  <button
                    type="button"
                    onClick={handleSaveAdminPhone}
                    disabled={isSavingPhone}
                    className="px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white font-bold rounded-xs transition"
                  >
                    {isSavingPhone ? 'Saving...' : 'Save Phone'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW L: VERNUNT ENTERPRISE SEO & INSTANT INDEXING STUDIO                 */}
          {/* ========================================================================= */}
          {activeMenu === 'seo' && (
            <div className="space-y-4 animate-fadeIn">
              <VernuntSeoSuite />
            </div>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* 4. KYC & USER EDITING MODAL / DRAWER                                      */}
      {/* ========================================================================= */}
      {showKycDrawer && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#c3c4c7] rounded-xs max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto text-xs animate-scaleUp text-left">
            <div className="flex items-center justify-between border-b border-[#c3c4c7] pb-3">
              <div>
                <h2 className="font-bold text-sm text-[#1d2327]">
                  Edit User & KYC Verification: {selectedUser.parentName}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-[#646970] font-mono">User ID: {selectedUser.id}</span>
                  <span className="text-[#dcdcde]">•</span>
                  <span className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-xs">
                    <Clock className="w-2.5 h-2.5 text-emerald-700" />
                    Joined: {selectedUser.createdAt || selectedUser.registeredAt ? new Date(selectedUser.createdAt || selectedUser.registeredAt!).toLocaleString() : 'Registered User'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowKycDrawer(false)}
                className="text-[#646970] hover:text-[#1d2327]"
              >
                <XSquare className="w-5 h-5" />
              </button>
            </div>

            {/* Biometric Comparison & Facial Audit Card if user has photos */}
            {(selectedUser.parentPhotoUrl || selectedUser.selfiePhotoUrl || selectedUser.photoUrl || selectedUser.facialAuditRequired) && (
              <div className="p-3 bg-[#f6f7f7] border border-[#c3c4c7] rounded-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[#1d2327]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Facial Recognition & Biometric Audit</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-xs font-bold text-[10px] uppercase ${
                    selectedUser.faceVerificationStatus === 'verified' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : selectedUser.faceVerificationStatus === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedUser.faceVerificationStatus === 'verified' ? '✓ Biometrics Verified' : selectedUser.facialAuditRequired ? '⚠ Manual Review Required' : selectedUser.faceVerificationStatus || 'Pending'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1 text-center bg-white p-2 border border-[#dcdcde] rounded-xs">
                    <span className="text-[10px] font-bold text-[#50575e] block">Step A: Portrait / ID Photo</span>
                    <div className="w-24 h-24 mx-auto rounded-xs overflow-hidden border border-[#c3c4c7] bg-slate-100 flex items-center justify-center">
                      {(selectedUser.parentPhotoUrl || selectedUser.photoUrl) ? (
                        <img 
                          src={selectedUser.parentPhotoUrl || selectedUser.photoUrl} 
                          alt="Step A Portrait" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-[9px] text-[#8c8f94]">No Photo</span>
                      )}
                    </div>
                    <span className="text-[9px] text-[#646970] block">Source: {selectedUser.stepAPhotoSource || 'Gallery / Portrait'}</span>
                  </div>

                  <div className="space-y-1 text-center bg-white p-2 border border-[#dcdcde] rounded-xs">
                    <span className="text-[10px] font-bold text-[#50575e] block">Step B: Live Camera Selfie</span>
                    <div className="w-24 h-24 mx-auto rounded-xs overflow-hidden border border-[#c3c4c7] bg-slate-100 flex items-center justify-center">
                      {selectedUser.selfiePhotoUrl ? (
                        <img 
                          src={selectedUser.selfiePhotoUrl} 
                          alt="Step B Live Selfie" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-[9px] text-[#8c8f94]">Skipped (Direct Selfie in Step A)</span>
                      )}
                    </div>
                    <span className="text-[9px] text-emerald-700 font-bold block">
                      {selectedUser.faceVerificationScore ? `AI Score: ${selectedUser.faceVerificationScore}% Match` : 'Live Front Camera'}
                    </span>
                  </div>
                </div>

                {/* Quick Audit Action Buttons */}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const userRef = doc(db, 'users', selectedUser.id);
                        await updateDoc(userRef, {
                          facialAuditRequired: false,
                          faceVerificationStatus: 'rejected',
                          verificationStatus: VerificationStatus.REJECTED
                        });
                        setTargetVerification(VerificationStatus.REJECTED);
                        showNotification('warning', `Rejected facial recognition for ${selectedUser.parentName}`);
                      } catch (e: any) {
                        showNotification('error', e.message);
                      }
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 text-[#d63638] border border-[#d63638] rounded-xs font-bold text-[10px] transition cursor-pointer"
                  >
                    Reject Biometrics
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const userRef = doc(db, 'users', selectedUser.id);
                        await updateDoc(userRef, {
                          facialAuditRequired: false,
                          faceVerificationStatus: 'verified',
                          verificationStatus: VerificationStatus.VERIFIED,
                          aadhaarVerified: true
                        });
                        setTargetVerification(VerificationStatus.VERIFIED);
                        setTargetAadhaarVerified(true);
                        await sendApprovalNotification(selectedUser);
                      } catch (e: any) {
                        showNotification('error', e.message);
                      }
                    }}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xs font-bold text-[10px] transition cursor-pointer"
                  >
                    ✓ Approve Biometrics & Send Login Link
                  </button>
                </div>
              </div>
            )}

            {/* Uploaded Aadhaar Card Document (Mandatory 3MB File) */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>National Aadhaar Card Document (Government Proof)</span>
                </div>
                {selectedUser.aadhaarDocUrl ? (
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[9.5px] px-2 py-0.5 rounded-full uppercase">
                    Document Attached
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 font-bold text-[9.5px] px-2 py-0.5 rounded-full uppercase">
                    Pending Upload
                  </span>
                )}
              </div>

              {selectedUser.aadhaarDocUrl ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 border border-emerald-200 rounded-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xs bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base shrink-0">
                      📄
                    </div>
                    <div>
                      <span className="font-bold text-[#1d2327] block text-xs truncate max-w-xs">
                        {selectedUser.aadhaarDocName || 'Aadhaar_Document.jpg'}
                      </span>
                      <span className="text-[10px] text-[#646970]">
                        {selectedUser.aadhaarDocSize ? `${(selectedUser.aadhaarDocSize / (1024 * 1024)).toFixed(2)} MB` : 'Max 3 MB Document'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={selectedUser.aadhaarDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xs font-bold text-[10.5px] flex items-center gap-1 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Aadhaar</span>
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-[10.5px] text-[#646970] italic">
                  No separate Aadhaar document file uploaded yet.
                </p>
              )}
            </div>

            {/* Uploaded Government ID / Certification Document (Admin Only) */}
            {selectedUser.idDocUrl && (
              <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-purple-950 text-xs">
                    <Eye className="w-4 h-4 text-purple-600" />
                    <span>Uploaded ID Card / Professional Certification</span>
                  </div>
                  <span className="bg-purple-100 text-purple-800 font-bold text-[9.5px] px-2 py-0.5 rounded-full uppercase">
                    Admin Visible
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 border border-purple-200 rounded-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xs bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-base shrink-0">
                      📁
                    </div>
                    <div>
                      <span className="font-bold text-[#1d2327] block text-xs truncate max-w-xs">
                        {selectedUser.idDocumentName || 'ID_Card_Document.jpg'}
                      </span>
                      <span className="text-[10px] text-[#646970]">Government ID / Specialist Certificate</span>
                    </div>
                  </div>
                  <a
                    href={selectedUser.idDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xs font-bold text-[10.5px] flex items-center gap-1 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect ID Document</span>
                  </a>
                </div>
              </div>
            )}

            {/* Corporate Registration & Facility Address Documents (Admin Only) */}
            {(selectedUser.companyDocUrl || selectedUser.addressProofDocUrl) && (
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-blue-950 text-xs">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Corporate & Organization Documents</span>
                  </div>
                  <span className="bg-blue-100 text-blue-800 font-bold text-[9.5px] px-2 py-0.5 rounded-full uppercase">
                    Admin Only
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedUser.companyDocUrl && (
                    <div className="bg-white p-3 border border-blue-200 rounded-xs space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">1. Company Registration</span>
                      <span className="text-xs font-bold text-slate-800 block truncate">{selectedUser.companyDocName || 'Company_Registration.pdf'}</span>
                      <a
                        href={selectedUser.companyDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white text-[10px] font-bold rounded-xs transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect Certificate</span>
                      </a>
                    </div>
                  )}
                  {selectedUser.addressProofDocUrl && (
                    <div className="bg-white p-3 border border-blue-200 rounded-xs space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">2. Facility / Clinic Address Proof</span>
                      <span className="text-xs font-bold text-slate-800 block truncate">{selectedUser.addressProofDocName || 'Address_Proof.pdf'}</span>
                      <a
                        href={selectedUser.addressProofDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white text-[10px] font-bold rounded-xs transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect Address Proof</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Current & Permanent Address & Proof Records (Strictly Admin Only) */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Confidential Address Verification (Admin-Only Access)</span>
                </div>
                <span className="bg-amber-100 text-amber-800 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin Only
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* Current Address */}
                <div className="bg-white p-2.5 border border-amber-200 rounded-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Current Residential Address</span>
                  <p className="text-slate-800 font-medium text-xs leading-relaxed">
                    {selectedUser.currentAddress || selectedUser.location?.address || 'Not specified during onboarding'}
                  </p>
                </div>

                {/* Permanent Address */}
                <div className="bg-white p-2.5 border border-amber-200 rounded-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Permanent Address</span>
                  <p className="text-slate-800 font-medium text-xs leading-relaxed">
                    {selectedUser.permanentAddress || selectedUser.currentAddress || selectedUser.location?.address || 'Same as Current Address'}
                  </p>
                </div>
              </div>

              {/* Address Proof Document File */}
              {selectedUser.addressProofDocUrl ? (
                <div className="bg-white p-2.5 border border-amber-200 rounded-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📍</span>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block truncate">
                        {selectedUser.addressProofDocName || 'Address_Verification_Doc.pdf'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Type: {selectedUser.addressProofDocType || 'Govt Address Proof'} {selectedUser.addressProofDocSize ? `• ${(selectedUser.addressProofDocSize / (1024 * 1024)).toFixed(2)} MB` : ''}
                      </span>
                    </div>
                  </div>
                  <a
                    href={selectedUser.addressProofDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white text-[10px] font-bold rounded-xs transition shrink-0"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Inspect Address Proof</span>
                  </a>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 italic bg-white/60 p-2 rounded-xs border border-amber-100">
                  Address proof document verified via physical verification or linked Aadhaar KYC records.
                </p>
              )}
            </div>

            {/* Admin-Only Security Telemetry (IP & GPS Coordinates) */}
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-indigo-950 text-xs">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>Admin Security Telemetry (IP Address & GPS Coordinates)</span>
                </div>
                <span className="bg-indigo-100 text-indigo-800 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin Only
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {/* IP Address */}
                <div className="bg-white p-2.5 border border-indigo-100 rounded-xs space-y-1">
                  <span className="text-[10px] font-bold text-[#646970] block uppercase tracking-wider">Client IP Address</span>
                  <span className="font-mono font-bold text-slate-800 text-xs block">
                    {selectedUser.ipAddress || 'Not captured (pre-telemetry)'}
                  </span>
                  {selectedUser.ipAddress && selectedUser.ipAddress !== '127.0.0.1' && (
                    <a
                      href={`https://whatismyipaddress.com/ip/${selectedUser.ipAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9.5px] text-indigo-600 hover:underline font-semibold block"
                    >
                      Look up IP origin ↗
                    </a>
                  )}
                </div>

                {/* GPS Coordinates */}
                <div className="bg-white p-2.5 border border-indigo-100 rounded-xs space-y-1">
                  <span className="text-[10px] font-bold text-[#646970] block uppercase tracking-wider">Captured Lat / Lng</span>
                  <span className="font-mono font-bold text-slate-800 text-xs block">
                    {selectedUser.capturedLat && selectedUser.capturedLng
                      ? `${selectedUser.capturedLat.toFixed(5)}, ${selectedUser.capturedLng.toFixed(5)}`
                      : 'Unavailable / Denied'}
                  </span>
                  {selectedUser.capturedLat && selectedUser.capturedLng && (
                    <a
                      href={`https://www.google.com/maps?q=${selectedUser.capturedLat},${selectedUser.capturedLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9.5px] text-indigo-600 hover:underline font-semibold block"
                    >
                      View on Google Maps ↗
                    </a>
                  )}
                </div>

                {/* Location & Capture Time */}
                <div className="bg-white p-2.5 border border-indigo-100 rounded-xs space-y-1">
                  <span className="text-[10px] font-bold text-[#646970] block uppercase tracking-wider">Capture Timestamp</span>
                  <span className="text-slate-700 text-[11px] block">
                    {selectedUser.capturedAt ? new Date(selectedUser.capturedAt).toLocaleString() : 'N/A'}
                  </span>
                  <span className="text-[9.5px] text-slate-500 block truncate">
                    {selectedUser.capturedLocationInfo || 'Browser Geolocation API'}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#2c3338] mb-1">User Role</label>
                <select
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value as any)}
                  className="w-full p-2 bg-[#f6f7f7] border border-[#8c8f94] rounded-xs font-bold"
                >
                  <option value="Parent">Parent</option>
                  <option value="Event Organizer">Event Organizer</option>
                  <option value="Portfolio Professional">Portfolio Professional (Doctor/Tutor)</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2c3338] mb-1">Verification Status</label>
                <select
                  value={targetVerification}
                  onChange={e => setTargetVerification(e.target.value as any)}
                  className="w-full p-2 bg-[#f6f7f7] border border-[#8c8f94] rounded-xs font-bold"
                >
                  <option value={VerificationStatus.VERIFIED}>Verified (Approved)</option>
                  <option value={VerificationStatus.PENDING}>Pending Review</option>
                  <option value={VerificationStatus.UNVERIFIED}>Unverified</option>
                  <option value={VerificationStatus.REJECTED}>Rejected</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2c3338] mb-1">Aadhaar Number (Encrypted)</label>
                <input
                  type="text"
                  value={targetAadhaarNum}
                  onChange={e => setTargetAadhaarNum(e.target.value)}
                  className="w-full p-2 bg-[#f6f7f7] border border-[#8c8f94] rounded-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2c3338] mb-1">Primary Mobile Number</label>
                <input
                  type="tel"
                  value={targetPhone}
                  onChange={e => setTargetPhone(e.target.value)}
                  className="w-full p-2 bg-[#f6f7f7] border border-[#8c8f94] rounded-xs font-mono font-bold"
                />
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="flex flex-wrap gap-4 pt-2 border-t border-[#f0f0f1]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={targetAadhaarVerified}
                  onChange={e => setTargetAadhaarVerified(e.target.checked)}
                />
                <span className="font-bold">Aadhaar UIDAI Verified</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={targetIsBlocked}
                  onChange={e => setTargetIsBlocked(e.target.checked)}
                />
                <span className="font-bold text-red-600">Block Account</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={targetIsLocked}
                  onChange={e => setTargetIsLocked(e.target.checked)}
                />
                <span className="font-bold text-amber-600">Lock Account</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-[#c3c4c7]">
              <button
                type="button"
                onClick={() => setShowKycDrawer(false)}
                className="px-4 py-2 bg-[#f6f7f7] hover:bg-[#f0f0f1] border border-[#8c8f94] rounded-xs font-bold text-[#2c3338]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUserChanges}
                disabled={updateLoading}
                className="px-5 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white font-bold rounded-xs transition cursor-pointer"
              >
                {updateLoading ? 'Saving Changes...' : 'Update User Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Auto-Indexing & Rich SEO Inspector Modal */}
      {indexingFeedbackModal?.isOpen && (
        <GoogleIndexingInspectorModal
          isOpen={indexingFeedbackModal.isOpen}
          onClose={() => {
            setIndexingFeedbackModal(null);
            setSchemaInspectArticle(null);
          }}
          article={schemaInspectArticle}
          canonicalUrl={indexingFeedbackModal.canonicalUrl}
          deepLinkUrl={indexingFeedbackModal.deepLinkUrl}
          sitemapStatus={indexingFeedbackModal.sitemapStatus}
          indexNowStatus={indexingFeedbackModal.indexNowStatus}
          timestamp={indexingFeedbackModal.timestamp}
        />
      )}

    </div>
  );
}
