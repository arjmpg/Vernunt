import React, { useState, useEffect, useMemo } from 'react';
import { 
  VernuntGroup, 
  VernuntGroupMessage, 
  ChildProfile, 
  GroupPrivacyTier, 
  GroupGenderRestriction,
  GroupPinnedAnnouncement,
  GroupJoinRequest
} from '../../types.ts';
import QRCode from 'qrcode';
import { 
  Users, 
  Plus, 
  Search, 
  Lock, 
  Globe, 
  Link2, 
  QrCode, 
  ShieldCheck, 
  Pin, 
  Calendar, 
  Send, 
  Settings, 
  UserPlus, 
  Check, 
  X, 
  AlertCircle, 
  ArrowLeft, 
  Share2, 
  Trash2, 
  Sparkles,
  Heart,
  MessageSquare,
  Copy,
  Info,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface VernuntGroupsHubProps {
  userProfile: ChildProfile | null;
  onOpenCommunityMeetups?: () => void;
}

// Initial Seed Groups showcasing Vernunt's vibrant parent community
const INITIAL_GROUPS: VernuntGroup[] = [
  {
    id: 'grp-1',
    name: 'Bengaluru First-Time Moms Circle',
    description: 'A compassionate, judgment-free safe space for new moms navigating feeding, sleep regression, and postpartum care.',
    avatarEmoji: '🌸',
    privacyTier: 'Public',
    genderRestriction: 'Female Only',
    creatorId: 'seed-mom-1',
    creatorName: 'Ananya Sharma',
    creatorRole: 'Mother of 8-month-old',
    creatorGender: 'Mother',
    createdAt: '2026-06-15',
    rules: [
      'Be respectful, warm, and supportive.',
      'No unsolicited medical advice - consult pediatricians.',
      'Women-only verified safe haven. Zero tolerance for harassment.'
    ],
    pinnedAnnouncements: [
      {
        id: 'pin-1',
        title: 'Weekly Stroller Walk at Cubbon Park 🌿',
        content: 'Join us this Saturday 8:00 AM at Cubbon Park Bandstand! Bring a blanket and coffee.',
        authorName: 'Ananya Sharma',
        createdAt: 'Yesterday'
      }
    ],
    editors: [
      { emailOrPhone: 'priya.k@gmail.com', addedAt: '2026-07-01', addedBy: 'Ananya Sharma' }
    ],
    memberIds: ['seed-mom-1', 'demo-user-1'],
    membersCount: 142,
    pendingJoinRequests: [],
    category: 'Newborn & Infancy',
    tags: ['First Time Moms', 'Sleep Schedules', 'Postpartum Care'],
    inviteSlug: 'bengaluru-first-time-moms'
  },
  {
    id: 'grp-2',
    name: 'Active Bangalore Dads & Playmakers',
    description: 'Dads planning weekend soccer, cycling, Lego science, and outdoor adventures for kids aged 3-10.',
    avatarEmoji: '⚽',
    privacyTier: 'Public',
    genderRestriction: 'Male Only',
    creatorId: 'seed-dad-1',
    creatorName: 'Vikram Rao',
    creatorRole: 'Father of 5-year-old',
    creatorGender: 'Father',
    createdAt: '2026-05-20',
    rules: [
      'Focus on outdoor activities and positive dad involvement.',
      'No commercial sales pitches.'
    ],
    pinnedAnnouncements: [
      {
        id: 'pin-2',
        title: 'Sunday Morning Cycling Track Meet',
        content: 'Meeting at Sarjapur Decathlon parking at 7:30 AM for child bicycle safety practice.',
        authorName: 'Vikram Rao',
        createdAt: '3 days ago'
      }
    ],
    editors: [],
    memberIds: ['seed-dad-1'],
    membersCount: 88,
    pendingJoinRequests: [],
    category: 'Sports & Outdoors',
    tags: ['Active Dads', 'Cycling', 'Weekend Sports'],
    inviteSlug: 'bangalore-active-dads'
  },
  {
    id: 'grp-3',
    name: 'Toddler Nutrition & Picky Eaters Hub',
    description: 'Healthy Indian meal prep ideas, finger foods, and pediatric nutritionist-backed lunchbox inspirations.',
    avatarEmoji: '🥑',
    privacyTier: 'Public',
    genderRestriction: 'Both',
    creatorId: 'seed-mom-2',
    creatorName: 'Dr. Meera Nambiar',
    creatorRole: 'Pediatric Dietitian & Mom',
    creatorGender: 'Mother',
    createdAt: '2026-06-01',
    rules: [
      'Share only tested recipes and nutritious tips.',
      'Respect all dietary choices (vegetarian, vegan, non-veg).'
    ],
    pinnedAnnouncements: [],
    editors: [],
    memberIds: ['seed-mom-2', 'demo-user-1'],
    membersCount: 310,
    pendingJoinRequests: [],
    category: 'Nutrition & Recipes',
    tags: ['Toddler Meals', 'Picky Eaters', 'Indian Weaning'],
    inviteSlug: 'toddler-nutrition-hub'
  },
  {
    id: 'grp-4',
    name: 'TTC, Fertility & Hope Sanctuary',
    description: 'Private, gentle space for parents trying to conceive, undergoing IUI/IVF, and seeking emotional solidarity.',
    avatarEmoji: '🕊️',
    privacyTier: 'Private',
    genderRestriction: 'Female Only',
    creatorId: 'seed-mom-3',
    creatorName: 'Kavita Reddy',
    creatorRole: 'Fertility Warrior',
    creatorGender: 'Mother',
    createdAt: '2026-07-10',
    rules: [
      '100% Confidentiality: What is shared here stays here.',
      'Be sensitive and supportive during difficult cycles.'
    ],
    pinnedAnnouncements: [
      {
        id: 'pin-3',
        title: 'Safe Space Reminder',
        content: 'All posts in this group require approval to join to protect every member\'s privacy.',
        authorName: 'Kavita Reddy',
        createdAt: '1 week ago'
      }
    ],
    editors: [],
    memberIds: ['seed-mom-3'],
    membersCount: 64,
    pendingJoinRequests: [],
    category: 'Fertility & TTC',
    tags: ['TTC', 'IVF Journey', 'Safe Space'],
    inviteSlug: 'ttc-fertility-sanctuary'
  },
  {
    id: 'grp-5',
    name: 'Secret Indiranagar Montessori Co-Op',
    description: 'Invite-only neighborhood co-op for home-school and sensorial learning rotations.',
    avatarEmoji: '🧩',
    privacyTier: 'Invite-Only',
    genderRestriction: 'Both',
    creatorId: 'seed-mom-4',
    creatorName: 'Shalini Gupta',
    creatorRole: 'Montessori Certified Mom',
    creatorGender: 'Mother',
    createdAt: '2026-08-01',
    rules: [
      'Strictly neighborhood co-op participants.',
      'No sharing links outside.'
    ],
    pinnedAnnouncements: [],
    editors: [],
    memberIds: ['seed-mom-4'],
    membersCount: 18,
    pendingJoinRequests: [],
    category: 'Montessori & Learning',
    tags: ['Montessori', 'Neighborhood Co-op'],
    inviteSlug: 'indiranagar-montessori-coop-9821'
  }
];

const INITIAL_MESSAGES: Record<string, VernuntGroupMessage[]> = {
  'grp-1': [
    {
      id: 'msg-1',
      groupId: 'grp-1',
      senderId: 'seed-mom-1',
      senderName: 'Ananya Sharma',
      senderPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
      content: 'Welcome everyone! Feeling overwhelmed with night waking? Drop your baby\'s age below and let\'s share our gentle routines.',
      likesCount: 12,
      likedBy: [],
      createdAt: '10:30 AM'
    },
    {
      id: 'msg-2',
      groupId: 'grp-1',
      senderId: 'user-2',
      senderName: 'Deepa V.',
      senderPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
      content: 'Mine is 6 months old and teething right now! White noise and chilled teether rings have been life savers.',
      likesCount: 8,
      likedBy: [],
      createdAt: '11:15 AM'
    }
  ]
};

export function VernuntGroupsHub({ userProfile, onOpenCommunityMeetups }: VernuntGroupsHubProps) {
  // Stored state
  const [groups, setGroups] = useState<VernuntGroup[]>(() => {
    try {
      const saved = localStorage.getItem('vernunt_groups_db');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_GROUPS;
  });

  const [messages, setMessages] = useState<Record<string, VernuntGroupMessage[]>>(() => {
    try {
      const saved = localStorage.getItem('vernunt_group_messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_MESSAGES;
  });

  // Current active view
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'my_groups' | 'moms_only' | 'dads_only'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddEditorModal, setShowAddEditorModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // New Message input
  const [messageText, setMessageText] = useState('');
  const [isAnonymousPost, setIsAnonymousPost] = useState(false);

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupEmoji, setNewGroupEmoji] = useState('🌸');
  const [newGroupPrivacy, setNewGroupPrivacy] = useState<GroupPrivacyTier>('Public');
  const [newGroupGender, setNewGroupGender] = useState<GroupGenderRestriction>('Female Only');
  const [newGroupCategory, setNewGroupCategory] = useState('Newborn & Infancy');
  const [newGroupRuleInput, setNewGroupRuleInput] = useState('');
  const [newGroupRules, setNewGroupRules] = useState<string[]>([
    'Be kind, supportive, and respectful.',
    'No medical diagnosis or spam.'
  ]);

  // Add Editor input
  const [editorInput, setEditorInput] = useState('');
  const [editorSuccess, setEditorSuccess] = useState('');

  // Announcement input
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);

  // Current user info
  const currentUserId = userProfile?.id || 'demo-user-1';
  const currentUserName = userProfile?.parentName || 'Vernunt Parent';
  const currentUserGender = userProfile?.parentGender || 'Mother'; // default to Mother if unspecified

  // Save to local storage
  useEffect(() => {
    try {
      localStorage.setItem('vernunt_groups_db', JSON.stringify(groups));
    } catch (e) {
      console.error(e);
    }
  }, [groups]);

  useEffect(() => {
    try {
      localStorage.setItem('vernunt_group_messages', JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  // Selected Group details
  const selectedGroup = useMemo(() => {
    return groups.find(g => g.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  const isCreator = selectedGroup?.creatorId === currentUserId;
  const isEditor = selectedGroup?.editors.some(ed => 
    ed.id === currentUserId || 
    (userProfile?.email && ed.emailOrPhone.toLowerCase() === userProfile.email.toLowerCase()) ||
    (userProfile?.phoneNumber && ed.emailOrPhone === userProfile.phoneNumber)
  );
  const isMember = selectedGroup?.memberIds?.includes(currentUserId) ?? false;
  const isPendingApproval = selectedGroup?.pendingJoinRequests?.some(r => r.userId === currentUserId) ?? false;

  // Filter groups according to strict security rules:
  // 1. Male users CANNOT view or search Female groups (hidden).
  // 2. Female users CANNOT view or search Male groups (hidden).
  // 3. Invite-Only groups are HIDDEN from search and public listing unless the user is already a member.
  const visibleGroups = useMemo(() => {
    return groups.filter(group => {
      // Gender restriction rule
      if (currentUserGender === 'Father' && group.genderRestriction === 'Female Only') {
        return false;
      }
      if (currentUserGender === 'Mother' && group.genderRestriction === 'Male Only') {
        return false;
      }

      // Invite-Only rule: hidden from discovery unless user is already a member
      if (group.privacyTier === 'Invite-Only' && !group.memberIds?.includes(currentUserId)) {
        return false;
      }

      // Tab filter
      if (activeTab === 'my_groups' && !group.memberIds?.includes(currentUserId)) {
        return false;
      }
      if (activeTab === 'moms_only' && group.genderRestriction !== 'Female Only') {
        return false;
      }
      if (activeTab === 'dads_only' && group.genderRestriction !== 'Male Only') {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = group.name.toLowerCase().includes(query);
        const matchesDesc = group.description.toLowerCase().includes(query);
        const matchesCat = group.category.toLowerCase().includes(query);
        return matchesName || matchesDesc || matchesCat;
      }

      return true;
    });
  }, [groups, currentUserGender, currentUserId, activeTab, searchQuery]);

  // Generate QR code for group invite link
  const generateGroupQR = async (group: VernuntGroup) => {
    const inviteLink = `${window.location.origin}/?group=${group.inviteSlug}`;
    try {
      const url = await QRCode.toDataURL(inviteLink, {
        width: 250,
        margin: 2,
        color: { dark: '#9f1239', light: '#ffffff' }
      });
      setQrCodeDataUrl(url);
      setShowInviteModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Joining Group
  const handleJoinGroup = (group: VernuntGroup) => {
    if (group.privacyTier === 'Public') {
      // Instant Join
      setGroups(prev => prev.map(g => {
        if (g.id === group.id) {
          return {
            ...g,
            memberIds: [...new Set([...g.memberIds, currentUserId])],
            membersCount: g.membersCount + 1
          };
        }
        return g;
      }));
    } else if (group.privacyTier === 'Private') {
      // Submit Join Request
      setGroups(prev => prev.map(g => {
        if (g.id === group.id) {
          const newReq: GroupJoinRequest = {
            userId: currentUserId,
            userName: currentUserName,
            userPhoto: userProfile?.photoUrl,
            requestedAt: 'Just now',
            note: 'Excited to join this community!'
          };
          return {
            ...g,
            pendingJoinRequests: [...g.pendingJoinRequests, newReq]
          };
        }
        return g;
      }));
    }
  };

  // Handle Approve / Reject Member
  const handleApproveMember = (groupId: string, req: GroupJoinRequest) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          memberIds: [...new Set([...g.memberIds, req.userId])],
          membersCount: g.membersCount + 1,
          pendingJoinRequests: g.pendingJoinRequests.filter(r => r.userId !== req.userId)
        };
      }
      return g;
    }));
  };

  const handleRejectMember = (groupId: string, userId: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          pendingJoinRequests: g.pendingJoinRequests.filter(r => r.userId !== userId)
        };
      }
      return g;
    }));
  };

  // Handle Creating New Group
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const slug = newGroupName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);
    const newGrp: VernuntGroup = {
      id: `grp-${Date.now()}`,
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || 'Welcome to our local parent community!',
      avatarEmoji: newGroupEmoji,
      privacyTier: newGroupPrivacy,
      genderRestriction: newGroupGender,
      creatorId: currentUserId,
      creatorName: currentUserName,
      creatorRole: userProfile?.childName ? `${userProfile.childName}'s Parent` : 'Vernunt Guardian',
      creatorGender: currentUserGender,
      createdAt: 'Today',
      rules: newGroupRules,
      pinnedAnnouncements: [],
      editors: [],
      memberIds: [currentUserId],
      membersCount: 1,
      pendingJoinRequests: [],
      category: newGroupCategory,
      tags: [newGroupCategory],
      inviteSlug: slug
    };

    setGroups(prev => [newGrp, ...prev]);
    setSelectedGroupId(newGrp.id);
    setShowCreateModal(false);

    // Reset Form
    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupRules(['Be kind, supportive, and respectful.', 'No medical diagnosis or spam.']);
  };

  // Send Message in Group
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedGroupId) return;

    const newMsg: VernuntGroupMessage = {
      id: `msg-${Date.now()}`,
      groupId: selectedGroupId,
      senderId: currentUserId,
      senderName: isAnonymousPost ? 'Anonymous Mom' : currentUserName,
      senderPhoto: isAnonymousPost ? undefined : userProfile?.photoUrl,
      senderGender: currentUserGender,
      isAnonymous: isAnonymousPost,
      content: messageText.trim(),
      likesCount: 0,
      likedBy: [],
      createdAt: 'Just now'
    };

    setMessages(prev => ({
      ...prev,
      [selectedGroupId]: [...(prev[selectedGroupId] || []), newMsg]
    }));

    setMessageText('');
  };

  // Add Editor by Email or Mobile
  const handleAddEditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorInput.trim() || !selectedGroup) return;

    const newEditor = {
      emailOrPhone: editorInput.trim(),
      addedAt: 'Just now',
      addedBy: currentUserName
    };

    setGroups(prev => prev.map(g => {
      if (g.id === selectedGroup.id) {
        return {
          ...g,
          editors: [...g.editors, newEditor]
        };
      }
      return g;
    }));

    setEditorSuccess(`Editor added successfully: ${editorInput.trim()}`);
    setEditorInput('');
    setTimeout(() => setEditorSuccess(''), 4000);
  };

  // Pin Announcement
  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim() || !selectedGroup) return;

    const newPin: GroupPinnedAnnouncement = {
      id: `pin-${Date.now()}`,
      title: announcementTitle.trim(),
      content: announcementContent.trim(),
      authorName: currentUserName,
      createdAt: 'Just now'
    };

    setGroups(prev => prev.map(g => {
      if (g.id === selectedGroup.id) {
        return {
          ...g,
          pinnedAnnouncements: [newPin, ...g.pinnedAnnouncements]
        };
      }
      return g;
    }));

    setAnnouncementTitle('');
    setAnnouncementContent('');
    setShowAnnouncementForm(false);
  };

  // Delete Group (Creator or Admin only)
  const handleDeleteGroup = (groupId: string) => {
    if (confirm('Are you sure you want to permanently delete this group? This action cannot be undone.')) {
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setSelectedGroupId(null);
    }
  };

  // Group Messages
  const currentMessages = selectedGroupId ? messages[selectedGroupId] || [] : [];

  return (
    <div id="vernunt-groups-hub" className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in font-sans pb-12">
      {/* Detail View of a specific group */}
      {selectedGroup ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col min-h-[640px]">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-red-950 text-white p-5 sm:p-6 relative">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  id="btn-back-to-groups"
                  onClick={() => setSelectedGroupId(null)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0 mt-1"
                  title="Back to all groups"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-3xl">{selectedGroup.avatarEmoji}</span>
                    <h1 className="text-xl sm:text-2xl font-black font-serif tracking-tight">
                      {selectedGroup.name}
                    </h1>
                  </div>

                  <p className="text-xs sm:text-sm text-rose-100/90 mt-1 max-w-2xl leading-relaxed">
                    {selectedGroup.description}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] font-bold">
                    <span className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>{selectedGroup.membersCount} Members</span>
                    </span>

                    {/* Privacy Tier Badge */}
                    <span className="bg-white/15 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                      {selectedGroup.privacyTier === 'Public' ? (
                        <>
                          <Globe className="w-3 h-3 text-emerald-400" />
                          <span>Public (Instant Join)</span>
                        </>
                      ) : selectedGroup.privacyTier === 'Private' ? (
                        <>
                          <Lock className="w-3 h-3 text-amber-300" />
                          <span>Private (Approval Required)</span>
                        </>
                      ) : (
                        <>
                          <Link2 className="w-3 h-3 text-rose-300" />
                          <span>Invite-Only (Secret Link)</span>
                        </>
                      )}
                    </span>

                    {/* Gender Restriction Badge */}
                    <span className={`px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                      selectedGroup.genderRestriction === 'Female Only' 
                        ? 'bg-rose-500/80 text-white border border-rose-300/40' 
                        : selectedGroup.genderRestriction === 'Male Only'
                        ? 'bg-blue-600/80 text-white border border-blue-400/40'
                        : 'bg-emerald-600/60 text-white'
                    }`}>
                      <ShieldCheck className="w-3 h-3" />
                      <span>{selectedGroup.genderRestriction}</span>
                    </span>

                    <span className="text-rose-200/70 text-[10px]">
                      Created by {selectedGroup.creatorName} ({selectedGroup.creatorRole})
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-group-share-qr"
                  onClick={() => generateGroupQR(selectedGroup)}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-black px-3 py-2 rounded-xl border border-white/20 transition cursor-pointer flex items-center gap-1.5"
                  title="Share Invite Link & QR Code"
                >
                  <QrCode className="w-4 h-4 text-amber-300" />
                  <span className="hidden sm:inline">Invite QR</span>
                </button>

                {(isCreator || isEditor) && (
                  <button
                    type="button"
                    id="btn-group-settings"
                    onClick={() => setShowSettingsModal(true)}
                    className="bg-white/10 hover:bg-white/20 text-white text-xs font-black px-3 py-2 rounded-xl border border-white/20 transition cursor-pointer flex items-center gap-1.5"
                    title="Group Settings & Editors"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Manage</span>
                  </button>
                )}

                {isCreator && (
                  <button
                    type="button"
                    id="btn-delete-group"
                    onClick={() => handleDeleteGroup(selectedGroup.id)}
                    className="bg-red-600/60 hover:bg-red-600 text-white p-2 rounded-xl border border-red-400/40 transition cursor-pointer"
                    title="Delete Group (Admin only)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Pending Approval Notice for Non-Members */}
          {!isMember && (
            <div className="bg-amber-50 border-b border-amber-200 p-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-black text-amber-900">
                  {isPendingApproval ? "Join Request Submitted" : `Join ${selectedGroup.name}`}
                </h4>
                <p className="text-[11px] text-amber-800">
                  {isPendingApproval 
                    ? "Your request is awaiting approval from the group creator or editor." 
                    : selectedGroup.privacyTier === 'Public'
                    ? "Click to join this group immediately and start chatting!"
                    : "This group requires admin approval before messages can be viewed."}
                </p>
              </div>

              {!isPendingApproval && (
                <button
                  type="button"
                  id="btn-join-group-action"
                  onClick={() => handleJoinGroup(selectedGroup)}
                  className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-black px-4 py-2 rounded-xl shadow-xs transition cursor-pointer shrink-0"
                >
                  {selectedGroup.privacyTier === 'Public' ? 'Join Instantly' : 'Request to Join'}
                </button>
              )}
            </div>
          )}

          {/* Group Content Body */}
          <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
            {/* Main Chat & Discussion (Span 8) */}
            <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
              {/* Pinned Announcements Carousel / Banner */}
              {selectedGroup.pinnedAnnouncements.length > 0 && (
                <div className="space-y-2">
                  {selectedGroup.pinnedAnnouncements.map((pin) => (
                    <div 
                      key={pin.id} 
                      className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 shadow-2xs relative"
                    >
                      <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs mb-1">
                        <Pin className="w-3.5 h-3.5 fill-amber-700 text-amber-700" />
                        <span>Pinned Announcement</span>
                        <span className="text-[10px] text-amber-600 font-normal">• by {pin.authorName} ({pin.createdAt})</span>
                      </div>
                      <h4 className="text-xs font-black text-slate-900">{pin.title}</h4>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">{pin.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Discussion Feed */}
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[460px] pr-1">
                {currentMessages.length > 0 ? (
                  currentMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`p-3.5 rounded-2xl border text-left transition ${
                        msg.senderId === currentUserId 
                          ? 'bg-rose-50/70 border-rose-200/70 ml-6' 
                          : 'bg-white border-slate-200/80 mr-6 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          {msg.isAnonymous ? (
                            <div className="w-7 h-7 rounded-full bg-slate-900 text-amber-300 flex items-center justify-center text-xs font-black">
                              🛡️
                            </div>
                          ) : (
                            <img 
                              src={msg.senderPhoto || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120'} 
                              alt={msg.senderName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                              referrerPolicy="no-referrer"
                            />
                          )}

                          <div>
                            <span className="text-xs font-extrabold text-slate-900 block leading-tight">
                              {msg.senderName}
                            </span>
                            {msg.isAnonymous && (
                              <span className="text-[9px] font-bold text-rose-700 uppercase tracking-wider">
                                Vernunt Anonymous Shield
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-400 font-medium">
                          {msg.createdAt}
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 leading-relaxed font-normal pl-9">
                        {msg.content}
                      </p>

                      <div className="pl-9 pt-2 flex items-center gap-3 text-[11px] text-slate-500 font-bold">
                        <button
                          type="button"
                          className="hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Heart className="w-3.5 h-3.5" />
                          <span>{msg.likesCount}</span>
                        </button>
                        <button
                          type="button"
                          className="hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Reply</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-semibold">No messages yet in this group.</p>
                    <p className="text-[11px]">Be the first to say hello and start the conversation!</p>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              {isMember ? (
                <form onSubmit={handleSendMessage} className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] px-1">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 font-bold">
                      <input
                        type="checkbox"
                        checked={isAnonymousPost}
                        onChange={(e) => setIsAnonymousPost(e.target.checked)}
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                      />
                      <span>Post Anonymously (Vernunt Safe Shield)</span>
                    </label>

                    <span className="text-slate-400 text-[10px]">
                      Press Send or Enter
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      id="input-group-chat-msg"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={isAnonymousPost ? "Write an anonymous message or question..." : `Message ${selectedGroup.name}...`}
                      className="flex-1 text-xs py-2.5 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 focus:bg-white transition"
                    />

                    <button
                      type="submit"
                      id="btn-send-group-msg"
                      disabled={!messageText.trim()}
                      className="bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 font-medium">
                  Join this group to participate in discussions and post questions.
                </div>
              )}
            </div>

            {/* Right Sidebar: Rules, Group Meetups, Management (Span 4) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Coordinate Group Meetup Card */}
              <div className="bg-gradient-to-tr from-amber-500 to-rose-600 text-white rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-200" />
                  <h4 className="text-xs font-black uppercase tracking-wider">Host a Group Meetup</h4>
                </div>
                <p className="text-[11px] text-amber-100 leading-snug">
                  Coordinate a real-world park playdate, stroller coffee walk, or virtual video call exclusively for this group.
                </p>
                <button
                  type="button"
                  id="btn-plan-group-meetup"
                  onClick={() => {
                    if (onOpenCommunityMeetups) {
                      onOpenCommunityMeetups();
                    }
                  }}
                  className="w-full mt-2 bg-white text-rose-950 hover:bg-amber-50 font-black text-xs py-2 px-3 rounded-xl transition cursor-pointer shadow-xs text-center block"
                >
                  Schedule Meetup 🗓️
                </button>
              </div>

              {/* Group Rules */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 text-left">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Community Rules</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 text-[11px] leading-snug list-disc list-inside">
                  {selectedGroup.rules.map((rule, idx) => (
                    <li key={idx} className="font-medium">{rule}</li>
                  ))}
                </ul>
              </div>

              {/* Pending Join Requests (Visible to Creator & Editors) */}
              {(isCreator || isEditor) && selectedGroup.pendingJoinRequests.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2.5 text-left animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-rose-950 flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-rose-600" />
                      <span>Pending Join Requests ({selectedGroup.pendingJoinRequests.length})</span>
                    </h4>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedGroup.pendingJoinRequests.map((req) => (
                      <div key={req.userId} className="bg-white p-2.5 rounded-xl border border-rose-100 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate">{req.userName}</span>
                          <span className="text-[10px] text-slate-400 block">{req.requestedAt}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleApproveMember(selectedGroup.id, req)}
                            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition cursor-pointer"
                            title="Approve Member"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectMember(selectedGroup.id, req.userId)}
                            className="p-1.5 rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 transition cursor-pointer"
                            title="Reject"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Editors List */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">Group Editors</span>
                  {(isCreator || isEditor) && (
                    <button
                      type="button"
                      onClick={() => setShowAddEditorModal(true)}
                      className="text-[11px] font-black text-rose-700 hover:text-rose-900 cursor-pointer"
                    >
                      + Add
                    </button>
                  )}
                </div>

                <div className="space-y-1 text-[11px] text-slate-600">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>👑 {selectedGroup.creatorName}</span>
                    <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-black">Creator</span>
                  </div>
                  {selectedGroup.editors.map((ed, i) => (
                    <div key={i} className="text-slate-600 truncate">
                      • {ed.emailOrPhone}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* All Groups Discovery List View */
        <>
          {/* Top Hero Banner & Actions */}
          <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-red-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-rose-500/30 text-rose-200 px-3 py-1 rounded-full text-xs font-extrabold border border-rose-400/30">
                <Users className="w-3.5 h-3.5 text-rose-300" />
                <span>Vernunt Parenting Communities</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black font-serif tracking-tight">
                Moms &amp; Parents Circles, Safe &amp; Real
              </h1>

              <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed">
                Connect with local parents sharing your journey. Join public circles, request access to private support groups, or create your own neighborhood community in minutes.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  id="btn-create-new-group"
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl shadow-md hover:scale-102 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Create a New Group</span>
                </button>
              </div>
            </div>

            {/* Background vector graphic */}
            <div className="absolute right-0 bottom-0 text-white/5 text-9xl font-black pointer-events-none select-none">
              🌸
            </div>
          </div>

          {/* Search & Tabs Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 gap-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Groups
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('my_groups')}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  activeTab === 'my_groups' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Groups
              </button>
              {currentUserGender !== 'Father' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('moms_only')}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                    activeTab === 'moms_only' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  👩 Moms Only
                </button>
              )}
              {currentUserGender !== 'Mother' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('dads_only')}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                    activeTab === 'dads_only' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  👨 Dads Only
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups by topic or name..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              />
            </div>
          </div>

          {/* Group Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleGroups.map((group) => {
              const userInGroup = group.memberIds?.includes(currentUserId) ?? false;
              return (
                <div
                  key={group.id}
                  id={`card-group-${group.id}`}
                  onClick={() => setSelectedGroupId(group.id)}
                  className="bg-white rounded-3xl border border-slate-200/90 hover:border-rose-300 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group text-left"
                >
                  <div className="space-y-3">
                    {/* Top Row: Emoji, Name, Privacy */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-2xl flex items-center justify-center shrink-0 border border-rose-100 group-hover:scale-105 transition">
                        {group.avatarEmoji}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {group.genderRestriction === 'Female Only' && (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black px-2 py-0.5 rounded-full">
                            👩 Moms Only
                          </span>
                        )}
                        {group.genderRestriction === 'Male Only' && (
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black px-2 py-0.5 rounded-full">
                            👨 Dads Only
                          </span>
                        )}
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          {group.privacyTier}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-serif font-black text-slate-900 text-base group-hover:text-rose-900 transition leading-snug">
                        {group.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed font-normal">
                        {group.description}
                      </p>
                    </div>

                    {/* Tags */}
                    {group.tags && (
                      <div className="flex flex-wrap gap-1">
                        {group.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="bg-slate-50 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Footer: Members count & View Button */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{group.membersCount} members</span>
                    </span>

                    <span className="text-xs font-black text-rose-700 group-hover:text-rose-900 flex items-center gap-0.5">
                      <span>{userInGroup ? "Open Group" : "Explore"}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {visibleGroups.length === 0 && (
            <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-6 space-y-3">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <h3 className="text-sm font-extrabold text-slate-800">No matching groups found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing your search query or create the very first community circle in this category!
              </p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="bg-rose-700 text-white font-black text-xs py-2 px-4 rounded-xl shadow-xs hover:bg-rose-800 transition cursor-pointer"
              >
                + Create Group Now
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal: Create Group */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-fade-in text-left my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">
                  New Community
                </span>
                <h3 className="text-lg font-black text-slate-900 font-serif">
                  Create a Vernunt Group
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              {/* Name & Emoji */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Group Name *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGroupEmoji}
                    onChange={(e) => setNewGroupEmoji(e.target.value)}
                    className="w-14 text-center text-xl py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="🌸"
                    maxLength={2}
                    title="Choose an emoji"
                  />
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Indiranagar Toddler Play Circle"
                    className="flex-1 text-xs py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description &amp; Purpose *
                </label>
                <textarea
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="What is this group about? Who is it for?"
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              {/* Privacy Tiers (The 3 Options requested) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Privacy Setting *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div
                    onClick={() => setNewGroupPrivacy('Public')}
                    className={`p-3 rounded-xl border cursor-pointer transition text-left ${
                      newGroupPrivacy === 'Public'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-extrabold mb-1">
                      <Globe className="w-3.5 h-3.5 text-emerald-600" />
                      <span>1. Public</span>
                    </div>
                    <p className="text-[10px] leading-tight">
                      Visible to everyone. Anyone joins instantly without approval.
                    </p>
                  </div>

                  <div
                    onClick={() => setNewGroupPrivacy('Private')}
                    className={`p-3 rounded-xl border cursor-pointer transition text-left ${
                      newGroupPrivacy === 'Private'
                        ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-extrabold mb-1">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>2. Private</span>
                    </div>
                    <p className="text-[10px] leading-tight">
                      Visible in search. Users must submit request to be approved.
                    </p>
                  </div>

                  <div
                    onClick={() => setNewGroupPrivacy('Invite-Only')}
                    className={`p-3 rounded-xl border cursor-pointer transition text-left ${
                      newGroupPrivacy === 'Invite-Only'
                        ? 'bg-rose-50 border-rose-500 text-rose-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-extrabold mb-1">
                      <Link2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>3. Invite-Only</span>
                    </div>
                    <p className="text-[10px] leading-tight">
                      Hidden from search. Accessible strictly via secret invite link / QR.
                    </p>
                  </div>
                </div>
              </div>

              {/* Gender Restrictions (Male, Female, Both) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Gender &amp; Safe-Space Restriction *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewGroupGender('Female Only')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      newGroupGender === 'Female Only'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    👩 Moms Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewGroupGender('Male Only')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      newGroupGender === 'Male Only'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    👨 Dads Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewGroupGender('Both')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      newGroupGender === 'Both'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    👨‍👩‍👧 Both (Open)
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Moms-only groups are strictly hidden from male accounts to preserve women's privacy. You can adjust this anytime in Group Settings.
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Community Category
                </label>
                <select
                  value={newGroupCategory}
                  onChange={(e) => setNewGroupCategory(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                >
                  <option value="Newborn & Infancy">Newborn &amp; Infancy</option>
                  <option value="Toddler & Preschool">Toddler &amp; Preschool</option>
                  <option value="Fertility & TTC">Fertility &amp; TTC</option>
                  <option value="Sports & Outdoors">Sports &amp; Outdoors</option>
                  <option value="Nutrition & Recipes">Nutrition &amp; Recipes</option>
                  <option value="Montessori & Learning">Montessori &amp; Learning</option>
                  <option value="Working Parents">Working Parents</option>
                  <option value="Special Needs & Support">Special Needs &amp; Support</option>
                </select>
              </div>

              {/* Submit */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-2 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-create-group"
                  className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-black py-2.5 px-5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Publish Group ✨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invite Link & QR Code */}
      {showInviteModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xl mx-auto">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-serif font-black text-slate-900 text-base">
                Invite Parents to {selectedGroup.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Scan QR code with phone camera or share the direct link.
              </p>
            </div>

            {/* QR Code Canvas */}
            {qrCodeDataUrl && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto shadow-inner">
                <img src={qrCodeDataUrl} alt="Group Invite QR Code" className="w-48 h-48 mx-auto" />
              </div>
            )}

            {/* Link Copy Bar */}
            <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200 text-xs">
              <span className="truncate text-slate-600 font-mono text-[11px] flex-1 text-left">
                {window.location.origin}/?group={selectedGroup.inviteSlug}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/?group=${selectedGroup.inviteSlug}`);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2500);
                }}
                className="bg-rose-700 hover:bg-rose-800 text-white p-2 rounded-lg font-bold text-xs transition cursor-pointer shrink-0"
                title="Copy Link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold py-2.5 rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal: Group Management / Settings */}
      {showSettingsModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-fade-in text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 font-serif">
                Manage {selectedGroup.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Change Gender Restriction */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Gender Restriction
              </label>
              <select
                value={selectedGroup.genderRestriction}
                onChange={(e) => {
                  const val = e.target.value as GroupGenderRestriction;
                  setGroups(prev => prev.map(g => g.id === selectedGroup.id ? { ...g, genderRestriction: val } : g));
                }}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="Female Only">Female Only (Moms Only)</option>
                <option value="Male Only">Male Only (Dads Only)</option>
                <option value="Both">Both (Moms &amp; Dads)</option>
              </select>
            </div>

            {/* Change Privacy Tier */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Privacy Tier
              </label>
              <select
                value={selectedGroup.privacyTier}
                onChange={(e) => {
                  const val = e.target.value as GroupPrivacyTier;
                  setGroups(prev => prev.map(g => g.id === selectedGroup.id ? { ...g, privacyTier: val } : g));
                }}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="Public">Public (Anyone joins instantly)</option>
                <option value="Private">Private (Approval required)</option>
                <option value="Invite-Only">Invite-Only (Hidden from search)</option>
              </select>
            </div>

            {/* Pin Announcement Form */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Pin Announcement to Feed</span>
                <button
                  type="button"
                  onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                  className="text-[11px] font-bold text-rose-700 hover:text-rose-900 cursor-pointer"
                >
                  {showAnnouncementForm ? "Hide" : "+ New"}
                </button>
              </div>

              {showAnnouncementForm && (
                <form onSubmit={handleAddAnnouncement} className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-2">
                  <input
                    type="text"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="Announcement Title..."
                    className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white"
                    required
                  />
                  <textarea
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    placeholder="Details about date, venue or updates..."
                    rows={2}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-rose-700 text-white text-xs font-black py-1.5 px-3 rounded-lg cursor-pointer"
                  >
                    Pin Now 📌
                  </button>
                </form>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Modal: Add Editor */}
      {showAddEditorModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-fade-in text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-slate-900">
                Add Group Editor
              </h3>
              <button
                type="button"
                onClick={() => setShowAddEditorModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Editors can approve member join requests, pin announcements, and coordinate events. They cannot delete the group.
            </p>

            {editorSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{editorSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddEditor} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  User Email or Mobile Number
                </label>
                <input
                  type="text"
                  value={editorInput}
                  onChange={(e) => setEditorInput(e.target.value)}
                  placeholder="e.g. parent@gmail.com or +919876543210"
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddEditorModal(false)}
                  className="text-xs text-slate-500 px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-700 text-white text-xs font-black px-4 py-2 rounded-xl cursor-pointer"
                >
                  Grant Editor Rights
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
