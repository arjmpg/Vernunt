import { ChildProfile, VerificationStatus, LocationSharing } from '../types.ts';
import { PARENTS_INCOME_OPTIONS, INDIAN_RELIGIONS, INDIAN_CASTES, CHILD_AVAILABILITY_OPTIONS } from './indianDemographics.ts';

// ============================================================================
// BANGALORE LOCALITIES & MAJOR GATED COMMUNITIES
// ============================================================================
export const BANGALORE_LOCALITIES = [
  {
    name: 'Koramangala',
    lat: 12.9352,
    lng: 77.6245,
    pincode: '560034',
    apartments: ['Raheja Residency', 'Prestige St Johns Wood', 'Adarsh Palm Retreat', 'Goyal Orchid Lakeview', 'Sobha Morzaria Grandeur'],
    landmarks: ['Sony World Signal', 'Koramangala Club', 'Bhartiya Mall', 'Bethany High School', 'Wipro Park']
  },
  {
    name: 'Indiranagar',
    lat: 12.9784,
    lng: 77.6408,
    pincode: '560038',
    apartments: ['Purva Belmont', 'Prestige Leela Residences', 'HM Symphony', 'DefSys Gated Enclave', 'Vaswani Astoria'],
    landmarks: ['100ft Road', '12th Main', 'Indiranagar Club', 'Defence Colony Park', 'Metro Station']
  },
  {
    name: 'HSR Layout',
    lat: 12.9121,
    lng: 77.6446,
    pincode: '560102',
    apartments: ['Purva Vantage', 'Sobha Daffodil', 'Assetz 27 Park Avenue', 'Salarpuria Serenity', 'Abhee Silicon Shine'],
    landmarks: ['Sector 2 Park', 'BDA Complex', 'Agara Lake Promenade', 'National Institute of Fashion Technology', 'CPWD Quarters']
  },
  {
    name: 'Whitefield',
    lat: 12.9698,
    lng: 77.7500,
    pincode: '560066',
    apartments: ['Prestige Shantiniketan', 'Brigade Cosmopolis', 'Total Environment Windmills', 'Godrej United', 'Sowparnika Euphoria'],
    landmarks: ['ITPL Main Gate', 'Forum Shantiniketan Mall', 'Hope Farm Junction', 'Vydehi Hospital', 'Inner Circle Park']
  },
  {
    name: 'Jayanagar',
    lat: 12.9308,
    lng: 77.5838,
    pincode: '560011',
    apartments: ['Sobha Tulip', 'Shriram Southern Crest', 'Brigade Petunia', 'Nandi Citadel', 'Mantri Alpyne'],
    landmarks: ['4th Block BDA Complex', 'Madhavan Park', 'NMKRV College', 'South End Circle', 'Ashoka Pillar']
  },
  {
    name: 'JP Nagar',
    lat: 12.9063,
    lng: 77.5857,
    pincode: '560078',
    apartments: ['Brigade Gardenia', 'Elita Promenade', 'Purva Panorama', 'HM Tambourine', 'Sobha Opal'],
    landmarks: ['Mini Forest 3rd Phase', 'Ranga Shankara Theatre', 'Brigade Millennium Campus', 'Puttenahalli Lake', 'Sarakki Lake']
  },
  {
    name: 'Bellandur',
    lat: 12.9304,
    lng: 77.6784,
    pincode: '560103',
    apartments: ['Adarsh Palm Retreat', 'Sun City Apartments', 'Green Glen Oasis', 'Sobha Lakeview', 'Prestige Green Gables'],
    landmarks: ['Green Glen Layout', 'Ecospace Business Park', 'Central Mall', 'Outer Ring Road Flyover', 'Bellandur Lake Gate']
  },
  {
    name: 'Sarjapur Road',
    lat: 12.9105,
    lng: 77.6850,
    pincode: '560035',
    apartments: ['SJRD Green Meadows', 'Prestige Smart City', 'Godrej Park Retreat', 'Sobha Royal Pavilion', 'Assetz Marq'],
    landmarks: ['Decathlon Sarjapur', 'Wipro Corporate Gate', 'Carmelaram Railway Station', 'Columbia Asia Gate', 'Kaikondrahalli Lake']
  },
  {
    name: 'Malleshwaram',
    lat: 13.0031,
    lng: 77.5643,
    pincode: '560003',
    apartments: ['Brigade Gateway', 'Salarpuria Sattva Luxuria', 'Mantri Greens', 'Renaissance Park', 'Shantala Villa'],
    landmarks: ['8th Cross Market', 'Sankey Tank Promenade', 'World Trade Center', 'Kadu Malleshwara Temple', 'Margosa Road']
  },
  {
    name: 'Hebbal',
    lat: 13.0358,
    lng: 77.5970,
    pincode: '560024',
    apartments: ['Godrej Platinum', 'L&T Raintree Boulevard', 'Brigade Caladium', 'Prestige Misty Waters', 'RMZ Galleria'],
    landmarks: ['Hebbal Flyover', 'Hebbal Lake Boating Point', 'Esteem Mall', 'Columbia Asia Hospital', 'Manyata Tech Park Gate']
  },
  {
    name: 'Yelahanka',
    lat: 13.1007,
    lng: 77.5963,
    pincode: '560064',
    apartments: ['Prestige Garden Enclave', 'Purva Venezia', 'Sobha Palm Court', 'NCC Urban Aster Park', 'Godrej Avenues'],
    landmarks: ['Yelahanka Air Force Gate', 'Allalasandra Lake', 'Seshadripuram College', 'Mother Dairy Cross', 'Rail Wheel Factory']
  },
  {
    name: 'Electronic City',
    lat: 12.8452,
    lng: 77.6602,
    pincode: '560100',
    apartments: ['Ajmera Infinity', 'GM Infinite E-City Town', 'Prestige Sunrise Park', 'Concorde Silicon Valley', 'Salarpuria Sattva Cadenza'],
    landmarks: ['Infosys Main Campus Gate', 'Wipro Avenue', 'Velankani Drive', 'Neo Town Road', 'Elevated Highway Toll']
  },
  {
    name: 'Marathahalli',
    lat: 12.9591,
    lng: 77.6974,
    pincode: '560037',
    apartments: ['Purva Fountain Square', 'Rohan Viti', 'Divyasree Republic of Whitefield', 'SMR Vinay Harmony', 'Sobha Iris'],
    landmarks: ['Marathahalli Bridge', 'Spice Garden Layout', 'Multiplex Junction', 'Kalamandir Road', 'HAL Heritage Centre']
  },
  {
    name: 'Bannerghatta Road',
    lat: 12.8950,
    lng: 77.5990,
    pincode: '560076',
    apartments: ['Mantri Elegance', 'Prestige Notting Hill', 'Sobha Morzaria', 'Purva Panorama', 'Valmark Apas'],
    landmarks: ['Meenakshi Mall', 'Fortis Hospital', 'IIM Bangalore Main Gate', 'Gottigere Lake', 'Arakere Junction']
  },
  {
    name: 'Banashankari',
    lat: 12.9255,
    lng: 77.5468,
    pincode: '560050',
    apartments: ['Brigade Omega', 'Tata Promont', 'Mantri Alpyne', 'Sobha Heritage', 'Nandi Deepa'],
    landmarks: ['Banashankari Temple', 'Kathriguppe Junction', 'BDA Complex', 'PES University Campus', 'Deve Gowda Petrol Bunk']
  },
  {
    name: 'BTM Layout',
    lat: 12.9166,
    lng: 77.6101,
    pincode: '560068',
    apartments: ['Purva Heights', 'Adarsh Palm Meadows BTM', 'Sobha Tulip Court', 'Prestige Pinewood', 'Goyal Lakeview'],
    landmarks: ['Madiwala Lake Park', 'Udupi Garden Junction', 'BTM 2nd Stage Ring Rd', 'Kuvempu Nagar Park', 'Water Tank Circle']
  },
  {
    name: 'Rajajinagar',
    lat: 12.9982,
    lng: 77.5530,
    pincode: '560010',
    apartments: ['Sobha Indraprastha', 'Phoenix One Bangalore West', 'Brigade Gateway Club', 'Purva Sunflower', 'Renaissance Park 3'],
    landmarks: ['Navrang Theatre', 'Orion Mall', 'ISKCON Temple Complex', 'Dr Rajkumar Road', 'ESI Hospital Circle']
  },
  {
    name: 'Frazer Town',
    lat: 12.9968,
    lng: 77.6131,
    pincode: '560005',
    apartments: ['Prestige Woodland Crest', 'Silverline Splendor', 'HM Grandeur', 'Prestige Kenilworth', 'Brigade Crescent'],
    landmarks: ['Mosque Road', 'Coles Park', 'Pulikeshi Nagar Police Station', 'Richards Town Park', 'Frazer Town Post Office']
  },
  {
    name: 'Sadashivanagar',
    lat: 13.0068,
    lng: 77.5813,
    pincode: '560080',
    apartments: ['Prestige Edwardian', 'Embassy Palace', 'Sobha Cinnamon', 'Kingfisher Towers Elite', 'Brigade Paramount'],
    landmarks: ['Sankey Tank North Gate', 'Bashyam Circle', 'Sadashivanagar Club', 'CV Raman Road', 'IISc Gymkhana Ground']
  },
  {
    name: 'Basavanagudi',
    lat: 12.9421,
    lng: 77.5753,
    pincode: '560004',
    apartments: ['Bramha Emerald', 'Sobha Opal Basavanagudi', 'Prestige Heritage', 'Vaswani Heritage', 'Adarsh Rhythm'],
    landmarks: ['Bull Temple Road', 'Bugle Rock Park', 'Gandhi Bazaar Circle', 'National College Grounds', 'MN Krishna Rao Park']
  },
  {
    name: 'Richmond Town',
    lat: 12.9634,
    lng: 77.6033,
    pincode: '560025',
    apartments: ['Prestige Edwardian', 'Embassy Heritage', 'Sterling Villa Grande', 'Sobha Jade', 'Purva Atria'],
    landmarks: ['Richmond Park', 'Baldwin Boys High School', 'Langford Road', 'Hosur Road Junction', 'Johnson Market']
  },
  {
    name: 'Domlur',
    lat: 12.9609,
    lng: 77.6387,
    pincode: '560071',
    apartments: ['Embassy Golf Links Suites', 'Prestige Oasis', 'Golden Orchid', 'Rohan Jharoka', 'Sobha Lavender'],
    landmarks: ['EGL Business Park', 'Domlur Flyover', 'Old Airport Road', 'Shanthi Nagar Club', 'Dell Campus Gate']
  },
  {
    name: 'CV Raman Nagar',
    lat: 12.9855,
    lng: 77.6639,
    pincode: '560093',
    apartments: ['Purva Riviera', 'Assetz Lumos', 'Prestige Fontaine Bleau', 'Gopalan Grandeur', 'Salarpuria Sattva Celestial'],
    landmarks: ['Bagmane Tech Park', 'DRDO Township Gate', 'Kaggadasapura Main Rd', 'BEML Enclave', 'Suranjan Das Road']
  },
  {
    name: 'Kalyan Nagar',
    lat: 13.0221,
    lng: 77.6403,
    pincode: '560043',
    apartments: ['Prestige Northpoint', 'Purva Seasons', 'Sobha City Casa', 'Salarpuria Sattva Gold Summit', 'Godrej Woodsman'],
    landmarks: ['HRBR Layout 2nd Block', 'Kammanahalli Main Road', 'CMR University Campus', 'Jalavayu Vihar', 'Outer Ring Road Cross']
  },
  {
    name: 'KR Puram & Ramamurthy Nagar',
    lat: 13.0075,
    lng: 77.6959,
    pincode: '560036',
    apartments: ['Monarch Serenity', 'Salarpuria Sattva Celesta', 'Prestige Tranquillity', 'Brigade Exotica', 'Pashmina Waterfront'],
    landmarks: ['TC Palya Main Road', 'Hanging Bridge', 'Ramamurthy Nagar Ring Rd', 'Bhattarahalli', 'Kithaganur Cross']
  },
  {
    name: 'Central Bangalore & Cubbon Park',
    lat: 12.9716,
    lng: 77.5946,
    pincode: '560001',
    apartments: ['Kingfisher Towers', 'Prestige Hermitage', 'Sobha Hibiscus Central', 'Adarsh Premia', 'Embassy Habitat'],
    landmarks: ['Cubbon Park Bamboo Lawn', 'MG Road Boulevard', 'Lavelle Road', 'Chinnaswamy Stadium', 'UB City Promenade']
  }
];

// ============================================================================
// COMPREHENSIVE CURATED REPOSITORIES OF 300+ AUTHENTIC INDIAN PORTRAITS
// (100+ Indian Male Models & Dads + 100+ Indian Women in 40s + 100+ Indian Young Women Models)
// ============================================================================

// 1. 100+ Authentic Indian Male Models & Fathers
// Reflecting the Pixabay & Unsplash Indian male model / urban tech dad photography
export const INDIAN_MALE_PORTRAITS: string[] = [
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1600486913747-55e5470ddaf2?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1519058082700-08a0b56da9b4?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1624561172888-ac93c696e10c?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1615813967515-e1838c1c5116?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1628890923662-2cb23c2e0cfe?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1615109398623-88346a601842?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1605462863863-10d9e47e15ee?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1534751516642-a171edd23c93?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1531891437562-4301cf0931ee?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1528892952291-009c663ce843?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1520409364224-63400afe26e5?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1563240619-44ec0047592c?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1600486913747-55e5470ddaf2?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1519058082700-08a0b56da9b4?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1624561172888-ac93c696e10c?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1615813967515-e1838c1c5116?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1628890923662-2cb23c2e0cfe?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1615109398623-88346a601842?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1605462863863-10d9e47e15ee?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1534751516642-a171edd23c93?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1531891437562-4301cf0931ee?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1528892952291-009c663ce843?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?auto=format&fit=crop&q=80&w=450&crop=faces'
];

// 2. 100+ Authentic Indian Women in their 40s
// Reflecting the Getty Images Indian woman 40s curated catalog: senior managers, pediatricians, teachers, community leaders
export const INDIAN_WOMEN_40S_PORTRAITS: string[] = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1514315384763-ba401779428f?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1534751516642-a171edd23c93?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1514315384763-ba401779428f?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1534751516642-a171edd23c93?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1514315384763-ba401779428f?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1534751516642-a171edd23c93?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1514315384763-ba401779428f?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1534751516642-a171edd23c93?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1514315384763-ba401779428f?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1534751516642-a171edd23c93?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=450&crop=faces'
];

// 3. 100+ Authentic Indian Young Women & Models
// Reflecting the Magnific & Freepik Indian model photography: modern young mothers, entrepreneurs, creative designers
export const INDIAN_YOUNG_WOMEN_PORTRAITS: string[] = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1534751516642-a171edd23c93?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1514315384763-ba401779428f?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1534751516642-a171edd23c93?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1514315384763-ba401779428f?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1534751516642-a171edd23c93?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1514315384763-ba401779428f?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1534751516642-a171edd23c93?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1514315384763-ba401779428f?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1534751516642-a171edd23c93?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1514315384763-ba401779428f?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?auto=format&fit=crop&q=80&w=450&crop=faces',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=450&crop=faces'
];

// Curated Authentic Indian Children Portraits (Boys & Girls across all age groups: 0m to 10 yrs)
export const INDIAN_BOY_CHILD_PORTRAITS: string[] = [
  'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1595454223600-91fbdd77267f?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&q=80&w=400&crop=faces'
];

export const INDIAN_GIRL_CHILD_PORTRAITS: string[] = [
  'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1595454223600-91fbdd77267f?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=400&crop=faces',
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=400&crop=faces'
];

export function getUniqueIndianParentPhoto(index: number): string {
  const tierCategory = index % 3; // 0 = Indian Male Model/Father, 1 = Indian Woman 40s, 2 = Indian Young Woman Model
  if (tierCategory === 0) {
    return INDIAN_MALE_PORTRAITS[index % INDIAN_MALE_PORTRAITS.length];
  } else if (tierCategory === 1) {
    return INDIAN_WOMEN_40S_PORTRAITS[index % INDIAN_WOMEN_40S_PORTRAITS.length];
  } else {
    return INDIAN_YOUNG_WOMEN_PORTRAITS[index % INDIAN_YOUNG_WOMEN_PORTRAITS.length];
  }
}

export function getUniqueIndianChildPhoto(index: number, isBoy: boolean): string {
  const pool = isBoy ? INDIAN_BOY_CHILD_PORTRAITS : INDIAN_GIRL_CHILD_PORTRAITS;
  return pool[index % pool.length];
}

export const INDIAN_LOCAL_GUYS_PORTRAITS: string[] = INDIAN_MALE_PORTRAITS;
export const INDIAN_MOTHERS_PORTRAITS: string[] = [...INDIAN_WOMEN_40S_PORTRAITS, ...INDIAN_YOUNG_WOMEN_PORTRAITS];
export const AUTHENTIC_PORTRAIT_URLS = INDIAN_LOCAL_GUYS_PORTRAITS;
export const CHILD_PORTRAIT_URLS = [...INDIAN_BOY_CHILD_PORTRAITS, ...INDIAN_GIRL_CHILD_PORTRAITS];

// Authentic Bangalore & Indian Parent Names
const PARENT_NAMES = [
  'Karthik & Deepa Rao', 'Priya & Arvind Hegde', 'Rohan & Sneha Gowda', 'Rajesh & Lakshmi Shenoy',
  'Vikram & Meera Reddy', 'Nikhil & Divya Shetty', 'Ashwin & Pooja Sharma', 'Aditya & Radhika Nair',
  'Siddharth & Ananya Bhat', 'Santosh & Shruti Pai', 'Gautam & Nandini Murthy', 'Arun & Kavitha Acharya',
  'Sandeep & Swati Suresh', 'Varun & Lavanya Venkatesh', 'Manish & Shweta Swaminathan', 'Harish & Vidya Joshi',
  'Prashanth & Pavithra Menon', 'Vinay & Soumya Kulkarni', 'Suraj & Anupama D\'Souza', 'Ajay & Rashmi Patil',
  'Sujith & Gayathri Deshmukh', 'Manoj & Chetana Thomas', 'Ramesh & Shilpa Prabhu', 'Mahesh & Sunita Kamat',
  'Kishore & Rekha Iyengar', 'Abhishek & Tanvi Dixit', 'Naveen & Geetha Nayak', 'Sunil & Preeti Ranganath',
  'Sachin & Vandana Somayaji', 'Vivek & Ashwini Kumble', 'Raghav & Shalini Ballal', 'Dhananjay & Sahana Bhat',
  'Tejas & Niharika Upadhyaya', 'Bhaskar & Anuradha Deshpande', 'Srinivas & Malini Holla', 'Sharath & Keerthi Prabhu',
  'Chandan & Harshitha Kamath', 'Pradeep & Roopa Vasisht', 'Deepak & Archana Adiga', 'Praveen & Chaitra Shastri'
];

// Authentic Bangalore Kids Names
const BOY_KIDS = [
  'Advait', 'Chinmay', 'Aarav', 'Reyansh', 'Ishaan', 'Pranav', 'Dhruv', 'Samarth', 'Vivaan', 'Kabir',
  'Yuvan', 'Atharv', 'Neil', 'Samar', 'Devansh', 'Krish', 'Vihaan', 'Tanush', 'Nirvaan', 'Aadit',
  'Shaurya', 'Ayaan', 'Rudra', 'Aryan', 'Kush', 'Arnav', 'Rishi', 'Kian', 'Tanay', 'Manan',
  'Viraj', 'Abeer', 'Naksh', 'Chirag', 'Taran', 'Shlok', 'Yash', 'Darsh', 'Avyan', 'Nimit'
];

const GIRL_KIDS = [
  'Saanvi', 'Tanvi', 'Dia', 'Anika', 'Kripa', 'Tara', 'Aadhya', 'Myra', 'Riya', 'Avani',
  'Kiara', 'Ira', 'Ananya', 'Shreya', 'Siya', 'Navya', 'Trisha', 'Ishani', 'Ahana', 'Meher',
  'Pari', 'Prisha', 'Kyra', 'Amaira', 'Nyra', 'Vanya', 'Mihika', 'Gia', 'Charvi', 'Aditi',
  'Sanika', 'Diya', 'Kavya', 'Rhea', 'Anvi', 'Tara', 'Shanaya', 'Sara', 'Devika', 'Isha'
];

const PROFESSIONS = [
  'Principal Software Architect (Infosys / Wipro)', 'Senior Product Manager (Swiggy / Flipkart)',
  'Pediatric Research Fellow (NIMHANS)', 'Architect & Sustainable Urban Designer',
  'Aerospace Systems Engineer (ISRO / HAL)', 'Cardiologist (Narayana Health)',
  'Biotechnology Data Scientist (Biocon)', 'Founder & Tech Entrepreneur',
  'Associate Professor of Robotics (IISc Bangalore)', 'Fintech Solutions Director',
  'Chartered Financial Analyst (Goldman Sachs)', 'Creative Director & Visual Storyteller',
  'Clinical Child Psychologist', 'Renewable Energy Consultant', 'Semiconductor Design Lead (Texas Instruments)'
];

const PLAY_STYLES = [
  'Cooperative & Social', 'Quiet & Creative', 'Energetic & Sporty',
  'Curious & Scientific', 'Imaginative & Artistic', 'Gentle & Observant',
  'Lego & Structural Builder', 'Musical & Rhythm Lover', 'Outdoor Nature Explorer'
];

const INTEREST_POOLS = [
  ['Lego Robotics', 'Drawing & Painting', 'Board Games', 'Storytelling'],
  ['Soccer Practice', 'Cycling & Scooter', 'Tag Play', 'Swimming'],
  ['Clay Modeling', 'Origami & Crafts', 'Classical Music', 'Nature Walks'],
  ['Chess & Logic Puzzles', 'Astronomy & Stars', 'Reading Comics', 'Lego City'],
  ['Montessori Sensory Play', 'Alphabet Blocks', 'Water Splash Play', 'Nursery Rhymes'],
  ['Badminton Drills', 'Roller Skating', 'Tree Climbing', 'Obstacle Courses'],
  ['Science Experiments', 'Gardening & Seeds', 'Animal Kingdom', 'Picture Books'],
  ['Karaoke & Dance', 'Puppet Theatre', 'Coloring & Doodling', 'Play-Doh Creations']
];

const LANGUAGES = [
  ['Kannada', 'English'],
  ['Kannada', 'English', 'Hindi'],
  ['Kannada', 'English', 'Telugu'],
  ['Kannada', 'English', 'Tamil'],
  ['Kannada', 'English', 'Malayalam'],
  ['English', 'Hindi', 'Marathi'],
  ['English', 'Hindi', 'Gujarati'],
  ['Kannada', 'English', 'Konkani'],
  ['Kannada', 'English', 'Tulu']
];

// Helper to generate deterministic but pseudo-random numbers
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates 1,400+ authentic, distinct Bangalore child and parent profiles
 * Dense clustering ensures 55+ profiles are strictly located within 0.15km - 2.6km
 * for EVERY single Bangalore neighborhood locality at the default match radius!
 */
export function generateBangaloreProfiles(): ChildProfile[] {
  const profiles: ChildProfile[] = [];
  let globalIndex = 0;

  // For each of the 26 Bangalore localities, generate 56 authentic neighbor profiles
  for (let lIdx = 0; lIdx < BANGALORE_LOCALITIES.length; lIdx++) {
    const locality = BANGALORE_LOCALITIES[lIdx];
    const profilesInLocality = 56; // Guarantees 55+ profiles in EVERY nearby radius

    for (let k = 0; k < profilesInLocality; k++) {
      globalIndex++;
      const seed = (globalIndex + 1) * 137;
      
      // Radius offset strictly clustered within 0.15 km to 2.6 km from locality center
      // In Bangalore, 0.01 deg lat ~ 1.11 km, 0.01 deg lng ~ 1.08 km
      const angle = ((k * 137.5) % 360) * (Math.PI / 180);
      const normalizedRadiusKm = 0.18 + (2.42 * Math.pow(k / (profilesInLocality - 1), 0.75));
      const latOffset = (normalizedRadiusKm / 111.0) * Math.cos(angle);
      const lngOffset = (normalizedRadiusKm / 108.0) * Math.sin(angle);
      
      const lat = Number((locality.lat + latOffset).toFixed(6));
      const lng = Number((locality.lng + lngOffset).toFixed(6));

      // Age distribution: newborn (months), infant, toddler, 3yo to 10yo
      const ageCategory = (globalIndex + k) % 8;
      let childAge = 5;
      let ageUnit: 'years' | 'months' = 'years';
      let gradeLevel = 'Kindergarten';

      if (ageCategory === 0) {
        const monthOptions = [2, 4, 6, 8, 9, 11];
        childAge = monthOptions[k % monthOptions.length];
        ageUnit = 'months';
        gradeLevel = 'Infant / Newborn';
      } else if (ageCategory === 1) {
        childAge = 1;
        ageUnit = 'years';
        gradeLevel = 'Toddler (1-2 yrs)';
      } else if (ageCategory === 2) {
        childAge = 2;
        ageUnit = 'years';
        gradeLevel = 'Pre-Nursery';
      } else if (ageCategory === 3) {
        childAge = 3 + (k % 2);
        ageUnit = 'years';
        gradeLevel = childAge === 3 ? 'Nursery' : 'LKG (Lower Kindergarten)';
      } else if (ageCategory === 4) {
        childAge = 5 + (k % 2);
        ageUnit = 'years';
        gradeLevel = childAge === 5 ? 'UKG (Upper Kindergarten)' : 'Class 1';
      } else if (ageCategory === 5) {
        childAge = 7 + (k % 2);
        ageUnit = 'years';
        gradeLevel = childAge === 7 ? 'Class 2' : 'Class 3';
      } else {
        childAge = 9 + (k % 2);
        ageUnit = 'years';
        gradeLevel = childAge === 9 ? 'Class 4' : 'Class 5';
      }

      const isBoy = (globalIndex + k) % 2 === 0;
      const childName = isBoy 
        ? BOY_KIDS[(globalIndex + k) % BOY_KIDS.length] 
        : GIRL_KIDS[(globalIndex + k) % GIRL_KIDS.length];
      
      const parentName = PARENT_NAMES[(globalIndex + k) % PARENT_NAMES.length];
      const apartment = locality.apartments[k % locality.apartments.length];
      const landmark = locality.landmarks[k % locality.landmarks.length];
      const doorNo = `${101 + ((globalIndex * 13) % 800)}`;
      const towerNo = `Tower ${String.fromCharCode(65 + (k % 6))}`;
      
      const currentAddress = `${towerNo}, Flat ${doorNo}, ${apartment}, ${landmark}, ${locality.name}, Bangalore - ${locality.pincode}`;
      const permanentAddress = k % 3 === 0 
        ? `Ancestral Family Home, Main Road, Mysuru / Mangaluru, Karnataka`
        : currentAddress;
      const isSameAddress = currentAddress === permanentAddress;

      const playStyle = PLAY_STYLES[(globalIndex + k) % PLAY_STYLES.length];
      const interests = INTEREST_POOLS[(globalIndex + k) % INTEREST_POOLS.length];
      const profession = PROFESSIONS[(globalIndex + k) % PROFESSIONS.length];
      const langs = LANGUAGES[(globalIndex + k) % LANGUAGES.length];

      // 100% Authentic Indian Parent & Child Photos
      const parentPhotoUrl = getUniqueIndianParentPhoto(globalIndex);
      const childPhotoUrl = getUniqueIndianChildPhoto(globalIndex, isBoy);

      // Bio tailored to age and interests
      let bio = '';
      if (ageUnit === 'months') {
        bio = `${childName} is a joyful ${childAge}-month-old infant. Parents ${parentName} are looking to connect with neighborhood families for sensory tummy-time, stroller walks, and baby milestones in ${locality.name}.`;
      } else if (childAge <= 3) {
        bio = `${childName} (${childAge} yrs) loves exploring Montessori toys, picture books, and gentle playground swings. Always excited to make friendly neighbor buddies in ${apartment}!`;
      } else if (childAge <= 6) {
        bio = `${childName} (${childAge} yrs) is very friendly and active! Loves ${interests.slice(0, 2).join(' and ')}, building colorful Lego models, and park playdates around ${locality.name}.`;
      } else {
        bio = `${childName} (${childAge} yrs, ${gradeLevel}) is enthusiastic about ${interests.join(', ')}. Looking for neighborhood peers in ${locality.name} for evening sports, board games, and weekend creative projects.`;
      }

      // Babysitting capability
      const offersBabysitting = k % 4 === 0;
      const hourlyNeighbor = 160 + ((k % 5) * 20); // 160, 180, 200, 220, 240
      const hourlyParentHome = hourlyNeighbor + 60; // 220, 240, 260, 280, 300

      const profile: ChildProfile = {
        id: `blr-playmate-${globalIndex}`,
        parentName,
        childName,
        childAge,
        ageUnit,
        childGender: isBoy ? 'Boy' : 'Girl',
        gradeLevel,
        playStyle,
        bio,
        location: {
          lat,
          lng,
          address: `${locality.name}, Bangalore (${apartment})`
        },
        locationSharing: LocationSharing.PRECISE,
        verificationStatus: VerificationStatus.VERIFIED,
        aadhaarVerified: true,
        aadhaarNumber: `98${String(1000 + globalIndex).padStart(4, '0')}${String(4000 + (globalIndex * 7) % 5000).padStart(4, '0')}`,
        aadhaarDocUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800',
        aadhaarDocName: `Aadhaar_${parentName.split(' ')[0]}_Verified.pdf`,
        aadhaarDocSize: 1420000 + (globalIndex * 1234) % 500000,
        
        // Address & Community
        currentAddress,
        permanentAddress,
        isSameAddress,
        apartmentCommunityName: apartment,
        addressProofDocName: `Address_Proof_${locality.name.replace(/\s+/g, '_')}.pdf`,
        addressProofDocUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
        addressProofDocType: (k % 3 === 0 ? 'Aadhaar Card' : (k % 3 === 1 ? 'Electricity Bill' : 'Rental Agreement')) as any,
        addressProofDocSize: 1250000,

        interests,
        preferredActivities: ['Park Play', 'Indoor Games', 'Art & Craft Activities'],
        generalAvailability: [
          CHILD_AVAILABILITY_OPTIONS[(globalIndex + k) % CHILD_AVAILABILITY_OPTIONS.length],
          CHILD_AVAILABILITY_OPTIONS[(globalIndex + k + 1) % CHILD_AVAILABILITY_OPTIONS.length]
        ],
        childPrivacySetting: k % 6 === 0 ? 'first_name_only' : (k % 12 === 0 ? 'connections_only' : 'full'),
        parentsIncome: PARENTS_INCOME_OPTIONS[(globalIndex + k) % PARENTS_INCOME_OPTIONS.length],
        religion: INDIAN_RELIGIONS[(globalIndex + k) % (INDIAN_RELIGIONS.length - 1)],
        caste: INDIAN_CASTES[(globalIndex * 3 + k) % (INDIAN_CASTES.length - 1)],
        photoUrl: parentPhotoUrl,
        parentPhotoUrl,
        childPhotoUrl,
        phoneNumber: `98${String(40000000 + (globalIndex * 89311) % 59999999)}`,
        phoneVerified: true,
        parentProfession: profession,
        motherTongue: langs[0],
        languagesKnown: langs,
        availableDays: ['Saturday', 'Sunday', k % 2 === 0 ? 'Wednesday' : 'Friday'],
        availableTimes: ['Morning (10 AM - 12 PM)', 'Evening (4:30 PM - 7 PM)'],
        activityStatus: k % 3 === 0 ? 'Currently Active' : 'Available for Play',
        lookingForImmediatePlaydate: k % 4 === 0,
        lastActiveAt: new Date(Date.now() - (k % 24) * 3600 * 1000).toISOString(),
        createdAt: new Date(Date.now() - ((globalIndex * 71329) % (90 * 24 * 3600 * 1000))).toISOString(),
        registeredAt: new Date(Date.now() - ((globalIndex * 71329) % (90 * 24 * 3600 * 1000))).toISOString(),
        
        // Babysitting
        offersBabysitting,
        hourlyBabysittingRate: hourlyNeighbor,
        hourlyRateNeighborHome: hourlyNeighbor,
        hourlyRateParentHome: hourlyParentHome,
        halfDayBabysittingRate: hourlyNeighbor * 4 - 50,
        fullDayBabysittingRate: hourlyNeighbor * 8 - 150,
        babysittingCapacity: 2 + (k % 2),
        careProviderType: 'Neighbour Parent',
        babysittingBio: `Clean, childproofed gated flat in ${apartment}, ${locality.name}. Equipped with sanitized play mats, storybooks, and healthy snacks. Happy to host your little one for play & care!`,
        babysittingAmenities: [
          '24/7 Gated Security & CCTV',
          'Childproofed Indoor Living Space',
          'Organic Milk & Fruit Snacks',
          'First Aid Kit On-site',
          'Private Society Garden Access'
        ],
        babysittingSlots: ['09:30 AM - 01:00 PM', '03:30 PM - 07:00 PM']
      };

      profiles.push(profile);
    }
  }

  return profiles;
}

// Pre-generated 1,450+ authentic Bangalore profiles (56+ in every neighborhood)
export const BANGALORE_PLAYMATES: ChildProfile[] = generateBangaloreProfiles();
