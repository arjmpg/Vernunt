import { Request, Response, Express } from 'express';
import crypto from 'crypto';
import { INITIAL_STORE_PRODUCTS, STORE_CATEGORIES } from '../src/data/storeProducts.ts';
import { StoreProduct, ProductVariation, ProductAttribute } from '../src/types/store.ts';

// ============================================================================
// ZERO-COST HIGH-PERFORMANCE COMMERCE ENGINE
// Features:
// 1. Cursor-Based Server-Side Pagination
// 2. Dedicated High-Performance Search Index (Inverted Index + BM25 + Prefix Trie)
// 3. Variant & Taxonomy Normalization
// 4. Distributed Inventory Locking (Preventing Overselling)
// ============================================================================

export interface CursorPayload {
  id: string;
  sortField: string;
  sortValue: string | number;
  direction?: 'next' | 'prev';
  timestamp: number;
}

export interface SearchFacets {
  categories: Record<string, number>;
  ageGroups: Record<string, number>;
  brands: Record<string, number>;
  priceRanges: {
    under500: number;
    from500to1000: number;
    from1000to2000: number;
    above2000: number;
  };
  stockStatus: {
    inStock: number;
    outOfStock: number;
    lowStock: number;
  };
}

export interface InventoryLockItem {
  productId: string;
  variationId?: string;
  quantity: number;
  productName?: string;
  unitPrice?: number;
}

export interface InventoryLock {
  lockToken: string;
  sessionId: string;
  userId?: string;
  userEmail?: string;
  items: InventoryLockItem[];
  createdAt: number;
  expiresAt: number;
  status: 'active' | 'committed' | 'released' | 'expired';
  orderRef?: string;
}

export interface LockAuditLog {
  id: string;
  timestamp: number;
  action: 'LOCK_ACQUIRED' | 'LOCK_HEARTBEAT' | 'LOCK_RELEASED' | 'LOCK_COMMITTED' | 'LOCK_EXPIRED' | 'OVERSELL_PREVENTED';
  lockToken: string;
  sessionId?: string;
  details: string;
  items?: InventoryLockItem[];
}

// ----------------------------------------------------------------------------
// IN-MEMORY CATALOG STORAGE (Zero External Database Charges)
// ----------------------------------------------------------------------------
let catalogProducts: StoreProduct[] = JSON.parse(JSON.stringify(INITIAL_STORE_PRODUCTS));

export function getCatalogProducts(): StoreProduct[] {
  return catalogProducts;
}

export function updateProductStock(productId: string, newStock: number, variationId?: string): boolean {
  const product = catalogProducts.find(p => p.id === productId);
  if (!product) return false;

  if (variationId && product.variations && product.variations.length > 0) {
    const variation = product.variations.find(v => v.id === variationId);
    if (variation) {
      variation.stockQuantity = Math.max(0, newStock);
      variation.inStock = variation.stockQuantity > 0;
      // Recompute parent stock
      product.stockQuantity = product.variations.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
      product.stockStatus = product.stockQuantity > 0 ? 'instock' : 'outofstock';
      return true;
    }
  }

  product.stockQuantity = Math.max(0, newStock);
  product.stockStatus = product.stockQuantity > 0 ? 'instock' : 'outofstock';
  return true;
}

// ----------------------------------------------------------------------------
// 1. DEDICATED HIGH-PERFORMANCE SEARCH INDEX (Inverted Index + BM25 + Trie)
// ----------------------------------------------------------------------------
interface TermPosting {
  productId: string;
  termFrequency: number;
  fieldBoost: number;
}

export class CommerceSearchIndex {
  private invertedIndex: Map<string, TermPosting[]> = new Map();
  private prefixTrie: Map<string, Set<string>> = new Map();
  private soundexMap: Map<string, Set<string>> = new Map();
  private docLengths: Map<string, number> = new Map();
  private avgDocLength = 0;
  private productMap: Map<string, StoreProduct> = new Map();
  
  // Performance telemetry
  private totalSearches = 0;
  private totalLatencyMs = 0;
  private latencySamples: number[] = [];
  private lastIndexedAt = Date.now();

  constructor() {
    this.rebuildIndex();
  }

  private normalizeText(text: string): string[] {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[^\w\s-]/g, ' ')
      .split(/[\s-]+/)
      .map(w => w.trim())
      .filter(w => w.length >= 2);
  }

  private computeSoundex(term: string): string {
    if (!term || term.length === 0) return '';
    const clean = term.toUpperCase().replace(/[^A-Z]/g, '');
    if (clean.length === 0) return '';

    const firstLetter = clean[0];
    const mappings: Record<string, string> = {
      B: '1', F: '1', P: '1', V: '1',
      C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
      D: '3', T: '3',
      L: '4',
      M: '5', N: '5',
      R: '6'
    };

    let code = firstLetter;
    let prevCode = mappings[firstLetter] || '';

    for (let i = 1; i < clean.length; i++) {
      const char = clean[i];
      const charCode = mappings[char] || '';
      if (charCode && charCode !== prevCode) {
        code += charCode;
        if (code.length === 4) break;
      }
      prevCode = charCode;
    }

    while (code.length < 4) {
      code += '0';
    }
    return code;
  }

  public rebuildIndex(): void {
    const startTime = Date.now();
    this.invertedIndex.clear();
    this.prefixTrie.clear();
    this.soundexMap.clear();
    this.docLengths.clear();
    this.productMap.clear();

    const products = catalogProducts;
    let totalLength = 0;

    for (const product of products) {
      this.productMap.set(product.id, product);

      // Weighted fields
      const fieldTokens: Array<{ tokens: string[]; boost: number }> = [
        { tokens: this.normalizeText(product.sku || ''), boost: 15.0 },
        { tokens: this.normalizeText(product.name || ''), boost: 6.0 },
        { tokens: this.normalizeText(product.brand || ''), boost: 4.0 },
        { tokens: this.normalizeText((product.tags || []).join(' ')), boost: 3.0 },
        { tokens: this.normalizeText((product.badges || []).join(' ')), boost: 2.5 },
        { tokens: this.normalizeText(product.category || ''), boost: 2.5 },
        { tokens: this.normalizeText(product.subcategory || ''), boost: 2.0 },
        { tokens: this.normalizeText(product.shortDescription || ''), boost: 1.5 },
        { tokens: this.normalizeText(product.description || ''), boost: 1.0 },
      ];

      // Index tokens per document
      const docTermFrequencies: Map<string, { count: number; maxBoost: number }> = new Map();
      let docLen = 0;

      for (const { tokens, boost } of fieldTokens) {
        for (const token of tokens) {
          docLen++;
          const existing = docTermFrequencies.get(token);
          if (existing) {
            existing.count++;
            existing.maxBoost = Math.max(existing.maxBoost, boost);
          } else {
            docTermFrequencies.set(token, { count: 1, maxBoost: boost });
          }

          // Build prefix trie (prefixes from length 2 to token.length)
          for (let len = 2; len <= Math.min(token.length, 8); len++) {
            const prefix = token.slice(0, len);
            if (!this.prefixTrie.has(prefix)) {
              this.prefixTrie.set(prefix, new Set());
            }
            this.prefixTrie.get(prefix)!.add(token);
          }

          // Soundex index
          const soundex = this.computeSoundex(token);
          if (soundex) {
            if (!this.soundexMap.has(soundex)) {
              this.soundexMap.set(soundex, new Set());
            }
            this.soundexMap.get(soundex)!.add(token);
          }
        }
      }

      this.docLengths.set(product.id, docLen);
      totalLength += docLen;

      // Add to inverted index
      for (const [term, { count, maxBoost }] of docTermFrequencies.entries()) {
        if (!this.invertedIndex.has(term)) {
          this.invertedIndex.set(term, []);
        }
        this.invertedIndex.get(term)!.push({
          productId: product.id,
          termFrequency: count,
          fieldBoost: maxBoost
        });
      }
    }

    this.avgDocLength = products.length > 0 ? totalLength / products.length : 1;
    this.lastIndexedAt = Date.now();
    console.log(`[CommerceSearchIndex] High-perf inverted index built for ${products.length} products in ${Date.now() - startTime}ms (${this.invertedIndex.size} unique terms)`);
  }

  public search(
    queryStr: string,
    filterOptions: {
      category?: string;
      subcategory?: string;
      ageGroup?: string;
      minPrice?: number;
      maxPrice?: number;
      inStockOnly?: boolean;
      brand?: string;
      vendorId?: string;
    } = {}
  ): {
    scoredProducts: Array<{ product: StoreProduct; score: number }>;
    facets: SearchFacets;
    executionTimeMs: number;
  } {
    const t0 = performance.now();
    const queryTerms = this.normalizeText(queryStr);
    const N = this.productMap.size;
    const k1 = 1.2;
    const b = 0.75;

    // Fast path: if empty query, return all matching products with default score
    const scores: Map<string, number> = new Map();

    if (queryTerms.length === 0) {
      for (const [productId] of this.productMap.entries()) {
        scores.set(productId, 1.0);
      }
    } else {
      // BM25 Scoring
      for (const rawTerm of queryTerms) {
        // Collect candidate matched terms: exact + prefixes + soundex fallback
        const candidateTerms = new Set<string>();
        if (this.invertedIndex.has(rawTerm)) {
          candidateTerms.add(rawTerm);
        }

        // Prefix match
        const prefixes = this.prefixTrie.get(rawTerm);
        if (prefixes) {
          for (const pTerm of prefixes) {
            candidateTerms.add(pTerm);
          }
        }

        // Phonetic fallback if no exact/prefix match
        if (candidateTerms.size === 0) {
          const soundex = this.computeSoundex(rawTerm);
          const phoneticMatches = this.soundexMap.get(soundex);
          if (phoneticMatches) {
            for (const pTerm of phoneticMatches) {
              candidateTerms.add(pTerm);
            }
          }
        }

        for (const term of candidateTerms) {
          const postings = this.invertedIndex.get(term) || [];
          const df = postings.length;
          if (df === 0) continue;

          // Standard BM25 IDF
          const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
          const isExact = term === rawTerm;
          const termPenalty = isExact ? 1.0 : 0.65;

          for (const posting of postings) {
            const docLen = this.docLengths.get(posting.productId) || this.avgDocLength;
            const tf = posting.termFrequency;
            const num = tf * (k1 + 1);
            const den = tf + k1 * (1 - b + b * (docLen / this.avgDocLength));
            const termScore = idf * (num / den) * posting.fieldBoost * termPenalty;

            scores.set(posting.productId, (scores.get(posting.productId) || 0) + termScore);
          }
        }
      }
    }

    // Filter and compute facets in single pass
    const facets: SearchFacets = {
      categories: {},
      ageGroups: {},
      brands: {},
      priceRanges: { under500: 0, from500to1000: 0, from1000to2000: 0, above2000: 0 },
      stockStatus: { inStock: 0, outOfStock: 0, lowStock: 0 }
    };

    const scoredProducts: Array<{ product: StoreProduct; score: number }> = [];

    for (const [productId, score] of scores.entries()) {
      const product = this.productMap.get(productId);
      if (!product) continue;

      // Filter checks
      if (filterOptions.category && filterOptions.category !== 'all') {
        const cat = filterOptions.category.toLowerCase();
        const pCat = (product.category || '').toLowerCase();
        const pCatSlug = pCat.replace(/\s+/g, '-').replace(/&/g, '').toLowerCase();
        if (!pCat.includes(cat) && !pCatSlug.includes(cat)) continue;
      }

      if (filterOptions.subcategory && filterOptions.subcategory !== 'all') {
        if (product.subcategory !== filterOptions.subcategory) continue;
      }

      if (filterOptions.ageGroup && filterOptions.ageGroup !== 'all' && filterOptions.ageGroup !== 'all-ages') {
        if (product.ageGroup !== filterOptions.ageGroup && product.ageGroup !== 'all-ages') continue;
      }

      if (filterOptions.minPrice !== undefined && product.price < filterOptions.minPrice) continue;
      if (filterOptions.maxPrice !== undefined && product.price > filterOptions.maxPrice) continue;

      // Check stock with lock deduction
      const lockedUnits = inventoryLockManager.getLockedQuantity(product.id);
      const effectiveStock = Math.max(0, (product.stockQuantity || 0) - lockedUnits);

      if (filterOptions.inStockOnly && effectiveStock <= 0) continue;
      if (filterOptions.brand && product.brand !== filterOptions.brand) continue;
      if (filterOptions.vendorId && product.vendorId !== filterOptions.vendorId) continue;

      // Accumulate facets
      if (product.category) {
        facets.categories[product.category] = (facets.categories[product.category] || 0) + 1;
      }
      if (product.ageGroup) {
        facets.ageGroups[product.ageGroup] = (facets.ageGroups[product.ageGroup] || 0) + 1;
      }
      if (product.brand) {
        facets.brands[product.brand] = (facets.brands[product.brand] || 0) + 1;
      }

      // Price ranges
      if (product.price < 500) facets.priceRanges.under500++;
      else if (product.price <= 1000) facets.priceRanges.from500to1000++;
      else if (product.price <= 2000) facets.priceRanges.from1000to2000++;
      else facets.priceRanges.above2000++;

      // Stock status
      if (effectiveStock <= 0) facets.stockStatus.outOfStock++;
      else if (effectiveStock <= 5) facets.stockStatus.lowStock++;
      else facets.stockStatus.inStock++;

      scoredProducts.push({ product, score });
    }

    const t1 = performance.now();
    const executionTimeMs = parseFloat((t1 - t0).toFixed(2));

    this.totalSearches++;
    this.totalLatencyMs += executionTimeMs;
    this.latencySamples.push(executionTimeMs);
    if (this.latencySamples.length > 500) this.latencySamples.shift();

    return { scoredProducts, facets, executionTimeMs };
  }

  public suggest(prefix: string): Array<{ term: string; count: number; category?: string }> {
    const clean = prefix.toLowerCase().trim();
    if (clean.length < 2) return [];

    const terms = this.prefixTrie.get(clean.slice(0, 8));
    if (!terms) return [];

    const suggestions: Array<{ term: string; count: number }> = [];
    for (const term of terms) {
      const postings = this.invertedIndex.get(term) || [];
      suggestions.push({ term, count: postings.length });
    }

    return suggestions.sort((a, b) => b.count - a.count).slice(0, 8);
  }

  public getStats() {
    const avgLatency = this.totalSearches > 0 ? (this.totalLatencyMs / this.totalSearches).toFixed(2) : '0.00';
    const sortedSamples = [...this.latencySamples].sort((a, b) => a - b);
    const p95 = sortedSamples.length > 0 ? sortedSamples[Math.floor(sortedSamples.length * 0.95)].toFixed(2) : '0.00';
    const p99 = sortedSamples.length > 0 ? sortedSamples[Math.floor(sortedSamples.length * 0.99)].toFixed(2) : '0.00';

    return {
      indexedDocuments: this.productMap.size,
      uniqueTermsCount: this.invertedIndex.size,
      prefixTrieNodes: this.prefixTrie.size,
      soundexClusters: this.soundexMap.size,
      totalSearches: this.totalSearches,
      avgLatencyMs: parseFloat(avgLatency),
      p95LatencyMs: parseFloat(p95),
      p99LatencyMs: parseFloat(p99),
      lastIndexedAt: new Date(this.lastIndexedAt).toISOString(),
      engine: 'InvertedIndex_BM25_ZeroCost'
    };
  }
}

export const searchIndex = new CommerceSearchIndex();

// ----------------------------------------------------------------------------
// 2. CURSOR-BASED SERVER-SIDE PAGINATION ENGINE
// ----------------------------------------------------------------------------
export class CursorPaginationEngine {
  public static encodeCursor(payload: CursorPayload): string {
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }

  public static decodeCursor(cursorStr: string): CursorPayload | null {
    try {
      const decoded = Buffer.from(cursorStr, 'base64url').toString('utf8');
      return JSON.parse(decoded) as CursorPayload;
    } catch {
      return null;
    }
  }

  public static paginate(
    scoredItems: Array<{ product: StoreProduct; score: number }>,
    options: {
      cursor?: string;
      limit?: number;
      sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'name_asc';
      direction?: 'next' | 'prev';
    }
  ) {
    const limit = Math.min(Math.max(options.limit || 12, 1), 50);
    const sortBy = options.sortBy || 'relevance';
    const direction = options.direction || 'next';

    // 1. Sort the entire matching list deterministically
    const sorted = [...scoredItems].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          if (a.product.price !== b.product.price) return a.product.price - b.product.price;
          return a.product.id.localeCompare(b.product.id);
        case 'price_desc':
          if (a.product.price !== b.product.price) return b.product.price - a.product.price;
          return a.product.id.localeCompare(b.product.id);
        case 'rating':
          if (a.product.rating !== b.product.rating) return b.product.rating - a.product.rating;
          if (a.product.reviewCount !== b.product.reviewCount) return b.product.reviewCount - a.product.reviewCount;
          return a.product.id.localeCompare(b.product.id);
        case 'name_asc':
          return a.product.name.localeCompare(b.product.name);
        case 'newest':
          return b.product.id.localeCompare(a.product.id);
        case 'relevance':
        default:
          if (Math.abs(b.score - a.score) > 0.001) return b.score - a.score;
          if (a.product.rating !== b.product.rating) return b.product.rating - a.product.rating;
          return a.product.id.localeCompare(b.product.id);
      }
    });

    const totalMatches = sorted.length;

    // 2. Locate cursor index
    let startIndex = 0;
    if (options.cursor) {
      const decoded = this.decodeCursor(options.cursor);
      if (decoded) {
        const foundIdx = sorted.findIndex(item => item.product.id === decoded.id);
        if (foundIdx !== -1) {
          startIndex = direction === 'next' ? foundIdx + 1 : Math.max(0, foundIdx - limit);
        }
      }
    }

    const pageSlice = sorted.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < totalMatches;
    const hasPrev = startIndex > 0;

    let nextCursor: string | null = null;
    let prevCursor: string | null = null;

    if (pageSlice.length > 0 && hasMore) {
      const lastItem = pageSlice[pageSlice.length - 1];
      nextCursor = this.encodeCursor({
        id: lastItem.product.id,
        sortField: sortBy,
        sortValue: sortBy === 'price_asc' || sortBy === 'price_desc' ? lastItem.product.price : lastItem.score,
        direction: 'next',
        timestamp: Date.now()
      });
    }

    if (pageSlice.length > 0 && hasPrev) {
      const firstItem = pageSlice[0];
      prevCursor = this.encodeCursor({
        id: firstItem.product.id,
        sortField: sortBy,
        sortValue: sortBy === 'price_asc' || sortBy === 'price_desc' ? firstItem.product.price : firstItem.score,
        direction: 'prev',
        timestamp: Date.now()
      });
    }

    return {
      items: pageSlice.map(item => item.product),
      pagination: {
        nextCursor,
        prevCursor,
        hasMore,
        hasPrev,
        limit,
        totalMatches,
        returnedCount: pageSlice.length,
        startIndex,
        sortBy
      }
    };
  }
}

// ----------------------------------------------------------------------------
// 3. VARIANT & TAXONOMY NORMALIZATION ENGINE
// ----------------------------------------------------------------------------
export class VariantTaxonomyNormalizer {
  // Canonical attribute name dictionary
  private static readonly CANONICAL_ATTR_NAMES: Record<string, string> = {
    'size': 'Size',
    'sizes': 'Size',
    'sz': 'Size',
    'dimension': 'Size',
    'color': 'Color',
    'colour': 'Color',
    'shade': 'Color',
    'pack': 'Pack Size',
    'pack size': 'Pack Size',
    'packsize': 'Pack Size',
    'pouch': 'Pack Size',
    'flavor': 'Flavor',
    'flavour': 'Flavor',
    'taste': 'Flavor',
    'age': 'Age Kit',
    'age kit': 'Age Kit',
    'age group': 'Age Kit',
    'bundle': 'Bundle Option',
    'bundle option': 'Bundle Option',
    'language': 'Language',
    'material': 'Material'
  };

  // Canonical age groups
  public static readonly CANONICAL_AGE_GROUPS = ['0-12m', '1-3y', '3-6y', '6-10y', '10-14y', 'all-ages'] as const;

  public static normalizeTaxonomy(product: Partial<StoreProduct>): {
    category: string;
    subcategory: string;
    ageGroup: '0-12m' | '1-3y' | '3-6y' | '6-10y' | '10-14y' | 'all-ages';
    ageLabel: string;
  } {
    // 1. Resolve Category
    const inputCat = (product.category || 'Montessori & STEM').trim();
    const matchedCategory = STORE_CATEGORIES.find(c => 
      c.name.toLowerCase() === inputCat.toLowerCase() ||
      c.slug.toLowerCase() === inputCat.toLowerCase() ||
      c.id.toLowerCase() === inputCat.toLowerCase()
    ) || STORE_CATEGORIES.find(c => c.id === 'montessori-stem') || STORE_CATEGORIES[0];

    const category = matchedCategory.name;

    // 2. Resolve Subcategory
    let subcategory = (product.subcategory || '').trim();
    const validSubs = matchedCategory.subcategories || [];
    if (validSubs.length > 0 && !validSubs.includes(subcategory)) {
      subcategory = validSubs[0];
    }

    // 3. Resolve Age Group
    let ageGroup: '0-12m' | '1-3y' | '3-6y' | '6-10y' | '10-14y' | 'all-ages' = 'all-ages';
    if (product.ageGroup && this.CANONICAL_AGE_GROUPS.includes(product.ageGroup as any)) {
      ageGroup = product.ageGroup as any;
    } else {
      const inputStr = `${product.name} ${product.ageLabel || ''} ${product.description}`.toLowerCase();
      if (inputStr.includes('baby') || inputStr.includes('infant') || inputStr.includes('0-12') || inputStr.includes('6m')) {
        ageGroup = '0-12m';
      } else if (inputStr.includes('toddler') || inputStr.includes('1-3') || inputStr.includes('2 year')) {
        ageGroup = '1-3y';
      } else if (inputStr.includes('preschool') || inputStr.includes('3-6') || inputStr.includes('kindergarten')) {
        ageGroup = '3-6y';
      } else if (inputStr.includes('stem') || inputStr.includes('robot') || inputStr.includes('6-10')) {
        ageGroup = '6-10y';
      }
    }

    // 4. Age Label
    const ageLabelMap: Record<string, string> = {
      '0-12m': 'Ages 0 - 12 Months',
      '1-3y': 'Ages 1 - 3 Years',
      '3-6y': 'Ages 3 - 6 Years',
      '6-10y': 'Ages 6 - 10 Years',
      '10-14y': 'Ages 10 - 14 Years',
      'all-ages': 'All Ages'
    };
    const ageLabel = product.ageLabel?.trim() || ageLabelMap[ageGroup] || 'All Ages';

    return { category, subcategory, ageGroup, ageLabel };
  }

  public static normalizeAttributes(attributes?: ProductAttribute[]): ProductAttribute[] {
    if (!attributes || !Array.isArray(attributes)) return [];

    const normalizedMap: Map<string, Set<string>> = new Map();

    for (const attr of attributes) {
      if (!attr.name || !attr.options || !Array.isArray(attr.options)) continue;
      const rawName = attr.name.trim().toLowerCase();
      const canonicalName = this.CANONICAL_ATTR_NAMES[rawName] || (attr.name.charAt(0).toUpperCase() + attr.name.slice(1).trim());

      if (!normalizedMap.has(canonicalName)) {
        normalizedMap.set(canonicalName, new Set());
      }

      for (const opt of attr.options) {
        if (typeof opt === 'string' && opt.trim().length > 0) {
          normalizedMap.get(canonicalName)!.add(opt.trim());
        }
      }
    }

    return Array.from(normalizedMap.entries()).map(([name, optionsSet]) => ({
      name,
      options: Array.from(optionsSet)
    }));
  }

  public static generateVariationMatrix(
    parentProduct: StoreProduct,
    attributes: ProductAttribute[]
  ): ProductVariation[] {
    if (!attributes || attributes.length === 0) return [];

    // Cartesian product of attribute options
    let combinations: Array<Record<string, string>> = [{}];

    for (const attr of attributes) {
      const next: Array<Record<string, string>> = [];
      for (const comb of combinations) {
        for (const opt of attr.options) {
          next.push({ ...comb, [attr.name]: opt });
        }
      }
      combinations = next;
    }

    // Build variations with canonical SKU formatting
    const parentSku = parentProduct.sku || `VRN-${parentProduct.id.toUpperCase()}`;
    const basePrice = parentProduct.price || 499;
    const baseRegularPrice = parentProduct.regularPrice || Math.round(basePrice * 1.3);

    return combinations.map((attrCombo, index) => {
      // Deterministic slug/code from attributes
      const skuSuffix = Object.entries(attrCombo)
        .map(([k, v]) => `${k.slice(0, 2).toUpperCase()}-${v.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase()}`)
        .join('-');

      const variationSku = `${parentSku}-${skuSuffix || `VAR${index + 1}`}`;
      const varId = `${parentProduct.id}-var-${index + 1}`;

      // Distribute parent stock or default 15
      const stockPerVar = Math.max(5, Math.floor((parentProduct.stockQuantity || 30) / Math.max(1, combinations.length)));

      return {
        id: varId,
        sku: variationSku,
        attributes: attrCombo,
        price: basePrice,
        regularPrice: baseRegularPrice,
        stockQuantity: stockPerVar,
        inStock: stockPerVar > 0,
        imageUrl: parentProduct.featuredImage
      };
    });
  }

  public static normalizeFullProduct(rawProduct: Partial<StoreProduct>): StoreProduct {
    const id = rawProduct.id || `prod-${Date.now()}`;
    const name = (rawProduct.name || 'Vernunt Play Product').trim();
    const slug = rawProduct.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const { category, subcategory, ageGroup, ageLabel } = this.normalizeTaxonomy(rawProduct);
    const attributes = this.normalizeAttributes(rawProduct.attributes);

    const basePrice = Math.max(0, Number(rawProduct.price) || 499);
    const regularPrice = Math.max(basePrice, Number(rawProduct.regularPrice) || Math.round(basePrice * 1.3));
    const onSale = rawProduct.onSale !== undefined ? rawProduct.onSale : (regularPrice > basePrice);
    const discountPercentage = regularPrice > basePrice ? Math.round(((regularPrice - basePrice) / regularPrice) * 100) : 0;

    let variations = rawProduct.variations;
    if (attributes.length > 0 && (!variations || variations.length === 0)) {
      variations = this.generateVariationMatrix(rawProduct as StoreProduct, attributes);
    } else if (variations && variations.length > 0) {
      // Normalize existing variations
      variations = variations.map((v, i) => ({
        ...v,
        id: v.id || `${id}-var-${i + 1}`,
        price: Number(v.price) || basePrice,
        regularPrice: Number(v.regularPrice) || regularPrice,
        stockQuantity: Math.max(0, Number(v.stockQuantity) || 10),
        inStock: (Number(v.stockQuantity) || 10) > 0
      }));
    }

    const totalStock = variations && variations.length > 0
      ? variations.reduce((sum, v) => sum + v.stockQuantity, 0)
      : Math.max(0, Number(rawProduct.stockQuantity) || 25);

    return {
      id,
      name,
      slug,
      shortDescription: (rawProduct.shortDescription || name).trim(),
      description: (rawProduct.description || name).trim(),
      price: basePrice,
      regularPrice,
      salePrice: onSale ? basePrice : undefined,
      onSale,
      discountPercentage,
      sku: rawProduct.sku || `VRN-${id.toUpperCase()}`,
      stockQuantity: totalStock,
      stockStatus: totalStock > 0 ? 'instock' : 'outofstock',
      manageStock: rawProduct.manageStock ?? true,
      category,
      subcategory,
      ageGroup,
      ageLabel,
      featuredImage: rawProduct.featuredImage || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
      galleryImages: Array.isArray(rawProduct.galleryImages) && rawProduct.galleryImages.length > 0 ? rawProduct.galleryImages : [rawProduct.featuredImage || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80'],
      tags: Array.isArray(rawProduct.tags) ? rawProduct.tags.map(t => t.trim()) : ['Montessori', 'Play'],
      attributes,
      variations,
      rating: Number(rawProduct.rating) || 4.8,
      reviewCount: Number(rawProduct.reviewCount) || 12,
      reviews: rawProduct.reviews || [],
      qaList: rawProduct.qaList || [],
      isFeatured: Boolean(rawProduct.isFeatured),
      isBestSeller: Boolean(rawProduct.isBestSeller),
      isNewArrival: Boolean(rawProduct.isNewArrival),
      badges: Array.isArray(rawProduct.badges) ? rawProduct.badges : ['BIS Certified', 'Non-Toxic'],
      brand: (rawProduct.brand || 'Vernunt Certified Gear').trim(),
      deliveryDaysEstimate: Number(rawProduct.deliveryDaysEstimate) || 3,
      gstRate: rawProduct.gstRate !== undefined ? Number(rawProduct.gstRate) : 12,
      vendorId: rawProduct.vendorId || 'vendor-01',
      vendorName: rawProduct.vendorName || 'Vernunt Play Labs'
    };
  }
}

// ----------------------------------------------------------------------------
// 4. DISTRIBUTED INVENTORY LOCKING ENGINE (Preventing Overselling)
// ----------------------------------------------------------------------------
export class DistributedInventoryLockManager {
  private activeLocks: Map<string, InventoryLock> = new Map();
  private auditLogs: LockAuditLog[] = [];
  private totalOversellPrevented = 0;
  private sweeperInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start automated lease reclaimer every 10 seconds
    this.sweeperInterval = setInterval(() => {
      this.sweepExpiredLocks();
    }, 10000);
  }

  // Calculate sum of active reserved quantities for a product / variation
  public getLockedQuantity(productId: string, variationId?: string): number {
    const now = Date.now();
    let sum = 0;

    for (const lock of this.activeLocks.values()) {
      if (lock.status !== 'active') continue;
      if (lock.expiresAt <= now) continue;

      for (const item of lock.items) {
        if (item.productId === productId) {
          if (!variationId || !item.variationId || item.variationId === variationId) {
            sum += item.quantity;
          }
        }
      }
    }

    return sum;
  }

  // Atomic lease acquisition across multi-item cart
  public acquireLock(params: {
    items: InventoryLockItem[];
    sessionId: string;
    userId?: string;
    userEmail?: string;
    ttlSeconds?: number;
  }): {
    success: boolean;
    lockToken?: string;
    expiresAt?: number;
    ttlSeconds?: number;
    error?: string;
    failedItem?: {
      productId: string;
      requested: number;
      totalStock: number;
      lockedUnits: number;
      availableUnits: number;
    };
  } {
    const now = Date.now();
    const ttlSeconds = Math.min(Math.max(params.ttlSeconds || 600, 60), 1800); // 1 to 30 mins
    const expiresAt = now + ttlSeconds * 1000;

    // STEP 1: Verify all items have sufficient available stock atomically
    for (const item of params.items) {
      const product = catalogProducts.find(p => p.id === item.productId);
      if (!product) {
        return {
          success: false,
          error: `Product ${item.productId} not found in catalog`
        };
      }

      let totalStock = product.stockQuantity || 0;
      if (item.variationId && product.variations && product.variations.length > 0) {
        const v = product.variations.find(v => v.id === item.variationId);
        if (v) totalStock = v.stockQuantity || 0;
      }

      const lockedUnits = this.getLockedQuantity(item.productId, item.variationId);
      const availableUnits = Math.max(0, totalStock - lockedUnits);

      if (item.quantity > availableUnits) {
        this.totalOversellPrevented++;
        this.addAuditLog({
          action: 'OVERSELL_PREVENTED',
          lockToken: 'DENIED',
          sessionId: params.sessionId,
          details: `Rejected checkout for ${product.name}: requested ${item.quantity}, total stock ${totalStock}, locked ${lockedUnits}, available ${availableUnits}`
        });

        return {
          success: false,
          error: `INSUFFICIENT_STOCK: Only ${availableUnits} available (${lockedUnits} currently held in active checkouts)`,
          failedItem: {
            productId: item.productId,
            requested: item.quantity,
            totalStock,
            lockedUnits,
            availableUnits
          }
        };
      }
    }

    // STEP 2: All items passed, issue cryptographically unique lock token
    const lockToken = `vrn_lock_${crypto.randomBytes(16).toString('hex')}`;
    const newLock: InventoryLock = {
      lockToken,
      sessionId: params.sessionId,
      userId: params.userId,
      userEmail: params.userEmail,
      items: params.items.map(i => ({ ...i })),
      createdAt: now,
      expiresAt,
      status: 'active'
    };

    this.activeLocks.set(lockToken, newLock);

    this.addAuditLog({
      action: 'LOCK_ACQUIRED',
      lockToken,
      sessionId: params.sessionId,
      details: `Reserved ${params.items.reduce((acc, i) => acc + i.quantity, 0)} units across ${params.items.length} item(s) for ${ttlSeconds}s`,
      items: params.items
    });

    return {
      success: true,
      lockToken,
      expiresAt,
      ttlSeconds
    };
  }

  // Heartbeat / Extend active lease
  public heartbeat(lockToken: string, extensionSeconds = 300): boolean {
    const lock = this.activeLocks.get(lockToken);
    if (!lock || lock.status !== 'active') return false;

    lock.expiresAt = Date.now() + extensionSeconds * 1000;
    this.addAuditLog({
      action: 'LOCK_HEARTBEAT',
      lockToken,
      details: `Heartbeat received: lock extended by ${extensionSeconds}s`
    });
    return true;
  }

  // Release lock on cart abandon or checkout cancel
  public releaseLock(lockToken: string, reason = 'User cancelled or emptied cart'): boolean {
    const lock = this.activeLocks.get(lockToken);
    if (!lock || lock.status !== 'active') return false;

    lock.status = 'released';
    this.addAuditLog({
      action: 'LOCK_RELEASED',
      lockToken,
      details: `Released held stock: ${reason}`,
      items: lock.items
    });
    return true;
  }

  // Commit lock on verified payment: decrements actual stock and updates search index
  public commitLock(lockToken: string, orderRef?: string): boolean {
    const lock = this.activeLocks.get(lockToken);
    if (!lock || (lock.status !== 'active' && lock.status !== 'expired')) {
      return false;
    }

    // Permanently decrement catalog stock
    for (const item of lock.items) {
      const product = catalogProducts.find(p => p.id === item.productId);
      if (product) {
        if (item.variationId && product.variations) {
          const v = product.variations.find(v => v.id === item.variationId);
          if (v) {
            v.stockQuantity = Math.max(0, v.stockQuantity - item.quantity);
            v.inStock = v.stockQuantity > 0;
          }
          product.stockQuantity = product.variations.reduce((acc, v) => acc + (v.stockQuantity || 0), 0);
        } else {
          product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity);
        }
        product.stockStatus = product.stockQuantity > 0 ? 'instock' : 'outofstock';
      }
    }

    lock.status = 'committed';
    lock.orderRef = orderRef;

    // Refresh search index with updated stock counts
    searchIndex.rebuildIndex();

    this.addAuditLog({
      action: 'LOCK_COMMITTED',
      lockToken,
      details: `Committed inventory for Order #${orderRef || 'N/A'}. Permanent stock decremented.`,
      items: lock.items
    });

    return true;
  }

  // Background sweep of expired leases
  public sweepExpiredLocks(): number {
    const now = Date.now();
    let expiredCount = 0;

    for (const lock of this.activeLocks.values()) {
      if (lock.status === 'active' && lock.expiresAt <= now) {
        lock.status = 'expired';
        expiredCount++;
        this.addAuditLog({
          action: 'LOCK_EXPIRED',
          lockToken: lock.lockToken,
          details: `Lease expired after TTL. Reserved stock returned to available pool.`,
          items: lock.items
        });
      }
    }

    return expiredCount;
  }

  private addAuditLog(entry: Omit<LockAuditLog, 'id' | 'timestamp'>) {
    this.auditLogs.unshift({
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      ...entry
    });
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
  }

  public getTelemetry() {
    const now = Date.now();
    let activeLocksCount = 0;
    let totalUnitsHeld = 0;

    for (const lock of this.activeLocks.values()) {
      if (lock.status === 'active' && lock.expiresAt > now) {
        activeLocksCount++;
        totalUnitsHeld += lock.items.reduce((acc, i) => acc + i.quantity, 0);
      }
    }

    return {
      activeLocksCount,
      totalUnitsHeld,
      totalOversellPrevented: this.totalOversellPrevented,
      totalLocksTracked: this.activeLocks.size,
      recentLocks: Array.from(this.activeLocks.values())
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 20)
        .map(l => ({
          lockToken: l.lockToken,
          status: l.status,
          sessionId: l.sessionId,
          itemCount: l.items.length,
          totalQty: l.items.reduce((s, i) => s + i.quantity, 0),
          createdAt: new Date(l.createdAt).toISOString(),
          expiresAt: new Date(l.expiresAt).toISOString(),
          secondsRemaining: Math.max(0, Math.round((l.expiresAt - now) / 1000)),
          orderRef: l.orderRef
        })),
      recentAuditLogs: this.auditLogs.slice(0, 25)
    };
  }
}

export const inventoryLockManager = new DistributedInventoryLockManager();

// ============================================================================
// EXPRESS ROUTE REGISTRATION
// ============================================================================
export function registerCommerceEngineRoutes(app: Express): void {
  // --------------------------------------------------------------------------
  // 1. CURSOR PAGINATION & STORE CATALOG
  // --------------------------------------------------------------------------
  app.get('/api/commerce/products', (req: Request, res: Response) => {
    try {
      const cursor = (req.query.cursor as string) || undefined;
      const limit = parseInt(req.query.limit as string, 10) || 12;
      const sortBy = (req.query.sortBy as any) || 'relevance';
      const direction = (req.query.direction as any) || 'next';

      const filterOptions = {
        category: (req.query.category as string) || undefined,
        subcategory: (req.query.subcategory as string) || undefined,
        ageGroup: (req.query.ageGroup as string) || undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        inStockOnly: req.query.inStockOnly === 'true',
        brand: (req.query.brand as string) || undefined,
        vendorId: (req.query.vendorId as string) || undefined
      };

      const searchQuery = (req.query.q as string) || '';

      // Execute search index
      const { scoredProducts, facets, executionTimeMs } = searchIndex.search(searchQuery, filterOptions);

      // Execute cursor pagination
      const paginatedResult = CursorPaginationEngine.paginate(scoredProducts, {
        cursor,
        limit,
        sortBy,
        direction
      });

      // Inject live stock availability after inventory lock deductions
      const productsWithLiveStock = paginatedResult.items.map(p => {
        const lockedUnits = inventoryLockManager.getLockedQuantity(p.id);
        const effectiveStock = Math.max(0, (p.stockQuantity || 0) - lockedUnits);
        return {
          ...p,
          effectiveStock,
          currentlyLockedUnits: lockedUnits
        };
      });

      res.json({
        success: true,
        items: productsWithLiveStock,
        pagination: paginatedResult.pagination,
        facets,
        executionTimeMs
      });
    } catch (err: any) {
      console.error('[Commerce] /api/commerce/products error:', err);
      res.status(500).json({ success: false, error: err?.message || 'Server error' });
    }
  });

  // --------------------------------------------------------------------------
  // 2. DEDICATED HIGH-PERFORMANCE SEARCH INDEX ENDPOINTS
  // --------------------------------------------------------------------------
  app.get('/api/commerce/search', (req: Request, res: Response) => {
    try {
      const queryStr = (req.query.q as string) || '';
      const cursor = (req.query.cursor as string) || undefined;
      const limit = parseInt(req.query.limit as string, 10) || 12;
      const sortBy = (req.query.sortBy as any) || 'relevance';

      const filterOptions = {
        category: (req.query.category as string) || undefined,
        subcategory: (req.query.subcategory as string) || undefined,
        ageGroup: (req.query.ageGroup as string) || undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        inStockOnly: req.query.inStockOnly === 'true',
        brand: (req.query.brand as string) || undefined,
        vendorId: (req.query.vendorId as string) || undefined
      };

      const { scoredProducts, facets, executionTimeMs } = searchIndex.search(queryStr, filterOptions);
      const paginated = CursorPaginationEngine.paginate(scoredProducts, { cursor, limit, sortBy });

      res.json({
        success: true,
        query: queryStr,
        items: paginated.items,
        pagination: paginated.pagination,
        facets,
        executionTimeMs,
        engine: 'ZeroCost_InvertedIndex_BM25'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Search error' });
    }
  });

  app.get('/api/commerce/search/suggest', (req: Request, res: Response) => {
    try {
      const queryStr = (req.query.q as string) || '';
      const suggestions = searchIndex.suggest(queryStr);
      res.json({ success: true, query: queryStr, suggestions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.get('/api/commerce/search/stats', (_req: Request, res: Response) => {
    try {
      const stats = searchIndex.getStats();
      res.json({ success: true, stats });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // --------------------------------------------------------------------------
  // 3. VARIANT & TAXONOMY NORMALIZATION ENDPOINTS
  // --------------------------------------------------------------------------
  app.get('/api/commerce/taxonomy', (_req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        categories: STORE_CATEGORIES,
        ageGroups: VariantTaxonomyNormalizer.CANONICAL_AGE_GROUPS,
        timestamp: Date.now()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/commerce/normalize-product', (req: Request, res: Response) => {
    try {
      const rawProduct = req.body || {};
      const normalized = VariantTaxonomyNormalizer.normalizeFullProduct(rawProduct);
      res.json({ success: true, normalized });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Normalization failed' });
    }
  });

  app.post('/api/commerce/normalize-catalog', (_req: Request, res: Response) => {
    try {
      let repairCount = 0;
      const normalizedCatalog = catalogProducts.map(prod => {
        const norm = VariantTaxonomyNormalizer.normalizeFullProduct(prod);
        if (JSON.stringify(norm) !== JSON.stringify(prod)) repairCount++;
        return norm;
      });

      catalogProducts = normalizedCatalog;
      searchIndex.rebuildIndex();

      res.json({
        success: true,
        totalProducts: catalogProducts.length,
        repairedOrNormalizedCount: repairCount,
        message: `Successfully audited and normalized catalog (${repairCount} products adjusted).`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // --------------------------------------------------------------------------
  // 4. DISTRIBUTED INVENTORY LOCKING ENDPOINTS (Preventing Overselling)
  // --------------------------------------------------------------------------
  app.post('/api/commerce/inventory/lock', (req: Request, res: Response) => {
    try {
      const { items, sessionId, userId, userEmail, ttlSeconds } = req.body || {};
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Empty items array' });
      }
      if (!sessionId) {
        return res.status(400).json({ success: false, error: 'sessionId is required for lease allocation' });
      }

      const result = inventoryLockManager.acquireLock({
        items,
        sessionId,
        userId,
        userEmail,
        ttlSeconds
      });

      if (!result.success) {
        return res.status(409).json(result); // 409 Conflict: Insufficient stock
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Lock acquisition failed' });
    }
  });

  app.post('/api/commerce/inventory/heartbeat', (req: Request, res: Response) => {
    try {
      const { lockToken, extensionSeconds } = req.body || {};
      if (!lockToken) return res.status(400).json({ success: false, error: 'Missing lockToken' });

      const ok = inventoryLockManager.heartbeat(lockToken, extensionSeconds);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/commerce/inventory/release', (req: Request, res: Response) => {
    try {
      const { lockToken, reason } = req.body || {};
      if (!lockToken) return res.status(400).json({ success: false, error: 'Missing lockToken' });

      const ok = inventoryLockManager.releaseLock(lockToken, reason);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/commerce/inventory/commit', (req: Request, res: Response) => {
    try {
      const { lockToken, orderRef } = req.body || {};
      if (!lockToken) return res.status(400).json({ success: false, error: 'Missing lockToken' });

      const ok = inventoryLockManager.commitLock(lockToken, orderRef);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.get('/api/commerce/inventory/status', (_req: Request, res: Response) => {
    try {
      const telemetry = inventoryLockManager.getTelemetry();
      res.json({ success: true, telemetry });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });
}
