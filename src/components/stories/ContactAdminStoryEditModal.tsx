import React, { useState } from 'react';
import { X, ShieldAlert, Send, MessageCircle, Mail, CheckCircle2, ShieldCheck, PhoneCall, AlertCircle } from 'lucide-react';
import { KidStory } from '../../types.ts';

interface ContactAdminStoryEditModalProps {
  story: KidStory;
  isOpen: boolean;
  onClose: () => void;
}

export const ContactAdminStoryEditModal: React.FC<ContactAdminStoryEditModalProps> = ({
  story,
  isOpen,
  onClose
}) => {
  const [requestText, setRequestText] = useState('');
  const [requestType, setRequestType] = useState<'correction' | 'photo_update' | 'achievement_add' | 'other'>('correction');
  const [parentContact, setParentContact] = useState(story.parentPhone || story.parentEmail || '');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestText.trim()) return;

    // Save edit request to localStorage for admin desk queue
    try {
      const STORAGE_KEY = 'vernunt_story_edit_requests_v1';
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const newRequest = {
        id: `req-${Date.now()}`,
        storyId: story.id,
        storyTitle: story.title,
        kidName: story.kidName,
        parentName: story.parentName,
        parentContact,
        requestType,
        requestText: requestText.trim(),
        submittedAt: new Date().toISOString(),
        status: 'pending'
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([newRequest, ...existing]));
    } catch (err) {
      console.error('Failed to save edit request', err);
    }

    setSubmitted(true);
  };

  const whatsAppMessage = `Hi Vernunt Editorial Team! 👋 I am ${story.parentName}, parent of ${story.kidName}.\nI would like to request an editorial update for my child's approved story:\n\n*Story Title:* ${story.title}\n*Story ID:* ${story.id}\n*Requested Changes:* ${requestText || 'Need to update achievements/photo'}\n\nPlease help review and apply the changes. Thank you!`;

  const handleWhatsAppContact = () => {
    const waUrl = `https://wa.me/919845122345?text=${encodeURIComponent(whatsAppMessage)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleEmailContact = () => {
    const subject = `Story Edit Request: ${story.kidName} - ${story.title}`;
    const body = `Dear Vernunt Editorial Team,\n\nI am the parent of ${story.kidName} (${story.title}).\n\nRequested updates:\n${requestText || '[Please detail your changes here]'}\n\nStory ID: ${story.id}\nParent Contact: ${parentContact}\n\nThank you,\n${story.parentName}`;
    window.location.href = `mailto:editorial@vernunt.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-5 text-white flex items-center justify-between shrink-0">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-200" /> Editorial Verification Desk
            </div>
            <h3 className="text-lg font-bold font-serif">Request Story Changes</h3>
            <p className="text-xs text-amber-100">
              Approved stories are verified for digital trust & can only be modified by admins.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">Edit Request Submitted!</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Our editorial admin team has received your update request for <span className="font-bold text-slate-900">{story.kidName}</span>'s story. Changes are typically reviewed and applied within 2 to 4 hours.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={handleWhatsAppContact}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Follow Up on WhatsApp
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Policy Explanation Banner */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-[11px] text-amber-900 leading-relaxed">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Child Safety & Journalistic Integrity Policy:</span> Once an achievement story is published and approved by our editorial team, direct parent editing is locked to prevent unverified modifications. If you need any adjustments or new awards added, our editorial admins will promptly review and update it for you!
                </div>
              </div>

              {/* Story Context */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-[10px] uppercase font-mono text-slate-400">Target Story</div>
                <div className="text-xs font-bold text-slate-900 line-clamp-1">{story.title}</div>
                <div className="text-[11px] text-slate-600">
                  Child: <span className="font-semibold text-slate-800">{story.kidName}</span> ({story.kidAge} yrs) • {story.kidCity}
                </div>
              </div>

              {/* Type of change */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">What would you like to update?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'correction', label: 'Fix Typo / Details' },
                    { id: 'achievement_add', label: 'Add New Award / Medal' },
                    { id: 'photo_update', label: 'Update Child Photo' },
                    { id: 'other', label: 'Other Modification' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setRequestType(t.id as any)}
                      className={`p-2 rounded-xl text-xs font-semibold border text-left transition cursor-pointer ${
                        requestType === t.id 
                          ? 'border-orange-500 bg-orange-50 text-orange-950 font-bold ring-1 ring-orange-400' 
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Describe the changes needed <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={4}
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  placeholder="e.g. Please update Aarav's latest timing to 9.2 seconds, or add his new State Gold Medal from yesterday's championship..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 leading-relaxed resize-none"
                />
              </div>

              {/* Contact Information */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Your Contact Phone / Email</label>
                <input
                  type="text"
                  value={parentContact}
                  onChange={(e) => setParentContact(e.target.value)}
                  placeholder="+91 98451 22345 or parent@gmail.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-orange-200"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Request to Editorial Admins
                </button>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleWhatsAppContact}
                    className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Admins Directly
                  </button>

                  <button
                    type="button"
                    onClick={handleEmailContact}
                    className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-500" /> Send Email
                  </button>
                </div>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default ContactAdminStoryEditModal;
