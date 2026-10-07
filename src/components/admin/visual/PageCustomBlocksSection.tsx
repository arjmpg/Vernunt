import React, { useState, useEffect } from 'react';
import { 
  getVisualBlocksForPage, 
  deleteVisualBlock, 
  saveVisualBlock,
  isVisualEditModeActive,
  VisualBlock 
} from '../../../services/visualCmsService.ts';
import { 
  Edit3, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, 
  AlertCircle, CheckCircle2, Info, AlertTriangle, 
  ExternalLink, Sparkles, Plus, Image as ImageIcon
} from 'lucide-react';

interface PageCustomBlocksSectionProps {
  pageId: string;
  position?: 'top' | 'bottom';
  isAdmin?: boolean;
  onOpenAddBlock?: (pageId: string) => void;
}

export function PageCustomBlocksSection({
  pageId,
  position = 'top',
  isAdmin = false,
  onOpenAddBlock
}: PageCustomBlocksSectionProps) {
  const [blocks, setBlocks] = useState<VisualBlock[]>(() => getVisualBlocksForPage(pageId));
  const [isEditMode, setIsEditMode] = useState<boolean>(() => isVisualEditModeActive());
  const [editingBlock, setEditingBlock] = useState<VisualBlock | null>(null);

  useEffect(() => {
    const handleCmsChange = (e: any) => {
      if (!e.detail?.pageId || e.detail.pageId === pageId) {
        setBlocks(getVisualBlocksForPage(pageId));
        setIsEditMode(isVisualEditModeActive());
      }
    };

    window.addEventListener('vernunt_visual_cms_change', handleCmsChange);
    return () => window.removeEventListener('vernunt_visual_cms_change', handleCmsChange);
  }, [pageId]);

  const handleDelete = (blockId: string) => {
    if (confirm('Are you sure you want to delete this custom block from this page?')) {
      deleteVisualBlock(blockId, pageId);
    }
  };

  const handleToggleVisibility = (block: VisualBlock) => {
    saveVisualBlock({ ...block, isVisible: !block.isVisible });
  };

  const handleSaveBlockEdit = (updated: VisualBlock) => {
    saveVisualBlock(updated);
    setEditingBlock(null);
  };

  if (blocks.length === 0 && (!isAdmin || !isEditMode)) {
    return null;
  }

  return (
    <div className="w-full space-y-4 my-3 font-sans">
      {/* Admin Visual Helper when in Edit Mode */}
      {isAdmin && isEditMode && (
        <div className="p-3 bg-amber-50/90 border-2 border-dashed border-amber-300 rounded-2xl flex items-center justify-between text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-amber-200/80 text-amber-800">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="font-bold">
              Admin Custom Blocks Area ({blocks.length} active block{blocks.length === 1 ? '' : 's'})
            </span>
            <span className="font-mono text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              page: {pageId} ({position})
            </span>
          </div>
          {onOpenAddBlock && (
            <button
              type="button"
              onClick={() => onOpenAddBlock(pageId)}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Block</span>
            </button>
          )}
        </div>
      )}

      {/* Render Blocks */}
      {blocks.map((block) => (
        <div 
          key={block.id} 
          className={`relative transition-all ${
            isAdmin && isEditMode ? 'p-2 rounded-2xl ring-2 ring-amber-400/60 bg-amber-50/20' : ''
          }`}
        >
          {/* Admin Block Control Bar */}
          {isAdmin && isEditMode && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-950/85 backdrop-blur-xs text-white p-1 rounded-xl shadow-lg z-30">
              <span className="text-[10px] font-mono px-2 text-amber-300 font-bold">
                {block.type.toUpperCase()}
              </span>
              <button
                type="button"
                onClick={() => setEditingBlock(block)}
                title="Edit Block Content"
                className="p-1.5 hover:bg-white/20 rounded-lg text-amber-400 hover:text-white transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(block.id)}
                title="Delete Block"
                className="p-1.5 hover:bg-rose-500/30 rounded-lg text-rose-400 hover:text-rose-200 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Block Content Renderers */}
          {block.type === 'hero' && (
            <div 
              className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl"
              style={{
                backgroundColor: block.bgColor || '#1e1b4b',
                color: block.textColor || '#ffffff'
              }}
            >
              <div className="relative z-10 max-w-2xl space-y-3">
                {block.badgeText && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-xs border border-white/20">
                    {block.badgeText}
                  </span>
                )}
                {block.title && <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{block.title}</h2>}
                {block.subtitle && <p className="text-sm sm:text-base opacity-90 leading-relaxed">{block.subtitle}</p>}
                {block.content && <p className="text-xs sm:text-sm opacity-80 whitespace-pre-line">{block.content}</p>}
                {block.buttonText && block.buttonLink && (
                  <a
                    href={block.buttonLink}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-xs sm:text-sm hover:bg-slate-100 transition shadow-md mt-2"
                  >
                    <span>{block.buttonText}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              {block.imageUrl && (
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-30 sm:opacity-50 pointer-events-none">
                  <img src={block.imageUrl} alt={block.imageAlt || ''} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}

          {block.type === 'alert' && (
            <div 
              className={`p-4 rounded-2xl flex items-start gap-3 border shadow-xs ${
                block.severity === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : block.severity === 'danger'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : block.severity === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {block.severity === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                {block.severity === 'danger' && <AlertCircle className="w-5 h-5 text-rose-600" />}
                {block.severity === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {(!block.severity || block.severity === 'info') && <Info className="w-5 h-5 text-blue-600" />}
              </div>
              <div className="space-y-1 text-xs sm:text-sm flex-1">
                {block.title && <h4 className="font-bold">{block.title}</h4>}
                {block.content && <p className="leading-relaxed whitespace-pre-line">{block.content}</p>}
              </div>
            </div>
          )}

          {block.type === 'banner' && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
              <div className="space-y-1 text-center sm:text-left">
                {block.title && <h4 className="font-black text-sm sm:text-base">{block.title}</h4>}
                {block.subtitle && <p className="text-xs text-indigo-100">{block.subtitle}</p>}
              </div>
              {block.buttonText && block.buttonLink && (
                <a
                  href={block.buttonLink}
                  className="px-4 py-2 bg-white text-indigo-950 font-bold text-xs rounded-xl hover:bg-slate-100 transition shrink-0"
                >
                  {block.buttonText}
                </a>
              )}
            </div>
          )}

          {block.type === 'text' && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              {block.title && <h3 className="text-base font-bold text-slate-900">{block.title}</h3>}
              {block.subtitle && <h4 className="text-xs font-semibold text-slate-500">{block.subtitle}</h4>}
              {block.content && <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">{block.content}</p>}
            </div>
          )}

          {block.type === 'image' && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs">
              {block.imageUrl && (
                <img 
                  src={block.imageUrl} 
                  alt={block.imageAlt || 'Page media'} 
                  className="w-full max-h-96 object-cover" 
                />
              )}
              {(block.title || block.content) && (
                <div className="p-4 space-y-1">
                  {block.title && <h4 className="font-bold text-sm text-slate-900">{block.title}</h4>}
                  {block.content && <p className="text-xs text-slate-600">{block.content}</p>}
                </div>
              )}
            </div>
          )}

          {block.type === 'card' && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
              {block.imageUrl && (
                <img src={block.imageUrl} alt={block.imageAlt || ''} className="w-20 h-20 rounded-xl object-cover shrink-0" />
              )}
              <div className="flex-1 space-y-1 text-center sm:text-left">
                {block.badgeText && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {block.badgeText}
                  </span>
                )}
                {block.title && <h4 className="font-bold text-sm text-slate-900">{block.title}</h4>}
                {block.content && <p className="text-xs text-slate-600">{block.content}</p>}
              </div>
              {block.buttonText && block.buttonLink && (
                <a
                  href={block.buttonLink}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shrink-0"
                >
                  {block.buttonText}
                </a>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Edit Block Modal */}
      {editingBlock && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-[99999]"
          onClick={() => setEditingBlock(null)}
        >
          <div 
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                <span>Edit {editingBlock.type.toUpperCase()} Block</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingBlock(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title / Headline</label>
                <input
                  type="text"
                  value={editingBlock.title || ''}
                  onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="Enter block title..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subtitle / Tagline</label>
                <input
                  type="text"
                  value={editingBlock.subtitle || ''}
                  onChange={(e) => setEditingBlock({ ...editingBlock, subtitle: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="Enter subtitle..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Body Text Content</label>
                <textarea
                  rows={4}
                  value={editingBlock.content || ''}
                  onChange={(e) => setEditingBlock({ ...editingBlock, content: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
                  placeholder="Enter body text..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  value={editingBlock.imageUrl || ''}
                  onChange={(e) => setEditingBlock({ ...editingBlock, imageUrl: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={editingBlock.buttonText || ''}
                    onChange={(e) => setEditingBlock({ ...editingBlock, buttonText: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="e.g. Shop Now"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Button Link / Hash</label>
                  <input
                    type="text"
                    value={editingBlock.buttonLink || ''}
                    onChange={(e) => setEditingBlock({ ...editingBlock, buttonLink: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                    placeholder="e.g. /store or #deal"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingBlock(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveBlockEdit(editingBlock)}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default PageCustomBlocksSection;
