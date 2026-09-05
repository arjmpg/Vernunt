// scripts/generate-sitemap.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const today = new Date().toISOString().split('T')[0];
const baseUrl = 'https://app.vernunt.com';

const corePages = [
  { path: '', changefreq: 'daily', priority: '1.0' },
  { path: 'radar', changefreq: 'daily', priority: '0.9' },
  { path: 'events', changefreq: 'daily', priority: '0.9' },
  { path: 'playdates', changefreq: 'daily', priority: '0.9' },
  { path: 'planner', changefreq: 'weekly', priority: '0.8' },
  { path: 'specialists', changefreq: 'daily', priority: '0.8' },
  { path: 'community', changefreq: 'daily', priority: '0.8' },
  { path: 'parenting-copilot', changefreq: 'weekly', priority: '0.8' },
  { path: 'safety-matrix', changefreq: 'monthly', priority: '0.7' },
  { path: 'business-hub', changefreq: 'weekly', priority: '0.7' },
  { path: 'pricing', changefreq: 'monthly', priority: '0.6' },
  { path: 'terms', changefreq: 'monthly', priority: '0.5' },
  { path: 'privacy', changefreq: 'monthly', priority: '0.5' }
];

const categoryPages = [
  'kids-activities',
  'toddler-playgroups',
  'sports-playdates',
  'creative-arts-crafts',
  'lego-building-clubs',
  'music-dance-classes',
  'speech-therapy-consults',
  'child-psychology',
  'pediatric-specialists'
];

const doctorSeoPages = [
  'specialists?q=kids+doctors',
  'specialists?q=kids+doctors+near+me',
  'specialists?q=pediatrician',
  'specialists?q=pediatrician+near+me',
  'specialists?q=gynecologist',
  'specialists?q=best+pediatrician',
  'specialists?q=child+specialist',
  'specialists?q=child+specialist+doctor',
  'specialists?q=baby+doctor',
  'specialists?q=newborn+doctor',
  'specialists?q=newborn+vaccination',
  'specialists?q=pediatric+pulmonologist',
  'specialists?q=child+neurologist',
  'specialists?city=bangalore',
  'specialists?city=delhi-ncr',
  'specialists?city=mumbai',
  'specialists?city=hyderabad',
  'specialists?city=chennai',
  'specialists?city=pune',
  'specialists?city=kolkata',
  'specialists?city=ahmedabad',
  'specialists?city=jaipur',
  'specialists?city=chandigarh',
  'specialists?city=lucknow',
  'specialists?city=kochi',
  'specialists?city=indore',
  'specialists?city=patna',
  'specialists?city=coimbatore',
  'specialists?city=visakhapatnam',
  'specialists?city=nagpur',
  'specialists?city=bhubaneswar',
  'specialists?city=guwahati'
];

const knowledgePillars = [
  'baby-led-weaning-recipes', 'iron-rich-finger-foods', 'dha-omega-3-brain-superfoods', 'managing-toddler-picky-eating',
  'dairy-free-calcium-alternatives', 'gut-microbiome-fermented-foods', 'organic-baby-purees-step-by-step', 'healthy-lunchbox-ideas',
  'natural-electrolytes-for-kids', 'sugar-free-toddler-birthday-treats', 'immunity-soups-broths', 'vitamin-d3-zinc-nutrition',
  'safe-introduction-tree-nut-allergens', 'constipation-relief-fiber-foods', 'high-protein-vegetarian-meal-plans',
  'ayurvedic-herbs-child-digestion', 'healthy-evening-snack-swaps', 'hydration-milestones-hot-climates',
  'anti-inflammatory-toddler-diet', 'school-going-breakfast-bowls', 'sensory-texture-food-exposure',
  'millet-porridge-ancient-grains-toddlers', 'early-prevention-childhood-sugar-addiction', 'healthy-fats-avocado-ghee-benefits',
  'preventing-iron-deficiency-anemia-infants', 'hydrating-fruits-summer-cooling-foods', 'immunity-booster-smoothies-school-kids',
  'egg-introduction-safety-allergy-protocols', 'gluten-sensitivity-celiac-screening', 'prebiotic-probiotic-foods-infant-colic',
  'safe-feeding-practices-toddler-fevers', 'calcium-rich-green-leafy-purees-weaning',
  'overcoming-separation-anxiety-daycare', 'gentle-de-escalation-public-meltdowns', 'fostering-sibling-harmony',
  'building-growth-mindset-grit', 'managing-bedtime-resistance-night-terrors', 'raising-emotionally-intelligent-children',
  'navigating-toddler-biting-grasping', 'building-self-esteem-introverted-kids', 'positive-discipline-without-timeouts',
  'sensory-processing-sensitivity-guide', 'helping-kids-cope-moving-city', 'mindfulness-breathing-games-preschool',
  'decoding-attachment-theory-early-years', 'teaching-empathy-sharing-only-child', 'handling-school-bullying-confidence',
  'developing-frustration-tolerance', 'establishing-healthy-boundaries-grandparents', 'screen-free-boredom-resilience',
  'overcoming-phobias-darkness-insects-strangers', 'building-emotional-vocabulary-preschool', 'peaceful-conflict-resolution-playdates',
  'helping-perfectionist-children-handle-failure', 'managing-school-anxiety-exam-stress', 'nurturing-positive-body-image-children',
  'fostering-independent-solo-play-guilt', 'understanding-highly-sensitive-children-hsp', 'bed-wetting-behavioral-support-guide',
  'compassionate-coparenting-communication-protocols',
  'comprehensive-homeschooling-curriculum', 'montessori-practical-life-activities', 'unplugged-coding-logic-preschool',
  'bilingual-language-acquisition-strategies', 'phonics-early-reading-mastery', 'nature-schooling-forest-kindergarten',
  'math-anxiety-elimination-manipulatives', 'reggio-emilia-play-space-home', 'creative-storytelling-writing-prompts',
  'science-experiments-kitchen-items', 'choosing-between-cbse-icse-ib-cambridge', 'daily-2-hour-focused-learning-flow',
  'spatial-geometry-wooden-blocks', 'world-geography-games-map-exploration', 'art-history-fine-motor-crafting',
  'music-rhythm-training-cognitive-expansion', 'micro-schooling-neighborhood-coop',
  'early-vedic-math-shortcuts-mental-calculation', 'developing-cursive-handwriting-motor-grip', 'critical-reading-socratic-discussion-kids',
  'waldorf-inspired-rhythm-seasonal-crafts', 'foreign-language-immersion-home-infancy', 'astronomy-stargazing-activities-young-learners',
  'stem-robotics-mechanical-play-home', 'creative-drama-roleplay-public-expression', 'speech-debate-confidence-elementary-students',
  'gamified-spelling-vocabulary-retention-systems',
  'infant-water-safety-hydrotherapy', 'toddler-gymnastics-core-stability', 'balance-bike-mastery-pedal-biking',
  'junior-soccer-drills-motor-agility', 'martial-arts-taekwondo-karate-focus', 'kids-track-field-sprinting-mechanics',
  'yoga-flexibility-stretches-children', 'tennis-badminton-hand-eye-coordination', 'outdoor-rock-climbing-balance',
  'team-sportsmanship-dealing-losses', 'preventing-overuse-injuries-youth-athletics', 'bilateral-skipping-rope-drills',
  'building-cardiovascular-stamina-tag', 'developing-dominant-hand-foot-precision', 'indoor-rainy-day-obstacle-courses',
  'swimming-stroke-technique-mastery-kids', 'roller-skating-skateboarding-equilibrium', 'cricket-bowling-batting-basics-beginners',
  'basketball-dribbling-spatial-awareness', 'archery-precision-concentration-youth', 'table-tennis-reaction-time-enhancement',
  'postural-alignment-backpack-ergonomics-kids', 'athletic-nutrition-hydration-young-competitors', 'calisthenics-bodyweight-training-teens',
  'newborn-circadian-rhythm-sleep-optimization', 'gentle-teething-pain-relief-remedies', 'diaper-rash-prevention-barrier-care',
  'daily-tummy-time-progression-chart', 'speech-babbling-milestones-checklist', 'baby-massage-abhyanga-techniques',
  'swaddling-vs-sleep-sacks-comparison', 'baby-wearing-ergonomics-healthy-hips', 'first-aid-cpr-preparedness-parents',
  'colic-infant-gas-soothing-holds', 'temperature-regulation-nursery-climate', 'safe-sunlight-exposure-guidelines',
  'transitioning-bassinet-to-crib', 'finger-nail-trimming-without-stress', 'baby-proofing-room-by-room-blueprint',
  'pacifier-weaning-without-sleep-disruption', 'cradle-cap-natural-removal-scalp-care', 'potty-training-in-3-days-without-tears',
  'ear-infection-prevention-flying-infants', 'fever-management-when-call-pediatrician', 'nasal-congestion-gentle-saline-steam',
  'safe-car-seat-installation-travel-rules', 'infant-vision-stimulation-contrast',
  'financial-literacy-smart-money-management', 'ethical-ai-tools-computational-play', 'critical-thinking-social-media-age',
  'cooking-kitchen-autonomy-kids', 'public-speaking-confident-presentation', 'gardening-sustainable-environmental-stewardship',
  'time-management-visual-planners-kids', 'disaster-preparedness-first-aid-basics', 'entrepreneurship-mindset-small-projects',
  'balancing-screen-time-digital-literacy', 'creative-problem-solving-design-thinking',
  'civic-responsibility-neighborhood-volunteering', 'basic-home-tool-usage-woodworking-kids', 'digital-privacy-identity-protection-youth',
  'negotiation-assertive-communication-teens', 'zero-waste-living-composting-habits-home', 'personal-hygiene-selfcare-autonomy-preteens',
  'infant-sensory-play-motor-development', 'toddler-tantrum-triggers-deescalation', 'homeschooling-daily-schedule-templates',
  'kids-swimming-safety-drowning-prevention', 'newborn-baby-bath-temperature-safety', 'kids-emotional-resilience-adversity',
  'preschool-math-counting-games', 'baby-first-words-language-stimulation', 'toddler-sleep-regression-solutions',
  'kids-yoga-mindfulness-bedtime', 'organic-finger-food-recipes-weaning', 'homeschool-coop-organization-legal-guide',
  'outdoor-nature-scavenger-hunts-kids', 'child-safety-online-stranger-awareness', 'kids-pocket-money-budgeting-jars',
  'toddler-sharing-turn-taking-drills'
];

const ageSlugs = ['0-12-months', '1-3-years', '4-6-years', '7-10-years', '11-14-years', 'all-ages'];

// Event Activities & Classes SEO URLs (Type + Title Slug for Google SEO)
const eventSeoPages = [
  'events/class/class-weekend-sensory-music-exploration-koramangala',
  'events/activity/activity-little-explorers-robotics-and-coding-lab',
  'events/workshop/workshop-kids-culinary-baking-masterclass-indiranagar',
  'events/sports/sports-junior-badminton-and-agility-championship',
  'events/activity/activity-eco-gardening-and-butterfly-trail-cubbon-park',
  'events/class/class-pottery-clay-sculpting-studio-whitefield',
  'events/camp/camp-space-astronomy-stargazing-night-camp',
  'events/class/class-young-orators-debate-public-speaking-academy',
  'events/competition/competition-bangalore-little-runners-mini-marathon',
  'events/workshop/workshop-math-magic-and-vedic-puzzle-quest',
  'events/class/class-bharatanatyam-classical-dance-foundation',
  'events/activity/activity-nature-water-play-and-splash-sensory-fest',
  'events/class/class-karate-and-self-defense-for-kids',
  'events/workshop/workshop-young-artist-acrylic-canvas-painting',
  'events/activity/activity-lego-mechanics-and-gear-engineering-lab',
  'events/class/class-chess-tactics-and-grandmaster-openings',
  'events/class/class-swimming-safety-and-freestyle-strokes',
  'events/workshop/workshop-origami-and-paper-craft-mastery',
  'events/activity/activity-storytelling-and-puppetry-theatre-circle',
  'events/workshop/workshop-kids-science-experiments-and-volcano-lab',
  'events/carnival/carnival-cubbon-park-kids-weekend-fiesta',
  'events/activity/activity-urban-birdwatching-and-sketching-walk',
  'events/class/class-calligraphy-and-handwriting-enhancement',
  'events/class/class-keyboard-and-western-music-foundation'
];

// Kid Stories & Young Achievers SEO URLs (YourStory for Kids - Google Indexed)
const kidStoriesSeoPages = [
  'kid-stories/aarav-sharma-national-abacus-champion-6-years',
  'kid-stories/ananya-iyer-little-kathak-dancer-guinness-record',
  'kid-stories/vihaan-reddy-junior-robotics-innovator-clean-water',
  'kid-stories/meera-nair-prodigy-pianist-youngest-trinity-performer',
  'kid-stories/kabir-patel-national-under-8-chess-master',
  'kid-stories/diya-menon-young-author-illustrated-storybook',
  'kid-stories/rohan-deshmukh-child-prodigy-vedic-math-speed',
  'kid-stories/sara-khan-youngest-roller-skating-state-medalist'
];

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

for (const page of corePages) {
  const url = page.path ? `${baseUrl}/${page.path}` : `${baseUrl}/`;
  xml += `  <url>\n`;
  xml += `    <loc>${url}</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
  xml += `    <priority>${page.priority}</priority>\n`;
  xml += `  </url>\n`;
}

for (const cat of categoryPages) {
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/explore/${cat}</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>0.8</priority>\n`;
  xml += `  </url>\n`;
}

for (const docPath of doctorSeoPages) {
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/${docPath}</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>0.9</priority>\n`;
  xml += `  </url>\n`;
}

// Event Activities & Classes URLs (with type & title for Google SEO)
for (const evtPath of eventSeoPages) {
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/${evtPath}</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>0.85</priority>\n`;
  xml += `  </url>\n`;
}

// Kid Stories (YourStory for Kids - Little Achievers)
for (const storyPath of kidStoriesSeoPages) {
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/${storyPath}</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>weekly</changefreq>\n`;
  xml += `    <priority>0.9</priority>\n`;
  xml += `  </url>\n`;
}

for (const pillar of knowledgePillars) {
  for (const age of ageSlugs) {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/knowledge/${pillar}-${age}-guide</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  }
}

xml += `</urlset>`;

// Write to /public/sitemap.xml
const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
const publicSitemap = path.join(publicDir, 'sitemap.xml');
fs.writeFileSync(publicSitemap, xml, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'vernunt-indexnow-key.txt'), 'vernunt_indexnow_auth_2026', 'utf-8');

// Sub-sitemap: Event Activities & Classes
let eventsXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
for (const evtPath of eventSeoPages) {
  eventsXml += `  <url><loc>${baseUrl}/${evtPath}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.85</priority></url>\n`;
}
eventsXml += `</urlset>`;
fs.writeFileSync(path.join(publicDir, 'sitemap-events.xml'), eventsXml, 'utf-8');

// Sub-sitemap: Kid Stories (YourStory for Kids)
let storiesXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
for (const storyPath of kidStoriesSeoPages) {
  storiesXml += `  <url><loc>${baseUrl}/${storyPath}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>\n`;
}
storiesXml += `</urlset>`;
fs.writeFileSync(path.join(publicDir, 'sitemap-kid-stories.xml'), storiesXml, 'utf-8');

// Sub-sitemap: guides
let guidesXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
for (const pillar of knowledgePillars) {
  for (const age of ageSlugs) {
    guidesXml += `  <url><loc>${baseUrl}/knowledge/${pillar}-${age}-guide</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>\n`;
  }
}
guidesXml += `</urlset>`;
fs.writeFileSync(path.join(publicDir, 'sitemap-guides.xml'), guidesXml, 'utf-8');

// Sub-sitemap: doctors & pediatricians directory
let doctorsXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
for (const docPath of doctorSeoPages) {
  doctorsXml += `  <url><loc>${baseUrl}/${docPath}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>\n`;
}
doctorsXml += `</urlset>`;
fs.writeFileSync(path.join(publicDir, 'sitemap-doctors.xml'), doctorsXml, 'utf-8');

console.log(`[Sitemap Generator] Generated ${publicSitemap} with ${corePages.length + categoryPages.length + doctorSeoPages.length + eventSeoPages.length + kidStoriesSeoPages.length + (knowledgePillars.length * ageSlugs.length)} URLs.`);

// Also write to /dist/sitemap.xml if /dist exists
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  const distSitemap = path.join(distDir, 'sitemap.xml');
  fs.writeFileSync(distSitemap, xml, 'utf-8');
  fs.writeFileSync(path.join(distDir, 'sitemap-events.xml'), eventsXml, 'utf-8');
  fs.writeFileSync(path.join(distDir, 'sitemap-kid-stories.xml'), storiesXml, 'utf-8');
  fs.writeFileSync(path.join(distDir, 'sitemap-guides.xml'), guidesXml, 'utf-8');
  fs.writeFileSync(path.join(distDir, 'sitemap-doctors.xml'), doctorsXml, 'utf-8');
  fs.writeFileSync(path.join(distDir, 'vernunt-indexnow-key.txt'), 'vernunt_indexnow_auth_2026', 'utf-8');
  console.log(`[Sitemap Generator] Also mirrored to ${distSitemap}`);
}
