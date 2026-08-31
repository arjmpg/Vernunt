/**
 * Indian Demographics, Caste, Religion, and Parental Matchmaking Master Datasets
 */

export const PARENTS_INCOME_OPTIONS = [
  'No income',
  '0 to 3 lakhs',
  '3 to 8 lakhs',
  '8 to 12 lakhs',
  '12 to 20 lakhs',
  '20 to 26 lakhs',
  '26 lakhs and above'
] as const;

export type ParentsIncomeType = typeof PARENTS_INCOME_OPTIONS[number];

export const INDIAN_RELIGIONS = [
  'Hinduism',
  'Islam',
  'Christianity',
  'Sikhism',
  'Buddhism',
  'Jainism',
  'Zoroastrianism (Parsi)',
  'Judaism',
  'Bahá\'í Faith',
  'Other / Prefer not to state'
] as const;

export const INDIAN_CASTES = [
  // General & Vedic communities
  'Brahmin',
  'Brahmin - Smartha',
  'Brahmin - Madhwa',
  'Brahmin - Sri Vaishnava / Iyengar',
  'Brahmin - Iyer',
  'Brahmin - Kanyakubja',
  'Brahmin - Gaur',
  'Brahmin - Saraswat',
  'Brahmin - Maithil',
  'Brahmin - Nambudiri',
  'Brahmin - Nagar',
  'Brahmin - Sanadhya',
  'Kshatriya / Rajput',
  'Vaishya / Baniya / Agarwal / Gupta / Maheshwari',
  'Kayastha',
  
  // South Indian Communities
  'Reddy',
  'Kamma',
  'Kapu / Balija / Telaga / Munnuru Kapu',
  'Velama',
  'Lingayat / Veerashaiva',
  'Vokkaliga / Gowda',
  'Nair',
  'Ezhava / Thiyya',
  'Nadar',
  'Thevar / Mukkulathor',
  'Vanniyar',
  'Gounder (Kongu Vellalar)',
  'Mudaliar / Vellalar',
  'Chettiar',
  'Bunt / Shetty',
  'Billava',
  'Kuruba / Dhangar',
  'Devanga',
  'Viswakarma / Achari',
  'Padmashali / Weaver Community',
  'Madiga',
  'Mala',
  'Boyer / Valmiki',
  'Arya Vysya',

  // Western & Central Indian Communities
  'Maratha',
  'Kunbi',
  'Patel / Patidar (Levaa / Kadva)',
  'Lohana',
  'Jain - Digambar / Shwetambar',
  'Oswal',
  'Porwal',
  'Bhandari',
  'Koli',
  'Sonar / Daivadnya',

  // Northern & Eastern Communities
  'Jat',
  'Yadav / Ahir',
  'Gujjar / Gurjar',
  'Kurmi',
  'Kushwaha / Maurya / Saini / Koeri',
  'Khatri',
  'Arora',
  'Sood',
  'Bhumihar',
  'Mahishya',
  'Baidya',
  'Sadgop',
  'Rajbanshi',
  'Khandayat',
  'Karan',
  'Meena',
  'Bhil',
  'Gond',
  'Santhal',

  // Constitutional / Broad Categories
  'Scheduled Castes (SC)',
  'Scheduled Tribes (ST)',
  'Other Backward Classes (OBC)',
  'General / Open Category',
  'Other / Community Not Listed'
] as const;

export const CHILD_AVAILABILITY_OPTIONS = [
  'Weekdays After School',
  'Weekends (Sat & Sun)',
  'Weekday Mornings',
  'Weekday Afternoons',
  'Evening Playtime (5-7 PM)',
  'Flexible Schedule'
] as const;

export const CHILD_INTERESTS_OPTIONS = [
  'Sports & Athletics',
  'Drawing, Painting & Arts',
  'Reading & Storytelling',
  'Lego & Block Building',
  'STEM & Science Experiments',
  'Music, Singing & Dance',
  'Outdoor Play & Cycling',
  'Board Games & Puzzles',
  'Drama & Roleplay',
  'Nature & Gardening',
  'Swimming & Water Play',
  'Coding & Robotics'
] as const;

export const CHILD_PRIVACY_OPTIONS = [
  {
    id: 'full',
    label: 'Full Visibility',
    desc: 'Show child first name, age, interests, and photo to verified neighborhood parents.'
  },
  {
    id: 'first_name_only',
    label: 'First Name & Interests Only',
    desc: 'Show name, age, and interests. Photos remain blurred until you accept a connection.'
  },
  {
    id: 'connections_only',
    label: 'Private / Connection Only',
    desc: 'Protect full child details until you mutually accept a playmate connection request.'
  }
] as const;
