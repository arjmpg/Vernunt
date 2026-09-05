import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  Baby, 
  ShoppingBag, 
  Calendar, 
  HelpCircle, 
  Radio, 
  Sliders, 
  Globe, 
  CheckCircle2, 
  X, 
  Send, 
  Languages,
  Headphones,
  Mail,
  UserCheck,
  Zap
} from 'lucide-react';

export interface IndianVoiceSample {
  id: string;
  languageCode: string;
  languageName: string;
  title: string;
  callerScenario: string;
  spokenText: string;
  phonetics: string;
  englishMeaning: string;
  category: 'language_switch' | 'playmates' | 'kyc' | 'daycare' | 'store' | 'events' | 'general';
  suggestedAction: string;
}

export const INDIAN_LANGUAGES_LIST = [
  { code: 'en-IN', name: 'English (India)', native: 'English', flag: '🌐', greeting: "Hello and welcome to Vernunt Support! I'm Priya, so glad to connect with you! Which language would you feel most comfortable speaking in today?" },
  { code: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🟡🔴', greeting: "ನಮಸ್ಕಾರ! ವೇರ್ನಂಟ್ ಕಸ್ಟಮರ್ ಕೇರ್‌ಗೆ ಪ್ರೀತಿಯ ಸ್ವಾಗತ, ನಾನು ಪ್ರಿಯಾ! ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ನನಗೆ ತುಂಬಾ ಸಂತೋಷವಾಗಿದೆ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ನೆರವಾಗಲಿ?" },
  { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', greeting: "नमस्ते! वर्नंट कस्टमर केयर में आपका बहुत-बहुत स्वागत है, मैं प्रिया बात कर रही हूँ! आपकी सहायता करके मुझे बहुत खुशी होगी। बताइए आज मैं आपकी क्या मदद कर सकती हूँ?" },
  { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்', flag: '🪔', greeting: "வணக்கம்! வெர்னண்ட் வாடிக்கையாளர் சேவைக்கு அன்பான வரவேற்பு, நான் பிரியா! உங்களுக்கு உதவுவதில் எனக்கு மிகுந்த மகிழ்ச்சி. சொல்லுங்கள், இன்று நான் உங்களுக்கு எப்படி உதவலாம்?" },
  { code: 'te-IN', name: 'Telugu', native: 'తెలుగు', flag: '🏛️', greeting: "నమస్కారం! వెర్నంట్ కస్టమర్ కేర్‌కు సాదర స్వాగతం, నేను ప్రియ మాట్లాడుతున్నాను! మీకు సహాయం చేయడానికి నేను ఎల్లప్పుడూ సిద్ధంగా ఉన్నాను. చెప్పండి, ఈరోజు నేను మీకు ఎలా సాయపడగలను?" },
  { code: 'ml-IN', name: 'Malayalam', native: 'മലയാളം', flag: '🌴', greeting: "നമസ്കാരം! വെർനന്റ് കസ്റ്റമർ കെയറിലേക്ക് ഹൃദ്യമായ സ്വാഗതം, ഞാൻ പ്രിയ സംസാരിക്കുന്നു! നിങ്ങളെ സഹായിക്കാൻ സാധിച്ചതിൽ വളരെ സന്തോഷം. പറയൂ, ഇന്ന് ഞാൻ എങ്ങനെയാണ് സഹായിക്കേണ്ടത്?" },
  { code: 'mr-IN', name: 'Marathi', native: 'मराठी', flag: '🚩', greeting: "नमस्कार! व्हर्नंट ग्राहक सेवेत आपले मनापासून स्वागत आहे, मी प्रिया! आपल्याला मदत करताना मला अतिशय आनंद होईल. सांगा, आज मी आपली काय मदत करू शकते?" },
  { code: 'bn-IN', name: 'Bengali', native: 'বাংলা', flag: '🎨', greeting: "নমস্কার! ভার্নান্ট কাস্টমার কেয়ার সেন্টারে আপনাকে আন্তরিক স্বাগত, আমি প্রিয়া! আপনার সাহায্য করতে পেরে আমার ভীষণ আনন্দ হচ্ছে। বলুন, আজ আপনাকে কীভাবে সাহায্য করতে পারি?" },
  { code: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી', flag: '🪁', greeting: "નમસ્તે! વર્નન્ટ કસ્ટમર કેરમાં તમારું હાર્દિક સ્વાગત છે, હું પ્રિયા! તમારી સહાયતા કરવામાં મને અત્યંત આનંદ થશે. જણાવો, આજે હું તમારી કેવી રીતે મદદ કરી શકું?" },
  { code: 'pa-IN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🌾', greeting: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਵਰਨੰਟ ਕਸਟਮਰ ਕੇਅਰ ਤੇ ਤੁਹਾਡਾ ਨਿੱਘਾ ਸਵਾਗਤ ਹੈ, ਮੈਂ ਪ੍ਰਿਆ ਹਾਂ! ਤੁਹਾਡੀ ਮਦਦ ਕਰਕੇ ਮੈਨੂੰ ਬਹੁਤ ਖੁਸ਼ੀ ਹੋਵੇਗੀ। ਦੱਸੋ ਜੀ, ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ?" },
  { code: 'or-IN', name: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🪷', greeting: "ନମସ୍କାର! ଭର୍ନଣ୍ଟ କଷ୍ଟମର କେୟାରକୁ ଆପଣଙ୍କୁ ହାର୍ଦ୍ଦିକ ସ୍ୱାଗତ, ମୁଁ ପ୍ରିୟା! ଆପଣଙ୍କୁ ସାହାଯ୍ୟ କରି ମୁଁ ବହୁତ ଖୁସି। କୁହନ୍ତୁ, ଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?" }
];

const DEFAULT_INDIAN_SAMPLES: IndianVoiceSample[] = [
  {
    id: "en_intro",
    languageCode: "en-IN",
    languageName: "English (Indian)",
    title: "Language Preference & Cheerful Welcome",
    callerScenario: "Initial phone greeting welcoming customer with enthusiasm and offering regional language options",
    spokenText: "Hello and welcome to Vernunt Support! I'm Priya, so glad to connect with you! Which language would you prefer to speak in today? You can choose Kannada, Hindi, Tamil, Telugu, Malayalam, Bengali, Marathi, or English.",
    phonetics: "Hello and welcome to Vernunt Support! I'm Priya, so glad to connect with you! Which language would you prefer to speak in today? You can choose Kannada, Hindi, Tamil, Telugu, Malayalam, Bengali, Marathi, or English.",
    englishMeaning: "Cheerful and lively English introduction offering language switching with genuine warmth.",
    category: "language_switch",
    suggestedAction: "Select Language"
  },
  {
    id: "kn_playmates",
    languageCode: "kn-IN",
    languageName: "ಕನ್ನಡ (Kannada)",
    title: "ಕನ್ನಡ - ಪ್ಲೇಮೇಟ್ಸ್ & ನೆರೆಹೊರೆ ಭದ್ರತೆ",
    callerScenario: "ಕರ್ನಾಟಕದ ಪೋಷಕರಿಂದ ಸ್ಥಳೀಯ ಆಟದ ಸ್ನೇಹಿತರ ಬಗ್ಗೆ ವಿಚಾರಣೆ",
    spokenText: "ನಮಸ್ಕಾರ! ವೇರ್ನಂಟ್ ಕಸ್ಟಮರ್ ಕೇರ್‌ಗೆ ಪ್ರೀತಿಯ ಸ್ವಾಗತ, ನಾನು ಪ್ರಿಯಾ! ನಿಮ್ಮ ಬಡಾವಣೆಯಲ್ಲಿ ಪರಿಶೀಲಿಸಿದ ಮಕ್ಕಳ ಆಟದ ಸ್ನೇಹಿತರು ಮತ್ತು ಡೇ-ಕೇರ್ ಹುಡುಕಲು ನಾನು ಖಂಡಿತ ಬಹಳ ಸಂತೋಷದಿಂದ ನಿಮಗೆ ನೆರವಾಗುತ್ತೇನೆ. ನಿಮ್ಮ ಮಗುವಿನ ವಯಸ್ಸು ಮತ್ತು ಏರಿಯಾ ಪಿನ್‌ಕೋಡ್ ತಿಳಿಸುವಿರಾ?",
    phonetics: "Namaskara! Vernunt customer care-ge preetiya swagata, naanu Priya! Nimma badavanyalli parishilisida makkala aatada snehitaru mattu daycare hudukalu naanu khandita bahala santoshadinda nimage neravaaguttene. Nimma maguvina vayassu mattu area pincode tilisuvira?",
    englishMeaning: "Hello! A warm welcome to Vernunt customer care, I'm Priya! I am truly delighted to help you find verified playmates and daycare in your neighborhood. Could you please share your child's age and area pincode?",
    category: "playmates",
    suggestedAction: "ಆಟದ ಸ್ನೇಹಿತರನ್ನು ಹುಡುಕಿ (Explore Radar)"
  },
  {
    id: "hi_kyc",
    languageCode: "hi-IN",
    languageName: "हिन्दी (Hindi)",
    title: "हिन्दी - आधार सत्यापन व सुरक्षा",
    callerScenario: "माता-पिता का सवाल कि आधार सत्यापन क्यों आवश्यक है",
    spokenText: "नमस्ते! वर्नंट कस्टमर केयर में आपका बहुत-बहुत स्वागत है, मैं प्रिया बात कर रही हूँ! बच्चों की 100% सुरक्षा के लिए यहाँ सभी माता-पिता और डे-केयर का आधार दस्तावेज़ अपलोड व एडमिन सत्यापन किया जाता है। मैं खुशी-खुशी आपकी पूरी केवाईसी करवाने में मदद करूँगी!",
    phonetics: "Namaste! Vernunt customer care mein aapka bahut-bahut swagat hai, main Priya baat kar rahi hoon! Bachhon ki 100% suraksha ke liye yahan sabhi mata-pita aur daycare ka Aadhaar document upload aur admin satyapan kiya jata hai. Main khushi-khushi aapki poori KYC karwane mein madad karoongi!",
    englishMeaning: "Namaste! A very warm welcome to Vernunt customer care, this is Priya! For 100% child safety, all parents and daycares are manually verified with Aadhaar documents and admin approval. I would be delighted to assist you in completing your KYC!",
    category: "kyc",
    suggestedAction: "आधार सत्यापन पूरा करें (Verify Aadhaar)"
  },
  {
    id: "ta_daycare",
    languageCode: "ta-IN",
    languageName: "தமிழ் (Tamil)",
    title: "தமிழ் - டே-கேர் & பேபிசிட்டிங் உதவி",
    callerScenario: "அருகிலுள்ள சரிபார்க்கப்பட்ட டே-கேர் மையங்கள் பற்றிய விசாரணை",
    spokenText: "வணக்கம்! வெர்னண்ட் வாடிக்கையாளர் சேவைக்கு அன்பான வரவேற்பு, நான் பிரியா! உங்கள் பகுதியில் உள்ள சரிபார்க்கப்பட்ட நம்பகமான பேபிசிட்டர்கள் மற்றும் டே-கேர் மையங்களை முன்பதிவு செய்ய நான் மகிழ்ச்சியுடன் உதவுகிறேன். உங்களுக்கு எந்த ஏரியாவில் உதவி தேவை?",
    phonetics: "Vanakkam! Vernunt vaadikkaiyalar sevaikku anbaana varaverpu, naan Priya! Ungal pagudhiyil ulla saripaarkkapatta nambagamaana babysittergal matrum daycare maiyangalai munpadhivu seyya naan magizhchiyudan udhavugiren. Ungalukku endha areavil udhavi thevai?",
    englishMeaning: "Hello! Warm welcome to Vernunt customer care, I'm Priya! I am so happy to help you book verified babysitters and daycare centers in your locality. Which area do you need assistance for?",
    category: "daycare",
    suggestedAction: "டே-கேர் பார்க்க (View Daycares)"
  },
  {
    id: "te_store",
    languageCode: "te-IN",
    languageName: "తెలుగు (Telugu)",
    title: "తెలుగు - ఆర్గానిಕ್ బేబీ ఫుడ్ & డెలివరీ",
    callerScenario: "సేంద్రీయ శిశు ఆహారం మరియు మాంటిస్సోరి బొమ్మల డెలివరీ సమాచారం",
    spokenText: "నమస్కారం! వెర్నంట్ కస్టమర్ కేర్‌కు సాదర స్వాగతం, నేను ప్రియ మాట్లాడుతున్నాను! మా వర్నెంట్ స్టోర్‌లో లభించే సేంద్రీయ సిరిధాన్యాల ప్యూరీలు మరియు మాంటిస్సోరి బొమ్మలు 24 గంటల్లో మీ ఇంటికి చేరుతాయి. మీ ఆర్డర్‌ను వెంటనే ట్రాక్ చేయడానికి ఆర్డర్ ఐడీ చెప్తారా?",
    phonetics: "Namaskaram! Vernunt customer care-ku saadara swagatam, nenu Priya maatlaadutunnanu! Maa Vernunt Store-lo labhinche sendriya siridhanyala pureelu mariyu Montessori bommalu 24 gantallo mee intiki cheruthaayi. Mee order-nu ventane track cheyadaniki order ID cheptara?",
    englishMeaning: "Namaskaram! Warm welcome to Vernunt customer care, this is Priya! Organic millet purees and Montessori toys reach your doorstep within 24 hours. Could you share your Order ID so I can track it immediately for you?",
    category: "store",
    suggestedAction: "స్టోర్ ఉత్పత్తులు చూడండి (View Store)"
  },
  {
    id: "ml_events",
    languageCode: "ml-IN",
    languageName: "മലയാളം (Malayalam)",
    title: "മലയാളം - കുട്ടികളുടെ ഇവന്റുകൾ & ക്യുആർ പാസ്",
    callerScenario: "കിഡ്സ് ആർട്ട് ആൻഡ് സ്പോർട്സ് ഇവന്റുകളുടെ ടിക്കറ്റ് ബുക്കിംഗ്",
    spokenText: "നമസ്കാരം! വെർനന്റ് കസ്റ്റമർ കെയറിലേക്ക് ഹൃദ്യമായ സ്വാഗതം, ഞാൻ പ്രിയ സംസാരിക്കുന്നു! കുട്ടികളുടെ റോബോട്ടിക്സ്, ക്ലേ മോഡലിംഗ് വർക്ക്ഷോപ്പുകൾക്കായി ടിക്കറ്റുകൾ വേഗത്തിൽ ബുക്ക് ചെയ്യാൻ ഞാൻ സന്തോഷത്തോടെ സഹായിക്കാം.",
    phonetics: "Namaskaram! Vernunt customer care-lekku hrudyamaya swagatam, njan Priya samsarikunnu! Kuttikalude robotics, clay modeling workshopukalkkayi ticketukal vegathil book cheyyan njan santhoshathode sahayikkam.",
    englishMeaning: "Namaskaram! Hearty welcome to Vernunt customer care, I'm Priya speaking! I will happily help you quickly book tickets for kids robotics and clay modeling workshops.",
    category: "events",
    suggestedAction: "ടിക്കറ്റ് ബുക്ക് ചെയ്യുക (Book Tickets)"
  }
];

interface KannadaVoiceAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSection?: (section: string) => void;
  initialLanguage?: string;
}

export const KannadaVoiceAgentModal: React.FC<KannadaVoiceAgentModalProps> = ({
  isOpen,
  onClose,
  onNavigateToSection,
  initialLanguage = 'en-IN'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'call_simulator' | 'samples' | 'languages'>('call_simulator');
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>(initialLanguage);
  const [selectedSample, setSelectedSample] = useState<IndianVoiceSample>(DEFAULT_INDIAN_SAMPLES[0]);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');
  const [speechRate, setSpeechRate] = useState<number>(0.96);
  const [showEnglishTranslation, setShowEnglishTranslation] = useState<boolean>(true);

  // Call Simulator States
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [callingStepText, setCallingStepText] = useState<string>('Dialing Customer Care Helpline...');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [callTranscript, setCallTranscript] = useState<Array<{ 
    sender: 'agent' | 'user'; 
    text: string; 
    languageName?: string;
    textEnglish?: string; 
    time: string 
  }>>([
    {
      sender: 'agent',
      text: "Hello and welcome to Vernunt Support! I'm Priya, so glad to connect with you! Which language would you prefer to speak in today? You can choose Kannada, Hindi, Tamil, Telugu, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia, or English.",
      languageName: "English (Indian)",
      textEnglish: "Cheerful and lively welcome asking customer's preferred Indian language.",
      time: "Just now"
    }
  ]);
  const [customUserInput, setCustomUserInput] = useState<string>('');
  const [isProcessingAI, setIsProcessingAI] = useState<boolean>(false);

  // Speech synthesis & neural audio references
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const callTimerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isNeuralAudioActive, setIsNeuralAudioActive] = useState<boolean>(false);

  useEffect(() => {
    if (initialLanguage) {
      setSelectedLanguageCode(initialLanguage);
    }
  }, [initialLanguage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [callTranscript]);

  // Play synthetic telephony sound tone (DTMF / Ringing)
  const playTelephonyTone = (frequency: number, durationMs: number = 200, type: OscillatorType = 'sine') => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) {
      console.debug('Tone play error:', e);
    }
  };

  // Text-To-Speech audio player with real neural human audio synthesis & enhanced natural device fallback
  const speakTextInLanguage = async (
    text: string, 
    langCode: string = selectedLanguageCode, 
    onEndCallback?: () => void,
    preloadedAudioUrl?: string | null
  ) => {
    stopAudio();

    // 1. If preloaded Neural WAV audio data is provided, play it directly
    if (preloadedAudioUrl) {
      try {
        const audio = new Audio(preloadedAudioUrl);
        currentAudioRef.current = audio;
        audio.playbackRate = speechRate;
        audio.onplay = () => {
          setIsPlayingAudio(true);
          setIsNeuralAudioActive(true);
        };
        audio.onended = () => {
          setIsPlayingAudio(false);
          setIsNeuralAudioActive(false);
          currentAudioRef.current = null;
          if (onEndCallback) onEndCallback();
        };
        audio.onerror = () => {
          setIsPlayingAudio(false);
          setIsNeuralAudioActive(false);
          currentAudioRef.current = null;
          fallbackBrowserSpeech(text, langCode, onEndCallback);
        };
        await audio.play();
        return;
      } catch (audioErr) {
        console.warn('Neural audio playback error, falling back to browser speech:', audioErr);
      }
    }

    // 2. Otherwise request high-definition neural human speech synthesis from server
    try {
      setIsPlayingAudio(true);
      const res = await fetch('/api/ai/synthesize-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceGender,
          languageCode: langCode
        })
      });
      const data = await res.json();
      if (data.success && data.audioDataUrl) {
        const audio = new Audio(data.audioDataUrl);
        currentAudioRef.current = audio;
        audio.playbackRate = speechRate;
        audio.onplay = () => {
          setIsPlayingAudio(true);
          setIsNeuralAudioActive(true);
        };
        audio.onended = () => {
          setIsPlayingAudio(false);
          setIsNeuralAudioActive(false);
          currentAudioRef.current = null;
          if (onEndCallback) onEndCallback();
        };
        audio.onerror = () => {
          setIsPlayingAudio(false);
          setIsNeuralAudioActive(false);
          currentAudioRef.current = null;
          fallbackBrowserSpeech(text, langCode, onEndCallback);
        };
        await audio.play();
        return;
      }
    } catch (synthErr) {
      console.warn('Neural speech synthesis fetch error, using enhanced browser speech:', synthErr);
    }

    // 3. Fallback to Enhanced Browser Web Speech with natural human pitch/tone
    fallbackBrowserSpeech(text, langCode, onEndCallback);
  };

  const fallbackBrowserSpeech = (text: string, langCode: string, onEndCallback?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPlayingAudio(false);
      if (onEndCallback) onEndCallback();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    // Human-like warmth and cheerful pitch
    utterance.pitch = voiceGender === 'female' ? 1.08 : 0.96;

    // Search for best matching natural/neural regional voice
    const voices = window.speechSynthesis.getVoices();
    const prefix = langCode.split('-')[0].toLowerCase();
    
    const matchingVoice = voices.find(v => 
      (v.lang.toLowerCase() === langCode.toLowerCase() || v.lang.toLowerCase().startsWith(prefix)) &&
      (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('neural') || v.name.toLowerCase().includes('online'))
    ) || voices.find(v => 
      v.lang.toLowerCase() === langCode.toLowerCase() || 
      v.lang.toLowerCase().startsWith(prefix) || 
      v.name.toLowerCase().includes(prefix)
    ) || voices.find(v => 
      (v.lang.toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india')) &&
      (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('neural') || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('microsoft'))
    ) || voices.find(v => v.lang === 'en-IN' || v.name.toLowerCase().includes('india'));

    if (matchingVoice) {
      utterance.voice = matchingVoice;
      utterance.lang = matchingVoice.lang;
    } else {
      utterance.lang = langCode;
    }

    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setIsNeuralAudioActive(false);
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
      currentUtteranceRef.current = null;
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      currentUtteranceRef.current = null;
      if (onEndCallback) onEndCallback();
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopAudio = () => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (err) {
        console.debug('Audio pause error', err);
      }
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setIsNeuralAudioActive(false);
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
  };

  // Start Sample Voice Playback
  const handlePlaySample = (sample: IndianVoiceSample) => {
    if (isPlayingAudio && selectedSample.id === sample.id) {
      stopAudio();
      return;
    }
    setSelectedSample(sample);
    setSelectedLanguageCode(sample.languageCode);
    speakTextInLanguage(sample.spokenText, sample.languageCode);
  };

  // Call duration counter
  useEffect(() => {
    if (callStatus === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callStatus]);

  useEffect(() => {
    return () => {
      stopAudio();
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    };
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  // Start simulated phone call with realistic calling ringback and popup overlay
  const startSimulatedCall = (initialLang: string = selectedLanguageCode) => {
    stopAudio();
    setCallStatus('calling');
    setCallingStepText('Connecting to Vernunt Customer Care...');
    setIsPlayingAudio(false);

    // Initial DTMF tone
    playTelephonyTone(440, 350);

    // Simulated telephone ringback pulses
    let ringCount = 0;
    ringIntervalRef.current = setInterval(() => {
      ringCount++;
      if (ringCount === 1) {
        setCallingStepText('Ringing Customer Care Helpline...');
        playTelephonyTone(480, 400);
      } else if (ringCount === 2) {
        setCallingStepText('Connecting to Executive Priya...');
        playTelephonyTone(480, 400);
      }
    }, 900);

    const langObj = INDIAN_LANGUAGES_LIST.find(l => l.code === initialLang) || INDIAN_LANGUAGES_LIST[0];

    setTimeout(() => {
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      setCallStatus('connected');
      playTelephonyTone(880, 200);

      const openingText = initialLang === 'en-IN'
        ? "Hello and welcome to Vernunt Support! I'm Priya, so glad to connect with you! Which language would you prefer to speak in today? You can choose Kannada, Hindi, Tamil, Telugu, Malayalam, Bengali, Marathi, or English."
        : langObj.greeting;

      setCallTranscript([
        {
          sender: 'agent',
          text: openingText,
          languageName: langObj.name,
          textEnglish: "Cheerful, happy telephone welcome offering help warmly in customer's preferred language.",
          time: "00:00"
        }
      ]);

      if (isSpeakerOn && !isMuted) {
        speakTextInLanguage(openingText, initialLang);
      }
    }, 2400);
  };

  const endSimulatedCall = () => {
    stopAudio();
    playTelephonyTone(350, 300);
    setCallStatus('ended');
    setTimeout(() => {
      setCallStatus('idle');
    }, 1200);
  };

  // Handle sending user query in call
  const handleSendCallQuery = async (queryText: string) => {
    if (!queryText.trim() || isProcessingAI) return;

    const userMessage = queryText.trim();
    setCustomUserInput('');

    const newTranscript = [
      ...callTranscript,
      {
        sender: 'user' as const,
        text: userMessage,
        time: formatTime(callDuration)
      }
    ];
    setCallTranscript(newTranscript);
    setIsProcessingAI(true);

    try {
      const langObj = INDIAN_LANGUAGES_LIST.find(l => l.code === selectedLanguageCode);
      const res = await fetch('/api/ai/voice-agent-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: userMessage,
          languageCode: selectedLanguageCode,
          languageName: langObj?.name || "English",
          voiceGender
        })
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const replyText = data.reply;
        const detectedLang = data.languageCode || selectedLanguageCode;

        setCallTranscript(prev => [
          ...prev,
          {
            sender: 'agent',
            text: replyText,
            languageName: langObj?.name || "Customer Care",
            textEnglish: "Enthusiastic and helpful spoken resolution by Executive Priya.",
            time: formatTime(callDuration + 1)
          }
        ]);

        if (isSpeakerOn && !isMuted) {
          speakTextInLanguage(replyText, detectedLang, undefined, data.audioDataUrl);
        }
      } else {
        throw new Error(data.error || 'Response error');
      }
    } catch (e) {
      console.warn('Multilingual AI Voice Agent API fallback:', e);
      const fallback = selectedLanguageCode.startsWith('kn')
        ? "ಖಂಡಿತ! ವೇರ್ನಂಟ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ನಲ್ಲಿ ಎಲ್ಲಾ ಪೋಷಕರು ಮತ್ತು ಡೇ-ಕೇರ್ ಸೆಂಟರ್‌ಗಳು ಆಧಾರ್ ಮೂಲಕ ಪರಿಶೀಲಿಸಲ್ಪಡುತ್ತವೆ. ಹೆಚ್ಚಿನ ಮಾಹಿತಿಗೆ support@vernunt.com ಗೆ ಬರೆಯಿರಿ."
        : selectedLanguageCode.startsWith('hi')
        ? "ज़रूर! वर्नंट पर सभी माता-पिता व डे-केयर आधार से सत्यापित हैं। किसी भी सहायता के लिए आप support@vernunt.com पर संपर्क कर सकते हैं।"
        : "Certainly! On Vernunt, all playmates and daycare centers are 100% verified via Aadhaar document review and admin approval for child safety. For further assistance, email support@vernunt.com.";

      setCallTranscript(prev => [
        ...prev,
        {
          sender: 'agent',
          text: fallback,
          languageName: "Support Desk",
          textEnglish: "Fallback resolution with official support email support@vernunt.com.",
          time: formatTime(callDuration + 1)
        }
      ]);
      if (isSpeakerOn && !isMuted) {
        speakTextInLanguage(fallback, selectedLanguageCode);
      }
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Web Speech recognition in the selected Indian language
  const handleToggleMic = () => {
    if (isListeningMic) {
      setIsListeningMic(false);
      return;
    }

    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is supported on Chrome & Edge browsers.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = selectedLanguageCode;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListeningMic(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSendCallQuery(transcript);
        }
        setIsListeningMic(false);
      };

      recognition.onerror = () => {
        setIsListeningMic(false);
      };

      recognition.onend = () => {
        setIsListeningMic(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition initiation error:', err);
      setIsListeningMic(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id="modal-multilingual-voice-agent" 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in text-slate-900"
    >
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-rose-100 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-red-900 via-rose-900 to-amber-900 text-white p-4 sm:p-5 relative overflow-hidden shrink-0 border-b border-rose-700/60">
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-md flex items-center justify-center text-xl shadow-inner shrink-0">
                🎙️
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black font-serif tracking-wide text-white">
                    Vernunt Customer Care Helpline • All Indian Languages
                  </h2>
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    Live Telephony Helpline
                  </span>
                </div>
                <p className="text-rose-100 text-xs mt-0.5 font-medium flex items-center gap-2 flex-wrap">
                  <span>Speak in English, Kannada, Hindi, Tamil, Telugu, Malayalam, Marathi, Bengali &amp; more</span>
                  <span className="opacity-60">•</span>
                  <span className="text-amber-300 font-mono">support@vernunt.com</span>
                </p>
              </div>
            </div>

            <button
              id="btn-close-voice-modal"
              onClick={() => {
                stopAudio();
                onClose();
              }}
              type="button"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer shrink-0"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub-Tabs */}
          <div className="flex items-center gap-2 mt-4 border-t border-rose-800/80 pt-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                stopAudio();
                setActiveSubTab('call_simulator');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'call_simulator'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Live Call Support</span>
              {callStatus === 'connected' && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                stopAudio();
                setActiveSubTab('samples');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'samples'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Sample Indian Voices</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopAudio();
                setActiveSubTab('languages');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'languages'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Language Switcher (11+ Languages)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 relative">

          {/* POPUP OVERLAY: CALLING CUSTOMER CARE */}
          {callStatus === 'calling' && (
            <div 
              id="calling-customer-care-overlay"
              className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in text-white"
            >
              <div className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 border border-rose-500/40 shadow-2xl text-center space-y-6 flex flex-col items-center">
                
                {/* Ringing Avatar Animation */}
                <div className="relative my-2">
                  <div className="absolute -inset-4 rounded-full bg-rose-500/20 animate-ping" />
                  <div className="absolute -inset-8 rounded-full bg-amber-500/10 animate-pulse" />
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-4xl shadow-2xl border-4 border-white/30 relative z-10 animate-bounce">
                    👩‍💼
                  </div>
                  <div className="absolute bottom-0 right-1 z-20 w-7 h-7 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-white text-xs">
                    <Phone className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 border border-amber-400/40 rounded-full text-amber-300 text-xs font-black uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Calling Customer Care...</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black font-serif text-white tracking-tight">
                    Connecting to Customer Care
                  </h3>
                  <p className="text-sm font-medium text-slate-300">
                    Executive: <span className="text-amber-300 font-bold">Priya</span> (Support Helpdesk)
                  </p>
                </div>

                {/* Animated status text */}
                <div className="w-full bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60 text-xs space-y-1">
                  <div className="text-rose-300 font-bold flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>{callingStepText}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Language: {INDIAN_LANGUAGES_LIST.find(l => l.code === selectedLanguageCode)?.name || 'English'} ({INDIAN_LANGUAGES_LIST.find(l => l.code === selectedLanguageCode)?.native})
                  </div>
                </div>

                {/* Support Email reminder & Cancel button */}
                <div className="w-full pt-2 flex flex-col items-center gap-3">
                  <button
                    id="btn-cancel-calling"
                    type="button"
                    onClick={endSimulatedCall}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm rounded-2xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer transform hover:scale-102"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>Cancel Call</span>
                  </button>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Official Support Email: <strong className="text-slate-200">support@vernunt.com</strong>
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TAB 1: LIVE CALL SIMULATOR */}
          {activeSubTab === 'call_simulator' && (
            <div className="space-y-4">
              
              {/* Call Status & Dialing Card */}
              <div className="bg-slate-950 rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden shadow-xl border border-slate-800">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  
                  {/* Caller Identity */}
                  <div className="flex items-center gap-3.5 text-center sm:text-left">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-amber-600 flex items-center justify-center text-2xl shadow-lg border-2 border-white/20">
                        👩‍💼
                      </div>
                      {callStatus === 'connected' && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 animate-pulse" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <h3 className="font-serif font-black text-base text-white">
                          Priya (Senior Support Executive)
                        </h3>
                        <span className="text-[10px] bg-white/10 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                          Bangalore HQ
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {callStatus === 'idle' && 'Vernunt Support Helpline • Ready to connect'}
                        {callStatus === 'calling' && 'Connecting to Priya... (Ringing)'}
                        {callStatus === 'connected' && `Call in progress • ${formatTime(callDuration)}`}
                        {callStatus === 'ended' && 'Call Disconnected'}
                      </p>
                    </div>
                  </div>

                  {/* Call Controls */}
                  <div className="flex items-center gap-2">
                    {callStatus === 'idle' || callStatus === 'ended' ? (
                      <button
                        id="btn-start-call"
                        type="button"
                        onClick={() => startSimulatedCall()}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg transition transform hover:scale-102 flex items-center gap-2 cursor-pointer"
                      >
                        <PhoneCall className="w-4 h-4 animate-bounce" />
                        <span>Call Customer Care</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsMuted(!isMuted)}
                          className={`p-3 rounded-2xl transition cursor-pointer ${
                            isMuted ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-white hover:bg-slate-700'
                          }`}
                          title={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                          className={`p-3 rounded-2xl transition cursor-pointer ${
                            !isSpeakerOn ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-white hover:bg-slate-700'
                          }`}
                          title="Speaker"
                        >
                          {isSpeakerOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>

                        <button
                          id="btn-end-call"
                          type="button"
                          onClick={endSimulatedCall}
                          className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl transition shadow-lg flex items-center gap-1.5 cursor-pointer"
                        >
                          <PhoneOff className="w-4 h-4" />
                          <span>End Call</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preferred Language Switcher Bar inside call */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-amber-400" />
                      <span>Language:</span>
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {INDIAN_LANGUAGES_LIST.slice(0, 7).map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setSelectedLanguageCode(lang.code);
                            if (callStatus === 'connected') {
                              handleSendCallQuery(`Please speak in ${lang.name}`);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            selectedLanguageCode === lang.code
                              ? 'bg-amber-400 text-slate-950 font-black'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <span>{lang.native}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Mail className="w-3.5 h-3.5 text-rose-400" />
                    <span>support@vernunt.com</span>
                  </div>
                </div>
              </div>

              {/* Call Transcript Box */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 min-h-[220px] max-h-[320px] overflow-y-auto">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                  Live Spoken Audio Conversation Transcript
                </div>

                {callTranscript.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      <span>{msg.sender === 'agent' ? 'Priya (Support Executive)' : 'You (Caller)'}</span>
                      <span>•</span>
                      <span>{msg.time}</span>
                      {msg.languageName && (
                        <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-sans font-bold">
                          {msg.languageName}
                        </span>
                      )}
                    </div>
                    <div 
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                        msg.sender === 'user' 
                          ? 'bg-slate-900 text-white rounded-br-xs' 
                          : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs'
                      }`}
                    >
                      <p className="font-medium whitespace-pre-wrap">{msg.text}</p>
                      {msg.textEnglish && msg.textEnglish !== msg.text && (
                        <p className="mt-1 pt-1 border-t border-slate-100 text-[11px] text-slate-500 italic">
                          "{msg.textEnglish}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {isProcessingAI && (
                  <div className="flex items-center gap-2 text-xs text-rose-700 font-bold p-2 bg-rose-50 rounded-xl animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                    <span>Priya is listening and speaking...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Spoken Query Input & Mic Trigger */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`p-3 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 ${
                    isListeningMic
                      ? 'bg-rose-600 text-white animate-pulse shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title={isListeningMic ? "Listening (Tap to stop)" : "Speak via Microphone"}
                >
                  <Mic className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={customUserInput}
                  onChange={(e) => setCustomUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSendCallQuery(customUserInput);
                    }
                  }}
                  placeholder="Speak or type: 'Can you speak in Kannada?', 'Aadhaar KYC', 'Daycare rates'..."
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-sans"
                />

                <button
                  type="button"
                  disabled={!customUserInput.trim() || isProcessingAI}
                  onClick={() => handleSendCallQuery(customUserInput)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer disabled:opacity-40 shrink-0 flex items-center gap-1"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Ask</span>
                </button>
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500">Quick inquiries:</span>
                <button
                  type="button"
                  onClick={() => handleSendCallQuery("ನನಗೆ ಕನ್ನಡದಲ್ಲಿ ಮಾಹಿತಿ ನೀಡಿ")}
                  className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-lg font-medium cursor-pointer"
                >
                  🟡 ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ
                </button>
                <button
                  type="button"
                  onClick={() => handleSendCallQuery("कृपया हिन्दी में बात करें")}
                  className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg font-medium cursor-pointer"
                >
                  🇮🇳 हिन्दी में बताएं
                </button>
                <button
                  type="button"
                  onClick={() => handleSendCallQuery("How do I complete Aadhaar verification for playmates?")}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg font-medium cursor-pointer"
                >
                  🛡️ Aadhaar Safety Help
                </button>
                <button
                  type="button"
                  onClick={() => handleSendCallQuery("What are the daycare and babysitting rates per hour?")}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg font-medium cursor-pointer"
                >
                  👶 Daycare Hourly Rates
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: AUDITION INDIAN SAMPLES */}
          {activeSubTab === 'samples' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-base">
                    🔊
                  </div>
                  <div>
                    <h4 className="font-serif font-black text-slate-900 text-xs sm:text-sm">
                      Audition Native Voice Samples Across India
                    </h4>
                    <p className="text-xs text-slate-600">
                      Tap play on any language card to hear natural spoken phone support audio.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 hidden sm:inline">Speed:</span>
                  <select
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold"
                  >
                    <option value={0.85}>0.85x (Slow)</option>
                    <option value={0.96}>1.0x (Natural)</option>
                    <option value={1.1}>1.1x (Brisk)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {DEFAULT_INDIAN_SAMPLES.map((sample) => (
                  <div 
                    key={sample.id}
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                      selectedSample.id === sample.id 
                        ? 'bg-rose-50/70 border-rose-400 shadow-sm ring-1 ring-rose-400' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded-lg">
                          {sample.languageName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {sample.callerScenario}
                        </span>
                      </div>

                      <h5 className="font-serif font-black text-slate-900 text-xs sm:text-sm">
                        {sample.title}
                      </h5>

                      <p className="text-xs text-slate-800 font-medium leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                        "{sample.spokenText}"
                      </p>

                      <p className="text-[11px] text-slate-500 italic">
                        English: {sample.englishMeaning}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handlePlaySample(sample)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isPlayingAudio && selectedSample.id === sample.id
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        {isPlayingAudio && selectedSample.id === sample.id ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Pause Audio</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Play Audio</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLanguageCode(sample.languageCode);
                          setActiveSubTab('call_simulator');
                          startSimulatedCall(sample.languageCode);
                        }}
                        className="text-xs text-rose-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Dial in {sample.languageName}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ALL INDIAN LANGUAGES LIST */}
          {activeSubTab === 'languages' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-serif font-black text-sm text-white">
                    Supported Indian Regional Languages
                  </h4>
                  <p className="text-xs text-slate-300">
                    Select any language to switch the voice agent immediately.
                  </p>
                </div>
                <span className="text-xs bg-amber-400 text-slate-950 font-black px-2 py-1 rounded-lg">
                  11 Original Indian Languages
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {INDIAN_LANGUAGES_LIST.map((lang) => (
                  <div
                    key={lang.code}
                    onClick={() => {
                      setSelectedLanguageCode(lang.code);
                      setActiveSubTab('call_simulator');
                      startSimulatedCall(lang.code);
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between group hover:shadow-md ${
                      selectedLanguageCode === lang.code
                        ? 'bg-rose-50 border-rose-500 shadow-sm ring-1 ring-rose-500'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{lang.flag}</span>
                        <div>
                          <h5 className="font-serif font-black text-sm text-slate-900 group-hover:text-rose-700 transition">
                            {lang.native}
                          </h5>
                          <p className="text-xs text-slate-500 font-medium">
                            {lang.name}
                          </p>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 italic line-clamp-2 mt-2">
                        "{lang.greeting}"
                      </p>
                    </div>

                    <span className="text-xs font-bold text-rose-700 opacity-0 group-hover:opacity-100 transition">
                      Dial ↗
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Support Helpdesk: <strong className="text-slate-900 font-mono">support@vernunt.com</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                stopAudio();
                onClose();
              }}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('call_simulator');
                startSimulatedCall();
              }}
              className="px-4 py-2 bg-gradient-to-r from-red-800 to-rose-900 hover:from-red-900 hover:to-rose-950 text-white font-black rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Customer Care</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
export default KannadaVoiceAgentModal;
