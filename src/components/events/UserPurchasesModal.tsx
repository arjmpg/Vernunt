import React, { useState, useEffect } from 'react';
import { X, Ticket, Calendar, Clock, MapPin, QrCode, CheckCircle2, Download, Search, AlertCircle, ArrowRight } from 'lucide-react';
import { ChildProfile, EventTicketPurchase } from '../../types.ts';
import { getUserEventPurchases } from '../../data/eventPurchases.ts';

interface UserPurchasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ChildProfile | null;
  onBrowseEvents?: () => void;
}

export const UserPurchasesModal: React.FC<UserPurchasesModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onBrowseEvents
}) => {
  const [purchases, setPurchases] = useState<EventTicketPurchase[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<EventTicketPurchase | null>(null);

  useEffect(() => {
    if (isOpen) {
      const phone = currentUser?.phone || currentUser?.phoneNumber;
      const email = (currentUser as any)?.email;
      const userPurchases = getUserEventPurchases(phone, email);
      setPurchases(userPurchases);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-auto overflow-hidden shadow-2xl border border-slate-200 relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 p-5 text-white shrink-0 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-white/20 text-white font-bold text-[10px] tracking-wider uppercase rounded-full flex items-center gap-1">
              <Ticket className="w-3 h-3" /> Event Ticket Account
            </span>
          </div>

          <h2 className="text-xl font-bold font-serif leading-tight">
            My Event Purchases & Digital Passes
          </h2>
          <p className="text-xs text-rose-100 mt-0.5">
            Registered for {currentUser?.parentName || currentUser?.childName || 'Event Attendee'} • Mobile: +91 {currentUser?.phone || currentUser?.phoneNumber || '9876543210'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {selectedTicket ? (
            /* Detailed Digital QR Pass View */
            <div className="space-y-4 animate-fade-in">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                ← Back to All Tickets
              </button>

              <div className="border-2 border-dashed border-rose-300 rounded-3xl p-6 bg-gradient-to-b from-rose-50/50 to-white text-center space-y-4 relative overflow-hidden shadow-sm">
                <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-full">
                  ✓ Verified Booking Confirmed
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 font-serif">
                    {selectedTicket.eventTitle}
                  </h3>
                  <div className="text-xs text-slate-500">
                    Booking Reference: <strong className="font-mono text-slate-800">{selectedTicket.bookingReference}</strong>
                  </div>
                </div>

                {/* QR Visual */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl w-48 h-48 mx-auto flex flex-col items-center justify-center shadow-xs">
                  <QrCode className="w-32 h-32 text-slate-900" />
                  <div className="text-[10px] font-mono text-slate-500 font-bold mt-1">
                    {selectedTicket.qrPassCode}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-left max-w-sm mx-auto text-xs bg-white p-3.5 rounded-2xl border border-slate-150">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">DATE & TIME</span>
                    <span className="font-semibold text-slate-800">{selectedTicket.eventDate} at {selectedTicket.eventTime}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">PASS TIER</span>
                    <span className="font-semibold text-slate-800">{selectedTicket.ticketTierName || 'General Pass'} ({selectedTicket.ticketQuantity}x)</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold block">VENUE LOCATION</span>
                    <span className="font-semibold text-slate-800">{selectedTicket.eventLocation}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  Show this QR code or booking reference at the venue gate for instant check-in.
                </div>
              </div>
            </div>
          ) : purchases.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <Ticket className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No ticket purchases found yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                You haven't booked any event or class passes yet. Browse community weekend workshops, art circles, and robotics bootcamps!
              </p>
              {onBrowseEvents && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onBrowseEvents();
                  }}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Explore Upcoming Events
                </button>
              )}
            </div>
          ) : (
            /* Ticket Purchases List */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>All Confirmed Bookings ({purchases.length})</span>
                <span>Mobile: +91 {currentUser?.phone || currentUser?.phoneNumber || 'Verified'}</span>
              </div>

              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:border-rose-300 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-md border border-rose-200">
                        {purchase.eventType || 'Event'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Ref: {purchase.bookingReference}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Confirmed
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {purchase.eventTitle}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-rose-500" /> {purchase.eventDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-rose-500" /> {purchase.eventTime}
                      </span>
                      <span className="flex items-center gap-1 truncate max-w-xs">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" /> {purchase.eventLocation}
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800">
                        {purchase.totalPaid === 0 ? 'FREE PASS' : `₹${purchase.totalPaid}`}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {purchase.ticketQuantity} {purchase.ticketQuantity === 1 ? 'ticket' : 'tickets'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedTicket(purchase)}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-rose-300" />
                      <span>View Pass</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-150 flex items-center justify-between text-xs text-slate-500">
          <span>Need help with your passes? Contact organizer or Vernunt support.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-700 transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default UserPurchasesModal;
