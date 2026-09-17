export interface MatchedProductSnippet {
  id: string;
  name: string;
  category: string;
  price: number;
  regularPrice?: number;
  featuredImage: string;
  ageLabel?: string;
  brand?: string;
  inStock?: boolean;
}

export interface ProductSearchLogEntry {
  id: string;
  query: string;
  searchedAt: string; // ISO 8601 string
  userId?: string;
  userName: string;
  userRole: string;
  userCity: string;
  matchedProductIds: string[];
  matchedProducts: MatchedProductSnippet[];
  matchedCount: number;
  source: 'radar_search' | 'store_catalog' | 'mobile_store' | 'category_filter';
}

export interface ProductSearchSummaryStat {
  totalSearches: number;
  uniqueQueries: number;
  uniqueUsers: number;
  totalProductsMatched: number;
  zeroResultCount: number;
  zeroResultRate: number; // percentage
  topSearchedProducts: {
    product: MatchedProductSnippet;
    searchCount: number;
  }[];
  topKeywords: {
    keyword: string;
    count: number;
    lastSearchedAt: string;
    hasResults: boolean;
  }[];
}
