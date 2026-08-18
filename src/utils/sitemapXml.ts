// src/utils/sitemapXml.ts
export function getGeneratedSitemapXml(): string {
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
  return xml;
}
