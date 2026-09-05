import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, XCircle, Trash2, Eye, Award, Instagram, Search, ShieldCheck, Globe, Calendar, MapPin, User, Mail, Phone, ExternalLink, Edit3, X, Save } from 'lucide-react';
import { KidStory } from '../../types.ts';
import { getStoredKidStories, saveKidStories, approveKidStory, rejectKidStory, updateKidStoryByAdmin, extractInstagramFollowers } from '../../data/kidStories.ts';

export const AdminKidStoriesDesk: React.FC = () => {
  const [stories, setStories] = useState<KidStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<KidStory | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending_approval' | 'approved' | 'rejected'>('pending_approval');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Admin Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editAchievements, setEditAchievements] = useState<string[]>([]);
  const [editCategory, setEditCategory] = useState('');
  const [editKidName, setEditKidName] = useState('');
  const [editKidAge, setEditKidAge] = useState<number>(0);
  const [editKidCity, setEditKidCity] = useState('');
  const [editInstagramUrl, setEditInstagramUrl] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');

  const loadStories = () => {
    setStories(getStoredKidStories());
  };

  useEffect(() => {
    loadStories();
  }, []);

  const handleStartEdit = (story: KidStory) => {
    setEditTitle(story.title);
    setEditSummary(story.summary);
    setEditContent(story.content);
    setEditAchievements([...story.achievements]);
    setEditCategory(story.category);
    setEditKidName(story.kidName);
    setEditKidAge(story.kidAge);
    setEditKidCity(story.kidCity);
    setEditInstagramUrl(story.instagramUrl || '');
    setEditPhotoUrl(story.photoUrl);
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStory) return;

    const computedFollowers = editInstagramUrl ? extractInstagramFollowers(editInstagramUrl) : undefined;

    const updated = updateKidStoryByAdmin(selectedStory.id, {
      title: editTitle.trim(),
      summary: editSummary.trim(),
      content: editContent.trim(),
      achievements: editAchievements.filter(a => a.trim().length > 0),
      category: editCategory,
      kidName: editKidName.trim(),
      kidAge: Number(editKidAge),
      kidCity: editKidCity.trim(),
      instagramUrl: editInstagramUrl.trim() || undefined,
      instagramFollowers: computedFollowers || selectedStory.instagramFollowers,
      photoUrl: editPhotoUrl.trim() || selectedStory.photoUrl
    });

    if (updated) {
      loadStories();
      setSelectedStory(updated);
      setIsEditing(false);
      setActionSuccess(`✓ Successfully updated story details for "${updated.kidName}"! Changes live.`);
      setTimeout(() => setActionSuccess(''), 4000);
    }
  };

  const handleApprove = (storyId: string) => {
    const res = approveKidStory(storyId);
    if (res) {
      loadStories();
      if (selectedStory?.id === storyId) {
        setSelectedStory(res);
      }
      setActionSuccess(`✓ Approved "${res.kidName}'s" story! Published to Google SEO Indexing.`);
      setTimeout(() => setActionSuccess(''), 4000);
    }
  };

  const handleReject = (storyId: string) => {
    const reason = window.prompt('Enter reason for rejection (e.g. Needs higher quality image or proof of achievement):');
    if (reason === null) return;
    
    const res = rejectKidStory(storyId, reason || 'Does not meet editorial guidelines');
    if (res) {
      loadStories();
      if (selectedStory?.id === storyId) {
        setSelectedStory(res);
      }
      setActionSuccess(`Story marked as rejected.`);
      setTimeout(() => setActionSuccess(''), 3000);
    }
  };

  const handleDelete = (storyId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this kid story?')) return;
    const updated = stories.filter(s => s.id !== storyId);
    saveKidStories(updated);
    setStories(updated);
    if (selectedStory?.id === storyId) {
      setSelectedStory(null);
    }
  };

  const pendingCount = stories.filter(s => s.status === 'pending_approval').length;
  const approvedCount = stories.filter(s => s.status === 'approved').length;

  const filteredStories = stories.filter(s => {
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      s.kidName.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.parentName.toLowerCase().includes(q) ||
      s.kidCity.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-300" /> Editorial Desk
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif">
            Kid Stories & Little Achievers Review (YourStory for Kids)
          </h2>
          <p className="text-xs text-orange-100 leading-relaxed">
            Review parent-submitted stories, verify child achievements, ensure child safety compliance, and approve stories for publication and Google Search Engine indexing.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl font-bold flex items-center gap-2 animate-fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilterStatus('pending_approval')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'pending_approval'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>Pending Review</span>
            <span className="px-1.5 py-0.2 bg-black/20 text-white text-[10px] rounded-full">
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('approved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>Approved & Live</span>
            <span className="px-1.5 py-0.2 bg-black/20 text-white text-[10px] rounded-full">
              {approvedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('rejected')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === 'rejected'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Rejected
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All ({stories.length})
          </button>
        </div>

        <div className="relative max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by kid or parent..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>
      </div>

      {/* Main Grid: List & Selected Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Stories list */}
        <div className="lg:col-span-6 space-y-3">
          {filteredStories.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
              No stories found under the "{filterStatus}" filter.
            </div>
          ) : (
            filteredStories.map((story) => (
              <div
                key={story.id}
                onClick={() => setSelectedStory(story)}
                className={`p-4 bg-white border rounded-2xl shadow-2xs hover:shadow-xs transition cursor-pointer flex gap-3 ${
                  selectedStory?.id === story.id
                    ? 'border-orange-500 ring-2 ring-orange-200'
                    : 'border-slate-200/90'
                }`}
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <img src={story.photoUrl} alt={story.kidName} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      story.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : story.status === 'pending_approval'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {story.status === 'pending_approval' ? '⏳ Pending Approval' : story.status === 'approved' ? '✓ Approved' : 'Rejected'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(story.submittedAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {story.title}
                  </h4>

                  <div className="text-[11px] text-slate-600 font-medium truncate">
                    Child: <strong>{story.kidName}</strong> ({story.kidAge} yrs) • {story.kidCity}
                  </div>

                  <div className="text-[10px] text-slate-400 truncate">
                    Parent: {story.parentName} ({story.parentPhone || story.parentEmail})
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right column: Inspector & Editorial Decision */}
        <div className="lg:col-span-6">
          {selectedStory ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5 sticky top-6">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Story ID: {selectedStory.id}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Editorial Review Inspector
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(selectedStory)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 transition cursor-pointer"
                    title="Edit Story (Admin Exclusive)"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Story
                  </button>

                  {selectedStory.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedStory.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Index
                    </button>
                  )}
                  {selectedStory.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => handleReject(selectedStory.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedStory.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Photo & Snapshot */}
              <div className="flex gap-4 items-start">
                <img
                  src={selectedStory.photoUrl}
                  alt={selectedStory.kidName}
                  className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                />
                <div className="space-y-1 text-xs">
                  <div className="text-sm font-bold text-slate-900">{selectedStory.kidName}</div>
                  <div className="text-slate-600">Age: {selectedStory.kidAge} • Location: {selectedStory.kidCity}</div>
                  <div className="text-slate-600">Category: <strong className="text-orange-600">{selectedStory.category}</strong></div>
                  {selectedStory.instagramUrl && (
                    <a
                      href={selectedStory.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 font-bold flex items-center gap-1 hover:underline pt-0.5"
                    >
                      <Instagram className="w-3.5 h-3.5" /> Instagram Profile Link
                    </a>
                  )}
                </div>
              </div>

              {/* Title & Synopsis */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HEADLINE</label>
                <div className="text-xs font-bold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {selectedStory.title}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LEAD SUMMARY (YOURSTORY STYLE)</label>
                <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed italic">
                  "{selectedStory.summary}"
                </div>
              </div>

              {/* Achievements */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACHIEVEMENTS LIST</label>
                <div className="space-y-1">
                  {selectedStory.achievements.map((ach, idx) => (
                    <div key={idx} className="text-xs p-2 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 flex items-start gap-2">
                      <Award className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{ach}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Editorial Content */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FULL EDITORIAL TEXT</label>
                <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-48 overflow-y-auto leading-relaxed whitespace-pre-line">
                  {selectedStory.content}
                </div>
              </div>

              {/* Parent Info & Verification */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">Submitted by Parent:</div>
                <div className="flex items-center gap-4">
                  <span>Name: {selectedStory.parentName}</span>
                  <span>Contact: {selectedStory.parentPhone || selectedStory.parentEmail}</span>
                </div>
              </div>

              {/* Google SEO Indexing Status */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>
                    URL Slug: <strong className="font-mono">/kid-stories/{selectedStory.slug}</strong>
                  </span>
                </div>
                <span className="font-bold text-emerald-700 text-[10px] uppercase tracking-wider">
                  {selectedStory.status === 'approved' ? 'Indexed in Sitemap' : 'Awaiting Approval'}
                </span>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-xs">
              Select a kid story from the list to inspect details, verify achievements, and approve or reject.
            </div>
          )}
        </div>
      </div>

      {/* Admin Edit Story Modal */}
      {isEditing && selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full my-auto overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-base">Editorial Story Editor (Admin Exclusive)</h3>
                  <p className="text-xs text-orange-100">Make editorial revisions to child story, headlines & achievements</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Child's Name</label>
                  <input
                    type="text"
                    value={editKidName}
                    onChange={(e) => setEditKidName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Age</label>
                  <input
                    type="number"
                    value={editKidAge}
                    onChange={(e) => setEditKidAge(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">City / Location</label>
                  <input
                    type="text"
                    value={editKidCity}
                    onChange={(e) => setEditKidCity(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Category</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Instagram Profile Link</label>
                  <input
                    type="text"
                    value={editInstagramUrl}
                    onChange={(e) => setEditInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/username"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Headline / Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300 font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Summary / Lead Synopsis</label>
                <textarea
                  rows={2}
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Full Editorial Story Body</label>
                <textarea
                  rows={6}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300 whitespace-pre-line"
                  required
                />
              </div>

              {/* Achievements */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700">Key Achievements</label>
                {editAchievements.map((ach, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={ach}
                      onChange={(e) => {
                        const copy = [...editAchievements];
                        copy[idx] = e.target.value;
                        setEditAchievements(copy);
                      }}
                      className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300"
                    />
                    <button
                      type="button"
                      onClick={() => setEditAchievements(editAchievements.filter((_, i) => i !== idx))}
                      className="px-2.5 py-1 text-red-500 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setEditAchievements([...editAchievements, ''])}
                  className="text-orange-600 font-bold hover:underline"
                >
                  + Add Achievement
                </button>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Photo URL</label>
                <input
                  type="text"
                  value={editPhotoUrl}
                  onChange={(e) => setEditPhotoUrl(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminKidStoriesDesk;
