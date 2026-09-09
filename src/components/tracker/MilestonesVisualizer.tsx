import React, { useState, useEffect, useMemo } from 'react';
import { 
  Baby, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Activity, 
  Award, 
  AlertTriangle, 
  Info, 
  ChevronRight, 
  ChevronDown, 
  Filter, 
  Plus, 
  Printer, 
  Brain, 
  Smile, 
  Heart, 
  Footprints, 
  Search, 
  X, 
  Edit3,
  Check,
  RotateCcw
} from 'lucide-react';
import { 
  ChildProfile, 
  BabyMilestone, 
  DevelopmentStage, 
  MilestoneCategory, 
  MilestoneStatus 
} from '../../types.ts';
import { 
  COMPREHENSIVE_MILESTONES, 
  MilestoneWithTips, 
  calculateAgeFromBirthDate, 
  calculateMilestoneTargetDate 
} from './milestoneData.ts';

interface MilestonesVisualizerProps {
  userProfile: ChildProfile | null;
  onUpdateChildBirthDate?: (birthDate: string, stage: DevelopmentStage) => void;
}

interface CustomMilestone {
  id: string;
  category: MilestoneCategory;
  title: string;
  description: string;
  expectedAgeMonths: number;
  achieved: boolean;
  status: MilestoneStatus;
  achievedDate?: string;
  notes?: string;
}

const CATEGORY_STYLES: Record<MilestoneCategory, {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: React.ReactNode;
}> = {
  'Motor': {
    label: 'Motor & Movement',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    icon: <Footprints className="w-3.5 h-3.5 text-emerald-600" />
  },
  'Speech': {
    label: 'Speech & Language',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    icon: <Activity className="w-3.5 h-3.5 text-indigo-600" />
  },
  'Cognitive': {
    label: 'Cognitive & Thinking',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: <Brain className="w-3.5 h-3.5 text-amber-600" />
  },
  'Social': {
    label: 'Social & Emotional',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    icon: <Heart className="w-3.5 h-3.5 text-rose-600" />
  },
  'Self-Care': {
    label: 'Self-Care & Habits',
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    icon: <Smile className="w-3.5 h-3.5 text-cyan-600" />
  },
  'Teething': {
    label: 'Teething & Growth',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    icon: <Sparkles className="w-3.5 h-3.5 text-orange-600" />
  }
};

const STAGES_LIST: DevelopmentStage[] = [
  'Newborn (0-3 months)',
  'Infant (4-11 months)',
  'Toddler (1-2 years)',
  'Early Preschooler (3-4 years)',
  'School-Age (5-8 years)'
];

export function MilestonesVisualizer({ userProfile }: MilestonesVisualizerProps) {
  // Child Name state
  const [childName, setChildName] = useState<string>(() => {
    return userProfile?.childName || localStorage.getItem('vernunt_child_name') || 'Baby';
  });

  // Default birth date: ~14 months ago if not specified
  const [birthDate, setBirthDate] = useState<string>(() => {
    if (userProfile?.birthDate) return userProfile.birthDate;
    const saved = localStorage.getItem('vernunt_child_birth_date');
    if (saved) return saved;

    // Default to ~10 months ago for lively immediate demo
    const d = new Date();
    d.setMonth(d.getMonth() - 10);
    return d.toISOString().split('T')[0];
  });

  // Calculate age details
  const ageDetails = useMemo(() => {
    return calculateAgeFromBirthDate(birthDate, userProfile?.childAge || 1);
  }, [birthDate, userProfile?.childAge]);

  // Stage selection with manual override support
  const [manualStage, setManualStage] = useState<DevelopmentStage | null>(null);
  const currentStage = manualStage || userProfile?.developmentStage || ageDetails.stage;

  // Milestone status overrides map: id -> { status, achievedDate, notes }
  const [milestoneStatusMap, setMilestoneStatusMap] = useState<Record<string, {
    status: MilestoneStatus;
    achievedDate?: string;
    notes?: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('vernunt_milestones_status_map');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  // Custom added milestones
  const [customMilestones, setCustomMilestones] = useState<CustomMilestone[]>(() => {
    try {
      const saved = localStorage.getItem('vernunt_custom_milestones');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Filtering states
  const [selectedCategory, setSelectedCategory] = useState<MilestoneCategory | 'All'>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'upcoming' | 'emerging' | 'achieved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTipsId, setExpandedTipsId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');

  // Add custom milestone modal
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState<MilestoneCategory>('Motor');
  const [customAgeMonths, setCustomAgeMonths] = useState<number>(ageDetails.totalMonths || 12);
  const [customDescription, setCustomDescription] = useState('');

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('vernunt_child_birth_date', birthDate);
      localStorage.setItem('vernunt_child_name', childName);
      localStorage.setItem('vernunt_milestones_status_map', JSON.stringify(milestoneStatusMap));
      localStorage.setItem('vernunt_custom_milestones', JSON.stringify(customMilestones));
    } catch (e) {
      console.error(e);
    }
  }, [birthDate, childName, milestoneStatusMap, customMilestones]);

  // Combine standard milestones with custom milestones and map with current status
  const allMilestones = useMemo(() => {
    const list: (MilestoneWithTips & { isCustom?: boolean; projectedDate: string })[] = [];

    // From standard groups
    COMPREHENSIVE_MILESTONES.forEach(group => {
      group.milestones.forEach(m => {
        const override = milestoneStatusMap[m.id];
        // Automatic baseline: if child is significantly older than expected age and not explicitly marked upcoming, treat as achieved
        const isPastAge = ageDetails.totalMonths > m.expectedAgeMonths + 1;
        const defaultStatus: MilestoneStatus = override?.status 
          ? override.status 
          : isPastAge 
            ? 'achieved' 
            : ageDetails.totalMonths >= m.expectedAgeMonths - 1 
              ? 'emerging' 
              : 'upcoming';

        list.push({
          ...m,
          achieved: defaultStatus === 'achieved',
          status: defaultStatus,
          achievedDate: override?.achievedDate || (defaultStatus === 'achieved' ? calculateMilestoneTargetDate(birthDate, m.expectedAgeMonths) : undefined),
          notes: override?.notes,
          projectedDate: calculateMilestoneTargetDate(birthDate, m.expectedAgeMonths)
        });
      });
    });

    // From custom milestones
    customMilestones.forEach(cm => {
      const override = milestoneStatusMap[cm.id];
      const status = override?.status || cm.status || (cm.achieved ? 'achieved' : 'upcoming');
      list.push({
        id: cm.id,
        category: cm.category,
        title: cm.title,
        description: cm.description,
        expectedAgeMonths: cm.expectedAgeMonths,
        achieved: status === 'achieved',
        status,
        achievedDate: override?.achievedDate || cm.achievedDate,
        notes: override?.notes || cm.notes,
        isCustom: true,
        projectedDate: calculateMilestoneTargetDate(birthDate, cm.expectedAgeMonths)
      });
    });

    return list.sort((a, b) => a.expectedAgeMonths - b.expectedAgeMonths);
  }, [milestoneStatusMap, customMilestones, ageDetails.totalMonths, birthDate]);

  // UPCOMING MILESTONES: specifically expected in the current or next age window!
  const upcomingMilestones = useMemo(() => {
    const currentMonths = ageDetails.totalMonths;
    // Window: from (currentMonths - 1) up to (currentMonths + 5)
    return allMilestones.filter(m => {
      if (m.status === 'achieved') return false;
      const diff = m.expectedAgeMonths - currentMonths;
      return diff >= -1 && diff <= 5;
    });
  }, [allMilestones, ageDetails.totalMonths]);

  // Filtered milestones for the main explorer
  const filteredMilestones = useMemo(() => {
    return allMilestones.filter(m => {
      if (selectedCategory !== 'All' && m.category !== selectedCategory) return false;
      if (selectedStatusFilter === 'upcoming' && m.status !== 'upcoming') return false;
      if (selectedStatusFilter === 'emerging' && m.status !== 'emerging') return false;
      if (selectedStatusFilter === 'achieved' && m.status !== 'achieved') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allMilestones, selectedCategory, selectedStatusFilter, searchQuery]);

  // Overall statistics
  const stats = useMemo(() => {
    // Only count milestones up to current age + 3 months to give a sensible relevant percentage
    const relevant = allMilestones.filter(m => m.expectedAgeMonths <= ageDetails.totalMonths + 2);
    const achieved = relevant.filter(m => m.status === 'achieved').length;
    const emerging = relevant.filter(m => m.status === 'emerging').length;
    const upcoming = relevant.filter(m => m.status === 'upcoming').length;
    const pct = relevant.length > 0 ? Math.round((achieved / relevant.length) * 100) : 0;

    // Per category breakdown
    const categoryCounts: Record<string, { total: number; achieved: number }> = {};
    allMilestones.forEach(m => {
      if (!categoryCounts[m.category]) {
        categoryCounts[m.category] = { total: 0, achieved: 0 };
      }
      categoryCounts[m.category].total++;
      if (m.status === 'achieved') {
        categoryCounts[m.category].achieved++;
      }
    });

    return {
      relevantCount: relevant.length,
      achieved,
      emerging,
      upcoming,
      pct,
      categoryCounts
    };
  }, [allMilestones, ageDetails.totalMonths]);

  // Handlers for toggling status
  const handleSetStatus = (id: string, newStatus: MilestoneStatus) => {
    setMilestoneStatusMap(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        status: newStatus,
        achievedDate: newStatus === 'achieved' ? new Date().toISOString().split('T')[0] : undefined
      }
    }));
  };

  const handleSaveNote = (id: string) => {
    setMilestoneStatusMap(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || { status: 'upcoming' }),
        notes: tempNoteText.trim()
      }
    }));
    setEditingNotesId(null);
    setTempNoteText('');
  };

  const handleAddCustomMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newMilestone: CustomMilestone = {
      id: `custom-ms-${Date.now()}`,
      category: customCategory,
      title: customTitle.trim(),
      description: customDescription.trim() || 'Custom family developmental milestone',
      expectedAgeMonths: customAgeMonths,
      achieved: false,
      status: 'upcoming'
    };

    setCustomMilestones(prev => [...prev, newMilestone]);
    setCustomTitle('');
    setCustomDescription('');
    setShowAddCustomModal(false);
  };

  // Quick Birth Date Presets
  const setPresetAge = (monthsAgo: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsAgo);
    setBirthDate(d.toISOString().split('T')[0]);
    setManualStage(null);
  };

  return (
    <div id="milestones-visualizer" className="space-y-6 text-left font-sans animate-fade-in">
      {/* CHILD PROFILE & AGE BAR */}
      <div className="bg-gradient-to-r from-amber-900 via-rose-900 to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                {currentStage}
              </span>
              <span className="text-amber-200 text-xs font-semibold">
                • {ageDetails.formattedAge}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-serif flex items-center gap-2">
              <span>{childName}'s Developmental Milestones</span>
              <button
                type="button"
                onClick={() => {
                  const name = prompt("Enter child's name:", childName);
                  if (name && name.trim()) setChildName(name.trim());
                }}
                className="text-white/60 hover:text-white transition p-1"
                title="Edit name"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </h2>
            <p className="text-xs text-rose-100/80 max-w-xl leading-relaxed">
              Personalized roadmap based on birth date and developmental stage according to CDC, WHO &amp; Indian Academy of Pediatrics (IAP) benchmarks.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setShowAddCustomModal(true)}
              className="flex-1 md:flex-none bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Milestone</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 border border-white/15"
              title="Print milestone report for pediatrician"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Report</span>
            </button>
          </div>
        </div>

        {/* Birth Date & Stage Configuration Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-black/30 p-3.5 rounded-2xl border border-white/10 text-xs">
          {/* Birth Date Input */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-300" />
              <span>Child Birth Date</span>
            </label>
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={birthDate}
              onChange={(e) => {
                setBirthDate(e.target.value);
                setManualStage(null);
              }}
              className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-amber-400 font-medium"
            />
          </div>

          {/* Development Stage Override */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3 text-amber-300" />
              <span>Current Stage</span>
            </label>
            <select
              value={currentStage}
              onChange={(e) => setManualStage(e.target.value as DevelopmentStage)}
              className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-2.5 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-amber-400 font-medium"
            >
              {STAGES_LIST.map(stg => (
                <option key={stg} value={stg} className="bg-slate-900 text-white">
                  {stg}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Age Jump Presets */}
          <div className="space-y-1 sm:col-span-2">
            <label className="block text-[10px] font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Quick Age Presets (Try Different Stages)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => setPresetAge(2)}
                className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold text-white transition cursor-pointer"
              >
                2m (Newborn)
              </button>
              <button
                type="button"
                onClick={() => setPresetAge(6)}
                className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold text-white transition cursor-pointer"
              >
                6m (Sitting)
              </button>
              <button
                type="button"
                onClick={() => setPresetAge(10)}
                className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold text-white transition cursor-pointer"
              >
                10m (Crawling)
              </button>
              <button
                type="button"
                onClick={() => setPresetAge(14)}
                className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold text-white transition cursor-pointer"
              >
                14m (Walking)
              </button>
              <button
                type="button"
                onClick={() => setPresetAge(24)}
                className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold text-white transition cursor-pointer"
              >
                2y (Phrases)
              </button>
              <button
                type="button"
                onClick={() => setPresetAge(36)}
                className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold text-white transition cursor-pointer"
              >
                3y (Tricycle)
              </button>
            </div>
          </div>
        </div>

        {/* Stage Milestone Summary Progress */}
        <div className="bg-white/10 p-3.5 rounded-2xl border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shrink-0">
              {stats.pct}%
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Current Stage Mastery</span>
                <span className="text-[10px] text-amber-300 font-normal">
                  ({stats.achieved} of {stats.relevantCount} milestones completed)
                </span>
              </div>
              <div className="text-[11px] text-white/70">
                {upcomingMilestones.length} age-appropriate milestones currently upcoming or in progress.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-400/30">
              <Check className="w-3 h-3" /> {stats.achieved} Mastered
            </span>
            <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-400/30">
              <Clock className="w-3 h-3" /> {stats.emerging} Emerging
            </span>
            <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md border border-blue-400/30">
              <Sparkles className="w-3 h-3" /> {stats.upcoming} Upcoming
            </span>
          </div>
        </div>
      </div>

      {/* SPOTLIGHT: UPCOMING AGE-APPROPRIATE MILESTONES (Based on Birth Date) */}
      <div className="bg-gradient-to-br from-rose-50/70 via-amber-50/50 to-orange-50/40 p-5 sm:p-6 rounded-3xl border border-rose-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs mb-1">
              <Clock className="w-3 h-3" />
              <span>Upcoming Focus Window</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 font-serif">
              Upcoming Milestones for {childName} ({ageDetails.formattedAge})
            </h3>
            <p className="text-xs text-slate-600">
              Key developmental skills emerging in the next 1 to 3 months based on birth date ({birthDate}).
            </p>
          </div>

          <span className="text-xs font-bold text-rose-700 bg-white px-3 py-1.5 rounded-xl border border-rose-200 shadow-2xs">
            {upcomingMilestones.length} skills expected soon
          </span>
        </div>

        {upcomingMilestones.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-rose-100 text-center space-y-2">
            <Award className="w-8 h-8 text-amber-500 mx-auto" />
            <h4 className="text-sm font-black text-slate-800">All current window milestones marked mastered!</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {childName} has achieved all key milestones for the current age window. Check out the roadmap below for future upcoming goals!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {upcomingMilestones.map((milestone) => {
              const categoryInfo = CATEGORY_STYLES[milestone.category] || CATEGORY_STYLES['Motor'];
              const isEmerging = milestone.status === 'emerging';
              const monthsDiff = milestone.expectedAgeMonths - ageDetails.totalMonths;
              
              let timingBadge = '';
              if (monthsDiff <= 0) {
                timingBadge = 'Current Window (Active)';
              } else if (monthsDiff === 1) {
                timingBadge = 'Expected Next Month';
              } else {
                timingBadge = `Expected in ~${monthsDiff} Months`;
              }

              return (
                <div 
                  key={milestone.id}
                  className={`bg-white rounded-2xl p-4 border transition duration-200 shadow-2xs space-y-3 flex flex-col justify-between ${
                    isEmerging ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200 hover:border-rose-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${categoryInfo.bg} ${categoryInfo.text} ${categoryInfo.border}`}>
                        {categoryInfo.icon}
                        <span>{categoryInfo.label}</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          Expected: {milestone.expectedAgeMonths}m ({milestone.projectedDate})
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          isEmerging ? 'bg-amber-100 text-amber-900' : 'bg-rose-50 text-rose-800'
                        }`}>
                          {timingBadge}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm font-black text-slate-900 leading-snug">
                      {milestone.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {milestone.description}
                    </p>

                    {/* Pediatric Parent Tip Preview */}
                    {milestone.parentTips && (
                      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 text-[11px] text-amber-950 space-y-0.5">
                        <div className="font-black text-amber-900 flex items-center gap-1 text-[10px] uppercase tracking-wider">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>How to encourage this skill</span>
                        </div>
                        <p className="text-amber-900/90 leading-normal">
                          {milestone.parentTips}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Status Toggle Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSetStatus(milestone.id, 'emerging')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          isEmerging 
                            ? 'bg-amber-500 text-slate-950 font-black shadow-2xs' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        🔄 Practicing / Emerging
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSetStatus(milestone.id, 'achieved')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg transition cursor-pointer shadow-xs flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Mastered!</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DOMAIN MASTERY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {(['Motor', 'Speech', 'Cognitive', 'Social', 'Self-Care'] as MilestoneCategory[]).map(cat => {
          const info = CATEGORY_STYLES[cat];
          const cCount = stats.categoryCounts[cat] || { total: 0, achieved: 0 };
          const cPct = cCount.total > 0 ? Math.round((cCount.achieved / cCount.total) * 100) : 0;
          const isSelected = selectedCategory === cat;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(isSelected ? 'All' : cat)}
              className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                isSelected 
                  ? 'bg-rose-900 text-white border-rose-950 shadow-sm' 
                  : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`p-1.5 rounded-xl ${isSelected ? 'bg-white/20 text-white' : `${info.bg} ${info.text}`}`}>
                  {info.icon}
                </span>
                <span className={`text-xs font-black ${isSelected ? 'text-amber-300' : 'text-slate-900'}`}>
                  {cPct}%
                </span>
              </div>
              <div className="text-xs font-black truncate">{info.label}</div>
              <div className={`text-[10px] ${isSelected ? 'text-white/75' : 'text-slate-500'}`}>
                {cCount.achieved}/{cCount.total} mastered
              </div>
            </button>
          );
        })}
      </div>

      {/* FULL MILESTONES EXPLORER & TIMELINE */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Complete Developmental Roadmap (0 to 8 Years)
            </h3>
            <p className="text-xs text-slate-500">
              Browse age-appropriate milestones across all domains. Click any milestone to update progress or add personal memories.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="inline-flex bg-slate-100 p-1 rounded-xl gap-1 text-[11px] font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  selectedStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                All ({allMilestones.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('upcoming')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  selectedStatusFilter === 'upcoming' ? 'bg-rose-700 text-white shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                Upcoming
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('emerging')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  selectedStatusFilter === 'emerging' ? 'bg-amber-500 text-slate-950 font-black shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                Emerging
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('achieved')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  selectedStatusFilter === 'achieved' ? 'bg-emerald-600 text-white shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                Mastered
              </button>
            </div>
          </div>
        </div>

        {/* Milestone Cards List */}
        <div className="space-y-3">
          {filteredMilestones.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Filter className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">No milestones match your current search and filter criteria.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedStatusFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs text-rose-700 font-bold hover:underline"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredMilestones.map((milestone) => {
              const isAchieved = milestone.status === 'achieved';
              const isEmerging = milestone.status === 'emerging';
              const isUpcoming = milestone.status === 'upcoming';
              const categoryInfo = CATEGORY_STYLES[milestone.category] || CATEGORY_STYLES['Motor'];
              const isExpanded = expandedTipsId === milestone.id;
              const isEditingNotes = editingNotesId === milestone.id;

              // Current child relative age indicator
              const isCurrentAge = Math.abs(milestone.expectedAgeMonths - ageDetails.totalMonths) <= 1;

              return (
                <div
                  key={milestone.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 space-y-3 ${
                    isAchieved
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isEmerging
                        ? 'bg-amber-50/40 border-amber-200 ring-1 ring-amber-200'
                        : isCurrentAge
                          ? 'bg-rose-50/30 border-rose-200'
                          : 'bg-white border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${categoryInfo.bg} ${categoryInfo.text} ${categoryInfo.border}`}>
                        {categoryInfo.icon}
                        <span>{categoryInfo.label}</span>
                      </span>

                      <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        {milestone.expectedAgeMonths} Months
                      </span>

                      {isCurrentAge && (
                        <span className="text-[10px] font-extrabold bg-rose-600 text-white px-2 py-0.5 rounded-md animate-pulse">
                          📍 Current Age ({ageDetails.formattedAge})
                        </span>
                      )}

                      {milestone.isCustom && (
                        <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-md">
                          Family Custom Milestone
                        </span>
                      )}
                    </div>

                    {/* Status Pill Toggle */}
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => handleSetStatus(milestone.id, 'upcoming')}
                        className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                          isUpcoming ? 'bg-white text-slate-800 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Upcoming
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetStatus(milestone.id, 'emerging')}
                        className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                          isEmerging ? 'bg-amber-400 text-slate-950 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Emerging
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetStatus(milestone.id, 'achieved')}
                        className={`px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                          isAchieved ? 'bg-emerald-600 text-white shadow-2xs font-black' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>Mastered</span>
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className={`text-sm font-black leading-snug flex items-center gap-2 ${
                      isAchieved ? 'text-emerald-950 line-through/40' : 'text-slate-900'
                    }`}>
                      {milestone.title}
                      {isAchieved && (
                        <span className="no-underline text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          🎉 Mastered {milestone.achievedDate ? `on ${milestone.achievedDate}` : ''}
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                      {milestone.description}
                    </p>
                  </div>

                  {/* Notes display if saved */}
                  {milestone.notes && !isEditingNotes && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                          Parent Memory / Note:
                        </span>
                        <p className="italic text-slate-800">{milestone.notes}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNotesId(milestone.id);
                          setTempNoteText(milestone.notes || '');
                        }}
                        className="text-slate-400 hover:text-slate-600 p-1"
                        title="Edit note"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Editing note form */}
                  {isEditingNotes && (
                    <div className="space-y-2 pt-1">
                      <textarea
                        value={tempNoteText}
                        onChange={(e) => setTempNoteText(e.target.value)}
                        placeholder="Write a special memory (e.g. Took 3 steps at Grandma's house!)..."
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                        rows={2}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingNotesId(null)}
                          className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveNote(milestone.id)}
                          className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                        >
                          Save Memory
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Pediatric Guidance & Red Flags Expandable Accordion */}
                  {(milestone.parentTips || milestone.redFlags) && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setExpandedTipsId(isExpanded ? null : milestone.id)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Info className="w-3 h-3 text-slate-400" />
                        <span>{isExpanded ? 'Hide Pediatric Guidance' : 'View Pediatric Stimulation Tips & Red Flags'}</span>
                        <ChevronDown className={`w-3 h-3 transition duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="mt-2.5 grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 text-xs animate-fade-in">
                          {milestone.parentTips && (
                            <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3 text-[11px] text-amber-950 space-y-1">
                              <span className="font-extrabold text-amber-900 block flex items-center gap-1 text-[10px] uppercase tracking-wider">
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                Parent Stimulation Play Activity
                              </span>
                              <p className="text-amber-900/90 leading-relaxed">
                                {milestone.parentTips}
                              </p>
                            </div>
                          )}

                          {milestone.redFlags && (
                            <div className="bg-rose-50/90 border border-rose-200/90 rounded-xl p-3 text-[11px] text-rose-950 space-y-1">
                              <span className="font-extrabold text-rose-900 block flex items-center gap-1 text-[10px] uppercase tracking-wider">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                When to Consult Pediatrician
                              </span>
                              <p className="text-rose-900/90 leading-relaxed">
                                {milestone.redFlags}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add note trigger if not already present */}
                  {!milestone.notes && !isEditingNotes && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNotesId(milestone.id);
                        setTempNoteText('');
                      }}
                      className="text-[11px] text-slate-400 hover:text-rose-700 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add baby memory / note for this milestone</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL: ADD CUSTOM MILESTONE */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 space-y-4 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Add Custom Baby Milestone</h3>
                  <p className="text-[11px] text-slate-500">Log a unique family or developmental achievement</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomMilestone} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Milestone Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Said first word 'Dadi', First swim lesson, Clapped to music"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-rose-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Developmental Domain
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as MilestoneCategory)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="Motor">Motor &amp; Movement</option>
                    <option value="Speech">Speech &amp; Language</option>
                    <option value="Cognitive">Cognitive &amp; Thinking</option>
                    <option value="Social">Social &amp; Emotional</option>
                    <option value="Self-Care">Self-Care &amp; Routine</option>
                    <option value="Teething">Teething &amp; Dental</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Target Age (Months)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={customAgeMonths}
                    onChange={(e) => setCustomAgeMonths(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Description / Context (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Add details on how this milestone happened or family significance..."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
