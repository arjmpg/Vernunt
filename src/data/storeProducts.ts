import { StoreProduct, StoreCategory, StoreCoupon, StoreOrder, StoreAttribute } from '../types/store.ts';

export const STORE_CATEGORIES: StoreCategory[] = [
  {
    id: 'all',
    name: 'All Products',
    slug: 'all',
    icon: '✨',
    description: 'Explore full catalog of safe, curated, and developmental play products.',
    ageTag: 'All Ages',
    displayOrder: 1
  },
  {
    id: 'kids-food',
    name: 'Kids Food & Organic Nutrition',
    slug: 'kids-food',
    icon: '🥑',
    description: '100% organic sprouted porridges, freeze-dried real fruit melts, teething rusks, and wholesome snacks without preservatives.',
    ageTag: '6m - 10y',
    isFeatured: true,
    displayOrder: 2,
    thumbnailImage: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200&auto=format&fit=crop&q=80',
    subcategories: ['Sprouted Porridges & Purees', 'Freeze-Dried Fruit Melts', 'Teething Biscuits & Rusks', 'Brain-Growth Superfoods', 'Millet Crunchies & Puffs', 'Immune Booster Bites']
  },
  {
    id: 'montessori-stem',
    name: 'Montessori & STEM',
    slug: 'montessori-stem',
    icon: '🧩',
    description: 'Sensory wooden toys, robotics kits, logic puzzles, and brain boosters.',
    ageTag: '1 - 12y',
    isFeatured: true,
    displayOrder: 3,
    thumbnailImage: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=1200&auto=format&fit=crop&q=80',
    subcategories: ['Sensory Puzzles', 'Solar Robotics', 'Logic Blocks', 'Math & Geometry']
  },
  {
    id: 'art-craft',
    name: 'Art & Creative Craft',
    slug: 'art-craft',
    icon: '🎨',
    description: 'Non-toxic paints, modeling clay, origami sets, and DIY pottery kits.',
    ageTag: '2 - 10y',
    isFeatured: true,
    displayOrder: 4,
    thumbnailImage: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&auto=format&fit=crop&q=80',
    subcategories: ['Finger Paints', 'Organic Clay', 'Origami & Paper Craft', 'Canvas Painting Sets']
  },
  {
    id: 'kids-books',
    name: 'Books & Story Sets',
    slug: 'kids-books',
    icon: '📚',
    description: 'Bilingual picture books, early phonics, moral tales, and interactive sound books.',
    ageTag: '0 - 8y',
    isFeatured: true,
    displayOrder: 5,
    thumbnailImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&auto=format&fit=crop&q=80',
    subcategories: ['Board Books', 'Phonics & Letters', 'Bedtime Stories', 'Bilingual Panchatantra']
  },
  {
    id: 'safety-health',
    name: 'Child Safety & Care',
    slug: 'safety-health',
    icon: '🛡️',
    description: 'Silicone corner guards, organic teething cutlery, GPS safety bands, and first-aid.',
    ageTag: '0 - 6y',
    isFeatured: true,
    displayOrder: 6,
    thumbnailImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1200&auto=format&fit=crop&q=80',
    subcategories: ['Baby Proofing', 'Teething Cutlery', 'First Aid', 'Safety Smart Wear']
  },
  {
    id: 'playdate-gear',
    name: 'Playdate & Outdoor Gear',
    slug: 'playdate-gear',
    icon: '⚽',
    description: 'Toddler balance bikes, splash play mats, agility cones, and kids sports gear.',
    ageTag: '2 - 12y',
    isFeatured: false,
    displayOrder: 7,
    thumbnailImage: 'https://images.unsplash.com/photo-1576788366964-b5860d5b78f6?w=800&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=1200&auto=format&fit=crop&q=80',
    subcategories: ['Balance Bikes', 'Outdoor Balls', 'Play Tents', 'Agility Obstacles']
  },
  {
    id: 'digital-kits',
    name: 'Digital Activity Packs',
    slug: 'digital-kits',
    icon: '⚡',
    description: 'Printable homeschool worksheets, flashcards, sensory prompts, and milestone charts.',
    ageTag: '2 - 8y',
    isFeatured: false,
    displayOrder: 8,
    thumbnailImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&auto=format&fit=crop&q=80',
    subcategories: ['Printable Worksheets', 'Sensory Milestone Trackers', 'Flashcards', 'Audiobook Guides']
  }
];

export const DEFAULT_STORE_ATTRIBUTES: StoreAttribute[] = [
  {
    id: 'attr-flavor',
    name: 'Flavor / Taste',
    slug: 'flavor',
    type: 'select',
    isGlobal: true,
    visibleOnProductPage: true,
    description: 'Flavor profiles for organic kid foods and nutrition blends',
    terms: [
      { id: 'term-fl-1', name: 'Alphonso Mango & Strawberry', slug: 'alphonso-mango-strawberry' },
      { id: 'term-fl-2', name: 'Banana & Sprouted Ragi', slug: 'banana-sprouted-ragi' },
      { id: 'term-fl-3', name: 'Apple & Ceylon Cinnamon', slug: 'apple-ceylon-cinnamon' },
      { id: 'term-fl-4', name: 'Raw Cacao & Sprouted Almond', slug: 'raw-cacao-almond' },
      { id: 'term-fl-5', name: 'Creamy Tomato & Basil Herb', slug: 'creamy-tomato-herb' },
      { id: 'term-fl-6', name: 'Wild Berry Burst', slug: 'wild-berry-burst' },
      { id: 'term-fl-7', name: 'Cardamom & Palm Jaggery', slug: 'cardamom-palm-jaggery' }
    ]
  },
  {
    id: 'attr-pack-size',
    name: 'Pack Size / Weight',
    slug: 'pack-size',
    type: 'button',
    isGlobal: true,
    visibleOnProductPage: true,
    description: 'Weight and container sizes for pantry and toy bundles',
    terms: [
      { id: 'term-ps-1', name: '150g Trial Pouch', slug: '150g-trial' },
      { id: 'term-ps-2', name: '300g Standard Jar', slug: '300g-standard' },
      { id: 'term-ps-3', name: '600g Family Value Pack', slug: '600g-family' },
      { id: 'term-ps-4', name: 'Pack of 3 Assorted Flavors', slug: 'pack-of-3' }
    ]
  },
  {
    id: 'attr-dietary',
    name: 'Dietary & Organic Standard',
    slug: 'dietary-standard',
    type: 'select',
    isGlobal: true,
    visibleOnProductPage: true,
    description: 'Certifications and pediatric dietary safety classifications',
    terms: [
      { id: 'term-dt-1', name: '100% Certified Organic & Non-GMO', slug: 'organic-non-gmo' },
      { id: 'term-dt-2', name: 'Zero Added Refined Sugar / Jaggery Only', slug: 'zero-refined-sugar' },
      { id: 'term-dt-3', name: 'Gluten-Free & Easy To Digest', slug: 'gluten-free' },
      { id: 'term-dt-4', name: '100% Vegan / Dairy-Free', slug: 'vegan-dairy-free' },
      { id: 'term-dt-5', name: 'Nut-Free School-Safe', slug: 'nut-free' }
    ]
  },
  {
    id: 'attr-age-stage',
    name: 'Milestone Age Stage',
    slug: 'age-stage',
    type: 'button',
    isGlobal: true,
    visibleOnProductPage: true,
    description: 'Pediatric stage recommendation for foods and learning kits',
    terms: [
      { id: 'term-as-1', name: 'Stage 1: Infants (6m - 12m)', slug: 'stage-1-infants' },
      { id: 'term-as-2', name: 'Stage 2: Toddlers (1y - 3y)', slug: 'stage-2-toddlers' },
      { id: 'term-as-3', name: 'Stage 3: Preschoolers (3y - 6y)', slug: 'stage-3-preschool' },
      { id: 'term-as-4', name: 'Stage 4: Juniors (6y - 12y)', slug: 'stage-4-juniors' }
    ]
  },
  {
    id: 'attr-material',
    name: 'Toy Material & Safety',
    slug: 'material',
    type: 'select',
    isGlobal: true,
    visibleOnProductPage: true,
    description: 'Non-toxic raw material certification',
    terms: [
      { id: 'term-mat-1', name: 'Neem Wood & Organic Beeswax Polish', slug: 'neem-wood' },
      { id: 'term-mat-2', name: 'Food-Grade LFGB Platinum Silicone', slug: 'platinum-silicone' },
      { id: 'term-mat-3', name: '100% Organic GOTS Cotton Canvas', slug: 'gots-cotton' },
      { id: 'term-mat-4', name: 'BPA-Free Recyclable ABS', slug: 'bpa-free-abs' }
    ]
  }
];

export const STORE_COUPONS: StoreCoupon[] = [
  {
    code: 'VERNUNT15',
    description: '15% Off across all products on orders above ₹999',
    discountType: 'percentage',
    amount: 15,
    minSpend: 999,
    maxDiscount: 450,
    isActive: true,
    usageCount: 412,
    highlightText: '🎉 Best Value'
  },
  {
    code: 'FIRSTPLAY200',
    description: 'Flat ₹200 Off for your child’s first store purchase (Min order ₹800)',
    discountType: 'fixed_cart',
    amount: 200,
    minSpend: 800,
    isActive: true,
    usageCount: 890,
    highlightText: '👶 New Parent Welcome'
  },
  {
    code: 'FREESHIP',
    description: 'Free Express 24-Hour Shipping on any order',
    discountType: 'free_shipping',
    amount: 0,
    minSpend: 499,
    isActive: true,
    usageCount: 1250,
    highlightText: '🚚 Express Courier'
  },
  {
    code: 'VIPFAMILY500',
    description: 'Exclusive ₹500 OFF for VIP Family Club Members (Min order ₹2,000)',
    discountType: 'fixed_cart',
    amount: 500,
    minSpend: 2000,
    isActive: true,
    usageCount: 165,
    highlightText: '👑 VIP Exclusive'
  }
];

export const INITIAL_STORE_PRODUCTS: StoreProduct[] = [
  {
    id: 'prod-food-01',
    name: 'Organic Sprouted Ragi & Almond Baby Porridge Mix (Stage 1 & 2)',
    slug: 'organic-sprouted-ragi-almond-baby-porridge',
    shortDescription: '100% whole sprouted ragi with Californian almonds and cardamom. No added sugar, no milk solids, pediatrician approved.',
    description: `Crafted specifically for gentle infant and toddler digestion, our Sprouted Ragi & Almond Porridge is made from 100% certified organic finger millet that has been naturally sprouted for 48 hours to unlock 3x bioavailable calcium, iron, and fiber.

    Enriched with finely milled Californian almonds for brain-boosting healthy fats and natural elaichi for aroma.
    
    • 0% Added Refined Sugar / Salt
    • 0% Preservatives, Artificial Colors, or Flavors
    • Certified Organic by FSSAI & Jaivik Bharat
    • Easy 5-minute prep with warm water or milk`,
    price: 349,
    regularPrice: 499,
    salePrice: 349,
    onSale: true,
    discountPercentage: 30,
    sku: 'VRN-FOOD-001',
    stockQuantity: 45,
    stockStatus: 'instock',
    manageStock: true,
    category: 'Kids Food & Organic Nutrition',
    subcategory: 'Sprouted Porridges & Purees',
    ageGroup: '0-12m',
    ageLabel: 'Ages 6m - 2 Years',
    featuredImage: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800&auto=format&fit=crop&q=80'
    ],
    tags: ['Organic Food', 'Baby Nutrition', 'Sprouted Ragi', 'Sugar Free', 'FSSAI Certified'],
    attributes: [
      { name: 'Flavor', options: ['Banana & Almond', 'Original Sprouted Ragi', 'Apple & Cinnamon'] },
      { name: 'Pack Size', options: ['300g Pouch', '600g Value Pack'] }
    ],
    rating: 4.9,
    reviewCount: 38,
    reviews: [
      {
        id: 'rev-food-1',
        authorName: 'Sneha Kulkarni',
        authorLocation: 'Pune, Maharashtra',
        childAge: 'Child Age: 8 months',
        rating: 5,
        date: 'Aug 24, 2026',
        title: 'Baby loved the natural taste!',
        comment: 'We started weaning at 6 months with this sprouted ragi mix. It cooks super smoothly without lumps and my son finishes his bowl happily every morning.',
        verifiedBuyer: true,
        helpfulCount: 19
      }
    ],
    qaList: [
      {
        id: 'qa-food-1',
        question: 'Does this contain any added sugar or milk powder?',
        askedBy: 'Pooja V.',
        date: 'Aug 15, 2026',
        answer: 'Zero added sugar, zero salt, and zero milk powder. It is 100% pure sprouted grain and nuts.',
        answeredBy: 'Vernunt Certified Pediatric Nutritionist'
      }
    ],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: true,
    isDigital: false,
    weightGrams: 300,
    badges: ['FSSAI Organic Certified', 'Zero Sugar', '100% Sprouted', 'Pediatrician Approved'],
    hsnCode: '190410',
    gstRate: 5,
    brand: 'NourishSprouts Organics',
    deliveryDaysEstimate: 2,
    vendorId: 'vend-nourishsprouts',
    vendorName: 'NourishSprouts Organics',
    vendorSlug: 'nourishsprouts-organics',
    approvalStatus: 'approved'
  },
  {
    id: 'prod-food-02',
    name: 'Freeze-Dried 100% Real Strawberry & Alphonso Mango Toddler Melts',
    slug: 'freeze-dried-strawberry-mango-melts',
    shortDescription: 'Melt-in-mouth real fruit cubes retaining 98% raw vitamins. No added sugar or preservatives. Great for pincer grasp development.',
    description: `The ultimate guilt-free toddler snack! Made with 100% hand-picked Ratnagiri Alphonso Mangoes and Mahabaleshwar Strawberries using gentle NASA-grade freeze-drying technology that locks in 98% of natural vitamins, fiber, and taste without high-heat processing.

    • Melts safely on baby's tongue within 3 seconds (reduces choking risk)
    • Encourages self-feeding and pincer-grasp fine motor coordination
    • 100% Vegan, Gluten-Free, and Dairy-Free
    • Resealable on-the-go travel pouch`,
    price: 299,
    regularPrice: 399,
    salePrice: 299,
    onSale: true,
    discountPercentage: 25,
    sku: 'VRN-FOOD-002',
    stockQuantity: 60,
    stockStatus: 'instock',
    manageStock: true,
    category: 'Kids Food & Organic Nutrition',
    subcategory: 'Freeze-Dried Fruit Melts',
    ageGroup: '1-3y',
    ageLabel: 'Ages 12m - 6 Years',
    featuredImage: 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=800&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&auto=format&fit=crop&q=80'
    ],
    tags: ['Freeze Dried', 'Real Fruit', 'Toddler Snacks', 'No Added Sugar', 'Gluten Free'],
    attributes: [
      { name: 'Flavor', options: ['Strawberry & Mango Duo', 'Blueberry & Banana', 'Cheeku & Apple'] },
      { name: 'Pack Size', options: ['30g Pouch', 'Pack of 3 Variety Box'] }
    ],
    rating: 4.8,
    reviewCount: 42,
    reviews: [
      {
        id: 'rev-food-2',
        authorName: 'Ritu Sharma',
        authorLocation: 'Delhi NCR',
        childAge: 'Child Age: 2 years',
        rating: 5,
        date: 'Aug 26, 2026',
        title: 'Perfect healthy snack for car rides!',
        comment: 'No messy hands, no artificial sugar rush. My daughter loves the crunch and how they melt. Must-have for diaper bags.',
        verifiedBuyer: true,
        helpfulCount: 15
      }
    ],
    qaList: [
      {
        id: 'qa-food-2',
        question: 'Are there any preservatives or sulfites added?',
        askedBy: 'Kavita M.',
        date: 'Aug 19, 2026',
        answer: 'None at all. The ingredient list is literally just strawberries and mangoes.',
        answeredBy: 'NourishSprouts Quality Team'
      }
    ],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: true,
    isDigital: false,
    weightGrams: 50,
    badges: ['100% Real Fruit', 'Zero Preservatives', 'Melt in Mouth', 'Travel Friendly'],
    hsnCode: '081340',
    gstRate: 5,
    brand: 'NourishSprouts Organics',
    deliveryDaysEstimate: 1,
    vendorId: 'vend-nourishsprouts',
    vendorName: 'NourishSprouts Organics',
    vendorSlug: 'nourishsprouts-organics',
    approvalStatus: 'approved'
  },
  {
    id: 'prod-food-03',
    name: 'Organic Foxtail Millet & Palm Jaggery Teething Rusks with Cardamom',
    slug: 'foxtail-millet-teething-rusks',
    shortDescription: 'Gentle on sore gums during teething. Baked whole grain millet sweetened mildly with iron-rich organic palm jaggery.',
    description: `Designed in consultation with pediatric dentists, these organic teething biscuits provide the ideal firm texture that gently massages sore baby gums while dissolving slowly without breaking into sharp crumbs.

    • Made from ancient Indian Foxtail Millet (Kangni) & Whole Wheat
    • Sweetened naturally with chemical-free Palm Jaggery (rich in iron & zinc)
    • Zero Palm Oil, Zero Maida, Zero Emulsifiers
    • Individually wrapped pairs for hygienic outdoor carrying`,
    price: 249,
    regularPrice: 349,
    salePrice: 249,
    onSale: true,
    discountPercentage: 28,
    sku: 'VRN-FOOD-003',
    stockQuantity: 50,
    stockStatus: 'instock',
    manageStock: true,
    category: 'Kids Food & Organic Nutrition',
    subcategory: 'Teething Biscuits & Rusks',
    ageGroup: '1-3y',
    ageLabel: 'Ages 7m - 3 Years',
    featuredImage: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80'
    ],
    tags: ['Teething Rusk', 'Millet Biscuit', 'Palm Jaggery', 'Baby Teething', 'Non GMO'],
    attributes: [
      { name: 'Flavor', options: ['Cardamom & Palm Jaggery', 'Ajwain & Cumin (Digestion)'] },
      { name: 'Pack Size', options: ['150g Box (12 Rusks)', '300g Value Pack'] }
    ],
    rating: 4.7,
    reviewCount: 29,
    reviews: [],
    qaList: [],
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isDigital: false,
    weightGrams: 200,
    badges: ['Dentist Approved', 'Zero Palm Oil', 'Millet Goodness', 'Iron Rich Jaggery'],
    hsnCode: '190531',
    gstRate: 5,
    brand: 'NourishSprouts Organics',
    deliveryDaysEstimate: 2,
    vendorId: 'vend-nourishsprouts',
    vendorName: 'NourishSprouts Organics',
    vendorSlug: 'nourishsprouts-organics',
    approvalStatus: 'approved'
  },
  {
    id: 'prod-food-04',
    name: 'Sprouted Nut, Seed & Raw Cacao Brain Growth Superfood Powder (1y - 10y)',
    slug: 'sprouted-nut-seed-cacao-brain-superfood',
    shortDescription: 'Rich in plant DHA, Omega-3, Calcium & Protein. Mix 1 spoon in daily warm milk or smoothie. 100% natural, no maltodextrin.',
    description: `A nutrient-dense daily brain and physical growth booster formulated by pediatric nutrition specialists. Combines sprouted walnuts, flaxseeds, pumpkin seeds, soaked almonds, and pure single-origin Kerala raw cacao.

    • High Bio-available DHA & Omega 3 for cognitive focus and brain myelin formation
    • 7g Clean Plant Protein per serving
    • No maltodextrin, no artificial fillers, no synthetic vitamins
    • Naturally sweetened with dehydrated dates and organic coconut sugar`,
    price: 499,
    regularPrice: 699,
    salePrice: 499,
    onSale: true,
    discountPercentage: 28,
    sku: 'VRN-FOOD-004',
    stockQuantity: 35,
    stockStatus: 'instock',
    manageStock: true,
    category: 'Kids Food & Organic Nutrition',
    subcategory: 'Brain-Growth Superfoods',
    ageGroup: '3-6y',
    ageLabel: 'Ages 2 - 12 Years',
    featuredImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800&auto=format&fit=crop&q=80'
    ],
    tags: ['Brain Nutrition', 'Kids Protein', 'DHA Omega 3', 'Raw Cacao', 'Malt Free'],
    attributes: [
      { name: 'Flavor', options: ['Rich Dark Cacao', 'Royal Kesar Badam'] },
      { name: 'Pack Size', options: ['250g Jar', '500g Jar'] }
    ],
    rating: 4.9,
    reviewCount: 64,
    reviews: [],
    qaList: [],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    isDigital: false,
    weightGrams: 300,
    badges: ['High DHA & Omega-3', 'Zero Maltodextrin', 'Real Almonds & Seeds', 'Clean Label'],
    hsnCode: '210690',
    gstRate: 5,
    brand: 'BrainyBites Kids Wellness',
    deliveryDaysEstimate: 2,
    vendorId: 'vend-nourishsprouts',
    vendorName: 'NourishSprouts Organics',
    vendorSlug: 'nourishsprouts-organics',
    approvalStatus: 'approved'
  },
  {
    id: 'prod-food-05',
    name: 'Crispy Little Millet & Beetroot Star Puffs (Creamy Tomato & Herb)',
    slug: 'crispy-little-millet-star-puffs',
    shortDescription: '100% roasted organic millet stars dusted with freeze-dried tomato and basil. Zero maida, zero palm oil, school snack safe.',
    description: `Light, crunchy, and nutritious! Our star puffs are slow-roasted (never deep fried) using 100% Indian Little Millet and native red beetroot powder.

    • Dusted with real freeze-dried tomato, basil herb, and Himalayan pink salt
    • 100% palm oil free (made with cold-pressed sunflower oil)
    • High dietary fiber and low glycemic index for sustained playtime energy
    • Perfect finger snack for school tiffin boxes and evening playdates`,
    price: 199,
    regularPrice: 280,
    salePrice: 199,
    onSale: true,
    discountPercentage: 29,
    sku: 'VRN-FOOD-005',
    stockQuantity: 80,
    stockStatus: 'instock',
    manageStock: true,
    category: 'Kids Food & Organic Nutrition',
    subcategory: 'Millet Crunchies & Puffs',
    ageGroup: '3-6y',
    ageLabel: 'Ages 2 - 10 Years',
    featuredImage: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&auto=format&fit=crop&q=80'
    ],
    tags: ['Millet Puffs', 'Healthy Snacks', 'Zero Maida', 'Tiffin Safe', 'Roasted Snack'],
    attributes: [
      { name: 'Flavor', options: ['Creamy Tomato & Herb', 'Cheesy Cheddar & Herbs', 'Tangy Masala Magic'] },
      { name: 'Pack Size', options: ['Pack of 3 (45g each)', 'Party Pack (6 Pouches)'] }
    ],
    rating: 4.8,
    reviewCount: 31,
    reviews: [],
    qaList: [],
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isDigital: false,
    weightGrams: 150,
    badges: ['Zero Maida', 'Zero Palm Oil', '100% Roasted', 'School Tiffin Friendly'],
    hsnCode: '190410',
    gstRate: 5,
    brand: 'NourishSprouts Organics',
    deliveryDaysEstimate: 1,
    vendorId: 'vend-nourishsprouts',
    vendorName: 'NourishSprouts Organics',
    vendorSlug: 'nourishsprouts-organics',
    approvalStatus: 'approved'
  },
  {
    id: 'prod-food-06',
    name: 'Natural Pectin Real Fruit Jellies with Vitamin C & Zinc (Berry Burst)',
    slug: 'natural-pectin-real-fruit-jellies-immunity',
    shortDescription: '100% vegan gummy bites made with citrus pectin and real apple-strawberry juice. Immunity booster for kids 3y+.',
    description: `A smart, natural alternative to synthetic candy gummies. Crafted from real apple and wild berry fruit purees set with citrus fruit pectin (0% pork or beef gelatin).

    Each gummy bite delivers:
    • 100% Recommended Daily Vitamin C from Amla Fruit Extract
    • Zinc & Prebiotic Chicory Root Fiber for gut health and seasonal resilience
    • 0% High Fructose Corn Syrup / Artificial Food Dyes
    • Tooth-friendly formula with plant xylitol`,
    price: 329,
    regularPrice: 450,
    salePrice: 329,
    onSale: true,
    discountPercentage: 27,
    sku: 'VRN-FOOD-006',
    stockQuantity: 40,
    stockStatus: 'instock',
    manageStock: true,
    category: 'Kids Food & Organic Nutrition',
    subcategory: 'Immune Booster Bites',
    ageGroup: '3-6y',
    ageLabel: 'Ages 3 - 12 Years',
    featuredImage: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=800&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=800&auto=format&fit=crop&q=80'
    ],
    tags: ['Immunity Gummies', 'Vegan Jellies', 'Vitamin C', 'Zero Gelatin', 'Fruit Puree'],
    attributes: [
      { name: 'Flavor', options: ['Wild Berry Burst', 'Citrus Orange Splash'] },
      { name: 'Pack Size', options: ['30 Gummies Jar (1 Month Supply)', '60 Gummies Value Jar'] }
    ],
    rating: 4.9,
    reviewCount: 53,
    reviews: [],
    qaList: [],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: true,
    isDigital: false,
    weightGrams: 180,
    badges: ['100% Vegan Pectin', 'Zero Gelatin', 'Immunity Boost', 'Real Fruit Juice'],
    hsnCode: '170490',
    gstRate: 12,
    brand: 'BrainyBites Kids Wellness',
    deliveryDaysEstimate: 2,
    vendorId: 'vend-nourishsprouts',
    vendorName: 'NourishSprouts Organics',
    vendorSlug: 'nourishsprouts-organics',
    approvalStatus: 'approved'
  },
  {
    id: 'prod-stem-01',
    name: 'Vernunt STEM Explorer: 6-in-1 Solar Robotics & Logic Kit',
    slug: 'stem-explorer-solar-robotics-kit',
    shortDescription: 'Hands-on DIY solar & battery dual-power robotic set teaching mechanical gears and clean energy.',
    description: `Inspire the young scientist at home with the Vernunt STEM Explorer kit. Certified non-toxic and BIS compliant, this comprehensive kit allows children to build 6 unique moving robots—including a Mars Rover, Space Walking Robot, Solar Car, and Windmill Bot. 
    
    Includes detailed illustrated color manuals, precision snap-together ABS parts (no solder or glue required), and a real miniature solar panel module with dual micro-gearbox.`,
    price: 1499,
    regularPrice: 2199,
    salePrice: 1499,
    onSale: true,
    discountPercentage: 32,
    sku: 'VRN-STEM-001',
    stockQuantity: 28,
    stockStatus: 'instock',
    manageStock: true,
    category: 'Montessori & STEM',
    subcategory: 'Robotics & Electronics',
    ageGroup: '6-10y',
    ageLabel: 'Ages 6 - 12 Years',
    featuredImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800',
    galleryImages: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['Robotics', 'STEM', 'Solar Power', 'Science Kit', 'Best Seller'],
    attributes: [
      {
        name: 'Edition',
        options: ['Standard 6-in-1', 'Deluxe 12-in-1 + Motorized Pack (+₹499)']
      },
      {
        name: 'Storage Box',
        options: ['Eco Carton', 'Heavy Duty Organizer Toolcase (+₹250)']
      }
    ],
    rating: 4.9,
    reviewCount: 142,
    reviews: [
      {
        id: 'rev-1',
        authorName: 'Sneha Kulkarni',
        authorLocation: 'Bengaluru, HSR Layout',
        authorPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        childAge: 'Child Age: 7 yrs',
        rating: 5,
        date: '3 days ago',
        title: 'Outstanding quality, kept my 7-year-old engaged for hours!',
        comment: 'My son and I assembled the solar rover over the weekend. The gears run smoothly and the solar cell works even in indirect sunlight on our balcony. Wonderful educational value.',
        verifiedBuyer: true,
        helpfulCount: 24
      },
      {
        id: 'rev-2',
        authorName: 'Arun Varma',
        authorLocation: 'Hyderabad, Gachibowli',
        childAge: 'Child Age: 9 yrs',
        rating: 5,
        date: '1 week ago',
        title: 'Much better build than cheap imports',
        comment: 'Parts fit cleanly with no sharp burrs. The instruction book is simple for kids to follow on their own.',
        verifiedBuyer: true,
        helpfulCount: 18
      }
    ],
    qaList: [
      {
        id: 'qa-1',
        question: 'Does it require batteries or only solar power?',
        askedBy: 'Priya M.',
        date: 'August 2026',
        answer: 'It has a dual mode! It runs directly under sunlight via the solar panel or indoors using 1 standard AAA battery (not included).',
        answeredBy: 'Vernunt STEM Specialist'
      }
    ],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    isDigital: false,
    weightGrams: 520,
    dimensionsCm: { length: 28, width: 20, height: 7 },
    badges: ['BIS Certified', 'BPA-Free', 'Top Rated 2026', 'Free 24h Shipping'],
    hsnCode: '95030090',
    gstRate: 12,
    brand: 'BrainyBlocks STEM Labs',
    deliveryDaysEstimate: 1,
    vendorId: 'vend-brainy-stem',
    vendorName: 'BrainyBlocks STEM Labs',
    vendorSlug: 'brainy-blocks-stem-labs',
    approvalStatus: 'approved'
  },
  {
    id: 'prod-mont-02',
    name: 'Organic Neem Wood Sensory Balancing Stones & Rainbow Blocks (18 Pcs)',
    slug: 'organic-wooden-sensory-balancing-stones',
    shortDescription: 'Handcrafted smooth non-toxic wooden tactile blocks for motor skill precision and spatial balance.',
    description: `Crafted from seasoned natural neem wood and coated with food-grade water-based plant dyes, each stone is uniquely multi-faceted to encourage patience, fine motor coordination, and artistic balance construction. 
    
    Unlike standard geometric cubes, these organic pebble shapes challenge toddler intuition and concentration without screens.`,
    price: 899,
    regularPrice: 1399,
    salePrice: 899,
    onSale: true,
    discountPercentage: 35,
    sku: 'VRN-MONT-002',
    stockQuantity: 45,
    stockStatus: 'instock',
    manageStock: true,
    category: 'Montessori & STEM',
    subcategory: 'Wooden Toys',
    ageGroup: '1-3y',
    ageLabel: 'Ages 18 Months - 6 Years',
    featuredImage: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=800',
    galleryImages: [
      'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['Montessori', 'Neem Wood', 'Eco Friendly', 'Sensory Play', 'Toddler Gift'],
    attributes: [
      {
        name: 'Color Palette',
        options: ['Earth Pastel Palette', 'Natural Raw Wood Grain', 'Vibrant Rainbow Palette']
      },
      {
        name: 'Pack Size',
        options: ['18 Pieces Set', '32 Pieces Grand Set (+₹550)']
      }
    ],
    rating: 4.95,
    reviewCount: 98,
    reviews: [
      {
        id: 'rev-3',
        authorName: 'Deepa Hegde',
        authorLocation: 'Bengaluru, Whitefield',
        childAge: 'Child Age: 2.5 yrs',
        rating: 5,
        date: '5 days ago',
        title: 'Smooth edges and zero chemical smell',
        comment: 'My daughter loves stacking these in different patterns. The wood is lightweight and silky smooth.',
        verifiedBuyer: true,
        helpfulCount: 31
      }
    ],
    qaList: [
      {
        id: 'qa-2',
        question: 'Are the dyes baby-safe if put in mouth?',
        askedBy: 'Kavita Rao',
        date: 'August 2026',
        answer: 'Yes, 100%. We use certified vegetable dyes and cold-pressed linseed oil finish with zero toxic lead or synthetic varnishes.',
        answeredBy: 'Vernunt Safety Team'
      }
    ],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    isDigital: false,
    weightGrams: 680,
    dimensionsCm: { length: 22, width: 16, height: 9 },
    badges: ['100% Organic Wood', 'Zero Chemical Dye', 'Plastic Free Packaging'],
    hsnCode: '95030010',
    gstRate: 5,
    brand: 'Montessori Minds India',
    deliveryDaysEstimate: 2,
    vendorId: 'vend-montessori-minds',
    vendorName: 'Montessori Minds India',
    vendorSlug: 'montessori-minds-india',
    approvalStatus: 'approved'
  },
  {
    id: 'prod-art-03',
    name: 'Mess-Free Sensory Modeling Clay & Pottery Sculpting Studio',
    slug: 'mess-free-modeling-clay-sculpting-studio',
    shortDescription: 'Air-dry wheat-based modeling clay with 24 vibrant hues, 10 sculpting tools, and ceramic varnish.',
    description: `Complete sensory crafting studio for budding artists. Includes 24 individually sealed cups of non-sticky, ultra-pliable, non-crumbly air-dry clay. Air dries in 24 hours into sturdy keepsake figurines without baking or oven firing.
    
    Includes 10 child-safe smoothing and cutting tools, roller pin, googly eyes, keychain loops, and a gloss glaze topcoat bottle.`,
    price: 649,
    regularPrice: 999,
    salePrice: 649,
    onSale: true,
    discountPercentage: 35,
    sku: 'VRN-ART-003',
    stockQuantity: 62,
    stockStatus: 'instock',
    manageStock: true,
    category: 'Art & Creative Craft',
    subcategory: 'Clay & Sculpting',
    ageGroup: '3-6y',
    ageLabel: 'Ages 3 - 10 Years',
    featuredImage: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800',
    galleryImages: [
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1560421683-680b9c814e52?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['Art', 'Clay', 'Sensory Play', 'Craft Kit', 'Air Dry'],
    rating: 4.85,
    reviewCount: 76,
    reviews: [
      {
        id: 'rev-4',
        authorName: 'Meenakshi Sundaram',
        authorLocation: 'Chennai, Adyar',
        childAge: 'Child Age: 4 yrs',
        rating: 5,
        date: '2 weeks ago',
        title: 'Does not stain carpets or tables!',
        comment: 'Truly non-sticky and cleans off easily with a damp wipe. The colors blend beautifully.',
        verifiedBuyer: true,
        helpfulCount: 15
      }
    ],
    qaList: [],
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: false,
    isDigital: false,
    weightGrams: 850,
    badges: ['Wheat-Based', 'Zero Stain Formula', 'Air Dry 24H'],
    hsnCode: '34070010',
    gstRate: 12,
    brand: 'Little Sprouts Sensory & Arts',
    deliveryDaysEstimate: 2,
    vendorId: 'vend-littlesprouts',
    vendorName: 'Little Sprouts Sensory & Arts',
    vendorSlug: 'little-sprouts-sensory-crafts',
    approvalStatus: 'approved'
  },
  {
    id: 'prod-book-04',
    name: 'Indian Wildlife & Moral Tales Bilingual Hardcover Library (Set of 6 Books)',
    slug: 'indian-wildlife-moral-tales-bilingual-library',
    shortDescription: 'Vibrantly illustrated bilingual stories celebrating Indian flora, fauna, kindness, and courage.',
    description: `A rich collection of 6 hardbound storybooks written by acclaimed Indian children’s authors and illustrated in warm, vivid Indian folk-art styles. 
    
    Includes stories of the Western Ghats elephants, Kaziranga rhinos, Gir lions, and Himalayan snow leopards with paired English and Hindi/Kannada side-by-side vocabulary notes.`,
    price: 1199,
    regularPrice: 1799,
    salePrice: 1199,
    onSale: true,
    discountPercentage: 33,
    sku: 'VRN-BOK-004',
    stockQuantity: 34,
    stockStatus: 'instock',
    manageStock: true,
    category: 'Books & Story Sets',
    subcategory: 'Picture & Story Books',
    ageGroup: '3-6y',
    ageLabel: 'Ages 2 - 8 Years',
    featuredImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800',
    galleryImages: [
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['Books', 'Moral Stories', 'Bilingual', 'Hardcover', 'Bedtime Stories'],
    attributes: [
      {
        name: 'Language Pair',
        options: ['English + Hindi', 'English + Kannada', 'English + Tamil', 'English Only']
      }
    ],
    rating: 4.92,
    reviewCount: 64,
    reviews: [
      {
        id: 'rev-5',
        authorName: 'Vikram Joshi',
        authorLocation: 'Pune, Baner',
        childAge: 'Child Age: 5 yrs',
        rating: 5,
        date: '1 week ago',
        title: 'Heartwarming stories with stunning illustrations',
        comment: 'Our nightly bedtime ritual now revolves around the Western Ghats elephant tale. Thick matte paper that handles toddler hands well.',
        verifiedBuyer: true,
        helpfulCount: 22
      }
    ],
    qaList: [],
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isDigital: false,
    weightGrams: 1100,
    badges: ['Hardcover Keepsake', 'Soy Ink Printed', 'Award Winning'],
    hsnCode: '49019900',
    gstRate: 0,
    brand: 'Vernunt Story Tree',
    deliveryDaysEstimate: 2,
    vendorId: 'vend-montessori-minds',
    vendorName: 'Montessori Minds India',
    vendorSlug: 'montessori-minds-india',
    approvalStatus: 'approved'
  },
  {
    id: 'prod-safe-05',
    name: 'Complete Toddler Home Childproofing & Corner Safety Suite (36 Pcs)',
    slug: 'complete-toddler-childproofing-corner-safety-suite',
    shortDescription: 'High-density transparent corner cushions, multi-surface strap locks, and socket cover shields with 3M VHB tape.',
    description: `Engineered for curious crawling babies and active toddlers. Includes 16 crystal-clear ultra-soft silicone corner bumpers, 8 adjustable multi-surface cabinet latch straps, 8 heavy-duty plug socket guards, and 4 foam door pinch protectors.
    
    Uses genuine baby-safe 3M VHB adhesive that holds firm against toddler tugs but removes cleanly without peeling furniture wood varnish.`,
    price: 749,
    regularPrice: 1199,
    salePrice: 749,
    onSale: true,
    discountPercentage: 37,
    sku: 'VRN-SAF-005',
    stockQuantity: 80,
    stockStatus: 'instock',
    manageStock: true,
    category: 'Child Safety & Care',
    subcategory: 'Home Safety & Locks',
    ageGroup: '0-12m',
    ageLabel: 'Ages 6 Months - 4 Years',
    featuredImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800',
    galleryImages: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['Safety', 'Baby Proofing', 'Corner Guards', 'Socket Locks', 'Essential'],
    rating: 4.88,
    reviewCount: 112,
    reviews: [
      {
        id: 'rev-6',
        authorName: 'Ananya Deshmukh',
        authorLocation: 'Mumbai, Powai',
        childAge: 'Child Age: 10 mos',
        rating: 5,
        date: '4 days ago',
        title: 'Gives immense peace of mind as our baby started pulling up to stand',
        comment: 'The transparent corner guards are practically invisible on our glass coffee table and stay firmly attached.',
        verifiedBuyer: true,
        helpfulCount: 29
      }
    ],
    qaList: [],
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: false,
    isDigital: false,
    weightGrams: 420,
    badges: ['3M VHB Adhesive', 'Invisible Crystal Clear', 'BPA & Phthalate Free'],
    hsnCode: '39269099',
    gstRate: 18,
    brand: 'KiddySafe Protection & Health',
    deliveryDaysEstimate: 1,
    vendorId: 'vend-kiddysafe',
    vendorName: 'KiddySafe Protection & Health',
    vendorSlug: 'kiddysafe-child-protection',
    approvalStatus: 'approved'
  },
  {
    id: 'prod-gear-06',
    name: 'Vernunt Junior Agility & Playmate Sports Cone & Goal Set',
    slug: 'junior-agility-playmate-sports-set',
    shortDescription: 'Pop-up foldable football goal, 10 soft training cones, mini ball with pump, and agility ladder.',
    description: `Turn any living room, terrace, society lawn, or park into an active energy-burning play zone. Sets up in 30 seconds with instant twist-fold fiberglass poles.
    
    Includes weather-resistant nylon net, 10 flexible step-on cones, 1 soft-grip size-2 junior football with hand pump, and a handy shoulder tote bag.`,
    price: 1299,
    regularPrice: 1999,
    salePrice: 1299,
    onSale: true,
    discountPercentage: 35,
    sku: 'VRN-GER-006',
    stockQuantity: 22,
    stockStatus: 'instock',
    manageStock: true,
    category: 'Playdate & Outdoor Gear',
    subcategory: 'Outdoor & Sports',
    ageGroup: '3-6y',
    ageLabel: 'Ages 3 - 9 Years',
    featuredImage: 'https://images.unsplash.com/photo-1516567727-459e4558f8cf?auto=format&fit=crop&q=80&w=800',
    galleryImages: [
      'https://images.unsplash.com/photo-1516567727-459e4558f8cf?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['Sports', 'Football', 'Outdoor Play', 'Playdate', 'Agility'],
    rating: 4.81,
    reviewCount: 45,
    reviews: [],
    qaList: [],
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isDigital: false,
    weightGrams: 1250,
    badges: ['Pop-Up in 30 Sec', 'Tear-Proof Netting', 'All-Weather'],
    hsnCode: '95066200',
    gstRate: 12,
    brand: 'BrainyBlocks STEM Labs',
    deliveryDaysEstimate: 1,
    vendorId: 'vend-brainy-stem',
    vendorName: 'BrainyBlocks STEM Labs',
    vendorSlug: 'brainy-blocks-stem-labs',
    approvalStatus: 'approved'
  },
  {
    id: 'prod-digi-07',
    name: '1000+ Screen-Free Developmental Play & Sensory Activity Mega Bundle (Digital Download)',
    slug: 'screen-free-developmental-play-sensory-activity-bundle',
    shortDescription: 'Instant high-resolution PDF printables, milestone journals, chore charts, and flashcards across all age groups.',
    description: `Instant download VIP archive packed with over 1,000 professionally curated screen-free learning resources designed by pediatric occupational therapists and Montessori educators.
    
    Includes printable alphabet dot markers, fine-motor scissor cutting guides, sensory tray recipes, emotion check-in wheels, routine visual schedules, and holiday science experiments. Unlimited lifetime reprint rights for your family.`,
    price: 349,
    regularPrice: 999,
    salePrice: 349,
    onSale: true,
    discountPercentage: 65,
    sku: 'VRN-DIG-007',
    stockQuantity: 9999,
    stockStatus: 'instock',
    manageStock: false,
    category: 'Digital Activity Kits',
    subcategory: 'Printables & Curriculum',
    ageGroup: 'all-ages',
    ageLabel: 'All Ages (0 - 12 Years)',
    featuredImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800',
    galleryImages: [
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['Digital Download', 'Printables', 'Montessori', 'Instant Access', 'Homeschool'],
    rating: 4.97,
    reviewCount: 320,
    reviews: [
      {
        id: 'rev-7',
        authorName: 'Shalini Nair',
        authorLocation: 'Kochi, Kakkanad',
        childAge: 'Child Age: 3 & 6 yrs',
        rating: 5,
        date: 'Yesterday',
        title: 'Incredible value, printed 40 pages immediately on our home printer',
        comment: 'The scissor cutting guides and emotion wheels are fantastic. Keeps our weekends productive and screen-free.',
        verifiedBuyer: true,
        helpfulCount: 52
      }
    ],
    qaList: [],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    isDigital: true,
    digitalDownloadUrl: 'https://vernunt.com/downloads/Vernunt-Mega-Screen-Free-Activity-Bundle-2026.pdf',
    digitalFileType: 'PDF (Vector High-Res, 280MB)',
    badges: ['Instant Email & App Download', 'Lifetime Updates', 'Print Anywhere'],
    hsnCode: '998439',
    gstRate: 18,
    brand: 'Vernunt Digital Labs',
    deliveryDaysEstimate: 0,
    vendorId: 'vend-montessori-minds',
    vendorName: 'Montessori Minds India',
    vendorSlug: 'montessori-minds-india',
    approvalStatus: 'approved'
  },
  {
    id: 'prod-feed-08',
    name: 'Organic Bamboo & Food-Grade Silicone Baby Weaning Suction Bowl & Cutlery Set',
    slug: 'organic-bamboo-silicone-baby-weaning-bowl-set',
    shortDescription: 'Super-grip anti-spill suction base with soft ergonomic gum-friendly silicone training spoon and fork.',
    description: `Make baby-led weaning joyful and mess-free. Features 100% natural antibacterial organic bamboo bowl with a powerful food-grade silicone suction base that locks firmly onto highchair trays.
    
    Includes soft flexible silicone spoon and fork designed to protect sensitive teething gums while developing independent self-feeding grasp.`,
    price: 799,
    regularPrice: 1299,
    salePrice: 799,
    onSale: true,
    discountPercentage: 38,
    sku: 'VRN-FEE-008',
    stockQuantity: 38,
    stockStatus: 'instock',
    manageStock: true,
    category: 'Child Safety & Care',
    subcategory: 'Feeding & Weaning',
    ageGroup: '0-12m',
    ageLabel: 'Ages 6 Months - 3 Years',
    featuredImage: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=800',
    galleryImages: [
      'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['Weaning', 'Bamboo', 'Silicone', 'Suction Bowl', 'Non-Toxic'],
    attributes: [
      {
        name: 'Silicone Color',
        options: ['Sage Green', 'Dusty Rose', 'Warm Ochre', 'Sky Blue']
      }
    ],
    rating: 4.87,
    reviewCount: 84,
    reviews: [],
    qaList: [],
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: false,
    isDigital: false,
    weightGrams: 360,
    badges: ['100% Food Grade Silicone', 'BPA & PVC Free', 'Anti-Spill Suction'],
    hsnCode: '39241090',
    gstRate: 12,
    brand: 'KiddySafe Protection & Health',
    deliveryDaysEstimate: 1,
    vendorId: 'vend-kiddysafe',
    vendorName: 'KiddySafe Protection & Health',
    vendorSlug: 'kiddysafe-child-protection',
    approvalStatus: 'approved'
  }
];

export const INITIAL_MOCK_ORDERS: StoreOrder[] = [
  {
    id: 'ord-8901',
    orderNumber: 'VRN-2026-8901',
    invoiceNumber: 'INV-VRN-8901',
    customerId: 'cust-demo-1',
    customerName: 'Aarti Menon',
    customerEmail: 'aarti.menon@example.com',
    customerPhone: '+91 98765 43210',
    shippingAddress: {
      fullName: 'Aarti Menon',
      phone: '+91 98765 43210',
      email: 'aarti.menon@example.com',
      pincode: '560102',
      addressLine1: 'Flat 402, Green Glen Layout, Bellandur',
      landmark: 'Near Central Mall',
      city: 'Bengaluru',
      state: 'Karnataka',
      addressType: 'Home',
      isDefault: true
    },
    billingAddress: {
      fullName: 'Aarti Menon',
      phone: '+91 98765 43210',
      email: 'aarti.menon@example.com',
      pincode: '560102',
      addressLine1: 'Flat 402, Green Glen Layout, Bellandur',
      city: 'Bengaluru',
      state: 'Karnataka',
      addressType: 'Home'
    },
    items: [
      {
        id: 'prod-stem-01-default',
        productId: 'prod-stem-01',
        product: INITIAL_STORE_PRODUCTS[0],
        selectedAttributes: { 'Edition': 'Standard 6-in-1', 'Storage Box': 'Eco Carton' },
        quantity: 1,
        unitPrice: 1499,
        unitRegularPrice: 2199,
        gstRate: 12,
        totalPrice: 1499,
        vendorId: 'vend-brainy-stem',
        vendorName: 'BrainyBlocks STEM Labs'
      },
      {
        id: 'prod-art-03-default',
        productId: 'prod-art-03',
        product: INITIAL_STORE_PRODUCTS[2],
        selectedAttributes: {},
        quantity: 1,
        unitPrice: 649,
        unitRegularPrice: 999,
        gstRate: 12,
        totalPrice: 649,
        vendorId: 'vend-littlesprouts',
        vendorName: 'Little Sprouts Sensory & Arts'
      }
    ],
    itemCount: 2,
    subtotal: 2148,
    discountAmount: 322,
    appliedCouponCode: 'VERNUNT15',
    shippingFee: 0,
    shippingMethod: 'express',
    taxAmountGst: 195,
    totalAmount: 1826,
    paymentMethod: 'UPI',
    paymentStatus: 'paid',
    paymentReferenceId: 'UPI-RAZOR-8921049281',
    orderStatus: 'out_for_delivery',
    statusHistory: [
      { status: 'pending', timestamp: '2026-08-30 10:15 AM', note: 'Order placed and paid via UPI.' },
      { status: 'processing', timestamp: '2026-08-30 11:30 AM', note: 'Quality check passed at Bengaluru Fulfillment Center.' },
      { status: 'shipped', timestamp: '2026-08-30 04:45 PM', note: 'Handed over to BlueDart Express courier.', location: 'Bengaluru Hub' },
      { status: 'out_for_delivery', timestamp: '2026-08-31 08:30 AM', note: 'Courier rider assigned with security PIN.', location: 'Bellandur Hub' }
    ],
    trackingNumber: 'BLUEDART-VRN-890123',
    courierPartner: 'BlueDart Express Priority',
    placedAt: 'Aug 30, 2026, 10:15 AM',
    canCancel: false,
    canReturn: true
  }
];

// Helper to get Products from storage
export const getStoredProducts = (): StoreProduct[] => {
  try {
    const saved = localStorage.getItem('vernunt_store_products_v1');
    return saved ? JSON.parse(saved) : INITIAL_STORE_PRODUCTS;
  } catch {
    return INITIAL_STORE_PRODUCTS;
  }
};

// Helper to save Products to storage
export const saveStoredProducts = (products: StoreProduct[]) => {
  try {
    localStorage.setItem('vernunt_store_products_v1', JSON.stringify(products));
    window.dispatchEvent(new CustomEvent('vernunt_products_updated', { detail: products }));
  } catch (err) {
    console.error('Error saving products:', err);
  }
};

// Helper to get Categories from storage
export const getStoredCategories = (): StoreCategory[] => {
  try {
    const saved = localStorage.getItem('vernunt_store_categories_v1');
    if (saved) {
      const parsed: StoreCategory[] = JSON.parse(saved);
      // Ensure kids-food exists
      if (!parsed.some(c => c.id === 'kids-food')) {
        const merged = [...parsed, ...STORE_CATEGORIES.filter(sc => !parsed.some(p => p.id === sc.id))];
        localStorage.setItem('vernunt_store_categories_v1', JSON.stringify(merged));
        return merged;
      }
      return parsed;
    }
    return STORE_CATEGORIES;
  } catch {
    return STORE_CATEGORIES;
  }
};

// Helper to save Categories to storage
export const saveStoredCategories = (categories: StoreCategory[]) => {
  try {
    localStorage.setItem('vernunt_store_categories_v1', JSON.stringify(categories));
    window.dispatchEvent(new CustomEvent('vernunt_categories_updated', { detail: categories }));
  } catch (err) {
    console.error('Error saving categories:', err);
  }
};

// Helper to get Attributes from storage
export const getStoredAttributes = (): StoreAttribute[] => {
  try {
    const saved = localStorage.getItem('vernunt_store_attributes_v1');
    return saved ? JSON.parse(saved) : DEFAULT_STORE_ATTRIBUTES;
  } catch {
    return DEFAULT_STORE_ATTRIBUTES;
  }
};

// Helper to save Attributes to storage
export const saveStoredAttributes = (attributes: StoreAttribute[]) => {
  try {
    localStorage.setItem('vernunt_store_attributes_v1', JSON.stringify(attributes));
    window.dispatchEvent(new CustomEvent('vernunt_attributes_updated', { detail: attributes }));
  } catch (err) {
    console.error('Error saving attributes:', err);
  }
};

// Helper to get Orders from storage
export const getStoredOrders = (): StoreOrder[] => {
  try {
    const saved = localStorage.getItem('vernunt_store_orders_v1');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_ORDERS;
  } catch {
    return INITIAL_MOCK_ORDERS;
  }
};

// Helper to save Orders to storage
export const saveStoredOrders = (orders: StoreOrder[]) => {
  try {
    localStorage.setItem('vernunt_store_orders_v1', JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('vernunt_orders_updated', { detail: orders }));
  } catch (err) {
    console.error('Error saving orders:', err);
  }
};

