import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { INITIAL_STORE_PRODUCTS } from '../src/data/storeProducts.ts';
import { MOCK_EVENTS } from '../src/data/mockData.ts';
import {
  generateGoogleMerchantXml,
  generateStoreSitemapXml,
  generateProductJsonLd,
  mapToGoogleProductCategory
} from '../src/utils/googleMerchantFeed.ts';
import {
  generateEventJsonLd,
  computeEventRealTimeTicketing,
  resolveEventIsoDates,
  getEventDirectUrl,
  getEventDirectCheckoutUrl
} from '../src/utils/eventUrls.ts';
import type { StoreProduct } from '../src/types/store.ts';
import type { CommunityEvent } from '../src/types.ts';

export const DEFAULT_GOOGLE_MERCHANT_CENTER_ID = '5909118279';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const SYNC_STATE_FILE = path.join(DATA_DIR, 'google_sync_state.json');
const MERCHANT_PRODUCTS_FILE = path.join(DATA_DIR, 'merchant_products_sync.json');
const GOOGLE_EVENTS_FILE = path.join(DATA_DIR, 'google_events_sync.json');

const PUBLIC_MERCHANT_XML_FILE = path.join(PUBLIC_DIR, 'google-merchant-feed.xml');
const PUBLIC_MERCHANT_JSON_FILE = path.join(PUBLIC_DIR, 'google-merchant-feed.json');
const PUBLIC_STORE_SITEMAP_FILE = path.join(PUBLIC_DIR, 'sitemap-store.xml');
const PUBLIC_EVENTS_FEED_JSON_FILE = path.join(PUBLIC_DIR, 'google-events-feed.json');

export interface GoogleSyncAuditLog {
  id: string;
  target: 'merchant_center' | 'google_events';
  mode: 'single_product_delta' | 'single_event_delta' | 'daily_cron' | 'manual_full_sync';
  merchantCenterId?: string;
  entityId?: string;
  entityTitle?: string;
  itemsSynced: number;
  apiPushStatus: 'pushed_to_google_api' | 'feed_updated_ready_for_fetch' | 'api_error_feed_updated';
  summary: string;
  timestamp: string;
}

export interface GoogleSyncState {
  merchantCenterId: string;
  baseUrl: string;
  merchantCron: {
    schedule: string;
    timezone: string;
    enabled: boolean;
    lastRunAt: string | null;
    nextRunAt: string;
    lastRunStatus: string;
    totalRuns: number;
  };
  eventsCron: {
    schedule: string;
    timezone: string;
    enabled: boolean;
    lastRunAt: string | null;
    nextRunAt: string;
    lastRunStatus: string;
    totalRuns: number;
  };
  logs: GoogleSyncAuditLog[];
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function computeNextDailyRunIso(targetHourIst: number, targetMinuteIst: number): string {
  // IST is UTC+5:30 (+330 minutes)
  const nowMs = Date.now();
  const istOffsetMs = 330 * 60 * 1000;
  const nowIst = new Date(nowMs + istOffsetMs);
  const nextIst = new Date(Date.UTC(
    nowIst.getUTCFullYear(),
    nowIst.getUTCMonth(),
    nowIst.getUTCDate(),
    targetHourIst,
    targetMinuteIst,
    0,
    0
  ));
  if (nextIst.getTime() <= nowIst.getTime()) {
    nextIst.setUTCDate(nextIst.getUTCDate() + 1);
  }
  return new Date(nextIst.getTime() - istOffsetMs).toISOString();
}

function getDefaultBaseUrl(): string {
  return (
    process.env.APP_URL ||
    process.env.PUBLIC_APP_URL ||
    'https://app.vernunt.com'
  ).replace(/\/$/, '');
}

function loadSyncState(): GoogleSyncState {
  const defaultState: GoogleSyncState = {
    merchantCenterId: (process.env.GOOGLE_MERCHANT_CENTER_ID || DEFAULT_GOOGLE_MERCHANT_CENTER_ID).trim() || DEFAULT_GOOGLE_MERCHANT_CENTER_ID,
    baseUrl: getDefaultBaseUrl(),
    merchantCron: {
      schedule: '0 2 * * *',
      timezone: 'Asia/Kolkata',
      enabled: true,
      lastRunAt: null,
      nextRunAt: computeNextDailyRunIso(2, 0),
      lastRunStatus: 'Scheduled',
      totalRuns: 0
    },
    eventsCron: {
      schedule: '15 2 * * *',
      timezone: 'Asia/Kolkata',
      enabled: true,
      lastRunAt: null,
      nextRunAt: computeNextDailyRunIso(2, 15),
      lastRunStatus: 'Scheduled',
      totalRuns: 0
    },
    logs: []
  };

  try {
    if (fs.existsSync(SYNC_STATE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SYNC_STATE_FILE, 'utf8'));
      return {
        ...defaultState,
        ...parsed,
        merchantCenterId: parsed.merchantCenterId || DEFAULT_GOOGLE_MERCHANT_CENTER_ID,
        merchantCron: {
          ...defaultState.merchantCron,
          ...(parsed.merchantCron || {})
        },
        eventsCron: {
          ...defaultState.eventsCron,
          ...(parsed.eventsCron || {})
        },
        logs: Array.isArray(parsed.logs) ? parsed.logs.slice(0, 120) : []
      };
    }
  } catch (err) {
    console.warn('[GoogleSync] Read state notice:', err);
  }
  return defaultState;
}

function saveSyncState(state: GoogleSyncState) {
  try {
    ensureDir(DATA_DIR);
    fs.writeFileSync(
      SYNC_STATE_FILE,
      JSON.stringify({ ...state, logs: state.logs.slice(0, 120) }, null, 2),
      'utf8'
    );
  } catch (err) {
    console.warn('[GoogleSync] Save state error:', err);
  }
}

function loadSyncedProducts(): StoreProduct[] {
  try {
    if (fs.existsSync(MERCHANT_PRODUCTS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(MERCHANT_PRODUCTS_FILE, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge any initial catalog items that are missing
        const merged = [...parsed];
        for (const baseProd of INITIAL_STORE_PRODUCTS) {
          if (!merged.some((p: StoreProduct) => p.id === baseProd.id)) {
            merged.push(baseProd);
          }
        }
        return merged;
      }
    }
  } catch (err) {
    console.warn('[GoogleSync] Load synced products notice:', err);
  }
  return [...INITIAL_STORE_PRODUCTS];
}

function saveSyncedProducts(products: StoreProduct[]) {
  try {
    ensureDir(DATA_DIR);
    fs.writeFileSync(MERCHANT_PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
  } catch (err) {
    console.warn('[GoogleSync] Save synced products error:', err);
  }
}

function loadSyncedEvents(): CommunityEvent[] {
  try {
    if (fs.existsSync(GOOGLE_EVENTS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(GOOGLE_EVENTS_FILE, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 0) {
        const merged = [...parsed];
        for (const baseEvt of MOCK_EVENTS) {
          if (!merged.some((e: CommunityEvent) => e.id === baseEvt.id)) {
            merged.push(baseEvt);
          }
        }
        return merged;
      }
    }
  } catch (err) {
    console.warn('[GoogleSync] Load synced events notice:', err);
  }
  return [...MOCK_EVENTS];
}

function saveSyncedEvents(events: CommunityEvent[]) {
  try {
    ensureDir(DATA_DIR);
    fs.writeFileSync(GOOGLE_EVENTS_FILE, JSON.stringify(events, null, 2), 'utf8');
  } catch (err) {
    console.warn('[GoogleSync] Save synced events error:', err);
  }
}

/**
 * Builds the official Google Merchant API / Content API product payload for Merchant Center ID 5909118279
 */
export function buildMerchantApiProductPayload(
  product: StoreProduct,
  merchantCenterId: string,
  baseUrl: string
) {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const offerId = product.sku || product.id;
  const regularVal = Number(product.regularPrice || product.price || 0).toFixed(2);
  const saleVal = product.onSale && product.salePrice && product.salePrice < (product.regularPrice || product.price)
    ? Number(product.salePrice).toFixed(2)
    : undefined;
  const inStock = product.stockStatus === 'instock' && Number(product.stockQuantity ?? 1) > 0;

  return {
    merchantCenterId,
    offerId,
    channel: 'online',
    contentLanguage: 'en',
    targetCountry: 'IN',
    feedLabel: 'IN',
    attributes: {
      title: String(product.name || '').slice(0, 150),
      description: String(product.shortDescription || product.description || product.name || '').slice(0, 4900),
      link: `${cleanBase}/store/${product.slug || product.id}`,
      imageLink: product.featuredImage || `${cleanBase}/vernunt-logo.png`,
      additionalImageLinks: Array.isArray(product.galleryImages)
        ? product.galleryImages.filter(img => img && img !== product.featuredImage).slice(0, 10)
        : [],
      availability: inStock ? 'in_stock' : 'out_of_stock',
      condition: 'new',
      brand: product.brand || 'Vernunt',
      mpn: offerId,
      identifierExists: false,
      googleProductCategory: mapToGoogleProductCategory(product.category),
      productTypes: [product.category || 'Kids Gear'],
      ageGroup: product.ageGroup === '0-12m' ? 'infant' : product.ageGroup === '1-3y' ? 'toddler' : 'kids',
      price: {
        value: regularVal,
        currency: 'INR'
      },
      ...(saleVal
        ? {
            salePrice: {
              value: saleVal,
              currency: 'INR'
            }
          }
        : {}),
      shipping: [
        {
          country: 'IN',
          service: 'Standard Courier Delivery',
          price: { value: '0.00', currency: 'INR' }
        }
      ],
      customLabel0: `GMC-${merchantCenterId}`,
      customLabel1: product.category || 'Kids Gear'
    },
    schemaOrgJsonLd: generateProductJsonLd(product, cleanBase),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Optionally pushes a single product directly to Google Content API for Shopping / Merchant API
 * when GOOGLE_MERCHANT_ACCESS_TOKEN is configured in server environment variables.
 */
async function pushSingleProductToGoogleMerchantApi(
  merchantCenterId: string,
  payload: ReturnType<typeof buildMerchantApiProductPayload>
): Promise<{ status: GoogleSyncAuditLog['apiPushStatus']; detail: string }> {
  const token = (process.env.GOOGLE_MERCHANT_ACCESS_TOKEN || '').trim();
  if (!token) {
    return {
      status: 'feed_updated_ready_for_fetch',
      detail: `Product ${payload.offerId} updated in Merchant Center ${merchantCenterId} XML/JSON feed (set GOOGLE_MERCHANT_ACCESS_TOKEN for instant Content API push).`
    };
  }

  try {
    const endpoint = `https://shoppingcontent.googleapis.com/content/v2.1/${encodeURIComponent(merchantCenterId)}/products`;
    const body = {
      offerId: payload.offerId,
      title: payload.attributes.title,
      description: payload.attributes.description,
      link: payload.attributes.link,
      imageLink: payload.attributes.imageLink,
      additionalImageLinks: payload.attributes.additionalImageLinks,
      contentLanguage: 'en',
      targetCountry: 'IN',
      channel: 'online',
      availability: payload.attributes.availability === 'in_stock' ? 'in stock' : 'out of stock',
      condition: 'new',
      brand: payload.attributes.brand,
      mpn: payload.attributes.mpn,
      googleProductCategory: payload.attributes.googleProductCategory,
      productTypes: payload.attributes.productTypes,
      price: payload.attributes.price,
      ...(payload.attributes.salePrice ? { salePrice: payload.attributes.salePrice } : {})
    };

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (resp.ok) {
      return {
        status: 'pushed_to_google_api',
        detail: `Pushed single product ${payload.offerId} live to Google Merchant Center ${merchantCenterId} via Content API v2.1.`
      };
    }

    const errText = await resp.text().catch(() => resp.statusText);
    return {
      status: 'api_error_feed_updated',
      detail: `Feed updated; Google API responded ${resp.status}: ${errText.slice(0, 180)}`
    };
  } catch (err: any) {
    return {
      status: 'api_error_feed_updated',
      detail: `Feed updated; Google API network notice: ${err?.message || String(err)}`
    };
  }
}

/**
 * Generates and writes Merchant Center XML, JSON, and Store Sitemap files to /public
 */
export function writeMerchantCenterFeedsToDisk(
  products: StoreProduct[],
  merchantCenterId: string,
  baseUrl: string
) {
  ensureDir(PUBLIC_DIR);

  const xml = generateGoogleMerchantXml(products, baseUrl);
  const annotatedXml = xml.replace(
    '<title>Vernunt Store Official Product Feed</title>',
    `<title>Vernunt Store Official Product Feed (Merchant Center ID: ${merchantCenterId})</title>\n    <g:merchant_id>${merchantCenterId}</g:merchant_id>`
  );
  fs.writeFileSync(PUBLIC_MERCHANT_XML_FILE, annotatedXml, 'utf8');

  const jsonFeed = {
    merchantCenterId,
    feedName: 'Vernunt Store Official Product Catalog',
    generatedAt: new Date().toISOString(),
    cronSchedule: '0 2 * * * (Asia/Kolkata)',
    currency: 'INR',
    targetCountry: 'IN',
    contentLanguage: 'en',
    totalProducts: products.length,
    xmlFeedUrl: `${baseUrl}/google-merchant-feed.xml`,
    products: products.map(p => buildMerchantApiProductPayload(p, merchantCenterId, baseUrl))
  };
  fs.writeFileSync(PUBLIC_MERCHANT_JSON_FILE, JSON.stringify(jsonFeed, null, 2), 'utf8');

  const sitemapXml = generateStoreSitemapXml(products, baseUrl);
  fs.writeFileSync(PUBLIC_STORE_SITEMAP_FILE, sitemapXml, 'utf8');

  return { annotatedXml, jsonFeed };
}

/**
 * Builds & writes the Google Events Ticketing Partner Program JSON Feed
 * conforming to https://developers.google.com/search/docs/appearance/structured-data/event
 */
export function buildGoogleEventsTicketingFeed(events: CommunityEvent[], baseUrl: string) {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const nowIso = new Date().toISOString();

  const items = events.map(evt => {
    const { startDate, endDate } = resolveEventIsoDates(evt);
    const ticketing = computeEventRealTimeTicketing(evt, cleanBase);
    const jsonLd = generateEventJsonLd(evt, cleanBase);

    return {
      eventId: evt.id,
      name: evt.title,
      description: evt.description || evt.title,
      category: evt.category || 'Kids & Family Event',
      subCategory: evt.itemCategoryType || 'event',
      ageGroup: evt.ageGroup || 'All Ages',
      startDate,
      endDate,
      timezone: 'Asia/Kolkata',
      eventStatus: jsonLd.eventStatus,
      eventAttendanceMode: jsonLd.eventAttendanceMode,
      image: jsonLd.image,
      location: jsonLd.location,
      organizer: jsonLd.organizer,
      performer: jsonLd.performer,
      realTimeTicketing: {
        partnerId: 'vernunt-events-in',
        currency: ticketing.currency,
        isFree: ticketing.isFree,
        minPrice: ticketing.minPrice,
        maxPrice: ticketing.maxPrice,
        totalCapacity: ticketing.totalCapacity,
        bookedCount: ticketing.bookedCount,
        availableTickets: ticketing.availableTickets,
        availabilityStatus: ticketing.availabilityStatus,
        schemaAvailability: ticketing.schemaAvailability,
        eventPageUrl: ticketing.eventPageUrl,
        directCheckoutUrl: ticketing.directCheckoutUrl,
        lastPriceSyncAt: nowIso,
        ticketTiers: ticketing.ticketTiers
      },
      structuredDataJsonLd: jsonLd
    };
  });

  return {
    feedVersion: '1.0',
    program: 'Google Events Ticketing Partner Program & Event Rich Results Feed',
    specReference: 'https://developers.google.com/search/docs/appearance/structured-data/event',
    partnerName: 'Vernunt Ventures Pvt. Ltd.',
    partnerDomain: cleanBase,
    generatedAt: nowIso,
    cronSchedule: '15 2 * * * (Asia/Kolkata)',
    currency: 'INR',
    totalEvents: items.length,
    inStockEvents: items.filter(i => i.realTimeTicketing.availabilityStatus !== 'SoldOut').length,
    feedUrl: `${cleanBase}/google-events-feed.json`,
    events: items
  };
}

export function writeGoogleEventsFeedToDisk(events: CommunityEvent[], baseUrl: string) {
  ensureDir(PUBLIC_DIR);
  const feed = buildGoogleEventsTicketingFeed(events, baseUrl);
  fs.writeFileSync(PUBLIC_EVENTS_FEED_JSON_FILE, JSON.stringify(feed, null, 2), 'utf8');
  return feed;
}

/**
 * Registers all Google Merchant Center (5909118279) & Google Events Ticketing routes + Daily Cron Scheduler
 */
export function registerGoogleSyncRoutes(app: Express) {
  const state = loadSyncState();
  let syncedProducts = loadSyncedProducts();
  let syncedEvents = loadSyncedEvents();

  // Ensure feeds exist on disk immediately at server startup
  try {
    writeMerchantCenterFeedsToDisk(syncedProducts, state.merchantCenterId, state.baseUrl);
    writeGoogleEventsFeedToDisk(syncedEvents, state.baseUrl);
  } catch (initErr) {
    console.warn('[GoogleSync] Initial feed bootstrap notice:', initErr);
  }

  const recordLog = (entry: Omit<GoogleSyncAuditLog, 'id' | 'timestamp'>) => {
    const fullEntry: GoogleSyncAuditLog = {
      ...entry,
      id: `gsync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    state.logs.unshift(fullEntry);
    if (state.logs.length > 120) state.logs.length = 120;
    saveSyncState(state);
    return fullEntry;
  };

  const runMerchantDailyCron = async (mode: 'daily_cron' | 'manual_full_sync' = 'daily_cron') => {
    const nowIso = new Date().toISOString();
    writeMerchantCenterFeedsToDisk(syncedProducts, state.merchantCenterId, state.baseUrl);

    let pushedCount = 0;
    const hasToken = Boolean((process.env.GOOGLE_MERCHANT_ACCESS_TOKEN || '').trim());
    if (hasToken) {
      for (const prod of syncedProducts) {
        const payload = buildMerchantApiProductPayload(prod, state.merchantCenterId, state.baseUrl);
        const res = await pushSingleProductToGoogleMerchantApi(state.merchantCenterId, payload);
        if (res.status === 'pushed_to_google_api') pushedCount += 1;
      }
    }

    state.merchantCron.lastRunAt = nowIso;
    state.merchantCron.nextRunAt = computeNextDailyRunIso(2, 0);
    state.merchantCron.totalRuns += 1;
    state.merchantCron.lastRunStatus = hasToken
      ? `Synced ${pushedCount}/${syncedProducts.length} products via Google Content API + Feed XML/JSON`
      : `Regenerated Merchant Center ${state.merchantCenterId} XML/JSON feed (${syncedProducts.length} products)`;

    const log = recordLog({
      target: 'merchant_center',
      mode,
      merchantCenterId: state.merchantCenterId,
      itemsSynced: syncedProducts.length,
      apiPushStatus: hasToken ? 'pushed_to_google_api' : 'feed_updated_ready_for_fetch',
      summary: state.merchantCron.lastRunStatus
    });

    console.log(`[GoogleSync Cron] Merchant Center (${state.merchantCenterId}) ${mode} completed: ${syncedProducts.length} products.`);
    return { log, totalProducts: syncedProducts.length };
  };

  const runEventsDailyCron = async (mode: 'daily_cron' | 'manual_full_sync' = 'daily_cron') => {
    const nowIso = new Date().toISOString();
    const feed = writeGoogleEventsFeedToDisk(syncedEvents, state.baseUrl);

    state.eventsCron.lastRunAt = nowIso;
    state.eventsCron.nextRunAt = computeNextDailyRunIso(2, 15);
    state.eventsCron.totalRuns += 1;
    state.eventsCron.lastRunStatus = `Updated google-events-feed.json (${feed.totalEvents} events, ${feed.inStockEvents} in stock)`;

    const log = recordLog({
      target: 'google_events',
      mode,
      itemsSynced: feed.totalEvents,
      apiPushStatus: 'feed_updated_ready_for_fetch',
      summary: state.eventsCron.lastRunStatus
    });

    console.log(`[GoogleSync Cron] Google Events Ticketing Feed ${mode} completed: ${feed.totalEvents} events.`);
    return { log, totalEvents: feed.totalEvents, feed };
  };

  // =========================================================================
  // REAL SERVER DAILY CRON SCHEDULER (checks every 60s against nextRunAt)
  // =========================================================================
  const cronTicker = setInterval(() => {
    const nowMs = Date.now();
    if (state.merchantCron.enabled && nowMs >= Date.parse(state.merchantCron.nextRunAt)) {
      runMerchantDailyCron('daily_cron').catch(err =>
        console.warn('[GoogleSync] Merchant daily cron error:', err)
      );
    }
    if (state.eventsCron.enabled && nowMs >= Date.parse(state.eventsCron.nextRunAt)) {
      runEventsDailyCron('daily_cron').catch(err =>
        console.warn('[GoogleSync] Events daily cron error:', err)
      );
    }
  }, 60 * 1000);
  if (typeof cronTicker.unref === 'function') {
    cronTicker.unref();
  }

  // =========================================================================
  // 1. LIVE GOOGLE MERCHANT CENTER FEEDS (LINKED TO ID 5909118279)
  // =========================================================================
  app.get(['/google-merchant-feed.xml', '/google-shopping-feed.xml', '/api/google-merchant-feed'], (_req: Request, res: Response) => {
    try {
      const { annotatedXml } = writeMerchantCenterFeedsToDisk(syncedProducts, state.merchantCenterId, state.baseUrl);
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('X-Google-Merchant-Center-Id', state.merchantCenterId);
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.status(200).send(annotatedXml);
    } catch (err: any) {
      return res.status(500).send(`<error>${err?.message || 'Merchant feed error'}</error>`);
    }
  });

  app.get(['/google-merchant-feed.json', '/api/google/merchant/feed.json'], (_req: Request, res: Response) => {
    try {
      const { jsonFeed } = writeMerchantCenterFeedsToDisk(syncedProducts, state.merchantCenterId, state.baseUrl);
      res.setHeader('X-Google-Merchant-Center-Id', state.merchantCenterId);
      return res.json(jsonFeed);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // =========================================================================
  // 2. SINGLE-PRODUCT REAL-TIME DELTA SYNC TO MERCHANT CENTER 5909118279
  // Triggered whenever ONE product is published or updated — syncs ONLY that product
  // =========================================================================
  app.post('/api/google/merchant/sync-product', async (req: Request, res: Response) => {
    try {
      const { product, action = 'update', merchantCenterId } = req.body || {};
      if (!product || !product.id || !product.name) {
        return res.status(400).json({ success: false, error: 'Valid product object (id, name) is required.' });
      }

      const activeMerchantId = String(merchantCenterId || state.merchantCenterId || DEFAULT_GOOGLE_MERCHANT_CENTER_ID).trim();
      if (activeMerchantId && activeMerchantId !== state.merchantCenterId) {
        state.merchantCenterId = activeMerchantId;
      }

      // Upsert ONLY this single product in the catalog store
      const idx = syncedProducts.findIndex(p => p.id === product.id);
      if (idx >= 0) {
        syncedProducts[idx] = { ...syncedProducts[idx], ...product };
      } else {
        syncedProducts.unshift(product);
      }
      saveSyncedProducts(syncedProducts);

      // Refresh hosted XML/JSON feeds so Google Merchant Center sees the updated product immediately
      writeMerchantCenterFeedsToDisk(syncedProducts, state.merchantCenterId, state.baseUrl);

      // Build and optionally push ONLY this single product to Google Content API v2.1
      const singlePayload = buildMerchantApiProductPayload(product, state.merchantCenterId, state.baseUrl);
      const apiResult = await pushSingleProductToGoogleMerchantApi(state.merchantCenterId, singlePayload);

      const log = recordLog({
        target: 'merchant_center',
        mode: 'single_product_delta',
        merchantCenterId: state.merchantCenterId,
        entityId: product.id,
        entityTitle: product.name,
        itemsSynced: 1,
        apiPushStatus: apiResult.status,
        summary: `[${String(action).toUpperCase()}] ${product.name} (${singlePayload.offerId}) → GMC ${state.merchantCenterId}: ${apiResult.detail}`
      });

      return res.json({
        success: true,
        merchantCenterId: state.merchantCenterId,
        syncedProductId: product.id,
        offerId: singlePayload.offerId,
        apiPushStatus: apiResult.status,
        message: apiResult.detail,
        payload: singlePayload,
        log
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // =========================================================================
  // 3. MERCHANT CENTER DAILY CRON ENDPOINTS & CONFIG
  // =========================================================================
  app.post(['/api/google/merchant/cron-run', '/api/cron/merchant-daily'], async (req: Request, res: Response) => {
    try {
      const { products, merchantCenterId } = req.body || {};
      if (merchantCenterId) {
        state.merchantCenterId = String(merchantCenterId).trim() || DEFAULT_GOOGLE_MERCHANT_CENTER_ID;
      }
      if (Array.isArray(products) && products.length > 0) {
        syncedProducts = products;
        saveSyncedProducts(syncedProducts);
      }
      const mode = req.path.includes('/api/cron/') ? 'daily_cron' : 'manual_full_sync';
      const result = await runMerchantDailyCron(mode);
      return res.json({
        success: true,
        merchantCenterId: state.merchantCenterId,
        ...result,
        cron: state.merchantCron
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post('/api/google/merchant/config', (req: Request, res: Response) => {
    const { merchantCenterId, cronEnabled } = req.body || {};
    if (merchantCenterId && typeof merchantCenterId === 'string') {
      state.merchantCenterId = merchantCenterId.trim() || DEFAULT_GOOGLE_MERCHANT_CENTER_ID;
    }
    if (typeof cronEnabled === 'boolean') {
      state.merchantCron.enabled = cronEnabled;
    }
    saveSyncState(state);
    writeMerchantCenterFeedsToDisk(syncedProducts, state.merchantCenterId, state.baseUrl);
    return res.json({
      success: true,
      merchantCenterId: state.merchantCenterId,
      merchantCron: state.merchantCron
    });
  });

  // =========================================================================
  // 4. GOOGLE EVENTS TICKETING PARTNER PROGRAM JSON FEED & DAILY CRON
  // =========================================================================
  app.get(['/google-events-feed.json', '/api/google/events-ticketing-feed.json'], (_req: Request, res: Response) => {
    try {
      const feed = writeGoogleEventsFeedToDisk(syncedEvents, state.baseUrl);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.status(200).json(feed);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.get('/api/google/events/:eventId/jsonld', (req: Request, res: Response) => {
    const evt = syncedEvents.find(e => e.id === req.params.eventId);
    if (!evt) {
      return res.status(404).json({ success: false, error: 'Event not found in feed.' });
    }
    return res.json({
      success: true,
      eventId: evt.id,
      eventUrl: getEventDirectUrl(evt, state.baseUrl),
      directCheckoutUrl: getEventDirectCheckoutUrl(evt, state.baseUrl),
      realTimeTicketing: computeEventRealTimeTicketing(evt, state.baseUrl),
      jsonLd: generateEventJsonLd(evt, state.baseUrl)
    });
  });

  app.post('/api/google/events/sync-event', (req: Request, res: Response) => {
    try {
      const { event, action = 'update' } = req.body || {};
      if (!event || !event.id || !event.title) {
        return res.status(400).json({ success: false, error: 'Valid event object (id, title) is required.' });
      }
      const idx = syncedEvents.findIndex(e => e.id === event.id);
      if (idx >= 0) {
        syncedEvents[idx] = { ...syncedEvents[idx], ...event };
      } else {
        syncedEvents.unshift(event);
      }
      saveSyncedEvents(syncedEvents);
      const feed = writeGoogleEventsFeedToDisk(syncedEvents, state.baseUrl);

      const log = recordLog({
        target: 'google_events',
        mode: 'single_event_delta',
        entityId: event.id,
        entityTitle: event.title,
        itemsSynced: 1,
        apiPushStatus: 'feed_updated_ready_for_fetch',
        summary: `[${String(action).toUpperCase()}] Event "${event.title}" updated in google-events-feed.json & Schema.org JSON-LD (${feed.totalEvents} total events).`
      });

      return res.json({
        success: true,
        eventId: event.id,
        totalEvents: feed.totalEvents,
        jsonLd: generateEventJsonLd(syncedEvents[idx >= 0 ? idx : 0], state.baseUrl),
        log
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post(['/api/google/events/cron-run', '/api/cron/events-daily'], async (req: Request, res: Response) => {
    try {
      const { events } = req.body || {};
      if (Array.isArray(events) && events.length > 0) {
        syncedEvents = events;
        saveSyncedEvents(syncedEvents);
      }
      const mode = req.path.includes('/api/cron/') ? 'daily_cron' : 'manual_full_sync';
      const result = await runEventsDailyCron(mode);
      return res.json({
        success: true,
        totalEvents: result.totalEvents,
        log: result.log,
        cron: state.eventsCron,
        feedUrl: `${state.baseUrl}/google-events-feed.json`
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // =========================================================================
  // 5. UNIFIED GOOGLE SYNC STATUS & AUDIT LOGS (ADMIN DASHBOARD)
  // =========================================================================
  app.get('/api/google/sync/status', (_req: Request, res: Response) => {
    const eventsFeed = buildGoogleEventsTicketingFeed(syncedEvents, state.baseUrl);
    return res.json({
      success: true,
      merchantCenterId: state.merchantCenterId,
      baseUrl: state.baseUrl,
      googleMerchantApiTokenConfigured: Boolean((process.env.GOOGLE_MERCHANT_ACCESS_TOKEN || '').trim()),
      productsCount: syncedProducts.length,
      eventsCount: syncedEvents.length,
      feeds: {
        merchantXmlUrl: `${state.baseUrl}/google-merchant-feed.xml`,
        merchantJsonUrl: `${state.baseUrl}/google-merchant-feed.json`,
        storeSitemapUrl: `${state.baseUrl}/sitemap-store.xml`,
        eventsTicketingJsonUrl: `${state.baseUrl}/google-events-feed.json`
      },
      merchantCron: state.merchantCron,
      eventsCron: state.eventsCron,
      eventsPreview: eventsFeed.events,
      logs: state.logs.slice(0, 60)
    });
  });

  console.log(`[GoogleSync] Merchant Center (${state.merchantCenterId}) & Google Events Ticketing Partner Feed + Daily Cron Scheduler active.`);
}
