import { ProductSearchLogEntry, MatchedProductSnippet, ProductSearchSummaryStat } from '../types/searchAnalytics.ts';
import { getStoredProducts } from './storeProducts.ts';
import { StoreProduct } from '../types/store.ts';

export const RETENTION_DAYS = 45;
export const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;
export const STORAGE_KEY_PRODUCT_SEARCHES_45D = 'vernunt_product_searches_45d_v1';
export const EVENT_SEARCH_LOGS_UPDATED = 'vernunt_product_searches_updated';

// Helper to convert StoreProduct to MatchedProductSnippet
export const toProductSnippet = (product: StoreProduct): MatchedProductSnippet => ({
  id: product.id,
  name: product.name,
  category: product.category,
  price: product.price,
  regularPrice: product.regularPrice,
  featuredImage: product.featuredImage,
  ageLabel: product.ageLabel,
  brand: product.brand,
  inStock: product.stockQuantity > 0 && product.stockStatus !== 'outofstock'
});

// Helper to find matching products from store catalog
export const findMatchingProductsForQuery = (query: string): MatchedProductSnippet[] => {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const allProducts = getStoredProducts();

  const matched = allProducts.filter(p => {
    const nameMatch = p.name.toLowerCase().includes(q);
    const catMatch = p.category.toLowerCase().includes(q);
    const subMatch = p.subcategory?.toLowerCase().includes(q) || false;
    const descMatch = p.shortDescription?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || false;
    const tagMatch = p.tags?.some(t => t.toLowerCase().includes(q)) || false;
    const brandMatch = p.brand?.toLowerCase().includes(q) || false;
    const ageMatch = p.ageLabel?.toLowerCase().includes(q) || false;

    return nameMatch || catMatch || subMatch || descMatch || tagMatch || brandMatch || ageMatch;
  });

  return matched.slice(0, 8).map(toProductSnippet);
};

// Realistic seed data spanning the last 45 days (from 44 days ago up to current hours)
const generateInitial45DayLogs = (): ProductSearchLogEntry[] => {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const products = getStoredProducts();

  const rawSeedQueries = [
    { query: 'Montessori Wooden Blocks', daysAgo: 0.1, user: 'Pooja Verma', role: 'Parent', city: 'Bengaluru', source: 'store_catalog' as const },
    { query: 'Lego robotics STEM kit', daysAgo: 0.3, user: 'Vikram Joshi', role: 'Parent', city: 'Mumbai', source: 'radar_search' as const },
    { query: 'Organic Baby Porridge Ragi', daysAgo: 1, user: 'Ananya Roy', role: 'Parent', city: 'Pune', source: 'store_catalog' as const },
    { query: 'Silicone Teether BPA Free', daysAgo: 2, user: 'Neha Sharma', role: 'Parent', city: 'Delhi', source: 'store_catalog' as const },
    { query: 'Bilingual Storybook Hindi English', daysAgo: 3, user: 'Karthik Rao', role: 'Parent', city: 'Hyderabad', source: 'radar_search' as const },
    { query: 'Solar Hydraulic Robot 12 in 1', daysAgo: 4, user: 'Rajesh Nair', role: 'Daycare Center', city: 'Chennai', source: 'store_catalog' as const },
    { query: 'Non toxic modeling clay dough', daysAgo: 6, user: 'Meera Patel', role: 'Parent', city: 'Ahmedabad', source: 'store_catalog' as const },
    { query: 'Kids GPS Smart Safety Watch', daysAgo: 8, user: 'Rohan Gupta', role: 'Parent', city: 'Gurugram', source: 'radar_search' as const },
    { query: 'Wooden balance board 36 inch', daysAgo: 11, user: 'Siddharth Iyer', role: 'Parent', city: 'Bengaluru', source: 'store_catalog' as const },
    { query: 'Baby anti choking weaning spoon', daysAgo: 14, user: 'Divya Sen', role: 'Parent', city: 'Kolkata', source: 'store_catalog' as const },
    { query: 'Organic cotton baby swaddle pod', daysAgo: 17, user: 'Tanvi Saxena', role: 'Parent', city: 'Jaipur', source: 'store_catalog' as const },
    { query: 'Childproof magnetic cabinet locks', daysAgo: 20, user: 'Aditya Mathur', role: 'Parent', city: 'Noida', source: 'store_catalog' as const },
    { query: 'Toddler wooden sensory table', daysAgo: 23, user: 'Pooja Verma', role: 'Parent', city: 'Bengaluru', source: 'store_catalog' as const },
    { query: 'Washable finger paints sensory', daysAgo: 26, user: 'Smita Kulkarni', role: 'Parent', city: 'Pune', source: 'radar_search' as const },
    { query: 'STEM telescope astronomy kit', daysAgo: 30, user: 'Amitabh Bansal', role: 'Daycare Center', city: 'Delhi', source: 'store_catalog' as const },
    { query: 'Wooden animal puzzle matching', daysAgo: 34, user: 'Zoya Khan', role: 'Parent', city: 'Mumbai', source: 'store_catalog' as const },
    { query: 'Electric scooter for 2 year old', daysAgo: 37, user: 'Ramesh Sundaram', role: 'Parent', city: 'Coimbatore', source: 'radar_search' as const }, // zero-result
    { query: 'BPA Free suction bowl plate', daysAgo: 40, user: 'Harish Mehta', role: 'Parent', city: 'Chandigarh', source: 'store_catalog' as const },
    { query: 'Dinosaur drone with camera', daysAgo: 42, user: 'Sunil Chawla', role: 'Parent', city: 'Indore', source: 'radar_search' as const }, // zero-result
    { query: 'Sensory musical drum xylophone', daysAgo: 44, user: 'Bhavna Goswami', role: 'Parent', city: 'Surat', source: 'store_catalog' as const }
  ];

  return rawSeedQueries.map((seed, idx) => {
    const searchedAtMs = now - Math.round(seed.daysAgo * DAY_MS);
    const dateStr = new Date(searchedAtMs).toISOString();
    
    // Find matching products
    const qLower = seed.query.toLowerCase();
    const matched = products.filter(p => 
      p.name.toLowerCase().includes(qLower) || 
      p.category.toLowerCase().includes(qLower) ||
      p.tags?.some(t => qLower.includes(t.toLowerCase())) ||
      qLower.split(' ').some(word => word.length > 3 && p.name.toLowerCase().includes(word))
    ).slice(0, 5).map(toProductSnippet);

    return {
      id: `srch-seed-${idx + 1}-${Date.now().toString(36)}`,
      query: seed.query,
      searchedAt: dateStr,
      userName: seed.user,
      userRole: seed.role,
      userCity: seed.city,
      matchedProductIds: matched.map(m => m.id),
      matchedProducts: matched,
      matchedCount: matched.length,
      source: seed.source
    };
  });
};

// Retrieve stored 45-day product search logs
export const getStoredProductSearchLogs = (): ProductSearchLogEntry[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PRODUCT_SEARCHES_45D);
    const cutoffTime = Date.now() - RETENTION_MS;

    if (saved) {
      const parsed: ProductSearchLogEntry[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Enforce strict 45-day retention: drop anything older than 45 days
        const activeWithin45Days = parsed.filter(item => {
          const itemTime = new Date(item.searchedAt).getTime();
          return !isNaN(itemTime) && itemTime >= cutoffTime;
        });

        if (activeWithin45Days.length > 0) {
          return activeWithin45Days.sort((a, b) => new Date(b.searchedAt).getTime() - new Date(a.searchedAt).getTime());
        }
      }
    }

    // Seed defaults if fresh or expired
    const initialSeeds = generateInitial45DayLogs();
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCT_SEARCHES_45D, JSON.stringify(initialSeeds));
    } catch {
      // ignore
    }
    return initialSeeds;
  } catch (err) {
    console.warn('Error reading 45-day product searches from localStorage:', err);
    return generateInitial45DayLogs();
  }
};

// Save product search logs with strict 45-day pruning
export const saveStoredProductSearchLogs = (logs: ProductSearchLogEntry[]): void => {
  try {
    const cutoffTime = Date.now() - RETENTION_MS;
    const pruned = logs
      .filter(item => {
        const itemTime = new Date(item.searchedAt).getTime();
        return !isNaN(itemTime) && itemTime >= cutoffTime;
      })
      .sort((a, b) => new Date(b.searchedAt).getTime() - new Date(a.searchedAt).getTime());

    localStorage.setItem(STORAGE_KEY_PRODUCT_SEARCHES_45D, JSON.stringify(pruned));
    window.dispatchEvent(new CustomEvent(EVENT_SEARCH_LOGS_UPDATED, { detail: pruned }));
  } catch (err) {
    console.error('Error writing 45-day product searches to localStorage:', err);
  }
};

// Log a new product search event (from Radar search or Store catalog)
export const logProductSearch = (
  query: string,
  source: 'radar_search' | 'store_catalog' | 'mobile_store' | 'category_filter',
  userProfile?: { fullName?: string; userRole?: string; city?: string; id?: string }
): ProductSearchLogEntry | null => {
  if (!query || query.trim().length < 2) return null;
  const cleanQuery = query.trim();

  const currentLogs = getStoredProductSearchLogs();

  // Deduplicate if the same user searched the exact same query in the last 15 seconds
  const fifteenSecondsAgo = Date.now() - 15 * 1000;
  const recentDuplicate = currentLogs.find(l => 
    l.query.toLowerCase() === cleanQuery.toLowerCase() &&
    new Date(l.searchedAt).getTime() > fifteenSecondsAgo
  );
  if (recentDuplicate) {
    return recentDuplicate;
  }

  // Find matching products from catalogue
  const matched = findMatchingProductsForQuery(cleanQuery);

  const newEntry: ProductSearchLogEntry = {
    id: `srch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    query: cleanQuery,
    searchedAt: new Date().toISOString(),
    userId: userProfile?.id,
    userName: userProfile?.fullName || 'Community Parent',
    userRole: userProfile?.userRole || 'Parent',
    userCity: userProfile?.city || 'Bengaluru',
    matchedProductIds: matched.map(m => m.id),
    matchedProducts: matched,
    matchedCount: matched.length,
    source
  };

  const updatedLogs = [newEntry, ...currentLogs];
  saveStoredProductSearchLogs(updatedLogs);

  return newEntry;
};

// Clear all product searches (for admin test reset)
export const clearStoredProductSearchLogs = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY_PRODUCT_SEARCHES_45D);
    window.dispatchEvent(new CustomEvent(EVENT_SEARCH_LOGS_UPDATED, { detail: [] }));
  } catch (err) {
    console.error('Failed to clear search logs', err);
  }
};

// Compute high-level analytical summary for the 45-day retention window
export const computeSearchAnalyticsSummary = (logs: ProductSearchLogEntry[]): ProductSearchSummaryStat => {
  const totalSearches = logs.length;
  const uniqueQuerySet = new Set(logs.map(l => l.query.trim().toLowerCase()));
  const uniqueUserSet = new Set(logs.map(l => l.userName.trim().toLowerCase()));
  const zeroResultEntries = logs.filter(l => l.matchedCount === 0);

  // Product hit counts
  const productHitMap = new Map<string, { product: MatchedProductSnippet; count: number }>();
  logs.forEach(log => {
    log.matchedProducts.forEach(prod => {
      const existing = productHitMap.get(prod.id);
      if (existing) {
        existing.count += 1;
      } else {
        productHitMap.set(prod.id, { product: prod, count: 1 });
      }
    });
  });

  const topSearchedProducts = Array.from(productHitMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(item => ({ product: item.product, searchCount: item.count }));

  // Keyword frequency
  const keywordMap = new Map<string, { count: number; lastSearchedAt: string; hasResults: boolean }>();
  logs.forEach(log => {
    const key = log.query.trim();
    const existing = keywordMap.get(key.toLowerCase());
    if (existing) {
      existing.count += 1;
      if (new Date(log.searchedAt).getTime() > new Date(existing.lastSearchedAt).getTime()) {
        existing.lastSearchedAt = log.searchedAt;
      }
    } else {
      keywordMap.set(key.toLowerCase(), {
        count: 1,
        lastSearchedAt: log.searchedAt,
        hasResults: log.matchedCount > 0
      });
    }
  });

  const topKeywords = Array.from(keywordMap.entries())
    .map(([key, data]) => ({
      keyword: key,
      count: data.count,
      lastSearchedAt: data.lastSearchedAt,
      hasResults: data.hasResults
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const totalProductsMatched = logs.reduce((acc, l) => acc + l.matchedCount, 0);

  return {
    totalSearches,
    uniqueQueries: uniqueQuerySet.size,
    uniqueUsers: uniqueUserSet.size,
    totalProductsMatched,
    zeroResultCount: zeroResultEntries.length,
    zeroResultRate: totalSearches > 0 ? Math.round((zeroResultEntries.length / totalSearches) * 100) : 0,
    topSearchedProducts,
    topKeywords
  };
};
