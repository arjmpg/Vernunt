import { StoreProduct, StoreCategory } from '../types/store.ts';

export interface CursorPaginationInfo {
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
  hasPrev: boolean;
  limit: number;
  totalMatches: number;
  returnedCount: number;
  startIndex: number;
  sortBy: string;
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

export interface ProductsCursorResponse {
  success: boolean;
  items: Array<StoreProduct & { effectiveStock?: number; currentlyLockedUnits?: number }>;
  pagination: CursorPaginationInfo;
  facets: SearchFacets;
  executionTimeMs: number;
  engine?: string;
  error?: string;
}

export interface SearchStatsResponse {
  success: boolean;
  stats: {
    indexedDocuments: number;
    uniqueTermsCount: number;
    prefixTrieNodes: number;
    soundexClusters: number;
    totalSearches: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
    lastIndexedAt: string;
    engine: string;
  };
}

export interface LockAcquireResult {
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
}

export interface InventoryTelemetryResponse {
  success: boolean;
  telemetry: {
    activeLocksCount: number;
    totalUnitsHeld: number;
    totalOversellPrevented: number;
    totalLocksTracked: number;
    recentLocks: Array<{
      lockToken: string;
      status: string;
      sessionId: string;
      itemCount: number;
      totalQty: number;
      createdAt: string;
      expiresAt: string;
      secondsRemaining: number;
      orderRef?: string;
    }>;
    recentAuditLogs: Array<{
      id: string;
      timestamp: number;
      action: string;
      lockToken: string;
      sessionId?: string;
      details: string;
    }>;
  };
}

// ----------------------------------------------------------------------------
// CLIENT API IMPLEMENTATION (Pure zero-cost HTTP endpoints)
// ----------------------------------------------------------------------------
export class CommerceApiClient {
  private static getSessionId(): string {
    let sid = sessionStorage.getItem('vrn_cart_session_id');
    if (!sid) {
      sid = `ses_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      try {
        sessionStorage.setItem('vrn_cart_session_id', sid);
      } catch {
        // ignore
      }
    }
    return sid;
  }

  // 1. Cursor-Based Pagination Endpoint
  public static async fetchProducts(params: {
    cursor?: string;
    limit?: number;
    sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'name_asc';
    direction?: 'next' | 'prev';
    q?: string;
    category?: string;
    subcategory?: string;
    ageGroup?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    brand?: string;
    vendorId?: string;
  }): Promise<ProductsCursorResponse> {
    const searchParams = new URLSearchParams();
    if (params.cursor) searchParams.set('cursor', params.cursor);
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.direction) searchParams.set('direction', params.direction);
    if (params.q) searchParams.set('q', params.q);
    if (params.category && params.category !== 'all') searchParams.set('category', params.category);
    if (params.subcategory && params.subcategory !== 'all') searchParams.set('subcategory', params.subcategory);
    if (params.ageGroup && params.ageGroup !== 'all') searchParams.set('ageGroup', params.ageGroup);
    if (params.minPrice !== undefined) searchParams.set('minPrice', params.minPrice.toString());
    if (params.maxPrice !== undefined) searchParams.set('maxPrice', params.maxPrice.toString());
    if (params.inStockOnly) searchParams.set('inStockOnly', 'true');
    if (params.brand) searchParams.set('brand', params.brand);
    if (params.vendorId) searchParams.set('vendorId', params.vendorId);

    const res = await fetch(`/api/commerce/products?${searchParams.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch paginated products: HTTP ${res.status}`);
    }
    return await res.json();
  }

  // 2. High-Performance Inverted Index Search
  public static async searchProducts(
    q: string,
    options: {
      cursor?: string;
      limit?: number;
      category?: string;
      sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'name_asc';
    } = {}
  ): Promise<ProductsCursorResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set('q', q);
    if (options.cursor) searchParams.set('cursor', options.cursor);
    if (options.limit) searchParams.set('limit', options.limit.toString());
    if (options.category && options.category !== 'all') searchParams.set('category', options.category);
    if (options.sortBy) searchParams.set('sortBy', options.sortBy);

    const res = await fetch(`/api/commerce/search?${searchParams.toString()}`);
    if (!res.ok) {
      throw new Error(`Search index failed: HTTP ${res.status}`);
    }
    return await res.json();
  }

  // 2b. Autocomplete & Typeahead Suggestions
  public static async getSuggestions(prefix: string): Promise<Array<{ term: string; count: number }>> {
    if (!prefix || prefix.trim().length < 2) return [];
    try {
      const res = await fetch(`/api/commerce/search/suggest?q=${encodeURIComponent(prefix.trim())}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.suggestions || [];
    } catch {
      return [];
    }
  }

  // 2c. Search Index Telemetry Stats
  public static async getSearchStats(): Promise<SearchStatsResponse['stats'] | null> {
    try {
      const res = await fetch('/api/commerce/search/stats');
      if (!res.ok) return null;
      const data: SearchStatsResponse = await res.json();
      return data.stats;
    } catch {
      return null;
    }
  }

  // 3. Variant & Taxonomy Normalization
  public static async getTaxonomy(): Promise<{ categories: StoreCategory[]; ageGroups: string[] }> {
    const res = await fetch('/api/commerce/taxonomy');
    if (!res.ok) throw new Error('Failed to load taxonomy');
    const data = await res.json();
    return { categories: data.categories || [], ageGroups: data.ageGroups || [] };
  }

  public static async normalizeProduct(product: Partial<StoreProduct>): Promise<StoreProduct> {
    const res = await fetch('/api/commerce/normalize-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) throw new Error('Failed to normalize product schema');
    const data = await res.json();
    return data.normalized;
  }

  public static async normalizeCatalog(): Promise<{ totalProducts: number; repairedOrNormalizedCount: number; message: string }> {
    const res = await fetch('/api/commerce/normalize-catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to audit and normalize catalog');
    return await res.json();
  }

  // 4. Distributed Inventory Locking (Preventing Overselling)
  public static async acquireLock(params: {
    items: Array<{ productId: string; variationId?: string; quantity: number; productName?: string }>;
    userId?: string;
    userEmail?: string;
    ttlSeconds?: number;
  }): Promise<LockAcquireResult> {
    const sessionId = this.getSessionId();
    const res = await fetch('/api/commerce/inventory/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: params.items,
        sessionId,
        userId: params.userId,
        userEmail: params.userEmail,
        ttlSeconds: params.ttlSeconds || 600 // 10 minutes reservation
      })
    });

    const data = await res.json();
    return data;
  }

  public static async heartbeatLock(lockToken: string, extensionSeconds = 300): Promise<boolean> {
    try {
      const res = await fetch('/api/commerce/inventory/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockToken, extensionSeconds })
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  }

  public static async releaseLock(lockToken: string, reason = 'User cancelled'): Promise<boolean> {
    try {
      const res = await fetch('/api/commerce/inventory/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockToken, reason })
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  }

  public static async commitLock(lockToken: string, orderRef: string): Promise<boolean> {
    try {
      const res = await fetch('/api/commerce/inventory/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockToken, orderRef })
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  }

  public static async getInventoryLockTelemetry(): Promise<InventoryTelemetryResponse['telemetry'] | null> {
    try {
      const res = await fetch('/api/commerce/inventory/status');
      if (!res.ok) return null;
      const data: InventoryTelemetryResponse = await res.json();
      return data.telemetry;
    } catch {
      return null;
    }
  }
}
