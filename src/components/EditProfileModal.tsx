import React, { useState, useEffect } from 'react';
import { ChildProfile, VerificationStatus, LocationSharing } from '../types.ts';
import { ShieldCheck, User, Camera, Save, X, Lock, Users } from 'lucide-react';
import confettiDefault from 'canvas-confetti';
import AestheticImageUploader from './AestheticImageUploader.tsx';
import { db, handleFirestoreError, OperationType } from '../utils/firebase.ts';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  PARENTS_INCOME_OPTIONS, 
  INDIAN_RELIGIONS, 
  INDIAN_CASTES, 
  CHILD_AVAILABILITY_OPTIONS, 
  CHILD_PRIVACY_OPTIONS 
} from '../data/indianDemographics.ts';

interface EditProfileModalProps {
  currentProfile: ChildProfile;
  onSave: (updatedProfile: ChildProfile) => void;
  onClose: () => void;
}

export default function EditProfileModal({ currentProfile, onSave, onClose }: EditProfileModalProps) {
  const [parentName, setParentName] = useState(currentProfile.parentName || '');
  const [parentGender, setParentGender] = useState<'Mother' | 'Father' | 'Other'>(currentProfile.parentGender || 'Mother');
  const [childName, setChildName] = useState(currentProfile.childName || '');
  const [childAge, setChildAge] = useState(currentProfile.childAge || 5);
  const [gradeLevel, setGradeLevel] = useState(currentProfile.gradeLevel || 'Kindergarten');
  const [playStyle, setPlayStyle] = useState(currentProfile.playStyle || 'Active');
  const [bio, setBio] = useState(currentProfile.bio || '');
  const [phonePrivacyOption, setPhonePrivacyOption] = useState(currentProfile.phonePrivacyOption || 'show_after_acceptance');
  const [interestsStr, setInterestsStr] = useState((currentProfile.interests || []).join(', '));
  const [preferredActivities, setPreferredActivities] = useState<string[]>(currentProfile.preferredActivities || []);
  const [parentPhotoUrl, setParentPhotoUrl] = useState(currentProfile.parentPhotoUrl || currentProfile.photoUrl || '');
  const [childPhotoUrl, setChildPhotoUrl] = useState(currentProfile.childPhotoUrl || '');
  const [parentProfession, setParentProfession] = useState(currentProfile.parentProfession || '');
  const [motherTongue, setMotherTongue] = useState(currentProfile.motherTongue || '');
  const [languagesStr, setLanguagesStr] = useState((currentProfile.languagesKnown || ['English']).join(', '));
  const [availableDays, setAvailableDays] = useState<string[]>(currentProfile.availableDays || ['Saturday', 'Sunday']);
  const [availableTimes, setAvailableTimes] = useState<string[]>(currentProfile.availableTimes || ['Afternoon']);
  const [generalAvailability, setGeneralAvailability] = useState<string[]>(
    currentProfile.generalAvailability || ['Weekdays After School', 'Weekends (Sat & Sun)']
  );
  const [childPrivacySetting, setChildPrivacySetting] = useState<'full' | 'first_name_only' | 'connections_only'>(
    currentProfile.childPrivacySetting || 'full'
  );
  const [parentsIncome, setParentsIncome] = useState(currentProfile.parentsIncome || '');
  const [religion, setReligion] = useState(currentProfile.religion || '');
  const [caste, setCaste] = useState(currentProfile.caste || '');
  const [isLockedSelf, setIsLockedSelf] = useState(!!currentProfile.isLocked);

  const [errorMsg, setErrorMsg] = useState('');

  const [customFieldsSchema, setCustomFieldsSchema] = useState<any[]>([]);
  const [customFieldsData, setCustomFieldsData] = useState<{ [key: string]: string }>(currentProfile.customFields || {});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'custom_profile_fields'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      setCustomFieldsSchema(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'custom_profile_fields');
    });
    return () => unsub();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName.trim() || !childName.trim()) {
      setErrorMsg("Parent Name and Child Name are mandatory fields.");
      return;
    }

    if (!parentPhotoUrl.trim()) {
      setErrorMsg("Parent/Guardian portrait photo is mandatory for verified identity and child safety.");
      return;
    }

    const updated: ChildProfile = {
      ...currentProfile,
      parentName: parentName.trim(),
      childName: childName.trim(),
      childAge: Number(childAge),
      gradeLevel: gradeLevel,
      playStyle: playStyle,
      bio: bio.trim(),
      interests: interestsStr.split(',').map(i => i.trim()).filter(Boolean),
      preferredActivities: preferredActivities,
      parentPhotoUrl: parentPhotoUrl.trim(),
      childPhotoUrl: childPhotoUrl.trim() || undefined,
      photoUrl: parentPhotoUrl.trim() || childPhotoUrl.trim() || (currentProfile.childGender === 'Boy'
        ? 'https://images.unsplash.com/photo-1602030028438-4cf153cba9e7?auto=format&fit=crop&q=80&w=400'
        : 'https://images.unsplash.com/photo-1519689680058-324335c77ebd?auto=format&fit=crop&q=80&w=400'),
      parentProfession: parentProfession.trim(),
      parentGender: parentGender,
      motherTongue: motherTongue.trim(),
      languagesKnown: languagesStr.split(',').map(l => l.trim()).filter(Boolean),
      availableDays: availableDays,
      availableTimes: availableTimes,
      generalAvailability: generalAvailability,
      childPrivacySetting: childPrivacySetting,
      parentsIncome: parentsIncome,
      religion: religion,
      caste: caste,
      phonePrivacyOption: phonePrivacyOption,
      customFields: customFieldsData,
      isLocked: isLockedSelf
    };

    onSave(updated);

    confettiDefault({
      particleCount: 40,
      spread: 30,
      colors: ['#3b82f6', '#f59e0b']
    });

    onClose();
  };

  return (
    <div id="edit-profile-modal-backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all flex flex-col max-h-[85vh] my-auto">
        
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-orange-500" />
            <div>
              <h4 className="text-base font-serif font-black tracking-tight text-white">Edit Parent & Child Profile</h4>
              <p className="text-[10px] text-slate-400">Keep your playground presence and contact information secure.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-left">
          {currentProfile.isLocked && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2 text-amber-900 text-xs">
              <span className="text-base shrink-0">🔒</span>
              <div className="space-y-0.5">
                <span className="font-extrabold uppercase tracking-wide text-[10px] text-amber-800">Administrative Safeguard Active</span>
                <p className="text-[11px] leading-relaxed text-amber-700 font-medium">To protect identity credentials, this profile has been locked after registration verifications. Fields cannot be changed. Please reach out to core platform support to request modifications.</p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Secure Aadhaar Indicator */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-150 rounded-2xl flex items-center justify-between text-xs font-semibold text-emerald-900 leading-normal animate-fade-in">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Aadhaar Identity Verification Active</span>
            </div>
            <span className="font-mono text-[10.5px] font-black text-emerald-700 select-all tracking-wider">
              {currentProfile.aadhaarNumber ? `XXXX-XXXX-${currentProfile.aadhaarNumber.slice(-4)}` : 'ACTIVE (UIDAI)'}
            </span>
          </div>

          {/* Dual Photo Upload: Parent (Mandatory) & Child (Optional) */}
          <div className="space-y-4">
            {/* Parent Portrait Photo - MANDATORY */}
            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-amber-900 flex items-center gap-1.5 tracking-wide">
                  <User className="w-3.5 h-3.5 text-amber-700" />
                  Parent / Guardian Portrait Photo *
                </span>
                <span className="bg-amber-200/70 text-amber-900 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                  Mandatory Verified Adult
                </span>
              </div>
              <AestheticImageUploader
                id="edit-profile-parent-photo"
                label=""
                value={parentPhotoUrl}
                onChange={setParentPhotoUrl}
                presetSuggestions={[
                  { name: 'Mother Portrait', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&crop=faces' },
                  { name: 'Father Portrait', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&crop=faces' },
                  { name: 'Guardian Headshot', url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=400&crop=faces' }
                ]}
              />
              <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                * Parent photo is required to guarantee verified adult presence and child safety.
              </p>
            </div>

            {/* Child Profile Photo - OPTIONAL */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-slate-800 flex items-center gap-1.5 tracking-wide">
                  <Camera className="w-3.5 h-3.5 text-rose-600" />
                  Child's Profile Photo
                </span>
                <span className="bg-slate-200 text-slate-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                  Optional (Child Privacy)
                </span>
              </div>
              <AestheticImageUploader
                id="edit-profile-child-photo"
                label=""
                value={childPhotoUrl}
                onChange={setChildPhotoUrl}
                presetSuggestions={[
                  { name: 'Warm Boy Avatar', url: 'https://images.unsplash.com/photo-1602030028438-4cf153cba9e7?auto=format&fit=crop&q=80&w=400' },
                  { name: 'Cheerful Girl Avatar', url: 'https://images.unsplash.com/photo-1519689680058-324335c77ebd?auto=format&fit=crop&q=80&w=400' },
                  { name: 'Creative Playmate', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400' }
                ]}
              />
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Optional under COPPA & DPDP Child Privacy guidelines. If left blank, your child's visual identity remains protected and unshared.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Parent / Guardian Name *</label>
              <input
                type="text"
                required
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs text-slate-700 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Child's Name *</label>
              <input
                type="text"
                required
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs text-slate-700 font-bold"
              />
            </div>
          </div>

          {/* Parent Gender / Relationship with Community Matching Hint */}
          <div className="bg-gradient-to-r from-rose-50/80 via-amber-50/50 to-sky-50/70 p-3 rounded-2xl border border-rose-200/90 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-rose-600" />
                <span>Parent Identity / Gender</span>
              </label>
              <span className="text-[9.5px] font-bold text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded-full">
                For Group Connections
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setParentGender('Mother')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition cursor-pointer ${
                  parentGender === 'Mother'
                    ? 'bg-rose-500 text-white border-rose-600 shadow-xs ring-2 ring-rose-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50/50'
                }`}
              >
                <span>👩 Mother</span>
              </button>
              <button
                type="button"
                onClick={() => setParentGender('Father')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition cursor-pointer ${
                  parentGender === 'Father'
                    ? 'bg-sky-600 text-white border-sky-700 shadow-xs ring-2 ring-sky-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-sky-50/50'
                }`}
              >
                <span>👨 Father</span>
              </button>
              <button
                type="button"
                onClick={() => setParentGender('Other')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition cursor-pointer ${
                  parentGender === 'Other'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50/50'
                }`}
              >
                <span>🧑 Guardian</span>
              </button>
            </div>
            <div className="flex items-start gap-1.5 bg-white/90 p-2 rounded-xl text-[10.5px] text-slate-600 leading-tight">
              <span className="shrink-0 text-sm">💡</span>
              <p>
                <strong>Community hint:</strong> Helps identify you for neighborhood <span className="font-semibold text-rose-700">Moms Circles</span> or weekend <span className="font-semibold text-sky-700">Dads Playgroups</span>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Child's Age</label>
              <input
                type="number"
                min={1}
                value={childAge}
                onChange={(e) => setChildAge(Number(e.target.value))}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs text-slate-750 font-extrabold"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Grade Level</label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
              >
                <option value="Toddler">Toddler</option>
                <option value="Preschool">Preschool</option>
                <option value="Kindergarten">Kindergarten</option>
                <option value="1st Grade">1st Grade</option>
                <option value="2nd Grade">2nd Grade</option>
                <option value="3rd Grade">3rd Grade</option>
                <option value="4th Grade">4th Grade</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Play Style Preference</label>
              <select
                value={playStyle}
                onChange={(e) => setPlayStyle(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
              >
                <option value="Active">Active Sporty</option>
                <option value="Creative">Creative Crafty</option>
                <option value="Quiet">Quiet Reading</option>
                <option value="Outdoorsy">Outdoorsy Explore</option>
                <option value="Boardgames">Boardgames / Brainy</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Guardian's Profession (Optional)</label>
              <input
                type="text"
                placeholder="Tech Architect, Doctor, etc."
                value={parentProfession}
                onChange={(e) => setParentProfession(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Mother Tongue Language</label>
              <input
                type="text"
                placeholder="e.g., Hindi, Gujarati, English"
                value={motherTongue}
                onChange={(e) => setMotherTongue(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Languages Known (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. English, Hindi, Sanskrit"
              value={languagesStr}
              onChange={(e) => setLanguagesStr(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700"
            />
          </div>

          {/* Child Information Visibility Setting */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
              <span>🛡️ Child Profile Privacy Setting:</span>
              <span className="text-[9px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">Active</span>
            </label>
            <div className="space-y-2">
              {CHILD_PRIVACY_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => setChildPrivacySetting(opt.id as any)}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border transition cursor-pointer ${
                    childPrivacySetting === opt.id
                      ? 'bg-orange-50 border-orange-300 text-slate-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="editChildPrivacySetting"
                    checked={childPrivacySetting === opt.id}
                    onChange={() => setChildPrivacySetting(opt.id as any)}
                    className="mt-0.5 text-orange-500 focus:ring-orange-400"
                  />
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-800 block">{opt.label}</span>
                    <span className="text-[10px] text-slate-500 leading-tight block">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Child General Availability */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
              🕒 Playdate General Availability:
            </label>
            <p className="text-[10.5px] text-slate-500">Select when your child is usually free to play:</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {CHILD_AVAILABILITY_OPTIONS.map((avail) => {
                const isSelected = generalAvailability.includes(avail);
                return (
                  <button
                    key={avail}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        if (generalAvailability.length > 1) {
                          setGeneralAvailability(generalAvailability.filter(a => a !== avail));
                        }
                      } else {
                        setGeneralAvailability([...generalAvailability, avail]);
                      }
                    }}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-xl border transition cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>{isSelected ? '✓' : '🕒'}</span>
                    <span>{avail}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parents' Household Income (Strictly Confidential - Matchmaking Only) */}
          <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-orange-500" />
                <span>Parents' Annual Household Income (Confidential)</span>
              </label>
              <span className="text-[9px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">
                Hidden in Frontend
              </span>
            </div>

            <div className="p-2.5 bg-amber-100/60 rounded-xl text-[10.5px] text-amber-900 leading-relaxed">
              <strong>🔒 Privacy Note:</strong> This field is strictly confidential and <strong>never visible on public profile cards</strong>. It is used exclusively by our smart matchmaking algorithm to suggest compatible family playmates.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {PARENTS_INCOME_OPTIONS.map((inc) => (
                <label
                  key={inc}
                  onClick={() => setParentsIncome(inc)}
                  className={`flex items-center gap-2 p-2 rounded-xl border transition cursor-pointer ${
                    parentsIncome === inc
                      ? 'bg-orange-500 text-white border-orange-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-orange-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="editParentsIncome"
                    value={inc}
                    checked={parentsIncome === inc}
                    onChange={() => setParentsIncome(inc)}
                    className="text-orange-600 focus:ring-orange-400"
                  />
                  <span className={`text-[11px] ${parentsIncome === inc ? 'font-bold text-white' : 'font-medium text-slate-700'}`}>
                    {inc}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Religion & Caste Community Preferences */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-orange-500" />
                <span>Religion & Caste Preferences</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Religion</label>
                <select
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
                >
                  <option value="">-- Select Religion --</option>
                  {INDIAN_RELIGIONS.map((rel) => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Caste / Community</label>
                <select
                  value={caste}
                  onChange={(e) => setCaste(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
                >
                  <option value="">-- Select Caste / Community --</option>
                  {INDIAN_CASTES.map((cst) => (
                    <option key={cst} value={cst}>{cst}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Guardian Phone Privacy Preferences */}
          <div className="p-4 bg-orange-50/40 border border-orange-100 rounded-2xl space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1">
              📱 Guardian Phone Security Protocol:
            </label>
            <p className="text-[10px] text-slate-500 leading-normal">
              Control which families can access your registered contact coordinates. Locking permanently blocks all revelations.
            </p>
            <select
              value={phonePrivacyOption}
              onChange={(e) => setPhonePrivacyOption(e.target.value as any)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-700 outline-none cursor-pointer"
            >
              <option value="show_after_acceptance">Show only after connection acceptance (Standard)</option>
              <option value="show_after_referral">Show after acceptance OR referral success (View Credit Unlockable)</option>
              <option value="lock_permanently">Lock permanently (Strictly hide number permanently from all views)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Child's Hobby Interests (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Lego Sets, Sketching, Mini Soccer"
              value={interestsStr}
              onChange={(e) => setInterestsStr(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Preferred Activities</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {['Park Play', 'Indoor Games', 'Educational Activities', 'Sports Activities', 'Art & Craft Activities'].map(act => {
                const selected = preferredActivities.includes(act);
                return (
                  <button
                    key={act}
                    type="button"
                    onClick={() => {
                      if (selected) {
                        setPreferredActivities(preferredActivities.filter(a => a !== act));
                      } else {
                        setPreferredActivities([...preferredActivities, act]);
                      }
                    }}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition ${
                      selected 
                        ? 'bg-orange-500 border-orange-500 text-white shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {act}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Weekly Available Days</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                  const selected = availableDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setAvailableDays(availableDays.filter(d => d !== day));
                        } else {
                          setAvailableDays([...availableDays, day]);
                        }
                      }}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition ${
                        selected 
                          ? 'bg-orange-500 border-orange-500 text-white shadow-xs' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1 pt-1.5 border-t border-slate-200/50">
              <label className="block text-xs font-bold text-slate-700 font-medium">Preferred Times of Day</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {['Morning', 'Afternoon', 'Evening'].map(time => {
                  const selected = availableTimes.includes(time);
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setAvailableTimes(availableTimes.filter(t => t !== time));
                        } else {
                          setAvailableTimes([...availableTimes, time]);
                        }
                      }}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition ${
                        selected 
                          ? 'bg-orange-500 border-orange-500 text-white shadow-xs' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dynamic Extra Custom Fields Created by Admin */}
          {customFieldsSchema.length > 0 && (
            <div className="bg-indigo-50/30 border border-indigo-100/50 p-4 rounded-2xl space-y-3">
              <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">📋 Additional Administrative Profile Fields</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customFieldsSchema.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">{field.fieldName}</label>
                    <input
                      type="text"
                      placeholder={field.placeholder || `Enter ${field.fieldName}`}
                      value={customFieldsData[field.fieldName] || ''}
                      onChange={(e) => {
                        setCustomFieldsData({
                          ...customFieldsData,
                          [field.fieldName]: e.target.value
                        });
                      }}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none text-slate-705 font-medium"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Introduce your family bio *</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other vaccine-verified parents about your neighborhood availability or child sports interests."
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed resize-none"
            />
          </div>

          {/* Lock Profile Toggle option for parents */}
          {!currentProfile.isLocked && (
            <div className="flex items-center justify-between p-3 bg-amber-50/50 border border-amber-100 rounded-2xl hover:bg-amber-50 transition">
              <div className="space-y-0.5 pr-4 text-left">
                <span className="block text-xs font-black text-amber-900 flex items-center gap-1">🔒 Voluntary Child Safety Lock</span>
                <p className="text-[9.5px] text-amber-750 font-medium">Freezes your profile data from future accidental edits to maintain active verified status.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLockedSelf(!isLockedSelf)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors outline-none cursor-pointer flex shrink-0 ${
                  isLockedSelf ? 'bg-amber-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="w-5 h-5 bg-white rounded-full shadow-md transform transition" />
              </button>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 select-none">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              {currentProfile.isLocked ? 'Close Window' : 'Cancel Changes'}
            </button>
            <button
              type="submit"
              disabled={!!currentProfile.isLocked}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition flex items-center gap-1.5 ${
                currentProfile.isLocked 
                  ? 'bg-amber-100 text-amber-700 border border-amber-250 cursor-not-allowed shadow-none' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <Save className="w-4 h-4" /> 
              {currentProfile.isLocked ? 'Locked by Admin' : 'Save Profile Details'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
