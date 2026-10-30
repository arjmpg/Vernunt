import React, { useState, useEffect, useMemo } from 'react';
import { 
  BangalorePark, ParkVisitBroadcast, ParkVisitRsvp, ChildProfile, ParkCheckinRecord 
} from '../../types.ts';
import { 
  BANGALORE_PARKS, BANGALORE_PARK_ZONES, PARK_FACILITY_OPTIONS, 
  PARK_TIME_SLOTS, INITIAL_PARK_VISITS 
} from '../../data/bangaloreParks.ts';
import { getHaversineDistance, openDeviceNavigation } from '../../utils/distance.ts';
import { 
  Search, MapPin, Navigation, Calendar, Clock, Users, Plus, 
  Sparkles, ExternalLink, Share2, Check, X, ShieldCheck, 
  ChevronRight, Heart, MessageSquare, AlertCircle, Info,
  Filter, Layers, ArrowUpDown, Trees, Footprints, Baby,
  CheckCircle2, Crosshair, Radio, LocateFixed, LogOut, Compass
} from 'lucide-react';
import { db } from '../../utils/firebase.ts';
import { 
  collection, onSnapshot, doc, setDoc, updateDoc, arrayUnion, query, orderBy,
  increment, serverTimestamp 
} from 'firebase/firestore';
import confetti from 'canvas-confetti';

interface BangaloreParksHubProps {
  userProfile: ChildProfile | null;
  userLat?: number;
  userLng?: number;
  onOpenChatWithParent?: (targetUserId: string, initialMessage?: string) => void;
  onRequireAuth?: () => void;
}

export default function BangaloreParksHub({
  userProfile,
  userLat = 12.9716,
  userLng = 77.5946,
  onOpenChatWithParent,
  onRequireAuth
}: BangaloreParksHubProps) {
  // Parks list: Pre-seeded authentic parks + custom added by community
  const [customParks, setCustomParks] = useState<BangalorePark[]>(() => {
    try {
      const saved = localStorage.getItem('vernunt_custom_parks_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Real-time visits broadcasts
  const [parkVisits, setParkVisits] = useState<ParkVisitBroadcast[]>(() => {
    try {
      const saved = localStorage.getItem('vernunt_park_visits_v1');
      return saved ? JSON.parse(saved) : INITIAL_PARK_VISITS;
    } catch {
      return INITIAL_PARK_VISITS;
    }
  });

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'distance' | 'popular' | 'rating' | 'visits'>('distance');
  const [activeTab, setActiveTab] = useState<'all_parks' | 'today_schedule' | 'my_broadcasts'>('all_parks');
  const [amenityFilter, setAmenityFilter] = useState<'all' | 'verified' | 'accessible' | 'cafeteria'>('all');
  const [spaceCategoryFilter, setSpaceCategoryFilter] = useState<'all' | 'parks_playgrounds' | 'community_centers' | 'indoor_paid'>('all');

  // Geolocation state for parent device (refined on mount and on refresh)
  const [deviceLat, setDeviceLat] = useState<number>(userLat);
  const [deviceLng, setDeviceLng] = useState<number>(userLng);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [hasRefinedGps, setHasRefinedGps] = useState(false);

  // Real-time live visitor counts from Firestore 'parks' collection
  const [liveVisitorCounts, setLiveVisitorCounts] = useState<Record<string, number>>({});

  // Check-in tracking state
  const [checkedInParkId, setCheckedInParkId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('vernunt_checked_in_park_id');
    } catch {
      return null;
    }
  });
  const [checkingInParkId, setCheckingInParkId] = useState<string | null>(null);

  // Boundary verification modal (when parent is outside park boundary)
  const [boundaryModalData, setBoundaryModalData] = useState<{
    park: BangalorePark;
    distanceMeters: number;
    distanceKm: number;
    boundaryMeters: number;
    userCoords: { lat: number; lng: number };
  } | null>(null);

  // Celebration success modal upon verified check-in
  const [checkinSuccessData, setCheckinSuccessData] = useState<{
    park: BangalorePark;
    distanceMeters: number;
    boundaryMeters: number;
    isSimulated: boolean;
    liveCount: number;
  } | null>(null);

  // Helper amenities evaluators
  const isParkVerified = (p: BangalorePark) => {
    return Boolean(
      p.verified === true || 
      p.isApproved === true || 
      p.approvalStatus === 'APPROVED' || 
      Boolean(p.bbmpWard) || 
      (p.placeRating !== undefined && p.placeRating >= 4.0)
    );
  };

  const isParkAccessible = (p: BangalorePark) => {
    return Boolean(
      (p as any).accessible === true ||
      p.facilities.some(f => /accessible|stroller|wheelchair|ramp/i.test(f)) ||
      p.highlights.some(h => /accessible|stroller|wheelchair|ramp/i.test(h)) ||
      p.name.toLowerCase().includes('inclusive')
    );
  };

  const isParkHasCafeteria = (p: BangalorePark) => {
    return Boolean(
      (p as any).hasCafeteria === true ||
      p.facilities.some(f => /cafeteria|canteen|food|refreshment|snack|kiosk|tea|coffee/i.test(f)) ||
      p.highlights.some(h => /cafeteria|canteen|food|refreshment|snack|kiosk|tea|coffee|mtr|hopcoms|eatery/i.test(h))
    );
  };

  const isParentVerified = Boolean(userProfile && (
    userProfile.userRole === 'Admin' || 
    userProfile.verificationStatus === 'VERIFIED' || 
    userProfile.verificationStatus === 'Verified' || 
    userProfile.aadhaarVerified
  ));
  const isKycSkipped = Boolean(userProfile && (
    (userProfile as any).kycSkipped || 
    (userProfile as any).kycStatus === 'skipped' || 
    userProfile.verificationStatus === 'Unverified'
  ));

  // Selected Park for "Who is Playing" Inspector drawer/modal
  const [inspectingPark, setInspectingPark] = useState<BangalorePark | null>(null);

  // Inspector Date and Time filters
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<string>('all');

  // Modal: Broadcast Kid's Park Visit
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTargetPark, setBroadcastTargetPark] = useState<BangalorePark | null>(null);
  const [broadcastDate, setBroadcastDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [broadcastTimeSlot, setBroadcastTimeSlot] = useState<string>('04:30 PM - 06:00 PM');
  const [broadcastActivity, setBroadcastActivity] = useState<string>('Swings, Slides & Sandpit Play');
  const [broadcastNotes, setBroadcastNotes] = useState<string>('');
  const [broadcastChildName, setBroadcastChildName] = useState<string>(userProfile?.childName || '');
  const [broadcastChildAge, setBroadcastChildAge] = useState<number>(userProfile?.childAge || 4);
  const [isSubmittingBroadcast, setIsSubmittingBroadcast] = useState(false);

  // Modal: Add / Scrape New Park
  const [isAddParkModalOpen, setIsAddParkModalOpen] = useState(false);
  const [newParkName, setNewParkName] = useState('');
  const [newParkLocality, setNewParkLocality] = useState('');
  const [newParkZone, setNewParkZone] = useState<BangalorePark['zone']>('South');
  const [newParkAddress, setNewParkAddress] = useState('');
  const [newParkPincode, setNewParkPincode] = useState('560001');
  const [newParkLat, setNewParkLat] = useState<string>('');
  const [newParkLng, setNewParkLng] = useState<string>('');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [newParkFacilities, setNewParkFacilities] = useState<string[]>([
    'Toddler Play Area', 'Swings & Slides', 'Lush Shade Trees'
  ]);
  const [newParkTimings, setNewParkTimings] = useState('5:30 AM – 10:00 AM & 4:30 PM – 8:30 PM');
  const [newParkMapsUrl, setNewParkMapsUrl] = useState('');

  // RSVP prompt modal
  const [rsvpTargetVisit, setRsvpTargetVisit] = useState<ParkVisitBroadcast | null>(null);
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDetectGpsForPark = () => {
    if (!navigator.geolocation) {
      showToast('⚠️ Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGps(false);
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setNewParkLat(lat);
        setNewParkLng(lng);
        showToast(`📍 GPS captured: Lat ${lat}, Lng ${lng}`);
      },
      (err) => {
        setIsDetectingGps(false);
        showToast(`⚠️ GPS retrieval failed: ${err.message}. Please enter coordinates manually.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Device location auto-refinement
  const requestDeviceLocation = (showNotification = false) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      if (showNotification) showToast('⚠️ Geolocation is not supported by your browser.');
      return;
    }
    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeviceLat(pos.coords.latitude);
        setDeviceLng(pos.coords.longitude);
        setHasRefinedGps(true);
        setIsLocatingUser(false);
        if (showNotification) {
          showToast(`📍 GPS refined to your live location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        }
      },
      (err) => {
        setIsLocatingUser(false);
        if (showNotification) {
          showToast(`📍 Location note: using Bangalore center. (${err.message})`);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  useEffect(() => {
    requestDeviceLocation(false);
  }, []);

  useEffect(() => {
    if (userLat && userLng) {
      setDeviceLat(userLat);
      setDeviceLng(userLng);
    }
  }, [userLat, userLng]);

  // Sync with Firestore collection `parks` in real-time for live visitor counts
  useEffect(() => {
    try {
      const q = collection(db, 'parks');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const counts: Record<string, number> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && typeof data.live_visitor_count === 'number') {
            counts[docSnap.id] = data.live_visitor_count;
          }
        });
        setLiveVisitorCounts(counts);
      }, (err) => {
        console.debug('Firestore parks live counts listener note:', err);
      });
      return () => unsubscribe();
    } catch (err) {
      console.debug('Parks live count listener setup note:', err);
    }
  }, []);

  // Sync with Firestore collection `park_visits` in real-time
  useEffect(() => {
    try {
      const q = collection(db, 'park_visits');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const cloudVisits: ParkVisitBroadcast[] = [];
          snapshot.forEach((docSnap) => {
            cloudVisits.push({ id: docSnap.id, ...docSnap.data() } as ParkVisitBroadcast);
          });
          // Merge with initial visits to preserve rich showcase
          const visitMap = new Map<string, ParkVisitBroadcast>();
          INITIAL_PARK_VISITS.forEach(v => visitMap.set(v.id, v));
          cloudVisits.forEach(v => visitMap.set(v.id, v));
          const merged = Array.from(visitMap.values());
          setParkVisits(merged);
          try {
            localStorage.setItem('vernunt_park_visits_v1', JSON.stringify(merged));
          } catch (storageErr) {
            console.debug('Storage note:', storageErr);
          }
        }
      }, (err) => {
        console.debug('Firestore park_visits listener note:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.debug('Firestore setup note:', e);
    }
  }, []);

  // Sync custom community added parks
  useEffect(() => {
    try {
      const q = collection(db, 'custom_parks');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list: BangalorePark[] = [];
          snapshot.forEach(docSnap => {
            list.push({ id: docSnap.id, ...docSnap.data() } as BangalorePark);
          });
          setCustomParks(list);
          try {
            localStorage.setItem('vernunt_custom_parks_v1', JSON.stringify(list));
          } catch (storageErr) {
            console.debug('Storage custom parks note:', storageErr);
          }
        }
      }, () => {});
      return () => unsubscribe();
    } catch (err) {
      console.debug('Custom parks setup note:', err);
    }
  }, []);

  const isAdmin = userProfile?.userRole === 'Admin';

  // Boundary verification helper: calculates physical perimeter radius in meters
  const calculateParkBoundaryMeters = (park: BangalorePark): number => {
    if (park.boundaryRadiusMeters && park.boundaryRadiusMeters > 0) {
      return park.boundaryRadiusMeters;
    }
    const acres = park.areaAcres || 2.5;
    // 1 acre = ~4047 sq. meters. Circular equivalent radius = sqrt(acres * 4047 / PI)
    // 150m buffer covers entry gates, car parks, perimeter walking tracks and GPS drift
    const computed = Math.round(Math.sqrt((acres * 4047) / Math.PI) + 150);
    return Math.max(450, computed); // Minimum 450m radius
  };

  // Combine pre-seeded Bangalore parks with custom added parks
  const allParks = useMemo(() => {
    const combined = [...customParks, ...BANGALORE_PARKS];
    const map = new Map<string, BangalorePark>();
    combined.forEach(p => {
      if (!map.has(p.id)) {
        // Calculate distance from parent using detected deviceLat & deviceLng
        const distanceKm = getHaversineDistance(deviceLat, deviceLng, p.lat, p.lng);
        // Calculate how many active visits are scheduled today
        const todayStr = new Date().toISOString().split('T')[0];
        const visitsToday = parkVisits.filter(v => v.parkId === p.id && v.visitDate === todayStr);

        // Pre-seeded parks are automatically approved; custom parks require admin approval
        const isApproved = p.isApproved !== undefined 
          ? p.isApproved 
          : (p.isCustomAdded ? false : true);
        const approvalStatus = p.approvalStatus || (isApproved ? 'APPROVED' : 'PENDING_APPROVAL');

        const liveCount = liveVisitorCounts[p.id] ?? p.live_visitor_count ?? 0;
        const boundaryRadius = p.boundaryRadiusMeters || calculateParkBoundaryMeters(p);

        map.set(p.id, {
          ...p,
          isApproved,
          approvalStatus,
          distanceKm: Number(distanceKm.toFixed(1)),
          activeVisitsCount: visitsToday.length,
          live_visitor_count: liveCount,
          boundaryRadiusMeters: boundaryRadius
        });
      }
    });
    return Array.from(map.values());
  }, [customParks, deviceLat, deviceLng, parkVisits, liveVisitorCounts]);

  // Pending parks count for admin
  const pendingParks = useMemo(() => {
    return allParks.filter(p => p.isCustomAdded && (p.isApproved === false || p.approvalStatus === 'PENDING_APPROVAL'));
  }, [allParks]);

  // Compute counts for amenities filter buttons
  const amenityCounts = useMemo(() => {
    let verified = 0;
    let accessible = 0;
    let cafeteria = 0;
    allParks.forEach(p => {
      if (isParkVerified(p)) verified++;
      if (isParkAccessible(p)) accessible++;
      if (isParkHasCafeteria(p)) cafeteria++;
    });
    return { verified, accessible, cafeteria };
  }, [allParks]);

  // Compute counts for space categories (Parks & Playgrounds, Community Centers, Indoor/Paid)
  const categoryCounts = useMemo(() => {
    let parks = 0;
    let community = 0;
    let indoor = 0;
    allParks.forEach(p => {
      const cat = p.category || 'parks_playgrounds';
      if (cat === 'community_centers') community++;
      else if (cat === 'indoor_paid') indoor++;
      else parks++;
    });
    return {
      all: allParks.length,
      parks_playgrounds: parks,
      community_centers: community,
      indoor_paid: indoor
    };
  }, [allParks]);

  // Filtered and sorted parks
  const filteredParks = useMemo(() => {
    return allParks.filter(p => {
      // Approval check: Non-admins only see approved parks OR parks they personally submitted
      if (!isAdmin) {
        const isSelfSubmitted = userProfile?.id && p.submittedByUserId === userProfile.id;
        if (!p.isApproved && !isSelfSubmitted) {
          return false;
        }
      }

      // Space category subcategory filter (Parks & Playgrounds, Community Centers, Indoor / Paid)
      if (spaceCategoryFilter !== 'all') {
        const pCat = p.category || 'parks_playgrounds';
        if (pCat !== spaceCategoryFilter) {
          return false;
        }
      }

      // Amenity filters: 'Verified', 'Accessible', 'Has Cafeteria'
      if (amenityFilter === 'verified' && !isParkVerified(p)) {
        return false;
      }
      if (amenityFilter === 'accessible' && !isParkAccessible(p)) {
        return false;
      }
      if (amenityFilter === 'cafeteria' && !isParkHasCafeteria(p)) {
        return false;
      }

      // Zone filter
      if (selectedZone !== 'All' && p.zone !== selectedZone) {
        return false;
      }
      // Facilities filter
      if (selectedFacilities.length > 0) {
        const matchesAllFacilities = selectedFacilities.every(f => {
          const cleanF = f.replace(/[^\w\s]/gi, '').trim().toLowerCase();
          return p.facilities.some(pf => pf.toLowerCase().includes(cleanF));
        });
        if (!matchesAllFacilities) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchLoc = p.locality.toLowerCase().includes(q);
        const matchAddr = p.address.toLowerCase().includes(q);
        const matchHigh = p.highlights.some(h => h.toLowerCase().includes(q));
        const matchKannada = p.kannadaName?.toLowerCase().includes(q);
        if (!matchName && !matchLoc && !matchAddr && !matchHigh && !matchKannada) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      // User requirement: Always sort nearest ones to user as first
      if (sortBy === 'distance') {
        return (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999);
      }
      if (sortBy === 'visits') {
        const diff = (b.activeVisitsCount || 0) - (a.activeVisitsCount || 0);
        return diff !== 0 ? diff : (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999);
      }
      if (sortBy === 'rating') {
        const diff = (b.placeRating || 0) - (a.placeRating || 0);
        return diff !== 0 ? diff : (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999);
      }
      // popular
      const diff = (b.reviewsCount || 0) - (a.reviewsCount || 0);
      return diff !== 0 ? diff : (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999);
    });
  }, [allParks, spaceCategoryFilter, amenityFilter, selectedZone, selectedFacilities, searchQuery, sortBy, isAdmin, userProfile?.id]);

  // Handler for space categories ensuring nearest sort priority is preserved
  const handleSelectSpaceCategory = (category: 'all' | 'parks_playgrounds' | 'community_centers' | 'indoor_paid') => {
    setSpaceCategoryFilter(category);
    // User requirement: For playtime park and play always sort nearest ones to user as first
    setSortBy('distance');
  };

  // Get visits for a specific park and filtered by selected date and time
  const getFilteredVisitsForPark = (parkId: string, date: string, timeSlotId: string) => {
    return parkVisits.filter(v => {
      if (v.parkId !== parkId) return false;
      if (date && v.visitDate !== date) return false;
      if (timeSlotId !== 'all') {
        if (timeSlotId === 'morning_early' && !v.timeSlot.includes('AM')) return false;
        if (timeSlotId === 'evening_peak' && !v.timeSlot.includes('PM')) return false;
      }
      return true;
    });
  };

  // Broadcast park visit submission
  const handleBroadcastVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTargetPark) return;
    if (!userProfile) {
      if (onRequireAuth) onRequireAuth();
      else alert('Please sign in as a parent to broadcast your park visit.');
      return;
    }

    setIsSubmittingBroadcast(true);
    const visitId = `visit-${broadcastTargetPark.id}-${Date.now()}`;
    const newVisit: ParkVisitBroadcast = {
      id: visitId,
      parkId: broadcastTargetPark.id,
      parkName: broadcastTargetPark.name,
      parkLocality: broadcastTargetPark.locality,
      parkAddress: broadcastTargetPark.address,
      parkLat: broadcastTargetPark.lat,
      parkLng: broadcastTargetPark.lng,
      parentUserId: userProfile.id,
      parentName: userProfile.parentName || 'Parent',
      parentPhotoUrl: userProfile.parentPhotoUrl || userProfile.photoUrl || '',
      childName: broadcastChildName.trim() || userProfile.childName,
      childAge: broadcastChildAge || userProfile.childAge,
      childInterests: userProfile.interests || ['Outdoor Play', 'Swings', 'Running'],
      visitDate: broadcastDate,
      timeSlot: broadcastTimeSlot,
      timeCategory: broadcastTimeSlot.toLowerCase().includes('am') ? 'morning' : 'evening',
      plannedActivity: broadcastActivity.trim() || 'Outdoor play & swings with neighborhood kids',
      notes: broadcastNotes.trim(),
      isOpenInvitation: true,
      rsvps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Save to Firestore
      const visitRef = doc(db, 'park_visits', visitId);
      await setDoc(visitRef, newVisit).catch((err) => {
        console.warn('Firestore direct write fallback:', err);
      });

      // Update local state
      setParkVisits(prev => [newVisit, ...prev]);
      setIsBroadcastModalOpen(false);
      setBroadcastNotes('');
      showToast(`🎉 Broadcast shared! Other parents visiting ${broadcastTargetPark.name} can now see your kid is playing!`);
    } catch (err: any) {
      showToast(`Saved to device! Visit broadcast is active.`);
      setParkVisits(prev => [newVisit, ...prev]);
      setIsBroadcastModalOpen(false);
    } finally {
      setIsSubmittingBroadcast(false);
    }
  };

  // RSVP to an existing broadcast
  const handleJoinVisit = async () => {
    if (!rsvpTargetVisit) return;
    if (!userProfile) {
      if (onRequireAuth) onRequireAuth();
      else alert('Please sign in as a parent to join this park playdate.');
      return;
    }

    setIsSubmittingRsvp(true);
    const rsvp: ParkVisitRsvp = {
      userId: userProfile.id,
      parentName: userProfile.parentName,
      parentPhotoUrl: userProfile.parentPhotoUrl || userProfile.photoUrl || '',
      childName: userProfile.childName,
      childAge: userProfile.childAge,
      childInterests: userProfile.interests || [],
      message: rsvpMessage.trim() || `We're coming too! Excited to play.`,
      joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    try {
      const visitRef = doc(db, 'park_visits', rsvpTargetVisit.id);
      await updateDoc(visitRef, {
        rsvps: arrayUnion(rsvp),
        updatedAt: new Date().toISOString()
      }).catch(() => {});

      setParkVisits(prev => prev.map(item => {
        if (item.id === rsvpTargetVisit.id) {
          const alreadyJoined = item.rsvps.some(r => r.userId === userProfile.id);
          return {
            ...item,
            rsvps: alreadyJoined ? item.rsvps : [...item.rsvps, rsvp]
          };
        }
        return item;
      }));

      setRsvpTargetVisit(null);
      setRsvpMessage('');
      showToast(`🌟 Awesome! ${userProfile.childName} is joined to play with ${rsvpTargetVisit.childName}!`);
    } catch {
      showToast(`Joined! Added to playmate roster.`);
      setRsvpTargetVisit(null);
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  // Add custom park with mandatory latitude and longitude, and Admin approval requirement
  const handleAddNewPark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('⚠️ Access restricted: Only platform administrators can add or scrape parks.');
      setIsAddParkModalOpen(false);
      return;
    }
    if (!newParkName.trim()) {
      showToast('⚠️ Park name is mandatory.');
      return;
    }
    if (!newParkLocality.trim()) {
      showToast('⚠️ Locality / area is mandatory.');
      return;
    }
    const latNum = parseFloat(String(newParkLat).trim());
    const lngNum = parseFloat(String(newParkLng).trim());

    if (isNaN(latNum) || latNum < -90 || latNum > 90 || latNum === 0) {
      showToast('⚠️ Latitude is mandatory! Please enter a valid decimal (e.g. 12.9716) or click Autofill GPS.');
      return;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180 || lngNum === 0) {
      showToast('⚠️ Longitude is mandatory! Please enter a valid decimal (e.g. 77.5946) or click Autofill GPS.');
      return;
    }

    const isCurrentAdmin = userProfile?.userRole === 'Admin';
    const parkId = `custom-park-${Date.now()}`;
    const newPark: BangalorePark = {
      id: parkId,
      name: newParkName.trim(),
      locality: newParkLocality.trim() || 'Bangalore',
      zone: newParkZone,
      address: newParkAddress.trim() || `${newParkName.trim()}, ${newParkLocality.trim()}, Bangalore`,
      pincode: newParkPincode.trim() || '560001',
      lat: Number(latNum.toFixed(6)),
      lng: Number(lngNum.toFixed(6)),
      timings: newParkTimings.trim(),
      entryFee: 'Free',
      facilities: newParkFacilities.length > 0 ? newParkFacilities : ['Toddler Play Area', 'Lush Shade Trees'],
      highlights: ['Neighborhood park added by community parent', 'Safe for evening strolls & child play'],
      imageUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=80',
      googleMapsUrl: newParkMapsUrl.trim() || `https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}`,
      placeRating: 4.5,
      reviewsCount: 1,
      isCustomAdded: true,
      isApproved: isCurrentAdmin,
      approvalStatus: isCurrentAdmin ? 'APPROVED' : 'PENDING_APPROVAL',
      submittedByUserId: userProfile?.id || 'community-guest',
      submittedByUserName: userProfile?.parentName || 'Parent',
      submittedAt: new Date().toISOString()
    };

    try {
      const parkRef = doc(db, 'custom_parks', parkId);
      await setDoc(parkRef, newPark).catch(() => {});
      setCustomParks(prev => [newPark, ...prev]);
      setIsAddParkModalOpen(false);
      setNewParkName('');
      setNewParkAddress('');
      setNewParkLat('');
      setNewParkLng('');
      if (isCurrentAdmin) {
        showToast(`🌳 "${newPark.name}" added and published immediately!`);
      } else {
        showToast(`🛡️ "${newPark.name}" submitted! Awaiting Administrator Approval before appearing publicly.`);
      }
    } catch {
      setCustomParks(prev => [newPark, ...prev]);
      setIsAddParkModalOpen(false);
      showToast(`🛡️ "${newPark.name}" submitted! Awaiting Administrator Approval.`);
    }
  };

  const handleApprovePark = async (park: BangalorePark) => {
    const updated: BangalorePark = {
      ...park,
      isApproved: true,
      approvalStatus: 'APPROVED'
    };
    try {
      await setDoc(doc(db, 'custom_parks', park.id), updated, { merge: true }).catch(() => {});
    } catch (e) {
      console.debug('Cloud approve note:', e);
    }
    setCustomParks(prev => prev.map(p => p.id === park.id ? updated : p));
    showToast(`✅ "${park.name}" approved and published to all parents!`);
  };

  const handleRejectPark = async (park: BangalorePark) => {
    try {
      await updateDoc(doc(db, 'custom_parks', park.id), {
        isApproved: false,
        approvalStatus: 'REJECTED'
      }).catch(() => {});
    } catch (e) {
      console.debug('Cloud reject note:', e);
    }
    setCustomParks(prev => prev.filter(p => p.id !== park.id));
    showToast(`❌ "${park.name}" rejected and removed from listings.`);
  };

  // Execute check-in: increments live_visitor_count in Firestore and logs checkin document
  const executeCheckin = async (
    park: BangalorePark,
    userCoords: { lat: number; lng: number },
    distanceMeters: number,
    boundaryMeters: number,
    isSimulated = false
  ) => {
    try {
      // 1. Atomically increment live_visitor_count in Firestore
      const parkRef = doc(db, 'parks', park.id);
      await setDoc(parkRef, {
        id: park.id,
        name: park.name,
        locality: park.locality,
        zone: park.zone,
        lat: park.lat,
        lng: park.lng,
        live_visitor_count: increment(1),
        last_checkin_at: serverTimestamp(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 2. Write check-in audit record to park_checkins
      const checkinId = `checkin-${park.id}-${userProfile?.id || 'guest'}-${Date.now()}`;
      await setDoc(doc(db, 'park_checkins', checkinId), {
        id: checkinId,
        parkId: park.id,
        parkName: park.name,
        userId: userProfile?.id || 'guest-parent',
        parentName: userProfile?.parentName || 'Parent',
        childName: userProfile?.childName || 'Child',
        lat: userCoords.lat,
        lng: userCoords.lng,
        distanceMeters,
        boundaryMeters,
        isSimulated,
        timestamp: new Date().toISOString()
      }).catch(err => console.debug('Checkin log note:', err));

      // 3. Update local state & storage
      setCheckedInParkId(park.id);
      try {
        localStorage.setItem('vernunt_checked_in_park_id', park.id);
        localStorage.setItem('vernunt_checked_in_park_name', park.name);
      } catch (storageErr) {
        console.debug('Storage note:', storageErr);
      }

      const currentCount = liveVisitorCounts[park.id] ?? park.live_visitor_count ?? 0;
      const newLiveCount = currentCount + 1;
      setLiveVisitorCounts(prev => ({ ...prev, [park.id]: newLiveCount }));

      // 4. Trigger celebration confetti
      try {
        confetti({
          particleCount: 85,
          spread: 75,
          origin: { y: 0.6 }
        });
      } catch (confettiErr) {
        console.debug('Confetti note:', confettiErr);
      }

      // 5. Open check-in success modal
      setCheckinSuccessData({
        park,
        distanceMeters,
        boundaryMeters,
        isSimulated,
        liveCount: newLiveCount
      });

      showToast(`🎉 Verified & Checked In at ${park.name}! Live visitor count updated.`);
    } catch (err: any) {
      console.error('Checkin error:', err);
      setCheckedInParkId(park.id);
      try {
        localStorage.setItem('vernunt_checked_in_park_id', park.id);
      } catch (storageErr) {
        console.debug('Storage fallback note:', storageErr);
      }
      showToast(`✅ Checked in at ${park.name}!`);
    } finally {
      setCheckingInParkId(null);
      setBoundaryModalData(null);
    }
  };

  // Check-in at Park: Uses device geolocation to verify parent is within park boundary
  const handleCheckinAtPark = (park: BangalorePark, forceSimulated = false) => {
    if (forceSimulated) {
      setCheckingInParkId(park.id);
      const boundary = calculateParkBoundaryMeters(park);
      executeCheckin(park, { lat: park.lat, lng: park.lng }, 45, boundary, true);
      return;
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
      showToast('⚠️ Geolocation not available on device. Simulating check-in for preview.');
      const boundary = calculateParkBoundaryMeters(park);
      executeCheckin(park, { lat: park.lat, lng: park.lng }, 50, boundary, true);
      return;
    }

    setCheckingInParkId(park.id);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLatActual = pos.coords.latitude;
        const userLngActual = pos.coords.longitude;
        setDeviceLat(userLatActual);
        setDeviceLng(userLngActual);
        setHasRefinedGps(true);

        const distanceKm = getHaversineDistance(userLatActual, userLngActual, park.lat, park.lng);
        const distanceMeters = Math.round(distanceKm * 1000);
        const boundaryMeters = calculateParkBoundaryMeters(park);

        if (distanceMeters <= boundaryMeters) {
          // Inside boundary - verified!
          executeCheckin(park, { lat: userLatActual, lng: userLngActual }, distanceMeters, boundaryMeters, false);
        } else {
          // Outside boundary
          setCheckingInParkId(null);
          setBoundaryModalData({
            park,
            distanceMeters,
            distanceKm: Number(distanceKm.toFixed(2)),
            boundaryMeters,
            userCoords: { lat: userLatActual, lng: userLngActual }
          });
        }
      },
      (err) => {
        setCheckingInParkId(null);
        const boundaryMeters = calculateParkBoundaryMeters(park);
        const distanceKm = getHaversineDistance(deviceLat, deviceLng, park.lat, park.lng);
        const distanceMeters = Math.round(distanceKm * 1000);
        setBoundaryModalData({
          park,
          distanceMeters,
          distanceKm: Number(distanceKm.toFixed(2)),
          boundaryMeters,
          userCoords: { lat: deviceLat, lng: deviceLng }
        });
        showToast(`📍 Geolocation Note: ${err.message}. You can retry or simulate check-in.`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 }
    );
  };

  // Check out of park: decrements live visitor count in Firestore
  const handleCheckoutOfPark = async (park: BangalorePark) => {
    try {
      const current = liveVisitorCounts[park.id] ?? park.live_visitor_count ?? 1;
      const parkRef = doc(db, 'parks', park.id);
      await setDoc(parkRef, {
        live_visitor_count: increment(current > 0 ? -1 : 0),
        last_checkout_at: serverTimestamp(),
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});

      setLiveVisitorCounts(prev => ({
        ...prev,
        [park.id]: Math.max(0, (prev[park.id] ?? park.live_visitor_count ?? 1) - 1)
      }));
    } catch (err) {
      console.debug('Checkout error note:', err);
    } finally {
      setCheckedInParkId(null);
      try {
        localStorage.removeItem('vernunt_checked_in_park_id');
        localStorage.removeItem('vernunt_checked_in_park_name');
      } catch (storageErr) {
        console.debug('Storage note:', storageErr);
      }
      showToast(`👋 You checked out of ${park.name}. Hope you and your child had a great time!`);
    }
  };

  return (
    <div className="w-full bg-slate-50 py-4 sm:py-6 px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 animate-fade-in">
      {/* Toast Announcement */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slide-up text-sm font-semibold max-w-md">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 animate-spin" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-auto text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Strip: Bangalore Parks & Playtime Connect */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-10 shadow-xl border border-emerald-800/40">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Trees className="w-4 h-4 text-emerald-400" />
            <span>Bangalore Parks &amp; Playtime Connect</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-serif tracking-tight leading-tight">
            Discover Every Park in Bangalore — <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200">
              See Who&apos;s Playing &amp; Invite Nearby Kids!
            </span>
          </h1>

          <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed max-w-2xl">
            Want to take your child to the park? Check real-time &amp; scheduled playtime slots to see other parents and kids visiting. Or announce your own park visit so neighborhood friends can join and play together!
          </p>

          {/* Quick Metrics & Highlights */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-emerald-200">
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <MapPin className="w-4 h-4 text-amber-300" />
              <span>{allParks.length} Bangalore Parks Curated</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <Users className="w-4 h-4 text-emerald-300" />
              <span>{parkVisits.length} Active Park Playdates</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <ShieldCheck className="w-4 h-4 text-teal-300" />
              <span>100% Verified Parent Network</span>
            </div>
          </div>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                if (!userProfile && onRequireAuth) {
                  onRequireAuth();
                  return;
                }
                setBroadcastTargetPark(allParks[0] || null);
                setIsBroadcastModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition transform active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>📢 My Kid is Going to the Park (Broadcast)</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsAddParkModalOpen(true)}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center gap-2 border border-white/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-300" />
                <span>Add / Scrape Any Park (Admin)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Checked-In Active Status Bar */}
      {checkedInParkId && (() => {
        const activePark = allParks.find(p => p.id === checkedInParkId);
        return (
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-emerald-400/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 text-xl backdrop-blur-xs">
                📍
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200">
                    Live Visit Active Now
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black">
                  You are checked in at {activePark?.name || 'Bangalore Park'}
                </h3>
                <p className="text-xs text-emerald-100 font-medium">
                  Your live visit increments the visitor counter for nearby parents. Tap Check Out when leaving.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {activePark && (
                <button
                  type="button"
                  onClick={() => {
                    setInspectingPark(activePark);
                    setSelectedDate(new Date().toISOString().split('T')[0]);
                  }}
                  className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl transition cursor-pointer backdrop-blur-xs"
                >
                  View Details
                </button>
              )}
              <button
                type="button"
                onClick={() => activePark && handleCheckoutOfPark(activePark)}
                className="px-4 py-2 bg-white text-emerald-950 font-black text-xs rounded-xl shadow-md hover:bg-emerald-50 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5 text-emerald-700" />
                <span>Check Out</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Medium-Sized Round Sub-Categories Selector */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/90 space-y-3.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
              Browse Play Space Sub-Categories
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">
              {filteredParks.length} locations available
            </span>
          </div>
        </div>

        {/* Medium-Size Round Category Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Sub-Category: All Spaces */}
          <button
            type="button"
            onClick={() => handleSelectSpaceCategory('all')}
            className={`py-3 px-4 rounded-full transition-all duration-200 flex items-center justify-between gap-3 text-left cursor-pointer border-2 ${
              spaceCategoryFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400/40'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base font-bold transition-colors ${
                spaceCategoryFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800'
              }`}>
                🌟
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-black block truncate">All Play Spaces</span>
                <span className={`text-[10px] block truncate ${spaceCategoryFilter === 'all' ? 'text-slate-300' : 'text-slate-400'}`}>
                  Parks, centers &amp; indoor
                </span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-black shrink-0 ${
              spaceCategoryFilter === 'all' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-700'
            }`}>
              {categoryCounts.all}
            </span>
          </button>

          {/* Sub-Category 1: Parks & Playgrounds */}
          <button
            type="button"
            onClick={() => handleSelectSpaceCategory('parks_playgrounds')}
            className={`py-3 px-4 rounded-full transition-all duration-200 flex items-center justify-between gap-3 text-left cursor-pointer border-2 ${
              spaceCategoryFilter === 'parks_playgrounds'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300/40'
                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base font-bold transition-colors ${
                spaceCategoryFilter === 'parks_playgrounds' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                🌳
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-black block truncate">Parks &amp; Playgrounds</span>
                <span className={`text-[10px] block truncate ${spaceCategoryFilter === 'parks_playgrounds' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  Outdoor public green
                </span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-black shrink-0 ${
              spaceCategoryFilter === 'parks_playgrounds' ? 'bg-white text-emerald-800' : 'bg-emerald-50 text-emerald-800'
            }`}>
              {categoryCounts.parks_playgrounds}
            </span>
          </button>

          {/* Sub-Category 2: Community & Recreation Centers */}
          <button
            type="button"
            onClick={() => handleSelectSpaceCategory('community_centers')}
            className={`py-3 px-4 rounded-full transition-all duration-200 flex items-center justify-between gap-3 text-left cursor-pointer border-2 ${
              spaceCategoryFilter === 'community_centers'
                ? 'bg-indigo-700 text-white border-indigo-700 shadow-md ring-2 ring-indigo-300/40'
                : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base font-bold transition-colors ${
                spaceCategoryFilter === 'community_centers' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
              }`}>
                🏫
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-black block truncate">Community &amp; Recreation</span>
                <span className={`text-[10px] block truncate ${spaceCategoryFilter === 'community_centers' ? 'text-indigo-100' : 'text-slate-400'}`}>
                  Turfs &amp; sports complexes
                </span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-black shrink-0 ${
              spaceCategoryFilter === 'community_centers' ? 'bg-white text-indigo-800' : 'bg-indigo-50 text-indigo-800'
            }`}>
              {categoryCounts.community_centers}
            </span>
          </button>

          {/* Sub-Category 3: Indoor / Paid Play Spaces */}
          <button
            type="button"
            onClick={() => handleSelectSpaceCategory('indoor_paid')}
            className={`py-3 px-4 rounded-full transition-all duration-200 flex items-center justify-between gap-3 text-left cursor-pointer border-2 ${
              spaceCategoryFilter === 'indoor_paid'
                ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300/40'
                : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base font-bold transition-colors ${
                spaceCategoryFilter === 'indoor_paid' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
              }`}>
                🎟️
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-black block truncate">Indoor / Paid Play Spaces</span>
                <span className={`text-[10px] block truncate ${spaceCategoryFilter === 'indoor_paid' ? 'text-amber-100' : 'text-slate-400'}`}>
                  Soft play &amp; trampolines
                </span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-black shrink-0 ${
              spaceCategoryFilter === 'indoor_paid' ? 'bg-white text-amber-900' : 'bg-amber-50 text-amber-900'
            }`}>
              {categoryCounts.indoor_paid}
            </span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all_parks')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'all_parks'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-slate-650 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Trees className="w-4 h-4" />
            <span>All Bangalore Parks ({filteredParks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('today_schedule')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'today_schedule'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-slate-650 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Who&apos;s Playing Today &amp; Upcoming</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black">
              {parkVisits.length}
            </span>
          </button>
        </div>

        {/* Amenity Filter & Proximity / Sorting Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Amenity Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="text-xs font-bold text-slate-600 hidden sm:inline">Amenity:</span>
            <select
              value={amenityFilter}
              onChange={(e) => setAmenityFilter(e.target.value as any)}
              className="bg-white border border-emerald-300 text-emerald-950 font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-emerald-600 cursor-pointer shadow-2xs"
              aria-label="Filter parks by amenity"
            >
              <option value="all">🌟 All Parks ({allParks.length})</option>
              <option value="verified">🛡️ Verified ({amenityCounts.verified})</option>
              <option value="accessible">♿ Accessible ({amenityCounts.accessible})</option>
              <option value="cafeteria">☕ Has Cafeteria ({amenityCounts.cafeteria})</option>
            </select>
          </div>

          {/* Proximity / Sorting Dropdown */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-emerald-500 cursor-pointer shadow-2xs"
            >
              <option value="distance">📍 Closest to My Location</option>
              <option value="visits">🔥 Most Active Kids Today</option>
              <option value="popular">⭐ Most Popular &amp; Historic</option>
              <option value="rating">🏆 Highest Rated by Parents</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Tab 1: All Parks Directory & Search */}
      {activeTab === 'all_parks' && (
        <div className="space-y-6">
          {/* Search Bar & Filter Controls Strip */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by park name (Cubbon, HSR, Lalbagh), locality (Indiranagar, Whitefield), or facility..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-emerald-500 transition shadow-inner"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 py-0.5 rounded bg-slate-200"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Amenity Filter Buttons: 'Verified', 'Accessible', 'Has Cafeteria' */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 border-t border-slate-100">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                Amenity Filter:
              </span>
              <button
                type="button"
                onClick={() => setAmenityFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  amenityFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>All Parks</span>
              </button>

              <button
                type="button"
                onClick={() => setAmenityFilter(prev => prev === 'verified' ? 'all' : 'verified')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 border ${
                  amenityFilter === 'verified'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-current" />
                <span>Verified</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  amenityFilter === 'verified' ? 'bg-white text-emerald-900' : 'bg-emerald-200 text-emerald-950'
                }`}>
                  {amenityCounts.verified}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAmenityFilter(prev => prev === 'accessible' ? 'all' : 'accessible')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 border ${
                  amenityFilter === 'accessible'
                    ? 'bg-blue-700 text-white border-blue-700 shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100'
                }`}
              >
                <span>♿ Accessible</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  amenityFilter === 'accessible' ? 'bg-white text-blue-900' : 'bg-blue-200 text-blue-950'
                }`}>
                  {amenityCounts.accessible}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAmenityFilter(prev => prev === 'cafeteria' ? 'all' : 'cafeteria')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 border ${
                  amenityFilter === 'cafeteria'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-500/20'
                    : 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100'
                }`}
              >
                <span>☕ Has Cafeteria</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  amenityFilter === 'cafeteria' ? 'bg-white text-amber-950' : 'bg-amber-200 text-amber-950'
                }`}>
                  {amenityCounts.cafeteria}
                </span>
              </button>

              {amenityFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setAmenityFilter('all')}
                  className="text-xs font-bold text-rose-600 hover:underline shrink-0 ml-1 cursor-pointer"
                >
                  Clear Filter
                </button>
              )}
            </div>

            {/* Zone Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Zone:
              </span>
              {BANGALORE_PARK_ZONES.map((zone) => (
                <button
                  key={zone}
                  onClick={() => setSelectedZone(zone)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                    selectedZone === zone
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {zone === 'All' ? '🌐 All Bangalore' : zone}
                </button>
              ))}
            </div>

            {/* Facility Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Facilities:
              </span>
              {PARK_FACILITY_OPTIONS.slice(0, 8).map((facility) => {
                const isSelected = selectedFacilities.includes(facility);
                return (
                  <button
                    key={facility}
                    onClick={() => {
                      setSelectedFacilities(prev => 
                        isSelected ? prev.filter(f => f !== facility) : [...prev, facility]
                      );
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {facility}
                  </button>
                );
              })}
              {selectedFacilities.length > 0 && (
                <button
                  onClick={() => setSelectedFacilities([])}
                  className="text-[11px] font-bold text-rose-600 hover:underline shrink-0 ml-2"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Admin Pending Parks Review Alert Banner */}
          {isAdmin && pendingParks.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-3xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-xs animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 bg-amber-100 rounded-2xl border border-amber-200">🛡️</span>
                <div>
                  <h4 className="text-sm font-black font-serif">
                    Admin Action: {pendingParks.length} Custom Park Submission{pendingParks.length > 1 ? 's' : ''} Awaiting Review
                  </h4>
                  <p className="text-xs text-amber-800 font-medium">
                    Review verified geo-coordinates (Lat/Lng) and approve to publish across all parents in Bangalore.
                  </p>
                </div>
              </div>
              <span className="self-start sm:self-center bg-amber-600 text-white font-bold text-xs px-3 py-1 rounded-xl shadow-xs">
                {pendingParks.length} Pending
              </span>
            </div>
          )}

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredParks.map((park) => {
              const activeVisits = parkVisits.filter(v => v.parkId === park.id);
              const isPending = park.approvalStatus === 'PENDING_APPROVAL' || park.isApproved === false;
              return (
                <div 
                  key={park.id}
                  className={`bg-white rounded-3xl border overflow-hidden shadow-sm hover:shadow-md transition group flex flex-col justify-between ${
                    isPending ? 'border-amber-300 ring-2 ring-amber-300/40' : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Park Photo & Badges */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                      <img 
                        src={park.imageUrl} 
                        alt={park.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                        {/* Sub-Category Badge */}
                        {park.category === 'community_centers' ? (
                          <span className="bg-indigo-600/95 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-xs flex items-center gap-1">
                            <span>🏫 Community &amp; Recreation</span>
                          </span>
                        ) : park.category === 'indoor_paid' ? (
                          <span className="bg-amber-600/95 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-xs flex items-center gap-1">
                            <span>🎟️ Indoor / Paid Space</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-700/95 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-xs flex items-center gap-1">
                            <span>🌳 Park &amp; Playground</span>
                          </span>
                        )}

                        <span className="bg-emerald-600/90 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-xs">
                          {park.zone} Bangalore
                        </span>
                        {isPending && (
                          <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-xs">
                            ⏳ Pending Approval
                          </span>
                        )}
                        {isParkVerified(park) && !isPending && (
                          <span className="bg-emerald-700/95 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-sm backdrop-blur-xs flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-200" />
                            <span>Verified</span>
                          </span>
                        )}
                        {isParkAccessible(park) && (
                          <span className="bg-blue-600/90 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-sm backdrop-blur-xs">
                            ♿ Accessible
                          </span>
                        )}
                        {isParkHasCafeteria(park) && (
                          <span className="bg-amber-600/90 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-sm backdrop-blur-xs">
                            ☕ Cafeteria
                          </span>
                        )}
                        {park.distanceKm !== undefined && (
                          <span className="bg-slate-900/80 text-amber-300 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full backdrop-blur-xs">
                            📍 {park.distanceKm} km away
                          </span>
                        )}
                      </div>

                      {/* Live Visitor Count Alert & Scheduled Visits Badges */}
                      <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10">
                        {park.live_visitor_count !== undefined && park.live_visitor_count > 0 && (
                          <div className="bg-emerald-600/95 text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-xs border border-emerald-400/40 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping shrink-0" />
                            <span>🟢 {park.live_visitor_count} Parent{park.live_visitor_count > 1 ? 's' : ''} Live</span>
                          </div>
                        )}
                        {activeVisits.length > 0 && (
                          <div className="bg-rose-600/95 text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                            <span>🔥 {activeVisits.length} Playdate{activeVisits.length > 1 ? 's' : ''} Today</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Title on Image */}
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="text-lg font-black font-serif leading-tight line-clamp-1">
                          {park.name}
                        </h3>
                        {park.kannadaName && (
                          <span className="text-[11px] text-emerald-200 font-medium block">
                            {park.kannadaName}
                          </span>
                        )}
                        <span className="text-xs text-slate-200 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{park.locality}</span>
                        </span>
                      </div>
                    </div>

                    {/* Active Checked-In Banner */}
                    {checkedInParkId === park.id && (
                      <div className="bg-emerald-600 text-white font-bold text-xs py-2 px-3.5 flex items-center justify-between shadow-inner">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                          <span className="truncate">You&apos;re Checked In Here!</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCheckoutOfPark(park)}
                          className="bg-white hover:bg-emerald-50 text-emerald-950 font-black text-[10.5px] px-2.5 py-0.5 rounded-md transition cursor-pointer shadow-2xs shrink-0"
                        >
                          Check Out
                        </button>
                      </div>
                    )}

                    {/* Park Info Body */}
                    <div className="p-4 space-y-3">
                      {/* Timings & Entry Fee */}
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[170px]">{park.timings}</span>
                        </div>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                          {park.entryFee}
                        </span>
                      </div>

                      {/* Amenities Pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {park.facilities.slice(0, 4).map((fac, idx) => (
                          <span 
                            key={idx} 
                            className="bg-slate-50 text-slate-700 text-[10.5px] font-semibold px-2 py-0.5 rounded-md border border-slate-100"
                          >
                            {fac}
                          </span>
                        ))}
                        {park.facilities.length > 4 && (
                          <span className="text-[10px] font-bold text-slate-400 self-center">
                            +{park.facilities.length - 4} more
                          </span>
                        )}
                      </div>

                      {/* Vernunt Play Tip */}
                      {park.playTip && (
                        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 text-[11px] text-emerald-950 font-medium flex items-start gap-2 shadow-2xs">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">
                            <strong className="text-emerald-900 font-bold">Play Tip: </strong>
                            {park.playTip.replace(/^Vernunt Play Tip:\s*/i, '')}
                          </span>
                        </div>
                      )}

                      {/* Highlights */}
                      {park.highlights && park.highlights.length > 0 && (
                        <p className="text-xs text-slate-500 italic line-clamp-2">
                          ✨ &ldquo;{park.highlights[0]}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 pt-0 space-y-2.5">
                    {/* Primary Check-in Feature Button */}
                    {checkedInParkId === park.id ? (
                      <button
                        type="button"
                        onClick={() => handleCheckoutOfPark(park)}
                        className="w-full py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-emerald-600"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>You&apos;re Checked In • Tap to Check Out</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={checkingInParkId === park.id}
                        onClick={() => handleCheckinAtPark(park)}
                        className="w-full py-2.5 px-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 active:scale-98 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
                      >
                        {checkingInParkId === park.id ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Verifying Geofence &amp; Boundary...</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4 text-amber-300" />
                            <span>Check-in at Park</span>
                            {park.live_visitor_count !== undefined && park.live_visitor_count > 0 ? (
                              <span className="bg-emerald-950/70 text-emerald-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                                🟢 {park.live_visitor_count} Live
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-emerald-100 hidden sm:inline">
                                (~{park.boundaryRadiusMeters || 450}m boundary)
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {/* Who is Going Inspector Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setInspectingPark(park);
                          setSelectedDate(new Date().toISOString().split('T')[0]);
                        }}
                        className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200"
                      >
                        <Users className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Who&apos;s Going?</span>
                      </button>

                      {/* Broadcast My Kid is Going */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!userProfile && onRequireAuth) {
                            onRequireAuth();
                            return;
                          }
                          setBroadcastTargetPark(park);
                          setIsBroadcastModalOpen(true);
                        }}
                        className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Footprints className="w-3.5 h-3.5 text-amber-400" />
                        <span>I&apos;m Going!</span>
                      </button>
                    </div>

                    {/* Dedicated Get Directions Button Linking to Google Maps */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${park.lat},${park.lng}&destination_place_id=&travelmode=walking&dir_action=navigate`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs group/dir"
                      title={`Get directions to ${park.name} on Google Maps`}
                    >
                      <Navigation className="w-3.5 h-3.5 text-white group-hover/dir:rotate-45 transition-transform" />
                      <span>Get Directions</span>
                      <span className="text-[11px] font-bold text-blue-100">
                        ({park.distanceKm !== undefined ? `${park.distanceKm} km` : 'Google Maps'})
                      </span>
                    </a>

                    {/* Secondary Link: View Place on Google Maps */}
                    <div className="flex items-center justify-between pt-0.5 px-1 text-[11px]">
                      <span className="text-slate-400 font-medium truncate max-w-[200px]">
                        📍 {park.locality}
                      </span>
                      <a
                        href={park.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${park.name} ${park.locality} Bangalore`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-0.5 shrink-0"
                      >
                        <span>View Place</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  {/* Admin Direct Action Controls for Pending Park */}
                  {isAdmin && (park.isApproved === false || park.approvalStatus === 'PENDING_APPROVAL') && (
                    <div className="p-3 bg-amber-50/90 border-t border-amber-200 flex items-center justify-between gap-2">
                      <div className="text-[10.5px] font-bold text-amber-900">
                        Admin: Lat {park.lat}, Lng {park.lng}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleApprovePark(park)}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[10.5px] font-bold rounded-lg shadow-2xs transition active:scale-95 cursor-pointer"
                        >
                          ✅ Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectPark(park)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10.5px] font-bold rounded-lg shadow-2xs transition active:scale-95 cursor-pointer"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredParks.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl mx-auto">
                🌳
              </div>
              <h3 className="text-lg font-black text-slate-800 font-serif">
                No matching parks found for &ldquo;{searchQuery}&rdquo;
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Know a society park, newly created layout park or BBMP ground? You can add it directly from Google Maps in 10 seconds!
              </p>
              <button
                type="button"
                onClick={() => setIsAddParkModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add This Park Now</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Tab 2: Today & Upcoming Playtime Schedule Feed */}
      {activeTab === 'today_schedule' && (
        <div className="space-y-6">
          {/* Header Strip for Schedule Feed */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black font-serif text-slate-900 flex items-center gap-2">
                <span>🗓️ Kids Playing Today &amp; Upcoming</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {parkVisits.length} Visits Scheduled
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Parents announce when they are heading to the park so nearby kids can connect and play tag, swings, and games together.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!userProfile && onRequireAuth) {
                  onRequireAuth();
                  return;
                }
                setBroadcastTargetPark(allParks[0] || null);
                setIsBroadcastModalOpen(true);
              }}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Announce My Kid&apos;s Park Visit</span>
            </button>
          </div>

          {/* Visits Cards Feed */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parkVisits.map((visit) => {
              const hasJoined = userProfile && visit.rsvps.some(r => r.userId === userProfile.id);
              const isCreator = userProfile && visit.parentUserId === userProfile.id;

              return (
                <div 
                  key={visit.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top: Park & Date Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                          📍 {visit.parkLocality}
                        </span>
                        <h4 className="text-base font-black font-serif text-slate-900 mt-1 line-clamp-1">
                          {visit.parkName}
                        </h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-900 block font-mono">
                          {visit.visitDate === new Date().toISOString().split('T')[0] ? '🔥 Today' : visit.visitDate}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {visit.timeSlot}
                        </span>
                      </div>
                    </div>

                    {/* Kid & Parent Profile Info */}
                    <div 
                      onClick={() => {
                        if (!isParentVerified && onRequireAuth) onRequireAuth();
                      }}
                      className={`flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 ${!isParentVerified ? 'cursor-pointer hover:bg-slate-100/80' : ''}`}
                    >
                      <img 
                        src={visit.parentPhotoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'} 
                        alt={visit.parentName}
                        className={`w-12 h-12 rounded-full object-cover border-2 ${isParentVerified ? 'border-emerald-500' : 'border-amber-400 blur-xs'} shrink-0`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900 truncate">
                            {isParentVerified ? `${visit.childName} (${visit.childAge} yrs)` : '🔒 Playmate (•• yrs)'}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                            isParentVerified 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-amber-100 text-amber-900'
                          }`}>
                            {isParentVerified 
                              ? 'Verified Parent' 
                              : !userProfile 
                                ? '🔒 Sign In to Unlock' 
                                : isKycSkipped 
                                  ? '🔒 KYC Required' 
                                  : '🔒 Pending Approval'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium block truncate">
                          {isParentVerified ? `Parent: ${visit.parentName}` : 'Child details locked for safety'}
                        </span>
                        {isParentVerified && visit.childInterests && visit.childInterests.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 overflow-x-auto no-scrollbar">
                            {visit.childInterests.slice(0, 2).map((int, i) => (
                              <span key={i} className="text-[9.5px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.2 rounded-md font-medium whitespace-nowrap">
                                {int}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Planned Activity */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Planned Playtime:
                      </span>
                      <p className="text-xs font-semibold text-slate-800 bg-amber-50/60 border border-amber-200/60 p-2.5 rounded-xl">
                        🎯 {visit.plannedActivity}
                      </p>
                    </div>

                    {/* Parent Note */}
                    {visit.notes && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-xl">
                        💬 &ldquo;{visit.notes}&rdquo;
                      </p>
                    )}

                    {/* Joined Kids Roster */}
                    {visit.rsvps.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10.5px] font-bold text-emerald-800 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{visit.rsvps.length} other kid{visit.rsvps.length > 1 ? 's' : ''} joining:</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {visit.rsvps.map((r, i) => (
                            <span 
                              key={i} 
                              className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-lg"
                            >
                              <span>🧒 {r.childName} ({r.childAge}y)</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Join / RSVP Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {isCreator ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl flex items-center gap-1">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Your Scheduled Visit</span>
                      </span>
                    ) : hasJoined ? (
                      <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl flex items-center gap-1">
                        <Check className="w-4 h-4 text-teal-600" />
                        <span>You&apos;re Joining This Playdate!</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (!userProfile && onRequireAuth) {
                            onRequireAuth();
                            return;
                          }
                          setRsvpTargetVisit(visit);
                        }}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Baby className="w-3.5 h-3.5" />
                        <span>We&apos;re Joining Too!</span>
                      </button>
                    )}

                    {/* Chat or Directions */}
                    <div className="flex items-center gap-1.5">
                      {onOpenChatWithParent && !isCreator && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!userProfile && onRequireAuth) {
                              onRequireAuth();
                              return;
                            }
                            onOpenChatWithParent(
                              visit.parentUserId, 
                              `Hi ${visit.parentName}! Saw your park visit with ${visit.childName} at ${visit.parkName} on ${visit.visitDate} (${visit.timeSlot}). Would love to connect!`
                            );
                          }}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                          title="Message Parent"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openDeviceNavigation(visit.parkLat, visit.parkLng, visit.parkName)}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition cursor-pointer"
                        title="Navigate on Google Maps"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* INSPECTOR MODAL: "Who is Going to this Park?" */}
      {inspectingPark && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-scale-up">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                    {inspectingPark.locality} • {inspectingPark.zone} Bangalore
                  </span>
                  {(liveVisitorCounts[inspectingPark.id] ?? inspectingPark.live_visitor_count ?? 0) > 0 && (
                    <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-950 shrink-0" />
                      <span>🟢 {liveVisitorCounts[inspectingPark.id] ?? inspectingPark.live_visitor_count} Here Now</span>
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black font-serif leading-tight mt-0.5">
                  {inspectingPark.name}
                </h3>
              </div>
              <button 
                onClick={() => setInspectingPark(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Date and Time Selector Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-slate-700">Select Date:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-emerald-500 shadow-2xs"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                      selectedDate === new Date().toISOString().split('T')[0]
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setSelectedDate(new Date(Date.now() + 86400000).toISOString().split('T')[0])}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                      selectedDate === new Date(Date.now() + 86400000).toISOString().split('T')[0]
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    Tomorrow
                  </button>
                </div>
              </div>

              {/* Time Slot Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                  Time:
                </span>
                {PARK_TIME_SLOTS.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedTimeSlotId(slot.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedTimeSlotId === slot.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Kids Attending */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {(() => {
                const visits = getFilteredVisitsForPark(inspectingPark.id, selectedDate, selectedTimeSlotId);
                if (visits.length === 0) {
                  return (
                    <div className="text-center py-10 space-y-3">
                      <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl mx-auto border border-amber-200">
                        👶
                      </div>
                      <h4 className="text-base font-black text-slate-800 font-serif">
                        No kids announced for this time slot yet!
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Be the first to announce! When you announce, nearby verified parents get notified so their children can come play.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setBroadcastTargetPark(inspectingPark);
                          setBroadcastDate(selectedDate);
                          setIsBroadcastModalOpen(true);
                        }}
                        className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-2 cursor-pointer mt-2"
                      >
                        <Footprints className="w-4 h-4 text-amber-300" />
                        <span>I&apos;m Going! Tell Nearby Parents</span>
                      </button>
                    </div>
                  );
                }

                return visits.map((visit) => {
                  const hasJoined = userProfile && visit.rsvps.some(r => r.userId === userProfile.id);
                  const isCreator = userProfile && visit.parentUserId === userProfile.id;

                  return (
                    <div 
                      key={visit.id} 
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          onClick={() => {
                            if (!isParentVerified && onRequireAuth) onRequireAuth();
                          }}
                          className={`flex items-center gap-3 ${!isParentVerified ? 'cursor-pointer' : ''}`}
                        >
                          <img 
                            src={visit.parentPhotoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'} 
                            alt={visit.parentName}
                            className={`w-10 h-10 rounded-full object-cover border ${isParentVerified ? 'border-emerald-400' : 'border-amber-400 blur-xs'}`}
                          />
                          <div>
                            <span className="text-sm font-black text-slate-900 block">
                              {isParentVerified ? `${visit.childName} (${visit.childAge} yrs)` : '🔒 Playmate (•• yrs)'}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              {isParentVerified ? `Parent: ${visit.parentName}` : '🔒 KYC Verification Required'}
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg font-mono">
                          ⏰ {visit.timeSlot}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 font-semibold bg-white p-2.5 rounded-xl border border-slate-100">
                        🎯 {visit.plannedActivity}
                      </div>

                      {visit.notes && (
                        <p className="text-xs text-slate-600 italic">
                          💬 &ldquo;{visit.notes}&rdquo;
                        </p>
                      )}

                      {/* RSVPs roster */}
                      {visit.rsvps.length > 0 && (
                        <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5 flex-wrap">
                          <span>Joined:</span>
                          {visit.rsvps.map((r, i) => (
                            <span key={i} className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              🧒 {r.childName} ({r.childAge}y)
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Join Action */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        {isCreator ? (
                          <span className="text-xs font-bold text-emerald-700">✓ Your Broadcast</span>
                        ) : hasJoined ? (
                          <span className="text-xs font-bold text-teal-700">✓ You&apos;re Joined!</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (!userProfile && onRequireAuth) {
                                onRequireAuth();
                                return;
                              }
                              setRsvpTargetVisit(visit);
                            }}
                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
                          >
                            We&apos;re Joining Too!
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {checkedInParkId === inspectingPark.id ? (
                  <button
                    type="button"
                    onClick={() => handleCheckoutOfPark(inspectingPark)}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Checked In • Check Out</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={checkingInParkId === inspectingPark.id}
                    onClick={() => handleCheckinAtPark(inspectingPark)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <MapPin className="w-4 h-4 text-amber-300" />
                    <span>{checkingInParkId === inspectingPark.id ? 'Verifying Boundary...' : 'Check-in at Park'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setBroadcastTargetPark(inspectingPark);
                    setBroadcastDate(selectedDate);
                    setIsBroadcastModalOpen(true);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-300" />
                  <span>Broadcast Playdate</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setInspectingPark(null)}
                className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer border border-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Broadcast Kid's Park Visit */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-slate-200 animate-scale-up">
            <div className="p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-lg">
                  📢
                </div>
                <div>
                  <h3 className="text-base font-black font-serif">
                    Broadcast Kid&apos;s Park Visit
                  </h3>
                  <span className="text-xs text-emerald-200">
                    Invite neighborhood parents to join and play!
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcastVisit} className="p-5 space-y-4">
              {/* Park Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Select Bangalore Park:
                </label>
                <select
                  value={broadcastTargetPark?.id || ''}
                  onChange={(e) => {
                    const found = allParks.find(p => p.id === e.target.value);
                    if (found) setBroadcastTargetPark(found);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-emerald-500 shadow-2xs"
                  required
                >
                  {allParks.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.locality})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time Slot Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Date:</label>
                  <input
                    type="date"
                    value={broadcastDate}
                    onChange={(e) => setBroadcastDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-emerald-500 shadow-2xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Time Window:</label>
                  <select
                    value={broadcastTimeSlot}
                    onChange={(e) => setBroadcastTimeSlot(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-emerald-500 shadow-2xs"
                  >
                    <option value="06:30 AM - 08:00 AM">06:30 AM - 08:00 AM (Sunrise)</option>
                    <option value="08:30 AM - 10:00 AM">08:30 AM - 10:00 AM (Morning)</option>
                    <option value="04:00 PM - 05:30 PM">04:00 PM - 05:30 PM (Playtime)</option>
                    <option value="04:30 PM - 06:00 PM">04:30 PM - 06:00 PM (Peak Evening)</option>
                    <option value="05:30 PM - 07:00 PM">05:30 PM - 07:00 PM (Sunset)</option>
                    <option value="07:00 PM - 08:15 PM">07:00 PM - 08:15 PM (Evening Walk)</option>
                  </select>
                </div>
              </div>

              {/* Kid Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Child&apos;s Name:</label>
                  <input
                    type="text"
                    value={broadcastChildName}
                    onChange={(e) => setBroadcastChildName(e.target.value)}
                    placeholder="e.g. Aarav"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-emerald-500 shadow-2xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Child&apos;s Age:</label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={broadcastChildAge}
                    onChange={(e) => setBroadcastChildAge(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-emerald-500 shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* Planned Activity */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  What are you planning to play?
                </label>
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {[
                    'Swings & Slides', 'Sandpit Castles', 'Bicycle / Tricycle', 
                    'Soccer / Football', 'Frisbee Toss', 'Giant Bubbles', 'Tag & Running'
                  ].map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setBroadcastActivity(act)}
                      className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition ${
                        broadcastActivity === act
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={broadcastActivity}
                  onChange={(e) => setBroadcastActivity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:outline-emerald-500"
                  required
                />
              </div>

              {/* Friendly Note to Parents */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Message for Neighborhood Parents (Optional):
                </label>
                <textarea
                  rows={2}
                  value={broadcastNotes}
                  onChange={(e) => setBroadcastNotes(e.target.value)}
                  placeholder="e.g. Bringing sand diggers and extra bubble wands. Looking for kids aged 3-6 to play together near the gazebo!"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-emerald-500 resize-none shadow-2xs"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Child-Safe: Only verified parents in Vernunt will see this visit notification.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 font-bold text-xs hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBroadcast}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isSubmittingBroadcast ? 'Publishing...' : 'Publish Park Play Broadcast'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Join / RSVP to a Park Visit */}
      {rsvpTargetVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤝</span>
                <div>
                  <h3 className="text-base font-black font-serif text-slate-900">
                    Join {rsvpTargetVisit.childName}&apos;s Playdate
                  </h3>
                  <span className="text-xs text-slate-500">
                    {rsvpTargetVisit.parkName} • {rsvpTargetVisit.timeSlot}
                  </span>
                </div>
              </div>
              <button onClick={() => setRsvpTargetVisit(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-slate-800 space-y-1">
              <span className="font-bold text-amber-900 block">
                Planned Play: {rsvpTargetVisit.plannedActivity}
              </span>
              {rsvpTargetVisit.notes && (
                <p className="italic text-slate-600 text-[11px]">
                  &ldquo;{rsvpTargetVisit.notes}&rdquo;
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Quick Note to {rsvpTargetVisit.parentName} (Optional):
              </label>
              <textarea
                rows={2}
                value={rsvpMessage}
                onChange={(e) => setRsvpMessage(e.target.value)}
                placeholder={`e.g. ${userProfile?.childName || 'My kid'} is excited to play tag! See you near the swings.`}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-emerald-500 resize-none shadow-2xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRsvpTargetVisit(null)}
                className="px-4 py-2 text-slate-600 font-bold text-xs hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingRsvp}
                onClick={handleJoinVisit}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4 text-emerald-300" />
                <span>{isSubmittingRsvp ? 'Joining...' : 'Confirm: We Are Joining!'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add / Scrape Park from Google Maps (Admin Only) */}
      {isAddParkModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-slate-200 animate-scale-up">
            <div className="p-5 bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🗺️</span>
                <div>
                  <h3 className="text-base font-black font-serif">
                    Add / Scrape Any Park from Google Maps
                  </h3>
                  <span className="text-xs text-emerald-300">
                    Add your society park, BDA layout park or BBMP ground
                  </span>
                </div>
              </div>
              <button onClick={() => setIsAddParkModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewPark} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Park Name:</label>
                <input
                  type="text"
                  value={newParkName}
                  onChange={(e) => setNewParkName(e.target.value)}
                  placeholder="e.g. Sector 5 BDA Park, or Sobha Dream Acres Park"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-emerald-500 shadow-2xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Locality / Area:</label>
                  <input
                    type="text"
                    value={newParkLocality}
                    onChange={(e) => setNewParkLocality(e.target.value)}
                    placeholder="e.g. HSR Layout, Whitefield"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-emerald-500 shadow-2xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Bangalore Zone:</label>
                  <select
                    value={newParkZone}
                    onChange={(e) => setNewParkZone(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-emerald-500 shadow-2xs"
                  >
                    <option value="South">South Bangalore</option>
                    <option value="East">East Bangalore</option>
                    <option value="Central">Central Bangalore</option>
                    <option value="North">North Bangalore</option>
                    <option value="West">West Bangalore</option>
                    <option value="Outer / Greater">Outer / Greater Bangalore</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Address / Landmarks:</label>
                <input
                  type="text"
                  value={newParkAddress}
                  onChange={(e) => setNewParkAddress(e.target.value)}
                  placeholder="e.g. 19th Main, near Sector 5 BDA Water Tank, Bengaluru"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-emerald-500 shadow-2xs"
                />
              </div>

              {/* Mandatory Latitude & Longitude with GPS Autofill Button */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                      Park Geo-Coordinates (Mandatory)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectGpsForPark}
                    disabled={isDetectingGps}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
                    <span>{isDetectingGps ? 'Detecting GPS...' : '📍 Autofill Current GPS'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                      <span>Latitude <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-slate-400 font-mono">e.g. 12.9716</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newParkLat}
                      onChange={(e) => setNewParkLat(e.target.value)}
                      placeholder="12.9716"
                      className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 text-xs font-bold font-mono text-slate-800 focus:outline-emerald-600 shadow-2xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                      <span>Longitude <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-slate-400 font-mono">e.g. 77.5946</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newParkLng}
                      onChange={(e) => setNewParkLng(e.target.value)}
                      placeholder="77.5946"
                      className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 text-xs font-bold font-mono text-slate-800 focus:outline-emerald-600 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-1.5 text-[10.5px] text-emerald-800 font-medium">
                  <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Accurate coordinates ensure nearby families can find the park on their proximity radar. All submissions undergo Admin approval before publishing.
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Google Maps URL (Optional):</label>
                <input
                  type="url"
                  value={newParkMapsUrl}
                  onChange={(e) => setNewParkMapsUrl(e.target.value)}
                  placeholder="https://maps.app.goo.gl/... or paste Google Maps link"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-emerald-500 shadow-2xs"
                />
              </div>

              {/* Facilities check */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Available Facilities:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {PARK_FACILITY_OPTIONS.slice(0, 6).map((fac) => {
                    const isChecked = newParkFacilities.includes(fac);
                    return (
                      <label key={fac} className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) setNewParkFacilities(p => [...p, fac]);
                            else setNewParkFacilities(p => p.filter(x => x !== fac));
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{fac}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddParkModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 font-bold text-xs hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-emerald-300" />
                  <span>Add to Directory</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Outside Park Boundary Alert with Directions & Preview Simulation */}
      {boundaryModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-scale-up">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg backdrop-blur-xs">
                  📍
                </div>
                <div>
                  <h3 className="text-base font-black font-serif">
                    Outside Park Boundary
                  </h3>
                  <span className="text-xs text-amber-100">
                    Geolocation perimeter verification
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setBoundaryModalData(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Park details summary */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <img 
                  src={boundaryModalData.park.imageUrl} 
                  alt={boundaryModalData.park.name}
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-slate-900 truncate">
                    {boundaryModalData.park.name}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">
                    {boundaryModalData.park.locality} • {boundaryModalData.park.zone} Bangalore
                  </p>
                  <span className="text-[11px] font-bold text-emerald-700">
                    Perimeter Boundary: ~{boundaryModalData.boundaryMeters}m radius
                  </span>
                </div>
              </div>

              {/* Distance comparison callout */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-2 text-amber-950">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>You are currently {boundaryModalData.distanceKm} km ({boundaryModalData.distanceMeters}m) away</span>
                </div>
                <p className="text-amber-800 leading-relaxed text-[11.5px]">
                  To protect accurate live visitor counts for all parents, &ldquo;Check-in at Park&rdquo; verifies that your device is within the park perimeter (~{boundaryModalData.boundaryMeters}m).
                </p>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-1">
                {/* 1. Get Directions on Google Maps */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${boundaryModalData.park.lat},${boundaryModalData.park.lng}&destination_place_id=&travelmode=walking&dir_action=navigate`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Navigation className="w-4 h-4 text-white" />
                  <span>Get Walking / Driving Directions ({boundaryModalData.distanceKm} km)</span>
                </a>

                {/* 2. Retry GPS check */}
                <button
                  type="button"
                  onClick={() => handleCheckinAtPark(boundaryModalData.park, false)}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Crosshair className="w-4 h-4 text-emerald-400" />
                  <span>I Am At The Park (Retry GPS Verification)</span>
                </button>

                {/* 3. Testing / Simulation mode for preview */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      executeCheckin(
                        boundaryModalData.park,
                        boundaryModalData.userCoords,
                        45,
                        boundaryModalData.boundaryMeters,
                        true
                      );
                    }}
                    className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Preview &amp; Testing Mode: Simulate Check-in</span>
                  </button>
                  <span className="text-[10px] text-slate-400 block text-center mt-1">
                    Allows testing in browser emulator or low-GPS conditions
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Check-In Celebration Success Modal */}
      {checkinSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-scale-up">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 text-white text-center space-y-2 relative">
              <div className="w-14 h-14 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-2xl mx-auto shadow-lg animate-bounce">
                🎉
              </div>
              <h3 className="text-xl font-black font-serif">
                You&apos;re Checked In!
              </h3>
              <p className="text-xs text-emerald-200 font-medium">
                {checkinSuccessData.isSimulated ? 'Simulated Preview Check-in Verified' : 'GPS Boundary Verified Successfully'}
              </p>
              <button 
                onClick={() => setCheckinSuccessData(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Park & Live Visitor Highlight */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">
                    {checkinSuccessData.park.locality}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span>🟢 {checkinSuccessData.liveCount} Parent{checkinSuccessData.liveCount > 1 ? 's' : ''} Live Now</span>
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-900">
                  {checkinSuccessData.park.name}
                </h4>
                <p className="text-xs text-slate-600 font-medium">
                  Verified distance: {checkinSuccessData.distanceMeters}m from center (within ~{checkinSuccessData.boundaryMeters}m park boundary).
                </p>
              </div>

              <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Live Counter Incremented in Firestore</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Nearby parents browsing {checkinSuccessData.park.name} can now see real-time active visitors at the park.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCheckinSuccessData(null);
                    setBroadcastTargetPark(checkinSuccessData.park);
                    setIsBroadcastModalOpen(true);
                  }}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>📢 Announce Playdate to Nearby Parents</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCheckinSuccessData(null)}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition cursor-pointer"
                >
                  Keep Exploring Parks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
