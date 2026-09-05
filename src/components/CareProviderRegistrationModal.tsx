import React, { useState } from 'react';
import { DaycarePlayhomeProfile, ChildProfile, CareProviderType } from '../types.ts';
import { 
  X, ShieldCheck, MapPin, DollarSign, Clock, Baby, 
  Home, Check, Sparkles, Plus, Trash2, Camera, Info, Eye,
  Navigation, UserCheck, HeartHandshake, Briefcase, Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import AadhaarUploadField, { DocUploadData } from './AadhaarUploadField.tsx';

interface CareProviderRegistrationModalProps {
  currentUserProfile: ChildProfile | null;
  onClose: () => void;
  onSaveProfile: (profile: DaycarePlayhomeProfile) => void;
  existingProfile?: DaycarePlayhomeProfile | null;
}

export default function CareProviderRegistrationModal({
  currentUserProfile,
  onClose,
  onSaveProfile,
  existingProfile
}: CareProviderRegistrationModalProps) {
  const [providerType, setProviderType] = useState<CareProviderType>(
    existingProfile?.providerType || 'Home Care Center'
  );
  
  const [title, setTitle] = useState<string>(
    existingProfile?.title || `${currentUserProfile?.parentName || 'Warm'}'s Home Care & Sitter Space`
  );
  const [hostName, setHostName] = useState<string>(
    existingProfile?.hostName || currentUserProfile?.parentName || 'Care Host'
  );

  // Service Offerings: Host at Home vs Visit Parent's Home
  const [canHostAtHome, setCanHostAtHome] = useState<boolean>(
    existingProfile?.careServiceModes ? existingProfile.careServiceModes.includes('host_at_my_home') : true
  );
  const [canVisitParentHome, setCanVisitParentHome] = useState<boolean>(
    existingProfile?.careServiceModes ? existingProfile.careServiceModes.includes('visit_parents_home') : true
  );

  // Rates for Hosting at My Home (Home Care Center)
  const [hourlyRateNeighborHome, setHourlyRateNeighborHome] = useState<number>(
    existingProfile?.hourlyRateNeighborHome !== undefined 
      ? existingProfile.hourlyRateNeighborHome 
      : (existingProfile?.hourlyRate !== undefined ? existingProfile.hourlyRate : 150)
  );
  const [halfDayRate, setHalfDayRate] = useState<number>(
    existingProfile?.halfDayRate !== undefined ? existingProfile.halfDayRate : 500
  );
  const [fullDayRate, setFullDayRate] = useState<number>(
    existingProfile?.fullDayRate !== undefined ? existingProfile.fullDayRate : 900
  );

  // Rates for Visiting Parent's Home (In-Home Sitter)
  const [hourlyRateParentHome, setHourlyRateParentHome] = useState<number>(
    existingProfile?.hourlyRateParentHome !== undefined 
      ? existingProfile.hourlyRateParentHome 
      : 200
  );
  const [visitingRadiusKm, setVisitingRadiusKm] = useState<number>(
    existingProfile?.visitingRadiusKm || 5
  );
  
  const [experienceYears, setExperienceYears] = useState<number>(
    existingProfile?.experienceYears || 3
  );
  const [maxCapacity, setMaxCapacity] = useState<number>(
    existingProfile?.maxCapacity || 3
  );
  const [bio, setBio] = useState<string>(
    existingProfile?.bio || 'Passionate about nurturing care and early engagement. Welcoming home space with toys and books, or happy to visit parents’ home to look after babies and kids with utmost love and safety.'
  );
  const [address, setAddress] = useState<string>(
    existingProfile?.location.address || (currentUserProfile as any)?.currentAddress || currentUserProfile?.location.address || 'Bandra West, Mumbai, India'
  );
  const [phone, setPhone] = useState<string>(
    existingProfile?.phone || currentUserProfile?.phoneNumber || '9820112233'
  );

  // Aadhaar Verification States for Host
  const [aadhaarNumber, setAadhaarNumber] = useState<string>(
    existingProfile?.aadhaarNumber || currentUserProfile?.aadhaarNumber || ''
  );
  const [aadhaarDocName, setAadhaarDocName] = useState<string>(
    existingProfile?.aadhaarDocName || currentUserProfile?.aadhaarDocName || ''
  );
  const [aadhaarDocUrl, setAadhaarDocUrl] = useState<string>(
    existingProfile?.aadhaarDocUrl || currentUserProfile?.aadhaarDocUrl || ''
  );
  const [aadhaarDocSize, setAadhaarDocSize] = useState<number | undefined>(
    existingProfile?.aadhaarDocSize || currentUserProfile?.aadhaarDocSize
  );

  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>(
    existingProfile?.acceptedAgeGroups || ['Infants (6m - 18m)', 'Toddlers (18m - 3y)', '3 - 6 yrs']
  );
  const [selectedDays, setSelectedDays] = useState<string[]>(
    existingProfile?.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  );
  const [availableSlots, setAvailableSlots] = useState<string[]>(
    existingProfile?.availableTimeSlots || [
      '09:00 AM - 01:00 PM',
      '02:00 PM - 06:30 PM',
      'Full Day (9 AM - 7 PM)'
    ]
  );
  const [newSlotInput, setNewSlotInput] = useState<string>('');

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    existingProfile?.amenities || [
      'Childproofed Safe Play Area',
      'Sanitized Nap Cots & Bedding',
      'First Aid Trained',
      'Storybook & Montessori Toys Library',
      'CCTV / Live Video Updates'
    ]
  );

  const ALL_AGE_GROUPS = [
    'Infants (6m - 18m)',
    'Toddlers (18m - 3y)',
    'Pre-K (3y - 6y)',
    'School Age (6y - 10y)'
  ];
  const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const ALL_AMENITIES = [
    'Childproofed Safe Play Area',
    'Sanitized Nap Cots & Bedding',
    'First Aid & CPR Trained',
    'Storybook & Montessori Toys Library',
    'CCTV / Live Video Updates',
    'Healthy Snacks & Fruit Bowls',
    'AC & Soft Foam Mat Flooring',
    'Pet Free & Smoke Free Space',
    'Potty Training Assistance',
    'Outdoor Garden Walk'
  ];

  const handleToggleAgeGroup = (group: string) => {
    setSelectedAgeGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const handleToggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => g !== day) : [...prev, day]
    );
  };

  const handleToggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleAddSlot = () => {
    if (newSlotInput.trim() && !availableSlots.includes(newSlotInput.trim())) {
      setAvailableSlots(prev => [...prev, newSlotInput.trim()]);
      setNewSlotInput('');
    }
  };

  const handleRemoveSlot = (slotToRemove: string) => {
    setAvailableSlots(prev => prev.filter(s => s !== slotToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !hostName.trim()) {
      alert('Please enter your space title and host name.');
      return;
    }
    if (!canHostAtHome && !canVisitParentHome) {
      alert('Please select at least one care offering: Host at My Home, or Visit Parents House.');
      return;
    }
    if (!aadhaarDocName && !aadhaarDocUrl && !aadhaarNumber) {
      alert('Aadhaar verification is mandatory for all care providers. Please upload your Aadhaar document for manual admin verification.');
      return;
    }

    const careServiceModes: ('host_at_my_home' | 'visit_parents_home')[] = [];
    if (canHostAtHome) careServiceModes.push('host_at_my_home');
    if (canVisitParentHome) careServiceModes.push('visit_parents_home');

    // Primary display hourly rate
    const primaryRate = canHostAtHome ? Number(hourlyRateNeighborHome) : Number(hourlyRateParentHome);

    const newProfile: DaycarePlayhomeProfile = {
      id: existingProfile?.id || `playhome-custom-${Date.now()}`,
      userId: currentUserProfile?.id || 'user-custom',
      title: title.trim(),
      hostName: hostName.trim(),
      providerType,
      providerEntityType: 'Individual',
      careServiceModes,
      hourlyRate: primaryRate || 0,
      hourlyRateNeighborHome: canHostAtHome ? Number(hourlyRateNeighborHome) : undefined,
      hourlyRateParentHome: canVisitParentHome ? Number(hourlyRateParentHome) : undefined,
      visitingRadiusKm: canVisitParentHome ? Number(visitingRadiusKm) : undefined,
      halfDayRate: canHostAtHome ? (Number(halfDayRate) || 0) : undefined,
      fullDayRate: canHostAtHome ? (Number(fullDayRate) || 0) : undefined,
      bio: bio.trim(),
      location: {
        lat: currentUserProfile?.location.lat || 19.0760,
        lng: currentUserProfile?.location.lng || 72.8777,
        address: address.trim(),
        distance: 0.1 // Home / closest
      },
      rating: existingProfile?.rating || 5.0,
      reviewsCount: existingProfile?.reviewsCount || 1,
      experienceYears: Number(experienceYears) || 3,
      maxCapacity: canHostAtHome ? (Number(maxCapacity) || 3) : 1,
      currentOccupancy: 0,
      acceptedAgeGroups: selectedAgeGroups.length > 0 ? selectedAgeGroups : ['1 - 3 yrs', '3 - 6 yrs'],
      availableDays: selectedDays.length > 0 ? selectedDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      availableTimeSlots: availableSlots.length > 0 ? availableSlots : ['09:00 AM - 01:00 PM', '02:00 PM - 06:30 PM'],
      amenities: selectedAmenities,
      photos: existingProfile?.photos || [
        'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=800'
      ],
      avatarUrl: currentUserProfile?.photoUrl || currentUserProfile?.parentPhotoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&crop=faces',
      phone: phone || currentUserProfile?.phoneNumber,
      email: currentUserProfile?.email,
      aadhaarVerified: currentUserProfile?.role === 'Admin',
      aadhaarDocName: aadhaarDocName || currentUserProfile?.aadhaarDocName,
      aadhaarDocUrl: aadhaarDocUrl || currentUserProfile?.aadhaarDocUrl,
      aadhaarDocSize: aadhaarDocSize || currentUserProfile?.aadhaarDocSize,
      aadhaarNumber: aadhaarNumber || currentUserProfile?.aadhaarNumber,
      policeVerified: true,
      isAcceptingNow: true,
      instantBooking: true,
      parentKidNames: currentUserProfile?.childName ? `Parent of ${currentUserProfile.childName} (${currentUserProfile.childAge}y)` : undefined,
      emergencyContact: phone,
      reviews: existingProfile?.reviews || [
        {
          id: 'rev-init',
          parentName: 'Vernunt Community Safety',
          rating: 5,
          comment: 'Identity and residential verified. Available for verified bookings.',
          date: 'Just now'
        }
      ]
    };

    onSaveProfile(newProfile);
    confetti({ particleCount: 130, spread: 80 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 p-5 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
              💼 Care Jobs &amp; Earning Creator
            </span>
            <span className="text-[10px] font-extrabold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-2xs">
              💰 Host at Home or Visit Parents
            </span>
          </div>

          <h3 className="font-serif font-black text-xl text-white leading-tight">
            {existingProfile ? 'Edit Your Care Provider Profile' : 'Offer Home Care or In-Home Babysitting'}
          </h3>
          <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
            Create independent income! If you have space at home, host as a home care center. If you want to visit parents’ homes to look after babies, set your visiting rate—or do both!
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-5">
          
          {/* Provider Category Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Provider Category / Profile Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'Home Care Center' as CareProviderType, icon: '🏡', label: 'Home Care Center' },
                { type: 'Babysitter & Nanny' as CareProviderType, icon: '🚶‍♀️', label: 'Babysitter & Nanny' },
                { type: 'Neighbour Parent' as CareProviderType, icon: '👪', label: 'Neighbour Parent' },
                { type: 'Certified Playhome' as CareProviderType, icon: '🏫', label: 'Certified Playhome' },
              ].map(({ type, icon, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setProviderType(type)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between h-20 ${
                    providerType === type
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs ring-1 ring-emerald-500'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs'
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  <span className="text-[11px] leading-tight mt-1">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SERVICE MODES & RATE CONFIGURATION (THE CORE USER REQUIREMENT) */}
          <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/70 to-amber-50/90 border-2 border-emerald-300 rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
              <div>
                <h4 className="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-1.5 uppercase tracking-wide">
                  <Briefcase className="w-4 h-4 text-emerald-700" />
                  <span>Choose Where You Will Provide Care &amp; Set Rates</span>
                </h4>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Select one or both options below. Parents will see your transparent rates for each service.
                </p>
              </div>
              <span className="text-[10px] font-black bg-emerald-700 text-white px-2.5 py-1 rounded-full uppercase shrink-0 shadow-2xs">
                100% Retained
              </span>
            </div>

            {/* OPTION 1: HOST AT MY HOME (HOME CARE CENTER) */}
            <div className={`p-4 rounded-2xl border-2 transition ${canHostAtHome ? 'bg-white border-emerald-500 shadow-xs' : 'bg-emerald-50/40 border-slate-200 opacity-80'}`}>
              <div className="flex items-start justify-between gap-3">
                <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={canHostAtHome}
                    onChange={(e) => setCanHostAtHome(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-emerald-600 rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span>🏡 Host Children at My Home / Place (Home Care Center)</span>
                    </span>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Parents drop off their babies/children at your home. You provide space, toys, nap cots, and supervision.
                    </p>
                  </div>
                </label>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                  Drop-Off Care
                </span>
              </div>

              {canHostAtHome && (
                <div className="mt-3.5 pt-3 border-t border-emerald-100 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-800 mb-1">
                      Rate to Host at Home (₹ / hr) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-black text-slate-500">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={10}
                        value={hourlyRateNeighborHome}
                        onChange={(e) => setHourlyRateNeighborHome(Number(e.target.value))}
                        placeholder="150"
                        className="w-full pl-7 pr-3 py-1.5 bg-white border-2 border-emerald-400 rounded-xl text-xs font-black text-slate-900 focus:outline-emerald-600"
                        required={canHostAtHome}
                      />
                    </div>
                    <span className="text-[9.5px] text-emerald-700 font-medium mt-0.5 block">
                      {hourlyRateNeighborHome === 0 ? '🎁 Free mutual help' : `Parents see: ₹${hourlyRateNeighborHome}/hr at your home`}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Half-Day Pass (4 hrs)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-black text-slate-500">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={50}
                        value={halfDayRate}
                        onChange={(e) => setHalfDayRate(Number(e.target.value))}
                        placeholder="500"
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Full-Day Pass (8 hrs)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-black text-slate-500">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={50}
                        value={fullDayRate}
                        onChange={(e) => setFullDayRate(Number(e.target.value))}
                        placeholder="900"
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* OPTION 2: GO TO PARENTS' HOUSE (IN-HOME CARE / BABYSITTER) */}
            <div className={`p-4 rounded-2xl border-2 transition ${canVisitParentHome ? 'bg-white border-indigo-500 shadow-xs' : 'bg-indigo-50/40 border-slate-200 opacity-80'}`}>
              <div className="flex items-start justify-between gap-3">
                <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={canVisitParentHome}
                    onChange={(e) => setCanVisitParentHome(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-indigo-600 rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span>🚶‍♀️ Go to Parents’ House to Look After Babies (In-Home Sitter)</span>
                    </span>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Travel to the parent’s residence for on-demand babysitting, infant feeding, and attentive in-home supervision.
                    </p>
                  </div>
                </label>
                <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-md shrink-0">
                  Visiting Care
                </span>
              </div>

              {canVisitParentHome && (
                <div className="mt-3.5 pt-3 border-t border-indigo-100 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-800 mb-1">
                      Visiting Hourly Rate (₹ / hr to visit parent's house) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-black text-slate-500">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={10}
                        value={hourlyRateParentHome}
                        onChange={(e) => setHourlyRateParentHome(Number(e.target.value))}
                        placeholder="200"
                        className="w-full pl-7 pr-3 py-1.5 bg-white border-2 border-indigo-400 rounded-xl text-xs font-black text-slate-900 focus:outline-indigo-600 shadow-inner"
                        required={canVisitParentHome}
                      />
                    </div>
                    <span className="text-[9.5px] text-indigo-700 font-medium mt-0.5 block">
                      Parents see: ₹{hourlyRateParentHome}/hr to visit their home
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Max Travel Distance (Radius)
                    </label>
                    <select
                      value={visitingRadiusKm}
                      onChange={(e) => setVisitingRadiusKm(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-indigo-600"
                    >
                      <option value={2}>Within 2 km (Walking / Immediate neighbourhood)</option>
                      <option value={5}>Within 5 km (Standard city radius)</option>
                      <option value={10}>Within 10 km (Extended locality)</option>
                      <option value={15}>Within 15 km (Wide coverage)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Title & Host Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Facility / Space Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Kavita Aunty's Cozy Home Care & Sitting"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Host / Caregiver Name
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Your Name"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-emerald-600"
                required
              />
            </div>
          </div>

          {/* Experience, Capacity & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Experience (Years)
              </label>
              <input
                type="number"
                min={0}
                max={40}
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Max Children Capacity (At Home)
              </label>
              <input
                type="number"
                min={1}
                max={25}
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                disabled={!canHostAtHome}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-emerald-600 disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-emerald-600"
                required
              />
            </div>
          </div>

          {/* Bio & Address */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                About Your Care, Space &amp; Background
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your home environment, activities for kids, toys available, hygiene routines, and willingness to travel to parents' homes..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Base Address / Locality (For distance calculation)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Bandra West, Mumbai"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-emerald-600"
                required
              />
            </div>

            {/* Host Identity & Aadhaar / DigiLocker Verification */}
            <div className="pt-2">
              <AadhaarUploadField
                label="Host Identity & Aadhaar Verification (Mandatory)"
                labelPrefix="Host"
                required={true}
                maxSizeMb={3}
                aadhaarNumber={aadhaarNumber}
                onNumberChange={setAadhaarNumber}
                aadhaarDocName={aadhaarDocName}
                aadhaarDocUrl={aadhaarDocUrl}
                aadhaarDocSize={aadhaarDocSize}
                userName={hostName}
                userPhone={phone}
                userAddress={address}
                onDocUploaded={(docData) => {
                  setAadhaarDocName(docData.docName);
                  setAadhaarDocUrl(docData.docUrl || docData.docPreview);
                  setAadhaarDocSize(docData.docSize);
                }}
                onDocRemoved={() => {
                  setAadhaarDocName('');
                  setAadhaarDocUrl('');
                  setAadhaarDocSize(undefined);
                }}
              />
            </div>
          </div>

          {/* Accepted Age Groups */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Accepted Child Age Groups
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_AGE_GROUPS.map((group) => {
                const active = selectedAgeGroups.includes(group);
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => handleToggleAgeGroup(group)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      active
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                    <span>{group}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Available Days */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Available Days of the Week
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map((day) => {
                const active = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(day)}
                    className={`w-10 h-10 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center ${
                      active
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Available Time Slots */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Available Time Windows (For Auto-Match)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {availableSlots.map((slot) => (
                <span
                  key={slot}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold rounded-full"
                >
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>{slot}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(slot)}
                    className="hover:text-rose-600 ml-1 text-slate-400 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSlotInput}
                onChange={(e) => setNewSlotInput(e.target.value)}
                placeholder="e.g. 10:00 AM - 02:00 PM or Evenings 6 PM - 9 PM"
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-emerald-600"
              />
              <button
                type="button"
                onClick={handleAddSlot}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Slot
              </button>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Facilities &amp; Safety Amenities
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_AMENITIES.map((amenity) => {
                const active = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => handleToggleAmenity(amenity)}
                    className={`p-2 rounded-xl text-left text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                      active
                        ? 'bg-emerald-50 text-emerald-950 border border-emerald-400'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                      active ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                    }`}>
                      {active && <Check className="w-3 h-3" />}
                    </div>
                    <span className="truncate">{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-black text-sm rounded-xl shadow-md transition transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>{existingProfile ? 'Update Availability & Rates' : 'Publish Home Care / Sitter Listing (Instant Live)'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
