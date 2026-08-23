import React, { useState } from 'react';
import { DaycarePlayhomeProfile, ChildProfile, CareProviderType } from '../types.ts';
import { 
  X, ShieldCheck, MapPin, DollarSign, Clock, Baby, 
  Home, Check, Sparkles, Plus, Trash2, Camera, Info, Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';

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
    existingProfile?.providerType || (currentUserProfile?.userRole === 'Event Organizer' ? 'Certified Playhome' : 'Neighbour Parent')
  );
  
  const [title, setTitle] = useState<string>(
    existingProfile?.title || `${currentUserProfile?.parentName || 'Cozy Home'}'s Playhome & Sitting Space`
  );
  const [hostName, setHostName] = useState<string>(
    existingProfile?.hostName || currentUserProfile?.parentName || 'Neighbour Parent'
  );
  const [hourlyRate, setHourlyRate] = useState<number>(
    existingProfile?.hourlyRate !== undefined ? existingProfile.hourlyRate : 150
  );
  const [halfDayRate, setHalfDayRate] = useState<number>(
    existingProfile?.halfDayRate !== undefined ? existingProfile.halfDayRate : 500
  );
  const [fullDayRate, setFullDayRate] = useState<number>(
    existingProfile?.fullDayRate !== undefined ? existingProfile.fullDayRate : 900
  );
  
  const [experienceYears, setExperienceYears] = useState<number>(
    existingProfile?.experienceYears || 5
  );
  const [maxCapacity, setMaxCapacity] = useState<number>(
    existingProfile?.maxCapacity || 3
  );
  const [bio, setBio] = useState<string>(
    existingProfile?.bio || 'Welcoming environment with plenty of games, books, and attentive supervision. Delighted to look after your child while you attend to errands or work!'
  );
  const [address, setAddress] = useState<string>(
    existingProfile?.location.address || currentUserProfile?.location.address || 'Bandra West, Mumbai, India'
  );
  const [phone, setPhone] = useState<string>(
    existingProfile?.phone || currentUserProfile?.phoneNumber || '9820112233'
  );

  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>(
    existingProfile?.acceptedAgeGroups || ['1 - 3 yrs', '3 - 6 yrs', '6 - 10 yrs']
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
      'CCTV Live Stream Link',
      'Childproofed Enclosed Playroom',
      'Sanitized Nap Cots & Bedding',
      'Organic Fresh Purees & Fruit Bowls',
      'First Aid Kit',
      'Lego & Storybook Library'
    ]
  );

  const ALL_AGE_GROUPS = ['6m - 2 yrs', '1 - 3 yrs', '2 - 5 yrs', '3 - 6 yrs', '6 - 10 yrs', '10+ yrs'];
  const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const ALL_AMENITIES = [
    'CCTV Live Stream Link',
    'Childproofed Enclosed Playroom',
    'AC & Soft Foam Flooring',
    'Sanitized Nap Cots & Bedding',
    'Organic Fresh Purees & Fruit Bowls',
    'First Aid & CPR Trained',
    'Lego & Storybook Library',
    'Enclosed Private Garden Lawn',
    'Pediatric Nurse Assistance',
    'Pet Free & Smoke Free',
    'UV Toy Sanitizer Machine'
  ];

  const handleToggleAgeGroup = (group: string) => {
    setSelectedAgeGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const handleToggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
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

    const newProfile: DaycarePlayhomeProfile = {
      id: existingProfile?.id || `playhome-custom-${Date.now()}`,
      userId: currentUserProfile?.id || 'user-custom',
      title: title.trim(),
      hostName: hostName.trim(),
      providerType,
      hourlyRate: Number(hourlyRate) || 0,
      halfDayRate: Number(halfDayRate) || 0,
      fullDayRate: Number(fullDayRate) || 0,
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
      maxCapacity: Number(maxCapacity) || 3,
      currentOccupancy: 0,
      acceptedAgeGroups: selectedAgeGroups.length > 0 ? selectedAgeGroups : ['2 - 6 yrs'],
      availableDays: selectedDays.length > 0 ? selectedDays : ['Mon', 'Wed', 'Fri'],
      availableTimeSlots: availableSlots.length > 0 ? availableSlots : ['10:00 AM - 02:00 PM'],
      amenities: selectedAmenities,
      photos: existingProfile?.photos || [
        'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=800'
      ],
      avatarUrl: currentUserProfile?.photoUrl || currentUserProfile?.parentPhotoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&crop=faces',
      phone: phone || currentUserProfile?.phoneNumber,
      email: currentUserProfile?.email,
      aadhaarVerified: currentUserProfile?.aadhaarVerified ?? true,
      policeVerified: true,
      isAcceptingNow: true,
      instantBooking: true,
      parentKidNames: currentUserProfile?.childName ? `Parent of ${currentUserProfile.childName} (${currentUserProfile.childAge}y)` : undefined,
      emergencyContact: phone,
      reviews: existingProfile?.reviews || [
        {
          id: 'rev-init',
          parentName: 'Vernunt Verification Team',
          rating: 5,
          comment: 'Identity verified with active parent background.',
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

          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
              🏡 Sitter & Playhome Provider Setup
            </span>
            <span className="text-[10px] font-extrabold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full shadow-2xs">
              💰 Set Custom Hourly Price
            </span>
          </div>

          <h3 className="font-serif font-black text-xl text-white leading-tight">
            {existingProfile ? 'Edit Your Sitter / Playhome Profile' : 'Offer Childcare & Babysitting to Neighbours'}
          </h3>
          <p className="text-xs text-emerald-100 mt-1">
            Post your available hours, set your own hourly fees (or ₹0 for free mutual sharing), and earn by helping local families.
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-5">
          
          {/* Provider Type Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Provider Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Neighbour Parent', 'Certified Playhome', 'Home Daycare', 'Experienced Sitter'] as CareProviderType[]).map((type) => (
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
                  <span className="text-base">
                    {type === 'Neighbour Parent' ? '👪' : type === 'Certified Playhome' ? '🏫' : type === 'Home Daycare' ? '🧸' : '✨'}
                  </span>
                  <span className="text-[11px] leading-tight mt-1">{type}</span>
                </button>
              ))}
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
                placeholder="e.g. Kavita Aunty's Cozy Home Sitting"
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

          {/* HOURLY RATE SETTER (CRITICAL USER REQUEST) */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <span>Set How Much You Want to Charge (Hourly Rate)</span>
              </label>
              <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                100% Retained by You
              </span>
            </div>

            <p className="text-[11px] text-emerald-900">
              Charge whatever amount you want per hour for looking after children. Enter <strong>0</strong> if you want to provide free reciprocal community playgroup care.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-800 mb-1">
                  Hourly Rate (₹ / hr) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-black text-slate-500">₹</span>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    placeholder="150"
                    className="w-full pl-7 pr-3 py-2 bg-white border-2 border-emerald-400 rounded-xl text-sm font-black text-slate-900 focus:outline-emerald-600 shadow-inner"
                    required
                  />
                </div>
                <span className="text-[9px] text-slate-500 mt-0.5 block">
                  {hourlyRate === 0 ? '🎁 Free mutual help' : `Parents see: ₹${hourlyRate}/hr`}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Half-Day Pass (4 hrs)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-black text-slate-500">₹</span>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={halfDayRate}
                    onChange={(e) => setHalfDayRate(Number(e.target.value))}
                    placeholder="500"
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Full-Day Pass (8 hrs)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-black text-slate-500">₹</span>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={fullDayRate}
                    onChange={(e) => setFullDayRate(Number(e.target.value))}
                    placeholder="900"
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-emerald-600"
                  />
                </div>
              </div>
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
                Max Children Capacity
              </label>
              <input
                type="number"
                min={1}
                max={25}
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-emerald-600"
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
                About Your Care & Space
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your home, activities for kids, toys available, hygiene, and snacks provided..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Neighbourhood / Address (For distance calculation)
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
              Facilities & Safety Amenities
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
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-xl shadow-md transition transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>{existingProfile ? 'Update Availability & Rate' : 'Publish Sitter / Playhome Listing (Instant Live)'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
