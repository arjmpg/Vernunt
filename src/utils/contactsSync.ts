import { UserContact } from '../types.ts';

// Comprehensive multi-source contacts repository (SIM Card, Gmail / Google Contacts, Phone Memory, iCloud, WhatsApp)
export const MULTI_SOURCE_CONTACT_DATABASE: Omit<UserContact, 'id' | 'syncedAt' | 'visibility'>[] = [
  // --- SIM CARD CONTACTS (SIM 1 & SIM 2) ---
  { name: 'Aarav Sharma (Cousin)', phone: '9820199881', email: 'aarav.sharma@gmail.com', source: 'sim', relationship: 'Family' },
  { name: 'Sunita Sharma (Masi / Aunt)', phone: '9820144552', email: 'sunita.sharma68@gmail.com', source: 'sim', relationship: 'Family' },
  { name: 'Ramesh Gupta (Uncle)', phone: '9820133221', email: 'ramesh.gupta@rediffmail.com', source: 'sim', relationship: 'Family' },
  { name: 'Grandma Kaushalya', phone: '9820011223', source: 'sim', relationship: 'Family' },
  { name: 'Dada Ji (Home)', phone: '9820022334', source: 'sim', relationship: 'Family' },
  { name: 'Dr. A. K. Joshi (Family Doctor)', phone: '9820556677', email: 'dr.akjoshi@apollohospitals.com', source: 'sim', relationship: 'Other' },
  { name: 'Sita Bai (Daycare Nanny)', phone: '9833441122', source: 'sim', relationship: 'Family' },
  { name: 'Driver Ramesh Kumar', phone: '9833552233', source: 'sim', relationship: 'Other' },
  { name: 'Society Security Gate 1', phone: '9820998877', source: 'sim', relationship: 'Neighbor' },
  { name: 'Society Management Office', phone: '9820998866', email: 'office@oberoigardens.org', source: 'sim', relationship: 'Neighbor' },
  { name: 'Emergency Pediatric Ambulance', phone: '9811009988', source: 'sim', relationship: 'Other' },
  { name: 'Fresh Fruits & Veg Vendor', phone: '9833119900', source: 'sim', relationship: 'Other' },

  // --- GMAIL & GOOGLE CONTACTS (Cloud Synced Address Book) ---
  { name: 'Priya Kapoor (Preschool PTA Chair)', phone: '9930887766', email: 'priya.kapoor@preschool.edu.in', source: 'gmail', relationship: 'School' },
  { name: 'Ananya Mehta (Next Door Neighbor)', phone: '9820455667', email: 'ananya.mehta.design@gmail.com', source: 'gmail', relationship: 'Neighbor' },
  { name: 'Vikram Joshi (Senior Director)', phone: '9811223344', email: 'vikram.joshi@consultingcorp.com', source: 'gmail', relationship: 'Work' },
  { name: 'Neha Singhal (Toddler Art Club)', phone: '9833221144', email: 'neha.singhal.art@gmail.com', source: 'gmail', relationship: 'School' },
  { name: 'Coach Rajesh (Karate & Soccer Academy)', phone: '9877665544', email: 'coach.rajesh@sportszen.in', source: 'gmail', relationship: 'School' },
  { name: 'Dr. Meenakshi Sundaram (Pediatrician)', phone: '9844112233', email: 'dr.meenakshi@childcareclinic.in', source: 'gmail', relationship: 'Other' },
  { name: 'Siddharth Roy (VP Product)', phone: '9920114477', email: 'siddharth.roy@fintechinnovate.com', source: 'gmail', relationship: 'Work' },
  { name: 'Kavita Deshmukh (Robotics Class Mom)', phone: '9890112233', email: 'kavita.deshmukh@gmail.com', source: 'gmail', relationship: 'School' },
  { name: 'Amitabh Verma (Society Secretary)', phone: '9821445566', email: 'amitabh.verma@societyboard.org', source: 'gmail', relationship: 'Neighbor' },
  { name: 'Tanvi Shah (Vedic Math Tutor)', phone: '9820667788', email: 'tanvi.maths@brightminds.edu', source: 'gmail', relationship: 'School' },
  { name: 'Deepak Merchant (Architect & Parent)', phone: '9833778899', email: 'deepak@merchantstudio.in', source: 'gmail', relationship: 'Friend' },
  { name: 'Shweta Rao (Montessori Coordinator)', phone: '9845012345', email: 'shweta.rao@greenwoodpreschool.org', source: 'gmail', relationship: 'School' },
  { name: 'Rahul Chawla (Weekend Cricket League)', phone: '9810123456', email: 'rahul.chawla@cricketclub.com', source: 'gmail', relationship: 'Friend' },
  { name: 'Divya Nambiar (Pottery & Clay Teacher)', phone: '9847123456', email: 'divya.claywork@gmail.com', source: 'gmail', relationship: 'School' },
  { name: 'Dr. Rohan Alva (Child Psychologist)', phone: '9820234567', email: 'dr.alva@mindgrowclinic.in', source: 'gmail', relationship: 'Other' },
  { name: 'Nikhil Agarwal (Angel Investor & Dad)', phone: '9821345678', email: 'nikhil@seedventures.vc', source: 'gmail', relationship: 'Work' },
  { name: 'Sangeeta Pillai (Dance Academy)', phone: '9840456789', email: 'sangeeta@nrityakala.org', source: 'gmail', relationship: 'School' },
  { name: 'Arunav Sengupta (Chess Master)', phone: '9830567890', email: 'arunav.chess@grandmasters.in', source: 'gmail', relationship: 'School' },
  { name: 'Pooja Bhattacharya (Storyteller)', phone: '9831678901', email: 'pooja.stories@magicquill.org', source: 'gmail', relationship: 'Friend' },

  // --- PHONE STORAGE CONTACTS (Device Memory) ---
  { name: 'Karan Malhotra (BFF & Dad)', phone: '9819887766', email: 'karan.malhotra@gmail.com', source: 'phone', relationship: 'Friend' },
  { name: 'Ritika Malhotra (Playgroup Host)', phone: '9819887755', email: 'ritika.malhotra@gmail.com', source: 'phone', relationship: 'Friend' },
  { name: 'Manish Trivedi (Wing B Flat 402)', phone: '9820987654', email: 'manish.trivedi@outlook.com', source: 'phone', relationship: 'Neighbor' },
  { name: 'Preeti Trivedi (Baking Club)', phone: '9820987653', email: 'preeti.bakes@gmail.com', source: 'phone', relationship: 'Neighbor' },
  { name: 'Gaurav Kulkarni (Cycling Buddy)', phone: '9890876543', email: 'gaurav.k@tcs.com', source: 'phone', relationship: 'Friend' },
  { name: 'Pooja Kulkarni (Lego Club Mom)', phone: '9890876542', email: 'pooja.kulkarni@yahoo.com', source: 'phone', relationship: 'School' },
  { name: 'Ayesha Khan (Sensory Play Organizer)', phone: '9820123987', email: 'ayesha.khan@sensoryplay.in', source: 'phone', relationship: 'Friend' },
  { name: 'Sanjay Dutt (Gym Trainer)', phone: '9820456123', email: 'sanjay.fit@goldgym.in', source: 'phone', relationship: 'Other' },
  { name: 'Aditi Nair (Yoga for Toddlers)', phone: '9845678123', email: 'aditi.nair.yoga@gmail.com', source: 'phone', relationship: 'Friend' },
  { name: 'Vishal Sethi (Guitar Instructor)', phone: '9811234890', email: 'vishal.strings@gmail.com', source: 'phone', relationship: 'School' },
  { name: 'Kiran Patel (Society Treasurer)', phone: '9825123456', email: 'kiran.patel@diamondtraders.in', source: 'phone', relationship: 'Neighbor' },
  { name: 'Meera Patel (Society Garden Committee)', phone: '9825123457', email: 'meera.garden@gmail.com', source: 'phone', relationship: 'Neighbor' },
  { name: 'Sameer Sheikh (Robotics & STEM Hub)', phone: '9820789012', email: 'sameer@stemkidsindia.com', source: 'phone', relationship: 'School' },
  { name: 'Sunil Gavaskar (Swim Coach)', phone: '9820345678', email: 'sunil.swim@dolphinsport.in', source: 'phone', relationship: 'School' },

  // --- WHATSAPP & ICLOUD CONTACTS ---
  { name: 'Kabir Oberoi (Playground Friend)', phone: '9819002244', email: 'kabir.oberoi@icloud.com', source: 'icloud', relationship: 'Friend' },
  { name: 'Tara Oberoi (Organic Meals Co-op)', phone: '9819002255', email: 'tara.oberoi@icloud.com', source: 'icloud', relationship: 'Friend' },
  { name: 'Zoya Merchant (Grade 1 Class Rep)', phone: '9820883311', email: 'zoya.merchant@gmail.com', source: 'whatsapp', relationship: 'School' },
  { name: 'Farhan Akhtar (Kids Drama Club)', phone: '9820883322', email: 'farhan@littleactors.in', source: 'whatsapp', relationship: 'School' },
  { name: 'Sneha Kothari (Carnival Organizer)', phone: '9821994400', email: 'sneha.kothari@mumbaievents.com', source: 'whatsapp', relationship: 'Neighbor' },
  { name: 'Harish Iyer (Pet Therapy & Dogs Club)', phone: '9820771199', email: 'harish@pawsomeplay.org', source: 'whatsapp', relationship: 'Friend' }
];

/**
 * Generates an expanded, realistic list of synchronized contacts across all channels:
 * SIM Card, Gmail / Google Account, Local Device Phonebook, iCloud, and WhatsApp.
 */
export function generateSynchronizedContactsList(
  autoHideDefault = false,
  userEmail?: string
): UserContact[] {
  const timestamp = new Date().toISOString();
  
  // Clone and enrich base contacts
  const syncedList: UserContact[] = MULTI_SOURCE_CONTACT_DATABASE.map((item, idx) => {
    let visibility: UserContact['visibility'] = 'visible';
    if (autoHideDefault) {
      visibility = 'hidden';
    } else if (item.relationship === 'Work' || item.name.includes('Doctor') || item.name.includes('Ambulance')) {
      visibility = 'hidden';
    } else if (item.relationship === 'School' || item.relationship === 'Neighbor') {
      visibility = idx % 2 === 0 ? 'visible' : 'connected';
    }

    return {
      id: `synced_${item.source || 'phone'}_${idx}_${Date.now()}`,
      name: item.name,
      phone: item.phone,
      email: item.email,
      source: item.source || 'phone',
      relationship: item.relationship || 'Friend',
      visibility: visibility,
      syncedAt: timestamp
    };
  });

  // If user provided custom email, inject personal Gmail sync verification marker
  if (userEmail && userEmail.includes('@')) {
    syncedList.unshift({
      id: `gmail_sync_owner_${Date.now()}`,
      name: `Primary Google Account (${userEmail})`,
      phone: '9820000001',
      email: userEmail,
      source: 'gmail',
      relationship: 'Family',
      visibility: 'hidden',
      syncedAt: timestamp,
      notes: 'Active linked Google account contacts repository'
    });
  }

  return syncedList;
}

/**
 * Parses standard vCard (.vcf) format files exported from Android, iOS, or Google Contacts.
 */
export function parseVcfContacts(vcfContent: string, autoHide = false): UserContact[] {
  const contacts: UserContact[] = [];
  const cards = vcfContent.split(/BEGIN:VCARD/i);

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i].trim();
    if (!card) continue;

    let name = '';
    let phone = '';
    let email = '';

    // Match Full Name (FN:)
    const fnMatch = card.match(/FN(?:;[^:]+)?:(.*)/i);
    if (fnMatch) {
      name = fnMatch[1].trim();
    } else {
      const nMatch = card.match(/N(?:;[^:]+)?:(.*)/i);
      if (nMatch) {
        const parts = nMatch[1].split(';').filter(Boolean);
        name = parts.reverse().join(' ').trim();
      }
    }

    // Match Phone (TEL:)
    const telMatches = [...card.matchAll(/TEL(?:;[^:]+)?:([0-9+\-\s()]+)/gi)];
    if (telMatches.length > 0) {
      phone = telMatches[0][1].replace(/\D/g, '');
    }

    // Match Email (EMAIL:)
    const emailMatch = card.match(/EMAIL(?:;[^:]+)?:([^\r\n]+)/i);
    if (emailMatch) {
      email = emailMatch[1].trim();
    }

    if (name || phone || email) {
      contacts.push({
        id: `vcf_${Date.now()}_${i}`,
        name: name || (phone ? `Contact ${phone}` : 'Unnamed Contact'),
        phone: phone || (email ? '0000000000' : '980000000' + (i % 10)),
        email: email || undefined,
        source: 'phone',
        relationship: 'Friend',
        visibility: autoHide ? 'hidden' : 'visible',
        syncedAt: new Date().toISOString()
      });
    }
  }

  return contacts;
}

/**
 * Parses simple CSV format: Name, Phone, Email, Relationship
 */
export function parseCsvContacts(csvContent: string, autoHide = false): UserContact[] {
  const lines = csvContent.split(/\r?\n/);
  const contacts: UserContact[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (i === 0 && line.toLowerCase().includes('name')) continue; // Skip header

    const parts = line.split(',').map(s => s.replace(/^["']|["']$/g, '').trim());
    if (parts.length < 2) continue;

    const name = parts[0];
    const phone = parts[1].replace(/\D/g, '');
    const email = parts[2] && parts[2].includes('@') ? parts[2] : undefined;
    const rel = (parts[3] as UserContact['relationship']) || 'Friend';

    if (name && (phone || email)) {
      contacts.push({
        id: `csv_${Date.now()}_${i}`,
        name: name,
        phone: phone || '0000000000',
        email: email,
        source: 'gmail',
        relationship: rel,
        visibility: autoHide ? 'hidden' : 'visible',
        syncedAt: new Date().toISOString()
      });
    }
  }

  return contacts;
}
