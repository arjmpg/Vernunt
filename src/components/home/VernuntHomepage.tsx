import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search, MapPin, Bell, User, Heart, Star, Sparkles, ShieldCheck,
  ChevronRight, ChevronLeft, ArrowRight, Lock, Calendar, Clock,
  Tag, ShoppingBag, Baby, Users, BookOpen, Compass, CheckCircle2,
  X, Filter, Play, Check, ChevronDown, SlidersHorizontal, Eye,
  Sparkle, ShieldAlert, AlertCircle, Phone, Mail, Award, Navigation
} from 'lucide-react';
import VernuntLogo from '../VernuntLogo.tsx';
import type { ChildProfile, CommunityEvent } from '../../types.ts';
import type { StoreProduct, CartItem, StoreCoupon } from '../../types/store.ts';
import { CartSlideOverDrawer } from '../store/CartSlideOverDrawer.tsx';
import { getStoredProducts } from '../../data/storeProducts.ts';
import { LanguageCode } from '../../utils/dictionary.ts';
import { autoDetectUserLocality, saveLocalityPreference, BANGALORE_LOCALITIES_GPS, LocalityItem } from '../../utils/geolocation.ts';

export interface VernuntHomepageProps {
  userProfile: ChildProfile | null;
  playmates: ChildProfile[];
  events: CommunityEvent[];
  banners?: any[];
  onStartSignUp: (
    role: 'Parent' | 'Event Organizer' | 'Portfolio Professional' | 'Influencer' | 'Vendor',
    details?: { phone?: string; email?: string; phoneVerified?: boolean }
  ) => void;
  onQuickStart: () => void;
  onGoogleSignIn?: () => void;
  onSelectGoogleAccount?: (account: { email: string; displayName: string; photoURL?: string; role?: string }) => void;
  onOpenStore?: (categoryOrProductId?: string) => void;
  onOpenEvents?: (eventIdOrCategory?: string) => void;
  onOpenPlaymates?: (playmateId?: string) => void;
  onOpenParks?: () => void;
  onOpenKidStories?: () => void;
  onOpenGroups?: () => void;
  onOpenTracker?: () => void;
  onOpenCommunity?: () => void;
  onOpenContactUs?: () => void;
  onSelectPlaymate?: (playmate: ChildProfile) => void;
  onOpenAuthModal?: () => void;
  language?: LanguageCode;
  unreadNotificationsCount?: number;
  hideHeader?: boolean;
}

// Curated Bangalore Localities for Pincode/Location Selector
export const POPULAR_LOCALITIES = BANGALORE_LOCALITIES_GPS;

// Curated Community Playtime & Parent Groups for Section 9
interface PlaytimeGroup {
  id: string;
  title: string;
  ageSuitability: string;
  neighborhood: string;
  suggestedSchedule: string;
  confirmedCount: number;
  activityType: 'Park Play' | 'Sensory Circle' | 'Music & Rhymes' | 'Lego Builders';
  organizer: string;
}

const LOCAL_PLAYTIME_GROUPS: PlaytimeGroup[] = [
  {
    id: 'grp-indiranagar-park',
    title: 'Indiranagar Toddler Park & Walk Club',
    ageSuitability: '1–4 yrs',
    neighborhood: 'Indiranagar Defense Colony Park',
    suggestedSchedule: 'Every Sat & Sun • 9:30 AM',
    confirmedCount: 14,
    activityType: 'Park Play',
    organizer: 'Pooja & Rohan (Parents of Kiara)'
  },
  {
    id: 'grp-koramangala-sensory',
    title: 'Koramangala Sensory Play & Clay Circle',
    ageSuitability: '2–5 yrs',
    neighborhood: 'Koramangala 4th Block Community Hall',
    suggestedSchedule: 'This Saturday • 11:00 AM',
    confirmedCount: 9,
    activityType: 'Sensory Circle',
    organizer: 'Ananya S. (Early Childhood Educator)'
  },
  {
    id: 'grp-hsr-story-rhymes',
    title: 'HSR Sunday Storytelling & Rhymes Picnic',
    ageSuitability: '0–3 yrs',
    neighborhood: 'HSR Sector 2 Central Park',
    suggestedSchedule: 'Sunday Morning • 10:00 AM',
    confirmedCount: 18,
    activityType: 'Music & Rhymes',
    organizer: 'Kavita Murthy (Parent & Storyteller)'
  },
  {
    id: 'grp-whitefield-lego',
    title: 'Whitefield Little STEM & Lego Explorers',
    ageSuitability: '4–8 yrs',
    neighborhood: 'Prestige Ozone Clubhouse, Whitefield',
    suggestedSchedule: 'Friday Evening • 5:00 PM',
    confirmedCount: 12,
    activityType: 'Lego Builders',
    organizer: 'Vikram Joshi (Parent)'
  }
];

export default function VernuntHomepage({
  userProfile,
  playmates = [],
  events = [],
  banners = [],
  onStartSignUp,
  onQuickStart,
  onGoogleSignIn,
  onSelectGoogleAccount,
  onOpenStore,
  onOpenEvents,
  onOpenPlaymates,
  onOpenParks,
  onOpenKidStories,
  onOpenGroups,
  onOpenTracker,
  onOpenCommunity,
  onOpenContactUs,
  onSelectPlaymate,
  onOpenAuthModal,
  language = 'en',
  unreadNotificationsCount = 0,
  hideHeader = false
}: VernuntHomepageProps) {
  // ----------------------------------------------------
  // 1. Location & Pincode State
  // ----------------------------------------------------
  const [selectedLocality, setSelectedLocality] = useState(() => {
    try {
      const saved = localStorage.getItem('vernunt_user_locality');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.debug('Locality load error:', e);
    }
    return POPULAR_LOCALITIES[0];
  });
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isLocalityDetecting, setIsLocalityDetecting] = useState(false);
  const [customPincodeInput, setCustomPincodeInput] = useState('');

  // Auto-capture device GPS location and listen for locality sync
  useEffect(() => {
    const handleLocalityChanged = (e: any) => {
      if (e.detail) {
        setSelectedLocality(e.detail);
      }
    };
    window.addEventListener('vernunt-locality-changed', handleLocalityChanged);

    try {
      const saved = localStorage.getItem('vernunt_user_locality');
      const parsed = saved ? JSON.parse(saved) : null;
      if (!parsed || !parsed.isAutoCaptured) {
        autoDetectUserLocality().then((captured) => {
          if (captured) {
            setSelectedLocality(captured);
          }
        });
      }
    } catch {
      autoDetectUserLocality().then((captured) => {
        if (captured) setSelectedLocality(captured);
      });
    }

    return () => {
      window.removeEventListener('vernunt-locality-changed', handleLocalityChanged);
    };
  }, []);

  // ----------------------------------------------------
  // 2. Search & Filter State
  // ----------------------------------------------------
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<
    'all' | 'products' | 'playmates' | 'events' | 'classes' | 'activities'
  >('all');
  const [searchAgeFilter, setSearchAgeFilter] = useState<'all' | '0-2' | '2-5' | '5-8' | '8+'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vernunt_recent_searches_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.debug('Recent searches load error:', e);
    }
    return ['Organic Cotton Clothing', 'Bhagavad Gita Classes', 'Indoor Playtime', 'Montessori Toys', 'Toddler Playdate'];
  });

  // ----------------------------------------------------
  // 3. Products Catalog from existing Store data
  // ----------------------------------------------------
  const [allProducts, setAllProducts] = useState<StoreProduct[]>(() => {
    try {
      return getStoredProducts();
    } catch {
      return [];
    }
  });

  // Sync products if updated in localStorage
  useEffect(() => {
    const handleProductsUpdated = () => {
      try {
        setAllProducts(getStoredProducts());
      } catch (e) {
        console.debug('Products update error:', e);
      }
    };
    window.addEventListener('vernunt_products_updated', handleProductsUpdated);
    return () => window.removeEventListener('vernunt_products_updated', handleProductsUpdated);
  }, []);

  // ----------------------------------------------------
  // 4. Wishlist & Cart Persistence
  // ----------------------------------------------------
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vernunt_store_wishlist_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 2800);
  };

  const handleToggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(prev => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter(id => id !== productId) : [...prev, productId];
      try {
        localStorage.setItem('vernunt_store_wishlist_v1', JSON.stringify(updated));
      } catch (err) {
        console.debug('Wishlist store error:', err);
      }
      showToast(exists ? 'Removed from wishlist' : '❤️ Saved to your wishlist!');
      return updated;
    });
  };

  // Shopping Cart Slide-Over Drawer State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('vernunt_store_cart_v1') || localStorage.getItem('vernunt_cart_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [appliedCoupon, setAppliedCoupon] = useState<StoreCoupon | null>({
    code: 'VERNUNT15',
    discountType: 'percentage',
    discountValue: 15,
    description: '15% Off Your Entire Order',
    minOrderAmount: 0
  });
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>({
    type: 'success',
    text: 'Code VERNUNT15 applied (15% OFF)!'
  });

  // Cross-tab and cross-component cart synchronization
  useEffect(() => {
    const handleCartSync = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setCart(e.detail);
      } else {
        try {
          const saved = localStorage.getItem('vernunt_store_cart_v1') || localStorage.getItem('vernunt_cart_v1');
          if (saved) setCart(JSON.parse(saved));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('vernunt_cart_updated', handleCartSync);
    return () => window.removeEventListener('vernunt_cart_updated', handleCartSync);
  }, []);

  const handleAddToCart = (product: StoreProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const cartKey = 'vernunt_store_cart_v1';
      const existingStr = localStorage.getItem(cartKey) || localStorage.getItem('vernunt_cart_v1');
      const currentCart: CartItem[] = existingStr ? JSON.parse(existingStr) : [];
      const matchIndex = currentCart.findIndex(c => c.productId === product.id);

      if (matchIndex >= 0) {
        currentCart[matchIndex].quantity += 1;
        currentCart[matchIndex].totalPrice = currentCart[matchIndex].quantity * currentCart[matchIndex].unitPrice;
      } else {
        const newItem: CartItem = {
          id: `${product.id}-default`,
          productId: product.id,
          product: product,
          selectedAttributes: {},
          quantity: 1,
          unitPrice: product.price,
          unitRegularPrice: product.regularPrice,
          gstRate: (product as any).gstRate || 5,
          totalPrice: product.price,
          vendorId: (product as any).vendorId,
          vendorName: product.brand || 'Vernunt'
        };
        currentCart.push(newItem);
      }
      setCart([...currentCart]);
      localStorage.setItem(cartKey, JSON.stringify(currentCart));
      localStorage.setItem('vernunt_cart_v1', JSON.stringify(currentCart));
      window.dispatchEvent(new CustomEvent('vernunt_cart_updated', { detail: currentCart }));
      setIsCartOpen(true);
      showToast(`🛍️ Added "${product.name}" to cart!`);
    } catch (err) {
      console.warn('Cart update note:', err);
      showToast(`Added "${product.name}" to cart!`);
    }
  };

  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    let updatedCart: CartItem[] = [];
    if (newQty <= 0) {
      updatedCart = cart.filter(item => item.id !== cartItemId);
      showToast('Item removed from cart');
    } else {
      updatedCart = cart.map(item =>
        item.id === cartItemId
          ? { ...item, quantity: newQty, totalPrice: newQty * item.unitPrice }
          : item
      );
    }
    setCart(updatedCart);
    localStorage.setItem('vernunt_store_cart_v1', JSON.stringify(updatedCart));
    localStorage.setItem('vernunt_cart_v1', JSON.stringify(updatedCart));
    window.dispatchEvent(new CustomEvent('vernunt_cart_updated', { detail: updatedCart }));
  };

  const handleApplyCoupon = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setCouponMessage({ type: 'error', text: 'Please enter a valid coupon code.' });
      return;
    }
    if (trimmed === 'VERNUNT15') {
      setAppliedCoupon({
        code: 'VERNUNT15',
        discountType: 'percentage',
        discountValue: 15,
        description: '15% Off Your Entire Order',
        minOrderAmount: 0
      });
      setCouponMessage({ type: 'success', text: 'Code VERNUNT15 applied (15% OFF)!' });
    } else if (trimmed === 'WELCOME50') {
      setAppliedCoupon({
        code: 'WELCOME50',
        discountType: 'fixed',
        discountValue: 50,
        description: '₹50 Off Welcome Coupon',
        minOrderAmount: 199
      });
      setCouponMessage({ type: 'success', text: 'Code WELCOME50 applied (₹50 OFF)!' });
    } else {
      setCouponMessage({ type: 'error', text: `Coupon code "${trimmed}" is invalid or expired.` });
    }
  };

  // ----------------------------------------------------
  // 5. Hero Carousel Campaigns
  // ----------------------------------------------------
  const defaultHeroCampaigns = useMemo(() => [
    {
      id: 'camp-playmates',
      kicker: 'Play Time Connect',
      headline: 'Little Moments. Big Memories.',
      description: 'Discover verified play partners, safe activities, and neighborhood families for your child.',
      cta: 'Explore Near You',
      action: () => {
        const el = document.getElementById('section-playmates');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        else onOpenPlaymates && onOpenPlaymates();
      },
      bgGradient: 'from-amber-100/90 via-orange-50/80 to-rose-50/70',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      iconEmoji: '🎈',
      themeColor: '#E11D48'
    },
    {
      id: 'camp-activities',
      kicker: 'Neighborhood Discovery',
      headline: 'Fun Activities Near Your Home',
      description: 'Sensory clay workshops, toddler gymnastics, puppet stories, and active weekend circles.',
      cta: 'Browse Activities',
      action: () => {
        const el = document.getElementById('section-events');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        else onOpenEvents && onOpenEvents();
      },
      bgGradient: 'from-sky-100/90 via-blue-50/80 to-indigo-50/70',
      badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
      iconEmoji: '🎨',
      themeColor: '#0284C7'
    },
    {
      id: 'camp-essentials',
      kicker: 'Curated Kids Marketplace',
      headline: 'Little Essentials for Every Milestone',
      description: '100% skin-safe organic clothing, beechwood Montessori toys, and pediatrician-tested care.',
      cta: 'Shop Essentials',
      action: () => {
        const el = document.getElementById('section-products');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        else onOpenStore && onOpenStore();
      },
      bgGradient: 'from-emerald-100/90 via-teal-50/80 to-amber-50/70',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      iconEmoji: '🧸',
      themeColor: '#059669'
    },
    {
      id: 'camp-classes',
      kicker: 'Enriching Skills & Values',
      headline: 'Free Online Sanskrit & Gita Recitation',
      description: 'Conducted live on Zoom by Geeta Pariwar for children & families. 100% free with certificates.',
      cta: 'Explore Classes',
      action: () => onOpenEvents && onOpenEvents('class-bhagavad-geeta-online'),
      bgGradient: 'from-purple-100/90 via-indigo-50/80 to-rose-50/70',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
      iconEmoji: '📖',
      themeColor: '#7C3AED'
    }
  ], [onOpenPlaymates, onOpenEvents, onOpenStore]);

  // Combine default campaigns with admin-configured banners
  const heroSlides = useMemo(() => {
    if (banners && banners.length > 0) {
      const mappedAdminBanners = banners.map(b => ({
        id: b.id || `admin-${Math.random()}`,
        kicker: b.badgeText || 'Featured Spotlight',
        headline: b.title || 'Discover More with Vernunt',
        description: b.description || 'Verified playmates, classes and kids essentials in your city.',
        cta: b.ctaText || 'Learn More',
        action: () => {
          if (b.actionUrl) {
            window.location.href = b.actionUrl;
          } else {
            onOpenEvents && onOpenEvents();
          }
        },
        bgGradient: 'from-rose-100/90 via-amber-50/80 to-orange-50/70',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        iconEmoji: '✨',
        themeColor: '#E11D48'
      }));
      return [...mappedAdminBanners, ...defaultHeroCampaigns];
    }
    return defaultHeroCampaigns;
  }, [banners, defaultHeroCampaigns, onOpenEvents]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  // Auto-advance hero carousel every 5.5s
  useEffect(() => {
    if (isCarouselHovered || heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isCarouselHovered, heroSlides.length]);

  // ----------------------------------------------------
  // 6. Events & Classes Category Filter
  // ----------------------------------------------------
  const [eventCategoryFilter, setEventCategoryFilter] = useState<'all' | 'events' | 'classes' | 'activities' | 'weekend' | 'online'>('all');

  const filteredEvents = useMemo(() => {
    if (eventCategoryFilter === 'all') return events;
    if (eventCategoryFilter === 'classes') {
      return events.filter(e => e.category === 'Class' || (e as any).itemCategoryType === 'classes');
    }
    if (eventCategoryFilter === 'activities') {
      return events.filter(e => e.category === 'Activity' || (e as any).itemCategoryType === 'activities');
    }
    if (eventCategoryFilter === 'weekend') {
      return events.filter(e => {
        const titleLower = e.title.toLowerCase();
        return titleLower.includes('weekend') || titleLower.includes('sat') || titleLower.includes('sun');
      });
    }
    if (eventCategoryFilter === 'online') {
      return events.filter(e => (e as any).deliveryMode === 'virtual' || e.location?.toLowerCase().includes('online') || e.location?.toLowerCase().includes('zoom'));
    }
    return events.filter(e => e.category === 'Event' || (e as any).itemCategoryType === 'events');
  }, [events, eventCategoryFilter]);

  // ----------------------------------------------------
  // 7. Discounts & Deals for Section 7
  // ----------------------------------------------------
  const [dealsCategory, setDealsCategory] = useState<'all' | 'products' | 'classes'>('all');

  const featuredDeals = useMemo(() => {
    const discountedProds = allProducts.filter(p => {
      const discount = p.discountPercentage || (p.regularPrice > p.price ? Math.round(((p.regularPrice - p.price) / p.regularPrice) * 100) : 0);
      return discount >= 10;
    }).slice(0, 8);

    const freeClasses = events.filter(e => e.ticketPrice === 0 || e.category === 'Class').slice(0, 4);

    if (dealsCategory === 'products') return { products: discountedProds, classes: [] };
    if (dealsCategory === 'classes') return { products: [], classes: freeClasses };
    return { products: discountedProds, classes: freeClasses };
  }, [allProducts, events, dealsCategory]);

  // ----------------------------------------------------
  // 8. Personalized Recommendations ("Picked for Your Family")
  // ----------------------------------------------------
  const [prefAge, setPrefAge] = useState<string>(() => {
    return userProfile?.childAge ? `${userProfile.childAge}y` : '2-4y';
  });
  const [prefInterest, setPrefInterest] = useState<string>('Sensory Play');
  const [showPrefModal, setShowPrefModal] = useState(false);

  const personalizedProducts = useMemo(() => {
    return allProducts.filter(p => {
      if (prefInterest.toLowerCase().includes('sensory') || prefInterest.toLowerCase().includes('montessori')) {
        return p.tags.some(t => t.toLowerCase().includes('sensory') || t.toLowerCase().includes('montessori') || t.toLowerCase().includes('wooden'));
      }
      if (prefInterest.toLowerCase().includes('art') || prefInterest.toLowerCase().includes('craft')) {
        return p.category.toLowerCase().includes('art') || p.tags.some(t => t.toLowerCase().includes('craft'));
      }
      return p.isFeatured;
    }).slice(0, 6);
  }, [allProducts, prefInterest]);

  // ----------------------------------------------------
  // 9. Unified Search Results Calculation
  // ----------------------------------------------------
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: 'product' | 'playmate' | 'event' | 'class';
      badge: string;
      image?: string;
      action: () => void;
    }> = [];

    // Search Products
    if (searchCategory === 'all' || searchCategory === 'products') {
      for (const p of allProducts) {
        if (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q))) {
          list.push({
            id: p.id,
            title: p.name,
            subtitle: `₹${p.price} • ${p.category} (${p.brand || 'Vernunt'})`,
            type: 'product',
            badge: 'Product',
            image: p.featuredImage,
            action: () => {
              setIsSearchOpen(false);
              onOpenStore && onOpenStore(p.id);
            }
          });
          if (list.length >= 25) break;
        }
      }
    }

    // Search Events & Classes
    if (searchCategory === 'all' || searchCategory === 'events' || searchCategory === 'classes' || searchCategory === 'activities') {
      for (const e of events) {
        if (e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)) {
          list.push({
            id: e.id,
            title: e.title,
            subtitle: `${e.date} • ${e.location} • ${e.ticketPrice === 0 ? 'Free' : `₹${e.ticketPrice}`}`,
            type: e.category === 'Class' ? 'class' : 'event',
            badge: e.category,
            image: e.photoUrl,
            action: () => {
              setIsSearchOpen(false);
              onOpenEvents && onOpenEvents(e.id);
            }
          });
          if (list.length >= 25) break;
        }
      }
    }

    // Search Playmates (Privacy-safe display)
    if (searchCategory === 'all' || searchCategory === 'playmates') {
      for (const p of playmates) {
        const loc = typeof p.location === 'string' ? p.location : (p.location?.address || p.area || p.city || 'Bengaluru');
        if (p.childName.toLowerCase().includes(q) || loc.toLowerCase().includes(q) || p.interests?.some(i => i.toLowerCase().includes(q))) {
          const isVerified = userProfile?.verificationStatus === 'VERIFIED';
          list.push({
            id: p.id,
            title: `${p.childName} (${p.childAge} yrs)`,
            subtitle: isVerified ? `Parent: ${p.parentName} • ${loc}` : `Verified Parent Network • ${p.area || 'Neighborhood'}`,
            type: 'playmate',
            badge: 'Playmate',
            image: isVerified ? p.photoUrl : undefined,
            action: () => {
              setIsSearchOpen(false);
              if (onSelectPlaymate) onSelectPlaymate(p);
              else onOpenPlaymates && onOpenPlaymates(p.id);
            }
          });
          if (list.length >= 25) break;
        }
      }
    }

    return list;
  }, [searchQuery, searchCategory, allProducts, events, playmates, userProfile, onOpenStore, onOpenEvents, onSelectPlaymate, onOpenPlaymates]);

  // Handle Search Submission
  const handleExecuteSearch = (term: string) => {
    setSearchQuery(term);
    if (!recentSearches.includes(term)) {
      const updated = [term, ...recentSearches.slice(0, 7)];
      setRecentSearches(updated);
      try {
        localStorage.setItem('vernunt_recent_searches_v1', JSON.stringify(updated));
      } catch (e) {
        console.debug('Recent search save error:', e);
      }
    }
  };

  // Keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Horizontal Carousel scroll helper
  const scrollRef = (ref: React.RefObject<HTMLDivElement | null>, offset: number) => {
    if (ref.current) {
      ref.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const productsScrollRef = useRef<HTMLDivElement>(null);
  const playmatesScrollRef = useRef<HTMLDivElement>(null);
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const dealsScrollRef = useRef<HTMLDivElement>(null);
  const recommendationsScrollRef = useRef<HTMLDivElement>(null);

  const isVerifiedUser = userProfile?.verificationStatus === 'VERIFIED';

  return (
    <div id="vernunt-homepage" className="min-h-screen w-full bg-[#FAF8F5] text-slate-900 font-sans pb-24 md:pb-16 selection:bg-rose-100 selection:text-rose-900">
      
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2 animate-fade-in border border-slate-700/60">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. TOP NAVIGATION AND SEARCH (COMPACT, RESPONSIVE HEADER)    */}
      {/* ============================================================ */}
      {!hideHeader && (
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          
          {/* Logo on Left */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 cursor-pointer shrink-0 select-none group"
            title="Vernunt - Play Time Connect"
          >
            <VernuntLogo size="sm" showText={false} animated={true} />
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black tracking-tight leading-none text-slate-900 font-serif">
                <span className="text-rose-600">vern</span>
                <span className="text-amber-500">unt</span>
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                Play Time Connect
              </span>
            </div>
          </div>

          {/* Prominent Search Bar (Click opens unified search overlay) */}
          <div className="flex-1 max-w-xl mx-2 hidden sm:block">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-full h-10 px-3.5 bg-slate-100/90 hover:bg-slate-100 border border-slate-200/90 rounded-2xl text-left flex items-center justify-between text-xs sm:text-sm text-slate-500 transition shadow-2xs group cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition" />
                <span className="truncate">Search products, playmates, events, classes...</span>
              </div>
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Header Cluster: Location, Mobile Search Icon, Notifications, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Mobile Search Icon Trigger */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="sm:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Open Search"
            >
              <Search className="w-5 h-5 text-slate-700" />
            </button>

            {/* Location / Pincode Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLocationPicker(!showLocationPicker)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200/70 rounded-xl text-xs font-bold text-rose-900 transition cursor-pointer"
                title="Change location or pincode"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="max-w-[85px] sm:max-w-[120px] truncate">{selectedLocality.name}</span>
                <ChevronDown className="w-3 h-3 text-rose-500 shrink-0" />
              </button>

              {/* Location Dropdown Modal */}
              {showLocationPicker && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50 animate-fade-in text-left">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Select Neighborhood</span>
                    <button 
                      onClick={() => setShowLocationPicker(false)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 1-Tap GPS Auto-Detection Button */}
                  <button
                    type="button"
                    disabled={isLocalityDetecting}
                    onClick={async () => {
                      setIsLocalityDetecting(true);
                      const captured = await autoDetectUserLocality();
                      setIsLocalityDetecting(false);
                      if (captured) {
                        setSelectedLocality(captured);
                        setShowLocationPicker(false);
                        showToast(`📍 Auto-captured: ${captured.name} (${captured.pincode})`);
                      }
                    }}
                    className="w-full mb-2.5 p-2 bg-gradient-to-r from-rose-50 to-amber-50 hover:from-rose-100 hover:to-amber-100 border border-rose-200 rounded-xl flex items-center justify-between text-xs font-bold text-rose-950 transition cursor-pointer shadow-2xs active:scale-98"
                  >
                    <div className="flex items-center gap-2">
                      <Navigation className={`w-3.5 h-3.5 text-rose-600 ${isLocalityDetecting ? 'animate-spin' : ''}`} />
                      <span>{isLocalityDetecting ? 'Detecting GPS...' : '📍 Auto-Detect My Location (GPS)'}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-white px-2 py-0.5 rounded-md border border-rose-200">
                      GPS
                    </span>
                  </button>

                  <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                    {POPULAR_LOCALITIES.map((loc) => (
                      <button
                        key={loc.pincode}
                        type="button"
                        onClick={() => {
                          setSelectedLocality(loc);
                          try {
                            localStorage.setItem('vernunt_user_locality', JSON.stringify(loc));
                          } catch (e) {
                            console.debug('Locality save error:', e);
                          }
                          setShowLocationPicker(false);
                          showToast(`📍 Location updated to ${loc.name} (${loc.pincode})`);
                        }}
                        className={`w-full px-2.5 py-1.5 text-xs text-left rounded-xl font-medium flex items-center justify-between transition cursor-pointer ${
                          selectedLocality.pincode === loc.pincode ? 'bg-rose-50 text-rose-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{loc.name}, {loc.city}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{loc.pincode}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom Pincode Input */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Enter your Pincode:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 560001"
                        value={customPincodeInput}
                        onChange={(e) => setCustomPincodeInput(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-rose-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customPincodeInput.length === 6) {
                            const newLoc = { name: `Pincode ${customPincodeInput}`, pincode: customPincodeInput, city: 'Bengaluru' };
                            setSelectedLocality(newLoc);
                            try {
                              localStorage.setItem('vernunt_user_locality', JSON.stringify(newLoc));
                            } catch (e) {
                              console.debug('Locality custom save error:', e);
                            }
                            setShowLocationPicker(false);
                            showToast(`📍 Pincode set to ${customPincodeInput}`);
                          }
                        }}
                        disabled={customPincodeInput.length !== 6}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Icon (with unread indicator when genuine count > 0) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => onOpenContactUs && onOpenContactUs()}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition relative cursor-pointer"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5 text-slate-700" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>
            </div>

            {/* Profile / Avatar Menu or Sign In */}
            {userProfile ? (
              <button
                type="button"
                onClick={() => onOpenAuthModal ? onOpenAuthModal() : onStartSignUp('Parent')}
                className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-2xl transition cursor-pointer"
                title={`Logged in as ${userProfile.parentName}`}
              >
                {userProfile.photoUrl ? (
                  <img src={userProfile.photoUrl} alt={userProfile.parentName} className="w-7 h-7 rounded-full object-cover border border-white" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                    {userProfile.parentName?.charAt(0) || 'P'}
                  </div>
                )}
                <span className="hidden md:inline text-xs font-bold text-slate-800 max-w-[90px] truncate">
                  {userProfile.parentName}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuthModal ? onOpenAuthModal() : onStartSignUp('Parent')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-extrabold rounded-2xl transition shadow-xs active:scale-95 cursor-pointer"
              >
                Sign In
              </button>
            )}

          </div>
        </div>
      </header>
      )}

      {/* ============================================================ */}
      {/* UNIFIED SEARCH MODAL / OVERLAY                                */}
      {/* ============================================================ */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl p-4 sm:p-6 space-y-4 my-8 text-left animate-slide-up">
            
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <Search className="w-5 h-5 text-rose-500 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search products, child playmates, events, classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm sm:text-base font-semibold text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 rounded-lg cursor-pointer"
              >
                Esc
              </button>
            </div>

            {/* Category Suggestion Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs font-bold">
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'products', label: 'Baby Products' },
                { id: 'playmates', label: 'Play Partners' },
                { id: 'events', label: 'Events' },
                { id: 'classes', label: 'Classes' },
                { id: 'activities', label: 'Activities' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSearchCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                    searchCategory === cat.id 
                      ? 'bg-rose-600 text-white shadow-2xs font-black' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Recent Searches Pills when query is empty */}
            {!searchQuery && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Recent Searches</span>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => handleExecuteSearch(term)}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>🔍</span>
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Real Search Results List */}
            {searchQuery && (
              <div className="space-y-1.5 max-h-80 overflow-y-auto no-scrollbar divide-y divide-slate-100">
                {searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={item.action}
                      className="w-full p-2.5 rounded-2xl hover:bg-rose-50/60 transition text-left flex items-center justify-between gap-3 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                          {item.image ? (
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-base">
                              {item.type === 'product' ? '🧸' : item.type === 'playmate' ? '👶' : '🎈'}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 truncate group-hover:text-rose-600 transition">
                              {item.title}
                            </span>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition shrink-0" />
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center space-y-1">
                    <p className="text-sm font-bold text-slate-700">No matching results found for "{searchQuery}"</p>
                    <p className="text-xs text-slate-500">Try searching for "Montessori", "Clothing", "Gita", or "Bangalore".</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Main Content Feed Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-8 sm:space-y-12">
        
        {/* ============================================================ */}
        {/* 3. HERO BANNER CAROUSEL (SWIPEABLE, CAMPAIGNS, ADMIN CMS)   */}
        {/* ============================================================ */}
        <section 
          id="hero-banner-carousel" 
          aria-label="Promotional Campaigns"
          onMouseEnter={() => setIsCarouselHovered(true)}
          onMouseLeave={() => setIsCarouselHovered(false)}
          className="relative w-full rounded-3xl overflow-hidden shadow-sm border border-slate-200/90"
        >
          <div className="relative w-full aspect-[21/9] min-h-[220px] sm:min-h-[280px] md:min-h-[320px] transition-all duration-500">
            {heroSlides.map((slide, idx) => {
              const isActive = idx === currentSlideIndex;
              return (
                <div
                  key={slide.id}
                  className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} p-5 sm:p-8 md:p-12 flex flex-col justify-between transition-opacity duration-700 ${
                    isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  {/* Decorative Background Motif */}
                  <div className="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 text-7xl sm:text-9xl md:text-[140px] opacity-25 select-none pointer-events-none">
                    {slide.iconEmoji}
                  </div>

                  {/* Kicker badge */}
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border shadow-2xs ${slide.badgeClass}`}>
                      <Sparkles className="w-3 h-3 text-rose-500 animate-pulse" />
                      {slide.kicker}
                    </span>
                  </div>

                  {/* Headline & Description */}
                  <div className="max-w-xl space-y-2 z-10">
                    <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-slate-900 font-serif leading-tight tracking-tight">
                      {slide.headline}
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base text-slate-700 font-medium line-clamp-2 max-w-lg leading-relaxed">
                      {slide.description}
                    </p>
                  </div>

                  {/* Call to action button */}
                  <div className="pt-2 z-10">
                    <button
                      type="button"
                      onClick={slide.action}
                      className="px-5 py-2.5 sm:px-6 sm:py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-extrabold rounded-2xl transition shadow-md hover:shadow-lg active:scale-95 cursor-pointer inline-flex items-center gap-2"
                    >
                      <span>{slide.cta}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Carousel Left / Right Arrows */}
          <button
            type="button"
            onClick={() => setCurrentSlideIndex(prev => (prev - 1 + heroSlides.length) % heroSlides.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md flex items-center justify-center transition cursor-pointer active:scale-90"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentSlideIndex(prev => (prev + 1) % heroSlides.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md flex items-center justify-center transition cursor-pointer active:scale-90"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Pagination Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-white/60 backdrop-blur-xs px-2.5 py-1 rounded-full shadow-2xs">
            {heroSlides.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => setCurrentSlideIndex(dotIdx)}
                className={`transition-all duration-300 rounded-full ${
                  dotIdx === currentSlideIndex ? 'w-5 h-2 bg-slate-900' : 'w-2 h-2 bg-slate-400 hover:bg-slate-600'
                }`}
                aria-label={`Go to slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* CATEGORY TILES (MATCHING SCREENSHOT 2: PLAYDATE, SHOP, EVENTS, GROUPS) */}
        {/* ============================================================ */}
        <section id="section-hero-categories" className="py-2">
          <div className="grid grid-cols-4 gap-3 sm:gap-6 max-w-2xl mx-auto">
            
            {/* 1. Play Time */}
            <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => onOpenPlaymates && onOpenPlaymates()}>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[22px] sm:rounded-[26px] bg-gradient-to-br from-[#FFE4D6] via-[#FFD7C5] to-[#FFC4AA] shadow-sm flex items-center justify-center p-2.5 transition-all duration-200 group-hover:scale-105 group-hover:shadow-md border border-[#FFD2BE]">
                <div className="flex items-center justify-center text-rose-600">
                  <Baby className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.2] fill-rose-300/40 text-rose-600 drop-shadow-xs" />
                </div>
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight text-center">
                Play Time
              </span>
            </div>

            {/* 2. Shop */}
            <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => onOpenStore && onOpenStore()}>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[22px] sm:rounded-[26px] bg-gradient-to-br from-[#FFF5C8] via-[#FFE899] to-[#FFD868] shadow-sm flex items-center justify-center p-2.5 transition-all duration-200 group-hover:scale-105 group-hover:shadow-md border border-[#FFE28A]">
                <div className="flex items-center justify-center text-pink-500">
                  <ShoppingBag className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.2] fill-pink-300/40 text-pink-500 drop-shadow-xs" />
                </div>
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight text-center">
                Shop
              </span>
            </div>

            {/* 3. Events */}
            <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => onOpenEvents && onOpenEvents()}>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[22px] sm:rounded-[26px] bg-gradient-to-br from-[#EBD9FF] via-[#DAC0FF] to-[#C7A3FF] shadow-sm flex items-center justify-center p-2.5 transition-all duration-200 group-hover:scale-105 group-hover:shadow-md border border-[#D5B7FF]">
                <div className="flex items-center justify-center text-rose-500">
                  <Tag className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.2] fill-rose-300/40 text-rose-500 -rotate-12 drop-shadow-xs" />
                </div>
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight text-center">
                Events
              </span>
            </div>

            {/* 4. Groups */}
            <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => onOpenGroups && onOpenGroups()}>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[22px] sm:rounded-[26px] bg-gradient-to-br from-[#D4ECFF] via-[#BCDDFF] to-[#9ECBFF] shadow-sm flex items-center justify-center p-2.5 transition-all duration-200 group-hover:scale-105 group-hover:shadow-md border border-[#B1D7FF]">
                <div className="flex items-center justify-center text-orange-500">
                  <Users className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.2] fill-orange-300/40 text-orange-600 drop-shadow-xs" />
                </div>
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight text-center">
                Groups
              </span>
            </div>

          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. BABY PRODUCTS CAROUSEL — "LITTLE ESSENTIALS"              */}
        {/* ============================================================ */}
        <section id="section-products" className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🧸</span>
                <h3 className="text-lg sm:text-2xl font-black text-slate-900 font-serif">
                  Little Essentials
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Discover products for your little one.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenStore && onOpenStore()}
                className="text-xs sm:text-sm font-extrabold text-rose-600 hover:text-rose-700 flex items-center gap-1 group cursor-pointer mr-2"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </button>
              <div className="hidden sm:flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollRef(productsScrollRef, -320)}
                  className="p-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-2xs cursor-pointer"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollRef(productsScrollRef, 320)}
                  className="p-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-2xs cursor-pointer"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Horizontal Swipeable Product Carousel (2.2 cards mobile, 4 desktop) */}
          <div
            ref={productsScrollRef}
            className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-2"
          >
            {allProducts.slice(0, 10).map((product) => {
              const isWish = wishlist.includes(product.id);
              const discount = product.discountPercentage ?? (
                product.regularPrice > product.price 
                  ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100) 
                  : 0
              );

              return (
                <div
                  key={product.id}
                  onClick={() => onOpenStore && onOpenStore(product.id)}
                  className="w-[170px] sm:w-[220px] md:w-[260px] shrink-0 snap-start bg-white rounded-3xl border border-slate-200/90 p-3 sm:p-4 flex flex-col justify-between hover:shadow-md transition group cursor-pointer relative"
                >
                  {/* Top Wishlist Button & Discount Badge */}
                  <div className="relative w-full aspect-square rounded-2xl bg-amber-50/40 overflow-hidden mb-2.5 flex items-center justify-center border border-slate-100">
                    {product.featuredImage ? (
                      <img 
                        src={product.featuredImage} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          // Fallback container if image fails
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                    )}

                    {discount > 0 && (
                      <span className="absolute top-2 left-2 bg-rose-600 text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md shadow-2xs">
                        {discount}% OFF
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleToggleWishlist(product.id, e)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-rose-500 shadow-2xs transition active:scale-90"
                      aria-label="Save to wishlist"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isWish ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-1">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                      {product.brand || 'Vernunt Essentials'}
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-rose-600 transition line-clamp-2 leading-snug">
                      {product.name}
                    </h4>

                    {/* Rating */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-slate-700">{product.rating || 4.8}</span>
                      <span className="text-slate-400">({product.reviewCount || 42})</span>
                    </div>

                    {/* Price with strikethrough */}
                    <div className="flex items-baseline gap-1.5 pt-1">
                      <span className="text-sm sm:text-base font-black text-slate-900 font-mono">
                        ₹{product.price}
                      </span>
                      {product.regularPrice > product.price && (
                        <span className="text-[11px] text-slate-400 line-through font-mono">
                          ₹{product.regularPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart CTA */}
                  <div className="pt-3 mt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(product, e)}
                      className="w-full py-1.5 sm:py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 5. CHILD PROFILES — PRIVACY-FIRST LOCKED CAROUSEL            */}
        {/* ============================================================ */}
        <section id="section-playmates" className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">👶</span>
                <h3 className="text-lg sm:text-2xl font-black text-slate-900 font-serif">
                  Discover Playmates
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Find nearby families and age-matched play partners.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenPlaymates && onOpenPlaymates()}
                className="text-xs sm:text-sm font-extrabold text-rose-600 hover:text-rose-700 flex items-center gap-1 group cursor-pointer mr-2"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </button>
              <div className="hidden sm:flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollRef(playmatesScrollRef, -320)}
                  className="p-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-2xs cursor-pointer"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollRef(playmatesScrollRef, 320)}
                  className="p-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-2xs cursor-pointer"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Privacy & Safety Lock Status Notification */}
          {!userProfile ? (
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-amber-950">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Locked Profiles:</strong> Sign in with mobile or email to view neighborhood child profiles and connect safely.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onOpenAuthModal ? onOpenAuthModal() : onStartSignUp('Parent')}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shrink-0 text-xs transition cursor-pointer"
              >
                Sign In / Sign Up
              </button>
            </div>
          ) : !isVerifiedUser ? (
            <div className="bg-rose-50/90 border border-rose-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-rose-950">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  {userProfile.aadhaarDocName || userProfile.kycStatus === 'pending'
                    ? <strong>KYC Verification Under Admin Review: Profiles unlock once approved.</strong>
                    : <strong>KYC Verification Required: You skipped KYC at signup. Upload documents to unlock child profiles.</strong>
                  }
                </span>
              </div>
              <button
                type="button"
                onClick={() => onOpenAuthModal ? onOpenAuthModal() : onStartSignUp('Parent')}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shrink-0 text-xs transition cursor-pointer"
              >
                {userProfile.aadhaarDocName || userProfile.kycStatus === 'pending' ? 'Review Status' : 'Upload Documents'}
              </button>
            </div>
          ) : null}

          {/* Playmates Horizontal Cards (Exact UI Matching Screenshot 3) */}
          <div
            ref={playmatesScrollRef}
            className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-2"
          >
            {playmates.slice(0, 10).map((mate, idx) => {
              // Curated illustrated avatar placeholders matching screenshot 3
              const childAvatarBg = idx % 2 === 0 ? 'bg-[#D6F0E0]' : 'bg-[#FFE2DE]';
              const familyAvatarBg = idx % 2 === 0 ? 'bg-[#E5DCFF]' : 'bg-[#FFF0D4]';

              return (
                <div
                  key={mate.id}
                  className="w-[190px] sm:w-[210px] shrink-0 snap-start bg-white rounded-3xl border border-slate-200/90 p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition text-left"
                >
                  <div className="space-y-3">
                    {/* Top Row: Dual Circular Avatars (Child + Family) matching Screenshot 3 */}
                    <div className="flex items-center">
                      {/* 1. Child Avatar */}
                      <div className={`w-12 h-12 rounded-full ${childAvatarBg} border-2 border-white shadow-2xs flex items-center justify-center overflow-hidden shrink-0`}>
                        {isVerifiedUser && mate.photoUrl ? (
                          <img src={mate.photoUrl} alt={mate.childName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl select-none leading-none">
                            {mate.childGender === 'Girl' ? '👧' : '👦'}
                          </span>
                        )}
                      </div>

                      {/* 2. Family Avatar (Slight overlapping offset) */}
                      <div className={`w-12 h-12 rounded-full ${familyAvatarBg} border-2 border-white shadow-2xs flex items-center justify-center overflow-hidden shrink-0 -ml-2.5`}>
                        <span className="text-xl select-none leading-none">
                          👨‍👩‍👧
                        </span>
                      </div>
                    </div>

                    {/* Child Name & Age */}
                    <div>
                      <h4 className="font-bold text-base text-slate-900 leading-tight">
                        {isVerifiedUser ? `${mate.childName}, ${mate.childAge}` : (userProfile ? `${mate.childName}, ${mate.childAge}` : `Playmate, ${mate.childAge}`)}
                      </h4>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        Mutual Interests
                      </p>
                    </div>
                  </div>

                  {/* Connect Action Button (Solid Purple Button matching Screenshot 3) */}
                  <div className="pt-3 mt-2">
                    {isVerifiedUser ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectPlaymate) onSelectPlaymate(mate);
                          else onOpenPlaymates && onOpenPlaymates(mate.id);
                        }}
                        className="w-full py-2.5 bg-[#5B4DF6] hover:bg-[#4E3FE4] text-white font-bold rounded-2xl text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer text-center"
                      >
                        Connect
                      </button>
                    ) : !userProfile ? (
                      <button
                        type="button"
                        onClick={() => onOpenAuthModal ? onOpenAuthModal() : onStartSignUp('Parent')}
                        className="w-full py-2.5 bg-[#5B4DF6] hover:bg-[#4E3FE4] text-white font-bold rounded-2xl text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5 text-white/80" />
                        <span>Connect</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          showToast(userProfile.kycStatus === 'pending' || userProfile.aadhaarDocName
                            ? '⏳ Profile in queue: Admin is verifying your KYC documents. You will be able to connect once approved.'
                            : '🛡️ KYC required: Please upload parent ID documents to connect with families.'
                          );
                        }}
                        className="w-full py-2.5 bg-[#5B4DF6] hover:bg-[#4E3FE4] text-white font-bold rounded-2xl text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5 text-white/80" />
                        <span>Connect</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 6. EVENTS, CLASSES AND ACTIVITIES CAROUSEL                   */}
        {/* ============================================================ */}
        <section id="section-events" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🎪</span>
                <h3 className="text-lg sm:text-2xl font-black text-slate-900 font-serif">
                  Explore, Learn &amp; Play
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Weekend activities, creative workshops and classes.
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3">
              {/* Category Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs font-bold">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'events', label: 'Events' },
                  { id: 'classes', label: 'Classes' },
                  { id: 'activities', label: 'Activities' },
                  { id: 'weekend', label: 'Weekend Fun' },
                  { id: 'online', label: 'Online' }
                ].map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => setEventCategoryFilter(chip.id as any)}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                      eventCategoryFilter === chip.id
                        ? 'bg-indigo-600 text-white font-black shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onOpenEvents && onOpenEvents()}
                className="text-xs sm:text-sm font-extrabold text-rose-600 hover:text-rose-700 flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Events Horizontal Swipeable Carousel */}
          <div
            ref={eventsScrollRef}
            className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-2"
          >
            {filteredEvents.map((evt) => {
              const isFree = evt.ticketPrice === 0;

              return (
                <div
                  key={evt.id}
                  onClick={() => onOpenEvents && onOpenEvents(evt.id)}
                  className="w-[220px] sm:w-[270px] md:w-[300px] shrink-0 snap-start bg-white rounded-3xl border border-slate-200/90 p-3.5 sm:p-4 flex flex-col justify-between hover:shadow-md transition group cursor-pointer text-left relative"
                >
                  {/* Event Thumbnail */}
                  <div className="relative w-full aspect-[16/10] rounded-2xl bg-indigo-50/50 overflow-hidden mb-3 flex items-center justify-center border border-slate-100">
                    {evt.photoUrl ? (
                      <img src={evt.photoUrl} alt={evt.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        {evt.iconEmoji || '🎪'}
                      </div>
                    )}

                    <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                      {evt.category}
                    </span>

                    <span className={`absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-md shadow-2xs ${
                      isFree ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                    }`}>
                      {isFree ? 'FREE' : `₹${evt.ticketPrice}`}
                    </span>
                  </div>

                  {/* Title and metadata */}
                  <div className="space-y-1.5">
                    <h4 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-indigo-600 transition line-clamp-2 leading-snug">
                      {evt.title}
                    </h4>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{evt.date} • {evt.time}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{evt.location}</span>
                    </div>

                    {evt.targetAgeRange && (
                      <span className="inline-block text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md mt-1">
                        Suitable for {evt.targetAgeRange}
                      </span>
                    )}
                  </div>

                  {/* Booking CTA */}
                  <div className="pt-3 mt-3 border-t border-slate-100">
                    <button
                      type="button"
                      className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1 active:scale-98 cursor-pointer"
                    >
                      <span>{isFree ? 'Join for Free' : 'Book Details'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 7. FEATURED DISCOUNTS & DEALS — "LITTLE DEALS, BIG SMILES"   */}
        {/* ============================================================ */}
        <section id="section-deals" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🏷️</span>
                <h3 className="text-lg sm:text-2xl font-black text-slate-900 font-serif">
                  Little Deals, Big Smiles
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Handpicked offers, genuine discounts &amp; free community learning.
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold">
              {[
                { id: 'all', label: 'All Offers' },
                { id: 'products', label: 'Baby Products' },
                { id: 'classes', label: 'Free Classes' }
              ].map(d => (
                <button
                  key={d.id}
                  onClick={() => setDealsCategory(d.id as any)}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    dealsCategory === d.id ? 'bg-amber-600 text-white font-black shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={dealsScrollRef}
            className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-2"
          >
            {/* Discounted Products */}
            {featuredDeals.products.map(p => {
              const discountPct = p.discountPercentage ?? Math.round(((p.regularPrice - p.price) / p.regularPrice) * 100);
              return (
                <div
                  key={`deal-p-${p.id}`}
                  onClick={() => onOpenStore && onOpenStore(p.id)}
                  className="w-[180px] sm:w-[230px] shrink-0 snap-start bg-white rounded-3xl border-2 border-amber-200/80 p-3 sm:p-4 flex flex-col justify-between hover:shadow-md transition text-left cursor-pointer group"
                >
                  <div>
                    <div className="relative aspect-square rounded-2xl bg-amber-50/50 overflow-hidden mb-2.5 flex items-center justify-center">
                      <img src={p.featuredImage} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <span className="absolute top-2 left-2 bg-amber-500 text-white font-black text-[10px] px-2 py-0.5 rounded-md shadow-2xs">
                        SAVE {discountPct}%
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase block truncate">{p.brand}</span>
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-amber-600 transition truncate mt-0.5">{p.name}</h5>
                    <div className="flex items-baseline gap-1.5 pt-1">
                      <span className="text-sm font-black text-slate-900 font-mono">₹{p.price}</span>
                      <span className="text-xs text-slate-400 line-through font-mono">₹{p.regularPrice}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(p, e)}
                    className="w-full mt-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer"
                  >
                    Grab Deal 🛍️
                  </button>
                </div>
              );
            })}

            {/* Free Classes */}
            {featuredDeals.classes.map(c => (
              <div
                key={`deal-c-${c.id}`}
                onClick={() => onOpenEvents && onOpenEvents(c.id)}
                className="w-[200px] sm:w-[250px] shrink-0 snap-start bg-white rounded-3xl border-2 border-purple-200/80 p-3 sm:p-4 flex flex-col justify-between hover:shadow-md transition text-left cursor-pointer group"
              >
                <div>
                  <div className="relative aspect-[16/10] rounded-2xl bg-purple-50 overflow-hidden mb-2.5 flex items-center justify-center">
                    <img src={c.photoUrl} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    <span className="absolute top-2 left-2 bg-purple-600 text-white font-black text-[10px] px-2 py-0.5 rounded-md shadow-2xs">
                      100% FREE
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-800 uppercase block truncate">Live on Zoom</span>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-purple-600 transition line-clamp-2 mt-0.5">{c.title}</h5>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{c.targetAgeRange}</p>
                </div>
                <button
                  type="button"
                  className="w-full mt-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer"
                >
                  Join Free
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 8. PERSONALIZED RECOMMENDATIONS — "PICKED FOR YOUR FAMILY"   */}
        {/* ============================================================ */}
        <section id="section-recommendations" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h3 className="text-lg sm:text-2xl font-black text-slate-900 font-serif">
                  Picked for Your Family
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Curated for age: <strong className="text-slate-800">{prefAge}</strong> • Interest: <strong className="text-slate-800">{prefInterest}</strong>
              </p>
            </div>

            {/* Preference Chips Toggle */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-bold">
              {['Sensory Play', 'Montessori', 'Art & Craft', 'Books & Phonics'].map(int => (
                <button
                  key={int}
                  onClick={() => setPrefInterest(int)}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                    prefInterest === int 
                      ? 'bg-rose-600 text-white font-black shadow-2xs' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {int}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={recommendationsScrollRef}
            className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-2"
          >
            {personalizedProducts.map(p => (
              <div
                key={`rec-${p.id}`}
                onClick={() => onOpenStore && onOpenStore(p.id)}
                className="w-[170px] sm:w-[220px] md:w-[250px] shrink-0 snap-start bg-white rounded-3xl border border-slate-200/90 p-3.5 flex flex-col justify-between hover:shadow-md transition text-left cursor-pointer group"
              >
                <div>
                  <div className="relative aspect-square rounded-2xl bg-rose-50/40 overflow-hidden mb-2.5 flex items-center justify-center">
                    <img src={p.featuredImage} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    <span className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-xs text-rose-800 font-black text-[9px] px-2 py-0.5 rounded-full shadow-2xs">
                      {p.ageLabel}
                    </span>
                  </div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-rose-600 transition truncate">{p.name}</h5>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{p.shortDescription}</p>
                  <span className="text-sm font-black text-slate-900 font-mono mt-1 block">₹{p.price}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleAddToCart(p, e)}
                  className="w-full mt-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Quick Add
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 9. NEARBY PLAYTIME & PARENT COMMUNITY — "PLAYTIME AROUND YOU" */}
        {/* ============================================================ */}
        <section id="section-community" className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🌳</span>
                <h3 className="text-lg sm:text-2xl font-black text-slate-900 font-serif">
                  Playtime Around You
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Join verified parent circles and weekend park sessions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenGroups && onOpenGroups()}
              className="text-xs sm:text-sm font-extrabold text-rose-600 hover:text-rose-700 flex items-center gap-1 group cursor-pointer"
            >
              <span>Explore All Groups</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {LOCAL_PLAYTIME_GROUPS.map(grp => (
              <div
                key={grp.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition text-left relative space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {grp.activityType}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {grp.ageSuitability}
                    </span>
                  </div>

                  <h4 className="font-black text-sm sm:text-base text-slate-900 leading-snug">
                    {grp.title}
                  </h4>

                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{grp.neighborhood}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{grp.suggestedSchedule}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{grp.confirmedCount} Verified Families Joined</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                    {grp.organizer}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenGroups && onOpenGroups()}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl transition cursor-pointer"
                  >
                    Join Circle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 10. ADDITIONAL DISCOVERY TILES (POPULAR / TRENDING / DAYCARE) */}
        {/* ============================================================ */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
          
          <button
            type="button"
            onClick={() => onOpenStore && onOpenStore()}
            className="p-4 rounded-3xl bg-white border border-slate-200/90 hover:border-rose-300 hover:shadow-md transition text-left space-y-2 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl group-hover:scale-105 transition">
              🛍️
            </div>
            <div>
              <h5 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-rose-600 transition">Vernunt Shop</h5>
              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">Montessori toys, gear &amp; learning kits</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onOpenParks && onOpenParks()}
            className="p-4 rounded-3xl bg-white border border-slate-200/90 hover:border-emerald-300 hover:shadow-md transition text-left space-y-2 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl group-hover:scale-105 transition">
              🌳
            </div>
            <div>
              <h5 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition">Bangalore Parks &amp; Play</h5>
              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">140+ verified neighborhood parks &amp; live playmates</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onOpenKidStories && onOpenKidStories()}
            className="p-4 rounded-3xl bg-white border border-slate-200/90 hover:border-purple-300 hover:shadow-md transition text-left space-y-2 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl group-hover:scale-105 transition">
              📖
            </div>
            <div>
              <h5 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-purple-600 transition">Kids Stories Hub</h5>
              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">Illustrated moral tales &amp; bedtime flipbooks</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onOpenTracker && onOpenTracker()}
            className="p-4 rounded-3xl bg-white border border-slate-200/90 hover:border-emerald-300 hover:shadow-md transition text-left space-y-2 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl group-hover:scale-105 transition">
              📊
            </div>
            <div>
              <h5 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-emerald-600 transition">Growth &amp; Vaccines</h5>
              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">Child milestones &amp; pediatric vaccination schedule</p>
            </div>
          </button>

        </section>

      </main>

      {/* ============================================================ */}
      {/* 11. BOTTOM NAVIGATION FOR MOBILE (5 PERSISTENT DESTINATIONS)  */}
      {/* ============================================================ */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1 flex items-center justify-around"
      >
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center justify-center py-1 px-3 text-rose-600 font-bold min-h-[44px] cursor-pointer"
        >
          <span className="text-lg">🏠</span>
          <span className="text-[10px] mt-0.5 font-black text-rose-600">Home</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenStore && onOpenStore()}
          className="flex flex-col items-center justify-center py-1 px-3 text-slate-600 hover:text-slate-900 font-bold min-h-[44px] cursor-pointer"
        >
          <span className="text-lg">🛍️</span>
          <span className="text-[10px] mt-0.5">Explore</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenPlaymates && onOpenPlaymates()}
          className="flex flex-col items-center justify-center py-1 px-3 text-slate-600 hover:text-slate-900 font-bold min-h-[44px] cursor-pointer"
        >
          <span className="text-lg">👶</span>
          <span className="text-[10px] mt-0.5">Playtime</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenEvents && onOpenEvents()}
          className="flex flex-col items-center justify-center py-1 px-3 text-slate-600 hover:text-slate-900 font-bold min-h-[44px] cursor-pointer"
        >
          <span className="text-lg">🎪</span>
          <span className="text-[10px] mt-0.5">Events</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenAuthModal ? onOpenAuthModal() : onStartSignUp('Parent')}
          className="flex flex-col items-center justify-center py-1 px-3 text-slate-600 hover:text-slate-900 font-bold min-h-[44px] cursor-pointer"
        >
          <span className="text-lg">{userProfile ? '👤' : '🔑'}</span>
          <span className="text-[10px] mt-0.5">{userProfile ? 'Profile' : 'Sign In'}</span>
        </button>
      </nav>

      {/* Shopping Cart Slide-Over Drawer */}
      <CartSlideOverDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          if (onOpenStore) {
            onOpenStore('checkout');
          }
        }}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={handleApplyCoupon}
        couponMessage={couponMessage}
      />

    </div>
  );
}
