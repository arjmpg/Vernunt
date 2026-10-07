import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Edit3, Plus, Trash2, RotateCcw, 
  ExternalLink, Download, Upload, Check, X, 
  Layers, Globe, Eye, EyeOff, AlertTriangle, 
  ShieldCheck, ArrowRight
} from 'lucide-react';
import { 
  getAllVisualBlocks, 
  deleteVisualBlock, 
  saveVisualBlock, 
  resetPageVisualOverrides,
  isVisualEditModeActive,
  setVisualEditModeActive,
  exportVisualCmsJson,
  importVisualCmsJson,
  VisualBlock,
  VisualBlockType
} from '../../services/visualCmsService.ts';

const PAGES_LIST = [
  { id: 'store', label: '🛍️ Vernunt Store & Shopping Catalog', path: '/store' },
  { id: 'events', label: '🎉 Events, Activities & Classes', path: '/events' },
  { id: 'knowledge', label: '📚 Child Growth Knowledge Hub', path: '/knowledge' },
  { id: 'groups', label: '🌸 Vernunt Parenting Groups & Circles', path: '/groups' },
  { id: 'home', label: '🏠 Parent Home Dashboard & Radar', path: '/' },
  { id: 'safety', label: '🛡️ Child Safety & Meetup Protection', path: '/safety' },
  { id: 'terms', label: '📄 Guardian Terms & Safe Harbor', path: '/terms' },
  { id: 'privacy', label: '🔒 Privacy Policy (DPDP Act)', path: '/privacy' }
];

export const AdminVisualCmsDesk: React.FC = () => {
  const [blocks, setBlocks] = useState<VisualBlock[]>(() => getAllVisualBlocks());
  const [selectedPageFilter, setSelectedPageFilter] = useState<string>('all');
  const [isEditMode, setIsEditMode] = useState<boolean>(() => isVisualEditModeActive());
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedPageForNewBlock, setSelectedPageForNewBlock] = useState<string>('store');
  const [newBlockType, setNewBlockType] = useState<VisualBlockType>('banner');
  const [newBlockTitle, setNewBlockTitle] = useState<string>('');
  const [newBlockSubtitle, setNewBlockSubtitle] = useState<string>('');
  const [newBlockContent, setNewBlockContent] = useState<string>('');
  const [newBlockImage, setNewBlockImage] = useState<string>('');
  const [newBlockButtonText, setNewBlockButtonText] = useState<string>('');
  const [newBlockButtonLink, setNewBlockButtonLink] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setBlocks(getAllVisualBlocks());
      setIsEditMode(isVisualEditModeActive());
    };
    window.addEventListener('vernunt_visual_cms_change', handleUpdate);
    return () => window.removeEventListener('vernunt_visual_cms_change', handleUpdate);
  }, []);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleEditMode = () => {
    const next = !isEditMode;
    setVisualEditModeActive(next);
    setIsEditMode(next);
    showToastMsg(next ? '✓ Visual Edit Mode is now active across all frontend pages!' : 'Preview mode enabled.');
  };

  const handleDelete = (blockId: string, pageId: string) => {
    if (confirm('Delete this custom block from the page?')) {
      deleteVisualBlock(blockId, pageId);
      showToastMsg('✓ Block deleted.');
    }
  };

  const handleResetPage = (pageId: string, pageLabel: string) => {
    if (confirm(`Reset all custom blocks and text overrides on "${pageLabel}" to default?`)) {
      resetPageVisualOverrides(pageId);
      showToastMsg(`✓ Reset "${pageId}" back to factory layout.`);
    }
  };

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    const newBlock: VisualBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pageId: selectedPageForNewBlock,
      type: newBlockType,
      title: newBlockTitle || undefined,
      subtitle: newBlockSubtitle || undefined,
      content: newBlockContent || undefined,
      imageUrl: newBlockImage || undefined,
      buttonText: newBlockButtonText || undefined,
      buttonLink: newBlockButtonLink || undefined,
      order: Date.now(),
      isVisible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveVisualBlock(newBlock);
    setShowAddModal(false);
    setNewBlockTitle('');
    setNewBlockSubtitle('');
    setNewBlockContent('');
    setNewBlockImage('');
    setNewBlockButtonText('');
    setNewBlockButtonLink('');
    showToastMsg(`✓ Added ${newBlockType.toUpperCase()} block to ${selectedPageForNewBlock}!`);
  };

  const filteredBlocks = selectedPageFilter === 'all' 
    ? blocks 
    : blocks.filter(b => b.pageId === selectedPageFilter);

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-[999999] px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xl border border-amber-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
              Admin Exclusive Feature
            </span>
            <span className="text-xs text-slate-400">Live In-Place Visual CMS</span>
          </div>
          <h2 className="text-2xl font-black font-serif tracking-tight">
            Visual Page Builder &amp; Frontend Content Editor
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Directly edit, add, or delete text headlines, images, and custom banner blocks across any page in Vernunt without writing code. Changes persist instantly in real time.
          </p>
        </div>

        {/* Global Edit Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={handleToggleEditMode}
            className={`px-5 py-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
              isEditMode 
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 ring-4 ring-amber-400/30 animate-pulse' 
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditMode ? 'Live Edit Mode: ACTIVE' : 'Enable Visual Edit Mode'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Block to Page</span>
          </button>
        </div>
      </div>

      {/* Pages Quick Access Grid */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-600" />
          <span>Frontend Pages &amp; In-Place Editor Shortcuts</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PAGES_LIST.map((page) => {
            const pageBlockCount = blocks.filter(b => b.pageId === page.id).length;
            return (
              <div 
                key={page.id} 
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      page: {page.id}
                    </span>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {pageBlockCount} custom block{pageBlockCount === 1 ? '' : 's'}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 mt-2">{page.label}</h4>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPageForNewBlock(page.id);
                      setShowAddModal(true);
                    }}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] font-bold text-center transition cursor-pointer"
                  >
                    + Add Block
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResetPage(page.id, page.label)}
                    title="Reset to default layout"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Custom Blocks Management Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Active Custom Blocks ({filteredBlocks.length})</span>
            </h3>
            <p className="text-xs text-slate-500">All blocks created visually by administrators</p>
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Filter Page:</span>
            <select
              value={selectedPageFilter}
              onChange={(e) => setSelectedPageFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold"
            >
              <option value="all">All Pages ({blocks.length})</option>
              {PAGES_LIST.map((p) => (
                <option key={p.id} value={p.id}>{p.id.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredBlocks.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Layers className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="text-xs font-semibold">No custom blocks on selected page.</p>
            <p className="text-[11px]">Click "+ Add Block to Page" above or use the floating toolbar on any page.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredBlocks.map((b) => (
              <div key={b.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/50 p-2 rounded-2xl transition">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {b.type}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      page: {b.pageId}
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {b.title || b.content?.slice(0, 40) || 'Untitled Block'}
                    </span>
                  </div>
                  {b.subtitle && <p className="text-xs text-slate-500 truncate">{b.subtitle}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDelete(b.id, b.pageId)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Add Custom Block */}
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
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <span>Create &amp; Publish Visual Block</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBlock} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Page</label>
                <select
                  value={selectedPageForNewBlock}
                  onChange={(e) => setSelectedPageForNewBlock(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  {PAGES_LIST.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Block Type</label>
                <select
                  value={newBlockType}
                  onChange={(e) => setNewBlockType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="banner">Gradient Announcement Banner</option>
                  <option value="hero">Hero Highlight Card</option>
                  <option value="alert">Notice / Alert Box</option>
                  <option value="text">Rich Text &amp; Headline</option>
                  <option value="image">Showcase Media Image</option>
                  <option value="card">Action CTA Card</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Title / Headline</label>
                <input
                  type="text"
                  value={newBlockTitle}
                  onChange={(e) => setNewBlockTitle(e.target.value)}
                  placeholder="e.g. 🌟 Welcome to the Vernunt Community"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtitle / Tagline (Optional)</label>
                <input
                  type="text"
                  value={newBlockSubtitle}
                  onChange={(e) => setNewBlockSubtitle(e.target.value)}
                  placeholder="e.g. Verified by Bangalore pediatricians"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Content Body Text</label>
                <textarea
                  rows={3}
                  value={newBlockContent}
                  onChange={(e) => setNewBlockContent(e.target.value)}
                  placeholder="Descriptive copy or details..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {(newBlockType === 'image' || newBlockType === 'hero' || newBlockType === 'card') && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Image URL (Optional)</label>
                  <input
                    type="url"
                    value={newBlockImage}
                    onChange={(e) => setNewBlockImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Button Link (Optional)</label>
                  <input
                    type="text"
                    value={newBlockButtonLink}
                    onChange={(e) => setNewBlockButtonLink(e.target.value)}
                    placeholder="e.g. /store"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
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
                  <span>Publish Block</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminVisualCmsDesk;
