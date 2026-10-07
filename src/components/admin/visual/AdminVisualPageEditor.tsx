import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Edit3, Plus, RotateCcw, Eye, EyeOff, 
  Trash2, Layers, Check, X, Sliders, Save, Download, 
  Upload, ExternalLink, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { 
  isVisualEditModeActive, 
  setVisualEditModeActive,
  saveVisualBlock, 
  resetPageVisualOverrides,
  exportVisualCmsJson,
  importVisualCmsJson,
  VisualBlock,
  VisualBlockType,
  getAllVisualBlocks
} from '../../../services/visualCmsService.ts';

interface AdminVisualPageEditorProps {
  currentPageId: string;
  isAdmin: boolean;
  onNavigateTab?: (tab: string) => void;
}

export function AdminVisualPageEditor({
  currentPageId,
  isAdmin,
  onNavigateTab
}: AdminVisualPageEditorProps) {
  const [isEditMode, setIsEditMode] = useState<boolean>(() => isVisualEditModeActive());
  const [isBarExpanded, setIsBarExpanded] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportData, setExportData] = useState<string>('');
  const [importInput, setImportInput] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Block Form State
  const [newBlockType, setNewBlockType] = useState<VisualBlockType>('banner');
  const [newBlockTitle, setNewBlockTitle] = useState<string>('');
  const [newBlockSubtitle, setNewBlockSubtitle] = useState<string>('');
  const [newBlockContent, setNewBlockContent] = useState<string>('');
  const [newBlockImage, setNewBlockImage] = useState<string>('');
  const [newBlockButtonText, setNewBlockButtonText] = useState<string>('');
  const [newBlockButtonLink, setNewBlockButtonLink] = useState<string>('');
  const [newBlockSeverity, setNewBlockSeverity] = useState<'info' | 'success' | 'warning' | 'danger'>('info');

  useEffect(() => {
    const handleCmsChange = () => {
      setIsEditMode(isVisualEditModeActive());
    };
    window.addEventListener('vernunt_visual_cms_change', handleCmsChange);
    return () => window.removeEventListener('vernunt_visual_cms_change', handleCmsChange);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleEditMode = () => {
    const next = !isEditMode;
    setVisualEditModeActive(next);
    setIsEditMode(next);
    showToast(next ? '✏️ Visual Edit Mode Activated! Click any text, image, or block to edit.' : '👁️ Preview Mode Enabled.');
  };

  const handleResetPage = () => {
    if (confirm(`Reset all visual overrides and custom blocks on page "${currentPageId}" back to default?`)) {
      resetPageVisualOverrides(currentPageId);
      showToast(`✓ Page "${currentPageId}" reset to factory layout.`);
    }
  };

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    const newBlock: VisualBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pageId: currentPageId,
      type: newBlockType,
      title: newBlockTitle || undefined,
      subtitle: newBlockSubtitle || undefined,
      content: newBlockContent || undefined,
      imageUrl: newBlockImage || undefined,
      buttonText: newBlockButtonText || undefined,
      buttonLink: newBlockButtonLink || undefined,
      severity: newBlockSeverity,
      order: Date.now(),
      isVisible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveVisualBlock(newBlock);
    setShowAddModal(false);
    
    // Reset form
    setNewBlockTitle('');
    setNewBlockSubtitle('');
    setNewBlockContent('');
    setNewBlockImage('');
    setNewBlockButtonText('');
    setNewBlockButtonLink('');

    showToast(`✓ New ${newBlockType.toUpperCase()} block added to ${currentPageId}!`);
  };

  // Only render if verified system administrator
  if (!isAdmin) {
    return null;
  }

  return (
    <>
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[999999] px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-2xl shadow-2xl border border-amber-400/50 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Admin Toolbar */}
      <div 
        id="vernunt-admin-visual-toolbar"
        className="fixed bottom-4 right-4 z-[99998] font-sans transition-all duration-300"
      >
        <div className="bg-slate-950/90 backdrop-blur-md text-white border-2 border-amber-500/80 rounded-3xl shadow-2xl p-2 sm:p-2.5 flex items-center gap-2">
          
          {/* Admin Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-500/30">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-extrabold tracking-wide uppercase">Admin CMS</span>
          </div>

          {/* Current Page Tag */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-white/10 rounded-xl text-xs font-mono text-slate-200">
            <span>Page:</span>
            <span className="text-amber-400 font-bold">{currentPageId}</span>
          </div>

          {/* Toggle Edit Mode Switch */}
          <button
            type="button"
            onClick={toggleEditMode}
            className={`px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isEditMode
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 animate-pulse'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title="Toggle Live Visual Edit Mode on all pages"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditMode ? 'Edit Mode: ON' : 'Edit Mode: OFF'}</span>
          </button>

          {/* Add Block Button */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="p-2 sm:px-3 sm:py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Add a custom visual block to this page"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Block</span>
          </button>

          {/* Reset Page Overrides */}
          <button
            type="button"
            onClick={handleResetPage}
            className="p-2 sm:px-3 sm:py-1.5 bg-rose-600/30 hover:bg-rose-600/60 text-rose-300 hover:text-white rounded-2xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            title="Reset this page's visual changes to factory defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>

          {/* Backup / Export */}
          <button
            type="button"
            onClick={() => {
              setExportData(exportVisualCmsJson());
              setShowExportModal(true);
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            title="Export or Import CMS Config"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal: Add Custom Block to Page */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[999999]"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Add Custom Visual Block</h3>
                  <p className="text-xs text-slate-500">Injecting on page: <span className="font-mono text-indigo-600 font-bold">{currentPageId}</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBlock} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Select Block Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'banner', label: 'Gradient Banner', emoji: '🎨' },
                    { id: 'hero', label: 'Hero Announcement', emoji: '🌟' },
                    { id: 'alert', label: 'Notice / Alert Box', emoji: '⚠️' },
                    { id: 'text', label: 'Rich Text & Copy', emoji: '📝' },
                    { id: 'image', label: 'Showcase Image', emoji: '🖼️' },
                    { id: 'card', label: 'Action CTA Card', emoji: '🚀' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewBlockType(t.id as VisualBlockType)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                        newBlockType === t.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{t.emoji}</span>
                      <span className="truncate">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic form inputs based on type */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Block Title / Headline</label>
                <input
                  type="text"
                  value={newBlockTitle}
                  onChange={(e) => setNewBlockTitle(e.target.value)}
                  placeholder="e.g. 🌟 Exclusive Festive Offer for Bangalore Parents"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtitle / Tagline (Optional)</label>
                <input
                  type="text"
                  value={newBlockSubtitle}
                  onChange={(e) => setNewBlockSubtitle(e.target.value)}
                  placeholder="e.g. Verified by pediatrician board & Montessori specialists"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Body Text Content</label>
                <textarea
                  rows={3}
                  value={newBlockContent}
                  onChange={(e) => setNewBlockContent(e.target.value)}
                  placeholder="Write block descriptive message or terms..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {newBlockType === 'alert' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alert Severity</label>
                  <select
                    value={newBlockSeverity}
                    onChange={(e) => setNewBlockSeverity(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="info">Info (Blue)</option>
                    <option value="success">Success / Verified (Green)</option>
                    <option value="warning">Important Notice (Amber)</option>
                    <option value="danger">High Priority / Urgent (Red)</option>
                  </select>
                </div>
              )}

              {(newBlockType === 'image' || newBlockType === 'hero' || newBlockType === 'card') && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Image URL (Optional)</label>
                  <input
                    type="url"
                    value={newBlockImage}
                    onChange={(e) => setNewBlockImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Button Text (Optional)</label>
                  <input
                    type="text"
                    value={newBlockButtonText}
                    onChange={(e) => setNewBlockButtonText(e.target.value)}
                    placeholder="e.g. Explore Now"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Button Link (Optional)</label>
                  <input
                    type="text"
                    value={newBlockButtonLink}
                    onChange={(e) => setNewBlockButtonLink(e.target.value)}
                    placeholder="e.g. /store or #register"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Publish Block to {currentPageId}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Export/Import Visual CMS Config */}
      {showExportModal && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[999999]"
          onClick={() => setShowExportModal(false)}
        >
          <div 
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Visual CMS Backup &amp; Sync</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Export JSON (Current Overrides &amp; Blocks)</label>
                <textarea
                  rows={6}
                  readOnly
                  value={exportData}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Import JSON Config</label>
                <textarea
                  rows={4}
                  value={importInput}
                  onChange={(e) => setImportInput(e.target.value)}
                  placeholder="Paste exported CMS JSON here to restore or clone..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(exportData);
                  showToast('✓ CMS config copied to clipboard!');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl"
              >
                Copy JSON
              </button>

              <button
                type="button"
                onClick={() => {
                  if (importVisualCmsJson(importInput)) {
                    setShowExportModal(false);
                    showToast('✓ Successfully imported CMS config!');
                  } else {
                    alert('Invalid JSON format.');
                  }
                }}
                disabled={!importInput}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-40"
              >
                Apply Import
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default AdminVisualPageEditor;
