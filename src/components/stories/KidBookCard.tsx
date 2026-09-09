import React, { useState } from 'react';
import { 
  Book, 
  Sparkles, 
  Award, 
  Instagram, 
  ArrowRight, 
  Plus, 
  Eye, 
  Layers, 
  Edit3, 
  HelpCircle, 
  Mail, 
  MessageSquare, 
  Check, 
  X,
  ShieldCheck
} from 'lucide-react';
import { KidBookProfile, getBookThemeForCategory } from '../../data/kidStories.ts';

interface KidBookCardProps {
  book: KidBookProfile;
  onOpenBook: (book: KidBookProfile) => void;
  onAddStoryToKid?: (kidName: string, nextChapter: number) => void;
  onOpenInstagram?: (book: KidBookProfile) => void;
  isAdmin?: boolean;
  currentUser?: any;
  onEditStory?: (book: KidBookProfile) => void;
}

export const KidBookCard: React.FC<KidBookCardProps> = ({
  book,
  onOpenBook,
  onAddStoryToKid,
  onOpenInstagram,
  isAdmin = false,
  currentUser = null,
  onEditStory
}) => {
  const [showParentHelpTooltip, setShowParentHelpTooltip] = useState(false);
  const [helpRequestSent, setHelpRequestSent] = useState(false);

  const theme = getBookThemeForCategory(book.category, book.kidName);

  // Determine if user has admin privileges
  const isAdminUser = Boolean(
    isAdmin || 
    currentUser?.userRole === 'Admin' || 
    currentUser?.email === 'ardha@vernunt.com' || 
    currentUser?.email === 'arjunmpgupta@gmail.com' ||
    currentUser?.role === 'Admin'
  );

  const handleContactAdminClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowParentHelpTooltip(prev => !prev);
  };

  const handleSendAdminMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const mailto = `mailto:support@vernunt.com?subject=Storybook Content Change Request: ${encodeURIComponent(book.kidName)}&body=Hello Vernunt Editorial Admin,%0D%0A%0D%0AI would like to request changes to ${encodeURIComponent(book.kidName)}'s storybook (Category: ${encodeURIComponent(book.category)}).%0D%0A%0D%0ADetails of changes requested:%0D%0A`;
    window.open(mailto, '_blank');
    setHelpRequestSent(true);
    setTimeout(() => {
      setHelpRequestSent(false);
      setShowParentHelpTooltip(false);
    }, 2500);
  };

  return (
    <div
      onClick={() => onOpenBook(book)}
      className="group relative cursor-pointer select-none transition-all duration-300 hover:-translate-y-1.5 focus-within:ring-2 focus-within:ring-amber-500 rounded-2xl"
    >
      {/* 3D Physical Book Shadow & Stacked Page Layers Effect */}
      <div className="absolute -inset-1.5 bg-black/40 rounded-2xl blur-md -z-10 group-hover:blur-lg group-hover:bg-black/55 transition-all" />
      
      {/* Stacked Paper Pages Edge on the right & bottom */}
      <div className="absolute right-0 top-1 bottom-1 w-3 bg-[#eadecd] rounded-r-md border-r-2 border-y border-[#c8bba8] shadow-inner -z-5 flex flex-col justify-around py-2">
        <div className="h-[1px] bg-stone-300 w-full" />
        <div className="h-[1px] bg-stone-300 w-full" />
        <div className="h-[1px] bg-stone-300 w-full" />
        <div className="h-[1px] bg-stone-300 w-full" />
      </div>

      {/* The Hardcover Exterior */}
      <div
        className={`relative w-full rounded-2xl bg-gradient-to-br ${theme.bg} border-2 ${theme.border} p-5 sm:p-6 text-white overflow-hidden shadow-2xl flex flex-col justify-between min-h-[390px] sm:min-h-[430px] transition-all`}
        style={{
          boxShadow: 'inset 4px 0 10px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.15), 0 15px 35px -5px rgba(0,0,0,0.5)'
        }}
      >
        {/* Book Spine Crease on Left Edge */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/60 via-black/25 to-transparent pointer-events-none z-10" />
        <div className="absolute left-3.5 top-0 bottom-0 w-[1px] bg-white/10 pointer-events-none z-10" />

        {/* Satin Bookmark Ribbon from Top */}
        <div className={`absolute top-0 right-14 w-4 h-12 ${theme.ribbon} shadow-md z-10 rounded-b-xs transform -translate-y-1 group-hover:translate-y-0 transition-transform`}>
          <div className="absolute bottom-0 inset-x-0 h-2 bg-black/20" />
        </div>

        {/* Ornate Gold Filigree Corner Accents */}
        <div className="absolute top-2 left-5 w-4 h-4 border-t-2 border-l-2 border-amber-300/40 rounded-tl-sm pointer-events-none" />
        <div className="absolute bottom-2 left-5 w-4 h-4 border-b-2 border-l-2 border-amber-300/40 rounded-bl-sm pointer-events-none" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-300/40 rounded-tr-sm pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-300/40 rounded-br-sm pointer-events-none" />

        {/* Top Header: Vol & Category Badge + Admin Edit Icon or Parent Helper Tooltip */}
        <div className="relative z-20 flex items-start justify-between gap-2 pl-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono tracking-widest text-amber-200/90 uppercase flex items-center gap-1 font-semibold">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Vol. {book.chapterCount} • Chronicles of Achievement</span>
            </span>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-xs text-[10px] font-bold text-stone-200 border border-white/15 w-fit">
              {book.category}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* ADMIN USER: Edit Storybook Cover Icon */}
            {isAdminUser ? (
              <button
                type="button"
                id={`btn-admin-edit-${book.kidName.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEditStory) {
                    onEditStory(book);
                  } else {
                    onOpenBook(book);
                  }
                }}
                title="Admin: Edit Storybook & Content"
                className="p-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black rounded-full transition shadow-md cursor-pointer active:scale-95 flex items-center gap-1 border border-amber-200"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold pr-1 hidden sm:inline">Edit</span>
              </button>
            ) : (
              /* PARENT USER: Contact Admin for Changes Helper Tooltip */
              <div className="relative">
                <button
                  type="button"
                  id={`btn-contact-admin-${book.kidName.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={handleContactAdminClick}
                  title="Contact Admin for Changes"
                  className="p-1.5 bg-white/15 hover:bg-white/25 text-amber-200 hover:text-white rounded-full transition border border-white/20 shadow-xs cursor-pointer active:scale-95 flex items-center"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>

                {/* Helper Tooltip Popover */}
                {showParentHelpTooltip && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-2 w-64 p-3 bg-stone-900/95 text-white rounded-2xl shadow-2xl border border-amber-400/40 text-left z-50 animate-fade-in space-y-2 backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                      <div className="flex items-center gap-1 text-amber-400 text-xs font-bold font-serif">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Editorial Verification</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowParentHelpTooltip(false)}
                        className="text-stone-400 hover:text-white p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-stone-300 leading-relaxed">
                      To preserve verified child achievements, published storybooks are protected. 
                      Need to update milestones, photos, or text?
                    </p>

                    <button
                      type="button"
                      onClick={handleSendAdminMessage}
                      className="w-full py-1.5 px-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-[10px] rounded-lg transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      {helpRequestSent ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Request Dispatched!</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-3 h-3" />
                          <span>Contact Admin for Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Instagram Share Icon */}
            {book.instagramUrl && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenInstagram?.(book);
                }}
                title="Share on Instagram"
                className="p-1.5 bg-pink-600/80 hover:bg-pink-600 text-white rounded-full transition shadow-xs cursor-pointer active:scale-95"
              >
                <Instagram className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Child Portrait Badge with Ornate Cameo Frame */}
        <div className="relative z-10 my-4 flex flex-col items-center text-center pl-2">
          <div className="relative p-1 rounded-full bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 shadow-lg group-hover:scale-105 transition-transform duration-300">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-stone-900 bg-stone-800">
              <img
                src={book.photoUrl}
                alt={book.kidName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-amber-500 text-stone-950 font-black text-[9px] rounded-full uppercase tracking-tight shadow-xs border border-amber-300">
              {book.kidAge} Yrs
            </div>
          </div>

          {/* Child Name & City in Classical Book Typography */}
          <div className="mt-3 space-y-1">
            <h3 className="text-xl sm:text-2xl font-serif font-extrabold tracking-normal text-amber-100 group-hover:text-amber-300 transition-colors line-clamp-1">
              {book.kidName}
            </h3>
            <p className="text-xs text-stone-300 font-medium">
              {book.kidCity.split('(')[0].trim()}
            </p>
          </div>
        </div>

        {/* Latest Milestone Quote / Summary */}
        <div className="relative z-10 pl-2 space-y-2">
          <div className="bg-black/30 backdrop-blur-xs border border-white/10 rounded-xl p-2.5 text-xs text-stone-200 italic font-serif leading-relaxed line-clamp-2">
            "{book.latestStory.summary}"
          </div>

          {/* Chapters & Milestones Tag */}
          <div className="flex items-center justify-between text-[11px] text-stone-300 pt-1">
            <span className="flex items-center gap-1 font-bold text-amber-300">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{book.chapterCount} {book.chapterCount > 1 ? 'Stories / Chapters' : 'Story / Chapter'}</span>
            </span>
            <span className="flex items-center gap-1 text-stone-400 text-[10px]">
              <Eye className="w-3 h-3" /> {book.totalViews} reads
            </span>
          </div>
        </div>

        {/* Bottom Actions: Open Book & Add Chapter */}
        <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between gap-2 pl-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenBook(book);
            }}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Book className="w-3.5 h-3.5" />
            <span>Open Storybook</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-1 transition-transform" />
          </button>

          {onAddStoryToKid && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddStoryToKid(book.kidName, book.chapterCount + 1);
              }}
              title="Add a new milestone story to this child's book"
              className="p-2 bg-white/15 hover:bg-white/25 text-amber-200 hover:text-white rounded-xl transition border border-white/20 flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default KidBookCard;
