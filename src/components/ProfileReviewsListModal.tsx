import React, { useState, useEffect } from 'react';
import { ChildProfile, PlaydateReview } from '../types.ts';
import {
  getReviewsForProfile,
  getAverageRatingForProfile,
  toggleHelpfulVote,
  reportPlaydateReview,
  subscribeToReviews
} from '../services/reviewService.ts';
import {
  Star,
  ShieldCheck,
  ThumbsUp,
  Flag,
  X,
  MessageSquare,
  Sparkles,
  Filter,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  User
} from 'lucide-react';

interface ProfileReviewsListModalProps {
  targetProfile: ChildProfile;
  currentUserProfile: ChildProfile | null;
  onClose: () => void;
  onOpenLeaveReview: () => void;
}

export function ProfileReviewsListModal({
  targetProfile,
  currentUserProfile,
  onClose,
  onOpenLeaveReview
}: ProfileReviewsListModalProps) {
  const [reviews, setReviews] = useState<PlaydateReview[]>([]);
  const [stats, setStats] = useState(() => getAverageRatingForProfile(targetProfile.id));
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>('Inappropriate / Abusive Language');
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);

  const refreshData = () => {
    const list = getReviewsForProfile(targetProfile.id, currentUserProfile?.id);
    setReviews(list);
    setStats(getAverageRatingForProfile(targetProfile.id));
  };

  useEffect(() => {
    refreshData();
    const unsub = subscribeToReviews(() => {
      refreshData();
    });
    return () => unsub();
  }, [targetProfile.id, currentUserProfile?.id]);

  const handleHelpful = async (reviewId: string) => {
    const voterId = currentUserProfile?.id || 'guest-user';
    await toggleHelpfulVote(reviewId, voterId);
    refreshData();
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingReviewId) return;

    const reporterId = currentUserProfile?.id || 'guest-user';
    await reportPlaydateReview(reportingReviewId, reporterId, reportReason);
    setReportingReviewId(null);
    setReportSuccessMsg('Review reported to community moderators for immediate safety audit.');
    setTimeout(() => setReportSuccessMsg(null), 4000);
    refreshData();
  };

  const filteredReviews = reviews.filter((r) => {
    if (ratingFilter === 'all') return true;
    return Math.round(r.rating) === ratingFilter;
  });

  return (
    <div
      id={`reviews-list-modal-${targetProfile.id}`}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[135] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-auto animate-fade-in space-y-0">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl text-white shadow-xs">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight font-serif flex items-center gap-1.5">
                Playdate Ratings &amp; Reviews
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                {targetProfile.childName} ({targetProfile.childAge} yrs) • Parent: {targetProfile.parentName}
              </p>
            </div>
          </div>
          <button
            id="btn-close-reviews-list-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 max-h-[80vh] overflow-y-auto space-y-5">
          {reportSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{reportSuccessMsg}</span>
            </div>
          )}

          {/* Average Rating Scorecard */}
          <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/50 p-5 rounded-3xl border border-amber-100/80 shadow-xs flex flex-col sm:flex-row items-center sm:items-stretch gap-5">
            {/* Left Big Score */}
            <div className="flex flex-col items-center justify-center text-center sm:border-r sm:border-amber-200/60 sm:pr-5 shrink-0">
              <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 font-serif leading-none">
                {stats.averageRating > 0 ? stats.averageRating : '—'}
              </span>
              <div className="flex items-center gap-1 my-1.5 text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      stats.averageRating >= s
                        ? 'fill-amber-400 text-amber-400'
                        : stats.averageRating >= s - 0.5
                        ? 'fill-amber-300 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] font-bold text-slate-600">
                {stats.totalReviews} Verified Review{stats.totalReviews === 1 ? '' : 's'}
              </span>
            </div>

            {/* Right: Star distribution bars */}
            <div className="flex-1 w-full space-y-1.5 justify-center flex flex-col">
              {[5, 4, 3, 2, 1].map((starLevel) => {
                const count = stats.ratingDistribution[starLevel as 1 | 2 | 3 | 4 | 5] || 0;
                const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={starLevel} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <span className="w-3 text-right font-bold text-slate-700">{starLevel}</span>
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <div className="flex-1 h-2 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-[10px] text-slate-500 font-mono">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Highlights Tags */}
          {stats.topTags.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Top Parent Compliments
              </span>
              <div className="flex flex-wrap gap-1.5">
                {stats.topTags.map(({ tag, count }) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2.5 py-1 rounded-full font-semibold"
                  >
                    <span>✨ {tag}</span>
                    <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-full font-mono font-bold">
                      {count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Row: Filter + Leave Review Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-1">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3 text-slate-400" /> Filter:
              </span>
              {(['all', 5, 4, 3, 2, 1] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setRatingFilter(lvl)}
                  className={`text-[11px] px-2.5 py-1 rounded-xl font-bold transition cursor-pointer shrink-0 ${
                    ratingFilter === lvl
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lvl === 'all' ? 'All' : `${lvl} ★`}
                </button>
              ))}
            </div>

            <button
              id="btn-open-add-review"
              type="button"
              onClick={onOpenLeaveReview}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" /> Rate Experience
            </button>
          </div>

          {/* Reviews List */}
          <div className="space-y-3">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-500">
                  {ratingFilter === 'all'
                    ? 'No reviews yet for this family. Be the first to leave feedback after a playdate!'
                    : `No ${ratingFilter}-star reviews found.`}
                </p>
              </div>
            ) : (
              filteredReviews.map((r) => (
                <div
                  key={r.id}
                  id={`review-card-${r.id}`}
                  className={`p-4 rounded-2xl border transition ${
                    r.status === 'pending'
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-white border-slate-100 hover:border-slate-200 shadow-2xs'
                  }`}
                >
                  {/* Top Bar of Review */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      {r.reviewerPhotoUrl ? (
                        <img
                          src={r.reviewerPhotoUrl}
                          alt={r.reviewerParentName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900">
                            {r.reviewerParentName}
                          </span>
                          {r.reviewerChildName && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              (Parent of {r.reviewerChildName})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 mt-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                r.rating >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                          <span className="text-[10px] text-slate-400 font-semibold ml-1">
                            {new Date(r.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {r.verifiedPlaydate && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold"
                          title="Verified Playdate Match on Vernunt"
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span className="hidden sm:inline">Verified Match</span>
                        </span>
                      )}

                      {r.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-extrabold uppercase">
                          Pending Moderation
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Playdate title badge if available */}
                  {r.playdateTitle && (
                    <div className="mb-2 text-[10px] font-medium text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{r.playdateTitle}</span>
                    </div>
                  )}

                  {/* Review Text */}
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    "{r.reviewText}"
                  </p>

                  {/* Experience Tags */}
                  {r.experienceTags && r.experienceTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {r.experienceTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                        >
                          ✓ {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bottom Action Footer: Helpful & Report */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleHelpful(r.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg transition cursor-pointer ${
                        r.helpfulVoters?.includes(currentUserProfile?.id || 'guest-user')
                          ? 'bg-amber-50 text-amber-700 font-bold'
                          : 'hover:bg-slate-100 text-slate-500'
                      }`}
                      title="Mark review as helpful"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>Helpful ({r.helpfulCount || 0})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReportingReviewId(r.id)}
                      className="text-slate-400 hover:text-red-500 transition flex items-center gap-1 cursor-pointer"
                      title="Report review to moderators"
                    >
                      <Flag className="w-3 h-3" />
                      <span>Report</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reporting Modal Drawer */}
        {reportingReviewId && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="font-bold text-sm font-serif text-slate-900">
                  Report Review for Moderation
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                Vernunt is dedicated to safe, respectful parent community reviews. Select the violation category:
              </p>

              <form onSubmit={handleReportSubmit} className="space-y-3">
                {[
                  'Inappropriate / Abusive Language',
                  'Retaliatory / False Accusation',
                  'Personal Contact Leak / Doxxing',
                  'Spam / Commercial Advertisement',
                  'Playdate Never Occurred'
                ].map((reason) => (
                  <label
                    key={reason}
                    className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition"
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={reportReason === reason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="text-red-500 focus:ring-red-400"
                    />
                    <span>{reason}</span>
                  </label>
                ))}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setReportingReviewId(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
