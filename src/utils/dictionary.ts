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
  
  // Vernunt New Features
  swipeConnect: string;
  groups: string;
  communityHosting: string;
  growthTracker: string;
  vernuntPages: string;
  appGuide: string;
  momsOnlySpace: string;
  biometricLogin: string;
  
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

export const BASE_DICTIONARIES: Record<'en' | 'hi' | 'kn' | 'ta' | 'te' | 'ml' | 'mr' | 'bn', Dictionary> = {
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
    swipeConnect: 'Swipe Deck',
    groups: 'Vernunt Groups',
    communityHosting: 'Community',
    growthTracker: 'Baby & Pregnancy',
    vernuntPages: 'Vernunt Pages',
    appGuide: 'App Guide',
    momsOnlySpace: 'Moms-Only Safe Space',
    biometricLogin: 'Biometric Unlock',
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
    swipeConnect: 'स्वाइप कनेक्ट',
    groups: 'समूह (ग्रुप्स)',
    communityHosting: 'समुदाय (होस्टिंग)',
    growthTracker: 'शिशु और गर्भावस्था',
    vernuntPages: 'वर्नंट पेजेस',
    appGuide: 'ऐप मार्गदर्शिका',
    momsOnlySpace: 'केवल माताओं के लिए सुरक्षित क्षेत्र',
    biometricLogin: 'बायोमेट्रिक अनलॉक',
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
  kn: {
    nearPlaymates: 'ಹತ್ತಿರದ ಆಟದ ಗೆಳೆಯರು',
    chatMessenger: 'ಸಂದೇಶ ಪೆಟ್ಟಿಗೆ',
    playdatePlanner: 'ಆಟದ ದಿನ ಯೋಜಕ',
    eventsClasses: 'ಕಾರ್ಯಕ್ರಮಗಳು & ತರಗತಿಗಳು',
    specialists: 'ತಜ್ಞರು',
    businessHub: 'ವ್ಯಾಪಾರ ಕೇಂದ್ರ',
    webStore: 'ಆನ್‌ಲೈನ್ ಅಂಗಡಿ',
    safetyVault: 'ಸುರಕ್ಷತಾ ತಿಜೋರಿ',
    safetySOSHelp: 'ಸುರಕ್ಷತೆ & ತುರ್ತು ಸಹಾಯ',
    safetyStandards: 'ಸುರಕ್ಷತೆ & ಮಾನದಂಡಗಳು',
    loggedInAs: 'ಲಾಗಿನ್ ಆಗಿರುವವರು',
    localPlaymatesCount: 'ಸ್ಥಳೀಯ ನೆರೆಹೊರೆಯ ಮಕ್ಕಳು',
    radarView: 'ರಾಡಾರ್ ನೋಟ',
    mapView: 'ನಕ್ಷೆ ನೋಟ',
    swipeConnect: 'ಸ್ವೈಪ್ ಡೆಕ್',
    groups: 'ವರ್ನಂಟ್ ಗುಂಪುಗಳು',
    communityHosting: 'ಸಮುದಾಯ (ಆತಿಥ್ಯ)',
    growthTracker: 'ಮಗು & ಗರ್ಭಧಾರಣೆ',
    vernuntPages: 'ವರ್ನಂಟ್ ಪುಟಗಳು',
    appGuide: 'ಆ್ಯಪ್ ಮಾರ್ಗದರ್ಶಿ',
    momsOnlySpace: 'ತಾಯಂದಿರಿಗೆ ಮಾತ್ರ ಸುರಕ್ಷಿತ ಸ್ಥಳ',
    biometricLogin: 'ಬಯೋಮೆಟ್ರಿಕ್ ಅನ್‌ಲಾಕ್',
    secureEntryGateway: 'ಸುರಕ್ಷಿತ ಪ್ರವೇಶ ದ್ವಾರ',
    joinOurFamilyNetwork: 'ನಮ್ಮ ಕುಟುಂಬ ನೆಟ್‌ವರ್ಕ್‌ಗೆ ಸೇರಿ',
    authorizeWorkspace: 'ಕೆಳಗಿನ ಯಾವುದೇ ಪರಿಶೀಲಿಸಿದ ಆಯ್ಕೆಯನ್ನು ಬಳಸಿಕೊಂಡು ಪ್ರವೇಶಿಸಿ',
    google: 'ಗೂಗಲ್',
    email: 'ಇಮೇಲ್',
    phoneSMS: 'ಫೋನ್ SMS',
    continueSecureGoogle: 'ಗೂಗಲ್ ಮೂಲಕ ಮುಂದುವರಿಯಿರಿ',
    exploreApp: 'ವರ್ನಂಟ್ ಅನ್ವೇಷಿಸಿ',
    customSignUp: 'ಪ್ರೊಫೈಲ್ ನೋಂದಾಯಿಸಿ',
    registerFamilyProfile: 'ಕುಟುಂಬ ಪ್ರೊಫೈಲ್ ನೋಂದಣಿ',
    parentGuardianName: 'ಪೋಷಕರ ಅಥವಾ ಪಾಲಕರ ಹೆಸರು',
    childName: 'ಮಗುವಿನ ಹೆಸರು',
    primaryCityNeighborhood: 'ನಗರ ಅಥವಾ ನೆರೆಹೊರೆ',
    verifyMobileNumber: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಪರಿಶೀಲಿಸಿ (SMS OTP)',
    sendSmsOtp: 'SMS OTP ಕಳುಹಿಸಿ',
    enterVerificationCode: 'ಪರಿಶೀಲನಾ ಕೋಡ್',
    confirmVerify: 'ಪರಿಶೀಲಿಸಿ',
    nextStep: 'ಮುಂದಿನ ಹಂತ',
    prevStep: 'ಹಿಂದೆ'
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
    swipeConnect: 'ஸ்வைப் தளம்',
    groups: 'வர்னன்ட் குழுக்கள்',
    communityHosting: 'சமூகம் (ஹோஸ்டிங்)',
    growthTracker: 'குழந்தை & கர்ப்பம்',
    vernuntPages: 'வர்னன்ட் பக்கங்கள்',
    appGuide: 'பயன்பாட்டு வழிகாட்டி',
    momsOnlySpace: 'தாய்மார்களுக்கு மட்டும் பாதுகாப்பான இடம்',
    biometricLogin: 'கைரேகை அன்லாக்',
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
  },
  te: {
    nearPlaymates: 'సమీప ఆట స్నేహితులు',
    chatMessenger: 'చాట్ మెసెంజర్',
    playdatePlanner: 'ఆట ప్రణాళిక',
    eventsClasses: 'ఈవెంట్లు & తరగతులు',
    specialists: 'నిపుణులు',
    businessHub: 'వ్యాపార కేంద్రం',
    webStore: 'వెబ్ స్టోర్',
    safetyVault: 'భద్రతా ఖజానా',
    safetySOSHelp: 'భద్రత & అత్యవసర సహాయం',
    safetyStandards: 'భద్రత & ప్రమాణాలు',
    loggedInAs: 'లాగిన్ అయిన వారు',
    localPlaymatesCount: 'సమీప పరిసరాల పిల్లలు',
    radarView: 'రాడార్ వీక్షణ',
    mapView: 'మ్యాప్ వీక్షణ',
    swipeConnect: 'స్వైప్ డెక్',
    groups: 'వర్నంట్ సమూహాలు',
    communityHosting: 'సంఘం (హోస్టింగ్)',
    growthTracker: 'శిశువు & గర్భధారణ',
    vernuntPages: 'వర్నంట్ పేజీలు',
    appGuide: 'యాప్ గైడ్',
    momsOnlySpace: 'తల్లులకు మాత్రమే సురక్షిత స్థలం',
    biometricLogin: 'బయోమెట్రిక్ అన్‌లాక్',
    secureEntryGateway: 'సురక్షిత ప్రవేశ ద్వారం',
    joinOurFamilyNetwork: 'మా కుటుంబ నెట్‌వర్క్‌లో చేరండి',
    authorizeWorkspace: 'సురక్షితంగా ప్రవేశించండి',
    google: 'గూగుల్',
    email: 'ఈమెయిల్',
    phoneSMS: 'ఫోన్ SMS',
    continueSecureGoogle: 'గూగుల్‌తో కొనసాగించండి',
    exploreApp: 'యాప్ అన్వేషించండి',
    customSignUp: 'ప్రొఫైల్ నమోదు చేసుకోండి',
    registerFamilyProfile: 'కుటుంబ ప్రొఫైల్ నమోదు',
    parentGuardianName: 'తల్లిదండ్రుల లేదా సంరక్షకుని పేరు',
    childName: 'పిల్లల పేరు',
    primaryCityNeighborhood: 'నగరం లేదా ప్రాంతం',
    verifyMobileNumber: 'మొబైల్ సంఖ్య ధృవీకరించండి (SMS OTP)',
    sendSmsOtp: 'SMS OTP పంపండి',
    enterVerificationCode: 'ధృవీకరణ కోడ్',
    confirmVerify: 'ధృవీకరించండి',
    nextStep: 'తదుపరి దశ',
    prevStep: 'వెనుకకు'
  },
  ml: {
    nearPlaymates: 'അടുത്തുള്ള കളിക്കൂട്ടുകാർ',
    chatMessenger: 'ചാറ്റ് മെസഞ്ചർ',
    playdatePlanner: 'കളി പ്ലാനർ',
    eventsClasses: 'ഇവന്റുകൾ & ക്ലാസുകൾ',
    specialists: 'വിദഗ്ദ്ധർ',
    businessHub: 'ബിസിനസ് ഹബ്',
    webStore: 'വെബ് സ്റ്റോർ',
    safetyVault: 'സുരക്ഷാ വോൾട്ട്',
    safetySOSHelp: 'സുരക്ഷ & അടിയന്തര സഹായം',
    safetyStandards: 'സുരക്ഷ & മാനദണ്ഡങ്ങൾ',
    loggedInAs: 'ലോഗിൻ ചെയ്തിരിക്കുന്നു',
    localPlaymatesCount: 'അയൽപക്കത്തെ കുട്ടികൾ',
    radarView: 'റഡാർ കാഴ്ച',
    mapView: 'മാപ്പ് കാഴ്ച',
    swipeConnect: 'സ്വൈപ്പ് ഡെക്ക്',
    groups: 'വെർനന്റ് ഗ്രൂപ്പുകൾ',
    communityHosting: 'കമ്മ്യൂണിറ്റി (ഹോസ്റ്റിംഗ്)',
    growthTracker: 'കുഞ്ഞും ഗർഭധാരണവും',
    vernuntPages: 'വെർനന്റ് പേജുകൾ',
    appGuide: 'ആപ്പ് ഗൈഡ്',
    momsOnlySpace: 'അമ്മമാർക്ക് മാത്രമുള്ള സുരക്ഷിത ഇടം',
    biometricLogin: 'ബയോമെട്രിക് അൺലോക്ക്',
    secureEntryGateway: 'സുരക്ഷിത പ്രവേശന കവാടം',
    joinOurFamilyNetwork: 'ഞങ്ങളുടെ കുടുംബ നെറ്റ്‌വർക്കിൽ ചേരുക',
    authorizeWorkspace: 'സുരക്ഷിതമായി ലോഗിൻ ചെയ്യുക',
    google: 'ഗൂഗിൾ',
    email: 'ഇമെയിൽ',
    phoneSMS: 'ഫോൺ SMS',
    continueSecureGoogle: 'ഗൂഗിൾ വഴി തുടരുക',
    exploreApp: 'ആപ്പ് പര്യവേക്ഷണം ചെയ്യുക',
    customSignUp: 'പ്രൊഫൈൽ രജിസ്റ്റർ ചെയ്യുക',
    registerFamilyProfile: 'കുടുംബ പ്രൊഫൈൽ രജിസ്റ്റർ ചെയ്യുക',
    parentGuardianName: 'രക്ഷാകർത്താവിന്റെ പേര്',
    childName: 'കുട്ടിയുടെ പേര്',
    primaryCityNeighborhood: 'നഗരം അല്ലെങ്കിൽ പ്രദേശം',
    verifyMobileNumber: 'മൊബൈൽ നമ്പർ പരിശോധിക്കുക (SMS OTP)',
    sendSmsOtp: 'SMS OTP അയക്കുക',
    enterVerificationCode: 'പരിശോധനാ കോഡ്',
    confirmVerify: 'സ്ഥിരീകരിക്കുക',
    nextStep: 'അടുത്ത ഘട്ടം',
    prevStep: 'പുറകോട്ട്'
  },
  mr: {
    nearPlaymates: 'जवळचे खेळगडी',
    chatMessenger: 'चॅट मेसेंजर',
    playdatePlanner: 'खेळ नियोजक',
    eventsClasses: 'कार्यक्रम आणि वर्ग',
    specialists: 'तज्ज्ञ',
    businessHub: 'व्यवसाय केंद्र',
    webStore: 'ऑनलाइन स्टोअर',
    safetyVault: 'सुरक्षा तिजोरी',
    safetySOSHelp: 'सुरक्षा आणि आपत्कालीन मदत',
    safetyStandards: 'सुरक्षा आणि मानके',
    loggedInAs: 'लॉग इन केले आहे',
    localPlaymatesCount: 'स्थानिक परिसरातील मुले',
    radarView: 'रडार दृश्य',
    mapView: 'नकाशा दृश्य',
    swipeConnect: 'स्वाइप डेक',
    groups: 'वर्नंट गट',
    communityHosting: 'समुदाय (होस्टिंग)',
    growthTracker: 'बाळ आणि गर्भधारणा',
    vernuntPages: 'वर्नंट पेजेस',
    appGuide: 'अ‍ॅप मार्गदर्शक',
    momsOnlySpace: 'फक्त मातांसाठी सुरक्षित जागा',
    biometricLogin: 'बायोमेट्रिक अनलॉक',
    secureEntryGateway: 'सुरक्षित प्रवेशद्वार',
    joinOurFamilyNetwork: 'आमच्या कौटुंबिक नेटवर्कमध्ये सामील व्हा',
    authorizeWorkspace: 'खालील पर्यायांचा वापर करून सुरक्षितपणे प्रवेश करा',
    google: 'गुगल',
    email: 'ईमेल',
    phoneSMS: 'फोन एसएमएस',
    continueSecureGoogle: 'गुगल सह सुरक्षितपणे पुढे जा',
    exploreApp: 'अ‍ॅप एक्सप्लोर करा',
    customSignUp: 'प्रोफाइल नोंदणी करा',
    registerFamilyProfile: 'कौटुंबिक प्रोफाइल नोंदणी',
    parentGuardianName: 'पालकांचे नाव',
    childName: 'मुलाचे नाव',
    primaryCityNeighborhood: 'शहर किंवा परिसर',
    verifyMobileNumber: 'मोबाइल नंबर पडताळा (SMS OTP)',
    sendSmsOtp: 'SMS OTP पाठवा',
    enterVerificationCode: 'पडताळणी कोड',
    confirmVerify: 'पडताळा',
    nextStep: 'पुढील पायरी',
    prevStep: 'मागे'
  },
  bn: {
    nearPlaymates: 'কাছের খেলার সাথী',
    chatMessenger: 'চ্যাট মেসেঞ্জার',
    playdatePlanner: 'খেলার পরিকল্পনাকারী',
    eventsClasses: 'ইভেন্ট ও ক্লাস',
    specialists: 'বিশেষজ্ঞগণ',
    businessHub: 'বিজনেস হাব',
    webStore: 'ওয়েব স্টোর',
    safetyVault: 'নিরাপত্তা ভল্ট',
    safetySOSHelp: 'নিরাপত্তা ও জরুরি সাহায্য',
    safetyStandards: 'নিরাপত্তা ও মানদণ্ড',
    loggedInAs: 'লগইন করেছেন',
    localPlaymatesCount: 'স্থানীয় পাড়ার শিশুরা',
    radarView: 'রাডার ভিউ',
    mapView: 'ম্যাপ ভিউ',
    swipeConnect: 'সোয়াইপ ডেক',
    groups: 'ভার্নান্ট গ্রুপস',
    communityHosting: 'কমিউনিটি (হোস্টিং)',
    growthTracker: 'শিশু ও গর্ভাবস্থা',
    vernuntPages: 'ভার্নান্ট পেজেস',
    appGuide: 'অ্যাপ গাইড',
    momsOnlySpace: 'শুধুমাত্র মায়েদের নিরাপদ স্থান',
    biometricLogin: 'বায়োমেট্রিক আনলক',
    secureEntryGateway: 'নিরাপদ প্রবেশদ্বার',
    joinOurFamilyNetwork: 'আমাদের ফ্যামিলি নেটওয়ার্কে যোগ দিন',
    authorizeWorkspace: 'যেকোনো যাচাইকৃত বিকল্প ব্যবহার করে প্রবেশ করুন',
    google: 'গুগল',
    email: 'ইমেইল',
    phoneSMS: 'ফোন এসএমএস',
    continueSecureGoogle: 'গুগল দিয়ে এগিয়ে যান',
    exploreApp: 'অ্যাপ ঘুরে দেখুন',
    customSignUp: 'প্রোফাইল নিবন্ধন করুন',
    registerFamilyProfile: 'পারিবারিক প্রোফাইল নিবন্ধন',
    parentGuardianName: 'অভিভাবকের নাম',
    childName: 'শিশুর নাম',
    primaryCityNeighborhood: 'শহর বা এলাকা',
    verifyMobileNumber: 'মোবাইল নম্বর যাচাই করুন (SMS OTP)',
    sendSmsOtp: 'SMS OTP পাঠান',
    enterVerificationCode: 'যাচাইকরণ কোড',
    confirmVerify: 'যাচাই করুন',
    nextStep: 'পরবর্তী ধাপ',
    prevStep: 'পূর্ববর্তী'
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
  if (code in BASE_DICTIONARIES) {
    DICTIONARY[code] = BASE_DICTIONARIES[code as keyof typeof BASE_DICTIONARIES];
  } else {
    if (['bho', 'har', 'raj', 'mwr', 'mai', 'kum', 'gb', 'doi'].includes(code)) {
      DICTIONARY[code] = BASE_DICTIONARIES['hi'];
    } else {
      DICTIONARY[code] = BASE_DICTIONARIES['en'];
    }
  }
}

// 8 Major Indian Languages + English
export const EIGHT_INDIAN_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', flag: '🇮🇳' }
] as const;

export const LANGUAGES = EIGHT_INDIAN_LANGUAGES;

export function getDictionary(lang?: string): Dictionary {
  if (lang && DICTIONARY[lang as LanguageCode]) {
    return DICTIONARY[lang as LanguageCode];
  }
  return BASE_DICTIONARIES.en;
}
