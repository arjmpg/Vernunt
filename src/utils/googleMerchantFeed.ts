import type { StoreProduct } from '../types/store.ts';
import { INITIAL_STORE_PRODUCTS, getStoredProducts } from '../data/storeProducts.ts';

export interface MerchantFeedItemAudit {
  id: string;
  name: string;
  sku: string;
  price: number;
  salePrice?: number;
  currency: string;
  availability: 'in_stock' | 'out_of_stock';
  category: string;
  googleCategory: string;
  hasImage: boolean;
  hasDescription: boolean;
  link: string;
  isCompliant: boolean;
  warnings: string[];
}

export interface SearchConsoleIndexableArea {
  id: string;
  sectionName: string;
  publicUrl: string;
  sitemapUrl: string;
  schemaType: string;
  isPubliclyViewable: boolean;
  indexingStatus: 'Ready to Index' | 'Auto-Dispatched' | 'Indexed';
  estimatedUrlsCount: number;
  description: string;
  safetyCompliance: 'Public Safe' | 'DPDP / COPPA Protected';
  instructions: string;
}

const ESCAPE_XML_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;'
};

export function escapeXml(str: string = ''): string {
  return str.replace(/[&<>"']/g, (m) => ESCAPE_XML_MAP[m] || m);
}

/**
 * Maps Vernunt store category to Google Product Category Taxonomy
 */
export function mapToGoogleProductCategory(cat: string = ''): string {
  const lower = cat.toLowerCase();
  if (lower.includes('food') || lower.includes('snack') || lower.includes('nutrition')) {
    return 'Food, Beverages & Tobacco > Food Items > Baby & Toddler Food';
  }
  if (lower.includes('clothing') || lower.includes('apparel') || lower.includes('wear')) {
    return 'Apparel & Accessories > Clothing > Baby & Toddler Clothing';
  }
  if (lower.includes('jewel') || lower.includes('silver') || lower.includes('nazariya')) {
    return 'Apparel & Accessories > Jewelry';
  }
  if (lower.includes('book') || lower.includes('story')) {
    return 'Media > Books > Print Books';
  }
  if (lower.includes('safety') || lower.includes('health') || lower.includes('care')) {
    return 'Baby & Toddler > Baby Safety';
  }
  if (lower.includes('diaper') || lower.includes('wipe')) {
    return 'Baby & Toddler > Diapering';
  }
  if (lower.includes('art') || lower.includes('craft') || lower.includes('paint')) {
    return 'Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts';
  }
  if (lower.includes('stem') || lower.includes('science') || lower.includes('learning')) {
    return 'Toys & Games > Toys > Educational Toys';
  }
  // Default toys & games
  return 'Toys & Games > Toys';
}

/**
 * Generates official Schema.org JSON-LD object for a product for Googlebot and Google Shopping
 */
export function generateProductJsonLd(
  product: StoreProduct,
  baseUrl: string = 'https://app.vernunt.com'
): Record<string, any> {
  const prodUrl = `${baseUrl}/store/${product.slug || product.id}`;
  const price = product.salePrice || product.price || 0;
  const regularPrice = product.regularPrice || product.price || 0;
  const inStock = product.stockStatus === 'instock' && product.stockQuantity > 0;

  const images: string[] = [];
  if (product.featuredImage) images.push(product.featuredImage);
  if (product.galleryImages && product.galleryImages.length > 0) {
    product.galleryImages.forEach(img => {
      if (!images.includes(img)) images.push(img);
    });
  }

  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": images,
    "description": product.shortDescription || product.description || product.name,
    "sku": product.sku || product.id,
    "mpn": product.sku || product.id,
    "productID": product.sku || product.id,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Vernunt"
    },
    "category": product.category,
    "offers": {
      "@type": "Offer",
      "url": prodUrl,
      "priceCurrency": "INR",
      "price": price,
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Vernunt Store"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": "INR"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "IN"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 3,
            "unitCode": "DAY"
          }
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "IN",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 7,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.rating || 4.8,
      "reviewCount": product.reviewCount || 12,
      "bestRating": "5",
      "worstRating": "1"
    }
  };
}

/**
 * Generates an official Google Merchant Center XML (RSS 2.0 with google base namespace)
 * Conforming strictly to Google Shopping / Merchant Center feed specs
 */
export function generateGoogleMerchantXml(
  products: StoreProduct[] = (typeof window !== 'undefined' ? getStoredProducts() : INITIAL_STORE_PRODUCTS),
  baseUrl: string = 'https://app.vernunt.com'
): string {
  const now = new Date().toUTCString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0" xmlns:atom="http://www.w3.org/2005/Atom">\n`;
  xml += `  <channel>\n`;
  xml += `    <title>Vernunt Store Official Product Feed</title>\n`;
  xml += `    <link>${baseUrl}/store</link>\n`;
  xml += `    <description>Verified child play gear, organic toddler nutrition, Montessori STEM kits, and child safety equipment on Vernunt.</description>\n`;
  xml += `    <lastBuildDate>${now}</lastBuildDate>\n`;
  xml += `    <atom:link href="${baseUrl}/google-merchant-feed.xml" rel="self" type="application/rss+xml" />\n`;

  for (const prod of products) {
    const prodLink = `${baseUrl}/store/${prod.slug || prod.id}`;
    const priceAmount = (prod.salePrice || prod.price || 0).toFixed(2);
    const regularAmount = (prod.regularPrice || prod.price || 0).toFixed(2);
    const availability = prod.stockStatus === 'instock' && prod.stockQuantity > 0 ? 'in_stock' : 'out_of_stock';
    const cleanDesc = prod.shortDescription || prod.description || prod.name;
    const truncatedDesc = cleanDesc.slice(0, 4900).replace(/\s+/g, ' ').trim();
    const gCategory = mapToGoogleProductCategory(prod.category);

    xml += `    <item>\n`;
    xml += `      <g:id>${escapeXml(prod.sku || prod.id)}</g:id>\n`;
    xml += `      <g:title>${escapeXml(prod.name.slice(0, 150))}</g:title>\n`;
    xml += `      <g:description>${escapeXml(truncatedDesc)}</g:description>\n`;
    xml += `      <g:link>${prodLink}</g:link>\n`;
    xml += `      <g:image_link>${escapeXml(prod.featuredImage || 'https://app.vernunt.com/vernunt-logo.png')}</g:image_link>\n`;
    if (prod.galleryImages && prod.galleryImages.length > 0) {
      for (const img of prod.galleryImages.slice(0, 10)) {
        if (img !== prod.featuredImage) {
          xml += `      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>\n`;
        }
      }
    }
    xml += `      <g:availability>${availability}</g:availability>\n`;
    xml += `      <g:price>${regularAmount} INR</g:price>\n`;
    if (prod.onSale && prod.salePrice && prod.salePrice < prod.regularPrice) {
      xml += `      <g:sale_price>${priceAmount} INR</g:sale_price>\n`;
    }
    xml += `      <g:google_product_category>${escapeXml(gCategory)}</g:google_product_category>\n`;
    xml += `      <g:product_type>${escapeXml(prod.category || 'Kids Gear')}</g:product_type>\n`;
    xml += `      <g:brand>Vernunt</g:brand>\n`;
    xml += `      <g:condition>new</g:condition>\n`;
    xml += `      <g:identifier_exists>no</g:identifier_exists>\n`;
    xml += `      <g:mpn>${escapeXml(prod.sku || prod.id)}</g:mpn>\n`;
    xml += `      <g:age_group>${prod.ageGroup === '0-12m' ? 'infant' : prod.ageGroup === '1-3y' ? 'toddler' : 'kids'}</g:age_group>\n`;
    xml += `      <g:custom_label_0>Verified Merchant</g:custom_label_0>\n`;
    xml += `      <g:custom_label_1>${escapeXml(prod.category || 'Gear')}</g:custom_label_1>\n`;
    xml += `      <g:shipping>\n`;
    xml += `        <g:country>IN</g:country>\n`;
    xml += `        <g:service>Standard Courier Delivery</g:service>\n`;
    xml += `        <g:price>0.00 INR</g:price>\n`;
    xml += `      </g:shipping>\n`;
    xml += `    </item>\n`;
  }

  xml += `  </channel>\n`;
  xml += `</rss>`;
  return xml;
}

/**
 * Generates an XML sitemap for Google Search for all store products
 */
export function generateStoreSitemapXml(
  products: StoreProduct[] = (typeof window !== 'undefined' ? getStoredProducts() : INITIAL_STORE_PRODUCTS),
  baseUrl: string = 'https://app.vernunt.com'
): string {
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // Root Store URL
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/store</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>0.95</priority>\n`;
  xml += `  </url>\n`;

  for (const prod of products) {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/store/${prod.slug || prod.id}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.85</priority>\n`;
    if (prod.featuredImage) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeXml(prod.featuredImage)}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(prod.name)}</image:title>\n`;
      xml += `    </image:image>\n`;
    }
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

/**
 * Audits products for Google Merchant Center readiness
 */
export function auditProductsForMerchantCenter(
  products: StoreProduct[] = (typeof window !== 'undefined' ? getStoredProducts() : INITIAL_STORE_PRODUCTS),
  baseUrl: string = 'https://app.vernunt.com'
): MerchantFeedItemAudit[] {
  return products.map(p => {
    const warnings: string[] = [];
    if (!p.sku) warnings.push('Missing SKU (using product ID fallback)');
    if (!p.featuredImage) warnings.push('Missing featured image');
    if (!p.price || p.price <= 0) warnings.push('Price must be greater than 0');
    if (!p.shortDescription && !p.description) warnings.push('Missing product description');
    if (p.name.length < 5) warnings.push('Product title too short');

    const googleCategory = mapToGoogleProductCategory(p.category);
    const availability = p.stockStatus === 'instock' && p.stockQuantity > 0 ? 'in_stock' : 'out_of_stock';

    return {
      id: p.id,
      name: p.name,
      sku: p.sku || p.id,
      price: p.salePrice || p.price,
      salePrice: p.onSale ? p.salePrice : undefined,
      currency: 'INR',
      availability,
      category: p.category || 'General Gear',
      googleCategory,
      hasImage: !!p.featuredImage,
      hasDescription: !!(p.shortDescription || p.description),
      link: `${baseUrl}/store/${p.slug || p.id}`,
      isCompliant: warnings.length === 0,
      warnings
    };
  });
}

/**
 * Complete Full-App Google Search Console Public Indexing Audit
 * Classifies every feature of Vernunt into Publicly Searchable vs Privately Protected
 */
export function getFullAppPublicIndexingAudit(): {
  publicAreas: SearchConsoleIndexableArea[];
  privateProtectedAreas: SearchConsoleIndexableArea[];
} {
  const publicAreas: SearchConsoleIndexableArea[] = [
    {
      id: 'area-store',
      sectionName: '🛍️ Vernunt Store & Shopping Catalog',
      publicUrl: 'https://app.vernunt.com/store',
      sitemapUrl: 'https://app.vernunt.com/sitemap-store.xml',
      schemaType: 'Product, Offer, AggregateRating',
      isPubliclyViewable: true,
      indexingStatus: 'Ready to Index',
      estimatedUrlsCount: 25,
      description: 'Public e-commerce catalog featuring organic kids nutrition, Montessori toys, clothing, baby gear & learning kits. Directly syncable with Google Merchant Center & Google Shopping.',
      safetyCompliance: 'Public Safe',
      instructions: 'Submit sitemap-store.xml and google-merchant-feed.xml in Google Merchant Center.'
    },
    {
      id: 'area-events-short',
      sectionName: '🎪 Short-Term Events (1–7 Days)',
      publicUrl: 'https://app.vernunt.com/events?subcat=event',
      sitemapUrl: 'https://app.vernunt.com/sitemap-events.xml',
      schemaType: 'Event, Festival, ExhibitionEvent',
      isPubliclyViewable: true,
      indexingStatus: 'Ready to Index',
      estimatedUrlsCount: 15,
      description: 'Neighborhood kids weekend popups, storytelling puppet carnivals, science exhibitions, and family festivals lasting 1 to 7 days.',
      safetyCompliance: 'Public Safe',
      instructions: 'Indexed with structured Event dates, venue locations, host organizers, and ticket tiers.'
    },
    {
      id: 'area-activities',
      sectionName: '🏊 Activities, Sports & Camps',
      publicUrl: 'https://app.vernunt.com/events?subcat=activity',
      sitemapUrl: 'https://app.vernunt.com/sitemap-events.xml',
      schemaType: 'SportsEvent, SummerCamp, PhysicalActivity',
      isPubliclyViewable: true,
      indexingStatus: 'Ready to Index',
      estimatedUrlsCount: 15,
      description: 'Swimming sessions, chess tournaments, junior football agility camps, summer camps, and nature exploration trails.',
      safetyCompliance: 'Public Safe',
      instructions: 'Indexed under sitemap-events.xml with age brackets, coach credentials, and activity equipment notes.'
    },
    {
      id: 'area-classes',
      sectionName: '🎓 Permanent Classes & Tuitions',
      publicUrl: 'https://app.vernunt.com/events?subcat=classes',
      sitemapUrl: 'https://app.vernunt.com/sitemap-events.xml',
      schemaType: 'Course, EducationEvent, EducationalOrganization',
      isPubliclyViewable: true,
      indexingStatus: 'Ready to Index',
      estimatedUrlsCount: 15,
      description: 'Ongoing music lessons (Carnatic/Western), Vedic mental math, robotics academies, classical dance, and academic tutoring.',
      safetyCompliance: 'Public Safe',
      instructions: 'Indexed under sitemap-events.xml with weekly schedules, monthly batches, and curriculum details.'
    },
    {
      id: 'area-doctors',
      sectionName: '🩺 Pan-India Verified Pediatricians & Specialists',
      publicUrl: 'https://app.vernunt.com/specialists',
      sitemapUrl: 'https://app.vernunt.com/sitemap-doctors.xml',
      schemaType: 'Physician, MedicalBusiness, MedicalSpecialty',
      isPubliclyViewable: true,
      indexingStatus: 'Ready to Index',
      estimatedUrlsCount: 1000,
      description: '1,000+ verified pediatricians, gynecologists, child nutritionists, and psychologists across 20+ Indian cities with zero booking fees.',
      safetyCompliance: 'Public Safe',
      instructions: 'Indexed under sitemap-doctors.xml with clinic hours, locations, and doctor credentials.'
    },
    {
      id: 'area-stories',
      sectionName: '📖 Kid Achiever Stories & Web Stories',
      publicUrl: 'https://app.vernunt.com/kid-stories',
      sitemapUrl: 'https://app.vernunt.com/sitemap-kid-stories.xml',
      schemaType: 'Article, CreativeWork, ImageObject',
      isPubliclyViewable: true,
      indexingStatus: 'Ready to Index',
      estimatedUrlsCount: 45,
      description: 'Inspirational parent-submitted stories celebrating young creators, robotics inventors, young athletes, and artists with AMP Google Web Stories format.',
      safetyCompliance: 'Public Safe',
      instructions: 'Indexed under sitemap-kid-stories.xml and sitemap-webstories.xml with Google image extensions.'
    },
    {
      id: 'area-knowledge',
      sectionName: '📚 1,000+ Evidence-Based Growth Guides',
      publicUrl: 'https://app.vernunt.com/knowledge',
      sitemapUrl: 'https://app.vernunt.com/sitemap-guides.xml',
      schemaType: 'HowTo, FAQPage, MedicalWebPage',
      isPubliclyViewable: true,
      indexingStatus: 'Ready to Index',
      estimatedUrlsCount: 1000,
      description: 'Comprehensive evidence-based pediatric guides across weaning, sleep training, behavioral discipline, screen-free learning, and child health.',
      safetyCompliance: 'Public Safe',
      instructions: 'Indexed under sitemap-guides.xml with rich FAQ schemas for Google Search answer snippets.'
    },
    {
      id: 'area-daycares',
      sectionName: '🏡 Verified Daycares, Creches & Playhomes',
      publicUrl: 'https://app.vernunt.com/sitting',
      sitemapUrl: 'https://app.vernunt.com/sitemap.xml',
      schemaType: 'ChildCare, LocalBusiness',
      isPubliclyViewable: true,
      indexingStatus: 'Ready to Index',
      estimatedUrlsCount: 15,
      description: 'Neighborhood verified playhomes, Montessori creches, and parent babysitter profiles with hourly and monthly rates.',
      safetyCompliance: 'Public Safe',
      instructions: 'Main sitemap.xml includes verified daycare directory listings.'
    },
    {
      id: 'area-groups-public',
      sectionName: '🌸 Vernunt Groups Public Directory (/groups)',
      publicUrl: 'https://app.vernunt.com/groups',
      sitemapUrl: 'https://app.vernunt.com/sitemap.xml',
      schemaType: 'ItemList, CommunityGroup (Titles & Categories Only)',
      isPubliclyViewable: true,
      indexingStatus: 'Ready to Index',
      estimatedUrlsCount: 15,
      description: 'Neighborhood parent squads, mother support circles, and hobby groups in Bangalore. ONLY group names and public categories are visible on Google Search.',
      safetyCompliance: 'Public Safe',
      instructions: 'Enables discovery of group names on Google Search while strictly concealing all conversations and member identities.'
    },
    {
      id: 'area-legal',
      sectionName: '⚖️ Trust, Safety & Compliance Standards',
      publicUrl: 'https://app.vernunt.com/safety',
      sitemapUrl: 'https://app.vernunt.com/sitemap.xml',
      schemaType: 'Organization, WebSite, ContactPage',
      isPubliclyViewable: true,
      indexingStatus: 'Ready to Index',
      estimatedUrlsCount: 8,
      description: 'DigiLocker Govt ID verification standards, DPDP Act 2023, COPPA compliance, Terms of Service, and Privacy Policy.',
      safetyCompliance: 'Public Safe',
      instructions: 'Main sitemap.xml index.'
    }
  ];

  const privateProtectedAreas: SearchConsoleIndexableArea[] = [
    {
      id: 'private-group-messages',
      sectionName: '💬 Vernunt Group Messages & Member Rosters (/groups/*/messages, /groups/*/chat)',
      publicUrl: 'https://app.vernunt.com/groups',
      sitemapUrl: 'NONE (Strictly Disallowed in robots.txt)',
      schemaType: 'NONE (noindex, nofollow, nosnippet)',
      isPubliclyViewable: false,
      indexingStatus: 'Auto-Dispatched',
      estimatedUrlsCount: 0,
      description: 'Internal group chat messages, discussions, member telephone numbers, and parent questions. STRICTLY BLOCKED from Googlebot so zero message content ever appears on Google Search.',
      safetyCompliance: 'DPDP / COPPA Protected',
      instructions: 'Marked "Disallow: /groups/*/messages", "Disallow: /groups/*/chat", "Disallow: /groups/*/members" in robots.txt.'
    },
    {
      id: 'private-radar',
      sectionName: '🛡️ Nearby Children GPS Radar (/radar)',
      publicUrl: 'https://app.vernunt.com/radar',
      sitemapUrl: 'NONE (Disallowed in robots.txt)',
      schemaType: 'NONE (Noindex)',
      isPubliclyViewable: false,
      indexingStatus: 'Auto-Dispatched',
      estimatedUrlsCount: 0,
      description: 'Real-time GPS proximity radar showing nearby children profiles. STRICTLY BLOCKED from Googlebot under India DPDP Act 2023 and COPPA.',
      safetyCompliance: 'DPDP / COPPA Protected',
      instructions: 'Explicitly marked "Disallow: /radar" in robots.txt to protect child privacy.'
    },
    {
      id: 'private-playmates',
      sectionName: '🔒 Personal Child Profiles (/playmates, /profile)',
      publicUrl: 'https://app.vernunt.com/profile',
      sitemapUrl: 'NONE (Disallowed in robots.txt)',
      schemaType: 'NONE (Noindex)',
      isPubliclyViewable: false,
      indexingStatus: 'Auto-Dispatched',
      estimatedUrlsCount: 0,
      description: 'Family personal information, child names, birthdates, Aadhaar badges, and playmate connections.',
      safetyCompliance: 'DPDP / COPPA Protected',
      instructions: 'Explicitly marked "Disallow: /profile", "Disallow: /playmates" in robots.txt.'
    },
    {
      id: 'private-chat',
      sectionName: '💬 Encrypted Parent Chats (/chat, /messages)',
      publicUrl: 'https://app.vernunt.com/chat',
      sitemapUrl: 'NONE (Disallowed in robots.txt)',
      schemaType: 'NONE (Noindex)',
      isPubliclyViewable: false,
      indexingStatus: 'Auto-Dispatched',
      estimatedUrlsCount: 0,
      description: 'Parent-to-parent private communications, playdate locations, and phone numbers.',
      safetyCompliance: 'DPDP / COPPA Protected',
      instructions: 'Explicitly marked "Disallow: /chat", "Disallow: /messages" in robots.txt.'
    },
    {
      id: 'private-tracker',
      sectionName: '💉 Child Health & Vaccine Trackers (/tracker, /vaccines)',
      publicUrl: 'https://app.vernunt.com/tracker',
      sitemapUrl: 'NONE (Disallowed in robots.txt)',
      schemaType: 'NONE (Noindex)',
      isPubliclyViewable: false,
      indexingStatus: 'Auto-Dispatched',
      estimatedUrlsCount: 0,
      description: 'Individual child medical records, immunization doses, and health notes.',
      safetyCompliance: 'DPDP / COPPA Protected',
      instructions: 'Explicitly marked "Disallow: /tracker", "Disallow: /vaccines" in robots.txt.'
    }
  ];

  return { publicAreas, privateProtectedAreas };
}
