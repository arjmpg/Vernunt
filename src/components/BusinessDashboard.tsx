import React, { useState, useEffect } from 'react';
import { CommunityEvent, SpecialistProfile, Booking, ChildProfile } from '../types.ts';
import { Award, ShieldCheck, TrendingUp, DollarSign, Percent, Settings, Edit3, Save, Users, CreditCard, Layers, ArrowRight, Sparkles, Check, FileText, Trash2, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import confettiDefault from 'canvas-confetti';
import { db, auth, handleFirestoreError, OperationType } from '../utils/firebase.ts';
import { doc, updateDoc, deleteDoc, collection, onSnapshot, setDoc } from 'firebase/firestore';

interface BusinessDashboardProps {
  userProfile: ChildProfile | null;
  onUpdateProfile: (updated: ChildProfile) => void;
  playmates?: ChildProfile[];
  eventsList: CommunityEvent[];
  setEventsList: React.Dispatch<React.SetStateAction<CommunityEvent[]>>;
  specialistsList: SpecialistProfile[];
  setSpecialistsList: React.Dispatch<React.SetStateAction<SpecialistProfile[]>>;
  bookingsList: Booking[];
  globalCommissionRate: number;
  setGlobalCommissionRate: (rate: number) => void;
  userRole: 'Parent' | 'Event Organizer' | 'Portfolio Professional' | 'Admin';
  onUpdateRole: (role: 'Parent' | 'Event Organizer' | 'Portfolio Professional' | 'Admin') => void;
}

export default function BusinessDashboard({
  userProfile,
  onUpdateProfile,
  playmates = [],
  eventsList,
  setEventsList,
  specialistsList,
  setSpecialistsList,
  bookingsList,
  globalCommissionRate,
  setGlobalCommissionRate,
  userRole,
  onUpdateRole
}: BusinessDashboardProps) {
  // Editing state for event
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEventTitle, setEditEventTitle] = useState('');
  const [editEventLoc, setEditEventLoc] = useState('');
  const [editEventPrice, setEditEventPrice] = useState(0);

  // Editing state for specialist portfolio
  const [editingSpecId, setEditingSpecId] = useState<string | null>(null);
  const [editSpecTitle, setEditSpecTitle] = useState('');
  const [editSpecBio, setEditSpecBio] = useState('');
  const [editSpecFee, setEditSpecFee] = useState(499);
  const [editSpecPhone, setEditSpecPhone] = useState('');

  // Bulk set override value
  const [bulkCommissionValue, setBulkCommissionValue] = useState<number>(globalCommissionRate);

  // Success animations states
  const [successToast, setSuccessToast] = useState('');

  // Premium listing subscription simulations
  const [selectedSubPeriod, setSelectedSubPeriod] = useState<'monthly' | 'quarterly' | 'halfyearly' | 'yearly'>('monthly');
  const [isPayingSub, setIsPayingSub] = useState(false);

  const handlePaySubscriptionFee = async () => {
    if (!userProfile?.id) {
      triggerToast("Please authenticate to upgrade your listing model.");
      return;
    }
    setIsPayingSub(true);
    triggerToast("Initiating UPI/Razorpay payment gateway validation...");
    
    setTimeout(async () => {
      try {
        const durationDays = 
          selectedSubPeriod === 'monthly' ? 30 :
          selectedSubPeriod === 'quarterly' ? 90 :
          selectedSubPeriod === 'halfyearly' ? 180 : 365;

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + durationDays);
        const expiryStr = expiryDate.toISOString().split('T')[0];

        const updatedProfile: ChildProfile = {
          ...userProfile,
          businessListingModel: 'subscription',
          businessSubscriptionActive: true,
          businessSubscriptionPlan: selectedSubPeriod,
          businessSubscriptionExpiryDate: expiryStr
        };

        const userRef = doc(db, 'users', userProfile.id);
        await setDoc(userRef, updatedProfile, { merge: true });

        // Update local session
        onUpdateProfile(updatedProfile);
        
        setIsPayingSub(false);
        triggerToast(`🎉 Paid Listing upgraded! Plan successfully validated until ${expiryStr}!`);
        
        confettiDefault({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (err: any) {
        console.error(err);
        setIsPayingSub(false);
        triggerToast(`Gateway Error: ${err.message}`);
      }
    }, 1500);
  };

  // Admin Profile Management States & Procedures
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [formParentName, setFormParentName] = useState('');
  const [formChildName, setFormChildName] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formAadhaarNumber, setFormAadhaarNumber] = useState('');
  const [formPlayStyle, setFormPlayStyle] = useState('');
  const [formGradeLevel, setFormGradeLevel] = useState('');
  const [formUserRole, setFormUserRole] = useState<'Parent' | 'Event Organizer' | 'Portfolio Professional' | 'Admin' | string>('Parent');

  // Real persistent custom roles and capabilities loaded from Firestore
  const [customRoles, setCustomRoles] = useState<{name: string, description: string, capabilities: string[]}[]>([
    { name: 'Community Manager', description: 'Moderates standard playmate chats & approves public events.', capabilities: ['Can Propose Event', 'Can Moderate Chats'] },
    { name: 'Gold Specialist Member', description: 'Receives special discounted commission rates and premium search badge.', capabilities: ['Can Edit Specialist Fees', 'Receive Commission Waive'] }
  ]);

  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [selectedCaps, setSelectedCaps] = useState<string[]>([]);

  const CAPABILITY_OPTIONS = [
    'Can Propose Event',
    'Can Moderate Chats',
    'Can Edit Specialist Fees',
    'Can Approve Portfolios',
    'Receive Commission Waive',
    'Full Sandbox Access'
  ];

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'custom_roles'), (snap: any) => {
      const list: any[] = [];
      snap.forEach((d: any) => {
        list.push(d.data());
      });
      if (list.length > 0) {
        setCustomRoles(list);
      }
    }, (error) => {
      console.warn('[Vernunt Roles DB] Could not stream custom roles:', error.message);
      if (auth.currentUser) {
        try {
          handleFirestoreError(error, OperationType.GET, 'custom_roles');
        } catch (e) {
          console.error('[Vernunt Secure Diagnostic]', e);
        }
      }
    });
    return () => unsub();
  }, []);

  const handleCreateCustomRole = async () => {
    if (!newRoleName.trim()) {
      triggerToast('Please supply a valid role name.');
      return;
    }
    try {
      const roleId = newRoleName.trim().replace(/\s+/g, '-').toLowerCase();
      const roleRef = doc(db, 'custom_roles', roleId);
      await setDoc(roleRef, {
        name: newRoleName.trim(),
        description: newRoleDesc.trim() || 'Custom authorization level.',
        capabilities: selectedCaps
      });
      triggerToast(`Custom Role "${newRoleName}" successfully integrated to Vernunt authorization databases!`);
      setNewRoleName('');
      setNewRoleDesc('');
      setSelectedCaps([]);
    } catch (err: any) {
      console.error(err);
      triggerToast(`Database Write Error: ${err.message}`);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: any) => {
    try {
      await updateDoc(doc(db, 'users', userId), { userRole: newRole });
      triggerToast(`Updated Role to: ${newRole}!`);
      if (userId === userProfile?.id) {
        onUpdateRole(newRole);
      }
    } catch (err: any) {
      console.error(err);
      triggerToast(`Failed changing role: ${err.message}`);
    }
  };

  const handleApproveProfile = async (profileId: string, parentName: string) => {
    try {
      await updateDoc(doc(db, 'users', profileId), {
        verificationStatus: 'VERIFIED',
        aadhaarVerified: true
      });
      triggerToast(`Approved & verified profile for ${parentName}!`);
    } catch (err) {
      console.error(err);
      triggerToast(`Error: unable to write update to Firestore schema`);
    }
  };

  const handleRejectProfile = async (profileId: string, parentName: string) => {
    try {
      await updateDoc(doc(db, 'users', profileId), {
        verificationStatus: 'UNVERIFIED',
        aadhaarVerified: false
      });
      triggerToast(`Rejected & reset verification status for ${parentName}!`);
    } catch (err) {
      console.error(err);
      triggerToast(`Error updating verification status`);
    }
  };

  const handleDeleteProfile = async (profileId: string, parentName: string) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete the profile for ${parentName}?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', profileId));
      triggerToast(`Permanently deleted profile for ${parentName}`);
    } catch (err) {
      console.error(err);
      triggerToast(`Permission denied or database write error`);
    }
  };

  const startEditingProfile = (profile: ChildProfile) => {
    setEditingProfileId(profile.id);
    setFormParentName(profile.parentName || '');
    setFormChildName(profile.childName || '');
    setFormBio(profile.bio || '');
    setFormAadhaarNumber(profile.aadhaarNumber || '');
    setFormPlayStyle(profile.playStyle || 'Active');
    setFormGradeLevel(profile.gradeLevel || 'Kindergarten');
    setFormUserRole(profile.userRole || 'Parent');
  };

  const handleSaveProfileModify = async (profileId: string) => {
    try {
      await updateDoc(doc(db, 'users', profileId), {
        parentName: formParentName,
        childName: formChildName,
        bio: formBio,
        aadhaarNumber: formAadhaarNumber.replace(/\s/g, ''),
        playStyle: formPlayStyle,
        gradeLevel: formGradeLevel,
        userRole: formUserRole
      });
      if (profileId === userProfile?.id) {
        onUpdateRole(formUserRole as any);
      }
      setEditingProfileId(null);
      triggerToast('Successfully modified profile with complete admin privileges!');
    } catch (err) {
      console.error(err);
      triggerToast('Firestore updates rejected: Validation mismatch');
    }
  };

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const handleApplyBulkCommission = () => {
    setGlobalCommissionRate(bulkCommissionValue);
    
    // Bulk overrides commissionPercentage of all events and specialists!
    setEventsList(prev => prev.map(e => ({ ...e, commissionPercentage: bulkCommissionValue })));
    setSpecialistsList(prev => prev.map(s => ({ ...s, commissionPercentage: bulkCommissionValue })));

    triggerToast(`Bulk override applied! Updated global commission rate to ${bulkCommissionValue}% for all users.`);
    confettiDefault({
      particleCount: 50,
      spread: 30,
      colors: ['#a855f7', '#3b82f6']
    });
  };

  const handleSaveEventEdits = (id: string) => {
    setEventsList(prev => prev.map(e => {
      if (e.id === id) {
        return {
          ...e,
          title: editEventTitle,
          location: editEventLoc,
          ticketPrice: editEventPrice
        };
      }
      return e;
    }));
    setEditingEventId(null);
    triggerToast('Event premium pricing and parameters saved successfully!');
  };

  const handleSaveSpecEdits = (id: string) => {
    setSpecialistsList(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          title: editSpecTitle,
          bio: editSpecBio,
          sessionFee: editSpecFee,
          phone: editSpecPhone
        };
      }
      return s;
    }));
    setEditingSpecId(null);
    triggerToast('Specialist Portfolio professional credentials saved successfully!');
  };

  // Safe commission calculations
  const totalAmountBooked = bookingsList.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const totalCommissionEarned = bookingsList.reduce((acc, curr) => acc + curr.commissionEarned, 0);
  const totalOrganizerPayout = totalAmountBooked - totalCommissionEarned;

  // Filter lists based on role to only allow editing of own data
  const visibleEvents = userProfile?.userRole === 'Admin'
    ? eventsList
    : eventsList.filter(evt => userProfile && (evt.hostName === userProfile.parentName || (userProfile.id && evt.id.includes(userProfile.id))));

  const visibleSpecialists = userProfile?.userRole === 'Admin'
    ? specialistsList
    : specialistsList.filter(spec => userProfile && (spec.email === userProfile.email || spec.name === userProfile.parentName || spec.id === userProfile.id || (userProfile.id && spec.id.includes(userProfile.id))));

  return (
    <div id="business-dashboard-container" className="space-y-6">
      
      {/* Toast notification banner */}
      {successToast && (
        <div className="fixed top-24 right-6 bg-slate-900 border border-slate-950 text-white text-xs font-bold py-3.5 px-5 rounded-2xl shadow-xl z-50 animate-fade-in flex items-center gap-1.5 max-w-sm font-sans">
          <Sparkles className="w-4 h-4 text-orange-400 shrink-0 animate-spin-slow" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header and User Role Control Center */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-orange-500 py-0.5 px-2 rounded text-white">Owner Portal</span>
            <span className="text-xs text-slate-300 font-semibold font-mono">VERNUNT MARKETPLACE</span>
          </div>
          <h3 className="text-2xl font-black font-serif tracking-tight text-white flex items-center gap-1.5">
            💼 Interactive Business & Admin Console
          </h3>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Manage customized Razorpay fee structures, update events or portfolios, and check direct split commission splits globally or individually.
          </p>
        </div>

        {/* Workspace switch controls */}
        <div className="bg-white/10 backdrop-blur-xs p-1.5 rounded-2xl border border-white/10 self-start lg:self-auto space-x-1 flex flex-wrap gap-1">
          {['Parent', 'Event Organizer', 'Portfolio Professional', 'Admin']
            .filter((role) => role !== 'Admin' || userProfile?.userRole === 'Admin')
            .map((role) => {
              const isSelected = userRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    if (role === 'Admin' && userProfile?.userRole !== 'Admin') {
                      triggerToast("Restricted to Admin authorized accounts only!");
                      return;
                    }
                    onUpdateRole(role as any);
                    // Auto elevate profile roles to maintain consistency
                    if (userProfile) {
                      onUpdateProfile({ ...userProfile, userRole: role as any });
                    }
                    triggerToast(`Switched active workspace mode to ${role}!`);
                  }}
                  className={`py-1.5 px-3 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/10' 
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {role === 'Admin' ? '⚖️ Admin Panel' : role}
                </button>
              );
            })}
        </div>
      </div>

      {/* Workspace view depending on selected role */}
      {userRole === 'Parent' && (
        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 py-12 text-center text-slate-500 space-y-4">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="max-w-md mx-auto space-y-2">
            <h4 className="font-bold text-slate-800 font-serif text-sm">Standard Parent View</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              You are currently registered as a Standard Parent. Elevate your presence by proposing classes, daily outdoor matches or listing specialist bio portfolios.
            </p>
            <div className="pt-2 flex justify-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  onUpdateRole('Event Organizer');
                  triggerToast('Elevated to Event Organizer. Register premium events now!');
                }}
                className="py-2 px-4 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition"
              >
                Become Organizer
              </button>
              <button
                onClick={() => {
                  onUpdateRole('Portfolio Professional');
                  triggerToast('Elevated to Child Consultant Portfolio owner!');
                }}
                className="py-2 px-4 bg-orange-500 text-white hover:bg-orange-600 rounded-xl text-xs font-bold transition"
              >
                Become Specialist Portfolio Owner
              </button>
            </div>
          </div>
        </div>
      )}

      {userRole === 'Event Organizer' && (
        <div className="space-y-6">
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-extrabold block">Events Hosted</span>
                <span className="text-lg font-black text-slate-800">{eventsList.filter(e => e.hostName.includes(userProfile?.parentName || '---')).length} Active</span>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">📊</div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-extrabold block">Passes Booked</span>
                <span className="text-lg font-black text-slate-800">
                  {bookingsList.filter(b => b.type === 'EventTicket').length} Tickets
                </span>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">🎟️</div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-extrabold block">Total Gross Bill</span>
                <span className="text-lg font-black text-rose-600">
                  ₹{bookingsList.filter(b => b.type === 'EventTicket').reduce((a, b) => a + b.amountPaid, 0)}
                </span>
              </div>
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">₹</div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-extrabold block">Platform Commissions Deducted</span>
                <span className="text-xs font-black text-slate-500">
                  ₹{bookingsList.filter(b => b.type === 'EventTicket').reduce((a, b) => a + b.commissionEarned, 0)} (split payout)
                </span>
              </div>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">⚖️</div>
            </div>
          </div>

          {/* EDIT GATHERINGS LIST */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 font-serif">
              💼 Manage Hosted Classes, Activities & Olympiads
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50">
                    <th className="py-2.5 px-3">Event title</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Ticket Pricing (INR)</th>
                    <th className="py-2.5 px-3">Commission split %</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-705">
                  {visibleEvents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                        No events or classes registered under your account yet. Propose or host one under the Events & Classes tab!
                      </td>
                    </tr>
                  ) : (
                    visibleEvents.map((evt) => {
                      const isEditing = editingEventId === evt.id;
                      return (
                        <tr key={evt.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editEventTitle}
                                onChange={(e) => setEditEventTitle(e.target.value)}
                                className="p-1.5 border border-slate-200 rounded-lg text-xs"
                              />
                            ) : evt.title}
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-500">{evt.category}</td>
                          <td className="py-3 px-3">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editEventPrice}
                                onChange={(e) => setEditEventPrice(Number(e.target.value))}
                                className="w-20 p-1 border border-slate-200 rounded-lg text-xs font-bold"
                              />
                            ) : (
                              <span className="font-bold text-slate-700">₹{evt.ticketPrice || '0 (Free)'}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-400">
                            {evt.commissionPercentage ?? globalCommissionRate}% (default)
                          </td>
                          <td className="py-3 px-3 text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-1.5 select-none">
                                <button
                                  onClick={() => setEditingEventId(null)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveEventEdits(evt.id)}
                                  className="px-2 py-1 bg-emerald-500 text-white rounded text-[10px] font-bold"
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingEventId(evt.id);
                                  setEditEventTitle(evt.title);
                                  setEditEventLoc(evt.location);
                                  setEditEventPrice(evt.ticketPrice || 0);
                                }}
                                className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded border border-slate-200 text-[10px] font-extrabold uppercase transition"
                              >
                                Edit details
                              </button>
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
        </div>
      )}

      {userRole === 'Portfolio Professional' && (
        <div className="space-y-6">
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-extrabold block">Portfolio Status</span>
                <span className="text-sm font-black text-emerald-600 flex items-center gap-1 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Active Verified Profile
                </span>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">✓</div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-extrabold block">Scheduled Appointments</span>
                <span className="text-lg font-black text-slate-800">
                  {bookingsList.filter(b => b.type === 'SpecialistAppointment').length} Conslt
                </span>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">📅</div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-extrabold block">Gross Booking Revenue</span>
                <span className="text-lg font-black text-rose-600">
                  ₹{bookingsList.filter(b => b.type === 'SpecialistAppointment').reduce((a, b) => a + b.amountPaid, 0)}
                </span>
              </div>
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">₹</div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-extrabold block">Deducted Admin Commission</span>
                <span className="text-xs font-black text-slate-500">
                  ₹{bookingsList.filter(b => b.type === 'SpecialistAppointment').reduce((a, b) => a + b.commissionEarned, 0)}
                </span>
              </div>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">⚖️</div>
            </div>
          </div>

          {/* EDIT SPEC PORTFOLIO DETAILS */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 font-serif">
              🧬 Manage Specialist Clinic Portfolios & Fees
            </h4>

            <div className="space-y-4">
              {visibleSpecialists.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No Specialist Portfolios registered under your account yet. Apply under the Specialists tab to launch one!
                </div>
              ) : (
                visibleSpecialists.map((spec) => {
                  const isEditing = editingSpecId === spec.id;
                  return (
                    <div key={spec.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-150 relative space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={spec.photoUrl}
                            alt="spec"
                            className="w-10 h-10 rounded-xl object-cover bg-slate-200"
                          />
                          <div>
                            <strong className="text-sm font-bold text-slate-800">{spec.name}</strong>
                            <span className="text-[10px] block font-mono text-slate-400">ID: {spec.id}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (isEditing) {
                              handleSaveSpecEdits(spec.id);
                            } else {
                              setEditingSpecId(spec.id);
                              setEditSpecTitle(spec.title);
                              setEditSpecBio(spec.bio);
                              setEditSpecFee(spec.sessionFee);
                              setEditSpecPhone(spec.phone || '9876543210');
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 hover:bg-slate-800 cursor-pointer"
                        >
                          {isEditing ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                          <span>{isEditing ? 'Save Portf' : 'Edit Credentials'}</span>
                        </button>
                      </div>

                      {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black uppercase text-slate-400">Professional title</label>
                            <input
                              type="text"
                              value={editSpecTitle}
                              onChange={(e) => setEditSpecTitle(e.target.value)}
                              className="w-full p-2 bg-white border border-slate-205 rounded-xl block font-bold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black uppercase text-slate-400">Consultation Session Fee (₹ INR)</label>
                            <input
                              type="number"
                              value={editSpecFee}
                              onChange={(e) => setEditSpecFee(Number(e.target.value))}
                              className="w-full p-2 bg-white border border-slate-205 rounded-xl block font-black text-rose-600 text-sm"
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="block text-[10px] font-black uppercase text-slate-400">Qualifying credential Bio text</label>
                            <textarea
                              rows={2}
                              value={editSpecBio}
                              onChange={(e) => setEditSpecBio(e.target.value)}
                              className="w-full p-2 bg-white border border-slate-205 rounded-xl block resize-none leading-relaxed"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 text-xs">
                          <p className="text-slate-600 font-medium">Title: <strong className="text-orange-500 font-bold">{spec.title}</strong></p>
                          <p className="text-slate-500 font-normal leading-relaxed">{spec.bio}</p>
                          <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[11px] font-bold text-slate-450">
                            <span>Session Fee: <strong className="text-rose-600 text-xs">₹{spec.sessionFee} / consultation</strong></span>
                            <span>Commission Overrides rate: <strong className="text-slate-800">{spec.commissionPercentage ?? globalCommissionRate}%</strong></span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {userRole === 'Admin' && (
        userProfile?.userRole !== 'Admin' ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-3xl text-center space-y-2">
            <h4 className="font-bold">Access Denied: Admin authorization required</h4>
            <p className="text-xs">You must have genuine Admin privileges to view, edit, or override safety protocols.</p>
          </div>
        ) : (
          <div id="admin-hub-console" className="space-y-6">

          {/* VERNUNT SECURITY, AUDIT & TRUST REGISTRY DESK */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-[32px] p-6 space-y-6 border border-slate-800 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-900/50">
              <div>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest border border-indigo-500/20 shadow-xs">
                  Secure Admin Desk
                </span>
                <h4 className="text-xl font-bold font-serif tracking-tight text-white mt-1.5 flex items-center gap-2">
                  🛡️ Trust, Safety & Identity Verification Registry
                </h4>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  Accept, reject, flag, or modify demographic details and national Aadhaar IDs for all families in the playmate network database.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl shrink-0 text-right">
                <span className="text-[9.5px] text-slate-400 block font-bold leading-none mb-1 tracking-wider">REGISTERED FAMILIES</span>
                <strong className="text-base font-mono font-black text-indigo-300">{playmates.length + (userProfile ? 1 : 0)} Users</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Include userProfile in Admin screen too so Admin can edit their own or inspect self! */}
              {[...(userProfile ? [userProfile] : []), ...playmates.filter(p => p.id !== userProfile?.id)].map((p) => {
                const isEditing = editingProfileId === p.id;
                const isVerified = p.verificationStatus === 'VERIFIED' || p.aadhaarVerified;

                return (
                  <div key={p.id} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-indigo-900/60 transition-all space-y-4">
                    {isEditing ? (
                      /* PROFILE INLINE EDITING FORM FOR ADMIN */
                      <div className="space-y-3 font-sans text-left">
                        <span className="text-[9px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">MODIFICATION ACTIVE</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <label className="text-[10px] text-slate-400 font-bold mb-1">Parent Name</label>
                            <input
                              type="text"
                              value={formParentName}
                              onChange={(e) => setFormParentName(e.target.value)}
                              className="bg-slate-900 text-xs text-slate-100 p-2 border border-slate-700 rounded-xl outline-none"
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-[10px] text-slate-400 font-bold mb-1">Child Name</label>
                            <input
                              type="text"
                              value={formChildName}
                              onChange={(e) => setFormChildName(e.target.value)}
                              className="bg-slate-900 text-xs text-slate-100 p-2 border border-slate-700 rounded-xl outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <label className="text-[10px] text-slate-400 font-bold mb-1">Play Style</label>
                            <input
                              type="text"
                              value={formPlayStyle}
                              onChange={(e) => setFormPlayStyle(e.target.value)}
                              className="bg-slate-900 text-xs text-slate-100 p-2 border border-slate-700 rounded-xl outline-none"
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-[10px] text-slate-400 font-bold mb-1">Classroom Grade</label>
                            <input
                              type="text"
                              value={formGradeLevel}
                              onChange={(e) => setFormGradeLevel(e.target.value)}
                              className="bg-slate-900 text-xs text-slate-100 p-2 border border-slate-700 rounded-xl outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col">
                          <label className="text-[10px] text-slate-400 font-bold mb-1">Aadhaar Card UID (12 digits)</label>
                          <input
                            type="text"
                            maxLength={14}
                            value={formAadhaarNumber}
                            onChange={(e) => setFormAadhaarNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 '))}
                            className="bg-slate-900 text-xs text-slate-100 p-2 border border-slate-700 rounded-xl outline-none font-mono tracking-widest font-bold text-slate-200"
                          />
                        </div>

                        <div className="flex flex-col">
                          <label className="text-[10px] text-slate-400 font-bold mb-1">Account Role Assignation</label>
                          <select
                            value={formUserRole}
                            onChange={(e) => setFormUserRole(e.target.value)}
                            className="bg-slate-900 text-xs text-slate-100 p-2 border border-slate-700 rounded-xl outline-none font-bold"
                          >
                            <option value="Parent">Parent</option>
                            <option value="Event Organizer">Event Organizer (Host)</option>
                            <option value="Portfolio Professional">Portfolio Professional</option>
                            <option value="Admin">Admin</option>
                            {customRoles.map((cr) => (
                              <option key={cr.name} value={cr.name}>
                                {cr.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col">
                          <label className="text-[10px] text-slate-400 font-bold mb-1">Guardian Bio Statement</label>
                          <textarea
                            value={formBio}
                            rows={2}
                            onChange={(e) => setFormBio(e.target.value)}
                            className="bg-slate-900 text-xs text-slate-100 p-2 border border-slate-700 rounded-xl outline-none leading-relaxed"
                          />
                        </div>

                        <div className="flex gap-2 pt-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingProfileId(null)}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition text-slate-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveProfileModify(p.id)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-505 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" /> Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* STATIC VIEW MODE WITH ACTIONS */
                      <div className="space-y-4 text-left">
                        <div className="flex gap-3">
                          <img
                            src={p.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"}
                            alt={p.parentName}
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-800 bg-slate-900"
                            referrerPolicy="no-referrer"
                          />
                          <div className="space-y-0.5 flex-1 w-[120px]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-serif font-extrabold text-sm text-white leading-none truncate block max-w-full">{p.parentName}</span>
                              {p.userRole === 'Admin' && (
                                <span className="text-[8px] bg-red-900/50 text-red-300 font-extrabold border border-red-500/20 px-1 py-0.5 rounded leading-none uppercase tracking-wide shrink-0">Admin</span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block font-medium">Child: {p.childName || 'Not Registered'} • {p.gradeLevel || 'Toddler'}</span>

                            <div className="flex items-center gap-1.5 pt-1 flex-wrap font-sans">
                              <span className="text-[9.5px] uppercase font-black text-indigo-300">System Role:</span>
                              <select
                                value={p.userRole || 'Parent'}
                                onChange={(e) => handleUpdateUserRole(p.id, e.target.value)}
                                className="bg-slate-900 border border-slate-800 text-[10.5px] text-orange-400 font-extrabold px-2 py-0.5 rounded outline-none hover:bg-slate-800 cursor-pointer text-left"
                              >
                                <option value="Parent">Parent</option>
                                <option value="Event Organizer">Event Organizer (Host)</option>
                                <option value="Portfolio Professional">Portfolio Professional</option>
                                <option value="Admin">Admin</option>
                                {customRoles.map((cr) => (
                                  <option key={cr.name} value={cr.name}>
                                    {cr.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Show active system capabilities */}
                            <div className="pt-1 flex flex-wrap gap-1">
                              {(p.userRole === 'Admin' 
                                ? ['Full Sandbox Access', 'Can Propose Event', 'Can Moderate Chats', 'Can Approve Portfolios']
                                : p.userRole === 'Event Organizer'
                                ? ['Can Propose Event', 'Can Moderate Chats']
                                : p.userRole === 'Portfolio Professional'
                                ? ['Can Edit Specialist Fees', 'Can Approve Portfolios']
                                : customRoles.find(cr => cr.name === p.userRole)?.capabilities || ['Can Search Families']
                              ).map(cap => (
                                <span key={cap} className="text-[8.5px] bg-slate-900 hover:bg-slate-850 text-indigo-300 font-bold border border-slate-800 px-1.5 py-0.5 rounded transition">🛡️ {cap}</span>
                              ))}
                            </div>
                            
                            {/* Aadhaar detail output row */}
                            <div className="flex items-center gap-1.5 text-[10.5px] pt-1">
                              {isVerified ? (
                                <span className="text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded font-black font-mono text-[8.5px] tracking-wider uppercase border border-emerald-500/10 shrink-0">
                                  ✓ Approved
                                </span>
                              ) : (
                                <span className="text-amber-405 bg-amber-500/15 px-2 py-0.5 rounded font-black font-mono text-[8.5px] tracking-wider uppercase border border-amber-500/10 text-amber-300 shrink-0">
                                  ⚠ Pending
                                </span>
                              )}
                              <span className="font-mono text-slate-450 tracking-wide text-[10px] truncate block">
                                {p.aadhaarNumber ? `Aadhaar: ${p.aadhaarNumber.slice(0, 4)} ${p.aadhaarNumber.slice(4, 8)} ${p.aadhaarNumber.slice(8)}` : 'Aadhaar: Mapped UID missing'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-300 italic line-clamp-2 leading-relaxed bg-slate-900/40 p-2.5 rounded-xl border border-slate-900">
                          "{p.bio || 'Guardian has not uploaded a platform story bio statement yet.'}"
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-450 font-medium">
                          <div>📍 Address: <strong className="text-slate-300 truncate block">{p.location?.address || 'India, Delhi'}</strong></div>
                          <div>🗣️ Mother Tongue: <strong className="text-slate-300 block">{p.motherTongue || 'Regional'}</strong></div>
                        </div>

                        <div className="pt-3 border-t border-slate-900 flex justify-between items-center gap-2 flex-wrap">
                          {/* Modifiers dropdown list */}
                          <div className="flex items-center gap-1.5 flex-1 select-none">
                            {!isVerified ? (
                              <button
                                type="button"
                                onClick={() => handleApproveProfile(p.id, p.parentName)}
                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-505 text-white rounded-xl text-[10.5px] font-black transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Accept & Verify
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRejectProfile(p.id, p.parentName)}
                                className="px-3 py-2 bg-orange-600 hover:bg-orange-650 text-white rounded-xl text-[10.5px] font-black transition flex items-center gap-1.5 shrink-0 cursor-pointer border border-orange-500/10"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject / Flag
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => startEditingProfile(p)}
                              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Modify
                            </button>
                          </div>

                          {p.id !== userProfile?.id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteProfile(p.id, p.parentName)}
                              className="p-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 rounded-xl transition cursor-pointer shrink-0 border border-rose-500/5"
                              title="Delete user data"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* PLATFORM ROLES & CAPABILITIES REGISTRY DESK */}
          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-[32px] p-6 space-y-6 border border-slate-800 shadow-xl">
            <div>
              <span className="text-[10px] bg-amber-500/30 text-amber-300 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest border border-amber-500/20 shadow-xs">
                Custom Authorities Desk
              </span>
              <h4 className="text-xl font-bold font-serif tracking-tight text-white mt-1.5 flex items-center gap-2">
                🏛️ Platform Roles & Capabilities Registry Configurator
              </h4>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Empower your platform by creating completely custom authorization classes, choosing precise security capabilities, and toggling specific network access rules inline.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Creator Form */}
              <div className="lg:col-span-1 bg-slate-950/40 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h5 className="text-xs font-black uppercase text-amber-400 tracking-wider">Create Custom Platform Role</h5>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold font-sans">Role Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Specialist"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-xs text-white rounded-lg p-2 outline-none font-semibold font-sans animate-fade-in"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold font-sans">Description / Purpose</label>
                  <input
                    type="text"
                    placeholder="e.g. Full booking and forum moderating rules"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-xs text-white rounded-lg p-2 outline-none font-sans"
                  />
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold font-sans">Select Capabilities</label>
                  <div className="grid grid-cols-1 gap-1 bg-slate-900/50 p-2.5 rounded-xl border border-slate-900 max-h-40 overflow-y-auto">
                    {CAPABILITY_OPTIONS.map(cap => {
                      const active = selectedCaps.includes(cap);
                      return (
                        <label key={cap} className="flex items-center gap-2 text-[10.5px] text-slate-350 hover:text-white cursor-pointer py-0.5">
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => {
                              if (active) {
                                setSelectedCaps(prev => prev.filter(c => c !== cap));
                              } else {
                                setSelectedCaps(prev => [...prev, cap]);
                              }
                            }}
                            className="rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-opacity-20 text-xs cursor-pointer"
                          />
                          <span className="font-sans leading-none">{cap}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateCustomRole}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-black tracking-wide transition uppercase cursor-pointer"
                >
                  Save & Register Role
                </button>
              </div>

              {/* Roles Directory List */}
              <div className="lg:col-span-2 space-y-3">
                <h5 className="text-xs font-black uppercase text-indigo-300 tracking-wider">Active Platform Roles Directory</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {/* Default Standard Roles */}
                  <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center">
                        <strong className="text-sm font-bold text-white font-serif">Parent</strong>
                        <span className="text-[8px] bg-indigo-500/20 text-indigo-300 font-extrabold px-1.5 rounded uppercase leading-none border border-indigo-500/10">Default</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1">Standard playmate networks searcher, chat sender, and location-sharing guardian.</p>
                    </div>
                    <div className="pt-2.5 border-t border-slate-900 mt-2 flex flex-wrap gap-1">
                      {['Can View Playmates', 'Can Map Search'].map(cap => (
                        <span key={cap} className="text-[8px] bg-slate-900 text-slate-400 px-1 rounded">🛡️ {cap}</span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/30 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center">
                        <strong className="text-sm font-bold text-white font-serif">Event Organizer</strong>
                        <span className="text-[8px] bg-indigo-500/20 text-indigo-300 font-extrabold px-1.5 rounded uppercase leading-none border border-indigo-500/10">Standard</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1">Host playmate classes, coordinate parent groups, and manage ticket ledger bookings.</p>
                    </div>
                    <div className="pt-2.5 border-t border-slate-900 mt-2 flex flex-wrap gap-1">
                      {['Can Propose Event', 'Can Moderate Chats'].map(cap => (
                        <span key={cap} className="text-[8px] bg-slate-900 text-slate-400 px-1 rounded">🛡️ {cap}</span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/30 border border-indigo-800 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center">
                        <strong className="text-sm font-bold text-white font-serif">Portfolio Professional</strong>
                        <span className="text-[8px] bg-indigo-500/20 text-indigo-300 font-extrabold px-1.5 rounded uppercase leading-none border border-indigo-500/10">Portfolio</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1">Register child specialties, configure consult rates, and manage customer queues.</p>
                    </div>
                    <div className="pt-2.5 border-t border-slate-900 mt-2 flex flex-wrap gap-1">
                      {['Can Edit Specialist Fees', 'Can Approve Portfolios'].map(cap => (
                        <span key={cap} className="text-[8px] bg-slate-900 text-slate-400 px-1 rounded">🛡️ {cap}</span>
                      ))}
                    </div>
                  </div>

                  {/* Custom Roles */}
                  {customRoles.map(cr => (
                    <div key={cr.name} className="p-4 rounded-xl bg-slate-900/40 border border-amber-500/25 flex flex-col justify-between hover:border-amber-500/50 transition">
                      <div>
                        <div className="flex justify-between items-center">
                          <strong className="text-sm font-bold text-amber-200 font-serif">{cr.name}</strong>
                          <span className="text-[8px] bg-amber-500/20 text-amber-300 font-extrabold px-1.5 rounded uppercase leading-none border border-amber-500/15">Custom</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed mt-1">{cr.description}</p>
                      </div>
                      <div className="pt-2.5 border-t border-slate-900 mt-2 flex flex-wrap gap-1">
                        {cr.capabilities && cr.capabilities.length > 0 ? (
                          cr.capabilities.map(cap => (
                            <span key={cap} className="text-[8px] bg-slate-950 text-amber-300 border border-amber-500/10 px-1 rounded">🛡️ {cap}</span>
                          ))
                        ) : (
                          <span className="text-[8px] text-slate-600 italic">No custom caps</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* BULK COMMISSION RULES HUB */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Box 1: Bulk Commission setting */}
            <div className="bg-gradient-to-tr from-purple-50 to-indigo-50 border border-purple-150/40 rounded-3xl p-6 space-y-4">
              <span className="text-[10px] uppercase font-black tracking-widest text-purple-700 bg-white/70 px-2 py-0.5 rounded border border-purple-200">
                Bulk Override tools
              </span>
              <h4 className="font-bold text-slate-800 font-serif leading-none mt-1">
                ⚙️ Global Commissions Overrides Manager
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Configure percentage commission debits applied globally across ALL newly registered child specialists portfolios & neighborhood events bookings standard Razorpay split routines.
              </p>

              <div className="pt-2 flex items-center gap-3">
                <div className="relative w-32 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={bulkCommissionValue}
                    onChange={(e) => setBulkCommissionValue(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-purple-200 focus:border-purple-400 rounded-xl outline-none font-black text-center text-sm"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-black text-xs text-slate-400 pointer-events-none">%</span>
                </div>

                <button
                  onClick={handleApplyBulkCommission}
                  className="px-5 py-3 bg-purple-900 text-white font-bold text-xs hover:bg-purple-850 rounded-xl transition cursor-pointer shrink-0"
                >
                  Apply & Override in Bulk
                </button>
              </div>
            </div>

            {/* Box 2: Commission Split ledger overview */}
            <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 font-mono tracking-widest">Commission splitting audit</span>
                <h4 className="font-bold text-white font-serif tracking-tight mt-1">Platform Treasury & Splits</h4>
                <p className="text-[11.5px] text-slate-405 leading-relaxed mt-2">
                  All transaction values booked are parsed dynamically through Razorpay securely. Admin commissions are dynamically split upon payment verification. Output displays payout ledger.
                </p>
              </div>

              <div className="pt-4 grid grid-cols-3 gap-3 text-center border-t border-slate-800 mt-2">
                <div>
                  <span className="text-[8px] uppercase text-slate-500 font-bold">Sales Gross</span>
                  <strong className="block text-sm text-slate-100">₹{totalAmountBooked}</strong>
                </div>
                <div>
                  <span className="text-[8px] uppercase text-emerald-500 font-bold">Commissions Profit</span>
                  <strong className="block text-sm text-emerald-400">₹{totalCommissionEarned}</strong>
                </div>
                <div>
                  <span className="text-[8px] uppercase text-slate-500 font-bold">Merchant Payout</span>
                  <strong className="block text-sm text-slate-300">₹{totalOrganizerPayout}</strong>
                </div>
              </div>
            </div>

          </div>

          {/* INDIVIDUAL CONFIGURATION HUB */}
          <div className="bg-white border border-slate-100 rounded-[32px] p-6 space-y-6">
            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 font-serif">
              ⚖️ Individual Commission overrides for Events & Portfolios
            </h4>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Event individual override column */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase text-orange-600 block">Individual Events setup</span>
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  {eventsList.map((evt) => (
                    <div key={evt.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold block text-slate-800 truncate max-w-[180px]">{evt.title}</span>
                        <span className="text-[10px] text-slate-405">Category: {evt.category} • Price: ₹{evt.ticketPrice || 0}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">Rate:</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={evt.commissionPercentage ?? globalCommissionRate}
                          onChange={(e) => {
                            const newRate = Number(e.target.value);
                            setEventsList(prev => prev.map(item => item.id === evt.id ? { ...item, commissionPercentage: newRate } : item));
                            triggerToast(`Updated individual override rate to ${newRate}% for event "${evt.title}"`);
                          }}
                          className="w-14 p-1 bg-white border border-slate-200 rounded font-black text-center"
                        />
                        <span className="font-bold text-slate-500">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specialists individual override column */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase text-indigo-600 block">Individual Specialists setup</span>
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  {specialistsList.map((spec) => (
                    <div key={spec.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold block text-slate-800">{spec.name}</span>
                        <span className="text-[10px] text-slate-405">{spec.title} • Fee: ₹{spec.sessionFee}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">Rate:</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={spec.commissionPercentage ?? globalCommissionRate}
                          onChange={(e) => {
                            const newRate = Number(e.target.value);
                            setSpecialistsList(prev => prev.map(item => item.id === spec.id ? { ...item, commissionPercentage: newRate } : item));
                            triggerToast(`Updated individual override rate to ${newRate}% for specialist "${spec.name}"`);
                          }}
                          className="w-14 p-1 bg-white border border-slate-200 rounded font-black text-center"
                        />
                        <span className="font-bold text-slate-500">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* DIRECT RAZORPAY LEDGER */}
          <div className="bg-white border border-slate-100 rounded-[32px] p-6 space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 font-serif flex items-center gap-1.5">
              <FileText className="w-5 h-5 text-indigo-500" /> Razorpay Direct Splits Ledgers (Actual verified bookings)
            </h4>

            {bookingsList.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold">No validated booking transactions present yet.</p>
                <p className="text-[11px] text-slate-400 font-sans">Bookings done on events or specialist calendars populate standard ledger automatically.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">
                      <th className="py-2.5 px-3">Transaction ID (Razorpay)</th>
                      <th className="py-2.5 px-3">Client (Buyer)</th>
                      <th className="py-2.5 px-3">Consultant / Event Name</th>
                      <th className="py-2.5 px-3">Gross Fee</th>
                      <th className="py-2.5 px-3 font-semibold text-orange-650">Treasury split count</th>
                      <th className="py-2.5 px-3 font-semibold text-emerald-650">Host split payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-705">
                    {bookingsList.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-3 font-mono font-bold text-[10px] text-slate-800">{log.razorpayPaymentId}</td>
                        <td className="py-3.5 px-3 font-medium text-slate-500">{log.buyerName} ({log.buyerEmail})</td>
                        <td className="py-3.5 px-3 text-slate-700">{log.itemTitle}</td>
                        <td className="py-3.5 px-3">₹{log.amountPaid}</td>
                        <td className="py-3.5 px-3 text-orange-600">
                          ₹{log.commissionEarned} ({log.commissionPercentage}%)
                        </td>
                        <td className="py-3.5 px-3 text-emerald-600">
                          ₹{log.hostEarned}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
        )
      )}

    </div>
  );
}
