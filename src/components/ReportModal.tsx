import React, { useState } from 'react';
import { ChildProfile } from '../types.ts';
import { ShieldAlert, Check, X } from 'lucide-react';

interface ReportModalProps {
  profile: ChildProfile;
  onClose: () => void;
}

export default function ReportModal({ profile, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('Bullying or harmful behavior');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div id="report-modal-wrapper" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-y-auto">
      <div id="report-box" className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 transform scale-100 transition-all duration-300 flex flex-col max-h-[85vh] my-auto">
        <div id="report-header" className="px-6 py-4 bg-orange-500 text-white flex justify-between items-center shrink-0">
          <h3 id="report-modal-title" className="font-bold text-sm tracking-wide uppercase flex items-center gap-1.5 font-serif">
            <ShieldAlert className="w-5 h-5 text-white" /> Report {profile.childName}'s profile
          </h3>
          <button 
            id="btn-close-report-cross"
            onClick={onClose} 
            className="text-white hover:text-orange-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div id="report-success" className="p-8 text-center space-y-3 animate-fade-in overflow-y-auto">
            <div id="check-icon-box" className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 font-serif">Incident Logged Securely</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Thank you for keeping Vernunt safe and supportive. Our parental advisory specialists will review this profile within 2 hours.
            </p>
          </div>
        ) : (
          <form id="report-form" onSubmit={handleSubmitReport} className="p-6 space-y-4 overflow-y-auto">
            <p className="text-xs text-slate-500">
              Your feedback is fully anonymous. Help us reinforce our rigorous safety commitments.
            </p>

            <div id="group-report-reason" className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Primary Safety Concern</label>
              <select
                id="select-report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-orange-100"
              >
                <option value="Bullying or harmful behavior">Unsafe playing / bullying incidents</option>
                <option value="Fake parent information">Fake parent or neighborhood details</option>
                <option value="Safety check breaches">Incomplete vaccinations / health checks</option>
                <option value="Inappropriate items listed">Inappropriate profile photos or avatars</option>
              </select>
            </div>

            <div id="group-report-details" className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Additional Context</label>
              <textarea
                id="input-report-details"
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please share explicit concerns (such as specific park events, sibling notes, or behaviors)..."
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div id="report-action-panel" className="pt-2 flex justify-end gap-2 text-xs">
              <button
                id="btn-close-report"
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                id="btn-submit-report"
                type="submit"
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md cursor-pointer"
              >
                Submit Flag to Advisory
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
