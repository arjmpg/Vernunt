/**
 * Vernunt Visual CMS & Frontend Page Builder Service
 * Provides in-place visual editing, block addition, image replacement, 
 * and persistent content overrides across all pages for verified administrators.
 */

export type VisualBlockType = 
  | 'banner' 
  | 'hero' 
  | 'text' 
  | 'image' 
  | 'heading' 
  | 'card' 
  | 'alert' 
  | 'custom_html';

export interface VisualBlock {
  id: string;
  pageId: string; // e.g. 'store', 'events', 'knowledge', 'specialists', 'groups', 'home', 'safety'
  type: VisualBlockType;
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  imageAlt?: string;
  buttonText?: string;
  buttonLink?: string;
  badgeText?: string;
  severity?: 'info' | 'success' | 'warning' | 'danger';
  bgColor?: string;
  textColor?: string;
  order: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VisualElementOverride {
  selectorKey: string; // unique identifier, e.g. "store-hero-title", "home-welcome-subtitle"
  pageId: string;
  type: 'text' | 'image' | 'html';
  content: string; // text string, HTML or image URL
  updatedAt: string;
}

const STORAGE_KEY_BLOCKS = 'vernunt_visual_cms_blocks_v1';
const STORAGE_KEY_OVERRIDES = 'vernunt_visual_cms_overrides_v1';
const STORAGE_KEY_EDIT_MODE = 'vernunt_visual_cms_edit_mode_active';

// Helper: Dispatches update event to trigger immediate UI reactivity
function notifyCmsUpdate(pageId?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vernunt_visual_cms_change', { detail: { pageId } }));
  }
}

// ---------------------------------------------------------------------------
// EDIT MODE STATE
// ---------------------------------------------------------------------------
export function isVisualEditModeActive(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY_EDIT_MODE) === 'true';
  } catch {
    return false;
  }
}

export function setVisualEditModeActive(active: boolean): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_EDIT_MODE, active ? 'true' : 'false');
    notifyCmsUpdate();
  } catch (err) {
    console.warn('Failed to update visual edit mode state:', err);
  }
}

// ---------------------------------------------------------------------------
// CUSTOM PAGE BLOCKS
// ---------------------------------------------------------------------------
export function getAllVisualBlocks(): VisualBlock[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY_BLOCKS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getVisualBlocksForPage(pageId: string): VisualBlock[] {
  const all = getAllVisualBlocks();
  return all
    .filter(b => b.pageId === pageId && b.isVisible)
    .sort((a, b) => a.order - b.order);
}

export function saveVisualBlock(block: VisualBlock): void {
  try {
    const all = getAllVisualBlocks();
    const existingIndex = all.findIndex(b => b.id === block.id);
    let updated: VisualBlock[];
    
    if (existingIndex >= 0) {
      updated = [...all];
      updated[existingIndex] = { ...block, updatedAt: new Date().toISOString() };
    } else {
      updated = [...all, { ...block, updatedAt: new Date().toISOString() }];
    }
    
    localStorage.setItem(STORAGE_KEY_BLOCKS, JSON.stringify(updated));
    notifyCmsUpdate(block.pageId);
  } catch (err) {
    console.error('Failed to save visual block:', err);
  }
}

export function deleteVisualBlock(blockId: string, pageId?: string): void {
  try {
    const all = getAllVisualBlocks();
    const updated = all.filter(b => b.id !== blockId);
    localStorage.setItem(STORAGE_KEY_BLOCKS, JSON.stringify(updated));
    notifyCmsUpdate(pageId);
  } catch (err) {
    console.error('Failed to delete visual block:', err);
  }
}

export function reorderVisualBlocks(pageId: string, blockIdsInOrder: string[]): void {
  try {
    const all = getAllVisualBlocks();
    const updated = all.map(block => {
      if (block.pageId === pageId) {
        const newOrder = blockIdsInOrder.indexOf(block.id);
        if (newOrder !== -1) {
          return { ...block, order: newOrder, updatedAt: new Date().toISOString() };
        }
      }
      return block;
    });
    localStorage.setItem(STORAGE_KEY_BLOCKS, JSON.stringify(updated));
    notifyCmsUpdate(pageId);
  } catch (err) {
    console.error('Failed to reorder visual blocks:', err);
  }
}

// ---------------------------------------------------------------------------
// INLINE ELEMENT OVERRIDES (TEXT & IMAGES)
// ---------------------------------------------------------------------------
export function getAllElementOverrides(): Record<string, VisualElementOverride> {
  try {
    if (typeof window === 'undefined') return {};
    const raw = localStorage.getItem(STORAGE_KEY_OVERRIDES);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getElementOverride(selectorKey: string): string | null {
  const overrides = getAllElementOverrides();
  return overrides[selectorKey]?.content ?? null;
}

export function saveElementOverride(
  selectorKey: string, 
  pageId: string, 
  type: 'text' | 'image' | 'html', 
  content: string
): void {
  try {
    const overrides = getAllElementOverrides();
    overrides[selectorKey] = {
      selectorKey,
      pageId,
      type,
      content,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(overrides));
    notifyCmsUpdate(pageId);
  } catch (err) {
    console.error('Failed to save element override:', err);
  }
}

export function deleteElementOverride(selectorKey: string, pageId?: string): void {
  try {
    const overrides = getAllElementOverrides();
    if (overrides[selectorKey]) {
      delete overrides[selectorKey];
      localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(overrides));
      notifyCmsUpdate(pageId);
    }
  } catch (err) {
    console.error('Failed to remove element override:', err);
  }
}

// ---------------------------------------------------------------------------
// RESET & BACKUP TOOLS
// ---------------------------------------------------------------------------
export function resetPageVisualOverrides(pageId: string): void {
  try {
    // 1. Remove blocks for page
    const allBlocks = getAllVisualBlocks().filter(b => b.pageId !== pageId);
    localStorage.setItem(STORAGE_KEY_BLOCKS, JSON.stringify(allBlocks));

    // 2. Remove element overrides for page
    const overrides = getAllElementOverrides();
    Object.keys(overrides).forEach(key => {
      if (overrides[key].pageId === pageId) {
        delete overrides[key];
      }
    });
    localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(overrides));

    notifyCmsUpdate(pageId);
  } catch (err) {
    console.error('Failed to reset page visual overrides:', err);
  }
}

export function exportVisualCmsJson(): string {
  return JSON.stringify({
    blocks: getAllVisualBlocks(),
    overrides: getAllElementOverrides(),
    exportedAt: new Date().toISOString(),
    version: '1.0'
  }, null, 2);
}

export function importVisualCmsJson(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.blocks && Array.isArray(parsed.blocks)) {
      localStorage.setItem(STORAGE_KEY_BLOCKS, JSON.stringify(parsed.blocks));
    }
    if (parsed.overrides && typeof parsed.overrides === 'object') {
      localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(parsed.overrides));
    }
    notifyCmsUpdate();
    return true;
  } catch (e) {
    console.error('Import visual CMS json failed:', e);
    return false;
  }
}
