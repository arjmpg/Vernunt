import type { LucideIcon } from 'lucide-react';

export interface InfluencerSpotlight {
  name: string;
  instagramHandle: string; // e.g. "@bangalore_mommy_diaries"
  instagramUrl?: string; // e.g. "https://instagram.com/bangalore_mommy_diaries"
  avatarUrl?: string;
  bio: string;
  followersCount?: string; // e.g. "28.5K"
  badgeLabel?: string; // e.g. "Verified Community Ambassador"
  location?: string;
}

export interface KnowledgeArticle {
  slug: string;
  title: string;
  category: 'Nutrition' | 'Psychology' | 'Education' | 'Sports' | 'Care' | 'Future' | 'Parenting & Play' | string;
  categoryLabel: string;
  ageGroup: '0-12 Months' | '1-3 Years' | '4-6 Years' | '7-10 Years' | '11-14 Years' | 'All Ages' | string;
  readTime: string;
  summary: string;
  keywords: string[];
  publishedDate: string;
  coverImageUrl?: string;
  status?: 'Published' | 'Draft';
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  influencerSpotlight?: InfluencerSpotlight;
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

export interface KnowledgeCategoryMeta {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  topicCount: number;
}

export const KNOWLEDGE_CATEGORIES: KnowledgeCategoryMeta[] = [
  {
    id: 'Nutrition',
    name: 'Baby & Child Nutrition',
    icon: '🍎',
    color: 'emerald',
    description: 'Brain-boosting foods, baby-led weaning recipes, balanced macro diets, and solving picky eating.',
    topicCount: 220
  },
  {
    id: 'Psychology',
    name: 'Child Psychology & SEL',
    icon: '🧠',
    color: 'indigo',
    description: 'Emotional regulation, tantrum decoding, separation anxiety, social confidence, and positive parenting.',
    topicCount: 240
  },
  {
    id: 'Education',
    name: 'Homeschooling & Education',
    icon: '📚',
    color: 'amber',
    description: 'Future-ready homeschooling blueprints, early STEM coding, Montessori routines, and cognitive skills.',
    topicCount: 260
  },
  {
    id: 'Sports',
    name: 'Baby & Junior Sports',
    icon: '⚽',
    color: 'rose',
    description: 'Gross motor milestones, infant water confidence, gymnastics balance, and youth team athletics.',
    topicCount: 180
  },
  {
    id: 'Care',
    name: 'Newborn & Infant Care',
    icon: '🍼',
    color: 'sky',
    description: 'Pediatric sleep cycles, natural immunity, speech development checklists, and baby health routines.',
    topicCount: 160
  },
  {
    id: 'Future',
    name: 'AI Era & Life Skills',
    icon: '🚀',
    color: 'purple',
    description: 'Financial literacy for kids, AI literacy, creative problem solving, and screen-time mastery.',
    topicCount: 140
  }
];

// High-impact flagship encyclopedic articles
export const FLAGSHIP_KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    slug: 'screen-free-sensory-playdate-guide-bangalore-mommy',
    title: '10 Screen-Free Sensory Playdate Setups That Keep Kids Engaged for Hours',
    category: 'Parenting & Play',
    categoryLabel: 'Parenting & Playdates',
    ageGroup: '2-6 Years',
    readTime: '5 min read',
    summary: 'Curated by Bangalore\'s top parenting creator @bangalore_mommy_diaries. Discover tactile sensory bins, cooperative Montessori STEM challenges, and easy cleanup recipes for apartment playdates.',
    keywords: ['screen free play', 'sensory bins', 'toddler playdates', 'montessori activities', 'apartment games kids', 'bangalore parenting'],
    publishedDate: '2026-08-28',
    coverImageUrl: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&auto=format&fit=crop&q=80',
    status: 'Published',
    author: {
      name: 'Priya Sharma (@bangalore_mommy_diaries)',
      role: 'Featured Parenting Creator & Montessori Mom of 2',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
    },
    influencerSpotlight: {
      name: 'Priya Sharma',
      instagramHandle: '@bangalore_mommy_diaries',
      instagramUrl: 'https://instagram.com/bangalore_mommy_diaries',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
      bio: 'Mom of 2, Montessori certified educator, and Bangalore community playdate advocate. Sharing realistic parenting hacks and screen-free developmental play setups for modern apartment families.',
      followersCount: '48.2K Followers',
      badgeLabel: '⭐ Verified Founding Ambassador',
      location: 'Whitefield, Bangalore'
    },
    tableOfContents: [
      'The Power of Tactical Sensory Play',
      '1. Colored Rice & Wooden Spoon Sorting Bin',
      '2. Kitchen Baking Soda & Vinegar Volcano Lab',
      '3. Nature Scavenger Hunt & Leaf Printing',
      '4. DIY Scented Cloud Dough (Zero Toxin)',
      '5. Cooperative Cardboard Fort Engineering',
      'How to Host a Zero-Stress Apartment Playdate',
      'Frequently Asked Questions'
    ],
    content: {
      overview: 'Replacing passive tablet screens with high-tactile sensory play fosters dopamine regulation, prolonged focus spans, and natural social problem solving between children. Here are five low-prep, high-engagement setups you can prepare in 5 minutes.',
      keyTakeaways: [
        'Sensory play strengthens fine motor pinch-grips needed for early handwriting.',
        'Shared bin play naturally teaches children non-verbal turn-taking and conflict resolution.',
        'Using kitchen staples (flour, rice, vinegar) keeps setups 100% non-toxic and cost-free.'
      ],
      deepDiveSections: [
        {
          heading: '1. Colored Rice & Wooden Spoon Sorting Bin',
          body: [
            'Dye 1kg of raw rice with 2 drops of food coloring and a teaspoon of white vinegar. Once dry, pour into a wide shallow storage container with measuring cups, funnel cones, and hidden toy figurines.',
            'Children will happily scoop, transfer, and sort colors for 45+ minutes in focused silence or collaborative conversation.'
          ],
          proTip: 'Place a large bedsheet or yoga mat underneath the sensory tray for a 10-second cleanup!'
        },
        {
          heading: '2. Kitchen Baking Soda & Vinegar Volcano Lab',
          body: [
            'Fill muffin tins with baking soda drops mixed with food coloring. Hand kids droppers or small syringes filled with vinegar.',
            'The instant bubbling reaction sparks excitement, scientific curiosity, and sensory exploration.'
          ],
          warningOrAlert: 'Use gentle white vinegar and ensure kids wear playful chef goggles if they are prone to rubbing their eyes.'
        },
        {
          heading: '3. DIY Scented Cloud Dough (Zero Toxin)',
          body: [
            'Mix 4 cups of whole wheat flour with 1/2 cup of melted coconut oil and a drop of vanilla or lavender extract. The resulting dough is super soft, moldable like wet sand, and completely edible-safe.'
          ]
        }
      ],
      actionableSteps: [
        'Save delivery cardboard boxes for Friday afternoon collaborative box painting.',
        'Create a dedicated "Sensory Caddy" with tongs, measuring spoons, and plastic tweezers.',
        'Coordinate with nearby Vernunt playmates to rotate hosting duties every Saturday.'
      ],
      faq: [
        {
          question: 'What age group is best for sensory playdates?',
          answer: 'Sensory bins are loved by toddlers as young as 18 months all the way to 8-year-olds when combined with STEM challenges.'
        },
        {
          question: 'How do you prevent sibling fighting over sensory tools?',
          answer: 'Provide duplicate scoops/tongs and designate individual "baking stations" using cafeteria trays.'
        }
      ]
    }
  },
  {
    slug: 'brain-boosting-foods-for-toddlers-neurodevelopment',
    title: 'Top 12 Brain-Boosting Superfoods for Toddlers: The Neurodevelopment Guide',
    category: 'Nutrition',
    categoryLabel: 'Baby & Child Nutrition',
    ageGroup: '1-3 Years',
    readTime: '6 min read',
    summary: 'Clinical nutritionist insights on DHA omega-3s, choline, iron, and antioxidant-rich foods that accelerate synaptic pruning and cognitive speed in early childhood.',
    keywords: ['baby nutrition', 'toddler brain foods', 'DHA for kids', 'omega 3 for babies', 'iron rich foods toddler', 'healthy baby snacks'],
    publishedDate: '2026-08-15',
    author: {
      name: 'Dr. Ananya Roy, MD',
      role: 'Pediatric Nutritionist & Fellow of Child Wellness',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80'
    },
    tableOfContents: [
      'The Synaptic Growth Window (Ages 1-3)',
      '1. Avocados: The Healthy Monounsaturated Fat Powerhouse',
      '2. Pasture-Raised Eggs: Choline & Lutein for Memory',
      '3. Wild Salmon & Marine Microalgae: Pure DHA Matrix',
      '4. Walnuts & Flaxseed Purees: Plant Omega-3 ALA',
      '5. Dark Leafy Greens & Berries: Antioxidant Neural Shields',
      'Daily 7-Day Brain Meal Matrix for Busy Parents',
      'Frequently Asked Questions'
    ],
    content: {
      overview: 'During the first 1,000 days of life, a child\'s brain creates over 1 million new neural connections every single second. Providing dense bioavailable nutrients during this pivotal window creates permanent cognitive and emotional scaffolding.',
      keyTakeaways: [
        'DHA constitutes over 60% of the structural fat in the human retina and cerebral cortex.',
        'Iron deficiency in toddlers is the #1 cause of preventable attention fatigue and delayed processing.',
        'Choline in egg yolks directly enhances hippocampal neurogenesis (the memory center).'
      ],
      deepDiveSections: [
        {
          heading: '1. Avocados: The Healthy Monounsaturated Fat Powerhouse',
          body: [
            'Avocados provide essential oleic acid, which strengthens myelin sheaths—the protective insulation around nerves that accelerates information transfer in developing brains.',
            'Mash half an avocado with a pinch of cumin or spread over whole-grain sourdough toast for a nutrient-dense breakfast.'
          ],
          proTip: 'Pair avocado with citrus (lemon or sweet lime) to boost absorption of carotenoids and prevent browning!'
        },
        {
          heading: '2. Pasture-Raised Eggs: Choline & Lutein for Memory',
          body: [
            'One single egg yolk delivers nearly 125mg of choline, fulfilling almost 70% of a 2-year-old\'s daily recommended intake.',
            'Lutein in eggs concentrates in the macula and fronto-parietal brain regions, supporting visual tracking during early reading and spatial play.'
          ],
          warningOrAlert: 'Always cook egg yolks thoroughly until firm when introducing to infants under 12 months.'
        },
        {
          heading: '3. Wild Salmon & Marine Microalgae: Pure DHA Matrix',
          body: [
            'Marine DHA cannot be synthesized efficiently from plant seeds alone (which convert ALA at under 5%). Including low-mercury wild salmon twice weekly promotes deep non-REM sleep and emotional calmness.'
          ]
        }
      ],
      actionableSteps: [
        'Add 1 teaspoon of ground chia or flaxseed to morning warm porridge.',
        'Replace processed seed oils with pure cold-pressed extra virgin olive oil or ghee.',
        'Offer colorful berries with full-fat Greek yogurt as an afternoon sensory finger food.'
      ],
      faq: [
        {
          question: 'When should I start introducing solid brain foods?',
          answer: 'At 6 months of age, once baby shows sitting stability, loss of tongue-thrust reflex, and curious grasping.'
        },
        {
          question: 'What if my child has a severe nut allergy?',
          answer: 'Hemp hearts and pumpkin seed butter offer identical amino acid profiles and zinc density without tree nut allergens.'
        }
      ]
    }
  },
  {
    slug: 'homeschooling-future-stem-ai-era-curriculum',
    title: 'Homeschooling in the AI Era: Building a Resilient Future-Ready Curriculum',
    category: 'Education',
    categoryLabel: 'Homeschooling & Education',
    ageGroup: '4-6 Years',
    readTime: '8 min read',
    summary: 'How forward-thinking parents are combining hands-on Montessori tactile exploration, foundational computational thinking, and project-based homeschooling.',
    keywords: ['homeschooling curriculum', 'future of education', 'ai for kids', 'stem homeschooling', 'montessori home setup', 'early coding for children'],
    publishedDate: '2026-08-16',
    author: {
      name: 'Pooja Venkatesh, M.Ed',
      role: 'Curriculum Architect & Alternative Learning Specialist',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    tableOfContents: [
      'Why Traditional Rote Learning Fails the AI Future',
      'The 4 Pillars of Future-Proof Childhood Education',
      'Montessori Practical Life meets Computational Logic',
      'Creating a Screen-Light Hands-On Maker Nook',
      'Daily 3-Hour Flow: Sample Homeschool Schedule',
      'Socialization & Co-op Playdates Strategy'
    ],
    content: {
      overview: 'As artificial intelligence automates repetitive information retrieval, the true high-value human capabilities are divergent creativity, emotional empathy, physical agility, and systemic problem-solving.',
      keyTakeaways: [
        'Computational thinking starts with tangible patterns, sequencing physical cards, and block construction—not screens.',
        'Homeschooled children benefit immensely from 3-4 structured multi-family neighborhood playdates weekly.',
        'Intrinsic curiosity is preserved by letting children master self-chosen deep dives.'
      ],
      deepDiveSections: [
        {
          heading: 'Montessori Practical Life meets Computational Logic',
          body: [
            'Before writing code, young minds need algorithmic thinking: if-then conditions, looping repetitions, and debugging failed attempts.',
            'Baking bread, building marble runs, and classifying garden leaves teach variable states and physical geometry far better than digital tablets.'
          ],
          proTip: 'Use wooden dominoes and cardboard ramps to demonstrate chain reactions and causal logic.'
        },
        {
          heading: 'Creating a Screen-Light Hands-On Maker Nook',
          body: [
            'Designate a low wooden table with accessible bins: recycled paper tubes, safe child scissors, measuring tapes, magnifying glasses, and clay.',
            'Give children open challenges: "Can you build a bridge spanning 30 centimeters that can hold two heavy apples?"'
          ]
        }
      ],
      actionableSteps: [
        'Designate a 90-minute morning deep-focus block with zero electronic interruptions.',
        'Form a local 4-family learning co-op for shared science experiments and group sports.',
        'Track progress via portfolio journals and photographs rather than numeric letter grades.'
      ],
      faq: [
        {
          question: 'Is homeschooling recognized for university admissions in India and abroad?',
          answer: 'Yes, NIOS (National Institute of Open Schooling) and international Cambridge/IGCSE private candidate pathways are accepted by all premier global universities.'
        }
      ]
    }
  },
  {
    slug: 'child-psychology-decoding-toddler-tantrums-emotional-regulation',
    title: 'Decoding Toddler Meltdowns: The Neuro-Psychology of Big Feelings',
    category: 'Psychology',
    categoryLabel: 'Child Psychology & SEL',
    ageGroup: '1-3 Years',
    readTime: '7 min read',
    summary: 'Discover what occurs inside a child\'s developing amygdala during sensory overload, and learn the 3-step co-regulation method used by pediatric psychologists.',
    keywords: ['toddler tantrums', 'child psychology', 'emotional regulation kids', 'positive discipline', 'co-regulation parenting', 'calming big feelings'],
    publishedDate: '2026-08-14',
    author: {
      name: 'Dr. Siddharth Mehta, Ph.D.',
      role: 'Clinical Child Psychologist & Author',
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80'
    },
    tableOfContents: [
      'The Amygdala Hijack: Why Logic Does Not Work Mid-Tantrum',
      'The 3-Step Co-Regulation Framework',
      'De-escalation Language: Exact Scripts for High Stress',
      'Preventing Overstimulation in Public Spaces',
      'Repairing the Connection Post-Meltdown'
    ],
    content: {
      overview: 'A tantrum is not defiance or manipulation; it is a neurological SOS when an immature prefrontal cortex is flooded with sensory and emotional input it cannot yet process.',
      keyTakeaways: [
        'Children cannot access logic when their nervous system is in sympathetic fight-or-flight mode.',
        'A calm adult nervous system is the biological anchor for a child\'s dysregulated nervous system.',
        'Never demand an apology or enforce timeouts while cortisol levels remain elevated.'
      ],
      deepDiveSections: [
        {
          heading: 'The 3-Step Co-Regulation Framework',
          body: [
            'Step 1: Physical Safety & Space. Lower your physical height to eye level, keep posture soft, and maintain a quiet protective radius.',
            'Step 2: Name the Emotion without judgment ("You are feeling really frustrated that park time is over. It is hard to leave fun places.").',
            'Step 3: Offer Sensory Grounding (deep rhythmic breathing, offering a firm embrace, or handing a cool sip of water).'
          ],
          proTip: 'Speak in 3-to-4 word phrases maximum during peak distress. Complex sentences overwhelm an auditory-compromised brain.'
        }
      ],
      actionableSteps: [
        'Create a "Calm Corner" at home with plush floor cushions, sensory squish balls, and emotion illustration cards.',
        'Practice deep "Dragon Breaths" (inhale through nose, slow long exhale through lips) when both parent and child are calm.',
        'Provide 5-minute and 2-minute verbal countdown warnings before any major play transition.'
      ],
      faq: [
        {
          question: 'How long should a typical toddler meltdown last?',
          answer: 'Most acute meltdowns peak within 4 to 8 minutes. If episodes routinely exceed 25 minutes or involve self-harm, consult a pediatric behavioral specialist.'
        }
      ]
    }
  },
  {
    slug: 'infant-swimming-gross-motor-milestones-baby-athletics',
    title: 'Infant Water Safety & Early Gross Motor Milestones: The Baby Sports Guide',
    category: 'Sports',
    categoryLabel: 'Baby & Junior Sports',
    ageGroup: '0-12 Months',
    readTime: '5 min read',
    summary: 'How gentle hydrotherapy, vestibular stimulation, and early infant swimming foster spatial orientation, bilateral coordination, and deep respiratory stamina.',
    keywords: ['infant swimming', 'baby sports', 'gross motor skills', 'toddler balance exercises', 'water safety for babies', 'vestibular development'],
    publishedDate: '2026-08-13',
    author: {
      name: 'Coach Vikram Rathore',
      role: 'Certified Aquatics Specialist & Youth Athletic Director',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    tableOfContents: [
      'The Hydro-Vestibular Advantage for Infants',
      'Safe Age Windows for First Pool Entries',
      '3 Foundational Water Acclimatization Exercises',
      'Dry-Land Tummy Time Drills to Build Neck & Core Power',
      'Crucial Pool Safety Standards & Ear Health'
    ],
    content: {
      overview: 'Water provides 360-degree buoyant resistance, allowing infants to build bilateral motor symmetry and activate core stabilizing muscles months before they can walk independently.',
      keyTakeaways: [
        'Water buoyancy relieves spinal gravity, boosting neuromuscular mapping.',
        'Infant swimming accelerates the development of reciprocal kicking and arm coordination.',
        'Never use neck flotation rings; use hand-supported holds and certified chest floats.'
      ],
      deepDiveSections: [
        {
          heading: '3 Foundational Water Acclimatization Exercises',
          body: [
            '1. The Mirror Float: Hold baby securely facing you with water at chest level, singing rhythmic nursery melodies.',
            '2. The Gentle Wave: Move baby smoothly through warm water (32°C/90°F) to stimulate vestibular balance receptors in the inner ear.',
            '3. Cup Pouring Trickles: Pour warm water gently over shoulders and chest to build sensory comfort.'
          ],
          warningOrAlert: 'Maintain constant 100% "Touch Supervision" within arm\'s reach at all times in any aquatic environment.'
        }
      ],
      actionableSteps: [
        'Ensure pool water temperature is heated between 31°C - 33°C for babies under 12 months.',
        'Keep initial pool sessions capped at 15-20 minutes to prevent hypothermia and sensory fatigue.',
        'Dry ears thoroughly with a soft cotton towel immediately following water play.'
      ],
      faq: [
        {
          question: 'Can babies swim before their first vaccinations?',
          answer: 'Most pediatricians recommend waiting until the 2-month or 4-month vaccination milestones before entering public chlorinated pools.'
        }
      ]
    }
  },
  {
    slug: 'pediatric-sleep-routines-circadian-rhythm-infant-health',
    title: 'Optimizing Infant Circadian Biology: The Science of Restful Pediatric Sleep',
    category: 'Care',
    categoryLabel: 'Newborn & Infant Care',
    ageGroup: '0-12 Months',
    readTime: '6 min read',
    summary: 'Master wake windows, natural morning sunlight exposure, melatonin triggers, and non-extinction gentle sleep shaping methods.',
    keywords: ['baby sleep routine', 'infant circadian rhythm', 'wake windows chart', 'newborn sleep tips', 'gentle sleep training', 'baby care guide'],
    publishedDate: '2026-08-12',
    author: {
      name: 'Dr. Meera Nambiar',
      role: 'Pediatric Sleep Physician & Neonatologist',
      avatar: 'https://images.unsplash.com/photo-1594824813589-2e90c88bc61b?w=150&auto=format&fit=crop&q=80'
    },
    tableOfContents: [
      'Understanding the 24-Hour Circadian Biological Clock',
      'Age-by-Age Wake Window Optimization Chart',
      'The Power of Morning Indirect Sunlight (7:00 AM - 8:30 AM)',
      'The 4-Step Wind-Down Rhythm',
      'Safe Sleep (AAP Gold Standards) Checklist'
    ],
    content: {
      overview: 'Infants are born without a consolidated circadian rhythm. By synchronizing environmental photoperiods (light vs. dark) and feeding cues, families can establish predictable, restful sleep patterns naturally.',
      keyTakeaways: [
        'Overtired babies produce cortisol and adrenaline, making falling asleep 3x more difficult.',
        'Morning sunlight sets the pineal gland timer for natural melatonin release 12 hours later.',
        'Room temperature should remain between 20°C - 22°C with 50% humidity for optimal airway comfort.'
      ],
      deepDiveSections: [
        {
          heading: 'The 4-Step Wind-Down Rhythm',
          body: [
            '1. Warm rinse or gentle sponge bath to trigger vasodilation and subsequent core body temperature cooling.',
            '2. Dim lighting (warm amber light under 2700K with zero blue screens).',
            '3. Rhythmic infant massage using cold-pressed sweet almond or coconut oil.',
            '4. White noise sound machine positioned 2 meters away from the crib at under 60 decibels.'
          ]
        }
      ],
      actionableSteps: [
        'Take baby outdoors for 15 minutes of indirect morning daylight before 9:00 AM daily.',
        'Keep daytime nap rooms moderately bright and nighttime rooms pitch dark.',
        'Follow the ABCs of safe sleep: Alone, on their Back, in an uncluttered Crib.'
      ],
      faq: [
        {
          question: 'When do babies naturally start producing their own melatonin?',
          answer: 'Around 8 to 12 weeks of age, corresponding with the disappearance of day-night confusion.'
        }
      ]
    }
  },
  {
    slug: 'financial-literacy-for-kids-ai-economy-life-skills',
    title: 'Teaching Kids Practical Financial & AI Literacy: The 10-Year Roadmap',
    category: 'Future',
    categoryLabel: 'AI Era & Life Skills',
    ageGroup: '7-10 Years',
    readTime: '7 min read',
    summary: 'Turn everyday family decisions into empowering lessons on saving, compounding, delayed gratification, smart budgeting, and ethical technology creation.',
    keywords: ['financial literacy kids', 'teaching kids money', 'kids entrepreneurship', 'ai skills for children', 'future life skills', 'kids allowance system'],
    publishedDate: '2026-08-11',
    author: {
      name: 'Rohan Singhania, CFA',
      role: 'Family Wealth Mentor & Author of "Smart Little Builders"',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
    },
    tableOfContents: [
      'The 3-Jar Money System (Spend, Save, Give)',
      'Distinguishing Needs vs. Wants in the Digital E-Commerce Age',
      'The Power of the 52-Week Compounding Match Game',
      'Mini-Entrepreneurship: Lemonade Stands to Digital Art Projects',
      'Teaching Critical Thinking Around Algorithmic Ads'
    ],
    content: {
      overview: 'In an era of invisible digital payments and gamified consumer marketing, tangible financial habits learned between ages 6 and 12 shape lifelong wealth resilience and career resourcefulness.',
      keyTakeaways: [
        'Physical coins and clear glass jars make money tangible before introducing digital bank cards.',
        'Delayed gratification games (Marshmallow test adaptations) correlate directly with adult financial independence.',
        'Encouraging kids to earn small commissions for non-routine tasks fosters an entrepreneurial creator mindset.'
      ],
      deepDiveSections: [
        {
          heading: 'The 3-Jar Money System (Spend, Save, Give)',
          body: [
            'Provide 3 transparent jars labeled: 50% Everyday Spending, 40% Long-Term Goal Saving, 10% Community Giving.',
            'Watching the "Save" jar fill up visually builds intrinsic pride and emotional resistance to impulse shopping.'
          ],
          proTip: 'Offer a 10% "Parent Interest Match" at the end of every month for every rupee remaining in the Save jar!'
        }
      ],
      actionableSteps: [
        'Take your child grocery shopping with a clipboard to compare unit prices per gram.',
        'Involve kids in planning one family outing budget with a fixed total ceiling.',
        'Set up a mini home library barter or toy-swap event with neighborhood playmates.'
      ],
      faq: [
        {
          question: 'Should basic household chores be paid with money?',
          answer: 'Routine family contributions (making bed, clearing plates) should be done as a responsible family member. Reserve paid commissions for extra tasks like car washing or garden weeding.'
        }
      ]
    }
  }
];

// Dynamic Programmatic Topic Generator generating 1000+ targeted SEO knowledge pages
export function generateProgrammaticKnowledgeIndex(): Array<{
  slug: string;
  title: string;
  category: KnowledgeArticle['category'];
  categoryLabel: string;
  ageGroup: KnowledgeArticle['ageGroup'];
  readTime: string;
  summary: string;
  keywords: string[];
}> {
  const result: Array<{
    slug: string;
    title: string;
    category: KnowledgeArticle['category'];
    categoryLabel: string;
    ageGroup: KnowledgeArticle['ageGroup'];
    readTime: string;
    summary: string;
    keywords: string[];
  }> = [];

  // Add custom admin published articles first (highest priority)
  const customArticles = getAdminCustomKnowledgeArticles();
  for (const art of customArticles) {
    result.push({
      slug: art.slug,
      title: art.title,
      category: art.category,
      categoryLabel: art.categoryLabel || art.category,
      ageGroup: art.ageGroup,
      readTime: art.readTime || '5 min read',
      summary: art.summary || art.title,
      keywords: art.keywords || []
    });
  }

  // Add the hand-curated flagship articles next
  for (const art of FLAGSHIP_KNOWLEDGE_ARTICLES) {
    if (!result.some(r => r.slug === art.slug)) {
      result.push({
        slug: art.slug,
        title: art.title,
        category: art.category,
        categoryLabel: art.categoryLabel,
        ageGroup: art.ageGroup,
        readTime: art.readTime,
        summary: art.summary,
        keywords: art.keywords
      });
    }
  }

  // Programmatic generation across 6 primary pillars
  const topicsByPillar: Record<KnowledgeArticle['category'], { label: string; subjects: string[]; benefits: string[] }> = {
    Nutrition: {
      label: 'Baby & Child Nutrition',
      subjects: [
        'Baby Led Weaning Recipes', 'Iron Rich Finger Foods', 'DHA Omega 3 Brain Superfoods', 'Managing Toddler Picky Eating',
        'Dairy-Free Calcium Alternatives', 'Gut Microbiome & Fermented Foods', 'Organic Baby Purees Step-by-Step', 'Healthy Lunchbox Ideas',
        'Natural Electrolytes for Kids', 'Sugar-Free Toddler Birthday Treats', 'Immunity Soups & Broths', 'Vitamin D3 & Zinc Nutrition',
        'Safe Introduction of Tree Nut Allergens', 'Constipation Relief Fiber Foods', 'High Protein Vegetarian Meal Plans',
        'Ayurvedic Herbs for Child Agni & Digestion', 'Healthy Evening Snack Swaps', 'Hydration Milestones in Hot Climates',
        'Anti-Inflammatory Toddler Diet', 'School-Going Breakfast Bowls', 'Sensory Texture Food Exposure',
        'Millet Porridge & Ancient Grains for Toddlers', 'Early Prevention of Childhood Sugar Addiction', 'Healthy Fats Avocado & Ghee Benefits',
        'Preventing Iron Deficiency Anemia in Infants', 'Hydrating Fruits & Summer Cooling Foods for Babies', 'Immunity Booster Smoothies for School Kids',
        'Egg Introduction Safety & Allergy Protocols', 'Gluten Sensitivity & Celiac Screening in Early Years', 'Prebiotic & Probiotic Foods for Infant Colic',
        'Safe Feeding Practices During Toddler Fevers', 'Calcium Rich Green Leafy Purees for Weaning'
      ],
      benefits: [
        'Accelerating neural synapse connectivity', 'Building strong dental enamel and skeletal bone density',
        'Eliminating behavioral irritability and sugar spikes', 'Strengthening gastrointestinal gut microbiota barrier',
        'Improving sustained classroom concentration and memory recall'
      ]
    },
    Psychology: {
      label: 'Child Psychology & SEL',
      subjects: [
        'Overcoming Separation Anxiety at Daycare', 'Gentle De-escalation of Public Meltdowns', 'Fostering Sibling Harmony without Jealousy',
        'Building Growth Mindset & Grit', 'Managing Bedtime Resistance and Night Terrors', 'Raising Emotionally Intelligent Boys and Girls',
        'Navigating Toddler Biting and Grasping', 'Building Self-Esteem in Introverted Children', 'Positive Discipline without Punitive Timeouts',
        'Sensory Processing Sensitivity Guide', 'Helping Kids Cope with Moving to a New City', 'Mindfulness & Breathing Games for 4-Year-Olds',
        'Decoding Attachment Theory in Early Years', 'Teaching Empathy and Sharing to Only-Children', 'Handling School Bullying with Confidence',
        'Developing Frustration Tolerance in Board Games', 'Establishing Healthy Boundaries with Grandparents', 'Screen-Free Boredom Resilience',
        'Overcoming Phobias Darkness Insects and Strangers', 'Building Emotional Vocabulary in 3-Year-Olds', 'Peaceful Conflict Resolution on Playdates',
        'Helping Perfectionist Children Handle Failure', 'Managing School Anxiety & Exam Stress for Young Kids', 'Nurturing Positive Body Image in Children',
        'Fostering Independent Solo Play without Guilt', 'Understanding Highly Sensitive Children (HSP)', 'Bed-Wetting Behavioral Support Guide',
        'Compassionate Co-Parenting Communication Protocols'
      ],
      benefits: [
        'Deepening parent-child emotional secure attachment', 'Lowering childhood cortisol and autonomic nervous system stress',
        'Fostering peer friendship skills and empathetic conflict resolution', 'Equipping kids with lifelong self-soothing tools'
      ]
    },
    Education: {
      label: 'Homeschooling & Education',
      subjects: [
        'Comprehensive Homeschooling Curriculum Guide', 'Montessori Practical Life Activities at Home', 'Unplugged Coding & Logic for Preschoolers',
        'Bilingual Language Acquisition Strategies', 'Phonics & Early Reading Mastery Framework', 'Nature Schooling & Forest Kindergarten Routines',
        'Math Anxiety Elimination through Hands-On Manipulatives', 'Setting Up a Reggio Emilia Inspired Play Space', 'Creative Storytelling & Writing Prompts',
        'Science Experiments Using Common Kitchen Items', 'Choosing Between CBSE ICSE IB and Cambridge', 'Daily 2-Hour Focused Learning Flow',
        'Spatial Geometry with Wooden Blocks', 'World Geography Games & Map Exploration', 'Art History & Fine Motor Crafting for Kids',
        'Music Rhythm Training & Cognitive Expansion', 'Micro-Schooling & Neighborhood Co-op Formation',
        'Early Vedic Math Shortcuts for Mental Calculation', 'Developing Cursive Handwriting & Fine Motor Grip', 'Critical Reading & Socratic Discussion with Kids',
        'Waldorf Inspired Rhythm and Seasonal Crafts', 'Foreign Language Immersion at Home from Infancy', 'Astronomy & Stargazing Activities for Young Learners',
        'STEM Robotics & Mechanical Play at Home', 'Creative Drama & Roleplay for Public Expression', 'Speech & Debate Confidence for Elementary Students',
        'Gamified Spelling & Vocabulary Retention Systems'
      ],
      benefits: [
        'Cultivating intrinsic lifelong love for intellectual discovery', 'Developing superior critical reasoning and computational logic',
        'Fostering independent autonomous research habits', 'Customizing pacing to match the child\'s unique learning velocity'
      ]
    },
    Sports: {
      label: 'Baby & Junior Sports',
      subjects: [
        'Infant Water Safety and Hydrotherapy', 'Toddler Gymnastics & Core Stability Routines', 'Balance Bike Mastery before Pedal Biking',
        'Junior Soccer Drills for Motor Agility', 'Martial Arts (Taekwondo & Karate) for Focus', 'Kids Track & Field Sprinting Mechanics',
        'Yoga and Flexibility Stretches for Children', 'Tennis & Badminton Hand-Eye Coordination', 'Outdoor Rock Climbing & Balance Skills',
        'Team Sportsmanship and Dealing with Losses', 'Preventing Overuse Injuries in Youth Athletics', 'Bilateral Skipping Rope Coordination Drills',
        'Building Cardiovascular Stamina through Tag Games', 'Developing Dominant Hand and Foot Precision', 'Indoor Rainy Day Obstacle Courses',
        'Swimming Stroke Technique Mastery for Kids', 'Roller Skating & Skateboarding Equilibrium', 'Cricket Bowling & Batting Basics for Beginners',
        'Basketball Dribbling & Spatial Awareness', 'Archery & Precision Concentration for Youth', 'Table Tennis Reaction Time Enhancement',
        'Postural Alignment & Backpack Ergonomics for Kids', 'Athletic Nutrition Hydration for Young Competitors', 'Calisthenics & Bodyweight Training for Teens'
      ],
      benefits: [
        'Optimizing vestibular equilibrium and spatial balance', 'Strengthening cardiovascular endurance and lung capacity',
        'Developing fine/gross motor symmetry and posture alignment', 'Instilling team cooperation and athletic perseverance'
      ]
    },
    Care: {
      label: 'Newborn & Infant Care',
      subjects: [
        'Newborn Circadian Rhythm & Sleep Optimization', 'Gentle Teething Pain Relief Remedies', 'Diaper Rash Prevention & Barrier Care',
        'Daily Tummy Time Progression Chart', 'Speech and Babbling Milestones Checklist', 'Baby Massage (Abhyanga) Techniques',
        'Swaddling vs Sleep Sacks Safety Comparison', 'Baby Wearing Ergonomics for Healthy Hips', 'First Aid & CPR Preparedness for Parents',
        'Colic and Infant Gas Soothing Holds', 'Temperature Regulation and Nursery Climate', 'Safe Sunlight Exposure Guidelines',
        'Transitioning from Bassinet to Crib', 'Finger-Nail Trimming without Stress', 'Baby-Proofing Room by Room Blueprint',
        'Pacifier Weaning without Sleep Disruption', 'Cradle Cap Natural Removal & Scalp Care', 'Potty Training in 3 Days without Tears',
        'Ear Infection Prevention & Flying with Infants', 'Fever Management & When to Call Pediatrician', 'Nasal Congestion & Gentle Saline Steam Protocols',
        'Safe Car Seat Installation & Travel Rules', 'Infant Vision Stimulation Black & White Contrast',
        'Infant Sensory Play & Motor Development', 'Newborn Baby Bath Temperature Safety', 'Baby First Words & Language Stimulation',
        'Toddler Sleep Regression Solutions'
      ],
      benefits: [
        'Ensuring deep non-REM restorative nighttime sleep', 'Preventing cranial plagiocephaly through active positioning',
        'Accelerating auditory and expressive phonological milestones', 'Creating a 100% hazard-free exploration environment'
      ]
    },
    Future: {
      label: 'AI Era & Life Skills',
      subjects: [
        'Financial Literacy & Smart Money Management for Kids', 'Ethical AI Tools & Computational Play for Children',
        'Critical Thinking in the Social Media Age', 'Cooking and Kitchen Autonomy for 7-Year-Olds', 'Public Speaking & Confident Presentation Skills',
        'Gardening & Sustainable Environmental Stewardship', 'Time Management & Visual Daily Planners for Kids', 'Disaster Preparedness & First-Aid Basics',
        'Entrepreneurship Mindset: Small Projects to Value', 'Balancing Screen Time with Digital Literacy', 'Creative Problem Solving & Design Thinking',
        'Civic Responsibility & Neighborhood Volunteering', 'Basic Home Tool Usage & DIY Woodworking for Kids', 'Digital Privacy & Identity Protection for Youth',
        'Negotiation & Assertive Communication for Teens', 'Zero-Waste Living & Composting Habits at Home', 'Personal Hygiene & Self-Care Autonomy for Pre-Teens',
        'Toddler Tantrum Triggers & De-escalation', 'Homeschooling Daily Schedule Templates', 'Kids Swimming Safety & Drowning Prevention',
        'Kids Emotional Resilience & Adversity', 'Preschool Math Counting Games', 'Kids Yoga & Mindfulness Bedtime Routines',
        'Organic Finger Food Recipes Weaning', 'Homeschool Co-op Organization Legal Guide', 'Outdoor Nature Scavenger Hunts for Kids',
        'Child Safety Online & Stranger Awareness', 'Kids Pocket Money Budgeting Jars', 'Toddler Sharing & Turn Taking Drills'
      ],
      benefits: [
        'Preparing youth for exponential technological workplace evolution', 'Building financial independence and compound wealth wisdom',
        'Fostering adaptive creativity and practical resilience', 'Nurturing empathetic leadership in community projects'
      ]
    }
  };

  const ageGroups: KnowledgeArticle['ageGroup'][] = [
    '0-12 Months',
    '1-3 Years',
    '4-6 Years',
    '7-10 Years',
    '11-14 Years',
    'All Ages'
  ];

  const focusModifiers = [
    'The Complete Clinical Guide',
    'Evidence-Based Strategies for Parents',
    'Actionable Daily Routine & Step-by-Step Blueprint',
    'Essential Milestones, Common Mistakes & Pro Tips',
    'Doctor & Specialist Approved Framework',
    'Practical Tips for Modern Working Families'
  ];

  // Generate matrix permutations to yield 1,000+ indexed SEO topic pages
  for (const [catKey, catData] of Object.entries(topicsByPillar)) {
    const category = catKey as KnowledgeArticle['category'];
    for (let sIdx = 0; sIdx < catData.subjects.length; sIdx++) {
      const subject = catData.subjects[sIdx];
      
      for (let aIdx = 0; aIdx < ageGroups.length; aIdx++) {
        const ageGroup = ageGroups[aIdx];
        const modifier = focusModifiers[(sIdx + aIdx) % focusModifiers.length];
        const benefit = catData.benefits[(sIdx + aIdx) % catData.benefits.length];

        const slugSubject = subject.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const slugAge = ageGroup.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const slug = `${slugSubject}-${slugAge}-guide`;

        // Avoid duplicate slugs
        if (result.some(r => r.slug === slug)) continue;

        const title = `${subject} for ${ageGroup} - ${modifier} | Vernunt Child Growth Hub`;
        const summary = `Evidence-based guide on ${subject.toLowerCase()} for ${ageGroup}. Clinical milestones, daily routine blueprints, and doctor-approved tips for ${benefit.toLowerCase()}.`;
        
        // Contextualized localized keywords for Google search ranking in India and worldwide
        const regionalKeywords = [
          `child growth ${ageGroup.toLowerCase()}`,
          `${subject.toLowerCase()} tips`,
          `${subject.toLowerCase()} india`,
          `${subject.toLowerCase()} bangalore`,
          `how to handle ${subject.toLowerCase()}`,
          `best ways for ${subject.toLowerCase()}`,
          `parenting guide ${ageGroup.toLowerCase()}`,
          `baccho ke liye ${subject.toLowerCase()}`,
          `baby care tips in india`,
          `pediatric guidance ${ageGroup.toLowerCase()}`
        ];

        const keywords = [
          subject.toLowerCase(),
          `${subject.toLowerCase()} for ${ageGroup.toLowerCase()}`,
          catData.label.toLowerCase(),
          'baby milestone tracker',
          'child development milestones',
          'pediatric care guide',
          'parenting tips india',
          'toddler health guide',
          'newborn care guide',
          'montessori activities',
          'vernunt',
          'vernunt.com',
          'app.vernunt.com',
          'vernunt child growth guides',
          ...regionalKeywords
        ];

        result.push({
          slug,
          title,
          category,
          categoryLabel: catData.label,
          ageGroup,
          readTime: `${Math.floor(4 + ((sIdx + aIdx) % 5))} min read`,
          summary,
          keywords
        });
      }
    }
  }

  return result;
}

// Generate dynamic article on demand if slug is programmatic
export function getKnowledgeArticleBySlug(slug: string): KnowledgeArticle | null {
  const customArticles = getAdminCustomKnowledgeArticles();
  const foundCustom = customArticles.find(a => a.slug === slug);
  if (foundCustom) return foundCustom;

  const foundFlagship = FLAGSHIP_KNOWLEDGE_ARTICLES.find(a => a.slug === slug);
  if (foundFlagship) return foundFlagship;

  const allIndex = generateProgrammaticKnowledgeIndex();
  let meta = allIndex.find(a => a.slug === slug);
  if (!meta) {
    // Try relaxed matching by normalizing common connector words
    const normalize = (s: string) => s.toLowerCase().replace(/-for-|-in-|-the-|-with-|-and-|-without-/g, '-').trim();
    const targetNorm = normalize(slug);
    meta = allIndex.find(a => normalize(a.slug) === targetNorm);
  }

  // If still not matched, dynamically synthesize metadata so no slug ever fails or returns null
  if (!meta) {
    const ageMatch = slug.match(/-(0-12-months|1-3-years|4-6-years|7-10-years|11-14-years|all-ages)-guide$/);
    const ageKey = ageMatch ? ageMatch[1] : 'all-ages';
    const ageGroup = ageKey === '0-12-months' ? '0-12 Months' :
                     ageKey === '1-3-years' ? '1-3 Years' :
                     ageKey === '4-6-years' ? '4-6 Years' :
                     ageKey === '7-10-years' ? '7-10 Years' :
                     ageKey === '11-14-years' ? '11-14 Years' : 'All Ages';

    const baseTopic = slug
      .replace(/-(0-12-months|1-3-years|4-6-years|7-10-years|11-14-years|all-ages)-guide$/, '')
      .replace(/-guide$/, '');

    const words = baseTopic.split('-').map(w => {
      if (['and', 'of', 'for', 'in', 'at', 'to', 'with', 'without'].includes(w)) return w;
      if (['dha', 'stem', 'cpr', 'sel', 'cbse', 'icse', 'ib', 'hsp', 'diy'].includes(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    });
    let topicTitle = words.join(' ');
    topicTitle = topicTitle
      .replace(/Anti Inflammatory/i, 'Anti-Inflammatory')
      .replace(/Baby Led/i, 'Baby-Led')
      .replace(/Screen Free/i, 'Screen-Free');

    let category: KnowledgeCategory = 'Nutrition';
    let categoryLabel = 'Baby & Child Nutrition';
    const tLower = baseTopic.toLowerCase();

    if (tLower.includes('anxiety') || tLower.includes('meltdown') || tLower.includes('sibling') || tLower.includes('mindset') || 
        tLower.includes('psychology') || tLower.includes('tantrum') || tLower.includes('attachment') || tLower.includes('discipline')) {
      category = 'Psychology';
      categoryLabel = 'Child Psychology & SEL';
    } else if (tLower.includes('homeschool') || tLower.includes('montessori') || tLower.includes('coding') || tLower.includes('math') ||
               tLower.includes('reading') || tLower.includes('education') || tLower.includes('science')) {
      category = 'Education';
      categoryLabel = 'Homeschooling & Education';
    } else if (tLower.includes('soccer') || tLower.includes('swimming') || tLower.includes('gymnastics') || tLower.includes('sports') ||
               tLower.includes('athletics') || tLower.includes('archery') || tLower.includes('martial-arts')) {
      category = 'Sports';
      categoryLabel = 'Baby & Junior Sports';
    } else if (tLower.includes('sleep') || tLower.includes('teething') || tLower.includes('potty') || tLower.includes('newborn') ||
               tLower.includes('infant') || tLower.includes('colic') || tLower.includes('fever')) {
      category = 'Care';
      categoryLabel = 'Newborn & Infant Care';
    } else if (tLower.includes('money') || tLower.includes('ai') || tLower.includes('future') || tLower.includes('screen') ||
               tLower.includes('cooking') || tLower.includes('gardening')) {
      category = 'Future';
      categoryLabel = 'AI Era & Life Skills';
    }

    meta = {
      slug,
      title: `${topicTitle} for ${ageGroup} - Essential Milestones, Clinical Protocols & Pro Tips | Vernunt Child Growth Hub`,
      category,
      categoryLabel,
      ageGroup,
      readTime: '6 min read',
      summary: `Evidence-based clinical guide on ${topicTitle.toLowerCase()} for ${ageGroup}. Pediatric milestones, daily routine blueprints, and doctor-approved protocols.`,
      keywords: [topicTitle.toLowerCase(), `${topicTitle.toLowerCase()} for ${ageGroup.toLowerCase()}`, categoryLabel.toLowerCase(), 'vernunt parenting guide']
    };
  }

  return {
    slug: meta.slug,
    title: meta.title,
    category: meta.category,
    categoryLabel: meta.categoryLabel,
    ageGroup: meta.ageGroup,
    readTime: meta.readTime,
    summary: meta.summary,
    keywords: meta.keywords,
    publishedDate: '2026-08-16',
    author: {
      name: 'Vernunt Clinical & Educational Advisory Board',
      role: 'Pediatric Development & Homeschooling Research Guild',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80'
    },
    tableOfContents: [
      'Clinical Overview & Developmental Importance',
      'Age-Specific Milestones & Core Guidelines',
      'Step-by-Step Daily Execution Blueprint',
      'Common Mistakes Parents Make & Pro Adjustments',
      'Interactive Activities & Practice Exercises',
      'Frequently Asked Questions'
    ],
    content: {
      overview: meta.summary + ' Structured guidance in this area provides long-term cognitive, physical, and emotional scaffolding for growing children.',
      keyTakeaways: [
        'Consistency and positive reinforcement yield 4x greater retention and behavioral stability.',
        'Adapting methods to the child\'s individual temperament ensures sustainable joy and progress.',
        'Combining physical movement with cognitive stimulation accelerates synaptic development.'
      ],
      deepDiveSections: [
        {
          heading: 'Age-Specific Milestones & Core Guidelines',
          body: [
            `When implementing strategies for ${meta.ageGroup}, ensure activities match their biological attention span and fine motor maturity.`,
            'Break complex goals into small 10-to-15 minute experiential micro-challenges that celebrate incremental progress.'
          ],
          proTip: 'Incorporate playmates from the neighborhood into shared activities to double engagement through positive social modeling.'
        },
        {
          heading: 'Step-by-Step Daily Execution Blueprint',
          body: [
            '1. Morning Focus: Introduce new concepts or nutrient-rich recipes early in the day when energy and dopamine levels are highest.',
            '2. Afternoon Application: Reinforce learning through open-ended tactile materials, sensory play, or outdoor athletic exploration.',
            '3. Evening Reflection: Celebrate three small wins before bedtime to build intrinsic confidence and emotional calm.'
          ],
          warningOrAlert: 'Avoid high-pressure benchmarks. Every child develops along their own neurological timeline.'
        }
      ],
      actionableSteps: [
        'Set up a dedicated space with organized, child-accessible materials.',
        'Schedule 20 minutes of daily uninterrupted one-on-one connection.',
        'Track observations in your parenting journal or share notes with local co-op families.'
      ],
      faq: [
        {
          question: `How quickly can parents expect positive results with ${meta.title.split(':')[0]}?`,
          answer: 'Consistent implementation typically shows noticeable improvements in focus, emotional calm, and engagement within 7 to 14 days.'
        },
        {
          question: 'Can I connect with other parents focusing on this exact topic?',
          answer: 'Yes! Use the Vernunt Playmate Radar and Community Hub to find families with children in the same age group nearby.'
        }
      ]
    }
  };
}

// Local storage key for Admin WordPress-style Knowledge Hub posts
export const ADMIN_KNOWLEDGE_ARTICLES_KEY = 'vernunt_custom_knowledge_articles';

/**
 * Generate standard canonical public URL for any Knowledge Hub article
 */
export function getArticleCanonicalUrl(slug: string): string {
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://app.vernunt.com';
  return `${origin}/knowledge/${slug}`;
}

/**
 * Generate shareable deep-link URL for web app iframe / routing
 */
export function getArticleDeepLinkUrl(slug: string): string {
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://app.vernunt.com';
  return `${origin}/#knowledge/${slug}`;
}

export function getAdminCustomKnowledgeArticles(): KnowledgeArticle[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ADMIN_KNOWLEDGE_ARTICLES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Dynamically inject Google Schema.org JSON-LD and OpenGraph tags into document head
 */
export function injectArticleSeoHead(article: KnowledgeArticle): void {
  if (typeof document === 'undefined') return;

  const canonicalUrl = getArticleCanonicalUrl(article.slug);

  // 1. Update Title & Meta Tags
  document.title = `${article.title} | Vernunt Parenting Knowledge Hub`;

  const setMeta = (name: string, content: string, isProp = false) => {
    let el = document.querySelector(isProp ? `meta[property="${name}"]` : `meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      if (isProp) el.setAttribute('property', name);
      else el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMeta('description', article.summary || article.title);
  setMeta('keywords', (article.keywords || []).join(', '));
  setMeta('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  
  // OpenGraph
  setMeta('og:title', article.title, true);
  setMeta('og:description', article.summary || article.title, true);
  setMeta('og:url', canonicalUrl, true);
  setMeta('og:type', 'article', true);
  setMeta('og:site_name', 'Vernunt', true);
  if (article.coverImageUrl) {
    setMeta('og:image', article.coverImageUrl, true);
  }

  // Twitter Card
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', article.title);
  setMeta('twitter:description', article.summary || article.title);
  if (article.coverImageUrl) {
    setMeta('twitter:image', article.coverImageUrl);
  }

  // Canonical Link
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', canonicalUrl);

  // 2. Inject Schema.org Article & FAQ JSON-LD
  const schemaId = 'vernunt-article-schema';
  let script = document.getElementById(schemaId) as HTMLScriptElement;
  if (!script) {
    script = document.createElement('script');
    script.id = schemaId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  const faqItems = article.content?.faq || [];
  const faqSchema = faqItems.length > 0 ? {
    '@type': 'FAQPage',
    mainEntity: faqItems.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer
      }
    }))
  } : null;

  const schemaGraph: any[] = [
    {
      '@type': 'Article',
      '@id': `${canonicalUrl}#article`,
      isPartOf: { '@type': 'WebSite', name: 'Vernunt', url: 'https://app.vernunt.com' },
      headline: article.title,
      description: article.summary,
      image: article.coverImageUrl || 'https://app.vernunt.com/vernunt-logo.png',
      datePublished: article.publishedDate || new Date().toISOString(),
      dateModified: new Date().toISOString(),
      author: {
        '@type': 'Person',
        name: article.influencerSpotlight?.name || article.author?.name || 'Vernunt Editorial Board',
        jobTitle: article.author?.role || 'Parenting Specialist'
      },
      publisher: {
        '@type': 'Organization',
        name: 'Vernunt',
        logo: {
          '@type': 'ImageObject',
          url: 'https://app.vernunt.com/vernunt-logo.png'
        }
      },
      mainEntityOfPage: canonicalUrl,
      keywords: (article.keywords || []).join(', ')
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://app.vernunt.com' },
        { '@type': 'ListItem', position: 2, name: 'Knowledge Hub', item: 'https://app.vernunt.com/knowledge' },
        { '@type': 'ListItem', position: 3, name: article.title, item: canonicalUrl }
      ]
    }
  ];

  if (faqSchema) {
    schemaGraph.push(faqSchema);
  }

  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': schemaGraph
  }, null, 2);
}

/**
 * Save article and trigger immediate automated indexing pipeline to Google and search engines
 */
export async function publishAndAutoIndexArticle(article: KnowledgeArticle): Promise<{
  success: boolean;
  canonicalUrl: string;
  deepLinkUrl: string;
  indexingResults: any[];
}> {
  // 1. Save to client storage
  saveAdminKnowledgeArticle(article);

  // 2. Inject SEO tags & JSON-LD schema
  injectArticleSeoHead(article);

  const canonicalUrl = getArticleCanonicalUrl(article.slug);
  const deepLinkUrl = getArticleDeepLinkUrl(article.slug);

  // 3. Dispatch to server backend for dynamic sitemap inclusion & disk persistence
  try {
    await fetch('/api/knowledge/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article })
    }).catch(err => console.debug('Knowledge server sync note:', err));
  } catch (err) {
    console.debug('Knowledge publish dispatch note:', err);
  }

  // 4. Dispatch Instant Indexing Payload to Google Indexing API, Google Search Console, and IndexNow
  let indexingResults: any[] = [];
  try {
    const res = await fetch('/api/seo/instant-index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        urls: [canonicalUrl, deepLinkUrl],
        engine: 'all',
        host: typeof window !== 'undefined' ? window.location.host : 'app.vernunt.com'
      })
    });
    if (res.ok) {
      const data = await res.json();
      indexingResults = data.results || [];
    }
  } catch (err) {
    console.debug('Instant indexing response note:', err);
  }

  return {
    success: true,
    canonicalUrl,
    deepLinkUrl,
    indexingResults
  };
}

export function saveAdminKnowledgeArticle(article: KnowledgeArticle): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getAdminCustomKnowledgeArticles();
    const filtered = existing.filter(a => a.slug !== article.slug);
    filtered.unshift(article);
    localStorage.setItem(ADMIN_KNOWLEDGE_ARTICLES_KEY, JSON.stringify(filtered));

    // Also auto-sync to server
    fetch('/api/knowledge/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article })
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to save custom article:', e);
  }
}

export function deleteAdminKnowledgeArticle(slug: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getAdminCustomKnowledgeArticles();
    const filtered = existing.filter(a => a.slug !== slug);
    localStorage.setItem(ADMIN_KNOWLEDGE_ARTICLES_KEY, JSON.stringify(filtered));

    fetch(`/api/knowledge/articles/${encodeURIComponent(slug)}`, {
      method: 'DELETE'
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to delete custom article:', e);
  }
}


