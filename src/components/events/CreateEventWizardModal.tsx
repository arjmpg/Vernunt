import React, { useState } from 'react';
import { CommunityEvent, TicketTier, EventScheduleItem } from '../../types.ts';
import { 
  X, Plus, Trash2, Calendar, Clock, MapPin, Ticket, 
  Sparkles, Image, Tag, ShieldCheck, DollarSign, Check, Users,
  Video, Link2, ExternalLink, BookOpen, Palette, Trophy, AlertCircle, Laptop, CalendarRange
} from 'lucide-react';
import AestheticImageUploader from '../AestheticImageUploader.tsx';
import { sendEventPublishedNotification } from '../../utils/notifications.ts';
import { calculateEventCommissionPolicy } from '../../utils/ticketingCommission.ts';
import { db } from '../../utils/firebase.ts';
import { doc, setDoc } from 'firebase/firestore';

interface CreateEventWizardModalProps {
  userProfile: any;
  onClose: () => void;
  onAddEvent: (newEvent: CommunityEvent) => void;
  customCategories?: any[];
}

export default function CreateEventWizardModal({
  userProfile,
  onClose,
  onAddEvent,
  customCategories = []
}: CreateEventWizardModalProps) {
  // Top-Level Classification: Event vs Classes vs Activity
  const [itemCategoryType, setItemCategoryType] = useState<'event' | 'classes' | 'activity'>('event');

  // Delivery Mode: Physical In-Person vs Virtual Online
  const [deliveryMode, setDeliveryMode] = useState<'physical' | 'virtual'>('physical');

  // Basic Information
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Event');
  
  // Date and Time: Start Date and End Date
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [time, setTime] = useState('10:00 AM - 12:30 PM');

  // Physical Location Fields
  const [location, setLocation] = useState(userProfile?.location?.address || '');
  const [venueDetails, setVenueDetails] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');

  // Virtual Online Fields (Google Chat / Meet)
  const [googleChatLink, setGoogleChatLink] = useState('');
  const [virtualPlatform, setVirtualPlatform] = useState('Google Meet');
  const [virtualMeetingDetails, setVirtualMeetingDetails] = useState('');

  // Classes Specific Dynamic Fields
  const [subjectSkill, setSubjectSkill] = useState('');
  const [batchSchedule, setBatchSchedule] = useState('Every Saturday & Sunday');
  const [batchSize, setBatchSize] = useState<number>(15);
  const [prerequisites, setPrerequisites] = useState('Beginner friendly, no prior experience needed');

  // Activity Specific Dynamic Fields
  const [activityTheme, setActivityTheme] = useState('');
  const [suppliesProvided, setSuppliesProvided] = useState('All art supplies, aprons, and materials provided by host');
  const [thingsToBring, setThingsToBring] = useState('Water bottle, comfortable play clothing');

  // Event Specific Dynamic Fields
  const [eventGenre, setEventGenre] = useState('');
  const [chiefGuest, setChiefGuest] = useState('');
  const [dressCode, setDressCode] = useState('Comfortable Casual / Festive');
  const [refreshmentsIncluded, setRefreshmentsIncluded] = useState('Healthy snack box & fresh juice included for all kids');

  // Common Visuals & Demographic
  const [photoUrl, setPhotoUrl] = useState('');
  const [targetAgeRange, setTargetAgeRange] = useState('3 - 10 Years');
  const [tagsStr, setTagsStr] = useState('Kids, Weekend, Fun, Learning');
  
  // Recurring slots
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringSlots, setRecurringSlots] = useState<string[]>([
    '10:00 AM - 11:30 AM (Morning Batch)',
    '03:00 PM - 04:30 PM (Evening Batch)'
  ]);
  const [newSlotInput, setNewSlotInput] = useState('');

  // Ticket Tiers Builder (WooEvents)
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([
    {
      id: 'tier-1',
      name: 'Standard Admission (1 Child + 1 Parent)',
      price: 199,
      capacity: 35,
      remainingStock: 35,
      description: 'Complete access to activities and participation certificate.',
      maxPerOrder: 4,
      includesKit: false
    },
    {
      id: 'tier-2',
      name: 'VIP Explorer Pass + Activity Kit',
      price: 399,
      capacity: 15,
      remainingStock: 15,
      description: 'Priority seating, personal guidance coach, and take-home craft kit.',
      maxPerOrder: 2,
      includesKit: true
    }
  ]);

  // Schedule Timeline Builder
  const [scheduleAgenda, setScheduleAgenda] = useState<EventScheduleItem[]>([
    { id: 'sch-1', time: '10:00 AM', title: 'Welcome & Icebreaker Games', speaker: 'Host', description: 'Fun interactive games for kids' },
    { id: 'sch-2', time: '10:30 AM', title: 'Hands-on Session & Creative Workshop', speaker: 'Lead Instructor', description: 'Guided hands-on activity' },
    { id: 'sch-3', time: '11:45 AM', title: 'Snacks & Certificates Distribution', description: 'Healthy refreshments & photo session' }
  ]);

  const [newAgendaTime, setNewAgendaTime] = useState('');
  const [newAgendaTitle, setNewAgendaTitle] = useState('');

  // Active Tab in Wizard
  const [wizardStep, setWizardStep] = useState<'basics' | 'tickets' | 'agenda'>('basics');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync category display name when itemCategoryType switches
  const handleItemTypeChange = (type: 'event' | 'classes' | 'activity') => {
    setItemCategoryType(type);
    if (type === 'classes') {
      setCategory('Class');
      if (!title || title.includes('Workshop') || title.includes('Event')) {
        setTitle('Kids Interactive Learning Masterclass');
      }
    } else if (type === 'activity') {
      setCategory('Activity');
      if (!title || title.includes('Class') || title.includes('Event')) {
        setTitle('Weekend Creative Activity Circle');
      }
    } else {
      setCategory('Event');
      if (!title || title.includes('Class') || title.includes('Activity')) {
        setTitle('Community Carnival & Children Gathering');
      }
    }
  };

  const handleAddTier = () => {
    const newTier: TicketTier = {
      id: `tier-${Date.now()}`,
      name: 'General Pass',
      price: 249,
      capacity: 25,
      remainingStock: 25,
      description: 'Admission tier details and inclusions',
      maxPerOrder: 4,
      includesKit: false
    };
    setTicketTiers([...ticketTiers, newTier]);
  };

  const handleRemoveTier = (tierId: string) => {
    if (ticketTiers.length <= 1) return;
    setTicketTiers(ticketTiers.filter(t => t.id !== tierId));
  };

  const handleUpdateTier = (tierId: string, field: keyof TicketTier, value: any) => {
    setTicketTiers(ticketTiers.map(t => t.id === tierId ? { ...t, [field]: value } : t));
  };

  const handleAddRecurringSlot = () => {
    if (!newSlotInput.trim()) return;
    setRecurringSlots([...recurringSlots, newSlotInput.trim()]);
    setNewSlotInput('');
  };

  const handleAddAgendaItem = () => {
    if (!newAgendaTime || !newAgendaTitle) return;
    setScheduleAgenda([
      ...scheduleAgenda,
      {
        id: `sch-${Date.now()}`,
        time: newAgendaTime,
        title: newAgendaTitle
      }
    ]);
    setNewAgendaTime('');
    setNewAgendaTitle('');
  };

  const validateAllFields = (): boolean => {
    setValidationError(null);

    if (!title.trim()) {
      setValidationError('Please enter a Title for your ' + (itemCategoryType === 'classes' ? 'Class' : itemCategoryType === 'activity' ? 'Activity' : 'Event') + '.');
      setWizardStep('basics');
      return false;
    }

    if (!startDate) {
      setValidationError('Please select an Event Start Date.');
      setWizardStep('basics');
      return false;
    }

    if (!endDate) {
      setValidationError('Please select an Event End Date.');
      setWizardStep('basics');
      return false;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setValidationError('Event End Date cannot be earlier than Event Start Date.');
      setWizardStep('basics');
      return false;
    }

    if (!time.trim()) {
      setValidationError('Please enter the timing (e.g. 10:00 AM - 12:30 PM).');
      setWizardStep('basics');
      return false;
    }

    if (deliveryMode === 'physical') {
      if (!location.trim()) {
        setValidationError('Please specify the physical venue address or studio location.');
        setWizardStep('basics');
        return false;
      }
    } else {
      if (!googleChatLink.trim()) {
        setValidationError('Please provide the Google Chat or Google Meet link for virtual access.');
        setWizardStep('basics');
        return false;
      }
    }

    return true;
  };

  const handleCompleteAndPublish = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateAllFields()) return;

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const basePrice = ticketTiers[0]?.price || 0;
      const totalCapacity = ticketTiers.reduce((acc, t) => acc + (t.capacity || 0), 0);
      const hostRole = (userProfile?.role === 'influencer' || userProfile?.isInfluencer) ? 'influencer' : 'standard';
      const isInfluencer = hostRole === 'influencer';
      const policy = calculateEventCommissionPolicy({
        id: `evt-${Date.now()}`,
        hostName: userProfile?.parentName || 'Community Organizer',
        hostRole: hostRole,
        isInfluencerHost: isInfluencer
      } as any, userProfile);

      // Default high quality image based on category
      const fallbackImage = itemCategoryType === 'classes' 
        ? 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80'
        : itemCategoryType === 'activity'
        ? 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=600&q=80'
        : 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80';

      const resolvedDateString = startDate === endDate ? startDate : `${startDate} to ${endDate}`;

      const newEvent: CommunityEvent = {
        id: `evt-${Date.now()}`,
        title: title.trim(),
        description: description.trim() || `Exciting ${itemCategoryType} designed for kids and families with hands-on engagement.`,
        category: category,
        date: resolvedDateString,
        startDate: startDate,
        endDate: endDate,
        time: time.trim(),
        location: deliveryMode === 'virtual' ? 'Virtual (Online via Google Meet & Chat)' : location.trim(),
        hostName: userProfile?.parentName || 'Community Organizer',
        attendeesCount: 0,
        joined: false,
        photoUrl: photoUrl.trim() || fallbackImage,
        tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean),
        ticketPrice: basePrice,
        maxCapacity: totalCapacity,
        targetAgeRange: targetAgeRange.trim(),
        venueAddressDetails: deliveryMode === 'virtual' ? `Online Platform: ${virtualPlatform}` : venueDetails.trim(),
        googleMapsUrl: deliveryMode === 'virtual' ? '' : (googleMapsUrl.trim() || `https://maps.google.com/?q=${encodeURIComponent(location.trim())}`),
        lat: (typeof userProfile?.location?.lat === 'number' ? userProfile.location.lat : 12.9716) + (Math.random() - 0.5) * 0.005,
        lng: (typeof userProfile?.location?.lng === 'number' ? userProfile.location.lng : 77.5946) + (Math.random() - 0.5) * 0.005,
        
        // Multi-day, Classification & Virtual Links
        itemCategoryType: itemCategoryType,
        deliveryMode: deliveryMode,
        googleChatLink: deliveryMode === 'virtual' ? googleChatLink.trim() : undefined,
        virtualPlatform: deliveryMode === 'virtual' ? virtualPlatform : undefined,
        virtualMeetingDetails: deliveryMode === 'virtual' ? virtualMeetingDetails.trim() : undefined,
        
        // Dynamic category attributes
        subjectSkill: itemCategoryType === 'classes' ? subjectSkill.trim() : undefined,
        batchSchedule: itemCategoryType === 'classes' ? batchSchedule.trim() : undefined,
        batchSize: itemCategoryType === 'classes' ? batchSize : undefined,
        prerequisites: itemCategoryType === 'classes' ? prerequisites.trim() : undefined,
        activityTheme: itemCategoryType === 'activity' ? activityTheme.trim() : undefined,
        suppliesProvided: itemCategoryType === 'activity' ? suppliesProvided.trim() : undefined,
        thingsToBring: itemCategoryType === 'activity' ? thingsToBring.trim() : undefined,
        eventGenre: itemCategoryType === 'event' ? eventGenre.trim() : undefined,
        chiefGuest: itemCategoryType === 'event' ? chiefGuest.trim() : undefined,
        dressCode: itemCategoryType === 'event' ? dressCode.trim() : undefined,
        refreshmentsIncluded: itemCategoryType === 'event' ? refreshmentsIncluded.trim() : undefined,

        // WooEvents parameters
        ticketTiers: ticketTiers,
        scheduleAgenda: scheduleAgenda,
        isRecurring: isRecurring,
        recurringSlots: isRecurring ? recurringSlots : undefined,
        freeTicketsQuota: policy.freeTicketsQuota,
        freeTicketsIssued: 0,
        isInfluencerHost: isInfluencer,
        hostRole: hostRole,
        isMock: false, // Genuine user-created listing!
        organizerContact: {
          name: userProfile?.parentName || 'Organizer',
          phone: userProfile?.phoneNumber,
          email: userProfile?.email
        }
      };

      // 1. Dispatch in parent state
      onAddEvent(newEvent);

      // 2. Persist in LocalStorage
      try {
        const stored = localStorage.getItem('vernunt_user_created_events');
        const existingList = stored ? JSON.parse(stored) : [];
        localStorage.setItem('vernunt_user_created_events', JSON.stringify([newEvent, ...existingList]));
      } catch (lsErr) {
        console.warn('LocalStorage save note:', lsErr);
      }

      // 3. Persist in Firestore
      try {
        if (db) {
          await setDoc(doc(db, 'events', newEvent.id), newEvent);
        }
      } catch (fsErr) {
        console.warn('Firestore event persist note:', fsErr);
      }

      // 4. Send Organizer Confirmation Notification
      if (userProfile?.email) {
        sendEventPublishedNotification(newEvent, userProfile.email).catch((err) => {
          console.warn('Organizer publishing alert note:', err);
        });
      }

      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      console.error('Failed to complete event creation:', err);
      setValidationError('Failed to complete registration: ' + (err.message || 'Please check inputs and retry.'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/30 shadow-inner">
              {itemCategoryType === 'classes' ? <BookOpen className="w-5 h-5" /> : itemCategoryType === 'activity' ? <Palette className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-200 block">
                Vernunt Host Creator Studio
              </span>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Create {itemCategoryType === 'classes' ? 'Classes' : itemCategoryType === 'activity' ? 'Activities' : 'Event'}</span>
                {deliveryMode === 'virtual' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/80 text-white border border-blue-300/40">
                    Virtual (Online)
                  </span>
                )}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="bg-rose-50 border-b border-rose-200 px-5 py-3 flex items-start gap-2.5 text-xs text-rose-700 font-semibold animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{validationError}</div>
            <button 
              type="button" 
              onClick={() => setValidationError(null)} 
              className="text-rose-500 hover:text-rose-700 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Primary Classification Selector: Event vs Classes vs Activity */}
        <div className="bg-slate-50 border-b border-slate-200 p-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                1. Select Listing Type *
              </span>
              <p className="text-[11px] text-slate-500">Choose category to reveal specialized fields</p>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/80 rounded-2xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleItemTypeChange('event')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  itemCategoryType === 'event'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>🎪 Event</span>
              </button>
              <button
                type="button"
                onClick={() => handleItemTypeChange('classes')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  itemCategoryType === 'classes'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>📚 Classes</span>
              </button>
              <button
                type="button"
                onClick={() => handleItemTypeChange('activity')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  itemCategoryType === 'activity'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>🎨 Activity</span>
              </button>
            </div>
          </div>
        </div>

        {/* Step Progress Navigation */}
        <div className="flex border-b border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setWizardStep('basics')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition ${
              wizardStep === 'basics'
                ? 'border-orange-600 text-orange-600 bg-orange-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>1. Core Details & Format</span>
          </button>
          <button
            type="button"
            onClick={() => setWizardStep('tickets')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition ${
              wizardStep === 'tickets'
                ? 'border-orange-600 text-orange-600 bg-orange-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>2. Passes & Pricing</span>
          </button>
          <button
            type="button"
            onClick={() => setWizardStep('agenda')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition ${
              wizardStep === 'agenda'
                ? 'border-orange-600 text-orange-600 bg-orange-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>3. Timeline & Photos</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCompleteAndPublish} className="p-5 overflow-y-auto flex-1 space-y-4">

          {/* STEP 1: BASICS, DATES, DELIVERY FORMAT & DYNAMIC FIELDS */}
          {wizardStep === 'basics' && (
            <div className="space-y-4 text-xs">

              {/* Delivery Format Toggle: Virtual vs Physical */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <label className="block font-black text-slate-800 text-[11px] uppercase tracking-wider">
                  2. Delivery Mode: Virtual vs Physical Location *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('physical')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      deliveryMode === 'physical'
                        ? 'border-orange-500 bg-orange-50/70 text-orange-950 ring-2 ring-orange-200 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${deliveryMode === 'physical' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs block">🏫 In-Person Physical Venue</span>
                      <span className="text-[11px] opacity-80 block mt-0.5">Held at studio, auditorium, park, or classroom</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode('virtual')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      deliveryMode === 'virtual'
                        ? 'border-blue-500 bg-blue-50/70 text-blue-950 ring-2 ring-blue-200 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${deliveryMode === 'virtual' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs block">💻 Virtual / Online</span>
                      <span className="text-[11px] opacity-80 block mt-0.5">Google Chat & Google Meet live interactive session</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Title Field */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {itemCategoryType === 'classes' ? 'Class Title *' : itemCategoryType === 'activity' ? 'Activity Title *' : 'Event Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    itemCategoryType === 'classes' 
                      ? "e.g. Master Coding in Scratch: Beginner Game Dev Bootcamp"
                      : itemCategoryType === 'activity'
                      ? "e.g. Saturday Clay Pottery & Nature Canvas Painting"
                      : "e.g. Annual Neighborhood Kids Carnival & Magic Festival"
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none text-xs"
                />
              </div>

              {/* Category & Target Age Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Category Tag
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white text-xs"
                  >
                    <option value="Event">Event</option>
                    <option value="Class">Class / Workshop</option>
                    <option value="Activity">Activity</option>
                    <option value="Competition">Competition</option>
                    {customCategories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Target Age Range *
                  </label>
                  <input
                    type="text"
                    value={targetAgeRange}
                    onChange={(e) => setTargetAgeRange(e.target.value)}
                    placeholder="e.g. 4 - 9 Years"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* EVENT START DATE & EVENT END DATE */}
              <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
                  <CalendarRange className="w-3.5 h-3.5 text-orange-600" />
                  <span>Event Schedule Dates (Start & End Date) *</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                      Event Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      min={todayStr}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (!endDate || new Date(endDate) < new Date(e.target.value)) {
                          setEndDate(e.target.value);
                        }
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                      Event End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      min={startDate || todayStr}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white text-xs"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-slate-500">
                  {startDate === endDate 
                    ? `Single-day event on ${startDate}` 
                    : `Multi-day schedule spanning from ${startDate} to ${endDate}`}
                </div>
              </div>

              {/* Timing */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Session Timings / Slot Hours *
                </label>
                <input
                  type="text"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="e.g. 10:00 AM - 12:30 PM (or Every Sat & Sun 4:00 PM)"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none text-xs"
                />
              </div>

              {/* VIRTUAL DELIVERY FIELDS: Google Chat Link & Online Room Setup */}
              {deliveryMode === 'virtual' ? (
                <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-blue-950 font-bold">
                      <Video className="w-4 h-4 text-blue-600" />
                      <span>Virtual Google Chat / Google Meet Integration *</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.open('https://meet.google.com/new', '_blank')}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-xs"
                      title="Open Google Meet to generate a new meeting room URL"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Create Google Room</span>
                    </button>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Google Chat / Meet Room Link *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Link2 className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <input
                        type="url"
                        required
                        value={googleChatLink}
                        onChange={(e) => setGoogleChatLink(e.target.value)}
                        placeholder="https://meet.google.com/abc-defg-hij or https://chat.google.com/room/..."
                        className="w-full pl-9 p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-xs font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      This link is strictly shared with verified parents once tickets are purchased or registration is approved.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Virtual Platform
                      </label>
                      <select
                        value={virtualPlatform}
                        onChange={(e) => setVirtualPlatform(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-300 bg-white text-xs"
                      >
                        <option value="Google Meet">Google Meet</option>
                        <option value="Google Chat">Google Chat Room</option>
                        <option value="Zoom">Zoom Meeting</option>
                        <option value="Microsoft Teams">Microsoft Teams</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Passcode / Room Code (Optional)
                      </label>
                      <input
                        type="text"
                        value={virtualMeetingDetails}
                        onChange={(e) => setVirtualMeetingDetails(e.target.value)}
                        placeholder="e.g. VERNUNT2026 or join 5 mins early"
                        className="w-full p-2 rounded-xl border border-slate-300 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* PHYSICAL DELIVERY FIELDS */
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Venue & Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Indiranagar Community Center, 100ft Road, Bengaluru"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Landmark / Room / Floor
                      </label>
                      <input
                        type="text"
                        value={venueDetails}
                        onChange={(e) => setVenueDetails(e.target.value)}
                        placeholder="e.g. 2nd Floor, Hall B, Next to Metro"
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Google Maps Location URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={googleMapsUrl}
                        onChange={(e) => setGoogleMapsUrl(e.target.value)}
                        placeholder="https://maps.app.goo.gl/..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* DYNAMIC FIELDS: CLASSES SPECIFIC */}
              {itemCategoryType === 'classes' && (
                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>Classes & Curriculum Specific Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Subject / Skill Taught *
                      </label>
                      <input
                        type="text"
                        value={subjectSkill}
                        onChange={(e) => setSubjectSkill(e.target.value)}
                        placeholder="e.g. Python Coding, Vedic Math, Karate, Chess"
                        className="w-full p-2 bg-white rounded-xl border border-slate-300 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Batch Schedule & Frequency
                      </label>
                      <input
                        type="text"
                        value={batchSchedule}
                        onChange={(e) => setBatchSchedule(e.target.value)}
                        placeholder="e.g. Every Sat & Sun (8 Weeks Course)"
                        className="w-full p-2 bg-white rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Max Students per Batch
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={batchSize}
                        onChange={(e) => setBatchSize(Number(e.target.value))}
                        className="w-full p-2 bg-white rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Prerequisites & Materials Provided
                      </label>
                      <input
                        type="text"
                        value={prerequisites}
                        onChange={(e) => setPrerequisites(e.target.value)}
                        placeholder="e.g. Worksheets provided, bring laptop"
                        className="w-full p-2 bg-white rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* DYNAMIC FIELDS: ACTIVITY SPECIFIC */}
              {itemCategoryType === 'activity' && (
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                    <Palette className="w-4 h-4 text-emerald-600" />
                    <span>Activity & Workshop Specific Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Activity Focus / Theme
                      </label>
                      <input
                        type="text"
                        value={activityTheme}
                        onChange={(e) => setActivityTheme(e.target.value)}
                        placeholder="e.g. Pottery, Obstacle Course, Sensory Play"
                        className="w-full p-2 bg-white rounded-xl border border-slate-300 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Supplies & Equipment Provided
                      </label>
                      <input
                        type="text"
                        value={suppliesProvided}
                        onChange={(e) => setSuppliesProvided(e.target.value)}
                        placeholder="e.g. Clay, canvas, brushes, safety aprons"
                        className="w-full p-2 bg-white rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      What Kids Should Bring
                    </label>
                    <input
                      type="text"
                      value={thingsToBring}
                      onChange={(e) => setThingsToBring(e.target.value)}
                      placeholder="e.g. Water bottle, change of clothes, comfortable sneakers"
                      className="w-full p-2 bg-white rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* DYNAMIC FIELDS: EVENT SPECIFIC */}
              {itemCategoryType === 'event' && (
                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    <span>Event Highlights & Experience</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Event Genre / Program Theme
                      </label>
                      <input
                        type="text"
                        value={eventGenre}
                        onChange={(e) => setEventGenre(e.target.value)}
                        placeholder="e.g. Kids Carnival, Sports Meet, Puppet Show"
                        className="w-full p-2 bg-white rounded-xl border border-slate-300 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Chief Guest / Star Performers
                      </label>
                      <input
                        type="text"
                        value={chiefGuest}
                        onChange={(e) => setChiefGuest(e.target.value)}
                        placeholder="e.g. Master Magician Raj, Olympic Coach"
                        className="w-full p-2 bg-white rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Dress Code / Costume Theme
                      </label>
                      <input
                        type="text"
                        value={dressCode}
                        onChange={(e) => setDressCode(e.target.value)}
                        placeholder="e.g. Superhero costume, ethnic wear, casual"
                        className="w-full p-2 bg-white rounded-xl border border-slate-300 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Refreshments & Snacks Included
                      </label>
                      <input
                        type="text"
                        value={refreshmentsIncluded}
                        onChange={(e) => setRefreshmentsIncluded(e.target.value)}
                        placeholder="e.g. Complimentary healthy snack box & juice"
                        className="w-full p-2 bg-white rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Comprehensive Description Field */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {itemCategoryType === 'classes'
                    ? 'Class Description & Syllabus Outline *'
                    : itemCategoryType === 'activity'
                    ? 'Activity Description & Itinerary *'
                    : 'Event Description & Highlights *'}
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    itemCategoryType === 'classes'
                      ? "Detail what students will learn, weekly modules, instructor credentials, teaching style, and tangible takeaways..."
                      : itemCategoryType === 'activity'
                      ? "Describe the fun games, challenges, hands-on activities, safety supervision, and parental involvement..."
                      : "Provide a complete overview of the event attractions, stage performances, stalls, family fun, and participation rules..."
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none text-xs"
                />
              </div>

            </div>
          )}

          {/* STEP 2: TICKET TIERS BUILDER */}
          {wizardStep === 'tickets' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Multiple Passes & Ticket Pricing</span>
                  <span className="text-[11px] text-slate-500">Configure ticket passes, admission prices, and attendee limits.</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddTier}
                  className="px-3 py-1.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Pass Tier</span>
                </button>
              </div>

              <div className="space-y-3">
                {ticketTiers.map((tier, idx) => (
                  <div key={tier.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-orange-600 text-[11px]">Pass #{idx + 1}</span>
                      {ticketTiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTier(tier.id)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase">Pass Tier Name</label>
                        <input
                          type="text"
                          value={tier.name}
                          onChange={(e) => handleUpdateTier(tier.id, 'name', e.target.value)}
                          placeholder="e.g. Standard Pass / VIP Pass"
                          className="w-full p-2 bg-white rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase">Price (₹ INR)</label>
                        <input
                          type="number"
                          min={0}
                          value={tier.price}
                          onChange={(e) => handleUpdateTier(tier.id, 'price', Number(e.target.value))}
                          className="w-full p-2 bg-white rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase">Total Capacity / Seats</label>
                        <input
                          type="number"
                          min={1}
                          value={tier.capacity}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handleUpdateTier(tier.id, 'capacity', val);
                            handleUpdateTier(tier.id, 'remainingStock', val);
                          }}
                          className="w-full p-2 bg-white rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase">Max Tickets Per Family</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={tier.maxPerOrder || 4}
                          onChange={(e) => handleUpdateTier(tier.id, 'maxPerOrder', Number(e.target.value))}
                          className="w-full p-2 bg-white rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase">What's Included</label>
                      <input
                        type="text"
                        value={tier.description || ''}
                        onChange={(e) => handleUpdateTier(tier.id, 'description', e.target.value)}
                        placeholder="e.g. Includes materials, refreshments, and participation medal"
                        className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: SCHEDULE, IMAGES & TAGS */}
          {wizardStep === 'agenda' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Banner Photo URL
                </label>
                <AestheticImageUploader
                  currentImageUrl={photoUrl}
                  onImageSelected={(url) => setPhotoUrl(url)}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Search & Discovery Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  placeholder="Weekend, Coding, Music, Art, Outdoor"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {/* Schedule Agenda Timeline */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-800 block text-xs">Timeline / Program Schedule</span>
                {scheduleAgenda.map((item, idx) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-orange-600 mr-2">{item.time}</span>
                      <span className="font-bold text-slate-800">{item.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScheduleAgenda(scheduleAgenda.filter(a => a.id !== item.id))}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add Agenda Item */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <input
                    type="text"
                    value={newAgendaTime}
                    onChange={(e) => setNewAgendaTime(e.target.value)}
                    placeholder="e.g. 11:00 AM"
                    className="p-2 bg-white rounded-lg border border-slate-300 text-xs"
                  />
                  <div className="col-span-2 flex gap-1.5">
                    <input
                      type="text"
                      value={newAgendaTitle}
                      onChange={(e) => setNewAgendaTitle(e.target.value)}
                      placeholder="e.g. Robotics Demo & Coding Race"
                      className="p-2 bg-white rounded-lg border border-slate-300 text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddAgendaItem}
                      className="px-3 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Wizard Controls: Available on ALL Steps */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              {wizardStep !== 'basics' && (
                <button
                  type="button"
                  onClick={() => setWizardStep(wizardStep === 'agenda' ? 'tickets' : 'basics')}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  ← Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {wizardStep !== 'agenda' && (
                <button
                  type="button"
                  onClick={() => {
                    if (wizardStep === 'basics') {
                      if (!validateAllFields()) return;
                      setWizardStep('tickets');
                    } else if (wizardStep === 'tickets') {
                      setWizardStep('agenda');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
                >
                  Next Step →
                </button>
              )}

              {/* Complete & Publish Button - ALWAYS ACCESSIBLE */}
              <button
                type="button"
                onClick={() => handleCompleteAndPublish()}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-xs shadow-md shadow-orange-600/25 transition active:scale-98 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4 text-white" />
                <span>
                  {isSubmitting 
                    ? 'Publishing...' 
                    : `Complete & Publish ${itemCategoryType === 'classes' ? 'Class' : itemCategoryType === 'activity' ? 'Activity' : 'Event'}`}
                </span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
