import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Check, X, RotateCcw, Link2 } from 'lucide-react';
import { 
  getElementOverride, 
  saveElementOverride, 
  deleteElementOverride,
  isVisualEditModeActive 
} from '../../../services/visualCmsService.ts';

interface VisualEditableImageProps {
  selectorKey: string;
  pageId: string;
  defaultSrc: string;
  alt: string;
  className?: string;
  isAdmin?: boolean;
}

export function VisualEditableImage({
  selectorKey,
  pageId,
  defaultSrc,
  alt,
  className = '',
  isAdmin = false
}: VisualEditableImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(() => {
    return getElementOverride(selectorKey) ?? defaultSrc;
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [tempSrc, setTempSrc] = useState<string>(currentSrc);
  const [isEditMode, setIsEditMode] = useState<boolean>(() => isVisualEditModeActive());

  useEffect(() => {
    const handleCmsChange = () => {
      const override = getElementOverride(selectorKey);
      setCurrentSrc(override ?? defaultSrc);
      setIsEditMode(isVisualEditModeActive());
    };

    window.addEventListener('vernunt_visual_cms_change', handleCmsChange);
    return () => window.removeEventListener('vernunt_visual_cms_change', handleCmsChange);
  }, [selectorKey, defaultSrc]);

  const handleSave = () => {
    if (tempSrc.trim() === '') {
      deleteElementOverride(selectorKey, pageId);
      setCurrentSrc(defaultSrc);
    } else {
      saveElementOverride(selectorKey, pageId, 'image', tempSrc);
      setCurrentSrc(tempSrc);
    }
    setIsEditing(false);
  };

  const handleReset = () => {
    deleteElementOverride(selectorKey, pageId);
    setCurrentSrc(defaultSrc);
    setTempSrc(defaultSrc);
    setIsEditing(false);
  };

  const hasOverride = getElementOverride(selectorKey) !== null;

  if (!isAdmin || !isEditMode) {
    return <img src={currentSrc} alt={alt} className={className} />;
  }

  return (
    <div className="relative group inline-block">
      <img 
        src={currentSrc} 
        alt={alt} 
        className={`${className} outline-dashed outline-2 outline-amber-400/80 group-hover:outline-amber-600 transition-all`} 
      />

      {/* Floating Edit Image Button */}
      <button
        type="button"
        onClick={() => {
          setTempSrc(currentSrc);
          setIsEditing(true);
        }}
        className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 bg-slate-950/80 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 transition-all cursor-pointer z-20 hover:bg-slate-900"
        title="Change Image URL or Picture"
      >
        <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
        <span>Replace Image</span>
      </button>

      {hasOverride && (
        <span 
          className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-extrabold uppercase shadow-xs tracking-wider z-10"
        >
          Custom
        </span>
      )}

      {/* Admin Image Edit Modal */}
      {isEditing && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-[99999]"
          onClick={() => setIsEditing(false)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Replace Visual Image</h4>
                  <p className="text-[11px] text-slate-500 font-mono">Key: {selectorKey}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Image URL (HTTPS or Unsplash)</span>
                </label>
                <input
                  type="url"
                  value={tempSrc}
                  onChange={(e) => setTempSrc(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              {/* Preview */}
              <div>
                <span className="block font-semibold text-slate-700 mb-1">Preview</span>
                <div className="h-32 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center">
                  {tempSrc ? (
                    <img 
                      src={tempSrc} 
                      alt="Preview" 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = defaultSrc;
                      }}
                    />
                  ) : (
                    <span className="text-slate-400 italic">No image source</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {hasOverride ? (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Image</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default VisualEditableImage;
