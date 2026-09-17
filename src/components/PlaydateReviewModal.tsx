import React, { useState } from 'react';
import { ChildProfile } from '../types.ts';
import { submitPlaydateReview } from '../services/reviewService.ts';
import { Star, ShieldCheck, Heart, Sparkles, X, AlertTriangle, CheckCircle2, MessageSquare, Tag } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

interface PlaydateReviewModalProps {
  targetProfile: ChildProfile;
  currentUserProfile: ChildProfile | null;
  onClose: () => void;
  playdateId?: string;
  playdateTitle?: string;
  onReviewSubmitted?: () => void;
}

const EXPERIENCE_TAGS = [
  'Kind & Sharing',
  'Safe Supervision',
  'Punctual & Reliable',
  'Super Clean Space',
  'Creative Play',
  'Respectful Family',
  'High Energy Fun',
  'Great Communicator',
  'Healthy Snacks',
  'Quiet & Gentle Play'
];

const RATING_LABELS: Record<number, { text: string; color: string; desc: string }> = {
  1: { text: 'Disappointing', color: 'text-red-500', desc: 'Had significant difficulties or safety concerns' },
  2: { text: 'Needs Improvement', color: 'text-amber-500', desc: 'Communication or playstyle was mismatched' },
  3: { text: 'Good Playdate', color: 'text-yellow-600', desc: 'Pleasant time with friendly interaction' },
  4: { text: 'Very Fun & Friendly', color: 'text-lime-600', desc: 'Great connection, kids played very well' },
  5: { text: 'Wonderful Experience!', color: 'text-emerald-600', desc: 'Exceptional hospitality, safety, and joy' }
};

export function PlaydateReviewModal({
  targetProfile,
  currentUserProfile,
  onClose,
  playdateId,
  playdateTitle,
  onReviewSubmitted
}: PlaydateReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [clickedStar, setClickedStar] = useState<number | null>(null);
  const [childInteractionRating, setChildInteractionRating] = useState<number>(5);
  const [hospitalityRating, setHospitalityRating] = useState<number>(5);
  const [safetyRating, setSafetyRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Kind & Sharing', 'Punctual & Reliable']);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitResult, setSubmitResult] = useState<{
    status: 'approved' | 'pending' | 'flagged';
    message: string;
    flagReason?: string;
  } | null>(null);

  const handleSelectRating = (starVal: number) => {
    setRating(starVal);
    setClickedStar(starVal);
    setTimeout(() => {
      setClickedStar((current) => (current === starVal ? null : current));
    }, 650);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      if (selectedTags.length >= 5) return;
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim() || reviewText.trim().length < 15) {
      alert('Please write at least 15 characters describing your playdate experience.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { review, moderation } = await submitPlaydateReview({
        targetProfileId: targetProfile.id,
        targetChildName: targetProfile.childName,
        targetParentName: targetProfile.parentName,
        reviewerProfileId: currentUserProfile?.id || 'user-current',
        reviewerParentName: currentUserProfile?.parentName || 'Verified Parent',
        reviewerChildName: currentUserProfile?.childName || 'Child',
        reviewerPhotoUrl: currentUserProfile?.parentPhotoUrl || currentUserProfile?.photoUrl || '',
        reviewerAadhaarVerified: !!currentUserProfile?.aadhaarVerified,
        playdateId: playdateId || undefined,
        playdateTitle: playdateTitle || `Playdate with ${targetProfile.childName}`,
        rating,
        reviewText: reviewText.trim(),
        experienceTags: selectedTags,
        childInteractionRating,
        parentHospitalityRating: hospitalityRating,
        safetyRating,
        verifiedPlaydate: true
      });

      setIsSubmitting(false);

      if (moderation.status === 'approved') {
        confetti({
          particleCount: 70,
          spread: 50,
          origin: { y: 0.7 }
        });
        setSubmitResult({
          status: 'approved',
          message: 'Your feedback has been approved and published to the community profile!'
        });
      } else if (moderation.status === 'pending') {
        setSubmitResult({
          status: 'pending',
          message: 'Thank you! Your feedback has been received and is queued for standard moderator review.',
          flagReason: moderation.flagReason
        });
      } else {
        setSubmitResult({
          status: 'flagged',
          message: 'Your feedback was flagged by our Automated Abuse Shield for moderator verification before it can appear publicly.',
          flagReason: moderation.flagReason
        });
      }

      onReviewSubmitted?.();
    } catch (err) {
      console.error('Error submitting review', err);
      setIsSubmitting(false);
      alert('Failed to submit review. Please try again.');
    }
  };

  const activeStarValue = hoverRating || rating;
  const currentRatingInfo = RATING_LABELS[activeStarValue] || RATING_LABELS[5];

  return (
    <div
      id="playdate-review-modal"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[140] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-auto animate-fade-in space-y-0">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl text-white shadow-xs">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight font-serif flex items-center gap-1.5">
                Rate Playdate Experience
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Feedback for <span className="font-bold text-amber-400">{targetProfile.childName}</span> &amp; {targetProfile.parentName}
              </p>
            </div>
          </div>
          <button
            id="btn-close-review-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="Close review modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[80vh] overflow-y-auto space-y-5">
          {submitResult ? (
            <div className="text-center py-6 space-y-4 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-200">
                {submitResult.status === 'approved' ? (
                  <CheckCircle2 className="w-9 h-9" />
                ) : (
                  <ShieldCheck className="w-9 h-9 text-amber-500" />
                )}
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-900 font-serif">
                  {submitResult.status === 'approved' ? 'Feedback Published!' : 'Feedback Submitted for Moderation'}
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  {submitResult.message}
                </p>
              </div>

              {submitResult.flagReason && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800 text-left max-w-md mx-auto space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Automated Moderation Notice:
                  </span>
                  <p className="opacity-90">{submitResult.flagReason}</p>
                </div>
              )}

              <div className="pt-3">
                <button
                  id="btn-done-review"
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition active:scale-95 cursor-pointer shadow-md"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Target Profile Card Badge */}
              <div className="flex items-center gap-3 p-3 bg-orange-50/60 border border-orange-100 rounded-2xl">
                <img
                  src={targetProfile.photoUrl || targetProfile.parentPhotoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'}
                  alt={targetProfile.childName}
                  className="w-12 h-12 rounded-xl object-cover border border-orange-200"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate font-serif">
                    {targetProfile.childName} ({targetProfile.childAge} yrs)
                  </h4>
                  <p className="text-xs text-slate-500 truncate">
                    Parent: {targetProfile.parentName} • {targetProfile.location?.address?.split(',')[0] || 'Bangalore'}
                  </p>
                  {playdateTitle && (
                    <span className="inline-block mt-0.5 text-[10px] font-semibold text-orange-700 bg-white/80 px-2 py-0.5 rounded-md border border-orange-200">
                      📅 {playdateTitle}
                    </span>
                  )}
                </div>
              </div>

              {/* Star Rating Selector */}
              <div className="bg-gradient-to-b from-slate-50 to-amber-50/30 p-4 rounded-3xl border border-amber-100/60 text-center space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Overall Rating
                  </label>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-amber-700 border border-amber-200/80 shadow-3xs">
                    {activeStarValue} of 5 Stars
                  </span>
                </div>

                {/* Animated Star Rating Bar */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 py-2">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = starVal <= activeStarValue;
                    const isHovered = hoverRating === starVal;
                    const isSelected = rating === starVal;
                    const isClicked = clickedStar === starVal;

                    return (
                      <motion.button
                        key={starVal}
                        id={`btn-star-rating-${starVal}`}
                        type="button"
                        onClick={() => handleSelectRating(starVal)}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(0)}
                        whileHover={{ scale: 1.26, y: -4 }}
                        whileTap={{ scale: 0.88, rotate: -8 }}
                        animate={
                          isClicked
                            ? {
                                scale: [1, 1.42, 0.94, 1.08, 1],
                                rotate: [0, -14, 10, -4, 0],
                              }
                            : { scale: 1, rotate: 0 }
                        }
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 18,
                        }}
                        className="relative p-2 focus:outline-none cursor-pointer rounded-2xl group touch-manipulation select-none"
                        title={`${starVal} Star${starVal > 1 ? 's' : ''}`}
                        aria-label={`Rate ${starVal} out of 5 stars`}
                      >
                        {/* Interactive Click Ripple Ring */}
                        {isClicked && (
                          <motion.span
                            className="absolute inset-0 rounded-full border-2 border-amber-400 pointer-events-none -z-10"
                            initial={{ scale: 0.4, opacity: 1 }}
                            animate={{ scale: 2.2, opacity: 0 }}
                            transition={{ duration: 0.55, ease: "easeOut" }}
                          />
                        )}

                        {/* Star Icon with dynamic drop-shadow and glow */}
                        <Star
                          className={`w-9 h-9 sm:w-10 sm:h-10 transition-colors duration-200 ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_2px_10px_rgba(251,191,36,0.6)]'
                              : 'text-slate-300 hover:text-amber-200'
                          } ${isHovered ? 'brightness-110' : ''}`}
                        />

                        {/* Interactive Selection Dot indicator */}
                        {isSelected && !hoverRating && (
                          <motion.span
                            layoutId="active-star-dot"
                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-500 shadow-xs"
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Animated Descriptive Rating Tag & Subtext */}
                <div className="min-h-[42px] flex flex-col justify-center overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStarValue}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      className="space-y-0.5"
                    >
                      <p className={`text-sm font-black ${currentRatingInfo.color} flex items-center justify-center gap-1.5`}>
                        <span>{currentRatingInfo.text}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {currentRatingInfo.desc}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Experience Tags */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-orange-500" />
                    Experience Highlights (Select up to 5)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {selectedTags.length}/5 selected
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {EXPERIENCE_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition cursor-pointer border ${
                          isSelected
                            ? 'bg-orange-500 text-white border-orange-500 shadow-2xs font-semibold'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-Ratings (Child Interaction, Hospitality, Safety) */}
              <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 text-xs">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Specific Dimension Ratings
                </span>
                
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-700 font-medium">Children Got Along / Shared Toys:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <motion.button
                        key={val}
                        type="button"
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setChildInteractionRating(val)}
                        className={`w-5 h-5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                          val <= childInteractionRating ? 'bg-amber-400 text-slate-900 shadow-3xs' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {val}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-700 font-medium">Parent Communication &amp; Hospitality:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <motion.button
                        key={val}
                        type="button"
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setHospitalityRating(val)}
                        className={`w-5 h-5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                          val <= hospitalityRating ? 'bg-amber-400 text-slate-900 shadow-3xs' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {val}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-700 font-medium">Environment Safety &amp; Cleanliness:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <motion.button
                        key={val}
                        type="button"
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSafetyRating(val)}
                        className={`w-5 h-5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                          val <= safetyRating ? 'bg-amber-400 text-slate-900 shadow-3xs' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {val}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Short Text Review */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="review-text-input" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                    Short Text Review
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {reviewText.length}/500 chars (min 15)
                  </span>
                </div>
                <textarea
                  id="review-text-input"
                  rows={3}
                  maxLength={500}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share details about the playdate: How did the kids interact? What games or toys did they play with? How was the guardian coordination?"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 outline-none focus:ring-4 focus:ring-orange-200 focus:bg-white transition"
                  required
                />
              </div>

              {/* Child Safety & Community Trust Notice */}
              <div className="p-3 bg-sky-50 border border-sky-100 rounded-2xl text-[11px] text-sky-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <p className="leading-tight">
                  <strong>Vernunt Safety Shield:</strong> All reviews are verified against automated abuse and spam filters. Private phone numbers and external advertising links are strictly prohibited.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-playdate-review"
                  type="submit"
                  disabled={isSubmitting || reviewText.trim().length < 15}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/20 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Verifying & Submitting...' : 'Post Playdate Review'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
