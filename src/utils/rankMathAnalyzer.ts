// src/utils/rankMathAnalyzer.ts
import { RankMathAnalysisResult, SeoCheckItem } from '../types/rankmath';

interface AnalyzeParams {
  title: string;
  description: string;
  slug: string;
  content: string;
  focusKeyword: string;
  headings?: { h1?: string[]; h2?: string[]; h3?: string[]; h4?: string[] };
  imageAltTags?: string[];
  outboundLinks?: string[];
  internalLinks?: string[];
}

const POWER_WORDS = [
  'ultimate', 'best', 'guide', 'proven', 'essential', 'top', 'fast', 'quick',
  'easy', 'blueprint', 'complete', 'definitive', 'actionable', 'expert',
  'step-by-step', 'mastery', 'secrets', 'exclusive', 'verified', 'guaranteed'
];

export function analyzeContentWithRankMath(params: AnalyzeParams): RankMathAnalysisResult {
  const {
    title = '',
    description = '',
    slug = '',
    content = '',
    focusKeyword = '',
    headings = { h1: [], h2: [], h3: [], h4: [] },
    imageAltTags = ['Vernunt Child Growth Guide Infographic', 'Pediatric Clinical Protocol'],
    outboundLinks = ['https://www.who.int', 'https://iapindia.org'],
    internalLinks = ['/radar', '/specialists', '/knowledge', '/events', '/directory']
  } = params;

  const normalizedKeyword = focusKeyword.trim().toLowerCase();
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();
  const slugLower = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const contentLower = content.toLowerCase();

  // Word count & Reading time calculation
  const words = content.trim() ? content.trim().split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Keyword frequency & density
  let keywordOccurrences = 0;
  if (normalizedKeyword && wordCount > 0) {
    const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    const matches = contentLower.match(regex);
    keywordOccurrences = matches ? matches.length : 0;
  }
  const keywordDensity = wordCount > 0 ? (keywordOccurrences / wordCount) * 100 : 0;

  // First 10% of content check
  const first10PercentWordLimit = Math.max(15, Math.floor(wordCount * 0.1));
  const first10PercentText = words.slice(0, first10PercentWordLimit).join(' ').toLowerCase();

  const checks: SeoCheckItem[] = [];

  // ==========================================
  // 1. BASIC SEO CHECKS (Total max: 40 points)
  // ==========================================

  // Check 1: Focus Keyword in Title (10 pts)
  const kwInTitle = Boolean(normalizedKeyword && titleLower.includes(normalizedKeyword));
  checks.push({
    id: 'kw-in-title',
    category: 'basic',
    label: 'Focus Keyword in the SEO Title',
    description: kwInTitle
      ? `Hurray! Your focus keyword "${focusKeyword}" is present in the SEO Title.`
      : `Add your focus keyword "${focusKeyword || 'your keyword'}" to the SEO Title.`,
    passed: kwInTitle,
    score: kwInTitle ? 10 : 0,
    maxScore: 10,
    severity: kwInTitle ? 'good' : 'critical',
    tip: 'Place the main keyword naturally into the primary title tag.'
  });

  // Check 2: Focus Keyword in Meta Description (8 pts)
  const kwInDesc = Boolean(normalizedKeyword && descLower.includes(normalizedKeyword));
  checks.push({
    id: 'kw-in-desc',
    category: 'basic',
    label: 'Focus Keyword in Meta Description',
    description: kwInDesc
      ? `Well done! Focus keyword was found in your meta description.`
      : `Your meta description does not contain the focus keyword "${focusKeyword}".`,
    passed: kwInDesc,
    score: kwInDesc ? 8 : 0,
    maxScore: 8,
    severity: kwInDesc ? 'good' : 'critical',
    tip: 'Craft a compelling meta description between 120-160 characters containing the keyword.'
  });

  // Check 3: Focus Keyword in URL Slug / Permalink (6 pts)
  const kwInSlug = Boolean(normalizedKeyword && slugLower.includes(normalizedKeyword.replace(/\s+/g, '-')));
  checks.push({
    id: 'kw-in-slug',
    category: 'basic',
    label: 'Focus Keyword in the URL / Slug',
    description: kwInSlug
      ? `Great! Focus keyword is present inside the URL permalink.`
      : `Focus keyword does not appear in the URL slug. Keep permalinks concise.`,
    passed: kwInSlug,
    score: kwInSlug ? 6 : 0,
    maxScore: 6,
    severity: kwInSlug ? 'good' : 'warning',
    tip: 'Ensure the URL structure includes target terms with hyphen separators.'
  });

  // Check 4: Focus Keyword in First 10% of Content (6 pts)
  const kwInFirst10 = Boolean(normalizedKeyword && first10PercentText.includes(normalizedKeyword));
  checks.push({
    id: 'kw-in-first-10',
    category: 'basic',
    label: 'Focus Keyword in the First 10% of Content',
    description: kwInFirst10
      ? `Your focus keyword appears early in the opening paragraphs.`
      : `The focus keyword does not appear in the first 10% of your content.`,
    passed: kwInFirst10,
    score: kwInFirst10 ? 6 : 0,
    maxScore: 6,
    severity: kwInFirst10 ? 'good' : 'warning',
    tip: 'Engage search crawlers and users by introducing the core topic immediately.'
  });

  // Check 5: Focus Keyword Found in Content (5 pts)
  const kwInContent = keywordOccurrences > 0;
  checks.push({
    id: 'kw-in-content',
    category: 'basic',
    label: 'Focus Keyword in the Content Body',
    description: kwInContent
      ? `Focus keyword appears ${keywordOccurrences} times throughout the content body.`
      : `Could not find focus keyword in the main content.`,
    passed: kwInContent,
    score: kwInContent ? 5 : 0,
    maxScore: 5,
    severity: kwInContent ? 'good' : 'critical'
  });

  // Check 6: Content Length (5 pts)
  const hasGoodLength = wordCount >= 600;
  const isOptimalLength = wordCount >= 1000;
  checks.push({
    id: 'content-length',
    category: 'basic',
    label: 'Content Length & Word Count',
    description: isOptimalLength
      ? `Incredible! Content is ${wordCount} words long (exceeds 1,000 words recommendation).`
      : hasGoodLength
      ? `Good job! Content is ${wordCount} words long. Aim for 1,000+ words for maximum ranking power.`
      : `Content is only ${wordCount} words. Rank Math recommends at least 600 words for competitive indexing.`,
    passed: hasGoodLength,
    score: isOptimalLength ? 5 : hasGoodLength ? 3 : 1,
    maxScore: 5,
    severity: hasGoodLength ? 'good' : 'warning'
  });

  // ==========================================
  // 2. ADDITIONAL SEO CHECKS (Total max: 30 points)
  // ==========================================

  // Check 7: Focus Keyword in Subheadings H2/H3 (7 pts)
  const allSubheadings = [...(headings.h2 || []), ...(headings.h3 || [])].map(h => h.toLowerCase());
  const kwInSubheading = Boolean(normalizedKeyword && allSubheadings.some(h => h.includes(normalizedKeyword)));
  checks.push({
    id: 'kw-in-subheadings',
    category: 'additional',
    label: 'Focus Keyword in Subheading (H2, H3, H4)',
    description: kwInSubheading
      ? `Focus keyword found in your secondary H2/H3 section subheadings.`
      : `Use focus keyword in at least one H2 or H3 heading to structure the topic for bots.`,
    passed: kwInSubheading,
    score: kwInSubheading ? 7 : 0,
    maxScore: 7,
    severity: kwInSubheading ? 'good' : 'warning'
  });

  // Check 8: Focus Keyword in Image Alt Attribute (6 pts)
  const kwInImageAlt = Boolean(normalizedKeyword && imageAltTags.some(alt => alt.toLowerCase().includes(normalizedKeyword)));
  checks.push({
    id: 'kw-in-image-alt',
    category: 'additional',
    label: 'Focus Keyword in Image Alt Attributes',
    description: kwInImageAlt
      ? `Image alt attributes contain the target keyword for Google Images SEO.`
      : `Add focus keyword as ALT text for at least one media illustration or diagram.`,
    passed: kwInImageAlt,
    score: kwInImageAlt ? 6 : 2,
    maxScore: 6,
    severity: kwInImageAlt ? 'good' : 'warning'
  });

  // Check 9: Keyword Density between 1.0% and 2.5% (6 pts)
  const isDensityOptimal = keywordDensity >= 0.8 && keywordDensity <= 2.8;
  checks.push({
    id: 'kw-density',
    category: 'additional',
    label: 'Keyword Density',
    description: `Keyword density is ${keywordDensity.toFixed(2)}% (${keywordOccurrences} occurrences). Recommended range is 1.0% - 2.5%.`,
    passed: isDensityOptimal,
    score: isDensityOptimal ? 6 : keywordDensity > 0 ? 3 : 0,
    maxScore: 6,
    severity: isDensityOptimal ? 'good' : 'warning'
  });

  // Check 10: URL Length < 75 characters (3 pts)
  const isUrlShort = slug.length <= 75;
  checks.push({
    id: 'url-length',
    category: 'additional',
    label: 'URL Permalink Character Length',
    description: isUrlShort
      ? `URL slug is ${slug.length} characters long (well within the 75-character best practice).`
      : `URL slug is ${slug.length} characters long. Consider trimming stop-words.`,
    passed: isUrlShort,
    score: isUrlShort ? 3 : 1,
    maxScore: 3,
    severity: isUrlShort ? 'good' : 'warning'
  });

  // Check 11: Outbound Links to Authority Resources (4 pts)
  const hasOutbound = outboundLinks.length > 0;
  checks.push({
    id: 'outbound-links',
    category: 'additional',
    label: 'Outbound External Authority Links',
    description: hasOutbound
      ? `Great! You are linking to external authority domains (${outboundLinks.length} references).`
      : `Add external citations (e.g. WHO, Indian Academy of Pediatrics) to build clinical trust.`,
    passed: hasOutbound,
    score: hasOutbound ? 4 : 0,
    maxScore: 4,
    severity: hasOutbound ? 'good' : 'warning'
  });

  // Check 12: Internal Linking (4 pts)
  const hasInternal = internalLinks.length > 0;
  checks.push({
    id: 'internal-links',
    category: 'additional',
    label: 'Internal Linking Graph Structure',
    description: hasInternal
      ? `Excellent! Found ${internalLinks.length} internal links connecting this page to the Vernunt graph.`
      : `Link to related guides, doctors, and activity radar to eliminate orphan URLs.`,
    passed: hasInternal,
    score: hasInternal ? 4 : 0,
    maxScore: 4,
    severity: hasInternal ? 'good' : 'warning'
  });

  // ==========================================
  // 3. TITLE READABILITY CHECKS (Total max: 15 points)
  // ==========================================

  // Check 13: Focus Keyword at the Beginning of Title (6 pts)
  const kwAtStart = Boolean(normalizedKeyword && titleLower.indexOf(normalizedKeyword) <= 15);
  checks.push({
    id: 'kw-at-start-title',
    category: 'titleReadability',
    label: 'Focus Keyword Near Beginning of Title',
    description: kwAtStart
      ? `Focus keyword appears near the start of the title, capturing attention in search results.`
      : `Position focus keyword closer to the start of the SEO Title tag.`,
    passed: kwAtStart,
    score: kwAtStart ? 6 : 2,
    maxScore: 6,
    severity: kwAtStart ? 'good' : 'warning'
  });

  // Check 14: Title Contains a Number (5 pts)
  const hasNumberInTitle = /\d+/.test(title);
  checks.push({
    id: 'number-in-title',
    category: 'titleReadability',
    label: 'Title Contains a Number (CTR Booster)',
    description: hasNumberInTitle
      ? `Your title contains a specific number (e.g. age bracket, steps, or year 2026), boosting CTR.`
      : `Adding numbers (e.g. "7-10 Years", "5 Pro-Tips", "2026") improves Google SERP click-through rate.`,
    passed: hasNumberInTitle,
    score: hasNumberInTitle ? 5 : 1,
    maxScore: 5,
    severity: hasNumberInTitle ? 'good' : 'warning'
  });

  // Check 15: Power or Sentiment Words (4 pts)
  const hasPowerWord = POWER_WORDS.some(pw => titleLower.includes(pw));
  checks.push({
    id: 'power-words',
    category: 'titleReadability',
    label: 'Power / Emotional Words in Title',
    description: hasPowerWord
      ? `Title contains persuasive power/authoritative words.`
      : `Consider adding strong words like "Guide", "Proven", "Complete", or "Essential".`,
    passed: hasPowerWord,
    score: hasPowerWord ? 4 : 1,
    maxScore: 4,
    severity: hasPowerWord ? 'good' : 'warning'
  });

  // ==========================================
  // 4. CONTENT READABILITY CHECKS (Total max: 15 points)
  // ==========================================

  // Check 16: Table of Contents Present (6 pts)
  const hasTableOfContents = contentLower.includes('table of contents') || contentLower.includes('toc') || contentLower.includes('quick navigation') || (headings.h2 && headings.h2.length >= 3);
  checks.push({
    id: 'table-of-contents',
    category: 'contentReadability',
    label: 'Table of Contents to Breakdown Content',
    description: hasTableOfContents
      ? `Page includes structured section navigation or Table of Contents for jump-links in Google.`
      : `Add a Table of Contents so Google can generate sitelink jump-points in search snippets.`,
    passed: Boolean(hasTableOfContents),
    score: hasTableOfContents ? 6 : 1,
    maxScore: 6,
    severity: hasTableOfContents ? 'good' : 'warning'
  });

  // Check 17: Short Paragraphs for Mobile Readability (5 pts)
  const paragraphs = content.split('\n\n').filter(Boolean);
  const avgParagraphWords = paragraphs.length > 0 ? wordCount / paragraphs.length : 150;
  const isShortParagraphs = avgParagraphWords <= 120;
  checks.push({
    id: 'short-paragraphs',
    category: 'contentReadability',
    label: 'Short Paragraphs for Mobile Eye-Scan',
    description: isShortParagraphs
      ? `Paragraphs are bite-sized (average ${Math.round(avgParagraphWords)} words) for mobile parents.`
      : `Some paragraphs are dense. Break them down to under 120 words for higher dwell time.`,
    passed: isShortParagraphs,
    score: isShortParagraphs ? 5 : 2,
    maxScore: 5,
    severity: isShortParagraphs ? 'good' : 'warning'
  });

  // Check 18: Media, Infographics or Badges (4 pts)
  const hasMediaOrBadges = imageAltTags.length > 0;
  checks.push({
    id: 'rich-media-usage',
    category: 'contentReadability',
    label: 'Rich Media & Interactive Visual Callouts',
    description: hasMediaOrBadges
      ? `Content features visual callout boxes, pro-tips, and rich clinical media.`
      : `Add visual elements, tables, or pro-tip banners to enrich user experience.`,
    passed: hasMediaOrBadges,
    score: hasMediaOrBadges ? 4 : 1,
    maxScore: 4,
    severity: hasMediaOrBadges ? 'good' : 'warning'
  });

  // Calculate Sub-Scores
  const basicScore = checks.filter(c => c.category === 'basic').reduce((acc, c) => acc + c.score, 0);
  const additionalScore = checks.filter(c => c.category === 'additional').reduce((acc, c) => acc + c.score, 0);
  const titleScore = checks.filter(c => c.category === 'titleReadability').reduce((acc, c) => acc + c.score, 0);
  const contentScore = checks.filter(c => c.category === 'contentReadability').reduce((acc, c) => acc + c.score, 0);

  const rawOverall = basicScore + additionalScore + titleScore + contentScore;
  const overallScore = Math.min(100, Math.max(0, Math.round(rawOverall)));

  const scoreStatus: 'poor' | 'fair' | 'good' =
    overallScore >= 80 ? 'good' : overallScore >= 50 ? 'fair' : 'poor';

  const headingCounts = {
    h1: headings.h1 ? headings.h1.length : 1,
    h2: headings.h2 ? headings.h2.length : 0,
    h3: headings.h3 ? headings.h3.length : 0,
    h4: headings.h4 ? headings.h4.length : 0
  };

  return {
    overallScore,
    scoreStatus,
    wordCount,
    readingTimeMinutes,
    focusKeyword,
    keywordDensity,
    headingCounts,
    checks,
    basicScore,
    additionalScore,
    titleScore,
    contentScore
  };
}
