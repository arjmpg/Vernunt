import React, { useState } from 'react';
import { CareBookingRequest, CareBookingStatus, ChildProfile } from '../types.ts';
import { 
  X, ShieldCheck, MapPin, Phone, Clock, Calendar, Lock, 
  CheckCircle2, AlertTriangle, MessageSquare, Play, Check, 
  Baby, Sparkles, AlertOctagon, HeartHandshake
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CareHandshakeModalProps {
  booking: CareBookingRequest;
  currentUserProfile: ChildProfile | null;
  onClose: () => void;
  onUpdateBookingStatus: (bookingId: string, newStatus: CareBookingStatus, logNote?: string) => void;
  onOpenChatWithUser?: (opponentId: string) => void;
}

export default function CareHandshakeModal({
  booking,
  currentUserProfile,
  onClose,
  onUpdateBookingStatus,
  onOpenChatWithUser
}: CareHandshakeModalProps) {
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [activeActivity, setActiveActivity] = useState<string>('Snack Time');
  const [activityNote, setActivityNote] = useState<string>('');

  const isParent = currentUserProfile?.id === booking.parentId || (!currentUserProfile && booking.senderRole === 'parent');
  const isProvider = !isParent;

  // Verify PIN for Drop-Off
  const handleVerifyDropOffPin = () => {
    if (pinInput.trim() === booking.dropOffPin) {
      setPinError('');
      onUpdateBookingStatus(booking.id, 'Dropped Off', 'Drop-off verified with 4-digit security PIN.');
      confetti({ particleCount: 80, spread: 60 });
    } else {
      setPinError('Invalid PIN. Please enter the 4-digit Drop-off PIN provided by the parent.');
    }
  };

  // Verify PIN for Pickup
  const handleVerifyPickupPin = () => {
    if (pinInput.trim() === booking.pickupPin) {
      setPinError('');
      onUpdateBookingStatus(booking.id, 'Completed', 'Child picked up successfully. Care session completed.');
      confetti({ particleCount: 120, spread: 80 });
    } else {
      setPinError('Invalid PIN. Please enter the 4-digit Pickup PIN.');
    }
  };

  const handleAddActivityLog = () => {
    if (activeActivity) {
      const note = activityNote.trim() || `Status updated: ${activeActivity}`;
      onUpdateBookingStatus(booking.id, 'In Care', note);
      setActivityNote('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-orange-950 p-5 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
              🛡️ Care Session Pass
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              booking.status === 'Accepted' || booking.status === 'Dropped Off' || booking.status === 'In Care'
                ? 'bg-emerald-500 text-white'
                : booking.status === 'Completed'
                ? 'bg-blue-500 text-white'
                : 'bg-amber-500 text-slate-950'
            }`}>
              {booking.status}
            </span>
          </div>

          <h3 className="font-serif font-black text-xl text-white leading-tight">
            {booking.childName}'s Care Session
          </h3>
          <p className="text-xs text-orange-200 mt-1">
            {booking.providerTitle} • {booking.providerName}
          </p>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* Key Overview Cards */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Date & Window</span>
              <span className="font-bold text-slate-900 block mt-0.5">{booking.date}</span>
              <span className="text-slate-600 font-semibold">{booking.startTime} - {booking.endTime} ({booking.durationHours}h)</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Total Amount</span>
              <span className="font-mono text-base font-black text-rose-700 block mt-0.5">
                {booking.totalAmount === 0 ? '🎁 ₹0 Free' : `₹${booking.totalAmount}`}
              </span>
              <span className="text-[10px] text-slate-500">₹{booking.providerHourlyRate}/hr rate</span>
            </div>
          </div>

          {/* Child & Parent Profile Box */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-200 text-rose-800 font-black flex items-center justify-center text-base shrink-0">
                👶
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-900">
                  {booking.childName}, {booking.childAge} yrs ({booking.childGender || 'Kid'})
                </h4>
                <p className="text-[11px] text-slate-600">
                  Parent: {booking.parentName} • Ph: {booking.parentPhone}
                </p>
              </div>
            </div>

            <a
              href={`tel:${booking.parentPhone}`}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition shrink-0"
              title="Call Parent"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>

          {/* Special Instructions */}
          {booking.specialInstructions && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950">
              <span className="font-bold block mb-0.5">📝 Parent Instructions:</span>
              <span>{booking.specialInstructions}</span>
            </div>
          )}

          {/* Handshake Security PIN Box */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Security Handshake PINs</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                Anti-fraud Protection
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-300 block uppercase font-bold">1. Drop-Off PIN</span>
                <span className="font-mono text-2xl font-black text-amber-400 tracking-widest block">
                  {booking.dropOffPin}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  {isParent ? 'Share with caregiver upon drop-off' : 'Ask parent upon kid drop-off'}
                </span>
              </div>

              <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-300 block uppercase font-bold">2. Pickup PIN</span>
                <span className="font-mono text-2xl font-black text-emerald-400 tracking-widest block">
                  {booking.pickupPin}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  {isParent ? 'Share with caregiver upon pickup' : 'Ask parent upon kid pickup'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive State Transitions */}
          {/* 1. If Pending */}
          {booking.status === 'Pending' && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-3">
              <p className="text-xs font-bold text-amber-900 text-center">
                {isProvider
                  ? 'Would you like to accept this child sitting request?'
                  : 'Waiting for neighbour / playhome to confirm request.'}
              </p>

              {isProvider ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateBookingStatus(booking.id, 'Declined', 'Caregiver declined time slot.')}
                    className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateBookingStatus(booking.id, 'Accepted', 'Caregiver accepted request.')}
                    className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Accept Care Request
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onUpdateBookingStatus(booking.id, 'Cancelled', 'Cancelled by parent.')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel Request
                </button>
              )}
            </div>
          )}

          {/* 2. If Accepted -> Ready for Drop-Off Handshake */}
          {booking.status === 'Accepted' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-3">
              <h5 className="font-extrabold text-xs text-blue-950 flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-blue-600" />
                <span>Confirm Child Drop-Off Handshake</span>
              </h5>

              {isProvider ? (
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Enter the 4-digit Drop-off PIN given by parent:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="e.g. 4829"
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-center font-mono font-black text-base text-slate-900 focus:outline-blue-600 tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyDropOffPin}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition cursor-pointer"
                    >
                      Verify & Start Sitting
                    </button>
                  </div>
                  {pinError && <p className="text-[10px] text-rose-600 font-bold">{pinError}</p>}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-blue-900">
                    When you drop off {booking.childName}, share Drop-Off PIN <strong>{booking.dropOffPin}</strong> with {booking.providerName} to start the session.
                  </p>
                  <button
                    type="button"
                    onClick={() => onUpdateBookingStatus(booking.id, 'Dropped Off', 'Parent marked child dropped off.')}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Mark as Dropped Off with Caregiver
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. If In Care / Dropped Off -> Live Session Activity & Pickup */}
          {(booking.status === 'Dropped Off' || booking.status === 'In Care' || booking.status === 'Ready for Pickup') && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Live Care Session Active</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-800">
                  Ends at {booking.endTime}
                </span>
              </div>

              {/* Provider Quick Care Update */}
              {isProvider && (
                <div className="space-y-2 pt-2 border-t border-emerald-200">
                  <span className="text-[11px] font-bold text-slate-800 block">Post Quick Activity Update:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Snack Time 🍎', 'Nap Time 💤', 'Lego Play 🧱', 'Story Time 📖', 'Ready for Pickup 🚗'].map((act) => (
                      <button
                        key={act}
                        type="button"
                        onClick={() => {
                          setActiveActivity(act);
                          onUpdateBookingStatus(booking.id, act.includes('Pickup') ? 'Ready for Pickup' : 'In Care', `Activity: ${act}`);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-[10px] font-bold rounded-full transition cursor-pointer"
                      >
                        {act}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Pickup Handshake */}
              <div className="pt-2 border-t border-emerald-200">
                {isProvider ? (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Enter Parent Pickup PIN to Complete & Checkout:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={4}
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        placeholder="e.g. 7391"
                        className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-center font-mono font-black text-base text-slate-900 focus:outline-emerald-600 tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyPickupPin}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl transition cursor-pointer"
                      >
                        Verify & Complete
                      </button>
                    </div>
                    {pinError && <p className="text-[10px] text-rose-600 font-bold">{pinError}</p>}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onUpdateBookingStatus(booking.id, 'Completed', 'Parent confirmed child pickup.')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Picked Up Child & Complete Session
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activity Logs Timeline */}
          {booking.careActivityLog && booking.careActivityLog.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Session Activity Feed
              </span>
              <div className="space-y-1.5">
                {booking.careActivityLog.map((log, i) => (
                  <div key={i} className="text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center justify-between text-slate-700">
                    <span className="font-semibold">{log.activity} {log.note ? `• ${log.note}` : ''}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emergency Helpline */}
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-900 text-xs">
              <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <span className="font-bold block leading-tight">Emergency Support SOS</span>
                <span className="text-[10px] text-rose-700">24/7 Vernunt Family Helpline</span>
              </div>
            </div>
            <a
              href={`tel:${booking.emergencyContact || '112'}`}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1"
            >
              <Phone className="w-3 h-3" /> Quick SOS
            </a>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Close
          </button>
          
          <button
            type="button"
            onClick={() => {
              if (onOpenChatWithUser) {
                onOpenChatWithUser(booking.providerId);
                onClose();
              }
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4 text-orange-400" /> Direct Chat
          </button>
        </div>

      </div>
    </div>
  );
}
