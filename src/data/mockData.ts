import { ChildProfile, VerificationStatus, CommunityEvent, MarketItem, DaycarePlayhomeProfile, CareBookingRequest } from '../types.ts';
import { BANGALORE_PLAYMATES } from './bangaloreProfiles.ts';

export const INITIAL_PLAYMATES: ChildProfile[] = BANGALORE_PLAYMATES;

export const MOCK_EVENTS: CommunityEvent[] = [
  {
    id: 'blr-event-1',
    title: 'Cubbon Park Weekend Family Art & Nature Sketching',
    description: 'Bring your watercolors, pastels, and sketchbooks! Parents and children gather on the bamboo grove lawn for guided nature sketching, leaf printing, and healthy picnic snacks.',
    date: '2026-06-20',
    time: '09:00 AM',
    location: 'Cubbon Park Bamboo Grove Lawn, Bangalore',
    hostName: 'Karthik & Deepa Rao',
    attendeesCount: 38,
    joined: false,
    category: 'Event',
    photoUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=600',
    tags: ['Art', 'Nature', 'Cubbon Park', 'Sensory'],
    iconEmoji: '🎨',
    ticketPrice: 0,
    lat: 12.9763,
    lng: 77.5929
  },
  {
    id: 'blr-event-2',
    title: 'HSR Layout Junior Football & Agility Drills',
    description: 'An energetic morning session featuring fun dribbling obstacle courses, parent-child relay races, and beginner mini-matches for kids aged 4-9 at HSR Sector 2 park.',
    date: '2026-06-21',
    time: '07:30 AM',
    location: 'Sector 2 Play Arena Park, HSR Layout, Bangalore',
    hostName: 'Coach Rakesh (Bangalore FC Academy)',
    attendeesCount: 26,
    joined: false,
    category: 'Activity',
    photoUrl: 'https://images.unsplash.com/photo-1516567727-459e4558f8cf?auto=format&fit=crop&q=80&w=600',
    tags: ['Football', 'Fitness', 'HSR Layout', 'Sports'],
    iconEmoji: '⚽',
    ticketPrice: 0,
    lat: 12.9121,
    lng: 77.6446
  },
  {
    id: 'blr-event-3',
    title: 'Whitefield Junior Lego Robotics & STEM Challenge',
    description: 'Hands-on micro-controller assembly and creative motorized brick builds. Guided by tech parents from EPIP & ITPL. Medals & certificates for all young inventors!',
    date: '2026-06-27',
    time: '10:30 AM',
    location: 'Prestige Shantiniketan Club Amphitheatre, Whitefield, Bangalore',
    hostName: 'Arjun & Nikita (STEM Parents Collective)',
    attendeesCount: 42,
    joined: false,
    category: 'Class',
    photoUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=600',
    tags: ['Robotics', 'Lego', 'Whitefield', 'STEM'],
    iconEmoji: '🤖',
    ticketPrice: 299,
    featured: true,
    lat: 12.9698,
    lng: 77.7500
  },
  {
    id: 'blr-event-4',
    title: 'Indiranagar Clay Pottery & Terracotta Sculpting Studio',
    description: 'Learn the soothing art of sculpting miniature diyas, animal figurines, and clay pots with natural clay. Interactive sensory-rich workshop for ages 3-10.',
    date: '2026-06-28',
    time: '04:00 PM',
    location: 'Defense Colony Enclave Art Studio, 100 Ft Rd, Indiranagar, Bangalore',
    hostName: 'Meera Deshmukh (Creative Arts Guild)',
    attendeesCount: 20,
    joined: false,
    category: 'Class',
    photoUrl: 'https://images.unsplash.com/photo-1565192647048-f997ded87958?auto=format&fit=crop&q=80&w=600',
    tags: ['Pottery', 'Clay', 'Indiranagar', 'Art'],
    iconEmoji: '🏺',
    ticketPrice: 350,
    lat: 12.9784,
    lng: 77.6408
  },
  {
    id: 'blr-event-5',
    title: 'Lalbagh Botanical Seed Discovery & Butterfly Trail Walk',
    description: 'Explore exotic trees, giant lotus ponds, and butterfly corridors. Includes printed treasure hunt maps, magnifying glasses, and botanical sticker albums for every child!',
    date: '2026-07-05',
    time: '08:00 AM',
    location: 'Lalbagh Botanical Gardens West Gate, Jayanagar / Basavanagudi, Bangalore',
    hostName: 'Dr. Srinivas Holla (Ecologist)',
    attendeesCount: 30,
    joined: false,
    category: 'Activity',
    photoUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=600',
    tags: ['Nature', 'Lalbagh', 'Ecology', 'Outdoor'],
    iconEmoji: '🌿',
    ticketPrice: 0,
    lat: 12.9507,
    lng: 77.5848
  },
  {
    id: 'blr-event-6',
    title: 'Koramangala Toddler Music & Giant Bubble Play Circle',
    description: 'Sensory weekend music circle with xylophones, shakers, acoustic rhymes, and giant iridescent bubbles on the lawn for infants & toddlers aged 0-3.',
    date: '2026-07-11',
    time: '10:00 AM',
    location: 'Koramangala 4th Block Park & Community Center, Bangalore',
    hostName: 'Sneha & Rohan Gowda',
    attendeesCount: 35,
    joined: true,
    category: 'Event',
    photoUrl: 'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&q=80&w=600',
    tags: ['Toddlers', 'Music', 'Koramangala', 'Bubbles'],
    iconEmoji: '🫧',
    ticketPrice: 0,
    lat: 12.9352,
    lng: 77.6245
  },
  {
    id: 'blr-event-7',
    title: 'Bangalore Junior Vedic Math & Chess Grand Prix',
    description: 'Friendly speed arithmetic challenges, pattern logic puzzles, and beginner-to-advanced swiss-format chess rounds. Refreshments and trophies for participants!',
    date: '2026-07-19',
    time: '02:30 PM',
    location: 'Malleshwaram 15th Cross Canara Union Hall, Bangalore',
    hostName: 'Prof. Ananth Murthy',
    attendeesCount: 48,
    joined: false,
    category: 'Competition',
    photoUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600',
    tags: ['Chess', 'Vedic Math', 'Malleshwaram', 'Logic'],
    iconEmoji: '♟️',
    ticketPrice: 199,
    lat: 13.0031,
    lng: 77.5643
  },
  {
    id: 'blr-event-8',
    title: 'Sarjapur Kannada & English Storytelling Puppet Carnival',
    description: 'Magical dramatization of Tenali Rama and Panchatantra folk stories with giant shadow puppets, folk instruments, and costume dress-ups.',
    date: '2026-07-26',
    time: '04:30 PM',
    location: 'Rainbow Drive Amphitheatre, Sarjapur Road, Bangalore',
    hostName: 'Vernunt Bangalore Parents Collective',
    attendeesCount: 65,
    joined: false,
    category: 'Event',
    photoUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&q=80&w=600',
    tags: ['Puppets', 'Storytelling', 'Sarjapur', 'Heritage'],
    iconEmoji: '🎭',
    ticketPrice: 0,
    featured: true,
    lat: 12.9103,
    lng: 77.6836
  }
];

export const MOCK_MARKETPLACE: MarketItem[] = [
  {
    id: 'market-1',
    title: 'Organic Ragi & Almond Baby Puffs (Sugar-Free Pack of 4)',
    price: 380,
    description: 'Grain-free organic Karnataka sprouted ragi cookies prepared with pureed apple, crushed almonds, and zero artificial sugars. Great for teething infants.',
    sellerName: 'Namma Wholesome Organic Kitchen',
    category: 'Baby & Kids Food',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400',
    contactEmail: 'orders@nammaorganics.example.com'
  },
  {
    id: 'market-2',
    title: 'Montessori Wooden Balance Beam & Sensory Steps',
    price: 1450,
    description: 'Handcrafted smooth non-toxic teak wood balance stepping set for indoor coordination and vestibular muscle development.',
    sellerName: 'Bangalore Montessori Guild',
    category: 'Toys & Lego',
    imageUrl: 'https://images.unsplash.com/photo-1531844251246-9a1bfaae0d17?auto=format&fit=crop&q=80&w=400',
    contactEmail: 'guild@bangaloremontessori.example.com'
  },
  {
    id: 'market-3',
    title: 'Junior Backyard Telescope & Star Constellation Map',
    price: 1999,
    description: 'Shockproof 70mm optical astronomy scope with moon filter, compass, and laminated Bangalore sky constellation wheel.',
    sellerName: 'Curious Stargazers Club',
    category: 'Learning Kits',
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=400',
    contactEmail: 'sky@curiouskids.example.com'
  }
];

export const MOCK_DAYCARES: DaycarePlayhomeProfile[] = [
  {
    id: 'blr-playhome-1',
    title: 'Little Blossoms Montessori Playhome & Creche',
    hostName: 'Ananya Deshmukh (Certified Montessori Educator)',
    providerType: 'Certified Playhome',
    providerEntityType: 'center',
    careServiceModes: ['host_at_my_home', 'visit_parents_home'],
    hourlyRate: 180,
    hourlyRateNeighborHome: 180, // Neighbor / Center premises rate
    hourlyRateParentHome: 260, // Parent's home care rate
    visitingRadiusKm: 6,
    halfDayRate: 600,
    fullDayRate: 1100,
    monthlyDaycareFee: 8500,
    bio: 'Certified AMI Montessori educator with 8+ years experience. Safe, sunlit ground floor apartment with childproof corners, wooden sensorial toys, sanitized nap pods, and CCTV security.',
    location: {
      lat: 12.9784,
      lng: 77.6408,
      address: '12th Main, HAL 2nd Stage, Indiranagar, Bangalore',
      distance: 0.4
    },
    rating: 4.9,
    reviewsCount: 38,
    experienceYears: 8,
    maxCapacity: 6,
    currentOccupancy: 2,
    acceptedAgeGroups: ['6m - 2 yrs', '2 - 5 yrs', '5 - 8 yrs'],
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableTimeSlots: ['08:30 AM - 01:00 PM', '02:00 PM - 06:30 PM', 'Full Day (8:30 AM - 7 PM)'],
    amenities: [
      'AMI Montessori Sensorial Materials',
      'Childproofed Padded Floors & Air Purifier',
      'Organic Fresh Purees & Finger Foods',
      'Live Secure Parent Check-in Log',
      'Sanitized Nap Cots & First Aid Kit'
    ],
    photos: [
      'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1596464716127-f2a829822301?auto=format&fit=crop&q=80&w=800'
    ],
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    phone: '9845011223',
    email: 'littleblossoms.indiranagar@gmail.com',
    aadhaarVerified: true,
    policeVerified: true,
    isAcceptingNow: true,
    instantBooking: true,
    parentKidNames: 'Mom of Aadhya (4y)',
    emergencyContact: '+91 9845011200',
    reviews: [
      {
        id: 'rev-blr-1',
        parentName: 'Priya Hegde',
        rating: 5,
        comment: 'Left my 2-year old for 4 hours while attending meetings. Ananya sent photo updates every 40 mins. My child loved the wooden puzzles!',
        date: '2 days ago'
      },
      {
        id: 'rev-blr-2',
        parentName: 'Vikram Reddy',
        rating: 5,
        comment: 'Cleanest playhome in Indiranagar. Extremely trustworthy and transparent drop-off PIN system.',
        date: '1 week ago'
      }
    ]
  },
  {
    id: 'blr-playhome-2',
    title: 'Kavitha Aunty\'s Cozy HSR Society Sitting & Drop-in',
    hostName: 'Kavitha Swaminathan',
    providerType: 'Neighbour Parent',
    providerEntityType: 'individual',
    careServiceModes: ['host_at_my_home', 'visit_parents_home'],
    hourlyRate: 150,
    hourlyRateNeighborHome: 150, // Neighbour premises
    hourlyRateParentHome: 220, // Parent premises
    visitingRadiusKm: 5,
    halfDayRate: 500,
    fullDayRate: 900,
    bio: 'Loving mom of 2 school-going kids in gated Purva Vantage society, HSR Sector 2. Quiet 3-BHK home with extensive storybook library, Duplo sets, art supplies, and home-cooked wholesome meals.',
    location: {
      lat: 12.9121,
      lng: 77.6446,
      address: 'Sector 2, 27th Main, HSR Layout, Bangalore',
      distance: 0.7
    },
    rating: 4.8,
    reviewsCount: 29,
    experienceYears: 6,
    maxCapacity: 3,
    currentOccupancy: 1,
    acceptedAgeGroups: ['1 - 3 yrs', '3 - 6 yrs', '6 - 10 yrs'],
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    availableTimeSlots: ['09:00 AM - 01:00 PM', '03:30 PM - 07:30 PM', 'Full Day (9 AM - 7 PM)'],
    amenities: [
      'Gated Society Security & Park Access',
      'Fresh Ragi Malt & Wholesome Khichdi',
      'Extensive Storybook Reading Corner',
      'Duplo & Wooden Train Sets',
      'First Aid Certified Parent'
    ],
    photos: [
      'https://images.unsplash.com/photo-1596464716127-f2a829822301?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&q=80&w=800'
    ],
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400&crop=faces',
    phone: '9880123456',
    email: 'kavitha.hsr@example.com',
    aadhaarVerified: true,
    policeVerified: true,
    isAcceptingNow: true,
    instantBooking: true,
    parentKidNames: 'Mom of Aarav (5y) & Kabir (8y)',
    emergencyContact: '+91 9880123400',
    reviews: [
      {
        id: 'rev-blr-3',
        parentName: 'Swati Suresh',
        rating: 5,
        comment: 'Kavitha is a lifesaver! Took care of my daughter during an urgent client escalation. Felt 100% like family.',
        date: '4 days ago'
      }
    ]
  },
  {
    id: 'blr-playhome-3',
    title: 'Koramangala Free Mutual Reciprocal Care Circle',
    hostName: 'Meera Nair & Bangalore Parents Circle',
    providerType: 'Neighbour Parent',
    providerEntityType: 'individual',
    careServiceModes: ['host_at_my_home'],
    hourlyRate: 0, // Free Co-Op
    hourlyRateNeighborHome: 0,
    hourlyRateParentHome: 0,
    visitingRadiusKm: 3,
    halfDayRate: 0,
    fullDayRate: 0,
    bio: 'Passionate advocate of neighborhood community sharing! Stay-at-home mother with 3-year-old Reyansh in Koramangala 6th Block. Happy to watch your kid for an hour or two for FREE as reciprocal playmates.',
    location: {
      lat: 12.9352,
      lng: 77.6245,
      address: '6th Block, Koramangala, Bangalore',
      distance: 0.9
    },
    rating: 4.9,
    reviewsCount: 22,
    experienceYears: 4,
    maxCapacity: 2,
    currentOccupancy: 0,
    acceptedAgeGroups: ['2 - 5 yrs'],
    availableDays: ['Mon', 'Wed', 'Fri', 'Sat'],
    availableTimeSlots: ['10:00 AM - 01:00 PM', '04:00 PM - 07:00 PM'],
    amenities: [
      '100% FREE Neighbor Reciprocal Exchange',
      'Enclosed Balcony Play Lawn',
      'Art & Craft Materials & Play-Doh',
      'Fresh Fruit Platters & Milk',
      'Aadhaar Verified Trust'
    ],
    photos: [
      'https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&q=80&w=800'
    ],
    avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=400',
    phone: '9845556677',
    email: 'meera.nair.blr@example.com',
    aadhaarVerified: true,
    policeVerified: false,
    isAcceptingNow: true,
    instantBooking: false,
    parentKidNames: 'Mom of Reyansh (3y)',
    emergencyContact: '+91 9845556600',
    reviews: [
      {
        id: 'rev-blr-4',
        parentName: 'Sunita Rao',
        rating: 5,
        comment: 'Meera watched my son while I attended a school orientation. Wonderful parent, great community spirit!',
        date: '5 days ago'
      }
    ]
  },
  {
    id: 'blr-playhome-4',
    title: 'Whitefield Sunny Nest Daycare & Toddler Drop-in Studio',
    hostName: 'Dr. Sneha Hegde & Rohan Shenoy',
    providerType: 'Montessori Daycare',
    providerEntityType: 'center',
    careServiceModes: ['host_at_my_home', 'visit_parents_home'],
    hourlyRate: 240,
    hourlyRateNeighborHome: 240,
    hourlyRateParentHome: 320,
    visitingRadiusKm: 8,
    halfDayRate: 750,
    fullDayRate: 1350,
    monthlyDaycareFee: 9500,
    bio: 'Dedicated ground-floor daycare studio in Prestige Shantiniketan with shaded sandbox, soft gym, sensory ball pit, pediatric nurse on call, and HD CCTV parent streaming.',
    location: {
      lat: 12.9698,
      lng: 77.7500,
      address: 'Prestige Shantiniketan, Whitefield Main Rd, Bangalore',
      distance: 1.2
    },
    rating: 5.0,
    reviewsCount: 51,
    experienceYears: 9,
    maxCapacity: 8,
    currentOccupancy: 3,
    acceptedAgeGroups: ['6m - 2 yrs', '2 - 5 yrs', '5 - 10 yrs'],
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableTimeSlots: ['08:00 AM - 01:00 PM', '02:00 PM - 06:30 PM', 'Full Day (8 AM - 7:30 PM)'],
    amenities: [
      '24/7 HD CCTV Parent Streaming',
      'Pediatric First Aid & Registered Nurse Assistance',
      'Fresh Organic Purees & Finger Snacks',
      'Indoor Ball Pit & Soft Play Gym',
      'Sanitized Nap Suites'
    ],
    photos: [
      'https://images.unsplash.com/photo-1560421683-6856ea585c78?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=800'
    ],
    avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=400&crop=faces',
    phone: '9845998877',
    email: 'sunnynest.whitefield@gmail.com',
    aadhaarVerified: true,
    policeVerified: true,
    isAcceptingNow: true,
    instantBooking: true,
    parentKidNames: 'Parents of Tara (3y) & Vivaan (6y)',
    emergencyContact: '+91 9845998800',
    reviews: [
      {
        id: 'rev-blr-5',
        parentName: 'Nisha Singhania',
        rating: 5,
        comment: 'Professional staff, sparkling clean nap area. Used them for 5 hours while attending office workshops.',
        date: '3 days ago'
      }
    ]
  }
];

export const INITIAL_CARE_BOOKINGS: CareBookingRequest[] = [
  {
    id: 'care-req-101',
    parentId: 'user-0',
    parentName: 'Ayaan\'s Family',
    parentPhone: '9845001122',
    childName: 'Ayaan',
    childAge: 5,
    childGender: 'Boy',
    providerId: 'blr-playhome-1',
    providerName: 'Ananya Deshmukh',
    providerTitle: 'Little Blossoms Montessori Playhome & Creche',
    providerType: 'Certified Playhome',
    providerHourlyRate: 180,
    date: '2026-08-25',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    durationHours: 3,
    totalAmount: 540,
    status: 'Accepted',
    dropOffPin: '4829',
    pickupPin: '7391',
    specialInstructions: 'Loves Lego building and apple slices. Has nap around 12:30 PM. Water bottle in yellow backpack.',
    emergencyContact: '+91 9845001122',
    createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    senderRole: 'parent',
    careActivityLog: [
      { timestamp: '10:05 AM', activity: 'Arrival & Handshake', note: 'Child settled in with wooden train track' },
      { timestamp: '11:15 AM', activity: 'Snack Time', note: 'Ate organic fruit slices & water' }
    ]
  }
];

export const INITIAL_DAYCARE_PLAYHOMES: DaycarePlayhomeProfile[] = MOCK_DAYCARES;

