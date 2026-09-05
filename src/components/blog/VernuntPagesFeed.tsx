import React, { useState, useEffect } from 'react';
import { 
  VernuntPagePost, 
  VernuntAudioPod, 
  WriterPitchSubmission, 
  ChildProfile 
} from '../../types.ts';
import { 
  Sparkles, 
  MessageSquare, 
  Heart, 
  Share2, 
  Radio, 
  Mic, 
  MicOff, 
  Hand, 
  PenTool, 
  ShieldCheck, 
  Plus, 
  Send, 
  Bookmark, 
  Flame, 
  Eye, 
  Check, 
  Volume2, 
  Users,
  Search,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VernuntPagesFeedProps {
  userProfile: ChildProfile | null;
}

const INITIAL_POSTS: VernuntPagePost[] = [
  {
    id: 'post-1',
    authorId: 'author-1',
    authorName: 'Rhea Sen',
    authorPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    authorRole: 'Mom of 14-month-old • Bangalore',
    isAnonymous: false,
    title: 'My 36-Hour Unmedicated Birth Story at Cloudnine',
    content: 'Nobody warned me about transition phase shaking! At 8cm dilated, I thought I couldn’t do it. But counter-pressure on my sacrum and warm water showers changed everything. If you are preparing for childbirth, trust your body’s primal power.',
    topic: 'Birth Stories',
    likesCount: 54,
    likedBy: [],
    commentsCount: 19,
    createdAt: '2 hours ago',
    comments: [
      {
        id: 'c-1',
        authorName: 'Sneha Rao',
        content: 'Thank you for sharing this! Due in 4 weeks and reading positive birth stories gives me so much calm.',
        createdAt: '1 hour ago'
      }
    ]
  },
  {
    id: 'post-2',
    authorId: 'anon-1',
    authorName: 'Anonymous Mom',
    isAnonymous: true,
    anonymousAlias: 'Anonymous Mom of 2',
    title: 'Postpartum rage and marriage distance: Is this normal?',
    content: 'I love my baby deeply, but some evenings I feel this boiling rage over tiny things like unwashed bottles. My partner tries, but I feel like two strangers living in the same house. Posting anonymously because the guilt feels heavy. How did you reconnect after months of sleep deprivation?',
    topic: 'Postpartum & Mental Health',
    likesCount: 89,
    likedBy: [],
    commentsCount: 42,
    createdAt: '4 hours ago',
    comments: [
      {
        id: 'c-2',
        authorName: 'Dr. Meera (Counselor & Mom)',
        content: 'You are NOT alone and you are not a bad mom. Postpartum rage is hormonal and aggravated by sleep starvation. Please talk to your OB/GYN and give yourselves immense grace.',
        createdAt: '3 hours ago'
      }
    ]
  },
  {
    id: 'post-3',
    authorId: 'author-3',
    authorName: 'Priya Sundaram',
    authorPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    authorRole: 'Nutritionist & Mother',
    isAnonymous: false,
    title: 'The 3-Ingredient Ragi Halwa my toddler actually devours',
    content: 'Sprouted ragi flour roasted in organic A2 ghee, naturally sweetened with soaked Medjool date paste and a pinch of cardamom. Packed with calcium and iron for picky morning appetites! Full recipe in comments.',
    topic: 'Parenting Hacks',
    likesCount: 62,
    likedBy: [],
    commentsCount: 15,
    createdAt: 'Yesterday'
  },
  {
    id: 'post-4',
    authorId: 'anon-2',
    authorName: 'Anonymous Mom',
    isAnonymous: true,
    anonymousAlias: 'TTC Warrior • 3 Years',
    title: 'Cycle 34: When everyone else’s pregnancy announcements sting',
    content: 'Another baby shower invite arrived in my WhatsApp family group today. I smiled, congratulated them, and then wept in the shower. To every parent silently taking ovulation tests and waiting for two lines: I see you and your grief is valid.',
    topic: 'TTC & Fertility',
    likesCount: 112,
    likedBy: [],
    commentsCount: 38,
    createdAt: '2 days ago'
  }
];

const INITIAL_PODS: VernuntAudioPod[] = [
  {
    id: 'pod-1',
    title: 'Breastfeeding Realities: Latch Struggles & Cluster Feeding',
    description: 'A raw, live audio room discussing the painful first weeks, tongue ties, and milk supply myths.',
    hostId: 'host-1',
    hostName: 'Dr. Alisha Verghese (IBCLC Certified)',
    hostPhoto: 'https://images.unsplash.com/photo-1594824813589-32d84c6806e2?auto=format&fit=crop&q=80&w=200',
    category: 'Lactation & Newborn',
    isLive: true,
    listenersCount: 64,
    speakers: [
      { id: 'sp-1', name: 'Dr. Alisha', isSpeaking: true },
      { id: 'sp-2', name: 'Divya M.', isSpeaking: false }
    ],
    raisedHands: []
  },
  {
    id: 'pod-2',
    title: 'Toddler Big Feelings: Tantrums at the Grocery Store',
    description: 'Gentle parenting in public spaces without yelling or bribe screens.',
    hostId: 'host-2',
    hostName: 'Karan Mehra',
    hostPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    category: 'Toddler Psychology',
    isLive: true,
    listenersCount: 42,
    speakers: [
      { id: 'sp-3', name: 'Karan Mehra', isSpeaking: false },
      { id: 'sp-4', name: 'Natasha K.', isSpeaking: true }
    ],
    raisedHands: []
  }
];

export function VernuntPagesFeed({ userProfile }: VernuntPagesFeedProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'pods' | 'writer_portal'>('feed');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');

  // Posts State
  const [posts, setPosts] = useState<VernuntPagePost[]>(() => {
    try {
      const saved = localStorage.getItem('vernunt_page_posts');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_POSTS;
  });

  // Audio Pods State
  const [pods, setPods] = useState<VernuntAudioPod[]>(INITIAL_PODS);
  const [activePodId, setActivePodId] = useState<string | null>(null);
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // New Post Form
  const [showNewPostModal, setShowNewPostModal] = useState<boolean>(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTopic, setNewPostTopic] = useState('Birth Stories');
  const [newPostIsAnonymous, setNewPostIsAnonymous] = useState(false);

  // Writer Submission Portal State
  const [writerName, setWriterName] = useState(userProfile?.parentName || '');
  const [writerEmail, setWriterEmail] = useState(userProfile?.email || '');
  const [writerPhone, setWriterPhone] = useState(userProfile?.phoneNumber || '');
  const [writerTheme, setWriterTheme] = useState('Fertility & TTC');
  const [writerPitchTitle, setWriterPitchTitle] = useState('');
  const [writerSynopsis, setWriterSynopsis] = useState('');
  const [writerBio, setWriterBio] = useState('');
  const [writerSubmitted, setWriterSubmitted] = useState(false);

  // Save posts to storage
  useEffect(() => {
    try {
      localStorage.setItem('vernunt_page_posts', JSON.stringify(posts));
    } catch (e) {
      console.error(e);
    }
  }, [posts]);

  const currentUserId = userProfile?.id || 'demo-user-1';
  const currentUserName = userProfile?.parentName || 'Vernunt Parent';

  const TOPICS = [
    'All',
    'Birth Stories',
    'Postpartum & Mental Health',
    'TTC & Fertility',
    'Parenting Hacks',
    'PCOS & Women\'s Health',
    'Menopause',
    'Toddler Tantrums'
  ];

  const filteredPosts = posts.filter(post => {
    if (selectedTopic === 'All') return true;
    return post.topic === selectedTopic;
  });

  const handleLikePost = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const hasLiked = p.likedBy?.includes(currentUserId);
        return {
          ...p,
          likesCount: hasLiked ? p.likesCount - 1 : p.likesCount + 1,
          likedBy: hasLiked 
            ? (p.likedBy || []).filter(id => id !== currentUserId)
            : [...(p.likedBy || []), currentUserId]
        };
      }
      return p;
    }));
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    const newPost: VernuntPagePost = {
      id: `post-${Date.now()}`,
      authorId: currentUserId,
      authorName: newPostIsAnonymous ? 'Anonymous Mom' : currentUserName,
      authorPhoto: newPostIsAnonymous ? undefined : userProfile?.photoUrl,
      authorRole: newPostIsAnonymous ? undefined : `${userProfile?.childName || 'Kid'}'s Parent`,
      isAnonymous: newPostIsAnonymous,
      anonymousAlias: newPostIsAnonymous ? 'Anonymous Mother' : undefined,
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      topic: newPostTopic,
      likesCount: 0,
      likedBy: [],
      commentsCount: 0,
      createdAt: 'Just now'
    };

    setPosts([newPost, ...posts]);
    setShowNewPostModal(false);
    setNewPostTitle('');
    setNewPostContent('');
    confetti({ particleCount: 30, spread: 50 });
  };

  const handleWriterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWriterSubmitted(true);
    confetti({ particleCount: 60, spread: 70 });
  };

  return (
    <div id="vernunt-pages-feed" className="w-full max-w-5xl mx-auto space-y-6 font-sans pb-12 animate-fade-in text-left">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-red-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-rose-500/30 text-rose-200 px-3 py-1 rounded-full text-xs font-extrabold border border-rose-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Vernunt Pages &amp; Community Voices</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-serif tracking-tight">
            Raw, Real Stories: Motherhood, Fertility &amp; Parenting
          </h1>

          <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed">
            Read authentic birth stories, ask sensitive questions with complete anonymity, listen into live audio Pods, or write for Vernunt.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-new-page-post"
              onClick={() => setShowNewPostModal(true)}
              className="bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl shadow-md hover:scale-102 transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Share Your Story / Ask Advice</span>
            </button>
          </div>
        </div>

        <div className="absolute right-4 bottom-2 text-white/5 text-9xl font-black select-none pointer-events-none">
          📖
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'feed' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Vernunt Pages Timeline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pods')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pods' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Live Audio Pods</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('writer_portal')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'writer_portal' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Write for Vernunt</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: Timeline Feed */}
      {activeTab === 'feed' && (
        <div className="space-y-5">
          {/* Topic Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setSelectedTopic(topic)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                  selectedTopic === topic
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>

          {/* Posts Stream */}
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const hasLiked = post.likedBy?.includes(currentUserId);
              return (
                <div
                  key={post.id}
                  id={`post-card-${post.id}`}
                  className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition space-y-3"
                >
                  {/* Author Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {post.isAnonymous ? (
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-300 flex items-center justify-center text-base shadow-sm">
                          🛡️
                        </div>
                      ) : (
                        <img 
                          src={post.authorPhoto || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120'} 
                          alt={post.authorName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                            {post.isAnonymous ? (post.anonymousAlias || 'Anonymous Mom') : post.authorName}
                          </h4>
                          {post.isAnonymous && (
                            <span className="bg-rose-100 text-rose-800 text-[9px] font-black px-2 py-0.5 rounded-full">
                              Vernunt Safe Shield
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {post.authorRole || 'Community Guardian'} • {post.createdAt}
                        </p>
                      </div>
                    </div>

                    <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                      {post.topic}
                    </span>
                  </div>

                  {/* Title & Body */}
                  <div>
                    <h3 className="font-serif font-black text-base sm:text-lg text-slate-900 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 mt-2 leading-relaxed whitespace-pre-line font-normal">
                      {post.content}
                    </p>
                  </div>

                  {/* Comments preview if present */}
                  {post.comments && post.comments.length > 0 && (
                    <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 border border-slate-100">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                        Top Community Responses
                      </span>
                      {post.comments.map((c) => (
                        <div key={c.id} className="text-xs text-slate-700">
                          <strong className="text-slate-900">{c.authorName}:</strong> {c.content}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => handleLikePost(post.id)}
                        className={`flex items-center gap-1.5 transition cursor-pointer ${
                          hasLiked ? 'text-rose-600' : 'hover:text-rose-600'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-600' : ''}`} />
                        <span>{post.likesCount} Support</span>
                      </button>

                      <button
                        type="button"
                        className="flex items-center gap-1.5 hover:text-slate-800 transition cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.commentsCount} Comments</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      className="hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: Vernunt Pods (Live Audio Broadcasting) */}
      {activeTab === 'pods' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                  Vernunt Live Audio Stage
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {pods.reduce((acc, p) => acc + p.listenersCount, 0)} Listening Across India
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-serif">
              Drop In &amp; Listen to Parent Conversations in Real-Time
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              No camera required. Just raw, supportive conversations. Tap any live room below to join as a listener or raise your hand to speak on stage.
            </p>
          </div>

          {/* Pods Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pods.map((pod) => {
              const isCurrentActive = activePodId === pod.id;
              return (
                <div
                  key={pod.id}
                  className={`bg-white rounded-3xl border p-5 space-y-4 transition ${
                    isCurrentActive ? 'border-rose-500 ring-2 ring-rose-200 shadow-md' : 'border-slate-200/90 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Radio className="w-3 h-3 text-rose-600 animate-pulse" />
                      <span>Live Broadcast</span>
                    </span>

                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{pod.listenersCount}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif font-black text-slate-900 text-base leading-snug">
                      {pod.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {pod.description}
                    </p>
                  </div>

                  {/* Speakers on Stage */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      On Stage Now
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {pod.speakers.map((sp) => (
                        <div key={sp.id} className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-slate-200 text-xs font-bold text-slate-800">
                          <span className={`w-2 h-2 rounded-full ${sp.isSpeaking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                          <span>{sp.name}</span>
                          {sp.isSpeaking && <Volume2 className="w-3 h-3 text-emerald-600" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="pt-2 flex items-center justify-between">
                    {isCurrentActive ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsHandRaised(!isHandRaised)}
                          className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                            isHandRaised 
                              ? 'bg-amber-100 border-amber-300 text-amber-900' 
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <Hand className="w-4 h-4" />
                          <span>{isHandRaised ? "Hand Raised" : "Raise Hand"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsMuted(!isMuted)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                        >
                          {isMuted ? <MicOff className="w-4 h-4 text-red-600" /> : <Mic className="w-4 h-4 text-emerald-600" />}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActivePodId(pod.id)}
                        className="bg-rose-700 hover:bg-rose-800 text-white font-black text-xs py-2 px-4 rounded-xl shadow-xs transition cursor-pointer"
                      >
                        Join Room 🎧
                      </button>
                    )}

                    {isCurrentActive && (
                      <button
                        type="button"
                        onClick={() => setActivePodId(null)}
                        className="text-xs font-bold text-rose-700 hover:text-rose-900 cursor-pointer"
                      >
                        Leave Quietly
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 3: Write for Vernunt (Editorial Submission Portal) */}
      {activeTab === 'writer_portal' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Editorial Manifesto */}
          <div className="border-b border-slate-100 pb-6 space-y-3">
            <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
              Vernunt Editorial &amp; Storytelling
            </span>
            <h2 className="text-2xl font-black font-serif text-slate-900 tracking-tight">
              Motherhood is tough AF. So is TTC, PCOS &amp; Menopause.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
              We don’t believe in pastel sugar-coating. Vernunt is seeking raw, honest perspectives from mothers, fathers, fertility warriors, and pediatric healthcare professionals. If you have an unfiltered story, tactical parenting guide, or deep dive into women's reproductive health, pitch it to us below.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-bold text-slate-700">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                🍼 Fertility &amp; IVF Realities
              </div>
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                🧬 PCOS &amp; Women's Health
              </div>
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                🧠 Postpartum Recovery
              </div>
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                🌈 Diverse Family Experiences
              </div>
            </div>
          </div>

          {/* Submission Form */}
          {writerSubmitted ? (
            <div className="p-8 text-center bg-emerald-50 rounded-3xl border border-emerald-200 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl">
                ✓
              </div>
              <h3 className="text-lg font-black text-emerald-950 font-serif">
                Pitch Received! Thank You, {writerName}
              </h3>
              <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                Our editorial team reviews all submissions within 72 hours. If your pitch is greenlit, our editors will reach out at <strong>{writerEmail}</strong> to finalize your byline and distribution.
              </p>
              <button
                type="button"
                onClick={() => setWriterSubmitted(false)}
                className="bg-emerald-700 text-white font-black text-xs py-2 px-4 rounded-xl cursor-pointer"
              >
                Submit Another Pitch
              </button>
            </div>
          ) : (
            <form onSubmit={handleWriterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    value={writerName}
                    onChange={(e) => setWriterName(e.target.value)}
                    placeholder="e.g. Rohini Menon"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={writerEmail}
                    onChange={(e) => setWriterEmail(e.target.value)}
                    placeholder="writer@gmail.com"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Core Theme *</label>
                  <select
                    value={writerTheme}
                    onChange={(e) => setWriterTheme(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  >
                    <option value="Fertility & TTC">Fertility &amp; TTC Journeys</option>
                    <option value="Pregnancy Timelines">Pregnancy Realities &amp; Birth</option>
                    <option value="Postpartum & Mental Health">Postpartum Recovery &amp; Mental Health</option>
                    <option value="PCOS & Women's Health">PCOS, Endometriosis &amp; Hormones</option>
                    <option value="Menopause">Perimenopause &amp; Menopause</option>
                    <option value="Parenting Hacks">Practical Parenting Hacks</option>
                    <option value="LGBTQIA+ Parenting">LGBTQIA+ Family Stories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Working Article Title / Headline *</label>
                  <input
                    type="text"
                    value={writerPitchTitle}
                    onChange={(e) => setWriterPitchTitle(e.target.value)}
                    placeholder="e.g. What Nobody Told Me About Going Back to Work at 6 Months"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Article Synopsis or Full Draft *
                </label>
                <textarea
                  value={writerSynopsis}
                  onChange={(e) => setWriterSynopsis(e.target.value)}
                  rows={4}
                  placeholder="Outline your main points, personal experiences, or paste a link to your Google Doc/draft..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Short Writer Bio (2-3 lines)</label>
                <input
                  type="text"
                  value={writerBio}
                  onChange={(e) => setWriterBio(e.target.value)}
                  placeholder="e.g. Mother of twins, pediatric occupational therapist, Bangalore"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  id="btn-submit-writer-pitch"
                  className="bg-rose-700 hover:bg-rose-800 text-white font-black text-xs py-3 px-6 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Pitch to Vernunt Editorial</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Modal: Create New Post (with Anonymous safe mode) */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-fade-in text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-rose-700 tracking-wider block">
                  Vernunt Pages
                </span>
                <h3 className="text-base font-black text-slate-900 font-serif">
                  Write a Post / Share Story
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewPostModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3">
              {/* Anonymous Toggle Highlight */}
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="checkbox-anon-post"
                  checked={newPostIsAnonymous}
                  onChange={(e) => setNewPostIsAnonymous(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 mt-1 cursor-pointer"
                />
                <label htmlFor="checkbox-anon-post" className="text-xs cursor-pointer">
                  <span className="font-extrabold text-rose-950 block">Post Anonymously (Vernunt Safe Shield)</span>
                  <span className="text-[11px] text-rose-800 block leading-tight mt-0.5">
                    Your name, photo, and child details will be completely hidden. Recommended for sensitive topics like postpartum depression or relationship challenges.
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Topic</label>
                <select
                  value={newPostTopic}
                  onChange={(e) => setNewPostTopic(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                >
                  <option value="Birth Stories">Birth Stories</option>
                  <option value="Postpartum & Mental Health">Postpartum &amp; Mental Health</option>
                  <option value="TTC & Fertility">TTC &amp; Fertility</option>
                  <option value="Parenting Hacks">Parenting Hacks</option>
                  <option value="PCOS & Women's Health">PCOS &amp; Women's Health</option>
                  <option value="Toddler Tantrums">Toddler Tantrums</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Headline *</label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="Give your story or question a clear title..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Story / Message *</label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={5}
                  placeholder="Share your experience, tips, or question freely..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="text-xs text-slate-500 px-3 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-700 hover:bg-rose-800 text-white font-black text-xs py-2.5 px-5 rounded-xl cursor-pointer"
                >
                  Publish Story ✨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
