import { BangalorePark, ParkEquipmentItem, ParkAccessibilityFeature, ParkGalleryPhoto } from '../types.ts';

// ---------------------------------------------------------------------------
// CURATED PHOTO GALLERIES FOR KEY BANGALORE PARKS
// ---------------------------------------------------------------------------
const CURATED_GALLERIES: Record<string, ParkGalleryPhoto[]> = {
  'cubbon-park-chamarajendra': [
    {
      url: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=80',
      caption: 'Lush Bamboo Grove and Shady Canopy near Kasturba Road Gate',
      tag: 'Shade & Lawns'
    },
    {
      url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
      caption: 'Bal Bhavan Children Play Zone with Toddler Swings & Slides',
      tag: 'Swings & Slides'
    },
    {
      url: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=1200&q=80',
      caption: 'Spacious Sensory Sandbox with Play Buckets & Shovels',
      tag: 'Sandbox'
    },
    {
      url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80',
      caption: 'Wide Paved Perimeter Walking & Stroller Promenade',
      tag: 'Walking Track'
    },
    {
      url: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=1200&q=80',
      caption: 'Accessible Step-Free Pathways and Shaded Rest Benches',
      tag: 'Accessibility'
    }
  ],
  'lalbagh-botanical-garden': [
    {
      url: 'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?auto=format&fit=crop&w=1200&q=80',
      caption: 'Famous Glass House with Expansive Surrounding Toddler Lawns',
      tag: 'Shade & Lawns'
    },
    {
      url: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?auto=format&fit=crop&w=1200&q=80',
      caption: 'Dedicated Children Play Area with Climbing Frames & Swings',
      tag: 'Play Area'
    },
    {
      url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
      caption: 'Clean Sifted River Sand Area under Mature Rain Trees',
      tag: 'Sandbox'
    },
    {
      url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80',
      caption: 'Lotus Lake Walking Loop - Stroller Friendly & Duck Watching',
      tag: 'Walking Track'
    },
    {
      url: 'https://images.unsplash.com/photo-1516214104703-d870798883c5?auto=format&fit=crop&w=1200&q=80',
      caption: 'Step-Free Paved West Gate Entrance with Accessible Restrooms',
      tag: 'Accessibility'
    }
  ],
  'coles-park-frazer-town': [
    {
      url: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=1200&q=80',
      caption: 'Inclusive Playground with Adaptive Swings & Braille Pathways',
      tag: 'Accessibility'
    },
    {
      url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
      caption: 'Toddler Play Complex with Wave Slides & Low Ramps',
      tag: 'Swings & Slides'
    },
    {
      url: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=1200&q=80',
      caption: 'Shaded Sandpit with Elevated Sand Play Tables for Wheelchair Access',
      tag: 'Sandbox'
    },
    {
      url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80',
      caption: 'Dedicated Roller Skating Loop and Enclosed Children Court',
      tag: 'Play Area'
    }
  ],
  'hsr-sector-2-childrens-park': [
    {
      url: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=80',
      caption: 'Sector 2 Play Arena with EPDM Rubberized Cushion Flooring',
      tag: 'Play Area'
    },
    {
      url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
      caption: 'Multi-Kid Swings Set: Bucket Swings, Tire Swing & Standard Swings',
      tag: 'Swings & Slides'
    },
    {
      url: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=1200&q=80',
      caption: 'Dual Sandbox Area with Castle Moulds and Fine White Sand',
      tag: 'Sandbox'
    },
    {
      url: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?auto=format&fit=crop&w=1200&q=80',
      caption: 'Rope Net Pyramid Climber and Balance Log Obstacle Course',
      tag: 'Play Area'
    },
    {
      url: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=1200&q=80',
      caption: 'Smooth Stroller Track and Shaded Parent Gazebo Seating',
      tag: 'Accessibility'
    }
  ],
  'sankey-tank-park-sadashivanagar': [
    {
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      caption: 'Scenic Lakeside Promenade with Cool Evening Breeze',
      tag: 'Shade & Lawns'
    },
    {
      url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
      caption: 'Children Play Station with Spiral Slide & Toddler Swings',
      tag: 'Swings & Slides'
    },
    {
      url: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=1200&q=80',
      caption: 'Clean Sifted Sand Pit with Shade Awning',
      tag: 'Sandbox'
    },
    {
      url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80',
      caption: 'Wide 2.2km Lakeside Paved Jogging and Stroller Promenade',
      tag: 'Walking Track'
    }
  ]
};

// Generic thematic photos matching facilities
const THEMATIC_PHOTOS = {
  swings: [
    { url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80', caption: 'High-back toddler bucket swings & classic belt swings', tag: 'Swings & Slides' as const },
    { url: 'https://images.unsplash.com/photo-1516214104703-d870798883c5?auto=format&fit=crop&w=1200&q=80', caption: 'Shaded twin swing set with safety chains and rubber mats', tag: 'Swings & Slides' as const }
  ],
  slides: [
    { url: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?auto=format&fit=crop&w=1200&q=80', caption: 'Double wave slide and enclosed spiral tube slide', tag: 'Swings & Slides' as const },
    { url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80', caption: 'Gentle low-slope toddler slide with anti-slip stairs', tag: 'Play Area' as const }
  ],
  sandbox: [
    { url: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=1200&q=80', caption: 'Enclosed sandpit with sifted river sand for sensory play', tag: 'Sandbox' as const },
    { url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80', caption: 'Shaded sand play area with buckets, moulds and scoops', tag: 'Sandbox' as const }
  ],
  track: [
    { url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80', caption: 'Smooth paved jogging and stroller walking loop', tag: 'Walking Track' as const },
    { url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80', caption: 'Tiled perimeter track flanked by ancient Bangalore trees', tag: 'Walking Track' as const }
  ],
  lawns: [
    { url: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=80', caption: 'Lush green lawn ideal for blanket picnics and toddler runaround', tag: 'Shade & Lawns' as const },
    { url: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=1200&q=80', caption: 'Shaded grassy knoll with park benches and gazebo', tag: 'Shade & Lawns' as const }
  ],
  accessibility: [
    { url: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=1200&q=80', caption: 'Zero-step entrance ramp and wheelchair-friendly paths', tag: 'Accessibility' as const },
    { url: 'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?auto=format&fit=crop&w=1200&q=80', caption: 'Wide barrier-free gate and level rest areas', tag: 'Accessibility' as const }
  ]
};

// ---------------------------------------------------------------------------
// GET PARK PHOTO GALLERY
// ---------------------------------------------------------------------------
export function getParkGallery(park: BangalorePark): ParkGalleryPhoto[] {
  // 1. If park already has explicit galleryImages defined
  if (park.galleryImages && park.galleryImages.length > 0) {
    return park.galleryImages.map((img, i) => {
      if (typeof img === 'string') {
        return {
          url: img,
          caption: `${park.name} - View ${i + 1}`,
          tag: i === 0 ? 'Play Area' : 'Shade & Lawns'
        };
      }
      return img;
    });
  }

  // 2. Check curated gallery by ID
  if (CURATED_GALLERIES[park.id]) {
    return CURATED_GALLERIES[park.id];
  }

  // 3. Assemble dynamic gallery from park data
  const photos: ParkGalleryPhoto[] = [];

  // Hero photo
  photos.push({
    url: park.imageUrl || 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=80',
    caption: `${park.name} - Main Entrance & Playground Lawns`,
    tag: 'Play Area'
  });

  const facLower = (park.facilities || []).map(f => f.toLowerCase());
  const hasSand = facLower.some(f => f.includes('sand'));
  const hasSwings = facLower.some(f => f.includes('swing') || f.includes('slide') || f.includes('play area'));
  const hasTrack = facLower.some(f => f.includes('track') || f.includes('stroller') || f.includes('skating'));
  const hasLawn = facLower.some(f => f.includes('lawn') || f.includes('tree') || f.includes('picnic'));

  if (hasSwings) {
    photos.push(THEMATIC_PHOTOS.swings[0]);
    photos.push(THEMATIC_PHOTOS.slides[0]);
  }
  if (hasSand) {
    photos.push(THEMATIC_PHOTOS.sandbox[0]);
  }
  if (hasTrack) {
    photos.push(THEMATIC_PHOTOS.track[0]);
  }
  if (hasLawn || photos.length < 4) {
    photos.push(THEMATIC_PHOTOS.lawns[0]);
  }
  if (park.accessible || facLower.some(f => f.includes('accessible') || f.includes('stroller'))) {
    photos.push(THEMATIC_PHOTOS.accessibility[0]);
  } else {
    photos.push(THEMATIC_PHOTOS.lawns[1]);
  }

  return photos.slice(0, 6);
}

// ---------------------------------------------------------------------------
// GET PARK AVAILABLE PLAYGROUND EQUIPMENT
// ---------------------------------------------------------------------------
export function getParkEquipment(park: BangalorePark): ParkEquipmentItem[] {
  if (park.equipment && park.equipment.length > 0) {
    return park.equipment;
  }

  const facLower = (park.facilities || []).map(f => f.toLowerCase()).join(' ');
  const highLower = (park.highlights || []).map(h => h.toLowerCase()).join(' ');
  const allText = `${facLower} ${highLower}`;

  const hasSand = allText.includes('sand');
  const hasSwings = allText.includes('swing');
  const hasSlides = allText.includes('slide');
  const hasSkating = allText.includes('skating');
  const isAccessiblePark = park.accessible || allText.includes('wheelchair') || allText.includes('braille') || allText.includes('stroller');

  const equipmentList: ParkEquipmentItem[] = [];

  // 1. Swings
  if (hasSwings || allText.includes('toddler play') || allText.includes('play area') || equipmentList.length === 0) {
    equipmentList.push({
      id: `${park.id}-eq-swings-toddler`,
      name: 'Toddler Safety Bucket Swings',
      category: 'swings',
      ageRange: '1 - 3 yrs (Toddlers)',
      description: 'Full-support molded bucket seats with front safety bar and non-pinch coated safety chains.',
      safetySurface: 'Rubberized EPDM Safety Flooring',
      status: 'Operational',
      count: 2,
      icon: 'Baby'
    });

    equipmentList.push({
      id: `${park.id}-eq-swings-classic`,
      name: 'Classic Belt Swings',
      category: 'swings',
      ageRange: '3 - 10 yrs (Kids)',
      description: 'Heavy-duty flexible rubber sling seats on anchored galvanised steel A-frame.',
      safetySurface: hasSand ? 'Clean River Sand' : 'Rubberized Tiles',
      status: 'Operational',
      count: 2,
      icon: 'Sparkles'
    });

    if (isAccessiblePark) {
      equipmentList.push({
        id: `${park.id}-eq-swings-adaptive`,
        name: 'Inclusive Adaptive Harness Swing',
        category: 'swings',
        ageRange: 'All Ages (Accessible)',
        description: 'High-backed molded seat with lockable overhead 5-point chest harness for children of all abilities.',
        safetySurface: 'Zero-threshold EPDM Flooring',
        status: 'Operational',
        count: 1,
        icon: 'ShieldCheck'
      });
    } else {
      equipmentList.push({
        id: `${park.id}-eq-swings-tire`,
        name: 'Circular Birds Nest / Tire Swing',
        category: 'swings',
        ageRange: '3 - 12 yrs',
        description: 'Large woven rope saucer swing accommodating 2-3 kids for shared group laughter and sensory calm.',
        safetySurface: 'Rubberized Tiles',
        status: 'Operational',
        count: 1,
        icon: 'Users'
      });
    }
  }

  // 2. Slides
  if (hasSlides || allText.includes('play area') || allText.includes('children')) {
    equipmentList.push({
      id: `${park.id}-eq-slide-wave`,
      name: 'Toddler Double Wave Slide',
      category: 'slides',
      ageRange: '2 - 7 yrs',
      description: 'Twin side-by-side slides with gentle deceleration wave and deep side protective rails.',
      safetySurface: hasSand ? 'Deep River Sand Bed' : 'Impact Rubber Mats',
      status: 'Operational',
      count: 2,
      icon: 'ChevronRight'
    });

    equipmentList.push({
      id: `${park.id}-eq-slide-spiral`,
      name: 'Enclosed Spiral Tube Slide',
      category: 'slides',
      ageRange: '4 - 10 yrs',
      description: 'UV-stabilized enclosed tunnel slide exiting from a 6-foot elevated observation tower.',
      safetySurface: 'Rubberized EPDM Flooring',
      status: 'Operational',
      count: 1,
      icon: 'RotateCcw'
    });
  }

  // 3. Sandbox / Sandpit
  if (hasSand || allText.includes('toddler') || allText.includes('sandpit')) {
    equipmentList.push({
      id: `${park.id}-eq-sandbox`,
      name: 'Shaded Sensory Sandpit',
      category: 'sandbox',
      ageRange: '1 - 6 yrs',
      description: 'Clean, regularly sifted river sand enclosed with timber border and overhead sun shade canopy.',
      safetySurface: 'Sifted Fine River Sand (12-inch depth)',
      status: 'Operational',
      count: 1,
      icon: 'Trees'
    });

    equipmentList.push({
      id: `${park.id}-eq-sand-digger`,
      name: 'Dual-Lever Sand Digger Crane',
      category: 'sandbox',
      ageRange: '3 - 8 yrs',
      description: 'Mechanical metal excavator seat with levers for scooping, developing hand-eye coordination.',
      safetySurface: 'River Sand Bed',
      status: 'Operational',
      count: 1,
      icon: 'Footprints'
    });
  }

  // 4. Climbing Structures & Monkey Bars
  equipmentList.push({
    id: `${park.id}-eq-climbing-pyramid`,
    name: 'Geodesic Rope Climbing Dome',
    category: 'climbing',
    ageRange: '4 - 10 yrs',
    description: 'Geometric steel and steel-core rope climbing pyramid promoting gross-motor agility and balance.',
    safetySurface: hasSand ? 'River Sand' : 'Rubber Shock Pad',
    status: 'Operational',
    count: 1,
    icon: 'Layers'
  });

  equipmentList.push({
    id: `${park.id}-eq-monkey-bars`,
    name: 'Stepped Horizontal Monkey Bars',
    category: 'climbing',
    ageRange: '5 - 12 yrs',
    description: 'Dual-tier overhead ladder with anti-slip grip bars for upper-body strength and confidence building.',
    safetySurface: 'Thick EPDM Rubber Flooring',
    status: 'Operational',
    count: 1,
    icon: 'Footprints'
  });

  // 5. Spinners & Seesaw
  equipmentList.push({
    id: `${park.id}-eq-seesaw`,
    name: '4-Child Spring-Damped Seesaw',
    category: 'spinners',
    ageRange: '2 - 7 yrs',
    description: 'Heavy-duty steel beam with center compression spring dampener preventing harsh impacts.',
    safetySurface: 'Rubberized Flooring',
    status: 'Operational',
    count: 1,
    icon: 'ArrowUpDown'
  });

  equipmentList.push({
    id: `${park.id}-eq-spring-riders`,
    name: 'Animal Spring Riders (Elephant & Duck)',
    category: 'spinners',
    ageRange: '1 - 4 yrs (Toddlers)',
    description: 'Enclosed cockpit spring rockers with footrests and textured handlebar grips.',
    safetySurface: 'Rubber Safety Tiles',
    status: 'Operational',
    count: 2,
    icon: 'Baby'
  });

  // 6. Sensory & Early Learning Panels
  equipmentList.push({
    id: `${park.id}-eq-sensory-panel`,
    name: 'Tactile Gear & Maze Play Wall',
    category: 'sensory',
    ageRange: '1 - 5 yrs',
    description: 'Ground-level interactive wall with spinning cogwheels, counting abacus and animal sliding tracks.',
    safetySurface: 'Paved Walkway Level Access',
    status: 'Operational',
    count: 1,
    icon: 'Sparkles'
  });

  // 7. Sports & Activities
  if (hasSkating) {
    equipmentList.push({
      id: `${park.id}-eq-skating-ring`,
      name: 'Children Roller Skating Ring & Loop',
      category: 'sports',
      ageRange: '4 - 14 yrs',
      description: 'Smooth polished epoxy/concrete track with safety handrail perimeter.',
      safetySurface: 'Smooth Skating Concrete',
      status: 'Operational',
      count: 1,
      icon: 'Navigation'
    });
  }

  equipmentList.push({
    id: `${park.id}-eq-open-lawn`,
    name: 'Open Grass Lawn for Catch & Ball Play',
    category: 'sports',
    ageRange: 'All Ages',
    description: 'Level mown grass lawn bordered by shade trees, safe for running, frisbee and toddler kickball.',
    safetySurface: 'Natural Bermuda Grass Turf',
    status: 'Operational',
    count: 1,
    icon: 'Trees'
  });

  return equipmentList;
}

// ---------------------------------------------------------------------------
// GET PARK ACCESSIBILITY FEATURES
// ---------------------------------------------------------------------------
export function getParkAccessibilityFeatures(park: BangalorePark): {
  features: ParkAccessibilityFeature[];
  rating: 'High' | 'Moderate' | 'Basic';
  summary: string;
} {
  if (park.accessibilityFeatures && park.accessibilityFeatures.length > 0) {
    return {
      features: park.accessibilityFeatures,
      rating: park.accessibilityRating || 'High',
      summary: park.accessibilitySummary || 'Verified accessible park with stroller and wheelchair-friendly amenities.'
    };
  }

  const facLower = (park.facilities || []).map(f => f.toLowerCase()).join(' ');
  const highLower = (park.highlights || []).map(h => h.toLowerCase()).join(' ');
  const allText = `${facLower} ${highLower}`;

  const isColesPark = park.id === 'coles-park-frazer-town';
  const isMajorCentral = ['cubbon-park-chamarajendra', 'lalbagh-botanical-garden', 'hsr-sector-2-childrens-park'].includes(park.id);
  const hasStroller = park.accessible || allText.includes('stroller') || allText.includes('accessible') || isMajorCentral;
  const hasRestrooms = allText.includes('restroom') || allText.includes('toilet');

  const features: ParkAccessibilityFeature[] = [
    {
      id: 'acc-step-free-ramps',
      title: 'Step-Free Paved Entrance Ramps',
      category: 'mobility',
      available: true,
      description: 'Main pedestrian entrance features gentle paved slope (gradient ≤ 1:12) with handrails, free of steps or high curbs.',
      badge: 'Step-Free',
      icon: 'CheckCircle2'
    },
    {
      id: 'acc-stroller-paths',
      title: 'Smooth Stroller & Wheelchair Tracks',
      category: 'mobility',
      available: hasStroller,
      description: 'Continuous wide (≥ 1.8m) paved perimeter walkways with non-slip bitumen or interlocking pavers, easily navigable by double prams.',
      badge: hasStroller ? 'Stroller Friendly' : 'Natural Paths',
      icon: 'Footprints'
    },
    {
      id: 'acc-barrier-free-gates',
      title: 'Barrier-Free Wide Gate Chicanes',
      category: 'mobility',
      available: true,
      description: 'Gates feature 1.2m wide staggered chicane posts that block two-wheelers while comfortably allowing prams, trikes, and wheelchairs.',
      badge: 'Wide Entry',
      icon: 'ShieldCheck'
    },
    {
      id: 'acc-inclusive-swings',
      title: 'Adaptive Harness / Inclusive Play',
      category: 'adaptive_play',
      available: isColesPark || isMajorCentral,
      description: isColesPark 
        ? 'Dedicated high-backed adaptive swings with secure 5-point chest harness and ground-level flush merry-go-round.'
        : isMajorCentral
        ? 'Deep bucket toddler swings and level-entry carousel enabling children with diverse motor skills to join the fun.'
        : 'Deep bucket toddler safety swings and low-height ground play panels reachable from sitting position.',
      badge: (isColesPark || isMajorCentral) ? 'Inclusive Swings' : 'Toddler Safe',
      icon: 'Baby'
    },
    {
      id: 'acc-braille-sensory',
      title: 'Braille & Tactile Sensory Navigation',
      category: 'sensory',
      available: isColesPark || park.id === 'cubbon-park-chamarajendra',
      description: isColesPark
        ? 'Specialized braille route maps at entrance, textured tactile paving stones guiding visually-impaired visitors to play zones.'
        : 'High-contrast bilingual directional signage and acoustic wind chimes for multi-sensory guidance.',
      badge: (isColesPark || park.id === 'cubbon-park-chamarajendra') ? 'Braille Signage' : 'Bilingual Signage',
      icon: 'Sparkles'
    },
    {
      id: 'acc-quiet-zones',
      title: 'Low-Sensory Quiet Garden Alcoves',
      category: 'sensory',
      available: true,
      description: 'Quiet tree-canopied peripheral lawns sheltered from playground noise, providing calming sensory respite for neurodivergent kids.',
      badge: 'Calm Spaces',
      icon: 'Trees'
    },
    {
      id: 'acc-accessible-restrooms',
      title: 'Family & Accessible Restrooms',
      category: 'restrooms',
      available: hasRestrooms,
      description: hasRestrooms
        ? 'Restroom facility with wide entry doors, support grab rails, running tap water, and toddler-level washbasins.'
        : 'Basic sanitation available nearby; parents typically use the park pavilion or nearby community centers.',
      badge: hasRestrooms ? 'Accessible Restroom' : 'Restroom Nearby',
      icon: 'Check'
    },
    {
      id: 'acc-shaded-benches',
      title: 'Ergonomic Shaded Rest Benches',
      category: 'convenience',
      available: true,
      description: 'Sturdy wooden/stone benches with back support placed every 30 to 50 meters under mature rain tree shade for nursing and resting.',
      badge: 'Shaded Benches',
      icon: 'Clock'
    },
    {
      id: 'acc-barrier-free-parking',
      title: 'Designated Family & Drop-Off Zones',
      category: 'convenience',
      available: isMajorCentral || park.areaAcres !== undefined && park.areaAcres > 5,
      description: 'Dedicated vehicle drop-off bay directly adjacent to main ramp gate, minimizing walking distance with infant car seats or strollers.',
      badge: 'Easy Drop-Off',
      icon: 'Navigation'
    }
  ];

  let rating: 'High' | 'Moderate' | 'Basic' = 'Moderate';
  let summary = 'Well-suited for toddlers and strollers with paved paths, shaded benches, and step-free entry.';

  if (isColesPark || isMajorCentral || (park.accessible && hasRestrooms)) {
    rating = 'High';
    summary = 'Outstanding accessibility! Features step-free ramps, wide paved tracks, inclusive adaptive play equipment, and shaded rest facilities.';
  } else if (!hasStroller) {
    rating = 'Basic';
    summary = 'Neighborhood park with natural mud walking tracks; strollers can access main central plaza via primary gate.';
  }

  return { features, rating, summary };
}
