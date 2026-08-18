export type LanguageCode = 
  | 'as' | 'bn' | 'bho' | 'brx' | 'doi' | 'en' | 'gb' | 'gar'
  | 'gu' | 'har' | 'hi' | 'kn' | 'ks' | 'kha' | 'kok' | 'kum'
  | 'mai' | 'ml' | 'mni' | 'mr' | 'mwr' | 'mzo' | 'ne' | 'or'
  | 'pa' | 'raj' | 'sa' | 'sat' | 'sd' | 'ta' | 'te' | 'tcy' | 'ur';

export interface Dictionary {
  // Navigation & Header
  nearPlaymates: string;
  chatMessenger: string;
  playdatePlanner: string;
  eventsClasses: string;
  specialists: string;
  businessHub: string;
  webStore: string;
  safetyVault: string;
  safetySOSHelp: string;
  safetyStandards: string;
  loggedInAs: string;
  localPlaymatesCount: string;
  radarView: string;
  mapView: string;
  
  // Landing Login
  secureEntryGateway: string;
  joinOurFamilyNetwork: string;
  authorizeWorkspace: string;
  google: string;
  email: string;
  phoneSMS: string;
  continueSecureGoogle: string;
  exploreApp: string;
  customSignUp: string;
  
  // Registration Hub
  registerFamilyProfile: string;
  parentGuardianName: string;
  childName: string;
  primaryCityNeighborhood: string;
  verifyMobileNumber: string;
  sendSmsOtp: string;
  enterVerificationCode: string;
  confirmVerify: string;
  nextStep: string;
  prevStep: string;
}

const BASE_DICTIONARIES: Record<'en' | 'hi' | 'ta', Dictionary> = {
  en: {
    nearPlaymates: 'Near Playmates',
    chatMessenger: 'Chat Messenger',
    playdatePlanner: 'Playdate Planner',
    eventsClasses: 'Events & Classes',
    specialists: 'Specialists',
    businessHub: 'Business Hub',
    webStore: 'Web Store',
    safetyVault: 'Safety Vault',
    safetySOSHelp: 'Safety & SOS Help',
    safetyStandards: 'Safety & Standards',
    loggedInAs: 'Logged in as',
    localPlaymatesCount: 'local neighborhood kids',
    radarView: 'Radar View',
    mapView: 'Map View',
    
    secureEntryGateway: 'Secure Entry Gateway',
    joinOurFamilyNetwork: 'Join Our Family Network',
    authorizeWorkspace: 'Authorize your secure workspace using any verified platform option below',
    google: 'Google',
    email: 'Email',
    phoneSMS: 'Phone SMS',
    continueSecureGoogle: 'Continue securely with Google',
    exploreApp: 'Explore Vernunt',
    customSignUp: 'Register your profile',
    
    registerFamilyProfile: 'Register Family Profile',
    parentGuardianName: 'Parent or Guardian Name',
    childName: 'Child Name',
    primaryCityNeighborhood: 'Primary City or Neighborhood',
    verifyMobileNumber: 'Verify Your Mobile Number (SMS OTP)',
    sendSmsOtp: 'Send SMS OTP',
    enterVerificationCode: 'Verification Code (SMS OTP)',
    confirmVerify: 'Verify',
    nextStep: 'Next Step',
    prevStep: 'Back'
  },
  hi: {
    nearPlaymates: 'पास के दोस्त',
    chatMessenger: 'चैट मैसेंजर',
    playdatePlanner: 'खेल योजनाकार',
    eventsClasses: 'कार्यक्रम और कक्षाएं',
    specialists: 'विशेषज्ञ',
    businessHub: 'व्यापार केंद्र',
    webStore: 'ऑनलाइन दुकान',
    safetyVault: 'सुरक्षा तिजोरी',
    safetySOSHelp: 'सुरक्षा और आपातकालीन सहायता',
    safetyStandards: 'सुरक्षा और मानक',
    loggedInAs: 'लॉग इन किया है',
    localPlaymatesCount: 'स्थानीय पड़ोस के बच्चे',
    radarView: 'रडार व्यू',
    mapView: 'नक्शा व्यू',
    
    secureEntryGateway: 'सुरक्षित प्रवेश द्वार',
    joinOurFamilyNetwork: 'हमारे पारिवारिक नेटवर्क से जुड़ें',
    authorizeWorkspace: 'नीचे दिए गए किसी भी सत्यापित विकल्प का उपयोग करके अपने सुरक्षित कार्यक्षेत्र को अधिकृत करें',
    google: 'गूगल',
    email: 'ईमेल',
    phoneSMS: 'फ़ोन एसएमएस',
    continueSecureGoogle: 'गूगल के साथ सुरक्षित रूप से आगे बढ़ें',
    exploreApp: 'ऐप एक्सप्लोर करें',
    customSignUp: 'अपना प्रोफाइल पंजीकृत करें',
    
    registerFamilyProfile: 'पारिवारिक प्रोफाइल पंजीकृत करें',
    parentGuardianName: 'अभिभावक का नाम',
    childName: 'बच्चे का नाम',
    primaryCityNeighborhood: 'प्राथमिक शहर या इलाका',
    verifyMobileNumber: 'अपना मोबाइल नंबर सत्यापित करें (एसएमएस ओटीपी)',
    sendSmsOtp: 'एसएमएस ओटीपी भेजें',
    enterVerificationCode: 'सत्यापन कोड (एसएमएस ओटीपी)',
    confirmVerify: 'सत्यापित करें',
    nextStep: 'अगला चरण',
    prevStep: 'पीछे'
  },
  ta: {
    nearPlaymates: 'அருகிலுள்ள நண்பர்கள்',
    chatMessenger: 'அரட்டை பேழை',
    playdatePlanner: 'விளையாட்டுத் திட்டமிடுபவர்',
    eventsClasses: 'நிகழ்வுகள் மற்றும் வகுப்புகள்',
    specialists: 'நிபுணர்கள்',
    businessHub: 'வணிக மையம்',
    webStore: 'இணையக் கடை',
    safetyVault: 'பாதுகாப்பு பெட்டகம்',
    safetySOSHelp: 'பாதுகாப்பு மற்றும் அவசர உதவி',
    safetyStandards: 'பாதுகாப்பு மற்றும் தரநிலைகள்',
    loggedInAs: 'உள்நுழைந்துள்ளவர்',
    localPlaymatesCount: 'அருகிலுள்ள குழந்தைகள்',
    radarView: 'ரேடார் பார்வை',
    mapView: 'வரைபட பார்வை',
    
    secureEntryGateway: 'பாதுகாப்பான நுழைவாயில்',
    joinOurFamilyNetwork: 'எங்கள் குடும்ப நெட்வொர்க்கில் இணையுங்கள்',
    authorizeWorkspace: 'கீழே உள்ள சரிபார்க்கப்பட்ட விருப்பத்தைப் பயன்படுத்தி உங்கள் பணியிடத்தை பாதுகாக்கவும்',
    google: 'கூகிள்',
    email: 'மின்னஞ்சல்',
    phoneSMS: 'தொலைபேசி எஸ்எம்எஸ்',
    continueSecureGoogle: 'கூகிள் மூலம் பாதுகாப்பாகத் தொடரவும்',
    exploreApp: 'பயன்பாட்டை ஆராயுங்கள்',
    customSignUp: 'உங்கள் சுயவிவரத்தை பதிவு செய்யவும்',
    
    registerFamilyProfile: 'குடும்ப சுயவிவரத்தை பதிவு செய்யவும்',
    parentGuardianName: 'பெற்றோர் அல்லது பாதுகாவலர் பெயர்',
    childName: 'குழந்தையின் பெயர்',
    primaryCityNeighborhood: 'முக்கிய நகரம் அல்லது வட்டாரம்',
    verifyMobileNumber: 'உங்கள் மொபைல் எண்ணை சரிபார்க்கவும் (எஸ்எம்எஸ் ஓடிபி)',
    sendSmsOtp: 'எஸ்எம்எஸ் ஓடிபி அனுப்புக',
    enterVerificationCode: 'சரிபார்ப்பு குறியீடு (எஸ்எம்எஸ் ஓடிபி)',
    confirmVerify: 'சரிபார்',
    nextStep: 'அடுத்த கட்டம்',
    prevStep: 'முந்தைய'
  }
};

export const DICTIONARY: Record<LanguageCode, Dictionary> = {} as Record<LanguageCode, Dictionary>;

const languageCodes: LanguageCode[] = [
  'as', 'bn', 'bho', 'brx', 'doi', 'en', 'gb', 'gar',
  'gu', 'har', 'hi', 'kn', 'ks', 'kha', 'kok', 'kum',
  'mai', 'ml', 'mni', 'mr', 'mwr', 'mzo', 'ne', 'or',
  'pa', 'raj', 'sa', 'sat', 'sd', 'ta', 'te', 'tcy', 'ur'
];

for (const code of languageCodes) {
  if (code === 'hi' || code === 'ta' || code === 'en') {
    DICTIONARY[code] = BASE_DICTIONARIES[code];
  } else {
    if (['bho', 'har', 'raj', 'mwr', 'mai', 'kum', 'gb', 'doi'].includes(code)) {
      DICTIONARY[code] = BASE_DICTIONARIES['hi'];
    } else {
      DICTIONARY[code] = BASE_DICTIONARIES['en'];
    }
  }
}

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ur', label: 'Urdu', native: 'اردو', flag: '🇮🇳' },
  { code: 'as', label: 'Assamese', native: 'অসমীয়া', flag: '🇮🇳' },
  { code: 'sa', label: 'Sanskrit', native: 'Sanskrit', flag: '🇮🇳' },
  { code: 'ne', label: 'Nepali', native: 'নেपाली', flag: '🇮🇳' },
  { code: 'ks', label: 'Kashmiri', native: 'कश्मीरी', flag: '🇮🇳' },
  { code: 'kok', label: 'Konkani', native: 'कोंकणी', flag: '🇮🇳' },
  { code: 'sd', label: 'Sindhi', native: 'सिंधी', flag: '🇮🇳' },
  { code: 'doi', label: 'Dogri', native: 'डोगरी', flag: '🇮🇳' },
  { code: 'brx', label: 'Bodo', native: 'Bodo', flag: '🇮🇳' },
  { code: 'sat', label: 'Santali', native: 'Santali', flag: '🇮🇳' },
  { code: 'mni', label: 'Manipuri', native: 'Manipuri', flag: '🇮🇳' },
  { code: 'bho', label: 'Bhojpuri', native: 'भोजपुरी', flag: '🇮🇳' },
  { code: 'har', label: 'Haryanvi', native: 'हरियाणवी', flag: '🇮🇳' },
  { code: 'raj', label: 'Rajasthani', native: 'राजस्थानी', flag: '🇮🇳' },
  { code: 'mwr', label: 'Marwari', native: 'मारवाड़ी', flag: '🇮🇳' },
  { code: 'mai', label: 'Maithili', native: 'मैथिली', flag: '🇮🇳' },
  { code: 'kum', label: 'Kumaoni', native: 'कुमाऊँनी', flag: '🇮🇳' },
  { code: 'gb', label: 'Garhwali', native: 'गढ़वाली', flag: '🇮🇳' },
  { code: 'kha', label: 'Khasi', native: 'Khasi', flag: '🇮🇳' },
  { code: 'gar', label: 'Garo', native: 'Garo', flag: '🇮🇳' },
  { code: 'mzo', label: 'Mizo', native: 'Mizo', flag: '🇮🇳' },
  { code: 'tcy', label: 'Tulu', native: 'Tulu', flag: '🇮🇳' }
] as const;
