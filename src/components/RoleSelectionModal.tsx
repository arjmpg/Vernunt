import React, { useState } from 'react';
import { 
  CheckCircle2, 
  X,
  ArrowRight,
  ChevronDown,
  ClipboardList,
  Sparkles,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import VernuntLogo from './VernuntLogo.tsx';
import { LanguageCode } from '../utils/dictionary.ts';
import { UserPlatformRole, USER_ROLES_CONFIG } from '../data/userRoles.ts';

export type { UserPlatformRole };

interface RoleSelectionModalProps {
  isOpen: boolean;
  onSelectRole: (role: UserPlatformRole) => void;
  onClose?: () => void;
  verifiedEmail?: string;
  verifiedPhone?: string;
  language?: LanguageCode;
}

export default function RoleSelectionModal({
  isOpen,
  onSelectRole,
  onClose,
  verifiedEmail,
  verifiedPhone,
  language = 'en'
}: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserPlatformRole>('Parent');

  if (!isOpen) return null;

  const contactLabel = verifiedPhone 
    ? verifiedPhone 
    : (verifiedEmail || 'Verified User');

  const currentRoleMeta = USER_ROLES_CONFIG[selectedRole];

  return (
    <div 
      id="role-selection-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto"
    >
      <div 
        id="role-selection-modal-card" 
        className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-rose-100 overflow-hidden my-auto animate-scale-up"
      >
        {/* Top decorative gradient bar */}
        <div className="h-2 sm:h-2.5 bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 w-full shrink-0"></div>

        {/* Modal close button (if dismissible) */}
        {onClose && (
          <button
            id="btn-close-role-modal"
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 p-1.5 sm:p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition z-10 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 md:p-8 space-y-5">
          {/* Header Section */}
          <div className="text-center space-y-2.5">
            <div className="flex justify-center">
              <VernuntLogo size="md" animated={true} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-[11px] sm:text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Verified: <span className="font-mono font-semibold">{contactLabel}</span></span>
            </div>

            <h2 className="text-xl sm:text-2xl font-serif font-black text-slate-900 tracking-tight leading-tight">
              Sign Up for Vernunt
            </h2>
            <p className="text-xs sm:text-[13px] text-slate-600 max-w-md mx-auto leading-relaxed">
              Select your user type from the dropdown below to review the required registered fields and start your verified account.
            </p>
          </div>

          {/* Unified Single Sign-Up Form with User Type Dropdown */}
          <div className="bg-slate-50/90 border-2 border-orange-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
            {/* User Type Dropdown Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="modal-role-dropdown" className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>👤 Select User Type:</span>
                </label>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 bg-orange-100/90 px-2 py-0.5 rounded-full border border-orange-200/80">
                  {currentRoleMeta.badge}
                </span>
              </div>

              <div className="relative">
                <select
                  id="modal-role-dropdown"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserPlatformRole)}
                  className="w-full appearance-none px-3.5 py-3 bg-white border-2 border-orange-200 focus:border-orange-500 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none shadow-xs transition cursor-pointer pr-10"
                >
                  <option value="Parent">👪 Parent &amp; Kid Profile (Family Playmates, Sitters, Daycare)</option>
                  <option value="Daycare Center">🏫 Daycare Center / Creche (Pre-schools &amp; Care Facilities)</option>
                  <option value="Event Organizer">🎪 Events, Activity &amp; Classes Host (Workshops &amp; Camps)</option>
                  <option value="Portfolio Professional">🩺 Kids Specialist, Doctor &amp; Pediatrician</option>
                  <option value="Influencer">⭐ Community Creator &amp; Influencer Ambassador (VIP Pass)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              <p className="text-[11.5px] text-slate-600 leading-relaxed mt-1">
                {currentRoleMeta.description}
              </p>
            </div>

            {/* Dynamically Required Registered Fields based on Dropdown Selection */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-orange-600" />
                  <span>Required Registered Fields for {currentRoleMeta.label}:</span>
                </h4>
                <span className="text-[10px] font-bold text-slate-500">
                  {currentRoleMeta.requiredFields.length} Required
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentRoleMeta.requiredFields.map((field, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-slate-50/80 rounded-lg border border-slate-150 text-left">
                    <span className="text-sm shrink-0 mt-0.5">{field.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 leading-tight">
                        {field.name}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate">
                        {field.desc}
                      </p>
                    </div>
                    <span className="text-[8.5px] font-black text-orange-700 bg-orange-50 border border-orange-200/60 px-1.5 py-0.5 rounded shrink-0">
                      Required
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Single Sign Up Action Button */}
            <button
              id="role-btn-continue-signup"
              type="button"
              onClick={() => onSelectRole(selectedRole)}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 hover:from-orange-600 hover:to-rose-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition cursor-pointer active:scale-98 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Continue Sign Up as {currentRoleMeta.label}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
