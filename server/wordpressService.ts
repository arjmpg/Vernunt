import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { FLAGSHIP_KNOWLEDGE_ARTICLES, KnowledgeArticle } from '../src/data/knowledgeBase.ts';

export interface WordPressConfig {
  endpoint: string; // e.g. "https://example.com" or "https://example.wordpress.com" or "http://34.120.x.x" (Bitnami GCE)
  username: string; // WP username or admin email
  appPassword: string; // WordPress Application Password (e.g. "xxxx xxxx xxxx xxxx")
  syncEnabled: boolean; // Whether to fetch and merge live posts from WordPress
  lastTestedAt?: string;
  siteTitle?: string;
  isBitnami?: boolean;
}

const CONFIG_FILE_PATH = path.resolve(process.cwd(), 'wordpress-config.json');

// Default config
let currentConfig: WordPressConfig = {
  endpoint: '',
  username: '',
  appPassword: '',
  syncEnabled: false,
};

// Load saved config on boot
function loadConfig(): WordPressConfig {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      currentConfig = { ...currentConfig, ...parsed };
    }
  } catch (err) {
    console.debug('[WordPress Service] Note loading config:', err);
  }
  return currentConfig;
}

// Save config
function saveConfig(config: WordPressConfig): void {
  try {
    currentConfig = { ...config };
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(currentConfig, null, 2), 'utf-8');
  } catch (err) {
    console.error('[WordPress Service] Failed to save config to disk:', err);
  }
}

// Helper to normalize WordPress endpoint
function normalizeEndpoint(raw: string): string {
  let url = (raw || '').trim();
  if (!url) return '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url.replace(/\/+$/, '');
}

// Convert a native Vernunt KnowledgeArticle into rich semantic HTML for WordPress
export function convertGuideToWordPressHtml(article: KnowledgeArticle): string {
  const { content, author, influencerSpotlight } = article;
  let html = '';

  // Lead overview
  if (content.overview) {
    html += `<p class="vernunt-guide-lead" style="font-size: 1.15em; line-height: 1.7; color: #334155; margin-bottom: 24px;"><strong>${escapeHtml(content.overview)}</strong></p>\n\n`;
  }

  // Key takeaways callout
  if (content.keyTakeaways && content.keyTakeaways.length > 0) {
    html += `<div class="vernunt-key-takeaways" style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 18px 24px; border-radius: 8px; margin: 24px 0;">\n`;
    html += `  <h3 style="color: #166534; margin-top: 0; font-size: 1.1em;">🌿 Key Takeaways for Parents</h3>\n`;
    html += `  <ul style="color: #1e293b; padding-left: 20px; line-height: 1.6;">\n`;
    content.keyTakeaways.forEach((item) => {
      html += `    <li style="margin-bottom: 8px;">${escapeHtml(item)}</li>\n`;
    });
    html += `  </ul>\n`;
    html += `</div>\n\n`;
  }

  // Deep dive sections
  if (content.deepDiveSections && content.deepDiveSections.length > 0) {
    content.deepDiveSections.forEach((sec) => {
      html += `<h2>${escapeHtml(sec.heading)}</h2>\n`;
      sec.body.forEach((p) => {
        html += `<p style="line-height: 1.7; color: #334155;">${escapeHtml(p)}</p>\n`;
      });

      if (sec.proTip) {
        html += `<div class="vernunt-protip" style="background-color: #fefce8; border-left: 4px solid #ca8a04; padding: 14px 20px; border-radius: 6px; margin: 18px 0; color: #713f12;">\n`;
        html += `  <strong>💡 Pediatrician Pro-Tip:</strong> ${escapeHtml(sec.proTip)}\n`;
        html += `</div>\n`;
      }

      if (sec.warningOrAlert) {
        html += `<div class="vernunt-alert" style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 14px 20px; border-radius: 6px; margin: 18px 0; color: #991b1b;">\n`;
        html += `  <strong>⚠️ Important Safety Note:</strong> ${escapeHtml(sec.warningOrAlert)}\n`;
        html += `</div>\n`;
      }

      html += `\n`;
    });
  }

  // Actionable steps
  if (content.actionableSteps && content.actionableSteps.length > 0) {
    html += `<h2>Actionable Steps for Everyday Parenting</h2>\n`;
    html += `<ol style="color: #334155; padding-left: 24px; line-height: 1.7;">\n`;
    content.actionableSteps.forEach((step) => {
      html += `  <li style="margin-bottom: 10px;">${escapeHtml(step)}</li>\n`;
    });
    html += `</ol>\n\n`;
  }

  // Frequently Asked Questions
  if (content.faq && content.faq.length > 0) {
    html += `<h2>Frequently Asked Questions</h2>\n`;
    content.faq.forEach((qa) => {
      html += `<div class="vernunt-faq-item" style="margin-bottom: 18px;">\n`;
      html += `  <h3 style="font-size: 1.05em; color: #1e293b; margin-bottom: 6px;">Q: ${escapeHtml(qa.question)}</h3>\n`;
      html += `  <p style="color: #475569; line-height: 1.6; margin-top: 0;">A: ${escapeHtml(qa.answer)}</p>\n`;
      html += `</div>\n`;
    });
    html += `\n`;
  }

  // Author / Ambassador Attribution (White-labeled, no WordPress mentions)
  html += `<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />\n`;
  html += `<div class="vernunt-author-card" style="display: flex; gap: 16px; align-items: center; background: #f8fafc; padding: 16px; border-radius: 12px;">\n`;
  if (author?.avatar) {
    html += `  <img src="${escapeHtml(author.avatar)}" alt="${escapeHtml(author.name)}" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover;" />\n`;
  }
  html += `  <div>\n`;
  html += `    <strong style="color: #0f172a; font-size: 1em;">${escapeHtml(author.name)}</strong>\n`;
  html += `    <p style="color: #64748b; font-size: 0.85em; margin: 2px 0 0;">${escapeHtml(author.role)}</p>\n`;
  if (influencerSpotlight?.instagramHandle) {
    html += `    <span style="display: inline-block; margin-top: 4px; font-size: 0.8em; color: #0284c7; font-weight: bold;">${escapeHtml(influencerSpotlight.badgeLabel || 'Verified Ambassador')} · ${escapeHtml(influencerSpotlight.instagramHandle)}</span>\n`;
  }
  html += `  </div>\n`;
  html += `</div>\n`;

  return html;
}

// Simple HTML escaping helper
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Convert HTML content from WordPress into structured KnowledgeArticle content
function parseWordPressPostToArticle(wpPost: any): KnowledgeArticle {
  const renderedContent = wpPost.content?.rendered || '';
  const renderedTitle = (wpPost.title?.rendered || 'Untitled Guide').replace(/&#8217;/g, "'").replace(/&#8216;/g, "'").replace(/&amp;/g, '&');
  const renderedExcerpt = (wpPost.excerpt?.rendered || '').replace(/<[^>]+>/g, '').trim();

  // Extract featured image from _embedded if available
  let coverImageUrl = 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&auto=format&fit=crop&q=80';
  if (wpPost._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
    coverImageUrl = wpPost._embedded['wp:featuredmedia'][0].source_url;
  }

  // Extract author
  let authorName = 'Vernunt Pediatric Specialist';
  const authorRole = 'Child Health & Growth Editorial Contributor';
  const authorAvatar = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80';
  if (wpPost._embedded?.author?.[0]?.name) {
    authorName = wpPost._embedded.author[0].name;
  }

  // Extract category
  let category = 'Parenting & Play';
  let categoryLabel = 'Parenting & Playdates';
  if (wpPost._embedded?.['wp:term']?.[0]?.[0]?.name) {
    categoryLabel = wpPost._embedded['wp:term'][0][0].name;
    category = categoryLabel;
  }

  // Extract Headings for Table of Contents
  const toc: string[] = [];
  const headingMatches = renderedContent.match(/<h[23][^>]*>(.*?)<\/h[23]>/gi) || [];
  headingMatches.forEach((h: string) => {
    const clean = h.replace(/<[^>]+>/g, '').trim();
    if (clean && !toc.includes(clean)) {
      toc.push(clean);
    }
  });
  if (toc.length === 0) {
    toc.push('Overview', 'Practical Guidelines', 'Key Takeaways');
  }

  // Calculate read time based on word count (~200 words per minute)
  const plainText = renderedContent.replace(/<[^>]+>/g, ' ');
  const wordCount = plainText.trim().split(/\s+/).length;
  const minutes = Math.max(2, Math.ceil(wordCount / 200));

  return {
    slug: wpPost.slug || `guide-${wpPost.id}`,
    title: renderedTitle,
    category,
    categoryLabel,
    ageGroup: 'All Ages',
    readTime: `${minutes} min read`,
    summary: renderedExcerpt || 'Comprehensive growth guide reviewed by child development educators and pediatric specialists.',
    keywords: ['parenting', 'child care', 'development', 'guides', 'vernunt'],
    publishedDate: wpPost.date ? wpPost.date.split('T')[0] : new Date().toISOString().split('T')[0],
    coverImageUrl,
    status: 'Published',
    author: {
      name: authorName,
      role: authorRole,
      avatar: authorAvatar,
    },
    tableOfContents: toc,
    content: {
      overview: renderedExcerpt || 'A dedicated guide curated to help parents nurture cognitive milestones and healthy childhood habits.',
      keyTakeaways: [
        'Evidence-backed developmental methods adapted for modern families.',
        'Practical, actionable routines that fit seamlessly into daily schedules.',
        'Focus on joyful, screen-free engagement and parent-child connection.'
      ],
      deepDiveSections: [
        {
          heading: 'Full Guide Content',
          body: [plainText.slice(0, 800) || renderedExcerpt],
        }
      ],
      actionableSteps: [
        'Review the guide points with co-parents or caregivers.',
        'Incorporate one micro-routine every morning or afternoon.',
        'Connect with verified neighborhood peers on the Playmate Radar.'
      ],
      faq: [
        {
          question: 'How do I adapt this guide for my child’s age?',
          answer: 'Start with 10-minute micro-sessions and follow your child’s natural cues and energy levels.'
        }
      ]
    }
  };
}

// Generate WordPress eXtended RSS (WXR 1.2) XML for 100% free manual import
export function generateWordPressWxrXml(articles: KnowledgeArticle[]): string {
  const now = new Date().toUTCString();
  let xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"
  xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wfw="http://wellformedweb.org/CommentAPI/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:wp="http://wordpress.org/export/1.2/"
>
<channel>
  <title>Vernunt Parenting Knowledge Base</title>
  <link>https://app.vernunt.com</link>
  <description>Pediatric Health Guides, Nutrition Encyclopedia &amp; Child Growth Wisdom</description>
  <pubDate>${now}</pubDate>
  <language>en-US</language>
  <wp:wxr_version>1.2</wp:wxr_version>
  <wp:base_site_url>https://app.vernunt.com</wp:base_site_url>
  <wp:base_blog_url>https://app.vernunt.com</wp:base_blog_url>

  <wp:author>
    <wp:author_id>1</wp:author_id>
    <wp:author_login><![CDATA[vernunt_editorial]]></wp:author_login>
    <wp:author_email><![CDATA[editorial@vernunt.com]]></wp:author_email>
    <wp:author_display_name><![CDATA[Vernunt Editorial Team]]></wp:author_display_name>
    <wp:author_first_name><![CDATA[Vernunt]]></wp:author_first_name>
    <wp:author_last_name><![CDATA[Editorial]]></wp:author_last_name>
  </wp:author>
`;

  // Categories
  const categoriesMap = new Set<string>();
  articles.forEach(a => categoriesMap.add(a.categoryLabel || a.category));
  categoriesMap.forEach(cat => {
    const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    xml += `  <wp:category>
    <wp:term_id>${Math.floor(Math.random() * 9000) + 100}</wp:term_id>
    <wp:category_nicename><![CDATA[${slug}]]></wp:category_nicename>
    <wp:category_parent></wp:category_parent>
    <wp:cat_name><![CDATA[${cat}]]></wp:cat_name>
  </wp:category>\n`;
  });

  // Items
  articles.forEach((art, idx) => {
    const postId = 1000 + idx;
    const postDate = `${art.publishedDate} 10:00:00`;
    const postDateGmt = `${art.publishedDate} 04:30:00`;
    const postHtml = convertGuideToWordPressHtml(art);
    const catSlug = (art.categoryLabel || art.category).toLowerCase().replace(/[^a-z0-9]+/g, '-');

    xml += `  <item>
    <title><![CDATA[${art.title}]]></title>
    <link>https://app.vernunt.com/guides/${art.slug}</link>
    <pubDate>${new Date(art.publishedDate).toUTCString()}</pubDate>
    <dc:creator><![CDATA[vernunt_editorial]]></dc:creator>
    <guid isPermaLink="false">https://app.vernunt.com/?p=${postId}</guid>
    <description></description>
    <content:encoded><![CDATA[${postHtml}]]></content:encoded>
    <excerpt:encoded><![CDATA[${art.summary}]]></excerpt:encoded>
    <wp:post_id>${postId}</wp:post_id>
    <wp:post_date><![CDATA[${postDate}]]></wp:post_date>
    <wp:post_date_gmt><![CDATA[${postDateGmt}]]></wp:post_date_gmt>
    <wp:comment_status><![CDATA[closed]]></wp:comment_status>
    <wp:ping_status><![CDATA[closed]]></wp:ping_status>
    <wp:post_name><![CDATA[${art.slug}]]></wp:post_name>
    <wp:status><![CDATA[publish]]></wp:status>
    <wp:post_parent>0</wp:post_parent>
    <wp:menu_order>0</wp:menu_order>
    <wp:post_type><![CDATA[post]]></wp:post_type>
    <wp:post_password><![CDATA[]]></wp:post_password>
    <wp:is_sticky>0</wp:is_sticky>
    <category domain="category" nicename="${catSlug}"><![CDATA[${art.categoryLabel || art.category}]]></category>
    ${art.keywords.map(kw => `<category domain="post_tag" nicename="${kw.toLowerCase().replace(/[^a-z0-9]+/g, '-')}"><![CDATA[${kw}]]></category>`).join('\n    ')}
  </item>\n`;
  });

  xml += `</channel>\n</rss>`;
  return xml;
}

/**
 * Register WordPress Headless & Guide Publishing Endpoints
 */
export function registerWordPressRoutes(app: Express) {
  loadConfig();

  // 1. Get WordPress Configuration (Password masked for security)
  app.get('/api/wordpress/config', (req: Request, res: Response) => {
    const config = loadConfig();
    res.json({
      success: true,
      config: {
        endpoint: config.endpoint,
        username: config.username,
        hasAppPassword: Boolean(config.appPassword && config.appPassword.trim().length > 0),
        syncEnabled: Boolean(config.syncEnabled),
        lastTestedAt: config.lastTestedAt || null,
        siteTitle: config.siteTitle || null,
        isBitnami: Boolean(config.isBitnami),
      }
    });
  });

  // 2. Save WordPress Configuration
  app.post('/api/wordpress/config', (req: Request, res: Response) => {
    try {
      const { endpoint, username, appPassword, syncEnabled } = req.body || {};
      const current = loadConfig();

      const updated: WordPressConfig = {
        endpoint: normalizeEndpoint(endpoint !== undefined ? endpoint : current.endpoint),
        username: (username !== undefined ? username : current.username).trim(),
        appPassword: appPassword !== undefined && appPassword !== '••••••••' ? appPassword.trim() : current.appPassword,
        syncEnabled: syncEnabled !== undefined ? Boolean(syncEnabled) : current.syncEnabled,
        lastTestedAt: current.lastTestedAt,
        siteTitle: current.siteTitle,
        isBitnami: current.isBitnami,
      };

      saveConfig(updated);
      res.json({
        success: true,
        message: 'WordPress Headless configuration updated successfully.',
        config: {
          endpoint: updated.endpoint,
          username: updated.username,
          hasAppPassword: Boolean(updated.appPassword && updated.appPassword.length > 0),
          syncEnabled: updated.syncEnabled,
          lastTestedAt: updated.lastTestedAt || null,
          siteTitle: updated.siteTitle || null,
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to save config' });
    }
  });

  // 3. Test Connection to WordPress REST API
  app.post('/api/wordpress/test-connection', async (req: Request, res: Response) => {
    const start = Date.now();
    try {
      const reqEndpoint = req.body?.endpoint ? normalizeEndpoint(req.body.endpoint) : currentConfig.endpoint;
      const reqUsername = req.body?.username !== undefined ? req.body.username.trim() : currentConfig.username;
      const reqPassword = req.body?.appPassword !== undefined && req.body.appPassword !== '••••••••'
        ? req.body.appPassword.trim()
        : currentConfig.appPassword;

      if (!reqEndpoint) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid WordPress URL (e.g. https://your-site.com or your Bitnami GCP IP).'
        });
      }

      // Check root /wp-json endpoint
      const rootUrl = `${reqEndpoint}/wp-json`;
      const rootResp = await fetch(rootUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });

      if (!rootResp.ok) {
        return res.status(rootResp.status).json({
          success: false,
          error: `Could not connect to WordPress REST API at ${rootUrl} (HTTP status ${rootResp.status}). Ensure the WordPress site has pretty permalinks enabled.`
        });
      }

      const rootData: any = await rootResp.json();
      const siteName = rootData.name || 'WordPress Site';
      const siteDescription = rootData.description || '';
      const isBitnami = Boolean(
        rootResp.headers.get('x-powered-by')?.toLowerCase().includes('bitnami') ||
        JSON.stringify(rootData).toLowerCase().includes('bitnami')
      );

      // Check posts endpoint
      const postsUrl = `${reqEndpoint}/wp-json/wp/v2/posts?per_page=1`;
      const authHeaders: Record<string, string> = { 'Accept': 'application/json' };
      let authenticated = false;

      if (reqUsername && reqPassword) {
        const credentials = Buffer.from(`${reqUsername}:${reqPassword}`).toString('base64');
        authHeaders['Authorization'] = `Basic ${credentials}`;
      }

      const postsResp = await fetch(postsUrl, {
        headers: authHeaders,
        signal: AbortSignal.timeout(10000)
      });

      const totalPostsHeader = postsResp.headers.get('x-wp-total');
      const totalPosts = totalPostsHeader ? parseInt(totalPostsHeader, 10) : 0;

      if (reqUsername && reqPassword) {
        // Test user permissions by verifying if we can read authenticated user endpoint
        const userMeUrl = `${reqEndpoint}/wp-json/wp/v2/users/me`;
        const userResp = await fetch(userMeUrl, {
          headers: authHeaders,
          signal: AbortSignal.timeout(8000)
        }).catch(() => null);

        if (userResp && userResp.ok) {
          authenticated = true;
        }
      }

      const latencyMs = Date.now() - start;

      // Update config metadata
      currentConfig.siteTitle = siteName;
      currentConfig.lastTestedAt = new Date().toISOString();
      currentConfig.isBitnami = isBitnami;
      saveConfig(currentConfig);

      res.json({
        success: true,
        siteName,
        siteDescription,
        endpoint: reqEndpoint,
        latencyMs,
        totalPosts,
        isBitnami,
        authenticated,
        message: authenticated
          ? `Connected to "${siteName}" with publishing permissions (${latencyMs}ms)`
          : `Connected to "${siteName}" in read-only mode (${latencyMs}ms). Add an Application Password to enable 1-click publishing.`
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: `Connection test failed: ${err.message || 'Unknown network error'}. Ensure the WordPress site is reachable and allows REST API requests.`
      });
    }
  });

  // 4. Fetch Live Guides from WordPress REST API (100% White-Labeled)
  app.get('/api/wordpress/posts', async (req: Request, res: Response) => {
    try {
      const config = loadConfig();
      if (!config.endpoint) {
        return res.json({
          success: true,
          fromWordPress: false,
          articles: FLAGSHIP_KNOWLEDGE_ARTICLES,
          message: 'No WordPress endpoint configured. Using built-in local knowledge guides.'
        });
      }

      const postsUrl = `${config.endpoint}/wp-json/wp/v2/posts?_embed=1&per_page=100`;
      const authHeaders: Record<string, string> = { 'Accept': 'application/json' };
      if (config.username && config.appPassword) {
        const credentials = Buffer.from(`${config.username}:${config.appPassword}`).toString('base64');
        authHeaders['Authorization'] = `Basic ${credentials}`;
      }

      const resp = await fetch(postsUrl, {
        headers: authHeaders,
        signal: AbortSignal.timeout(12000)
      });

      if (!resp.ok) {
        console.warn(`[WordPress Service] Failed to fetch posts: HTTP ${resp.status}`);
        return res.json({
          success: true,
          fromWordPress: false,
          articles: FLAGSHIP_KNOWLEDGE_ARTICLES,
          fallbackReason: `WordPress API returned HTTP ${resp.status}`
        });
      }

      const wpPosts: any[] = await resp.json();
      if (!Array.isArray(wpPosts) || wpPosts.length === 0) {
        return res.json({
          success: true,
          fromWordPress: false,
          articles: FLAGSHIP_KNOWLEDGE_ARTICLES,
          fallbackReason: 'No published posts found on the WordPress site yet. Using built-in guides.'
        });
      }

      // Convert each post into our native, white-labeled KnowledgeArticle format
      const convertedArticles: KnowledgeArticle[] = wpPosts.map(parseWordPressPostToArticle);

      res.json({
        success: true,
        fromWordPress: true,
        count: convertedArticles.length,
        articles: convertedArticles,
      });
    } catch (err: any) {
      console.warn('[WordPress Service] Fetch error, falling back to local guides:', err?.message || err);
      res.json({
        success: true,
        fromWordPress: false,
        articles: FLAGSHIP_KNOWLEDGE_ARTICLES,
        fallbackReason: err?.message || 'Network error fetching from WordPress'
      });
    }
  });

  // 5. Publish All App Guides into WordPress (1-Click Automated Batch Sync)
  app.post('/api/wordpress/publish-all', async (req: Request, res: Response) => {
    try {
      const config = loadConfig();
      const endpoint = req.body?.endpoint ? normalizeEndpoint(req.body.endpoint) : config.endpoint;
      const username = req.body?.username !== undefined ? req.body.username.trim() : config.username;
      const appPassword = req.body?.appPassword !== undefined && req.body.appPassword !== '••••••••'
        ? req.body.appPassword.trim()
        : config.appPassword;

      if (!endpoint) {
        return res.status(400).json({
          success: false,
          error: 'WordPress endpoint is required. Please set your WordPress URL in the configuration.'
        });
      }

      if (!username || !appPassword) {
        return res.status(400).json({
          success: false,
          error: 'WordPress username and Application Password are required to publish posts. Generate an Application Password under WordPress -> Users -> Profile.'
        });
      }

      const credentials = Buffer.from(`${username}:${appPassword}`).toString('base64');
      const authHeader = `Basic ${credentials}`;

      const articlesToPublish = FLAGSHIP_KNOWLEDGE_ARTICLES;
      const results: {
        slug: string;
        title: string;
        status: 'created' | 'updated' | 'failed';
        wpId?: number;
        error?: string;
      }[] = [];

      let publishedCount = 0;
      let updatedCount = 0;
      let failedCount = 0;

      for (const article of articlesToPublish) {
        try {
          const htmlContent = convertGuideToWordPressHtml(article);

          // 1. Check if post with this slug already exists on WordPress
          const checkUrl = `${endpoint}/wp-json/wp/v2/posts?slug=${encodeURIComponent(article.slug)}&status=any`;
          const checkResp = await fetch(checkUrl, {
            headers: {
              'Accept': 'application/json',
              'Authorization': authHeader
            },
            signal: AbortSignal.timeout(10000)
          });

          let existingId: number | null = null;
          if (checkResp.ok) {
            const matches: any = await checkResp.json();
            if (Array.isArray(matches) && matches.length > 0) {
              existingId = matches[0].id;
            }
          }

          // 2. Prepare payload
          const postPayload = {
            title: article.title,
            slug: article.slug,
            content: htmlContent,
            excerpt: article.summary,
            status: 'publish',
          };

          let saveResp: any;
          if (existingId) {
            // Update existing post
            const updateUrl = `${endpoint}/wp-json/wp/v2/posts/${existingId}`;
            saveResp = await fetch(updateUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
                'Accept': 'application/json'
              },
              body: JSON.stringify(postPayload),
              signal: AbortSignal.timeout(15000)
            });
          } else {
            // Create new post
            const createUrl = `${endpoint}/wp-json/wp/v2/posts`;
            saveResp = await fetch(createUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
                'Accept': 'application/json'
              },
              body: JSON.stringify(postPayload),
              signal: AbortSignal.timeout(15000)
            });
          }

          if (saveResp.ok) {
            const savedData: any = await saveResp.json();
            if (existingId) {
              updatedCount++;
              results.push({ slug: article.slug, title: article.title, status: 'updated', wpId: savedData.id });
            } else {
              publishedCount++;
              results.push({ slug: article.slug, title: article.title, status: 'created', wpId: savedData.id });
            }
          } else {
            const errBody = await saveResp.text().catch(() => '');
            failedCount++;
            results.push({
              slug: article.slug,
              title: article.title,
              status: 'failed',
              error: `HTTP ${saveResp.status}: ${errBody.slice(0, 150)}`
            });
          }
        } catch (itemErr: any) {
          failedCount++;
          results.push({
            slug: article.slug,
            title: article.title,
            status: 'failed',
            error: itemErr.message || 'Network error'
          });
        }
      }

      res.json({
        success: true,
        total: articlesToPublish.length,
        publishedCount,
        updatedCount,
        failedCount,
        results,
        message: `Successfully synchronized ${publishedCount + updatedCount} guides with WordPress (${publishedCount} created, ${updatedCount} updated, ${failedCount} errors).`
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: `Batch publish failed: ${err.message || 'Unknown error'}`
      });
    }
  });

  // 6. Download WordPress WXR XML Export (100% Free Instant Import)
  app.get('/api/wordpress/export-wxr', (req: Request, res: Response) => {
    try {
      const xml = generateWordPressWxrXml(FLAGSHIP_KNOWLEDGE_ARTICLES);
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="vernunt-guides-wordpress-import.xml"');
      res.send(xml);
    } catch (err: any) {
      res.status(500).send(`Failed to generate XML: ${err.message || 'Unknown error'}`);
    }
  });

  // 7. Get Bitnami & Free WordPress Setup Guide
  app.get('/api/wordpress/bitnami-guide', (req: Request, res: Response) => {
    res.json({
      success: true,
      guide: {
        title: 'How to Connect Free WordPress / Bitnami to Vernunt (Headless CMS)',
        overview: 'WordPress acts as your private back-office content management dashboard. Vernunt fetches your guides and displays them to parents with 100% custom styling, zero WordPress branding, and maximum speed.',
        options: [
          {
            name: 'Option 1: Google Cloud Platform (Bitnami WordPress Free Tier)',
            steps: [
              'Go to Google Cloud Console -> Compute Engine -> VM Instances (or GCP Marketplace).',
              'Search for "WordPress Certified by Bitnami".',
              'Select the e2-micro instance (Eligible for GCP Always-Free Tier) in us-central1, us-east1, or us-west1.',
              'Click Deploy. Once deployed, note down the External IP address (e.g. http://34.120.x.x).',
              'Log into http://<external-ip>/wp-admin using user "user" and the password generated in the deployment output.'
            ]
          },
          {
            name: 'Option 2: 100% Free WordPress.com Tier',
            steps: [
              'Go to WordPress.com and create a free blog (e.g., yourname.wordpress.com).',
              'The WordPress REST API is enabled automatically at https://public-api.wordpress.com/wp/v2/sites/yourname.wordpress.com/posts.'
            ]
          },
          {
            name: 'Option 3: 100% Free Desktop CMS (LocalWP)',
            steps: [
              'Download free LocalWP (localwp.com) on your PC or Mac.',
              'Create a new site in 1 click.',
              'Click "Enable Live Link" to get a secure free public HTTPS URL that connects to this app.'
            ]
          }
        ],
        howToCreateAppPassword: [
          'In your WordPress Admin Dashboard, navigate to Users -> Profile.',
          'Scroll down to the "Application Passwords" section.',
          'Enter a new Application Password Name (e.g., "Vernunt Headless App") and click "Add New Application Password".',
          'Copy the 24-character generated password and paste it into the Vernunt WordPress settings.'
        ]
      }
    });
  });
}
