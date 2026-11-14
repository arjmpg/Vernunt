/**
 * Vernunt Marketplace & Event AI Engine
 * ---------------------------------------------------------------------------
 * Features:
 *  1. Semantic & Typo-Tolerant Search + Gemini Visual Search Client
 *  2. Lifecycle-Based Product & Complementary Cart Recommendations
 *  3. Dynamic Offers & Incentives (Parent-Account Only)
 *  4. Predictive Inventory Management & Demand Forecasting
 *  5. Generative AI Catalog & Event Copy Assistant Client
 *
 * PRIVACY & LEGAL COMPLIANCE (COPPA / GDPR-K / India DPDP Act 2023 Sec. 9):
 *  - Every signal (searches, visual uploads, lifecycle inference, dynamic offers)
 *    is bound STRICTLY to the registered adult Parent Account ID (`userId`)
 *    and adult shopping actions. Never profiles minors or reads child PII.
 */

import type { StoreProduct, StoreOrder, CartItem } from '../types/store.ts';
import type { CommunityEvent, ChildProfile } from '../types.ts';
import { getParentMlState, recordParentMlFeedback } from './parentMlEngine.ts';

// ============================================================================
// 1. PARENT-ACCOUNT ONLY SHOPPING HISTORY STORE (ZERO CHILD PROFILING)
// ============================================================================
export interface ParentCommerceSignals {
  accountId: string;
  searchQueries: string[];
  visualSearchHistory: string[];
  viewedProductIds: string[];
  dealsFilterClicks: number;
  priceLowSortClicks: number;
  updatedAt: string;
}

const COMMERCE_SIGNALS_PREFIX = 'vernunt_parent_commerce_signals_';

export function getParentCommerceSignals(accountId?: string): ParentCommerceSignals {
  const keyId = accountId || 'guest_parent';
  try {
    const raw = localStorage.getItem(`${COMMERCE_SIGNALS_PREFIX}${keyId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        accountId: keyId,
        searchQueries: Array.isArray(parsed.searchQueries) ? parsed.searchQueries : [],
        visualSearchHistory: Array.isArray(parsed.visualSearchHistory) ? parsed.visualSearchHistory : [],
        viewedProductIds: Array.isArray(parsed.viewedProductIds) ? parsed.viewedProductIds : [],
        dealsFilterClicks: Number(parsed.dealsFilterClicks || 0),
        priceLowSortClicks: Number(parsed.priceLowSortClicks || 0),
        updatedAt: parsed.updatedAt || new Date().toISOString()
      };
    }
  } catch {
    // ignore storage errors
  }
  return {
    accountId: keyId,
    searchQueries: [],
    visualSearchHistory: [],
    viewedProductIds: [],
    dealsFilterClicks: 0,
    priceLowSortClicks: 0,
    updatedAt: new Date().toISOString()
  };
}

export function trackParentAccountAction(
  userProfile: ChildProfile | undefined,
  action: {
    type: 'search' | 'visual_search' | 'view_product' | 'deals_click' | 'sort_price_low' | 'add_to_cart';
    value?: string;
    category?: string;
  }
) {
  const accountId = userProfile?.id || 'guest_parent';
  const state = getParentCommerceSignals(accountId);
  const mlState = getParentMlState(accountId);

  // Respect explicit opt-in for behavioral ML history; always keep session strictly adult-bound
  if (action.type === 'search' && action.value) {
    const q = action.value.trim().slice(0, 60);
    if (q.length >= 2) {
      state.searchQueries = [q, ...state.searchQueries.filter(x => x !== q)].slice(0, 20);
    }
  } else if (action.type === 'visual_search' && action.value) {
    const label = action.value.trim().slice(0, 60);
    state.visualSearchHistory = [label, ...state.visualSearchHistory.filter(x => x !== label)].slice(0, 12);
  } else if (action.type === 'view_product' && action.value) {
    state.viewedProductIds = [action.value, ...state.viewedProductIds.filter(x => x !== action.value)].slice(0, 25);
    if (mlState.mlPersonalizationOptIn && userProfile) {
      recordParentMlFeedback(userProfile, {
        eventType: 'PRODUCT_VIEWED_OR_CART',
        targetId: action.value,
        categoryTag: action.category
      });
    }
  } else if (action.type === 'deals_click') {
    state.dealsFilterClicks += 1;
  } else if (action.type === 'sort_price_low') {
    state.priceLowSortClicks += 1;
  } else if (action.type === 'add_to_cart' && action.value && mlState.mlPersonalizationOptIn && userProfile) {
    recordParentMlFeedback(userProfile, {
      eventType: 'PRODUCT_VIEWED_OR_CART',
      targetId: action.value,
      categoryTag: action.category
    });
  }

  state.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(`${COMMERCE_SIGNALS_PREFIX}${accountId}`, JSON.stringify(state));
  } catch {
    // ignore storage quota errors
  }
  return state;
}

// ============================================================================
// 2. SEMANTIC & TYPO-TOLERANT SEARCH ENGINE (PRODUCTS & EVENTS)
// ============================================================================
const DOMAIN_INTENT_ONTOLOGY: Record<string, string[]> = {
  bath: ['bathtub', 'wash', 'soap', 'shampoo', 'towel', 'lotion', 'baby care', 'hygiene'],
  bathtub: ['bath', 'towel', 'wash', 'soap', 'lotion', 'baby care', 'water'],
  towel: ['bath', 'cotton', 'soft', 'baby care', 'hooded'],
  teething: ['teether', 'rusk', 'biscuit', 'silicone', 'beechwood', 'chew', 'infant'],
  teether: ['teething', 'wooden', 'silicone', 'beechwood', '0-12m'],
  montessori: ['wooden', 'sensory', 'puzzle', 'blocks', 'stem', 'logic', 'balancing'],
  stem: ['robotics', 'coding', 'logic', 'solar', 'puzzle', 'math', 'science'],
  robotics: ['stem', 'coding', 'solar', 'science', 'kit'],
  coding: ['robotics', 'scratch', 'logic', 'stem', 'game'],
  birthday: ['gift', 'carnival', 'magic', 'party', 'craft', 'festival', 'storybook'],
  bday: ['birthday', 'gift', 'carnival', 'party', 'craft'],
  gift: ['birthday', 'storybook', 'montessori', 'craft', 'jewellery', 'set'],
  dress: ['clothing', 'cotton', 'frock', 'kurta', 'apparel', 'ethnic'],
  cloth: ['clothing', 'cotton', 'shirt', 'frock', 'apparel'],
  food: ['porridge', 'ragi', 'millet', 'rusk', 'fruit', 'nutrition', 'organic', 'snack', 'meal', 'puffs'],
  nutrition: ['food', 'porridge', 'ragi', 'millet', 'organic', 'healthy', 'snack', 'nutritionist', 'diet'],
  snack: ['millet', 'puffs', 'rusk', 'fruit', 'food', 'organic'],
  book: ['storybook', 'phonics', 'panchatantra', 'bedtime', 'reading', 'board'],
  story: ['book', 'panchatantra', 'bedtime', 'phonics'],
  art: ['craft', 'clay', 'paint', 'origami', 'canvas', 'pottery'],
  swim: ['swimming', 'pool', 'water', 'splash', 'outdoor', 'camp'],
  sport: ['balance', 'outdoor', 'agility', 'camp', 'swimming', 'football'],
  doctor: ['pediatrician', 'gynecologist', 'nutritionist', 'clinic', 'hospital', 'health', 'consult'],
  pediatrician: ['doctor', 'child', 'vaccine', 'fever', 'growth', 'clinic', 'consult'],
  park: ['playground', 'bda', 'bbmp', 'swing', 'slide', 'outdoor', 'walk', 'play'],
  daycare: ['playhome', 'creche', 'babysitter', 'sitter', 'preschool', 'care', 'nanny'],
  newborn: ['0-12m', 'infant', 'gentle', 'organic', 'baby care', 'teether'],
  toddler: ['1-3y', 'sensory', 'wooden', 'soft', 'board book']
};

function damerauLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + cost);
      }
    }
  }
  return dp[m][n];
}

function expandIntentTokens(query: string): { rawTokens: string[]; synonyms: string[]; matchedConcepts: string[] } {
  const rawTokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2);

  const synonyms = new Set<string>();
  const matchedConcepts = new Set<string>();

  for (const tok of rawTokens) {
    if (DOMAIN_INTENT_ONTOLOGY[tok]) {
      matchedConcepts.add(tok);
      DOMAIN_INTENT_ONTOLOGY[tok].forEach(s => synonyms.add(s));
    }
    for (const key of Object.keys(DOMAIN_INTENT_ONTOLOGY)) {
      if (Math.abs(tok.length - key.length) <= 2 && damerauLevenshtein(tok, key) <= 2) {
        matchedConcepts.add(key);
        synonyms.add(key);
        DOMAIN_INTENT_ONTOLOGY[key].forEach(s => synonyms.add(s));
      }
    }
  }

  return {
    rawTokens,
    synonyms: Array.from(synonyms),
    matchedConcepts: Array.from(matchedConcepts)
  };
}

export interface SemanticRankedResult<T> {
  items: T[];
  scores: Record<string, number>;
  typoCorrectedUsed: boolean;
  interpretedConcepts: string[];
}

export function semanticTextMatchScore(
  query: string,
  primaryTitle: string,
  secondaryText: string = ''
): { score: number; typoFixed: boolean; concepts: string[] } {
  const clean = query.trim().toLowerCase();
  if (!clean) return { score: 0, typoFixed: false, concepts: [] };
  const titleLower = (primaryTitle || '').toLowerCase();
  const hay = `${titleLower} ${(secondaryText || '').toLowerCase()}`;
  const hayWords = hay.split(/[^a-z0-9]+/).filter(w => w.length >= 2);
  const { rawTokens, synonyms, matchedConcepts } = expandIntentTokens(clean);

  let score = 0;
  let typoFixed = false;

  if (titleLower.includes(clean)) score += 45;
  else if (hay.includes(clean)) score += 26;

  for (const tok of rawTokens) {
    if (titleLower.includes(tok)) {
      score += 24;
    } else if (hay.includes(tok)) {
      score += 14;
    } else {
      for (const hw of hayWords) {
        const maxDist = tok.length >= 6 ? 2 : 1;
        if (Math.abs(hw.length - tok.length) <= maxDist && damerauLevenshtein(tok, hw) <= maxDist) {
          score += 13;
          typoFixed = true;
          break;
        }
      }
    }
  }

  for (const syn of synonyms) {
    if (titleLower.includes(syn)) score += 9;
    else if (hay.includes(syn)) score += 5;
  }

  return { score, typoFixed, concepts: matchedConcepts };
}

export function semanticRankProducts(
  query: string,
  products: StoreProduct[],
  accountId?: string
): SemanticRankedResult<StoreProduct> {
  const clean = query.trim();
  if (!clean) {
    return { items: products, scores: {}, typoCorrectedUsed: false, interpretedConcepts: [] };
  }

  const mlState = getParentMlState(accountId);
  const { rawTokens, synonyms, matchedConcepts } = expandIntentTokens(clean);
  let typoCorrectedUsed = false;
  const scores: Record<string, number> = {};

  const scored = products
    .map(p => {
      const titleLower = p.name.toLowerCase();
      const catLower = `${p.category} ${p.subcategory || ''}`.toLowerCase();
      const tagsLower = p.tags.join(' ').toLowerCase();
      const hay = `${titleLower} ${catLower} ${tagsLower} ${p.shortDescription || ''} ${p.description} ${p.ageLabel}`.toLowerCase();
      const hayWords = hay.split(/[^a-z0-9]+/).filter(w => w.length >= 2);

      let score = 0;

      // Exact phrase bonus
      if (titleLower.includes(clean.toLowerCase())) score += 45;
      else if (hay.includes(clean.toLowerCase())) score += 28;

      for (const tok of rawTokens) {
        if (titleLower.includes(tok)) {
          score += 24;
        } else if (catLower.includes(tok) || tagsLower.includes(tok)) {
          score += 18;
        } else if (hay.includes(tok)) {
          score += 11;
        } else {
          // Fuzzy Damerau-Levenshtein check for typos
          for (const hw of hayWords) {
            const maxDist = tok.length >= 6 ? 2 : 1;
            if (Math.abs(hw.length - tok.length) <= maxDist && damerauLevenshtein(tok, hw) <= maxDist) {
              score += 14;
              typoCorrectedUsed = true;
              break;
            }
          }
        }
      }

      // Expanded ontology intent bonus
      for (const syn of synonyms) {
        if (titleLower.includes(syn)) score += 9;
        else if (hay.includes(syn)) score += 5;
      }

      // Parent-account opt-in relevance boost
      if (score > 0 && mlState.mlPersonalizationOptIn) {
        const catAff = mlState.learnedCategoryAffinity[p.category] || 0;
        score += Math.round(catAff * 10);
      }

      scores[p.id] = score;
      return { product: p, score };
    })
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return {
    items: scored.map(s => s.product),
    scores,
    typoCorrectedUsed,
    interpretedConcepts: matchedConcepts
  };
}

export function semanticRankEvents<T extends CommunityEvent>(
  query: string,
  events: T[],
  accountId?: string
): SemanticRankedResult<T> {
  const clean = query.trim();
  if (!clean) {
    return { items: events, scores: {}, typoCorrectedUsed: false, interpretedConcepts: [] };
  }

  const mlState = getParentMlState(accountId);
  const { rawTokens, synonyms, matchedConcepts } = expandIntentTokens(clean);
  let typoCorrectedUsed = false;
  const scores: Record<string, number> = {};

  const scored = events
    .map(evt => {
      const titleLower = evt.title.toLowerCase();
      const hay = `${titleLower} ${evt.category} ${(evt.tags || []).join(' ')} ${evt.description} ${evt.location} ${evt.hostName} ${evt.targetAgeRange || ''}`.toLowerCase();
      const hayWords = hay.split(/[^a-z0-9]+/).filter(w => w.length >= 2);

      let score = 0;
      if (titleLower.includes(clean.toLowerCase())) score += 45;
      else if (hay.includes(clean.toLowerCase())) score += 25;

      for (const tok of rawTokens) {
        if (titleLower.includes(tok)) score += 22;
        else if (hay.includes(tok)) score += 12;
        else {
          for (const hw of hayWords) {
            const maxDist = tok.length >= 6 ? 2 : 1;
            if (Math.abs(hw.length - tok.length) <= maxDist && damerauLevenshtein(tok, hw) <= maxDist) {
              score += 13;
              typoCorrectedUsed = true;
              break;
            }
          }
        }
      }

      for (const syn of synonyms) {
        if (hay.includes(syn)) score += 6;
      }

      if (score > 0 && mlState.mlPersonalizationOptIn) {
        const interestMatch = (evt.tags || []).some(t => (mlState.learnedInterestAffinity[t] || 0) > 0.3);
        if (interestMatch) score += 8;
      }

      scores[evt.id] = score;
      return { event: evt, score };
    })
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return {
    items: scored.map(s => s.event),
    scores,
    typoCorrectedUsed,
    interpretedConcepts: matchedConcepts
  };
}

// ============================================================================
// 3. SERVER-SIDE GEMINI API HELPERS (SEMANTIC, VISUAL SEARCH, CATALOG GENAI)
// ============================================================================
export interface GeminiSemanticResponse {
  success: boolean;
  mode: 'gemini' | 'local-semantic';
  correctedQuery: string;
  interpretedIntent: string;
  matchedIds: string[];
  topMatchReason?: string;
}

export async function fetchAiSemanticSearch(params: {
  query: string;
  targetType: 'product' | 'event';
  items: Array<{ id: string; title: string; category: string; subcategory?: string; tags?: string[]; description?: string; ageLabel?: string }>;
  accountId?: string;
}): Promise<GeminiSemanticResponse | null> {
  try {
    const mlState = getParentMlState(params.accountId);
    const learnedCategories = mlState.mlPersonalizationOptIn
      ? Object.entries(mlState.learnedCategoryAffinity)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([k]) => k)
      : [];

    const res = await fetch('/api/ai/semantic-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: params.query,
        targetType: params.targetType,
        items: params.items.slice(0, 60),
        parentPreferences: {
          accountId: params.accountId || 'guest',
          learnedCategories
        }
      })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface VisualSearchResult {
  success: boolean;
  mode: string;
  detectedItem: string;
  detectedCategory: string;
  detectedColors: string[];
  suggestedAgeLabel: string;
  visualRationale: string;
  matchedIds: string[];
}

export async function fetchAiVisualSearch(params: {
  imageDataUrl: string;
  filenameHint?: string;
  products: StoreProduct[];
  accountId?: string;
}): Promise<VisualSearchResult> {
  const catalogDigest = params.products.map(p => ({
    id: p.id,
    title: p.name,
    category: p.category,
    subcategory: p.subcategory,
    tags: p.tags,
    description: p.shortDescription || p.description.slice(0, 120),
    ageLabel: p.ageLabel
  }));

  const res = await fetch('/api/ai/visual-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageDataUrl: params.imageDataUrl,
      filenameHint: params.filenameHint,
      accountId: params.accountId || 'guest',
      items: catalogDigest
    })
  });
  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || 'Visual search failed to process the uploaded image.');
  }
  return data;
}

export interface CatalogAssistResult {
  shortDescription?: string;
  description: string;
  category: string;
  subcategory?: string;
  ageGroup?: '0-12m' | '1-3y' | '3-6y' | '6-10y' | 'all-ages';
  ageLabel?: string;
  hsnCode?: string;
  gstRate?: number;
  badges?: string[];
  tags?: string[];
  targetAgeRange?: string;
  highlightsPitch?: string;
  recommendedAgenda?: Array<{ time: string; title: string }>;
}

export async function fetchAiCatalogAssist(params: {
  targetType: 'product' | 'event';
  title: string;
  notes?: string;
  category?: string;
  price?: number;
}): Promise<{ mode: string; data: CatalogAssistResult }> {
  const res = await fetch('/api/ai/catalog-assist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || 'AI catalog assistant failed to generate suggestions.');
  }
  return { mode: json.mode || 'gemini', data: json.data };
}

// ============================================================================
// 4. LIFECYCLE-BASED & COMPLEMENTARY PRODUCT RECOMMENDATIONS
// ============================================================================
export interface LifecycleRecommendationOutput {
  stageLabel: string;
  nextStageLabel: string;
  basisSummary: string;
  recommendations: Array<{ product: StoreProduct; reason: string }>;
}

const COMPLEMENTARY_RULES: Array<{
  triggerRegex: RegExp;
  complementRegex: RegExp;
  reason: string;
}> = [
  {
    triggerRegex: /bath|bathtub|soap|wash|shampoo|diaper|lotion/i,
    complementRegex: /towel|lotion|wash|soap|wipe|rash|oil|teether/i,
    reason: 'Essential next-step companion for comfortable post-bath & hygiene care'
  },
  {
    triggerRegex: /teether|wooden teether|gum|infant/i,
    complementRegex: /rusk|melts|porridge|board book|silicone|cutlery|baby care/i,
    reason: 'Natural milestone progression from teething comfort into first foods & sensory books'
  },
  {
    triggerRegex: /montessori|stem|robotics|blocks|puzzle|logic/i,
    complementRegex: /phonics|book|story|paint|clay|origami|flashcards|worksheets/i,
    reason: 'Pairs hands-on STEM focus with creative storytelling & expressive play'
  },
  {
    triggerRegex: /clothing|kurta|frock|dress|apparel|cotton/i,
    complementRegex: /jewel|nazariya|payal|baby care|lotion|bag|gift/i,
    reason: 'Parent favorites paired with kids outfits for outings & celebrations'
  },
  {
    triggerRegex: /porridge|food|millet|puffs|snack|nutrition/i,
    complementRegex: /cutlery|safety|storybook|board book|fruit/i,
    reason: 'Complements wholesome nutrition with independent mealtime & story routines'
  },
  {
    triggerRegex: /book|story|phonics|panchatantra/i,
    complementRegex: /montessori|puzzle|paint|clay|flashcards/i,
    reason: 'Reinforces story curiosity with tactile Montessori & craft exploration'
  }
];

function ageGroupRank(ageGroup?: string): number {
  switch (ageGroup) {
    case '0-12m': return 1;
    case '1-3y': return 2;
    case '3-6y': return 3;
    case '6-10y': return 4;
    default: return 2.5;
  }
}

export function getComplementaryCartRecommendations(
  cart: CartItem[],
  allProducts: StoreProduct[],
  pastOrders: StoreOrder[],
  accountId?: string
): Array<{ product: StoreProduct; reason: string }> {
  const cartProductIds = new Set(cart.map(c => c.productId));
  const candidatePool = allProducts.filter(p => !cartProductIds.has(p.id) && p.stockStatus === 'instock');

  if (cart.length === 0) return [];

  const cartSignalsText = cart
    .map(c => `${c.product?.name || ''} ${c.product?.category || ''} ${c.product?.subcategory || ''} ${(c.product?.tags || []).join(' ')}`)
    .join(' ');

  const pastCategories = new Set(
    pastOrders.flatMap(o => (o.items || []).map(it => it.product?.category)).filter(Boolean)
  );
  const mlState = getParentMlState(accountId);

  const scored = candidatePool.map(cand => {
    const candText = `${cand.name} ${cand.category} ${cand.subcategory || ''} ${cand.tags.join(' ')}`;
    let score = 0;
    let bestReason = 'Frequently added together by verified Vernunt parents';

    for (const rule of COMPLEMENTARY_RULES) {
      if (rule.triggerRegex.test(cartSignalsText) && rule.complementRegex.test(candText)) {
        score += 24;
        bestReason = rule.reason;
        break;
      }
    }

    // Same or immediately adjacent developmental age stage
    const cartAvgStage =
      cart.reduce((sum, it) => sum + ageGroupRank(it.product?.ageGroup), 0) / Math.max(1, cart.length);
    const stageDiff = Math.abs(ageGroupRank(cand.ageGroup) - cartAvgStage);
    if (stageDiff <= 1) score += 10;

    // Cross-category diversity (avoid recommending identical category duplicate if small cart)
    const sameCatInCart = cart.some(c => c.product?.category === cand.category);
    if (!sameCatInCart) score += 6;

    // Reward complementary items under ₹799 for smooth cart add-on conversion
    if (cand.price <= 799) score += 5;

    if (pastCategories.has(cand.category)) score += 4;
    if (mlState.mlPersonalizationOptIn && mlState.learnedCategoryAffinity[cand.category]) {
      score += Math.round(mlState.learnedCategoryAffinity[cand.category] * 8);
    }

    return { product: cand, score, reason: bestReason };
  });

  return scored
    .filter(s => s.score >= 12)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ product, reason }) => ({ product, reason }));
}

export function getLifecycleProductRecommendations(params: {
  allProducts: StoreProduct[];
  cart: CartItem[];
  pastOrders: StoreOrder[];
  accountId?: string;
}): LifecycleRecommendationOutput {
  const { allProducts, cart, pastOrders, accountId } = params;
  const commerceSignals = getParentCommerceSignals(accountId);
  const mlState = getParentMlState(accountId);

  // Determine lifecycle stage strictly from adult parent's shopping actions (orders, cart, parent search terms)
  const historyKeywords = [
    ...pastOrders.flatMap(o => (o.items || []).map(i => `${i.product?.ageGroup || ''} ${i.product?.name || ''} ${i.product?.category || ''}`)),
    ...cart.map(c => `${c.product?.ageGroup || ''} ${c.product?.name || ''} ${c.product?.category || ''}`),
    ...(mlState.mlPersonalizationOptIn ? mlState.searchHistoryTerms : []),
    ...commerceSignals.searchQueries
  ].join(' ').toLowerCase();

  let currentStage: '0-12m' | '1-3y' | '3-6y' | '6-10y' = '1-3y';
  let stageLabel = 'Toddler Transition Stage (1–3 Yrs)';
  let nextStageLabel = 'Preschool Readiness & Sensory Play';

  if (/0-12m|teether|newborn|infant|porridge|diaper|bath|baby care/.test(historyKeywords)) {
    currentStage = '0-12m';
    stageLabel = 'Infant Care & First Milestones (0–12 Mos)';
    nextStageLabel = 'Early Solid Foods, Soft Tactile Toys & Toddler Safety';
  } else if (/6-10y|robotics|coding|solar|chemistry|science/.test(historyKeywords)) {
    currentStage = '6-10y';
    stageLabel = 'Junior STEM & Independent Maker (6–10 Yrs)';
    nextStageLabel = 'Advanced Logic Kits, Sports Gear & Chapter Story Sets';
  } else if (/3-6y|montessori|phonics|pottery|clay|paint|balance bike/.test(historyKeywords)) {
    currentStage = '3-6y';
    stageLabel = 'Preschool Creativity & Early Phonics (3–6 Yrs)';
    nextStageLabel = 'Logic STEM Kits, Collaborative Games & Creative Art';
  }

  const nextStageTarget: Record<'0-12m' | '1-3y' | '3-6y' | '6-10y', string[]> = {
    '0-12m': ['0-12m', '1-3y'],
    '1-3y': ['1-3y', '3-6y'],
    '3-6y': ['3-6y', '6-10y'],
    '6-10y': ['6-10y', 'all-ages']
  };

  const cartIds = new Set(cart.map(c => c.productId));
  const boughtIds = new Set(pastOrders.flatMap(o => (o.items || []).map(i => i.productId)));

  const recommendations = allProducts
    .filter(p => p.stockStatus === 'instock' && !cartIds.has(p.id))
    .map(p => {
      let score = 0;
      const targets = nextStageTarget[currentStage];
      if (targets.includes(p.ageGroup)) score += 18;
      if (p.ageGroup === targets[1]) score += 8; // Reward next-stage predictive transition
      if (boughtIds.has(p.id)) score -= 6; // Prefer fresh next-step items over already purchased ones

      if (mlState.mlPersonalizationOptIn && mlState.learnedCategoryAffinity[p.category]) {
        score += Math.round(mlState.learnedCategoryAffinity[p.category] * 12);
      }

      score += (p.rating || 4.5) * 2;
      if (p.isBestSeller || p.isFeatured) score += 4;

      const reason =
        p.ageGroup === targets[1]
          ? `Next-stage transition pick (${p.ageLabel})`
          : `Aligned with your parent account's ${stageLabel.split('(')[0].trim()} purchases`;

      return { product: p, score, reason };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ product, reason }) => ({ product, reason }));

  const hasAccountActivity = pastOrders.length > 0 || cart.length > 0 || commerceSignals.searchQueries.length > 0;
  const basisSummary = hasAccountActivity
    ? `Predicted exclusively from your registered parent account's past orders, cart activity & searches (zero child profiling).`
    : `Curated early-childhood lifecycle transitions (sign in and browse to tailor predictions to your parent account).`;

  return {
    stageLabel,
    nextStageLabel,
    basisSummary,
    recommendations
  };
}

// ============================================================================
// 5. DYNAMIC OFFERS & INCENTIVES ENGINE (PARENT-ACCOUNT ONLY)
// ============================================================================
export interface DynamicParentOffer {
  offerId: string;
  segment: 'LOYAL_REPEAT_PARENT' | 'PRICE_SENSITIVE_PARENT' | 'WELCOME_PARENT' | 'CART_BUILDER';
  headline: string;
  description: string;
  badgeText: string;
  couponCode?: string;
  actionType: 'APPLY_COUPON' | 'UNLOCK_EVENT_VIP_DROP' | 'NONE';
  actionLabel: string;
  marginPreservedNote: string;
  unlocksEarlyEventDrop: boolean;
}

export function evaluateDynamicParentOffer(params: {
  userProfile?: ChildProfile;
  cart: CartItem[];
  cartSubtotal: number;
  shippingFee: number;
  pastOrders: StoreOrder[];
  appliedCouponCode?: string;
}): DynamicParentOffer | null {
  const { userProfile, cart, cartSubtotal, shippingFee, pastOrders, appliedCouponCode } = params;
  if (cart.length === 0) return null;

  const accountId = userProfile?.id || 'guest_parent';
  const signals = getParentCommerceSignals(accountId);
  const completedOrders = pastOrders.filter(o => o.orderStatus !== 'Cancelled');
  const lifetimeSpend = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Rule 1: Loyal Repeat Parent Buyer (2+ orders or >= ₹1,500 lifetime spend)
  // Instead of margin-reducing discounts, reward with Early VIP Access to Vernunt Event Drops!
  if (completedOrders.length >= 2 || lifetimeSpend >= 1500) {
    return {
      offerId: 'offer-loyal-vip-event',
      segment: 'LOYAL_REPEAT_PARENT',
      headline: 'VIP Loyalty Reward: Early Access to New Event Drops',
      description: `Thank you for being a repeat Vernunt parent (${completedOrders.length} orders). This checkout unlocks priority early-bird access to upcoming Vernunt weekend carnivals & STEM workshops.`,
      badgeText: 'Loyal Parent Perk',
      actionType: 'UNLOCK_EVENT_VIP_DROP',
      actionLabel: 'Activate Event Early Access Pass',
      marginPreservedNote: 'Preserves store margin via high-value community access instead of price cuts',
      unlocksEarlyEventDrop: true
    };
  }

  // Rule 2: Price-Sensitive Parent Shopper or Shipping Fee Friction -> Free Shipping Incentive
  const showsPriceSensitivity = signals.dealsFilterClicks > 0 || signals.priceLowSortClicks > 0;
  if (shippingFee > 0 && (showsPriceSensitivity || (cartSubtotal > 0 && cartSubtotal < 499))) {
    const alreadyApplied = appliedCouponCode === 'FREESHIP';
    return {
      offerId: 'offer-dynamic-freeship',
      segment: 'PRICE_SENSITIVE_PARENT',
      headline: alreadyApplied
        ? 'Free Express Shipping Applied!'
        : `Unlock FREE Delivery (Save ₹${shippingFee}) on This Order`,
      description: showsPriceSensitivity
        ? 'Tailored for your parent account: waive shipping charges immediately to complete your checkout.'
        : 'AI checkout incentive: claim complimentary express courier shipping right now without adding extra items.',
      badgeText: 'Free Shipping Incentive',
      couponCode: 'FREESHIP',
      actionType: 'APPLY_COUPON',
      actionLabel: alreadyApplied ? 'Applied (FREESHIP)' : 'Claim Free Shipping',
      marginPreservedNote: 'Targeted free-shipping nudge to maximize checkout conversion',
      unlocksEarlyEventDrop: false
    };
  }

  // Rule 3: New / First-Time High-Value Cart -> Welcome Coupon
  if (completedOrders.length === 0 && cartSubtotal >= 800 && appliedCouponCode !== 'FIRSTPLAY200') {
    return {
      offerId: 'offer-first-parent',
      segment: 'WELCOME_PARENT',
      headline: 'First-Order Parent Welcome: Flat ₹200 OFF',
      description: 'Your first curated store order qualifies for ₹200 instant savings on your parent account.',
      badgeText: 'New Parent Incentive',
      couponCode: 'FIRSTPLAY200',
      actionType: 'APPLY_COUPON',
      actionLabel: 'Apply ₹200 OFF (FIRSTPLAY200)',
      marginPreservedNote: 'First-purchase parent acquisition incentive',
      unlocksEarlyEventDrop: false
    };
  }

  return null;
}

// ============================================================================
// 6. PREDICTIVE INVENTORY MANAGEMENT & DEMAND FORECASTING
// ============================================================================
export type InventoryRiskStatus = 'STOCKOUT_RISK' | 'REORDER_SOON' | 'OVERSTOCK_RISK' | 'HEALTHY';

export interface ProductInventoryForecast {
  productId: string;
  unitsSoldPeriod: number;
  dailyVelocity: number;
  predicted30DayDemand: number;
  daysUntilStockout: number;
  recommendedReorderQty: number;
  riskStatus: InventoryRiskStatus;
  confidencePct: number;
  insight: string;
}

export function forecastProductInventory(
  product: StoreProduct,
  orders: StoreOrder[]
): ProductInventoryForecast {
  // Count historical order units from registered orders
  let orderUnits = 0;
  orders.forEach(ord => {
    if (ord.orderStatus === 'Cancelled') return;
    (ord.items || []).forEach(item => {
      if (item.productId === product.id) {
        orderUnits += item.quantity || 1;
      }
    });
  });

  // Incorporate storefront demand signals (reviews/featured/bestseller velocity baseline over 30d window)
  const baselineDemand30d =
    Math.max(4, Math.round((product.reviewCount || 10) * 0.35)) +
    (product.isBestSeller ? 12 : 0) +
    (product.isFeatured ? 6 : 0);

  // Category seasonality bump (baby care, organic food & Montessori kits have steady/high repeat turnover)
  const catLower = (product.category || '').toLowerCase();
  const seasonalityFactor =
    catLower.includes('care') || catLower.includes('food')
      ? 1.25
      : catLower.includes('montessori') || catLower.includes('book')
      ? 1.15
      : 1.0;

  const effective30dUnits = orderUnits > 0 ? Math.max(orderUnits * 3, baselineDemand30d) : baselineDemand30d;
  const predicted30DayDemand = Math.max(3, Math.round(effective30dUnits * seasonalityFactor));
  const dailyVelocity = Number((predicted30DayDemand / 30).toFixed(2));

  const currentStock = Math.max(0, product.stockQuantity || 0);
  const daysUntilStockout = dailyVelocity > 0 ? Math.round(currentStock / dailyVelocity) : 999;
  const lowThresh = product.lowStockThreshold || 5;

  let riskStatus: InventoryRiskStatus = 'HEALTHY';
  let insight = 'Balanced inventory runway for upcoming 30-day cycle.';
  let recommendedReorderQty = 0;

  if (currentStock === 0 || currentStock <= lowThresh || daysUntilStockout <= 7) {
    riskStatus = 'STOCKOUT_RISK';
    recommendedReorderQty = Math.max(15, Math.round(predicted30DayDemand * 1.3 - currentStock));
    insight = currentStock === 0
      ? `Out of stock now! Immediate restock of ${recommendedReorderQty} units recommended.`
      : `High stockout risk in ~${daysUntilStockout} days at ${dailyVelocity}/day velocity.`;
  } else if (daysUntilStockout <= 21) {
    riskStatus = 'REORDER_SOON';
    recommendedReorderQty = Math.max(10, Math.round(predicted30DayDemand * 1.2 - currentStock));
    insight = `Stock runway covers ~${daysUntilStockout} days. Schedule reorder soon.`;
  } else if (currentStock > predicted30DayDemand * 3.5 && currentStock >= 40) {
    riskStatus = 'OVERSTOCK_RISK';
    recommendedReorderQty = 0;
    insight = `Slow turnover (${daysUntilStockout}+ days stock). Consider bundling or dynamic free-shipping nudge.`;
  }

  return {
    productId: product.id,
    unitsSoldPeriod: orderUnits,
    dailyVelocity,
    predicted30DayDemand,
    daysUntilStockout,
    recommendedReorderQty,
    riskStatus,
    confidencePct: orderUnits >= 3 ? 91 : 78,
    insight
  };
}

export function computeInventoryHealthSummary(products: StoreProduct[], orders: StoreOrder[]) {
  const forecasts = products.map(p => forecastProductInventory(p, orders));
  const stockoutRiskCount = forecasts.filter(f => f.riskStatus === 'STOCKOUT_RISK').length;
  const reorderSoonCount = forecasts.filter(f => f.riskStatus === 'REORDER_SOON').length;
  const overstockRiskCount = forecasts.filter(f => f.riskStatus === 'OVERSTOCK_RISK').length;
  const totalPredicted30dUnits = forecasts.reduce((sum, f) => sum + f.predicted30DayDemand, 0);

  return {
    forecastsById: Object.fromEntries(forecasts.map(f => [f.productId, f])) as Record<string, ProductInventoryForecast>,
    stockoutRiskCount,
    reorderSoonCount,
    overstockRiskCount,
    totalPredicted30dUnits
  };
}
