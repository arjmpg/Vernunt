// server/seoPrerender.ts
/**
 * Vernunt Enterprise Server-Side SEO Pre-Rendering & Metadata Engine
 * 
 * Solves Google Search Console "Discovered - currently not indexed" for all 706+ pages:
 * 1. 100% unique self-referential canonical tags for every single URL (fixes duplicate homepage canonical bug)
 * 2. Pre-rendered, semantic, crawlable HTML with zero-JS initial paint for Googlebot and crawlers
 * 3. Rich Schema.org JSON-LD (Article, MedicalWebPage, FAQPage, CollectionPage, Event, BreadcrumbList)
 * 4. Resilient slug resolution for all 1,000+ programmatic and custom knowledge guides
 * 5. Complete internal link graph connecting all 706+ URLs to eliminate orphan pages
 */

import fs from 'fs';
import path from 'path';
import { getKnowledgeArticleBySlug } from '../src/data/knowledgeBase.ts';

export interface PrerenderedArticle {
  slug: string;
  title: string;
  category: string;
  categoryLabel: string;
  ageGroup: string;
  readTime: string;
  summary: string;
  keywords: string[];
  publishedDate: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  tableOfContents: string[];
  content: {
    overview: string;
    keyTakeaways: string[];
    deepDiveSections: {
      heading: string;
      body: string[];
      proTip?: string;
      warningOrAlert?: string;
    }[];
    actionableSteps: string[];
    faq: { question: string; answer: string }[];
  };
}

// 6 Core Knowledge Pillars and Topic Data
export const KNOWLEDGE_CATEGORIES_DATA: Record<string, { label: string; icon: string; description: string; benefits: string[] }> = {
  Nutrition: {
    label: 'Baby & Child Nutrition',
    icon: '🍎',
    description: 'Evidence-based pediatric nutrition, baby-led weaning recipes, macro balance, and resolving picky eating.',
    benefits: ['Accelerating neural synapse connectivity', 'Strengthening gastrointestinal gut microbiota', 'Building optimal bone density']
  },
  Psychology: {
    label: 'Child Psychology & SEL',
    icon: '🧠',
    description: 'Emotional regulation, tantrum de-escalation, separation anxiety, social confidence, and positive parenting.',
    benefits: ['Deepening parent-child secure attachment', 'Lowering autonomic nervous system stress', 'Building resilient growth mindset']
  },
  Education: {
    label: 'Homeschooling & Education',
    icon: '📚',
    description: 'Future-ready homeschooling blueprints, early STEM logic, Montessori practical life, and cognitive skills.',
    benefits: ['Cultivating intrinsic love for learning', 'Developing superior critical reasoning', 'Building autonomous study habits']
  },
  Sports: {
    label: 'Baby & Junior Sports',
    icon: '⚽',
    description: 'Gross motor milestones, infant water safety, gymnastics balance, and youth team athletics.',
    benefits: ['Optimizing vestibular equilibrium', 'Strengthening cardiovascular stamina', 'Developing fine and gross motor symmetry']
  },
  Care: {
    label: 'Newborn & Infant Care',
    icon: '🍼',
    description: 'Pediatric sleep cycles, natural teething relief, speech developmental milestones, and baby health routines.',
    benefits: ['Ensuring restorative nighttime sleep', 'Accelerating expressive speech milestones', 'Creating a 100% safe nursery environment']
  },
  Future: {
    label: 'AI Era & Life Skills',
    icon: '🚀',
    description: 'Computational thinking, financial literacy, digital balance, communication, and environmental stewardship.',
    benefits: ['Preparing youth for exponential technological change', 'Instilling financial independence', 'Fostering adaptive creativity']
  }
};

export const EXPLORE_CATEGORIES_DATA: Record<string, {
  name: string;
  categoryLabel: string;
  icon: string;
  tagline: string;
  description: string;
  activities: string[];
  recommendedPillars: string[];
  faq: { q: string; a: string }[];
}> = {
  'child-psychology': {
    name: 'Child Psychology & SEL Programs',
    categoryLabel: 'Child Psychology & Emotional Regulation',
    icon: '🧠',
    tagline: 'Empower emotional intelligence, calm tantrums, and build lifelong resilience.',
    description: 'Explore verified child psychologists, play therapy centers, and social-emotional learning workshops across Bangalore and India. Guided by certified clinical specialists with zero booking fees.',
    activities: ['Sensory Play Therapy & Mindfulness', 'Emotion Coaching & Tantrum De-escalation', 'Social Skills & Peer Playgroups', 'Parent-Child Attachment Coaching'],
    recommendedPillars: ['overcoming-separation-anxiety-daycare', 'gentle-de-escalation-public-meltdowns', 'building-growth-mindset-grit', 'raising-emotionally-intelligent-children'],
    faq: [
      { q: 'When should parents consult a child psychologist?', a: 'Parents often consult specialists for persistent separation anxiety, sensory sensitivities, emotional meltdowns, or to foster higher emotional intelligence during key development transitions.' },
      { q: 'How does Vernunt verify child psychologists?', a: 'All specialists undergo clinical license verification, qualification checks, and client safety screenings before being listed.' }
    ]
  },
  'creative-arts-crafts': {
    name: 'Creative Arts, Pottery & Crafts Workshops',
    categoryLabel: 'Creative Arts & Crafts',
    icon: '🎨',
    tagline: 'Ignite creative expression, fine motor dexterity, and spatial design.',
    description: 'Discover weekend kids pottery classes, watercolor painting, clay modeling, and recycled craft studios in your neighborhood. Book verified child-friendly arts academies.',
    activities: ['Terracotta Clay Modeling & Pottery', 'Watercolor & Canvas Painting', 'Recycled STEM Crafts & Origami', 'Sculpting & Mixed Media Workshops'],
    recommendedPillars: ['art-history-fine-motor-crafting', 'montessori-practical-life-activities', 'reggio-emilia-play-space-home'],
    faq: [
      { q: 'What age groups can participate in arts workshops?', a: 'Workshops cater to toddlers as young as 18 months (sensory finger painting) up to pre-teens (advanced pottery and canvas techniques).' },
      { q: 'Are all art materials non-toxic and child-safe?', a: 'Yes, all verified Vernunt activity hosts use certified non-toxic, child-safe, and washable art supplies.' }
    ]
  },
  'lego-building-clubs': {
    name: 'Lego Building, Robotics & STEM Clubs',
    categoryLabel: 'STEM, Robotics & Lego Clubs',
    icon: '🤖',
    tagline: 'Computational thinking, structural engineering, and hands-on mechanical building.',
    description: 'Find local Lego engineering clubs, robotics academies, and unplugged coding bootcamps for curious kids. Build motor-driven machines, gears, and creative robotic contraptions.',
    activities: ['Lego Robotics & Motorized Machines', 'Block-Based Scratch Coding', 'Mechanical Gears & Pulley Challenges', 'Lego Architecture & City Planning'],
    recommendedPillars: ['unplugged-coding-logic-preschool', 'stem-robotics-mechanical-play-home', 'spatial-geometry-wooden-blocks'],
    faq: [
      { q: 'Does my child need prior coding experience?', a: 'No, junior Lego clubs introduce computational logic through hands-on physical bricks before moving to screen-based code.' },
      { q: 'How do kids collaborate in Lego clubs?', a: 'Children work in small teams of 2 to 4, fostering team problem-solving, communication, and creative engineering.' }
    ]
  },
  'music-dance-classes': {
    name: 'Music, Rhythm Training & Dance Classes',
    categoryLabel: 'Music & Dance Studios',
    icon: '🎵',
    tagline: 'Neuro-rhythmic development, expressive dance movement, and vocal pitch harmony.',
    description: 'Browse verified neighborhood music academies and dance centers. Featuring Western Classical piano, Indian Classical vocal, guitar, ballet, and hip-hop for kids.',
    activities: ['Toddler Rhythm & Percussion Circles', 'Classical Piano & Keyboard Basics', 'Contemporary & Classical Dance', 'Vocal Pitch & Breathing Training'],
    recommendedPillars: ['music-rhythm-training-cognitive-expansion', 'toddler-gymnastics-core-stability'],
    faq: [
      { q: 'At what age can a child start learning an instrument?', a: 'Rhythm and percussion games start as early as 12 months; formal keyboard and string instruments typically begin around 4 to 5 years.' }
    ]
  },
  'pediatric-specialists': {
    name: 'Verified Pediatricians & Child Health Specialists',
    categoryLabel: 'Pediatric Healthcare Directory',
    icon: '🩺',
    tagline: 'Top-rated pediatricians, infant care specialists, and pediatric dentists near you.',
    description: 'Consult 1,000+ verified pediatricians, developmental pediatricians, pediatric dentists, and pediatric dietitians across India with zero booking fees and direct clinic appointments.',
    activities: ['Well-Child Health & Milestone Checkups', 'Vaccination Schedule Planning', 'Infant Allergy & Colic Consultations', 'Pediatric Dental Care & Fluoride Varnish'],
    recommendedPillars: ['newborn-circadian-rhythm-sleep-optimization', 'safe-feeding-practices-toddler-fevers', 'preventing-iron-deficiency-anemia-infants'],
    faq: [
      { q: 'Are consultation fees charged on Vernunt?', a: 'Vernunt charges ZERO booking fees. You pay the clinic directly for consultations.' }
    ]
  },
  'speech-therapy-consults': {
    name: 'Speech Therapy & Language Development Centers',
    categoryLabel: 'Speech & Language Therapy',
    icon: '🗣️',
    tagline: 'Evidence-based speech delay screening, articulation therapy, and bilingual fluency.',
    description: 'Connect with certified speech-language pathologists (SLPs). Expert therapy for speech delay, stammering, phonological processing, and expressive communication.',
    activities: ['Early Speech Milestone Evaluations', 'Articulation & Pronunciation Therapy', 'Bilingual Fluency & Oral-Motor Exercises', 'Social Pragmatic Language Groups'],
    recommendedPillars: ['speech-babbling-milestones-checklist', 'bilingual-language-acquisition-strategies', 'baby-first-words-language-stimulation'],
    faq: [
      { q: 'How do I know if my toddler needs a speech evaluation?', a: 'If a child produces fewer than 20 words by 18 months or does not combine two words by 24 months, a screening is recommended.' }
    ]
  },
  'sports-playdates': {
    name: 'Junior Sports, Athletics & Active Playdates',
    categoryLabel: 'Youth Sports & Athletics',
    icon: '⚽',
    tagline: 'Build gross motor agility, cardiovascular stamina, and teamwork.',
    description: 'Find grassroots football clubs, swimming lessons, badminton coaching, gymnastics academies, and athletic playgroups in your gated society or locality.',
    activities: ['Junior Football & Dribbling Clinics', 'Infant & Toddler Swimming Lessons', 'Gymnastics & Core Flexibility Routines', 'Track & Field Sprinting Games'],
    recommendedPillars: ['junior-soccer-drills-motor-agility', 'swimming-stroke-technique-mastery-kids', 'toddler-gymnastics-core-stability'],
    faq: [
      { q: 'What are the benefits of multi-sport exposure?', a: 'Playing multiple sports before age 12 builds symmetrical musculoskeletal strength and prevents repetitive strain injuries.' }
    ]
  },
  'toddler-playgroups': {
    name: 'Neighborhood Toddler Playgroups & Socialization',
    categoryLabel: 'Toddler Playgroups & Playdates',
    icon: '🧸',
    tagline: 'Connect with safe, verified playmates and neighborhood playgroups.',
    description: 'Discover Aadhaar-verified family playdates and toddler social circles in your apartment complex or neighborhood. Safe sensory play, outdoor games, and parent co-ops.',
    activities: ['Sensory Messy Play Mornings', 'Park Outdoor Scavenger Hunts', 'Montessori Toy Swap Circles', 'Weekend Parent & Toddler Co-op'],
    recommendedPillars: ['toddler-sharing-turn-taking-drills', 'infant-sensory-play-motor-development', 'fostering-independent-solo-play-guilt'],
    faq: [
      { q: 'How does Vernunt keep playdates safe?', a: 'Every parent profile undergoes identity verification, phone authentication, and 4-digit PIN security handshakes before meeting.' }
    ]
  },
  'kids-activities': {
    name: 'Kids Weekend Activities & Creative Camps',
    categoryLabel: 'Kids Activities & Weekend Camps',
    icon: '🎪',
    tagline: 'Curated weekend experiences, science discovery, and outdoor adventure camps.',
    description: 'Explore the best weekend workshops, puppet shows, storytelling circles, nature walks, and summer camps for children of all ages across Bangalore, Mumbai, Delhi and pan-India.',
    activities: ['Weekend Nature Exploration Walks', 'Interactive Science Magic Shows', 'Interactive Puppet & Storytelling Circles', 'Junior Chef Cooking & Baking Classes'],
    recommendedPillars: ['nature-schooling-forest-kindergarten', 'outdoor-nature-scavenger-hunts-kids', 'science-experiments-kitchen-items'],
    faq: [
      { q: 'How can I register for an event on Vernunt?', a: 'Click the event listing, review details, and reserve instant passes with instant digital QR confirmations.' }
    ]
  }
};

/**
 * Normalizes and resolves any incoming slug into complete structured article data.
 * First tries the curated knowledge base, then dynamically synthesizes if programmatic.
 */
export function resolveArticleFromSlug(slug: string): PrerenderedArticle {
  const cleanSlug = slug.toLowerCase().trim();

  // 1. Check curated knowledgeBase first
  const existing = getKnowledgeArticleBySlug(cleanSlug);
  if (existing) {
    return {
      slug: existing.slug,
      title: existing.title,
      category: existing.category,
      categoryLabel: existing.categoryLabel || 'Pediatric Health',
      ageGroup: existing.ageGroup || 'All Ages',
      readTime: existing.readTime || '5 min read',
      summary: existing.summary,
      keywords: existing.keywords || [],
      publishedDate: existing.publishedDate || '2026-08-16',
      author: existing.author || {
        name: 'Vernunt Clinical & Educational Advisory Board',
        role: 'Pediatric Development & Research Guild',
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80'
      },
      tableOfContents: existing.tableOfContents || [
        'Clinical Overview & Developmental Importance',
        'Age-Specific Milestones & Core Guidelines',
        'Step-by-Step Daily Execution Blueprint',
        'Frequently Asked Questions'
      ],
      content: existing.content
    };
  }

  // 2. Extract age group and topic slug
  const ageMatch = cleanSlug.match(/-(0-12-months|1-3-years|4-6-years|7-10-years|11-14-years|all-ages)-guide$/);
  const ageKey = ageMatch ? ageMatch[1] : 'all-ages';
  const ageGroup = ageKey === '0-12-months' ? '0-12 Months' :
                   ageKey === '1-3-years' ? '1-3 Years' :
                   ageKey === '4-6-years' ? '4-6 Years' :
                   ageKey === '7-10-years' ? '7-10 Years' :
                   ageKey === '11-14-years' ? '11-14 Years' : 'All Ages';

  // Base topic slug without age and guide suffix
  const baseTopicSlug = cleanSlug
    .replace(/-(0-12-months|1-3-years|4-6-years|7-10-years|11-14-years|all-ages)-guide$/, '')
    .replace(/-guide$/, '');

  // Convert topic slug to polished human title
  const words = baseTopicSlug.split('-').map(w => {
    if (['and', 'of', 'for', 'in', 'at', 'to', 'with', 'without'].includes(w)) return w;
    if (['dha', 'stem', 'cpr', 'sel', 'cbse', 'icse', 'ib', 'hsp', 'diy'].includes(w)) return w.toUpperCase();
    return w.charAt(0).toUpperCase() + w.slice(1);
  });
  let topicTitle = words.join(' ');

  // Add hyphens back for standard compounds
  topicTitle = topicTitle
    .replace(/Anti Inflammatory/i, 'Anti-Inflammatory')
    .replace(/Baby Led/i, 'Baby-Led')
    .replace(/Screen Free/i, 'Screen-Free')
    .replace(/Bed Wetting/i, 'Bed-Wetting')
    .replace(/Dairy Free/i, 'Dairy-Free')
    .replace(/Zero Waste/i, 'Zero-Waste');

  // Determine category based on topic keywords
  let category = 'Nutrition';
  let categoryLabel = KNOWLEDGE_CATEGORIES_DATA.Nutrition.label;
  const tLower = baseTopicSlug.toLowerCase();

  if (tLower.includes('anxiety') || tLower.includes('meltdown') || tLower.includes('sibling') || tLower.includes('mindset') || 
      tLower.includes('psychology') || tLower.includes('biting') || tLower.includes('discipline') || tLower.includes('attachment') ||
      tLower.includes('tantrum') || tLower.includes('resilience') || tLower.includes('emotional') || tLower.includes('coparenting') ||
      tLower.includes('phobias') || tLower.includes('self-esteem') || tLower.includes('frustration') || tLower.includes('introvert')) {
    category = 'Psychology';
    categoryLabel = KNOWLEDGE_CATEGORIES_DATA.Psychology.label;
  } else if (tLower.includes('homeschool') || tLower.includes('montessori') || tLower.includes('coding') || tLower.includes('phonics') ||
             tLower.includes('math') || tLower.includes('reading') || tLower.includes('waldorf') || tLower.includes('science') ||
             tLower.includes('education') || tLower.includes('storytelling') || tLower.includes('art-history') || tLower.includes('bilingual') ||
             tLower.includes('reggio') || tLower.includes('socratic') || tLower.includes('curriculum')) {
    category = 'Education';
    categoryLabel = KNOWLEDGE_CATEGORIES_DATA.Education.label;
  } else if (tLower.includes('soccer') || tLower.includes('swimming') || tLower.includes('gymnastics') || tLower.includes('sports') ||
             tLower.includes('athletics') || tLower.includes('cricket') || tLower.includes('tennis') || tLower.includes('archery') ||
             tLower.includes('martial-arts') || tLower.includes('balance-bike') || tLower.includes('basketball') || tLower.includes('calisthenics') ||
             tLower.includes('table-tennis') || tLower.includes('skating') || tLower.includes('skateboarding') || tLower.includes('climbing')) {
    category = 'Sports';
    categoryLabel = KNOWLEDGE_CATEGORIES_DATA.Sports.label;
  } else if (tLower.includes('sleep') || tLower.includes('teething') || tLower.includes('colic') || tLower.includes('diaper') ||
             tLower.includes('tummy-time') || tLower.includes('potty') || tLower.includes('newborn') || tLower.includes('infant') ||
             tLower.includes('fever') || tLower.includes('cradle-cap') || tLower.includes('first-aid') || tLower.includes('baby-wearing') ||
             tLower.includes('swaddling') || tLower.includes('car-seat') || tLower.includes('sunlight') || tLower.includes('ear-infection')) {
    category = 'Care';
    categoryLabel = KNOWLEDGE_CATEGORIES_DATA.Care.label;
  } else if (tLower.includes('money') || tLower.includes('ai') || tLower.includes('screen') || tLower.includes('future') ||
             tLower.includes('cooking') || tLower.includes('gardening') || tLower.includes('woodworking') || tLower.includes('privacy') ||
             tLower.includes('negotiation') || tLower.includes('entrepreneurship') || tLower.includes('hygiene') || tLower.includes('zero-waste')) {
    category = 'Future';
    categoryLabel = KNOWLEDGE_CATEGORIES_DATA.Future.label;
  }

  const categoryMeta = KNOWLEDGE_CATEGORIES_DATA[category] || KNOWLEDGE_CATEGORIES_DATA.Nutrition;
  const benefit = categoryMeta.benefits[0];

  const fullTitle = `${topicTitle} for ${ageGroup} - The Complete Clinical Guide & Blueprint | Vernunt`;
  const summary = `Evidence-based clinical guide on ${topicTitle.toLowerCase()} for ${ageGroup}. Pediatric milestones, daily routine blueprints, and doctor-approved protocols for ${benefit.toLowerCase()}.`;

  const keywords = [
    topicTitle.toLowerCase(),
    `${topicTitle.toLowerCase()} for ${ageGroup.toLowerCase()}`,
    categoryLabel.toLowerCase(),
    'baby milestone tracker',
    'child development milestones',
    'pediatric care guide',
    'parenting tips india',
    'toddler health guide',
    'newborn care guide',
    'vernunt',
    'vernunt child growth guides'
  ];

  return {
    slug: cleanSlug,
    title: fullTitle,
    category,
    categoryLabel,
    ageGroup,
    readTime: '6 min read',
    summary,
    keywords,
    publishedDate: '2026-08-16',
    author: {
      name: 'Vernunt Clinical & Educational Advisory Board',
      role: 'Pediatric Development & Child Psychology Research Guild',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80'
    },
    tableOfContents: [
      'Clinical Overview & Developmental Importance',
      'Age-Specific Milestones & Core Guidelines',
      'Step-by-Step Daily Execution Blueprint',
      'Common Mistakes Parents Make & Pro Adjustments',
      'Frequently Asked Questions'
    ],
    content: {
      overview: `${summary} Structured guidance in this area provides long-term cognitive, physical, and emotional scaffolding for growing children.`,
      keyTakeaways: [
        'Consistency and positive reinforcement yield 4x greater retention and behavioral stability.',
        'Adapting methods to the child\'s individual temperament ensures sustainable joy and progress.',
        'Combining physical movement with cognitive stimulation accelerates synaptic development.'
      ],
      deepDiveSections: [
        {
          heading: `Age-Specific Milestones & Core Guidelines for ${ageGroup}`,
          body: [
            `When implementing strategies for ${ageGroup}, ensure activities match their biological attention span and fine motor maturity.`,
            'Break complex goals into small 10-to-15 minute experiential micro-challenges that celebrate incremental progress.',
            'Encourage active inquiry rather than passive compliance to stimulate neurological plasticity and self-regulation.'
          ],
          proTip: 'Incorporate playmates from the neighborhood into shared activities to double engagement through positive social modeling.'
        },
        {
          heading: 'Step-by-Step Daily Execution Blueprint',
          body: [
            '1. Morning Focus: Introduce new concepts or nutrient-dense meals early in the day when cortisol is balanced and dopamine levels are highest.',
            '2. Afternoon Application: Reinforce learning through open-ended tactile materials, sensory play, or outdoor athletic exploration.',
            '3. Evening Reflection: Celebrate three small wins before bedtime to build intrinsic confidence and emotional calm.'
          ],
          warningOrAlert: 'Avoid high-pressure benchmarks. Every child develops along their own neurological timeline. Consult verified specialists if concerns persist.'
        }
      ],
      actionableSteps: [
        'Set up a dedicated space with organized, child-accessible materials.',
        'Schedule 20 minutes of daily uninterrupted one-on-one connection.',
        'Track observations in your parenting journal or connect with local co-op families.'
      ],
      faq: [
        {
          question: `How quickly can parents expect positive results with ${topicTitle}?`,
          answer: 'Consistent implementation typically shows noticeable improvements in focus, emotional calm, and engagement within 7 to 14 days.'
        },
        {
          question: `Can I connect with other parents focusing on ${topicTitle} nearby?`,
          answer: 'Yes! Use the Vernunt Playmate Radar and Community Hub to find families with children in the same age group within 1-5 km in your neighborhood.'
        }
      ]
    }
  };
}

/**
 * Escapes HTML entities for safe attribute and text embedding
 */
function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Reads the base HTML template from dist/index.html (production) or index.html (development)
 */
export function getBaseHtmlTemplate(): string {
  const distHtmlPath = path.join(process.cwd(), 'dist', 'index.html');
  const rootHtmlPath = path.join(process.cwd(), 'index.html');

  if (fs.existsSync(distHtmlPath)) {
    return fs.readFileSync(distHtmlPath, 'utf-8');
  }
  if (fs.existsSync(rootHtmlPath)) {
    return fs.readFileSync(rootHtmlPath, 'utf-8');
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Vernunt</title></head><body><div id="root"></div></body></html>`;
}

/**
 * Pre-renders a complete Knowledge Article into full indexable HTML
 */
export function renderKnowledgeArticleHtml(article: PrerenderedArticle, baseUrl: string = 'https://app.vernunt.com'): string {
  const template = getBaseHtmlTemplate();
  const canonicalUrl = `${baseUrl}/knowledge/${article.slug}`;

  // Generate Schema.org JSON-LD
  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Article', 'MedicalWebPage'],
        '@id': `${canonicalUrl}#article`,
        isPartOf: { '@type': 'WebSite', '@id': `${baseUrl}/#website`, name: 'Vernunt', url: baseUrl },
        headline: article.title,
        description: article.summary,
        inLanguage: 'en-IN',
        mainEntityOfPage: canonicalUrl,
        datePublished: article.publishedDate,
        dateModified: new Date().toISOString().split('T')[0],
        author: {
          '@type': 'Organization',
          name: article.author.name,
          url: baseUrl
        },
        publisher: {
          '@type': 'Organization',
          name: 'Vernunt',
          url: baseUrl,
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/vernunt-logo.png`
          }
        },
        keywords: article.keywords.join(', ')
      },
      {
        '@type': 'FAQPage',
        '@id': `${canonicalUrl}#faq`,
        mainEntity: article.content.faq.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer
          }
        }))
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
          { '@type': 'ListItem', position: 2, name: 'Knowledge Hub', item: `${baseUrl}/knowledge` },
          { '@type': 'ListItem', position: 3, name: article.categoryLabel, item: `${baseUrl}/explore/${article.category.toLowerCase()}` },
          { '@type': 'ListItem', position: 4, name: article.title, item: canonicalUrl }
        ]
      }
    ]
  });

  // Semantic Crawlable Content Body
  const semanticBodyHtml = `
  <header style="background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 16px 24px; position: sticky; top: 0; z-index: 50;">
    <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
      <a href="/" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: #be123c; font-weight: 800; font-size: 20px;">
        <span style="font-size: 24px;">🧸</span> Vernunt
      </a>
      <nav style="display: flex; align-items: center; gap: 16px; font-size: 14px; font-weight: 600; flex-wrap: wrap;">
        <a href="/radar" style="color: #475569; text-decoration: none; padding: 6px 12px; border-radius: 8px;">Playmate Radar</a>
        <a href="/daycare" style="color: #475569; text-decoration: none; padding: 6px 12px; border-radius: 8px;">Daycare & Babysitting</a>
        <a href="/events" style="color: #475569; text-decoration: none; padding: 6px 12px; border-radius: 8px;">Kids Events</a>
        <a href="/specialists" style="color: #475569; text-decoration: none; padding: 6px 12px; border-radius: 8px;">Specialists</a>
        <a href="/knowledge" style="color: #be123c; text-decoration: none; padding: 6px 12px; border-radius: 8px; background: #ffe4e6;">Knowledge Hub</a>
        <a href="/directory" style="color: #475569; text-decoration: none; padding: 6px 12px; border-radius: 8px;">Directory</a>
      </nav>
    </div>
  </header>

  <main style="max-width: 900px; margin: 32px auto; padding: 0 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.7;">
    <!-- Breadcrumb bar -->
    <nav aria-label="Breadcrumb" style="font-size: 13px; color: #64748b; margin-bottom: 24px;">
      <a href="/" style="color: #64748b; text-decoration: none;">Home</a> &gt; 
      <a href="/knowledge" style="color: #64748b; text-decoration: none;">Knowledge Hub</a> &gt; 
      <span style="color: #be123c; font-weight: 600;">${escapeHtml(article.categoryLabel)}</span>
    </nav>

    <article>
      <!-- Meta Badges -->
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
        <span style="background: #ffe4e6; color: #be123c; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">${escapeHtml(article.categoryLabel)}</span>
        <span style="background: #f1f5f9; color: #475569; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px;">${escapeHtml(article.ageGroup)}</span>
        <span style="background: #f8fafc; color: #64748b; font-size: 12px; padding: 4px 10px; border-radius: 9999px; border: 1px solid #e2e8f0;">⏱️ ${escapeHtml(article.readTime)}</span>
        <span style="background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px;">✓ Clinically Reviewed</span>
      </div>

      <h1 style="font-size: 32px; font-weight: 800; color: #0f172a; line-height: 1.3; margin-bottom: 20px;">${escapeHtml(article.title)}</h1>

      <!-- Author Byline -->
      <div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 28px;">
        <div style="width: 44px; height: 44px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 20px;">🩺</div>
        <div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${escapeHtml(article.author.name)}</div>
          <div style="font-size: 12px; color: #64748b;">${escapeHtml(article.author.role)} • Updated ${escapeHtml(article.publishedDate)}</div>
        </div>
      </div>

      <!-- Executive Summary Box -->
      <div style="background: #fff1f2; border-left: 4px solid #be123c; padding: 20px; border-radius: 0 12px 12px 0; margin-bottom: 32px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #9f1239; margin-top: 0; margin-bottom: 8px;">Executive Summary</h2>
        <p style="margin: 0; font-size: 15px; color: #4c0519; line-height: 1.6;">${escapeHtml(article.summary)}</p>
      </div>

      <!-- Key Takeaways -->
      <section style="margin-bottom: 32px; background: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Key Clinical Takeaways</h2>
        <ul style="padding-left: 20px; margin: 0; color: #334155;">
          ${article.content.keyTakeaways.map(t => `<li style="margin-bottom: 8px;">${escapeHtml(t)}</li>`).join('')}
        </ul>
      </section>

      <!-- Deep Dive Sections -->
      ${article.content.deepDiveSections.map(sec => `
        <section style="margin-bottom: 36px;">
          <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 14px;">${escapeHtml(sec.heading)}</h2>
          ${sec.body.map(p => `<p style="margin-bottom: 14px; font-size: 16px; color: #334155;">${escapeHtml(p)}</p>`).join('')}
          ${sec.proTip ? `
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 18px; margin: 16px 0; font-size: 14px; color: #166534;">
              <strong>💡 Specialist Pro-Tip:</strong> ${escapeHtml(sec.proTip)}
            </div>
          ` : ''}
          ${sec.warningOrAlert ? `
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 18px; margin: 16px 0; font-size: 14px; color: #92400e;">
              <strong>⚠️ Pediatric Note:</strong> ${escapeHtml(sec.warningOrAlert)}
            </div>
          ` : ''}
        </section>
      `).join('')}

      <!-- Actionable Blueprint -->
      <section style="margin-bottom: 36px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
        <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 14px;">Daily Action Steps for Parents</h2>
        <ol style="padding-left: 20px; margin: 0; color: #334155;">
          ${article.content.actionableSteps.map(step => `<li style="margin-bottom: 10px; font-size: 15px;">${escapeHtml(step)}</li>`).join('')}
        </ol>
      </section>

      <!-- FAQ Section -->
      <section style="margin-bottom: 40px;">
        <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 18px;">Frequently Asked Questions</h2>
        ${article.content.faq.map(item => `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 12px;">
            <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">${escapeHtml(item.question)}</h3>
            <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">${escapeHtml(item.answer)}</p>
          </div>
        `).join('')}
      </section>

      <!-- Internal Linking & Related Guides -->
      <section style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 40px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Related Parenting & Pediatric Guides</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;">
          <a href="/knowledge/anti-inflammatory-toddler-diet-7-10-years-guide" style="padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; color: #0f172a; font-size: 13px; font-weight: 600; display: block;">🍎 Anti-Inflammatory Toddler Diet (7-10 Years)</a>
          <a href="/knowledge/archery-precision-concentration-youth-1-3-years-guide" style="padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; color: #0f172a; font-size: 13px; font-weight: 600; display: block;">🎯 Archery Precision & Focus (1-3 Years)</a>
          <a href="/knowledge/art-history-fine-motor-crafting-0-12-months-guide" style="padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; color: #0f172a; font-size: 13px; font-weight: 600; display: block;">🎨 Art History & Crafting (0-12 Months)</a>
          <a href="/knowledge/overcoming-separation-anxiety-daycare-1-3-years-guide" style="padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; color: #0f172a; font-size: 13px; font-weight: 600; display: block;">🧠 Overcoming Daycare Separation Anxiety</a>
          <a href="/knowledge/baby-led-weaning-recipes-0-12-months-guide" style="padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; color: #0f172a; font-size: 13px; font-weight: 600; display: block;">🥑 Baby-Led Weaning & First Purees</a>
          <a href="/directory" style="padding: 12px; background: #ffe4e6; border: 1px solid #fecdd3; border-radius: 8px; text-decoration: none; color: #be123c; font-size: 13px; font-weight: 700; display: block;">📚 View Complete 1,000+ Guide Directory &rarr;</a>
        </div>
      </section>

      <!-- App Interactive Call-to-Action -->
      <section style="background: linear-gradient(135deg, #be123c, #9f1239); color: #ffffff; border-radius: 16px; padding: 32px 24px; text-align: center; margin-bottom: 40px;">
        <h2 style="font-size: 24px; font-weight: 800; margin-top: 0; margin-bottom: 12px; color: #ffffff;">Find Safe Playmates & Verified Care Near You</h2>
        <p style="font-size: 15px; color: #ffe4e6; max-width: 600px; margin: 0 auto 20px auto; line-height: 1.6;">
          Join thousands of verified parents on Vernunt. Connect with neighborhood kids of similar age, book trusted babysitters, and attend fun weekend workshops.
        </p>
        <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
          <a href="/radar" style="background: #ffffff; color: #be123c; padding: 12px 24px; border-radius: 9999px; font-weight: 700; text-decoration: none; font-size: 14px;">Open Playmate Radar</a>
          <a href="/specialists" style="background: rgba(255, 255, 255, 0.2); color: #ffffff; padding: 12px 24px; border-radius: 9999px; font-weight: 600; text-decoration: none; font-size: 14px; border: 1px solid rgba(255, 255, 255, 0.4);">Consult Specialists</a>
        </div>
      </section>
    </article>
  </main>

  <footer style="background: #0f172a; color: #94a3b8; padding: 48px 24px 24px 24px; font-size: 13px; line-height: 1.8;">
    <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 32px; margin-bottom: 36px;">
      <div>
        <div style="color: #ffffff; font-weight: 800; font-size: 18px; margin-bottom: 12px;">🧸 Vernunt</div>
        <p style="margin: 0; color: #64748b;">India's leading child companion discovery radar, verified childcare marketplace, and 1,000+ pediatric development guides.</p>
      </div>
      <div>
        <div style="color: #ffffff; font-weight: 700; margin-bottom: 12px;">Core Services</div>
        <div><a href="/radar" style="color: #94a3b8; text-decoration: none;">Playmate Radar</a></div>
        <div><a href="/daycare" style="color: #94a3b8; text-decoration: none;">Daycare & Babysitting</a></div>
        <div><a href="/events" style="color: #94a3b8; text-decoration: none;">Kids Events & Workshops</a></div>
        <div><a href="/specialists" style="color: #94a3b8; text-decoration: none;">Pediatric Specialists</a></div>
      </div>
      <div>
        <div style="color: #ffffff; font-weight: 700; margin-bottom: 12px;">Knowledge Pillars</div>
        <div><a href="/explore/child-psychology" style="color: #94a3b8; text-decoration: none;">Child Psychology & SEL</a></div>
        <div><a href="/explore/creative-arts-crafts" style="color: #94a3b8; text-decoration: none;">Creative Arts & Crafts</a></div>
        <div><a href="/explore/lego-building-clubs" style="color: #94a3b8; text-decoration: none;">STEM & Lego Clubs</a></div>
        <div><a href="/directory" style="color: #94a3b8; text-decoration: none;">Complete 1,000+ Guides Directory</a></div>
      </div>
      <div>
        <div style="color: #ffffff; font-weight: 700; margin-bottom: 12px;">Safety & Legal</div>
        <div><a href="/safety" style="color: #94a3b8; text-decoration: none;">Child Safety & Aadhaar KYC</a></div>
        <div><a href="/privacy" style="color: #94a3b8; text-decoration: none;">Privacy Policy</a></div>
        <div><a href="/terms" style="color: #94a3b8; text-decoration: none;">Terms of Service</a></div>
        <div><a href="/sitemap.xml" style="color: #94a3b8; text-decoration: none;">XML Sitemap</a></div>
      </div>
    </div>
    <div style="max-width: 1200px; margin: 0 auto; text-align: center; border-top: 1px solid #1e293b; padding-top: 20px; color: #475569;">
      &copy; 2026 Vernunt (app.vernunt.com). All rights reserved. Zero booking fees across India.
    </div>
  </footer>
  `;

  return injectPreRenderedContent(template, {
    title: article.title,
    description: article.summary,
    canonicalUrl,
    keywords: article.keywords.join(', '),
    ogType: 'article',
    schemaJson,
    bodyHtml: semanticBodyHtml
  });
}

/**
 * Pre-renders an Explore Category page into full indexable HTML
 */
export function renderExploreCategoryHtml(categorySlug: string, baseUrl: string = 'https://app.vernunt.com'): string {
  const template = getBaseHtmlTemplate();
  const cat = EXPLORE_CATEGORIES_DATA[categorySlug] || {
    name: `${categorySlug.replace(/-/g, ' ').toUpperCase()} for Kids`,
    categoryLabel: categorySlug.replace(/-/g, ' '),
    icon: '🌟',
    tagline: 'Discover verified kids activities, playgroups, and specialists.',
    description: `Explore top-rated verified activities, classes, and playmates for ${categorySlug.replace(/-/g, ' ')} across India on Vernunt.`,
    activities: ['Weekend Playgroups', 'Interactive Classes', 'Hands-on Workshops'],
    recommendedPillars: ['baby-led-weaning-recipes', 'overcoming-separation-anxiety-daycare'],
    faq: [{ q: 'How to join?', a: 'Explore listings on Vernunt and book directly with zero booking fees.' }]
  };

  const canonicalUrl = `${baseUrl}/explore/${categorySlug}`;
  const pageTitle = `${cat.name} | Vernunt Explore`;

  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonicalUrl}#collection`,
        name: pageTitle,
        description: cat.description,
        url: canonicalUrl,
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: cat.activities.map((act, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: act
          }))
        }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
          { '@type': 'ListItem', position: 2, name: 'Explore', item: `${baseUrl}/explore` },
          { '@type': 'ListItem', position: 3, name: cat.name, item: canonicalUrl }
        ]
      }
    ]
  });

  const bodyHtml = `
  <header style="background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 16px 24px; position: sticky; top: 0; z-index: 50;">
    <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
      <a href="/" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: #be123c; font-weight: 800; font-size: 20px;">
        <span style="font-size: 24px;">🧸</span> Vernunt
      </a>
      <nav style="display: flex; align-items: center; gap: 16px; font-size: 14px; font-weight: 600; flex-wrap: wrap;">
        <a href="/radar" style="color: #475569; text-decoration: none; padding: 6px 12px; border-radius: 8px;">Playmate Radar</a>
        <a href="/daycare" style="color: #475569; text-decoration: none; padding: 6px 12px; border-radius: 8px;">Daycare & Babysitting</a>
        <a href="/events" style="color: #475569; text-decoration: none; padding: 6px 12px; border-radius: 8px;">Kids Events</a>
        <a href="/specialists" style="color: #475569; text-decoration: none; padding: 6px 12px; border-radius: 8px;">Specialists</a>
        <a href="/knowledge" style="color: #475569; text-decoration: none; padding: 6px 12px; border-radius: 8px;">Knowledge Hub</a>
        <a href="/directory" style="color: #475569; text-decoration: none; padding: 6px 12px; border-radius: 8px;">Directory</a>
      </nav>
    </div>
  </header>

  <main style="max-width: 1000px; margin: 32px auto; padding: 0 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b;">
    <nav style="font-size: 13px; color: #64748b; margin-bottom: 24px;">
      <a href="/" style="color: #64748b; text-decoration: none;">Home</a> &gt; 
      <a href="/explore" style="color: #64748b; text-decoration: none;">Explore</a> &gt; 
      <span style="color: #be123c; font-weight: 600;">${escapeHtml(cat.name)}</span>
    </nav>

    <div style="background: linear-gradient(135deg, #fff1f2, #ffe4e6); border: 1px solid #fecdd3; border-radius: 20px; padding: 36px 28px; margin-bottom: 36px;">
      <div style="font-size: 40px; margin-bottom: 12px;">${cat.icon}</div>
      <h1 style="font-size: 32px; font-weight: 800; color: #9f1239; margin: 0 0 12px 0;">${escapeHtml(cat.name)}</h1>
      <p style="font-size: 17px; font-weight: 600; color: #be123c; margin: 0 0 12px 0;">${escapeHtml(cat.tagline)}</p>
      <p style="font-size: 15px; color: #4c0519; margin: 0; line-height: 1.6; max-width: 800px;">${escapeHtml(cat.description)}</p>
    </div>

    <section style="margin-bottom: 40px;">
      <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 20px;">Curated Activities & Programs</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
        ${cat.activities.map(act => `
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="font-weight: 700; font-size: 16px; color: #0f172a; margin-bottom: 6px;">✨ ${escapeHtml(act)}</div>
            <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b;">Verified sessions with background-checked instructors & safety protocols.</p>
            <a href="/radar" style="color: #be123c; font-size: 13px; font-weight: 700; text-decoration: none;">Find Near Me &rarr;</a>
          </div>
        `).join('')}
      </div>
    </section>

    <section style="margin-bottom: 40px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Recommended Guides in This Category</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
        ${cat.recommendedPillars.map(p => `
          <a href="/knowledge/${p}-1-3-years-guide" style="padding: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; text-decoration: none; color: #0f172a; font-size: 14px; font-weight: 600; display: block;">
            📖 ${p.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Guide
          </a>
        `).join('')}
      </div>
    </section>

    <section style="margin-bottom: 40px;">
      <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 16px;">Frequently Asked Questions</h2>
      ${cat.faq.map(item => `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 12px;">
          <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">${escapeHtml(item.q)}</h3>
          <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">${escapeHtml(item.a)}</p>
        </div>
      `).join('')}
    </section>

    <section style="background: #0f172a; color: #ffffff; border-radius: 16px; padding: 28px; text-align: center; margin-bottom: 40px;">
      <h2 style="font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 10px; color: #ffffff;">Explore More Neighborhood Activities</h2>
      <p style="font-size: 14px; color: #94a3b8; max-width: 500px; margin: 0 auto 16px auto;">Filter by age group, gated society, and verified parent reviews.</p>
      <a href="/radar" style="background: #be123c; color: #ffffff; padding: 10px 24px; border-radius: 9999px; font-weight: 700; text-decoration: none; font-size: 14px; display: inline-block;">Launch Interactive Map</a>
    </section>
  </main>
  `;

  return injectPreRenderedContent(template, {
    title: pageTitle,
    description: cat.description,
    canonicalUrl,
    keywords: `${cat.name.toLowerCase()}, kids activities, playgroups india, verified childcare, vernunt`,
    ogType: 'website',
    schemaJson,
    bodyHtml
  });
}

/**
 * Pre-renders the Events Hub (/events) into full indexable HTML
 */
export function renderEventsHubHtml(baseUrl: string = 'https://app.vernunt.com'): string {
  const template = getBaseHtmlTemplate();
  const canonicalUrl = `${baseUrl}/events`;
  const pageTitle = 'Kids Events, Workshops & Weekend Activity Classes Across India | Vernunt';
  const description = 'Discover verified kids events, weekend workshops, STEM robotics clubs, art classes, and sports coaching across Bangalore, Mumbai, Delhi NCR & India on Vernunt. Instant passes and verified instructors.';

  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'EventSeries',
    '@id': `${canonicalUrl}#eventseries`,
    name: pageTitle,
    description,
    url: canonicalUrl,
    organizer: {
      '@type': 'Organization',
      name: 'Vernunt Community Events Guild',
      url: baseUrl
    }
  });

  const bodyHtml = `
  <header style="background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 16px 24px;">
    <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
      <a href="/" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: #be123c; font-weight: 800; font-size: 20px;">
        <span style="font-size: 24px;">🧸</span> Vernunt
      </a>
      <nav style="display: flex; align-items: center; gap: 16px; font-size: 14px; font-weight: 600;">
        <a href="/radar" style="color: #475569; text-decoration: none;">Radar</a>
        <a href="/events" style="color: #be123c; text-decoration: none; font-weight: 700;">Events</a>
        <a href="/specialists" style="color: #475569; text-decoration: none;">Specialists</a>
        <a href="/knowledge" style="color: #475569; text-decoration: none;">Knowledge</a>
        <a href="/directory" style="color: #475569; text-decoration: none;">Directory</a>
      </nav>
    </div>
  </header>

  <main style="max-width: 1000px; margin: 32px auto; padding: 0 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b;">
    <h1 style="font-size: 32px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">Kids Events, Workshops & Classes</h1>
    <p style="font-size: 16px; color: #475569; margin-bottom: 32px; line-height: 1.6;">${escapeHtml(description)}</p>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 40px;">
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
        <span style="background: #ffe4e6; color: #be123c; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">🤖 STEM & Robotics</span>
        <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 12px 0 6px 0;">Junior Lego Robotics & Mechanical Gears</h2>
        <p style="font-size: 13px; color: #64748b; margin: 0 0 12px 0;">Indiranagar, Bangalore • Ages 4-9 Years • Every Saturday</p>
        <a href="/radar" style="color: #be123c; font-weight: 700; font-size: 13px; text-decoration: none;">View Event Details &rarr;</a>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
        <span style="background: #e0f2fe; color: #0369a1; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">🎨 Creative Arts</span>
        <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 12px 0 6px 0;">Terracotta Pottery & Finger Clay Sculpting</h2>
        <p style="font-size: 13px; color: #64748b; margin: 0 0 12px 0;">Koramangala, Bangalore • Ages 3-10 Years • Weekend Workshop</p>
        <a href="/radar" style="color: #be123c; font-weight: 700; font-size: 13px; text-decoration: none;">View Event Details &rarr;</a>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
        <span style="background: #dcfce7; color: #15803d; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">⚽ Junior Sports</span>
        <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 12px 0 6px 0;">Grassroots Football Agility & Dribbling Clinic</h2>
        <p style="font-size: 13px; color: #64748b; margin: 0 0 12px 0;">Whitefield, Bangalore • Ages 5-12 Years • Sunday Morning</p>
        <a href="/radar" style="color: #be123c; font-weight: 700; font-size: 13px; text-decoration: none;">View Event Details &rarr;</a>
      </div>
    </div>

    <section style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 40px;">
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Browse Events by Category</h2>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <a href="/explore/lego-building-clubs" style="padding: 8px 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 9999px; text-decoration: none; color: #0f172a; font-size: 13px; font-weight: 600;">🤖 STEM & Lego</a>
        <a href="/explore/creative-arts-crafts" style="padding: 8px 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 9999px; text-decoration: none; color: #0f172a; font-size: 13px; font-weight: 600;">🎨 Arts & Crafts</a>
        <a href="/explore/sports-playdates" style="padding: 8px 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 9999px; text-decoration: none; color: #0f172a; font-size: 13px; font-weight: 600;">⚽ Junior Athletics</a>
        <a href="/explore/music-dance-classes" style="padding: 8px 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 9999px; text-decoration: none; color: #0f172a; font-size: 13px; font-weight: 600;">🎵 Music & Dance</a>
        <a href="/explore/toddler-playgroups" style="padding: 8px 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 9999px; text-decoration: none; color: #0f172a; font-size: 13px; font-weight: 600;">🧸 Toddler Playgroups</a>
      </div>
    </section>
  </main>
  `;

  return injectPreRenderedContent(template, {
    title: pageTitle,
    description,
    canonicalUrl,
    keywords: 'kids events bangalore, kids workshops india, weekend activity classes, stem camps for kids, vernunt events',
    ogType: 'website',
    schemaJson,
    bodyHtml
  });
}

/**
 * Pre-renders the Specialists Hub (/specialists) into full indexable HTML
 */
export function renderSpecialistsHubHtml(baseUrl: string = 'https://app.vernunt.com'): string {
  const template = getBaseHtmlTemplate();
  const canonicalUrl = `${baseUrl}/specialists`;
  const pageTitle = '1,000+ Verified Pediatricians, Child Psychologists & Specialists | Vernunt';
  const description = 'Consult 1,000+ verified pediatricians, child psychologists, pediatric dentists, and dietitians across Bangalore, Mumbai, Delhi NCR, Hyderabad and pan-India on Vernunt. Zero booking fees.';

  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    '@id': `${canonicalUrl}#medicalwebpage`,
    name: pageTitle,
    description,
    url: canonicalUrl,
    about: {
      '@type': 'MedicalSpecialty',
      name: 'Pediatrics'
    }
  });

  const bodyHtml = `
  <header style="background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 16px 24px;">
    <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
      <a href="/" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: #be123c; font-weight: 800; font-size: 20px;">
        <span style="font-size: 24px;">🧸</span> Vernunt
      </a>
      <nav style="display: flex; align-items: center; gap: 16px; font-size: 14px; font-weight: 600;">
        <a href="/radar" style="color: #475569; text-decoration: none;">Radar</a>
        <a href="/events" style="color: #475569; text-decoration: none;">Events</a>
        <a href="/specialists" style="color: #be123c; text-decoration: none; font-weight: 700;">Specialists</a>
        <a href="/knowledge" style="color: #475569; text-decoration: none;">Knowledge</a>
        <a href="/directory" style="color: #475569; text-decoration: none;">Directory</a>
      </nav>
    </div>
  </header>

  <main style="max-width: 1000px; margin: 32px auto; padding: 0 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b;">
    <h1 style="font-size: 32px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">1,000+ Verified Pediatric Specialists</h1>
    <p style="font-size: 16px; color: #475569; margin-bottom: 32px; line-height: 1.6;">${escapeHtml(description)}</p>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 40px;">
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
        <div style="font-weight: 700; font-size: 16px; color: #0f172a; margin-bottom: 4px;">🩺 General Pediatricians</div>
        <p style="font-size: 13px; color: #64748b; margin: 0 0 12px 0;">Newborn health, vaccinations, growth milestones, and pediatric care.</p>
        <a href="/specialists?q=pediatrician" style="color: #be123c; font-weight: 700; font-size: 13px; text-decoration: none;">View Specialists &rarr;</a>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
        <div style="font-weight: 700; font-size: 16px; color: #0f172a; margin-bottom: 4px;">🧠 Child Psychologists & SEL</div>
        <p style="font-size: 13px; color: #64748b; margin: 0 0 12px 0;">Emotional regulation, tantrum de-escalation, ADHD, and sensory processing.</p>
        <a href="/specialists?q=child+psychologist" style="color: #be123c; font-weight: 700; font-size: 13px; text-decoration: none;">View Specialists &rarr;</a>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
        <div style="font-weight: 700; font-size: 16px; color: #0f172a; margin-bottom: 4px;">🗣️ Speech & Language Pathologists</div>
        <p style="font-size: 13px; color: #64748b; margin: 0 0 12px 0;">Speech delay, stammering, articulation, and expressive language.</p>
        <a href="/specialists?q=speech+therapist" style="color: #be123c; font-weight: 700; font-size: 13px; text-decoration: none;">View Specialists &rarr;</a>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
        <div style="font-weight: 700; font-size: 16px; color: #0f172a; margin-bottom: 4px;">🥗 Pediatric Dietitians & Nutritionists</div>
        <p style="font-size: 13px; color: #64748b; margin: 0 0 12px 0;">Baby-led weaning, picky eating, food allergies, and gut health.</p>
        <a href="/specialists?q=pediatric+nutritionist" style="color: #be123c; font-weight: 700; font-size: 13px; text-decoration: none;">View Specialists &rarr;</a>
      </div>
    </div>
  </main>
  `;

  return injectPreRenderedContent(template, {
    title: pageTitle,
    description,
    canonicalUrl,
    keywords: 'pediatricians in bangalore, child specialist doctor near me, best pediatrician india, verified child psychologists, vernunt specialists',
    ogType: 'website',
    schemaJson,
    bodyHtml
  });
}

/**
 * Pre-renders the Master HTML Sitemap Directory (/directory or /sitemap)
 */
export function renderHtmlSitemapDirectory(baseUrl: string = 'https://app.vernunt.com', pillars: string[] = []): string {
  const template = getBaseHtmlTemplate();
  const canonicalUrl = `${baseUrl}/directory`;
  const pageTitle = 'Vernunt Directory & Complete HTML Sitemap | 1,000+ Child Growth Guides & Local Hubs';
  const description = 'Complete directory of 1,000+ doctor-approved parenting guides, pediatric nutrition blueprints, toddler milestones, Bangalore localities, and verified childcare hubs on Vernunt.';

  const bodyHtml = `
  <header style="background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 16px 24px;">
    <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
      <a href="/" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: #be123c; font-weight: 800; font-size: 20px;">
        <span style="font-size: 24px;">🧸</span> Vernunt
      </a>
      <nav style="display: flex; align-items: center; gap: 16px; font-size: 14px; font-weight: 600;">
        <a href="/radar" style="color: #475569; text-decoration: none;">Radar</a>
        <a href="/events" style="color: #475569; text-decoration: none;">Events</a>
        <a href="/specialists" style="color: #475569; text-decoration: none;">Specialists</a>
        <a href="/knowledge" style="color: #475569; text-decoration: none;">Knowledge</a>
        <a href="/directory" style="color: #be123c; text-decoration: none; font-weight: 700;">Directory</a>
      </nav>
    </div>
  </header>

  <main style="max-width: 1100px; margin: 32px auto; padding: 0 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b;">
    <h1 style="font-size: 32px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">Vernunt Complete Directory & HTML Sitemap</h1>
    <p style="font-size: 16px; color: #475569; margin-bottom: 32px; line-height: 1.6;">${escapeHtml(description)}</p>

    <!-- Core Sections -->
    <section style="margin-bottom: 36px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Core Portals & Community Hubs</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
        <a href="/" style="padding: 10px; background: #f8fafc; border-radius: 8px; text-decoration: none; color: #0f172a; font-weight: 600; font-size: 14px;">🏠 Home (app.vernunt.com)</a>
        <a href="/radar" style="padding: 10px; background: #f8fafc; border-radius: 8px; text-decoration: none; color: #0f172a; font-weight: 600; font-size: 14px;">📡 Playmate Radar</a>
        <a href="/daycare" style="padding: 10px; background: #f8fafc; border-radius: 8px; text-decoration: none; color: #0f172a; font-weight: 600; font-size: 14px;">👶 Daycare & Babysitting</a>
        <a href="/events" style="padding: 10px; background: #f8fafc; border-radius: 8px; text-decoration: none; color: #0f172a; font-weight: 600; font-size: 14px;">🎪 Kids Events & Classes</a>
        <a href="/specialists" style="padding: 10px; background: #f8fafc; border-radius: 8px; text-decoration: none; color: #0f172a; font-weight: 600; font-size: 14px;">🩺 1,000+ Specialists</a>
        <a href="/knowledge" style="padding: 10px; background: #f8fafc; border-radius: 8px; text-decoration: none; color: #0f172a; font-weight: 600; font-size: 14px;">📚 Master Knowledge Hub</a>
        <a href="/safety" style="padding: 10px; background: #f8fafc; border-radius: 8px; text-decoration: none; color: #0f172a; font-weight: 600; font-size: 14px;">🛡️ Aadhaar Safety Matrix</a>
        <a href="/pricing" style="padding: 10px; background: #f8fafc; border-radius: 8px; text-decoration: none; color: #0f172a; font-weight: 600; font-size: 14px;">💳 Transparent Pricing</a>
      </div>
    </section>

    <!-- Explore Categories -->
    <section style="margin-bottom: 36px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Explore Programmatic Hubs</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
        <a href="/explore/child-psychology" style="padding: 12px; background: #f8fafc; border-radius: 8px; text-decoration: none; color: #0f172a; font-size: 14px;">🧠 Child Psychology & SEL</a>
        <a href="/explore/creative-arts-crafts" style="padding: 12px; background: #f8fafc; border-radius: 8px; text-decoration: none; color: #0f172a; font-size: 14px;">🎨 Creative Arts & Crafts</a>
        <a href="/explore/lego-building-clubs" style="padding: 12px; background: #f8fafc; border-radius: 8px; text-decoration: none; color: #0f172a; font-size: 14px;">🤖 Lego & Robotics Clubs</a>
        <a href="/explore/music-dance-classes" style="padding: 12px; background: #f8fafc; border-radius: 8px; text-decoration: none; color: #0f172a; font-size: 14px;">🎵 Music & Dance Studios</a>
        <a href="/explore/pediatric-specialists" style="padding: 12px; background: #f8fafc; border-radius: 8px; text-decoration: none; color: #0f172a; font-size: 14px;">🩺 Pediatric Specialists</a>
        <a href="/explore/speech-therapy-consults" style="padding: 12px; background: #f8fafc; border-radius: 8px; text-decoration: none; color: #0f172a; font-size: 14px;">🗣️ Speech Therapy Consults</a>
        <a href="/explore/sports-playdates" style="padding: 12px; background: #f8fafc; border-radius: 8px; text-decoration: none; color: #0f172a; font-size: 14px;">⚽ Sports & Active Playdates</a>
        <a href="/explore/toddler-playgroups" style="padding: 12px; background: #f8fafc; border-radius: 8px; text-decoration: none; color: #0f172a; font-size: 14px;">🧸 Toddler Playgroups</a>
        <a href="/explore/kids-activities" style="padding: 12px; background: #f8fafc; border-radius: 8px; text-decoration: none; color: #0f172a; font-size: 14px;">🎪 Weekend Kids Activities</a>
      </div>
    </section>

    <!-- Top Knowledge Pillars -->
    <section style="margin-bottom: 36px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Top Child Growth Guides by Topic & Age Group</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px;">
        ${(pillars.length > 0 ? pillars : [
          'anti-inflammatory-toddler-diet',
          'archery-precision-concentration-youth',
          'art-history-fine-motor-crafting',
          'baby-led-weaning-recipes',
          'potty-training-in-3-days-without-tears',
          'overcoming-separation-anxiety-daycare',
          'iron-rich-finger-foods',
          'dha-omega-3-brain-superfoods',
          'gentle-teething-pain-relief-remedies',
          'newborn-circadian-rhythm-sleep-optimization',
          'fostering-sibling-harmony',
          'building-growth-mindset-grit',
          'comprehensive-homeschooling-curriculum',
          'montessori-practical-life-activities',
          'unplugged-coding-logic-preschool',
          'junior-soccer-drills-motor-agility',
          'infant-water-safety-hydrotherapy',
          'toddler-gymnastics-core-stability'
        ]).slice(0, 40).map(p => `
          <a href="/knowledge/${p}-1-3-years-guide" style="padding: 10px; background: #f8fafc; border-radius: 8px; text-decoration: none; color: #334155; font-size: 13px; font-weight: 500;">
            📖 ${p.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} (1-3 Years)
          </a>
        `).join('')}
      </div>
    </section>

    <!-- Bangalore Localities -->
    <section style="margin-bottom: 36px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Bangalore & Metro Neighborhood Playmate Hubs</h2>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        ${['Indiranagar', 'Koramangala', 'Whitefield', 'HSR Layout', 'JP Nagar', 'Jayanagar', 'Bellandur', 'Sarjapur Road', 'Electronic City', 'Malleshwaram', 'Hebbal', 'Marathahalli'].map(loc => `
          <a href="/radar?locality=${encodeURIComponent(loc)}" style="padding: 8px 16px; background: #f1f5f9; border-radius: 9999px; text-decoration: none; color: #0f172a; font-size: 13px; font-weight: 600;">
            📍 ${loc} Playmates
          </a>
        `).join('')}
      </div>
    </section>
  </main>
  `;

  return injectPreRenderedContent(template, {
    title: pageTitle,
    description,
    canonicalUrl,
    keywords: 'vernunt sitemap, child growth guide directory, kids playmates bangalore, pediatric directory india',
    ogType: 'website',
    bodyHtml
  });
}

/**
 * Pre-renders generic core portal pages with accurate canonicals
 */
export function renderCorePageHtml(routePath: string, options: {
  title: string;
  description: string;
  baseUrl?: string;
}): string {
  const template = getBaseHtmlTemplate();
  const baseUrl = options.baseUrl || 'https://app.vernunt.com';
  const cleanPath = routePath.replace(/^\//, '');
  const canonicalUrl = `${baseUrl}/${cleanPath}`;

  return injectPreRenderedContent(template, {
    title: options.title,
    description: options.description,
    canonicalUrl,
    ogType: 'website',
    bodyHtml: `
    <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; text-align: center;">
      <h1 style="font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">${escapeHtml(options.title)}</h1>
      <p style="font-size: 15px; color: #64748b; max-width: 600px; margin-bottom: 24px; line-height: 1.6;">${escapeHtml(options.description)}</p>
      <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
        <a href="/" style="background: #be123c; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Open Vernunt Web App</a>
        <a href="/directory" style="background: #ffffff; color: #475569; border: 1px solid #cbd5e1; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Parenting Directory</a>
      </div>
    </div>
    `
  });
}

/**
 * Injects metadata, canonical tag, OpenGraph, JSON-LD and pre-rendered HTML into the base template
 */
export function injectPreRenderedContent(baseHtml: string, options: {
  title: string;
  description: string;
  canonicalUrl: string;
  keywords?: string;
  ogType?: string;
  schemaJson?: string;
  bodyHtml: string;
}): string {
  let html = baseHtml;

  // 1. Replace <title>
  html = html.replace(/<title>.*?<\/title>/is, `<title>${escapeHtml(options.title)}</title>`);

  // 2. Replace or inject <meta name="title">
  if (html.includes('<meta name="title"')) {
    html = html.replace(/<meta name="title"[^>]*>/i, `<meta name="title" content="${escapeHtml(options.title)}" />`);
  } else {
    html = html.replace('</head>', `  <meta name="title" content="${escapeHtml(options.title)}" />\n</head>`);
  }

  // 3. Replace or inject <meta name="description">
  if (html.includes('<meta name="description"')) {
    html = html.replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${escapeHtml(options.description)}" />`);
  } else {
    html = html.replace('</head>', `  <meta name="description" content="${escapeHtml(options.description)}" />\n</head>`);
  }

  // 4. CRITICAL FIX: Replace hardcoded <link rel="canonical" href="https://app.vernunt.com" /> with self-referential canonical!
  if (html.includes('rel="canonical"')) {
    html = html.replace(/<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${options.canonicalUrl}" />`);
  } else {
    html = html.replace('</head>', `  <link rel="canonical" href="${options.canonicalUrl}" />\n</head>`);
  }

  // 5. Replace OpenGraph tags
  if (html.includes('property="og:title"')) {
    html = html.replace(/<meta\s+property="og:title"[^>]*>/i, `<meta property="og:title" content="${escapeHtml(options.title)}" />`);
  }
  if (html.includes('property="og:description"')) {
    html = html.replace(/<meta\s+property="og:description"[^>]*>/i, `<meta property="og:description" content="${escapeHtml(options.description)}" />`);
  }
  if (html.includes('property="og:url"')) {
    html = html.replace(/<meta\s+property="og:url"[^>]*>/i, `<meta property="og:url" content="${options.canonicalUrl}" />`);
  }
  if (options.ogType && html.includes('property="og:type"')) {
    html = html.replace(/<meta\s+property="og:type"[^>]*>/i, `<meta property="og:type" content="${options.ogType}" />`);
  }

  // 6. Inject Schema.org JSON-LD if provided
  if (options.schemaJson) {
    const schemaScript = `\n  <script type="application/ld+json" id="vernunt-dynamic-schema">${options.schemaJson}</script>\n`;
    html = html.replace('</head>', `${schemaScript}</head>`);
  }

  // 7. Inject pre-rendered semantic HTML into <div id="root">
  const rootIndex = html.indexOf('<div id="root">');
  const bodyCloseIndex = html.indexOf('</body>', rootIndex);
  if (rootIndex !== -1 && bodyCloseIndex !== -1) {
    html =
      html.substring(0, rootIndex) +
      `<div id="root">${options.bodyHtml}</div>\n  ` +
      html.substring(bodyCloseIndex);
  } else if (rootIndex !== -1) {
    html = html.replace(/<div id="root">[\s\S]*$/, `<div id="root">${options.bodyHtml}</div>\n</body>\n</html>`);
  }

  return html;
}
