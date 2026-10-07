import { CommunityEvent } from '../types.ts';

export type GatheringSubCategory = 'all' | 'event' | 'activity' | 'classes';

export interface SubCategoryMeta {
  key: 'event' | 'activity' | 'classes';
  label: string;
  shortLabel: string;
  badgeText: string;
  tagline: string;
  description: string;
  examples: string[];
  emoji: string;
  iconName: string;
  colorScheme: {
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    activeTab: string;
    ring: string;
    gradient: string;
  };
}

export const GATHERING_SUBCATEGORIES: Record<'event' | 'activity' | 'classes', SubCategoryMeta> = {
  event: {
    key: 'event',
    label: 'Events (1–7 Days)',
    shortLabel: 'Events',
    badgeText: '🎪 Event (1–7 Days)',
    tagline: 'Short-term experiences lasting 1 to 7 days',
    description: 'Short-term events like 1 to 7 days — weekend family popups, carnivals, puppet shows, storytelling, festivals, exhibitions and celebratory community gatherings.',
    examples: ['Weekend Carnivals', 'Puppet Shows', 'Folk Festivals', 'Storytelling Circles', 'Exhibitions & Fairs'],
    emoji: '🎪',
    iconName: 'Sparkles',
    colorScheme: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      badgeBg: 'bg-orange-500/10',
      badgeText: 'text-orange-700',
      activeTab: 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-500/25',
      ring: 'ring-orange-500',
      gradient: 'from-orange-500 to-amber-600'
    }
  },
  activity: {
    key: 'activity',
    label: 'Activities (Sports & Camps)',
    shortLabel: 'Activities',
    badgeText: '🏊 Activity (Sports/Camp)',
    tagline: 'Swimming, chess, sports drills & summer camps',
    description: 'Recreational activities and camps — swimming, chess, soccer, sports agility drills, summer camps, outdoor nature walks and multi-day adventure workshops.',
    examples: ['Swimming Camps', 'Chess Tournaments', 'Football & Agility', 'Summer Camps', 'Nature Adventures'],
    emoji: '🏊',
    iconName: 'Compass',
    colorScheme: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      badgeBg: 'bg-emerald-500/10',
      badgeText: 'text-emerald-700',
      activeTab: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25',
      ring: 'ring-emerald-500',
      gradient: 'from-emerald-500 to-teal-600'
    }
  },
  classes: {
    key: 'classes',
    label: 'Classes (Permanent & Tuition)',
    shortLabel: 'Classes',
    badgeText: '🎓 Permanent Class',
    tagline: 'Permanent classes like music, tuition & academies',
    description: 'Permanent, regular & ongoing classes — music lessons, school tuition, academic coaching, robotics academies, pottery studios, dance and martial arts.',
    examples: ['Music & Vocal Lessons', 'Math & Science Tuition', 'Robotics Academy', 'Pottery & Clay Studio', 'Dance & Martial Arts'],
    emoji: '🎓',
    iconName: 'BookOpen',
    colorScheme: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      badgeBg: 'bg-purple-500/10',
      badgeText: 'text-purple-700',
      activeTab: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25',
      ring: 'ring-purple-500',
      gradient: 'from-purple-500 to-indigo-600'
    }
  }
};

/**
 * Robustly inspects an event to determine its sub-category:
 * - 'event': short-term events (1 to 7 days)
 * - 'activity': swimming, chess, sports, summer camps
 * - 'classes': permanent classes (music, tuition, etc.)
 */
export function getGatheringSubCategory(evt: Partial<CommunityEvent> | null | undefined): 'event' | 'activity' | 'classes' {
  if (!evt) return 'event';

  // 1. Explicit itemCategoryType
  if (evt.itemCategoryType === 'event') return 'event';
  if (evt.itemCategoryType === 'activity') return 'activity';
  if (evt.itemCategoryType === 'classes') return 'classes';

  // 2. Explicit eventType matching
  if (evt.eventType === 'class') return 'classes';
  if (evt.eventType === 'activity') return 'activity';
  if (evt.eventType === 'event') return 'event';

  // 3. Category matching
  const cat = (evt.category || '').toLowerCase();
  if (cat.includes('class') || cat.includes('tuition') || cat.includes('academic') || cat.includes('music')) {
    return 'classes';
  }
  if (cat.includes('activity') || cat.includes('sport') || cat.includes('swim') || cat.includes('chess') || cat.includes('camp') || cat.includes('competition')) {
    return 'activity';
  }

  // 4. Text semantic heuristic from title, tags, description
  const combined = `${evt.title || ''} ${(evt.tags || []).join(' ')} ${evt.description || ''}`.toLowerCase();

  // Check permanent classes first (music, tuition, robotics, pottery studio, coaching)
  if (/(tuition|music class|vocal|flute|carnatic|classical music|math tuition|science tuition|academic coach|curriculum|coding class|robotics academy|pottery studio|dance academy|karate class|guitar|piano|violin)/i.test(combined)) {
    return 'classes';
  }

  // Check activities (swimming, chess, sports, summer camps, drills, tournaments)
  if (/(swim|chess|football|cricket|sports|agility|relay|summer camp|winter camp|day camp|athletics|skating|badminton|tennis|adventure camp|trek|obstacle course)/i.test(combined)) {
    return 'activity';
  }

  // Default to short-term event (1-7 days)
  return 'event';
}

/**
 * Returns user-friendly duration / schedule pill text
 */
export function getEventDurationLabel(evt: Partial<CommunityEvent>): string {
  const subCategory = getGatheringSubCategory(evt);
  if (subCategory === 'event') {
    if (evt.startDate && evt.endDate && evt.startDate !== evt.endDate) {
      return '1–7 Days Event';
    }
    return 'Short-Term (1–7 Days)';
  }
  if (subCategory === 'activity') {
    return 'Activity & Sports Camp';
  }
  return 'Permanent Weekly Class';
}
