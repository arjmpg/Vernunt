import React, { useState, useEffect, useMemo } from 'react';
import { ChildProfile, Playdate } from '../types.ts';
import { 
  CalendarRange, CalendarCheck2, MapPin, Clock, Trash2, HeartHandshake, 
  Sparkles, BellRing, Navigation, Plus, Users, Check, Lock, AlertCircle, 
  CreditCard, ChevronRight, Share2, Info, Building2, Trees
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { auth, db, handleFirestoreError, OperationType } from '../utils/firebase.ts';
import { onSnapshot, collection, query, where, or, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { PlaydateActivitySuggestions } from './PlaydateActivitySuggestions.tsx';
import { sendPlaydateRequestPush, sendPlaydateConfirmedPush } from '../utils/fcmMessaging.ts';

export interface PlayLocation {
  id: string;
  name: string;
  locality: string;
  address: string;
  lat: number;
  lng: number;
  hourlyRate: number; // e.g. 300
  venueType: 'Playhome' | 'Indoor Play Zone' | 'Community Clubhouse' | 'Park / Open Area';
}

export interface PlaytimeSession {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
  durationHours: number;
  hourlyRate: number; // e.g. 300
  totalCost: number; // hourlyRate * durationHours
  locationName: string;
  locality: string;
  address: string;
  lat: number;
  lng: number;
  hostParentId: string;
  hostParentName: string;
  hostChildName: string;
  notes?: string;
  attendees: Array<{
    parentId: string;
    parentName: string;
    childName: string;
    joinedAt: string;
    paid?: boolean;
  }>;
  createdAt: string;
}

interface PlaydatePlannerProps {
  playmates: ChildProfile[];
  userProfile: ChildProfile | null;
  activeCompanion: ChildProfile | null;
  onOpenPushModal?: () => void;
  onRequireAuth?: () => void;
}

// Initial Curated Play Venues with real Bangalore Coordinates
const PRELOADED_LOCATIONS: PlayLocation[] = [
  {
    id: 'loc-sunshine-playhome',
    name: 'Sunshine Montessori Playhome & Creche',
    locality: 'Indiranagar',
    address: '42, 12th Main Road, Indiranagar, Bengaluru',
    lat: 12.9784,
    lng: 77.6408,
    hourlyRate: 300,
    venueType: 'Playhome'
  },
  {
    id: 'loc-little-explorers',
    name: 'Little Explorers Activity Hub & Soft Play',
    locality: 'Koramangala',
    address: '18, 5th Cross, 6th Block, Koramangala, Bengaluru',
    lat: 12.9352,
    lng: 77.6245,
    hourlyRate: 300,
    venueType: 'Indoor Play Zone'
  },
  {
    id: 'loc-kydzadda-banashankari',
    name: 'KydzAdda Play & Activity Centre',
    locality: 'Banashankari',
    address: '2nd Floor, 980, 13th Cross, Banashankari 2nd Stage, Bengaluru',
    lat: 12.9255,
    lng: 77.5468,
    hourlyRate: 300,
    venueType: 'Indoor Play Zone'
  },
  {
    id: 'loc-defense-colony-park',
    name: 'Indiranagar Defense Colony Park',
    locality: 'Indiranagar',
    address: 'Defense Colony, Indiranagar, Bengaluru',
    lat: 12.9796,
    lng: 77.6432,
    hourlyRate: 0,
    venueType: 'Park / Open Area'
  }
];

export default function PlaydatePlanner({
  playmates,
  userProfile,
  activeCompanion,
  onOpenPushModal,
  onRequireAuth
}: PlaydatePlannerProps) {
  // Planner active sub-view: "group_split" (Collaborative Split Cost) or "direct_invite" (1-on-1)
  const [plannerMode, setPlannerMode] = useState<'group_split' | 'direct_invite'>('group_split');

  // Saved play locations (preloaded + community added)
  const [savedLocations, setSavedLocations] = useState<PlayLocation[]>(() => {
    try {
      const stored = localStorage.getItem('vernunt_play_locations_v1');
      return stored ? JSON.parse(stored) : PRELOADED_LOCATIONS;
    } catch {
      return PRELOADED_LOCATIONS;
    }
  });

  // Group Playtime Sessions
  const [groupSessions, setGroupSessions] = useState<PlaytimeSession[]>(() => {
    try {
      const stored = localStorage.getItem('vernunt_group_playtime_sessions_v1');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    // Seed initial realistic sessions showing the exact 15-min cutoff and split logic
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Session 1: Open for join (Starts in ~90 minutes)
    const openStartTime = new Date(now.getTime() + 90 * 60 * 1000);
    const openTimeStr = `${String(openStartTime.getHours()).padStart(2, '0')}:${String(openStartTime.getMinutes()).padStart(2, '0')}`;

    // Session 2: Locked for join (Starts in ~8 minutes, cutoff passed)
    const lockedStartTime = new Date(now.getTime() + 8 * 60 * 1000);
    const lockedTimeStr = `${String(lockedStartTime.getHours()).padStart(2, '0')}:${String(lockedStartTime.getMinutes()).padStart(2, '0')}`;

    return [
      {
        id: 'session-seed-1',
        title: 'Toddler Ballpit & Soft Play at Sunshine Playhome',
        date: todayStr,
        time: openTimeStr,
        durationHours: 1,
        hourlyRate: 300,
        totalCost: 300,
        locationName: 'Sunshine Montessori Playhome & Creche',
        locality: 'Indiranagar',
        address: '42, 12th Main Road, Indiranagar, Bengaluru',
        lat: 12.9784,
        lng: 77.6408,
        hostParentId: 'user-priya-sharma',
        hostParentName: 'Priya Sharma',
        hostChildName: 'Aarav (4 yrs)',
        notes: 'Cozy indoor sensory area with ball pit and building blocks. Parents can sit and chat while kids play.',
        attendees: [
          {
            parentId: 'user-priya-sharma',
            parentName: 'Priya Sharma',
            childName: 'Aarav',
            joinedAt: new Date(now.getTime() - 40 * 60 * 1000).toISOString()
          },
          {
            parentId: 'user-vikas-mehra',
            parentName: 'Vikas Mehra',
            childName: 'Kabir',
            joinedAt: new Date(now.getTime() - 25 * 60 * 1000).toISOString()
          }
        ],
        createdAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString()
      },
      {
        id: 'session-seed-2',
        title: 'Creative Clay Modeling & Lego Hour',
        date: todayStr,
        time: lockedTimeStr,
        durationHours: 1,
        hourlyRate: 300,
        totalCost: 300,
        locationName: 'Little Explorers Activity Hub & Soft Play',
        locality: 'Koramangala',
        address: '18, 5th Cross, 6th Block, Koramangala, Bengaluru',
        lat: 12.9352,
        lng: 77.6245,
        hostParentId: 'user-kavita-rao',
        hostParentName: 'Kavita Rao',
        hostChildName: 'Diya (5 yrs)',
        notes: 'Private room booked with organic playdough and large Lego sets. ₹300/hr venue rate split among confirmed parents.',
        attendees: [
          {
            parentId: 'user-kavita-rao',
            parentName: 'Kavita Rao',
            childName: 'Diya',
            joinedAt: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
            paid: true
          },
          {
            parentId: 'user-ananya-das',
            parentName: 'Ananya Das',
            childName: 'Ishaan',
            joinedAt: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
            paid: false
          },
          {
            parentId: userProfile?.id || 'user-arjun-gupta',
            parentName: userProfile?.parentName || 'Arjun Gupta',
            childName: userProfile?.childName || 'Reyansh',
            joinedAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
            paid: false
          }
        ],
        createdAt: new Date(now.getTime() - 90 * 60 * 1000).toISOString()
      }
    ];
  });

  // Modal / Form state for Creating New Group Playtime Session
  const [isCreateSessionModalOpen, setIsCreateSessionModalOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sessionTime, setSessionTime] = useState('17:00');
  const [sessionDuration, setSessionDuration] = useState<number>(1);
  const [sessionHourlyFee, setSessionHourlyFee] = useState<number>(300);
  const [sessionNotes, setSessionNotes] = useState('');

  // Location selection mode: "existing" or "new"
  const [locationMode, setLocationMode] = useState<'existing' | 'new'>('existing');
  const [selectedLocationId, setSelectedLocationId] = useState<string>(PRELOADED_LOCATIONS[0].id);

  // New location fields (Mandatory Lat/Lng)
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocLocality, setNewLocLocality] = useState('');
  const [newLocLat, setNewLocLat] = useState<string>('');
  const [newLocLng, setNewLocLng] = useState<string>('');
  const [newLocVenueType, setNewLocVenueType] = useState<PlayLocation['venueType']>('Playhome');
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // 1-on-1 Playdate Form State
  const [playdates, setPlaydates] = useState<Playdate[]>([]);
  const [guestId, setGuestId] = useState(activeCompanion?.id || playmates[0]?.id || '');
  const [directDate, setDirectDate] = useState('');
  const [directTime, setDirectTime] = useState('');
  const [directLocation, setDirectLocation] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [plannerTitle, setPlannerTitle] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Real-time Firestore sync for Group Sessions
  useEffect(() => {
    try {
      const q = collection(db, 'playtime_sessions');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const cloudSessions: PlaytimeSession[] = [];
          snapshot.forEach((docSnap) => {
            cloudSessions.push({ id: docSnap.id, ...docSnap.data() } as PlaytimeSession);
          });
          setGroupSessions(cloudSessions);
          try {
            localStorage.setItem('vernunt_group_playtime_sessions_v1', JSON.stringify(cloudSessions));
          } catch {
            // ignore
          }
        }
      }, () => {});
      return () => unsubscribe();
    } catch {
      // offline fallback
    }
  }, []);

  // Sync 1-on-1 playdates
  useEffect(() => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'playdates'),
        or(
          where('hostId', '==', auth.currentUser.uid),
          where('guestId', '==', auth.currentUser.uid)
        )
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Playdate[] = [];
        snapshot.forEach((snap) => {
          list.push(snap.data() as Playdate);
        });
        setPlaydates(list);
      }, () => {});
      return () => unsubscribe();
    } catch {
      // ignore
    }
  }, [userProfile]);

  // GPS auto-detection for New Play Location
  const handleDetectGpsForLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGps(false);
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setNewLocLat(lat);
        setNewLocLng(lng);
      },
      (err) => {
        setIsDetectingGps(false);
        alert(`Could not capture GPS: ${err.message}. Please enter coordinates manually.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Helper to determine if a session is locked (within 15 minutes of scheduled start time)
  const isSessionJoinLocked = (session: PlaytimeSession) => {
    try {
      const sessionStart = new Date(`${session.date}T${session.time}`);
      const cutoffTime = new Date(sessionStart.getTime() - 15 * 60 * 1000);
      return new Date() >= cutoffTime;
    } catch {
      return false;
    }
  };

  // Helper to get formatted cutoff time
  const getCutoffFormatted = (session: PlaytimeSession) => {
    try {
      const sessionStart = new Date(`${session.date}T${session.time}`);
      const cutoffTime = new Date(sessionStart.getTime() - 15 * 60 * 1000);
      return cutoffTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '15 mins before start';
    }
  };

  // Create New Group Playtime Session
  const handleCreateGroupSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile && onRequireAuth) {
      onRequireAuth();
      return;
    }

    if (!sessionTitle.trim()) {
      alert('Please enter a session title.');
      return;
    }

    let finalLocationName = '';
    let finalAddress = '';
    let finalLocality = 'Bangalore';
    let finalLat = 12.9716;
    let finalLng = 77.5946;
    let finalHourlyRate = Number(sessionHourlyFee) || 300;

    if (locationMode === 'existing') {
      const loc = savedLocations.find(l => l.id === selectedLocationId);
      if (!loc) {
        alert('Please choose a valid play location.');
        return;
      }
      finalLocationName = loc.name;
      finalAddress = loc.address;
      finalLocality = loc.locality;
      finalLat = loc.lat;
      finalLng = loc.lng;
      finalHourlyRate = loc.hourlyRate;
    } else {
      // Adding new location: MANDATORY Latitude and Longitude
      if (!newLocName.trim()) {
        alert('Location name is mandatory.');
        return;
      }
      const latNum = parseFloat(newLocLat.trim());
      const lngNum = parseFloat(newLocLng.trim());

      if (isNaN(latNum) || latNum < -90 || latNum > 90 || latNum === 0) {
        alert('Latitude is mandatory! Please enter a valid decimal coordinate (e.g. 12.9716) or click Autofill GPS.');
        return;
      }
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180 || lngNum === 0) {
        alert('Longitude is mandatory! Please enter a valid decimal coordinate (e.g. 77.5946) or click Autofill GPS.');
        return;
      }

      finalLocationName = newLocName.trim();
      finalAddress = newLocAddress.trim() || `${newLocName}, ${newLocLocality || 'Bangalore'}`;
      finalLocality = newLocLocality.trim() || 'Bangalore';
      finalLat = Number(latNum.toFixed(6));
      finalLng = Number(lngNum.toFixed(6));

      // Save new location to saved locations directory
      const newSavedLoc: PlayLocation = {
        id: `loc-${Date.now()}`,
        name: finalLocationName,
        locality: finalLocality,
        address: finalAddress,
        lat: finalLat,
        lng: finalLng,
        hourlyRate: finalHourlyRate,
        venueType: newLocVenueType
      };
      const updatedLocations = [newSavedLoc, ...savedLocations];
      setSavedLocations(updatedLocations);
      try {
        localStorage.setItem('vernunt_play_locations_v1', JSON.stringify(updatedLocations));
      } catch {
        // ignore
      }
    }

    const currentParentId = userProfile?.id || auth.currentUser?.uid || 'user-parent';
    const currentParentName = userProfile?.parentName || 'Parent';
    const currentChildName = userProfile?.childName || 'Child';

    const totalCost = finalHourlyRate * (Number(sessionDuration) || 1);

    const newSession: PlaytimeSession = {
      id: `session-${Date.now()}`,
      title: sessionTitle.trim(),
      date: sessionDate,
      time: sessionTime,
      durationHours: Number(sessionDuration) || 1,
      hourlyRate: finalHourlyRate,
      totalCost,
      locationName: finalLocationName,
      locality: finalLocality,
      address: finalAddress,
      lat: finalLat,
      lng: finalLng,
      hostParentId: currentParentId,
      hostParentName: currentParentName,
      hostChildName: currentChildName,
      notes: sessionNotes.trim(),
      attendees: [
        {
          parentId: currentParentId,
          parentName: currentParentName,
          childName: currentChildName,
          joinedAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'playtime_sessions', newSession.id), newSession).catch(() => {});
    } catch {
      // offline fallback
    }

    const updatedSessions = [newSession, ...groupSessions];
    setGroupSessions(updatedSessions);
    try {
      localStorage.setItem('vernunt_group_playtime_sessions_v1', JSON.stringify(updatedSessions));
    } catch {
      // ignore
    }

    setIsCreateSessionModalOpen(false);
    setSessionTitle('');
    setSessionNotes('');
    setNewLocName('');
    setNewLocAddress('');
    setNewLocLat('');
    setNewLocLng('');

    confetti({ particleCount: 80, spread: 60 });
    setNotification(`🎉 Playtime session created! Nearby parents can join and split the ₹${totalCost} fee until 15 mins before start time.`);
    setTimeout(() => setNotification(null), 5000);
  };

  // Join or Leave a Group Playtime Session
  const handleToggleJoinSession = async (session: PlaytimeSession) => {
    if (!userProfile && onRequireAuth) {
      onRequireAuth();
      return;
    }

    if (isSessionJoinLocked(session)) {
      alert('Joining is locked. Registrations close strictly 15 minutes before scheduled start time to finalize split payments.');
      return;
    }

    const currentParentId = userProfile?.id || auth.currentUser?.uid || 'user-parent';
    const currentParentName = userProfile?.parentName || 'Parent';
    const currentChildName = userProfile?.childName || 'Child';

    const isAlreadyJoined = session.attendees.some(a => a.parentId === currentParentId);
    let updatedAttendees = [...session.attendees];

    if (isAlreadyJoined) {
      updatedAttendees = updatedAttendees.filter(a => a.parentId !== currentParentId);
    } else {
      updatedAttendees.push({
        parentId: currentParentId,
        parentName: currentParentName,
        childName: currentChildName,
        joinedAt: new Date().toISOString()
      });
    }

    const updatedSession: PlaytimeSession = {
      ...session,
      attendees: updatedAttendees
    };

    try {
      await setDoc(doc(db, 'playtime_sessions', session.id), updatedSession, { merge: true }).catch(() => {});
    } catch {
      // offline
    }

    const newSessions = groupSessions.map(s => s.id === session.id ? updatedSession : s);
    setGroupSessions(newSessions);
    try {
      localStorage.setItem('vernunt_group_playtime_sessions_v1', JSON.stringify(newSessions));
    } catch {
      // ignore
    }

    if (!isAlreadyJoined) {
      confetti({ particleCount: 50, spread: 45 });
      const splitAmount = Math.round(session.totalCost / updatedAttendees.length);
      setNotification(`🤝 You are joined! Current split with ${updatedAttendees.length} families: ₹${splitAmount} each.`);
    } else {
      setNotification(`Left session roster.`);
    }
    setTimeout(() => setNotification(null), 4000);
  };

  // Simulate paying split fee
  const handlePaySplitShare = (sessionId: string, amount: number) => {
    confetti({ particleCount: 100, spread: 70 });
    setGroupSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          attendees: s.attendees.map(a => {
            if (a.parentId === (userProfile?.id || 'user-parent')) {
              return { ...a, paid: true };
            }
            return a;
          })
        };
      }
      return s;
    }));
    setNotification(`💳 Payment of ₹${amount} confirmed! Your split share is paid.`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Direct 1-on-1 invite submit
  const handleDirectInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestId || !directDate || !directTime || !directLocation) {
      alert('Please fill out all required fields.');
      return;
    }

    const matchedCompanion = playmates.find(p => p.id === guestId);
    const guestChildName = matchedCompanion ? matchedCompanion.childName : 'Playmate';
    const cleanHostId = auth.currentUser?.uid || userProfile?.id || 'user-0';

    const newRequest: Playdate = {
      id: `request-${Date.now()}`,
      title: plannerTitle.trim() || `Play Time with ${guestChildName}`,
      hostId: cleanHostId,
      guestId,
      date: directDate,
      time: directTime,
      location: directLocation.trim(),
      status: 'Pending',
      notes: meetingNotes.trim()
    };

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'playdates', newRequest.id), newRequest);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `playdates/${newRequest.id}`);
      }
    } else {
      setPlaydates([newRequest, ...playdates]);
    }

    sendPlaydateRequestPush({
      targetUserId: guestId,
      requesterParentName: userProfile?.parentName || 'Vernunt Parent',
      requesterChildName: userProfile?.childName || 'Playmate',
      inviteeChildName: guestChildName,
      date: directDate,
      time: directTime,
      location: directLocation.trim(),
      playdateId: newRequest.id
    }).catch(() => {});

    setNotification(`Successfully sent play time invitation to ${guestChildName}'s parent!`);
    setTimeout(() => setNotification(null), 4000);
    confetti({ particleCount: 70, spread: 50 });

    setPlannerTitle('');
    setDirectLocation('');
    setMeetingNotes('');
  };

  return (
    <div id="playtime-planner-container" className="space-y-6 animate-fade-in text-left">
      {/* Toast Notification */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs sm:text-sm font-bold rounded-2xl shadow-sm flex items-center gap-2.5 animate-slide-up">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Sub-Tabs: Collaborative Split Sessions vs 1-on-1 Invites */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPlannerMode('group_split')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              plannerMode === 'group_split'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Group Playtime &amp; Venue Cost Split</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-700 text-orange-100 font-extrabold">
              ₹300/hr Split
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPlannerMode('direct_invite')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              plannerMode === 'direct_invite'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CalendarRange className="w-4 h-4" />
            <span>1-on-1 Companion Invite</span>
          </button>
        </div>

        {plannerMode === 'group_split' && (
          <button
            type="button"
            onClick={() => setIsCreateSessionModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer ml-auto"
          >
            <Plus className="w-4 h-4 text-orange-400" />
            <span>Create Playtime Session</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: GROUP PLAYTIME SESSIONS WITH VENUE SPLIT COST (REQUEST 6 ENGINE)   */}
      {/* ========================================================================= */}
      {plannerMode === 'group_split' && (
        <div className="space-y-6">
          {/* Explanation Banner */}
          <div className="p-4 bg-gradient-to-r from-orange-50 via-amber-50 to-rose-50 border border-orange-200/80 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-orange-950 shadow-2xs">
            <div className="flex items-start gap-3">
              <span className="text-2xl p-2 bg-white rounded-2xl border border-orange-200 shrink-0">🤝</span>
              <div className="space-y-0.5">
                <h4 className="text-sm font-black font-serif">
                  Fair Split Playtime Venue Model (e.g. ₹300/hour)
                </h4>
                <p className="text-xs text-orange-900/90 leading-relaxed max-w-2xl">
                  Host or join a group playtime at local playhomes, activity centres or clubhouses. Anyone can join until strictly <strong>15 minutes before start time</strong>. Once locked, the hourly fee is automatically divided equally among all confirmed families!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <span className="text-[11px] font-black uppercase tracking-wider bg-orange-600 text-white px-3 py-1 rounded-xl shadow-2xs">
                ⏱️ 15-Min Cutoff Rule
              </span>
            </div>
          </div>

          {/* Group Sessions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {groupSessions.map((session) => {
              const isLocked = isSessionJoinLocked(session);
              const cutoffTimeStr = getCutoffFormatted(session);
              const totalFamilies = Math.max(session.attendees.length, 1);
              const perPersonSplit = Math.round(session.totalCost / totalFamilies);
              const currentUserId = userProfile?.id || auth.currentUser?.uid || 'user-parent';
              const isUserGoing = session.attendees.some(a => a.parentId === currentUserId);
              const currentUserAttendee = session.attendees.find(a => a.parentId === currentUserId);

              return (
                <div
                  key={session.id}
                  className={`bg-white rounded-3xl border overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between ${
                    isLocked ? 'border-slate-300 ring-2 ring-slate-200' : 'border-orange-200/90 ring-2 ring-orange-200/40'
                  }`}
                >
                  <div className="p-5 space-y-4">
                    {/* Header: Status and Cutoff pill */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`text-[10.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                        isLocked 
                          ? 'bg-slate-100 text-slate-700 border border-slate-300' 
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-300 animate-pulse'
                      }`}>
                        {isLocked ? <Lock className="w-3 h-3 text-slate-500" /> : <Clock className="w-3 h-3 text-emerald-600" />}
                        <span>{isLocked ? '🔒 Joining Locked (Finalized)' : `🟢 Open to Join (Closes: ${cutoffTimeStr})`}</span>
                      </span>

                      <span className="text-xs font-mono font-black text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-lg">
                        ₹{session.hourlyRate}/hr · Total ₹{session.totalCost}
                      </span>
                    </div>

                    {/* Title & Scheduled Time */}
                    <div className="space-y-1">
                      <h3 className="text-base font-black font-serif text-slate-900 leading-snug">
                        {session.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap">
                        <span className="flex items-center gap-1">
                          <CalendarRange className="w-3.5 h-3.5 text-slate-400" />
                          <span>{session.date}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{session.time} ({session.durationHours} hr)</span>
                        </span>
                        <span>•</span>
                        <span className="text-slate-600">Hosted by <strong>{session.hostParentName}</strong></span>
                      </div>
                    </div>

                    {/* Location Details with Mandatory Coordinates Badge */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Building2 className="w-4 h-4 text-orange-600 shrink-0" />
                          <span className="truncate">{session.locationName}</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {session.locality}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        {session.address}
                      </p>
                      <div className="flex items-center gap-2 pt-0.5 text-[10.5px] font-mono text-slate-400">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>GPS Coordinates: {session.lat.toFixed(4)}, {session.lng.toFixed(4)}</span>
                      </div>
                    </div>

                    {/* Cost Split Breakdown Card */}
                    <div className={`p-4 rounded-2xl border space-y-2.5 ${
                      isLocked ? 'bg-amber-50/70 border-amber-200' : 'bg-orange-50/60 border-orange-200'
                    }`}>
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-700">
                          {isLocked ? '🎯 Finalized Split per Parent:' : '📊 Estimated Split per Family:'}
                        </span>
                        <span className="text-base font-black font-mono text-orange-900">
                          ₹{perPersonSplit} <span className="text-[10px] font-normal text-slate-500">/ family</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-tight">
                        Venue fee of ₹{session.totalCost} divided equally across <strong>{session.attendees.length} family(ies)</strong>.
                      </p>

                      {/* Attendee Roster of "Going" Parents */}
                      <div className="space-y-1.5 pt-1 border-t border-orange-200/60">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                          Confirmed Attending Families ({session.attendees.length}):
                        </span>
                        <div className="space-y-1">
                          {session.attendees.map((attendee, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/80">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                <span className="font-bold text-slate-800 truncate">{attendee.parentName}</span>
                                <span className="text-[11px] text-slate-400">({attendee.childName})</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono font-bold text-slate-900 text-xs">
                                  ₹{perPersonSplit}
                                </span>
                                {isLocked && (
                                  attendee.paid ? (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                      ✓ Paid
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                      Pending
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                    {!isLocked ? (
                      <button
                        type="button"
                        onClick={() => handleToggleJoinSession(session)}
                        className={`w-full py-2.5 px-4 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                          isUserGoing
                            ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                            : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                        }`}
                      >
                        {isUserGoing ? (
                          <>
                            <span>✓ You&apos;re Going (Tap to Leave)</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Join Session (Split ₹{perPersonSplit} Fee)</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-between gap-2">
                        {isUserGoing ? (
                          currentUserAttendee?.paid ? (
                            <div className="w-full py-2.5 px-3 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1.5">
                              <Check className="w-4 h-4 text-emerald-700" />
                              <span>Your ₹{perPersonSplit} Split Share is Paid! See you there.</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handlePaySplitShare(session.id, perPersonSplit)}
                              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                            >
                              <CreditCard className="w-4 h-4" />
                              <span>Pay My Split Share (₹{perPersonSplit})</span>
                            </button>
                          )
                        ) : (
                          <div className="w-full py-2 text-center text-xs text-slate-500 font-bold">
                            🔒 Registrations closed 15m before start time.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: 1-ON-1 DIRECT COMPANION INVITATIONS                                */}
      {/* ========================================================================= */}
      {plannerMode === 'direct_invite' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PlaydateActivitySuggestions
              userProfile={userProfile}
              targetChild={activeCompanion || playmates.find(p => p.id === guestId) || null}
              allPlaymates={playmates}
              onSelectActivityForPlaydate={(activityTitle, location, notes, companionId) => {
                if (activityTitle) setPlannerTitle(activityTitle);
                if (location) setDirectLocation(location);
                if (notes) setMeetingNotes(notes);
                if (companionId) setGuestId(companionId);
                setNotification(`✨ Populated "${activityTitle}" into the schedule form!`);
                setTimeout(() => setNotification(null), 5000);
              }}
            />

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-slate-800 mb-2">
                <div className="flex items-center gap-2">
                  <CalendarRange className="w-5.5 h-5.5 text-orange-500" />
                  <h3 className="font-bold text-lg font-serif">Propose 1-on-1 Play Time</h3>
                </div>
                {onOpenPushModal && (
                  <button
                    type="button"
                    onClick={onOpenPushModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold border border-orange-200 transition-colors"
                  >
                    <BellRing className="w-3.5 h-3.5 text-orange-600" />
                    <span>FCM Push Alerts</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleDirectInviteSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-600 uppercase">Interactive Play Time Title</label>
                  <input
                    type="text"
                    value={plannerTitle}
                    onChange={(e) => setPlannerTitle(e.target.value)}
                    placeholder="e.g. Lego Building & Drawing Afternoon"
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-orange-200 focus:bg-white transition"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Select Companion</label>
                  <select
                    value={guestId}
                    onChange={(e) => setGuestId(e.target.value)}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-orange-200 focus:bg-white transition"
                  >
                    {playmates.map(p => (
                      <option key={p.id} value={p.id}>{p.childName} ({p.gradeLevel})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Meeting Venue / Playground</label>
                  <input
                    type="text"
                    required
                    value={directLocation}
                    onChange={(e) => setDirectLocation(e.target.value)}
                    placeholder="e.g. Sunshine Playhome or Defense Colony Park"
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-orange-200 focus:bg-white transition"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Choose Date</label>
                  <input
                    type="date"
                    required
                    value={directDate}
                    onChange={(e) => setDirectDate(e.target.value)}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-orange-200 focus:bg-white transition"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Start Time</label>
                  <input
                    type="time"
                    required
                    value={directTime}
                    onChange={(e) => setDirectTime(e.target.value)}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-orange-200 focus:bg-white transition"
                  />
                </div>

                <div className="flex flex-col space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-600 uppercase">Parents' notes & Friendly alerts</label>
                  <textarea
                    rows={2}
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    placeholder="Share any toy preferences, food sensitivities, or parent agreements..."
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-orange-200 focus:bg-white transition"
                  />
                </div>

                <button
                  type="submit"
                  className="md:col-span-2 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
                >
                  Send Play Time Invitation
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-800">
                <CalendarCheck2 className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base font-serif">1-on-1 Meets</h3>
              </div>
              <div className="space-y-3">
                {playdates.map((d) => (
                  <div key={d.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{d.title}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {d.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      📍 {d.location} • 🗓️ {d.date} at {d.time}
                    </div>
                  </div>
                ))}
                {playdates.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">No 1-on-1 invitations yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW PLAYTIME SESSION (CHOOSE OR ADD LOCATION WITH LAT/LNG)  */}
      {/* ========================================================================= */}
      {isCreateSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-scale-up text-left">
            <div className="p-5 bg-gradient-to-r from-orange-600 via-amber-600 to-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black font-serif">Create Playtime Group &amp; Split Fee</h3>
                <span className="text-xs text-orange-200">
                  Fair hourly cost sharing with neighborhood parents
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateSessionModalOpen(false)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroupSession} className="p-5 space-y-4">
              {/* Session Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Playtime Title / Activity:</label>
                <input
                  type="text"
                  required
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g. Saturday Soft Play &amp; Sensory Hour at Playhome"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-orange-500 shadow-2xs"
                />
              </div>

              {/* Date, Time, Duration */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Date:</label>
                  <input
                    type="date"
                    required
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Start Time:</label>
                  <input
                    type="time"
                    required
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Duration:</label>
                  <select
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-orange-500"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={2}>2 Hours</option>
                    <option value={3}>3 Hours</option>
                  </select>
                </div>
              </div>

              {/* Venue / Location Option Switcher */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    Location for Kids to Play:
                  </label>
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setLocationMode('existing')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        locationMode === 'existing' ? 'bg-white text-orange-700 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      Choose Saved
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocationMode('new')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        locationMode === 'new' ? 'bg-white text-orange-700 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      + Add New Location
                    </button>
                  </div>
                </div>

                {/* Option A: Choose Existing Saved Venue */}
                {locationMode === 'existing' ? (
                  <div className="space-y-2">
                    <select
                      value={selectedLocationId}
                      onChange={(e) => {
                        setSelectedLocationId(e.target.value);
                        const matched = savedLocations.find(l => l.id === e.target.value);
                        if (matched) {
                          setSessionHourlyFee(matched.hourlyRate);
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-orange-500 shadow-2xs"
                    >
                      {savedLocations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.locality}) — {loc.hourlyRate > 0 ? `₹${loc.hourlyRate}/hr` : 'Free'}
                        </option>
                      ))}
                    </select>

                    {/* Venue Pricing preview */}
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-between text-xs font-bold text-orange-950">
                      <span>Venue Rate: ₹{sessionHourlyFee}/hour</span>
                      <span>Total Session Cost: ₹{sessionHourlyFee * sessionDuration}</span>
                    </div>
                  </div>
                ) : (
                  /* Option B: Add New Location with MANDATORY Lat/Lng */
                  <div className="p-3.5 bg-orange-50/70 border border-orange-300 rounded-2xl space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Venue / Location Name *</label>
                      <input
                        type="text"
                        required
                        value={newLocName}
                        onChange={(e) => setNewLocName(e.target.value)}
                        placeholder="e.g. Toddler World Playhome, Indiranagar"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Locality / Area</label>
                        <input
                          type="text"
                          value={newLocLocality}
                          onChange={(e) => setNewLocLocality(e.target.value)}
                          placeholder="e.g. Indiranagar, HSR Layout"
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-orange-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Hourly Rate (₹/hr)</label>
                        <input
                          type="number"
                          value={sessionHourlyFee}
                          onChange={(e) => setSessionHourlyFee(Number(e.target.value))}
                          placeholder="300"
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold font-mono text-slate-800 focus:outline-orange-500"
                        />
                      </div>
                    </div>

                    {/* Mandatory Coordinates & GPS Autofill */}
                    <div className="bg-white p-3 rounded-xl border border-orange-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-orange-950">
                          Geo-Coordinates (Mandatory) *
                        </span>
                        <button
                          type="button"
                          onClick={handleDetectGpsForLocation}
                          disabled={isDetectingGps}
                          className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-[10.5px] rounded-lg shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          {isDetectingGps ? 'Detecting...' : '📍 Autofill GPS'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Latitude *</label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={newLocLat}
                            onChange={(e) => setNewLocLat(e.target.value)}
                            placeholder="12.9716"
                            className="w-full bg-slate-50 border border-orange-300 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Longitude *</label>
                          <input
                            type="number"
                            step="any"
                            required
                            value={newLocLng}
                            onChange={(e) => setNewLocLng(e.target.value)}
                            placeholder="77.5946"
                            className="w-full bg-slate-50 border border-orange-300 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Notes &amp; Play details (Optional):</label>
                <textarea
                  rows={2}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="e.g. Please bring socks for soft play area; organic snacks welcome."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-orange-500 shadow-2xs resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateSessionModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold text-xs hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish Session &amp; Invite Families</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
