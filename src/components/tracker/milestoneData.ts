import { BabyMilestone, DevelopmentStage, MilestoneCategory } from '../../types.ts';

export interface MilestoneWithTips extends BabyMilestone {
  description: string;
  redFlags?: string;
  parentTips?: string;
}

export interface AgeMilestoneGroup {
  ageRangeLabel: string;
  minMonths: number;
  maxMonths: number;
  developmentStage: DevelopmentStage;
  keyTheme: string;
  milestones: MilestoneWithTips[];
}

export const COMPREHENSIVE_MILESTONES: AgeMilestoneGroup[] = [
  {
    ageRangeLabel: '0 - 2 Months',
    minMonths: 0,
    maxMonths: 2,
    developmentStage: 'Newborn (0-3 months)',
    keyTheme: 'Sensory awareness, reflexive movement & gentle bonds',
    milestones: [
      {
        id: 'ms-0-1',
        category: 'Motor',
        title: 'Lifts head briefly during tummy time',
        description: 'When placed on stomach, pushes slightly with arms and lifts chin/head momentarily.',
        expectedAgeMonths: 2,
        achieved: true,
        parentTips: 'Offer 2-3 minutes of tummy time on your chest or a firm mat 2-3 times daily.',
        redFlags: 'Does not respond to loud sounds; does not watch things as they move.'
      },
      {
        id: 'ms-0-2',
        category: 'Speech',
        title: 'Makes soft cooing and gurgling sounds',
        description: 'Produces gentle vowel sounds ("ooh", "aah") in response to parent voices.',
        expectedAgeMonths: 2,
        achieved: true,
        parentTips: 'Talk, sing lullabies, and imitate their gentle coos back to them with eye contact.',
        redFlags: 'Does not turn head toward familiar voices.'
      },
      {
        id: 'ms-0-3',
        category: 'Cognitive',
        title: 'Follows objects with eyes to midline',
        description: 'Tracks moving high-contrast black-and-white objects and human faces.',
        expectedAgeMonths: 2,
        achieved: true,
        parentTips: 'Hold high-contrast flashcards or your face 8-12 inches away and move slowly.',
        redFlags: 'Cannot focus or cross eyes persist past 8 weeks.'
      },
      {
        id: 'ms-0-4',
        category: 'Social',
        title: 'First spontaneous social smile',
        description: 'Smiles in response to your warm smile, voice, and affectionate touch.',
        expectedAgeMonths: 2,
        achieved: true,
        parentTips: 'Smile warmly, cuddle skin-to-skin, and respond promptly to distress.',
        redFlags: 'Does not smile at people by 10-12 weeks.'
      }
    ]
  },
  {
    ageRangeLabel: '3 - 4 Months',
    minMonths: 3,
    maxMonths: 4,
    developmentStage: 'Newborn (0-3 months)',
    keyTheme: 'Head stability, visual tracking & joyous chuckles',
    milestones: [
      {
        id: 'ms-4-1',
        category: 'Motor',
        title: 'Holds head steady without support',
        description: 'Maintains steady head control when held upright or resting on tummy.',
        expectedAgeMonths: 4,
        achieved: true,
        parentTips: 'Carry baby upright in arms and play gentle peek-a-boo over your shoulder.',
        redFlags: 'Head flops backwards severely when pulled to sitting position.'
      },
      {
        id: 'ms-4-2',
        category: 'Motor',
        title: 'Reaches out and grasps a rattle or toy',
        description: 'Brings both hands together, bats at hanging toys, and grasps a small rattle.',
        expectedAgeMonths: 4,
        achieved: true,
        parentTips: 'Hang colorful lightweight silicone rings or rattles within arm reach.',
        redFlags: 'Keeps hands clenched tightly into fists without opening.'
      },
      {
        id: 'ms-4-3',
        category: 'Speech',
        title: 'Chuckles, laughs and squeals out loud',
        description: 'Expresses delight with vocal laughter, squeals, and turns head to sound.',
        expectedAgeMonths: 4,
        achieved: true,
        parentTips: 'Blow raspberries gently on tummy or cheeks and play tickle games.',
        redFlags: 'Does not make vowel sounds or respond to smiling faces.'
      },
      {
        id: 'ms-4-4',
        category: 'Social',
        title: 'Enjoys play and may cry when interaction stops',
        description: 'Shows excitement when caregivers enter the room and engages in playful babble.',
        expectedAgeMonths: 4,
        achieved: false,
        parentTips: 'Read simple board books with high-contrast illustrations and expressive voices.',
        redFlags: 'Does not track moving people or toys.'
      }
    ]
  },
  {
    ageRangeLabel: '5 - 6 Months',
    minMonths: 5,
    maxMonths: 6,
    developmentStage: 'Infant (4-11 months)',
    keyTheme: 'Rolling over, consonant babbling & solid food curiosity',
    milestones: [
      {
        id: 'ms-6-1',
        category: 'Motor',
        title: 'Rolls over in both directions (tummy to back and back to tummy)',
        description: 'Uses core muscles and legs to roll over both front-to-back and back-to-front.',
        expectedAgeMonths: 6,
        achieved: false,
        parentTips: 'Place enticing toys just out of reach on either side during floor play.',
        redFlags: 'Seems very stiff with tight muscles or very floppy like a rag doll.'
      },
      {
        id: 'ms-6-2',
        category: 'Motor',
        title: 'Sits with brief hand support (tripod sitting)',
        description: 'Props self up on hands while sitting on the floor with minimal guidance.',
        expectedAgeMonths: 6,
        achieved: false,
        parentTips: 'Sit on floor with legs in a V shape around baby, offering cushion support.',
        redFlags: 'Cannot sit with help by 7 months.'
      },
      {
        id: 'ms-6-3',
        category: 'Speech',
        title: 'Babbles with consonants ("ba-ba", "da-da", "ma-ma")',
        description: 'Strings sounds together and pauses to wait for your reply in conversation.',
        expectedAgeMonths: 6,
        achieved: false,
        parentTips: 'Have conversational turn-taking: let them babble, then respond enthusiastically.',
        redFlags: 'Does not make squeaking or babbling sounds.'
      },
      {
        id: 'ms-6-4',
        category: 'Cognitive',
        title: 'Passes objects from one hand to the other',
        description: 'Transfers a toy or block smoothly between left and right hands.',
        expectedAgeMonths: 6,
        achieved: false,
        parentTips: 'Offer soft textured cubes or teething rings to encourage two-handed transfers.',
        redFlags: 'Reaches with only one hand consistently while the other remains limp.'
      },
      {
        id: 'ms-6-5',
        category: 'Teething',
        title: 'First primary teeth (lower central incisors) emerge',
        description: 'Lower central front teeth begin pushing through gum line; increased biting.',
        expectedAgeMonths: 6,
        achieved: false,
        parentTips: 'Provide chilled silicone teething keys and massage gums with clean finger.',
        redFlags: 'Excessive pain or fever > 101°F is not from teething; consult pediatrician.'
      }
    ]
  },
  {
    ageRangeLabel: '7 - 9 Months',
    minMonths: 7,
    maxMonths: 9,
    developmentStage: 'Infant (4-11 months)',
    keyTheme: 'Independent sitting, crawling/creeping & object permanence',
    milestones: [
      {
        id: 'ms-9-1',
        category: 'Motor',
        title: 'Sits steadily without hand support',
        description: 'Can sit upright with hands free to hold and manipulate toys.',
        expectedAgeMonths: 9,
        achieved: false,
        parentTips: 'Place toys slightly above eye level so baby maintains upright posture.',
        redFlags: 'Cannot sit without support by 9 months.'
      },
      {
        id: 'ms-9-2',
        category: 'Motor',
        title: 'Crawls, scoots or pulls to stand against furniture',
        description: 'Moves across room on hands and knees or pulls up using sofa/crib rails.',
        expectedAgeMonths: 9,
        achieved: false,
        parentTips: 'Baby-proof lower cabinets, sharp corners, and power sockets for safe roaming.',
        redFlags: 'Does not bear weight on legs with caregiver support.'
      },
      {
        id: 'ms-9-3',
        category: 'Cognitive',
        title: 'Understands object permanence (searches for hidden toy)',
        description: 'Looks under a cloth or behind a book when a toy is covered in front of them.',
        expectedAgeMonths: 9,
        achieved: false,
        parentTips: 'Play hide-and-seek with a favorite teddy bear under a muslin blanket.',
        redFlags: 'Does not look where you point or ignores completely hidden toys.'
      },
      {
        id: 'ms-9-4',
        category: 'Speech',
        title: 'Understands "No" and responds to own name immediately',
        description: 'Stops action momentarily when told "No" and turns head instantly to their name.',
        expectedAgeMonths: 9,
        achieved: false,
        parentTips: 'Use child’s name frequently in positive, warm contexts throughout the day.',
        redFlags: 'Does not respond to own name.'
      },
      {
        id: 'ms-9-5',
        category: 'Social',
        title: 'Shows stranger anxiety and clings to familiar guardians',
        description: 'Wary of unfamiliar faces and seeks reassurance from parents.',
        expectedAgeMonths: 9,
        achieved: false,
        parentTips: 'Acknowledge their caution, do not force them into stranger arms, offer calm comfort.',
        redFlags: 'Does not recognize known parents or caregivers.'
      }
    ]
  },
  {
    ageRangeLabel: '10 - 12 Months (1 Year)',
    minMonths: 10,
    maxMonths: 12,
    developmentStage: 'Infant (4-11 months)',
    keyTheme: 'Pincer grasp, first words, waving & standing alone',
    milestones: [
      {
        id: 'ms-12-1',
        category: 'Motor',
        title: 'Pincer grasp (picks up small pieces with thumb and index finger)',
        description: 'Picks up cheerios, soft peas, or small cubes precisely between fingertips.',
        expectedAgeMonths: 12,
        achieved: false,
        parentTips: 'Serve finger foods like soft steamed carrot bits or banana cubes.',
        redFlags: 'Cannot pick up small items using fingers.'
      },
      {
        id: 'ms-12-2',
        category: 'Motor',
        title: 'Stands alone momentarily or takes first tentative steps',
        description: 'Balances on feet without holding onto furniture for 3-5 seconds.',
        expectedAgeMonths: 12,
        achieved: false,
        parentTips: 'Encourage cruising along coffee table and hold both hands to practice stepping.',
        redFlags: 'Cannot stand with support.'
      },
      {
        id: 'ms-12-3',
        category: 'Speech',
        title: 'Says first 1-2 meaningful words besides Mama/Dada',
        description: 'Uses words with clear intent (e.g. "Ball", "Milk", "Dog", "Paani").',
        expectedAgeMonths: 12,
        achieved: false,
        parentTips: 'Narrate your daily actions in simple short phrases: "Mamma is cutting apple".',
        redFlags: 'Does not learn gestures like waving or shaking head.'
      },
      {
        id: 'ms-12-4',
        category: 'Social',
        title: 'Waves "bye-bye" and plays interactive games (pat-a-cake)',
        description: 'Initiates social gestures, claps hands, and blows kisses.',
        expectedAgeMonths: 12,
        achieved: false,
        parentTips: 'Sing nursery rhymes like "Pat-a-cake" and wave warmly when family members leave.',
        redFlags: 'Does not point to objects of interest.'
      },
      {
        id: 'ms-12-5',
        category: 'Self-Care',
        title: 'Drinks from an open sippy cup with guidance',
        description: 'Holds two-handled cup or sippy cup and swallows without spilling excessively.',
        expectedAgeMonths: 12,
        achieved: false,
        parentTips: 'Offer small amounts of water in an open weighted silicone cup.',
        redFlags: 'Difficulty swallowing or chronic choking on liquid.'
      }
    ]
  },
  {
    ageRangeLabel: '13 - 18 Months (1.5 Years)',
    minMonths: 13,
    maxMonths: 18,
    developmentStage: 'Toddler (1-2 years)',
    keyTheme: 'Confident walking, pointing to show interest & stacking blocks',
    milestones: [
      {
        id: 'ms-18-1',
        category: 'Motor',
        title: 'Walks independently with steady balance',
        description: 'Walks across rooms without falling, squats to pick up a toy and stands back up.',
        expectedAgeMonths: 18,
        achieved: false,
        parentTips: 'Give push-toys or pull-wagons to build leg stamina and balance.',
        redFlags: 'Not walking independently by 18 months.'
      },
      {
        id: 'ms-18-2',
        category: 'Motor',
        title: 'Stacks a tower of 3 to 4 blocks',
        description: 'Balances small wooden or soft blocks on top of one another carefully.',
        expectedAgeMonths: 18,
        achieved: false,
        parentTips: 'Provide wooden blocks, plastic cups, or nesting bowls to stack and knock down.',
        redFlags: 'Does not scribble or hold large crayons.'
      },
      {
        id: 'ms-18-3',
        category: 'Speech',
        title: 'Vocabulary of 10 to 20 recognizable words',
        description: 'Points to at least one body part when asked ("Where are your eyes?").',
        expectedAgeMonths: 18,
        achieved: false,
        parentTips: 'Name body parts during bath time and diaper changes with touch.',
        redFlags: 'Says fewer than 6 words; does not copy new words.'
      },
      {
        id: 'ms-18-4',
        category: 'Cognitive',
        title: 'Understands and follows simple 1-step directions',
        description: 'Follows commands like "Bring me the ball" or "Come here" without gestures.',
        expectedAgeMonths: 18,
        achieved: false,
        parentTips: 'Give gentle 1-step instructions with clear eye contact.',
        redFlags: 'Does not seem to understand simple requests.'
      },
      {
        id: 'ms-18-5',
        category: 'Self-Care',
        title: 'Feeds self with spoon (even if messy)',
        description: 'Scoops soft foods and brings spoon to mouth independently.',
        expectedAgeMonths: 18,
        achieved: false,
        parentTips: 'Embrace messy meal exploration! Use thick yogurt, khichdi, or mashed potato.',
        redFlags: 'Refuses all textured foods.'
      }
    ]
  },
  {
    ageRangeLabel: '19 - 24 Months (2 Years)',
    minMonths: 19,
    maxMonths: 24,
    developmentStage: 'Toddler (1-2 years)',
    keyTheme: '2-word sentences, running, parallel play & kicking a ball',
    milestones: [
      {
        id: 'ms-24-1',
        category: 'Motor',
        title: 'Kicks a large ball forward & runs smoothly',
        description: 'Steps forward and kicks a soccer ball without losing balance.',
        expectedAgeMonths: 24,
        achieved: false,
        parentTips: 'Play in the park or hallway rolling and kicking lightweight soft balls.',
        redFlags: 'Walks only on toes; unsteady gait or frequent falls.'
      },
      {
        id: 'ms-24-2',
        category: 'Speech',
        title: 'Combines 2 words into phrases ("Want milk", "Car go")',
        description: 'Uses at least 50 distinct words and begins forming simple 2-word combinations.',
        expectedAgeMonths: 24,
        achieved: false,
        parentTips: 'Expand their phrases: if child says "Big dog", reply "Yes, that is a friendly big brown dog!".',
        redFlags: 'Does not use 2-word phrases; does not imitate actions or words.'
      },
      {
        id: 'ms-24-3',
        category: 'Cognitive',
        title: 'Sorts shapes and colors & completes 4-piece puzzles',
        description: 'Places circles, squares, and triangles into corresponding shape-sorter slots.',
        expectedAgeMonths: 24,
        achieved: false,
        parentTips: 'Introduce wooden peg puzzles and sort laundry socks by color together.',
        redFlags: 'Does not know the function of common household items (phone, spoon, brush).'
      },
      {
        id: 'ms-24-4',
        category: 'Social',
        title: 'Engages in parallel play alongside peers',
        description: 'Plays happily next to other children and watches their actions with keen interest.',
        expectedAgeMonths: 24,
        achieved: false,
        parentTips: 'Arrange informal park playdates without forcing sharing yet.',
        redFlags: 'Avoids all eye contact or shows intense resistance to physical affection.'
      },
      {
        id: 'ms-24-5',
        category: 'Self-Care',
        title: 'Shows toilet training readiness cues',
        description: 'Notices wet/dirty diapers, tells parent before or after bowel movement.',
        expectedAgeMonths: 24,
        achieved: false,
        parentTips: 'Place a friendly toddler potty in bathroom and read child-friendly potty books.',
        redFlags: 'Do not rush potty training if child shows stress or resistance.'
      }
    ]
  },
  {
    ageRangeLabel: '3 Years (36 Months)',
    minMonths: 25,
    maxMonths: 36,
    developmentStage: 'Early Preschooler (3-4 years)',
    keyTheme: 'Pedaling tricycle, "Why?" questions, imaginative play & turn taking',
    milestones: [
      {
        id: 'ms-36-1',
        category: 'Motor',
        title: 'Pedals a tricycle and climbs stairs alternating feet',
        description: 'Propels a three-wheeled bike and walks up stairs placing one foot on each step.',
        expectedAgeMonths: 36,
        achieved: false,
        parentTips: 'Practice at the community playground with low staircases and tricycle paths.',
        redFlags: 'Cannot climb stairs or falls down frequently.'
      },
      {
        id: 'ms-36-2',
        category: 'Speech',
        title: 'Speaks in 3-5 word sentences & asks questions ("Why?", "Where?")',
        description: 'Strangers can understand 75% of speech; knows first name and age.',
        expectedAgeMonths: 36,
        achieved: false,
        parentTips: 'Answer their curious "Why?" questions patiently and ask them questions in return.',
        redFlags: 'Unclear speech or drooling; fails to speak in full sentences.'
      },
      {
        id: 'ms-36-3',
        category: 'Cognitive',
        title: 'Engages in rich imaginative pretend play (cooking, doctor, animals)',
        description: 'Uses props creatively (a block becomes a phone or car) in fantasy games.',
        expectedAgeMonths: 36,
        achieved: false,
        parentTips: 'Provide dress-up costumes, toy kitchens, and cardboard boxes for open-ended play.',
        redFlags: 'Shows no pretend play or interest in interacting with peers.'
      },
      {
        id: 'ms-36-4',
        category: 'Social',
        title: 'Takes turns in simple group games & shows empathy',
        description: 'Notices when a friend is crying and tries to offer a hug or toy.',
        expectedAgeMonths: 36,
        achieved: false,
        parentTips: 'Praise kind sharing behaviors: "You shared the ball with Ayaan, that was very kind!".',
        redFlags: 'Extreme difficulty separating from parents or aggressive tantrums with peers.'
      },
      {
        id: 'ms-36-5',
        category: 'Self-Care',
        title: 'Dresses self with loose clothes & daytime potty trained',
        description: 'Puts on pants and t-shirts with minimal assistance; washes hands with soap.',
        expectedAgeMonths: 36,
        achieved: false,
        parentTips: 'Use elastic waistband pants and step stools near wash basins.',
        redFlags: 'Complete loss of previously acquired toilet training skills.'
      }
    ]
  },
  {
    ageRangeLabel: '4 - 5 Years (Preschooler)',
    minMonths: 37,
    maxMonths: 60,
    developmentStage: 'Early Preschooler (3-4 years)',
    keyTheme: 'Hopping on one foot, storytelling, drawing a person & counting',
    milestones: [
      {
        id: 'ms-48-1',
        category: 'Motor',
        title: 'Hops and stands on one foot for 5+ seconds & cuts with child scissors',
        description: 'Demonstrates refined balance, hops forward on single foot, snips along paper.',
        expectedAgeMonths: 48,
        achieved: false,
        parentTips: 'Play hopscotch and do safe craft cutting with rounded safety scissors.',
        redFlags: 'Cannot jump in place or cannot grasp a crayon between thumb and fingers.'
      },
      {
        id: 'ms-48-2',
        category: 'Speech',
        title: 'Tells coherent stories and uses correct grammar/future tense',
        description: 'Speaks clearly so anyone understands; recites poems and songs from memory.',
        expectedAgeMonths: 48,
        achieved: false,
        parentTips: 'Ask open-ended questions about their day: "Tell me what happened at school today!".',
        redFlags: 'Cannot tell a simple story or stutters severely on words.'
      },
      {
        id: 'ms-48-3',
        category: 'Cognitive',
        title: 'Counts 10+ objects, names 4+ colors & draws a person with 4+ parts',
        description: 'Draws a head, body, arms, and legs; understands concept of counting one-to-one.',
        expectedAgeMonths: 48,
        achieved: false,
        parentTips: 'Count stairs together, spot red and yellow cars on drives, and draw family portraits.',
        redFlags: 'Cannot count past 3 or cannot draw basic crosses and circles.'
      },
      {
        id: 'ms-48-4',
        category: 'Social',
        title: 'Prefers playing with friends rather than alone; negotiates rules',
        description: 'Understands basic rules of games, cooperates with friends, and enjoys group play.',
        expectedAgeMonths: 48,
        achieved: false,
        parentTips: 'Host structured playdates with board games like Snakes & Ladders or Uno Junior.',
        redFlags: 'Shows intense aggression without remorse or extreme social withdrawal.'
      }
    ]
  },
  {
    ageRangeLabel: '6 - 8 Years (School-Age)',
    minMonths: 61,
    maxMonths: 96,
    developmentStage: 'School-Age (5-8 years)',
    keyTheme: 'Riding a bicycle, reading books, peer cooperation & complex problem-solving',
    milestones: [
      {
        id: 'ms-72-1',
        category: 'Motor',
        title: 'Rides a two-wheel bicycle without training wheels & ties shoelaces',
        description: 'Maintains balance on bicycle, ties shoes independently, good sports coordination.',
        expectedAgeMonths: 72,
        achieved: false,
        parentTips: 'Practice riding bicycle in open parks with helmet; teach shoelace "bunny ears" trick.',
        redFlags: 'Persistent clumsiness or inability to dress/undress independently.'
      },
      {
        id: 'ms-72-2',
        category: 'Cognitive',
        title: 'Reads early chapter books & performs basic math (addition/subtraction)',
        description: 'Solves simple mathematical word problems and comprehends written stories.',
        expectedAgeMonths: 72,
        achieved: false,
        parentTips: 'Read together for 20 minutes before bedtime; solve simple math riddles during grocery shopping.',
        redFlags: 'Significant struggle recognizing letters, numbers, or rhyming sounds.'
      },
      {
        id: 'ms-72-3',
        category: 'Social',
        title: 'Forms close friendships & understands sportsmanship and rules',
        description: 'Belongs to peer friend groups, respects winning and losing gracefully.',
        expectedAgeMonths: 72,
        achieved: false,
        parentTips: 'Encourage team sports, drama, or martial arts to build confidence and teamwork.',
        redFlags: 'Severe school refusal or lack of any mutual friendships.'
      }
    ]
  }
];

// Helper to calculate exact age details from birth date
export function calculateAgeFromBirthDate(birthDateStr?: string, fallbackAgeYears: number = 1): {
  years: number;
  months: number;
  weeks: number;
  totalDays: number;
  totalMonths: number;
  formattedAge: string;
  stage: DevelopmentStage;
} {
  if (!birthDateStr) {
    const totalMonths = Math.max(1, Math.round(fallbackAgeYears * 12));
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const stage: DevelopmentStage = 
      totalMonths <= 3 ? 'Newborn (0-3 months)' :
      totalMonths <= 11 ? 'Infant (4-11 months)' :
      totalMonths <= 24 ? 'Toddler (1-2 years)' :
      totalMonths <= 48 ? 'Early Preschooler (3-4 years)' : 'School-Age (5-8 years)';

    return {
      years,
      months,
      weeks: Math.round(totalMonths * 4.33),
      totalDays: Math.round(totalMonths * 30.4),
      totalMonths,
      formattedAge: years > 0 ? `${years}y ${months}m (${totalMonths} months)` : `${totalMonths} months`,
      stage
    };
  }

  const birth = new Date(birthDateStr);
  const today = new Date();
  
  if (isNaN(birth.getTime()) || birth > today) {
    return calculateAgeFromBirthDate(undefined, fallbackAgeYears);
  }

  const diffTime = Math.abs(today.getTime() - birth.getTime());
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(totalDays / 7);

  // Accurate month calculation
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const totalMonths = Math.max(0, years * 12 + months + Math.round((today.getDate() - birth.getDate()) / 30.4));

  const stage: DevelopmentStage = 
    totalMonths <= 3 ? 'Newborn (0-3 months)' :
    totalMonths <= 11 ? 'Infant (4-11 months)' :
    totalMonths <= 24 ? 'Toddler (1-2 years)' :
    totalMonths <= 48 ? 'Early Preschooler (3-4 years)' : 'School-Age (5-8 years)';

  let formattedAge = '';
  if (totalMonths < 2) {
    formattedAge = `${weeks} weeks (${totalDays} days)`;
  } else if (years === 0) {
    formattedAge = `${months} months (${weeks} weeks)`;
  } else {
    formattedAge = `${years}y ${months}m (${totalMonths} months)`;
  }

  return {
    years,
    months,
    weeks,
    totalDays,
    totalMonths,
    formattedAge,
    stage
  };
}

// Calculate projected target date for an expected milestone age
export function calculateMilestoneTargetDate(birthDateStr: string | undefined, expectedAgeMonths: number): string {
  if (!birthDateStr) {
    const today = new Date();
    today.setMonth(today.getMonth() + 2);
    return today.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }

  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) {
    const today = new Date();
    return today.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }

  const targetDate = new Date(birth);
  targetDate.setMonth(targetDate.getMonth() + expectedAgeMonths);
  return targetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
