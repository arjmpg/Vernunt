import React, { useState } from 'react';
import { ChildProfile } from '../../types.ts';
import { 
  ShieldCheck, 
  Lock, 
  Check, 
  Smartphone, 
  X, 
  EyeOff
} from 'lucide-react';

interface ProfilePrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: ChildProfile | null;
  onUpdateProfile: (updated: Partial<ChildProfile>) => void;
}

export function ProfilePrivacyModal({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile
}: ProfilePrivacyModalProps) {
  if (!isOpen) return null;

  const [visibility, setVisibility] = useState<'Mom' | 'Mom & Dad' | 'Dad'>(
    userProfile?.profileVisibility || 'Mom'
  );
  const [parentGender, setParentGender] = useState<'Mother' | 'Father' | 'Other'>(
    userProfile?.parentGender || 'Mother'
  );

  // SEO & Safety toggles
  const [unindexedFromSeo, setUnindexedFromSeo] = useState<boolean>(
    userProfile?.unindexedFromSeo ?? true
  );
  const [hideExactLocation, setHideExactLocation] = useState<boolean>(
    userProfile?.hideExactLocation ?? true
  );
  const [requirePinForChat, setRequirePinForChat] = useState<boolean>(
    userProfile?.requirePinForChat ?? false
  );

  const handleSave = () => {
    onUpdateProfile({
      profileVisibility: visibility,
      parentGender,
      biometricAuthEnabled: false,
      unindexedFromSeo,
      hideExactLocation,
      requirePinForChat
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-fade-in text-left my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 font-serif">
                Profile Privacy &amp; Visibility
              </h3>
              <p className="text-[11px] text-slate-400">
                Configure profile viewability, gender filters &amp; child privacy shield
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Section 1: Profile Visibility Toggle (Mom, Mom & Dad, Dad) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-800">
              1. Profile Presentation &amp; Visibility
            </label>
            <p className="text-[11px] text-slate-500">
              Choose how your parental presence is represented on Vernunt playmate radar and community cards:
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setVisibility('Mom');
                  setParentGender('Mother');
                }}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                  visibility === 'Mom'
                    ? 'bg-rose-50 border-rose-500 text-rose-950 font-black shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-xl block mb-1">👩</span>
                <span className="text-xs block font-bold">Mom</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Mother only</span>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('Mom & Dad')}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                  visibility === 'Mom & Dad'
                    ? 'bg-purple-50 border-purple-500 text-purple-950 font-black shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-xl block mb-1">👨‍👩‍👧</span>
                <span className="text-xs block font-bold">Mom &amp; Dad</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Both parents</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setVisibility('Dad');
                  setParentGender('Father');
                }}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                  visibility === 'Dad'
                    ? 'bg-blue-50 border-blue-500 text-blue-950 font-black shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-xl block mb-1">👨</span>
                <span className="text-xs block font-bold">Dad</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Father only</span>
              </button>
            </div>
          </div>

          {/* Section 2: Child Safety & SEO Cloaking */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-black text-slate-900">
              2. Child Safety &amp; SEO Privacy Shield
            </h4>

            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={unindexedFromSeo}
                  onChange={(e) => setUnindexedFromSeo(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 mt-0.5"
                />
                <div>
                  <strong className="text-slate-900 block">SEO Cloaking Active (Recommended)</strong>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    Ensures Google, Bing, and web crawlers are strictly forbidden from indexing your child's name, profile, or photos.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hideExactLocation}
                  onChange={(e) => setHideExactLocation(e.target.checked)}
                  className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 mt-0.5"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-slate-900 block">Area Name Only (Zero Exact Location Disclosure)</strong>
                    <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded uppercase">Child Safety Active</span>
                  </div>
                  <span className="text-[11px] text-slate-600 block leading-tight mt-0.5">
                    Never reveal exact house, building, or street numbers. Parents and playmates only see your verified broad area name (e.g. "Indiranagar, Bangalore") to protect child physical safety.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Account Security Note */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
            <span>
              Sign-in is authenticated using verified Mobile Phone OTP or Email Password verification.
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-4 py-2 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="bg-rose-700 hover:bg-rose-800 text-white font-black text-xs py-2.5 px-5 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
}
