import { KnowledgeArticle } from '../data/knowledgeBase.ts';

export interface WordPressConfigData {
  endpoint: string;
  username: string;
  hasAppPassword: boolean;
  syncEnabled: boolean;
  lastTestedAt: string | null;
  siteTitle: string | null;
  isBitnami?: boolean;
}

export interface WordPressConnectionTestResult {
  success: boolean;
  siteName?: string;
  siteDescription?: string;
  endpoint?: string;
  latencyMs?: number;
  totalPosts?: number;
  isBitnami?: boolean;
  authenticated?: boolean;
  message?: string;
  error?: string;
}

export interface WordPressPublishAllResult {
  success: boolean;
  total: number;
  publishedCount: number;
  updatedCount: number;
  failedCount: number;
  message?: string;
  results?: {
    slug: string;
    title: string;
    status: 'created' | 'updated' | 'failed';
    wpId?: number;
    error?: string;
  }[];
  error?: string;
}

export interface BitnamiSetupGuideData {
  title: string;
  overview: string;
  options: {
    name: string;
    steps: string[];
  }[];
  howToCreateAppPassword: string[];
}

export const wordpressService = {
  // Get WordPress config from server
  async getConfig(): Promise<{ success: boolean; config?: WordPressConfigData; error?: string }> {
    try {
      const res = await fetch('/api/wordpress/config');
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to load WordPress config' };
    }
  },

  // Save WordPress config
  async saveConfig(params: {
    endpoint: string;
    username: string;
    appPassword?: string;
    syncEnabled: boolean;
  }): Promise<{ success: boolean; message?: string; config?: WordPressConfigData; error?: string }> {
    try {
      const res = await fetch('/api/wordpress/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to save WordPress config' };
    }
  },

  // Test connection to WordPress
  async testConnection(params?: {
    endpoint?: string;
    username?: string;
    appPassword?: string;
  }): Promise<WordPressConnectionTestResult> {
    try {
      const res = await fetch('/api/wordpress/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {}),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error connecting to WordPress' };
    }
  },

  // Fetch live articles from WordPress (100% white-labeled)
  async fetchLiveArticles(): Promise<{
    success: boolean;
    fromWordPress: boolean;
    count?: number;
    articles: KnowledgeArticle[];
    fallbackReason?: string;
  }> {
    try {
      const res = await fetch('/api/wordpress/posts');
      return await res.json();
    } catch (e: any) {
      return {
        success: false,
        fromWordPress: false,
        articles: [],
        fallbackReason: e.message || 'Failed to fetch from WordPress',
      };
    }
  },

  // Publish all current app guides to WordPress
  async publishAllGuides(params?: {
    endpoint?: string;
    username?: string;
    appPassword?: string;
  }): Promise<WordPressPublishAllResult> {
    try {
      const res = await fetch('/api/wordpress/publish-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {}),
      });
      return await res.json();
    } catch (e: any) {
      return {
        success: false,
        total: 0,
        publishedCount: 0,
        updatedCount: 0,
        failedCount: 0,
        error: e.message || 'Failed to publish guides to WordPress',
      };
    }
  },

  // Download WXR XML file for free instant manual import into any WordPress site
  downloadWxrXml() {
    window.open('/api/wordpress/export-wxr', '_blank');
  },

  // Get Bitnami and free WordPress setup instructions
  async getSetupGuide(): Promise<{ success: boolean; guide?: BitnamiSetupGuideData; error?: string }> {
    try {
      const res = await fetch('/api/wordpress/bitnami-guide');
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to load guide' };
    }
  }
};
