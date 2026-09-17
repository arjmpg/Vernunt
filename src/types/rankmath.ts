// src/types/rankmath.ts
/**
 * Rank Math SEO Suite Data Types & Interfaces
 */

export interface SeoCheckItem {
  id: string;
  category: 'basic' | 'additional' | 'titleReadability' | 'contentReadability';
  label: string;
  description: string;
  passed: boolean;
  score: number;
  maxScore: number;
  tip?: string;
  severity: 'critical' | 'warning' | 'good';
}

export interface RankMathAnalysisResult {
  overallScore: number; // 0 to 100
  scoreStatus: 'poor' | 'fair' | 'good'; // <50: red, 50-79: orange, 80-100: green
  wordCount: number;
  readingTimeMinutes: number;
  focusKeyword: string;
  keywordDensity: number;
  headingCounts: { h1: number; h2: number; h3: number; h4: number };
  checks: SeoCheckItem[];
  basicScore: number;
  additionalScore: number;
  titleScore: number;
  contentScore: number;
}

export type SchemaType =
  | 'Article'
  | 'MedicalWebPage'
  | 'FAQPage'
  | 'HowTo'
  | 'BreadcrumbList'
  | 'LocalBusiness'
  | 'Physician'
  | 'Event'
  | 'Product'
  | 'Review'
  | 'Organization';

export interface RedirectionRule {
  id: string;
  sourceUrl: string;
  destinationUrl: string;
  type: 301 | 302 | 307 | 410 | 451;
  isActive: boolean;
  hits: number;
  createdDate: string;
  lastAccessed?: string;
}

export interface NotFoundLogItem {
  id: string;
  url: string;
  hits: number;
  lastDetected: string;
  referrer: string;
  userAgent: string;
  resolved: boolean;
  redirectId?: string;
}

export interface SerpPreviewState {
  title: string;
  slug: string;
  description: string;
  canonicalUrl: string;
  focusKeyword: string;
  isCustomized: boolean;
}

export interface SocialPreviewState {
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
}

export interface SiteAuditSummary {
  totalUrlsScanned: number;
  overallHealthScore: number;
  criticalIssuesCount: number;
  warningsCount: number;
  passedCount: number;
  categories: {
    indexability: number;
    metaTags: number;
    schemaMarkup: number;
    contentQuality: number;
    internalLinking: number;
  };
  scannedPages: {
    url: string;
    title: string;
    score: number;
    status: 'good' | 'warning' | 'critical';
    hasSchema: boolean;
    hasCanonical: boolean;
    wordCount: number;
    issue?: string;
  }[];
}
