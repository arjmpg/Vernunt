import React, { useState, useEffect, useMemo } from 'react';
import { PlaydateReview } from '../../types.ts';
import {
  getAllReviews,
  updateReviewModerationStatus,
  deletePlaydateReview,
  subscribeToReviews
} from '../../services/reviewService.ts';
import {
  ShieldAlert,
  ShieldCheck,
  Star,
  Check,
  X,
  Flag,
  Trash2,
  Filter,
  Search,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  Calendar,
  ThumbsUp,
  Clock,
  Sparkles
} from 'lucide-react';

export function AdminReviewModerationDesk() {
  const [reviews, setReviews] = useState<PlaydateReview[]>([]);
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'pending' | 'flagged' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesText, setNotesText] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const refreshList = () => {
    setReviews(getAllReviews());
  };

  useEffect(() => {
    refreshList();
    const unsub = subscribeToReviews(() => {
      refreshList();
    });
    return () => unsub();
  }, []);

  const counts = useMemo(() => {
    return {
      all: reviews.length,
      pending: reviews.filter(r => r.status === 'pending').length,
      flagged: reviews.filter(r => r.status === 'flagged').length,
      approved: reviews.filter(r => r.status === 'approved').length,
      rejected: reviews.filter(r => r.status === 'rejected').length
    };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      if (activeStatusFilter !== 'all' && r.status !== activeStatusFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const text = (r.reviewText || '').toLowerCase();
        const target = (r.targetChildName || '' + r.targetParentName || '').toLowerCase();
        const reviewer = (r.reviewerParentName || '' + r.reviewerChildName || '').toLowerCase();
        return text.includes(query) || target.includes(query) || reviewer.includes(query);
      }
      return true;
    });
  }, [reviews, activeStatusFilter, searchTerm]);

  const handleAction = async (reviewId: string, newStatus: 'approved' | 'rejected' | 'flagged') => {
    await updateReviewModerationStatus(reviewId, newStatus, 'System Administrator');
    setFeedbackMsg(`Review successfully marked as ${newStatus.toUpperCase()}`);
    setTimeout(() => setFeedbackMsg(null), 3000);
    refreshList();
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this review record?')) return;
    await deletePlaydateReview(reviewId);
    setFeedbackMsg('Review permanently deleted.');
    setTimeout(() => setFeedbackMsg(null), 3000);
    refreshList();
  };

  const handleSaveNotes = async (reviewId: string) => {
    const r = reviews.find(item => item.id === reviewId);
    if (!r) return;
    await updateReviewModerationStatus(reviewId, r.status, 'System Administrator', notesText);
    setEditingNotesId(null);
    setFeedbackMsg('Moderation notes saved.');
    setTimeout(() => setFeedbackMsg(null), 3000);
    refreshList();
  };

  return (
    <div id="admin-review-moderation-desk" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl text-white shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold font-serif text-slate-900">
              Playdate Reviews &amp; Moderation Console
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Audit parent feedback, manage retaliatory low-rating quarantine, and inspect automated abuse filter triggers across neighborhood playdates.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshList}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Reviews</span>
          <p className="text-2xl font-bold text-slate-900 font-serif mt-1">{counts.all}</p>
        </div>
        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/60 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending Audit
          </span>
          <p className="text-2xl font-bold text-amber-900 font-serif mt-1">{counts.pending}</p>
        </div>
        <div className="bg-red-50/70 p-4 rounded-2xl border border-red-200/60 shadow-2xs">
          <span className="text-[10px] font-bold text-red-700 uppercase flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Flagged / Shield
          </span>
          <p className="text-2xl font-bold text-red-900 font-serif mt-1">{counts.flagged}</p>
        </div>
        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/60 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Approved Active
          </span>
          <p className="text-2xl font-bold text-emerald-900 font-serif mt-1">{counts.approved}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Rejected Spam</span>
          <p className="text-2xl font-bold text-slate-700 font-serif mt-1">{counts.rejected}</p>
        </div>
      </div>

      {/* Filter Tabs & Search Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {(['all', 'pending', 'flagged', 'approved', 'rejected'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setActiveStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeStatusFilter === st
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <span className="capitalize">{st}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeStatusFilter === st
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {counts[st]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or keyword..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Reviews Table / Card List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-slate-100 text-center text-slate-400 space-y-2 shadow-xs">
            <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700 font-serif">No Reviews Found</h4>
            <p className="text-xs text-slate-500">
              There are no reviews matching the selected moderation status or search query.
            </p>
          </div>
        ) : (
          filteredReviews.map((r) => {
            const isFlagged = r.status === 'flagged';
            const isPending = r.status === 'pending';
            const isApproved = r.status === 'approved';
            const isRejected = r.status === 'rejected';

            return (
              <div
                key={r.id}
                id={`admin-review-item-${r.id}`}
                className={`bg-white rounded-3xl p-5 border transition-all duration-200 shadow-2xs space-y-4 ${
                  isFlagged
                    ? 'border-red-200 bg-red-50/10'
                    : isPending
                    ? 'border-amber-200 bg-amber-50/10'
                    : isRejected
                    ? 'border-slate-200 opacity-60'
                    : 'border-slate-100'
                }`}
              >
                {/* Header Row: Target Profile & Reviewer Info */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      {r.reviewerPhotoUrl ? (
                        <img
                          src={r.reviewerPhotoUrl}
                          alt={r.reviewerParentName}
                          className="w-11 h-11 rounded-2xl object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm">
                          {r.reviewerParentName[0] || 'P'}
                        </div>
                      )}
                      {r.reviewerAadhaarVerified && (
                        <span
                          className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border border-white shadow-2xs"
                          title="Aadhaar Verified Parent"
                        >
                          <ShieldCheck className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">
                          {r.reviewerParentName}
                        </span>
                        {r.reviewerChildName && (
                          <span className="text-xs text-slate-500">
                            (Parent of {r.reviewerChildName})
                          </span>
                        )}
                        <span className="text-xs text-slate-400">reviewed</span>
                        <span className="font-bold text-xs text-orange-700 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
                          {r.targetChildName} &amp; {r.targetParentName}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <div className="flex items-center gap-1 text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                r.rating >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                          <span className="font-bold text-slate-700 ml-1">
                            {r.rating}.0
                          </span>
                        </div>

                        <span className="text-slate-300">•</span>

                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(r.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 self-start">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPending
                          ? 'bg-amber-100 text-amber-800'
                          : isFlagged
                          ? 'bg-red-100 text-red-800 animate-pulse'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isFlagged && <AlertTriangle className="w-3 h-3" />}
                      {isPending && <Clock className="w-3 h-3" />}
                      {isApproved && <ShieldCheck className="w-3 h-3" />}
                      {r.status}
                    </span>
                  </div>
                </div>

                {/* Review Text */}
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                  "{r.reviewText}"
                </div>

                {/* Tags & Sub-Ratings */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  {r.experienceTags && r.experienceTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {r.experienceTags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md text-[11px] font-medium"
                        >
                          ✓ {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    {r.childInteractionRating && (
                      <span>Kids Interaction: <strong>{r.childInteractionRating}/5</strong></span>
                    )}
                    {r.parentHospitalityRating && (
                      <span>Hospitality: <strong>{r.parentHospitalityRating}/5</strong></span>
                    )}
                    {r.safetyRating && (
                      <span>Safety: <strong>{r.safetyRating}/5</strong></span>
                    )}
                  </div>
                </div>

                {/* Moderation Flag / Abuse Alert Box */}
                {(r.flagReason || (r.reportedBy && r.reportedBy.length > 0)) && (
                  <div className="p-3 bg-red-50 border border-red-200/80 rounded-2xl text-xs text-red-900 space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-red-700">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                      Moderation Alert:
                    </span>
                    <p className="opacity-90">{r.flagReason}</p>
                    {r.reportReason && (
                      <p className="text-[11px] text-red-800">
                        Parent Report Reason: <em>"{r.reportReason}"</em> (Reported by {r.reportedBy?.length} parent)
                      </p>
                    )}
                  </div>
                )}

                {/* Internal Moderation Notes */}
                {editingNotesId === r.id ? (
                  <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <label className="text-[11px] font-bold text-slate-700 uppercase">
                      Admin Moderation Notes:
                    </label>
                    <textarea
                      rows={2}
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="Add notes explaining reason for approval, rejection, or warning..."
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingNotesId(null)}
                        className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveNotes(r.id)}
                        className="px-3 py-1 text-xs bg-slate-900 text-white font-bold rounded-lg"
                      >
                        Save Notes
                      </button>
                    </div>
                  </div>
                ) : (
                  r.moderationNotes && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                      <span>
                        <strong>Admin Notes:</strong> {r.moderationNotes}{' '}
                        {r.moderatedBy && `(by ${r.moderatedBy})`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNotesId(r.id);
                          setNotesText(r.moderationNotes || '');
                        }}
                        className="text-orange-600 hover:underline font-bold text-[10px]"
                      >
                        Edit
                      </button>
                    </div>
                  )
                )}

                {/* Action Buttons Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {!isApproved && (
                      <button
                        type="button"
                        onClick={() => handleAction(r.id, 'approved')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs active:scale-95 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve &amp; Publish
                      </button>
                    )}

                    {!isRejected && (
                      <button
                        type="button"
                        onClick={() => handleAction(r.id, 'rejected')}
                        className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl active:scale-95 transition flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Reject / Hide
                      </button>
                    )}

                    {!isFlagged && (
                      <button
                        type="button"
                        onClick={() => handleAction(r.id, 'flagged')}
                        className="px-3.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 font-bold text-xs rounded-xl active:scale-95 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Flag className="w-3.5 h-3.5" /> Flag for Abuse
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!r.moderationNotes && editingNotesId !== r.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNotesId(r.id);
                          setNotesText('');
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 transition"
                      >
                        + Add Note
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      title="Permanently Delete Review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
