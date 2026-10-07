import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, X, CheckCircle2, UserX, Flag, Send } from 'lucide-react';

interface SafetyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'profile' | 'child_profile' | 'post' | 'message' | 'review';
  targetId: string;
  targetName?: string;
  reporterId?: string;
  reporterEmail?: string;
}

export const SafetyReportModal: React.FC<SafetyReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
  reporterId = 'current_user',
  reporterEmail
}) => {
  const [reason, setReason] = useState<string>('child_safety_concern');
  const [details, setDetails] = useState('');
  const [blockUser, setBlockUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/safety/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId,
          reporterEmail,
          targetType,
          targetId,
          targetName: targetName || `Item (${targetId})`,
          reason,
          details
        })
      });

      const data = await res.json();
      if (data.success) {
        setSubmittedReportId(data.reportId);
        if (blockUser && targetId) {
          await fetch('/api/safety/block', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: reporterId, blockedUserId: targetId })
          }).catch(() => {});
        }
      } else {
        alert('Failed to submit report: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white text-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-950 via-rose-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-300 flex items-center justify-center border border-red-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base font-serif">Report &amp; Child Safety Escalation</h3>
              <p className="text-[11px] text-red-200">Rule 3(2) IT Rules 2021 &amp; POCSO Protection</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {submittedReportId ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-base">Report Submitted to Child Safety Moderation</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Reference ID: <strong className="font-mono text-slate-900">{submittedReportId}</strong>. Our 24/7 compliance officer has received this alert and will review it immediately under statutory timelines.
              </p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 text-left space-y-1">
              <p><strong>Statutory SLA:</strong> Acknowledgment within 24 hours &bull; Action within 15 days.</p>
              <p><strong>Emergency CSAM/POCSO:</strong> Immediate removal and referral to Indian Cybercrime Coordination Centre (I4C).</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-700">
            <div>
              <span className="text-[11px] text-slate-500 block">Reporting Target:</span>
              <strong className="text-slate-900 text-sm capitalize">
                {targetType.replace('_', ' ')}: {targetName || targetId}
              </strong>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-900 block">Select Concern Category:</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              >
                <option value="child_safety_concern">🚨 Child Safety, POCSO or Minor Protection Concern</option>
                <option value="inappropriate_communication">💬 Inappropriate Language or Grooming Behavior</option>
                <option value="harassment_bullying">⚠️ Harassment, Bullying or Intimidation</option>
                <option value="false_credentials">📑 Fake Identity, Fraudulent Doctor Badge, or Impersonation</option>
                <option value="commercial_spam">🚫 Unsolicited Commercial Spam or Unauthorized Sales</option>
                <option value="privacy_violation">🔒 Privacy Infringement (Non-consensual child photos or exact address)</option>
                <option value="other">Other Violation</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-900 block">
                Describe the specific violation or risk:
              </label>
              <textarea
                rows={3}
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please describe what happened, timestamps, or URLs to assist our compliance officer's review..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <label className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={blockUser}
                onChange={(e) => setBlockUser(e.target.checked)}
                className="w-4 h-4 rounded text-red-600 cursor-pointer"
              />
              <div>
                <span className="font-bold text-red-950 text-xs block">Also block this user</span>
                <span className="text-[10px] text-red-800">
                  They will not be able to message you or view your playmates on the radar.
                </span>
              </div>
            </label>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Confidential Report'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default SafetyReportModal;
