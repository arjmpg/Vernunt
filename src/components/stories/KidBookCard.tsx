import React from 'react';
import { Book, Sparkles, Award, Instagram, ArrowRight, Plus, Eye, Layers } from 'lucide-react';
import { KidBookProfile, getBookThemeForCategory } from '../../data/kidStories.ts';

interface KidBookCardProps {
  book: KidBookProfile;
  onOpenBook: (book: KidBookProfile) => void;
  onAddStoryToKid?: (kidName: string, nextChapter: number) => void;
  onOpenInstagram?: (book: KidBookProfile) => void;
}

export const KidBookCard: React.FC<KidBookCardProps> = ({
  book,
  onOpenBook,
  onAddStoryToKid,
  onOpenInstagram
}) => {
  const theme = getBookThemeForCategory(book.category, book.kidName);

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
        className={`relative w-full rounded-2xl bg-gradient-to-br ${theme.bg} border-2 ${theme.border} p-5 sm:p-6 text-white overflow-hidden shadow-2xl flex flex-col justify-between min-h-[380px] sm:min-h-[420px] transition-all`}
        style={{
          boxShadow: 'inset 4px 0 10px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.15), 0 15px 35px -5px rgba(0,0,0,0.5)'
        }}
      >
        {/* Book Spine Crease on Left Edge */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/60 via-black/25 to-transparent pointer-events-none z-10" />
        <div className="absolute left-3.5 top-0 bottom-0 w-[1px] bg-white/10 pointer-events-none z-10" />

        {/* Satin Bookmark Ribbon from Top */}
        <div className={`absolute top-0 right-7 w-4 h-12 ${theme.ribbon} shadow-md z-10 rounded-b-xs transform -translate-y-1 group-hover:translate-y-0 transition-transform`}>
          <div className="absolute bottom-0 inset-x-0 h-2 bg-black/20" />
        </div>

        {/* Ornate Gold Filigree Corner Accents */}
        <div className="absolute top-2 left-5 w-4 h-4 border-t-2 border-l-2 border-amber-300/40 rounded-tl-sm pointer-events-none" />
        <div className="absolute bottom-2 left-5 w-4 h-4 border-b-2 border-l-2 border-amber-300/40 rounded-bl-sm pointer-events-none" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-300/40 rounded-tr-sm pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-300/40 rounded-br-sm pointer-events-none" />

        {/* Top Header: Vol & Category Badge */}
        <div className="relative z-10 flex items-start justify-between gap-2 pl-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono tracking-widest text-amber-200/90 uppercase flex items-center gap-1 font-semibold">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Vol. {book.chapterCount} • Chronicles of Achievement</span>
            </span>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-xs text-[10px] font-bold text-stone-200 border border-white/15 w-fit">
              {book.category}
            </div>
          </div>

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
