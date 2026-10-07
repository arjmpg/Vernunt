import React, { useState, useEffect } from 'react';
import { Edit3, Check, X, RotateCcw } from 'lucide-react';
import { 
  getElementOverride, 
  saveElementOverride, 
  deleteElementOverride,
  isVisualEditModeActive 
} from '../../../services/visualCmsService.ts';

interface VisualEditableTextProps {
  selectorKey: string;
  pageId: string;
  defaultText: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  className?: string;
  isAdmin?: boolean;
}

export function VisualEditableText({
  selectorKey,
  pageId,
  defaultText,
  as: Component = 'span',
  className = '',
  isAdmin = false
}: VisualEditableTextProps) {
  const [currentText, setCurrentText] = useState<string>(() => {
    return getElementOverride(selectorKey) ?? defaultText;
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [tempText, setTempText] = useState<string>(currentText);
  const [isEditMode, setIsEditMode] = useState<boolean>(() => isVisualEditModeActive());

  useEffect(() => {
    const handleCmsChange = () => {
      const override = getElementOverride(selectorKey);
      setCurrentText(override ?? defaultText);
      setIsEditMode(isVisualEditModeActive());
    };

    window.addEventListener('vernunt_visual_cms_change', handleCmsChange);
    return () => window.removeEventListener('vernunt_visual_cms_change', handleCmsChange);
  }, [selectorKey, defaultText]);

  const handleSave = () => {
    if (tempText.trim() === '') {
      deleteElementOverride(selectorKey, pageId);
      setCurrentText(defaultText);
    } else {
      saveElementOverride(selectorKey, pageId, 'text', tempText);
      setCurrentText(tempText);
    }
    setIsEditing(false);
  };

  const handleReset = () => {
    deleteElementOverride(selectorKey, pageId);
    setCurrentText(defaultText);
    setTempText(defaultText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempText(currentText);
    setIsEditing(false);
  };

  const hasOverride = getElementOverride(selectorKey) !== null;

  // Regular users or edit mode disabled
  if (!isAdmin || !isEditMode) {
    return <Component className={className}>{currentText}</Component>;
  }

  // Admin inline editing dialog
  if (isEditing) {
    return (
      <span className="inline-block relative p-2 bg-amber-50/95 border-2 border-amber-500 rounded-xl shadow-lg z-30">
        <textarea
          value={tempText}
          onChange={(e) => setTempText(e.target.value)}
          rows={Math.max(2, Math.min(6, tempText.split('\n').length + 1))}
          className="w-full min-w-[280px] p-2 text-sm text-slate-900 bg-white border border-amber-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-sans"
          placeholder="Edit text content..."
          autoFocus
        />
        <div className="flex items-center justify-between gap-2 mt-2">
          <span className="text-[10px] font-mono text-amber-800 font-semibold truncate max-w-[150px]">
            Key: {selectorKey}
          </span>
          <div className="flex items-center gap-1.5">
            {hasOverride && (
              <button
                type="button"
                onClick={handleReset}
                title="Reset to default text"
                className="px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleCancel}
              className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition cursor-pointer flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1 text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-md shadow-xs transition cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </span>
    );
  }

  // Admin Hover State with Edit Marker
  return (
    <Component 
      className={`relative group inline-block cursor-pointer outline-dashed outline-1 outline-amber-400/60 hover:outline-2 hover:outline-amber-500 rounded px-1 transition-all ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        setTempText(currentText);
        setIsEditing(true);
      }}
      title={`[Admin Visual Editor] Click to edit: ${selectorKey}`}
    >
      {currentText}
      <span className="opacity-0 group-hover:opacity-100 absolute -top-3.5 -right-2 bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs flex items-center gap-0.5 pointer-events-none transition-opacity z-20">
        <Edit3 className="w-2.5 h-2.5" />
        <span>Edit</span>
      </span>
      {hasOverride && (
        <span 
          className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" 
          title="Edited by Admin"
        />
      )}
    </Component>
  );
}
export default VisualEditableText;
